/**
 * NOTYA-UZ-FIYAT-UNVAN-01 — how the active country WRITES a number and an amount of money. Client-safe; every rule
 * is the pack's (`bicim.binlikAyraci`, `bicim.ondalikAyraci`, `paraBirimi.ondalikHane`), none is the kit's.
 *
 * Digits and the pack's two separators only. The WORD or sign of the currency is not written here: how a reader of
 * each language form writes it, and on which side of the number, is text of the pack's catalogues.
 */
import type { BicimKurallari } from '../tipler'
import { ulkePaketi } from '../ulke'

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
