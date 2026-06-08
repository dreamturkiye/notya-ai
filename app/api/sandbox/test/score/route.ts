export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSandboxAuth } from '@/lib/sandbox/auth'
import { getSandboxSupabase } from '@/lib/sandbox/supabase'

const SCORE_SECTIONS = [
  'chief_complaint',
  'hpi',
  'differential_diagnosis',
  'treatment_suggestions',
] as const

export async function POST(req: NextRequest) {
  const auth = await requireSandboxAuth(req)
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const body = await req.json()
  const { appointment_id, scores, feedback } = body

  if (!appointment_id || !scores) {
    return NextResponse.json(
      { success: false, error: 'appointment_id ve scores gerekli' },
      { status: 400 }
    )
  }

  for (const section of SCORE_SECTIONS) {
    const val = scores[section]
    if (typeof val !== 'number' || val < 1 || val > 5) {
      return NextResponse.json(
        { success: false, error: `${section} için 1-5 arası puan gerekli` },
        { status: 400 }
      )
    }
  }

  const supabase = getSandboxSupabase()

  const { data: appointment } = await supabase
    .from('sandbox_appointments')
    .select('id')
    .eq('id', appointment_id)
    .single()

  if (!appointment) {
    return NextResponse.json({ success: false, error: 'Randevu bulunamadı' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('sandbox_test_scores')
    .insert({
      appointment_id,
      scores,
      feedback: feedback || {},
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
