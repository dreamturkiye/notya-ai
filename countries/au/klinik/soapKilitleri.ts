/**
 * AU-PEDIATRI-GOLD-01a — SOAP locks for every offered Australian role.
 *
 * Option A (.ulke-native). Mirrors the depth TR chapters get from soapKurallari +
 * specialty prompt overlays: section requirements and unbreakable rules in en-AU.
 * No guideline text is copied. No dose, diagnosis or college pathway is invented.
 * Note instructions still forbid naming sources (countries/_dil/en/klinik/talimatlar.ts).
 *
 * Injected by ../klinik/index.ts into notTalimati. A role without a lock keeps the
 * English baseline only. Allied professions keep the "no medical diagnosis" frame.
 */
import type { Sunulan } from './asistanAdlari'

export type AuSoapKilidi = {
  /** Short S/O/A/P requirements for this role. */
  readonly bolumler: readonly string[]
  /** Unbreakable rules (no inventing, no dose arithmetic, emergency pathway). */
  readonly kirilmaz: readonly string[]
}

const ORTAK_KIRILMAZ: readonly string[] = [
  'Write only what was said at the visit. Invent no finding, history, assessment or plan.',
  'Make no diagnosis the clinician did not state. Leave assessment empty when none was named.',
  'Medicines: name, dose and frequency exactly as said. Do no dose arithmetic and convert no unit.',
  'Name no guideline, protocol, authority or textbook in the note body.',
  'Where life or limb is at immediate risk, the plan records that Triple Zero (000) or the local emergency pathway was used — only if that was said.',
]

const cocuk: AuSoapKilidi = {
  bolumler: [
    's — Presenting complaint and history as the parent, guardian or young person reported; who gave the history if said.',
    'o — Examination findings and measurements said aloud (weight, height, head circumference only if spoken). Raw numbers only — invent no percentile.',
    'a — Impression as the clinician stated. No diagnosis from a growth number alone.',
    'p — Plan as said: tests, advice, immunisation said at this visit only, follow-up.',
  ],
  kirilmaz: [
    ...ORTAK_KIRILMAZ,
    'Immunisation: record only doses or milestones named at this visit. Do not complete a schedule from age alone.',
    'Growth: write the spoken centimetres or kilograms only. Do not invent a WHO, CDC or ANZSPED percentile.',
  ],
}

const yetiskin: AuSoapKilidi = {
  bolumler: [
    's — Presenting complaint, relevant history, regular medicines and allergies only if said.',
    'o — Examination and measurements said aloud.',
    'a — Diagnosis or impression as the clinician stated.',
    'p — Treatment, tests, advice and follow-up as said.',
  ],
  kirilmaz: ORTAK_KIRILMAZ,
}

const cerrahi: AuSoapKilidi = {
  bolumler: [
    's — Indication and history as said; consent discussion only if spoken.',
    'o — Examination and operative findings only as stated.',
    'a — Operative diagnosis or impression as stated.',
    'p — Post-operative plan, wound care and review as said. No fasting time or dose invented.',
  ],
  kirilmaz: ORTAK_KIRILMAZ,
}

const muttefik: AuSoapKilidi = {
  bolumler: [
    's — Reason for the session and history as the client reported.',
    'o — Observations and measures the professional recorded as said.',
    'a — The professional\'s own assessment as said. Make no medical diagnosis.',
    'p — Session plan and home tasks as said. No medicine dose.',
  ],
  kirilmaz: [
    ...ORTAK_KIRILMAZ,
    'This note is not a medical diagnosis. If a referring doctor\'s diagnosis was named, write it only in the field meant for it.',
  ],
}

const acil: AuSoapKilidi = {
  bolumler: [
    's — Presenting complaint, onset and relevant history as said.',
    'o — Examination, vitals and investigations said aloud.',
    'a — Working impression as stated; disposition only if said.',
    'p — Immediate actions, referral and follow-up as said. Emergency pathway only if used and named.',
  ],
  kirilmaz: ORTAK_KIRILMAZ,
}

