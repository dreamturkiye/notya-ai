/**
 * NOTYA-ULKE-01 — proof that the translation mechanism fails the BUILD, not the screen.
 *
 * Nothing imports this file; the type checker reads it (tsconfig includes every .ts, and `next build` type-checks).
 * Each `@ts-expect-error` below marks a pack definition that MUST NOT compile. If the types ever stop rejecting one
 * of them, the directive itself becomes an error ("unused @ts-expect-error") and the type check — and the build — fail.
 */
import { paketMetinleri, type YuzeyMetinleri } from '@/lib/ulke/tipler'

const tam: YuzeyMetinleri<'hesap'> = { girisReddi: 'x' }

// A complete definition compiles.
export const GECERLI = paketMetinleri({
  acikDiller: ['uz-Latn', 'ru'],
  yuzeyler: ['hesap'],
  metinler: { 'uz-Latn': { hesap: tam }, ru: { hesap: tam } },
})

// 1. A key missing from one language.
// @ts-expect-error — Property 'girisReddi' is missing
export const EKSIK_ANAHTAR: YuzeyMetinleri<'hesap'> = {}

// 2. A switched-on language with no catalogue.
export const EKSIK_DIL = paketMetinleri({
  acikDiller: ['uz-Latn', 'ru'],
  yuzeyler: ['hesap'],
  // @ts-expect-error — Property 'ru' is missing
  metinler: { 'uz-Latn': { hesap: tam } },
})

// 3. A switched-on surface missing from one language.
export const EKSIK_YUZEY = paketMetinleri({
  acikDiller: ['uz-Latn', 'ru'],
  yuzeyler: ['hesap'],
  // @ts-expect-error — Property 'hesap' is missing in the Russian catalogue
  metinler: { 'uz-Latn': { hesap: tam }, ru: {} },
})

// 4. A key that the source does not have (a typo cannot ship as a silent blank).
export const FAZLA_ANAHTAR: YuzeyMetinleri<'hesap'> = {
  girisReddi: 'x',
  // @ts-expect-error — 'girisRedi' does not exist
  girisRedi: 'x',
}
