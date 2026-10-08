/**
 * NOTYA-ULKE-01 — invitation codes for a country whose sign-up is not open yet (checklist rule 9).
 *
 * A code is random, shown once to the person who issues it, and stored only as a SHA-256 hash (table davet_kodlari,
 * migration 129) — the same way staff invitation tokens are stored. Codes are long enough that guessing is not a
 * realistic attack: 16 characters of a 32-letter alphabet = 80 bits.
 *
 * Pure; used by the sign-up route and by scripts/ulke-davet-kodu.mjs (which issues codes).
 */
import { createHash, randomInt } from 'node:crypto'

/** No I, L, O, U: nothing that can be misread or spell a word. */
export const DAVET_ALFABESI = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const DAVET_KODU_UZUNLUGU = 16

/** What the person typed → the canonical form: upper case, letters and digits only, look-alikes folded. */
export function davetKoduNormalle(ham: unknown): string {
  return String(ham ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
}

/** true = has the shape of a code this system issues. Says nothing about whether it exists. */
export function davetKoduBicimiGecerli(ham: unknown): boolean {
  const k = davetKoduNormalle(ham)
  return k.length === DAVET_KODU_UZUNLUGU && [...k].every((c) => DAVET_ALFABESI.includes(c))
}

export function davetKoduHash(ham: unknown): string {
  return createHash('sha256').update(davetKoduNormalle(ham)).digest('hex')
}

/** A new code, grouped for reading aloud: XXXX-XXXX-XXXX-XXXX. */
export function davetKoduUret(): string {
  let k = ''
  for (let i = 0; i < DAVET_KODU_UZUNLUGU; i++) k += DAVET_ALFABESI[randomInt(DAVET_ALFABESI.length)]
  return k.replace(/(.{4})(?=.)/g, '$1-')
}
