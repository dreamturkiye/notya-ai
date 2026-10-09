/**
 * NOTYA-ULKE-SABLON-01 — "TO BE SUPPLIED". How a country pack says that a piece of content or a setting is still
 * missing, so that it compiles (the keys are all there) and yet CANNOT BE BUILT OR SHOWN.
 *
 * `node scripts/ulke-yeni.mjs <code> …` writes a new pack with every piece of content as `eksik('…')` and every
 * setting that needs a decision as `eksikAyar('…')`. The text inside is a hint for whoever supplies it — never text
 * for a screen. Until every one of them is replaced:
 *   - the build of that country stops before it compiles, with the list of every place still marked
 *     (scripts/ulke-paket-denetimi.mjs, through the gate in the country's own countries/<code>/derleme.mjs);
 *   - the pack check (lib/ulke/paketDenetimi.ts) reports each of them, and the country's root layout refuses to load.
 * No other country is affected: a build holds one pack.
 */

/** Starts every piece of text that is still to be supplied. Not a word of any language, so it cannot be mistaken for content. */
export const EKSIK_ISARETI = '⟦SUPPLY⟧'

/** A text that is still to be supplied. `ipucu` says what belongs there (for an English-speaking country: a reference wording). */
export const eksik = (ipucu: string): string => `${EKSIK_ISARETI} ${ipucu}`

/** A setting that is still to be decided (a number, a choice, a list, a rule). Typed as the setting, so the pack compiles. */
export function eksikAyar<T>(ipucu: string): T {
  return { __eksikAyar: ipucu } as unknown as T
}

export const eksikMetinMi = (ham: unknown): boolean => typeof ham === 'string' && ham.includes(EKSIK_ISARETI)
export const eksikAyarMi = (ham: unknown): ham is { __eksikAyar: string } => typeof ham === 'object' && ham !== null && typeof (ham as { __eksikAyar?: unknown }).__eksikAyar === 'string'
