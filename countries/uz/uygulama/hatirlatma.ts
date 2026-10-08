/**
 * NOTYA-UZ-RANDEVU-01 — the REMINDER TEXT for one appointment: a short message the doctor copies and pastes into
 * whatever messenger they use. Pure: no network, no provider, no clock.
 *
 * NOTHING IS SENT. No messaging provider is connected to an Uzbekistan build, and this file calls nobody: it returns
 * a string. Automatic reminders are not part of this slice (docs/COUNTRY-PACK-UZBEKISTAN.md).
 *
 * LANGUAGE. The text is in the PATIENT's language (recorded per patient: 'uz' or 'ru'), not in the doctor's:
 *   patient 'ru'  → Russian, whatever the doctor reads;
 *   patient 'uz'  → Uzbek, in the DOCTOR's script choice — the script of the doctor's interface if that is Uzbek,
 *                   else the script of the doctor's note language if that is Uzbek, else Latin (the pack's default);
 *   not recorded  → the doctor's own form (the only thing known).
 *
 * DATE AND TIME are written by the pack's rules: the day in the pack's pattern (DD.MM.YYYY), the time as HH:MM on a
 * 24-hour clock, both of the country's own wall clock. The caller passes them already in that clock (the API
 * answers an appointment with `gun` and `saat` of the pack's time zone), so no time zone is involved here.
 *
 * The sentences are in ./randevuMetinleri.ts, machine-written and awaiting a native reader.
 */
import { gunYazDesenle } from '@/lib/ulke/uygulama/zaman'
import type { UzUygulamaDili } from './metinler'
import { randevuMetni } from './randevuMetinleri'

/** The pack's own day pattern (countries/uz/index.ts → bicim.tarihDeseni). A test holds the two together. */
export const UZ_TARIH_DESENI = 'DD.MM.YYYY'

/** The form a reminder is written in, from the patient's language and the doctor's two forms. */
export function hatirlatmaDili(hastaDili: string, hekim: { dil: UzUygulamaDili; notDili: UzUygulamaDili }): UzUygulamaDili {
  if (hastaDili === 'ru') return 'ru'
  if (hastaDili === 'uz') return hekim.dil !== 'ru' ? hekim.dil : hekim.notDili !== 'ru' ? hekim.notDili : 'uz-Latn'
  return hekim.dil
}

export type HatirlatmaGirdisi = {
  /** The patient's own language: 'uz', 'ru', or '' when it was not recorded. */
  hastaDili: string
  hekim: { dil: UzUygulamaDili; notDili: UzUygulamaDili; ad: string }
  /** The appointment's day and time in the country's own clock: 'YYYY-MM-DD', 'HH:MM'. */
  gun: string
  saat: string
}

/** The reminder and the form it is written in. `metin` is '' when the day or the time cannot be written. */
export function uzHatirlatmaMetni(g: HatirlatmaGirdisi): { dil: UzUygulamaDili; metin: string } {
  const dil = hatirlatmaDili(g.hastaDili, g.hekim)
  const tarih = gunYazDesenle(g.gun, UZ_TARIH_DESENI)
  if (!tarih || !/^\d{2}:\d{2}$/.test(g.saat)) return { dil, metin: '' }
  const h = randevuMetni(dil).hatirlatma
  // The doctor's name as the account wrote it: one line, no control characters, never long enough to drown the message.
  const ad = g.hekim.ad.replace(/\s+/g, ' ').trim().slice(0, 80)
  // Replaced in one pass, so that a name containing "%1" stays a name.
  const metin = (ad ? h.metin : h.metinAdsiz).replace(/%([123])/g, (_, n: string) => (n === '1' ? tarih : n === '2' ? g.saat : ad))
  return { dil, metin }
}
