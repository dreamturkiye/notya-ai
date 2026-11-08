/**
 * ULKE-BRANS-DERINLIK-2026-11 — THE ENGLISH LANGUAGE SET: OWN CONTENT FOR THE ROLES ONLY ONE COUNTRY HAS.
 *
 * Before this file, a role that only one country offers (a US sleep physician, a UK genito-urinary physician, a New
 * Zealand podiatrist) wrote its notes with the template of the shared role it "behaves like" (`gibi`) and asked that
 * role's intake questions: an allergist's note had an internist's fields, a podiatrist's patient answered a
 * physiotherapist's questions. The audit of 2026-11-08 (docs/ULKE-BRANS-DERINLIK-DENETIMI-2026-11.md on main) scored
 * every such role Missing: no content of its own. This file gives each KIND of such role its own note fields and its
 * own intake questions, so that a country names, for each of its own roles, the kind it is — on the role's own terms,
 * not mapped loosely to a Turkish branş or to another shared role.
 *
 * SAME RULES AS THE REST OF THE SET (./notSablonlari.ts, ./hastaFormu/): a note field is a labelled place for what WAS
 * SAID at the visit — no reference value, normal range, schedule, score, dose or classification; the model leaves a
 * field empty when the visit did not contain it. An intake question asks the patient what they know, in plain words.
 * No guideline, body or country is named here: these words are shown in five countries, and a country's own sources
 * live in its own folder. Written in en-GB spelling with words that are spelled the same in every form of English the
 * set serves (no "programme", "haematology", "apnoea"), so no form needs a conversion.
 *
 * LEAK RULE (.cursor/skills/brans-alan-sizmasi/SKILL.md): a field or a question belongs to the roles that list it.
 * Question keys carry the role's own prefix (every key is unique in a pack). Guardian wording follows the patient's
 * age, as everywhere in the set (the kit adds the history-giver field below the country's guardian age).
 *
 * MACHINE-WRITTEN. No clinician of any country has read these fields or questions (OPEN-COMMITMENTS
 * ULKE-BRANS-KLINISYEN-01): each waits on a practising clinician of that specialty in that country before marketing.
 */
import type { NotBolumu } from '@/lib/ulke/arayuz/tipler'
import { enYaz, type EnBicim } from '../varyant'
import { EVET_HAYIR_BILMIYORUM, HICBIRI, HANGILERI, NE, NE_ZAMAN, TETKIK, cok, eh, kisa, s, tek, uzun, type HamRol, type HamSoru } from './hastaFormu/yardimci'
import type { EN_ALANLAR } from './notSablonlari'
import type { EnEkRol, EnRolDegisimi } from './roller'

const a = (bolum: NotBolumu, ad: string): { bolum: NotBolumu; ad: string } => ({ bolum, ad })

