import { NextRequest, NextResponse } from 'next/server'
import { InventarioBodegaService } from '../../../services/inventario-bodega.service'
import { authMiddleware } from '../../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const service = new InventarioBodegaService()
    const inventario = await service.getAll()

    return NextResponse.json(inventario)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}