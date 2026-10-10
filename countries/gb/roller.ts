/**
 * NOTYA-ULKE-UYGULA (gb) — United Kingdom: WHERE THIS COUNTRY'S ROLE LIST DIFFERS FROM THE SHARED FORTY, and the names
 * it gives to shared roles. Applied from the audited decisions (docs/araclar-denetim/gb-kararlar.json, `specialties`
 * and `clinicSpecialties`; docs/araclar-denetim/GB.md, Part 3).
 *
 * Plain data, type-only imports: the pack's light file (./index.ts) reads it, and so do both halves (./ayarlar.ts).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED. Nobody of the United Kingdom has confirmed a line. The NAMES are the regulators',
 * opened on 2026-10-10; WHICH SHARED ROLE EACH ADDED ROLE BEHAVES LIKE (`gibi`) is this job's own choice of the
 * nearest role and is for a local clinical lead.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * SOURCES, each opened on 2026-10-10:
 *   [GMC]  General Medical Council, "GMC approved postgraduate curricula" (65 specialties, 30 sub-specialties),
 *          https://www.gmc-uk.org/education/standards-guidance-and-curricula/curricula — every doctor specialty name
 *          below is written exactly as that list writes it.
 *   [HCPC] Health and Care Professions Council, "The professions" (professions and protected titles),
 *          https://www.hcpc-uk.org/about-us/who-we-regulate/the-professions/ — "Podiatrist" and "Speech and language
 *          therapist" are protected titles on that page.
 *
 * RENAMED (the key stays, so every stored account keeps loading):
 *   internal-medicine       General (internal) medicine          [GMC]
 *   endocrinology           Endocrinology and diabetes mellitus  [GMC]
 *   thoracic-surgery        Cardio-thoracic surgery              [GMC]  heart and chest surgery are ONE specialty here
 *   cardiovascular-surgery  Vascular surgery                     [GMC]  "cardiac and vascular surgery" is no specialty
 *                                                                       here; heart operations sit in the role above
 *   otolaryngology          Otolaryngology                       [GMC]  (the everyday "ENT" is not in the official name)
 *   oncology                Medical oncology                     [GMC]  the second specialty, Clinical oncology, is added
 *   orthopaedics            Trauma and orthopaedic surgery       [GMC]
 *   psychiatry              General psychiatry                   [GMC]  two more psychiatric specialties are added
 * NAMED BEFORE AND KEPT: General practice, Anaesthetics, Renal medicine, Clinical radiology (all on [GMC]).
 * KEPT AS THE SET WRITES IT: Gastroenterology ([GMC] writes "Gastro-enterology"; the decisions keep the unhyphenated form).
 *
 * ADDED: twelve specialties of [GMC] and two professions of [HCPC]. Each says which shared role it BEHAVES LIKE: it
 * writes its notes with that role's template and asks that role's intake questions, under its own name and key.
 * Three bring a field list of their own (built from fields the set already has) because the nearest role's template
 * holds a field that is plainly another specialty's (an abdominal examination, a nose and throat examination, hand
 * function): a field of one specialty must never show for another.
 *
 * REMOVED: clinic-dermatology ("Dermatology (clinic)"): the same recognised specialty offered twice. The one
 * "Dermatology" role serves the doctor in a hospital and in a clinic. See GB_KALDIRILAN_ROLLER.
 * NOT DECIDED BY THE AUDIT AND LEFT AS IT IS: longevity ("Preventive and longevity medicine"), verdict "unverified".
 */
import type { EnRol, EnRolDegisimi } from '../_dil/en/klinik/roller'

/** The names this country gives to SHARED roles, in the regulator's wording. */
export const GB_ROL_ADLARI: Readonly<Partial<Record<EnRol, string>>> = {
  'family-medicine': 'General practice',
  anaesthesia: 'Anaesthetics',
  'internal-medicine': 'General (internal) medicine',
  endocrinology: 'Endocrinology and diabetes mellitus',
  'thoracic-surgery': 'Cardio-thoracic surgery',
  'cardiovascular-surgery': 'Vascular surgery',
  otolaryngology: 'Otolaryngology',
  nephrology: 'Renal medicine',
  oncology: 'Medical oncology',
  orthopaedics: 'Trauma and orthopaedic surgery',
  psychiatry: 'General psychiatry',
  radiology: 'Clinical radiology',
}

