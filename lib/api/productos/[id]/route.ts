import { NextRequest, NextResponse } from 'next/server'
import { ProductoService } from '../../../services/producto.service'
import { updateProductoDTO } from '../../../dto/producto.dto'
import { authMiddleware } from '../../../middleware/auth.middleware'

interface Params {
  params: { id: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id = parseInt(params.id)
    const service = new ProductoService()
    const producto = await service.getById(id)

    return NextResponse.json(producto)
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
    const validated = updateProductoDTO.parse(body)

    const service = new ProductoService()
    const producto = await service.update(id, validated)

    return NextResponse.json(producto)
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
    const service = new ProductoService()
    await service.delete(id)

    return NextResponse.json({ message: 'Producto eliminado correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}