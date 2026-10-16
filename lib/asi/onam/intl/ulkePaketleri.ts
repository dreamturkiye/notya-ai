/**
 * NOTYA-ASI-ONAM-01 Phase 2 — one `AsiOnamUlkePaketi` per non-Turkey country module, proving the
 * Phase 1 engine (`lib/asi/onam/asiOnamMotoru.ts`) is reusable as designed: every field here is
 * DATA, and nothing in the engine changed to add a sixth locale. See
 * `docs/ASI-ONAM-INTL-01-research.md` for the sourced legal-consent research behind the
 * `onamCumlesi` wording below, and `docs/OPEN-COMMITMENTS.md` (`ASI-ONAM-INTL-*`) for what is
 * explicitly still open per country.
 *
 * `pediatriBransi: 'pediatri'` for all six — confirmed by reading each
 * `release/<cc>:lib/specialties/registry.ts` directly: the branş KEY is never localized, only its
 * displayed label/content is. So this feature's branş gate (`asiOnamBransKapisi.ts`) needs no
 * change to run on any of the six country builds.
 *
 * DELIBERATELY NOT a vaccine-content dataset. `icerik: []` on every pack below is not an oversight
 * — building a vetted, per-vaccine, per-country dataset to Phase 1's Türkiye bar (name + protects-
 * against + common side effects, sourced against that country's own national schedule and WHO
 * material) is its own research-and-vetting pass per country, intentionally deferred rather than
 * rushed (see the brief's own fallback: "implement the generic framework/data structure with
 * clearly-labeled placeholder/draft content... never invent/guess medical content"). Each pack's
 * `onamCumlesi`-equivalent legal framing is left to the (likely country-specific) remote/portal UI
 * copy once a pack is actually switched on — NOT embedded here as a fake per-vaccine sentence,
 * because with `icerik: []` there is nothing for `asiOnamIstegiHazirla()` to resolve yet; every
 * country below is a registered, inert extension point, not a live, user-facing flow. Flipping one
 * on means: (1) write and cite that country's real `AsiOnamIcerigi[]`, (2) wire its branş-gated
 * portal module + API routes the same way `lib/portal/moduller.ts` does for Türkiye today, (3) get
 * the result reviewed the way `asiOnamIcerigi.ts`'s header asks for Dr. Gökhan's sign-off in TR.
 */
import type { AsiOnamUlkePaketi } from '../asiOnamMotoru'

/** GB — VERIFIED consent-law research (UKHSA Green Book ch.2, 27 Oct 2025). No vaccine content yet. */
export const GB_ASI_ONAM_PAKETI: AsiOnamUlkePaketi = {
  dil: 'en-GB',
  icerik: [],
  pediatriBransi: 'pediatri',
}

/** NZ — MODERATE consent-law research (Code of Health & Disability Services Consumers' Rights). */
export const NZ_ASI_ONAM_PAKETI: AsiOnamUlkePaketi = {
  dil: 'en-NZ',
  icerik: [],
  pediatriBransi: 'pediatri',
}

/** AU — BEST-EFFORT consent-law research (Queensland Health; other states/territories not checked). */
export const AU_ASI_ONAM_PAKETI: AsiOnamUlkePaketi = {
  dil: 'en-AU',
  icerik: [],
  pediatriBransi: 'pediatri',
}

/** CA — BEST-EFFORT consent-law research (British Columbia / HealthLinkBC; other provinces differ). */
export const CA_ASI_ONAM_PAKETI: AsiOnamUlkePaketi = {
  dil: 'en-CA',
  icerik: [],
  pediatriBransi: 'pediatri',
}

/** US — federal VIS-disclosure mandate VERIFIED; per-state consent-authority law UNCONFIRMED. */
export const US_ASI_ONAM_PAKETI: AsiOnamUlkePaketi = {
  dil: 'en-US',
  icerik: [],
  pediatriBransi: 'pediatri',
}

/**
 * UZ — UNCONFIRMED. No citable official source found for ROUTINE childhood-immunization consent
 * law (only COVID-specific news coverage turned up). Per the brief: no consent-law content is
 * assumed here beyond this bare, honest placeholder — do not fill `icerik` OR write an
 * `onamCumlesi`-equivalent for UZ without a real Ministry of Health or statutory source first.
 */
export const UZ_ASI_ONAM_PAKETI: AsiOnamUlkePaketi = {
  dil: 'uz',
  icerik: [],
  pediatriBransi: 'pediatri',
}

export const ASI_ONAM_ULKE_PAKETLERI = {
  gb: GB_ASI_ONAM_PAKETI,
  nz: NZ_ASI_ONAM_PAKETI,
  au: AU_ASI_ONAM_PAKETI,
  ca: CA_ASI_ONAM_PAKETI,
  us: US_ASI_ONAM_PAKETI,
  uz: UZ_ASI_ONAM_PAKETI,
} as const

export type AsiOnamUlkeKodu = keyof typeof ASI_ONAM_ULKE_PAKETLERI
