import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '../../../services/auth.service'
import { RefreshTokenDTO } from '../../../dto/auth.dto'

export async function POST(req: NextRequest) {
  try {
    let refreshToken = req.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      const body = await req.json().catch(() => ({}))
      const parsed = RefreshTokenDTO.safeParse(body)
      if (!parsed.success) {
        const message =
          parsed.error?.issues?.[0]?.message ||
          'Refresh token inválido'
        return NextResponse.json({ error: message }, { status: 400 })
      }
      refreshToken = parsed.data.refresh_token
    }

    const authService = new AuthService()
    const tokens = await authService.refresh(refreshToken)

    const isProduction = process.env.NODE_ENV === 'production'
    const response = NextResponse.json({ token: tokens.token })
    response.cookies.set('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/auth',
      maxAge: 60 * 60 * 24 * 30
    })
    return response
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const message = error?.issues?.[0]?.message || error?.errors?.[0]?.message || 'Datos inválidos'
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'No se pudo refrescar el token' },
      { status: 401 }
    )
  }
}
