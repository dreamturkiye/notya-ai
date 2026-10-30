/**
 * NOTYA-ULKE-UYGULA-AU — Australia: THE TOOLS THAT ARE SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF.
 *
 * Every tool this country brought of its own (./tanimlar.ts, ./metinler.ts) is listed here, by key. Each was built
 * from a source opened on the day and from a rights holder's notice read on the day, and NO CLINICIAN OF AUSTRALIA
 * HAS READ IT. They are switched on by the owner's order of 2026-10-10 ("Bring on all the tools built for the new 6
 * countries now. We will test as we go."); until that order a tool on this list was kept switched off.
 *
 * WHAT THE LIST IS FOR. It is the worklist of the local clinical lead: a tool leaves it on the day a named clinician
 * of Australia has read its arithmetic, its words and its sources, and that name is written beside it. The pack's own
 * test (../au.test.ts) holds the list and the pack to each other, exactly: a tool of Australia's own that is switched
 * on and not listed fails it, and so does a listed key that is no longer a switched-on tool of the pack.
 *
 * Plain data: tests and documents read it; no screen does.
 */
import { AU_ACIL_ANAHTARLARI } from './acilBayraklari'
import { AU_DIYET_ANAHTARLARI } from './dieteticsTools'
import { AU_KOCLUK_ANAHTARLARI } from './bransKocluk'
import { AU_VISIT_PREP_ANAHTARLARI } from './visitPrep'
import { AU_KOHORT_ANAHTARLARI } from './kohort'
import { AU_BAGLANTI_KAYITLARI } from './referanslar'
import { AU_INCELEME_ANAHTARLARI } from './reviewPlans'

export type OnaysizAcikArac = {
  anahtar: string
  /** The proposal of the audit it was built from (docs/araclar-denetim/au-kararlar.json → addTools). */
  oneri: string
  /** What a clinician must look at first. */
  bakilacak: string
  /** The clinician who signed it off; null = nobody yet. */
  klinisyen: string | null
}

