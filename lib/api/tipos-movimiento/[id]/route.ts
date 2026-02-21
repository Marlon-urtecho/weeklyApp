import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../../middleware/auth.middleware'
import { TipoMovimientoService } from '../../../services/tipo-movimiento.service'
import { updateTipoMovimientoDTO } from '../../../dto/tipo-movimiento.dto'

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

    const service = new TipoMovimientoService()
    const tipo = await service.getById(id)
    return NextResponse.json(tipo)
  } catch (error: any) {
    const status = error.message.includes('no encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message }, { status })
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
    const validated = updateTipoMovimientoDTO.parse(body)

    const service = new TipoMovimientoService()
    const tipo = await service.update(id, validated)
    return NextResponse.json(tipo)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.issues?.[0]?.message || 'Datos inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
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

    const service = new TipoMovimientoService()
    await service.delete(id)
    return NextResponse.json({ message: 'Tipo de movimiento eliminado correctamente' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
