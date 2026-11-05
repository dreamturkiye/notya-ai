/**
 * AU-POLITIKA-01 (Kaan, 2026-11-03) — Australia's launch policy pages that sit outside the shared policy set:
 * /data-storage (data storage and retention), /sub-processors (who processes data for Notya) and
 * /data-processing-agreement (the short agreement offered to practices). The privacy policy (../yasal.ts) and the
 * data-breach page (./veriIhlali.ts) use the same provider list from here, so the pages cannot drift apart.
 *
 * Drafted 2026-11-03, pending review by an Australian health lawyer (docs/au/LEGAL-MEMO-2026-11.md). Every sentence below is
 * either a fact checked in this repository or the provider's own published documentation on 2026-11-03, or a commitment
 * Notya can honour today by hand. Checked facts:
 *   - Database, authentication and file storage: Supabase project "Notya Australia", region ap-southeast-2 (Sydney),
 *     read through the Supabase API on 2026-11-03; organisation plan "pro". Supabase's security page (supabase.com/security,
 *     read 2026-11-03): data encrypted at rest with AES-256 and in transit via TLS; paid-plan databases backed up daily;
 *     point-in-time recovery is an optional add-on (NOT confirmed for this project, so it is not claimed).
 *   - Hosting: Vercel, vercel.json `regions: ["syd1"]`; the live-voice model endpoint is pinned to syd1 as well. The AU build
 *     exposes only /api/ulke/ and /api/billing/ (../index.ts rotalar), so the shared routes pinned to iad1 are not served here.
 *   - Speech: ElevenLabs speech-to-text for visit recordings (lib/ulke/uygulama/konusmaTanima.ts); the recording is removed
 *     from storage once transcribed (lib/ulke/uygulama/muayeneKaydi.ts). Live voice assistant: ElevenLabs agent with this
 *     deployment's own model endpoint (app/api/ulke/asistan-canli/ses-llm), which reads the patient file.
 *   - Language models: OpenRouter (lib/ai/saglayici.ts) to OpenAI models first and Anthropic models as the fallback
 *     (lib/ai/modeller.ts).
 *   - Payments: Stripe Checkout for the clinician's own subscription (app/api/billing); a practice may connect its own Stripe
 *     or Tyro merchant account for patient invoices (lib/ulke/fatura).
 *   - Account emails: Supabase Auth (password reset in components/ulke/GirisFormu.tsx). No other email sender is called by
 *     the Australian build's routes.
 *   - Cancellation, deletion, export (2026-11-03): there is NO self-service cancellation, NO account-deletion endpoint and NO
 *     patient-record delete endpoint in the Australian build. A cancelled subscription leaves the account read-only
 *     (lib/billing/deneme.ts); a per-patient JSON export exists (app/api/ulke/gizlilik/disa-aktar). Everything else is done
 *     by Notya by hand on written request, and docs/OPEN-COMMITMENTS.md AU-POLITIKA-01 records the build of the automated tools.
 */
import type { UzantiBelgesi } from '@/lib/ulke/uzanti/tipler'
import { AU_OPERATOR, AU_PRIVACY_OFFICER } from './gizlilik'

// AU-HUKUK-YANIT-01 (Kaan, 2026-11-05): the revised texts after the Australian lawyer's answers (revised review pack of
// 5 November 2026) are published; every page that carries this date was brought to that revision.
export const AU_POLITIKA_TARIHI = '5 November 2026'
export const AU_POLITIKA_EPOSTA = 'kaan@notya.io'
// No "draft" label on the public pages (the owner removed them on 2026-10-24: AU_TASLAK_ETIKETI = ''); the review status is in
// docs/au/LEGAL-MEMO-2026-11.md. The first line of each page is its last-updated date.
export const AU_POLITIKA_INCELEME = `Last updated ${AU_POLITIKA_TARIHI}.`

export type AuAltIsleyen = {
  ad: string
  amac: string
  veri: string
  yer: string
}

