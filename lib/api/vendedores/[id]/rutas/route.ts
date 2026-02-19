import { NextRequest, NextResponse } from 'next/server'
import { VendedorService } from '../../../../services/vendedor.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

const normalizeRoles = (roles?: string[]) => (roles || []).map((r) => (r || '').toUpperCase())
const isPrivilegedRole = (roles: string[]) =>
  roles.some((r) => r.includes('ADMIN') || r.includes('SUPERVISOR'))

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
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
      return NextResponse.json({ error: 'ID de vendedor inválido' }, { status: 400 })
    }
    const service = new VendedorService()
    const rutas = await service.getRutasAsignadas(id)

    return NextResponse.json(rutas)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const roles = normalizeRoles((auth as any).roles)
    if (!isPrivilegedRole(roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id_vendedor = parseInt(idParam, 10)
    if (Number.isNaN(id_vendedor)) {
      return NextResponse.json({ error: 'ID de vendedor inválido' }, { status: 400 })
    }
    const { id_ruta } = await req.json()

    const service = new VendedorService()
    await service.asignarRuta(id_vendedor, id_ruta)

    return NextResponse.json({ message: 'Ruta asignada correctamente' })
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
    const id_vendedor = parseInt(idParam, 10)
    if (Number.isNaN(id_vendedor)) {
      return NextResponse.json({ error: 'ID de vendedor inválido' }, { status: 400 })
    }
    const { searchParams } = new URL(req.url)
    const id_ruta = parseInt(searchParams.get('id_ruta') || '0')

    const service = new VendedorService()
    await service.desasignarRuta(id_vendedor, id_ruta)

    return NextResponse.json({ message: 'Ruta desasignada correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
