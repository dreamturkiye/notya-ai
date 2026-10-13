/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the intake questions of each role, second part (the other fifteen
 * doctor specialties, in the order of ../roller.ts). Same rules as ./roller1.ts.
 *
 * MACHINE-WRITTEN. AWAITS A CLINICIAN OF EACH ROLE IN EACH COUNTRY. PATIENT-FACING.
 */
import type { EnRol } from '../roller'
import { cok, DEGERLER, eh, EVET_HAYIR_BILMIYORUM, HICBIRI, ILAC_ADI, KIMDE, kisa, NE, NE_ZAMAN, olcu, PUAN, s, sayi, tek, TETKIK, uzun, type HamRol } from './yardimci'

export const EN_ROL_SORULARI_2: Readonly<Partial<Record<EnRol, HamRol>>> = {
  'cardiovascular-surgery': {
    baslik: 'For the heart and blood vessel surgeon',
    sorular: [
      cok('cs_symptoms', 'Which of these trouble you?', [s('pain', 'Chest pain'), s('breathless', 'Shortness of breath'), s('leg_pain', 'Leg pain when walking'), s('swelling', 'Swollen legs'), s('veins', 'Enlarged veins'), s('rhythm', 'An irregular heartbeat'), HICBIRI()]),
      eh('cs_operation', 'Has there been an operation or procedure on the heart or blood vessels?', NE_ZAMAN),
      eh('cs_tests', 'Have the heart or blood vessels been examined with tests?', TETKIK),
      eh('cs_blood_thinner', 'Are any blood-thinning medicines taken?', ILAC_ADI),
      eh('cs_family', 'Are there heart or blood vessel conditions in the family?', KIMDE),
    ],
  },
  cardiology: {
    baslik: 'About the heart',
    sorular: [
      cok('ca_symptoms', 'Which of these trouble you?', [s('pain', 'Pain or tightness in the chest'), s('heartbeat', 'A fast or irregular heartbeat'), s('breathless', 'Shortness of breath'), s('faint', 'Fainting or nearly fainting'), s('swelling', 'Swollen legs'), s('tired', 'Getting tired quickly'), HICBIRI()]),
      tek('ca_pain_when', 'When does the chest pain come on?', [s('never', 'There is no pain'), s('effort', 'On effort'), s('rest', 'At rest'), s('both', 'Both on effort and at rest')]),
      cok('ca_diagnosis', 'Which condition has been found?', [s('blood_pressure', 'High blood pressure'), s('coronary', 'Coronary heart disease'), s('rhythm', 'A heart rhythm problem'), s('failure', 'Heart failure'), s('attack', 'A heart attack in the past'), s('valve', 'A heart valve or structural problem'), { anahtar: 'none', ad: 'None has been found', tek: true }]),
      eh('ca_procedure', 'Has there been a procedure or an operation on the heart?', NE_ZAMAN),
      eh('ca_bp_home', 'Is blood pressure measured at home?', DEGERLER),
      eh('ca_family', 'Have close relatives had heart disease, a heart attack or a sudden death?', KIMDE),
    ],
  },
  otolaryngology: {
    baslik: 'About the ear, nose and throat',
    sorular: [
      cok('ot_symptoms', 'Which of these trouble you?', [s('ear_pain', 'Ear pain'), s('hearing', 'Hearing loss'), s('tinnitus', 'Ringing in the ears'), s('blocked_nose', 'A blocked nose'), s('nosebleed', 'Nosebleeds'), s('throat', 'Sore throat'), s('voice', 'A hoarse voice'), s('dizziness', 'Dizziness'), HICBIRI()]),
      tek('ot_side', 'On which side is the problem?', [s('right', 'Right'), s('left', 'Left'), s('both', 'Both sides'), s('no_side', 'It has no side')]),
      eh('ot_diagnosis', 'Has a condition of the ear, nose or throat been found?', NE),
      eh('ot_operation', 'Has there been an operation on the ear, nose or throat?', NE_ZAMAN),
      eh('ot_noise', 'Does work or a hobby involve loud noise?'),
    ],
  },
  nephrology: {
    baslik: 'About the kidneys',
    sorular: [
      cok('ne_symptoms', 'Which of these trouble you?', [s('swelling', 'Swollen legs or face'), s('amount', 'A change in the amount of urine'), s('colour', 'A change in the colour of the urine'), s('back', 'Pain in the lower back'), s('tired', 'Tiredness'), HICBIRI()]),
      eh('ne_diagnosis', 'Has a kidney condition been found?', NE),
      tek('ne_dialysis', 'Has there been dialysis?', [s('no', 'No'), s('before', 'In the past'), s('now', 'Now')]),
      eh('ne_bp_home', 'Is blood pressure measured at home?', DEGERLER),
      kisa('ne_tests', 'When were the last blood and urine tests?'),
      eh('ne_family', 'Are there kidney conditions in the family?', KIMDE),
    ],
  },
  neurology: {
    baslik: 'For the neurologist',
    sorular: [
      cok('nu_symptoms', 'Which of these trouble you?', [s('headache', 'Headache'), s('dizziness', 'Dizziness'), s('numbness', 'Numbness or tingling'), s('weakness', 'Weakness in an arm or leg'), s('balance', 'Problems with balance'), s('memory', 'Poorer memory or attention'), s('sleep', 'Poor sleep'), HICBIRI()]),
      tek('nu_blackouts', 'Have there been faints or seizures?', [s('no', 'No'), s('faint', 'A faint'), s('seizure', 'A seizure'), s('both', 'Both')]),
      eh('nu_diagnosis', 'Has a neurological condition been found?', NE),
      eh('nu_tests', 'Have the brain or the nerves been examined with tests?', TETKIK),
      eh('nu_family', 'Are there neurological conditions in the family?', KIMDE),
    ],
  },
  oncology: {
    baslik: 'For the oncologist',
    sorular: [
      uzun('on_diagnosis', 'If a diagnosis has been made: which, and when?'),
      cok('on_treatment', 'Which treatment has there been?', [s('surgery', 'An operation'), s('chemo', 'Chemotherapy'), s('radio', 'Radiotherapy (radiation treatment)'), s('other', 'Another medicine treatment'), { anahtar: 'none', ad: 'Treatment has not started yet', tek: true }]),
      kisa('on_stage', 'What stage is the treatment at now?'),
      cok('on_symptoms', 'Which of these trouble you?', [s('pain', 'Pain'), s('tired', 'Tiredness'), s('appetite', 'Poor appetite'), s('weight', 'Weight loss'), s('nausea', 'Nausea'), HICBIRI()]),
      sayi('on_pain', 'How strong is the pain? (0 = no pain, 10 = unbearable)', PUAN, 0, 10),
      eh('on_family', 'Has there been cancer in the family?', KIMDE),
    ],
  },
  orthopaedics: {
    baslik: 'About bones and joints',
    sorular: [
      kisa('or_where', 'In which part of the body is the pain or the problem?', { zorunlu: true }),
      eh('or_injury', 'Did it start after an injury (a fall, a blow)?', 'What happened, and when?'),
      cok('or_symptoms', 'Which of these are there?', [s('swelling', 'Swelling'), s('movement', 'Limited movement'), s('numbness', 'Numbness'), s('weakness', 'Weakness'), s('unstable', 'A joint that gives way or locks'), HICBIRI()]),
      eh('or_diagnosis', 'Has a bone or joint condition been found?', NE),
      eh('or_imaging', 'Has there been an X-ray, a CT or an MRI scan?', TETKIK),
      kisa('or_aids', 'Aids used (a brace, a prosthesis, a cane or walking stick, or other)'),
    ],
  },
  paediatrics: {
    baslik: 'About the child',
    sorular: [
      tek('pe_term', 'When was the child born?', [s('term', 'On time (at term)'), s('early', 'Early'), s('unknown', 'I do not know')]),
      tek('pe_delivery', 'How was the child born?', [s('vaginal', 'Vaginal birth'), s('caesarean', 'Caesarean section'), s('unknown', 'I do not know')]),
      kisa('pe_birth_weight', 'Weight at birth, with its unit, as you know it'),
      olcu('pe_birth_length', 'Length at birth', 'boy'),
      eh('pe_newborn', 'Were there problems in the first days after birth?', NE),
      cok('pe_feeding', 'How is the child fed now?', [s('breast', 'Breast milk'), s('formula', 'Formula milk'), s('weaning', 'Solid food has been started'), s('family', 'Eats with the family')]),
      tek('pe_vaccines', 'Are the child\'s vaccinations up to date (as far as you know)?', EVET_HAYIR_BILMIYORUM(), { yardim: 'Bring the child\'s vaccination record to the visit.' }),
      tek('pe_setting', 'Does the child go to childcare or to school?', [s('home', 'No, at home'), s('nursery', 'Goes to childcare or preschool'), s('school', 'Goes to school')]),
      eh('pe_development', 'Are you worried about the child\'s development (sitting, walking, talking)?', 'What worries you?'),
    ],
  },
  'plastic-surgery': {
    baslik: 'For the plastic surgeon',
    sorular: [
      tek('pl_purpose', 'Purpose of the visit', [s('reconstruct', 'Reconstruction (after an injury, a burn, a defect)'), s('cosmetic', 'A cosmetic change'), s('unknown', 'Not decided yet')]),
      kisa('pl_area', 'Which part of the body is the consultation about?'),
      eh('pl_before', 'Have there been plastic or cosmetic operations before?', NE_ZAMAN),
      eh('pl_healing', 'Have wounds healed slowly, or left raised scars?'),
      eh('pl_bleeding', 'Has a tendency to bleed or a clotting problem been found?'),
    ],
  },
  psychiatry: {
    baslik: 'About mental health',
    sorular: [
      cok('py_symptoms', 'Which of these have troubled you lately?', [s('low', 'Low mood'), s('anxiety', 'Strong anxiety'), s('irritable', 'Irritability'), s('interest', 'Loss of interest'), s('energy', 'Lack of energy'), s('focus', 'Difficulty concentrating'), HICBIRI()]),
      tek('py_sleep', 'Sleep', [s('same', 'Unchanged'), s('less', 'Sleeping badly'), s('more', 'Sleeping more than usual')]),
      tek('py_appetite', 'Appetite', [s('same', 'Unchanged'), s('less', 'Less'), s('more', 'More')]),
      eh('py_before', 'Has a mental health professional been seen before?', 'When, and what help was given?'),
      uzun('py_hardest', 'What troubles you most at the moment?'),
      eh('py_family', 'Have there been mental health conditions in the family?', KIMDE),
    ],
  },
  radiology: {
    baslik: 'Before the examination',
    sorular: [
      uzun('ra_exam', 'Which examination has been requested, and why?', { zorunlu: true }),
      eh('ra_contrast', 'Has there been a bad reaction to a contrast injection before?', NE),
      eh('ra_metal', 'Is there metal or a fitted device in the body (a pacemaker, an implant, a prosthesis)?', NE),
      tek('ra_pregnancy', 'Could there be a pregnancy?', EVET_HAYIR_BILMIYORUM(), { kime: 'yetiskin', cinsiyet: 'female' }),
      eh('ra_kidney', 'Has a kidney problem been found?'),
      eh('ra_closed', 'Is there a fear of closed, narrow spaces?'),
      kisa('ra_earlier', 'Earlier examinations (which, and when)'),
    ],
  },
  rheumatology: {
    baslik: 'About the joints',
    sorular: [
      cok('rh_symptoms', 'Which of these trouble you?', [s('pain', 'Joint pain'), s('swelling', 'Swollen joints'), s('stiffness', 'Stiff joints in the morning'), s('muscle', 'Muscle pain'), s('rash', 'A skin rash'), s('dryness', 'A dry mouth or dry eyes'), HICBIRI()]),
      kisa('rh_stiffness', 'If there is morning stiffness, about how long does it last?'),
      kisa('rh_joints', 'Which joints are affected?'),
      eh('rh_diagnosis', 'Has a rheumatological condition been found?', NE),
      eh('rh_family', 'Are there joint or rheumatological conditions in the family?', KIMDE),
    ],
  },
  urology: {
    baslik: 'For the urologist',
    sorular: [
      cok('ur_symptoms', 'Which of these trouble you?', [s('often', 'Urinating often'), s('burning', 'Pain or burning when urinating'), s('blood', 'Blood in the urine'), s('night', 'Getting up at night to urinate'), s('stream', 'A weak stream'), s('back', 'Pain in the lower back or side'), HICBIRI()]),
      eh('ur_stones', 'Have there been stones in the kidneys or urinary tract?', NE_ZAMAN),
      eh('ur_diagnosis', 'Has a urological condition been found?', NE),
      eh('ur_procedure', 'Has there been a urological operation or procedure?', NE_ZAMAN),
      eh('ur_family', 'Are there urological conditions in the family?', KIMDE),
    ],
  },
  'sports-medicine': {
    baslik: 'For the sports doctor',
    sorular: [
      kisa('sm_sport', 'Which sport, and how many times a week?', { zorunlu: true }),
      tek('sm_purpose', 'Purpose of the visit', [s('injury', 'An injury or pain'), s('clearance', 'An examination before taking part'), s('advice', 'Advice')]),
      eh('sm_injury', 'Has there been a sports injury in the last year?', 'Which injury, and when?'),
      cok('sm_symptoms', 'Which of these happen during exercise?', [s('pain', 'Chest pain'), s('faint', 'Fainting or dizziness'), s('breathless', 'Shortness of breath beyond the usual'), s('rhythm', 'An irregular heartbeat'), HICBIRI()]),
      eh('sm_heart', 'Has the heart been examined before?', TETKIK),
    ],
  },
  'rehabilitation-medicine': {
    baslik: 'For the rehabilitation doctor',
    sorular: [
      kisa('rb_where', 'In which part of the body is the pain or the limitation?'),
      sayi('rb_pain', 'How strong is the pain? (0 = no pain, 10 = unbearable)', PUAN, 0, 10),
      tek('rb_limits', 'How much does the problem limit daily activities?', [s('none', 'It does not'), s('a_little', 'A little'), s('a_lot', 'A lot'), s('fully', 'Daily activities are not possible')]),
      eh('rb_diagnosis', 'Is there a diagnosis made by a doctor?', NE),
      eh('rb_before', 'Has there been physiotherapy (physical therapy) or rehabilitation before?', NE_ZAMAN),
      kisa('rb_aids', 'Aids used (a brace, a prosthesis, a cane or walking stick, or other)'),
    ],
  },
}
