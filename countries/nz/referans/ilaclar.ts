/**
 * NEW ZEALAND — Pharmac's top 20 by prescriptions, and the first 250 community
 * chemicals of the October 2026 Pharmaceutical Schedule in file order.
 * The Schedule extract is not a volume ranking.
 */
import ust from './ust20.json'
import takvim from './takvim.json'

export type NzUst = { rank: number; generic: string; group: string; count: number }
export type NzTakvim = {
  rank: number
  generic: string
  brand: string | null
  formulation: string | null
  subsidised: boolean
  partCharge: boolean
}

export const NZ_UST_KAYIT = {
  retrieved: ust.retrieved,
  sourceName: ust.source_name,
  sourceUrl: ust.source_url,
  pageUpdated: ust.page_updated,
  year: ust.year,
  whatIsCounted: ust.what_is_counted,
} as const

export const NZ_TAKVIM_KAYIT = {
  retrieved: takvim.retrieved,
  edition: takvim.edition,
  published: takvim.published,
  sourceUrl: takvim.source_url,
  whatIsCounted: takvim.what_is_counted,
} as const

export const NZ_UST20: readonly NzUst[] = ust.rows
export const NZ_TAKVIM: readonly NzTakvim[] = takvim.rows

export const nzUstAnahtari = (rank: number): string => `ust_${String(rank).padStart(2, '0')}`
export const nzTakvimAnahtari = (rank: number): string => `sira_${String(rank).padStart(3, '0')}`

export function nzUstBul(anahtar: unknown): NzUst | null {
  if (typeof anahtar !== 'string') return null
  return NZ_UST20.find((r) => nzUstAnahtari(r.rank) === anahtar) ?? null
}

export function nzTakvimBul(anahtar: unknown): NzTakvim | null {
  if (typeof anahtar !== 'string') return null
  return NZ_TAKVIM.find((r) => nzTakvimAnahtari(r.rank) === anahtar) ?? null
}

export function nzUstCumlesi(r: NzUst): string {
  return `${r.generic}. Therapeutic group on the table: ${r.group}. Funded community prescriptions in ${NZ_UST_KAYIT.year}. This table states no strength, no brand, and no dose.`
}

export function nzTakvimCumlesi(r: NzTakvim): string {
  const form = r.formulation ? ` Formulation on this row: ${r.formulation}.` : ''
  const marka = r.brand ? ` First brand of that formulation: ${r.brand}.` : ''
  const pay = r.partCharge ? 'A part charge is printed on the pack in this row.' : 'No part charge is printed on the pack in this row.'
  return `${r.generic}.${form}${marka} ${pay} Position ${r.rank} is the order of chemical entries in the file, not a count of prescriptions. This extract states no dose and no controlled-medicine class.`
}