/** The service providers that process personal information for Notya in the Australian service. */
export const AU_ALT_ISLEYENLER: readonly AuAltIsleyen[] = [
  {
    ad: 'Supabase',
    amac: 'Database, sign-in (including account emails such as password-reset links) and file storage.',
    veri: 'All account and patient records: practitioner details, patient details, visit transcripts and notes, appointments, messages, consent records, attached files and photos, and a visit recording until it is transcribed.',
    yer: 'Stored in Sydney, Australia (region ap-southeast-2). Supabase is a company based in the United States.',
  },
  {
    ad: 'Vercel',
    amac: 'Hosting of the website and the application.',
    veri: 'Everything sent between your browser and Notya passes through it while a request is handled; it does not hold the records.',
    yer: 'Application servers run in Sydney, Australia (region syd1). Requests first pass through Vercel’s global network. Vercel is a company based in the United States.',
  },
  {
    ad: 'ElevenLabs',
    amac: 'Speech: turns a visit recording into text, and runs the live voice assistant (hears the practitioner and speaks the reply).',
    veri: 'Visit recordings and their transcripts; the practitioner’s spoken questions to the assistant and the spoken replies, which can include content from the patient’s file.',
    yer: 'Overseas. ElevenLabs is a company based outside Australia; the countries where it processes data are not confirmed.',
  },
  {
    ad: 'OpenRouter',
    amac: 'Routes requests to the language-model provider that drafts notes and answers the practitioner.',
    veri: 'Visit transcripts, draft and approved notes, and the parts of a patient’s file the assistant reads to answer the practitioner.',
    yer: 'Overseas. OpenRouter is a company based in the United States.',
  },
  {
    ad: 'OpenAI',
    amac: 'Language models (the main models), reached through OpenRouter.',
    veri: 'As for OpenRouter.',
    yer: 'Overseas. OpenAI is a company based in the United States.',
  },
  {
    ad: 'Anthropic',
    amac: 'Language models (used when the main model is unavailable), reached through OpenRouter.',
    veri: 'As for OpenRouter.',
    yer: 'Overseas. Anthropic is a company based in the United States.',
  },
  {
    ad: 'Stripe',
    amac: 'Payment of the practitioner’s own Notya subscription.',
    veri: 'The practitioner’s name, email address, billing details and subscription status. Card details are entered on Stripe’s own page; Notya never receives or stores them. No patient information.',
    yer: 'Overseas. Notya’s Stripe account is held by its United States company.',
  },
]

/** Services that see only a website visitor, not a practice's records. */
export const AU_SITE_HIZMETLERI = [
  'Google Fonts: the public pages load their fonts from Google, so Google sees a visitor’s internet address.',
  'Cal.com: if a visitor chooses to book a private demo, the booking is made on Cal.com’s own page with the details the visitor enters there.',
] as const

/** A practice's own payment provider: under the practice's own agreement, not a Notya sub-processor. */
export const AU_PRATIK_ODEME = 'If a practice connects its own payment account (Stripe or Tyro) to take payments from its patients, that provider acts under the practice’s own merchant agreement. Notya stores the connection key encrypted and never sees card details.'

export const altIsleyenSatiri = (x: AuAltIsleyen): string => `${x.ad}: ${x.amac} Data: ${x.veri} Location: ${x.yer}`

/** The summary table of the revised review pack (section 1.3): provider | purpose | location | notes. */
export const AU_ALT_ISLEYEN_OZETI = [
  'Supabase — Database, sign-in, file storage — Sydney (ap-southeast-2) — US company.',
  'Vercel — Application hosting — Sydney functions (syd1); global edge — US company.',
  'ElevenLabs — Speech-to-text and live voice — Overseas — Retention and training terms to be confirmed.',
  'OpenRouter — Model routing — Overseas (US) — data_collection=deny set in code.',
  'OpenAI — Language models (primary) — Overseas (US) — Via OpenRouter.',
  'Anthropic — Language models (fallback) — Overseas (US) — Via OpenRouter.',
  'Stripe — Practitioner subscription payments — Overseas (US) — No patient data.',
  'Google Fonts — Public page fonts — Overseas — Visitor IP.',
  'Cal.com — Demo booking — Overseas — Visitor-entered details.',
] as const

const TERMS_NOT = 'How long each overseas provider keeps what it receives, and whether it may use it to improve its services or train its models, is set by that provider’s own terms. Notya is confirming each provider’s retention and no-training terms and will publish what it confirms on this page.'

