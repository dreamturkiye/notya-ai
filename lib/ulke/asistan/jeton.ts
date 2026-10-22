/**
 * AU-CANLI-01 — the call token of a country's live assistant. Same signed token as Türkiye's voice
 * (lib/asistan/sesJetonu.ts: HMAC over the doctor id, session, role, short life), minted only after the signed-in
 * account has been verified, and carried by the browser to ElevenLabs as `customLlmExtraBody`. The Custom LLM
 * endpoint trusts NOTHING in the request body without it: the account and the role are read from the token only.
 *
 * What is different here: the token names the country (`pe` = `ulke:<code>:<role>`), so a token minted for one
 * country's assistant is refused by every other country's endpoint, and by Türkiye's. No patient id is ever put in
 * it (`p` is always null): the live assistant of this version opens no patient file (docs/COUNTRY-PACK-HOWTO.md).
 */
import { randomUUID } from 'node:crypto'
import { sesJetonuDogrula, sesJetonuImzala, sesSirriGecerliMi, type SesJetonu } from '@/lib/asistan/sesJetonu'

const ONEK = 'ulke:'

export function canliJetonuImzala(g: { hesapId: string; kod: string; rol: string; saatDilimi?: string | null }): string | null {
  return sesJetonuImzala({
    d: g.hesapId,
    o: randomUUID(),
    s: g.rol,
    p: null,
    pe: `${ONEK}${g.kod}:${g.rol}`,
    ...(g.saatDilimi ? { tz: g.saatDilimi } : {}),
  })
}

export type CanliJeton = { hesapId: string; rol: string; saatDilimi: string | null; oturum: string }

/** The token's content, or null: not signed by us, expired, or minted for another country. */
export function canliJetonuDogrula(ham: unknown, kod: string): CanliJeton | null {
  const j: SesJetonu | null = sesJetonuDogrula(ham)
  if (!j || j.p !== null) return null
  const beklenen = `${ONEK}${kod}:`
  if (!j.pe.startsWith(beklenen)) return null
  const rol = j.pe.slice(beklenen.length)
  if (!rol || rol !== j.s) return null
  return { hesapId: j.d, rol, saatDilimi: j.tz ?? null, oturum: j.o }
}

export { sesSirriGecerliMi as llmSirriGecerliMi }
