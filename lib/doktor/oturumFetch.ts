/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — THE one authenticated request path of the doctor application (doctor,
 * secretary / front desk, Notya Klinik, Özel Branşlar — all 30 medical branches + 10 Özel Branşlar).
 *
 *   doktorFetch(url, init)  = fetch + the doctor's current access token (clientAuth refreshes it when needed).
 *                             On a 401: refresh once, retry once. When the session cannot be renewed (the auth
 *                             server refused it, or there is none) → `oturumSuresiDoldu()`: to the login page with
 *                             `?next=<this page>` and the "Oturumunuzun süresi doldu" notice.
 *                             A network failure during the refresh is NOT an expired session: the 401 is returned
 *                             as is and nobody is logged out because the laptop was offline.
 *
 * Do not build `Authorization: Bearer …` anywhere else — lib/doktor/oturumFetch-koruma.test.ts refuses it.
 * Server-side auth checks and cross-doctor isolation are unchanged: this file only decides which token the browser
 * sends and what happens when the server says no.
 */
import { jetonCoz, type JetonCozumu } from './clientAuth'
import { girisYolu } from './oturumYolu'

/** Fired on window when the session has expired (whether or not the redirect is deferred). */
export const OTURUM_DOLDU_OLAYI = 'notya:oturum-doldu'

type Kurulum = {
  jetonCoz: (s?: { zorla?: boolean; reddedilen?: string }) => Promise<JetonCozumu>
  fetch: typeof fetch
  oturumBitti: () => void
}

function tekrarGonderilebilir(init?: RequestInit): boolean {
  const b = init?.body
  return !(typeof ReadableStream !== 'undefined' && b instanceof ReadableStream)
}

function basliklaIstek(init: RequestInit | undefined, jeton: string): RequestInit {
  const h = new Headers(init?.headers)
  h.set('Authorization', 'Bearer ' + jeton)
  return { ...init, headers: h }
}

function oturumYanit(): Response {
  return new Response(JSON.stringify({ success: false, error: 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.', code: 'SESSION_EXPIRED' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Builds a doktorFetch around injected parts (the tests use this; the app uses the default instance below). */
export function oturumluFetchKur(k: Kurulum) {
  return async function oturumluFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const ilk = await k.jetonCoz()
    if (ilk.durum === 'bitti') { k.oturumBitti(); return oturumYanit() }
    if (!ilk.jeton) throw new TypeError('Failed to fetch') // offline and the token has expired: same as fetch offline
    const yanit = await k.fetch(input, basliklaIstek(init, ilk.jeton))
    if (yanit.status !== 401 || !tekrarGonderilebilir(init)) return yanit
    const yeni = await k.jetonCoz({ zorla: true, reddedilen: ilk.jeton })
    if (yeni.durum === 'bitti') { k.oturumBitti(); return yanit }
    if (yeni.durum !== 'tamam' || yeni.jeton === ilk.jeton) return yanit
    return k.fetch(input, basliklaIstek(init, yeni.jeton))
  }
}

// ---- expired-session behaviour (browser) -------------------------------------------------------------------------

let ertelemeSayisi = 0
let yonlendiriliyor = false

/**
 * A screen that must not be navigated away from (a running recording) defers the login redirect while `birak` has
 * not been called. The expiry is still announced (OTURUM_DOLDU_OLAYI) and OturumBekcisi shows the "Giriş yap"
 * banner instead of leaving the page.
 */
export function oturumYonlendirmesiniErtele(): () => void {
  ertelemeSayisi++
  let birakildi = false
  return () => { if (!birakildi) { birakildi = true; ertelemeSayisi = Math.max(0, ertelemeSayisi - 1) } }
}

/** The current page as a `next` value. */
export function buradakiYol(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname + window.location.search + window.location.hash
}

/** The session cannot be renewed: announce it and (unless deferred) go to the login page, coming back here after. */
export function oturumSuresiDoldu(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(OTURUM_DOLDU_OLAYI))
  if (ertelemeSayisi > 0 || yonlendiriliyor) return
  yonlendiriliyor = true
  window.location.assign(girisYolu(buradakiYol()))
}

/** The default instance: every doctor / secretary / Notya Klinik request goes through this. */
export const doktorFetch = oturumluFetchKur({
  jetonCoz: (s) => jetonCoz(s),
  fetch: (...a) => fetch(...a),
  oturumBitti: () => oturumSuresiDoldu(),
})

/**
 * Sets the doctor's Authorization header on an XMLHttpRequest (used only where upload progress is needed).
 * `jeton` must come from doktorJetonu() / ensureDoctorAccessToken() right before the upload.
 */
export function xhrYetkisiEkle(x: XMLHttpRequest, jeton: string): void {
  x.setRequestHeader('Authorization', 'Bearer ' + jeton)
}

/** The current access token for the few non-fetch transports (XHR upload progress, a Supabase storage client). */
export async function doktorJetonu(): Promise<string | null> {
  const c = await jetonCoz()
  if (c.durum === 'bitti') { oturumSuresiDoldu(); return null }
  return c.jeton
}
