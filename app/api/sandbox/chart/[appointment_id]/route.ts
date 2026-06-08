export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSandboxAuth } from '@/lib/sandbox/auth'
import { getSandboxSupabase } from '@/lib/sandbox/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { appointment_id: string } }
) {
  const auth = await requireSandboxAuth(req)
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const appointmentId = params.appointment_id
  const supabase = getSandboxSupabase()

  const { data: appointment } = await supabase
    .from('sandbox_appointments')
    .select('*')
    .eq('id', appointmentId)
    .single()

  if (!appointment) {
    return NextResponse.json({ success: false, error: 'Randevu bulunamadı' }, { status: 404 })
  }

  const { data: interview } = await supabase
    .from('sandbox_patient_interviews')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  const { data: chart } = await supabase
    .from('sandbox_clinical_charts')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  return NextResponse.json({
    success: true,
    data: {
      appointment,
      interview,
      chart,
    },
  })
}
