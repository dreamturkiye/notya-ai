/**
 * NOTYA-ULKE-EN-01 — Australia (`au`, served at /au): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in Australian spelling (en-AU). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) and the pack's settings (./index.ts) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in Australia — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge. What each waits on is listed in docs/COUNTRY-PACK-AUSTRALIA.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Plain data: type-only imports, so that the pack's light data file can read it.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import type { Birimler } from '@/lib/ulke/tipler'

/**
 * GUARDIAN WORDING for a patient younger than this on the day of the visit ("who gave the history"), in every role.
 * UNVERIFIED — FOR A LAWYER (checklist B12). 16 is a starting value: consent of minors differs by state and territory; what that means for this
 * product's wording and for the form a parent fills in is a legal question.
 */
export const AU_VELI_YASI = 16

/** Units a clinic in Australia records in: SI. Unverified with a local clinical lead (checklist C8, E3). */
export const AU_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }

const KLINISYEN = 'a clinical lead in Australia'

export const AU_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-AU',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). Recording is governed by state and territory
    // law, which differs. Shown beside the box that unlocks recording. The version stamped on every visit is `surum`
    // below: change both together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // THE LABEL is the name of the national data element ("Medicare card number", AIHW METEOR 270101, N(11)). One card
    // may list several people, so the number printed on a card is not, alone, one person. It is a government related
    // identifier (Privacy Act 1988, APP 9: an organisation must not adopt one as its own identifier of a person).
    // FOR A LAWYER: whether this product may hold it at all. An optional free-text field, stored encrypted, never
    // validated, never required and never searched by. NEVER ADD a field for the Individual Healthcare Identifier or
    // for a tax file number (docs/COUNTRY-AUDIT-AUSTRALIA.md, A12).
    kimlikEtiketi: 'Medicare card number',
    cokSaatDilimi: true,
    saatDilimiCumlesi: 'Times are shown in the time zone set for your account.',
    tarihOrnegi: 'DD/MM/YYYY',
  },
  ulkeAdi: 'Australia',
  // The word a senior doctor goes by here: the Medical Board registers "specialists" (specialist registration; a
  // general practitioner's title is "specialist general practitioner"). Hospital usage ("consultant") NOT checked.
  kidemliHekim: 'specialist',
  // How each specialty is named in Australia, where it differs from the set's base name. CHECKED on 2026-10-09 against
  // the Medical Board of Australia's "List of specialties, fields of specialty practice and related specialist titles"
  // (22 September 2025): the first six names below are that list's own wording, the dash of the otolaryngology field
  // included. Not read by a clinician of the country. STILL OPEN, for a local clinical lead
  // (docs/COUNTRY-AUDIT-AUSTRALIA.md, A13):
  //   - 'thoracic-surgery' and 'cardiovascular-surgery' keep the set's base names. The list has "Cardio-thoracic
  //     surgery" and "Vascular surgery", which divide the work differently: neither key maps to one field.
  //   - 'oncology' keeps the base name. The list has "Medical oncology" and "Radiation oncology", and no "Oncology".
  //   - The five clinic roles are not specialties of the list. "Cosmetic medicine" is UNVERIFIED wording: the
  //     regulator's own words are "cosmetic surgery" and "non-surgical cosmetic procedures". A role name is an area
  //     of work, never a title: the title "surgeon" is protected by law here.
  rolAdlari: {
    'family-medicine': 'General practice',
    'internal-medicine': 'General medicine',
    gastroenterology: 'Gastroenterology and hepatology',
    'respiratory-medicine': 'Respiratory and sleep medicine',
    otolaryngology: 'Otolaryngology – head and neck surgery',
    paediatrics: 'Paediatrics and child health',
    'aesthetic-medicine': 'Cosmetic medicine',
  },
  veliYasi: AU_VELI_YASI,
  birimler: AU_BIRIMLER,
  surum: 'au-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-AU': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from Australia (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // UNVERIFIED: the unit laboratories in Australia report each value in: SI units (checklist C8). The kit converts
    // from the unit stated here with fixed factors; a wrong unit here is a wrong result.
    labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' },
    // FOR A LOCAL CLINICAL LEAD: the tools of the shared set this country keeps switched off, and why.
    kapali: {
      'esi-triyaj': { eksik: 'The Emergency Severity Index is one triage scale among several. Which triage scale emergency departments in Australia use, and whether a tool that records an ESI level belongs here at all, is for a local emergency physician to say.', kimden: KLINISYEN },
      'kdigo-evre': { eksik: 'UNIT SAFETY. Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol; the kit classifies in mg/g after an exact conversion. The published KDIGO limits in mg/mmol (3 and 30) are rounded and are not the exact conversion of 30 and 300 mg/g, so a value between 3.0 and 3.3 mg/mmol (or between 30 and 33.8) would be placed one category lower by the kit than by the published table. Needed: a clinical decision on which limits apply, and limits in mg/mmol in the kit.', kimden: KLINISYEN },
      'kdigo-serit': { eksik: 'UNIT SAFETY: the same as the internal-medicine KDIGO tool. The albuminuria limits in mg/mmol (3 and 30) are not the exact conversion of the mg/g limits the kit classifies with.', kimden: KLINISYEN },
      'rapor-taslagi': { eksik: 'The tool offers the BI-RADS assessment categories. Which reporting categories radiologists in Australia use for which examination is for a local radiologist to say; until then only the general outline would be right, and the tool is kept off as a whole.', kimden: KLINISYEN },
    },
    // UNVERIFIED: prostate-specific antigen is written in µg/L here (numerically the same as ng/mL).
    birimAdlari: { 'ng/mL': 'µg/L', 'ng/mL/yil': 'µg/L per year' },
  },
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED. One of the mobile numbers the communications regulator sets aside for
    // creative works (0491 570 006, 0491 570 110, 0491 570 156 to 159): it is not issued to anybody. Not checked
    // against the regulator's current list by anybody of the country.
    telefonOrnegi: '+61 491 570 006',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '$% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for Australia; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
