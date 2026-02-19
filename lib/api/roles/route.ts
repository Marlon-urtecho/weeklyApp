import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../db'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const roles = await prisma.roles.findMany({
      orderBy: { id_rol: 'asc' }
    })

    const uniqueByName = new Map<string, (typeof roles)[number]>()
    for (const role of roles) {
      const key = (role.nombre_rol || '').trim().toUpperCase()
      if (!key) continue
      if (!uniqueByName.has(key)) {
        uniqueByName.set(key, role)
      }
    }

    return NextResponse.json(Array.from(uniqueByName.values()))
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener roles' },
      { status: 500 }
    )
  }
}
