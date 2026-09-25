/**
 * NOTYA-ILETISIM-02 — Google (Gmail API) and Microsoft (identity platform v2 + Graph) behind one
 * shape. Permissions are the smallest that work: send mail, keep working offline, and learn the
 * address. Nothing here can read, list or delete mail.
 *
 * Every call goes through global fetch so tests can replace it; no SDKs.
 * Sources (checked 2026-09-25) are listed in docs/iletisim-kurulum-eposta.md.
 */
import { epostaMesaji } from './mime'
import { donusAdresi, saglayiciAyari, type Saglayici } from './ayar'

export const GMAIL_GONDER_KAPSAMI = 'https://www.googleapis.com/auth/gmail.send'
export const GRAPH_GONDER_KAPSAMI = 'https://graph.microsoft.com/Mail.Send'
/**
 * Read the signed-in user's own profile (GET /me), only to learn the connected address. Microsoft does
 * not put `email` in the id_token for every work (Microsoft 365) account, and `preferred_username` is the
 * sign-in name, which is not always the mailbox address. Gives no access to any mail.
 */
export const GRAPH_PROFIL_KAPSAMI = 'https://graph.microsoft.com/User.Read'

const GOOGLE = {
  yetki: 'https://accounts.google.com/o/oauth2/v2/auth',
  jeton: 'https://oauth2.googleapis.com/token',
  iptal: 'https://oauth2.googleapis.com/revoke',
  gonder: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
  kapsamlar: ['openid', 'email', GMAIL_GONDER_KAPSAMI],
}

// `common` = work/school AND personal Microsoft accounts.
const MICROSOFT = {
  yetki: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  jeton: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  gonder: 'https://graph.microsoft.com/v1.0/me/sendMail',
  profil: 'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',
  kapsamlar: ['openid', 'email', 'offline_access', GRAPH_PROFIL_KAPSAMI, GRAPH_GONDER_KAPSAMI],
}

const YETKI_KAYBI = /insufficient|ACCESS_TOKEN_SCOPE|ErrorAccessDenied|InvalidAuthenticationToken/i

export type Takas =
  | { ok: true; yenilemeJetonu: string; adres: string }
  | { ok: false; neden: 'izin-eksik' | 'hata'; hata: string }

export type Erisim =
  | { ok: true; erisimJetonu: string; yeniYenilemeJetonu?: string }
  | { ok: false; iptal: boolean; hata: string }

export type Gonderim =
  | { ok: true; disId?: string }
  | { ok: false; yetkisiz: boolean; hata: string }

export type Mesaj = { alici: string; konu: string; metin: string }

function ayarZorunlu(s: Saglayici) {
  const a = saglayiciAyari(s)
  if (!a) throw new Error(`${s} bağlantısı yapılandırılmamış`)
  return a
}

async function jetonIstegi(url: string, alanlar: Record<string, string>): Promise<{ durum: number; veri: Record<string, unknown> }> {
  const yanit = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(alanlar).toString(),
    cache: 'no-store',
  })
  const veri = (await yanit.json().catch(() => ({}))) as Record<string, unknown>
  return { durum: yanit.status, veri }
}

/**
 * Reads claims from an id_token received straight from the provider's token endpoint over TLS.
 * OpenID Connect Core §3.1.3.7 allows TLS server validation in place of signature checking for
 * this direct channel; we only use it to show which address was connected.
 */
