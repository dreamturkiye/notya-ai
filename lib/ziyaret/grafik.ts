/**
 * ZIYARET-SAYACI-01 (Kaan, 2026-11-10) — the founder console's visitor maths, pure and tested (lib/ziyaret/ziyaret.test.ts).
 * The SAME file on main and on every release branch (only main draws the console).
 *
 * Honesty rules, enforced here and not in the screen:
 *   - nothing before the first counted day exists: no backfill, no zero-padding before counting started;
 *   - a comparison is shown only when BOTH periods are complete and fully inside the counted range — otherwise
 *     { durum: 'yetersiz' } ("not enough data yet"); a growth % against a zero base is null, never infinity;
 *   - missing days inside the counted range are zero (the counter ran and saw nobody), never interpolated.
 */
import type { KurucuHesap } from '@/lib/kurucu/tipler'
import type { ZiyaretGunu, ZiyaretHaftasi, ZiyaretOzeti, ZiyaretSirasi } from './tipler'

const GUN_MS = 24 * 60 * 60 * 1000

export function gunEkle(d: string, n: number): string {
  return new Date(Date.parse(`${d}T00:00:00Z`) + n * GUN_MS).toISOString().slice(0, 10)
}
export const gunFarki = (a: string, b: string): number => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / GUN_MS)

/** Every day from `bas` to `bit` inclusive; days absent from `gunluk` are zero. */
export function seriDoldur(gunluk: readonly ZiyaretGunu[], bas: string, bit: string): ZiyaretGunu[] {
  if (bas > bit) return []
  const m = new Map(gunluk.map((g) => [g.d, g]))
  const cikti: ZiyaretGunu[] = []
  for (let d = bas; d <= bit; d = gunEkle(d, 1)) {
    const g = m.get(d)
    cikti.push({ d, v: g?.v ?? 0, p: g?.p ?? 0 })
    if (cikti.length > 4000) break
  }
  return cikti
}

/** Trailing moving average; null until the window is full. */
export function hareketliOrtalama(degerler: readonly number[], pencere = 7): (number | null)[] {
  let toplam = 0
  return degerler.map((v, i) => {
    toplam += v
    if (i >= pencere) toplam -= degerler[i - pencere]
    return i >= pencere - 1 ? toplam / pencere : null
  })
}

export function kumulatif(degerler: readonly number[]): number[] {
  let t = 0
  return degerler.map((v) => (t += v))
}

const toplaGun = (gunluk: readonly ZiyaretGunu[], bas: string, bit: string) =>
  gunluk.reduce((t, g) => (g.d >= bas && g.d <= bit ? { v: t.v + g.v, p: t.p + g.p } : t), { v: 0, p: 0 })

export type Kiyas =
  | { durum: 'yetersiz' }
  | { durum: 'tamam'; bu: number; onceki: number; fark: number; yuzde: number | null; buBas: string; buBit: string }

export function kiyasla(bu: number, onceki: number, buBas: string, buBit: string): Kiyas {
  return { durum: 'tamam', bu, onceki, fark: bu - onceki, yuzde: onceki > 0 ? ((bu - onceki) / onceki) * 100 : null, buBas, buBit }
}

/**
 * The last `uzunluk` COMPLETE days (ending yesterday) against the `uzunluk` days before them, in unique visitors.
 * Both periods must lie fully on or after the first counted day.
 */
export function donemKiyas(ozet: Pick<ZiyaretOzeti, 'ilkGun' | 'bugun' | 'gunluk'> | null, uzunluk: number): Kiyas {
  if (!ozet || !ozet.ilkGun) return { durum: 'yetersiz' }
  const buBit = gunEkle(ozet.bugun, -1)
  const buBas = gunEkle(ozet.bugun, -uzunluk)
  const oncekiBas = gunEkle(ozet.bugun, -2 * uzunluk)
  const oncekiBit = gunEkle(ozet.bugun, -uzunluk - 1)
  if (ozet.ilkGun > oncekiBas) return { durum: 'yetersiz' }
  return kiyasla(toplaGun(ozet.gunluk, buBas, buBit).v, toplaGun(ozet.gunluk, oncekiBas, oncekiBit).v, buBas, buBit)
}

/** Monday (ISO week start) of a day. */
export function haftaBasi(d: string): string {
  const gun = new Date(`${d}T00:00:00Z`).getUTCDay() // 0 = Sunday
  return gunEkle(d, -((gun + 6) % 7))
}

/**
 * Week-over-week: the last complete ISO week against the one before it (the running week is never compared). Both
 * weeks must be fully counted (the first counted day is on or before the earlier week's Monday).
 */
export function haftaKiyas(ozet: Pick<ZiyaretOzeti, 'ilkGun' | 'bugun' | 'gunluk'> | null): Kiyas {
  if (!ozet || !ozet.ilkGun) return { durum: 'yetersiz' }
  const buHafta = haftaBasi(ozet.bugun)
  const sonBas = gunEkle(buHafta, -7)
  const oncekiBas = gunEkle(buHafta, -14)
  if (ozet.ilkGun > oncekiBas) return { durum: 'yetersiz' }
  return kiyasla(toplaGun(ozet.gunluk, sonBas, gunEkle(sonBas, 6)).v, toplaGun(ozet.gunluk, oncekiBas, gunEkle(oncekiBas, 6)).v, sonBas, gunEkle(sonBas, 6))
}