export const AU_ONAYSIZ_ACIK_ARACLAR: readonly OnaysizAcikArac[] = [
  {
    anahtar: 'au-body-size', oneri: 'au-body-size', klinisyen: null,
    bakilacak: 'The index is rounded to one decimal place before its class is read (neither source states a rounding rule). One set of adult classes is shown; the waist limits are the ones printed for Caucasian men and for Caucasian and Asian women, and the screen says so. Body surface area is not in the tool.',
  },
  {
    anahtar: 'au-mental-health-screen', oneri: 'au-mental-health-screen', klinisyen: null,
    bakilacak: 'The items are numbered, not worded. The group shown is the Bureau of Statistics\' (10 to 15, 16 to 21, 22 to 29, 30 to 50); the same paper prints another grouping for primary care (10 to 19, 20 to 24, 25 to 29, 30 to 50): say which one general practice here should see. No age limit is set. The DASS-21, the second choice the audit named, is not built.',
  },
  {
    anahtar: 'au-oncology-grading', oneri: 'au-oncology-grading', klinisyen: null,
    bakilacak: 'Only the performance status grade is recorded, by its number. The graded side effects the proposal names beside it are not built. The Australian source is one state body\'s assessment form.',
  },
  {
    anahtar: 'au-growth-chart-reference', oneri: 'NOTYA-ARACLAR-DENETIM-02-AU (founder\'s question #3, 2026-10-13)', klinisyen: null,
    bakilacak: 'Names WHO (under 2) and ANZSPED\'s own charts or the CDC 2000 charts (2 to 18) without choosing between the latter two, because ANZSPED\'s own page does not say which takes precedence. A paediatrician should say whether this product\'s own patients should default to one of them, and whether the under-18 age gate is the right cut-off (ANZSPED\'s charts run to 18; some practices may want this available to 19- or 20-year-olds using the CDC set).',
  },
  {
    anahtar: 'au-pbs-report-link', oneri: 'PBS expenditure reports, 2026-10-14', klinisyen: null,
    bakilacak: 'The tile only opens the report index. No drug row was copied, because the site copyright does not grant that. A clinician should say whether a link, with the top-50 table left out, is the right thing to show until the Department allows reuse.',
  },
  {
    anahtar: 'au-poisons-schedules', oneri: 'Poisons Standard, October 2026, schedule classes', klinisyen: null,
    bakilacak: 'Nine schedule classes from the instrument that commenced on 1 October 2026, general descriptions only. Schedule 1 is blank and is not offered. A clinician should confirm the instrument is still the current Poisons Standard, and that State or Territory law is what a prescription must follow.',
  },
  {
    anahtar: 'au-schedule-8', oneri: 'Poisons Standard, October 2026, Schedule 8', klinisyen: null,
    bakilacak: 'Every Schedule 8 entry from the instrument that commenced on 1 October 2026, including the exception printed in the entry and the hash mark for Appendix D. This is the schedule, not a ranking of prescriptions. A clinician should confirm the instrument is still in force before anyone relies on an entry.',
  },
  {
    anahtar: 'au-dispensing-label', oneri: 'Poisons Standard, October 2026, Appendix L clause 1', klinisyen: null,
    bakilacak: 'The human-medicine label details in Appendix L clause 1. The veterinary line and the clause 2 warning-statement table are not in the tool. Nothing is printed. A clinician should say whether a checklist of label details is the right screen until a State or Territory prescription form is loaded.',
  },
  {
    anahtar: 'au-notifiable-diseases', oneri: 'National Notifiable Disease List, compilation of 22 May 2026', klinisyen: null,
    bakilacak: 'Seventy-one names from the compilation in force on 22 May 2026, including item 1A. The amendment history says item 1A expires at the end of 22 November 2026. No case definition, no time limit and no addressee is in the tool. A clinician should confirm the compilation is still the one in force.',
  },
  {
    anahtar: 'au-immunisation-schedule', oneri: 'NOTYA-ARACLAR-DENETIM-02-AU (founder\'s question #2, 2026-10-13)', klinisyen: null,
    bakilacak: 'Built CORE for every role, and still unread by a clinician of Australia. Milestone due days come from NSW Health\'s rendering of the National Immunisation Program Schedule (current as at 1 October 2026). Catch-up dose counts and minimum intervals come from the Australian Immunisation Handbook catch-up page (last updated 30 September 2026): a vaccine-interval month is 4 weeks. Hib-by-age, hepatitis A, meningococcal B, extra pneumococcal doses, HPV, zoster and the brand limits on later rotavirus doses are not calculated. Nothing is sent to the Australian Immunisation Register.',
  },
  {
    anahtar: 'au-mandatory-notifications', oneri: 'National Law sections 140 to 142, Queensland Act, 2026-10-15', klinisyen: null,
    bakilacak: 'The grounds follow the Queensland Act current as at 10 April 2026. A treating practitioner is not on the section 140 test. A lawyer should read the National Law as it applies in each other State and Territory before anyone relies on this screen outside Queensland. Nothing is sent.',
  },
  {
    anahtar: 'au-pbs-prescription', oneri: 'Pharmaceutical Benefits Regulations, compilation of 15 August 2026', klinisyen: null,
    bakilacak: 'Section 40 particulars for a prescription that is not a medication chart. A tick is a note, not a decision that the prescription is valid. The benefit, quantity and repeats can be typed in the doctor\'s own words and are stored with that note. They are not checked against the Schedule of Pharmaceutical Benefits. Nothing is sent and there is no prescription-exchange connection. A clinician should confirm the compilation is still in force.',
  },
  {
    anahtar: 'au-medicare-particulars', oneri: 'Health Insurance Regulations 2018, compilation of 1 March 2026', klinisyen: null,
    bakilacak: 'Particulars for an account, a receipt or an assignment. Not a claim. Sections 52 and 57 are named in the note and are not ticks. No fee and no item number is stored. A clinician should confirm the compilation is still in force.',
  },
  {
    anahtar: 'au-pbs-schedule-link', oneri: 'PBS medicine listings, 2026-10-15', klinisyen: null,
    bakilacak: 'The tile only opens the listings index. No listing, restriction or price was copied. A clinician should say whether a link, with the listings left on the Department\'s site, is the right screen until reuse is allowed.',
  },
  {
    anahtar: 'au-mbs-online-link', oneri: 'MBS Online, 2026-10-15', klinisyen: null,
    bakilacak: 'The tile only opens MBS Online. No item, fee or rule was copied. A notice granting reuse of the schedule was not read. A clinician should say whether a link is the right screen.',
  },
  {
    anahtar: 'au-cvd-risk-link', oneri: 'Australian CVD risk calculator, 2026-10-15', klinisyen: null,
    bakilacak: 'The tile only opens the calculator. No equation, coefficient or age band was copied. The copyright page did not return a reuse grant. It is not the shared cardiovascular-risk slot, which stays empty. A clinician should say which roles should see the link.',
  },
  {
    anahtar: 'au-identifier-check', oneri: 'Medicare card and provider-number checksums, 2026-10-19', klinisyen: null,
    bakilacak: 'The card checksum and the provider-number checksum were read from clearwater.com.au on 19 October 2026, not from a Services Australia page. A match is not a register lookup. No Ahpra character pattern was on the page that was opened, so the registration number is not checked here.',
  },
  {
    anahtar: 'au-tax-invoice', oneri: 'GST Act section 29-70, compilation of 1 January 2026', klinisyen: null,
    bakilacak: 'The particulars in subsection 29-70(1), read 20 October 2026 from the compilation in force on 1 January 2026. A tick is a note. The approved form is not produced. Nothing is sent and no payment is taken. A clinician should confirm the compilation is still in force.',
  },
  {
    anahtar: 'au-immunisation-report', oneri: 'Australian Immunisation Register Rules 2026, section 10', klinisyen: null,
    bakilacak: 'Section 10 of the rules, as made on 12 March 2026 and commenced on 1 April 2026, and sections 4, 10A and 10B of the Act, compilation in force on 5 December 2025, read 20 October 2026. A tick is a note. Nothing is reported. The designated-vaccines determination was not read. A clinician should confirm the rules are still in force.',
  },
  {
    anahtar: 'au-my-health-record', oneri: 'My Health Records Act 2012, compilation of 1 July 2026', klinisyen: null,
    bakilacak: 'Sections 45, 45A, 45B and 46, and Schedule 1 clause 9, read 20 October 2026 from the compilation in force on 1 July 2026. Sections 23 and 24 of the My Health Records Rules 2026 were read from the instrument as made on 31 March 2026. A tick is a note. Nothing is uploaded. Prescribed State or Territory laws were not copied. A clinician should confirm both instruments are still in force.',
  },
  {
    anahtar: 'au-wellness-plan', oneri: 'Wellness and longevity inside general practice, 2026-10-20', klinisyen: null,
    bakilacak: 'General practice only. The Medical Board list has no longevity title. The ticks are the doctor\'s notes. No recommendation from the RACGP preventive-activities page is copied, and no dose or laboratory panel is stored. A clinician should say whether the two review names are the right pair.',
  },
  {
    anahtar: 'au-nonsurgical-plan', oneri: 'Hair transplants listed with non-surgical cosmetic procedures, 2026-10-20', klinisyen: null,
    bakilacak: 'Non-surgical cosmetic procedures only. Hair transplants are named there because the Medical Board guideline lists them in that group. The seven-day note is for a patient under 18. No graft count is stored. A lawyer should confirm that shortening the cooling-off rule into a tick is acceptable. Nothing is booked.',
  },
  {
    anahtar: 'au-cosmetic-surgery-plan', oneri: 'Cosmetic surgery plan, Medical Board guideline, 2026-10-20', klinisyen: null,
    bakilacak: 'Cosmetic surgery only. The seven-day note is for a patient 18 or older. The three-month note and the independent evaluation are for a patient under 18. A lawyer should confirm that shortening those rules into ticks is acceptable. Nothing is booked. Images stay under Documents.',
  },
  {
    anahtar: 'au-physio-plan', oneri: 'Physiotherapy plan, 2026-10-20', klinisyen: null,
    bakilacak: 'Physiotherapy only. The ticks are the practitioner\'s notes. No exercise protocol is copied. A clinician should say whether consent, a copy, and an optional photograph are the right three lines.',
  },
  {
    anahtar: 'au-psychology-plan', oneri: 'Psychology plan, 2026-10-20', klinisyen: null,
    bakilacak: 'Psychology only. A photograph is not part of an ordinary consultation. A clinician should say whether the consent lines are enough until a lawyer reads them.',
  },
  {
    anahtar: 'au-dietetics-plan', oneri: 'Dietetics plan, 2026-10-20', klinisyen: null,
    bakilacak: 'Dietetics only. No meal plan and no dose is stored. A clinician should say whether that omission is right.',
  },
  {
    anahtar: 'au-ot-plan', oneri: 'Occupational therapy plan, 2026-10-20', klinisyen: null,
    bakilacak: 'Occupational therapy only. No activity protocol is copied. A clinician should say whether consent, a copy, and an optional photograph are the right three lines.',
  },
  {
    anahtar: 'au-audiology-plan', oneri: 'Audiology plan, 2026-10-20', klinisyen: null,
    bakilacak: 'Audiology only. Hearing figures stay in the hearing tool. A clinician should say whether this note should also name a device review.',
  },
  {
    anahtar: 'au-privacy-principles', oneri: 'Privacy Act 1988 Schedule 1, compilation of 4 June 2026', klinisyen: null,
    bakilacak: 'The 13 headings in Schedule 1, read 20 October 2026 from the compilation in force on 4 June 2026. The operative subclauses are not set out. A tick is a note. It is not a finding that the Act is met. State and territory health-records laws are not on this screen. A lawyer should still read the consent pages.',
  },
  ...AU_INCELEME_ANAHTARLARI.map((anahtar) => ({
    anahtar,
    oneri: 'AU pediatri gold — clinical review studio per role, 2026-10-28',
    klinisyen: null,
    bakilacak: 'Session date plus the interval the practitioner enters. No college pathway, dose or protocol is copied. A clinician of that specialty should say whether the two consent lines and the next-review day are the right three lines for ordinary follow-up in their practice.',
  })),
  ...AU_ACIL_ANAHTARLARI.map((anahtar) => ({
    anahtar,
    oneri: 'AU-PEDIATRI-GOLD-01a — per-role danger-sign pathway, 2026-10-28',
    klinisyen: null,
    bakilacak: 'Clinician ticks only; warning names Triple Zero (000). No diagnosis stored. Regulatory advice on checklist tools that restate ticks remains OPEN (AU-LAUNCH-01b). A clinician of that specialty should say whether the sign list matches ordinary red-flag teaching in their practice.',
  })),
  ...AU_KOHORT_ANAHTARLARI.map((anahtar) => ({
    anahtar,
    oneri: 'AU-PEDIATRI-GOLD-01b — overdue immunisation / clinical-review cohort, 2026-10-28',
    klinisyen: null,
    bakilacak: 'Immunisation cohort: NIP age milestones vs today; review cohort: visit + interval. Nothing is sent to AIR. Companion to takip-paneli, not a full practice-wide recall product. A paediatrician or GP lead should confirm the age-milestone set and the overdue rule.',
  })),
  ...AU_DIYET_ANAHTARLARI.map((anahtar) => ({
    anahtar,
    oneri: 'AU clinical dietetics beta suite, 2026-10-28',
    klinisyen: null,
    bakilacak: 'Dietetics only. A practising dietitian should confirm MST score-only recording (questions not worded), kJ/kg starting estimates, IDDSI level labels, refeeding tick list, enteral rate arithmetic, and nutrition-lab value recording (no intervals) fit ordinary AU practice before relying on them with patients.',
  })),
  ...AU_KOCLUK_ANAHTARLARI.map((anahtar) => ({
    anahtar,
    oneri: 'AU gold depth — per-role portal coaching suite, 2026-10-30',
    klinisyen: null,
    bakilacak: 'Specialty-only care-plan / between-visit-log / care-goals. Free-text and ticks only — no dose, score or pathway. A clinician of that specialty should say whether the four plan slots and goal ticks match ordinary between-visit coaching in their practice.',
  })),
  ...AU_VISIT_PREP_ANAHTARLARI.map((anahtar) => ({
    anahtar,
    oneri: 'AU gold depth — per-role visit-prep checklist, 2026-10-30',
    klinisyen: null,
    bakilacak: 'Specialty-only visit-prep ticks. No dose, triage scale or pathway hours. A clinician of that specialty should say whether the five ticks match ordinary end-of-visit safety-netting in their practice.',
  })),
  ...AU_BAGLANTI_KAYITLARI.map((k) => ({
    anahtar: k.anahtar,
    oneri: k.anahtar,
    klinisyen: null,
    bakilacak: k.bakilacak,
  })),
]

/** The keys alone, sorted. */
export const AU_ONAYSIZ_ACIK_ANAHTARLAR: readonly string[] = AU_ONAYSIZ_ACIK_ARACLAR.map((a) => a.anahtar).sort()
