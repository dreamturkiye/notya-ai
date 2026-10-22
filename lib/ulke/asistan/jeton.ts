/**
 * AU-CANLI-01 — the call token of a country's live assistant, and the guard of its Custom LLM endpoint.
 *
 * The token is a short-lived HMAC-signed statement of WHO is calling and AS WHICH ROLE: minted only after the signed-in
 * account has been verified, carried by the browser to ElevenLabs as `customLlmExtraBody`, read back on every model request.
 * The endpoint trusts NOTHING in the request body without it: the account and the role come from the token only.
 *
 *   - It names the country (`pc` = the pack's code): a token minted for one country is refused by every other.
 *   - It carries NO patient id and no other id: only the account, the role and the account's time zone. The live assistant
 *     of this version opens no patient file (docs/COUNTRY-PACK-HOWTO.md).
 *   - It is signed with NOTYA_SES_JETON_SECRET (≥ 32 characters), which is never given to the provider; the provider only
 *     holds the server secret NOTYA_SES_LLM_SECRET (a different value of the same length rule) that proves the request
 *     comes from the agent. A leaked agent secret therefore cannot mint a token.
 *
 * Self-contained on purpose: Türkiye's token (lib/asistan/sesJetonu.ts) carries Turkish text and a patient field, and
 * nothing reachable from a country's route may carry another country's text (lib/ulke/ulkeDuvarlari.test.ts).
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

/** A call lasts at most 120 minutes at the provider; the token covers the call and no more. */
export const JETON_OMRU_MS = 150 * 60 * 1000
const ALAN_AZAMI = 200

const b64 = (b: Buffer | string): string => Buffer.from(b).toString('base64url')

function anahtar(ad: string): string | null {
  const k = String(process.env[ad] ?? '').trim()
  return k.length >= 32 ? k : null
}

function imza(govde: string, k: string): string {
  return b64(createHmac('sha256', k).update(`notya-ulke-asistan.v1.${govde}`).digest())
}

function esitMi(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

type Yuk = { d: string; pc: string; r: string; tz?: string; exp: number }

/** null = no signing secret in this deployment (the feature is then not offered at all). */
export function canliJetonuImzala(g: { hesapId: string; kod: string; rol: string; saatDilimi?: string | null }, simdi = Date.now()): string | null {
  const k = anahtar('NOTYA_SES_JETON_SECRET')
  if (!k) return null
  const yuk: Yuk = { d: g.hesapId, pc: g.kod, r: g.rol, ...(g.saatDilimi ? { tz: g.saatDilimi } : {}), exp: simdi + JETON_OMRU_MS }
  const govde = b64(JSON.stringify(yuk))
  return `${govde}.${imza(govde, k)}`
}

export type CanliJeton = { hesapId: string; rol: string; saatDilimi: string | null }

/** The token's content, or null: not signed by us, expired, malformed, or minted for another country. */
export function canliJetonuDogrula(ham: unknown, kod: string, simdi = Date.now()): CanliJeton | null {
  const k = anahtar('NOTYA_SES_JETON_SECRET')
  if (!k || typeof ham !== 'string' || ham.length > 1000) return null
  const [govde, imz, fazla] = ham.split('.')
  if (!govde || !imz || fazla !== undefined || !esitMi(imz, imza(govde, k))) return null
  try {
    const v = JSON.parse(Buffer.from(govde, 'base64url').toString('utf8')) as Partial<Yuk>
    if (typeof v.d !== 'string' || !v.d || v.d.length > ALAN_AZAMI) return null
    if (typeof v.r !== 'string' || !v.r || v.r.length > ALAN_AZAMI) return null
    if (v.pc !== kod) return null
    if (typeof v.exp !== 'number' || v.exp < simdi) return null
    return { hesapId: v.d, rol: v.r, saatDilimi: typeof v.tz === 'string' && v.tz ? v.tz : null }
  } catch {
    return null
  }
}

/** `Authorization: Bearer <NOTYA_SES_LLM_SECRET>` (or `x-notya-ses-sirri`). No secret in this deployment = always refused. */
export function llmSirriGecerliMi(basliklar: Headers): boolean {
  const sir = anahtar('NOTYA_SES_LLM_SECRET')
  if (!sir) return false
  const auth = basliklar.get('authorization') ?? ''
  const gelen = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : String(basliklar.get('x-notya-ses-sirri') ?? '').trim()
  return Boolean(gelen) && esitMi(gelen, sir)
}
