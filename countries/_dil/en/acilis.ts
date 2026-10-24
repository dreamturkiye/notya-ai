/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the LANDING PAGE's copy, the same in every English-speaking country
 * except what a country states itself (its role names, its word for a senior doctor, its phone example, how it
 * writes a monthly amount).
 *
 * MACHINE-WRITTEN. No native editor, no marketer and no lawyer of any of the five countries has read a line. A
 * native reader must read every line before the page is shown to anyone outside the team (checklist E11, K1).
 *
 * The LAYOUT is the kit's (components/ulke/acilis/): the same sections, in the same order, for every country. What
 * the sections SAY is written here FOR THE ENGLISH-SPEAKING BUILDS, and it describes ONLY WHAT SUCH A BUILD DOES:
 * recording a visit, a drafted note the doctor approves, role templates, the calendar, the patient's page, messages
 * kept on that page, the form before a visit, the tools area with the follow-up list, and a clinic account with a
 * front desk. Nothing of the pre-split application that a country build does not have is promised (no spoken
 * assistant, no consultation between colleagues, no doctor's own text templates, no reminders sent by the system,
 * no learning of a doctor's habits, no dose warnings).
 *
 * THE CLINIC PAGE (`/for-clinics`) uses the Turkish clinic page's section inventory. It describes a clinic account:
 * positions, permissions a clinician grants, and a front desk that sees only what was granted. It does not claim a
 * free trial. Discipline names are the pack's own clinic-side roles, filled in `enAcilis`.
 *
 * STANDING RULES (checked by ./acilis.test.ts and by each pack's own test):
 *   - NO CLAIM of compliance with any law or standard, of approval, clearance or certification by any authority, of
 *     an endorsement, or of a connection to any record system or state system. No law and no regulator is named.
 *     Nothing says where data is kept.
 *   - NO TESTIMONIAL, no quotation of a doctor (invented or real), no customer name or logo, no usage number.
 *   - NO PRICE. Plans are shown "by quote"; a country's price list holds no amount until the owner sets one.
 *     No free trial, no discount, no public demo.
 *   - NO CLINICAL REFERENCE CONTENT in the examples: no medicine, no dose, no threshold, no schedule. The example
 *     visits show how a note is drafted and approved, with invented, unremarkable findings.
 *   - NO NAMED ASSISTANT and no biography: the assistant is "the assistant".
 *   - The page is hidden from search and sign-up is by invitation code (settings of each pack).
 *
 * Written in en-GB spelling; `enAcilis(country)` gives the copy in the country's form.
 */
import type { AcilisIcerigi } from '@/lib/ulke/arayuz/acilisTipleri'
import type { RolTanimi } from '@/lib/ulke/arayuz/tipler'
import type { EnUlkeSozleri } from './ulke'
import { enCevir } from './varyant'

/** Anchors of the page's sections: lower-case English words, the same in all five countries. */
export const EN_CAPA = {
  ust: 'top', suhbat: 'visit', qabul: 'note', portal: 'patient-page', maslahat: 'before-the-visit', jadval: 'calendar',
  yonalish: 'specialties', kuzatuv: 'tools', organish: 'approval', xavfsizlik: 'safeguards', narx: 'plans', sorov: 'quote',
  klinikUst: 'clinicpage', klinikPortal: 'clinicportal', klinikDallar: 'disciplines', klinikFiyat: 'clinicplans', klinikSorov: 'clinicquote',
} as const

/** The layout's two faces, for a language written in Latin letters. */
export const EN_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Fraunces:wght@100..900&family=Outfit:wght@100..900&display=swap'

/** Plan and group ids of the plans section: the keys of each pack's price list. PROPOSAL, WAITING ON THE OWNER: which plans exist is his decision per country. */
export const EN_PLANLAR = { doctor: 'doctor', clinic: 'clinic' } as const
const GRUP = { solo: 'solo', clinic: 'clinic' } as const

/** `%M` the word mark; `%K` the country's word for a senior doctor. The lists a country fills are put in by `enAcilis`. */
/** Footer labels for the policy pages, in YASAL_ANAHTARLARI order. No statute is named. */
const EN_YASAL = ['Privacy', 'Terms of use', 'Cookies', 'Your information', 'Accessibility', 'Medical disclaimer', 'Security', 'Refunds and cancellation', 'Copyright'] as const

const TEMEL: AcilisIcerigi = {
  meta: {
    baslik: '%M — a clinical assistant for doctors',
    aciklama: 'Records a visit, drafts the visit note in English for the doctor to correct and approve, keeps the calendar and gives each patient a page of their own. Every step takes effect only when the doctor approves it.',
  },
  nav: {
    bolumler: 'Sections',
    mobil: 'Mobile menu',
    dil: 'Language',
    havolalar: [
      { capa: EN_CAPA.suhbat, etiket: 'The visit', no: '01' },
      { capa: EN_CAPA.portal, etiket: 'Patient\'s page', no: '03' },
      { capa: EN_CAPA.yonalish, etiket: 'Specialties', no: '06' },
      { capa: EN_CAPA.xavfsizlik, etiket: 'Safeguards', no: '09' },
      { capa: EN_CAPA.narx, etiket: 'Plans', no: '10' },
    ],
    giris: 'Sign in',
    girisUzun: 'Sign in to your account',
    sorov: 'Request a quote',
    menyuAc: 'Open the menu',
    menyuYop: 'Close the menu',
  },
  kahraman: {
    ustBaslik: 'A clinical assistant for doctors',
    baslik: 'The patient leaves the room —',
    baslikVurgu: 'and the note is already drafted.',
    giris: '%M records the visit and drafts the note for you to read, correct and approve. The calendar stays with the visit, and each patient has a page of their own. Nothing is saved to the patient file until you approve it.',
    birinciDugme: 'Request a quote',
    ikinciDugme: 'See a visit',
    gorselAlt: 'A doctor\'s room in daylight: an examination couch, a stethoscope, a blood pressure monitor and framed certificates',
    gorselAlti: 'A doctor\'s room · illustration',
    serit: ['Note templates for 40 specialties and professions', 'In English', 'With a page for each patient', 'Every step approved by the doctor'],
  },
  suhbat: {
    ustBaslik: '01 — The visit',
    baslik: 'Talk to your patient,',
    baslikVurgu: 'not to the screen.',
    govde: 'With the patient\'s consent, start the recording and carry on with the visit. When you stop, the recording is transcribed and a note is drafted from what was said.',
    maddeler: ['The visit is turned into a transcript you can read', 'The draft note is ready soon after the visit ends'],
    sekmeler: 'Example visits',
    yozmoqda: 'drafting',
    tayyor: 'ready',
    izoh: 'These visits are invented examples. In a real clinic every sentence waits for the doctor\'s approval.',
    sahneler: [
      {
        id: 'draft',
        meta: 'A visit',
        yordamchi: 'The assistant',
        alan: 'General template',
        saat: '09:14',
        navbatlar: [
          { kim: 'Doctor', rol: 'shifokor', matn: 'Three days of a sore throat, no fever. The throat is a little red. Come back in a week if it is no better.' },
          { kim: 'Assistant', rol: 'yordamchi', matn: 'Draft ready, in four sections: history, examination, assessment as you stated it, plan. Please read it and approve it.' },
        ],
      },
      {
        id: 'unclear',
        meta: 'When the recording is unclear',
        yordamchi: 'The assistant',
        alan: 'General template',
        saat: '11:03',
        navbatlar: [
          { kim: 'Doctor', rol: 'shifokor', matn: 'Prepare the note.' },
          { kim: 'Notice', rol: 'ogohlantirish', matn: 'One part of the recording could not be made out. It is marked "[unclear]" in the draft and nothing was guessed. Please check that place.' },
        ],
      },
      {
        id: 'summary',
        meta: 'For the patient',
        yordamchi: 'The assistant',
        alan: 'General template',
        saat: '16:40',
        navbatlar: [
          { kim: 'Doctor', rol: 'shifokor', matn: 'Prepare the summary for the patient.' },
          { kim: 'Assistant', rol: 'yordamchi', matn: 'A short summary in plain words, written from your approved note and from nothing else. The patient sees it only after you share it.' },
        ],
      },
    ],
  },
  qabul: {
    ustBaslik: '02 — The note',
    baslik: 'The visit closes',
    baslikVurgu: 'in one flow.',
    govde: 'The steps at the end of the visit stand in front of you, in order. The draft holds what was said and nothing more. You correct it, and you approve it. An approved note is never changed afterwards.',
    maddeler: ['Four sections, and the fields of your own specialty', 'Unclear places are marked, not guessed', 'The transcript stays beside the note'],
    kart: {
      etiket: 'The visit note',
      satirlar: [{ k: 'Recording, with consent', mark: '01' }, { k: 'Transcript', mark: '02' }, { k: 'Draft note', mark: '03' }, { k: 'Your approval', mark: '04' }],
      not: 'Nothing is saved to the patient file until you approve it.',
    },
  },
  portal: {
    ustBaslik: '03 — Patient\'s page',
    baslik: 'A page of their own',
    baslikVurgu: 'for each patient.',
    govde: 'You give a patient a link and a PIN. On their page: coming appointments, the summaries you chose to share, a request for an appointment, the form before a visit, and messages you write, which they read and answer there. No app to install.',
    maddeler: ['Nothing is shared by itself: you choose', 'The visit note itself is never shown to the patient', 'A message stays on the page: nothing is sent out, and you tell the patient'],
    kart: {
      etiket: 'Patient\'s page',
      satirlar: [{ k: 'Coming appointments' }, { k: 'Summaries you shared' }, { k: 'A request for an appointment' }, { k: 'Messages you write' }, { k: 'The form before a visit' }],
      not: 'One link and a PIN. No app.',
    },
  },
  maslahat: {
    ustBaslik: '04 — Before the visit',
    baslik: 'The history starts',
    baslikVurgu: 'before the patient arrives.',
    govde: 'Ask a patient to fill in a short form on their page before the visit: general questions first, then the questions of your specialty. You read the answers as the patient\'s own words.',
    maddeler: ['A form for a child is addressed to a parent or guardian', 'Answers are marked as stated by the patient, not verified', 'The answers are not used when the note is drafted'],
    kart: {
      etiket: 'Form before the visit',
      satirlar: [{ k: 'You ask', v: 'From the patient file' }, { k: 'The patient fills it in', v: 'On their own page' }, { k: 'You read it', v: 'Before the visit' }],
    },
  },
  jadval: {
    ustBaslik: '05 — Calendar',
    baslik: 'Your appointments',
    baslikVurgu: 'in the same place.',
    govde: 'Your working hours, your calendar by day and by week, and each appointment linked to its visit. A reminder text is ready for you to copy and send yourself.',
    maddeler: ['The same time cannot be booked twice', 'Booking outside your working hours asks you to confirm'],
    kart: {
      etiket: 'Calendar',
      satirlar: [{ k: 'Working hours' }, { k: 'Day and week' }, { k: 'Appointment requests from patients' }, { k: 'Reminder text', mark: 'You send it' }],
    },
  },
  yonalish: {
    ustBaslik: '06 — Your specialty',
    baslik: 'Not a general assistant.',
    baslikVurgu: 'Your specialty.',
    govde: 'Each specialty and profession has a note of its own shape, its own questions before a visit, and its own tools. You choose it when the account is opened, and the screen is set up for it. The texts were drafted by machine and await a clinician of each specialty.',
    misollar: [],
    royxatEtiketi: 'Specialties and professions',
    royxat: [],
  },
  kuzatuv: {
    ustBaslik: '07 — Tools and follow-up',
    baslik: 'Checklists and calculators,',
    baslikVurgu: 'and the dates you set.',
    govde: 'Tools for your specialty: checklists, published scores with their source, date arithmetic. Keep a result in a patient\'s file with a follow-up date of your own, and it appears on your follow-up list.',
    kart: {
      etiket: 'Follow-up list',
      satirlar: [{ k: 'Follow-up overdue', mark: 'Marked' }, { k: 'Follow-up today', mark: 'Marked' }],
      not: 'The dates are yours. The system proposes none and sends nothing.',
    },
  },
  organish: {
    ustBaslik: '08 — Your decision',
    baslik: 'A draft is a draft',
    baslikVurgu: 'until you approve it.',
    govde: 'The assistant drafts; you decide. A second draft never replaces the first: you choose which one to approve.',
    gorselAlt: 'A doctor\'s desk in morning light: visit notes, a pocket notebook, a stethoscope and a pen',
    gorselAlti: 'Visit notes · illustration',
    sekmeler: 'Example',
    birinchi: { etiket: 'Draft', sorov: 'Prepare the note.', javob: 'A draft in four sections. It holds what was said at the visit, and nothing was added.' },
    oninchi: { etiket: 'Approved', sorov: 'Approve.', javob: 'Approved and saved to the patient file. An approved note is not changed afterwards.' },
    izoh: 'Nothing is final until you say so.',
  },
  xavfsizlik: {
    ustBaslik: '09 — Safeguards',
    baslik: 'Fifty patients, a long day —',
    baslikVurgu: 'and nothing leaves without you.',
    iqtibos: 'The assistant drafts. The doctor decides.',
    izoh: 'What the recording does not contain, the draft does not add. What you have not approved, the patient does not see.',
    gorselAlt: 'A clinic corridor in daylight: doors of doctors\' rooms and a bench for waiting',
    gorselAlti: 'A clinic corridor · illustration',
    dalillar: [
      { k: 'Separate access', v: 'Each doctor sees only their own patients.' },
      { k: 'The doctor\'s approval', v: 'A note, and everything a patient sees, passes your approval first.' },
      { k: 'Nothing sent by itself', v: 'The system sends nothing out. A message stays on the patient\'s page, and you tell the patient it is there.' },
      { k: 'Your clinical judgement', v: '%M drafts and organises what you record. It does not diagnose or recommend treatment; every clinical decision stays with the registered practitioner.' },
    ],
  },
  narx: {
    ustBaslik: '10 — Plans',
    baslik: 'By invitation.',
    baslikVurgu: 'By quote.',
    guruhlar: 'Type of plan',
    tavsiya: 'Suggested',
    oylik: '%',
    sorovNarx: 'Price by quote',
    dugme: 'Request a quote',
    sorovDugme: 'Request a quote',
    gruplar: [
      {
        id: GRUP.solo,
        ad: 'Doctor',
        rejalar: [{ id: EN_PLANLAR.doctor, ad: 'One doctor', maddeler: ['A visit recorded with consent, and a drafted note', 'The note template of your specialty', 'Unclear places marked, never guessed', 'Calendar, working hours, and a reminder text you send yourself', 'A protected page for each patient', 'Messages with a patient, kept on their page', 'The form before a visit', 'The tools of your specialty and the follow-up dates you set'] }],
        izoh: 'Accounts are opened by invitation code for now. Prices are given by quote.',
      },
      {
        id: GRUP.clinic,
        ad: 'Clinic',
        rejalar: [{ id: EN_PLANLAR.clinic, ad: 'Clinic', maddeler: ['An account for each doctor and health professional', 'Positions, and permissions a clinician grants', 'A front desk that sees only what was granted', 'Each account sees only its own patients, unless a permission says otherwise', 'The note, the page and the tools of that account\'s discipline', 'A quote for the number of accounts'] }],
        izoh: 'Accounts are opened by invitation code for now. The price depends on the number of accounts.',
      },
    ],
  },
  sorov: {
    ustBaslik: 'For your work',
    baslik: 'Request a quote.',
    baslikVurgu: 'We will contact you.',
    govde: 'By invitation code only, for now. Tell us the specialty and how you work, and we will come back with a quote. In English.',
    form: {
      etiket: 'Request for a quote',
      adSoyad: 'Full name',
      kurum: 'Clinic or organisation',
      telefon: 'Phone number',
      telefonOrnek: '%T',
      uzmanlik: 'Specialty',
      mesaj: 'Message (optional)',
      gonder: 'Send the request',
      ipucu: 'The request is sent with the mail app on your device.',
      eksik: 'Enter your name and phone number.',
      telefonGecersiz: 'This is not a phone number we can use. Check it, for example %T.',
      konu: '%M: request for a quote',
      satir: { adSoyad: 'Full name', kurum: 'Clinic or organisation', telefon: 'Phone number', uzmanlik: 'Specialty', mesaj: 'Message' },
    },
    formYok: 'Requests will open soon.',
    davetSorusu: 'Have an invitation code?',
    davetBaglantisi: 'Create an account',
  },
  altBilgi: {
    tanim: 'A clinical assistant for doctors.',
    havolalar: 'Footer links',
    giris: 'Sign in',
    kayit: 'Create an account with an invitation code',
    klinik: 'For clinics',
    haklar: '%M',
    diller: 'Language',
    yasal: EN_YASAL,
  },
  klinik: {
    meta: {
      baslik: '%M — your clinic and your patient, on the same page',
      aciklama: 'Set up for the discipline you work in. Each patient is given a protected page that opens without an app. Every step takes effect only when the clinician approves it.',
    },
    markaEk: 'clinic',
    nav: {
      bolumler: 'Sections',
      mobil: 'Mobile menu',
      dil: 'Language',
      havolalar: [
        { capa: EN_CAPA.klinikPortal, etiket: 'Patient\'s page', no: '01' },
        { capa: EN_CAPA.klinikDallar, etiket: 'Disciplines', no: '02' },
        { capa: EN_CAPA.klinikFiyat, etiket: 'Plans', no: '03' },
      ],
      giris: 'Sign in',
      girisUzun: 'Sign in to your account',
      sorov: 'Request a quote',
      menyuAc: 'Open the menu',
      menyuYop: 'Close the menu',
    },
    kahraman: {
      ustBaslik: 'For clinics',
      baslik: 'Your clinic and your patient,',
      baslikVurgu: 'on the same page.',
      giris: '%M is set up for the discipline you work in, and each patient is given a protected page that opens without an app.',
      birinciDugme: 'Request a quote',
      ikinciDugme: 'Find your discipline',
      gorselAlt: 'A clinic corridor in daylight: doors of doctors\' rooms and a bench for waiting',
      gorselAlti: 'A clinic · illustration',
    },
    portal: {
      ustBaslik: '01 — Patient\'s page',
      baslik: 'A page of their own,',
      baslikVurgu: 'for every patient.',
      govde: 'Coming appointments, the summaries you chose to share, a request for an appointment, messages kept on the page, and the form before a visit, on one link and a PIN. No app to install.',
      maddeler: ['Nothing is shared by itself: you choose', 'The visit note itself is never shown to the patient', 'You give the link and the PIN yourself', 'A message stays on the page: nothing is sent out'],
      kart: {
        etiket: 'Patient\'s page',
        satirlar: [{ k: 'Coming appointments' }, { k: 'Summaries you shared' }, { k: 'A request for an appointment' }, { k: 'Messages' }, { k: 'The form before a visit' }],
        not: 'One link and a PIN. No app.',
      },
    },
    dallar: {
      ustBaslik: '02 — Disciplines',
      baslik: 'Set up for',
      baslikVurgu: 'the work you do.',
      govde: 'The note, the form before a visit and the tools follow the discipline of the account. The names are this country\'s.',
      royxatEtiketi: 'Disciplines',
      royxat: [],
    },
    guven: '%M keeps the record and the follow-up dates you set. Diagnosis and treatment remain with the clinician.',
    fiyat: { ustBaslik: '03 — Plans', baslik: 'By the account.', baslikVurgu: 'By quote.' },
    cta: {
      ustBaslik: 'For your clinic',
      baslik: 'Request a quote.',
      baslikVurgu: 'We will contact you.',
      govde: 'By invitation code only, for now. Tell us the discipline and how many accounts you need.',
      ikinciDugme: 'One doctor? %M for doctors',
    },
    altBilgi: {
      tanim: 'A clinical assistant for clinics.',
      havolalar: 'Footer links',
      doktor: '%M for doctors',
      giris: 'Sign in',
      haklar: '%M',
      diller: 'Language',
      yasal: EN_YASAL,
    },
  },
}

/** The three roles the specialties section shows an example for, with the sentence beside each. Base spelling. */
const MISALLER: readonly { rol: string; v: string }[] = [
  { rol: 'paediatrics', v: 'Birth history, feeding, development and what was said about vaccinations each have their place in the note.' },
  { rol: 'obstetrics-gynaecology', v: 'Menstrual and obstetric history and the current pregnancy each have their place in the note.' },
  { rol: 'ophthalmology', v: 'Acuity, pressure, anterior segment and fundus each have their place in the note.' },
]

export const EN_ACILIS_TEMEL = { icerik: TEMEL, misaller: MISALLER } as const

export type EnAcilisGirdisi = {
  sozler: EnUlkeSozleri
  /** The pack's roles, with their names in the country's usage: the list the specialties section shows. */
  roller: readonly RolTanimi[]
  /** A phone number as people of the country write it, as the example in the request form. */
  telefonOrnegi: string
  /**
   * How a monthly amount is written in this country: '%' is the number, the currency sign and the period are the
   * country's ("£% a month"). NOT SHOWN TODAY: every plan is by quote until the owner sets prices.
   */
  aylikTutarKalibi: string
}

/** The landing page's copy in a country's form of English. */
export function enAcilis(g: EnAcilisGirdisi): AcilisIcerigi {
  const bicim = g.sozler.bicim
  const doldur = (s: string): string => s.replace(/%M/g, g.sozler.marka).replace(/%T/g, g.telefonOrnegi)
  const t = enCevir(TEMEL, bicim)
  const ad = (rol: string): string => g.roller.find((r) => r.anahtar === rol)?.ad[bicim] ?? ''
  const metin = JSON.parse(JSON.stringify(t), (_k, v: unknown) => (typeof v === 'string' ? doldur(v) : v)) as AcilisIcerigi
  // AU-MKT-AUDIT (2026-10-22): the count in the hero strip is the pack's own number of roles, not a fixed 40.
  metin.kahraman.serit = metin.kahraman.serit.map((x) => x.replace(/\b40 specialties/, `${g.roller.length} specialties`))
  return {
    ...metin,
    yonalish: {
      ...metin.yonalish,
      // An example names a role: a country that does not have the role (NOTYA-ULKE-OZEL-01) shows no example for it.
      misollar: MISALLER.filter((m) => g.roller.some((r) => r.anahtar === m.rol)).map((m) => ({ k: ad(m.rol), v: enCevir(m.v, bicim) })),
      royxat: g.roller.map((r) => r.ad[bicim]),
    },
    klinik: {
      ...metin.klinik,
      dallar: {
        ...metin.klinik.dallar,
        royxat: g.roller.filter((r) => r.taraf === 'klinik-hekim' || r.taraf === 'klinik-muttefik').map((r) => r.ad[bicim]).filter((x): x is string => Boolean(x)),
      },
    },
    narx: { ...metin.narx, oylik: g.aylikTutarKalibi },
  }
}
