/**
 * OP-DR-01 (Kaan, 2026-11-05) — THE DOCTOR'S TITLE AND POST-NOMINALS on a country account, as every printed record
 * carries them (the letterhead of an operation note, a report, a discharge summary).
 *
 * THE COUNTRY'S DATA MODEL, checked (international-data-model-dogrulama): a country account has no title column; its
 * optional professional identity lives in auth user_metadata (./meslekKaydi.ts: "that insert is a fixed contract, and a
 * database that has not taken a new migration still signs people up"). The title and the post-nominals follow the same
 * model: two optional values in user_metadata, written by the server, checked again on every read. No column is added.
 *
 * WHICH TITLES are the PACK's (`UlkePaketi.hekimUnvani.onEkler`, key → the words in every language form): the United
 * Kingdom's surgeons are "Mr", "Ms", "Miss", "Mrs" by tradition as well as "Dr"; the United States writes the degree
 * after the name ("MD", "DO") with board certification ("FACOG"); Australia and New Zealand "Dr" with "FRANZCOG";
 * Canada "Dr" with "FRCSC"; Uzbekistan its academic titles in its own languages. The post-nominals are the doctor's own
 * text (letters, digits, spaces, commas, full stops, brackets, ampersands, hyphens, slashes), never checked against a
 * register and never an authorisation.
 */
import type { BicimliMetin } from '@/lib/ulke/arayuz/tipler'

export type HekimUnvaniPaketi = {
  /** Title key → its words in every form. The order is the order offered. Empty = this country offers no title before the name. */
  onEkler: Readonly<Record<string, BicimliMetin>>
  /** An example of post-nominals in this country ("MD, FACOG"), in every form: the hint under the field. */
  ekOrnegi: BicimliMetin
}

const EK = /^[\p{L}][\p{L}\p{N} ,.()&/'-]{0,79}$/u

/** '' = empty and acceptable. null = present and not acceptable. Otherwise the key. */
export function unvanGecerli(paket: HekimUnvaniPaketi | undefined, ham: unknown): string | null {
  if (ham === undefined || ham === null || ham === '') return ''
  if (typeof ham !== 'string' || !paket) return null
  return Object.prototype.hasOwnProperty.call(paket.onEkler, ham) ? ham : null
}

/** '' = empty and acceptable. null = present and not acceptable. Otherwise the trimmed text, inner spaces collapsed. */
export function unvanEkiGecerli(ham: unknown): string | null {
  if (ham === undefined || ham === null || ham === '') return ''
  if (typeof ham !== 'string') return null
  const s = ham.replace(/\s+/g, ' ').trim()
  if (!s) return ''
  return EK.test(s) ? s : null
}

/** The stored values, only while they still have the accepted shape (user_metadata is writable by the account). */
export function unvanOku(meta: unknown, paket: HekimUnvaniPaketi | undefined): { unvan: string; unvanEki: string } {
  const m = meta && typeof meta === 'object' ? (meta as { unvan?: unknown; unvanEki?: unknown }) : {}
  return { unvan: unvanGecerli(paket, m.unvan) ?? '', unvanEki: unvanEkiGecerli(m.unvanEki) ?? '' }
}

/** The name as the letterhead prints it: "<title> <name>, <post-nominals>"; what is not set is left out. */
export function unvanliAd(ad: string, unvan: string | undefined, unvanEki: string | undefined, paket: HekimUnvaniPaketi | undefined, dil: string): string {
  const onEk = unvan && paket?.onEkler[unvan] ? (paket.onEkler[unvan][dil] ?? Object.values(paket.onEkler[unvan])[0] ?? '') : ''
  const yalin = ad.trim()
  const bas = [onEk, yalin].filter(Boolean).join(' ')
  return unvanEki ? `${bas}, ${unvanEki}` : bas
}
