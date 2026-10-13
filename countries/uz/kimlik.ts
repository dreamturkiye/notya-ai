/**
 * Uzbekistan: THE STRUCTURE OF THE PERSONAL IDENTIFICATION NUMBER (JSHSHIR; in Russian ПИНФЛ, PINFL), as the state
 * defines it. Country audit of 2026-10-09 (docs/COUNTRY-AUDIT-UZBEKISTAN.md, A13 and fix D3).
 *
 * SOURCE. Cabinet of Ministers Resolution No. 177 of 12 April 2022, the administrative regulation on determining and
 * issuing the personal identification number of an individual, paragraph 5: https://lex.uz/docs/5955665
 *
 *   14 digits:   N  DDMMYY  RRR  SSS  C
 *   N       1 digit    sex and century of birth: 1 / 2 a man / a woman born 1800–1899, 3 / 4 born 1900–1999,
 *                      5 / 6 born 2000–2099
 *   DDMMYY  6 digits   the date of birth
 *   RRR     3 digits   the code of the district or city
 *   SSS     3 digits   the serial number among those of the same birth date and district
 *   C       1 digit    the control digit: the first 13 digits weighted 7, 3, 1, 7, 3, 1 …, summed, modulo 10
 *
 * The regulation's own two examples (a man born 12 October 1993: 3 121093 204 024 7; a woman born 2 January 1990:
 * 4 020190 205 001 0) are in ./standartlar.test.ts and satisfy the rule below.
 *
 * NOT SWITCHED ON. The pack still stores the number as typed and refuses nothing (`uygulama.kimlikNumarasi.dogrula:
 * false` in ./index.ts, the owner's standing choice), and the pack's `ulusalKimlik.gecerliMi` is still "14 digits".
 * Whether to refuse a number that fails this structure, and whether a private product may ask a patient for the
 * number at all, are decisions for the owner and a question for a lawyer of the country (the audit document,
 * "Open items"). This file only states the verified rule in one place, so that switching it on is one line.
 *
 * Plain values and a pure function: no imports.
 */

/** The weights of the control digit, repeated over the first 13 digits. */
const SALMOQ = [7, 3, 1] as const
const ASR: Readonly<Record<string, number>> = { 1: 1800, 2: 1800, 3: 1900, 4: 1900, 5: 2000, 6: 2000 }

/** The control digit the regulation's rule gives for the first 13 digits of a number. null for anything else. */
export function uzJshshirNazoratRaqami(ilk13: string): number | null {
  if (!/^\d{13}$/.test(ilk13)) return null
  let toplam = 0
  for (let i = 0; i < 13; i++) toplam += Number(ilk13[i]) * SALMOQ[i % 3]
  return toplam % 10
}

/**
 * true = `ham` has the structure the regulation gives a JSHSHIR: 14 digits, a first digit of 1 to 6, a real calendar
 * date of birth in the century that digit names, and the right control digit. Spaces around the number are ignored;
 * nothing else is: a number typed with spaces or dashes inside is not accepted.
 */
export function uzJshshirYapisiGecerliMi(ham: string | null | undefined): boolean {
  const t = String(ham ?? '').trim()
  if (!/^\d{14}$/.test(t)) return false
  const asr = ASR[t[0]]
  if (asr === undefined) return false
  const kun = Number(t.slice(1, 3)), oy = Number(t.slice(3, 5)), yil = asr + Number(t.slice(5, 7))
  const sana = new Date(Date.UTC(yil, oy - 1, kun))
  if (sana.getUTCFullYear() !== yil || sana.getUTCMonth() !== oy - 1 || sana.getUTCDate() !== kun) return false
  return uzJshshirNazoratRaqami(t.slice(0, 13)) === Number(t[13])
}
