import { NextRequest, NextResponse } from 'next/server'
import { PagoService } from '../../../../services/pago.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'
import prisma from '../../../../db'

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

interface Params {
  params: Promise<{ id_credito: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const authUser = auth as AuthUser
    const roles = normalizeRoles(authUser.roles)
    const privileged = isPrivilegedRole(roles)
    const seller = isSellerRole(roles)

    if (!privileged && !seller) {
      return NextResponse.json(
        { error: 'No autorizado para consultar pagos de crédito' },
        { status: 403 }
      )
    }

    const { id_credito: idParam } = await params
    const id_credito = parseInt(idParam, 10)
    if (Number.isNaN(id_credito)) {
      return NextResponse.json({ error: 'ID de crédito inválido' }, { status: 400 })
    }

    if (!privileged && seller) {
      const allowedRouteIds = await getSellerRouteIds(Number(authUser.id))
      const credito = await prisma.creditos.findUnique({
        where: { id_credito },
        include: { clientes: true }
      })

      if (!credito) {
        return NextResponse.json({ error: 'Crédito no encontrado' }, { status: 404 })
      }

      if (!allowedRouteIds.includes(Number(credito.clientes?.id_ruta))) {
        return NextResponse.json(
          { error: 'No autorizado para ver pagos de clientes fuera de tu ruta' },
          { status: 403 }
        )
      }
    }

    const service = new PagoService()
    const historial = await service.getHistorialPagos(id_credito)

    return NextResponse.json(historial)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
