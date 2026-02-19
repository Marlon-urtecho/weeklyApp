import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '../../../services/auth.service'
import { LoginDTO } from '../../../dto/auth.dto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = LoginDTO.parse(body)

    const authService = new AuthService()
    const result = await authService.login(validated)

    const response = NextResponse.json({
      user: result.user,
      token: result.token
    })

    response.cookies.set('refresh_token', result.refresh_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 60 * 60 * 24 * 30
    })

    return response
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
