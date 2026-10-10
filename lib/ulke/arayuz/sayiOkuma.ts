/**
 * NOTYA-ULKE-DENETIM-01a — READING A NUMBER A PERSON TYPED. PURE: no pack is imported here; the country's rules come
 * in as an argument, so the same function serves the screens, the server and the tests of every pack. The active
 * country's wrappers are in ./sayi.ts.
 */
import type { BicimKurallari } from '../tipler'

/**
 * HOW A COUNTRY READS A NUMBER A PERSON TYPED. One parser for every number field of the kit: a tool's fields on the
 * screen and again on the server (lib/ulke/araclar/girdi.ts), and the patient's intake form.
 *
 * THE RULE ABOVE ALL: A NUMBER THAT CAN BE READ TWO WAYS IS REFUSED, NEVER GUESSED. The person is asked to type it
 * again (the pack's `girdi.sayiOkunamadi`). Before this parser the kit turned the first comma into a point, so
 * "1,500" typed in a country that groups thousands with a comma became 1.5.
 *
 *   the decimal mark     the pack's `bicim.ondalikAyraci`, once, with a digit on both sides
 *   thousands            the pack's `bicim.binlikAyraci`, and in every country a space (also the no-break, narrow
 *                        no-break and thin space: the international way to group digits, which can never be a
 *                        decimal mark). Accepted ONLY as correct grouping: one kind of mark, groups of exactly
 *                        three, a first group of one to three digits that does not begin with 0, and never after
 *                        the decimal mark.
 *   a point where the comma is the decimal mark and the point is not the pack's thousands mark (Uzbekistan)
 *                        read as the decimal mark, because many phone keypads offer no comma — EXCEPT where the
 *                        same text could be thousands written with points ("1.500", "12.345.678"): refused.
 *   everything else      refused: a comma that is not correct grouping where the point is the decimal mark ("1,5",
 *                        "0,125"), two decimal marks, mixed grouping marks, a sign other than a leading minus,
 *                        letters, an exponent.
 *
 * Pure: the rules come in as an argument.
 */
export type SayiKurali = Pick<BicimKurallari, 'binlikAyraci' | 'ondalikAyraci'>

/** 'bos' = nothing was typed. 'okunamadi' = something was typed and it is not a number written this country's way. */
export type SayiOkuma = { tamam: true; sayi: number } | { tamam: false; neden: 'bos' | 'okunamadi' }

const BOS_SAYI: SayiOkuma = { tamam: false, neden: 'bos' }
const OKUNAMADI: SayiOkuma = { tamam: false, neden: 'okunamadi' }
/** Space, no-break space, narrow no-break space, thin space: all read as one grouping mark. */
const BOSLUKLAR = /[    ]/g
/** Longer than any number a field of the kit takes; keeps a pasted wall of digits out of the arithmetic. */
const SAYI_AZAMI_UZUNLUK = 24
const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Correct grouping with `isaret`: one to three digits not beginning with 0, then groups of exactly three. */
const grupluMu = (metin: string, isaret: string) => new RegExp(`^[1-9]\\d{0,2}(?:${kacis(isaret)}\\d{3})+$`).test(metin)

export function sayiCozKuralla(ham: unknown, kural: SayiKurali): SayiOkuma {
  if (typeof ham !== 'string') return BOS_SAYI
  let t = ham.trim()
  if (t === '') return BOS_SAYI
  if (t.length > SAYI_AZAMI_UZUNLUK) return OKUNAMADI
  const eksi = t[0] === '-' || t[0] === '−'
  if (eksi) t = t.slice(1)
  t = t.replace(BOSLUKLAR, ' ')
  if (!/^[0-9., ]+$/.test(t)) return OKUNAMADI
  const ondalik = kural.ondalikAyraci
  let tam = t
  let kesir = ''
  if (t.includes(ondalik)) {
    const p = t.split(ondalik)
    if (p.length !== 2) return OKUNAMADI
    ;[tam, kesir] = p
    if (!/^\d+$/.test(kesir)) return OKUNAMADI
  } else if (ondalik === ',' && kural.binlikAyraci !== '.' && t.includes('.')) {
    // A point in a country of the decimal comma whose thousands mark is not the point: a decimal mark, unless the
    // same text could be thousands written with points. Then nobody can know which was meant.
    if (!/^\d+\.\d+$/.test(t) || grupluMu(t, '.')) return OKUNAMADI
    ;[tam, kesir] = t.split('.')
  }
  if (tam === '') return OKUNAMADI
  if (!/^\d+$/.test(tam)) {
    const isaretler = [...new Set(tam.replace(/\d/g, '').split(''))]
    if (isaretler.length !== 1) return OKUNAMADI
    const isaret = isaretler[0]
    if (isaret !== ' ' && isaret !== kural.binlikAyraci) return OKUNAMADI
    if (!grupluMu(tam, isaret)) return OKUNAMADI
    tam = tam.split(isaret).join('')
  }
  const sayi = Number(kesir ? `${tam}.${kesir}` : tam)
  if (!Number.isFinite(sayi)) return OKUNAMADI
  return { tamam: true, sayi: sayi === 0 ? 0 : eksi ? -sayi : sayi }
}

/**
 * true = what is typed so far is a number, or can still become one by typing more digits ("1," on the way to
 * "1,500"; "18." on the way to "18.5"). A screen uses it to wait with its message while the person is still typing.
 */
export function sayiYaziliyorMu(ham: unknown, kural: SayiKurali): boolean {
  if (typeof ham !== 'string' || ham.trim() === '') return true
  return ['', '0', '00', '000'].some((ek) => sayiCozKuralla(`${ham.trim()}${ek}`, kural).tamam)
}