/** Per-role locks. Keys = offered pack roles only. */
export const AU_SOAP_KILITLERI: Readonly<Record<Sunulan, AuSoapKilidi>> = {
  'emergency-medicine': acil,
  'family-medicine': {
    bolumler: [
      's — Presenting complaint, long-term conditions, regular medicines and allergies if said.',
      'o — Examination and measurements said aloud; preventive checks only if spoken.',
      'a — Impression as stated.',
      'p — Plan as said, including wellness or immunisation named at this visit only.',
    ],
    kirilmaz: [
      ...ORTAK_KIRILMAZ,
      'Immunisation and preventive activity: only what was named at this visit.',
    ],
  },
  anaesthesia: cerrahi,
  neurosurgery: cerrahi,
  'paediatric-surgery': cocuk,
  'internal-medicine': yetiskin,
  dermatology: yetiskin,
  endocrinology: yetiskin,
  'infectious-diseases': yetiskin,
  gastroenterology: yetiskin,
  'general-surgery': cerrahi,
  'respiratory-medicine': yetiskin,
  ophthalmology: yetiskin,
  'obstetrics-gynaecology': {
    bolumler: [
      's — Obstetric or gynaecology history as said; pregnancy dating only if spoken.',
      'o — Examination and measurements said aloud.',
      'a — Impression as stated.',
      'p — Plan as said. Bleeding or pain that needs emergency care is recorded only if that pathway was used and named.',
    ],
    kirilmaz: ORTAK_KIRILMAZ,
  },
  cardiology: yetiskin,
  otolaryngology: yetiskin,
  nephrology: yetiskin,
  neurology: yetiskin,
  oncology: yetiskin,
  orthopaedics: cerrahi,
  paediatrics: cocuk,
  'plastic-surgery': cerrahi,
  psychiatry: {
    bolumler: [
      's — Presenting concerns and history as said.',
      'o — Mental-state findings as stated; no score invented.',
      'a — Impression as stated. No diagnosis the clinician did not name.',
      'p — Plan as said. Safety actions only if spoken.',
    ],
    kirilmaz: ORTAK_KIRILMAZ,
  },
  radiology: {
    bolumler: [
      's — Clinical question as referred, if said.',
      'o — Technique and findings as reported.',
      'a — Impression as stated. No BI-RADS or reporting category invented.',
      'p — Recommendations as said.',
    ],
    kirilmaz: ORTAK_KIRILMAZ,
  },
  rheumatology: yetiskin,
  urology: yetiskin,
  'sports-medicine': yetiskin,
  'rehabilitation-medicine': yetiskin,
  'cardio-thoracic-surgery': cerrahi,
  'vascular-surgery': cerrahi,
  'radiation-oncology': yetiskin,
  'geriatric-medicine': yetiskin,
  'immunology-and-allergy': yetiskin,
  haematology: yetiskin,
  'pain-medicine': yetiskin,
  'aesthetic-surgery': cerrahi,
  'aesthetic-medicine': yetiskin,
  physiotherapy: muttefik,
  'clinical-psychology': muttefik,
  dietetics: {
    bolumler: [
      's — Reason for dietetic care and dietary history as the client reported; who spoke if a carer gave history.',
      'o — Weights, intake observations, MST score if assessed, IDDSI levels if recorded — only as said or measured at the visit.',
      'a — The dietitian\'s own nutrition assessment as said. Make no medical diagnosis; if a referring doctor\'s diagnosis was named, write it only in the field meant for it.',
      'p — Nutrition goals, texture advice, estimated energy/protein factors discussed, and follow-up as said. No medicine dose.',
    ],
    kirilmaz: [
      ...ORTAK_KIRILMAZ,
      'This note is not a medical diagnosis. If a referring doctor\'s diagnosis was named, write it only in the field meant for it.',
      'Do not invent an MST score, IDDSI level, kilojoule target or protein target that was not assessed or agreed at the visit.',
      'Energy is discussed in kilojoules when numbers are used. Do not convert units.',
    ],
  },
  'occupational-therapy': muttefik,
  audiology: muttefik,
  podiatry: muttefik,
  'speech-pathology': muttefik,
}

/** Prompt block appended to the visit-note instruction for this role. null = unknown role. */
export function auSoapKilidi(rol: string): string | null {
  if (!Object.prototype.hasOwnProperty.call(AU_SOAP_KILITLERI, rol)) return null
  const k = AU_SOAP_KILITLERI[rol as Sunulan]
  return [
    '=== AUSTRALIAN SOAP LOCK (this role) ===',
    'SECTIONS FOR THIS ROLE',
    ...k.bolumler,
    'UNBREAKABLE RULES',
    ...k.kirilmaz.map((x, i) => `${i + 1}. ${x}`),
  ].join('\n')
}