/** Note fields the shared set does not have, used only by the kinds below. Base spelling; keys never clash with the set's. */
export const EN_EK_ALANLAR = {
  reaction_history: a('s', 'Reactions: trigger, timing and what happened (as described)'),
  suspected_triggers: a('s', 'Suspected triggers and exposure'),
  allergy_tests: a('o', 'Allergy test results (as the doctor said)'),
  emergency_plan: a('p', 'Emergency medicine and action plan discussed'),
  daily_living: a('s', 'Daily living and independence'),
  falls_mobility: a('s', 'Falls and walking'),
  memory_thinking: a('o', 'Memory and thinking (as observed or reported)'),
  medicines_review: a('p', 'Medicines reviewed and changes agreed (as said)'),
  carer_support: a('s', 'Carer and support at home'),
  future_care_wishes: a('p', 'Wishes for future care (if discussed)'),
  pain_history: a('s', 'Pain: site, onset, character and what changes it'),
  pain_impact: a('s', 'Pain score and effect on daily life (as stated)'),
  pain_medicines: a('s', 'Pain medicines tried and taken now (as said)'),
  pain_plan: a('p', 'Pain management plan'),
  sleep_pattern: a('s', 'Sleep pattern: bedtime, waking, naps'),
  daytime_sleepiness: a('s', 'Daytime sleepiness and its effect'),
  snoring_pauses: a('s', 'Snoring or pauses in breathing reported'),
  sleep_study: a('o', 'Sleep study findings (as the doctor said)'),
  sleep_treatment: a('p', 'Treatment or device and how it is used (as reported)'),
  continence: a('s', 'Bowel control and leakage'),
  rectal_bleeding: a('s', 'Rectal bleeding (as described)'),
  anorectal_exam: a('o', 'Anorectal examination'),
  stoma: a('o', 'Stoma (if present)'),
  radiotherapy_course: a('s', 'Radiotherapy: area treated and course as stated'),
  radiotherapy_effects: a('s', 'Side effects during or after radiotherapy (as described)'),
  treated_skin: a('o', 'Skin in the treated area'),
  school_learning: a('s', 'School, learning and friendships'),
  family_home: a('s', 'Family and home situation'),
  substance_history: a('s', 'Substances: which, how much, how often, last use (as said)'),
  withdrawal: a('s', 'Withdrawal symptoms reported'),
  support_programme_said: a('p', 'Treatment or support arranged'),
  harm_reduction: a('p', 'Harm reduction discussed'),
  symptom_burden: a('s', 'Symptoms and how troublesome they are'),
  goals_of_care: a('p', 'Goals of care discussed'),
  fertility_history: a('s', 'Time trying to conceive and earlier fertility care'),
  partner_history: a('s', 'Partner history and tests (as said)'),
  fertility_tests: a('o', 'Fertility test results (as the doctor said)'),
  treatment_cycle: a('p', 'Treatment cycle and stage (as said)'),
  social_needs: a('s', 'Needs: housing, money, work, care'),
  support_network: a('s', 'Support network and services involved'),
  safeguarding: a('s', 'Safety or safeguarding concerns raised (as said)'),
  blood_results: a('o', 'Blood count and other blood results (as the doctor said)'),
  bleeding_clotting: a('s', 'Bleeding or clotting history'),
  transfusions: a('s', 'Transfusions (as said)'),
  sexual_history: a('s', 'Sexual history (as given)'),
  sti_symptoms: a('s', 'Symptoms'),
  sti_tests: a('o', 'Tests taken and results (as said)'),
  partner_notification: a('p', 'Partner notification discussed'),
  prevention_said: a('p', 'Prevention discussed (as said)'),
  method_chosen: a('p', 'Method chosen and instructions given'),
  work_role: a('s', 'Job and work tasks'),
  work_exposure: a('s', 'Exposures at work'),
  work_fitness: a('p', 'Fitness for work and adjustments discussed'),
  work_absence: a('s', 'Time off work (as said)'),
  foot_complaint: a('s', 'Foot or lower-limb complaint'),
  foot_exam: a('o', 'Foot examination: skin, nails, shape'),
  circulation_sensation: a('o', 'Circulation and feeling in the feet (as tested)'),
  footwear: a('s', 'Footwear and insoles'),
  foot_care_advice: a('p', 'Foot care advice given'),
  treatment_given: a('p', 'Treatment given in the session'),
  therapy_approach: a('p', 'Approach used in the session'),
  limb_symptoms: a('s', 'Limb symptoms: pain on walking, pain at rest, swelling'),
  mouth_jaw_exam: a('o', 'Mouth, teeth and jaw examination'),
  communication_concern: a('s', 'Communication concern (as described)'),
  swallowing: a('s', 'Swallowing (as described)'),
  tinnitus: a('s', 'Ringing or noises in the ears'),
} as const

export type EnEkAlan = keyof typeof EN_EK_ALANLAR
type Alan = EnEkAlan | keyof typeof EN_ALANLAR

/** The kinds of role only one country has. A country names the kind of each of its own roles. */
export const EN_EK_TURLER = [
  'allergy', 'geriatric', 'pain', 'sleep', 'colorectal', 'radiation-oncology', 'child-psychiatry', 'addiction', 'palliative',
  'fertility', 'social-work', 'haematology', 'sexual-health', 'contraception', 'occupational', 'old-age-psychiatry', 'podiatry',
  'osteopathy', 'chiropractic', 'psychotherapy', 'speech-language', 'vascular', 'oral-maxillofacial', 'rural-hospital',
  'musculoskeletal', 'audio-vestibular',
] as const
export type EnEkTur = (typeof EN_EK_TURLER)[number]

