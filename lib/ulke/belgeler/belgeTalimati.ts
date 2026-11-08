/**
 * NOTYA-ULKE-EKLER-01 — the instruction the document reader is given, and how its answer is read. SERVER side; pure.
 *
 * One instruction for every country and every specialty (the 40 branches share one reader, as they share the step).
 * The country enters through the LANGUAGE of the answer — the note's language, in the country's own spelling — and
 * nothing else. The instruction holds no doctor, no patient, no country-specific institution. The reader describes;
 * it names no definitive diagnosis and recommends nothing: the doctor reads, edits and approves the note.
 */
import { jsonOnarDetay } from '@/lib/ai/jsonOnar'
import { EK_TEMEL_TURLERI, EK_TURLERI, ekMetniSuz, EK_BULGU_ADEDI, EK_BULGU_AZAMI, EK_OZET_AZAMI, sinavZamaniniSuz, turuOku, type EkSonucu, type EkTuru, type EkTuruSecimi } from './ekler'

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
  echo: 'an echocardiogram report or image',
  holter: 'a Holter or ambulatory ECG report',
  spirometry: 'a spirometry or lung function report',
  audiogram: 'an audiogram',
  tympanogram: 'a tympanogram',
  dermoscopy: 'a dermoscopy image',
  eeg: 'an EEG report or tracing',
  sleep_study: 'a sleep study report',
  ncs_emg: 'a nerve conduction study or EMG report',
  ctg: 'a cardiotocograph (CTG) trace',
  visual_field: 'a visual field printout',
  oct: 'an optical coherence tomography (OCT) printout',
  fundus: 'a fundus photograph',
  semen: 'a semen analysis report',
  endoscopy: 'an endoscopy report or image',
  psychometric: 'a psychometric questionnaire or score sheet',
  gait_rom: 'a gait analysis or range-of-motion record',
}

/**
 * ULKE-BRANS-DERINLIK-10: ONE reading line per specialty kind — what to copy from that document. Every line keeps the rule of
 * the whole reader: copy what is printed, compute no score, grade or diagnosis that the document does not print.
 */
export const TUR_OKUMA: Partial<Record<EkTuru, string>> = {
  echo: 'For an echocardiogram: copy the printed measurements (for example ejection fraction, chamber dimensions, valve gradients and areas) with their units exactly as printed, and the report\'s own conclusion; do not calculate or grade anything that is not printed.',
  holter: 'For a Holter or ambulatory ECG report: copy the printed recording duration, heart-rate range, ectopic beat counts, pauses and patient-marked events with their times as printed; do not name a rhythm the report does not state.',
  spirometry: 'For spirometry or lung function results: copy the printed values (FEV1, FVC, FEV1/FVC, percent predicted, z-scores, the post-bronchodilator change) with units as printed; do not grade severity unless the report prints a grade.',
  audiogram: 'For an audiogram: copy the printed thresholds in dB HL per frequency for each ear, air and bone conduction where shown, and any masking noted; do not calculate an average or a hearing-loss grade unless it is printed.',
  tympanogram: 'For a tympanogram: copy, for each ear, the printed type, peak compliance or admittance, middle-ear pressure and ear-canal volume as printed.',
  dermoscopy: 'For a dermoscopy image: describe the visible structures, colours and their distribution in plain dermoscopic terms; do not name a diagnosis and do not score the lesion.',
  eeg: 'For an EEG: copy the reported background activity, abnormalities and conclusion as printed; from a tracing alone, describe only what is clearly visible.',
  sleep_study: 'For a sleep study: copy the printed indices (for example AHI, RDI, oxygen desaturation index, lowest SpO2, total sleep time, sleep efficiency) as printed; do not classify severity unless it is printed.',
  ncs_emg: 'For a nerve conduction study or EMG: copy the printed latencies, amplitudes, conduction velocities, needle findings and the report\'s own conclusion as printed.',
  ctg: 'For a CTG: copy the printed or clearly marked baseline heart rate, variability, accelerations, decelerations and contractions, and the paper speed if printed; do not classify the trace.',
  visual_field: 'For a visual field printout: copy, for each eye, the test strategy, reliability indices and global indices (for example MD, PSD, VFI) as printed.',
  oct: 'For an OCT printout: copy, for each eye, the printed thickness values (for example retinal nerve fibre layer, central subfield) and the device\'s own flags as printed; describe only what is clearly visible.',
  fundus: 'For a fundus photograph: describe only what is clearly visible (disc, vessels, macula, any lesion); do not grade retinopathy.',
  semen: 'For a semen analysis: copy the printed parameters (volume, concentration, total count, motility, morphology, vitality) with units and the laboratory\'s own reference values as printed.',
  endoscopy: 'For an endoscopy report or image: copy the report\'s findings and any classification exactly as written; from an image alone, describe only what is clearly visible.',
  psychometric: 'For a psychometric score sheet: copy the instrument\'s name, the printed total and subscale scores and the date as printed; do not add up items, compute a score or name a diagnosis.',
  gait_rom: 'For a gait analysis or range-of-motion record: copy the printed angles, distances, speeds and test times with units and sides as printed.',
}

