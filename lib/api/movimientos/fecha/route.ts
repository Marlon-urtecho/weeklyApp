import { NextRequest, NextResponse } from 'next/server'
import { MovimientoInventarioService } from '../../../services/movimiento-inventario.service'
import { authMiddleware } from '../../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const fechaInicio = new Date(searchParams.get('inicio') || '')
    const fechaFin = new Date(searchParams.get('fin') || '')

    const service = new MovimientoInventarioService()
    const resumen = await service.getResumenPorFecha(fechaInicio, fechaFin)

    return NextResponse.json(resumen)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}