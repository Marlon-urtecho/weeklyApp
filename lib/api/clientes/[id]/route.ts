import { NextRequest, NextResponse } from 'next/server'
import { ClienteService } from '../../../services/cliente.service'
import { updateClienteDTO } from '../../../dto/clientes.dto'
import { authMiddleware } from '../../../middleware/auth.middleware'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const service = new ClienteService()
    const cliente = await service.getWithCreditos(id)
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error: any) {
    const status = error.message?.includes('no encontrado') ? 404 : 500
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
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const validated = updateClienteDTO.parse(body)

    const service = new ClienteService()
    const cliente = await service.update(id, validated)
    return NextResponse.json(cliente)
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
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const service = new ClienteService()
    await service.delete(id)
    return NextResponse.json({ message: 'Cliente desactivado correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
