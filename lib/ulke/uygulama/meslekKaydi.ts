/**
 * NOTYA-ULKE — optional professional registration on a country account.
 *
 * Stored in auth user_metadata (the server writes it). It is NOT a column of ulke_hesaplari: that insert is a fixed
 * contract, and a database that has not taken a new migration still signs people up. user_metadata is writable by
 * the account, so every read checks the shape again. A value that does not match is treated as absent.
 *
 * Not checked against a register. Not an authorisation. Empty is acceptable.
 */

const BICIM = /^[A-Za-z0-9][A-Za-z0-9 ./-]{1,39}$/

/** '' = empty and acceptable. null = present and not acceptable. Otherwise the trimmed value. */
export function meslekKaydiGecerli(ham: unknown): string | null {
  if (ham === undefined || ham === null || ham === '') return ''
  if (typeof ham !== 'string') return null
  const s = ham.trim()
  if (!s) return ''
  if (s.length < 2 || s.length > 40 || !BICIM.test(s)) return null
  return s
}

/** A stored value, only when it still has the shape this product accepts. */
export function meslekKaydiOku(meta: unknown): string {
  if (!meta || typeof meta !== 'object') return ''
  const g = meslekKaydiGecerli((meta as { meslekKaydi?: unknown }).meslekKaydi)
  return g ?? ''
}
