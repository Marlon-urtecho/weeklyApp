import { NextRequest, NextResponse } from 'next/server'
import { VendedorService } from '../../../../services/vendedor.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

interface Params {
  params: { id: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id = parseInt(params.id)
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