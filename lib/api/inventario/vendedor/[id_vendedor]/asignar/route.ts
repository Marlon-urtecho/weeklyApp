import { NextRequest, NextResponse } from 'next/server'
import { InventarioVendedorService } from '../../../../../services/inventario-vendedor.service'
import { InventarioBodegaService } from '../../../../../services/inventario-bodega.service'
import { authMiddleware } from '../../../../..//middleware/auth.middleware'

interface Params {
  params: Promise<{ id_vendedor: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { id_vendedor: idParam } = await params
    const id_vendedor = parseInt(idParam, 10)
    if (Number.isNaN(id_vendedor)) {
      return NextResponse.json({ error: 'ID de vendedor inválido' }, { status: 400 })
    }
    const { id_producto, cantidad } = await req.json()
    const idProductoNum = Number(id_producto)
    const cantidadNum = Number(cantidad)
    const userId = Number((auth as any)?.id)

    if (Number.isNaN(idProductoNum) || idProductoNum <= 0) {
      return NextResponse.json({ error: 'id_producto inválido' }, { status: 400 })
    }
    if (Number.isNaN(cantidadNum) || cantidadNum <= 0) {
      return NextResponse.json({ error: 'cantidad inválida' }, { status: 400 })
    }
    if (Number.isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Token inválido: usuario no identificado' }, { status: 401 })
    }

    const bodegaService = new InventarioBodegaService()
    const service = new InventarioVendedorService()
    // 1) Retira de bodega.
    await bodegaService.salida(
      idProductoNum,
      cantidadNum,
      `VENDEDOR_${id_vendedor}`,
      userId,
      `Asignación a vendedor ${id_vendedor}`
    )

    try {
      // 2) Asigna al inventario del vendedor.
      const result = await service.asignarProducto({
        id_vendedor,
        id_producto: idProductoNum,
        cantidad: cantidadNum
      })

      return NextResponse.json(result)
    } catch (assignError: any) {
      // Compensación simple: devuelve stock a bodega si falla la asignación.
      await bodegaService.entrada(
        idProductoNum,
        cantidadNum,
        userId,
        `Rollback asignación fallida vendedor ${id_vendedor}`
      )
      throw assignError
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
