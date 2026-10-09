/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — KVKK explicit consent in onboarding: asked only when the account has
 * none on record.
 *
 * Until now consent was recorded only on the public sign-up page (app/kayit/page.tsx); accounts created by an
 * administrator never pass it. The decision is made on the SERVER (a "not needed" flag from the browser is never
 * trusted) and consent the doctor did not tick is NEVER stamped.
 *
 * Wording, link and version are exactly those of /kayit (components/onboarding/KvkkOnayKutusu.tsx); no new legal
 * wording was written. /kayit itself is untouched — lib/onboarding/adimUi.test.ts and profilDogrula.test.ts read
 * its source on every run to prove the two have not drifted apart.
 */

/** The same string as `kvkk_metin_versiyonu` in app/kayit/page.tsx. */
export const KVKK_METIN_VERSIYONU = '2026-08-25-v2'

/** The same sentence as the error in app/kayit/page.tsx. */
export const KVKK_ONAY_HATASI = "Devam edebilmek için KVKK Aydınlatma Metni'ni okuyup onaylamanız gerekmektedir."

/** Machine code in the server's 400 answer — the screen reveals the box on this code if it was hidden. */
export const KVKK_ONAY_KODU = 'KVKK_ONAY_GEREKLI'

/** Consent on record: users.kvkk_consent_at is set OR auth metadata kvkk_onay === true (how /kayit writes it). */
export function kvkkKayitliMi(satirOnayTarihi: unknown, meta: Record<string, unknown> | null | undefined): boolean {
  if (typeof satirOnayTarihi === 'string' && satirOnayTarihi.trim()) return true
  if (satirOnayTarihi instanceof Date) return true
  return meta?.kvkk_onay === true
}

export type KvkkKarari = {
  /** Should the screen show the consent box (no consent on record). */
  gerekli: boolean
  /** Should this request record consent — only when none is on record AND the doctor ticked the box. */
  damgala: boolean
  /** Should the request be refused — first completion, no consent, box not ticked. */
  reddet: boolean
}

/**
 * The one decision point.
 *  • consent on record → not asked, not stamped again (whatever the body says).
 *  • none on record + box ticked (exactly `true`) → stamp.
 *  • none on record + box not ticked → an account finishing onboarding for the first time is refused; a call from
 *    an account that already finished onboarding (the behaviour before this change) is neither refused nor stamped.
 */
export function kvkkKarari(g: { kayitli: boolean; ilkKayit: boolean; isaretlendi: unknown }): KvkkKarari {
  if (g.kayitli) return { gerekli: false, damgala: false, reddet: false }
  if (g.isaretlendi === true) return { gerekli: true, damgala: true, reddet: false }
  return { gerekli: true, damgala: false, reddet: g.ilkKayit }
}

/** The same metadata keys /kayit writes. */
export function kvkkMetaDamgasi(simdiIso: string): Record<string, unknown> {
  return { kvkk_onay: true, kvkk_onay_tarihi: simdiIso, kvkk_metin_versiyonu: KVKK_METIN_VERSIYONU }
}

/** The users-row stamp — same instant, same version string. */
export function kvkkSatirDamgasi(simdiIso: string): Record<string, unknown> {
  return { kvkk_consent_at: simdiIso, kvkk_consent_version: KVKK_METIN_VERSIYONU }
}
