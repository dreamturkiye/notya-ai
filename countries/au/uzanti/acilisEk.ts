/**
 * AU-LANDING-01 (2026-10-22) — Australia's landing copy brought up to date with what the AU build ships, and the launch
 * framing (Kaan, 2026-10-22: AU goes public). Applied on top of the shared English copy (countries/_dil/en/acilis.ts) by
 * countries/au/arayuz.ts. Country-only on purpose: the us, gb, ca and nz builds do not ship these features.
 *
 * EVERY CLAIM BELOW WAS CHECKED AGAINST THE CODE OF THIS BUILD (file in brackets):
 *   named assistant per role      [klinik/asistanAdlari.ts, components/ulke/uygulama/Asistan.tsx, Bugun/Muayene/Not.tsx]
 *   add documents after recording [REMOVED from the AU landing 2026-10-24 (AU-LAUNCH-01): the model reading of images is off in AU; the step is hidden]
 *   calendar month/week/day       [components/ulke/uygulama/Takvim.tsx, PortalIstekleri.tsx]
 *   photo archive                 [FotoArsivi.tsx; pack feature fotoArsivi]
 *   consultation between doctors  [Konsultasyonlar.tsx; pack feature konsultasyon]
 *   privacy notice/consent/requests [uzanti/gizlilik.ts, GizlilikTalepleri.tsx]
 *   invoices and own Stripe       [uzanti/fatura.ts, _dil/en/fatura.ts, Fatura.tsx]
 *   Medicare/PBS/GST checklists   [araclar/medicareParticulars.ts, pbsPrescription.ts, gstInvoice.ts, kimlikKontrol.ts, baglantilar.ts]
 *   clinic team and front desk    [Klinik.tsx, KlinikYetkiler.tsx, OnBuro.tsx]
 * LEFT OUT ON PURPOSE: TGA/Ahpra/Medicare/PBS endorsement, compliance or certification; Medicare billing or claims; My Health
 * Record (a stub, no connection); Tyro (inactive); any price; any testimonial or number of customers; voice PREVIEW buttons (removed
 * in AU-HOME-01); the growth-chart tool (off); data residency promises; the persona names themselves.
 * AU-CANLI-01 (2026-10-22): the live SPOKEN assistant IS mentioned (microphone on the home screen) — but only while the
 * deployment really holds both agents, the key and the secrets (lib/ulke/asistan/ajan.ts canliAjanlarVar), and never with a
 * claim of diagnosis, decision support, a regulator or a standard. [components/ulke/uygulama/AsistanCanli.tsx, app/api/ulke/asistan-canli/]
 * No competitor, no public demo of the product, no named integration other than the doctor's own Stripe account.
 * AU-HUKUK-YANIT-01 (Kaan, 2026-11-05): the assistant is described ONLY with AU_ASISTAN_TANIMI (./gizlilik.ts) — no
 * "reference information", answer, recommendation or decision-support claim; paediatric tools "plot and record"; sign-up
 * is open and self-serve (no invitation code); pricing points to the founding page; "Prices are given by quote" removed.
 */
import type { AcilisIcerigi, EkOzellikBolumu } from '@/lib/ulke/arayuz/acilisTipleri'
import { canliAjanlarVar } from '@/lib/ulke/asistan/ajan'
import { AU_ASISTAN_TANIMI } from './gizlilik'

const EPOSTA = 'kaan@notya.io'

/**
 * AU-CANLI-01: the spoken assistant is mentioned ONLY while this deployment really has it (both agents, the key and the
 * secrets in its environment). A landing line for a feature the visitor's doctor could not press would be false.
 */
const SESLI = (): boolean => canliAjanlarVar('au', process.env)

