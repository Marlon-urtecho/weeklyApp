import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '../../../services/auth.service'
import { ResetPasswordDTO } from '../../../dto/auth.dto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = ResetPasswordDTO.parse(body)

    const authService = new AuthService()
    await authService.resetPassword(validated)

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const message = error?.issues?.[0]?.message || error?.errors?.[0]?.message || 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'No se pudo restablecer la contraseña' },
      { status: 400 }
    )
  }
}
