/**
 * NOTYA-ULKE-EN-01 — terms that mark content as Australia's. Hunted in every OTHER country's screens by the
 * leak harness (lib/ulke/testing/sizintiTarayici.ts) — the other English-speaking countries included: nothing of
 * Australia may show in a build for the United Kingdom, the United States, Canada or New Zealand.
 * Only terms that are this country's alone: a word the English-speaking countries share (a currency sign, an
 * emergency number, a specialty name several of them use) marks nothing and is not listed.
 * Tests and scripts only (through countries/tumu.ts), never the running application.
 */
import type { SizintiTerimi } from '@/lib/ulke/tipler'

const parca = (terim: string): SizintiTerimi => ({ terim, eslesme: 'parca' })
const KELIME = (terim: string): SizintiTerimi => ({ terim, eslesme: 'kelime', buyukKucukDuyarli: true })

export const AU_SIZINTI_TERIMLERI: readonly SizintiTerimi[] = [
  KELIME('AHPRA'), parca('Australia'), parca('Medicare'), parca('My Health Record'), parca('Respiratory and sleep medicine'),
]

/** English is written in plain Latin letters: no letter marks this country. */
export const AU_SIZINTI_HARFLERI = ''
