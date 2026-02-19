import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../../middleware/auth.middleware'
import { prisma } from '../../../db'

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

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const roles = normalizeRoles((auth as any).roles)
    const privileged = isPrivilegedRole(roles)
    const seller = isSellerRole(roles)
    if (!privileged && !seller) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    if (!privileged && seller) {
      const allowedRouteIds = await getSellerRouteIds(Number((auth as any).id))
      if (!allowedRouteIds.includes(id)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const ruta = await prisma.rutas.findUnique({
      where: { id_ruta: id },
      include: {
        ruta_vendedor: {
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
      },
    })

    if (!ruta) {
      return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 })
    }

    const response = {
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
    }

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const roles = normalizeRoles((auth as any).roles)
    if (!isPrivilegedRole(roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const updateData: any = {}
    if (body.codigo_ruta !== undefined) updateData.codigo_ruta = body.codigo_ruta
    if (body.nombre_ruta !== undefined) updateData.nombre_ruta = body.nombre_ruta
    if (body.zona !== undefined) updateData.zona = body.zona
    if (body.activo !== undefined) updateData.activo = body.activo

    const updated = await prisma.rutas.update({
      where: { id_ruta: id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const roles = normalizeRoles((auth as any).roles)
    if (!isPrivilegedRole(roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await prisma.rutas.update({
      where: { id_ruta: id },
      data: { activo: false },
    })

    return NextResponse.json({ message: 'Ruta desactivada correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
