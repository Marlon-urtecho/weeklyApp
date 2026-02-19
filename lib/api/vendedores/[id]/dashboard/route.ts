import { NextRequest, NextResponse } from 'next/server'
import { VendedorService } from '../../../../services/vendedor.service'
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
      return NextResponse.json({ error: 'ID de vendedor inválido' }, { status: 400 })
    }
    const service = new VendedorService()
    const dashboard = await service.getDashboard(id)

    return NextResponse.json(dashboard)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
