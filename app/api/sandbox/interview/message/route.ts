export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSandboxAuth } from '@/lib/sandbox/auth'
import { getSandboxSupabase } from '@/lib/sandbox/supabase'
import {
  generateDrAyseReply,
  shouldCompleteInterview,
  type TranscriptEntry,
} from '@/lib/dr-ayse/interview-engine'
import { synthesizeSpeech } from '@/lib/dr-ayse/tts'

export async function POST(req: NextRequest) {
  const auth = await requireSandboxAuth(req)
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const body = await req.json()
  const { appointment_id, message } = body

  if (!appointment_id || !message?.trim()) {
    return NextResponse.json(
      { success: false, error: 'appointment_id ve message gerekli' },
      { status: 400 }
    )
  }

  const supabase = getSandboxSupabase()

  const { data: appointment } = await supabase
    .from('sandbox_appointments')
    .select('*')
    .eq('id', appointment_id)
    .single()

  if (!appointment) {
    return NextResponse.json({ success: false, error: 'Randevu bulunamadı' }, { status: 404 })
  }

  const { data: interview } = await supabase
    .from('sandbox_patient_interviews')
    .select('*')
    .eq('appointment_id', appointment_id)
    .single()

  if (!interview) {
    return NextResponse.json({ success: false, error: 'Görüşme başlatılmamış' }, { status: 400 })
  }

  const transcript: TranscriptEntry[] = [
    ...(interview.transcript as TranscriptEntry[]),
    { role: 'patient', text: message.trim(), timestamp: new Date().toISOString() },
  ]

  const chiefComplaint =
    appointment.chief_complaint_seed || message.trim()

  const reply = await generateDrAyseReply(
    appointment.patient_name,
    chiefComplaint,
    transcript
  )

  const updatedTranscript: TranscriptEntry[] = [
    ...transcript,
    { role: 'dr_ayse', text: reply, timestamp: new Date().toISOString() },
  ]

  await supabase
    .from('sandbox_patient_interviews')
    .update({ transcript: updatedTranscript })
    .eq('id', interview.id)

  let audioBase64: string | null = null
  try {
    const audio = await synthesizeSpeech(reply)
    audioBase64 = Buffer.from(audio).toString('base64')
  } catch (e) {
    console.warn('[interview/message] TTS failed:', e)
  }

  const shouldComplete = shouldCompleteInterview(updatedTranscript)

  return NextResponse.json({
    success: true,
    data: {
      reply,
      audio_base64: audioBase64,
      transcript: updatedTranscript,
      exchange_count: updatedTranscript.filter((t) => t.role === 'patient').length,
      should_complete: shouldComplete,
    },
  })
}
