/**
 * AU-ARAC-GORUNUM-01 — THE GROWTH CHART, as a plot rather than a list of past numbers: pure functions over the
 * kit's own `buyume-persentili` tool (./tanimlar/buyumePersentili.ts) and a patient's kept results of it.
 *
 * NO NEW CLINICAL CONTENT: the percentile curves are `lib/clinical/buyumeEgrisi.ts`'s own `lmsEgrileri`, the SAME
 * table-agnostic function the Turkish build's own growth-chart studio already uses for its WHO option, applied to
 * the SAME WHO Child Growth Standards / Growth Reference tables (`lib/clinical/whoBuyumeLms.ts`) the kit's
 * `buyume-persentili` tool already cites — one copy of the WHO numbers and the LMS maths in the whole product,
 * reused here a third time (the tool's own percentile, the equivalence test, and now this chart), never a second
 * source to drift from. International, not country-specific; this file is kit-level and may serve any pack that
 * switches `buyume-persentili` on (lib/ulke/araclar/katalog.ts already lists it as one of the kit's own).
 */
import { lmsEgrileri, type EgriSerisi } from '@/lib/clinical/lmsCekirdek'
import { WHO_LMS, WHO_UST_AY } from '@/lib/clinical/whoBuyumeLms'
import type { AracKaydi } from './kayitTipleri'
import { BUYUME_PARAMETRELERI, type BuyumeParametresi } from './tanimlar/buyumePersentili'

/** The arac key the growth-chart studio reads. Not exported as a literal elsewhere: kept in one place. */
export const BUYUME_PERSENTILI_ANAHTARI = 'buyume-persentili'

export type BuyumeNoktasi = { ay: number; deger: number; tarih: string }

/** The field this tool's form uses for the typed value of each parameter (./tanimlar/buyumePersentili.ts). */
const DEGER_ALANI: Readonly<Record<BuyumeParametresi, string>> = { kilo: 'deger_kilo', boy: 'deger_boy', basCevresi: 'deger_bas' }

/** This one patient's own measurements of ONE parameter, oldest first, from every kept result of the tool. */
export function buyumeNoktalari(kayitlar: readonly AracKaydi[], parametre: BuyumeParametresi): BuyumeNoktasi[] {
  const noktalar: BuyumeNoktasi[] = []
  for (const k of kayitlar) {
    if (k.arac !== BUYUME_PERSENTILI_ANAHTARI || !k.girdiler || !k.sonuc?.tamam) continue
    if (k.girdiler.parametre !== parametre) continue
    const deger = k.girdiler[DEGER_ALANI[parametre]]
    const ay = k.sonuc.sayilar.find((s) => s.anahtar === 'ay')?.deger
    const olcumTarihi = typeof k.girdiler.olcum_tarihi === 'string' ? k.girdiler.olcum_tarihi : null
    if (typeof deger === 'number' && typeof ay === 'number' && olcumTarihi) noktalar.push({ ay, deger, tarih: olcumTarihi })
  }
  return noktalar.sort((a, b) => a.ay - b.ay)
}

/** This one patient's sex, from the most recent kept result that states one (the tool asks every time; it is not stored on the patient by this chart). */
export function buyumeCinsiyeti(kayitlar: readonly AracKaydi[]): 'male' | 'female' | null {
  for (let i = kayitlar.length - 1; i >= 0; i--) {
    const c = kayitlar[i].girdiler?.cinsiyet
    if (c === 'male' || c === 'female') return c
  }
  return null
}

/** The WHO standard's own percentile bands for one parameter and sex, up to the age the tool's own table covers (or the oldest measurement, if later). */
export function buyumeEgrileriWho(parametre: BuyumeParametresi, cinsiyet: 'male' | 'female', enAzUstSinirAy = 0): EgriSerisi[] {
  const ustSinir = Math.min(228, Math.max(WHO_UST_AY[parametre], enAzUstSinirAy))
  // WHO_LMS stores each row as a tuple [ay, L, M, S] (one copy of the WHO numbers, read once); lmsEgrileri takes the
  // kit's own LMSNokta object shape — the exact mapping buyumePersentili.ts already does for the same table.
  const tablo = [...WHO_LMS[parametre][cinsiyet]].map(([ay, L, M, S]) => ({ ay, L, M, S }))
  return lmsEgrileri(tablo, ustSinir)
}

export { BUYUME_PARAMETRELERI }
export type { BuyumeParametresi }