/** Each kind's note fields, in the order they are shown. */
export const EN_EK_SABLONLAR: Readonly<Record<EnEkTur, readonly Alan[]>> = {
  allergy: ['reaction_history', 'suspected_triggers', 'allergies', 'regular_medicines', 'allergy_tests', 'emergency_plan'],
  geriatric: ['daily_living', 'falls_mobility', 'memory_thinking', 'chronic_conditions', 'regular_medicines', 'medicines_review', 'carer_support', 'future_care_wishes'],
  pain: ['pain_history', 'pain_impact', 'pain_medicines', 'musculoskeletal_exam', 'imaging_findings', 'pain_plan'],
  sleep: ['sleep_pattern', 'daytime_sleepiness', 'snoring_pauses', 'regular_medicines', 'sleep_study', 'sleep_treatment'],
  colorectal: ['bowel_habits', 'continence', 'rectal_bleeding', 'surgical_history', 'abdominal_exam', 'anorectal_exam', 'endoscopy_findings', 'stoma', 'surgery_plan', 'consent_discussion'],
  'radiation-oncology': ['prior_treatment', 'radiotherapy_course', 'radiotherapy_effects', 'treated_skin', 'general_condition', 'pathology', 'imaging_findings', 'stage_said'],
  'child-psychiatry': ['development', 'school_learning', 'family_home', 'mood', 'sleep', 'risk_statements', 'mental_status'],
  addiction: ['substance_history', 'withdrawal', 'psychiatric_history', 'social_context', 'risk_statements', 'support_programme_said', 'harm_reduction'],
  palliative: ['symptom_burden', 'regular_medicines', 'general_condition', 'goals_of_care', 'future_care_wishes', 'carer_support', 'referrals'],
  fertility: ['fertility_history', 'menstrual_history', 'obstetric_history', 'partner_history', 'fertility_tests', 'ultrasound_findings', 'treatment_cycle'],
  'social-work': ['social_needs', 'support_network', 'safeguarding', 'session_themes', 'risk_statements', 'interventions', 'referrals'],
  haematology: ['blood_results', 'bleeding_clotting', 'transfusions', 'regular_medicines', 'anticoagulation', 'treatment_tolerance'],
  'sexual-health': ['sexual_history', 'sti_symptoms', 'contraception', 'sti_tests', 'partner_notification', 'prevention_said'],
  contraception: ['menstrual_history', 'contraception', 'blood_pressure_pulse', 'weight_height', 'method_chosen', 'sti_tests'],
  occupational: ['work_role', 'work_exposure', 'chronic_conditions', 'work_absence', 'work_fitness', 'referrals'],
  'old-age-psychiatry': ['memory_thinking', 'mood', 'sleep', 'daily_living', 'carer_support', 'risk_statements', 'mental_status', 'medicines_review'],
  podiatry: ['referral_diagnosis', 'foot_complaint', 'foot_exam', 'circulation_sensation', 'footwear', 'treatment_given', 'foot_care_advice'],
  osteopathy: ['referral_diagnosis', 'pain_description', 'musculoskeletal_exam', 'range_of_motion', 'treatment_given', 'home_program'],
  chiropractic: ['referral_diagnosis', 'pain_description', 'functional_status', 'musculoskeletal_exam', 'range_of_motion', 'treatment_given', 'home_program'],
  psychotherapy: ['session_themes', 'mood', 'social_context', 'risk_statements', 'therapy_approach', 'interventions', 'homework'],
  'speech-language': ['referral_diagnosis', 'communication_concern', 'swallowing', 'functional_status', 'session_content', 'home_program', 'rehab_goals'],
  vascular: ['limb_symptoms', 'surgical_history', 'peripheral_pulses', 'wound_status', 'imaging_findings', 'anticoagulation', 'surgery_plan', 'consent_discussion'],
  'oral-maxillofacial': ['surgical_history', 'mouth_jaw_exam', 'local_status', 'imaging_findings', 'wound_status', 'surgery_plan', 'consent_discussion'],
  'rural-hospital': ['chronic_conditions', 'regular_medicines', 'vital_signs', 'emergency_actions', 'disposition', 'referrals'],
  musculoskeletal: ['injury_mechanism', 'pain_description', 'musculoskeletal_exam', 'range_of_motion', 'imaging_findings', 'functional_status', 'rehab_program'],
  'audio-vestibular': ['hearing_complaint', 'balance_complaint', 'tinnitus', 'noise_exposure', 'ear_exam', 'audiometry', 'tympanometry', 'hearing_aid'],
}