/** WHERE THE ROLE LIST DIFFERS FROM THE SHARED FORTY. */
export const GB_ROLLER: EnRolDegisimi = {
  cikar: ['clinic-dermatology'],
  ekle: [
    // ── twelve specialties of the regulator's list that the shared forty do not have ──
    { anahtar: 'geriatric-medicine', taraf: 'doktor', ad: 'Geriatric medicine', gibi: 'internal-medicine' },
    { anahtar: 'haematology', taraf: 'doktor', ad: 'Haematology', gibi: 'internal-medicine' },
    // the second half of oncology (the shared role is now "Medical oncology"): it stands right after it
    { anahtar: 'clinical-oncology', taraf: 'doktor', ad: 'Clinical oncology', gibi: 'oncology', once: 'orthopaedics' },
    { anahtar: 'allergy', taraf: 'doktor', ad: 'Allergy', gibi: 'internal-medicine' },
    { anahtar: 'genito-urinary-medicine', taraf: 'doktor', ad: 'Genito-urinary medicine', gibi: 'infectious-diseases' },
    { anahtar: 'community-sexual-reproductive-health', taraf: 'doktor', ad: 'Community sexual and reproductive health', gibi: 'obstetrics-gynaecology' },
    { anahtar: 'occupational-medicine', taraf: 'doktor', ad: 'Occupational medicine', gibi: 'internal-medicine' },
    // its patients are children and young people: an unknown age counts as below the guardian age, as in paediatrics
    { anahtar: 'child-adolescent-psychiatry', taraf: 'doktor', ad: 'Child and adolescent psychiatry', gibi: 'psychiatry', cocuk: true },
    { anahtar: 'old-age-psychiatry', taraf: 'doktor', ad: 'Old age psychiatry', gibi: 'psychiatry' },
    // the general surgeon's questions; its own field list: that role's without the abdominal examination, with imaging
    { anahtar: 'oral-maxillofacial-surgery', taraf: 'doktor', ad: 'Oral and maxillo-facial surgery', gibi: 'general-surgery', sablon: ['surgical_history', 'local_status', 'imaging_findings', 'wound_status', 'surgery_plan', 'consent_discussion'] },
    { anahtar: 'palliative-medicine', taraf: 'doktor', ad: 'Palliative medicine', gibi: 'internal-medicine' },
    // hearing and balance: the questions "About hearing"; its own field list, with an ear examination and without the nose and throat
    { anahtar: 'audio-vestibular-medicine', taraf: 'doktor', ad: 'Audio vestibular medicine', gibi: 'audiology', sablon: ['hearing_complaint', 'balance_complaint', 'noise_exposure', 'ear_exam', 'audiometry', 'tympanometry', 'hearing_aid'] },
    // ── two allied professions with a protected title ──
    { anahtar: 'podiatry', taraf: 'klinik-muttefik', ad: 'Podiatrist', gibi: 'physiotherapy' },
    // the occupational therapist's questions; its own field list: that role's without hand function, the home and the aids
    { anahtar: 'speech-language-therapy', taraf: 'klinik-muttefik', ad: 'Speech and language therapist', gibi: 'occupational-therapy', sablon: ['referral_diagnosis', 'functional_status', 'session_content', 'home_program', 'rehab_goals'] },
  ],
}

/**
 * A ROLE THIS COUNTRY TOOK OUT → THE NEAREST ROLE IT STILL HAS. For a stored account that still holds the old key.
 *
 * WHAT HAPPENS TODAY (the kit's rule, lib/ulke/uygulama/rol.ts): a stored key that is not on the pack's list reads as
 * "no role chosen". The account signs in and loads; it is asked for its role once more, and "Dermatology" is on the
 * list. Nothing is lost and nothing is changed in the database. THE KIT HAS NO PLACE WHERE A PACK CAN SAY "this old
 * key now reads as that role", so this table is the country's statement of the answer and is read by its tests only;
 * the day the kit reads such a table, or a one-line data correction is run on this country's database, the account
 * moves without being asked. Until then a note written under the old key keeps its four sections, and its role fields
 * are not drawn (lib/ulke/arayuz/notSablonu.ts → sablonMu).
 */
export const GB_KALDIRILAN_ROLLER: Readonly<Record<string, string>> = { 'clinic-dermatology': 'dermatology' }
