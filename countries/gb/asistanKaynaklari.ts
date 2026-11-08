/**
 * ULKE-BRANS-DERINLIK-2026-11 — the United Kingdom's own practice sources for EACH ROLE this pack offers, as the block the
 * live assistant is given (./canli.ts → `kaynakBlogu`, read by the kit's prompt, lib/ulke/asistan/istem.ts). Before this
 * file the block was null for every role (AU-ASSIST-ON-02): a UK cardiologist's assistant was told nothing about which
 * bodies govern UK practice. Türkiye carries the same thing as data on each specialty's persona
 * (lib/asistan/turkishSpecialtyRefs.ts on main: national binding sources first, international texts for depth only);
 * Australia carries it per role (countries/au/asistan/kaynaklar.ts). Shown on no screen, as in both.
 *
 * VERIFIED 2026-11-08, EVERY BODY, BY OPENING ITS OWN OR A REGULATOR'S PAGE IN THIS SESSION:
 *   - the medical royal colleges and faculties: Academy of Medical Royal Colleges, "Academy members",
 *     aomrc.org.uk/about-us/academy-members (23 members, names as written there — note "College of Sexual & Reproductive
 *     Health", the former faculty's current name);
 *   - the specialties themselves: Postgraduate Medical Education and Training Order of Council 2010, Schedule
 *     (legislation.gov.uk/uksi/2010/473/schedule);
 *   - HCPC and its protected titles: hcpc-uk.org/about-us/who-we-regulate/the-professions/;
 *   - NICE and the BNF / BNFC (nice.org.uk; pharmaceuticalpress.com "BNF and BNFC"); the Green Book (gov.uk collection
 *     "Immunisation against infectious disease (the Green Book)"); BSACI (bsaci.org, guidelines); BASHH (bashh.org,
 *     guidelines); British Society for Haematology (b-s-h.org.uk, guidelines); BAOMS (baoms.org.uk); RCSLT (rcslt.org);
 *     Royal College of Podiatry (rcpod.org.uk).
 * NOT ADDED, NOT VERIFIED IN THIS SESSION (listed so nobody adds them from memory): SIGN, the British Geriatrics Society,
 * the Association for Palliative Medicine, the British Association of Audiovestibular Physicians, the Chartered Society
 * of Physiotherapy, the British Dietetic Association, the Royal College of Occupational Therapists, the British
 * Psychological Society, the British Academy of Audiology, any textbook. No book is named: none was verified.
 *
 * A name is a name: no guideline is quoted, no number or edition is given, nothing is copied. On a conflict the UK body
 * wins over any international text. Not reviewed by a UK clinician (OPEN-COMMITMENTS ULKE-BRANS-KLINISYEN-01).
 */

const NICE = 'National Institute for Health and Care Excellence (NICE) guidance'
const BNF = 'British National Formulary (BNF)'
const BNFC = 'British National Formulary for Children (BNFC)'
const GMC = 'General Medical Council professional guidance'
const GREEN = 'Immunisation against infectious disease (the Green Book), UK Health Security Agency'
const HCPC = 'Health and Care Professions Council standards (protected title)'
const RCP = 'Royal College of Physicians'
const RCPE = 'Royal College of Physicians of Edinburgh'
const RCSENG = 'Royal College of Surgeons of England'
const RCSED = 'Royal College of Surgeons of Edinburgh'
const RCPSG = 'Royal College of Physicians & Surgeons of Glasgow'
const RCPSYCH = 'Royal College of Psychiatrists'
const RCR = 'Royal College of Radiologists'
const RCPATH = 'Royal College of Pathologists'

const hekim = (...ozel: string[]): readonly string[] => [...ozel, NICE, BNF, GMC]
const cerrah = (...ozel: string[]): readonly string[] => hekim(...ozel, RCSENG, RCSED)
const hekimDahiliye = (...ozel: string[]): readonly string[] => hekim(...ozel, RCP, RCPE)