export function idJetonuTalepleri(idJetonu: unknown): Record<string, unknown> {
  if (typeof idJetonu !== 'string') return {}
  const govde = idJetonu.split('.')[1]
  if (!govde) return {}
  try {
    return JSON.parse(Buffer.from(govde, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

function adresBul(s: Saglayici, talepler: Record<string, unknown>): string | null {
  const aday = [talepler.email, s === 'microsoft' ? talepler.preferred_username : undefined]
  for (const a of aday) if (typeof a === 'string' && a.includes('@')) return a.trim().toLowerCase()
  return null
}

/** Microsoft: the mailbox address from Graph /me (`mail`, else the sign-in name when it is an address). */
async function microsoftProfilAdresi(erisimJetonu: unknown): Promise<string | null> {
  if (typeof erisimJetonu !== 'string' || !erisimJetonu) return null
  try {
    const yanit = await fetch(MICROSOFT.profil, {
      headers: { Authorization: `Bearer ${erisimJetonu}`, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!yanit.ok) return null
    const veri = (await yanit.json().catch(() => ({}))) as { mail?: unknown; userPrincipalName?: unknown }
    for (const a of [veri.mail, veri.userPrincipalName]) if (typeof a === 'string' && a.includes('@')) return a.trim().toLowerCase()
    return null
  } catch {
    return null
  }
}

function kapsamVar(veri: Record<string, unknown>, kapsam: string, kisa: string): boolean {
  const verilen = typeof veri.scope === 'string' ? veri.scope.split(/\s+/) : []
  return verilen.some((k) => k === kapsam || k.toLowerCase() === kisa.toLowerCase())
}

function hataMetni(veri: Record<string, unknown>, durum: number): string {
  const kod = typeof veri.error === 'string' ? veri.error : `http_${durum}`
  const aciklama = typeof veri.error_description === 'string' ? veri.error_description.split(/\r?\n/)[0] : ''
  return aciklama ? `${kod}: ${aciklama}`.slice(0, 300) : kod
}

export function yetkiAdresi(s: Saglayici, p: { durum: string; meydanOkuma: string }): string {
  const { istemciId } = ayarZorunlu(s)
  const ortak = {
    client_id: istemciId,
    redirect_uri: donusAdresi(s),
    response_type: 'code',
    state: p.durum,
    code_challenge: p.meydanOkuma,
    code_challenge_method: 'S256',
  }
  if (s === 'google') {
    return `${GOOGLE.yetki}?${new URLSearchParams({
      ...ortak,
      scope: GOOGLE.kapsamlar.join(' '),
      access_type: 'offline',
      // Always show consent so Google always returns a refresh token, even on a reconnect.
      prompt: 'consent',
    })}`
  }
  return `${MICROSOFT.yetki}?${new URLSearchParams({
    ...ortak,
    scope: MICROSOFT.kapsamlar.join(' '),
    response_mode: 'query',
    prompt: 'select_account',
  })}`
}

export async function kodTakas(s: Saglayici, p: { kod: string; dogrulayici: string }): Promise<Takas> {
  const { istemciId, istemciSirri } = ayarZorunlu(s)
  const { durum, veri } = await jetonIstegi(s === 'google' ? GOOGLE.jeton : MICROSOFT.jeton, {
    grant_type: 'authorization_code',
    code: p.kod,
    redirect_uri: donusAdresi(s),
    client_id: istemciId,
    client_secret: istemciSirri,
    code_verifier: p.dogrulayici,
    ...(s === 'microsoft' ? { scope: MICROSOFT.kapsamlar.join(' ') } : {}),
  })
  if (durum !== 200) return { ok: false, neden: 'hata', hata: hataMetni(veri, durum) }
  // Google's consent screen lets people untick individual permissions; without "send" there is
  // nothing to connect.
  const gonderIzni = s === 'google' ? kapsamVar(veri, GMAIL_GONDER_KAPSAMI, 'gmail.send') : kapsamVar(veri, GRAPH_GONDER_KAPSAMI, 'Mail.Send')
  if (!gonderIzni) return { ok: false, neden: 'izin-eksik', hata: 'send_scope_not_granted' }
  if (typeof veri.refresh_token !== 'string' || !veri.refresh_token) return { ok: false, neden: 'hata', hata: 'no_refresh_token' }
  // Microsoft: Graph /me first (reliable for work accounts), the id_token claims only as a fallback.
  const adres = (s === 'microsoft' ? await microsoftProfilAdresi(veri.access_token) : null) ?? adresBul(s, idJetonuTalepleri(veri.id_token))
  if (!adres) return { ok: false, neden: 'hata', hata: 'no_email_claim' }
  return { ok: true, yenilemeJetonu: veri.refresh_token, adres }
}

/** Fresh short-lived access. `iptal: true` = the doctor withdrew permission or it lapsed → reconnect. */
export async function erisimAl(s: Saglayici, yenilemeJetonu: string): Promise<Erisim> {
  const { istemciId, istemciSirri } = ayarZorunlu(s)
  let sonuc: { durum: number; veri: Record<string, unknown> }
  try {
    sonuc = await jetonIstegi(s === 'google' ? GOOGLE.jeton : MICROSOFT.jeton, {
      grant_type: 'refresh_token',
      refresh_token: yenilemeJetonu,
      client_id: istemciId,
      client_secret: istemciSirri,
      ...(s === 'microsoft' ? { scope: MICROSOFT.kapsamlar.join(' ') } : {}),
    })
  } catch (e) {
    return { ok: false, iptal: false, hata: `network: ${(e as Error).message}`.slice(0, 300) }
  }
  const { durum, veri } = sonuc
  if (durum === 200 && typeof veri.access_token === 'string') {
    // Microsoft rotates the refresh token on every use; keep the newest one.
    const yeni = typeof veri.refresh_token === 'string' && veri.refresh_token !== yenilemeJetonu ? veri.refresh_token : undefined
    return { ok: true, erisimJetonu: veri.access_token, ...(yeni ? { yeniYenilemeJetonu: yeni } : {}) }
  }
  // invalid_grant = revoked, expired, password reset, or (Google "Testing" apps) the 7-day limit.
  // interaction_required / consent_required = Microsoft wants the user back at the consent screen.
  const kod = typeof veri.error === 'string' ? veri.error : ''
  const iptal = ['invalid_grant', 'interaction_required', 'consent_required'].includes(kod)
  return { ok: false, iptal, hata: hataMetni(veri, durum) }
}

export async function gonder(s: Saglayici, erisimJetonu: string, m: Mesaj): Promise<Gonderim> {
  let yanit: Response
  try {
    if (s === 'google') {
      // No From header: Gmail fills in the account's own name and address.
      const raw = Buffer.from(epostaMesaji(m), 'utf8').toString('base64url')
      yanit = await fetch(GOOGLE.gonder, {
        method: 'POST',
        headers: { Authorization: `Bearer ${erisimJetonu}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
        cache: 'no-store',
      })
    } else {
      yanit = await fetch(MICROSOFT.gonder, {
        method: 'POST',
        headers: { Authorization: `Bearer ${erisimJetonu}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            subject: m.konu,
            body: { contentType: 'Text', content: m.metin },
            toRecipients: [{ emailAddress: { address: m.alici } }],
          },
          saveToSentItems: true,
        }),
        cache: 'no-store',
      })
    }
  } catch (e) {
    return { ok: false, yetkisiz: false, hata: `network: ${(e as Error).message}`.slice(0, 300) }
  }
  if (yanit.ok) {
    if (s === 'google') {
      const veri = (await yanit.json().catch(() => ({}))) as { id?: unknown }
      return { ok: true, ...(typeof veri.id === 'string' ? { disId: veri.id } : {}) }
    }
    return { ok: true } // Graph answers 202 Accepted with no body.
  }
  const veri = (await yanit.json().catch(() => ({}))) as { error?: { message?: unknown; code?: unknown; status?: unknown } }
  const ileti = [veri.error?.code, veri.error?.status, veri.error?.message].filter((x) => typeof x === 'string' || typeof x === 'number').join(' ')
  // Only a lost permission means "reconnect". Gmail also answers 403 for sending limits and for a
  // Workspace admin's block; reconnecting fixes neither, so those stay ordinary failures.
  const yetkisiz = yanit.status === 401 || (yanit.status === 403 && YETKI_KAYBI.test(ileti))
  return { ok: false, yetkisiz, hata: `http_${yanit.status}${ileti ? `: ${ileti}` : ''}`.slice(0, 300) }
}

/**
 * Withdraw Notya's permission at the provider. Google has a revoke endpoint. Microsoft has no
 * per-app revoke for a delegated grant; forgetting the (encrypted) refresh token is the
 * disconnect — only Notya ever held it, and it is useless without our client secret. The doctor
 * can also remove Notya at https://account.live.com/consent/Manage or https://myapps.microsoft.com.
 */
export async function iptalEt(s: Saglayici, yenilemeJetonu: string): Promise<boolean> {
  if (s !== 'google') return true
  try {
    const yanit = await fetch(GOOGLE.iptal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: yenilemeJetonu }).toString(),
      cache: 'no-store',
    })
    // 400 invalid_token = already revoked/expired: the goal is met.
    return yanit.ok || yanit.status === 400
  } catch {
    return false
  }
}
