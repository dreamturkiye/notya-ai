/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the intake questions of each role, first part (the first fifteen
 * doctor specialties, in the order of ../roller.ts).
 *
 * MACHINE-WRITTEN. AWAITS A CLINICIAN OF EACH ROLE IN EACH COUNTRY. PATIENT-FACING.
 *
 * A question belongs to ONE role: every key is unique in the whole set, and a role's questions are never shown for
 * another. QUESTIONS, NEVER REFERENCE CONTENT: no drug is named, no vaccination schedule, no screening interval, no
 * validated questionnaire, no score, no triage rule and no instruction to a patient. Pain is a number from 0 to 10
 * with its two ends said in words; nothing is scored or summed. What was left out on purpose: ./yuvalar.ts.
 *
 * The questions are written impersonally ("What troubles you…", "Has there been…") so that the same wording serves a
 * patient and a parent answering for a child; where it cannot, a question carries `veliMetni`.
 */
import type { EnRol } from '../roller'
import { cok, DEGERLER, eh, EVET_HAYIR_BILMIYORUM, gun, HAFTA, HICBIRI, ILAC_ADI, KEZ, KIMDE, kisa, NE, NE_ZAMAN, PUAN, s, sayi, tek, TETKIK, uzun, type HamRol } from './yardimci'

