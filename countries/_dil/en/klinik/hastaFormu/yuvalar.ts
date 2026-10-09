/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: WHAT THE INTAKE FORM DOES NOT ASK, AND WHY — the marked slots.
 *
 * A machine may write "which medicines do you take?" It may not write a drug list, a vaccination schedule, a
 * screening programme, a validated questionnaire, a triage rule or an instruction to a patient. Wherever a form
 * would hold such content, the English packs hold a SLOT instead: empty (`icerik: null`), switched off
 * (`acik: false`), with a plain description of what is missing and who must supply it. No question reads a slot.
 * Each slot is a row of "Needs local content" in each country's record (docs/COUNTRY-PACK-<COUNTRY>.md); a clinician
 * of that country supplies the content and signs it, and only then does a question built from it join a role's set
 * (and the set's version stamp changes).
 *
 * PUBLISHED QUESTIONNAIRES IN THEIR ORIGINAL ENGLISH WORDING are slots too, for a second reason: their wording
 * belongs to their authors or to a rights holder and may be under licence. No item of any of them is reproduced
 * anywhere in this set; the slot names the instrument and the licence question.
 *
 * The same eighteen slots in every English-speaking country; `ulke` is the country's name, put into the sentences
 * that speak of its law or its register.
 */
import type { EnRol } from '../roller'

export type EnFormYuvasi = {
  anahtar: string
  /** Always false today: no question is built from a slot until its content has been supplied and signed. */
  acik: false
  /** Always null today: the set and the packs hold no reference content. */
  icerik: null
  /** What is missing, in plain English. For documents and reviewers; never shown on a screen. */
  eksik: string
  /** What the form asks today instead — or that it asks nothing. */
  bugun: string
  kimden: 'a local clinical lead' | 'a lawyer' | 'the owner, with a local source' | 'the rights holder of each questionnaire, through the owner'
  /** The roles whose form would use it; 'core' = every form. */
  roller: readonly (EnRol | 'core')[]
}

type Kimden = EnFormYuvasi['kimden']
const yuva = (anahtar: string, roller: EnFormYuvasi['roller'], eksik: string, bugun: string, kimden: Kimden = 'a local clinical lead'): EnFormYuvasi => ({ anahtar, acik: false, icerik: null, eksik, bugun, kimden, roller })

export function enFormYuvalari(ulke: string): readonly EnFormYuvasi[] {
  return [
    yuva('red_flag_checklists', ['emergency-medicine', 'cardiology', 'neurology', 'internal-medicine', 'general-surgery', 'orthopaedics', 'dermatology', 'otolaryngology', 'ophthalmology', 'obstetrics-gynaecology', 'urology', 'endocrinology', 'gastroenterology', 'nephrology', 'rheumatology', 'oncology', 'respiratory-medicine', 'thoracic-surgery', 'neurosurgery', 'cardiovascular-surgery', 'infectious-diseases', 'rehabilitation-medicine', 'sports-medicine', 'plastic-surgery', 'anaesthesia', 'radiology', 'psychiatry'],
      `Per role: the list of "red flag" symptoms a patient selects before a visit, and the sentence that tells a patient who selects one what to do now (which service to call, and its number). A triage rule and an instruction to a patient: both are clinical content, and the service and its number are ${ulke}'s.`,
      'Nothing. No question of any role tells a patient to seek emergency care; the patient\'s page says only that it is not for emergencies (the portal\'s own sentence).'),
    yuva('self_harm_screening', ['psychiatry', 'clinical-psychology'],
      `The safety (self-harm) screening question in wording a clinician of ${ulke} has chosen, and the clinic's procedure for a "yes" given on a form nobody is watching (who is told, how fast, which crisis service is named).`,
      'Nothing. The psychiatry and psychology sets ask about mood, sleep and what is hardest now, in free text; no question asks about self-harm.'),
    yuva('validated_questionnaires', ['psychiatry', 'clinical-psychology', 'urology', 'dermatology', 'rheumatology', 'rehabilitation-medicine', 'physiotherapy', 'occupational-therapy', 'neurology', 'respiratory-medicine', 'paediatrics'],
      'Published questionnaires and scores (for example PHQ-9, GAD-7, IPSS, CAT, MIDAS, BASDAI, ODI, M-CHAT-R/F, DLQI). THE LICENCE QUESTION: each belongs to its authors or a rights holder; whether, on which terms and at what cost its original English wording may be shown inside a commercial product must be answered for each instrument before one item is displayed. None of their item wording is reproduced here.',
      'Plain questions only. Pain is asked as a number from 0 to 10 with its two ends described in words; nothing is scored or summed.', 'the rights holder of each questionnaire, through the owner'),
    yuva('vaccination_checklist', ['paediatrics', 'paediatric-surgery', 'family-medicine', 'infectious-diseases'],
      `The vaccination schedule of ${ulke} as a checklist (which vaccine at which age), so that a parent can mark what was given.`,
      'One question: "are the vaccinations up to date, as far as you know?" — yes, no, I do not know. Paediatrics adds a line asking to bring the vaccination record.'),
    yuva('development_milestones', ['paediatrics'],
      `The developmental milestone checklist in use in ${ulke}, by age.`,
      'One yes/no question: whether the parent is worried about the child\'s development, with a free-text line.'),
    yuva('screening_programme', ['family-medicine', 'obstetrics-gynaecology', 'longevity', 'internal-medicine'],
      `The screening and check-up programmes of ${ulke} by age and sex (which tests, how often), to ask which of them the patient has had.`,
      'Free text: "tests or check-ups in the last year" and "when was the last full check-up". No test is named as due.'),
    yuva('antenatal_schedule', ['obstetrics-gynaecology'],
      `The antenatal visit and screening schedule followed in ${ulke}, and the fields of any pregnancy record a clinic must keep.`,
      'The week of pregnancy, the number of pregnancies and births, the first day of the last period. Nothing is derived from them.'),
    yuva('preoperative_instructions', ['anaesthesia', 'general-surgery', 'paediatric-surgery', 'plastic-surgery', 'aesthetic-surgery', 'hair-transplant', 'neurosurgery', 'thoracic-surgery', 'cardiovascular-surgery'],
      `Pre-operative instructions a form would ask the patient to confirm (fasting times, which medicines to stop and when) and the consent form the law of ${ulke} requires.`,
      'Nothing is instructed and nothing is confirmed. The sets ask about earlier anaesthetics, a tendency to bleed and blood-thinning medicines (name as free text).'),
    yuva('imaging_safety_checklist', ['radiology'],
      `The safety checklist before imaging with contrast or a magnet, as used in ${ulke} (which implants and conditions, in which wording), and what a "yes" means for the examination.`,
      'Four plain yes/no questions with a free-text line: an earlier reaction to contrast, metal or a fitted device, a known kidney problem, fear of closed spaces. The form decides nothing from them.'),
    yuva('medicine_lists', ['core', 'cardiology', 'endocrinology', 'respiratory-medicine', 'anaesthesia', 'general-surgery', 'cardiovascular-surgery', 'dermatology'],
      `Medicines authorised in ${ulke} with the names they are sold under there, to offer as choices (blood thinners, inhalers, diabetes and heart medicines). A medicine has different names in different English-speaking countries; none is written by a machine.`,
      'Free text everywhere: the patient writes the name as they know it. No medicine, brand or dose is named.'),
    yuva('registered_procedures', ['aesthetic-medicine', 'aesthetic-surgery', 'hair-transplant', 'clinic-dermatology'],
      `Cosmetic procedures, products and devices authorised in ${ulke}, to offer as choices.`,
      'Free text: "which treatment, and when". No product or device is named.'),
    yuva('sports_clearance', ['sports-medicine'],
      `Any pre-participation medical clearance form required for athletes in ${ulke}, and the anti-doping declaration.`,
      'The sport, the reason for the visit, injuries in the last year, symptoms during exercise, an earlier heart examination.'),
    yuva('hearing_programme', ['audiology', 'otolaryngology'],
      `The newborn hearing screening programme of ${ulke} and the hearing-loss grading in use there.`,
      'Which ear, how the hearing went down, noise at work, a hearing aid. Nothing is graded.'),
    yuva('nutrition_reference', ['dietetics'],
      `Nutrient reference values and food composition tables of ${ulke}, and named diets to offer as choices.`,
      'Meals and glasses of water a day as numbers, the diet followed and foods not eaten as free text.'),
    yuva('birth_weight_unit', ['paediatrics'],
      `How a parent in ${ulke} states a birth weight (grams, or pounds and ounces), so that it can be asked as a number with its unit. The kit's weight measure is kilograms or decimal pounds and fits neither.`,
      'Free text: "weight at birth, with its unit, as you know it". Nothing is calculated from it.'),
    yuva('payer_and_insurance', ['core'],
      `Whether the form should ask who pays (a public programme, an employer, an insurer) and which numbers that needs in ${ulke}.`,
      'Not asked. The form asks for no identity, policy or insurance number of any kind.', 'the owner, with a local source'),
    yuva('consent_sentence', ['core'],
      `The consent sentence shown before the first question, and the notice a parent or guardian reads, in wording a lawyer in ${ulke} has approved (checklist I1, I2); and whether a guardian's identity must be confirmed.`,
      'A machine-written draft sentence, stamped as a draft and marked as not read by a lawyer; the guardian form asks the guardian\'s name, relationship and phone, and confirms nothing.', 'a lawyer'),
    yuva('scope_of_practice', ['physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology'],
      `What each allied profession may ask, record and decide without a doctor under the law of ${ulke}.`,
      'The sets ask about the problem, daily life and a doctor\'s referral; none asks for a diagnosis to be made.', 'a lawyer'),
  ]
}
