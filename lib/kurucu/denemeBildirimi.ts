/**
 * DENEME-BILDIRIM-01 (Kaan, 2026-11-07) — "Tell Kaan when someone signs up for a free trial." The SAME file on main and on
 * every release branch: who is left out, the e-mail's words, and the send.
 *
 * When: the moment a new doctor's specialty is FIRST set (Türkiye: POST /api/users/profile or /api/users/brans; country
 * builds: the role written by /api/ulke/kayit or /api/ulke/rol). Every path reaches that moment, including an account made
 * through the auth service directly, because the app refuses to open until a specialty is chosen. Exactly once per account:
 * the caller claims a database flag atomically (update … where flag is null) before anything is sent.
 *
 * Never in a doctor's way: the work runs after the response (arkaPlanda), every failure is caught and logged, and the
 * send has its own 10-second timeout. No patient data exists at this moment, and none is read.
 *
 * Sender (DENEME-BILDIRIM-02, Kaan, 2026-11-08 — no Resend): Kaan's own mailbox kaan@notya.io (Purelymail, covered by
 * notya.io's SPF/DKIM), over SMTP, from the Türkiye project ONLY (lib/kurucu/smtpGonder.ts, main only). The mailbox
 * password lives in one Vercel project (notya-ai, SMTP_PASS). A country build never sends mail itself: it POSTs the alert
 * payload below to Türkiye's /api/internal/signup-notify, signed with FOUNDER_STATS_SECRET (lib/kurucu/imza.ts,
 * govdeImzaUret), and Türkiye sends it. Until SMTP_PASS exists the send is a logged no-op; the flag is still claimed, so
 * the count stays right.
 */

export const BILDIRIM_ALICISI = 'kaan@notya.io'

/** DENEME-BILDIRIM-02 — where a country build posts its alert, and the purpose its signature is bound to. */
export const TR_SIGNUP_NOTIFY_URL = 'https://www.notya.io/api/internal/signup-notify'
export const SIGNUP_NOTIFY_AMAC = 'signup-notify'

/** Kaan's own test account: never notified, never counted (it is listed as a test account in the console). */
export const KAAN_TEST_EPOSTASI = 'kaanari@mac.com'

/** The founder allowlist (FOUNDER_EMAILS, comma-separated; default kaan@notya.io). */
export function kurucuEpostalari(ham: string | undefined = process.env.FOUNDER_EMAILS): string[] {
  const liste = String(ham ?? '').split(',').map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@'))
  return liste.length ? liste : [BILDIRIM_ALICISI]
}

/** true = this address is never notified and never counted: Kaan's test account and the founders themselves. */
export function bildirimDisiMi(eposta: unknown, kurucular: readonly string[] = kurucuEpostalari()): boolean {
  const e = typeof eposta === 'string' ? eposta.trim().toLowerCase() : ''
  if (!e) return true
  return e === KAAN_TEST_EPOSTASI || kurucular.includes(e)
}

export type BildirimUlkesi = 'tr' | 'us' | 'gb' | 'ca' | 'au' | 'nz' | 'uz'

/** Türkiye time for TR, US Eastern for every other build (Kaan, 2026-11-07). */
export function bildirimSaatDilimi(ulke: string): string {
  return ulke === 'tr' ? 'Europe/Istanbul' : 'America/New_York'
}

/** The words of the e-mail. English here; Türkiye passes its Turkish words (lib/kurucu/trBildirimMetni.ts, main only). */
export type BildirimSozlugu = {
  yerel: string
  saatEki: string
  konu: (ulke: string, brans: string) => string
  yok: string
  plan: { paid: string; paidPending: string; trial: string; bekleyenEki: string }
  etiket: { ad: string; eposta: string; telefon: string; brans: string; ulke: string; plan: string; zaman: string; toplam: (ulke: string) => string }
  altBilgi: string
}

