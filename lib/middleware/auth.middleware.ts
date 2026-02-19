import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '../db'

export async function authMiddleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'No autorizado. Token requerido' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (!Array.isArray(decoded?.roles) || decoded.roles.length === 0) {
      const usuarioRoles = await prisma.usuario_roles.findMany({
        where: { id_usuario: Number(decoded?.id) },
        include: { roles: true }
      })
      decoded.roles = usuarioRoles
        .map((ur) => ur.roles?.nombre_rol)
        .filter((r): r is string => Boolean(r))
    }

    return decoded
  } catch (error) {
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    )
  }
}
