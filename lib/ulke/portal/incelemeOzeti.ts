/**
 * Latest clinical-review “next review” date from kept Araçlar results.
 * Pure shaping — pack supplies which review tool key(s) to look for.
 */
import type { AracKaydi } from '../araclar/kayitTipleri'

export type IncelemeOzeti = {
  arac: string
  seans: string | null
  sonraki: string
}

/**
 * Newest completed review result that carries a `sonraki` date.
 * `kayitlar` newest-first (as `hastaninAracKayitlari` returns).
 */
export function portalIncelemeOzeti(
  kayitlar: readonly AracKaydi[],
  incelemeAraclari: readonly string[],
): IncelemeOzeti | null {
  if (!incelemeAraclari.length) return null
  const set = new Set(incelemeAraclari)
  for (const k of kayitlar) {
    if (!set.has(k.arac) || !k.sonuc?.tamam) continue
    const sonraki = k.sonuc.tarihler?.find((t) => t.anahtar === 'sonraki')?.tarih
    if (!sonraki || typeof sonraki !== 'string') continue
    const seans = typeof k.girdiler?.seans === 'string' ? k.girdiler.seans : null
    return { arac: k.arac, seans, sonraki }
  }
  return null
}
