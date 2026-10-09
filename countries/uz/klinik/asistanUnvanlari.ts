/**
 * NOTYA-UZ-FIYAT-UNVAN-01 — Uzbekistan: the assistant's TITLES as each text form writes them (Uzbek in Latin script,
 * Uzbek in Cyrillic script, Russian). The catalogue of titles: a title is written here and nowhere else.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. Which role carries which title is the Turkish product's convention, by the
 * owner's instruction of 2026-10-09 (./asistanAdlari.ts). HOW each title is written in Uzbek and in Russian was
 * chosen by a machine and has been read by nobody who speaks either language natively:
 *   - "Prof. Dr." has no single settled form in Russian or in Uzbek Cyrillic. The closest common abbreviations are
 *     kept, «Проф. д-р»; a native reader may prefer «Проф.» alone, or «профессор» written out.
 *   - "Dr." is «Д-р», the usual Russian abbreviation (the letter-by-letter rule of ../yozuv.ts gave «Др.» before).
 *   - Whether Uzbek in Latin script writes "Prof. Dr." before a name at all is for the native reader to confirm.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * `tam` stands before the full name ("Prof. Dr. <given> <family>"); `kisa` stands before the given name alone
 * ("Prof. <given>"), the way the Turkish landing page names its assistant.
 *
 * Not here: the profession titles of the four allied roles (./asistanAdlari.ts → `meslekUnvani`). Those are the
 * owner's own words and are converted with the name by rule (../yozuv.ts).
 *
 * A TITLE IS NOT A BIOGRAPHY. Nothing here or on any screen says how long an assistant has practised, where, or with
 * what degree.
 */
import type { AsistanUnvani } from './asistanAdlari'
import type { UzAdDili } from './rolAdlari'

export type UnvanBicimi = { /** Before the full name. */ tam: string; /** Before the given name alone. */ kisa: string }

export const UZ_ASISTAN_UNVANLARI: Readonly<Record<UzAdDili, Readonly<Record<Exclude<AsistanUnvani, 'meslek'>, UnvanBicimi>>>> = {
  'uz-Latn': { 'prof-dr': { tam: 'Prof. Dr.', kisa: 'Prof.' }, dr: { tam: 'Dr.', kisa: 'Dr.' } },
  'uz-Cyrl': { 'prof-dr': { tam: 'Проф. д-р', kisa: 'Проф.' }, dr: { tam: 'Д-р', kisa: 'Д-р' } },
  ru: { 'prof-dr': { tam: 'Проф. д-р', kisa: 'Проф.' }, dr: { tam: 'Д-р', kisa: 'Д-р' } },
}
