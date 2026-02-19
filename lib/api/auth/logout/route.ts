import { NextResponse } from 'next/server'

export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production'
  const response = NextResponse.json({ ok: true })
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 0
  })
  return response
}
