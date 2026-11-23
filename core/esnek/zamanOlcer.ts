/**
 * ESNEK-MUAYENE-B7 — time meter (pure, honest numbers only).
 *   "Bugün N hasta · dokümantasyon X dk (önce Y dk) · kazanç Z dk" + a weekly summary.
 * X = documentation time Notya MEASURED on its own screens (Phase A AktifSure records). Y = the baseline × N patients, from
 * the best baseline available, and the line says which one it is:
 *   1. golge_olculen — the secretary's typing time measured in shadow mode (≥ 5 notes typed in Notya's shadow box);
 *   2. golge_beyan   — minutes the secretary declared per note in shadow mode (≥ 5 notes), labelled as declared;
 *   3. hekim         — the baseline the doctor entered himself (Phase A setting).
 * Without a baseline: no "önce", no gain. A gain is never invented, never rounded up.
 */
import { gunlukOzet, type GunlukOzet, type SureKaydi } from '@/core/elNotu/zaman'
import { medyan } from './metinAraclari'

export type TabanKaynagi = 'golge_olculen' | 'golge_beyan' | 'hekim'
export type Taban = { dk: number; kaynak: TabanKaynagi; not: number }
export const TABAN_ASGARI_NOT = 5

export function tabanSec(g: { golgeOlculenMs: number[]; golgeBeyanDk: number[]; hekimDk: number | null }): Taban | null {
  const olculen = g.golgeOlculenMs.filter((x) => x > 0 && x <= 3600000)
  if (olculen.length >= TABAN_ASGARI_NOT) return { dk: Math.round((medyan(olculen)! / 60000) * 10) / 10, kaynak: 'golge_olculen', not: olculen.length }
  const beyan = g.golgeBeyanDk.filter((x) => x > 0 && x <= 120)
  if (beyan.length >= TABAN_ASGARI_NOT) return { dk: Math.round(medyan(beyan)! * 10) / 10, kaynak: 'golge_beyan', not: beyan.length }
  if (g.hekimDk && g.hekimDk > 0) return { dk: g.hekimDk, kaynak: 'hekim', not: 0 }
  return null
}

export type ZamanOzeti = GunlukOzet & { onceDk: number | null; taban: Taban | null }

/** One period (a day or a week): patients and measured minutes from the records, "önce" and gain from the baseline. */
export function donemOzeti(kayitlar: SureKaydi[], taban: Taban | null): ZamanOzeti {
  const o = gunlukOzet(kayitlar, taban?.dk ?? null)
  const onceDk = taban && o.hasta ? Math.round(taban.dk * o.hasta * 10) / 10 : null
  return { ...o, onceDk, taban }
}

export type ZamanKelimeleri = { bugun: string; buHafta: string; hasta: string; dokumantasyon: string; once: string; kazanc: string; dk: string; ondalik: string }

const sayi = (n: number, ondalik: string) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ondalik))

/** "Bugün N hasta · dokümantasyon X dk (önce Y dk) · kazanç Z dk" — null on a period with no measured patient. */
export function zamanSatiri(o: ZamanOzeti, k: ZamanKelimeleri, donem: 'gun' | 'hafta' = 'gun'): string | null {
  if (!o.hasta) return null
  const bas = donem === 'gun' ? k.bugun : k.buHafta
  const dok = `${k.dokumantasyon} ${sayi(o.dokumantasyonDk, k.ondalik)} ${k.dk}${o.onceDk !== null ? ` (${k.once} ${sayi(o.onceDk, k.ondalik)} ${k.dk})` : ''}`
  const parca = [`${bas} ${o.hasta} ${k.hasta}`, dok]
  if (o.kazancDk !== null && o.onceDk !== null) parca.push(`${k.kazanc} ${sayi(o.kazancDk, k.ondalik)} ${k.dk}`)
  return parca.join(' · ')
}

/** Last 7 local days, oldest first, each day's summary (for the weekly list). */
export function haftalikOzet(kayitlar: (SureKaydi & { gun: string })[], gunler: string[], taban: Taban | null): { gun: string; ozet: ZamanOzeti }[] {
  return gunler.map((gun) => ({ gun, ozet: donemOzeti(kayitlar.filter((k) => k.gun === gun), taban) }))
}

/** The week = the sum of its days (a patient seen on two days is two documented visits). */
export function toplamOzet(gunler: ZamanOzeti[], taban: Taban | null): ZamanOzeti {
  const r = (n: number) => Math.round(n * 10) / 10
  const hasta = gunler.reduce((a, g) => a + g.hasta, 0)
  const dk = r(gunler.reduce((a, g) => a + g.dokumantasyonDk, 0))
  const onceDk = taban && hasta ? r(taban.dk * hasta) : null
  return { hasta, dokumantasyonDk: dk, tabanDk: taban?.dk ?? null, kazancDk: onceDk !== null ? r(onceDk - dk) : null, onceDk, taban }
}
