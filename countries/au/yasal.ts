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
import { AU_ASISTAN_TANIMI, AU_GIZLILIK, AU_OPERATOR, AU_PRIVACY_OFFICER, AU_TASLAK_ETIKETI } from './uzanti/gizlilik'
import { AU_ALT_ISLEYENLER, AU_POLITIKA_EPOSTA, AU_POLITIKA_INCELEME, AU_PRATIK_ODEME, AU_SITE_HIZMETLERI, altIsleyenSatiri } from './uzanti/politikalar'

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
      AU_ASISTAN_TANIMI,
      'Paediatric tools plot growth measurements and record immunisation dates against the Australian schedule. Other reference tools (checklists, scales and calculators) work only on figures the practitioner enters, and links open published sources. The practitioner reviews and interprets the information.',
      'The application never makes clinical decisions for the practitioner. The practitioner remains responsible for all clinical decisions.',
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
  inceleme: AU_POLITIKA_INCELEME,
  bolumler: [
    { baslik: 'Who we are', paragraflar: [
      `Notya is a practice management and clinical documentation tool for registered health practitioners. It is provided by ${AU_OPERATOR} ("Notya", "we"). This policy explains how we handle personal information, including health information, in the Australian Notya service at au.notya.io.`,
      'Because we hold health information, the small business exemption in the Privacy Act 1988 (Cth) does not apply to us, and we handle personal information under the Australian Privacy Principles (APPs).',
      'For patient records, the practice is in charge: the practitioner or clinic decides what is recorded about its patients and why, and we handle those records for the practice to provide the service. Questions about your own care or record are best asked of your practice first.',
    ] },
    { baslik: 'What we collect', paragraflar: [
      'Practitioners and practice staff: name, email address, phone number, profession and optional registration numbers, practice details (name, ABN, address, provider number), account settings, subscription and billing details, sign-in records, and how the service is used (for example, the number of visits and live-voice minutes, to apply plan limits).',
      'Patients, through their practice: name, date of birth, sex, phone number, language, an optional Medicare card number, intake-form answers, visit notes, visit transcripts, appointment details, messages, attached files and photos, invoices, consent records and privacy requests. A visit is recorded only when the practitioner turns recording on and confirms the patient has agreed.',
      'Patient page users: what a patient enters on their own page (form answers, messages, consent choices, requests to see or correct information), and a short-lived session so the page stays open after the PIN is entered.',
      'Website visitors: what you send us when you write to us or book a demo. We do not use advertising or analytics cookies (see the Cookie policy).',
    ] },
    // ZIYARET-SAYACI-01 (2026-11-10): what the visit counter does (lib/ziyaret/ziyaret.ts, migration 194) — no more, no less.
    { baslik: 'Website visit counting', paragraflar: [
      "We count visits to the public pages of this website (the home, sign-up and sign-in pages) anonymously and without cookies. We do not store your IP address or your browser details: they are turned, together with a random value that is replaced every day (the previous day's value is deleted), into a one-way code that is used only to count a visitor once per day and is deleted within two days. What we keep are daily totals: the number of visits per page, per referring website (its name only) and per device type (mobile or desktop).",
    ] },
    { baslik: 'How we use it', paragraflar: [
      'To provide the service to the practice: keep clinical records; turn a visit recording into text and draft a visit note; answer the practitioner’s questions from the patient’s file through the assistant; book and show appointments; let a patient see what the practitioner shares; prepare invoices; and keep the service secure and working.',
      'To run the practitioner’s account: sign-in, the free trial and plan limits, billing, support and service messages.',
      'We do not sell personal information, we do not use it for advertising, and we do not use practice or patient records to train our own models.',
    ] },
    { baslik: 'Artificial intelligence', paragraflar: [
      'Visit notes: when a visit is recorded, the recording is sent to a speech provider to turn it into text, and the transcript is sent to a language-model provider to draft a note. The note is only a draft until the practitioner reads, corrects and approves it. The practitioner remains responsible for the record.',
      `Live voice assistant: when a practitioner talks to the assistant, their voice is sent to the speech provider; Notya’s own server (in Sydney) reads the relevant parts of the patient’s file and sends them, with the question, to a language-model provider; the answer is sent back to the speech provider to be spoken. ${AU_ASISTAN_TANIMI}`,
      'The practitioner can also ask for a plain-language summary of an approved note for the patient. Attached documents, scans and photos are not sent to an AI model in the Australian service.',
    ] },
    { baslik: 'Consent before recording', paragraflar: [
      'Notya will not start a recording until the practitioner confirms that the patient (or, for a patient under 18, their parent or guardian, or the patient where they are old enough to decide) has agreed to the visit being recorded and to AI drafting, including by overseas providers. The confirmation is stored with the visit. A patient can say no or ask for the recording to stop, and can still be seen.',
      'Patients can also record their consent to the collection of their health information on their own page, and can withdraw it there.',
    ] },
    { baslik: 'Who we disclose it to', paragraflar: [
      'Patient information is seen by the practitioner and the staff the practice authorises. We do not disclose it to anyone else except the service providers below, which act for us to provide the service, or where the law requires it. The practice may disclose information itself, for example in a referral.',
      ...AU_ALT_ISLEYENLER.map(altIsleyenSatiri),
      AU_PRATIK_ODEME,
      ...AU_SITE_HIZMETLERI,
    ] },
    { baslik: 'Overseas disclosure (APP 8)', paragraflar: [
      'Records are stored in Sydney, Australia. Some information is disclosed to, or processed by, providers overseas: Notya LLC itself is a United States company; the speech provider (ElevenLabs), the model gateway (OpenRouter) and the model providers (OpenAI, Anthropic) are based overseas, mainly in the United States; the hosting network (Vercel) is global; and the practitioner’s subscription payments are processed by Stripe through our United States account.',
      'We remain accountable under the Privacy Act for how these providers handle the information we send them. How long each provider keeps what it receives, and whether it may use it to train its models, is set by its own terms; we are confirming each provider’s terms and will publish what we confirm on the Sub-processors page. The full list is on the Sub-processors page (/sub-processors).',
    ] },
    { baslik: 'Payments', paragraflar: [
      'A practitioner’s own Notya subscription is paid through Stripe. Stripe receives the practitioner’s name, email address and billing details. Card details are entered on Stripe’s own page; Notya never receives or stores them. No patient information is sent to Stripe for the subscription.',
    ] },
    { baslik: 'Security', paragraflar: [
      'Patient names, details, notes and form answers are encrypted by the application (AES-256-GCM) before they are stored; the database provider encrypts all stored data and data in transit. Every request is limited to the signed-in practitioner’s own patients. A patient page needs a private link and a six-digit PIN, locks after five wrong PINs and ends by itself after 30 minutes. Payment-connection keys are stored encrypted.',
      'No system is free of risk. No independent security audit or penetration test has been done yet (see the Security page).',
    ] },
    { baslik: 'How long we keep it', paragraflar: [
      'Records are kept while the practice’s account exists, including when it is read-only after a trial or a cancelled subscription. We delete an account and its records within 30 days of a written request from the account holder; backups expire on the provider’s schedule. A visit recording is deleted once it has been turned into text. Practices remain responsible for keeping health records for as long as state and territory law and professional rules require. Details: the Data storage and retention page (/data-storage).',
    ] },
    { baslik: 'Seeing and correcting your information (APP 12, APP 13)', paragraflar: [
      `Patients: use “Ask to see or correct your information” on your patient page, or ask your practice. The practice answers, with a 30-day response target. You can also write to us at ${AU_POLITIKA_EPOSTA} and we will pass the request to the practice and help it respond.`,
      `Practitioners: ask us at ${AU_POLITIKA_EPOSTA} for a copy of your account information or a correction. We respond within 30 days.`,
    ] },
    { baslik: 'Complaints', paragraflar: [
      `Write to our Privacy Officer at ${AU_POLITIKA_EPOSTA}. We will acknowledge your complaint within 7 days and aim to give you a full answer within 30 days. If you are not satisfied with our answer, you can complain to the Office of the Australian Information Commissioner (OAIC): oaic.gov.au, phone 1300 363 992.`,
    ] },
    { baslik: 'Data breaches', paragraflar: [
      'If a data breach is likely to result in serious harm, we notify the OAIC and the people affected under the Notifiable Data Breaches scheme, and we tell an affected practice within 72 hours of confirming the breach. See the Data breach response plan (/data-breach).',
    ] },
    { baslik: 'Marketing email', paragraflar: [
      'If we send a practitioner an email about Notya, it identifies Notya LLC, says how to contact us, and has a working unsubscribe link; we stop within 5 working days of an unsubscribe request. We do not send marketing to patients.',
    ] },
    { baslik: 'Contact and Privacy Officer', paragraflar: [
      `Privacy Officer: ${AU_PRIVACY_OFFICER}. Postal address: ${AU_OPERATOR}.`,
      `Changes: we will post any change to this policy here with a new date. Collection notice version in use: ${AU_GIZLILIK.surum}.`,
    ] },
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
    { baslik: 'Anything else', paragraflar: [`Write to ${AU_POLITIKA_EPOSTA}. Do not send an identity number or health detail in the email. Privacy officer: ${AU_PRIVACY_OFFICER}.`] },
  ],
}

