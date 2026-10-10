/**
 * NOTYA-ULKE-EN-01 — United States (`us`, served at /us): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in American spelling (en-US). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) and the pack's settings (./index.ts) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in the United States — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge. What each waits on is listed in docs/COUNTRY-PACK-UNITED-STATES.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * NOTYA-ULKE-UYGULA-US (2026-10-10) — THE AUDIT'S DECISIONS FOR THIS COUNTRY, APPLIED HERE AND NOWHERE ELSE
 * (docs/araclar-denetim/US.md and us-kararlar.json on the branch araclar-denetim/us; the second pass supersedes the
 * first): its own role list (./roller.ts), who sees which tool (`gorenler`), the numbers a national source states
 * for the shared tools that take a country's (`parametreler`, `uyarlama`), the licence states that were read
 * (`lisanslar`), and six tools of its own, built and SWITCHED OFF (./araclar/). Every number below that is new
 * stands beside the source it was read from on that day.
 *
 * The pack's light file (./index.ts) does not read this file any more: what it needs is in ./temel.ts and
 * ./roller.ts, which import types only. This file brings the arithmetic of the country's own tools.
 */
import { hekimRolleri } from '@/lib/ulke/araclar/paket'
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { enRolSatirlari } from '../_dil/en/klinik/roller'
import { US_ROLLER, US_YENIDEN_ADLANANLAR } from './roller'
import { US_BIRIMLER, US_VELI_YASI } from './temel'

export { US_BIRIMLER, US_VELI_YASI } from './temel'

/** The doctor roles of this country (every role that is not an allied profession), from its own role list. */
export const US_HEKIMLER: readonly string[] = hekimRolleri(enRolSatirlari(US_ROLLER))

const KLINISYEN = 'a clinical lead in the United States'

// ── NOTYA-ULKE-ARAC-01b — OFF BY KAAN'S ORDER OF 2026-10-10 ("Switch off the risky tools"), in every country: the dose
// calculator, the ESI triage tool, the report outline that prints the BI-RADS categories, and both kidney tools. Each
// stays a slot (`kapali` below) until its fault is corrected in the kit or its licence is granted. The guard test
// lib/ulke/araclar/kapaliAraclar.paket.test.ts fails if a pack switches one of them on. Evidence: the audits of the
// tools against national sources, docs/araclar-denetim/, "Second pass" (branches araclar-denetim/<code>). ──
const EMIR_DOZ = 'SAFETY, off by the owner\'s order of 2026-10-10: the tool rounds the volume of one dose to 0.1 mL and shows only the rounded figure (0.16 mL is shown as 0.2 mL), and it prints trailing zeros ("5.0 mL"), which can be misread as ten times the dose. Needed: both corrected in the kit (NOTYA-ULKE-ARAC-01b).'
const EMIR_ESI = 'LICENCE, off by the owner\'s order of 2026-10-10: the Emergency Severity Index belongs to the Emergency Nurses Association, which requires written permission for its use; none has been given. Needed: that permission, recorded.'
const EMIR_RAPOR = 'LICENCE, off by the owner\'s order of 2026-10-10: the BI-RADS categories the tool prints belong to the American College of Radiology, which requires a licence agreement for commercial software; there is none. The tool stays off as a whole: the categories are not edited out of it. Needed: that agreement, recorded.'
const EMIR_BOBREK = 'SAFETY, off by the owner\'s order of 2026-10-10: the tool shows "Low risk (green cell)" when no urine albumin result was typed, and the internal-medicine tool labels its referral flags as KDIGO criteria that the guideline does not state that way. Needed: both corrected in the kit (NOTYA-ULKE-ARAC-01b).'
/** Who lifts a licence block: the owner obtains the rights holder's permission; a local clinician then confirms the tool. */
const HAK_SAHIBI = `the owner, with the rights holder's written permission; then ${KLINISYEN}`

