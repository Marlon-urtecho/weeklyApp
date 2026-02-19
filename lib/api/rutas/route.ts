import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../db'

const normalizeRoles = (roles?: string[]) => (roles || []).map((r) => (r || '').toUpperCase())
const isPrivilegedRole = (roles: string[]) =>
  roles.some((r) => r.includes('ADMIN') || r.includes('SUPERVISOR'))
const isSellerRole = (roles: string[]) => roles.some((r) => r.includes('VENDEDOR'))

async function getSellerRouteIds(idUsuario: number): Promise<number[]> {
  const vendedor = await prisma.vendedores.findUnique({
    where: { id_usuario: idUsuario },
    include: {
      ruta_vendedor: {
        where: { activo: true },
        select: { id_ruta: true }
      }
    }
  })

  if (!vendedor) return []
  return vendedor.ruta_vendedor.map((rv) => rv.id_ruta)
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const roles = normalizeRoles((auth as any).roles)
    const privileged = isPrivilegedRole(roles)
    const seller = isSellerRole(roles)
    if (!privileged && !seller) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const activas = searchParams.get('activas') === 'true'
    const includeAll = searchParams.get('include') === 'all'

    let rutas = await prisma.rutas.findMany({
      where: activas ? { activo: true } : undefined,
      include: includeAll || activas ? {
        ruta_vendedor: {
          where: { activo: true },
          include: {
            vendedores: true,
          },
        },
        clientes: {
          include: {
            creditos: {
              select: {
                id_credito: true,
                estado: true
              }
            }
          }
        },
      } : undefined,
      orderBy: {
        id_ruta: 'asc',
      },
    })

    if (!privileged && seller) {
      const allowedRouteIds = await getSellerRouteIds(Number((auth as any).id))
      rutas = rutas.filter((ruta) => allowedRouteIds.includes(ruta.id_ruta))
    }

    if (!includeAll && !activas) {
      return NextResponse.json(rutas)
    }

    const response = rutas.map((ruta: any) => ({
      id_ruta: ruta.id_ruta,
      codigo_ruta: ruta.codigo_ruta,
      nombre_ruta: ruta.nombre_ruta,
      zona: ruta.zona,
      activo: ruta.activo,
      vendedores: (ruta.ruta_vendedor || []).map((rv: any) => ({
        id_vendedor: rv.id_vendedor,
        nombre: rv.vendedores?.nombre,
        fecha_asignacion: rv.fecha_asignacion,
        activo: rv.activo,
      })),
      clientes: (ruta.clientes || []).map((c: any) => ({
        id_cliente: c.id_cliente,
        codigo_cliente: c.codigo_cliente,
        nombre: c.nombre,
        telefono: c.telefono,
        activo: c.activo,
        creditos: c.creditos || []
      })),
    }))

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const roles = normalizeRoles((auth as any).roles)
    if (!isPrivilegedRole(roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const codigo_ruta = body?.codigo_ruta?.trim()
    const nombre_ruta = body?.nombre_ruta?.trim()
    const zona = body?.zona?.trim() || null
    const activo = body?.activo ?? true

    if (!codigo_ruta || !nombre_ruta) {
      return NextResponse.json(
        { error: 'codigo_ruta y nombre_ruta son requeridos' },
        { status: 400 }
      )
    }

    const created = await prisma.rutas.create({
      data: {
        codigo_ruta,
        nombre_ruta,
        zona,
        activo,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
