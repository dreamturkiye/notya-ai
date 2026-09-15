/**
 * Stillbirth / viability. e-Doğum if live birth OR stillbirth ≥22w OR ≥500g.
 * Workup checklist stub. Maternal death / near-miss is a field map only.
 */
export function eDogumRequired(input: {
  live_birth: boolean
  stillbirth?: boolean
  ga_weeks?: number
  weight_g?: number
}): boolean {
  if (input.live_birth) return true
  if (!input.stillbirth) return false
  return (input.ga_weeks ?? 0) >= 22 || (input.weight_g ?? 0) >= 500
}

export const STILLBIRTH_WORKUP_STUB = [
  'autopsy offer',
  'karyotype / microarray offer',
  'TORCH / APL labs',
  'placenta pathology',
] as const

export const MATERNAL_NEAR_MISS_FIELDS = ['notification_id', 'icu', 'transfusion', 'hysterectomy'] as const
