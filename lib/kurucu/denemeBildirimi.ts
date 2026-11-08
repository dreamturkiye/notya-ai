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
 * Sender: Resend's HTTP API (the transport already built for the demo e-mail), from a notya.io address. It switches itself
 * on when RESEND_API_KEY is set on the deployment; until then the flag is still claimed (so the count stays right) and one
 * line is logged instead of a send. Kaan creates the key: docs/OPEN-COMMITMENTS.md DENEME-BILDIRIM-01.
 */

export const BILDIRIM_ALICISI = 'kaan@notya.io'
export const BILDIRIM_GONDERENI = 'Notya <bildirim@notya.io>'
export const RESEND_URL = 'https://api.resend.com/emails'

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

export type GonderimSonucu = { durum: 'gonderildi' | 'anahtar-yok' | 'hata'; ayrinti?: string }

export async function bildirimGonder(
  e: { konu: string; metin: string; html: string },
  tekrarAnahtari: string,
  ayar: { apiAnahtari?: string; fetchFn?: typeof fetch; alici?: string } = {},
): Promise<GonderimSonucu> {
  const anahtar = ayar.apiAnahtari ?? process.env.RESEND_API_KEY
  if (!anahtar) return { durum: 'anahtar-yok' }
  const f = ayar.fetchFn ?? fetch
  try {
    const r = await f(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${anahtar}`, 'Content-Type': 'application/json', 'Idempotency-Key': tekrarAnahtari },
      body: JSON.stringify({ from: BILDIRIM_GONDERENI, to: [ayar.alici ?? BILDIRIM_ALICISI], subject: e.konu, text: e.metin, html: e.html }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
    if (!r.ok) return { durum: 'hata', ayrinti: `http ${r.status}` }
    return { durum: 'gonderildi' }
  } catch (err) {
    return { durum: 'hata', ayrinti: err instanceof Error ? err.name : 'ag' }
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