function ekBolumler(rolSayisi: number, sesli: boolean = SESLI()): EkOzellikBolumu[] {
  return [
    {
      id: 'your-assistant',
      ustBaslik: 'Your assistant',
      baslik: 'An assistant with a name',
      baslikVurgu: 'for your specialty.',
      govde: `Each of the ${rolSayisi} specialties and professions has an assistant with its own name. You meet it on your home screen, and it is named on the visit and on every note it drafts. The names are invented product names, not real clinicians.${sesli ? ` Press the microphone on your home screen and talk to it: you hear it in an Australian voice, and the full text stays on your screen. ${AU_ASISTAN_TANIMI}` : ''}`,
      maddeler: ['A card on your home screen, set for the specialty you chose', 'Each draft says who wrote it: “Note drafted by …”', 'The assistant drafts and organises. It never approves anything for you', ...(sesli ? ['Ask out loud to find something in the patient’s file: it is read back to you, and the text stays on your screen'] : [])],
      kart: {
        etiket: 'Your assistant',
        satirlar: [{ k: 'Home screen', v: 'Named for your role' }, { k: 'Visit screen', v: 'Says who drafts the note' }, { k: 'Drafted note', v: 'Marked “Draft written by …”' }, { k: 'Approval', mark: 'Yours' }, ...(sesli ? [{ k: 'Voice', v: 'Reads back the patient’s file' }] : [])],
        not: 'Change your specialty in Settings and the assistant changes with it.',
      },
    },
    {
      id: 'privacy-requests',
      ustBaslik: 'Privacy',
      baslik: 'Consent and requests',
      baslikVurgu: 'kept on the record.',
      govde: 'On their own page a patient can read the collection notice, record their consent as a separate action, withdraw it, and ask to see or correct their information. You see each request with the days left on a 30-day response target, and the consent records, on one screen.',
      maddeler: ['Consent is never pre-ticked; it is stored with the date and the version of the notice', 'The notice states plainly that some processing happens overseas', 'You mark a request in progress, answered or declined, and keep your response with it', 'The timer is a product target, not legal advice, and Notya sends nothing to the patient: you give the answer yourself'],
      kart: {
        etiket: 'Privacy requests',
        satirlar: [{ k: 'Access request', mark: 'Days left' }, { k: 'Correction request', mark: 'Days left' }, { k: 'Consent records', v: 'Date and notice version' }, { k: 'Withdrawn consent', v: 'Shown as withdrawn' }],
      },
    },
    {
      id: 'invoices',
      ustBaslik: 'Invoices',
      baslik: 'Invoices with GST fields,',
      baslikVurgu: 'paid into your own Stripe account.',
      govde: 'Create an invoice for a patient in Australian dollars with your practice details (ABN and address) printed from Settings. Connect your own Stripe account and the card page, the money and the refunds are yours. Notya is not the merchant, holds no funds and takes no platform fee.',
      maddeler: ['Each line starts as GST-free; untick it for a line that includes 10% GST. Whether a service is GST-free is your decision, and this is not tax advice', 'A free-text field for an item number, typed by you; Notya supplies no item descriptions and no fees', 'Restricted Stripe keys only: full-access keys are refused. A test key moves no money; a live key needs your explicit confirmation and your signing secret', 'An invoice shows Paid only after Stripe confirms it. Full or partial refunds, and a check of Stripe’s payments against your invoices', 'Without a connection, payments run in a demonstration mode with no real charge'],
      kart: {
        etiket: 'Invoice',
        satirlar: [{ k: 'Lines, GST per line' }, { k: 'Your ABN and address', v: 'From Settings' }, { k: 'Stripe', v: 'Your own account' }, { k: 'Mode', mark: 'Test or live' }, { k: 'Refund', v: 'Full or partial' }],
        not: 'Card details are taken by Stripe’s hosted page, not by Notya.',
      },
    },
    {
      id: 'australian-tools',
      ustBaslik: 'Australian practice tools',
      baslik: 'Checklists and links',
      baslikVurgu: 'for Australian paperwork.',
      govde: 'For doctors: checklists of the particulars that Australian legislation prescribes for a Medicare account, a PBS prescription and a GST tax invoice, a format check of Medicare card and provider numbers, and links out to MBS Online and the PBS listings. Paediatric tools plot growth measurements and record immunisation dates against the Australian schedule. The practitioner reviews and interprets the information. Each tool shows its source.',
      maddeler: ['A tick is your own note; it does not decide that a benefit is payable', 'Nothing is lodged, claimed or sent: Notya is not connected to Medicare, the PBS or any government system', 'Link-outs open the official site in a new tab; only the term you typed is used', 'Tools for your specialty are drafts awaiting clinician review, and some are switched off until then'],
      kart: {
        etiket: 'In the tools area',
        satirlar: [{ k: 'Medicare account particulars', mark: 'Checklist' }, { k: 'PBS prescription particulars', mark: 'Checklist' }, { k: 'GST tax invoice particulars', mark: 'Checklist' }, { k: 'Card and provider number', mark: 'Format check' }, { k: 'MBS Online, PBS listings', mark: 'Link' }],
        not: 'Reference tools. They do not give advice or bill anything.',
      },
    },
  ]
}

