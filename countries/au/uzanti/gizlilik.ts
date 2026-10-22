/**
 * AU-BETA-01 — Australia's privacy words, in product: the collection notice (APP 1 / APP 5 matters), the explicit
 * consent for collection and use of health information (a sensitive-information matter, APP 3), the access and
 * correction request (APP 12 / APP 13), and the doctor-side handling words.
 *
 * Initial compliance draft – external legal review later. NOTHING HERE SAYS THE PRODUCT IS COMPLIANT OR HAS BEEN
 * REVIEWED BY A LAWYER. Sources read 2026-10-22 (also in docs/au/SOURCES.md):
 *   APP 5.2 matters   https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information
 *   APP 12 timing     https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-12-app-12-access-to-personal-information
 *   The Act's text    ../araclar/gizlilik.ts (Privacy Act 1988, Schedule 1, compilation in force on 4 June 2026).
 *
 * WHAT THE CODE REALLY DOES (checked in this repository on 2026-10-22; each line is a fact of the code, not a promise):
 *   - Patient records live in this country's own Supabase database. The Australian project is recorded in
 *     docs/OPEN-COMMITMENTS.md as the Sydney region (not re-verified in this session; confirm in the Supabase dashboard).
 *   - The application's server functions run on Vercel in the region set in vercel.json: `syd1` (Sydney) since AU-MKT-AUDIT 2026-10-22
 *     (was `fra1`, Frankfurt). Requests still pass through Vercel's global network. The Supabase project region ap-southeast-2 was read via the Supabase API on 2026-10-22.
 *   - A visit recording is sent to ElevenLabs (api.elevenlabs.io, lib/ulke/uygulama/konusmaTanima.ts) for speech-to-text.
 *   - The transcript is sent to a language model through the shared gateway (lib/ai/cagir.ts), which calls
 *     OpenRouter (lib/ai/saglayici.ts) and, through it, the model provider the model policy names. The instruction
 *     holds no patient identifier, but the transcript can hold anything said in the visit.
 *   - Fields holding a patient's name, details, notes and answers are encrypted by the application with AES-256-GCM
 *     (lib/security/encryption.ts) before they reach the database. Not every column is: appointment times, invoice
 *     amounts and statuses, and row identifiers are plain.
 * The countries where the speech and language-model providers process data are NOT confirmed, so the notice says so.
 */
import type { GizlilikMetni } from '@/lib/ulke/uzanti/tipler'

export const AU_TASLAK_ETIKETI = 'Initial compliance draft – external legal review later.'
export const AU_GIZLILIK_SURUMU = 'au-2026-10-22-draft-2'
export const AU_PRIVACY_OFFICER = 'Notya LLC privacy contact, kaan@notya.io (an individually named privacy officer is to be published before commercial launch)'
export const AU_OPERATOR = 'Notya LLC, a United States company (3424 Sollers Point Rd., Baltimore, MD 21222, USA)'