/** Today / yesterday / last 7 days / last 30 days (today included), unique visitors and page views. */
export function ozetKutulari(ozet: Pick<ZiyaretOzeti, 'ilkGun' | 'bugun' | 'gunluk'> | null) {
  const b = ozet?.bugun ?? new Date().toISOString().slice(0, 10)
  const g = ozet?.gunluk ?? []
  return {
    bugun: toplaGun(g, b, b),
    dun: toplaGun(g, gunEkle(b, -1), gunEkle(b, -1)),
    yedi: toplaGun(g, gunEkle(b, -6), b),
    otuz: toplaGun(g, gunEkle(b, -29), b),
  }
}

export type Aralik = '7' | '30' | '90' | 'hepsi'

/** First day of a range, never before counting started. */
export function aralikBasi(aralik: Aralik, ilkGun: string, bugun: string): string {
  if (aralik === 'hepsi') return ilkGun
  const b = gunEkle(bugun, -(Number(aralik) - 1))
  return b < ilkGun ? ilkGun : b
}

function birlestirSira(listeler: readonly (readonly ZiyaretSirasi[])[], azami: number, siralama: 'v' | 'p'): ZiyaretSirasi[] {
  const m = new Map<string, ZiyaretSirasi>()
  for (const l of listeler) for (const s of l) {
    const o = m.get(s.ad) || { ad: s.ad, v: 0, p: 0 }
    o.v += s.v
    o.p += s.p
    m.set(s.ad, o)
  }
  return [...m.values()].sort((a, b) => b[siralama] - a[siralama] || a.ad.localeCompare(b.ad)).slice(0, azami)
}

/**
 * All builds together: days and weeks summed. Different hosts hash differently, so a person who visits two country
 * sites is two visitors here — the total is the sum of the builds, said so on the screen.
 */
export function toplamOzet(ozetler: readonly (ZiyaretOzeti | null | undefined)[]): ZiyaretOzeti | null {
  const var_ = ozetler.filter((o): o is ZiyaretOzeti => !!o && !!o.ilkGun)
  const bugunler = ozetler.filter((o): o is ZiyaretOzeti => !!o).map((o) => o.bugun).sort()
  if (!var_.length) return bugunler.length ? { ilkGun: null, bugun: bugunler[bugunler.length - 1], gunluk: [], haftalik: [], sayfalar: [], kaynaklar: [], cihazlar: [] } : null
  const ilkGun = var_.map((o) => o.ilkGun as string).sort()[0]
  const bugun = bugunler[bugunler.length - 1]
  const gun = new Map<string, ZiyaretGunu>()
  for (const o of var_) for (const g of o.gunluk) {
    const x = gun.get(g.d) || { d: g.d, v: 0, p: 0 }
    x.v += g.v
    x.p += g.p
    gun.set(g.d, x)
  }
  const hafta = new Map<string, ZiyaretHaftasi>()
  for (const o of var_) for (const h of o.haftalik) {
    const x = hafta.get(h.w) || { w: h.w, bas: h.bas, v: 0, p: 0 }
    x.v += h.v
    x.p += h.p
    hafta.set(h.w, x)
  }
  return {
    ilkGun,
    bugun,
    gunluk: seriDoldur([...gun.values()], ilkGun, bugun),
    haftalik: [...hafta.values()].sort((a, b) => a.bas.localeCompare(b.bas)),
    sayfalar: birlestirSira(var_.map((o) => o.sayfalar), 10, 'p'),
    kaynaklar: birlestirSira(var_.map((o) => o.kaynaklar), 10, 'v'),
    cihazlar: birlestirSira(var_.map((o) => o.cihazlar), 3, 'v'),
  }
}

/** Signups per day: k = accounts created that day, t = of those, accounts that started a trial (or are paid). */
export type KayitGunu = { d: string; k: number; t: number }

export function kayitGunlugu(hesaplar: readonly Pick<KurucuHesap, 'kayit' | 'plan' | 'denemeKalanGun'>[]): KayitGunu[] {
  const m = new Map<string, KayitGunu>()
  for (const h of hesaplar) {
    if (!h.kayit || !Number.isFinite(Date.parse(h.kayit))) continue
    const d = new Date(h.kayit).toISOString().slice(0, 10)
    const x = m.get(d) || { d, k: 0, t: 0 }
    x.k += 1
    if (h.plan === 'paid' || h.denemeKalanGun !== null) x.t += 1
    m.set(d, x)
  }
  return [...m.values()].sort((a, b) => a.d.localeCompare(b.d))
}

export function kayitGunluguBirlestir(listeler: readonly (readonly KayitGunu[])[]): KayitGunu[] {
  const m = new Map<string, KayitGunu>()
  for (const l of listeler) for (const g of l) {
    const x = m.get(g.d) || { d: g.d, k: 0, t: 0 }
    x.k += g.k
    x.t += g.t
    m.set(g.d, x)
  }
  return [...m.values()].sort((a, b) => a.d.localeCompare(b.d))
}

/** Visitors → signups → trials over [bas, bit], with conversion %; a % over a zero base is null. */
export function huni(gunluk: readonly ZiyaretGunu[], kayitlar: readonly KayitGunu[], bas: string, bit: string) {
  const ziyaretci = toplaGun(gunluk, bas, bit).v
  let kayit = 0
  let deneme = 0
  for (const g of kayitlar) if (g.d >= bas && g.d <= bit) { kayit += g.k; deneme += g.t }
  const yuzde = (a: number, b: number) => (b > 0 ? (a / b) * 100 : null)
  return { ziyaretci, kayit, deneme, kayitOrani: yuzde(kayit, ziyaretci), denemeOrani: yuzde(deneme, kayit) }
}