// ───────────────────────── intake questions ─────────────────────────

const q = (onEk: string, anahtar: string): string => `${onEk}_${anahtar}`

/** Each kind's intake questions: heading and questions, the keys under the role's own prefix. */
export function enEkSorular(tur: EnEkTur, onEk: string): HamRol {
  const k = (x: string) => q(onEk, x)
  const sorular = (baslik: string, liste: readonly HamSoru[]): HamRol => ({ baslik, sorular: liste })
  switch (tur) {
    case 'allergy': return sorular('About allergies', [
      uzun(k('reaction'), 'What happened during the reaction, and how soon after the trigger?', { zorunlu: true }),
      cok(k('triggers'), 'What do you think caused it?', [s('food', 'A food'), s('medicine', 'A medicine'), s('sting', 'An insect sting'), s('pollen', 'Pollen, dust or animals'), s('latex', 'Latex'), s('unknown', 'I do not know')]),
      cok(k('signs'), 'Which of these happened?', [s('rash', 'Rash or hives'), s('swelling', 'Swelling of lips, face or tongue'), s('breathing', 'Difficulty breathing or wheeze'), s('faint', 'Feeling faint or collapse'), s('stomach', 'Vomiting or stomach pain'), HICBIRI()]),
      eh(k('adrenaline'), 'Have you been given an adrenaline auto-injector?', 'Do you carry it, and when does it expire?'),
      eh(k('asthma'), 'Do you have asthma or eczema?', HANGILERI),
      eh(k('tests'), 'Have you had allergy tests before?', TETKIK),
    ])
    case 'geriatric': return sorular('About daily life', [
      cok(k('help'), 'Which of these do you need help with?', [s('washing', 'Washing or dressing'), s('meals', 'Preparing meals'), s('shopping', 'Shopping'), s('money', 'Managing money'), s('medicines', 'Taking medicines'), HICBIRI()]),
      eh(k('falls'), 'Have you had a fall in the last year?', 'How many, and were you hurt?'),
      eh(k('memory'), 'Have you or your family noticed changes in memory?', NE),
      kisa(k('medicines'), 'How many different medicines do you take each day?'),
      tek(k('living'), 'Who do you live with?', [s('alone', 'Alone'), s('partner', 'With a partner'), s('family', 'With family'), s('care', 'In a care home')]),
      eh(k('carer'), 'Is there someone who helps you regularly?', 'Who, and how often?'),
    ])
    case 'pain': return sorular('About the pain', [
      uzun(k('where'), 'Where is the pain, and when did it start?', { zorunlu: true }),
      tek(k('score'), 'How bad is the pain on most days, from 0 (none) to 10 (worst)?', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((n) => s(`n${n}`, n))),
      cok(k('affects'), 'What does the pain stop you doing?', [s('sleep', 'Sleeping'), s('work', 'Working'), s('walk', 'Walking'), s('home', 'Jobs at home'), s('mood', 'It affects my mood'), HICBIRI()]),
      uzun(k('tried'), 'Which treatments or medicines have you tried, and did they help?'),
      eh(k('strong'), 'Do you take strong pain medicines regularly?', 'Which, and how often?'),
      kisa(k('goal'), 'What would you most like to be able to do again?'),
    ])
    case 'sleep': return sorular('About your sleep', [
      kisa(k('times'), 'What time do you usually go to bed and get up?'),
      tek(k('sleepy'), 'Do you fall asleep in the day without meaning to?', [s('never', 'Never'), s('sometimes', 'Sometimes'), s('often', 'Often')]),
      tek(k('snore'), 'Has anyone told you that you snore loudly or stop breathing in your sleep?', EVET_HAYIR_BILMIYORUM()),
      eh(k('driving'), 'Have you felt sleepy while driving?', NE_ZAMAN),
      cok(k('night'), 'Which of these happen at night?', [s('waking', 'Waking often'), s('legs', 'Restless legs'), s('toilet', 'Getting up to pass urine'), s('dreams', 'Acting out dreams'), HICBIRI()]),
      eh(k('device'), 'Have you used a breathing machine or other device for sleep?', 'Which one, and how often do you use it?'),
    ])
    case 'colorectal': return sorular('About your bowels', [
      uzun(k('problem'), 'What is the main problem, and how long has it been going on?', { zorunlu: true }),
      tek(k('bleeding'), 'Have you noticed blood with your bowel movements?', [s('no', 'No'), s('paper', 'On the paper only'), s('stool', 'In or on the stool'), s('lots', 'A lot of blood')]),
      eh(k('change'), 'Has your bowel habit changed recently?', NE),
      eh(k('leak'), 'Do you have any leakage or difficulty controlling your bowels?', NE),
      eh(k('scope'), 'Have you had a camera test of the bowel?', TETKIK),
      eh(k('family'), 'Has anyone in your family had bowel cancer or bowel disease?', 'Who, and at what age?'),
    ])
    case 'radiation-oncology': return sorular('Before radiotherapy', [
      kisa(k('area'), 'Which area are you being treated for?', { zorunlu: true }),
      eh(k('before'), 'Have you had radiotherapy before?', 'Where, and when?'),
      eh(k('device'), 'Do you have a pacemaker or another implanted device?', NE),
      cok(k('effects'), 'Since treatment started, have you had any of these?', [s('tired', 'Tiredness'), s('skin', 'Skin soreness in the treated area'), s('swallow', 'Pain on swallowing'), s('bowel', 'Bowel or bladder changes'), HICBIRI()]),
      tek(k('pregnancy'), 'Could you be pregnant?', EVET_HAYIR_BILMIYORUM(), { kime: 'yetiskin', cinsiyet: 'female' }),
      uzun(k('worries'), 'Is there anything that worries you about the treatment?'),
    ])
    case 'child-psychiatry': return { baslik: 'About your mental health', veliBasligi: 'About your child', sorular: [
      uzun(k('worry'), 'What worries you most at the moment?', { zorunlu: true, veliMetni: 'What worries you most about your child at the moment?' }),
      cok(k('school'), 'How are things at school?', [s('fine', 'Going well'), s('learning', 'Problems with learning'), s('friends', 'Problems with friends'), s('missing', 'Missing school'), s('bullying', 'Bullying')], { veliMetni: 'How are things at school for your child?' }),
      tek(k('sleep'), 'How has sleep been?', [s('same', 'Unchanged'), s('less', 'Sleeping badly'), s('more', 'Sleeping more')]),
      eh(k('development'), 'Were there any concerns about early development (speech, walking, play)?', NE, { kime: 'cocuk' }),
      eh(k('before'), 'Has a mental health service seen you before?', NE_ZAMAN, { veliMetni: 'Has a mental health service seen your child before?' }),
      kisa(k('home'), 'Who lives at home?'),
    ] }
    case 'addiction': return sorular('About alcohol and other substances', [
      cok(k('which'), 'Which of these are you concerned about?', [s('alcohol', 'Alcohol'), s('opioids', 'Opioids'), s('cannabis', 'Cannabis'), s('stimulants', 'Stimulants'), s('sedatives', 'Sleeping tablets or sedatives'), s('other', 'Something else')], { zorunlu: true }),
      kisa(k('amount'), 'How much, and how often, at the moment?'),
      kisa(k('last'), 'When did you last use?'),
      eh(k('withdrawal'), 'Have you felt unwell when stopping (shaking, sweating, fits)?', NE),
      eh(k('treatment'), 'Have you had treatment or support before?', NE_ZAMAN),
      uzun(k('goal'), 'What would you like to change?'),
    ])
    case 'palliative': return sorular('About how you are', [
      cok(k('symptoms'), 'Which of these trouble you most?', [s('pain', 'Pain'), s('breath', 'Breathlessness'), s('sick', 'Feeling sick'), s('tired', 'Tiredness'), s('sleep', 'Poor sleep'), s('worry', 'Worry or low mood'), HICBIRI()]),
      uzun(k('important'), 'What matters most to you at the moment?'),
      eh(k('plan'), 'Have you written down wishes for your future care?', 'Where is it kept?'),
      kisa(k('carer'), 'Who helps you at home?'),
      eh(k('services'), 'Are other care services already involved?', HANGILERI),
    ])
    case 'fertility': return sorular('About trying for a baby', [
      kisa(k('how_long'), 'How long have you been trying to conceive?', { zorunlu: true }),
      tek(k('cycle'), 'Are your periods regular?', [s('regular', 'Regular'), s('irregular', 'Irregular'), s('none', 'No periods'), s('na', 'Not applicable')]),
      eh(k('before'), 'Have you had a pregnancy before?', 'How many, and how did they end?'),
      eh(k('tests'), 'Have you or your partner had fertility tests?', TETKIK),
      eh(k('treatment'), 'Have you had fertility treatment before?', 'Which, and where?'),
      eh(k('conditions'), 'Do you have a condition such as endometriosis or polycystic ovaries?', HANGILERI),
    ])
    case 'social-work': return sorular('Before we meet', [
      uzun(k('help'), 'What would you most like help with?', { zorunlu: true }),
      cok(k('areas'), 'Which of these are affecting you?', [s('housing', 'Housing'), s('money', 'Money or financial support'), s('work', 'Work'), s('caring', 'Caring for someone'), s('family', 'Family relationships'), s('safety', 'Feeling unsafe'), HICBIRI()]),
      kisa(k('support'), 'Who supports you at the moment?'),
      eh(k('services'), 'Are other services already involved?', HANGILERI),
      eh(k('safe'), 'Do you feel safe at home?', 'Would you like to talk about it privately?'),
    ])
    case 'haematology': return sorular('About your blood', [
      uzun(k('reason'), 'Why were you referred, as you understand it?', { zorunlu: true }),
      eh(k('bleeding'), 'Do you bruise or bleed easily?', NE),
      eh(k('clots'), 'Have you had a blood clot?', 'Where, and when?'),
      eh(k('transfusion'), 'Have you had a blood transfusion?', 'When, and was there any reaction?'),
      eh(k('thinners'), 'Do you take blood thinners?', 'Which one?'),
      eh(k('family'), 'Does anyone in your family have a blood condition?', 'Who, and which condition?'),
    ])
    case 'sexual-health': return sorular('About your visit', [
      cok(k('reason'), 'Why are you visiting today?', [s('check', 'A routine check'), s('symptoms', 'Symptoms'), s('contact', 'A partner has an infection'), s('contraception', 'Contraception'), s('prevention', 'Prevention or vaccination'), s('other', 'Something else')], { zorunlu: true }),
      uzun(k('symptoms'), 'If you have symptoms, what are they and when did they start?'),
      kisa(k('last_test'), 'When were you last tested, if ever?'),
      eh(k('pregnant'), 'Could you be pregnant?', undefined, { kime: 'yetiskin', cinsiyet: 'female' }),
      eh(k('allergy'), 'Are you allergic to any antibiotic?', HANGILERI),
    ])
    case 'contraception': return sorular('About contraception', [
      tek(k('now'), 'What do you use at the moment?', [s('none', 'Nothing'), s('pill', 'A pill'), s('device', 'An IUD (coil) or implant'), s('injection', 'An injection'), s('barrier', 'Condoms'), s('other', 'Something else')], { zorunlu: true }),
      kisa(k('period'), 'When did your last period start?'),
      eh(k('migraine'), 'Do you have migraines with aura (flashing lights before a headache)?'),
      eh(k('clots'), 'Have you or a close relative had a blood clot?', 'Who, and when?'),
      tek(k('smoke'), 'Do you smoke?', [s('no', 'No'), s('yes', 'Yes'), s('stopped', 'I have stopped')]),
      uzun(k('wish'), 'What matters most to you in choosing a method?'),
    ])
    case 'occupational': return sorular('About your work', [
      kisa(k('job'), 'What is your job, and what does it involve?', { zorunlu: true }),
      uzun(k('reason'), 'Why have you been asked to come, as you understand it?'),
      cok(k('exposure'), 'Are you exposed to any of these at work?', [s('noise', 'Loud noise'), s('dust', 'Dust or fumes'), s('chemicals', 'Chemicals'), s('lifting', 'Heavy lifting'), s('shifts', 'Night shifts'), s('screen', 'Long screen work'), HICBIRI()]),
      eh(k('off'), 'Have you had time off work for this?', 'How long?'),
      eh(k('adjust'), 'Would changes at work help you?', NE),
    ])
    case 'old-age-psychiatry': return sorular('About memory and mood', [
      uzun(k('concern'), 'What changes have you or your family noticed?', { zorunlu: true }),
      eh(k('memory'), 'Have you had problems remembering recent events?', NE),
      tek(k('mood'), 'How has your mood been?', [s('same', 'Unchanged'), s('low', 'Low'), s('anxious', 'Anxious'), s('irritable', 'Irritable')]),
      cok(k('help'), 'Which of these do you need help with now?', [s('meals', 'Meals'), s('medicines', 'Medicines'), s('money', 'Money'), s('getting_out', 'Going out'), HICBIRI()]),
      kisa(k('carer'), 'Who helps you, if anyone?'),
    ])
    case 'podiatry': return sorular('Before your appointment', [
      uzun(k('problem'), 'What is the problem with your feet or legs?', { zorunlu: true }),
      eh(k('diabetes'), 'Do you have diabetes?'),
      eh(k('circulation'), 'Do you have poor circulation or numbness in your feet?', NE),
      eh(k('wound'), 'Do you have a wound or sore on your foot?', 'Where, and for how long?'),
      kisa(k('footwear'), 'What shoes do you wear most days?'),
      eh(k('insoles'), 'Do you use insoles or orthoses?', NE),
    ])
    case 'osteopathy':
    case 'chiropractic': return sorular('Before your appointment', [
      uzun(k('problem'), 'Where is the pain or stiffness, and when did it start?', { zorunlu: true }),
      eh(k('injury'), 'Did it start with an injury or accident?', NE),
      cok(k('signs'), 'Have you noticed any of these?', [s('numb', 'Numbness or pins and needles'), s('weak', 'Weakness in an arm or leg'), s('bladder', 'Changes in bladder or bowel control'), s('night', 'Pain that wakes you at night'), s('weight', 'Weight loss you cannot explain'), HICBIRI()]),
      eh(k('scans'), 'Have you had an X-ray or scan for this?', TETKIK),
      eh(k('treatment'), 'Have you had treatment for this before?', 'Which, and did it help?'),
      kisa(k('goal'), 'What would you like to be able to do again?'),
    ])
    case 'psychotherapy': return sorular('Before the first session', [
      uzun(k('why'), 'What brings you to therapy now?', { zorunlu: true }),
      uzun(k('hope'), 'What would you like to be different?'),
      eh(k('before'), 'Have you had therapy or counselling before?', 'What kind, and how did it go?'),
      eh(k('medicine'), 'Do you take medicine for your mental health?', HANGILERI),
      eh(k('safety'), 'Have you had thoughts of harming yourself recently?', 'Would you like to talk about this first?'),
    ])
    case 'speech-language': return { baslik: 'About communication and swallowing', veliBasligi: 'About your child\'s communication', sorular: [
      uzun(k('concern'), 'What is the main concern about speech, language, voice or swallowing?', { zorunlu: true, veliMetni: 'What is the main concern about your child\'s speech, language or swallowing?' }),
      kisa(k('since'), 'When did you first notice it?'),
      eh(k('swallow'), 'Is there coughing or choking when eating or drinking?', NE),
      eh(k('hearing'), 'Has hearing been tested?', TETKIK),
      eh(k('before'), 'Has there been speech and language therapy before?', NE_ZAMAN),
      kisa(k('languages'), 'Which languages are spoken at home?'),
    ] }
    case 'vascular': return sorular('About your circulation', [
      uzun(k('problem'), 'What is the main problem with your legs, arms or circulation?', { zorunlu: true }),
      eh(k('walking'), 'Do you get pain in your legs when walking that eases with rest?', 'How far can you walk?'),
      eh(k('wound'), 'Do you have a wound that is slow to heal?', 'Where, and for how long?'),
      tek(k('smoke'), 'Do you smoke?', [s('no', 'No'), s('yes', 'Yes'), s('stopped', 'I have stopped')]),
      eh(k('thinners'), 'Do you take blood thinners?', 'Which one?'),
      eh(k('operation'), 'Have you had an operation on your blood vessels?', NE_ZAMAN),
    ])
    case 'oral-maxillofacial': return sorular('For the surgeon', [
      uzun(k('problem'), 'What is the problem with your mouth, jaw or face?', { zorunlu: true }),
      eh(k('pain'), 'Do you have pain?', 'Where, and how long?'),
      eh(k('opening'), 'Do you have difficulty opening your mouth or chewing?'),
      eh(k('thinners'), 'Do you take blood thinners or bone medicines?', 'Which ones?'),
      eh(k('scans'), 'Have you had dental X-rays or scans?', TETKIK),
    ])
    case 'rural-hospital': return sorular('For your doctor', [
      uzun(k('today'), 'What has brought you in today?', { zorunlu: true }),
      kisa(k('since'), 'When did it start?'),
      eh(k('conditions'), 'Do you have any long-term conditions?', HANGILERI),
      eh(k('medicines'), 'Do you take regular medicines?', HANGILERI),
      kisa(k('distance'), 'How far do you live from the hospital?'),
    ])
    case 'musculoskeletal': return sorular('About the pain or the limitation', [
      uzun(k('where'), 'Where is the problem, and how did it start?', { zorunlu: true }),
      tek(k('score'), 'How bad is it on most days, from 0 (none) to 10 (worst)?', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((n) => s(`n${n}`, n))),
      eh(k('injury'), 'Did it follow an injury?', NE),
      eh(k('scans'), 'Have you had an X-ray or scan for this?', TETKIK),
      uzun(k('tried'), 'What have you tried so far, and did it help?'),
    ])
    case 'audio-vestibular': return { baslik: 'About hearing and balance', veliBasligi: 'About your child\'s hearing and balance', sorular: [
      cok(k('problem'), 'Which of these are a problem?', [s('hearing', 'Hearing'), s('dizzy', 'Dizziness or spinning'), s('balance', 'Unsteadiness'), s('tinnitus', 'Ringing or noises in the ears'), s('ear', 'Ear pain or discharge')], { zorunlu: true }),
      kisa(k('since'), 'When did it start, and did it start suddenly?'),
      eh(k('noise'), 'Have you been exposed to loud noise?', NE),
      eh(k('tests'), 'Have you had hearing or balance tests before?', TETKIK),
      eh(k('aids'), 'Do you use hearing aids?', NE),
    ] }
  }
}

