export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSandboxAuth } from '@/lib/sandbox/auth'
import { getSandboxSupabase } from '@/lib/sandbox/supabase'
import { getWelcomeMessage } from '@/lib/dr-ayse/interview-engine'
import { synthesizeSpeech } from '@/lib/dr-ayse/tts'
import { getInterviewWindow } from '@/lib/sandbox/interview-window'

export async function POST(req: NextRequest) {
  const auth = await requireSandboxAuth(req)
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const body = await req.json()
  const { appointment_id } = body

  if (!appointment_id) {
    return NextResponse.json({ success: false, error: 'appointment_id gerekli' }, { status: 400 })
  }

  const supabase = getSandboxSupabase()

  const { data: appointment, error: apptErr } = await supabase
    .from('sandbox_appointments')
    .select('*')
    .eq('id', appointment_id)
    .single()

  if (apptErr || !appointment) {
    return NextResponse.json({ success: false, error: 'Randevu bulunamadı' }, { status: 404 })
  }

  const window = getInterviewWindow(appointment.appointment_time)
  if (!window.allowed) {
    return NextResponse.json({ success: false, error: window.reason }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('sandbox_patient_interviews')
    .select('id')
    .eq('appointment_id', appointment_id)
    .maybeSingle()

  let interviewId = existing?.id

  if (!interviewId) {
    const welcome = getWelcomeMessage(
      appointment.patient_name,
      appointment.chief_complaint_seed,
      appointment.appointment_time
    )
    const { data: interview, error: intErr } = await supabase
      .from('sandbox_patient_interviews')
      .insert({
        appointment_id,
        transcript: [{ role: 'dr_ayse', text: welcome, timestamp: new Date().toISOString() }],
      })
      .select()
      .single()

    if (intErr || !interview) {
      return NextResponse.json({ success: false, error: intErr?.message }, { status: 500 })
    }
    interviewId = interview.id
  }

  await supabase
    .from('sandbox_appointments')
    .update({ status: 'interview_in_progress' })
    .eq('id', appointment_id)

  const welcomeMsg = getWelcomeMessage(
    appointment.patient_name,
    appointment.chief_complaint_seed,
    appointment.appointment_time
  )
  let audioBase64: string | null = null
  try {
    const audio = await synthesizeSpeech(welcomeMsg)
    audioBase64 = Buffer.from(audio).toString('base64')
  } catch (e) {
    console.warn('[interview/start] TTS failed:', e)
  }

  return NextResponse.json({
    success: true,
    data: {
      interview_id: interviewId,
      welcome_message: welcomeMsg,
      audio_base64: audioBase64,
      patient_name: appointment.patient_name,
      chief_complaint_seed: appointment.chief_complaint_seed,
    },
  })
}