export const AU_ALT_ISLEYEN_BELGESI: UzantiBelgesi = {
  baslik: 'Sub-processors',
  inceleme: AU_POLITIKA_INCELEME,
  bolumler: [
    { baslik: 'About this list', paragraflar: [
      'The following providers process personal information for the Australian Notya service. We remain accountable under the Privacy Act for their handling of the information we send them.',
      `Notya is provided by ${AU_OPERATOR}. A practice that uses Notya decides what is recorded about its patients; Notya processes that information on the practice’s behalf, with the help of the service providers below.`,
      'We will update this page before we add or replace a provider that receives patient information, and practices that have a data processing agreement with us will be told by email at least 30 days before the change takes effect.',
    ] },
    { baslik: 'Summary: provider — purpose — location — notes', paragraflar: [...AU_ALT_ISLEYEN_OZETI] },
    { baslik: 'Providers that process practice and patient information', paragraflar: AU_ALT_ISLEYENLER.map(altIsleyenSatiri) },
    { baslik: 'Retention and model training by providers', paragraflar: [TERMS_NOT] },
    { baslik: 'Website-only services', paragraflar: [...AU_SITE_HIZMETLERI] },
    { baslik: 'A practice’s own payment provider', paragraflar: [AU_PRATIK_ODEME] },
    { baslik: 'Notya staff', paragraflar: [
      'Notya LLC is a small United States company. Only its founder has administrative access to the systems. Notya does not look at patient records except to give support a practice asks for, to investigate a security problem, or where the law requires it.',
    ] },
    { baslik: 'Questions', paragraflar: [`Privacy Officer: ${AU_PRIVACY_OFFICER}.`] },
  ],
}

export const AU_VERI_SAKLAMA: UzantiBelgesi = {
  baslik: 'Data storage and retention',
  inceleme: AU_POLITIKA_INCELEME,
  bolumler: [
    { baslik: 'Where information is stored', paragraflar: [
      'Practice and patient records are stored in Sydney, Australia, in Notya’s Supabase database (region ap-southeast-2). Files, photos and attachments are stored with the same provider in the same region.',
      'Some services process information only while a task is done, and some of them are overseas: the hosting network, the speech provider and the language-model providers. They are listed, with what they receive, on the Sub-processors page.',
    ] },
    { baslik: 'Encryption', paragraflar: [
      'Patient names, details, notes and form answers are encrypted by the Notya application (AES-256-GCM) before they are stored. Some fields, such as appointment times, invoice amounts and record identifiers, are not separately encrypted.',
      'The database provider states that it encrypts all stored data (AES-256) and all data in transit (TLS). Notya pages are served over HTTPS.',
    ] },
    { baslik: 'Backups', paragraflar: [
      'The database provider takes a daily backup of the database and keeps backups for a limited period set by its service. Information deleted from Notya can remain in those backups until they expire. Notya does not offer restoration to an earlier point in time.',
    ] },
    { baslik: 'Who can access it', paragraflar: [
      'Each practitioner sees only their own patients; every request is checked against the signed-in account. Patients reach their own page only with a private link and a six-digit PIN, and the session ends by itself after 30 minutes.',
      'Within Notya, only the founder has administrative access, used only for support a practice asks for, to investigate a security problem, or where the law requires it.',
    ] },
    { baslik: 'Visit recordings', paragraflar: [
      'A visit is recorded only after the practitioner confirms that the patient (or their parent or guardian) has agreed. The recording is deleted from storage once it has been turned into text. The transcript and the note are kept as part of the record.',
    ] },
    { baslik: 'How long information is kept', paragraflar: [
      'Records are kept while the practice’s account exists. We delete an account and its records within 30 days of a written request from the account holder. Backups expire on the provider’s schedule.',
      'A free trial that ends without a paid plan leaves the account read-only: nothing is deleted, and the practitioner can still see their records.',
      'Notya does not delete records by itself after a set time. Records stay until the practice asks for them to be deleted, as described below.',
    ] },
    { baslik: 'Cancelling a subscription', paragraflar: [
      `To cancel, email ${AU_POLITIKA_EPOSTA} from the address of your account. We cancel the subscription so that it does not renew; the paid period already started runs to its end. After that, the account stays read-only: records are kept and can be viewed, and nothing new can be recorded.`,
    ] },
    { baslik: 'Getting a copy of your records', paragraflar: [
      'In the application, a practitioner can download one patient’s record (details, visits with transcripts and notes, appointments, consent records and privacy requests) as a file. That file lists what it does not yet include (files and photos, intake answers, messages, invoices).',
      `For a copy of everything in an account, email ${AU_POLITIKA_EPOSTA}. We will provide it within 30 days. A tool that lets a practice export its whole account itself is being built.`,
    ] },
    { baslik: 'Deleting an account', paragraflar: [
      `To have an account and its records deleted, email ${AU_POLITIKA_EPOSTA} from the address of the account. We will confirm the request, give you the chance to take a copy first, and delete the account and its records from the live database within 30 days. Copies in the provider’s backups expire on the provider’s backup schedule. Billing records that the law requires us to keep are kept for that period.`,
      'Patients: Notya holds your information for your practitioner. Ask your practitioner first; you can also write to us and we will pass the request to the practice.',
    ] },
    { baslik: 'The practitioner’s own obligations', paragraflar: [
      'Each practitioner and practice remains responsible for its own legal obligations to keep health records, including state and territory health records laws and professional rules on how long records must be kept (for example, records about a child are often required to be kept until the child reaches a certain age). Before asking for deletion, a practice should take a copy of any record it must keep.',
    ] },
    { baslik: 'Questions', paragraflar: [`Privacy Officer: ${AU_PRIVACY_OFFICER}.`] },
  ],
}

