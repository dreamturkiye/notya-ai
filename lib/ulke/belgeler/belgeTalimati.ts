/**
 * NOTYA-ULKE-EKLER-01 — the instruction the document reader is given, and how its answer is read. SERVER side; pure.
 *
 * One instruction for every country and every specialty (the 40 branches share one reader, as they share the step).
 * The country enters through the LANGUAGE of the answer — the note's language, in the country's own spelling — and
 * nothing else. The instruction holds no doctor, no patient, no country-specific institution. The reader describes;
 * it names no definitive diagnosis and recommends nothing: the doctor reads, edits and approves the note.
 */
import { jsonOnarDetay } from '@/lib/ai/jsonOnar'
import { EK_TURLERI, ekMetniSuz, EK_BULGU_ADEDI, EK_BULGU_AZAMI, EK_OZET_AZAMI, sinavZamaniniSuz, turuOku, type EkSonucu, type EkTuruSecimi } from './ekler'

/** The language of the answer, as the instruction names it. */
export function cevapDiliAdi(dil: string): string {
  switch (dil) {
    case 'ru': return 'Russian'
    case 'uz-Latn': return 'Uzbek, written in the Latin script'
    case 'uz-Cyrl': return 'Uzbek, written in the Cyrillic script'
    case 'en-US': return 'English, American spelling'
    case 'en-CA': return 'English, Canadian spelling'
    case 'en-AU': return 'English, Australian spelling'
    case 'en-NZ': return 'English, New Zealand spelling'
    default: return 'English, British spelling'
  }
}

const TUR_TANIMI: Record<(typeof EK_TURLERI)[number], string> = {
  ultrasound: 'an ultrasound image or an ultrasound report',
  xray: 'a plain radiograph (X-ray)',
  ct_mri: 'a CT or MRI image or report',
  ecg: 'an ECG tracing',
  lab: 'a laboratory report',
  photo: 'a clinical photograph',
  other: 'a medical document',
}

export function belgeTalimati(dil: string, tur: EkTuruSecimi): string {
  return [
    'You assist a licensed clinician who is documenting a visit. You are given ONE image of a medical document or study: an ultrasound image or report, an X-ray, a CT or MRI slice, an ECG tracing, a page of a laboratory report, a clinical photograph, or a scanned document. Write a short, factual draft that the clinician will read, edit and approve before it becomes part of the note.',
    '',
    'Reply with ONE JSON object and nothing else:',
    '{"kind":"ultrasound|xray|ct_mri|ecg|lab|photo|other","quality":"good|fair|poor","exam_datetime":"YYYY-MM-DD or YYYY-MM-DDTHH:MM, or null","summary":"1-3 sentences","findings":["one observation per item"],"urgent":false}',
    '',
    'Rules',
    '- Describe what is visible and the measurements or values printed on the document. Copy numbers, units and reference marks exactly as printed; never invent or estimate a measurement that is not shown.',
    '- Use cautious wording ("consistent with", "suggests", "not seen"). Do NOT state a definitive diagnosis and do NOT recommend treatment; the clinician decides.',
    '- Never write the patient\'s name, date of birth, national or hospital identifier, address, or the name of any clinician or institution, even if something is still visible: parts of the image may have been blacked out on purpose.',
    '- "kind": what the document is. "exam_datetime": the examination date printed on it, only if clearly readable, otherwise null.',
    '- If the image is too blurry, cropped, dark or not a medical document, set "quality" to "poor" and leave "summary" empty and "findings" empty.',
    '- "urgent": true only if the document shows a finding that normally needs same-day clinical attention.',
    '- Keep each finding to one line. At most 15 findings.',
    tur === 'auto' ? null : `- The clinician says this is ${TUR_TANIMI[tur]}; set "kind" accordingly unless the image is clearly something else.`,
    `- Write "summary" and "findings" in ${cevapDiliAdi(dil)}. The JSON keys and the values of "kind" and "quality" stay in English.`,
  ].filter((x): x is string => x !== null).join('\n')
}

/** The patient context line: age and sex only (no name, no number, no date of birth). */
export function belgeBaglami(yasYil: number | null, yasAy: number | null, cinsiyet: string): string {
  const yas = yasYil === null ? '' : yasYil < 2 && yasAy !== null ? `${yasAy} months` : `${yasYil} years`
  const parcalar = [yas && `age ${yas}`, cinsiyet === 'male' || cinsiyet === 'female' ? cinsiyet : ''].filter(Boolean)
  return parcalar.length ? `Patient: ${parcalar.join(', ')}. Describe the attached document.` : 'Describe the attached document.'
}

const KALITELER = { good: 'iyi', fair: 'orta', poor: 'dusuk' } as const

/** The reader's answer as a result, or null when it is not one (no object, wrong shape). Pure. */
export function belgeSonucunuOku(yanit: string, simdi: number = Date.now()): EkSonucu | null {
  const r = jsonOnarDetay(yanit)
  if (r.deger === null || typeof r.deger !== 'object' || Array.isArray(r.deger)) return null
  const o = r.deger as Record<string, unknown>
  const kalite = typeof o.quality === 'string' && o.quality in KALITELER ? KALITELER[o.quality as keyof typeof KALITELER] : null
  if (!kalite) return null
  const bulgular = (Array.isArray(o.findings) ? o.findings : typeof o.findings === 'string' ? [o.findings] : [])
    .slice(0, EK_BULGU_ADEDI)
    .map((b) => ekMetniSuz(b, EK_BULGU_AZAMI))
    .filter(Boolean)
  const ozet = ekMetniSuz(Array.isArray(o.summary) ? o.summary.join(' ') : o.summary, EK_OZET_AZAMI)
  if (kalite !== 'dusuk' && !ozet && !bulgular.length) return null
  return { tur: turuOku(o.kind), kalite, sinavZamani: sinavZamaniniSuz(o.exam_datetime, simdi), ozet, bulgular, acil: o.urgent === true }
}