function klinikEk(): EkOzellikBolumu[] {
  return [
    {
      id: 'clinic-team',
      ustBaslik: 'Your team',
      baslik: 'Positions, permissions',
      baslikVurgu: 'and a front desk.',
      govde: 'Create a clinic, invite doctors, health professionals and front-desk staff with one-time codes, and give each position a name. A position opens no patient: a clinician grants one permission at a time, for their own patients, and can withdraw it with one press.',
      maddeler: ['The front-desk workspace shows a doctor’s appointments, lets staff mark arrived, did not come or cancelled, find a patient, and, where the doctor allowed it, add a patient or hand out the patient-page link and PIN', 'The front desk never sees notes, visits, transcripts, form answers, appointment reasons or identity numbers', 'The clinic schedule shows when each member has an appointment, with nothing of any patient', 'Each clinician reads a record of every permission given and every use made of it', 'Doctors can ask a colleague in the same country for a view on an approved note or summary, with consent and with no patient name'],
      kart: {
        etiket: 'A clinic account',
        satirlar: [{ k: 'One-time team codes', v: 'Shown once' }, { k: 'Positions' }, { k: 'Permissions', v: 'One at a time, withdrawable' }, { k: 'Front desk', v: 'Only what was granted' }, { k: 'Record of use', v: 'Yours to read' }],
        not: 'Each account sees only its own patients unless a permission says otherwise.',
      },
    },
  ]
}

/** Adds the AU sections and the launch framing to the shared English copy of one form. Pure; returns a copy. */
export function auAcilisGuncelle(c: AcilisIcerigi, rolSayisi: number): AcilisIcerigi {
  const planEk = (liste: readonly string[], ek: readonly string[]) => [...liste, ...ek]
  return {
    ...c,
    ekBolumler: ekBolumler(rolSayisi),
    kahraman: {
      ...c.kahraman,
      giris: 'Notya assists with documentation. It records the visit with the patient’s consent and drafts the note for you to read, correct and approve; the calendar, invoices and a page for each patient sit beside it. It does not diagnose or suggest treatment, and nothing becomes part of the patient’s record until you approve it.',
    },
    qabul: {
      ...c.qabul,
      govde: 'The steps at the end of the visit stand in front of you, in order. The draft is written from what was said, and the assistant is told to add nothing more. You read it, correct it and approve it. An approved note is never changed afterwards.',
      maddeler: [
        'Four sections, and the fields of your own specialty',
        'Unclear places are marked, not guessed',
        'The transcript stays beside the note',
        'A draft is marked as a draft, and as AI-drafted, until you approve it',
        'The consent given for the recording is shown on the note',
      ],
      kart: {
        etiket: 'The visit note',
        satirlar: [{ k: 'Recording, with consent', mark: '01' }, { k: 'Transcript', mark: '02' }, { k: 'Draft note', mark: '03' }, { k: 'Your approval', mark: '04' }],
        not: 'Nothing becomes part of the patient’s record until you approve it.',
      },
    },
    jadval: {
      ...c.jadval,
      govde: 'Your working hours and breaks, your calendar by month, week and day, and each appointment linked to its visit. Patients can ask for a time from their own page and you answer: a request books nothing until you do. A reminder text is ready for you to copy and send yourself.',
      kart: { ...c.jadval.kart, satirlar: [{ k: 'Working hours and breaks' }, { k: 'Month, week and day' }, { k: 'Appointment requests from patients' }, { k: 'Reminder text', mark: 'You send it' }] },
    },
    kuzatuv: {
      ...c.kuzatuv,
      govde: `${c.kuzatuv.govde} Keep photographs on the patient’s file in a photo archive for viewing and side-by-side comparison; no model reads them.`,
    },
    narx: {
      ...c.narx,
      ustBaslik: '10 — Plans',
      baslik: 'Open sign-up.',
      baslikVurgu: 'Start with a free trial.',
      sorovNarx: '15-day free trial',
      sorovDugme: 'Contact us',
      gruplar: c.narx.gruplar.map((g) => ({
        ...g,
        rejalar: g.rejalar.map((r) => (r.id === 'doctor'
          ? { ...r, maddeler: planEk(r.maddeler, ['An assistant named for your specialty', 'Invoices in Australian dollars, paid into your own Stripe account', 'Privacy requests with a response timer', 'Checklists and links for Australian paperwork']) }
          : r)),
        izoh: g.id === 'clinic'
          ? `Anyone can create an account and start a 15-day free trial, no card needed. For a clinic with several accounts, write to ${EPOSTA}; the price depends on the number of accounts.`
          : 'Anyone can create an account and start a 15-day free trial, no card needed. Current pricing is published on the founding page. Monthly prices may change with 30 days’ notice. Annual prices are locked for the prepaid year.',
      })),
    },
    sorov: {
      ...c.sorov,
      govde: `Questions before you sign up? Tell us the specialty and how you work and we will get back to you, or write to ${EPOSTA}.`,
      formYok: `The request form opens soon. In the meantime, write to ${EPOSTA}.`,
      davetSorusu: 'Ready to try it?',
    },
    altBilgi: { ...c.altBilgi, kayit: 'Create an account' },
    klinik: {
      ...c.klinik,
      ekBolumler: klinikEk(),
      cta: { ...c.klinik.cta, govde: `Anyone can create an account and start a 15-day free trial, no card needed. For several accounts, tell us the discipline and how many you need, or write to ${EPOSTA}.` },
    },
  }
}
