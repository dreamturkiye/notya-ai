/**
 * NOTYA-ASISTAN-CEKIRDEK — what the chart says about vaccines, without a country's schedule.
 *
 * A row in the vaccine table was given. A dose that a note only planned, recommended or booked was not given.
 * Which dose is due next is a country's own calendar and is not decided here. Ayşe and every country assistant
 * use this split, so a change to it reaches all of them.
 */
import type { DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'

const VERILDI = new Set(['uygulandi', 'sonuclandi', 'tamamlandi'])

export interface AsiKaydi {
  /** Vaccine-table rows: recorded as given. */
  verilen: DosyaOlayi[]
  /** Mentioned in a note as planned, recommended, prescribed or deferred: not given. */
  plan: DosyaOlayi[]
}

export function asiKaydi(olaylar: DosyaOlayi[]): AsiKaydi {
  const verilen = olaylar.filter((o) => o.kaynak === 'asi')
  const plan = olaylar.filter((o) => o.tur === 'asi' && o.kaynak !== 'asi' && !VERILDI.has(o.durum))
  return { verilen, plan }
}
