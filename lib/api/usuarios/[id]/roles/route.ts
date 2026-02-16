import { NextRequest, NextResponse } from 'next/server'
import { UsuarioService } from '../../../../services/usuario.service'
import { authMiddleware } from '../../../../middleware/auth.middleware'

interface Params {
  params: { id: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const id_usuario = parseInt(params.id)
    const { id_rol } = await req.json()

    const service = new UsuarioService()
    await service.asignarRol(id_usuario, id_rol)

    return NextResponse.json({ message: 'Rol asignado correctamente' })
  } catch (error: any) {
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

    const id_usuario = parseInt(params.id)
    const { searchParams } = new URL(req.url)
    const id_rol = parseInt(searchParams.get('id_rol') || '0')

    const service = new UsuarioService()
    await service.quitarRol(id_usuario, id_rol)

    return NextResponse.json({ message: 'Rol removido correctamente' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}