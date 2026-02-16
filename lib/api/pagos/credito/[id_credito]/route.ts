import { NextRequest, NextResponse } from 'next/server'
import { PagoService } from '../../../../services/pago.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

interface Params {
  params: { id_credito: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id_credito = parseInt(params.id_credito)
    const service = new PagoService()
    const historial = await service.getHistorialPagos(id_credito)

    return NextResponse.json(historial)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}