export const EN_ROL_SORULARI_1: Readonly<Partial<Record<EnRol, HamRol>>> = {
  'emergency-medicine': {
    baslik: 'About this emergency',
    sorular: [
      tek('em_onset', 'How did the problem start?', [s('sudden', 'Suddenly'), s('gradual', 'Gradually')]),
      sayi('em_severity', 'How much does it trouble you? (0 = not at all, 10 = unbearable)', PUAN, 0, 10),
      cok('em_with', 'What else is there?', [s('fever', 'Fever'), s('vomiting', 'Nausea or vomiting'), s('dizziness', 'Dizziness'), s('breathless', 'Shortness of breath'), s('pain', 'Pain'), HICBIRI()]),
      eh('em_before', 'Has this happened before?', NE_ZAMAN),
      eh('em_injury', 'Did it start after an injury or an accident?', 'What happened, and when?'),
    ],
  },
  'family-medicine': {
    baslik: 'For your family doctor',
    sorular: [
      tek('fm_purpose', 'Purpose of the visit', [s('checkup', 'A general check-up'), s('complaint', 'A particular problem'), s('followup', 'Follow-up of a long-term condition'), s('document', 'A certificate or a document')]),
      cok('fm_symptoms', 'Which of these trouble you?', [s('tired', 'Tiredness'), s('fever', 'Fever'), s('cough', 'Cough'), s('weight', 'A change in appetite or weight'), s('sleep', 'Poor sleep'), s('pain', 'Pain'), HICBIRI()]),
      eh('fm_tests', 'Have there been any tests or check-ups in the last year?', TETKIK),
      tek('fm_vaccines', 'Are the vaccinations up to date (as far as you know)?', EVET_HAYIR_BILMIYORUM()),
      tek('fm_activity', 'Physical activity', [s('little', 'Hardly any'), s('sometimes', 'Sometimes'), s('regular', 'Regularly')]),
    ],
  },
  anaesthesia: {
    baslik: 'Before the anaesthetic',
    sorular: [
      uzun('an_procedure', 'Which operation or procedure is planned?', { zorunlu: true }),
      eh('an_previous', 'Has there been an anaesthetic before?', 'When, and were there any problems?'),
      eh('an_family', 'Has a relative had a serious problem with an anaesthetic?', KIMDE),
      eh('an_teeth', 'Is there a denture, a loose tooth or anything removable in the mouth?'),
      cok('an_conditions', 'Which of these are there?', [s('heart', 'A heart condition'), s('lungs', 'A lung condition or asthma'), s('sleep_breathing', 'Pauses in breathing during sleep'), s('clotting', 'A bleeding or clotting problem'), HICBIRI()]),
      eh('an_blood_thinner', 'Are any blood-thinning medicines taken?', ILAC_ADI),
    ],
  },
  neurosurgery: {
    baslik: 'For the neurosurgeon',
    sorular: [
      cok('ns_symptoms', 'Which of these trouble you?', [s('headache', 'Headache'), s('back', 'Neck or lower back pain'), s('numbness', 'Numbness in an arm or leg'), s('weakness', 'Weakness in an arm or leg'), s('balance', 'Problems with balance'), s('vision', 'A change in eyesight'), HICBIRI()]),
      eh('ns_scans', 'Do you have the results of a CT or MRI scan with you?', 'Which scan, and when was it done?'),
      eh('ns_diagnosis', 'Has a condition of the brain or spine been found?', NE),
      eh('ns_operation', 'Has there been an operation on the brain or spine?', NE_ZAMAN),
      eh('ns_injury', 'Has there been an injury to the head or spine?', NE_ZAMAN),
    ],
  },
  'paediatric-surgery': {
    baslik: 'For the children\'s surgeon',
    sorular: [
      cok('pds_symptoms', 'Which of these does the child have?', [s('tummy', 'Stomach or belly pain'), s('vomiting', 'Vomiting'), s('fever', 'Fever'), s('swelling', 'A swelling or a bulge'), s('urine', 'Difficulty urinating'), s('bowel', 'A change in the stools'), HICBIRI()]),
      eh('pds_congenital', 'Has a condition the child was born with been found?', NE),
      tek('pds_eating', 'Has the child been eating as usual in the last few days?', [s('usual', 'Yes, as usual'), s('less', 'Less than usual'), s('hardly', 'Hardly at all')]),
      eh('pds_anaesthetic', 'Has the child had an anaesthetic before?', 'When, and were there any problems?'),
      tek('pds_vaccines', 'Are the child\'s vaccinations up to date (as far as you know)?', EVET_HAYIR_BILMIYORUM()),
    ],
  },
  'internal-medicine': {
    baslik: 'For the internal medicine doctor',
    sorular: [
      cok('im_symptoms', 'Which of these trouble you?', [s('tired', 'Tiredness'), s('fever', 'Fever'), s('night_sweats', 'Night sweats'), s('appetite', 'Poor appetite'), s('dizziness', 'Dizziness'), s('joints', 'Joint pain'), HICBIRI()]),
      tek('im_weight', 'Has the weight changed without a reason in the last few months?', [s('no', 'No'), s('down', 'It has gone down'), s('up', 'It has gone up')]),
      eh('im_followup', 'Is a doctor following a long-term condition?', 'Which condition, and when was the last visit?'),
      kisa('im_blood_test', 'When was the last blood test?'),
      eh('im_bp_home', 'Is blood pressure measured at home?', DEGERLER),
    ],
  },
  dermatology: {
    baslik: 'About the skin',
    sorular: [
      kisa('de_where', 'On which part of the body is the skin change?'),
      cok('de_symptoms', 'Which of these are there?', [s('itch', 'Itching'), s('rash', 'A rash'), s('redness', 'Redness'), s('scaling', 'Scaling'), s('burning', 'Pain or burning'), s('mole', 'A mole that has changed in size or colour'), HICBIRI()]),
      eh('de_new_medicine', 'Has a new medicine been started in the last two months?', 'Name of the medicine, and since when'),
      eh('de_before', 'Has a skin condition been found before?', 'Which condition, and how was it treated?'),
      uzun('de_products', 'What is put on the skin (creams, ointments, cosmetics)'),
      eh('de_sunburn', 'Does the skin burn in the sun often?'),
    ],
  },
  endocrinology: {
    baslik: 'For the endocrinologist',
    sorular: [
      cok('en_symptoms', 'Which of these trouble you?', [s('thirst', 'Great thirst'), s('urine', 'Urinating often'), s('weight', 'A change in weight'), s('tired', 'Tiredness'), s('heat', 'Sweating or not coping with heat'), s('heartbeat', 'A fast heartbeat'), s('hair', 'Hair loss'), HICBIRI()]),
      cok('en_diagnosis', 'Which condition has been found?', [s('diabetes', 'Diabetes'), s('thyroid', 'A thyroid condition'), s('other', 'Another hormone condition'), { anahtar: 'none', ad: 'None has been found', tek: true }]),
      eh('en_glucose_home', 'Is blood glucose measured at home?', DEGERLER),
      uzun('en_medicines', 'Medicines taken for these conditions (names, if you know them)'),
      eh('en_family', 'Is there diabetes or thyroid disease in the family?', KIMDE),
    ],
  },
  'infectious-diseases': {
    baslik: 'For the infectious diseases doctor',
    sorular: [
      tek('id_fever', 'Is there a fever, and for how long?', [s('no', 'No fever'), s('days', 'A few days'), s('week', 'About a week'), s('longer', 'More than a week')]),
      cok('id_symptoms', 'Which of these are there?', [s('cough', 'Cough'), s('throat', 'Sore throat'), s('diarrhoea', 'Diarrhoea'), s('vomiting', 'Vomiting'), s('rash', 'A rash'), s('jaundice', 'Yellow skin or eyes'), HICBIRI()]),
      eh('id_travel', 'Has there been a trip to another country or region in the last month?', 'Where, and when?'),
      eh('id_animal', 'Has there been a recent bite or scratch from an animal?', NE_ZAMAN),
      eh('id_contact', 'Has anyone nearby been unwell with something similar?'),
      tek('id_vaccines', 'Are the vaccinations up to date (as far as you know)?', EVET_HAYIR_BILMIYORUM()),
    ],
  },
  gastroenterology: {
    baslik: 'About the digestive system',
    sorular: [
      cok('ga_symptoms', 'Which of these trouble you?', [s('tummy', 'Stomach or belly pain'), s('heartburn', 'Heartburn'), s('sick', 'Nausea or vomiting'), s('bloating', 'Bloating'), s('diarrhoea', 'Diarrhoea'), s('constipation', 'Constipation'), HICBIRI()]),
      kisa('ga_where', 'In which part of the belly is the pain?'),
      tek('ga_blood', 'Has there been blood in the stools, or black stools?', [s('no', 'No'), s('yes', 'Yes'), s('unsure', 'Not sure')]),
      eh('ga_swallowing', 'Is swallowing difficult?'),
      eh('ga_endoscopy', 'Has there been an endoscopy before (gastroscopy, colonoscopy)?', TETKIK),
      eh('ga_diagnosis', 'Has a condition of the stomach, bowel or liver been found?', NE),
    ],
  },
  'general-surgery': {
    baslik: 'For the surgeon',
    sorular: [
      cok('gs_symptoms', 'Which of these are there?', [s('tummy', 'Stomach or belly pain'), s('swelling', 'A swelling or a bulge'), s('sick', 'Nausea or vomiting'), s('fever', 'Fever'), s('bowel', 'A change in the stools'), HICBIRI()]),
      kisa('gs_where', 'Where is the pain or the swelling?'),
      eh('gs_bleeding', 'Has a tendency to bleed or a clotting problem been found?'),
      eh('gs_blood_thinner', 'Are any blood-thinning medicines taken?', ILAC_ADI),
      eh('gs_complications', 'Were there problems after earlier operations?', NE),
    ],
  },
  'thoracic-surgery': {
    baslik: 'For the chest surgeon',
    sorular: [
      cok('ts_symptoms', 'Which of these trouble you?', [s('pain', 'Chest pain'), s('breathless', 'Shortness of breath'), s('cough', 'Cough'), s('blood', 'Blood in the phlegm'), s('weight', 'Weight loss'), HICBIRI()]),
      eh('ts_imaging', 'Has there been a chest X-ray or CT scan?', TETKIK),
      eh('ts_operation', 'Has there been an operation on the lungs or chest?', NE_ZAMAN),
      eh('ts_breathing_test', 'Has there been a breathing test (spirometry)?'),
      kisa('ts_smoking', 'If you have smoked: for how many years, and about how much a day?', { kime: 'yetiskin' }),
    ],
  },
  'respiratory-medicine': {
    baslik: 'About breathing',
    sorular: [
      cok('rm_symptoms', 'Which of these trouble you?', [s('cough', 'Cough'), s('sputum', 'Phlegm'), s('breathless', 'Shortness of breath'), s('wheeze', 'Wheezing'), s('pain', 'Chest pain'), s('night_sweats', 'Night sweats'), HICBIRI()]),
      tek('rm_when', 'When does shortness of breath come on?', [s('never', 'It does not'), s('effort', 'On effort'), s('rest', 'At rest too')]),
      tek('rm_blood', 'Has there been blood in the phlegm?', [s('no', 'No'), s('yes', 'Yes'), s('unsure', 'Not sure')]),
      cok('rm_diagnosis', 'Which condition has been found?', [s('asthma', 'Asthma'), s('chronic', 'Chronic bronchitis or a long-term lung condition'), s('pneumonia', 'Pneumonia in the past'), s('tb', 'Tuberculosis'), { anahtar: 'none', ad: 'None has been found', tek: true }]),
      eh('rm_inhaler', 'Is an inhaler used?', ILAC_ADI),
      kisa('rm_smoking', 'If you have smoked: for how many years, and about how much a day?', { kime: 'yetiskin' }),
    ],
  },
  ophthalmology: {
    baslik: 'About the eyes',
    sorular: [
      cok('op_symptoms', 'Which of these trouble you?', [s('blurred', 'Blurred vision'), s('red', 'A red eye'), s('pain', 'Eye pain'), s('watering', 'Itching or watering'), s('floaters', 'Spots or flashes in front of the eyes'), s('double', 'Double vision'), HICBIRI()]),
      tek('op_distance', 'At what distance is it hard to see?', [s('near', 'Near'), s('far', 'Far'), s('both', 'Both near and far'), s('none', 'There is no difficulty')]),
      tek('op_glasses', 'Are glasses or contact lenses worn?', [s('no', 'No'), s('glasses', 'Glasses'), s('lenses', 'Contact lenses'), s('both', 'Both')]),
      eh('op_diagnosis', 'Has an eye condition been found?', NE),
      eh('op_operation', 'Has there been an operation or laser treatment on the eyes?', NE_ZAMAN),
      eh('op_family', 'Are there eye conditions in the family?', KIMDE),
    ],
  },
  'obstetrics-gynaecology': {
    baslik: 'Women\'s health',
    sorular: [
      cok('og_symptoms', 'Which of these trouble you?', [s('pain', 'Pain low in the belly'), s('cycle', 'Irregular periods'), s('discharge', 'Unusual discharge'), s('bleeding', 'Bleeding between periods'), s('itch', 'Itching or burning'), HICBIRI()]),
      gun('og_last_period', 'First day of the last period'),
      tek('og_pregnant', 'Is there a pregnancy now?', [s('no', 'No'), s('yes', 'Yes'), s('possible', 'Possibly')]),
      sayi('og_weeks', 'If there is a pregnancy: how many weeks?', HAFTA, 1, 45),
      sayi('og_pregnancies', 'How many pregnancies have there been in all?', KEZ, 0, 25),
      sayi('og_births', 'How many births have there been?', KEZ, 0, 20),
      eh('og_diagnosis', 'Has a gynaecological condition been found?', NE),
      kisa('og_contraception', 'Method of contraception (if any)'),
    ],
  },
}
