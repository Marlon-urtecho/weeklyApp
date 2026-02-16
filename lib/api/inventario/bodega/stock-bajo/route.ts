import { NextRequest, NextResponse } from 'next/server'
import { InventarioBodegaService } from '../../../../services/inventario-bodega.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const limite = parseInt(searchParams.get('limite') || '5')

    const service = new InventarioBodegaService()
    const stockBajo = await service.getStockBajo(limite)

    return NextResponse.json(stockBajo)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}