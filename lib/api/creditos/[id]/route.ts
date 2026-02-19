import { NextRequest, NextResponse } from 'next/server'
import { CreditoService } from '../../../services/credito.service'
import { updateCreditoDTO } from '../../../dto/credito.dto'
import { authMiddleware } from '../../../middleware/auth.middleware'
import prisma from '../../../db'

interface Params {
  params: Promise<{ id: string }>
}

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

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    const authUser = auth as AuthUser
    const roles = normalizeRoles(authUser.roles)
    const privileged = isPrivilegedRole(roles)
    const seller = isSellerRole(roles)

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    if (!privileged && seller) {
      const allowedRouteIds = await getSellerRouteIds(Number(authUser.id))
      const creditoScope = await prisma.creditos.findUnique({
        where: { id_credito: id },
        include: { clientes: true }
      })

      if (!creditoScope) {
        return NextResponse.json({ error: 'Crédito no encontrado' }, { status: 404 })
      }

      if (!allowedRouteIds.includes(Number(creditoScope.clientes?.id_ruta))) {
        return NextResponse.json(
          { error: 'No autorizado para ver créditos de clientes fuera de tu ruta' },
          { status: 403 }
        )
      }
    }

    const service = new CreditoService()
    const credito = await service.getById(id)

    return NextResponse.json(credito)
  } catch (error: any) {
    const status = error.message.includes('no encontrado') ? 404 : 500
    return NextResponse.json(
      { error: error.message },
      { status }
    )
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const body = await req.json()
    const validated = updateCreditoDTO.parse(body)

    const service = new CreditoService()
    const credito = await service.update(id, validated)

    return NextResponse.json(credito)
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
