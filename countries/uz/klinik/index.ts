/**
 * NOTYA-UZ-MUAYENE-01 — Uzbekistan: the clinical half of the pack. How a visit is listened to and what a note may be
 * built from. Reached only through countries/active/klinik, and only on the server.
 *
 * NOTHING HERE HAS BEEN MEASURED OR REVIEWED LOCALLY. The thresholds are starting values to be tuned on real Uzbek and
 * Russian clinic audio (docs/COUNTRY-PACK-CHECKLIST.md A5, L1); the consent wording has not been read by a lawyer
 * (A3, I1); the specialty list has no local reviewer yet (C1, C14).
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'
import { UZ_ACIK_SABLONLAR } from './branslar'
import { UZ_HASTA_FORMU } from './hastaFormu'
import { uzHastaOzetiGirdisi, uzHastaOzetiTalimati } from './hastaOzeti'
import { uzSablonAlanlari } from './notSablonlari'
import { uzDigerDil, uzNotGirdisi, uzNotTalimati, uzYenidenYazimGirdisi, uzYenidenYazimTalimati } from './talimatlar'

export const UZ_KLINIK: UlkeKlinigi = {
  konusma: {
    saglayici: 'elevenlabs-scribe',
    // Kaan, 2026-10-08. The provider's own documentation rates Uzbek (uzb) "Good", 10–20% word errors, and Russian
    // (rus) "Excellent"; it says nothing about recordings that mix the two. Vendor figures, not ours.
    model: 'scribe_v2',
    // FIRST PASS: no language is sent — the provider predicts it, and the prediction and its probability are stored
    // with the visit. SECOND PASS (at most one, only on low confidence): the language is forced to the doctor's
    // note language, with these codes. The script (Latin / Cyrillic) is not something the provider is told.
    zorlamaDilKodlari: { 'uz-Latn': 'uzb', 'uz-Cyrl': 'uzb', ru: 'rus' },
    beklenenDiller: { uzb: 'uz', uz: 'uz', rus: 'ru', ru: 'ru' },
    // LOW CONFIDENCE, first pass: the predicted language is less than 80% certain, or the average word is less
    // than about 70% certain (ln 0.70 ≈ −0.36). Either one triggers the second pass. Starting values (to verify).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  // The tick-box sentence is `muayene.riza` in ../uygulama/metinler.ts. This stamp is stored with every visit, so a
  // later, lawyer-reviewed wording can be told apart from this draft.
  riza: { surum: 'uz-taslak-2026-10-08', hukukcuInceledi: false },
  sablonlar: UZ_ACIK_SABLONLAR,
  // Same ceiling the pre-split application gives a doctor for visit notes per day.
  gunlukMuayeneLimiti: 200,
  // Instructions to the model: written fresh in Uzbek (both scripts) and Russian, no source cited (./talimatlar.ts).
  notTalimati: uzNotTalimati,
  notGirdisi: uzNotGirdisi,
  // NOTYA-UZ-BRANSLAR-01: the fields a note of a template may carry — a role's own, plus the guardian field for a
  // patient under 18. Everything else the model returns, or a request sends, is dropped by core.
  notAlanlari: uzSablonAlanlari,
  yenidenYazimTalimati: uzYenidenYazimTalimati,
  yenidenYazimGirdisi: uzYenidenYazimGirdisi,
  digerDil: uzDigerDil,
  // NOTYA-ULKE-PORTAL-01: a plain-language summary of an approved note, for the patient, in the patient's own language
  // form (./hastaOzeti.ts — machine-written, not read by a native-speaking clinician).
  hastaOzetiTalimati: uzHastaOzetiTalimati,
  hastaOzetiGirdisi: uzHastaOzetiGirdisi,
  // NOTYA-ULKE-INTAKE-01: the intake form's questions — a core set and one set for each of the 40 roles, in three
  // forms (./hastaFormu/). MACHINE-WRITTEN: no local clinician has read a single set. The consent sentence is a draft
  // no lawyer has read. The answers are never given to the model.
  hastaFormu: UZ_HASTA_FORMU,
}
