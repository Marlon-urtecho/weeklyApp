import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authMiddleware } from '../../../../middleware/auth.middleware'
import { UsuarioService } from '../../../../services/usuario.service'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
})

const getZodErrorMessage = (error: any) =>
  error?.issues?.[0]?.message || error?.errors?.[0]?.message || 'Datos inválidos'

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id_usuario = Number((auth as any).id)
    if (Number.isNaN(id_usuario)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await req.json()
    const validated = changePasswordSchema.parse(body)

    const service = new UsuarioService()
    await service.changePassword(id_usuario, validated.currentPassword, validated.newPassword)

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