export const AU_GIZLILIK: GizlilikMetni = {
  surum: AU_GIZLILIK_SURUMU,
  taslakEtiketi: AU_TASLAK_ETIKETI,
  bildirim: {
    baslik: 'Collection notice: how your health information is handled',
    giris: 'Your practitioner uses Notya to keep your records. This notice says what is collected, why, who it goes to (including overseas), and how to see or correct it. Please read it before you give your consent below.',
    bolumler: [
      { baslik: 'Who collects it', paragraflar: [`Your practitioner or clinic (the practice) collects your information and decides what is recorded. Notya, operated by ${AU_OPERATOR}, provides the software. Privacy contact: ${AU_PRIVACY_OFFICER}.`] },
      { baslik: 'What is collected and how', paragraflar: [
        'Your name, date of birth, sex, phone number and language; optionally your Medicare card number; the answers you give on the intake form; notes about your visits; appointment details; messages you send through this page; files or photos your practitioner attaches; and, only if your practitioner turns it on and you agree, a recording of a visit.',
        'It is collected from you, from your practitioner typing or recording during your visit, and from documents your practitioner attaches.',
      ] },
      { baslik: 'Why it is collected', paragraflar: ['To provide your care and keep your clinical record, to book and remind you of appointments, to let you see what your practitioner shares with you, and to prepare invoices. Health information is sensitive information; it is collected only with your consent, which you can decline or withdraw.'] },
      { baslik: 'If you do not provide it', paragraflar: ['Your practitioner may not be able to prepare for your visit, share information with you through this page, or keep a complete record. You can still be seen: you can leave the form or the consent unticked and tell your practitioner.'] },
      { baslik: 'Who it is disclosed to', paragraflar: [
        'Only to people and services needed to provide the service, acting for your practitioner: your practitioner and the clinic staff they authorise; the database host (Supabase); the application host (Vercel); a speech-to-text provider (ElevenLabs), which receives a visit recording if one is made; and a language-model service reached through a gateway (OpenRouter and the model provider it routes to), which receives the transcript of a recording to draft a note.',
        'Your information is not sold or used for advertising. Your practitioner may also disclose it as the law requires or as you ask (for example, a referral).',
      ] },
      { baslik: 'Overseas disclosure (APP 8)', paragraflar: [
        'Yes, some of your information is likely to go overseas. As currently configured, the application servers that handle each request run in Sydney, Australia (Vercel region syd1), but requests first pass through the hosting provider’s global network and the providers are overseas-owned companies. A visit recording and its transcript may be processed by the speech and language-model providers named above in countries that are not confirmed in this draft (which may include countries in North America). The practice’s database is hosted in Sydney, Australia (Supabase region ap-southeast-2, checked 2026-10-22). Payments, if the practice connects its own Stripe account, are processed by Stripe on its hosted page. The booking calendar on the demo page is provided by Cal.com, and the pages load their fonts from Google Fonts, so a visitor’s address is seen by those services.',
        'By accepting below you acknowledge this overseas disclosure. Where you do not wish your recording or transcript to go to these providers, ask your practitioner not to record the visit.',
      ] },
      { baslik: 'How it is protected', paragraflar: ['Names, details, notes and answers are encrypted by the application before they are stored; every request is limited to the signed-in practitioner’s own patients; this page needs a link and a PIN and ends by itself. Some data, such as appointment times and invoice amounts, is not separately encrypted. No system is risk-free.'] },
      { baslik: 'Seeing and correcting your information', paragraflar: ['You can ask to see (APP 12) or correct (APP 13) your information using the request form on this page. Your practitioner’s response is tracked against a 30-day target. You can also complain to your practitioner or to the Office of the Australian Information Commissioner (oaic.gov.au).'] },
    ],
  },
  riza: {
    baslik: 'Privacy and consent',
    metin: 'I consent to my practitioner collecting, using and storing my health information in Notya for my care and the administration of my care (appointments, records, communication with me, and invoicing), as described in the collection notice above, including the disclosure of that information to the service providers named in it, some of which are overseas. I understand I can withdraw this consent at any time and can ask to see or correct my information.',
    kutu: 'I have read the collection notice and I consent to the collection, use and overseas disclosure of my health information as described.',
    gonder: 'Record my consent',
    gerekli: 'Tick the box to record your consent, or leave it and tell your practitioner.',
    kaydedildi: 'Your consent is recorded.',
    kayitSatiri: 'Recorded on %1 (notice version %2).',
    geriCek: 'Withdraw my consent',
    geriCekildi: 'Your consent was withdrawn.',
    gonderiliyor: 'Please wait…',
    hata: 'Could not save. Try again, or tell your practitioner.',
  },
  talep: {
    baslik: 'Ask to see or correct your information',
    aciklama: 'Ask for a copy of what is held about you, or ask for something to be corrected. Your practitioner will respond; the target is within 30 days.',
    erisim: 'I want to see my information',
    duzeltme: 'I want something corrected',
    ayrinti: 'What do you need? (optional)',
    ayrintiIpucu: 'Do not include more health detail than needed. Your practitioner may contact you to confirm who you are.',
    gonder: 'Send request',
    gonderiliyor: 'Sending…',
    gonderildi: 'Request sent. Your practitioner will respond.',
    sonTarih: 'respond by %',
    hata: 'Could not send the request. Try again, or tell your practitioner.',
    bekleyenVar: 'You already have an open request of this kind.',
    durumlar: { yeni: 'Received', islemde: 'In progress', tamamlandi: 'Answered', reddedildi: 'Declined — ask your practitioner for the reasons' },
  },
  doktor: {
    baslik: 'Privacy requests',
    aciklama: 'Patients’ requests to see or correct their information, with the days left on the 30-day response target, and the consent records. The timer is a product target based on public guidance, not legal advice.',
    bos: 'No requests yet.',
    kalanGun: '% days left',
    gecikmisGun: 'OVERDUE by % days',
    islemde: 'Mark in progress',
    tamamla: 'Mark answered',
    reddet: 'Decline',
    yanit: 'Your response (kept with the request)',
    yanitIpucu: 'The patient is not sent this automatically in the beta; give the answer to the patient yourself and note it here.',
    kaydet: 'Save',
    rizaBaslik: 'Consent records',
    rizaBos: 'No consent records yet.',
    rizaGeri: 'withdrawn',
    hasta: 'Patient',
    tur: 'Type',
    alinan: 'Received',
    sonTarih: 'Due',
    kayitHatasi: 'Could not save the change.',
  },
}
