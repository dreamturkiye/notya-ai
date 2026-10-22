/**
 * AU-BETA-02 — TYRO (Tyro Connect "Pay Online") adapter, bring-your-own account. Server only.
 *
 * STATUS: WRITTEN against the documented surface, NEEDS TYRO ONBOARDING TO ACTIVATE. Tyro's docs say: "To get started, you
 * must first request a set of credentials from Tyro Connect", and webhook registration "is currently a manual process" (you
 * give the Tyro Connect team your webhook URL; signing keys are generated per URL). Until those exist this adapter has never
 * run against Tyro, and `tyroEtkin()` keeps it OFF (the app does not route payments to it).
 *
 * SOURCES (fetched with WebFetch 2026-10-22, docs/au/SOURCES.md):
 *   https://docs.connect.tyro.com/app/apis/pay-online/                              endpoints; production base https://api.tyro.com/connect; refunds only for successful Pay Requests, partial allowed, never above the original total; Tyro.js from https://pay.connect.tyro.com/v1/tyro.js
 *   https://docs.connect.tyro.com/docs/online-payments/pay-online/integration-guide/tyro-js   POST /pay/requests sample (locationId, provider{name:TYRO,method:CARD}, origin{orderId}, total{amount in cents,currency}); Bearer JWT; response `paySecret`
 *   https://docs.connect.tyro.com/app/authentication/                               client credentials (client_id, client_secret) → /oauth/token → access_token, expires_in, token_type Bearer; JWT lives 12 h; more than 12 tokens in 11 h are rejected → cache
 *   https://docs.connect.tyro.com/api-explorer/pay-online/0.9  (overview: OIDC discovery https://auth.connect.tyro.com/.well-known/openid-configuration)
 *   https://docs.connect.tyro.com/docs/getting-started/notification-events/webhooks  header `Tyro-Connect-Signature`, HMAC-SHA256 of the raw body with a pre-shared key, 200 on success / 500 to be retried 3 times, ignore duplicate type+id
 *   https://docs.connect.tyro.com/api-explorer/pay-online/0.9/notification-events    types NEW_PAY_REQUEST, PAY_REQUEST_VOIDED, PAY_REQUEST_FAILED, PAY_REQUEST_PROCESSING, PAY_REQUEST_SUCCESS, NEW_PAY_METHOD, NEW_PAY_REFUND; payload {type, data:{id, uri, resource}}
 *
 * NOT VERIFIED (the schema pages could not be fetched; the OpenAPI file came back as binary): the exact field names of the
 * refund request and of the Pay Request response, the status vocabulary beyond the sample's SUCCESS/FAILED, the token
 * request's `audience`, and the signature's text encoding (the page says both "SHA-256 hash" and `hmacSha256`). Each guess
 * lives in ONE marked place below (search "TYRO-UNVERIFIED") so the first run against a Tyro test location corrects it there.
 * Tyro documents no way to LIST Pay Requests, so reconciliation asks for each invoice's own Pay Request by id.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { DogrulamaSonucu, GercekSaglayici, IadeIstegi, IadeYapildi, OdemeBaslatildi, OdemeBaslatma, SaglayiciKaydi } from './saglayiciTipleri'

export const TYRO_API = 'https://api.tyro.com/connect'
export const TYRO_KESIF = 'https://auth.connect.tyro.com/.well-known/openid-configuration'
export const TYRO_IMZA_BASLIGI = 'Tyro-Connect-Signature'

/** Off until the owner's Tyro credentials and webhook registration exist AND the Tyro.js checkout page is built. */
export const tyroEtkin = (): boolean => process.env.NOTYA_TYRO_ETKIN === '1'

export type TyroKimlik = { istemciId: string; istemciGizli: string; konumId: string }
type Getir = typeof fetch

const sn = () => Math.floor(Date.now() / 1000)
const jetonOnbellek = new Map<string, { jeton: string; bitis: number }>()

async function jetonAl(k: TyroKimlik, getir: Getir): Promise<string> {
  const o = jetonOnbellek.get(k.istemciId)
  if (o && o.bitis - 300 > sn()) return o.jeton
  const kesif = await (await getir(TYRO_KESIF)).json() as { token_endpoint?: string }
  if (!kesif.token_endpoint?.startsWith('https://')) throw new Error('tyro: no token endpoint in the discovery document')
  // TYRO-UNVERIFIED: the docs name client_id and client_secret but do not print the token request; standard OAuth client-credentials form.
  const r = await getir(kesif.token_endpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: k.istemciId, client_secret: k.istemciGizli }).toString() })
  if (!r.ok) throw Object.assign(new Error('tyro: token refused'), { durum: r.status })
  const j = await r.json() as { access_token?: string; expires_in?: number; token_type?: string }
  if (!j.access_token || j.token_type?.toLowerCase() !== 'bearer') throw new Error('tyro: unexpected token response')
  jetonOnbellek.set(k.istemciId, { jeton: j.access_token, bitis: sn() + Math.max(60, Number(j.expires_in) || 3600) })
  return j.access_token
}

async function cagri(k: TyroKimlik, getir: Getir, yol: string, init: { method?: string; govde?: unknown } = {}): Promise<{ ok: boolean; durum: number; j: Record<string, unknown> }> {
  const jeton = await jetonAl(k, getir)
  const r = await getir(`${TYRO_API}${yol}`, { method: init.method ?? 'GET', headers: { authorization: `Bearer ${jeton}`, 'content-type': 'application/json' }, body: init.govde === undefined ? undefined : JSON.stringify(init.govde) })
  let j: Record<string, unknown> = {}
  try { j = await r.json() as Record<string, unknown> } catch { /* an empty body */ }
  return { ok: r.ok, durum: r.status, j }
}

