export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSandboxAuth } from '@/lib/sandbox/auth'
import { getSandboxSupabase } from '@/lib/sandbox/supabase'
import { DR_GOKHAN_ID } from '@/lib/dr-ayse/persona'
import { buildDoctorMorningBriefPrompt } from '@/lib/dr-ayse/persona'
import { groqChat } from '@/lib/dr-ayse/groq'

export async function GET(req: NextRequest) {
  const auth = await requireSandboxAuth(req)
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const supabase = getSandboxSupabase()
  const doctorId = req.nextUrl.searchParams.get('doctor_id') || DR_GOKHAN_ID
  const appointmentId = req.nextUrl.searchParams.get('appointment_id')
  const includeBrief = req.nextUrl.searchParams.get('include_brief') === 'true'

  if (appointmentId) {
    const { data, error } = await supabase
      .from('sandbox_appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Randevu bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: appointments, error } = await supabase
    .from('sandbox_appointments')
    .select('*')
    .eq('doctor_id', doctorId)
    .gte('appointment_time', todayStart.toISOString())
    .lte('appointment_time', todayEnd.toISOString())
    .order('appointment_time', { ascending: true })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  let morningBrief: string | null = null
  if (includeBrief && appointments && appointments.length > 0) {
    const ids = appointments.map((a) => a.id)
    const { data: charts } = await supabase
      .from('sandbox_clinical_charts')
      .select('*')
      .in('appointment_id', ids)

    const chartMap = new Map(charts?.map((c) => [c.appointment_id, c]) || [])
    const withCharts = appointments.map((a) => ({
      patient_name: a.patient_name,
      appointment_time: a.appointment_time,
      chief_complaint: a.chief_complaint_seed,
      chart: chartMap.get(a.id) || null,
    }))

    try {
      morningBrief = await groqChat([
        { role: 'system', content: buildDoctorMorningBriefPrompt(withCharts) },
        { role: 'user', content: 'Sabah brifingini hazırla.' },
      ], { temperature: 0.3, maxTokens: 800 })
    } catch {
      morningBrief = `${appointments.length} randevu bugün. Brifing oluşturulamadı.`
    }
  }

  return NextResponse.json({
    success: true,
    data: appointments || [],
    morning_brief: morningBrief,
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireSandboxAuth(req)
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const body = await req.json()
  const {
    patient_name,
    patient_phone,
    appointment_time,
    chief_complaint_seed,
    doctor_id = DR_GOKHAN_ID,
  } = body

  if (!patient_name || !appointment_time) {
    return NextResponse.json(
      { success: false, error: 'patient_name ve appointment_time gerekli' },
      { status: 400 }
    )
  }

  const supabase = getSandboxSupabase()
  const { data, error } = await supabase
    .from('sandbox_appointments')
    .insert({
      doctor_id,
      patient_name,
      patient_phone: patient_phone || null,
      appointment_time,
      chief_complaint_seed: chief_complaint_seed || null,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
