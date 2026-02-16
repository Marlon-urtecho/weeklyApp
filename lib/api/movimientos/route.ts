import { NextRequest, NextResponse } from 'next/server'
import { MovimientoInventarioService } from '../../services/movimiento-inventario.service'
import { authMiddleware } from '../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const limite = searchParams.get('limite')

    const service = new MovimientoInventarioService()
    const movimientos = limite
      ? await service.getUltimos(parseInt(limite))
      : await service.getAll()

    return NextResponse.json(movimientos)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}