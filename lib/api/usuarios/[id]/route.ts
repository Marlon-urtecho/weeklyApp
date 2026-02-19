import { NextRequest, NextResponse } from 'next/server'
import { UsuarioService } from '../../../services/usuario.service'
import { UpdateUsuarioDTO } from '../../../dto/usuario.dto'
import { authMiddleware } from '../../../middleware/auth.middleware'

const isAdmin = (roles?: string[]) =>
  (roles || []).map((r) => (r || '').toUpperCase()).some((r) => r.includes('ADMIN'))

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    if (!isAdmin((auth as any).roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const service = new UsuarioService()
    const usuario = await service.getById(id)

    return NextResponse.json(usuario)
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
    if (!isAdmin((auth as any).roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const body = await req.json()
    const validated = UpdateUsuarioDTO.parse(body)

    const service = new UsuarioService()
    const usuario = await service.update(id, validated)

    return NextResponse.json(usuario)
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

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth
    if (!isAdmin((auth as any).roles)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const service = new UsuarioService()
    await service.delete(id)

    return NextResponse.json({ message: 'Usuario desactivado correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
