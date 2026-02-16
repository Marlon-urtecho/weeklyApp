import { NextRequest, NextResponse } from 'next/server'
import { VendedorService } from '../../../../services/vendedor.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

interface Params {
  params: { id: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id = parseInt(params.id)
    const service = new VendedorService()
    const rutas = await service.getRutasAsignadas(id)

    return NextResponse.json(rutas)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id_vendedor = parseInt(params.id)
    const { id_ruta } = await req.json()

    const service = new VendedorService()
    await service.asignarRuta(id_vendedor, id_ruta)

    return NextResponse.json({ message: 'Ruta asignada correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id_vendedor = parseInt(params.id)
    const { searchParams } = new URL(req.url)
    const id_ruta = parseInt(searchParams.get('id_ruta') || '0')

    const service = new VendedorService()
    await service.desasignarRuta(id_vendedor, id_ruta)

    return NextResponse.json({ message: 'Ruta desasignada correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}