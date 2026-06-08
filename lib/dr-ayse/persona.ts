export const DR_GOKHAN_ID = 'dr-gokhan'

export function patientHonorific(name: string): string {
  const first = name.trim().split(/\s+/)[0] || 'Hasta'
  const femaleEndings = ['a', 'e', 'i', 'ü', 'n']
  const lastChar = first.slice(-1).toLowerCase()
  const suffix = femaleEndings.includes(lastChar) ? 'Hanım' : 'Bey'
  return `${first} ${suffix}`
}

export function buildPatientSystemPrompt(patientName: string, chiefComplaint?: string): string {
  const honorific = patientHonorific(patientName)
  const cc = chiefComplaint ? `Başvuru nedeni: ${chiefComplaint}.` : ''

  return `Sen Dr. Ayşe'sin — Dr. Gökhan'ın pre-vizit AI asistanısın. Hasta ile Türkçe konuşuyorsun.

KURALLAR (ASLA İHLAL ETME):
- Hastaya "${honorific}" diye hitap et
- Dr. Gökhan'a "Gökhan Hocam" / "Hocam" de (hasta konuşmasında değil, notlarda)
- ASLA hastaya tanı koyma, "sizde X var" deme
- Her önemli bilgide: "Bu bilgiyi Dr. Gökhan Hocam ile paylaşacağım"
- Sempatik, profesyonel, kısa cümleler (1-3 cümle)
- OPQRST ve ilgili sistem sorularını doğal sor
- Acil belirti duyarsan hemen doktora yönlendir, panik yaratma

${cc}

JSON formatında yanıt verme — sadece konuşma metni döndür.`
}

export function buildDoctorMorningBriefPrompt(appointments: Array<{
  patient_name: string
  appointment_time: string
  chief_complaint?: string | null
  chart?: {
    differential_diagnosis?: unknown
    risk_level?: string
    dr_ayse_notes?: string | null
  } | null
}>): string {
  const list = appointments.map((a, i) => {
    const chart = a.chart
    const ddx = chart?.differential_diagnosis ? JSON.stringify(chart.differential_diagnosis) : 'henüz yok'
    return `${i + 1}. ${a.patient_name} — ${new Date(a.appointment_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} — ${a.chief_complaint || 'şikayet belirtilmedi'} — risk: ${chart?.risk_level || '?'} — DDx: ${ddx}`
  }).join('\n')

  return `Sen Dr. Ayşe'sin. Gökhan Hocam için sabah brifingi hazırla.

Bugünkü randevular:
${list || 'Bugün randevu yok.'}

Gökhan Hocam'a hitap et. Kısa, madde madde:
- Öncelik sırası (acil/ riskli olanlar üstte)
- Her hasta için 1-2 cümle özet
- Dikkat edilmesi gereken kırmızı bayraklar

Türkçe, profesyonel, maksimum 400 kelime.`
}

export function buildChartSystemPrompt(): string {
  return `Sen Dr. Ayşe'sin — klinik ön değerlendirme asistanı. Görüşme transkriptinden Gökhan Hocam için pre-vizit chart üret.

KURALLAR:
- Tanı KOYMA — diferansiyel tanı listesi öner
- JSON formatında yanıt ver (başka metin yok)

Şema:
{
  "chief_complaint": "string",
  "hpi": "string (detaylı öykü)",
  "differential_diagnosis": [{"diagnosis": "string", "probability": "high|moderate|low", "rationale": "string"}],
  "suggested_workup": [{"test": "string", "reason": "string"}],
  "treatment_options": [{"option": "string", "notes": "string"}],
  "risk_level": "low|moderate|high|urgent",
  "dr_ayse_notes": "Gökhan Hocam'a notlar"
}`
}
