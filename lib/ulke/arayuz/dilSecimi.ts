/**
 * NOTYA-ULKE-SABLON-01 — LANGUAGE AND SCRIPT as the screens ask for them, for any country. Pure: the pack's groups
 * (`uygulama.dilGruplari`) come in as an argument.
 *
 * A language FORM is a code of the pack's application languages ('uz-Latn', 'uz-Cyrl', 'ru', 'en'). A screen asks two
 * smaller questions instead: WHICH LANGUAGE (`temel`: 'uz', 'ru', 'en') and, where that language has more than one,
 * WHICH SCRIPT (`yazi`: 'Latn', 'Cyrl'). A country with one language asks no language; a language with one script
 * asks no script; a country with one language in one script asks nothing at all.
 *
 * The kit supports at most ONE language with more than one script per country: the screens keep one script choice.
 * The pack check (lib/ulke/paketDenetimi.ts) refuses a pack with two.
 */
import type { DilGrubu, DilKodu } from '../tipler'

const grubu = (g: readonly DilGrubu[], dil: string): DilGrubu | undefined => g.find((x) => x.bicimler.some((b) => b.dil === dil))

/** The language of a form: 'uz-Cyrl' → 'uz'. '' for a form the country does not have. */
export function temelDil(g: readonly DilGrubu[], dil: string): string {
  return grubu(g, dil)?.temel ?? ''
}

/** The script of a form: 'uz-Cyrl' → 'Cyrl'; null where its language has one script (or the form is unknown). */
export function yaziSec(g: readonly DilGrubu[], dil: string): string | null {
  return grubu(g, dil)?.bicimler.find((b) => b.dil === dil)?.yazi ?? null
}

/** The language that has more than one script, if the country has one. */
export function cokYaziliGrup(g: readonly DilGrubu[]): DilGrubu | null {
  return g.find((x) => x.bicimler.length > 1) ?? null
}

/** The script a choice starts from: the first script of the multi-script language. null = the country has no script choice. */
export function varsayilanYazi(g: readonly DilGrubu[]): string | null {
  return cokYaziliGrup(g)?.bicimler[0].yazi ?? null
}

/**
 * Language + script → the form. A language with one script ignores the script; a script the language does not have
 * gives the language's first form. null = the country does not have that language.
 */
export function dilBirlestir(g: readonly DilGrubu[], temel: string, yazi: string | null): DilKodu | null {
  const x = g.find((y) => y.temel === temel)
  if (!x) return null
  return (x.bicimler.find((b) => b.yazi === yazi) ?? x.bicimler[0]).dil
}

/** true = choosing `temel` also means choosing a script. */
export function yaziSorulurMu(g: readonly DilGrubu[], temel: string): boolean {
  return (g.find((x) => x.temel === temel)?.bicimler.length ?? 0) > 1
}

/**
 * The form a text FOR A PATIENT is written in, from the patient's own language and the doctor's two forms: the
 * patient's language; where it has several scripts, the one the doctor uses (interface first, then notes, then the
 * language's first form) — a patient's script is not recorded. An unknown patient language follows the doctor.
 */
export function hastaIcinBicim(g: readonly DilGrubu[], hastaDili: string, hekim: { dil: DilKodu; notDili: DilKodu }): DilKodu {
  const x = g.find((y) => y.temel === hastaDili)
  if (!x) return hekim.dil
  if (x.bicimler.length === 1) return x.bicimler[0].dil
  if (temelDil(g, hekim.dil) === hastaDili) return hekim.dil
  if (temelDil(g, hekim.notDili) === hastaDili) return hekim.notDili
  return x.bicimler[0].dil
}
