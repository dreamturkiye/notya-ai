/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: THE CORE QUESTIONS of the intake form — what every patient is asked,
 * whatever the doctor's role. The role's own questions follow them (./roller*.ts).
 *
 * MACHINE-WRITTEN. AWAITS A CLINICIAN AND A NATIVE READER IN EACH COUNTRY. No clinician practising in any of the
 * five countries has read these questions. PATIENT-FACING: a patient reads them alone, on a phone
 * (docs/COUNTRY-PACK-CHECKLIST.md C13, C14, E11).
 *
 * Written in English from the kit's question types (lib/ulke/intake/tipler.ts) and from the TOPICS a core form
 * covers. No text of another country's form is copied or translated, and what belongs to one country is not here:
 * no identity number of any kind (and never a Social Security number), no payer or insurance section, no consent
 * wording of another country's law.
 *
 * NOT ASKED AGAIN: name, date of birth, sex and phone. The doctor recorded them when the patient's file was made.
 *
 * THE GUARDIAN FORM (a patient below the pack's guardian age, in every role) begins with WHO IS FILLING IT IN. The
 * parents' situation is a question of the guardian form only. An adult's smoking and alcohol are not asked about a
 * child; smoking at home is asked instead. A question that speaks to the reader has a second wording for a parent
 * or guardian (`veliMetni`).
 *
 * NO REFERENCE CONTENT. No drug is named, no schedule, no normal value. Medicines and allergies are free text. The
 * short list of long-term conditions names broad groups in everyday words; it is a machine's choice of what to
 * offer and waits for a clinician like everything else (./yuvalar.ts lists what was deliberately left out).
 *
 * UNITS. Height, weight and temperature are asked in the PACK's units (`uygulama.birimler`); the unit is never
 * written into a question, and the form's screen always shows it beside the field.
 */
import { cok, eh, HICBIRI, kisa, NE_ZAMAN, olcu, s, tek, uzun, type HamBolum } from './yardimci'

export const EN_CEKIRDEK_BOLUMLER: readonly HamBolum[] = [
  // ── the guardian form begins here ──
  {
    anahtar: 'who_fills_in',
    kime: 'cocuk',
    baslik: 'Who is filling in this form',
    sorular: [
      tek('guardian_relation', 'What is your relationship to the child?', [
        s('mother', 'Mother'),
        s('father', 'Father'),
        s('guardian', 'Legal guardian'),
        s('other', 'Another close person'),
      ], { zorunlu: true }),
      kisa('guardian_name', 'Your full name', { zorunlu: true }),
      kisa('guardian_phone', 'A phone number where you can be reached'),
      tek('parents_situation', 'The child\'s parents', [
        s('together', 'Live together'),
        s('apart', 'Live apart'),
        s('one_parent', 'One parent brings up the child'),
        s('bereaved', 'A parent has died'),
        s('not_say', 'I would rather not say'),
      ]),
    ],
  },
  {
    anahtar: 'reason',
    baslik: 'Reason for the visit',
    sorular: [
      uzun('reason_text', 'Why are you coming to see the doctor?', { zorunlu: true, veliMetni: 'Why are you bringing the child to see the doctor?' }),
      tek('reason_since', 'How long has the problem been there?', [
        s('today', 'Since today'),
        s('days', 'A few days'),
        s('weeks', 'A few weeks'),
        s('months', 'A few months'),
        s('year', 'More than a year'),
        s('no_complaint', 'No complaint: a check-up'),
      ]),
    ],
  },
  {
    anahtar: 'health',
    baslik: 'About your health',
    veliBasligi: 'About the child\'s health',
    sorular: [
      cok('long_term', 'Do you have any long-term conditions a doctor has told you about?', [
        s('diabetes', 'Diabetes'),
        s('blood_pressure', 'High blood pressure'),
        s('heart', 'A heart condition'),
        s('lungs', 'Asthma or a long-term lung condition'),
        s('kidney', 'A kidney condition'),
        s('thyroid', 'A thyroid condition'),
        s('cancer', 'Cancer'),
        s('other', 'Another condition'),
        HICBIRI(),
      ], { zorunlu: true, veliMetni: 'Does the child have any long-term conditions a doctor has told you about?' }),
      kisa('long_term_other', 'If there is another condition, write which'),
      eh('operations', 'Have you had any operations?', 'Which operation, and in which year?', { veliMetni: 'Has the child had any operations?' }),
      eh('hospital_stays', 'Have you ever stayed in hospital?', NE_ZAMAN, { veliMetni: 'Has the child ever stayed in hospital?' }),
      eh('medicines', 'Do you take any medicines regularly?', 'Names of the medicines and how you take them (as far as you know)', { zorunlu: true, veliMetni: 'Does the child take any medicines regularly?' }),
      eh('allergies', 'Are you allergic to any medicine, food or anything else?', 'What to, and what happens?', { zorunlu: true, veliMetni: 'Is the child allergic to any medicine, food or anything else?' }),
      eh('family_conditions', 'Have any of your close relatives (parents, brothers, sisters) had a serious condition?', 'Who, and which condition?', { veliMetni: 'Have any of the child\'s close relatives (parents, brothers, sisters) had a serious condition?' }),
    ],
  },
  {
    anahtar: 'lifestyle',
    baslik: 'Lifestyle',
    sorular: [
      tek('smoking', 'Do you smoke?', [
        s('no', 'No, I do not smoke'),
        s('yes', 'Yes, I smoke'),
        s('stopped', 'I used to smoke and have stopped'),
      ], { kime: 'yetiskin' }),
      tek('alcohol', 'Do you drink alcohol?', [
        s('no', 'I do not drink alcohol'),
        s('sometimes', 'Sometimes'),
        s('regularly', 'Regularly'),
      ], { kime: 'yetiskin' }),
      tek('pregnancy', 'Pregnancy or breastfeeding (if this applies to you)', [
        s('not_pregnant', 'Not pregnant'),
        s('possible', 'Possibly pregnant'),
        s('pregnant', 'Pregnant'),
        s('breastfeeding', 'Breastfeeding'),
        s('not_applicable', 'This question does not apply to me'),
      ], { kime: 'yetiskin', cinsiyet: 'female' }),
      eh('smoking_at_home', 'Does anyone smoke at home?', undefined, { kime: 'cocuk' }),
    ],
  },
  {
    anahtar: 'measurements',
    baslik: 'Measurements (if you know them)',
    sorular: [
      olcu('height', 'Your height', 'boy', { veliMetni: 'The child\'s height' }),
      olcu('weight', 'Your weight', 'agirlik', { veliMetni: 'The child\'s weight' }),
      olcu('temperature', 'If you took your temperature today, what was it?', 'sicaklik', { veliMetni: 'If you took the child\'s temperature today, what was it?' }),
    ],
  },
  {
    anahtar: 'contact_person',
    kime: 'yetiskin',
    baslik: 'Someone we may contact if needed (optional)',
    sorular: [
      kisa('contact_name', 'Full name'),
      kisa('contact_relation', 'Their relationship to you'),
      kisa('contact_phone', 'Phone number'),
    ],
  },
]
