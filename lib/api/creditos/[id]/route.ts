import { NextRequest, NextResponse } from 'next/server'
import { CreditoService } from '../../../services/credito.service'
import { updateCreditoDTO } from '../../../dto/credito.dto'
import { authMiddleware } from '../../../middleware/auth.middleware'

interface Params {
  params: { id: string }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id = parseInt(params.id)
    const service = new CreditoService()
    const credito = await service.getById(id)

    return NextResponse.json(credito)
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
    const validated = updateCreditoDTO.parse(body)

    const service = new CreditoService()
    const credito = await service.update(id, validated)

    return NextResponse.json(credito)
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