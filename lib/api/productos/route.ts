import { NextRequest, NextResponse } from 'next/server'
import { ProductoService } from '../../services/producto.service'
import { createProductoDTO } from '../../dto/producto.dto'
import { authMiddleware } from '../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const id_categoria = searchParams.get('categoria')

    const service = new ProductoService()
    const productos = id_categoria
      ? await service.getByCategoria(parseInt(id_categoria))
      : await service.getAll()

    return NextResponse.json(productos)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const validated = createProductoDTO.parse(body)

    const service = new ProductoService()
    const producto = await service.create(validated)

    return NextResponse.json(producto, { status: 201 })
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