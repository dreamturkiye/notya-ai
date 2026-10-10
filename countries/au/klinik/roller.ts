/**
 * NOTYA-ULKE-UYGULA-AU — Australia: ITS OWN ROLE LIST, complete. The light list (./rolListesi.ts: keys, kinds, names,
 * the shared role each behaves like) with what a role of Australia's own brings beside it: the fields of its note,
 * and the questions of its intake form.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNREAD. No clinician of Australia has read a field list or a question below, and the questions
 * are PATIENT-FACING. Nothing here is new clinical wording: every question, option and field is one the shared English
 * set already asks of the role named beside it (countries/_dil/en/klinik/), put under the Australian role's own key
 * and heading. What IS new is each heading, and which questions were taken for which role: for a local clinician.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * WHY A ROLE BRINGS QUESTIONS OF ITS OWN. A role that only "behaves like" a shared role asks that role's questions
 * under that role's heading, and the heading names the specialty to the PATIENT ("Before physiotherapy" on a
 * podiatrist's form). So every new role whose patients would read another specialty's name brings its own heading,
 * with the same questions under keys of its own (every question key is unique in the pack). "Radiation oncology"
 * brings none: the heading of the role it behaves like ("For the oncologist") is true of it.
 *
 * THE SPLIT (the Medical Board's "Cardio-thoracic surgery" and "Vascular surgery"):
 *   cardio-thoracic-surgery   the fields of the shared chest-surgery note, with the two fields heart surgery had in
 *                             the shared "Cardiac and vascular surgery" note (cardiovascular examination;
 *                             antithrombotic treatment); the chest questions with the heart questions.
 *   vascular-surgery          the shared "Cardiac and vascular surgery" note as it is (its fields are cardiovascular
 *                             examination, peripheral pulses and limbs, imaging, plan, antithrombotic treatment,
 *                             consent); the blood-vessel questions of that role's form, without its chest symptoms.
 */
import type { EnEkRol, EnRolDegisimi } from '../../_dil/en/klinik/roller'
import { cok, DEGERLER, eh, HICBIRI, ILAC_ADI, KIMDE, kisa, NE, NE_ZAMAN, PUAN, s, sayi, tek, TETKIK, uzun, type HamRol } from '../../_dil/en/klinik/hastaFormu/yardimci'
import { AU_CIKAN_ROLLER, AU_EK_ROLLER, type AuEkRolAnahtari } from './rolListesi'

/** NOTE FIELDS a role brings itself: keys of the shared set's fields (countries/_dil/en/klinik/notSablonlari.ts → EN_ALANLAR). No field is new. */
const SABLONLAR: Readonly<Partial<Record<AuEkRolAnahtari, readonly string[]>>> = {
  // the shared chest-surgery fields, with `cardiac_exam` and `anticoagulation` from the shared heart-and-vessel note
  'cardio-thoracic-surgery': ['smoking', 'surgical_history', 'cardiac_exam', 'respiratory_exam', 'imaging_findings', 'drain_status', 'anticoagulation', 'surgery_plan', 'consent_discussion'],
  // the fields the allied professions share, without the ones that belong to occupational therapy alone (hand function, the home environment)
  'speech-pathology': ['referral_diagnosis', 'functional_status', 'session_content', 'rehab_goals'],
}

/** The five questions the shared set asks for its general-medicine role, under a key prefix of the role's own. */
const genelDahiliye = (o: string, baslik: string): HamRol => ({
  baslik,
  sorular: [
    cok(`${o}_symptoms`, 'Which of these trouble you?', [s('tired', 'Tiredness'), s('fever', 'Fever'), s('night_sweats', 'Night sweats'), s('appetite', 'Poor appetite'), s('dizziness', 'Dizziness'), s('joints', 'Joint pain'), HICBIRI()]),
    tek(`${o}_weight`, 'Has the weight changed without a reason in the last few months?', [s('no', 'No'), s('down', 'It has gone down'), s('up', 'It has gone up')]),
    eh(`${o}_followup`, 'Is a doctor following a long-term condition?', 'Which condition, and when was the last visit?'),
    kisa(`${o}_blood_test`, 'When was the last blood test?'),
    eh(`${o}_bp_home`, 'Is blood pressure measured at home?', DEGERLER),
  ],
})

