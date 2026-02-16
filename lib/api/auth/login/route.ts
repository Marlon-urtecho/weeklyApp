import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '../../../services/auth.service'
import { LoginDTO } from '../../../dto/auth.dto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = LoginDTO.parse(body)

    const authService = new AuthService()
    const result = await authService.login(validated)

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Error en el login' },
      { status: 401 }
    )
  }
}