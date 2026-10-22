/**
 * NOTYA-ULKE-YASAL-01 — Australia policy drafts. A lawyer has not read them.
 * Privacy Act 1988 (Cth) and the Australian Privacy Principles. Medical-device marketing: TGA.
 * Named only so a lawyer can look them up.
 * HUKUK-01 (2026-10-17): refund/cancellation and copyright added — the Australian Consumer Law's consumer
 * guarantees (Competition and Consumer Act 2010 (Cth), Sch 2), which cannot be excluded; the Copyright Act 1968 (Cth).
 *
 * AU-BETA-01 (2026-10-22): the privacy, data-request and security documents are replaced by Australia's own drafts
 * (below) and the notifiable-data-breach document is in ./uzanti/veriIhlali.ts. Every one carries "Initial compliance draft – external legal
 * review later." None says the service complies with, or has been reviewed against, any law.
 */
import { ingilizceYasal } from '@/lib/ulke/yasal/ingilizce'
import { YASAL_EPOSTA as E } from '@/lib/ulke/yasal/eposta'
import type { YasalBelge, YasalKapisi } from '@/lib/ulke/yasal/tipler'
import { AU_GIZLILIK, AU_OPERATOR, AU_PRIVACY_OFFICER, AU_TASLAK_ETIKETI } from './uzanti/gizlilik'

const temel = ingilizceYasal({
  kod: 'en-AU',
  ad: 'English',
  privacy: 'Review this draft against the Privacy Act 1988 (Cth) and the Australian Privacy Principles. This draft does not say the service meets them.',
  cookies: 'Review this draft against the Privacy Act 1988 (Cth) and the Australian Privacy Principles as they apply to cookies and similar storage. This draft does not say the service meets them.',
  medical: 'Review this draft against TGA rules on medical-device marketing. This draft does not say the service is or is not a device.',
  refund: 'Review this draft against the consumer guarantees in the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)). Those guarantees cannot be excluded, restricted or modified by this or any other document — this draft does not attempt to, and a lawyer should confirm that.',
  copyright: 'Review this draft against the Copyright Act 1968 (Cth).',
})

const INCELEME = `${AU_TASLAK_ETIKETI} A lawyer has not read this text. It does not say the service complies with the Privacy Act 1988 (Cth) or any other law.`

const PRIVACY: YasalBelge = {
  anahtar: 'privacy',
  baslik: 'Privacy Policy',
  inceleme: INCELEME,
  bolumler: [
    { baslik: 'About this policy', paragraflar: [
      'This draft policy is written with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs) in mind. It describes how Notya, a practice management and clinical documentation tool, handles personal information, including health information (sensitive information). It is a draft for a lawyer to review and is not a statement that the service complies with that Act.',
      `Software provider: ${AU_OPERATOR}. Your practitioner or clinic is the one who collects and decides what is recorded about you; Notya provides the software they use.`,
    ] },
    { baslik: 'Privacy officer', paragraflar: [`Privacy officer: ${AU_PRIVACY_OFFICER}. General privacy questions: ${E.privacy}.`] },
    { baslik: 'What is collected (APP 3, APP 5)', paragraflar: [
      'Practitioner account: name, email address, phone number, profession and optional registration numbers, practice details (name, ABN, address, provider number) and sign-in records.',
      'Patient record, entered or recorded by the practitioner or given by the patient: name, date of birth, sex, phone, language, an optional Medicare card number, intake-form answers, visit notes, appointment details, messages, attached files or photos, invoices, and, only when the practitioner turns it on and the patient agrees, a recording of a visit.',
      'Health information is collected with consent. The patient’s consent is recorded with the date and the version of the collection notice they accepted. Consent can be withdrawn.',
    ] },
    { baslik: 'Why it is used (APP 6)', paragraflar: ['To provide the service to the practitioner: keep clinical records, draft notes from a recording, book and show appointments, let a patient see what the practitioner shares, prepare invoices, and keep the service secure. It is not sold and is not used for advertising.'] },
    { baslik: 'Who it goes to, including overseas (APP 6, APP 8)', paragraflar: [
      'Service providers acting for the practice: Supabase (database), Vercel (application hosting), ElevenLabs (speech-to-text for a visit recording) and OpenRouter with the language-model provider it routes to (to draft a note from the transcript).',
      'Some of these are overseas. As currently configured, application servers run in Frankfurt, Germany; the database for this deployment is intended to be in Sydney, Australia (to be confirmed in the dashboard); and the speech and language-model providers process data in countries that this draft does not confirm (they include the United States). A lawyer should review this disclosure and the contracts with each provider.',
    ] },
    { baslik: 'Security (APP 11) — what the software does', paragraflar: [
      'Names, details, notes and answers are encrypted by the application with AES-256-GCM before they are stored. Not every field is encrypted: appointment times, invoice amounts and status, and identifiers are stored plainly.',
      'Every request is limited to the signed-in practitioner’s own patients. The patient page needs a private link and a six-digit PIN, locks after five wrong PINs, and each session ends by itself after 30 minutes. The service is served over HTTPS by its hosting platform.',
      'Payment card details are never taken or stored by this software: a card is taken by the payment provider’s own hosted page, and in this beta payments run in a demonstration mode with no real charge.',
      'This is a description of the software, not a guarantee. No system is free of risk, and no security audit or penetration test has been done (see the Security page).',
    ] },
    { baslik: 'Keeping and deleting', paragraflar: [
      'A practitioner can delete a patient record, and the records that belong to it are removed with it. A practitioner’s account is kept while it is open. How long health records must be kept is set by state and territory law and professional rules, not by this software; the practitioner decides, and a lawyer should set the retention periods for this service.',
    ] },
    { baslik: 'Seeing and correcting your information (APP 12, APP 13)', paragraflar: [
      'A patient can send a request to see or correct their information from their patient page. The practitioner sees the request with a 30-day response target and answers it. This is a product timer based on public guidance, not legal advice. You can also write to the privacy officer, or see the data-request page.',
    ] },
    { baslik: 'Complaints', paragraflar: ['Tell the privacy officer first. If you are not satisfied, you can complain to the Office of the Australian Information Commissioner (oaic.gov.au).'] },
    { baslik: 'Data breaches', paragraflar: ['See the Data breach response page (/data-breach) for how a suspected breach is assessed and reported.'] },
    { baslik: `Notice version`, paragraflar: [`Collection notice version in use: ${AU_GIZLILIK.surum}.`] },
  ],
}

