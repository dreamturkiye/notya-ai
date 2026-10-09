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
    labBirimleri: { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L' },
    kapali: {
      'esi-triyaj': { eksik: 'The Emergency Severity Index is one triage scale among several. Which triage scale emergency departments in the United Kingdom use, and whether a tool that records an ESI level belongs here at all, is for a local emergency physician to say.', kimden: KLINISYEN },
      'kdigo-evre': { eksik: 'UNIT SAFETY. Laboratories here report the urine albumin-to-creatinine ratio in mg/mmol; the kit classifies in mg/g after an exact conversion. The published KDIGO limits in mg/mmol (3 and 30) are rounded and are not the exact conversion of 30 and 300 mg/g, so a value between 3.0 and 3.3 mg/mmol (or between 30 and 33.8) would be placed one category lower by the kit than by the published table. Needed: a clinical decision on which limits apply, and limits in mg/mmol in the kit.', kimden: KLINISYEN },
      'kdigo-serit': { eksik: 'UNIT SAFETY: the same as the internal-medicine KDIGO tool. The albuminuria limits in mg/mmol (3 and 30) are not the exact conversion of the mg/g limits the kit classifies with.', kimden: KLINISYEN },
      'rapor-taslagi': { eksik: 'The tool offers the BI-RADS assessment categories. Which reporting categories radiologists in the United Kingdom use for which examination is for a local radiologist to say; until then only the general outline would be right, and the tool is kept off as a whole.', kimden: KLINISYEN },
    },
  },
  acilis: {
    // A number from the range the regulator sets aside for drama: it reaches nobody. Format unverified.
    telefonOrnegi: '+44 7700 900123',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '£% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for the United Kingdom; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
