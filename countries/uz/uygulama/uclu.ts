/**
 * NOTYA-ULKE-MESAJ-01 — Uzbekistan: A CATALOGUE WRITTEN ONCE, IN THE THREE FORMS SIDE BY SIDE.
 *
 * A catalogue of this folder can be written as one tree whose every leaf is `u(latin, cyrillic, russian)`, and the
 * three catalogues the kit asks for are then read out of it with `bicimSec`. Why: the Cyrillic form of a text is
 * DERIVED FROM ITS LATIN FORM BY RULE (scripts/uz-kiril.mjs, country tooling; no build runs it), and a text that sits
 * beside its Latin source can be filled by that script and held to the rule by a test
 * (./araclar/kiril.test.ts). The result is stored static: nothing is converted while the product runs.
 *
 * The shape is still the kit's type: `Uclu<T>` has every key of T, so a missing key is a type error in all three.
 */
import type { Uc } from './araclar/yardimci'

export { u, type Uc } from './araclar/yardimci'

export type UzBicimi = 'uz-Latn' | 'uz-Cyrl' | 'ru'
export const UZ_BICIMLERI: readonly UzBicimi[] = ['uz-Latn', 'uz-Cyrl', 'ru']

/** A catalogue type with each sentence in the three forms. */
export type Uclu<T> = { readonly [K in keyof T]: NonNullable<T[K]> extends string ? Uc : Uclu<NonNullable<T[K]>> }

const ucMu = (x: unknown): x is Uc => typeof x === 'object' && x !== null && typeof (x as Uc)['uz-Latn'] === 'string' && typeof (x as Uc)['uz-Cyrl'] === 'string' && typeof (x as Uc).ru === 'string'

/** One form of a three-form tree, as the catalogue the kit reads. */
export function bicimSec<T>(agac: Uclu<T>, dil: UzBicimi): T {
  const gez = (x: unknown): unknown => (ucMu(x) ? x[dil] : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, gez(v)])) : x)
  return gez(agac) as T
}

/** The three catalogues of a tree, keyed by form. */
export const ucBicim = <T,>(agac: Uclu<T>): Readonly<Record<UzBicimi, T>> => ({ 'uz-Latn': bicimSec(agac, 'uz-Latn'), 'uz-Cyrl': bicimSec(agac, 'uz-Cyrl'), ru: bicimSec(agac, 'ru') })
