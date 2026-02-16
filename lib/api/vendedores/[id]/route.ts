import { NextRequest, NextResponse } from 'next/server'
import { VendedorService } from '../../../services/vendedor.service'
import { UpdateVendedoresDTO } from '../../../dto/vendedor.dto'
import { authMiddleware } from '../../../middleware/auth.middleware'

interface Params {
  params: { id: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id = parseInt(params.id)
    const service = new VendedorService()
    const vendedor = await service.getById(id)

    return NextResponse.json(vendedor)
  } catch (error: any) {
    const status = error.message.includes('no encontrado') ? 404 : 500
    return NextResponse.json(
      { error: error.message },
      { status }
    )
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id = parseInt(params.id)
    const body = await req.json()
    const validated = UpdateVendedoresDTO.parse(body)

    const service = new VendedorService()
    const vendedor = await service.update(id, validated)

    return NextResponse.json(vendedor)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
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

    const id = parseInt(params.id)
    const service = new VendedorService()
    await service.delete(id)

    return NextResponse.json({ message: 'Vendedor desactivado correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}