export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSandboxAuth } from '@/lib/sandbox/auth'
import { getSandboxSupabase } from '@/lib/sandbox/supabase'
import {
  generateChartFromTranscript,
  extractInterviewFields,
} from '@/lib/dr-ayse/chart-generator'
import { generateDifferentialDiagnosis, getHighestRisk } from '@/lib/dr-ayse/ddx-engine'
import type { TranscriptEntry } from '@/lib/dr-ayse/interview-engine'

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
    return NextResponse.json({ success: false, error: 'Görüşme bulunamadı' }, { status: 400 })
  }

  const transcript = interview.transcript as TranscriptEntry[]
  const startedAt = new Date(interview.created_at).getTime()
  const durationSeconds = Math.round((Date.now() - startedAt) / 1000)

  const chart = await generateChartFromTranscript(
    appointment.patient_name,
    transcript,
    appointment.chief_complaint_seed || undefined
  )

  const ddx = await generateDifferentialDiagnosis(chart.chief_complaint, chart.hpi)
  const riskLevel = getHighestRisk(ddx.length > 0 ? ddx : chart.differential_diagnosis)

  const fields = extractInterviewFields(chart)

  await supabase
    .from('sandbox_patient_interviews')
    .update({
      ...fields,
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', interview.id)

  const { data: existingChart } = await supabase
    .from('sandbox_clinical_charts')
    .select('id')
    .eq('appointment_id', appointment_id)
    .maybeSingle()

  const chartPayload = {
    appointment_id,
    differential_diagnosis: ddx.length > 0 ? ddx : chart.differential_diagnosis,
    suggested_workup: chart.suggested_workup,
    treatment_options: chart.treatment_options,
    risk_level: riskLevel,
    dr_ayse_notes: chart.dr_ayse_notes,
    generated_at: new Date().toISOString(),
  }

  let savedChart
  if (existingChart) {
    const { data } = await supabase
      .from('sandbox_clinical_charts')
      .update(chartPayload)
      .eq('id', existingChart.id)
      .select()
      .single()
    savedChart = data
  } else {
    const { data } = await supabase
      .from('sandbox_clinical_charts')
      .insert(chartPayload)
      .select()
      .single()
    savedChart = data
  }

  await supabase
    .from('sandbox_appointments')
    .update({ status: 'chart_ready' })
    .eq('id', appointment_id)

  return NextResponse.json({
    success: true,
    data: {
      interview: { ...interview, chief_complaint: chart.chief_complaint, hpi: chart.hpi },
      chart: savedChart,
    },
  })
}
