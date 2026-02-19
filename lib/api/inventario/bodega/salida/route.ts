import { NextRequest, NextResponse } from 'next/server'
import { InventarioBodegaService } from '../../../../services/inventario-bodega.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const id_producto = Number(body?.id_producto)
    const cantidad = Number(body?.cantidad)
    const destino = typeof body?.destino === 'string' && body.destino.trim() ? body.destino : 'AJUSTE'
    const observacion = typeof body?.observacion === 'string' ? body.observacion : undefined
    const userId = Number((auth as any)?.id)

    if (Number.isNaN(id_producto) || id_producto <= 0) {
      return NextResponse.json({ error: 'id_producto inválido' }, { status: 400 })
    }
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      return NextResponse.json({ error: 'cantidad inválida' }, { status: 400 })
    }
    if (Number.isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Token inválido: usuario no identificado' }, { status: 401 })
    }

    const service = new InventarioBodegaService()
    const result = await service.salida(
      id_producto,
      cantidad,
      destino,
      userId,
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