export const US_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-US',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). RECORDING-CONSENT LAW DIFFERS BY STATE (some
    // states require the consent of everyone recorded): this sentence must not be relied on in any state until a lawyer
    // has read it for that state. Shown beside the box that unlocks recording. The version stamped on every visit is
    // `surum` below: change both together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // UNVERIFIED WORDING, DELIBERATELY NEUTRAL (for example a clinic's own record number). An optional free-text field,
    // stored encrypted, never validated and never required. NEVER A SOCIAL SECURITY NUMBER: no screen asks for one.
    kimlikEtiketi: 'Patient identifier',
    cokSaatDilimi: true,
    saatDilimiCumlesi: 'Times are shown in the time zone set for your account.',
    tarihOrnegi: 'MM/DD/YYYY',
  },
  ulkeAdi: 'the United States',
  // UNVERIFIED: the word a senior hospital doctor goes by here.
  kidemliHekim: 'attending physician',
  // How each specialty is named in the United States, where it differs from the set's base name. The six names below
  // are the audit's "keep" (docs/araclar-denetim/US.md, 3a: each is on the board's, the council's or Medicare's list
  // read on 2026-10-10); THE FIVE RENAMES of the audit follow them, each exactly as the body cited writes it
  // (./roller.ts → US_YENIDEN_ADLANANLAR, where the source of each stands). None has been read by a US clinician.
  rolAdlari: {
    anaesthesia: 'Anesthesiology',
    'infectious-diseases': 'Infectious disease',
    'sports-medicine': 'Sports medicine',
    'rehabilitation-medicine': 'Physical medicine and rehabilitation',
    physiotherapy: 'Physical therapist',
    ...US_YENIDEN_ADLANANLAR,
  },
  // THE ROLE LIST OF THIS COUNTRY: the shared forty without "Dermatology (clinic)", with ten specialties and six
  // professions of its own, each saying which shared role it behaves like (./roller.ts).
  roller: US_ROLLER,
  veliYasi: US_VELI_YASI,
  birimler: US_BIRIMLER,
  surum: 'us-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-US': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from the United States (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // UNVERIFIED: the unit laboratories in the United States report each value in: conventional units (checklist C8). The kit converts
    // from the unit stated here with fixed factors; a wrong unit here is a wrong result.
    labBirimleri: { albuminKreatinin: 'mg/g', hemoglobin: 'g/dL', kreatinin: 'mg/dL', glukoz: 'mg/dL', kolesterol: 'mg/dL', crp: ['mg/L', 'mg/dL'], psa: 'ng/mL' },
    // C-REACTIVE PROTEIN (NOTYA-ULKE-ARAC-DUZELTME-01): BOTH UNITS ARE ACCEPTED, AND THE DOCTOR CHOOSES ONE beside the
    // field — a number without its unit gives no result. Laboratories here may report mg/L or mg/dL, and the DAS28
    // formula takes mg/L: a result of 1.0 mg/dL read as 1.0 mg/L gave a score of 3.43 where it is 4.04. The label used
    // to tell the doctor to multiply by 10 by hand. PSA is written in ng/mL (the urologists' guideline, per the audit).
    // HOW A DOSE IS WRITTEN HERE: NO ZERO AFTER THE DECIMAL POINT ("5 mL", never "5.0 mL"). Source read 2026-10-10: NCPDP,
    // "Standardize the Dosing Designations on Prescription Container Labels for Oral Liquid Medications to Metric (mL)
    // Only" (the white paper the FDA hosts), https://www.fda.gov/media/88498/download — "Do NOT use trailing zeros
    // after a decimal point". UNVERIFIED by a local clinical lead. (The dose tool is kept off here: see `kapali`.)
    dozYazimi: { sondaSifir: false },
    // FOR A LOCAL CLINICAL LEAD: the tools of the shared set this country keeps switched off, and why.
    kapali: {
      'doz-hesabi': { eksik: 'UNIT SAFETY. This pack measures body weight in pounds; the tool multiplies a dose stated per kilogram by the body weight. The kit converts a weight typed in pounds exactly, but a screen that shows the weight in pounds beside a dose per kilogram invites the very error the tool exists to prevent. Needed: a clinical decision on whether weight for dosing is entered in kilograms only in the United States, and a weight field in the kit that can be fixed to kilograms whatever the pack\'s unit. ' + EMIR_DOZ, kimden: KLINISYEN },
      // switched off on 2026-10-10 by the order above (on in this pack until then):
      'esi-triyaj': { eksik: EMIR_ESI, kimden: HAK_SAHIBI },
      'kdigo-evre': { eksik: EMIR_BOBREK, kimden: KLINISYEN },
      'kdigo-serit': { eksik: EMIR_BOBREK, kimden: KLINISYEN },
      'rapor-taslagi': { eksik: EMIR_RAPOR, kimden: HAK_SAHIBI },
    },
    // THE LICENCE STATE of the two tools whose rights holder requires permission (docs/COUNTRY-PACK-HOWTO.md, "Country-only
    // tools and roles", point 5): "izin-gerekli" = permission needed. While it stands, the pack check refuses to switch
    // either tool on, and the screen and the server refuse it a second time.
    lisanslar: {
      'esi-triyaj': { durum: 'izin-gerekli', hakSahibi: 'Emergency Nurses Association (ENA)', kaynak: 'ENA, trademarks page (https://www.ena.org/ena-trademarks), and the copyright notice of the Emergency Severity Index handbook: read for the tools audit, second pass, 2026-10-10' },
      'rapor-taslagi': { durum: 'izin-gerekli', hakSahibi: 'American College of Radiology (ACR)', kaynak: 'ACR, BI-RADS permissions page (https://acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads/Permissions): read for the tools audit, second pass, 2026-10-10' },
    },
  },
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED. From the numbers the North American numbering plan sets aside for fiction
    // (555-0100 to 555-0199 in every area code): it is not issued to anybody. Not checked against the plan's current
    // rules by anybody of the country.
    telefonOrnegi: '+1 202 555 0123',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '$% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for the United States; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
