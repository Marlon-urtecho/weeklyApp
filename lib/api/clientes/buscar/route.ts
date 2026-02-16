import { NextRequest, NextResponse } from 'next/server'
import { ClienteService } from '../../../services/cliente.service'
import { authMiddleware } from '../../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const termino = searchParams.get('q') || ''

    const service = new ClienteService()
    const clientes = await service.buscar(termino)

    return NextResponse.json(clientes)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}