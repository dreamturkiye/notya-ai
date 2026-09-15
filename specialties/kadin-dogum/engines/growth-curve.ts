/**
 * Serial fetal growth hook per fetus A/B.
 * Hadlock 1985 EFW (HC, AC, FL) is a public formula. TR nomogram is a named hook, not a copied table.
 * Do not import lib/clinical/fetalBiyometri — live INTERGROWTH tables stay in the existing engine.
 */
import type { FetusLabel, UsgMeasurements, UsgStudy } from '../protocols/usg'

export type GrowthPoint = {
  fetus: FetusLabel
  ga_weeks: number
  ga_days: number
  measurements: UsgMeasurements
  efw_g: number | null
  nomogram: 'hadlock1985' | 'tr_nomogram_hook'
}

/**
 * Hadlock 1985 three-parameter log10(EFW) = 1.326 − 0.00326*AC*FL + 0.0107*HC + 0.0438*AC + 0.158*FL
 * (HC, AC, FL in cm; EFW in grams). Returns null if any required measure is missing.
 */
export function hadlockEfwG(m: UsgMeasurements): number | null {
  if (m.HC == null || m.AC == null || m.FL == null) return null
  const hc = m.HC / 10
  const ac = m.AC / 10
  const fl = m.FL / 10
  const log10 = 1.326 - 0.00326 * ac * fl + 0.0107 * hc + 0.0438 * ac + 0.158 * fl
  return Math.round(10 ** log10)
}

/** Placeholder — Turkish clinic nomogram is selected by the specialist, not invented here. */
export function trNomogramHook(_m: UsgMeasurements): number | null {
  return null
}

export function seriesForFetus(studies: UsgStudy[], fetus: FetusLabel, nomogram: GrowthPoint['nomogram'] = 'hadlock1985'): GrowthPoint[] {
  return studies
    .filter((s) => s.fetus === fetus)
    .sort((a, b) => a.ga_weeks * 7 + a.ga_days - (b.ga_weeks * 7 + b.ga_days))
    .map((s) => ({
      fetus,
      ga_weeks: s.ga_weeks,
      ga_days: s.ga_days,
      measurements: s.measurements,
      efw_g: nomogram === 'hadlock1985' ? hadlockEfwG(s.measurements) : trNomogramHook(s.measurements),
      nomogram,
    }))
}
