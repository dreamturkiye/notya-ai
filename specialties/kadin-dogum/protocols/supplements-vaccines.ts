/**
 * Pregnancy supplements and vaccines. Do not call the pediatric immunization API.
 */
export type SupplementPlan = {
  id: string
  label: string
  window: string
  notes: string
}

export const PREGNANCY_SUPPLEMENTS: SupplementPlan[] = [
  { id: 'folate', label: 'Folik asit 400–800 µg', window: 'preconception–12w', notes: '4–5 mg if NTD / valproate / DM' },
  { id: 'iron', label: 'Demir', window: 'typically 16w → 3 months postpartum', notes: 'dose by anemia; SB flowchart' },
  { id: 'vitd', label: 'D vitamini', window: 'DÖBYR flowchart', notes: 'stub — cite DÖBYR, do not invent IU' },
]

export const PREGNANCY_VACCINES: SupplementPlan[] = [
  { id: 'td', label: 'Td 1–3 doz öyküye göre', window: 'as history', notes: 'not the pediatric schedule' },
  { id: 'tdap', label: 'Tdap', window: '27–36w', notes: 'maternal pertussis' },
  { id: 'influenza', label: 'Influenza', window: 'Sep–Apr', notes: 'seasonal' },
  { id: 'anti_d', label: 'Anti-D', window: '28w + postpartum if baby Rh+ / bleed / procedure', notes: 'Rh− IDC− only' },
]

export const TERATOGEN_STUB = ['ACEI', 'statin', 'isotretinoin', 'warfarin', 'valproate'] as const

export const LACTATION_SAFETY_STUB = {
  id: 'lactation-safety',
  notes: 'Postpartum lactation safety stub — cite Temel KD / Williams; do not invent a full Hale table.',
}

export function folateDoseUg(flags: { ntd_history?: boolean; valproate?: boolean; dm?: boolean }): { min: number; max: number } {
  if (flags.ntd_history || flags.valproate || flags.dm) return { min: 4000, max: 5000 }
  return { min: 400, max: 800 }
}
