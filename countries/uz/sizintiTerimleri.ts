/**
 * NOTYA-ULKE-01 — terms that mark content as Uzbekistan's. Declared here, hunted in every OTHER country's output by
 * lib/ulke/testing/sizintiTarayici.ts (checklist rule 7). Not part of the runtime pack: only tests and scripts read it
 * (through countries/tumu.ts). Starts small; grows with the pack (state systems, payers, references — checklist B, C).
 */
import type { SizintiTerimi } from '@/lib/ulke/tipler'

const parca = (terim: string): SizintiTerimi => ({ terim, eslesme: 'parca' })
const KELIME = (terim: string): SizintiTerimi => ({ terim, eslesme: 'kelime', buyukKucukDuyarli: true })

export const UZ_SIZINTI_TERIMLERI: readonly SizintiTerimi[] = [
  KELIME('DMED'), KELIME('JSHSHIR'), KELIME('PINFL'), parca('ПИНФЛ'), KELIME('UZS'), KELIME('SSV'),
  parca('soʻm'), parca("so'm"), parca('сўм'),
  parca('Sogʻliqni saqlash vazirligi'), parca("Sog'liqni saqlash vazirligi"), parca('Соғлиқни сақлаш вазирлиги'),
  parca('Oʻzbekiston'), parca("O'zbekiston"), parca('Ўзбекистон'), parca('Узбекистан'), parca('Uzbekistan'),
  parca('Toshkent'), parca('Ташкент'),
]

/** U+02BB of oʻ / gʻ and the Cyrillic letters only Uzbek uses. A proxy, stated as one. */
export const UZ_SIZINTI_HARFLERI = 'ʻўқғҳЎҚҒҲ'
