/**
 * Australia — shape checks for two numbers a practice already handles.
 *
 * Read 2026-10-19, https://clearwater.com.au/code/medicare ("Australian Medicare Number Validation"):
 *   an 8-digit identifier, first digit 2–6, then one checksum digit. The eight digits are weighted
 *   1, 3, 7, 9, 1, 3, 7, 9; the sum modulo 10 is the checksum. A tenth digit is the issue number.
 *   An eleventh digit is the individual reference number. The page's sample expects 11 digits and
 *   says a 10-digit number (no reference number) is checked by changing that length. Neither digit
 *   is excluded by the page, so both 10-digit and 11-digit numbers are accepted. Spaces are ignored.
 *
 * Read 2026-10-19, https://clearwater.com.au/code/provider ("Validating Medicare Provider Numbers"):
 *   six stem digits (a five-digit stem is padded with a leading zero), one practice-location
 *   character, one check character. Location characters are 0–9 and A–Z except I, O, S and Z.
 *   The practice-location value is the index of that character in 0123456789ABCDEFGHJKLMNPQRTUVWXY.
 *   Remainder = (d1×3 + d2×5 + d3×8 + d4×4 + d5×2 + d6×1 + location×6) mod 11, mapped
 *   0–10 onto Y X W T L K J H F B A.
 *
 * Neither check looks a number up on a register. Neither stores a healthcare identifier.
 * The pages name no official rights grant; the tile that uses them says so.
 */

const MEDICARE_AGIRLIK = [1, 3, 7, 9, 1, 3, 7, 9] as const

/** True when the typed Medicare card number matches the checksum above. Empty is not valid here; the patient form still allows empty. */
export function medicareKartGecerli(ham: unknown): boolean {
  const rakam = String(ham ?? '').replace(/\D/g, '')
  if ((rakam.length !== 10 && rakam.length !== 11) || !/^[2-6]\d+$/.test(rakam)) return false
  let toplam = 0
  for (let i = 0; i < 8; i++) toplam += Number(rakam[i]) * MEDICARE_AGIRLIK[i]
  return toplam % 10 === Number(rakam[8])
}

const KONUM = '0123456789ABCDEFGHJKLMNPQRTUVWXY'
const KONTROL = 'YXWTLKJHFBA'
const SAGLAYICI_AGIRLIK = [3, 5, 8, 4, 2, 1] as const

/** True when the typed Medicare provider number matches the checksum above. */
export function providerNoGecerli(ham: unknown): boolean {
  const s = String(ham ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  const m = /^(\d{5,6})([0-9A-HJ-NP-RT-Y])([ABFHJKLTWXY])$/.exec(s)
  if (!m) return false
  const govde = m[1].length === 5 ? `0${m[1]}` : m[1]
  const plv = KONUM.indexOf(m[2])
  if (plv < 0) return false
  let toplam = plv * 6
  for (let i = 0; i < 6; i++) toplam += Number(govde[i]) * SAGLAYICI_AGIRLIK[i]
  return KONTROL[toplam % 11] === m[3]
}
