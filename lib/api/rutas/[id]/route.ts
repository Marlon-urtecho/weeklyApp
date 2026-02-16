import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../../middleware/auth.middleware'
import { prisma } from '../../../db'

interface Params {
  params: { id: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id = parseInt(params.id, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const ruta = await prisma.rutas.findUnique({
      where: { id_ruta: id },
      include: {
        ruta_vendedor: {
          include: {
            vendedores: true,
          },
        },
        clientes: true,
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
      clientes: ruta.clientes || [],
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

    const id = parseInt(params.id, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()

    const updated = await prisma.rutas.update({
      where: { id_ruta: id },
      data: {
        codigo_ruta: body.codigo_ruta,
        nombre_ruta: body.nombre_ruta,
        zona: body.zona,
        activo: body.activo,
      },
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

    const id = parseInt(params.id, 10)
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
