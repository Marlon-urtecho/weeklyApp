import { NextRequest, NextResponse } from 'next/server'
import { ProductoService } from '../../../../services/producto.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const service = new ProductoService()
    const productos = await service.getInventarioCompleto()

    return NextResponse.json(productos)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