/** INTAKE QUESTIONS a role brings itself. Written like the set's (base spelling; the pack's form of English is applied when the pack loads). */
const FORMLAR: Readonly<Partial<Record<AuEkRolAnahtari, HamRol>>> = {
  'cardio-thoracic-surgery': {
    baslik: 'For the heart and chest surgeon',
    sorular: [
      cok('cts_symptoms', 'Which of these trouble you?', [s('pain', 'Chest pain'), s('breathless', 'Shortness of breath'), s('cough', 'Cough'), s('blood', 'Blood in the phlegm'), s('rhythm', 'An irregular heartbeat'), s('swelling', 'Swollen legs'), s('weight', 'Weight loss'), HICBIRI()]),
      eh('cts_operation', 'Has there been an operation or procedure on the heart, the lungs or the chest?', NE_ZAMAN),
      eh('cts_imaging', 'Has there been a chest X-ray or CT scan?', TETKIK),
      eh('cts_tests', 'Have the heart or blood vessels been examined with tests?', TETKIK),
      eh('cts_breathing_test', 'Has there been a breathing test (spirometry)?'),
      eh('cts_blood_thinner', 'Are any blood-thinning medicines taken?', ILAC_ADI),
      kisa('cts_smoking', 'If you have smoked: for how many years, and about how much a day?', { kime: 'yetiskin' }),
    ],
  },
  'vascular-surgery': {
    baslik: 'For the vascular surgeon',
    sorular: [
      cok('vas_symptoms', 'Which of these trouble you?', [s('leg_pain', 'Leg pain when walking'), s('swelling', 'Swollen legs'), s('veins', 'Enlarged veins'), HICBIRI()]),
      eh('vas_operation', 'Has there been an operation or procedure on the heart or blood vessels?', NE_ZAMAN),
      eh('vas_tests', 'Have the heart or blood vessels been examined with tests?', TETKIK),
      eh('vas_blood_thinner', 'Are any blood-thinning medicines taken?', ILAC_ADI),
      eh('vas_family', 'Are there heart or blood vessel conditions in the family?', KIMDE),
    ],
  },
  'geriatric-medicine': genelDahiliye('ger', 'For the geriatric medicine doctor'),
  'immunology-and-allergy': genelDahiliye('imm', 'For the immunology and allergy doctor'),
  haematology: genelDahiliye('hae', 'For the haematologist'),
  'pain-medicine': {
    baslik: 'For the pain medicine doctor',
    sorular: [
      kisa('pnm_where', 'In which part of the body is the pain or the limitation?'),
      sayi('pnm_pain', 'How strong is the pain? (0 = no pain, 10 = unbearable)', PUAN, 0, 10),
      tek('pnm_limits', 'How much does the problem limit daily activities?', [s('none', 'It does not'), s('a_little', 'A little'), s('a_lot', 'A lot'), s('fully', 'Daily activities are not possible')]),
      eh('pnm_diagnosis', 'Is there a diagnosis made by a doctor?', NE),
      eh('pnm_before', 'Has there been physiotherapy (physical therapy) or rehabilitation before?', NE_ZAMAN),
      kisa('pnm_aids', 'Aids used (a brace, a prosthesis, a cane or walking stick, or other)'),
    ],
  },
  podiatry: {
    baslik: 'Before podiatry',
    sorular: [
      kisa('pod_where', 'In which part of the body is the pain or the limitation?'),
      sayi('pod_pain', 'How strong is the pain? (0 = no pain, 10 = unbearable)', PUAN, 0, 10),
      tek('pod_limits', 'How much does the problem limit daily activities?', [s('none', 'It does not'), s('a_little', 'A little'), s('a_lot', 'A lot')]),
      eh('pod_referral', 'Is there a referral from a doctor?', 'Which diagnosis does the referral name?'),
      eh('pod_results', 'Do you have test results with you?', 'Which tests?'),
      kisa('pod_aids', 'Aids used (a brace, a prosthesis, a cane or walking stick, or other)'),
    ],
  },
  'speech-pathology': {
    baslik: 'Before speech pathology',
    sorular: [
      uzun('spp_diagnosis', 'If there is a diagnosis made by a doctor, write it'),
      eh('spp_referral', 'Is there a referral from a doctor?', 'Which diagnosis does the referral name?'),
      eh('spp_help', 'Has there been rehabilitation or special support before?', NE),
      kisa('spp_occupation', 'Study or work (where, what kind)'),
    ],
  },
}

/** WHERE AUSTRALIA'S ROLE LIST DIFFERS FROM THE SHARED FORTY: what both halves of the pack and its tools are handed. */
export const AU_ROLLER: EnRolDegisimi = {
  cikar: AU_CIKAN_ROLLER,
  ekle: AU_EK_ROLLER.map((r): EnEkRol => ({ ...r, ...(SABLONLAR[r.anahtar] ? { sablon: SABLONLAR[r.anahtar] } : {}), ...(FORMLAR[r.anahtar] ? { form: FORMLAR[r.anahtar] } : {}) })),
}

/** The roles only Australia has that bring intake questions of their own. */
export const AU_KENDI_FORMLU_ROLLER: readonly string[] = Object.keys(FORMLAR)
