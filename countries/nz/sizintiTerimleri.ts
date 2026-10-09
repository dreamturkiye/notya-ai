/**
 * NOTYA-ULKE-EN-01 — terms that mark content as New Zealand's. Hunted in every OTHER country's screens by the
 * leak harness (lib/ulke/testing/sizintiTarayici.ts) — the other English-speaking countries included: nothing of
 * New Zealand may show in a build for the United Kingdom, the United States, Canada or Australia.
 * Only terms that are this country's alone: a word the English-speaking countries share (a currency sign, an
 * emergency number, a specialty name several of them use) marks nothing and is not listed.
 * Tests and scripts only (through countries/tumu.ts), never the running application.
 */
import type { SizintiTerimi } from '@/lib/ulke/tipler'

const parca = (terim: string): SizintiTerimi => ({ terim, eslesme: 'parca' })
const KELIME = (terim: string): SizintiTerimi => ({ terim, eslesme: 'kelime', buyukKucukDuyarli: true })

export const NZ_SIZINTI_TERIMLERI: readonly SizintiTerimi[] = [
  KELIME('NZD'), KELIME('NHI'), parca('New Zealand'), parca('Medsafe'), parca('Aotearoa'),
]

/** English is written in plain Latin letters: no letter marks this country. */
export const NZ_SIZINTI_HARFLERI = ''
