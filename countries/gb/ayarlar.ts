/**
 * NOTYA-ULKE-EN-01 — United Kingdom (`gb`, served at /uk): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in British spelling (en-GB). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) and the pack's settings (./index.ts) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in the United Kingdom — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge. What each waits on is listed in docs/COUNTRY-PACK-UNITED-KINGDOM.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Plain data: type-only imports, so that the pack's light data file can read it.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 16 is a starting value: in the United Kingdom a young person of 16 or
 * over is generally treated as able to consent for themselves, and a younger child may be in some circumstances;
 * what that means for this product's wording and for the form a parent fills in is a legal question.
 */
export const GB_VELI_YASI = 16

/** Units a clinic in the United Kingdom records in: SI. Unverified with a local clinical lead (checklist C8, E3). */
export const GB_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }

const KLINISYEN = 'a clinical lead in the United Kingdom'

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

export const GB_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-GB',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). Shown beside the box that unlocks recording.
    // The version stamped on every visit is `surum` below: change both together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // UNVERIFIED WORDING. An optional free-text field, stored encrypted, never validated and never required.
    kimlikEtiketi: 'NHS number',
    cokSaatDilimi: false,
    saatDilimiCumlesi: 'All times are UK time.',
    tarihOrnegi: 'DD/MM/YYYY',
  },
  ulkeAdi: 'the United Kingdom',
  // UNVERIFIED: the word a senior hospital doctor goes by here. (A consultant surgeon is addressed as Mr, Ms, Miss or
  // Mrs rather than Dr: that matters when an assistant is given a name and a title, which this pack does not do.)
  kidemliHekim: 'consultant',
  // UNVERIFIED: how each specialty is usually named in the United Kingdom, where it differs from the set's base name.
  // Not checked against the official list of specialties (checklist C1).
  rolAdlari: {
    'family-medicine': 'General practice',
    anaesthesia: 'Anaesthetics',
    'internal-medicine': 'General internal medicine',
    endocrinology: 'Endocrinology and diabetes',
    otolaryngology: 'Ear, nose and throat (ENT)',
    nephrology: 'Renal medicine',
    orthopaedics: 'Trauma and orthopaedics',
    radiology: 'Clinical radiology',
  },
  veliYasi: GB_VELI_YASI,
  birimler: GB_BIRIMLER,
  surum: 'gb-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-GB': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from the United Kingdom (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // UNVERIFIED: the unit laboratories in the United Kingdom report each value in (checklist C8). The kit converts
    // from the unit stated here with fixed factors; a wrong unit here is a wrong result.
    labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', crp: 'mg/L', psa: 'ug/L' },
    // C-REACTIVE PROTEIN in mg/L and PROSTATE-SPECIFIC ANTIGEN in µg/L (NOTYA-ULKE-ARAC-DUZELTME-01: each is now a
    // statement of the pack). PSA: NICE writes "micrograms/litre" (NICE guideline NG12, draft for consultation of
    // October 2021, Table 1, https://www.nice.org.uk/guidance/ng12/documents/draft-guideline-4, read 2026-10-10; the
    // audit read the same unit in the current NG12). The screen used to show "ng/mL": the same amount, another label.
    // CRP: that laboratories here report mg/L is NOT confirmed by a source read (the audit says so).
    // HOW A DOSE IS WRITTEN HERE: NO ZERO AFTER THE DECIMAL POINT ("5 mL", never "5.0 mL"). Source read 2026-10-10: MHRA,
    // "Best practice guidance on the labelling and packaging of medicines" (2026), section 4.3.2,
    // https://assets.publishing.service.gov.uk/media/6a4770118effd97622f53be5/Best_practice_guidance_labelling_MHRA_Final_July_2026.pdf
    // — "Trailing zeros should not appear i.e., 2.5 mg and NOT 2.50 mg." It is guidance on labels; the BNF's page on
    // prescription writing was not found by the audit. UNVERIFIED by a local clinical lead.
    dozYazimi: { sondaSifir: false },
    kapali: {
      'esi-triyaj': { eksik: 'The Emergency Severity Index is one triage scale among several. Which triage scale emergency departments in the United Kingdom use, and whether a tool that records an ESI level belongs here at all, is for a local emergency physician to say. ' + EMIR_ESI, kimden: HAK_SAHIBI },
      'kdigo-evre': { eksik: 'UNIT SAFETY. Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol; the kit classifies in mg/g after an exact conversion. The published KDIGO limits in mg/mmol (3 and 30) are rounded and are not the exact conversion of 30 and 300 mg/g, so a value between 3.0 and 3.3 mg/mmol (or between 30 and 33.8) would be placed one category lower by the kit than by the published table. Needed: a clinical decision on which limits apply, and limits in mg/mmol in the kit. ' + EMIR_BOBREK, kimden: KLINISYEN },
      'kdigo-serit': { eksik: 'UNIT SAFETY: the same as the internal-medicine KDIGO tool. The albuminuria limits in mg/mmol (3 and 30) are not the exact conversion of the mg/g limits the kit classifies with. ' + EMIR_BOBREK, kimden: KLINISYEN },
      'rapor-taslagi': { eksik: 'The tool offers the BI-RADS assessment categories. Which reporting categories radiologists in the United Kingdom use for which examination is for a local radiologist to say; until then only the general outline would be right, and the tool is kept off as a whole. ' + EMIR_RAPOR, kimden: HAK_SAHIBI },
      // switched off on 2026-10-10 by the order above (on in this pack until then):
      'doz-hesabi': { eksik: EMIR_DOZ, kimden: KLINISYEN },
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
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED. From the range the communications regulator sets aside for television and
    // radio drama (mobile numbers 07700 900000 to 900999): it is not issued to anybody. Not checked against the
    // regulator's current list by anybody of the country.
    telefonOrnegi: '+44 7700 900123',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '£% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for the United Kingdom; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
