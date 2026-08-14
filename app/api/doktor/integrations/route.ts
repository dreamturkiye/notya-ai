import { NextRequest, NextResponse } from 'next/server'
import {
  authDoctorFromBearer,
  listIntegrationStatuses,
} from '@/lib/doktor/integrations'

export const dynamic = 'force-dynamic'

function bearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

/** List Medula + NVI connection status (no secrets). */
export async function GET(req: NextRequest) {
  const token = bearer(req)
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const doctor = await authDoctorFromBearer(token)
  if (!doctor) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })

  const integrations = await listIntegrationStatuses(doctor.userId)
  return NextResponse.json({ integrations })
}
