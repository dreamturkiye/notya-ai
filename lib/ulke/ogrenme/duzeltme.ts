/**
 * AYSE-OGRENME-V3f — what the doctor changed in a draft, worked out the same way as Türkiye's learning momentum:
 * the shared pure analysis (lib/doktor/ogrenme/duzeltmeAnaliz.ts, no model, no database) applied to the note's four
 * sections. The count of its findings is "corrections".
 *
 * Pure. No text of any country: the sections are keyed by their section letter.
 */
import { duzeltmeAnaliz, type AlanMetinleri, type DuzeltmeAlani } from '@/lib/doktor/ogrenme/duzeltmeAnaliz'
import type { NotIcerigi } from '../tipler'

type Bolum = 's' | 'o' | 'a' | 'p'
/** The four sections of a country note and the field each is analysed as. */
export const BOLUM_ALANLARI: readonly (readonly [Bolum, DuzeltmeAlani])[] = [['s', 'subjektif'], ['o', 'objektif'], ['a', 'degerlendirme'], ['p', 'plan']]

/** The longest section text kept in the edit log (the column's own check is 20 000). */
export const KAYIT_AZAMI = 20_000

export type Duzenleme = { alan: DuzeltmeAlani; onceki: string; sonraki: string }
type Dort = Pick<NotIcerigi, Bolum>

const kes = (m: string) => String(m ?? '').slice(0, KAYIT_AZAMI)
const metinler = (n: Dort): AlanMetinleri => Object.fromEntries(BOLUM_ALANLARI.map(([b, a]) => [a, kes(n[b])])) as AlanMetinleri

/** The sections whose text differs (ignoring leading and trailing blanks), draft → approved. Nothing else is logged. */
export function duzenlemeleriBul(taslak: Dort, onayli: Dort): Duzenleme[] {
  const out: Duzenleme[] = []
  for (const [b, alan] of BOLUM_ALANLARI) {
    const onceki = kes(taslak[b])
    const sonraki = kes(onayli[b])
    if (onceki.trim() !== sonraki.trim()) out.push({ alan, onceki, sonraki })
  }
  return out
}

/** The number of corrections between the model's draft and the approved note. 0 = approved as written. */
export function duzeltmeSayisi(taslak: Dort, onayli: Dort): number {
  if (!duzenlemeleriBul(taslak, onayli).length) return 0
  return duzeltmeAnaliz(metinler(taslak), metinler(onayli)).length
}
