import { NextRequest, NextResponse } from 'next/server'
import { CreditoService } from '../../services/credito.service'
import { createCreditoDTO } from '../../dto/credito.dto'
import { authMiddleware } from '../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado')

    const service = new CreditoService()
    let creditos

    if (estado === 'ACTIVO') {
      creditos = await service.getActivos()
    } else if (estado === 'VENCIDO') {
      creditos = await service.getVencidos()
    } else {
      creditos = await service.getAll()
    }

    return NextResponse.json(creditos)
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
    const validated = createCreditoDTO.parse({
      ...body,
      id_usuario_crea: (auth as any).id
    })

    const service = new CreditoService()
    const credito = await service.create(validated)

    return NextResponse.json(credito, { status: 201 })
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