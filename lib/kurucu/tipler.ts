/**
 * KURUCU-KONSOL-01 (Kaan, 2026-11-07) — what a build tells the founder console about itself. The SAME file on main and
 * on every release branch, so the Türkiye console and the six country endpoints agree on one shape.
 *
 * Doctor-ACCOUNT metadata and aggregate counts only. No patient field, no note content, no patient id, no doctor id:
 * `hesapSatiriTemizle` keeps exactly the keys listed in HESAP_ALANLARI and drops everything else, and the tests assert
 * that no patient-shaped key ever leaves (hastaAlaniVarMi).
 */

export type KurucuPlan = 'trial' | 'paid'

export type KurucuHesap = {
  ad: string
  eposta: string
  /** The specialty key the account works under, or null (not chosen yet). */
  brans: string | null
  /** Its display name in the build's language, or null. */
  bransEtiketi: string | null
  plan: KurucuPlan
  onboardingTamam: boolean
  /** Whole days left in the trial, or null (no trial model in this build, or not on a trial). */
  denemeKalanGun: number | null
  bransSecildi: boolean
  /** ISO times. */
  kayit: string | null
  sonGiris: string | null
  /** Counts only. */
  not7: number
  not30: number
  muayene7: number
  muayene30: number
}

export type KurucuUlkeYaniti = {
  ulke: string
  uretildi: string
  hesaplar: KurucuHesap[]
  /** Accounts left out of every count (Kaan's own test account): e-mail only, so the console can name them. */
  testHesaplari: string[]
}

export const HESAP_ALANLARI = [
  'ad', 'eposta', 'brans', 'bransEtiketi', 'plan', 'onboardingTamam', 'denemeKalanGun', 'bransSecildi', 'kayit', 'sonGiris',
  'not7', 'not30', 'muayene7', 'muayene30',
] as const

const sayi = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)
const metin = (v: unknown, azami = 200): string => (typeof v === 'string' ? v.slice(0, azami) : '')
const metinYaDaNull = (v: unknown, azami = 200): string | null => (typeof v === 'string' && v.trim() ? v.slice(0, azami) : null)

/** Exactly the allowed keys, typed and bounded — whatever else the source row carried is dropped here. */
export function hesapSatiriTemizle(h: Record<string, unknown>): KurucuHesap {
  return {
    ad: metin(h.ad, 120),
    eposta: metin(h.eposta, 200),
    brans: metinYaDaNull(h.brans, 80),
    bransEtiketi: metinYaDaNull(h.bransEtiketi, 120),
    plan: h.plan === 'paid' ? 'paid' : 'trial',
    onboardingTamam: h.onboardingTamam === true,
    denemeKalanGun: typeof h.denemeKalanGun === 'number' && Number.isFinite(h.denemeKalanGun) ? Math.max(0, Math.floor(h.denemeKalanGun)) : null,
    bransSecildi: h.bransSecildi === true,
    kayit: metinYaDaNull(h.kayit, 40),
    sonGiris: metinYaDaNull(h.sonGiris, 40),
    not7: sayi(h.not7),
    not30: sayi(h.not30),
    muayene7: sayi(h.muayene7),
    muayene30: sayi(h.muayene30),
  }
}

export function ulkeYanitiTemizle(ulke: string, ham: unknown): KurucuUlkeYaniti | null {
  if (!ham || typeof ham !== 'object') return null
  const y = ham as Record<string, unknown>
  if (!Array.isArray(y.hesaplar)) return null
  return {
    ulke,
    uretildi: metin(y.uretildi, 40),
    hesaplar: y.hesaplar.filter((h): h is Record<string, unknown> => !!h && typeof h === 'object').slice(0, 5000).map(hesapSatiriTemizle),
    testHesaplari: Array.isArray(y.testHesaplari) ? y.testHesaplari.filter((e): e is string => typeof e === 'string').slice(0, 20).map((e) => e.slice(0, 200)) : [],
  }
}

/** Keys that would mean patient data leaked into a payload. Used by the tests on every payload shape. */
const HASTA_ANAHTARI = /patient|hasta|content_|transcript|soap|tani|diagnos|icd|ilac|recete|telefon|phone|tc_?kimlik|dogum/i

export function hastaAlaniVarMi(deger: unknown): boolean {
  if (Array.isArray(deger)) return deger.some(hastaAlaniVarMi)
  if (deger && typeof deger === 'object') {
    return Object.entries(deger as Record<string, unknown>).some(([k, v]) => HASTA_ANAHTARI.test(k) || hastaAlaniVarMi(v))
  }
  return false
}

// ───────────── summary tiles (the console) ─────────────

export type KurucuOzet = { bugun: number; yedi: number; otuz: number; aktifDeneme: number; ucGundeBitecek: number; ucretli: number; toplam: number }

export function ozetHesapla(hesaplar: readonly KurucuHesap[], simdi: number = Date.now()): KurucuOzet {
  const gun = 24 * 60 * 60 * 1000
  const once = (iso: string | null, ms: number) => !!iso && simdi - Date.parse(iso) <= ms && simdi - Date.parse(iso) >= 0
  const gunBasi = new Date(simdi)
  gunBasi.setUTCHours(0, 0, 0, 0)
  const o: KurucuOzet = { bugun: 0, yedi: 0, otuz: 0, aktifDeneme: 0, ucGundeBitecek: 0, ucretli: 0, toplam: hesaplar.length }
  for (const h of hesaplar) {
    const t = h.kayit ? Date.parse(h.kayit) : NaN
    if (Number.isFinite(t) && t >= gunBasi.getTime() && t <= simdi) o.bugun += 1
    if (once(h.kayit, 7 * gun)) o.yedi += 1
    if (once(h.kayit, 30 * gun)) o.otuz += 1
    if (h.plan === 'paid') o.ucretli += 1
    else if (h.denemeKalanGun != null && h.denemeKalanGun > 0) {
      o.aktifDeneme += 1
      if (h.denemeKalanGun <= 3) o.ucGundeBitecek += 1
    }
  }
  return o
}

/** The six country builds the console asks, with their public base (host + basePath). */
export const KURUCU_ULKELERI: readonly { ulke: string; ad: string; taban: string }[] = [
  { ulke: 'us', ad: 'US', taban: 'https://us.notya.io/us' },
  { ulke: 'gb', ad: 'GB', taban: 'https://uk.notya.io/uk' },
  { ulke: 'ca', ad: 'CA', taban: 'https://ca.notya.io/ca' },
  { ulke: 'au', ad: 'AU', taban: 'https://au.notya.io/au' },
  { ulke: 'nz', ad: 'NZ', taban: 'https://nz.notya.io/nz' },
  { ulke: 'uz', ad: 'UZ', taban: 'https://uz.notya.io/uzbek' },
]

export const KURUCU_ISTATISTIK_YOLU = '/api/internal/founder-stats'
