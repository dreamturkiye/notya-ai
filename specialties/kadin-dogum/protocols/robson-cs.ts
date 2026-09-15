/**
 * Robson group fields at birth. VBAC counseling checklist + consent.
 * SB cesarean-rate pressure is a counseling note, not a clinical veto.
 */
export type RobsonFields = {
  group: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  nulliparous: boolean
  singleton_cephalic: boolean
  term: boolean
  spontaneous_labor: boolean
  prior_cs: boolean
}

export const VBAC_COUNSELING = [
  'uterine rupture signs',
  'success likelihood counseling',
  'consent documented',
  'SB CS-rate note is counseling not a veto',
] as const

export function robsonNote(fields: RobsonFields): { group: number; vbac: boolean; counseling: readonly string[] } {
  return {
    group: fields.group,
    vbac: fields.prior_cs,
    counseling: fields.prior_cs ? VBAC_COUNSELING : ['primary CS indication'],
  }
}