const TERMS: YasalBelge = {
  anahtar: 'terms',
  baslik: 'Terms of use',
  inceleme: AU_POLITIKA_INCELEME,
  bolumler: [
    { baslik: 'These terms', paragraflar: [
      `These terms apply to the Australian Notya service at au.notya.io, provided by ${AU_OPERATOR}. By opening an account you agree to them. Our Privacy Policy, Data storage and retention page and Refunds and cancellation page form part of them.`,
      'Nothing in these terms excludes, restricts or modifies any right or remedy you have under the Australian Consumer Law, or any other law, that cannot lawfully be excluded, restricted or modified.',
    ] },
    { baslik: 'Who can use Notya', paragraflar: [
      'Notya is for registered health practitioners and their practices. Accounts are opened through self-serve sign-up at au.notya.io; no invitation code is needed. The founding offer at au.notya.io/founding is available while founding places remain. You keep your password private and do not share your account; you are responsible for the people you give access to in your practice.',
    ] },
    { baslik: 'Your clinical responsibility', paragraflar: [
      'Notya prepares drafts: a note, a summary, a reminder. You read, correct and approve every draft before it becomes part of a record. Diagnosis, treatment and what is said to a patient remain your responsibility. The practitioner remains responsible for all clinical decisions. The application never makes clinical decisions for the practitioner. You confirm a patient’s consent before recording a visit, and you follow the recording, privacy and health records laws that apply to you. See the Medical disclaimer.',
    ] },
    { baslik: 'Free trial', paragraflar: [
      'A new account starts with a 15-day free trial. No card is needed. The trial is limited to 40 recorded visits and 60 live-voice minutes.',
      'After day 15 the account becomes read-only until a paid plan is chosen: your records are kept and you can still view them and download patient records, but you cannot record new visits, use the live voice assistant or generate new drafts until you choose a plan.',
    ] },
    { baslik: 'Plans and prices', paragraflar: [
      'Standard plans: A$149 a month, or A$1,490 a year. Prices are in Australian dollars and are as shown at checkout.',
      'Founding offer (first 20 doctors), while places remain: A$79 a month (the price may change with 30 days’ notice) or A$948 a year (locked for the prepaid year). A live counter on the founding page shows places remaining. If we change the founding monthly price, we tell you by email at least 30 days before, and you can cancel before the change takes effect.',
      'Paid plans include 150 minutes of the live voice assistant each month. The written assistant is not counted against these minutes.',
      'Current pricing is published on the founding page. Monthly prices may change with 30 days’ notice by email before the change applies to your next billing period. Annual prices are locked for the prepaid year.',
    ] },
    { baslik: 'Billing and automatic renewal', paragraflar: [
      'Subscriptions are paid through Stripe Checkout, and payment is taken at the start of each billing period. Your subscription renews automatically at the end of each month or year, at the price that applies then, until you cancel.',
      'If a payment cannot be collected, the account may become read-only until it is paid.',
    ] },
    { baslik: 'Cancelling', paragraflar: [
      `Cancellation, export and deletion are currently handled by email to ${AU_POLITIKA_EPOSTA} from your account’s email address. We act within 30 days. You can cancel at any time; cancelling stops the next renewal; the period you have already paid for continues to its end. After that, the account is read-only and your records are kept until you ask us to delete them, as described on the Data storage and retention page.`,
      'Refunds are covered on the Refunds and cancellation page.',
    ] },
    { baslik: 'Your records', paragraflar: [
      'What you write or record about your patients belongs to you or your practice. We handle it only to provide the service, as described in the Privacy Policy. You can ask for a copy of your records, or for your account to be deleted, at any time.',
    ] },
    { baslik: 'Acceptable use', paragraflar: [
      'Do not use Notya for anything unlawful, try to reach another account’s information, interfere with the service, or put information in it that you have no right to hold.',
    ] },
    { baslik: 'The service', paragraflar: [
      'We work to keep Notya available and accurate, but it may sometimes be unavailable, and an AI draft can contain mistakes; that is why every draft needs your approval. We may change features over time; we will give at least 30 days’ notice of a change that materially reduces what your paid plan includes.',
      'We may suspend an account that breaches these terms or puts other users at risk; except in an urgent case we will tell you first and give you a chance to fix the problem.',
    ] },
    { baslik: 'Limitation of liability', paragraflar: [
      'To the maximum extent permitted by law, Notya’s total liability arising out of or in connection with the Service is limited to the fees paid by the Practice in the 12 months preceding the claim. Nothing in these Terms excludes or limits liability that cannot be excluded under the Australian Consumer Law (including consumer guarantees).',
    ] },
    { baslik: 'Governing law and forum', paragraflar: [
      'These Terms are governed by the laws of New South Wales, Australia. The parties submit to the non-exclusive jurisdiction of the courts of New South Wales. For small-business customers, the Australian Consumer Law applies to the extent it cannot be contracted out of.',
    ] },
    { baslik: 'Dispute resolution', paragraflar: [
      'Before commencing proceedings, the parties must attempt good-faith negotiation for 14 days after written notice of a dispute. Either party may then refer the dispute to mediation in Sydney under the Resolution Institute rules. Court proceedings may be commenced if mediation does not resolve the dispute within 30 days.',
    ] },
    { baslik: 'Changes to these terms', paragraflar: ['We will post any change here with a new date, and email you at least 30 days before a change that affects you materially.'] },
    { baslik: 'Contact', paragraflar: [`${AU_OPERATOR}. Email: ${AU_POLITIKA_EPOSTA}.`] },
  ],
}