const SECURITY: YasalBelge = {
  anahtar: 'security',
  baslik: 'Security',
  inceleme: INCELEME,
  bolumler: [
    { baslik: 'What the software does (verified in the code on 2026-10-22)', paragraflar: [
      'Application-level encryption (AES-256-GCM) of patient names, details, notes and form answers before they are stored; the key is held in the deployment’s environment, not in the code.',
      'Per-practitioner scoping of every database statement; browser access to the privacy, invoice and payment-connection tables is switched off.',
      'Patient page: private link, six-digit PIN, five-try lock, 30-minute session, private no-store responses.',
      'Payment connection keys are stored encrypted, are never shown again and are never sent to the browser. Live keys are refused in this beta.',
    ] },
    { baslik: 'What has NOT been done', paragraflar: ['No independent security audit or penetration test. No claim is made of any certification. The hosting providers’ own controls are theirs and are not assessed here.'] },
    { baslik: 'How to report a problem', paragraflar: [`Write to ${E.security}. Say what you saw, the page and the time. Leave out a patient’s name and the content of a record.`, 'The same address is in /.well-known/security.txt on this deployment.'] },
  ],
}

const DATA_REQUEST: YasalBelge = {
  anahtar: 'data-request',
  baslik: 'Access and correction requests',
  inceleme: INCELEME,
  bolumler: [
    { baslik: 'Patients', paragraflar: ['Open your patient page (the link and PIN your practitioner gave you) and use “Ask to see or correct your information”. Your practitioner sees it with a 30-day response target. If you have no link, ask your practitioner.'] },
    { baslik: 'Practitioners', paragraflar: ['Open Privacy requests in the application to see requests, the days left, and to record your response. In the beta the response is not sent to the patient automatically; give it to the patient yourself.'] },
    { baslik: 'Anything else', paragraflar: [`Write to ${E.privacy}. Do not send an identity number or health detail in the email. Privacy officer: ${AU_PRIVACY_OFFICER}.`] },
  ],
}

export const AU_YASAL: YasalKapisi = {
  diller: [{
    ...temel,
    belgeler: [
      ...temel.belgeler.map((b) => (b.anahtar === 'privacy' ? PRIVACY : b.anahtar === 'security' ? SECURITY : b.anahtar === 'data-request' ? DATA_REQUEST : { ...b, inceleme: `${AU_TASLAK_ETIKETI} ${b.inceleme}` })),
    ],
  }],
}
