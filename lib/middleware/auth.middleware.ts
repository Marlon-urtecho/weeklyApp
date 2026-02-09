import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    return decoded
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    )
  }
}

// USO en API routes protegidas:
/*
export async function GET(req: NextRequest) {
  const auth = await authMiddleware(req)
  if (auth instanceof NextResponse) return auth
  
  // Si llega aquí, está autenticado
  // auth contiene { id, username, roles }
}
*/