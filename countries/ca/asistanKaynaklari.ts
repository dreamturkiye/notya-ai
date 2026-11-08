/**
 * ULKE-BRANS-DERINLIK-2026-11 — Canada's own practice sources for EACH ROLE this pack offers, as the block the live
 * assistant is given (./canli.ts → `kaynakBlogu`, read by the kit's prompt, lib/ulke/asistan/istem.ts). Before this file
 * the block was null for every role (AU-ASSIST-ON-02). Türkiye carries the same thing as data on each specialty's persona
 * (lib/asistan/turkishSpecialtyRefs.ts on main), Australia per role (countries/au/asistan/kaynaklar.ts). Shown on no screen.
 *
 * VERIFIED 2026-11-08, EVERY BODY, BY OPENING ITS OWN PAGE (OR A SEARCH RESULT ON ITS OWN DOMAIN) IN THIS SESSION:
 *   - Royal College of Physicians and Surgeons of Canada (Specialty Committees Table B, news.royalcollege.ca);
 *   - College of Family Physicians of Canada, clinical practice guidelines (cfpc.ca);
 *   - Canadian Paediatric Society, position statements and practice points (cps.ca);
 *   - Society of Obstetricians and Gynaecologists of Canada, guidelines (sogc.org);
 *   - Canadian Thoracic Society (cts-sct.ca); Canadian Society of Allergy and Clinical Immunology (csaci.ca);
 *     Canadian Pain Society (canadianpainsociety.ca); Canadian Fertility and Andrology Society (cfas.ca);
 *     Canadian Society for Vascular Surgery, clinical guidelines;
 *   - Choosing Wisely Canada recommendations (choosingwiselycanada.org);
 *   - Canadian Immunization Guide and NACI statements, Public Health Agency of Canada (canada.ca);
 *   - Canadian Counselling and Psychotherapy Association, "The profession" (ccpa-accp.ca): who regulates the title by
 *     province; Canadian Psychological Association (cpa.ca).
 * NOT ADDED, NOT VERIFIED IN THIS SESSION (so nobody adds them from memory): the Canadian Cardiovascular Society, the
 * Canadian Geriatrics Society, the Canadian Hematology Society, Dietitians of Canada, the Canadian Association of
 * Occupational Therapists, the Canadian Physiotherapy Association, Speech-Language & Audiology Canada, any textbook.
 * Provincial and territorial regulators are named as a class (each province has its own), never one province's body for all.
 *
 * A name is a name: no guideline is quoted, no number or edition is given, nothing is copied. On a conflict the Canadian
 * source wins over any international text. Not reviewed by a Canadian clinician (OPEN-COMMITMENTS ULKE-BRANS-KLINISYEN-01).
 */

const RC = 'Royal College of Physicians and Surgeons of Canada (specialty standards)'
const CWC = 'Choosing Wisely Canada recommendations'
const CIG = 'Canadian Immunization Guide and NACI statements (Public Health Agency of Canada)'
const IL = 'The provincial or territorial medical regulatory authority where you practise'
const MESLEK = 'The provincial regulatory college for this profession where you practise (regulation differs by province)'
const CPS = 'Canadian Paediatric Society position statements'
const SOGC = 'Society of Obstetricians and Gynaecologists of Canada guidelines'

const uzman = (...ozel: string[]): readonly string[] => [...ozel, RC, CWC, IL]

/** Role key → the Canadian bodies that govern its practice, the role's own first. */
export const CA_ASISTAN_KAYNAKLARI: Readonly<Record<string, readonly string[]>> = {
  'emergency-medicine': uzman(),
  'family-medicine': ['College of Family Physicians of Canada clinical practice guidelines', CIG, CWC, IL],
  anaesthesia: uzman(),
  neurosurgery: uzman(),
  'paediatric-surgery': uzman(CPS),
  'internal-medicine': uzman(),
  dermatology: uzman(),
  endocrinology: uzman(),
  'infectious-diseases': uzman(CIG),
  gastroenterology: uzman(),
  'general-surgery': uzman(),
  'thoracic-surgery': uzman(),
  'respiratory-medicine': uzman('Canadian Thoracic Society guidelines'),
  ophthalmology: uzman(),
  'obstetrics-gynaecology': uzman(SOGC),
  'cardiovascular-surgery': uzman(),
  'vascular-surgery': uzman('Canadian Society for Vascular Surgery clinical guidelines'),
  cardiology: uzman(),
  otolaryngology: uzman(),
  nephrology: uzman(),
  neurology: uzman(),
  oncology: uzman(),
  orthopaedics: uzman(),
  paediatrics: [CPS, CIG, RC, CWC, IL],
  'plastic-surgery': uzman(),
  psychiatry: uzman(),
  radiology: uzman(),
  rheumatology: uzman(),
  urology: uzman(),
  'sports-medicine': uzman(),
  'rehabilitation-medicine': uzman(),
  'clinical-immunology-allergy': uzman('Canadian Society of Allergy and Clinical Immunology'),
  'geriatric-medicine': uzman(),
  hematology: uzman(),
  'pain-medicine': uzman('Canadian Pain Society'),
  'reproductive-endocrinology': uzman('Canadian Fertility and Andrology Society', SOGC),
  'hair-transplant': uzman(),
  'aesthetic-surgery': uzman(),
  'aesthetic-medicine': [IL, CWC],
  'clinic-dermatology': uzman(),
  longevity: ['College of Family Physicians of Canada clinical practice guidelines', CWC, IL],
  physiotherapy: [MESLEK, CWC],
  'clinical-psychology': ['Canadian Psychological Association', MESLEK, CWC],
  dietetics: [MESLEK, CWC],
  'occupational-therapy': [MESLEK, CWC],
  audiology: [MESLEK, CWC],
  psychotherapy: ['Canadian Counselling and Psychotherapy Association (who regulates the title, by province)', MESLEK, CWC],
}

/** The prompt block for one role, or null for a key that is not one of this pack's roles. */
export function caAsistanKaynakBlogu(rol: string): string | null {
  const liste = Object.prototype.hasOwnProperty.call(CA_ASISTAN_KAYNAKLARI, rol) ? CA_ASISTAN_KAYNAKLARI[rol] : null
  if (!liste) return null
  return [
    '=== CANADIAN PRACTICE SOURCES (BINDING) ===',
    'For clinical decisions, doses, work-up and referral, use these Canadian sources first, and the rules of the province where the clinician practises.',
    "Do not put another country's guideline in place of a Canadian one; on a conflict the Canadian source wins over any international text.",
    'Name a source only when you are sure of it. Never quote a guideline number, edition or recommendation from memory: send the clinician to the source.',
    ...liste.map((x) => `• ${x}`),
  ].join('\n')
}
