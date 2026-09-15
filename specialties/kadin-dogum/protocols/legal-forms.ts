/**
 * Legal / public-system field map. Adapters only — do not fake live e-Nabız writes
 * unless a client already exists (none is wired from this folder).
 */
export type LegalForm = {
  id: string
  system: 'e-nabiz' | 'e-dogum' | 'mbys' | 'sut' | 'kvkk' | 'istirahat' | 'adli'
  event: string
  fields: string[]
}

export const LEGAL_FORMS: LegalForm[] = [
  {
    id: 'gebe-bildirimi',
    system: 'e-nabiz',
    event: 'gebe bildirimi',
    fields: ['mother_patient_id', 'sat', 'edd', 'episode_id'],
  },
  {
    id: 'gebe-izlem',
    system: 'e-nabiz',
    event: 'gebe izlem dataset',
    fields: ['izlem_no', 'BP', 'weight', 'Hb', 'urine_protein', 'FHR', 'risk', 'danger_signs'],
  },
  {
    id: 'pregnancy-outcome',
    system: 'e-nabiz',
    event: 'pregnancy outcome',
    fields: ['live', 'stillbirth', 'abortus', 'ectopic', 'medical_evacuation'],
  },
  {
    id: 'e-dogum',
    system: 'e-dogum',
    event: 'live births plus stillbirth ≥22w or ≥500g',
    fields: ['live_birth', 'stillbirth_22w_or_500g', 'apgar', 'weight'],
  },
  {
    id: 'lohusa-izlem',
    system: 'e-nabiz',
    event: 'lohusa izlem form',
    fields: ['lohusa_day', 'BP', 'bleeding', 'breastfeeding'],
  },
  {
    id: 'kuretaj-tahliye',
    system: 'adli',
    event: 'küretaj/tahliye legal packet',
    fields: ['ga_weeks_limit_10', 'indicated_board'],
  },
  {
    id: 'istirahat',
    system: 'istirahat',
    event: 'work disability',
    fields: ['birth_leave', 'milk_leave'],
  },
  {
    id: 'sut-packages',
    system: 'sut',
    event: 'SUT codes',
    fields: ['USG', 'ikili P.901.120', 'üçlü P.904.090', 'NST', 'delivery packages'],
  },
  {
    id: 'kvkk-fetal-genetic',
    system: 'kvkk',
    event: 'KVKK consents',
    fields: ['fetal_image', 'genetic_NIPT', 'karyotype'],
  },
]

export function formsForEvent(event: string): LegalForm[] {
  const needle = event.toLowerCase()
  return LEGAL_FORMS.filter((f) => f.event.toLowerCase().includes(needle) || f.id.includes(needle))
}

export function mapIzlemToEnabiz(input: {
  izlem_no: 1 | 2 | 3 | 4
  bp: string
  weight: number
  hb?: number
  urine_protein: boolean
  fhr?: number
  risk: string
  danger_signs: string[]
}): Record<string, unknown> {
  return {
    form_id: 'gebe-izlem',
    izlem_no: input.izlem_no,
    BP: input.bp,
    weight: input.weight,
    Hb: input.hb ?? null,
    urine_protein: input.urine_protein,
    FHR: input.fhr ?? null,
    risk: input.risk,
    danger_signs: input.danger_signs,
    live_write: false,
  }
}