export const AU_DPA_BELGESI: UzantiBelgesi = {
  baslik: 'Data processing agreement',
  inceleme: AU_POLITIKA_INCELEME,
  bolumler: [
    { baslik: 'Available on request', paragraflar: [
      `A data processing agreement is available on request. Notya offers every practice a short data processing agreement: email ${AU_POLITIKA_EPOSTA} to receive it for signature. A summary of what it says is below; the signed agreement is what applies.`,
    ] },
    { baslik: 'Roles', paragraflar: [
      'The practice decides what is collected about its patients and why. Notya LLC handles that information only to provide the Notya service to the practice, on the practice’s documented instructions, and for no other purpose. Notya does not sell it, does not use it for advertising, and does not use it to train its own models.',
      'The application never makes clinical decisions; the practitioner remains responsible for all clinical decisions.',
    ] },
    { baslik: 'What Notya agrees to', paragraflar: [
      'Keep the information confidential and limit access to people who need it to provide the service.',
      'Keep the security measures described on the Data storage and retention and Security pages, and tell the practice about a material change.',
      'Use only the providers listed on the Sub-processors page, under written terms that require them to protect the information, and give at least 30 days’ email notice before adding or replacing a provider that receives patient information. The practice may object and, if the objection cannot be resolved, end the service with a pro-rata refund of prepaid fees for the unused period.',
      'Tell the practice without undue delay, and within 72 hours, after Notya confirms a data breach affecting the practice’s information, and help the practice assess it (within 30 days of suspicion) and notify the Office of the Australian Information Commissioner and the people affected where that is required.',
      'Help the practice answer patients’ requests to see or correct their information.',
      'On written request, or when the service ends, give the practice a copy of its information and then delete it from the live database within 30 days; backups expire on the provider’s schedule. Notya may keep billing records the law requires it to keep.',
      'Answer the practice’s reasonable written questions about how the information is handled.',
      'The agreement lasts as long as Notya handles the practice’s information.',
    ] },
    { baslik: 'What the practice agrees to', paragraflar: [
      'Have a lawful basis to collect its patients’ information, including their consent where it is needed; confirm consent before recording a visit; review and approve every draft note; and keep its own records for as long as the law requires.',
    ] },
    { baslik: 'Overseas processing', paragraflar: [
      'The records are stored in Sydney, Australia. Some providers process information overseas, as listed on the Sub-processors page. Notya LLC is a United States company. The agreement records these arrangements so the practice can meet its own obligations for overseas disclosure.',
    ] },
    { baslik: 'Questions', paragraflar: [`Privacy Officer: ${AU_PRIVACY_OFFICER}.`] },
  ],
}
