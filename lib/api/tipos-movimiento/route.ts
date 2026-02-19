import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../middleware/auth.middleware'
import { TipoMovimientoService } from '../../services/tipo-movimiento.service'
import { createTipoMovimientoDTO } from '../../dto/tipo-movimiento.dto'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const includeInactivos = searchParams.get('includeInactivos') !== 'false'

    const service = new TipoMovimientoService()
    const tipos = await service.getAll(includeInactivos)
    return NextResponse.json(tipos)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const validated = createTipoMovimientoDTO.parse(body)

    const service = new TipoMovimientoService()
    const tipo = await service.create(validated)

    return NextResponse.json(tipo, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
