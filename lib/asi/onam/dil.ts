/**
 * NOTYA-ASI-ONAM-01 — translation-key scaffolding for the consent dataset and its UI strings.
 *
 * Phase 1 ships Turkish only (Kaan's standing rule: everything outside Notya is English, but
 * Notya's own product content — this consent form IS the product content shown to a Turkish
 * parent — stays Turkish). Phase 2 (the six non-Turkey country modules) adds a `Ceviri` entry per
 * locale instead of touching this shape or any caller — that is the whole point of keying every
 * string by locale from day one instead of writing plain Turkish strings into the dataset.
 *
 * `tr` is required on every `Ceviri` (it is the only locale that exists today and the fallback
 * for a locale not yet translated); every other locale is optional until it is actually written
 * and reviewed for that country (never machine-translated at render time — see
 * .cursor/skills/international-data-model-dogrulama/SKILL.md: a translated label is not a
 * substitute for a country's own real content).
 */

/** BCP-47-ish locale key. Phase 2 adds 'en-US' | 'en-GB' | 'en-CA' | 'en-AU' | 'en-NZ' | 'uz' here. */
export type AsiOnamDil = 'tr' | (string & {})

export const VARSAYILAN_ONAM_DILI: AsiOnamDil = 'tr'

export type Ceviri = { tr: string } & Partial<Record<string, string>>

/** Resolves one locale's text, falling back to 'tr' (never to a machine translation). */
export function ceviriCoz(metin: Ceviri, dil: AsiOnamDil = VARSAYILAN_ONAM_DILI): string {
  return metin[dil] ?? metin.tr
}

export function ceviriListesiCoz(liste: readonly Ceviri[], dil: AsiOnamDil = VARSAYILAN_ONAM_DILI): string[] {
  return liste.map((m) => ceviriCoz(m, dil))
}

export function dilGecerliMi(x: unknown): x is AsiOnamDil {
  return typeof x === 'string' && x.length > 0 && x.length <= 10
}
