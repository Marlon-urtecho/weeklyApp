import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../../../../middleware/auth.middleware'
import prisma from '../../../../../db'

interface Params {
  params: Promise<{ id_vendedor: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { id_vendedor: idParam } = await params
    const id_vendedor = parseInt(idParam, 10)
    if (Number.isNaN(id_vendedor) || id_vendedor <= 0) {
      return NextResponse.json({ error: 'ID de vendedor inválido' }, { status: 400 })
    }

    const body = await req.json()
    const id_cliente = body?.id_cliente ? Number(body.id_cliente) : null
    const productos = Array.isArray(body?.productos) ? body.productos : []
    const id_usuario = Number((auth as any)?.id)

    if (!productos.length) {
      return NextResponse.json({ error: 'Debe enviar productos para la venta contado' }, { status: 400 })
    }
    if (Number.isNaN(id_usuario) || id_usuario <= 0) {
      return NextResponse.json({ error: 'Token inválido: usuario no identificado' }, { status: 401 })
    }

    const items = productos.map((p: any) => ({
      id_producto: Number(p?.id_producto),
      cantidad: Number(p?.cantidad)
    }))

    if (items.some((i) => Number.isNaN(i.id_producto) || i.id_producto <= 0 || Number.isNaN(i.cantidad) || i.cantidad <= 0)) {
      return NextResponse.json({ error: 'Productos inválidos' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const vendedor = await tx.vendedores.findUnique({
        where: { id_vendedor }
      })
      if (!vendedor) throw new Error('Vendedor no encontrado')

      const tipoSalida = await tx.tipo_movimiento.findFirst({
        where: {
          nombre_tipo: {
            equals: 'SALIDA',
            mode: 'insensitive'
          }
        }
      })
      if (!tipoSalida) throw new Error('Tipo de movimiento SALIDA no configurado')

      const ref = `CONTADO_${Date.now()}_${id_vendedor}`
      const movimientos: any[] = []

      for (const item of items) {
        const inv = await tx.inventario_vendedor.findUnique({
          where: {
            id_vendedor_id_producto: {
              id_vendedor,
              id_producto: item.id_producto
            }
          }
        })
        const stockActual = Number(inv?.cantidad || 0)
        const cantidadVenta = Number(item.cantidad)
        const puedeDescontarInventario = !!inv && stockActual >= cantidadVenta

        if (puedeDescontarInventario) {
          if (stockActual === cantidadVenta) {
            await tx.inventario_vendedor.delete({
              where: {
                id_vendedor_id_producto: {
                  id_vendedor,
                  id_producto: item.id_producto
                }
              }
            })
          } else {
            await tx.inventario_vendedor.update({
              where: {
                id_vendedor_id_producto: {
                  id_vendedor,
                  id_producto: item.id_producto
                }
              },
              data: {
                cantidad: { decrement: cantidadVenta }
              }
            })
          }
        }

        const mov = await tx.movimientos_inventario.create({
          data: {
            id_producto: item.id_producto,
            id_tipo_movimiento: tipoSalida.id_tipo_movimiento,
            cantidad: cantidadVenta,
            origen: `VENDEDOR_${id_vendedor}`,
            destino: id_cliente ? `CLIENTE_${id_cliente}` : 'VENTA_CONTADO',
            referencia: ref,
            observacion: puedeDescontarInventario
              ? 'Salida por venta al contado'
              : 'Salida por venta al contado (sin inventario disponible del vendedor)',
            id_usuario_registra: id_usuario
          }
        })
        movimientos.push(mov)
      }

      return {
        referencia: ref,
        id_vendedor,
        id_cliente,
        productos: items,
        movimientos
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
