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

const INCELEME = ''

const MEDICAL: YasalBelge = {
  anahtar: 'medical',
  baslik: 'Medical disclaimer',
  inceleme: INCELEME,
  bolumler: [
    { baslik: 'Intended purpose', paragraflar: [
      'Notya assists registered practitioners with documentation and practice administration. It records a visit with the patient’s agreement, turns what was said into a draft visit note, and keeps appointments, patient pages, forms and invoices. The practitioner reviews, corrects and approves every note before it becomes part of the record. Notya does not diagnose, does not suggest a diagnosis or a treatment, and does not replace the practitioner’s clinical judgement.',
      'Reference tools (checklists, scales and calculators that work only on figures the practitioner enters, and links to published sources) are decision support only. The practitioner decides.',
    ] },
    { baslik: 'Drafts, not a decision', paragraflar: [
      'Notya is a practice management and clinical documentation tool. It records and organises what the practitioner says and enters, drafts a visit note for the practitioner to read, correct and approve, and keeps appointments, patient pages and invoices.',
      'It does not provide medical advice, diagnosis or treatment, and it does not suggest a diagnosis or a treatment. Clinical decisions remain the responsibility of the registered practitioner. It is not a substitute for professional medical advice: always consult a registered Australian health practitioner for medical concerns.',
      'If you need urgent care, call Triple Zero (000).',
    ] },
    { baslik: 'Therapeutic Goods Administration (TGA)', paragraflar: [
      'Notya has not been approved, assessed or endorsed by the TGA and is not entered on the Australian Register of Therapeutic Goods. It has not been endorsed by Ahpra or any professional college.',
      'The TGA has said that some digital scribes may be regulated as medical devices, in particular software that goes beyond administrative support and suggests diagnoses or treatments (TGA report on AI and medical devices, July 2025). Notya is intended for documentation and administration only; the intended purpose is stated at the top of this page. Whether any feature falls inside the device rules is for external regulatory advice, which has not yet been obtained.',
    ] },
    { baslik: 'Clinical content', paragraflar: [
      'Where Notya shows clinical reference content, it is based on publicly available Australian guidelines and sources named on the screen (for example the RACGP Red Book, the Royal Children’s Hospital Melbourne, the Pharmaceutical Benefits Scheme, the Australian Immunisation Handbook and the WHO). It is an initial clinical draft; external clinician review is planned after the first customers. Check the source before relying on it.',
    ] },
    { baslik: 'For a lawyer to review', paragraflar: ['Review this draft against TGA rules on software-based medical devices and on advertising of therapeutic goods. This draft does not say the service is or is not a device.'] },
  ],
}

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
      'Service providers acting for the practice: Supabase (database), Vercel (application hosting), ElevenLabs (speech-to-text for a visit recording) and OpenRouter with the language-model provider it routes to (OpenAI or Anthropic models, under the model policy in force) to draft a note from the transcript and, when the practitioner asks, a plain-language summary of an approved note. The recording is deleted from Notya’s storage once it has been transcribed.',
      'Notya does not send attached documents, scans or photographs to an AI model in the Australian version, and the photo archive is not read by any model. The optional assistant that answers a clinician’s general questions is switched off unless it is turned on for the deployment; the clinician is told not to give it patient identifiers.',
      'Some of these are overseas. The providers named above are companies headquartered outside Australia; how long each keeps what it receives, and whether it may train on it, is set by its own terms, which have not been verified for this draft.',
      'Some of these are overseas. As currently configured, application servers are configured to run in Sydney, Australia (Vercel region syd1) but requests first pass through the host’s global network; the database is hosted in Sydney, Australia (Supabase region ap-southeast-2, checked 2026-10-22); a practice that connects its own Stripe account has payments processed by Stripe; the demo page’s booking calendar is provided by Cal.com and pages load fonts from Google Fonts; and the speech and language-model providers process data in countries that this draft does not confirm (which may include countries in North America). A lawyer should review this disclosure and the contracts with each provider.',
    ] },
    { baslik: 'Security (APP 11) — what the software does', paragraflar: [
      'Names, details, notes and answers are encrypted by the application with AES-256-GCM before they are stored. Not every field is encrypted: appointment times, invoice amounts and status, and identifiers are stored plainly.',
      'Every request is limited to the signed-in practitioner’s own patients. The patient page needs a private link and a six-digit PIN, locks after five wrong PINs, and each session ends by itself after 30 minutes. The service is served over HTTPS by its hosting platform.',
      'Payment card details are never taken or stored by this software: a card is taken on the payment provider’s own hosted page, using the practice’s own merchant account that it connects to Notya (bring your own Stripe account; a test or a live connection). Notya does not hold or move your patients’ money. The connection key is stored encrypted and is never shown again.',
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
      'Payment connection keys are stored encrypted, are never shown again and are never sent to the browser. Only restricted keys (not full secret keys) are accepted, in test or live mode, and a live connection needs an explicit confirmation. Webhooks from the payment provider are checked against a signature before anything is read.',
    ] },
    { baslik: 'What has NOT been done', paragraflar: ['No independent security audit or penetration test. No independent assessment or accreditation is claimed. The hosting providers’ own controls are theirs and are not assessed here.'] },
    { baslik: 'How to report a problem', paragraflar: [`Write to ${E.security}. Say what you saw, the page and the time. Leave out a patient’s name and the content of a record.`, 'The same address is in /.well-known/security.txt on this deployment.'] },
  ],
}

const DATA_REQUEST: YasalBelge = {
  anahtar: 'data-request',
  baslik: 'Access and correction requests',
  inceleme: INCELEME,
  bolumler: [
    { baslik: 'Patients', paragraflar: ['Open your patient page (the link and PIN your practitioner gave you) and use “Ask to see or correct your information”. Your practitioner sees it with a 30-day response target. If you have no link, ask your practitioner.'] },
    { baslik: 'Practitioners', paragraflar: ['Open Privacy requests in the application to see requests, the days left, and to record your response. When you mark a request answered or declined, your response appears on the patient’s own page; Notya sends no email or text. For an access request you can download the patient’s data as one JSON file and give it to the patient yourself; the file lists what it does not yet carry (files and photographs, intake answers, messages, invoices).'] },
    { baslik: 'Anything else', paragraflar: [`Write to ${E.privacy}. Do not send an identity number or health detail in the email. Privacy officer: ${AU_PRIVACY_OFFICER}.`] },
  ],
}

export const AU_YASAL: YasalKapisi = {
  diller: [{
    ...temel,
    belgeler: [
      ...temel.belgeler.map((b) => (b.anahtar === 'privacy' ? PRIVACY : b.anahtar === 'security' ? SECURITY : b.anahtar === 'medical' ? MEDICAL : b.anahtar === 'data-request' ? DATA_REQUEST : { ...b, inceleme: `${AU_TASLAK_ETIKETI} ${b.inceleme}` })),
    ],
  }],
}
