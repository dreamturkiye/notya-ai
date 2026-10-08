/**
 * NOTYA-ULKE-01 — the country an account belongs to, and whether this deployment may serve it.
 *
 * Checklist rule 4: the account carries its country (and language), set at sign-up from that country's own page.
 * Two stamps, written together at sign-up:
 *   - auth `app_metadata.country` — travels inside the session, the user cannot write it; checked on every request
 *     that goes through doktorOturum / pratikOturum, with no extra query;
 *   - `users.country` (migration 128) — the record; checked at login.
 * An account with no stamp was created before countries existed and is Türkiye's (DAMGASIZ_HESAP_ULKESI). In any
 * other country's deployment such an account is refused: fail closed.
 *
 * Refusal is always the same neutral answer a wrong password gets — an account from another country must not learn
 * that it exists somewhere else.
 *
 * Pure and client-safe (login pages call it on the sign-in response). Does not weaken any ownership check: it runs
 * BEFORE them and can only refuse (.cursor/skills/hasta-izolasyon/SKILL.md).
 */
import { aktifUlke } from './ulke'
import { DAMGASIZ_HESAP_ULKESI } from './tipler'

type MetaTasiyan = { app_metadata?: Record<string, unknown> | null } | null | undefined
type SatirGibi = { country?: unknown } | null | undefined

const kod = (ham: unknown): string => (typeof ham === 'string' && ham.trim() ? ham.trim() : DAMGASIZ_HESAP_ULKESI)

/** Country stamped on the auth account. */
export function hesapUlkesi(user: MetaTasiyan): string {
  return kod(user?.app_metadata?.country)
}

/** true = this deployment's country is the account's country. */
export function hesapBuUlkedeMi(user: MetaTasiyan): boolean {
  return hesapUlkesi(user) === aktifUlke()
}

/** Same question for the `users` row. A row read before migration 128 has no column: it is a pre-country account. */
export function satirBuUlkedeMi(satir: SatirGibi): boolean {
  return kod(satir?.country) === aktifUlke()
}

/** Machine code of the refusal; the human sentence comes from the pack (surface `hesap`, key `girisReddi`). */
export const HESAP_REDDI_KODU = 'HESAP_REDDI'