/**
 * `turler` = the kinds this clinician's role may have (lib/ulke/belgeler/ekler.ts rolEkTurleri); default: the shared seven.
 * Only those kinds are named to the reader, so a specialty kind never comes back for a role that does not assess it.
 */
export function belgeTalimati(dil: string, tur: EkTuruSecimi, turler: readonly EkTuru[] = EK_TEMEL_TURLERI): string {
  const liste = [...turler.filter((t) => t !== 'other'), 'other' as const]
  const uzman = liste.filter((t) => !(EK_TEMEL_TURLERI as readonly string[]).includes(t))
  const ekTanim = uzman.length ? `, or one of: ${uzman.map((t) => TUR_TANIMI[t]).join('; ')}` : ''
  const okuma = (tur === 'auto' ? uzman : uzman.filter((t) => t === tur)).map((t) => TUR_OKUMA[t]).filter((x): x is string => Boolean(x)).map((x) => `- ${x}`)
  return [
    `You assist a licensed clinician who is documenting a visit. You are given ONE image of a medical document or study: an ultrasound image or report, an X-ray, a CT or MRI slice, an ECG tracing, a page of a laboratory report, a clinical photograph, or a scanned document${ekTanim}. Write a short, factual draft that the clinician will read, edit and approve before it becomes part of the note.`,
    '',
    'Reply with ONE JSON object and nothing else:',
    `{"kind":"${liste.join('|')}","quality":"good|fair|poor","exam_datetime":"YYYY-MM-DD or YYYY-MM-DDTHH:MM, or null","summary":"1-3 sentences","findings":["one observation per item"],"urgent":false}`,
    '',
    'Rules',
    '- Describe what is visible and the measurements or values printed on the document. Copy numbers, units and reference marks exactly as printed; never invent or estimate a measurement that is not shown.',
    '- Use cautious wording ("consistent with", "suggests", "not seen"). Do NOT state a definitive diagnosis and do NOT recommend treatment; the clinician decides.',
    '- Never write the patient\'s name, date of birth, national or hospital identifier, address, or the name of any clinician or institution, even if something is still visible: parts of the image may have been blacked out on purpose.',
    '- "kind": what the document is. "exam_datetime": the examination date printed on it, only if clearly readable, otherwise null.',
    '- If the image is too blurry, cropped, dark or not a medical document, set "quality" to "poor" and leave "summary" empty and "findings" empty.',
    '- "urgent": true only if the document shows a finding that normally needs same-day clinical attention.',
    '- Keep each finding to one line. At most 15 findings.',
    ...okuma,
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
export function belgeSonucunuOku(yanit: string, simdi: number = Date.now(), turler: readonly EkTuru[] = EK_TURLERI): EkSonucu | null {
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
  return { tur: turuOku(o.kind, turler), kalite, sinavZamani: sinavZamaniniSuz(o.exam_datetime, simdi), ozet, bulgular, acil: o.urgent === true }
}
