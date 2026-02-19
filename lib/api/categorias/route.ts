import { NextRequest, NextResponse } from 'next/server'
import { CategoriaService } from '../../services/categoria.service'
import { createcategoriaDTO } from '../../dto/categoria.dto'
import { authMiddleware } from '../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const soloActivas = searchParams.get('activas') === 'true'

    const service = new CategoriaService()
    const categorias = soloActivas
      ? await service.getActivas()
      : await service.getAll()

    return NextResponse.json(categorias)
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
    const validated = createcategoriaDTO.parse(body)

    const service = new CategoriaService()
    const categoria = await service.create(validated)

    return NextResponse.json(categoria, { status: 201 })
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
