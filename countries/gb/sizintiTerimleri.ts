/**
 * NOTYA-ULKE-EN-01 — terms that mark content as the United Kingdom's. Hunted in every OTHER country's screens by the
 * leak harness (lib/ulke/testing/sizintiTarayici.ts) — the other English-speaking countries included: nothing of the
 * United Kingdom may show in a build for the United States, Canada, Australia or New Zealand.
 * Tests and scripts only (through countries/tumu.ts), never the running application.
 */
import type { SizintiTerimi } from '@/lib/ulke/tipler'

const parca = (terim: string): SizintiTerimi => ({ terim, eslesme: 'parca' })
const KELIME = (terim: string): SizintiTerimi => ({ terim, eslesme: 'kelime', buyukKucukDuyarli: true })

export const GB_SIZINTI_TERIMLERI: readonly SizintiTerimi[] = [
  KELIME('NHS'), KELIME('GBP'), KELIME('MHRA'), KELIME('GMC'), KELIME('CQC'), parca('£'),
  parca('United Kingdom'), parca('Great Britain'), parca('England'), parca('Scotland'), parca('Northern Ireland'),
  parca('UK time'),
  // the identifiers of Scotland and of Northern Ireland, named on this pack's patient form (audit of 2026-10-09)
  parca('CHI number'), parca('H&C number'),
]

/** English is written in plain Latin letters: no letter marks this country. */
export const GB_SIZINTI_HARFLERI = ''
