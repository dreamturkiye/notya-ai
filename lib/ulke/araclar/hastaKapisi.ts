/**
 * NOTYA-ULKE-OZEL-01 — A TOOL BY THE PATIENT'S AGE AND SEX, beside the role. Pure, and the same on both sides: the
 * screen asks it for the grid and for one tool, the server asks it again before it keeps a result.
 *
 * A pack may say a tool is for patients of an age range, of one sex, or both (`PaketAraci.hasta`), with the sentence
 * that says so in its own words (`metin.hastaKapisi`). The rule:
 *
 *   no gate                          the tool is for every patient                                   → 'kapisiz'
 *   a gate, and NO patient           the tool opens; its screen shows the pack's sentence above the
 *                                    fields. Nothing is kept without a patient anyway.               → 'hastasiz'
 *   a gate, a patient who fits       the tool opens                                                  → 'uygun'
 *   a gate, a patient who does not   the tool is not on that patient's grid, does not open from its
 *                                    address for that patient, and the server keeps nothing          → 'degil'
 *
 * WHAT IS NOT KNOWN NEVER FITS. A patient without a birth date does not pass an age limit, and a patient without a
 * recorded sex does not pass a sex limit: a missing fact is never read as the reassuring one.
 *
 * Age is in whole years on `bugun` — the day in the account's own time zone, as everywhere in the tools area.
 */
import type { HastaKapisi } from './tipler'

/** What the gate needs of a patient: both as the patient's file holds them ('' or null = not recorded). */
export type AracHastaBilgisi = { dogumTarihi?: string | null; cinsiyet?: string | null }

export type KapiSonucu = 'kapisiz' | 'hastasiz' | 'uygun' | 'degil'

const GUN = /^(\d{4})-(\d{2})-(\d{2})/

/** Whole years from the birth date to `gun`. null = a date is missing or malformed, or the birth date is after `gun`. */
export function tamYas(dogumTarihi: string | null | undefined, gun: string | null | undefined): number | null {
  const d = GUN.exec(String(dogumTarihi ?? '')), g = GUN.exec(String(gun ?? ''))
  if (!d || !g) return null
  let yil = Number(g[1]) - Number(d[1])
  if (Number(g[2]) < Number(d[2]) || (Number(g[2]) === Number(d[2]) && Number(g[3]) < Number(d[3]))) yil -= 1
  return yil >= 0 ? yil : null
}

/** true = the gate limits nothing (absent, or an object without a limit). */
export const kapiBosMu = (k: HastaKapisi | null | undefined): boolean => !k || (typeof k.enAzYas !== 'number' && typeof k.enCokYas !== 'number' && k.cinsiyet !== 'female' && k.cinsiyet !== 'male')

/** THE DECISION. `hasta` null = the tool was opened without a patient. */
export function kapiSonucu(kapi: HastaKapisi | null | undefined, hasta: AracHastaBilgisi | null | undefined, bugun: string): KapiSonucu {
  if (kapiBosMu(kapi)) return 'kapisiz'
  if (!hasta) return 'hastasiz'
  const k = kapi as HastaKapisi
  if (k.cinsiyet === 'female' || k.cinsiyet === 'male') {
    // not recorded = not known = does not pass
    if (hasta.cinsiyet !== k.cinsiyet) return 'degil'
  }
  if (typeof k.enAzYas === 'number' || typeof k.enCokYas === 'number') {
    const yas = tamYas(hasta.dogumTarihi, bugun)
    if (yas === null) return 'degil'
    if (typeof k.enAzYas === 'number' && yas < k.enAzYas) return 'degil'
    if (typeof k.enCokYas === 'number' && yas > k.enCokYas) return 'degil'
  }
  return 'uygun'
}
