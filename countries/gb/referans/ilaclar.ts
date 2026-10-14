/**
 * UNITED KINGDOM — the 250 most-dispensed medicine chemicals in England, 2025/26.
 * Rows are the file ./ilaclar.json, taken from the NHSBSA national summary workbook on 14 October 2026.
 * No dose. No controlled-drug schedule (the workbook does not state one). Not the full BNF.
 */
import ham from './ilaclar.json'

export type GbIlac = {
  rank: number
  generic: string
  brand: string | null
  strength: null
  form: string
  presentation: string
  schedule: null
  subsidy: string
  count: number
  code: string
  chapter: string
}

export const GB_ILAC_KAYIT = {
  retrieved: ham.retrieved,
  sourceName: ham.source_name,
  sourceUrl: ham.source_url,
  portalUrl: ham.portal_url,
  licence: ham.licence,
  year: ham.year,
  whatIsCounted: ham.what_is_counted,
} as const

export const GB_ILACLAR: readonly GbIlac[] = ham.rows

/** Option and band key for one row. Rank order, three digits. */
export const gbIlacAnahtari = (rank: number): string => `sira_${String(rank).padStart(3, '0')}`

export function gbIlacBul(anahtar: unknown): GbIlac | null {
  if (typeof anahtar !== 'string') return null
  return GB_ILACLAR.find((r) => gbIlacAnahtari(r.rank) === anahtar) ?? null
}

/** One sentence a doctor can read. The national item count is not in it. */
export function gbIlacCumlesi(r: GbIlac): string {
  return `${r.presentation}. Unit of measure on the source table: ${r.form}. ${r.subsidy}. This table states no controlled-drug schedule and no dose.`
}