/**
 * A COUNTRY'S ROLE LIST WITH ITS OWN ROLES' CONTENT. `turler` = for each role only this country has, the kind it is;
 * `onEkler` = the prefix of its question keys (unique in the pack). With `form: false` only the note fields are
 * added (the screens' half of a pack needs no questions); the server half asks with `form: true`.
 * A role not named in `turler` is left exactly as it was. Note field labels are spelled in the country's form here,
 * because the set uses a country's own field labels as written.
 */
export function enEkRolIcerigi(degisim: EnRolDegisimi, bicim: EnBicim, turler: Readonly<Record<string, EnEkTur>>, onEkler: Readonly<Record<string, string>>, secim: { form: boolean }): EnRolDegisimi {
  const kullanilan = new Set<string>()
  const ekle = (degisim.ekle ?? []).map((r): EnEkRol => {
    const tur = Object.prototype.hasOwnProperty.call(turler, r.anahtar) ? turler[r.anahtar] : null
    if (!tur) return r
    const sablon = EN_EK_SABLONLAR[tur]
    for (const alan of sablon) if (alan in EN_EK_ALANLAR) kullanilan.add(alan)
    const onEk = onEkler[r.anahtar]
    return { ...r, sablon, ...(secim.form && onEk ? { form: enEkSorular(tur, onEk) } : {}) }
  })
  const alanlar: Record<string, { bolum: NotBolumu; ad: string }> = { ...(degisim.alanlar ?? {}) }
  for (const k of kullanilan) {
    const t = EN_EK_ALANLAR[k as EnEkAlan]
    if (!(k in alanlar)) alanlar[k] = { bolum: t.bolum, ad: enYaz(t.ad, bicim) }
  }
  return { ...degisim, ekle, alanlar }
}
