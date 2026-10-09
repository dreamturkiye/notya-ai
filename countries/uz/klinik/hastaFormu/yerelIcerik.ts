/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: WHAT THE INTAKE FORM DOES NOT ASK, AND WHY — the marked slots.
 *
 * A machine may write "which medicines do you take?" It may not write a drug list, a vaccination calendar, a
 * screening programme, a validated questionnaire, a triage rule or an instruction to a patient. Wherever a form of
 * the structural reference (the Turkish product's) holds such content, the Uzbek form holds a SLOT instead:
 * empty (`icerik: null`), switched off (`acik: false`), with a plain description of what is missing and who must
 * supply it. No question reads a slot today. Each slot is a row of "Needs local content" in
 * docs/COUNTRY-PACK-UZBEKISTAN.md; a local clinician supplies the content and signs it, and only then does a
 * question built from it join a role's set (and the set's version stamp changes).
 *
 * Same shape as the slots of the note templates (../notSablonlari.ts → UZ_YEREL_ICERIK).
 */
export type UzFormYuvasi = {
  anahtar: string
  /** Always false today: no question is built from a slot until a local source has supplied and signed its content. */
  acik: false
  /** Always null today: the pack holds no reference content. */
  icerik: null
  /** What is missing, in plain English. For documents and reviewers; never shown on a screen. */
  eksik: string
  /** What the form asks today instead — or that it asks nothing. */
  bugun: string
  kimden: 'a local clinician' | 'a lawyer' | 'the owner, with a local source'
  /** The roles whose form would use it; 'core' = every form. */
  roller: readonly string[]
}

const yuva = (anahtar: string, roller: readonly string[], eksik: string, bugun: string, kimden: UzFormYuvasi['kimden'] = 'a local clinician'): UzFormYuvasi => ({ anahtar, acik: false, icerik: null, eksik, bugun, kimden, roller })

