import { NextRequest, NextResponse } from 'next/server'
import { InventarioBodegaService } from '../../../../services/inventario-bodega.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { id_producto, cantidad, destino, observacion } = body

    const service = new InventarioBodegaService()
    const result = await service.salida(
      id_producto,
      cantidad,
      destino,
      (auth as any).id,
      observacion
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}