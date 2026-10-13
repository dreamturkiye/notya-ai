/**
 * NOTYA-UZ-FIYAT-UNVAN-01 — how the active country WRITES a number and an amount of money, and (further down) how it
 * READS a number a person typed. Client-safe; every rule is the pack's (`bicim.binlikAyraci`, `bicim.ondalikAyraci`,
 * `paraBirimi.ondalikHane`), none is the kit's.
 *
 * Digits and the pack's two separators only. The WORD or sign of the currency is not written here: how a reader of
 * each language form writes it, and on which side of the number, is text of the pack's catalogues.
 */
import type { BicimKurallari } from '../tipler'
import { ulkePaketi } from '../ulke'
import { sayiCozKuralla, type SayiKurali, type SayiOkuma } from './sayiOkuma'

/** A number with thousands grouped in threes by the given separator. '' for anything that is not a finite number. */
export function sayiYazKuralla(sayi: number, kural: Pick<BicimKurallari, 'binlikAyraci' | 'ondalikAyraci'>, ondalikHane = 0): string {
  if (typeof sayi !== 'number' || !Number.isFinite(sayi)) return ''
  const hane = Number.isInteger(ondalikHane) && ondalikHane > 0 ? ondalikHane : 0
  const [tam, kesir] = Math.abs(sayi).toFixed(hane).split('.')
  const gruplu = tam.replace(/\B(?=(\d{3})+(?!\d))/g, kural.binlikAyraci)
  return `${sayi < 0 ? '-' : ''}${gruplu}${kesir ? `${kural.ondalikAyraci}${kesir}` : ''}`
}

/** A number as the active country writes it. */
export const sayiYaz = (sayi: number, ondalikHane = 0): string => sayiYazKuralla(sayi, ulkePaketi().bicim, ondalikHane)

/** An amount of the active country's currency as it writes numbers, with the currency's own decimal places. */
export const tutarYaz = (tutar: number): string => sayiYazKuralla(tutar, ulkePaketi().bicim, ulkePaketi().paraBirimi.ondalikHane)

// ───────────────────────── reading a number a person typed (NOTYA-ULKE-DENETIM-01a) ─────────────────────────
// The parser itself is pure and lives in ./sayiOkuma.ts; here are the active country's rules handed to it.

export { sayiCozKuralla, sayiYaziliyorMu, type SayiKurali, type SayiOkuma } from './sayiOkuma'

/** The number rules of the active country. */
export const sayiKurali = (): SayiKurali => ulkePaketi().bicim

/** A typed number as the active country reads it. */
export const sayiCoz = (ham: unknown): SayiOkuma => sayiCozKuralla(ham, sayiKurali())

/**
 * A number as the text of a field the active country types into: no grouping, the pack's own decimal mark. What
 * `sayiCoz` reads back is the same number, in every pack (a stored 1.125 is "1,125" where the comma is the decimal mark).
 */
export const sayiAlanMetni = (sayi: number): string => (Number.isFinite(sayi) ? String(sayi).replace('.', sayiKurali().ondalikAyraci) : '')

/** The two examples the "type it again" sentence shows: a whole number with its thousands, and a number with a decimal. */
export const sayiOrnekleri = (kural: SayiKurali): readonly [string, string] => [sayiYazKuralla(1500, kural), sayiYazKuralla(1.5, kural, 1)]
