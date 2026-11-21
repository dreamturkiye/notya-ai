/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — where a doctor / secretary / Notya Klinik user goes when the session can no
 * longer be renewed, and how they come back. Pure: no window, no storage — the login pages, the session redirect
 * and the tests all use the same three functions.
 *
 * - `guvenliNext(raw)`  the ONLY gate for `?next=`: an internal path of this site or null. Never an absolute URL,
 *                       never a protocol-relative `//host`, never a backslash trick, never the login pages themselves
 *                       (no open redirect, no login loop).
 * - `girisSayfasi(yol)` which login page owns the path: Notya Klinik / Özel Branşlar screens → /giris/notya-klinik,
 *                       everything else of the doctor application → /giris/doktor (DOKTOR_GIRIS).
 * - `girisYolu(yol)`    the full address: the login page + `?oturum=doldu&next=<yol>`.
 */

/** The notice the login page shows after an expired session (Türkiye build). */
export const OTURUM_DOLDU_MESAJI = 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.'
/** Query flag the login page reads to show OTURUM_DOLDU_MESAJI. */
export const OTURUM_DOLDU_PARAM = 'oturum'
export const OTURUM_DOLDU_DEGER = 'doldu'

const DOKTOR_GIRIS_YOLU = '/giris/doktor'
const KLINIK_GIRIS_YOLU = '/giris/notya-klinik'
const KLINIK_ONEKLERI = ['/dashboard/notya-klinik', '/notya-klinik', '/ozel-branslar']
const NEXT_UZUNLUK = 1024

/**
 * Returns `raw` when it is a safe internal path (`/x/y?z#w`), otherwise null.
 * Accepts the raw query value (already URL-decoded by URLSearchParams) — it is decoded once more to catch
 * `%2F%2Fevil.com`-style double encoding.
 */
export function guvenliNext(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const v = raw.trim()
  if (!v || v.length > NEXT_UZUNLUK) return null
  let cozulmus = v
  try { cozulmus = decodeURIComponent(v) } catch { return null }
  for (const aday of [v, cozulmus]) {
    if (!aday.startsWith('/')) return null
    if (aday.startsWith('//') || aday.startsWith('/\\')) return null
    if (aday.includes('\\')) return null
    // Control characters (tab / newline are stripped by browsers and can turn "/\t/evil" into "//evil").
    if (/[\u0000-\u001f\u007f]/.test(aday)) return null
    // Anything with a scheme before the first slash-segment ("/x:y" is fine, "javascript:" can't start with "/").
    if (/^\/[^/?#]*:\/\//.test(aday)) return null
  }
  // Resolve against a dummy origin: the result must stay on that origin.
  try {
    const u = new URL(v, 'https://notya.invalid')
    if (u.origin !== 'https://notya.invalid') return null
    const yol = u.pathname + u.search + u.hash
    if (yol === '/giris' || yol.startsWith('/giris/') || yol.startsWith('/giris?')) return null
    return yol
  } catch {
    return null
  }
}

/** Login page that owns `yol` (a pathname, with or without query). */
export function girisSayfasi(yol: string | null | undefined): string {
  const p = (yol || '').split(/[?#]/)[0]
  return KLINIK_ONEKLERI.some((o) => p === o || p.startsWith(o + '/')) ? KLINIK_GIRIS_YOLU : DOKTOR_GIRIS_YOLU
}

/** Login address for an expired session on `yol`: `/giris/doktor?oturum=doldu&next=%2Fdashboard%2Fdoktor%2Fhastalar`. */
export function girisYolu(yol: string | null | undefined, secenek?: { doldu?: boolean }): string {
  const sayfa = girisSayfasi(yol)
  const q = new URLSearchParams()
  if (secenek?.doldu !== false) q.set(OTURUM_DOLDU_PARAM, OTURUM_DOLDU_DEGER)
  const next = guvenliNext(yol)
  if (next) q.set('next', next)
  const s = q.toString()
  return s ? `${sayfa}?${s}` : sayfa
}

/** What the login page reads from its own query string. */
export function girisSorgusu(search: string): { next: string | null; doldu: boolean } {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return { next: guvenliNext(q.get('next')), doldu: q.get(OTURUM_DOLDU_PARAM) === OTURUM_DOLDU_DEGER }
}

/** True for an inline error that is about the session — such a message is rendered with a "Giriş yap" button. */
export function oturumMesajiMi(mesaj: string | null | undefined): boolean {
  if (!mesaj) return false
  const m = mesaj.toLocaleLowerCase('tr-TR')
  return m.includes('oturum') && /(giriş|geçersiz|süresi|bulunamadı|gerekli)/.test(m)
}
