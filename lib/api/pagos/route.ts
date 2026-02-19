import { NextRequest, NextResponse } from 'next/server'
import { PagoService } from '../../services/pago.service'
import { createPagoDTO } from '../../dto/pagos.dto'
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
const getZodErrorMessage = (error: any) =>
  error?.issues?.[0]?.message || error?.errors?.[0]?.message || 'Datos inválidos'

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

    if (!privileged && !seller) {
      return NextResponse.json(
        { error: 'No autorizado para consultar pagos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const service = new PagoService()
    let pagos

    if (fechaInicio && fechaFin) {
      pagos = await service.getByFecha(
        new Date(fechaInicio),
        new Date(fechaFin)
      )
    } else {
      pagos = await service.getAll()
    }

    if (!privileged && seller) {
      const allowedRouteIds = await getSellerRouteIds(Number(authUser.id))
      pagos = (pagos as any[]).filter((p) =>
        allowedRouteIds.includes(Number(p?.creditos?.clientes?.id_ruta))
      )
    }

    return NextResponse.json(pagos)
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
    const authUser = auth as AuthUser
    const roles = normalizeRoles(authUser.roles)
    const privileged = isPrivilegedRole(roles)
    const seller = isSellerRole(roles)

    if (!privileged && !seller) {
      return NextResponse.json(
        { error: 'No autorizado para registrar pagos' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const normalized = {
      id_credito: Number(body?.id_credito),
      monto_pagado: Number(body?.monto_pagado),
      fecha_pago: body?.fecha_pago ? new Date(body.fecha_pago) : undefined,
      metodo_pago: (body?.metodo_pago || 'EFECTIVO').toString(),
      registrado_por: Number(authUser?.id),
      detalle_productos: Array.isArray(body?.detalle_productos)
        ? body.detalle_productos.map((d: any) => ({
            id_producto: Number(d?.id_producto),
            monto_pagado: Number(d?.monto_pagado)
          }))
        : undefined
    }

    if (Number.isNaN(normalized.registrado_por) || normalized.registrado_por <= 0) {
      return NextResponse.json(
        { error: 'Token inválido: usuario no identificado' },
        { status: 401 }
      )
    }

    if (!privileged && seller) {
      const allowedRouteIds = await getSellerRouteIds(Number(authUser.id))
      const credito = await prisma.creditos.findUnique({
        where: { id_credito: normalized.id_credito },
        include: { clientes: true }
      })

      if (!credito) {
        return NextResponse.json(
          { error: 'Crédito no encontrado' },
          { status: 404 }
        )
      }

      if (!allowedRouteIds.includes(Number(credito.clientes?.id_ruta))) {
        return NextResponse.json(
          { error: 'No autorizado para registrar pagos de clientes fuera de tu ruta' },
          { status: 403 }
        )
      }
    }

    const validated = createPagoDTO.parse(normalized)

    const service = new PagoService()
    const pago = await service.registrar(validated)

    return NextResponse.json(pago, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: getZodErrorMessage(error) },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
