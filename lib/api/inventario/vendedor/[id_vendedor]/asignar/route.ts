import { NextRequest, NextResponse } from 'next/server'
import { InventarioVendedorService } from '../../../../../services/inventario-vendedor.service'
import { authMiddleware } from '../../../../..//middleware/auth.middleware'

interface Params {
  params: { id_vendedor: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id_vendedor = parseInt(params.id_vendedor)
    const { id_producto, cantidad } = await req.json()

    const service = new InventarioVendedorService()
    const result = await service.asignarProducto({
      id_vendedor,
      id_producto,
      cantidad
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}