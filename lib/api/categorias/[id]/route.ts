import { NextRequest, NextResponse } from 'next/server'
import { CategoriaService } from '../../../services/categoria.service'
import { updatecategoriaDTO } from '../../../dto/categoria.dto'
import { authMiddleware } from '../../../middleware/auth.middleware'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const service = new CategoriaService()
    const categoria = await service.getById(id)
    return NextResponse.json(categoria)
  } catch (error: any) {
    const status = error.message.includes('no encontrada') ? 404 : 500
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
    const validated = updatecategoriaDTO.parse(body)

    const service = new CategoriaService()
    const categoria = await service.update(id, validated)
    return NextResponse.json(categoria)
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

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const service = new CategoriaService()
    await service.delete(id)
    return NextResponse.json({ message: 'Categoría desactivada correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
