import { NextRequest, NextResponse } from 'next/server'
import { ClienteService } from '../../../../services/cliente.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

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

    return NextResponse.json(cliente?.creditos || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
