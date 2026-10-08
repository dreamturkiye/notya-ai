/**
 * NOTYA-ULKE-01 — translation mechanism: a small typed dictionary, no library.
 *
 * - Turkish is the source (countries/tr/metinler.ts). Keys live in lib/ulke/tipler.ts (YuzeyAnahtarlari).
 * - A pack carries one catalogue per switched-on language. `paketMetinleri` makes a missing key or a missing language
 *   a TYPE error, and `next build` type-checks — so it fails the build.
 * - At run time a surface or language the active pack does not carry THROWS. It never shows another language, and it
 *   can never show Turkish to a non-Turkish country: the Turkish catalogue is not in that build.
 *
 * Existing Turkish screens are not migrated yet (docs/COUNTRY-PACK-SPLIT-PLAN.md); new core screens start here.
 */
import { AKTIF_PAKET } from '@/countries/active'
import { dilSec } from './ulke'
import type { DilKodu, Yuzey, YuzeyMetinleri } from './tipler'

/** Text of one surface in one language. `dil` is narrowed to a switched-on language first (default: the pack's own). */
export function yuzeyMetinleri<Y extends Yuzey>(yuzey: Y, dil?: string | null): YuzeyMetinleri<Y> {
  const d: DilKodu = dilSec(dil)
  const katalog = AKTIF_PAKET.metinler[d]
  const metinler = katalog?.[yuzey]
  if (!metinler) {
    throw new Error(`[ulke/metin] surface "${yuzey}" has no catalogue for ${AKTIF_PAKET.kod}/${d}. No fallback to another language.`)
  }
  return metinler as YuzeyMetinleri<Y>
}

export function metin<Y extends Yuzey>(yuzey: Y, anahtar: keyof YuzeyMetinleri<Y>, dil?: string | null): string {
  const deger = yuzeyMetinleri(yuzey, dil)[anahtar]
  if (typeof deger !== 'string' || !deger.trim()) {
    throw new Error(`[ulke/metin] "${yuzey}.${String(anahtar)}" is empty for ${AKTIF_PAKET.kod}. No fallback to another language.`)
  }
  return deger
}
