/**
 * NOTYA-RANDEVU-V2 PR2 — Google OAuth + Calendar v3 over global fetch (tests replace fetch; no SDK).
 *
 * Scope: only https://www.googleapis.com/auth/calendar.events — create/change/delete events and read events on
 * the doctor's calendars. No openid/email, no calendar list, no Gmail. Whole feature dormant (hazirMi false,
 * routes 503, card hidden) until GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and ENCRYPTION_MASTER_KEY exist.
 */
import { siteAdresi } from '@/lib/iletisim/otomatik/eposta/ayar'

export const TAKVIM_KAPSAMI = 'https://www.googleapis.com/auth/calendar.events'
const YETKI = 'https://accounts.google.com/o/oauth2/v2/auth'
const JETON = 'https://oauth2.googleapis.com/token'
const IPTAL = 'https://oauth2.googleapis.com/revoke'
const API = 'https://www.googleapis.com/calendar/v3'

export function googleTakvimAyari(): { istemciId: string; istemciSirri: string } | null {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim()
  const sir = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  if (!id || !sir || !process.env.ENCRYPTION_MASTER_KEY) return null
  return { istemciId: id, istemciSirri: sir }
}

export function googleTakvimHazirMi(): boolean {
  return googleTakvimAyari() !== null
}

/** Register verbatim in the Google Cloud console (docs/RANDEVU-V2.md § Google Takvim). */
export function donusAdresi(): string {
  return `${siteAdresi()}/api/google-takvim/donus`
}

export function bildirimAdresi(): string {
  return `${siteAdresi()}/api/google-takvim/bildirim`
}

function ayar() {
  const a = googleTakvimAyari()
  if (!a) throw new Error('Google Takvim yapılandırılmamış')
  return a
}

export function yetkiAdresi(p: { durum: string; meydanOkuma: string }): string {
  return `${YETKI}?${new URLSearchParams({
    client_id: ayar().istemciId,
    redirect_uri: donusAdresi(),
    response_type: 'code',
    scope: TAKVIM_KAPSAMI,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'false',
    state: p.durum,
    code_challenge: p.meydanOkuma,
    code_challenge_method: 'S256',
  })}`
}

async function formPost(url: string, alanlar: Record<string, string>): Promise<{ durum: number; veri: Record<string, unknown> }> {
  const y = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(alanlar).toString(),
    cache: 'no-store',
  })
  return { durum: y.status, veri: (await y.json().catch(() => ({}))) as Record<string, unknown> }
}

export type Takas = { ok: true; yenilemeJetonu: string } | { ok: false; neden: 'izin-eksik' | 'hata'; hata: string }

export async function kodTakas(kod: string, dogrulayici: string): Promise<Takas> {
  const { istemciId, istemciSirri } = ayar()
  const { durum, veri } = await formPost(JETON, {
    grant_type: 'authorization_code', code: kod, redirect_uri: donusAdresi(),
    client_id: istemciId, client_secret: istemciSirri, code_verifier: dogrulayici,
  })
  if (durum !== 200) return { ok: false, neden: 'hata', hata: String(veri.error || `http_${durum}`).slice(0, 200) }
  const kapsamlar = typeof veri.scope === 'string' ? veri.scope.split(/\s+/) : []
  if (!kapsamlar.includes(TAKVIM_KAPSAMI)) return { ok: false, neden: 'izin-eksik', hata: 'calendar_scope_not_granted' }
  if (typeof veri.refresh_token !== 'string' || !veri.refresh_token) return { ok: false, neden: 'hata', hata: 'no_refresh_token' }
  return { ok: true, yenilemeJetonu: veri.refresh_token }
}

export type Erisim = { ok: true; jeton: string } | { ok: false; iptal: boolean; hata: string }

export async function erisimAl(yenilemeJetonu: string): Promise<Erisim> {
  const { istemciId, istemciSirri } = ayar()
  try {
    const { durum, veri } = await formPost(JETON, { grant_type: 'refresh_token', refresh_token: yenilemeJetonu, client_id: istemciId, client_secret: istemciSirri })
    if (durum === 200 && typeof veri.access_token === 'string') return { ok: true, jeton: veri.access_token }
    return { ok: false, iptal: veri.error === 'invalid_grant', hata: String(veri.error || `http_${durum}`).slice(0, 200) }
  } catch (e) {
    return { ok: false, iptal: false, hata: `network: ${(e as Error).message}`.slice(0, 200) }
  }
}

export async function iptalEt(yenilemeJetonu: string): Promise<void> {
  await fetch(`${IPTAL}?${new URLSearchParams({ token: yenilemeJetonu })}`, { method: 'POST', cache: 'no-store' }).catch(() => undefined)
}

export type ApiYaniti<T = Record<string, unknown>> = { durum: number; veri: T }

async function api<T = Record<string, unknown>>(jeton: string, yontem: string, yol: string, govde?: unknown): Promise<ApiYaniti<T>> {
  const y = await fetch(`${API}${yol}`, {
    method: yontem,
    headers: { Authorization: `Bearer ${jeton}`, Accept: 'application/json', ...(govde ? { 'Content-Type': 'application/json' } : {}) },
    body: govde ? JSON.stringify(govde) : undefined,
    cache: 'no-store',
  })
  const veri = y.status === 204 ? ({} as T) : ((await y.json().catch(() => ({}))) as T)
  return { durum: y.status, veri }
}

const takvim = (id: string) => `/calendars/${encodeURIComponent(id)}`

export const takvimApi = {
  ekle: (j: string, t: string, govde: Record<string, unknown>) => api(j, 'POST', `${takvim(t)}/events?sendUpdates=none`, govde),
  guncelle: (j: string, t: string, id: string, govde: Record<string, unknown>) =>
    api(j, 'PATCH', `${takvim(t)}/events/${encodeURIComponent(id)}?sendUpdates=none`, govde),
  sil: (j: string, t: string, id: string) => api(j, 'DELETE', `${takvim(t)}/events/${encodeURIComponent(id)}?sendUpdates=none`),
  /** Incremental with syncToken; a first full sync without (no timeMin: Google returns nextSyncToken only then). */
  listele: (j: string, t: string, p: { syncToken?: string | null; pageToken?: string | null }) => {
    const q = new URLSearchParams({ singleEvents: 'true', maxResults: '2500', showDeleted: 'true' })
    if (p.syncToken) q.set('syncToken', p.syncToken)
    if (p.pageToken) q.set('pageToken', p.pageToken)
    return api<{ items?: unknown[]; nextPageToken?: string; nextSyncToken?: string; summary?: string }>(j, 'GET', `${takvim(t)}/events?${q}`)
  },
  izle: (j: string, t: string, g: { id: string; token: string; adres: string }) =>
    api<{ resourceId?: string; expiration?: string }>(j, 'POST', `${takvim(t)}/events/watch`, { id: g.id, type: 'web_hook', address: g.adres, token: g.token, params: { ttl: '604800' } }),
  durdur: (j: string, g: { id: string; resourceId: string }) => api(j, 'POST', '/channels/stop', { id: g.id, resourceId: g.resourceId }),
}
