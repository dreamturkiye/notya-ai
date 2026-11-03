/**
 * UZ letter drafts from an approved note — Uzbek (Latin) / Russian wording in the prompt;
 * the model writes the letter in the language of the approved note sections.
 * No Australian Medicare care-plan / MBS.
 */
import type { NotIcerigi } from '@/lib/ulke/tipler'
import { MEKTUP_ANAHTARI } from '@/lib/ulke/uygulama/notModeli'
import type { MektupHarfTuru, MektupTuru } from '@/lib/ulke/mektup/sabitler'

const NOT_BLOK = (icerik: NotIcerigi): string => {
  const alanlar = icerik.alanlar && Object.keys(icerik.alanlar).length ? { fields: icerik.alanlar } : {}
  return JSON.stringify({ s: icerik.s, o: icerik.o, a: icerik.a, p: icerik.p, ...alanlar })
}

const ORTAK = [
  'You draft clinical correspondence for a clinician practising in Uzbekistan.',
  'Write the letter in the same language and script as the approved visit note (Uzbek Latin, Uzbek Cyrillic, or Russian).',
  'Use ONLY the approved visit note. Invent no history, examination, diagnosis, medicine, dose, result or identity.',
  'Do not invent a patient name, address, JSHSHIR, licence number, date of birth or phone. Use placeholders in square brackets when needed.',
  'Do not claim that anything was sent, lodged, billed or written to another clinic system.',
  'The doctor will read, edit and decide. You never approve.',
].join(' ')

const TUR: Record<MektupHarfTuru, string> = {
  gp: `${ORTAK} Draft a letter to the patient’s usual doctor about this visit: reason, findings, plan, follow-up. Formal but concise. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
  referral: `${ORTAK} Draft a specialist referral from this visit: reason, relevant history and findings, urgency only if in the note, questions for the specialist. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
  patient: `${ORTAK} Draft a plain-language note THE PATIENT could read: what was discussed, the plan, when to seek care sooner. No scare language. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
}

export function uzMektupTalimati(tur: MektupTuru): string | null {
  if (tur !== 'gp' && tur !== 'referral' && tur !== 'patient') return null
  return TUR[tur]
}

export function uzMektupGirdisi(_tur: MektupTuru, icerik: NotIcerigi): string {
  return `Approved visit note (sections only; no patient identity):\n${NOT_BLOK(icerik)}`
}
