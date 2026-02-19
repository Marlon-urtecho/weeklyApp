import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authMiddleware } from '../../../middleware/auth.middleware'
import { UsuarioService } from '../../../services/usuario.service'

const updatePerfilSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(50).optional(),
  telefono_vendedor: z.string().min(4).max(30).optional()
})

const getZodErrorMessage = (error: any) =>
  error?.issues?.[0]?.message || error?.errors?.[0]?.message || 'Datos inválidos'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id_usuario = Number((auth as any).id)
    if (Number.isNaN(id_usuario)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const service = new UsuarioService()
    const perfil = await service.getProfile(id_usuario)
    return NextResponse.json(perfil)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id_usuario = Number((auth as any).id)
    if (Number.isNaN(id_usuario)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await req.json()
    const validated = updatePerfilSchema.parse(body)

    const service = new UsuarioService()
    const updated = await service.updateProfile(id_usuario, validated)
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: getZodErrorMessage(error) }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
