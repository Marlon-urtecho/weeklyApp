import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3001'

function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export function proxy(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return withCors(new NextResponse(null, { status: 204 }))
  }

  return withCors(NextResponse.next())
}

export const config = {
  matcher: ['/api/:path*']
}
