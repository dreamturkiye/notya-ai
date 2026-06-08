import { groqChat } from './groq'

export type DdxItem = {
  diagnosis: string
  probability: 'high' | 'moderate' | 'low'
  rationale: string
  red_flags?: string[]
}

export async function generateDifferentialDiagnosis(
  chiefComplaint: string,
  hpi: string,
  patientContext?: string
): Promise<DdxItem[]> {
  const prompt = `Başvuru: ${chiefComplaint}
Öykü: ${hpi}
${patientContext ? `Ek bağlam: ${patientContext}` : ''}

Gökhan Hocam için diferansiyel tanı listesi oluştur. Tanı KOYMA — olasılıkları listele.

JSON format:
{"differential_diagnosis": [{"diagnosis": "...", "probability": "high|moderate|low", "rationale": "...", "red_flags": ["..."]}]}`

  try {
    const raw = await groqChat(
      [
        {
          role: 'system',
          content:
            'Sen Dr. Ayşe klinik asistanısın. Türkçe, evidence-based diferansiyel tanı öner. JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.2, maxTokens: 1024, jsonMode: true }
    )
    const parsed = JSON.parse(raw)
    return parsed.differential_diagnosis || []
  } catch {
    return [
      {
        diagnosis: 'Genel değerlendirme gerekli',
        probability: 'moderate',
        rationale: chiefComplaint,
      },
    ]
  }
}

export function rankByProbability(items: DdxItem[]): DdxItem[] {
  const order = { high: 0, moderate: 1, low: 2 }
  return [...items].sort(
    (a, b) => order[a.probability] - order[b.probability]
  )
}

export function getHighestRisk(items: DdxItem[]): 'low' | 'moderate' | 'high' | 'urgent' {
  const hasRedFlags = items.some((i) => i.red_flags && i.red_flags.length > 0)
  const highCount = items.filter((i) => i.probability === 'high').length
  if (hasRedFlags && highCount >= 2) return 'urgent'
  if (hasRedFlags || highCount >= 1) return 'high'
  if (items.some((i) => i.probability === 'moderate')) return 'moderate'
  return 'low'
}
