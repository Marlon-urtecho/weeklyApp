import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '../../../services/dashboard.service'
import { authMiddleware } from '../../../middleware/auth.middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req)
    if (auth instanceof NextResponse) return auth

    const service = new DashboardService()
    const resumen = await service.getResumenCreditos()

    return NextResponse.json(resumen)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}