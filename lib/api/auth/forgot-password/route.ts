import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '../../../services/auth.service'
import { ForgotPasswordDTO } from '../../../dto/auth.dto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = ForgotPasswordDTO.parse(body)

    const authService = new AuthService()
    await authService.requestPasswordReset(validated)

    // Respuesta genérica para evitar enumeración de usuarios.
    return NextResponse.json({
      message: 'Si el usuario existe, se envió un código de recuperación al correo indicado.'
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const message = error?.issues?.[0]?.message || error?.errors?.[0]?.message || 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'No se pudo procesar la solicitud de recuperación' },
      { status: 400 }
    )
  }
}
