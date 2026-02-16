import { NextRequest, NextResponse } from 'next/server'
import { PagoService } from '../../services/pago.service'
import { createPagoDTO } from '../../dto/pagos.dto'
import { authMiddleware } from '../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const service = new PagoService()
    let pagos

    if (fechaInicio && fechaFin) {
      pagos = await service.getByFecha(
        new Date(fechaInicio),
        new Date(fechaFin)
      )
    } else {
      pagos = await service.getAll()
    }

    return NextResponse.json(pagos)
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
    const validated = createPagoDTO.parse({
      ...body,
      registrado_por: (auth as any).id
    })

    const service = new PagoService()
    const pago = await service.registrar(validated)

    return NextResponse.json(pago, { status: 201 })
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