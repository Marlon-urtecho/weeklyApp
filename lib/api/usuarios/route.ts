import { NextRequest, NextResponse } from 'next/server'
import { UsuarioService } from '../../services/usuario.service'
import { CreateUsuarioDTO } from '../../dto/usuario.dto'
import { authMiddleware } from '../../middleware/auth.middleware'

const isAdmin = (roles?: string[]) =>
  (roles || []).map((r) => (r || '').toUpperCase()).some((r) => r.includes('ADMIN'))

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    if (!isAdmin((auth as any).roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const service = new UsuarioService()
    const usuarios = await service.getAll()

    return NextResponse.json(usuarios)
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
    if (!isAdmin((auth as any).roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const validated = CreateUsuarioDTO.parse(body)

    const service = new UsuarioService()
    const usuario = await service.create(validated)

    return NextResponse.json(usuario, { status: 201 })
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