export const UZ_FORM_YEREL_ICERIK: readonly UzFormYuvasi[] = [
  yuva('red_flag_checklists', ['acil-tip', 'kardiyoloji', 'noroloji', 'dahiliye', 'genel-cerrahi', 'ortopedi', 'dermatoloji', 'kulak-burun-bogaz', 'goz-hastaliklari', 'kadin-hastaliklari-dogum', 'uroloji', 'endokrinoloji', 'gastroenteroloji', 'nefroloji', 'romatoloji', 'onkoloji', 'gogus-hastaliklari', 'gogus-cerrahisi', 'beyin-cerrahisi', 'kalp-damar-cerrahisi', 'enfeksiyon-hastaliklari', 'fizik-tedavi', 'spor-hekimligi', 'plastik-cerrahi', 'anestezi', 'radyoloji', 'psikiyatri'],
    'Per role: the list of "red flag" symptoms a patient ticks before a visit, and the sentence that tells a patient who ticks one what to do now (which service to call, and its number). A triage rule and an instruction to a patient: both are clinical content, and the number is local.',
    'Nothing. No question of any role tells a patient to seek emergency care; the patient\'s page says only that it is not for emergencies (the portal\'s own sentence).'),
  yuva('self_harm_screening', ['psikiyatri', 'klinik-psikolog'],
    'The safety (self-harm) screening question in locally validated Uzbek and Russian wording, and the clinic\'s procedure for a "yes" given on a form nobody is watching (who is told, how fast).',
    'Nothing. The psychiatry and psychology sets ask about mood, sleep and what is hardest now, in free text; no question asks about self-harm.'),
  yuva('validated_questionnaires', ['psikiyatri', 'klinik-psikolog', 'uroloji', 'dermatoloji', 'romatoloji', 'fizik-tedavi', 'fizyoterapi', 'ergoterapi', 'noroloji'],
    'Validated questionnaires and scores in Uzbek and Russian versions accepted locally (mood and anxiety scales, urinary symptom score, skin and joint activity indices, functional independence scales).',
    'Plain questions only. Pain is asked as a number from 0 to 10 with its two ends described in words; nothing is scored or summed.'),
  yuva('vaccination_checklist', ['pediatri', 'cocuk-cerrahisi', 'aile-hekimligi', 'enfeksiyon-hastaliklari'],
    'The national vaccination calendar as a check-list (which vaccine at which age), so that a parent can tick what was given.',
    'One question: "were the vaccinations given on time, as far as you know?" — yes, no, I do not know. Paediatrics adds a line asking to bring the vaccination record.'),
  yuva('development_milestones', ['pediatri'],
    'The developmental milestone check-list in local use, by age.',
    'One yes/no question: whether the parent is worried about the child\'s development, with a free-text line.'),
  yuva('screening_programme', ['aile-hekimligi', 'kadin-hastaliklari-dogum', 'longevity', 'dahiliye'],
    'The national screening and check-up programme by age and sex (which tests, how often), to ask which of them the patient has had.',
    'Free text: "tests or check-ups in the last year" and "when was the last comprehensive check-up". No test is named as due.'),
  yuva('antenatal_schedule', ['kadin-hastaliklari-dogum'],
    'The antenatal visit and screening schedule of the national protocol, and the fields of the mandatory pregnancy record.',
    'The week of pregnancy, the number of pregnancies and births, the first day of the last period. Nothing is derived from them.'),
  yuva('preoperative_instructions', ['anestezi', 'genel-cerrahi', 'cocuk-cerrahisi', 'plastik-cerrahi', 'estetik-cerrahi', 'sac-ekimi', 'beyin-cerrahisi', 'gogus-cerrahisi', 'kalp-damar-cerrahisi'],
    'Pre-operative instructions a form would ask the patient to confirm (fasting times, which medicines to stop and when) and the consent form required by law.',
    'Nothing is instructed and nothing is confirmed. The sets ask about earlier anaesthesia, bleeding tendency and blood-thinning medicines (name as free text).'),
  yuva('imaging_safety_checklist', ['radyoloji'],
    'The safety check-list before imaging with contrast or a magnet, as used locally (which implants and conditions, in which wording), and what a "yes" means for the examination.',
    'Four plain yes/no questions with a free-text line: an earlier reaction to contrast, metal or an implanted device, a known kidney problem, fear of closed spaces. The form decides nothing from them.'),
  yuva('medicine_lists', ['core', 'kardiyoloji', 'endokrinoloji', 'gogus-hastaliklari', 'anestezi', 'genel-cerrahi', 'kalp-damar-cerrahisi', 'dermatoloji'],
    'Medicines registered in Uzbekistan with their local names, to offer as choices (blood thinners, inhalers, diabetes and heart medicines).',
    'Free text everywhere: the patient writes the name as they know it. No medicine, group brand or dose is named.'),
  yuva('registered_procedures', ['medikal-estetik', 'estetik-cerrahi', 'sac-ekimi', 'klinik-dermatoloji'],
    'Aesthetic procedures, products and devices registered in Uzbekistan, to offer as choices.',
    'Free text: "which procedure and when". No product or device is named.'),
  yuva('sports_clearance', ['spor-hekimligi'],
    'The pre-participation medical clearance form required for athletes, and the anti-doping declaration.',
    'The sport, the reason for the visit, injuries in the last year, symptoms during exercise, an earlier heart examination.'),
  yuva('hearing_programme', ['odyoloji', 'kulak-burun-bogaz'],
    'The newborn hearing screening programme and the hearing-loss grading in local use.',
    'Which ear, how the hearing fell, noise at work, a hearing aid. Nothing is graded.'),
  yuva('nutrition_reference', ['diyetisyen'],
    'Nutrient reference intakes and food composition tables for Uzbekistan, and locally named diets to offer as choices.',
    'Meals and glasses of water a day as numbers, the diet followed and foods not eaten as free text.'),
  yuva('blood_group_notation', ['core'],
    'Whether a patient form should ask the blood group, and in which notation it is written locally.',
    'Not asked.'),
  yuva('payer_and_insurance', ['core'],
    'Whether the form should ask who pays (a state programme, an employer, an insurer) and which numbers that needs. The payer section of the Turkish form belongs to that country and was not carried over.',
    'Not asked. The form asks for no identity, policy or insurance number.', 'the owner, with a local source'),
  yuva('consent_sentence', ['core'],
    'The consent sentence shown before the first question, and the notice a parent or guardian reads, in wording a lawyer in Uzbekistan has approved (checklist I1, I2); and whether a guardian\'s identity must be confirmed.',
    'A machine-written draft sentence, stamped "uz-taslak" and marked as not read by a lawyer; the guardian form asks the guardian\'s name, relation and phone, and confirms nothing.', 'a lawyer'),
  yuva('scope_of_practice', ['fizyoterapi', 'klinik-psikolog', 'diyetisyen', 'ergoterapi', 'odyoloji'],
    'What each allied profession may ask, record and decide without a doctor under Uzbek law.',
    'The sets ask about the complaint, daily life and a doctor\'s referral; none asks for a diagnosis to be made.', 'a lawyer'),
]