/** Role key → the UK bodies that govern its practice, the role's own first. */
export const GB_ASISTAN_KAYNAKLARI: Readonly<Record<string, readonly string[]>> = {
  'emergency-medicine': hekim('Royal College of Emergency Medicine'),
  'family-medicine': hekim('Royal College of General Practitioners', GREEN),
  anaesthesia: hekim('Royal College of Anaesthetists'),
  neurosurgery: cerrah(),
  'paediatric-surgery': cerrah('Royal College of Paediatrics and Child Health', BNFC),
  'internal-medicine': hekimDahiliye(RCPSG),
  dermatology: hekimDahiliye(),
  endocrinology: hekimDahiliye(),
  'infectious-diseases': hekimDahiliye(GREEN),
  gastroenterology: hekimDahiliye(),
  'general-surgery': cerrah(RCPSG),
  'thoracic-surgery': cerrah(),
  'respiratory-medicine': hekimDahiliye(),
  ophthalmology: hekim('Royal College of Ophthalmologists'),
  'obstetrics-gynaecology': hekim('Royal College of Obstetricians and Gynaecologists'),
  'cardiovascular-surgery': cerrah(),
  cardiology: hekimDahiliye(),
  otolaryngology: cerrah(),
  nephrology: hekimDahiliye(),
  neurology: hekimDahiliye(),
  oncology: hekimDahiliye(),
  'clinical-oncology': hekim(RCR),
  orthopaedics: cerrah(),
  paediatrics: ['Royal College of Paediatrics and Child Health', GREEN, BNFC, NICE, GMC],
  'plastic-surgery': cerrah(),
  psychiatry: hekim(RCPSYCH),
  radiology: hekim(RCR),
  rheumatology: hekimDahiliye(),
  urology: cerrah(),
  'sports-medicine': hekim('Faculty of Sport and Exercise Medicine UK'),
  'rehabilitation-medicine': hekimDahiliye(),
  'geriatric-medicine': hekimDahiliye(),
  haematology: hekim('British Society for Haematology guidelines', RCPATH, RCP),
  allergy: hekim('British Society for Allergy and Clinical Immunology (BSACI) guidelines', RCP),
  'genito-urinary-medicine': hekim('British Association for Sexual Health and HIV (BASHH) guidelines', RCP),
  'community-sexual-reproductive-health': hekim('College of Sexual & Reproductive Health', 'British Association for Sexual Health and HIV (BASHH) guidelines'),
  'occupational-medicine': hekim('Faculty of Occupational Medicine'),
  'child-adolescent-psychiatry': [RCPSYCH, 'Royal College of Paediatrics and Child Health', BNFC, NICE, GMC],
  'old-age-psychiatry': hekim(RCPSYCH),
  'oral-maxillofacial-surgery': cerrah('British Association of Oral and Maxillofacial Surgeons'),
  'palliative-medicine': hekimDahiliye(),
  'audio-vestibular-medicine': hekimDahiliye(),
  'hair-transplant': cerrah(),
  'aesthetic-surgery': cerrah(),
  'aesthetic-medicine': hekim(),
  longevity: hekim('Royal College of General Practitioners'),
  physiotherapy: [HCPC, NICE],
  'clinical-psychology': [HCPC, NICE],
  dietetics: [HCPC, NICE, BNF],
  'occupational-therapy': [HCPC, NICE],
  audiology: ['Health and Care Professions Council (hearing aid dispenser is the protected title)', NICE],
  podiatry: [HCPC, 'Royal College of Podiatry', NICE],
  'speech-language-therapy': [HCPC, 'Royal College of Speech and Language Therapists', NICE],
}

/** The prompt block for one role, or null for a key that is not one of this pack's roles. */
export function gbAsistanKaynakBlogu(rol: string): string | null {
  const liste = Object.prototype.hasOwnProperty.call(GB_ASISTAN_KAYNAKLARI, rol) ? GB_ASISTAN_KAYNAKLARI[rol] : null
  if (!liste) return null
  return [
    '=== UNITED KINGDOM PRACTICE SOURCES (BINDING) ===',
    'For clinical decisions, doses, work-up and referral, use these UK sources first.',
    "Do not put another country's guideline in place of a UK one; on a conflict the UK source wins over any international text.",
    'Name a source only when you are sure of it. Never quote a guideline number, edition or recommendation from memory: send the clinician to the source.',
    ...liste.map((x) => `• ${x}`),
  ].join('\n')
}
