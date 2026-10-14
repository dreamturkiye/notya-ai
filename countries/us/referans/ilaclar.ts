/**
 * UNITED STATES — 250 drugs by Medicare Part D claims in 2024.
 * Rows are ./ilaclar.json, taken from the CMS data API on 14 October 2026.
 * No strength, no dosage form, no controlled-substance schedule, no dose.
 * Not an all-payer ranking.
 */
import ham from './ilaclar.json'

export type UsIlac = {
  rank: number
  generic: string
  brand: string | null
  strength: null
  form: null
  presentation: string
  schedule: null
  subsidy: string
  count: number
}

export const US_ILAC_KAYIT = {
  retrieved: ham.retrieved,
  sourceName: ham.source_name,
  sourceUrl: ham.source_url,
  portalUrl: ham.portal_url,
  licence: ham.licence,
  licenceUrl: ham.licence_url,
  year: ham.year,
  whatIsCounted: ham.what_is_counted,
} as const

export const US_ILACLAR: readonly UsIlac[] = ham.rows

export const usIlacAnahtari = (rank: number): string => `sira_${String(rank).padStart(3, '0')}`

export function usIlacBul(anahtar: unknown): UsIlac | null {
  if (typeof anahtar !== 'string') return null
  return US_ILACLAR.find((r) => usIlacAnahtari(r.rank) === anahtar) ?? null
}

/** One sentence. The claim count is not in it. */
export function usIlacCumlesi(r: UsIlac): string {
  const etiket = r.brand ? ` Source row label: ${r.brand}.` : ''
  return `${r.generic}.${etiket} ${r.subsidy}. This table states no strength, no dosage form, and no controlled-substance schedule.`
}
