/**
 * AU-LANDING-01 (2026-10-22) — Australia's landing copy brought up to date with what the AU build ships, and the launch
 * framing (Kaan, 2026-10-22: AU goes public). Applied on top of the shared English copy (countries/_dil/en/acilis.ts) by
 * countries/au/arayuz.ts. Country-only on purpose: the us, gb, ca and nz builds do not ship these features.
 *
 * EVERY CLAIM BELOW WAS CHECKED AGAINST THE CODE OF THIS BUILD (file in brackets):
 *   named assistant per role      [klinik/asistanAdlari.ts, components/ulke/uygulama/Asistan.tsx, Bugun/Muayene/Not.tsx]
 *   add documents after recording [components/ulke/uygulama/Ekler.tsx, lib/ulke/belgeler/ekler.ts, _dil/en/uygulama.ts ekler]
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
 */
import type { AcilisIcerigi, EkOzellikBolumu } from '@/lib/ulke/arayuz/acilisTipleri'
import { canliAjanlarVar } from '@/lib/ulke/asistan/ajan'

const EPOSTA = 'kaan@notya.io'

/**
 * AU-CANLI-01: the spoken assistant is mentioned ONLY while this deployment really has it (both agents, the key and the
 * secrets in its environment). A landing line for a feature the visitor's doctor could not press would be false.
 */
const SESLI = (): boolean => canliAjanlarVar('au')

function ekBolumler(rolSayisi: number, sesli: boolean = SESLI()): EkOzellikBolumu[] {
  return [
    {
      id: 'your-assistant',
      ustBaslik: 'Your assistant',
      baslik: 'An assistant with a name',
      baslikVurgu: 'for your specialty.',
      govde: `Each of the ${rolSayisi} specialties and professions has an assistant with its own name. You meet it on your home screen, and it is named on the visit and on every note it drafts. The names are invented product names, not real clinicians.${sesli ? ' Press the microphone on your home screen and talk to it: you hear a short answer in an Australian voice, and the full written answer stays on your screen. It gives general reference information, not a diagnosis or a treatment decision.' : ''}`,
      maddeler: ['A card on your home screen, set for the specialty you chose', 'Each draft says who wrote it: “Note drafted by …”', 'The assistant drafts and organises. It never approves anything for you', ...(sesli ? ['Ask out loud: a short spoken answer, the full text on your screen'] : [])],
      kart: {
        etiket: 'Your assistant',
        satirlar: [{ k: 'Home screen', v: 'Named for your role' }, { k: 'Visit screen', v: 'Says who drafts the note' }, { k: 'Drafted note', v: 'Marked “Draft written by …”' }, { k: 'Approval', mark: 'Yours' }, ...(sesli ? [{ k: 'Voice', v: 'Short answer aloud, full text on screen' }] : [])],
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
        not: 'A pre-launch draft: external legal review is planned.',
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
      govde: 'For doctors: checklists of the particulars that Australian legislation prescribes for a Medicare account, a PBS prescription and a GST tax invoice, a format check of Medicare card and provider numbers, an immunisation schedule shown as a calendar on the patient’s file, and links out to MBS Online and the PBS listings. Each tool shows its source.',
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
        satirlar: [{ k: 'Invitation codes', v: 'Shown once' }, { k: 'Positions' }, { k: 'Permissions', v: 'One at a time, withdrawable' }, { k: 'Front desk', v: 'Only what was granted' }, { k: 'Record of use', v: 'Yours to read' }],
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
      giris: 'Notya records the visit with the patient’s consent and drafts the note for you to read, correct and approve. The calendar, invoices and a page for each patient sit beside it. Nothing is saved to the patient file until you approve it.',
    },
    qabul: {
      ...c.qabul,
      govde: 'The steps at the end of the visit stand in front of you, in order. After the recording you can add ultrasound images, scans, lab reports or photographs; they are read with the visit and their results go into the Examination section of the first draft. The draft holds what was said and what those documents show, and nothing more. You correct it, and you approve it. An approved note is never changed afterwards.',
      maddeler: [
        'Four sections, and the fields of your own specialty',
        'Unclear places are marked, not guessed',
        'The transcript stays beside the note',
        'Documents are optional: add as many as you need, or skip the step',
        'Identifying details are hidden in the copy that is read; if that cannot be done, the file is not sent and is left out of the note',
      ],
      kart: {
        etiket: 'The visit note',
        satirlar: [{ k: 'Recording, with consent', mark: '01' }, { k: 'Documents (optional)', mark: '02' }, { k: 'Transcript', mark: '03' }, { k: 'Draft note', mark: '04' }, { k: 'Your approval', mark: '05' }],
        not: 'Nothing is saved to the patient file until you approve it.',
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
      baslik: 'Early access.',
      baslikVurgu: 'By quote.',
      gruplar: c.narx.gruplar.map((g) => ({
        ...g,
        rejalar: g.rejalar.map((r) => (r.id === 'doctor'
          ? { ...r, maddeler: planEk(r.maddeler, ['Documents added after the recording', 'An assistant named for your specialty', 'Invoices in Australian dollars, paid into your own Stripe account', 'Privacy requests with a response timer', 'Checklists and links for Australian paperwork']) }
          : r)),
        izoh: g.id === 'clinic'
          ? `Early access: accounts are opened with an invitation code while the first practices are set up. Ask for one at ${EPOSTA}. The price depends on the number of accounts.`
          : `Early access: accounts are opened with an invitation code while the first practices are set up. Ask for one at ${EPOSTA}. Prices are given by quote.`,
      })),
    },
    sorov: {
      ...c.sorov,
      govde: `Early access. Tell us the specialty and how you work and we will come back with a quote and an invitation code, or write to ${EPOSTA}.`,
      formYok: `The request form opens soon. In the meantime, write to ${EPOSTA}.`,
    },
    klinik: {
      ...c.klinik,
      ekBolumler: klinikEk(),
      cta: { ...c.klinik.cta, govde: `Early access: accounts are opened with an invitation code. Tell us the discipline and how many accounts you need, or write to ${EPOSTA}.` },
    },
  }
}
