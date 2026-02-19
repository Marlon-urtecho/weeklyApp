import { NextRequest, NextResponse } from 'next/server'
import { InventarioVendedorService } from '../../../../services/inventario-vendedor.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

interface Params {
  params: Promise<{ id_vendedor: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { id_vendedor: idParam } = await params
    const id_vendedor = parseInt(idParam, 10)
    if (Number.isNaN(id_vendedor)) {
      return NextResponse.json({ error: 'ID de vendedor inválido' }, { status: 400 })
    }
    const service = new InventarioVendedorService()
    const inventario = await service.getByVendedor(id_vendedor)

    return NextResponse.json(inventario)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
