/**
 * NOTYA-ULKE-EN-01 — New Zealand (`nz`, served at /nz): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in New Zealand spelling (en-NZ). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) and the pack's settings (./index.ts) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in New Zealand — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge. What each waits on is listed in docs/COUNTRY-PACK-NEW-ZEALAND.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * NOTYA-ULKE-DENETIM-NZ (2026-10-09): the settings marked "SOURCE-CHECKED" below were compared with an official
 * New Zealand source on that day; the source and what it says are in docs/COUNTRY-AUDIT-NEW-ZEALAND.md. A source
 * check is a machine reading a public page. It is NOT a person of New Zealand confirming the setting, and the mark
 * above stands until one has.
 *
 * Plain data: type-only imports, so that the pack's light data file can read it.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 16 is a starting value; what the law on the consent of minors means for this product's wording and for the
 * form a parent fills in is a legal question.
 * SOURCE-CHECKED: the Care of Children Act 2004, section 36, gives a consent to treatment by a child "of or over the
 * age of 16 years" the effect of an adult's. What applies below 16, and to which treatments, stays for a lawyer.
 */
export const NZ_VELI_YASI = 16

/**
 * Units a clinic in New Zealand records in: SI. Unverified with a local clinical lead (checklist C8, E3).
 * SOURCE-CHECKED: body weight in kilograms (the national data standard for cardiovascular risk assessment, which
 * records height in metres; the national medication charting standard doses per kilogram). Centimetres for height on
 * a clinic screen and °C for temperature were not found stated on an official page: for a local clinical lead.
 */
export const NZ_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }

const KLINISYEN = 'a clinical lead in New Zealand'

export const NZ_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-NZ',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). Shown beside the box that unlocks recording.
    // The version stamped on every visit is `surum` below: change both together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // An optional free-text field, stored encrypted, never validated and never required. Whether a private clinic
    // records it in this product is open (for a lawyer: the rule on unique identifiers of the health privacy code).
    // SOURCE-CHECKED: the identifier is called the "NHI number" (National Health Index). It has seven characters, in
    // two forms that exist side by side: three letters, three digits and a check digit; and, issued from 1 July 2026,
    // three letters, two digits, a letter and a check letter. It is NOT a number of digits only.
    kimlikEtiketi: 'NHI number',
    cokSaatDilimi: true,
    saatDilimiCumlesi: 'Times are shown in the time zone set for your account.',
    // SOURCE-CHECKED: day, month, year (the national medication charting standard: "day/month/year format").
    tarihOrnegi: 'DD/MM/YYYY',
  },
  ulkeAdi: 'New Zealand',
  // The word a senior doctor goes by here. SOURCE-CHECKED: the medical council describes vocational registration as
  // "specialist registration". Hospitals also say "consultant" and "senior medical officer": for a local clinical lead.
  kidemliHekim: 'specialist',
  // How each specialty is named in New Zealand, where it differs from the set's base name.
  // SOURCE-CHECKED against the medical council's list of vocational scopes of practice (checklist C1): "General
  // practice", "Internal medicine", "Otolaryngology, head and neck surgery", "Plastic and reconstructive surgery" and
  // "Diagnostic and interventional radiology" are written as that list writes them.
  // UNVERIFIED, FOR A LOCAL CLINICAL LEAD: "Cosmetic medicine" is no vocational scope (the council speaks of "cosmetic
  // procedures"); and the roles of the shared set do not all match the list — see the audit document.
  rolAdlari: {
    'family-medicine': 'General practice',
    'internal-medicine': 'Internal medicine',
    otolaryngology: 'Otolaryngology, head and neck surgery',
    'plastic-surgery': 'Plastic and reconstructive surgery',
    radiology: 'Diagnostic and interventional radiology',
    'aesthetic-medicine': 'Cosmetic medicine',
  },
  veliYasi: NZ_VELI_YASI,
  birimler: NZ_BIRIMLER,
  surum: 'nz-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-NZ': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from New Zealand (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // UNVERIFIED: the unit laboratories in New Zealand report each value in: SI units (checklist C8). The kit converts
    // from the unit stated here with fixed factors; a wrong unit here is a wrong result.
    // SOURCE-CHECKED for three of the five (the national data standard for cardiovascular risk assessment): serum
    // creatinine in µmol/L, cholesterol in mmol/L, the urine albumin-to-creatinine ratio in mg/mmol. Glucose in
    // mmol/L and haemoglobin in g/L were NOT found stated on an official page: for a local laboratory or clinical
    // lead. (The same standard gives glycated haemoglobin in mmol/mol; the kit's field has no unit choice yet, so
    // the tool that reads it stays a slot.)
    labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' },
    // FOR A LOCAL CLINICAL LEAD: the tools of the shared set this country keeps switched off, and why.
    kapali: {
      // SOURCE-CHECKED: emergency departments here use the Australasian triage scale (Health New Zealand's public page
      // on emergency department triage), not the Emergency Severity Index.
      'esi-triyaj': { eksik: 'Emergency departments in New Zealand use the Australasian triage scale, with five categories; the Emergency Severity Index is a different scale, so a tool that records an ESI level is kept off here. Needed: the decision of a local emergency physician whether a triage record belongs in this product at all, and, if it does, a tool for the scale used here with its content supplied and signed locally.', kimden: KLINISYEN },
      'kdigo-evre': { eksik: 'UNIT SAFETY. Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol; the kit classifies in mg/g after an exact conversion. The published KDIGO limits in mg/mmol (3 and 30) are rounded and are not the exact conversion of 30 and 300 mg/g, so a value between 3.0 and 3.3 mg/mmol (or between 30 and 33.8) would be placed one category lower by the kit than by the published table. Needed: a clinical decision on which limits apply, and limits in mg/mmol in the kit.', kimden: KLINISYEN },
      'kdigo-serit': { eksik: 'UNIT SAFETY: the same as the internal-medicine KDIGO tool. The albuminuria limits in mg/mmol (3 and 30) are not the exact conversion of the mg/g limits the kit classifies with.', kimden: KLINISYEN },
      'rapor-taslagi': { eksik: 'The tool offers the BI-RADS assessment categories. Which reporting categories radiologists in New Zealand use for which examination is for a local radiologist to say; until then only the general outline would be right, and the tool is kept off as a whole.', kimden: KLINISYEN },
    },
    // Prostate-specific antigen is written in µg/L here (numerically the same as ng/mL).
    // SOURCE-CHECKED: the health ministry's prostate cancer management and referral guidance gives every value in µg/L.
    birimAdlari: { 'ng/mL': 'µg/L', 'ng/mL/yil': 'µg/L per year' },
  },
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED. A SHAPE, NOT A NUMBER: this job knows of no range New Zealand reserves for
    // fiction with certainty, so the example shows the form of a mobile number with X in place of digits. It cannot be
    // dialled and can be nobody's. A number from a reserved range, if a local source names one, may replace it.
    // The audit of 2026-10-09 found no official page that reserves a range for fiction. The spacing follows the
    // government's own example of an international number ("+64 4 456 2390").
    telefonOrnegi: '+64 2X XXX XXXX',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    // SOURCE-CHECKED: the government's writing guidance uses "$" alone where only New Zealand dollars are meant.
    // Whether an amount must be shown with or without goods and services tax is for a lawyer.
    aylikTutarKalibi: '$% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for New Zealand; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
