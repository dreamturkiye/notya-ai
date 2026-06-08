import { buildChartSystemPrompt } from './persona'
import { groqChat } from './groq'
import type { TranscriptEntry } from './interview-engine'

export type ClinicalChart = {
  chief_complaint: string
  hpi: string
  differential_diagnosis: Array<{
    diagnosis: string
    probability: 'high' | 'moderate' | 'low'
    rationale: string
  }>
  suggested_workup: Array<{ test: string; reason: string }>
  treatment_options: Array<{ option: string; notes: string }>
  risk_level: 'low' | 'moderate' | 'high' | 'urgent'
  dr_ayse_notes: string
}

export async function generateChartFromTranscript(
  patientName: string,
  transcript: TranscriptEntry[],
  chiefComplaintSeed?: string
): Promise<ClinicalChart> {
  const transcriptText = transcript
    .map((t) => `${t.role === 'patient' ? 'Hasta' : 'Dr. Ayşe'}: ${t.text}`)
    .join('\n')

  const userPrompt = `Hasta: ${patientName}
Başvuru ipucu: ${chiefComplaintSeed || 'belirtilmedi'}

Görüşme transkripti:
${transcriptText}

Yukarıdaki görüşmeden pre-vizit klinik chart üret.`

  const raw = await groqChat(
    [
      { role: 'system', content: buildChartSystemPrompt() },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.2, maxTokens: 2048, jsonMode: true }
  )

  try {
    const parsed = JSON.parse(raw) as ClinicalChart
    return {
      chief_complaint: parsed.chief_complaint || chiefComplaintSeed || 'Belirtilmedi',
      hpi: parsed.hpi || '',
      differential_diagnosis: parsed.differential_diagnosis || [],
      suggested_workup: parsed.suggested_workup || [],
      treatment_options: parsed.treatment_options || [],
      risk_level: parsed.risk_level || 'low',
      dr_ayse_notes: parsed.dr_ayse_notes || '',
    }
  } catch {
    return fallbackChart(patientName, transcript, chiefComplaintSeed)
  }
}

function fallbackChart(
  patientName: string,
  transcript: TranscriptEntry[],
  chiefComplaintSeed?: string
): ClinicalChart {
  const patientLines = transcript.filter((t) => t.role === 'patient').map((t) => t.text)
  return {
    chief_complaint: chiefComplaintSeed || patientLines[0] || 'Belirtilmedi',
    hpi: patientLines.join(' '),
    differential_diagnosis: [
      {
        diagnosis: 'Değerlendirme gerekli',
        probability: 'moderate',
        rationale: `${patientName} — otomatik chart oluşturulamadı, manuel inceleme önerilir`,
      },
    ],
    suggested_workup: [{ test: 'Fizik muayene', reason: 'Pre-vizit değerlendirme' }],
    treatment_options: [{ option: 'Dr. Gökhan değerlendirmesi bekleniyor', notes: '' }],
    risk_level: 'moderate',
    dr_ayse_notes: 'Gökhan Hocam, görüşme tamamlandı — lütfen transkripti inceleyin.',
  }
}

export function extractInterviewFields(chart: ClinicalChart) {
  return {
    chief_complaint: chart.chief_complaint,
    hpi: chart.hpi,
    past_history: null as string | null,
    medications: [] as unknown[],
    allergies: null as string | null,
    review_of_systems: {} as Record<string, unknown>,
  }
}
