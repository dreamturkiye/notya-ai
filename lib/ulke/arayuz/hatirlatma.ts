/**
 * NOTYA-UZ-RANDEVU-01 · NOTYA-ULKE-SABLON-01 — the REMINDER TEXT for one appointment: a short message the doctor
 * copies and pastes into whatever messenger they use. Pure: no network, no provider, no clock.
 *
 * NOTHING IS SENT. No messaging provider is connected to a country build, and this file calls nobody: it returns a
 * string.
 *
 * LANGUAGE. The text is in the PATIENT's language (recorded per patient, one of the pack's `hastaDilleri`), not in
 * the doctor's (lib/ulke/arayuz/dilSecimi.ts → hastaIcinBicim):
 *   a language with one script   → that language, whatever the doctor reads;
 *   a language with several      → that language in the DOCTOR's script choice: the doctor's interface form if it is
 *                                  that language, else the doctor's note form if it is, else the language's first form;
 *   not recorded                 → the doctor's own form (the only thing known).
 *
 * DATE AND TIME are written by the pack's rules: the day in the pack's pattern, the time as the pack writes a time
 * of day (24- or 12-hour), both of the account's own wall clock. The caller passes them already in that clock (the
 * API answers an appointment with `gun` and `saat` of the account's time zone), so no time zone is involved here.
 *
 * The sentences are the pack's (its appointment catalogue, `hatirlatma.metin` and `hatirlatma.metinAdsiz`).
 */
import type { DilKodu } from '@/lib/ulke/tipler'
import { gunYazDesenle } from '@/lib/ulke/uygulama/zaman'
import { saatGoster, tarihDeseni } from './bicim'
import { hastaIcinBicim, randevuMetni } from './index'

export { tarihDeseni } from './bicim'

/** The form a reminder is written in, from the patient's language and the doctor's two forms. */
export function hatirlatmaDili(hastaDili: string, hekim: { dil: DilKodu; notDili: DilKodu }): DilKodu {
  return hastaIcinBicim(hastaDili, hekim)
}

export type HatirlatmaGirdisi = {
  /** The patient's own language (one of the pack's patient languages), or '' when it was not recorded. */
  hastaDili: string
  hekim: { dil: DilKodu; notDili: DilKodu; ad: string }
  /** The appointment's day and time in the account's own clock: 'YYYY-MM-DD', 'HH:MM' (24-hour). */
  gun: string
  saat: string
}

/** The reminder and the form it is written in. `metin` is '' when the day or the time cannot be written. */
export function hatirlatmaMetni(g: HatirlatmaGirdisi): { dil: DilKodu; metin: string } {
  const dil = hatirlatmaDili(g.hastaDili, g.hekim)
  const tarih = gunYazDesenle(g.gun, tarihDeseni())
  if (!tarih || !/^\d{2}:\d{2}$/.test(g.saat)) return { dil, metin: '' }
  const saat = saatGoster(g.saat)
  const h = randevuMetni(dil).hatirlatma
  // The doctor's name as the account wrote it: one line, no control characters, never long enough to drown the message.
  const ad = g.hekim.ad.replace(/\s+/g, ' ').trim().slice(0, 80)
  // Replaced in one pass, so that a name containing "%1" stays a name.
  const metin = (ad ? h.metin : h.metinAdsiz).replace(/%([123])/g, (_, n: string) => (n === '1' ? tarih : n === '2' ? saat : ad))
  return { dil, metin }
}
