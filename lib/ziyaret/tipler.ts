/**
 * ZIYARET-SAYACI-01 (Kaan, 2026-11-10) — the shape of one build's public-site visit summary, as site_visit_stats
 * (migration 194) returns it and as the founder console receives it. The SAME file on main and on every release branch.
 *
 * Aggregates only: per day / ISO week counts, and for the last 30 days the top page paths, referrer HOSTS and the
 * device split. Nothing here can name a visitor. `ziyaretOzetiTemizle` keeps exactly these keys, typed and bounded, so
 * whatever else a database or a country answer carried is dropped.
 */

/** One UTC day: d = 'YYYY-MM-DD', v = unique visitors that day, p = page views. */
export type ZiyaretGunu = { d: string; v: number; p: number }
/** One ISO week: w = 'IYYY-Www', bas = its Monday, v = sum of the days' unique visitors, p = page views. */
export type ZiyaretHaftasi = { w: string; bas: string; v: number; p: number }
/** A ranked line: ad = page path / referrer host / device class. */
export type ZiyaretSirasi = { ad: string; v: number; p: number }

export type ZiyaretOzeti = {
  /** First UTC day with any counted visit, or null (nothing counted yet). */
  ilkGun: string | null
  bugun: string
  gunluk: ZiyaretGunu[]
  haftalik: ZiyaretHaftasi[]
  sayfalar: ZiyaretSirasi[]
  kaynaklar: ZiyaretSirasi[]
  cihazlar: ZiyaretSirasi[]
}

const GUN_BICIMI = /^\d{4}-\d{2}-\d{2}$/
const sayi = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)
const gun = (v: unknown): string | null => (typeof v === 'string' && GUN_BICIMI.test(v.slice(0, 10)) ? v.slice(0, 10) : null)
const metin = (v: unknown, azami: number): string => (typeof v === 'string' ? v.slice(0, azami) : '')

function sira(ham: unknown, azami: number): ZiyaretSirasi[] {
  return (Array.isArray(ham) ? ham : [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .slice(0, azami)
    .map((x) => ({ ad: metin(x.ad, 120), v: sayi(x.v), p: sayi(x.p) }))
}

/** Exactly the allowed keys, or null when the input is not a summary at all. */
export function ziyaretOzetiTemizle(ham: unknown): ZiyaretOzeti | null {
  if (!ham || typeof ham !== 'object') return null
  const y = ham as Record<string, unknown>
  const bugun = gun(y.bugun)
  if (!bugun || !Array.isArray(y.gunluk)) return null
  const gunluk: ZiyaretGunu[] = []
  for (const g of (y.gunluk as unknown[]).slice(-3700)) {
    if (!g || typeof g !== 'object') continue
    const d = gun((g as Record<string, unknown>).d)
    if (d) gunluk.push({ d, v: sayi((g as Record<string, unknown>).v), p: sayi((g as Record<string, unknown>).p) })
  }
  const haftalik: ZiyaretHaftasi[] = []
  for (const h of (Array.isArray(y.haftalik) ? y.haftalik : []).slice(-600) as unknown[]) {
    if (!h || typeof h !== 'object') continue
    const r = h as Record<string, unknown>
    const bas = gun(r.bas)
    if (bas && typeof r.w === 'string' && /^\d{4}-W\d{2}$/.test(r.w)) haftalik.push({ w: r.w, bas, v: sayi(r.v), p: sayi(r.p) })
  }
  return {
    ilkGun: gun(y.ilkGun),
    bugun,
    gunluk,
    haftalik,
    sayfalar: sira(y.sayfalar, 10),
    kaynaklar: sira(y.kaynaklar, 10),
    cihazlar: sira(y.cihazlar, 3),
  }
}
