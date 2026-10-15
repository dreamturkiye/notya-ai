/**
 * NOTYA-ASISTAN-CEKIRDEK — laboratory series, one grouping.
 *
 * Ayşe's lab evidence (kanit.ts → labBolumu) and every country assistant read this function. A change to which
 * rows belong together, or which row is the latest, lands once. This file does not name a vaccine schedule,
 * a specialty or a country.
 */
import type { DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'

export interface LabSerisi {
  /** Canonical key (Ferritin, Hb, …). */
  anahtar: string
  /** Oldest first, latest last. */
  olcumler: DosyaOlayi[]
}

/** One series per canonical key, in the order the keys first appear on the chart. */
export function labSerileri(olaylar: DosyaOlayi[]): LabSerisi[] {
  const seri = new Map<string, DosyaOlayi[]>()
  for (const o of olaylar) if (o.kaynak === 'lab' && o.anahtar) seri.set(o.anahtar, [...(seri.get(o.anahtar) || []), o])
  return [...seri.entries()].map(([anahtar, olcumler]) => ({ anahtar, olcumler }))
}
