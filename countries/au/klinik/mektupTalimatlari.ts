/**
 * AU-GAP-CLOSE-01/03 — Australia: instructions for letter drafts, care-plan documents and MBS suggestions
 * from an APPROVED note.
 *
 * MACHINE-DRAFTED. Sign-off register: `./mektupOnay.ts` (AU_MEKTUP_ICERIK_ONAYLARI). Until `klinisyen` is set,
 * prompts remain usable for drafts but are listed as awaiting Australian clinician review.
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

const PLAN_ORTAK = [
  'You draft an Australian Medicare care-plan DOCUMENT for a doctor to edit and sign.',
  'Use Australian English spelling.',
  'Use ONLY the approved visit note. Invent no diagnosis, medicine, goal, allied-health need or identity.',
  'Use placeholders in square brackets for patient name, DOB, Medicare number, provider number, practice details.',
  'Never claim a benefit is payable. Never lodge. Never write to Best Practice, Genie or Gentu.',
  'Structure the document with clear headings a GP would recognise. Leave blank lines where the doctor must fill clinic particulars.',
  'The doctor will read, edit and decide. You never approve.',
  `Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full document body…"}`,
].join(' ')

const TUR: Record<MektupTuru, string> = {
  gp: `${ORTAK} Draft a letter to a general practitioner about this visit: reason for contact, key findings, plan, and what follow-up you ask of the GP. Formal but concise. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
  referral: `${ORTAK} Draft a specialist referral letter from this visit: reason for referral, relevant history and findings, urgency if stated in the note, and questions for the specialist. Do not invent urgency. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
  patient: `${ORTAK} Draft a plain-language letter or after-visit note THE PATIENT could read: what was discussed, the plan in everyday words, and when to seek care sooner. No jargon where a plain word exists. No scare language. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
  gpmp: `${PLAN_ORTAK} Draft a GP Management Plan (GPMP) style document: patient problems/goals from the note, planned management, review timing if stated, patient/carer involvement. Do not invent chronic conditions not in the note. Do not assert item 721/729 or any other item is billable.`,
  tca: `${PLAN_ORTAK} Draft a Team Care Arrangements (TCA) style document: coordinating GP, allied-health/other providers needed IF supported by the note, goals, and review. Do not invent providers or disciplines. Do not assert item 723/732 is billable.`,
  ccmp: `${PLAN_ORTAK} Draft a Chronic Condition Management Plan (CCMP) style document suitable for items in the 965/967 family as STRUCTURE ONLY: conditions, goals, actions, who does what, review. Suggest no fee. Invent nothing not in the note.`,
  mhcp: `${PLAN_ORTAK} Draft a Mental Health Treatment Plan style document: presenting issues from the note, goals, planned psychological strategies or referral IF in the note, review. No diagnosis invented. Do not assert any MBS mental-health item is billable.`,
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
    'When the note supports chronic-disease or care-plan work, you MAY also suggest plan-related item NUMBERS only as possibilities for the doctor to check on MBS Online (for example GPMP/TCA/CCMP/MHCP families such as 721, 723, 732, 729, 965, 967) — still suggest only, never assert payable.',
    'Each suggestion needs: item (MBS item number), aciklama (short item description), gerekce (one sentence tying the suggestion to the note).',
    `Answer ONLY as JSON: {"${MBS_ONERI_ANAHTARI}":[{"item":"23","aciklama":"…","gerekce":"…"}]}`,
    'At most 8 suggestions. If nothing fits, return {"suggestions":[]}.',
  ].join(' ')
}

export function auMbsOneriGirdisi(icerik: NotIcerigi): string {
  return `Approved visit note (sections only; no patient identity):\n${NOT_BLOK(icerik)}`
}
