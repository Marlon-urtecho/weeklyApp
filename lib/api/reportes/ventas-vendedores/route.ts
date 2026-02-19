import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../../middleware/auth.middleware'
import prisma from '../../../db'

type AuthUser = {
  id: number
  roles?: string[]
}

const normalizeRoles = (roles?: string[]) => (roles || []).map((r) => (r || '').toUpperCase())
const isPrivilegedRole = (roles: string[]) =>
  roles.some((r) => r.includes('ADMIN') || r.includes('SUPERVISOR'))
const isSellerRole = (roles: string[]) => roles.some((r) => r.includes('VENDEDOR'))

const parseVendedorIdFromNode = (value?: string | null) => {
  if (!value) return null
  const match = String(value).match(/VENDEDOR_(\d+)/i)
  if (!match) return null
  const id = Number(match[1])
  return Number.isNaN(id) ? null : id
}

const parseCreditoIdFromReferencia = (ref?: string | null) => {
  if (!ref) return null
  const match = String(ref).match(/^CREDITO_(\d+)/i)
  if (!match) return null
  const id = Number(match[1])
  return Number.isNaN(id) ? null : id
}

const parseClienteIdFromDestino = (value?: string | null) => {
  if (!value) return null
  const match = String(value).match(/CLIENTE_(\d+)/i)
  if (!match) return null
  const id = Number(match[1])
  return Number.isNaN(id) ? null : id
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const authUser = auth as AuthUser

    const roles = normalizeRoles(authUser.roles)
    const privileged = isPrivilegedRole(roles)
    const seller = isSellerRole(roles)

    if (!privileged && !seller) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const inicioParam = searchParams.get('inicio')
    const finParam = searchParams.get('fin')
    const inicio = inicioParam ? new Date(`${inicioParam}T00:00:00`) : undefined
    const fin = finParam ? new Date(`${finParam}T23:59:59.999`) : undefined

    if ((inicioParam && Number.isNaN(inicio?.getTime())) || (finParam && Number.isNaN(fin?.getTime()))) {
      return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 400 })
    }

    const whereFechaMov =
      inicio || fin
        ? {
            fecha_movimiento: {
              ...(inicio ? { gte: inicio } : {}),
              ...(fin ? { lte: fin } : {})
            }
          }
        : {}

    const whereFechaPago =
      inicio || fin
        ? {
            fecha_pago: {
              ...(inicio ? { gte: inicio } : {}),
              ...(fin ? { lte: fin } : {})
            }
          }
        : {}

    let allowedVendorId: number | null = null
    if (!privileged && seller) {
      const vendedor = await prisma.vendedores.findUnique({
        where: { id_usuario: Number(authUser.id) },
        select: { id_vendedor: true }
      })
      if (!vendedor) {
        return NextResponse.json({
          rango: { inicio: inicioParam, fin: finParam },
          resumen: {
            vendedores: 0,
            transacciones: 0,
            unidades_vendidas: 0,
            monto_total_ventas: 0,
            monto_credito: 0,
            monto_contado: 0,
            cobranza_periodo: 0
          },
          vendedores: []
        })
      }
      allowedVendorId = vendedor.id_vendedor
    }

    const movimientos = await prisma.movimientos_inventario.findMany({
      where: {
        ...whereFechaMov,
        origen: { contains: 'VENDEDOR_' },
        tipo_movimiento: {
          nombre_tipo: {
            equals: 'SALIDA',
            mode: 'insensitive'
          }
        }
      },
      include: {
        productos: {
          include: {
            categorias: true
          }
        }
      },
      orderBy: {
        fecha_movimiento: 'desc'
      }
    })

    const creditoIds = Array.from(
      new Set(
        movimientos
          .map((m) => parseCreditoIdFromReferencia(m.referencia))
          .filter((id): id is number => !!id)
      )
    )

    const creditosDetalle = creditoIds.length
      ? await prisma.credito_detalle.findMany({
          where: { id_credito: { in: creditoIds } },
          select: {
            id_credito: true,
            id_producto: true,
            precio_unitario: true
          }
        })
      : []

    const creditosMeta = creditoIds.length
      ? await prisma.creditos.findMany({
          where: { id_credito: { in: creditoIds } },
          include: {
            clientes: {
              select: {
                id_cliente: true,
                nombre: true,
                codigo_cliente: true
              }
            }
          }
        })
      : []

    const creditoClienteMap = new Map<
      number,
      { id_cliente: number; nombre: string; codigo_cliente: string }
    >()
    for (const c of creditosMeta) {
      if (c.clientes) {
        creditoClienteMap.set(c.id_credito, {
          id_cliente: c.clientes.id_cliente,
          nombre: c.clientes.nombre,
          codigo_cliente: c.clientes.codigo_cliente
        })
      }
    }

    const clienteIdsContado = Array.from(
      new Set(
        movimientos
          .map((m) => parseClienteIdFromDestino(m.destino))
          .filter((id): id is number => !!id)
      )
    )

    const clientesContado = clienteIdsContado.length
      ? await prisma.clientes.findMany({
          where: { id_cliente: { in: clienteIdsContado } },
          select: {
            id_cliente: true,
            nombre: true,
            codigo_cliente: true
          }
        })
      : []

    const clienteContadoMap = new Map<number, { nombre: string; codigo_cliente: string }>()
    for (const c of clientesContado) {
      clienteContadoMap.set(c.id_cliente, {
        nombre: c.nombre,
        codigo_cliente: c.codigo_cliente
      })
    }

    const precioCreditoMap = new Map<string, number>()
    for (const item of creditosDetalle) {
      precioCreditoMap.set(
        `${item.id_credito}-${item.id_producto}`,
        Number(item.precio_unitario || 0)
      )
    }

    const pagos = await prisma.pagos.findMany({
      where: whereFechaPago,
      include: {
        creditos: {
          select: {
            id_vendedor: true
          }
        }
      }
    })

    const vendorIds = new Set<number>()
    for (const mov of movimientos) {
      const idVendedor = parseVendedorIdFromNode(mov.origen)
      if (!idVendedor) continue
      if (allowedVendorId && idVendedor !== allowedVendorId) continue
      vendorIds.add(idVendedor)
    }
    for (const pago of pagos) {
      const idVendedor = Number(pago.creditos?.id_vendedor || 0)
      if (!idVendedor) continue
      if (allowedVendorId && idVendedor !== allowedVendorId) continue
      vendorIds.add(idVendedor)
    }

    const vendedoresMeta = vendorIds.size
      ? await prisma.vendedores.findMany({
          where: {
            id_vendedor: {
              in: Array.from(vendorIds)
            }
          },
          include: {
            usuarios: true
          }
        })
      : []

    const metaMap = new Map<number, { nombre: string; username?: string }>()
    for (const item of vendedoresMeta) {
      metaMap.set(item.id_vendedor, {
        nombre: item.nombre,
        username: item.usuarios?.username
      })
    }

    const grouped = new Map<
      number,
      {
        id_vendedor: number
        nombre: string
        username?: string
        transacciones: Set<string>
        unidades_vendidas: number
        monto_total_ventas: number
        monto_credito: number
        monto_contado: number
        cobranza_periodo: number
        productos: Map<
          number,
          {
            id_producto: number
            nombre: string
            unidades: number
            monto: number
          }
        >
      }
    >()

    const getOrCreateRow = (idVendedor: number) => {
      const existing = grouped.get(idVendedor)
      if (existing) return existing
      const meta = metaMap.get(idVendedor)
      const row = {
        id_vendedor: idVendedor,
        nombre: meta?.nombre || `Vendedor ${idVendedor}`,
        username: meta?.username,
        transacciones: new Set<string>(),
        unidades_vendidas: 0,
        monto_total_ventas: 0,
        monto_credito: 0,
        monto_contado: 0,
        cobranza_periodo: 0,
        productos: new Map<number, { id_producto: number; nombre: string; unidades: number; monto: number }>()
      }
      grouped.set(idVendedor, row)
      return row
    }

    for (const mov of movimientos) {
      const idVendedor = parseVendedorIdFromNode(mov.origen)
      if (!idVendedor) continue
      if (allowedVendorId && idVendedor !== allowedVendorId) continue

      const row = getOrCreateRow(idVendedor)
      const cantidad = Number(mov.cantidad || 0)
      const referencia = mov.referencia || `MOV_${mov.id_movimiento}`
      const isCredito = /^CREDITO_/i.test(referencia)
      const idCredito = parseCreditoIdFromReferencia(referencia)

      let precioUnitario = Number(mov.productos?.precio_contado || 0)
      if (isCredito && idCredito) {
        precioUnitario = precioCreditoMap.get(`${idCredito}-${mov.id_producto}`) ?? Number(mov.productos?.precio_credito || 0)
      }

      const monto = cantidad * precioUnitario
      row.transacciones.add(referencia)
      row.unidades_vendidas += cantidad
      row.monto_total_ventas += monto
      if (isCredito) row.monto_credito += monto
      else row.monto_contado += monto

      const producto = row.productos.get(mov.id_producto) || {
        id_producto: mov.id_producto,
        nombre: mov.productos?.nombre || `Producto ${mov.id_producto}`,
        unidades: 0,
        monto: 0
      }
      producto.unidades += cantidad
      producto.monto += monto
      row.productos.set(mov.id_producto, producto)
    }

    for (const pago of pagos) {
      const idVendedor = Number(pago.creditos?.id_vendedor || 0)
      if (!idVendedor) continue
      if (allowedVendorId && idVendedor !== allowedVendorId) continue
      const row = getOrCreateRow(idVendedor)
      row.cobranza_periodo += Number(pago.monto_pagado || 0)
    }

    const detalleVentas = movimientos
      .map((mov) => {
        const idVendedor = parseVendedorIdFromNode(mov.origen)
        if (!idVendedor) return null
        if (allowedVendorId && idVendedor !== allowedVendorId) return null

        const referencia = mov.referencia || `MOV_${mov.id_movimiento}`
        const isCredito = /^CREDITO_/i.test(referencia)
        const idCredito = parseCreditoIdFromReferencia(referencia)
        const cantidad = Number(mov.cantidad || 0)

        let precioUnitario = Number(mov.productos?.precio_contado || 0)
        if (isCredito && idCredito) {
          precioUnitario = precioCreditoMap.get(`${idCredito}-${mov.id_producto}`) ?? Number(mov.productos?.precio_credito || 0)
        }

        const monto = cantidad * precioUnitario
        let clienteNombre = 'Cliente contado'
        let clienteCodigo = ''

        if (isCredito && idCredito) {
          const clienteCredito = creditoClienteMap.get(idCredito)
          if (clienteCredito) {
            clienteNombre = clienteCredito.nombre
            clienteCodigo = clienteCredito.codigo_cliente
          }
        } else {
          const idCliente = parseClienteIdFromDestino(mov.destino)
          if (idCliente) {
            const clienteContado = clienteContadoMap.get(idCliente)
            if (clienteContado) {
              clienteNombre = clienteContado.nombre
              clienteCodigo = clienteContado.codigo_cliente
            }
          }
        }

        return {
          fecha: mov.fecha_movimiento,
          referencia,
          tipo_venta: isCredito ? 'CREDITO' : 'CONTADO',
          id_vendedor: idVendedor,
          vendedor: metaMap.get(idVendedor)?.nombre || `Vendedor ${idVendedor}`,
          cliente: clienteNombre,
          codigo_cliente: clienteCodigo,
          producto: mov.productos?.nombre || `Producto ${mov.id_producto}`,
          categoria: mov.productos?.categorias?.nombre_categoria || 'Sin categoría',
          cantidad,
          precio_unitario: precioUnitario,
          monto
        }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    const vendedores = Array.from(grouped.values())
      .map((row) => {
        const topProductos = Array.from(row.productos.values())
          .sort((a, b) => b.unidades - a.unidades)
          .slice(0, 5)
          .map((p) => ({
            ...p,
            porcentaje_unidades: row.unidades_vendidas > 0 ? (p.unidades / row.unidades_vendidas) * 100 : 0
          }))

        return {
          id_vendedor: row.id_vendedor,
          nombre: row.nombre,
          username: row.username,
          transacciones: row.transacciones.size,
          unidades_vendidas: row.unidades_vendidas,
          monto_total_ventas: row.monto_total_ventas,
          monto_credito: row.monto_credito,
          monto_contado: row.monto_contado,
          cobranza_periodo: row.cobranza_periodo,
          tasa_cobranza_pct: row.monto_credito > 0 ? (row.cobranza_periodo / row.monto_credito) * 100 : 0,
          top_productos: topProductos
        }
      })
      .sort((a, b) => b.monto_total_ventas - a.monto_total_ventas)

    const resumen = {
      vendedores: vendedores.length,
      transacciones: vendedores.reduce((s, r) => s + r.transacciones, 0),
      unidades_vendidas: vendedores.reduce((s, r) => s + r.unidades_vendidas, 0),
      monto_total_ventas: vendedores.reduce((s, r) => s + r.monto_total_ventas, 0),
      monto_credito: vendedores.reduce((s, r) => s + r.monto_credito, 0),
      monto_contado: vendedores.reduce((s, r) => s + r.monto_contado, 0),
      cobranza_periodo: vendedores.reduce((s, r) => s + r.cobranza_periodo, 0)
    }

    return NextResponse.json({
      rango: {
        inicio: inicioParam,
        fin: finParam
      },
      resumen,
      vendedores,
      detalle_ventas: detalleVentas
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
