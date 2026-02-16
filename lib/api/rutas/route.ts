import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../db'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const activas = searchParams.get('activas') === 'true'
    const includeAll = searchParams.get('include') === 'all'

    const rutas = await prisma.rutas.findMany({
      where: activas ? { activo: true } : undefined,
      include: includeAll || activas ? {
        ruta_vendedor: {
          where: activas ? { activo: true } : undefined,
          include: {
            vendedores: true,
          },
        },
        clientes: true,
      } : undefined,
      orderBy: {
        id_ruta: 'asc',
      },
    })

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
      clientes: ruta.clientes || [],
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