export const EN_SOZLUK: BildirimSozlugu = {
  yerel: 'en-US',
  saatEki: 'US Eastern',
  konu: (ulke, brans) => `New trial signup — ${ulke} — ${brans}`,
  yok: 'not given',
  plan: { paid: 'Paid', paidPending: 'Paid plan chosen', trial: 'Free trial', bekleyenEki: ', checkout not completed yet' },
  etiket: { ad: 'Name', eposta: 'Email', telefon: 'Phone', brans: 'Specialty', ulke: 'Country', plan: 'Plan', zaman: 'Signed up', toplam: (u) => `Total doctor signups (${u}, incl. this one)` },
  altBilgi: 'Notya internal notification. Contains no patient data.',
}

export function bildirimZamani(ulke: string, an: Date, sozluk: BildirimSozlugu = EN_SOZLUK): string {
  const bicim = new Intl.DateTimeFormat(sozluk.yerel, {
    timeZone: bildirimSaatDilimi(ulke), year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(an)
  return `${bicim} (${sozluk.saatEki})`
}

export type DenemeKaydi = {
  ulke: BildirimUlkesi
  ad: string
  eposta: string
  telefon?: string | null
  bransEtiketi: string
  /** 'trial', 'paid', or 'paid-pending' (a paid plan was chosen at sign-up; checkout not completed yet). */
  plan: 'trial' | 'paid' | 'paid-pending'
  planAnahtari?: string | null
  zaman: Date
  /** Doctor sign-ups recorded in this country so far, this one included. */
  toplam: number
}

const kacis = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
const tekSatir = (s: string, azami = 120) => s.replace(/[\r\n\t]+/g, ' ').trim().slice(0, azami)

export function bildirimEpostasi(k: DenemeKaydi, sozluk: BildirimSozlugu = EN_SOZLUK): { konu: string; metin: string; html: string } {
  const UL = k.ulke.toUpperCase()
  const brans = tekSatir(k.bransEtiketi || '—', 80)
  const konu = sozluk.konu(UL, brans)
  const ek = k.planAnahtari ? ` (${tekSatir(k.planAnahtari, 40)})` : ''
  const planMetni = k.plan === 'paid' ? `${sozluk.plan.paid}${ek}` : k.plan === 'paid-pending' ? `${sozluk.plan.paidPending}${ek}${sozluk.plan.bekleyenEki}` : sozluk.plan.trial
  const e = sozluk.etiket
  const satirlar: [string, string][] = [
    [e.ad, tekSatir(k.ad) || sozluk.yok], [e.eposta, tekSatir(k.eposta, 200)], [e.telefon, k.telefon ? tekSatir(k.telefon, 40) : sozluk.yok],
    [e.brans, brans], [e.ulke, UL], [e.plan, planMetni], [e.zaman, bildirimZamani(k.ulke, k.zaman, sozluk)], [e.toplam(UL), String(k.toplam)],
  ]
  const metin = satirlar.map(([a, b]) => `${a}: ${b}`).join('\n')
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#2b2622"><p style="font-size:16px;font-weight:bold">${kacis(konu)}</p><table cellpadding="4" style="border-collapse:collapse">${satirlar
    .map(([a, b]) => `<tr><td style="color:#6b625a;padding-right:12px">${kacis(a)}</td><td>${kacis(b)}</td></tr>`)
    .join('')}</table><p style="color:#8a8178;font-size:12px">${kacis(sozluk.altBilgi)}</p></div>`
  return { konu, metin, html }
}

/**
 * DENEME-BILDIRIM-02 — the alert payload a country build posts to Türkiye. Exactly these keys and nothing else: the
 * doctor's own account details (name, e-mail, phone, specialty), country, plan, time and the country's count. No patient
 * field can be carried: bildirimYukuCoz refuses any other key, so the Türkiye endpoint answers 404 to such a body.
 */
export const BILDIRIM_YUKU_ANAHTARLARI = ['ulke', 'ad', 'eposta', 'telefon', 'bransEtiketi', 'plan', 'planAnahtari', 'zaman', 'toplam'] as const
export type BildirimYuku = {
  ulke: Exclude<BildirimUlkesi, 'tr'>
  ad: string
  eposta: string
  telefon: string | null
  bransEtiketi: string
  plan: DenemeKaydi['plan']
  planAnahtari: string | null
  zaman: string
  toplam: number
}

const ULKE_YUKU = new Set(['us', 'gb', 'ca', 'au', 'nz', 'uz'])

export function bildirimYuku(k: DenemeKaydi): BildirimYuku {
  if (!ULKE_YUKU.has(k.ulke)) throw new Error('signup-notify is for the six country builds only')
  return {
    ulke: k.ulke as BildirimYuku['ulke'],
    ad: tekSatir(String(k.ad || '')),
    eposta: tekSatir(String(k.eposta || ''), 200),
    telefon: k.telefon ? tekSatir(k.telefon, 40) : null,
    bransEtiketi: tekSatir(k.bransEtiketi || '—', 80),
    plan: k.plan,
    planAnahtari: k.planAnahtari ? tekSatir(k.planAnahtari, 40) : null,
    zaman: k.zaman.toISOString(),
    toplam: Math.max(1, Math.floor(Number(k.toplam) || 1)),
  }
}

/** The Türkiye side: a parsed body back into a record, or null for anything that is not exactly a valid payload. */
export function bildirimYukuCoz(ham: unknown): DenemeKaydi | null {
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return null
  const o = ham as Record<string, unknown>
  const anahtarlar = Object.keys(o)
  if (anahtarlar.length !== BILDIRIM_YUKU_ANAHTARLARI.length || !anahtarlar.every((a) => (BILDIRIM_YUKU_ANAHTARLARI as readonly string[]).includes(a))) return null
  const metin = (v: unknown, azami: number) => typeof v === 'string' && v.length <= azami && !/[\r\n]/.test(v)
  const bosOlabilir = (v: unknown, azami: number) => v === null || metin(v, azami)
  if (typeof o.ulke !== 'string' || !ULKE_YUKU.has(o.ulke)) return null
  if (!metin(o.ad, 120) || !metin(o.eposta, 200) || !String(o.eposta).includes('@') || !bosOlabilir(o.telefon, 40)) return null
  if (!metin(o.bransEtiketi, 80) || !String(o.bransEtiketi).trim() || !bosOlabilir(o.planAnahtari, 40)) return null
  if (o.plan !== 'trial' && o.plan !== 'paid' && o.plan !== 'paid-pending') return null
  if (typeof o.zaman !== 'string' || o.zaman.length > 40 || !Number.isFinite(Date.parse(o.zaman))) return null
  if (typeof o.toplam !== 'number' || !Number.isInteger(o.toplam) || o.toplam < 1 || o.toplam > 1_000_000) return null
  return {
    ulke: o.ulke as BildirimUlkesi,
    ad: o.ad as string,
    eposta: o.eposta as string,
    telefon: (o.telefon as string | null) || null,
    bransEtiketi: o.bransEtiketi as string,
    plan: o.plan,
    planAnahtari: (o.planAnahtari as string | null) || null,
    zaman: new Date(o.zaman),
    toplam: o.toplam,
  }
}

/** Runs `is` after the response where the platform allows it (Vercel waitUntil); never throws into the caller. */
export function arkaPlanda(is: () => Promise<unknown>, etiket: string): void {
  const p = Promise.resolve()
    .then(is)
    .catch((e) => console.error(`[${etiket}]`, e instanceof Error ? e.message : e))
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@vercel/functions') as { waitUntil?: (x: Promise<unknown>) => void }
    if (mod.waitUntil) mod.waitUntil(p)
  } catch { /* not on Vercel: the promise simply runs */ }
}
