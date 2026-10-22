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

// ───────────────────────── AU-BETA-01 (2026-10-22): practice identity — ABN, AHPRA, provider-number FORMAT, address ─────────────────────────

/**
 * ABN. The public weighting check of the Australian Business Register, read 2026-10-22 at
 * https://abr.business.gov.au/Help/AbnFormat : subtract 1 from the first digit, multiply the eleven digits by
 * 10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, add, divide by 89; a remainder of zero is a valid ABN. The page's worked
 * example, 51 824 753 556, is a test of this file. A passing number is a well-formed ABN, not a register lookup:
 * whether the business exists or is registered for GST is not known here.
 */
const ABN_AGIRLIK = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19] as const
export function abnGecerli(ham: unknown): boolean {
  const rakam = String(ham ?? '').replace(/[\s-]/g, '')
  if (!/^\d{11}$/.test(rakam)) return false
  let toplam = 0
  for (let i = 0; i < 11; i++) toplam += (Number(rakam[i]) - (i === 0 ? 1 : 0)) * ABN_AGIRLIK[i]
  return toplam % 89 === 0
}

/**
 * AHPRA registration number: "3 uppercase letters, followed by 10 digits" (the Australian FHIR base profile's rule
 * `^[A-Z]{3}[0-9]{10}$`, read 2026-10-22 at https://hl7.org.au/fhir/4.1.0-ballot/StructureDefinition-au-ahpraregistrationnumber.html ;
 * its example is MED0000932846). FORMAT ONLY: the register at ahpra.gov.au is not queried and nothing is authorised.
 * Lower case and spaces are accepted on input and normalised.
 */
export function ahpraNoBicimi(ham: unknown): string | null {
  const s = String(ham ?? '').replace(/\s+/g, '').toUpperCase()
  return /^[A-Z]{3}\d{10}$/.test(s) ? s : null
}

/**
 * Medicare provider number, FORMAT ONLY for the practice profile: eight characters — six digits, one practice-location
 * character (a letter or digit but not I, O, S, Z or 0), one check character from Y X W T L K J H F B A. Source: the
 * Australian digital-health namespace page https://developer.digitalhealth.gov.au/namespaces/id/medicare-provider-number/index.html ,
 * read 2026-10-22. That page does not publish how the check character is worked out, so the profile does NOT apply the
 * checksum (the identifier-check TOOL, ./kimlik.ts providerNoGecerli, does, from a third-party page; it is not an official source).
 */
export function providerNoBicimi(ham: unknown): string | null {
  const s = String(ham ?? '').replace(/\s+/g, '').toUpperCase()
  return /^\d{6}[1-9A-HJ-NP-RT-Y][YXWTLKJHFBA]$/.test(s) ? s : null
}

export const AU_EYALETLER = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'] as const
export type AuEyalet = (typeof AU_EYALETLER)[number]

/**
 * Postcode ranges by state or territory as listed in https://en.wikipedia.org/wiki/Postcodes_in_Australia ,
 * read 2026-10-22 (a public reference, not Australia Post's own table). Used for a WARNING only, never for a refusal:
 * border and island postcodes exist. The ranges include the large-volume-receiver and PO Box blocks.
 */
const POSTA_ARALIKLARI: Readonly<Record<AuEyalet, readonly (readonly [number, number])[]>> = {
  NSW: [[1000, 1999], [2000, 2599], [2619, 2899], [2921, 2999]],
  ACT: [[200, 299], [2600, 2618], [2900, 2920]],
  VIC: [[3000, 3996], [8000, 8999]],
  QLD: [[4000, 4999], [9000, 9999]],
  SA: [[5000, 5799], [5800, 5999]],
  WA: [[6000, 6797], [6800, 6999]],
  TAS: [[7000, 7799], [7800, 7999]],
  NT: [[800, 899], [900, 999]],
}
/** Four digits (a leading zero is allowed: 0800 is Darwin). */
export function postaKoduBicimi(ham: unknown): string | null {
  const s = String(ham ?? '').trim()
  return /^\d{4}$/.test(s) ? s : null
}
/** true = the postcode is in a range listed for that state. */
export function postaKoduEyalette(kod: string, eyalet: string): boolean {
  const ara = POSTA_ARALIKLARI[eyalet as AuEyalet]
  const n = Number(kod)
  return Boolean(ara) && ara.some(([a, b]) => n >= a && n <= b)
}
export const eyaletMi = (ham: unknown): ham is AuEyalet => typeof ham === 'string' && (AU_EYALETLER as readonly string[]).includes(ham)
