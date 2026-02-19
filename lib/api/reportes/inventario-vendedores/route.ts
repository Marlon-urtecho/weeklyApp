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

    const whereFecha =
      inicio || fin
        ? {
            fecha_movimiento: {
              ...(inicio ? { gte: inicio } : {}),
              ...(fin ? { lte: fin } : {})
            }
          }
        : {}

    const movimientos = await prisma.movimientos_inventario.findMany({
      where: {
        ...whereFecha,
        OR: [
          { destino: { contains: 'VENDEDOR_' } },
          { origen: { contains: 'VENDEDOR_' } }
        ]
      },
      include: {
        productos: true,
        usuarios: true,
        tipo_movimiento: true
      },
      orderBy: {
        fecha_movimiento: 'desc'
      }
    })

    const vendorIds = new Set<number>()
    for (const mov of movimientos) {
      const idDestino = parseVendedorIdFromNode(mov.destino)
      const idOrigen = parseVendedorIdFromNode(mov.origen)
      if (idDestino) vendorIds.add(idDestino)
      if (idOrigen) vendorIds.add(idOrigen)
    }

    let allowedVendorId: number | null = null
    if (!privileged && seller) {
      const v = await prisma.vendedores.findUnique({
        where: { id_usuario: Number(authUser.id) },
        select: { id_vendedor: true }
      })
      if (!v) {
        return NextResponse.json({ rango: { inicio: inicioParam, fin: finParam }, resumen: {}, vendedores: [] })
      }
      allowedVendorId = v.id_vendedor
    }

    const vendedores = await prisma.vendedores.findMany({
      where: {
        id_vendedor: {
          in: Array.from(vendorIds)
        }
      },
      include: {
        usuarios: true
      }
    })

    const vendorMap = new Map<number, { id_vendedor: number; nombre: string; username?: string }>()
    for (const v of vendedores) {
      vendorMap.set(v.id_vendedor, {
        id_vendedor: v.id_vendedor,
        nombre: v.nombre,
        username: v.usuarios?.username
      })
    }

    const grouped = new Map<
      number,
      {
        id_vendedor: number
        nombre: string
        username?: string
        total_asignado: number
        total_retirado: number
        neto: number
        movimientos: Array<{
          fecha: string
          id_movimiento: number
          id_producto: number
          producto: string
          tipo: string
          cantidad: number
          origen: string
          destino: string
          registrado_por: string
          direccion: 'ASIGNACION_A_VENDEDOR' | 'RETIRO_DESDE_VENDEDOR'
        }>
      }
    >()

    for (const mov of movimientos) {
      const idDestino = parseVendedorIdFromNode(mov.destino)
      const idOrigen = parseVendedorIdFromNode(mov.origen)

      const candidates: Array<{ id: number; direccion: 'ASIGNACION_A_VENDEDOR' | 'RETIRO_DESDE_VENDEDOR' }> = []
      if (idDestino) candidates.push({ id: idDestino, direccion: 'ASIGNACION_A_VENDEDOR' })
      if (idOrigen) candidates.push({ id: idOrigen, direccion: 'RETIRO_DESDE_VENDEDOR' })

      for (const c of candidates) {
        if (allowedVendorId && c.id !== allowedVendorId) continue
        const vendorMeta = vendorMap.get(c.id) || {
          id_vendedor: c.id,
          nombre: `Vendedor ${c.id}`,
          username: undefined
        }
        const current = grouped.get(c.id) || {
          ...vendorMeta,
          total_asignado: 0,
          total_retirado: 0,
          neto: 0,
          movimientos: []
        }

        const cantidad = Number(mov.cantidad || 0)
        if (c.direccion === 'ASIGNACION_A_VENDEDOR') current.total_asignado += cantidad
        if (c.direccion === 'RETIRO_DESDE_VENDEDOR') current.total_retirado += cantidad
        current.neto = current.total_asignado - current.total_retirado
        current.movimientos.push({
          fecha: mov.fecha_movimiento.toISOString(),
          id_movimiento: mov.id_movimiento,
          id_producto: mov.id_producto,
          producto: mov.productos?.nombre || `Producto ${mov.id_producto}`,
          tipo: mov.tipo_movimiento?.nombre_tipo || 'MOVIMIENTO',
          cantidad,
          origen: mov.origen,
          destino: mov.destino,
          registrado_por: mov.usuarios?.nombre || mov.usuarios?.username || 'Sistema',
          direccion: c.direccion
        })

        grouped.set(c.id, current)
      }
    }

    const rows = Array.from(grouped.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    const resumen = {
      vendedores: rows.length,
      total_movimientos: rows.reduce((sum, r) => sum + r.movimientos.length, 0),
      total_asignado: rows.reduce((sum, r) => sum + r.total_asignado, 0),
      total_retirado: rows.reduce((sum, r) => sum + r.total_retirado, 0),
      neto: rows.reduce((sum, r) => sum + r.neto, 0)
    }

    return NextResponse.json({
      rango: {
        inicio: inicioParam,
        fin: finParam
      },
      resumen,
      vendedores: rows
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

