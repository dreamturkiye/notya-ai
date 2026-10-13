/**
 * NOTYA-ULKE-ARAC-DUZELTME-01 — HOW A NUMBER OF A RESULT IS WRITTEN. Pure; no text of any country.
 *
 * TWO RULES, and neither is a rounding to anything a person can measure:
 *
 *   SIGNIFICANT FIGURES (`gosterimOndaligi`). A result number states its decimal places (`ondalik`). Where the value
 *   is so small that those places would show fewer significant figures than the number asks for (`anlamli`), more
 *   places are written. 0.16 mL with two places and three figures is written "0.160" — and, where the country writes
 *   no zero after the decimal mark, "0.16". It can never be written "0.2", and a small amount is never "0.0".
 *
 *   NO ZERO AFTER THE DECIMAL MARK (`sondakiSifirlariAt`), for an amount of a medicine, where the PACK says its
 *   country writes a dose that way (`UlkeAraclari.dozYazimi.sondaSifir: false`). The rule is each country's own
 *   national rule on writing a dose; the kit holds none. Sources read on 2026-10-10, cited in each pack's `ayarlar.ts`.
 */

/** No number is written with more places than this. */
export const GOSTERIM_ONDALIK_AZAMI = 6

/** The decimal places a value is written with: `ondalik`, or as many more as `anlamli` significant figures need. */
export function gosterimOndaligi(deger: number, ondalik: number, anlamli?: number): number {
  const taban = Number.isInteger(ondalik) && ondalik > 0 ? ondalik : 0
  if (!anlamli || !Number.isFinite(deger) || deger === 0) return taban
  // 0.16 → -1; 5 → 0; 160 → 2
  const buyukluk = Math.floor(Math.log10(Math.abs(deger)))
  return Math.min(GOSTERIM_ONDALIK_AZAMI, Math.max(taban, anlamli - 1 - buyukluk))
}

/**
 * A written number without the zeros that end its decimal part, and without the decimal mark where nothing is left
 * behind it: "5.00" → "5", "2.50" → "2.5", "0.160" → "0.16". A number written without a decimal part is returned
 * as it is ("1,500" where the comma groups thousands; "160").
 */
export function sondakiSifirlariAt(metin: string, ondalikAyraci: string): string {
  if (typeof metin !== 'string' || !ondalikAyraci) return metin
  const i = metin.lastIndexOf(ondalikAyraci)
  if (i < 0 || !/^\d+$/.test(metin.slice(i + ondalikAyraci.length))) return metin
  const kesir = metin.slice(i + ondalikAyraci.length).replace(/0+$/, '')
  return kesir ? `${metin.slice(0, i)}${ondalikAyraci}${kesir}` : metin.slice(0, i)
}

/**
 * The decimal places a number THE DOCTOR TYPED is repeated with: as many as it has (up to the limit), never fewer.
 * A typed 0.15 is repeated as "0.15", never as "0.2".
 */
export function yazilanOndalik(deger: number): number {
  if (!Number.isFinite(deger)) return 0
  for (let n = 0; n < GOSTERIM_ONDALIK_AZAMI; n++) if (Math.abs(deger - Number(deger.toFixed(n))) <= 1e-9 * Math.max(1, Math.abs(deger))) return n
  return GOSTERIM_ONDALIK_AZAMI
}