const REFUND: YasalBelge = {
  anahtar: 'refund',
  baslik: 'Refunds and cancellation',
  inceleme: AU_POLITIKA_INCELEME,
  bolumler: [
    { baslik: 'Cancelling', paragraflar: [
      `You can cancel at any time by emailing ${AU_POLITIKA_EPOSTA} from your account’s email address. The period you have already paid for continues to the date it was paid for, and no further period begins after that date. Your records are kept, read-only, until you ask us to delete them.`,
    ] },
    { baslik: 'Refunds', paragraflar: [
      `Refund requests are considered case by case: write to ${AU_POLITIKA_EPOSTA}. Consumer guarantees under the Australian Consumer Law are not excluded.`,
      'The free trial needs no payment, so you can try Notya before you pay.',
      'This does not limit your rights under the Australian Consumer Law. Our services come with guarantees that cannot be excluded under that law. If the service has a major failure, you are entitled to cancel and to a refund for the unused part of what you paid, or to compensation for the drop in value; for a failure that is not major, we will fix it within a reasonable time, and if we do not, you may cancel and ask for a refund.',
    ] },
    { baslik: 'Billing questions', paragraflar: [`Write to ${AU_POLITIKA_EPOSTA}.`] },
  ],
}

const COOKIES: YasalBelge = {
  anahtar: 'cookies',
  baslik: 'Cookie policy',
  inceleme: AU_POLITIKA_INCELEME,
  bolumler: [
    { baslik: 'Only what is needed', paragraflar: [
      'Notya sets only cookies that are strictly necessary for the service to work. We do not use advertising, tracking or analytics cookies, so there is no cookie banner.',
    ] },
    { baslik: 'What is stored', paragraflar: [
      'Sign-in cookies: keep a practitioner signed in to the application.',
      'Patient page cookie: keeps a patient’s page open after the PIN is entered; it is limited to that page and ends when the session ends.',
      'Your browser may also keep small preferences on your own device (for example, that you hid the first-steps panel). They are not sent to us for tracking.',
    ] },
    { baslik: 'Other services', paragraflar: [...AU_SITE_HIZMETLERI] },
    { baslik: 'Questions', paragraflar: [`Write to ${AU_POLITIKA_EPOSTA}.`] },
  ],
}

export const AU_YASAL: YasalKapisi = {
  diller: [{
    ...temel,
    belgeler: [
      ...temel.belgeler.map((b) => (b.anahtar === 'privacy' ? PRIVACY : b.anahtar === 'security' ? SECURITY : b.anahtar === 'medical' ? MEDICAL : b.anahtar === 'data-request' ? DATA_REQUEST : b.anahtar === 'terms' ? TERMS : b.anahtar === 'refund' ? REFUND : b.anahtar === 'cookies' ? COOKIES : { ...b, inceleme: AU_TASLAK_ETIKETI })),
    ],
  }],
}
