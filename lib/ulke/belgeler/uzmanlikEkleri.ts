/**
 * ULKE-BRANS-DERINLIK-10 (Kaan, 2026-11-08) — THE SPECIALTY DOCUMENTS each role assesses, for the "add documents" step
 * (.cursor/skills/belge-otomatik-akis/SKILL.md, country edition: lib/ulke/belgeler/ekler.ts). Kit data, the same in all six
 * country builds: role key → the specialty kinds that role's clinicians evaluate (an audiogram for audiology and ENT, a
 * spirometry printout for respiratory medicine, a CTG for obstetrics…). Every role keeps the seven shared kinds (ultrasound,
 * X-ray, CT/MRI, ECG, lab report, photograph, other document); a specialty kind is offered, read and labelled only for the
 * roles listed here (brans-alan-sizmasi: an audiogram choice never shows for a cardiologist, a CTG never for a dermatologist).
 *
 * The keys are the role keys of every country pack (English packs: us, gb, ca, au, nz; Uzbekistan: its own keys). A role
 * that is not here has the shared kinds only. The reader is told what each kind is and to copy printed values exactly; it
 * computes no score, grade or diagnosis (lib/ulke/belgeler/belgeTalimati.ts). Pure.
 */

export const EK_UZMANLIK_TURLERI = [
  'echo', 'holter', 'spirometry', 'audiogram', 'tympanogram', 'dermoscopy', 'eeg', 'sleep_study', 'ncs_emg', 'ctg',
  'visual_field', 'oct', 'fundus', 'semen', 'endoscopy', 'psychometric', 'gait_rom',
] as const
export type EkUzmanlikTuru = (typeof EK_UZMANLIK_TURLERI)[number]

type U = readonly EkUzmanlikTuru[]
const KALP: U = ['echo', 'holter']
const KALP_CERRAHI: U = ['echo']
const GOGUS_CERRAHI: U = ['spirometry']
const SOLUNUM: U = ['spirometry', 'sleep_study']
const NORO: U = ['eeg', 'ncs_emg', 'sleep_study']
const COCUK_NORO: U = ['eeg', 'ncs_emg']
const BEYIN: U = ['ncs_emg']
const REHAB: U = ['ncs_emg', 'gait_rom']
const HAREKET: U = ['gait_rom']
const KBB: U = ['audiogram', 'tympanogram', 'endoscopy', 'sleep_study']
const ISITME: U = ['audiogram', 'tympanogram']
const KONUSMA: U = ['audiogram']
const DERI: U = ['dermoscopy']
const GOZ: U = ['visual_field', 'oct', 'fundus']
const ENDOKRIN: U = ['fundus']
const KADIN: U = ['ctg', 'semen']
const UREME: U = ['semen']
const SINDIRIM: U = ['endoscopy']
const RUH: U = ['psychometric']
const AILE: U = ['spirometry', 'holter', 'dermoscopy', 'audiogram']
const DAHILIYE: U = ['echo', 'spirometry']
const COCUK: U = ['spirometry', 'audiogram']
const YASLI: U = ['psychometric', 'gait_rom']
const ALERJI: U = ['spirometry']
const ANESTEZI: U = ['spirometry', 'echo']
const UYKU: U = ['sleep_study', 'spirometry']
const ISYERI: U = ['audiogram', 'spirometry']

export const EK_UZMANLIK_ROLLERI: Readonly<Record<string, U>> = {
  // English packs (us, gb, ca, au, nz)
  cardiology: KALP, 'cardiovascular-surgery': KALP_CERRAHI, 'cardio-thoracic-surgery': KALP_CERRAHI, 'thoracic-surgery': GOGUS_CERRAHI,
  'internal-medicine': DAHILIYE, 'family-medicine': AILE, 'respiratory-medicine': SOLUNUM, 'sleep-medicine': UYKU,
  neurology: NORO, neurosurgery: BEYIN, 'rehabilitation-medicine': REHAB, physiotherapy: HAREKET, 'occupational-therapy': HAREKET,
  orthopaedics: HAREKET, 'sports-medicine': HAREKET, 'musculoskeletal-medicine': HAREKET, osteopathy: HAREKET, chiropractic: HAREKET, podiatry: HAREKET,
  otolaryngology: KBB, audiology: ISITME, 'audio-vestibular-medicine': ISITME,
  'speech-language-pathology': KONUSMA, 'speech-language-therapy': KONUSMA, 'speech-pathology': KONUSMA,
  dermatology: DERI, 'clinic-dermatology': DERI, 'plastic-surgery': DERI, 'hair-transplant': DERI,
  ophthalmology: GOZ, endocrinology: ENDOKRIN,
  'obstetrics-gynaecology': KADIN, 'reproductive-endocrinology': UREME, 'reproductive-endocrinology-infertility': UREME, urology: UREME,
  gastroenterology: SINDIRIM, 'general-surgery': SINDIRIM, 'colon-rectal-surgery': SINDIRIM,
  psychiatry: RUH, 'child-adolescent-psychiatry': RUH, 'old-age-psychiatry': RUH, 'addiction-medicine': RUH,
  'clinical-psychology': RUH, psychotherapy: RUH, 'clinical-social-work': RUH,
  paediatrics: COCUK, 'geriatric-medicine': YASLI,
  allergy: ALERJI, 'allergy-immunology': ALERJI, 'immunology-and-allergy': ALERJI, 'clinical-immunology-allergy': ALERJI,
  anaesthesia: ANESTEZI, 'occupational-medicine': ISYERI,
  // Uzbekistan (uz)
  kardiyoloji: KALP, 'kalp-damar-cerrahisi': KALP_CERRAHI, 'gogus-cerrahisi': GOGUS_CERRAHI, dahiliye: DAHILIYE, 'aile-hekimligi': AILE,
  'gogus-hastaliklari': SOLUNUM, noroloji: NORO, 'cocuk-norolojisi': COCUK_NORO, 'beyin-cerrahisi': BEYIN, 'fizik-tedavi': REHAB,
  fizyoterapi: HAREKET, ortopedi: HAREKET, 'spor-hekimligi': HAREKET, 'kulak-burun-bogaz': KBB, surdoloji: ISITME,
  dermatoloji: DERI, 'klinik-dermatoloji': DERI, 'plastik-cerrahi': DERI, 'goz-hastaliklari': GOZ, endokrinoloji: ENDOKRIN,
  'kadin-hastaliklari-dogum': KADIN, reproduktoloji: UREME, uroloji: UREME, gastroenteroloji: SINDIRIM, 'genel-cerrahi': SINDIRIM,
  psikiyatri: RUH, narkoloji: RUH, 'klinik-psikolog': RUH, pediatri: COCUK, 'alerji-immunoloji': ALERJI, anestezi: ANESTEZI,
}

/** The specialty kinds of a role (none for a role that is not listed, or no role). */
export function rolUzmanlikEkleri(rol: string | null | undefined): U {
  return rol && Object.prototype.hasOwnProperty.call(EK_UZMANLIK_ROLLERI, rol) ? EK_UZMANLIK_ROLLERI[rol] : []
}
