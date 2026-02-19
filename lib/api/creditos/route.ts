import { NextRequest, NextResponse } from 'next/server'
import { CreditoService } from '../../services/credito.service'
import { createCreditoDTO } from '../../dto/credito.dto'
import { authMiddleware } from '../../middleware/auth.middleware'
import prisma from '../../db'

type AuthUser = {
  id: number
  roles?: string[]
}

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
    const authUser = auth as AuthUser
    const roles = normalizeRoles(authUser.roles)
    const privileged = isPrivilegedRole(roles)
    const seller = isSellerRole(roles)

    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado')

    const service = new CreditoService()
    let creditos

    if (estado === 'ACTIVO') {
      creditos = await service.getActivos()
    } else if (estado === 'VENCIDO') {
      creditos = await service.getVencidos()
    } else {
      creditos = await service.getAll()
    }

    if (!privileged && seller) {
      const allowedRouteIds = await getSellerRouteIds(Number(authUser.id))
      creditos = (creditos as any[]).filter((c) =>
        allowedRouteIds.includes(Number(c?.clientes?.id_ruta))
      )
    }

    return NextResponse.json(creditos)
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

    const body = await req.json()
    const normalized = {
      ...body,
      id_cliente: Number(body?.id_cliente),
      id_vendedor: Number(body?.id_vendedor),
      monto_total: Number(body?.monto_total),
      cuota: Number(body?.cuota),
      numero_cuotas: Number(body?.numero_cuotas),
      fecha_inicio: new Date(body?.fecha_inicio),
      fecha_vencimiento: new Date(body?.fecha_vencimiento),
      productos: Array.isArray(body?.productos)
        ? body.productos.map((p: any) => ({
            id_producto: Number(p?.id_producto),
            cantidad: Number(p?.cantidad),
            precio_unitario: Number(p?.precio_unitario)
          }))
        : [],
      id_usuario_crea: Number((auth as any).id)
    }

    const validated = createCreditoDTO.parse(normalized)

    const service = new CreditoService()
    const credito = await service.create(validated)

    return NextResponse.json(credito, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
