/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the intake questions of each role, third part (the five clinic
 * doctors and the five clinic allied professions, in the order of ../roller.ts). Same rules as ./roller1.ts.
 *
 * MACHINE-WRITTEN. AWAITS A CLINICIAN OR PROFESSIONAL OF EACH ROLE IN EACH COUNTRY. PATIENT-FACING.
 *
 * ALLIED PROFESSIONS. Their sets ask about the problem, daily life and a doctor's referral; none asks for a diagnosis
 * to be made. What each profession may ask, record and decide without a doctor is a question of each country's law
 * (./yuvalar.ts, `scope_of_practice`).
 */
import type { EnRol } from '../roller'
import { BARDAK, cok, eh, HICBIRI, KEZ, kisa, NE, NE_ZAMAN, PUAN, s, SAAT, sayi, tek, uzun, type HamRol } from './yardimci'

export const EN_ROL_SORULARI_3: Readonly<Partial<Record<EnRol, HamRol>>> = {
  'hair-transplant': {
    baslik: 'About hair and scalp',
    sorular: [
      tek('ht_since', 'For how long has the hair been thinning?', [s('year', 'Less than a year'), s('years', 'A few years'), s('long', 'Many years')]),
      cok('ht_where', 'Where is the hair thinning most?', [s('front', 'The hairline'), s('crown', 'The crown'), s('all', 'All over the head'), s('brow', 'Eyebrows or beard')]),
      cok('ht_scalp', 'Which of these are there on the scalp?', [s('itch', 'Itching'), s('dandruff', 'Dandruff'), s('sores', 'Redness or small sores'), HICBIRI()]),
      eh('ht_treatment', 'Has hair loss been treated before?', NE),
      eh('ht_before', 'Has there been a hair transplant before?', NE_ZAMAN),
      eh('ht_local', 'Have there been problems with a local anaesthetic?', NE),
      eh('ht_family', 'Is there hair loss in the family?', 'Who?'),
    ],
  },
  'aesthetic-surgery': {
    baslik: 'Before the cosmetic surgery consultation',
    sorular: [
      kisa('as_area', 'Which area is the consultation about?', { zorunlu: true }),
      uzun('as_hope', 'What do you hope for from the result?'),
      eh('as_before', 'Have there been cosmetic operations or procedures before?', NE_ZAMAN),
      eh('as_anaesthetic', 'Have there been problems during an anaesthetic before?', NE),
      eh('as_healing', 'Have wounds healed slowly, or left raised scars?'),
    ],
  },
  'aesthetic-medicine': {
    baslik: 'Before a cosmetic treatment',
    sorular: [
      uzun('am_interest', 'Which treatment or concern are you coming about?', { zorunlu: true }),
      eh('am_before', 'Have there been cosmetic treatments before?', 'Which treatment, and when?'),
      eh('am_reaction', 'Was there an unwanted reaction after earlier treatments?', NE),
      eh('am_skin', 'Is there a skin condition?', NE),
      eh('am_cold_sores', 'Do cold sores on the lips come often?'),
    ],
  },
  'clinic-dermatology': {
    baslik: 'About the skin',
    sorular: [
      kisa('cd_where', 'On which part of the body is the problem?'),
      cok('cd_symptoms', 'Which of these trouble you?', [s('itch', 'Itching'), s('rash', 'A rash'), s('acne', 'Acne'), s('marks', 'Dark or light marks'), s('dry', 'Dryness or scaling'), HICBIRI()]),
      eh('cd_before', 'Has this problem been treated before?', NE),
      uzun('cd_care', 'Products used for daily skin care'),
      tek('cd_sunscreen', 'Is sunscreen used?', [s('regular', 'Yes, regularly'), s('sometimes', 'Sometimes'), s('no', 'No')]),
    ],
  },
  longevity: {
    baslik: 'Lifestyle and prevention',
    sorular: [
      uzun('lg_goal', 'What is your main health goal?', { zorunlu: true, veliMetni: 'What is your main goal for the child\'s health?' }),
      tek('lg_activity', 'Physical activity', [s('little', 'Hardly any'), s('sometimes', 'Once or twice a week'), s('regular', 'Three times a week or more')]),
      sayi('lg_sleep', 'How many hours do you sleep at night, on average?', SAAT, 1, 16, { veliMetni: 'How many hours does the child sleep at night, on average?' }),
      tek('lg_stress', 'Level of stress in the last month', [s('low', 'Low'), s('medium', 'Medium'), s('high', 'High')]),
      uzun('lg_diet', 'Describe in a few words what you usually eat'),
      uzun('lg_supplements', 'Vitamins and supplements taken'),
      kisa('lg_checkup', 'When was the last full check-up?'),
    ],
  },
  physiotherapy: {
    baslik: 'Before physiotherapy',
    sorular: [
      kisa('pt_where', 'In which part of the body is the pain or the limitation?'),
      sayi('pt_pain', 'How strong is the pain? (0 = no pain, 10 = unbearable)', PUAN, 0, 10),
      tek('pt_limits', 'How much does the problem limit daily activities?', [s('none', 'It does not'), s('a_little', 'A little'), s('a_lot', 'A lot')]),
      eh('pt_referral', 'Is there a referral from a doctor?', 'Which diagnosis does the referral name?'),
      eh('pt_results', 'Do you have test results with you?', 'Which tests?'),
      kisa('pt_aids', 'Aids used (a brace, a prosthesis, a cane or walking stick, or other)'),
    ],
  },
  'clinical-psychology': {
    baslik: 'Before the first conversation',
    sorular: [
      cok('cp_areas', 'Which parts of life have been hard lately?', [s('family', 'Family'), s('work', 'Work or study'), s('relationships', 'Relationships with people close to you'), s('health', 'Health'), s('loss', 'A loss or a separation'), s('confidence', 'Confidence in yourself')]),
      eh('cp_before', 'Has a psychologist or psychotherapist been seen before?', NE_ZAMAN),
      tek('cp_sleep', 'Sleep', [s('usual', 'As usual'), s('hard', 'Hard to fall asleep'), s('more', 'More than usual')]),
      uzun('cp_hope', 'What do you hope for from the sessions?'),
    ],
  },
  dietetics: {
    baslik: 'About eating',
    sorular: [
      tek('di_purpose', 'Purpose of the visit', [s('lose', 'Losing weight'), s('gain', 'Gaining weight'), s('condition', 'A diet because of a condition'), s('healthy', 'Healthy eating')]),
      tek('di_weight', 'Has the weight changed in the last six months?', [s('no', 'It has not'), s('down', 'It has gone down'), s('up', 'It has gone up')]),
      sayi('di_meals', 'How many times a day do you eat?', KEZ, 1, 12, { veliMetni: 'How many times a day does the child eat?' }),
      sayi('di_water', 'About how many glasses of water are drunk in a day?', BARDAK, 0, 30),
      uzun('di_diet', 'A diet or eating restrictions that are followed'),
      uzun('di_avoided', 'Foods that are not eaten or not tolerated well'),
      tek('di_activity', 'Physical activity', [s('little', 'Hardly any'), s('sometimes', 'Once or twice a week'), s('regular', 'Three times a week or more')]),
    ],
  },
  'occupational-therapy': {
    baslik: 'About daily activities',
    sorular: [
      cok('oc_areas', 'Which daily activities are hard?', [s('dressing', 'Dressing'), s('eating', 'Eating'), s('washing', 'Washing and bathing'), s('hands', 'Writing or fine hand movements'), s('home', 'Housework'), s('work', 'Work or study'), HICBIRI()]),
      uzun('oc_diagnosis', 'If there is a diagnosis made by a doctor, write it'),
      eh('oc_help', 'Has there been rehabilitation or special support before?', NE),
      kisa('oc_aids', 'Aids used (a brace, a prosthesis, a cane or walking stick, or other)'),
      kisa('oc_occupation', 'Study or work (where, what kind)'),
    ],
  },
  audiology: {
    baslik: 'About hearing',
    sorular: [
      tek('au_ear', 'In which ear is the hearing reduced?', [s('right', 'The right'), s('left', 'The left'), s('both', 'Both'), s('none', 'It is not reduced')]),
      tek('au_how', 'How did the hearing go down?', [s('sudden', 'Suddenly, in the last few days'), s('gradual', 'Gradually'), s('none', 'It has not gone down')]),
      eh('au_tinnitus', 'Is there ringing in the ears?'),
      eh('au_balance', 'Is there dizziness or a problem with balance?'),
      eh('au_noise', 'Does work or a hobby involve loud noise?'),
      eh('au_aid', 'Is a hearing aid used?', 'Since when, and in which ear?'),
    ],
  },
}
