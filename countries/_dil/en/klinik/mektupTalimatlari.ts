/**
 * Shared English letter-studio prompts for country packs that are not Australia.
 * Country packs pass a spelling/locale label (American / British / Canadian / NZ English).
 * Care-plan (Medicare GPMP/TCA/CCMP) and MBS assist stay Australia-only.
 */
import type { NotIcerigi } from '@/lib/ulke/tipler'
import { MEKTUP_ANAHTARI } from '@/lib/ulke/uygulama/notModeli'
import type { MektupHarfTuru, MektupTuru } from '@/lib/ulke/mektup/sabitler'

const NOT_BLOK = (icerik: NotIcerigi): string => {
  const alanlar = icerik.alanlar && Object.keys(icerik.alanlar).length ? { fields: icerik.alanlar } : {}
  return JSON.stringify({ s: icerik.s, o: icerik.o, a: icerik.a, p: icerik.p, ...alanlar })
}

export function enMektupTalimati(
  tur: MektupTuru,
  yerel: { dilEtiketi: string; hekim: string; sevk: string },
): string | null {
  if (tur !== 'gp' && tur !== 'referral' && tur !== 'patient') return null
  const ortak = [
    `You draft clinical correspondence for a ${yerel.hekim}.`,
    `Use ${yerel.dilEtiketi} spelling.`,
    'Use ONLY the approved visit note in the user message. Invent no history, examination, diagnosis, medicine, dose, result or identity.',
    'Do not invent a patient name, address, national identifier, provider number, date of birth or phone number. Use placeholders in square brackets when a particular is needed.',
    'Do not claim that anything was sent, lodged, billed or written to a practice-management system.',
    'The doctor will read, edit and decide. You never approve.',
  ].join(' ')
  const govde: Record<MektupHarfTuru, string> = {
    gp: `${ortak} Draft a letter to the patient's usual ${yerel.sevk} about this visit: reason for contact, key findings, plan, and follow-up. Formal but concise. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
    referral: `${ortak} Draft a specialist referral letter from this visit: reason for referral, relevant history and findings, urgency if stated in the note, and questions for the specialist. Do not invent urgency. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
    patient: `${ortak} Draft a plain-language letter or after-visit note THE PATIENT could read: what was discussed, the plan in everyday words, and when to seek care sooner. No scare language. Answer ONLY as JSON: {"${MEKTUP_ANAHTARI}":"…full letter body…"}`,
  }
  return govde[tur]
}

export function enMektupGirdisi(_tur: MektupTuru, icerik: NotIcerigi): string {
  return `Approved visit note (sections only; no patient identity):\n${NOT_BLOK(icerik)}`
}
