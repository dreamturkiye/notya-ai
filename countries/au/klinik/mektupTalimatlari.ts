/**
 * AU-GAP-CLOSE-01 — Australia: instructions to the model for letter drafts and MBS suggestions from an APPROVED note.
 *
 * MACHINE-DRAFTED. No Australian clinician has signed these prompts off. They produce drafts for the doctor to edit.
 * Nothing is lodged with Medicare, sent as a referral, or written to a practice-management system from this product.
 */
import type { NotIcerigi } from '@/lib/ulke/tipler'
import { MEKTUP_ANAHTARI, MBS_ONERI_ANAHTARI } from '@/lib/ulke/uygulama/notModeli'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'

const NOT_BLOK = (icerik: NotIcerigi): string => {
  const alanlar = icerik.alanlar && Object.keys(icerik.alanlar).length ? { fields: icerik.alanlar } : {}
  return JSON.stringify({ s: icerik.s, o: icerik.o, a: icerik.a, p: icerik.p, ...alanlar })
}

const ORTAK = [
  'You draft clinical correspondence for an Australian medical practitioner.',
  'Use Australian English spelling.',
  'Use ONLY the approved visit note in the user message. Invent no history, examination, diagnosis, medicine, dose, result or identity.',
  'Do not invent a patient name, address, Medicare number, provider number, date of birth or phone number. Use placeholders in square brackets when a particular is needed (for example [Patient full name], [Provider number]).',
  'Do not claim that anything was sent, lodged, billed or written to a practice-management system.',
  'The doctor will read, edit and decide. You never approve.',
].join(' ')

const TUR: Record<MektupTuru, string> = {
  gp: `${ORTAK} Draft a letter to a general practitioner about this visit: reason for contact, key findings, plan, and what follow-up you ask of the GP. Formal but concise. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
  referral: `${ORTAK} Draft a specialist referral letter from this visit: reason for referral, relevant history and findings, urgency if stated in the note, and questions for the specialist. Do not invent urgency. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
  patient: `${ORTAK} Draft a plain-language letter or after-visit note THE PATIENT could read: what was discussed, the plan in everyday words, and when to seek care sooner. No jargon where a plain word exists. No scare language. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
}

export function auMektupTalimati(tur: MektupTuru): string | null {
  return TUR[tur] ?? null
}

export function auMektupGirdisi(_tur: MektupTuru, icerik: NotIcerigi): string {
  return `Approved visit note (sections only; no patient identity):\n${NOT_BLOK(icerik)}`
}

export function auMbsOneriTalimati(): string {
  return [
    'You suggest possible Medicare Benefits Schedule (MBS) item numbers that MAY fit an Australian clinic visit, for a doctor to review.',
    'Suggest ONLY. Never lodge, claim, bill or assert that a benefit is payable.',
    'Use ONLY the approved visit note. Invent no service that is not supported by the note.',
    'Prefer common GP attendance and telehealth items when the note is a routine attendance; add procedure items only when the note clearly describes that procedure.',
    'Each suggestion needs: item (MBS item number), aciklama (short item description), gerekce (one sentence tying the suggestion to the note).',
    `Answer ONLY as JSON: {"${MBS_ONERI_ANAHTARI}":[{"item":"23","aciklama":"…","gerekce":"…"}]}`,
    'At most 5 suggestions. If nothing fits, return {"suggestions":[]}.',
  ].join(' ')
}

export function auMbsOneriGirdisi(icerik: NotIcerigi): string {
  return `Approved visit note (sections only; no patient identity):\n${NOT_BLOK(icerik)}`
}
