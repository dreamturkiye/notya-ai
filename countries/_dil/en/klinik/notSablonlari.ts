/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the NOTE TEMPLATE of each of the 40 roles. Which fields a note of
 * that role has beside the four shared sections, and what each field is called.
 *
 * MACHINE-BUILT. NO REVIEWER IN ANY COUNTRY. The templates were put together by a machine from general knowledge of
 * what a note of each specialty records. No clinician practising in any of the five countries has confirmed one
 * (docs/COUNTRY-PACK-CHECKLIST.md C12, C14, E4, E11). The field keys and the fields of each role are the product's
 * own shape, the same in every country build; the labels are written here in English from those keys.
 *
 * WHAT A FIELD IS. A labelled place for something that WAS SAID at the visit — nothing more. A field holds no
 * reference value, no normal range, no schedule, no score and no dose; several say so in their own label ("figures
 * as stated", "as the doctor said"). The model is told to leave a field empty when the visit did not contain it.
 *
 * NO CLINICAL REFERENCE CONTENT: no vaccination schedule, growth standard, drug list, dosing, national protocol,
 * scale or classification is in this file or anywhere in the set.
 *
 * LEAK RULE (.cursor/skills/brans-alan-sizmasi/SKILL.md). A field belongs to the roles that LIST it and to no other.
 * The decision is the kit's (lib/ulke/arayuz/notSablonu.ts → sablonAlanlari), read by the instruction to the model,
 * by the server's filter and by the screen. The general template has no role field. GUARDIAN WORDING FOLLOWS THE
 * PATIENT'S AGE in every role: the one field about who gave the history exists for a patient below the country's
 * guardian age (the pack's setting, a legal fact of the country) and never above it, paediatrics included.
 *
 * Written in en-GB spelling; `enNotSablonlari(form)` gives the data in a country's form of English.
 */
import type { NotAlani, NotBolumu, NotSablonVerisi } from '@/lib/ulke/arayuz/tipler'
import { enYaz, type EnBicim } from '../varyant'
import { EN_COCUK_ROLLERI, enCocukRolleri, enGibiRolleri, enRolSatirlari, type EnRol, type EnRolDegisimi } from './roller'

const a = (bolum: NotBolumu, ad: string): { bolum: NotBolumu; ad: string } => ({ bolum, ad })

/** Every role field there is, with its label in the base spelling. A field is nobody's until a role lists it below. */
export const EN_ALANLAR = {
  arrival_mode: a('s', 'How the patient arrived'),
  event_time: a('s', 'Time of the event or onset of symptoms'),
  consciousness: a('o', 'Level of consciousness'),
  vital_signs: a('o', 'Vital signs (figures as stated)'),
  emergency_actions: a('p', 'Emergency care given'),
  disposition: a('p', 'Where the patient goes next (home, observation, admission, referral)'),
  chronic_conditions: a('s', 'Long-term conditions'),
  regular_medicines: a('s', 'Regular medicines'),
  allergies: a('s', 'Allergies'),
  family_history: a('s', 'Family history'),
  lifestyle: a('s', 'Lifestyle (diet, activity, smoking, alcohol)'),
  referrals: a('p', 'Referrals'),
  planned_procedure: a('s', 'Planned procedure'),
  prior_anesthesia: a('s', 'Previous anaesthetics and how they went'),
  fasting: a('s', 'Time of last food and drink'),
  airway: a('o', 'Airway assessment'),
  anesthesia_plan: a('p', 'Anaesthetic plan'),
  neuro_status: a('o', 'Neurological examination'),
  imaging_findings: a('o', 'Imaging findings (as the doctor said)'),
  surgical_history: a('s', 'Previous operations'),
  surgery_plan: a('p', 'Decision and plan for surgery'),
  wound_status: a('o', 'Wound or operation site'),
  birth_history: a('s', 'Birth and newborn history'),
  weight_height: a('o', 'Weight and height (figures as stated)'),
  local_status: a('o', 'Local examination'),
  system_review: a('s', 'Review of systems'),
  lab_results: a('o', 'Laboratory results (as the doctor said)'),
  lesion_description: a('o', 'Description of the lesions'),
  lesion_location: a('o', 'Site and extent'),
  onset_course: a('s', 'Onset and course'),
  triggers: a('s', 'Triggers'),
  topical_treatment: a('p', 'Topical treatment'),
  glucose_values: a('o', 'Glucose values (figures as stated)'),
  hormone_results: a('o', 'Hormone test results (as the doctor said)'),
  weight_change: a('s', 'Change in weight'),
  thyroid_exam: a('o', 'Thyroid examination'),
  self_monitoring: a('s', 'Self-monitoring (diary)'),
  fever_course: a('s', 'Course of the fever'),
  exposure_history: a('s', 'Exposure history (contacts, travel, food, water)'),
  vaccination_said: a('s', 'Vaccination history (as reported)'),
  isolation_advice: a('p', 'Isolation and advice for contacts'),
  bowel_habits: a('s', 'Bowel habit and changes'),
  diet_relation: a('s', 'Relation to food'),
  abdominal_exam: a('o', 'Abdominal examination'),
  endoscopy_findings: a('o', 'Endoscopy findings (as the doctor said)'),
  diet_advice: a('p', 'Dietary advice'),
  consent_discussion: a('p', 'Risks discussed with the patient, and consent'),
  respiratory_exam: a('o', 'Respiratory examination'),
  smoking: a('s', 'Smoking'),
  drain_status: a('o', 'Drain'),
  cough_sputum: a('s', 'Cough and sputum'),
  dyspnea: a('s', 'Breathlessness'),
  spirometry: a('o', 'Spirometry results (figures as stated)'),
  inhaler_use: a('p', 'Inhaled treatment and inhaler technique'),
  visual_acuity: a('o', 'Visual acuity (right and left eye)'),
  eye_pressure: a('o', 'Intraocular pressure'),
  anterior_segment: a('o', 'Anterior segment'),
  fundus: a('o', 'Fundus'),
  glasses: a('p', 'Glasses or contact lens prescription'),
  eye_drops: a('p', 'Eye drops'),
  menstrual_history: a('s', 'Menstrual history'),
  obstetric_history: a('s', 'Obstetric history (pregnancies and births)'),
  current_pregnancy: a('s', 'Current pregnancy (gestation as stated)'),
  gyn_exam: a('o', 'Gynaecological examination'),
  ultrasound_findings: a('o', 'Ultrasound findings (as the doctor said)'),
  contraception: a('s', 'Contraception'),
  cardiac_exam: a('o', 'Cardiovascular examination'),
  peripheral_pulses: a('o', 'Peripheral pulses and limbs'),
  anticoagulation: a('p', 'Antithrombotic treatment (as the doctor said)'),
  chest_pain: a('s', 'Character of the chest pain'),
  effort_tolerance: a('s', 'Exercise tolerance'),
  risk_factors: a('s', 'Risk factors (as reported)'),
  blood_pressure_pulse: a('o', 'Blood pressure and pulse (figures as stated)'),
  ecg: a('o', 'ECG report (as the doctor said)'),
  echo: a('o', 'Echocardiogram report (as the doctor said)'),
  ear_exam: a('o', 'Ear examination'),
  nose_exam: a('o', 'Nose and sinus examination'),
  throat_exam: a('o', 'Throat and larynx examination'),
  hearing_complaint: a('s', 'Hearing and tinnitus'),
  hearing_test: a('o', 'Hearing test results (as the doctor said)'),
  procedures_done: a('p', 'Procedures carried out'),
  urine_changes: a('s', 'Passing urine and changes in the urine'),
  edema: a('o', 'Oedema'),
  kidney_labs: a('o', 'Kidney function results (figures as stated)'),
  dialysis: a('s', 'Dialysis (type, schedule)'),
  fluid_diet: a('p', 'Fluid and dietary advice'),
  headache: a('s', 'Character of the headache'),
  seizures: a('s', 'Seizures (description, frequency)'),
  gait_coordination: a('o', 'Gait and coordination'),
  tumor_site: a('a', 'Site and type of the tumour (as the doctor said)'),
  stage_said: a('a', 'Stage (if the doctor stated one)'),
  pathology: a('o', 'Pathology report (as the doctor said)'),
  prior_treatment: a('s', 'Treatment so far (surgery, chemotherapy, radiotherapy)'),
  general_condition: a('o', 'General condition and daily activity'),
  treatment_tolerance: a('s', 'How treatment is tolerated, and side effects'),
  injury_mechanism: a('s', 'Mechanism and time of the injury'),
  musculoskeletal_exam: a('o', 'Musculoskeletal examination'),
  range_of_motion: a('o', 'Range of movement'),
  immobilization: a('p', 'Immobilisation (cast, splint, brace)'),
  weight_bearing: a('p', 'Weight-bearing and movement advice'),
  feeding: a('s', 'Feeding'),
  sleep: a('s', 'Sleep'),
  development: a('s', 'Development (as reported)'),
  temperature: a('o', 'Body temperature'),
  head_circumference: a('o', 'Head circumference (figure as stated)'),
  patient_expectation: a('s', 'What the patient hopes for'),
  defect_description: a('o', 'Description of the defect or deformity'),
  photo_note: a('o', 'Photographs taken (note)'),
  mental_status: a('o', 'Mental state examination'),
  mood: a('s', 'Mood'),
  risk_statements: a('s', 'What was said about harm to self or others'),
  substance_use: a('s', 'Alcohol and other substances'),
  psychiatric_history: a('s', 'Psychiatric history and treatment'),
  social_context: a('s', 'Family and work'),
  study_type: a('s', 'Type and region of the examination'),
  clinical_question: a('s', 'Reason for the request (clinical question)'),
  technique: a('o', 'Technique and contrast'),
  findings: a('o', 'Findings'),
  comparison: a('o', 'Comparison with earlier examinations'),
  conclusion: a('a', 'Conclusion of the report'),
  joint_complaints: a('s', 'Joint pain and stiffness'),
  morning_stiffness: a('s', 'Duration of morning stiffness'),
  joint_exam: a('o', 'Joint examination (tender and swollen joints)'),
  extra_articular: a('s', 'Features outside the joints'),
  urinary_symptoms: a('s', 'Urinary symptoms'),
  urologic_exam: a('o', 'Urological examination'),
  sexual_function: a('s', 'Sexual function concerns'),
  sport_activity: a('s', 'Sport and training load'),
  functional_tests: a('o', 'Functional tests'),
  return_to_sport: a('p', 'Plan for return to training'),
  functional_status: a('s', 'Limits in daily activities'),
  pain_description: a('s', 'Character of the pain (site, intensity)'),
  muscle_strength: a('o', 'Muscle strength'),
  rehab_program: a('p', 'Rehabilitation programme (treatments, exercises, number of sessions)'),
  rehab_goals: a('p', 'Rehabilitation goals'),
  hair_loss_history: a('s', 'History of hair loss'),
  scalp_exam: a('o', 'Scalp and hair examination'),
  donor_area: a('o', 'Assessment of the donor area'),
  graft_plan: a('p', 'Planned method and number of grafts (as the doctor said)'),
  aftercare: a('p', 'Aftercare'),
  aesthetic_assessment: a('o', 'Aesthetic assessment (area, proportions)'),
  skin_assessment: a('o', 'Skin assessment'),
  prior_aesthetic: a('s', 'Previous cosmetic procedures'),
  procedure_record: a('p', 'Procedure carried out (product, area, amount — as the doctor said)'),
  skin_care: a('p', 'Skin care advice'),
  body_composition: a('o', 'Body composition and measurements (figures as stated)'),
  supplements: a('s', 'Supplements taken'),
  prevention_plan: a('p', 'Prevention plan'),
  referral_diagnosis: a('s', 'Referring doctor and referral diagnosis'),
  session_content: a('p', 'What was done in the session'),
  home_program: a('p', 'Home exercise programme'),
  session_themes: a('s', 'Themes raised in the session'),
  observed_behavior: a('o', 'Observations in the session'),
  interventions: a('p', 'Methods used'),
  homework: a('p', 'Tasks until the next session'),
  diet_history: a('s', 'Eating pattern and habits'),
  food_intolerances: a('s', 'Foods not tolerated, and restrictions'),
  nutrition_plan: a('p', 'Nutrition plan (as the dietitian said)'),
  nutrition_goals: a('p', 'Nutrition goals'),
  daily_activities: a('o', 'Assessment of daily living skills'),
  hand_function: a('o', 'Hand function and fine motor skills'),
  environment: a('s', 'Home and work environment'),
  assistive_devices: a('p', 'Aids and adaptations'),
  noise_exposure: a('s', 'Noise exposure (work, home)'),
  audiometry: a('o', 'Audiometry results (figures as stated)'),
  tympanometry: a('o', 'Tympanometry results (as the audiologist said)'),
  hearing_aid: a('p', 'Hearing aid (selection, fitting)'),
  balance_complaint: a('s', 'Dizziness and balance'),
} as const satisfies Readonly<Record<string, { bolum: NotBolumu; ad: string }>>

export type EnAlan = keyof typeof EN_ALANLAR

/** The fields of each role's note, in the order they are asked for and shown. All 40 roles are written out: there is no default. */
export const EN_ROL_ALANLARI: Readonly<Record<EnRol, readonly EnAlan[]>> = {
  'emergency-medicine': ['arrival_mode', 'event_time', 'consciousness', 'vital_signs', 'emergency_actions', 'disposition'],
  'family-medicine': ['chronic_conditions', 'regular_medicines', 'family_history', 'lifestyle', 'vital_signs', 'referrals'],
  anaesthesia: ['planned_procedure', 'prior_anesthesia', 'regular_medicines', 'allergies', 'fasting', 'airway', 'vital_signs', 'anesthesia_plan'],
  neurosurgery: ['surgical_history', 'neuro_status', 'imaging_findings', 'wound_status', 'surgery_plan', 'consent_discussion'],
  'paediatric-surgery': ['birth_history', 'surgical_history', 'weight_height', 'local_status', 'abdominal_exam', 'surgery_plan', 'consent_discussion'],
  'internal-medicine': ['chronic_conditions', 'regular_medicines', 'system_review', 'vital_signs', 'lab_results'],
  dermatology: ['onset_course', 'triggers', 'lesion_description', 'lesion_location', 'topical_treatment'],
  endocrinology: ['weight_change', 'self_monitoring', 'regular_medicines', 'thyroid_exam', 'glucose_values', 'hormone_results'],
  'infectious-diseases': ['fever_course', 'exposure_history', 'vaccination_said', 'lab_results', 'isolation_advice'],
  gastroenterology: ['bowel_habits', 'diet_relation', 'abdominal_exam', 'endoscopy_findings', 'lab_results', 'diet_advice'],
  'general-surgery': ['surgical_history', 'local_status', 'abdominal_exam', 'wound_status', 'surgery_plan', 'consent_discussion'],
  'thoracic-surgery': ['smoking', 'surgical_history', 'respiratory_exam', 'imaging_findings', 'drain_status', 'surgery_plan', 'consent_discussion'],
  'respiratory-medicine': ['cough_sputum', 'dyspnea', 'smoking', 'respiratory_exam', 'spirometry', 'imaging_findings', 'inhaler_use'],
  ophthalmology: ['visual_acuity', 'eye_pressure', 'anterior_segment', 'fundus', 'glasses', 'eye_drops'],
  'obstetrics-gynaecology': ['menstrual_history', 'obstetric_history', 'current_pregnancy', 'contraception', 'gyn_exam', 'ultrasound_findings'],
  'cardiovascular-surgery': ['surgical_history', 'cardiac_exam', 'peripheral_pulses', 'imaging_findings', 'surgery_plan', 'anticoagulation', 'consent_discussion'],
  cardiology: ['chest_pain', 'effort_tolerance', 'risk_factors', 'regular_medicines', 'blood_pressure_pulse', 'cardiac_exam', 'ecg', 'echo'],
  otolaryngology: ['hearing_complaint', 'ear_exam', 'nose_exam', 'throat_exam', 'hearing_test', 'procedures_done'],
  nephrology: ['urine_changes', 'dialysis', 'edema', 'blood_pressure_pulse', 'kidney_labs', 'fluid_diet'],
  neurology: ['onset_course', 'headache', 'seizures', 'neuro_status', 'gait_coordination', 'imaging_findings'],
  oncology: ['prior_treatment', 'treatment_tolerance', 'general_condition', 'pathology', 'imaging_findings', 'tumor_site', 'stage_said'],
  orthopaedics: ['injury_mechanism', 'musculoskeletal_exam', 'range_of_motion', 'imaging_findings', 'immobilization', 'weight_bearing', 'surgery_plan'],
  paediatrics: ['birth_history', 'feeding', 'sleep', 'development', 'vaccination_said', 'weight_height', 'head_circumference', 'temperature'],
  'plastic-surgery': ['patient_expectation', 'surgical_history', 'local_status', 'defect_description', 'photo_note', 'wound_status', 'surgery_plan', 'consent_discussion'],
  psychiatry: ['mood', 'sleep', 'substance_use', 'psychiatric_history', 'social_context', 'risk_statements', 'mental_status'],
  radiology: ['study_type', 'clinical_question', 'technique', 'findings', 'comparison', 'conclusion'],
  rheumatology: ['joint_complaints', 'morning_stiffness', 'extra_articular', 'regular_medicines', 'joint_exam', 'lab_results'],
  urology: ['urinary_symptoms', 'urine_changes', 'sexual_function', 'urologic_exam', 'ultrasound_findings', 'lab_results', 'procedures_done'],
  'sports-medicine': ['sport_activity', 'injury_mechanism', 'musculoskeletal_exam', 'functional_tests', 'weight_bearing', 'return_to_sport'],
  'rehabilitation-medicine': ['functional_status', 'pain_description', 'musculoskeletal_exam', 'range_of_motion', 'muscle_strength', 'rehab_program', 'rehab_goals'],
  'hair-transplant': ['hair_loss_history', 'patient_expectation', 'scalp_exam', 'donor_area', 'graft_plan', 'consent_discussion', 'aftercare'],
  'aesthetic-surgery': ['patient_expectation', 'surgical_history', 'aesthetic_assessment', 'photo_note', 'surgery_plan', 'consent_discussion', 'aftercare'],
  'aesthetic-medicine': ['patient_expectation', 'prior_aesthetic', 'allergies', 'skin_assessment', 'photo_note', 'procedure_record', 'consent_discussion', 'aftercare'],
  'clinic-dermatology': ['onset_course', 'lesion_description', 'lesion_location', 'skin_assessment', 'photo_note', 'procedure_record', 'skin_care'],
  longevity: ['lifestyle', 'sleep', 'family_history', 'supplements', 'body_composition', 'lab_results', 'prevention_plan'],
  physiotherapy: ['referral_diagnosis', 'functional_status', 'pain_description', 'range_of_motion', 'muscle_strength', 'session_content', 'home_program'],
  'clinical-psychology': ['session_themes', 'mood', 'social_context', 'risk_statements', 'observed_behavior', 'interventions', 'homework'],
  dietetics: ['referral_diagnosis', 'diet_history', 'food_intolerances', 'weight_change', 'weight_height', 'body_composition', 'nutrition_plan', 'nutrition_goals'],
  'occupational-therapy': ['referral_diagnosis', 'functional_status', 'environment', 'daily_activities', 'hand_function', 'session_content', 'assistive_devices', 'rehab_goals'],
  audiology: ['referral_diagnosis', 'hearing_complaint', 'noise_exposure', 'balance_complaint', 'audiometry', 'tympanometry', 'hearing_aid'],
}

/** The neutral template: the four shared sections and no role field. Stored with every note written with it. */
export const EN_GENEL_SABLON = 'general'

/** The one field that depends on the patient's AGE and on nothing else: who gave the history. */
export const EN_VELI_ALANI = 'history_giver'
const VELI_ALANI_ADI = 'Who gave the history (parent or guardian)'

/** An allied professional's note has "the professional's own assessment" where a doctor's has "assessment". */
const MUTTEFIK_DEGERLENDIRMESI = 'Professional assessment'

/**
 * The templates as the DATA the country kit reads, in a country's form of English.
 *
 * `degisim` (NOTYA-ULKE-OZEL-01) = where this country's role list differs from the shared forty. The templates then
 * hold: every shared role the country keeps; every shared role one of its own roles BEHAVES LIKE (also where that
 * role itself was taken out — the kit finds the template through `RolTanimi.gibi`); and, under the role's own key, the
 * fields a role of the country's own brings. A country that states no difference gets exactly the forty.
 */
export function enNotSablonlari(bicim: EnBicim, degisim?: EnRolDegisimi): NotSablonVerisi {
  const alanlar: Record<string, NotAlani> = {}
  for (const [k, v] of Object.entries(EN_ALANLAR)) alanlar[k] = { bolum: v.bolum, ad: { [bicim]: enYaz(v.ad, bicim) } }
  const satirlar = enRolSatirlari(degisim)
  const kendi = satirlar.some((r) => r.ek) || satirlar.length !== Object.keys(EN_ROL_ALANLARI).length
  let rolAlanlari: Readonly<Record<string, readonly string[]>> = EN_ROL_ALANLARI
  if (kendi) {
    // A field only this country has is named as the country wrote it; it never replaces a field of the set.
    for (const [k, v] of Object.entries(degisim?.alanlar ?? {})) if (!(k in alanlar)) alanlar[k] = { bolum: v.bolum, ad: { [bicim]: v.ad } }
    const tutulan = new Set<string>([...satirlar.filter((r) => !r.ek).map((r) => r.anahtar), ...enGibiRolleri(degisim)])
    const yeni: Record<string, readonly string[]> = {}
    for (const [rol, liste] of Object.entries(EN_ROL_ALANLARI)) if (tutulan.has(rol)) yeni[rol] = liste
    for (const r of satirlar) if (r.ek?.sablon) yeni[r.anahtar] = r.ek.sablon
    rolAlanlari = yeni
  }
  return {
    genelSablon: EN_GENEL_SABLON,
    alanlar,
    rolAlanlari,
    veliAlani: { anahtar: EN_VELI_ALANI, tanim: { bolum: 's', ad: { [bicim]: enYaz(VELI_ALANI_ADI, bicim) } } },
    cocukRolleri: kendi ? enCocukRolleri(degisim) : EN_COCUK_ROLLERI,
    bolumBasliklari: [{ taraf: 'klinik-muttefik', bolum: 'a', ad: { [bicim]: enYaz(MUTTEFIK_DEGERLENDIRMESI, bicim) } }],
  }
}