/** TYRO-UNVERIFIED: the refund request body. Documented only as "total or partial, never above the original Pay Request total". */
export const tyroIadeGovdesi = (i: IadeIstegi, paraKodu: string) => ({ payRequestId: i.odemeRef, amount: i.kurus, currency: paraKodu })

/** TYRO-UNVERIFIED: statuses. The documentation's client sample tests `SUCCESS` and `FAILED`; anything else is "not taken". */
const odendi = (durum: unknown) => String(durum ?? '').toUpperCase() === 'SUCCESS'

export function tyroSaglayici(k: TyroKimlik, getir: Getir = fetch, paraKodu = 'AUD'): GercekSaglayici & { odemeyiOku(ref: string): Promise<SaglayiciKaydi | null> } {
  return {
    ad: 'tyro',

    async dogrula(): Promise<DogrulamaSonucu> {
      try { await jetonAl(k, getir); return { tamam: true } } catch (e) { return { tamam: false, hata: (e as { durum?: number }).durum === 401 || (e as { durum?: number }).durum === 403 ? 'anahtar' : 'ag' } }
    },

    /** Creates a Pay Request; the page that takes the card (Tyro.js, loaded from Tyro) receives `paySecret`. `origin.orderId` is the invoice id. */
    async baslat(i: OdemeBaslatma): Promise<OdemeBaslatildi> {
      const r = await cagri(k, getir, '/pay/requests', { method: 'POST', govde: { locationId: k.konumId, provider: { name: 'TYRO', method: 'CARD' }, origin: { orderId: i.faturaId }, total: { amount: i.tutarKurus, currency: i.paraKodu } } })
      const id = typeof r.j.id === 'string' ? r.j.id : ''
      const paySecret = typeof r.j.paySecret === 'string' ? r.j.paySecret : ''
      if (!r.ok || !id || !paySecret) throw new Error(`tyro: pay request refused (${r.durum})`)
      return { ref: id, paySecret }
    },

    async iade(i: IadeIstegi): Promise<IadeYapildi> {
      try {
        const r = await cagri(k, getir, '/pay/refunds', { method: 'POST', govde: tyroIadeGovdesi(i, paraKodu) })
        return r.ok ? { tamam: true, ref: typeof r.j.id === 'string' ? r.j.id : '', iadeKurus: i.kurus, bekliyor: true } : { tamam: false, ref: '', iadeKurus: 0, bekliyor: false }
      } catch { return { tamam: false, ref: '', iadeKurus: 0, bekliyor: false } }
    },

    /** Tyro documents no list of Pay Requests: the reconciliation reads each invoice's own Pay Request by id (see `odemeyiOku`). */
    async kayitlar(): Promise<SaglayiciKaydi[]> { return [] },

    /** GET /pay/requests/{id}. TYRO-UNVERIFIED: `total.amount`, `total.currency`, `status`, `origin.orderId`; refunded totals are not read (list refunds has no documented filter). */
    async odemeyiOku(ref: string): Promise<SaglayiciKaydi | null> {
      const r = await cagri(k, getir, `/pay/requests/${encodeURIComponent(ref)}`)
      if (!r.ok) return null
      const toplam = (r.j.total ?? {}) as { amount?: unknown; currency?: unknown }
      const orijin = (r.j.origin ?? {}) as { orderId?: unknown }
      return { ref, faturaId: typeof orijin.orderId === 'string' ? orijin.orderId : null, tutarKurus: Number.isInteger(toplam.amount) ? Number(toplam.amount) : 0, iadeKurus: 0, paraKodu: String(toplam.currency ?? paraKodu).toUpperCase(), basarili: odendi(r.j.status), olusturuldu: 0 }
    },
  }
}

// ───────────────────────── webhook ─────────────────────────

/**
 * `Tyro-Connect-Signature` = HMAC-SHA256 of the RAW body with the pre-shared signing key. The page does not say how the digest is
 * written (hex or base64) and calls it both "SHA-256 hash" and hmacSha256, so BOTH encodings of the HMAC are accepted, compared in
 * constant time; a bare SHA-256 of the body without the key is never accepted. TYRO-UNVERIFIED encoding.
 */
export function tyroImzaDogru(govde: string, baslik: string | null, anahtar: string): boolean {
  if (!baslik || !anahtar) return false
  const h = createHmac('sha256', anahtar).update(govde, 'utf8').digest()
  const gelen = baslik.trim()
  for (const aday of [h.toString('hex'), h.toString('base64')]) {
    const a = Buffer.from(aday), b = Buffer.from(gelen)
    if (a.length === b.length && timingSafeEqual(a, b)) return true
  }
  return false
}

export type TyroOlay = { type: string; data: { id: string; uri?: string; resource?: string } }
export function tyroOlayiOku(govde: string): TyroOlay | null {
  try {
    const j = JSON.parse(govde) as { type?: unknown; data?: { id?: unknown; uri?: unknown; resource?: unknown } }
    if (typeof j.type !== 'string' || !j.data || typeof j.data.id !== 'string' || !j.data.id) return null
    return { type: j.type, data: { id: j.data.id, uri: typeof j.data.uri === 'string' ? j.data.uri : undefined, resource: typeof j.data.resource === 'string' ? j.data.resource : undefined } }
  } catch { return null }
}
