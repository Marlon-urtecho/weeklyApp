import { NextRequest, NextResponse } from 'next/server'
import { VendedorService } from '../../services/vendedor.service'
import { CreateVendedorDto } from '../../dto/vendedor.dto'
import { authMiddleware } from '../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const soloActivos = searchParams.get('activos') === 'true'

    const service = new VendedorService()
    const vendedores = soloActivos 
      ? await service.getActivos()
      : await service.getAll()

    return NextResponse.json(vendedores)
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
    const validated = CreateVendedorDto.parse(body)

    const service = new VendedorService()
    const vendedor = await service.create(validated)

    return NextResponse.json(vendedor, { status: 201 })
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