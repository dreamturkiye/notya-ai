import type { EvalResult } from './eval'

export const TDD_SUT_CODES = [
  { code: '700.100', label: 'dermoskopi' },
  { code: '700.170', label: 'fotokemoterapi genel' },
  { code: '700.180', label: 'lokal PUVA' },
  { code: '700.190', label: 'dbUVB' },
  { code: '700.140', label: 'koter' },
  { code: '700.270', label: 'kriyo' },
  { code: '700.280', label: 'kriyo' },
  { code: '700.210', label: 'IL enjeksiyon' },
  { code: '530.070', label: 'deri biyopsi' },
] as const

export type ProcedureKind =
  | 'punch'
  | 'shave'
  | 'incisional'
  | 'excision'
  | 'cryo_benign'
  | 'cryo_malign'
  | 'cautery'
  | 'il_injection'
  | 'nail'
  | 'iontophoresis'
  | 'prp_cosmetic'

export function evaluateProcedure(kind: ProcedureKind): EvalResult {
  const cosmetic = kind === 'prp_cosmetic'
  return {
    triage: 'routine',
    next: [
      cosmetic ? 'PRP-cosmetic often non-SUT' : 'SUT catalog stub',
      'recommend islem_oncesi + islem_sonrasi photos',
    ],
    citations: ['tdd-islem', 'sut-2026'],
    photoPlan: ['islem_oncesi', 'islem_sonrasi'],
  }
}

export function sutFor(kind: ProcedureKind): string | null {
  if (kind === 'punch' || kind === 'shave' || kind === 'incisional' || kind === 'excision') return '530.070'
  if (kind === 'cautery') return '700.140'
  if (kind === 'cryo_benign' || kind === 'cryo_malign') return '700.270'
  if (kind === 'il_injection') return '700.210'
  if (kind === 'prp_cosmetic') return null
  return null
}
