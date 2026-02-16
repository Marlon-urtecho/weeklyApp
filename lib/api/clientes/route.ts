import { NextRequest, NextResponse } from 'next/server'
import { ClienteService } from '../../services/cliente.service'
import { createClienteDTO } from '../../dto/clientes.dto'
import { authMiddleware } from '../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const soloActivos = searchParams.get('activos') === 'true'

    const service = new ClienteService()
    const clientes = soloActivos 
      ? await service.getActivos()
      : await service.getAll()

    return NextResponse.json(clientes)
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
    const validated = createClienteDTO.parse(body)

    const service = new ClienteService()
    const cliente = await service.create(validated)

    return NextResponse.json(cliente, { status: 201 })
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