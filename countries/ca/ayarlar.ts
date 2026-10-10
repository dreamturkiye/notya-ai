/**
 * NOTYA-ULKE-EN-01 — Canada (`ca`, served at /ca): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in Canadian spelling (en-CA). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) and the pack's settings (./index.ts) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in Canada — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge. What each waits on is listed in docs/COUNTRY-PACK-CANADA.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * ENGLISH ONLY. FRENCH IS ABSENT — WAITING ON KAAN. No screen, no visit note, no patient text and no instruction to
 * the model is written in French, and speech recognition listens for English only. Whether the product may be offered
 * in Quebec, or anywhere in Canada to French-speaking patients, without French is a legal and a commercial question
 * (docs/COUNTRY-PACK-CANADA.md); a French set would be a second language set (countries/_dil/fr/), not a change here.
 *
 * Plain data: type-only imports, so that the pack's light data file can read it.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 16 is a starting value: consent of minors is a matter of provincial law and differs by province (Quebec
 * sets its own age); what that means for this product's wording and for the form a parent fills in is a legal question.
 */
export const CA_VELI_YASI = 16

/** Units a clinic in Canada records in: SI. Unverified with a local clinical lead (checklist C8, E3). */
export const CA_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }

const KLINISYEN = 'a clinical lead in Canada'

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

export const CA_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-CA',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). Federal and provincial rules are open.
    // Shown beside the box that unlocks recording. The version stamped on every visit is `surum` below: change both
    // together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // UNVERIFIED WORDING (the name and the format differ by province and territory). An optional free-text field,
    // stored encrypted, never validated and never required.
    kimlikEtiketi: 'Provincial health card number',
    cokSaatDilimi: true,
    saatDilimiCumlesi: 'Times are shown in the time zone set for your account.',
    tarihOrnegi: 'YYYY-MM-DD',
  },
  ulkeAdi: 'Canada',
  // UNVERIFIED: the word a senior hospital doctor goes by here.
  kidemliHekim: 'staff physician',
  // UNVERIFIED: how each specialty is usually named in Canada, where it differs from the set's base name.
  // Not checked against the official list of specialties (checklist C1).
  rolAdlari: {
    anaesthesia: 'Anesthesiology',
    'internal-medicine': 'General internal medicine',
    endocrinology: 'Endocrinology and metabolism',
    'respiratory-medicine': 'Respirology',
    otolaryngology: 'Otolaryngology, head and neck surgery',
    radiology: 'Diagnostic radiology',
    'rehabilitation-medicine': 'Physical medicine and rehabilitation',
  },
  veliYasi: CA_VELI_YASI,
  birimler: CA_BIRIMLER,
  surum: 'ca-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-CA': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from Canada (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // UNVERIFIED: the unit laboratories in Canada report each value in: SI units (checklist C8). The kit converts
    // from the unit stated here with fixed factors; a wrong unit here is a wrong result.
    labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' },
    // FOR A LOCAL CLINICAL LEAD: the tools of the shared set this country keeps switched off, and why.
    kapali: {
      'esi-triyaj': { eksik: 'The Emergency Severity Index is one triage scale among several. Which triage scale emergency departments in Canada use, and whether a tool that records an ESI level belongs here at all, is for a local emergency physician to say. ' + EMIR_ESI, kimden: HAK_SAHIBI },
      'kdigo-evre': { eksik: 'UNIT SAFETY. Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol; the kit classifies in mg/g after an exact conversion. The published KDIGO limits in mg/mmol (3 and 30) are rounded and are not the exact conversion of 30 and 300 mg/g, so a value between 3.0 and 3.3 mg/mmol (or between 30 and 33.8) would be placed one category lower by the kit than by the published table. Needed: a clinical decision on which limits apply, and limits in mg/mmol in the kit. ' + EMIR_BOBREK, kimden: KLINISYEN },
      'kdigo-serit': { eksik: 'UNIT SAFETY: the same as the internal-medicine KDIGO tool. The albuminuria limits in mg/mmol (3 and 30) are not the exact conversion of the mg/g limits the kit classifies with. ' + EMIR_BOBREK, kimden: KLINISYEN },
      // switched off on 2026-10-10 by the order above (on in this pack until then):
      'doz-hesabi': { eksik: EMIR_DOZ, kimden: KLINISYEN },
      'rapor-taslagi': { eksik: EMIR_RAPOR, kimden: HAK_SAHIBI },
    },
    // THE LICENCE STATE of the two tools whose rights holder requires permission (docs/COUNTRY-PACK-HOWTO.md, "Country-only
    // tools and roles", point 5): "izin-gerekli" = permission needed. While it stands, the pack check refuses to switch
    // either tool on, and the screen and the server refuse it a second time.
    lisanslar: {
      'esi-triyaj': { durum: 'izin-gerekli', hakSahibi: 'Emergency Nurses Association (ENA)', kaynak: 'ENA, trademarks page (https://www.ena.org/ena-trademarks), and the copyright notice of the Emergency Severity Index handbook: read for the tools audit, second pass, 2026-10-10' },
      'rapor-taslagi': { durum: 'izin-gerekli', hakSahibi: 'American College of Radiology (ACR)', kaynak: 'ACR, BI-RADS permissions page (https://acr.org/Clinical-Resources/Reporting-and-Data-Systems/Bi-Rads/Permissions): read for the tools audit, second pass, 2026-10-10' },
    },
    // UNVERIFIED: prostate-specific antigen is written in µg/L here (numerically the same as ng/mL).
    birimAdlari: { 'ng/mL': 'µg/L', 'ng/mL/yil': 'µg/L per year' },
  },
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED. From the numbers the North American numbering plan sets aside for fiction
    // (555-0100 to 555-0199 in every area code): it is not issued to anybody. Not checked against the plan's current
    // rules by anybody of the country.
    telefonOrnegi: '+1 613 555 0123',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '$% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for Canada; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
