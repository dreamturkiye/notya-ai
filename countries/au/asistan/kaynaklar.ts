/**
 * Practice sources for each role this pack offers: the Australian authorities first, then the books.
 *
 * AU-KITAP-01 (2026-10-22). MIRRORS HOW TÜRKİYE CARRIES ITS REFERENCE BOOKS, read directly (not assumed):
 *   - Türkiye keeps them as DATA ON THE PERSONA of each specialty: lib/asistan/turkishSpecialtyRefs.ts holds
 *     `TURKISH_REFS` (the national practice authority, "binding") and `SECONDARY_TEXTBOOKS` (international texts,
 *     "depth only — never override TURKISH_REFS"); lib/asistan/specialistsCatalog.ts attaches both to every one of
 *     the 30 personas, lib/klinik/klinikTurkishRefs.ts does the same for the 10 Özel Branşlar. Related reference
 *     text also feeds the SOAP prompt (lib/doktor/soapUret.ts) and the textbook templates (lib/ai/textbookTemplates.ts).
 *   - They are USED in the assistant's system prompt (lib/asistan/personaEngine.ts, `specialtyKnowhowBlock`:
 *     "national sources first, international text for depth only; on conflict the national source wins").
 *   - They are SHOWN TO NO DOCTOR on any screen. (The AU home used to show them; AU-HOME-01 removed that card to
 *     match Türkiye's home. It must not come back.)
 * The Australian equivalent is the same: this file is the data on the role's assistant identity
 * (`AsistanKimligi.kaynaklar`, read through ../arayuz.ts) and `auAsistanKaynakBlogu` below is the prompt block that
 * the personaEngine counterpart writes. NOTHING CALLS THE BLOCK YET: the assistant in text and voice is not built for
 * any country but Türkiye (docs/COUNTRY-PACK-HOWTO.md), and the visit-note instructions (countries/_dil/en/klinik/
 * talimatlar.ts) tell the model to name no source, so they must not be given these lists.
 *
 * `yetki` = the Australian authorities (colleges, societies, boards, national guidelines). `kitaplar` = the books,
 * Australian / binational ANZ titles FIRST, then the international texts named for depth. The split is kept in
 * AU_KITAP_AYRIMI so a test can hold it. A title is a name. The book is not stored and none of it is copied.
 *
 * VERIFIED 2026-10-22 by opening the publisher, college or library page for the Australian / ANZ titles named
 * (Elsevier Australia, McGraw-Hill Australia, Wiley, ANZCA library guide, Therapeutic Guidelines, SHPA, RACGP,
 * Kidney Health Australia, Australian Psychological Society). International depth texts are the ones the previous
 * list already named. HONEST GAP: no Australian- or ANZ-authored textbook could be verified for ophthalmology,
 * otolaryngology, orthopaedics, plastic surgery, radiology, urology, cardio-thoracic surgery, vascular surgery,
 * radiation oncology, immunology and allergy, haematology, cosmetic surgery, aesthetic medicine, clinical
 * psychology and podiatry: those roles carry their Australian authorities and international texts only, and the
 * test holds that list so a verified title can be added in one place (docs/OPEN-COMMITMENTS.md, AU-KITAP-01).
 *
 * College names are the ones already opened for the link tiles on 2026-10-19 (./araclar/referanslar.ts).
 * Binational college names stay abbreviated, the same way the tiles write them. Hair transplantation is not its
 * own role (aesthetic medicine names it); longevity is not a role (wellness is named on general practice).
 */
import type { AsistanKaynaklari } from '@/lib/ulke/arayuz/tipler'
import type { Sunulan } from '../klinik/asistanAdlari'

// Short, plain caption text — never developer/compliance jargon rendered to a doctor.
const NOT = 'For reference only. Not used to answer questions, and not stored.'
const YETKI = 'Australian practice sources'
const KITAP = 'Books named for this role'
const KURUL = 'Medical Board of Australia codes and guidelines'
const RACP = 'Royal Australasian College of Physicians — adult medicine'
const OZ = 'This profession is self-regulated and is not on the Ahpra registration tile'

/** One role's books, split the way Türkiye splits its references: national first, international for depth only. */
export type AuKitapAyrimi = { readonly ulusal: readonly string[]; readonly uluslararasi: readonly string[] }

type Satir = { readonly yetki: readonly string[]; readonly ulusal: readonly string[]; readonly uluslararasi: readonly string[] }

const pbs = (rol: string) => `Pharmaceutical Benefits Scheme, for medicines in ${rol}`
const mbs = (rol: string) => `Medicare Benefits Schedule, for ${rol} services`
const s = (yetki: readonly string[], ulusal: readonly string[], uluslararasi: readonly string[]): Satir => ({ yetki, ulusal, uluslararasi })

const SATIRLAR: Record<Sunulan, Satir> = {
  'emergency-medicine': s(
    ['Australasian College for Emergency Medicine', 'Therapeutic Guidelines: Antibiotic', 'Australian Immunisation Handbook', pbs('emergency medicine')],
    ['Textbook of Adult Emergency Medicine (Cameron and colleagues)', 'Textbook of Paediatric Emergency Medicine (Cameron and colleagues)', 'Toxicology Handbook (Murray, Daly, Little, and Cadogan)'],
    ["Tintinalli's Emergency Medicine"],
  ),
  'family-medicine': s(
    ['Royal Australian College of General Practitioners', 'RACGP Guidelines for preventive activities in general practice', 'Wellness and healthspan reviews are general practice, not a specialist title', 'Australian Medicines Handbook', 'Therapeutic Guidelines', pbs('general practice')],
    ["Murtagh's General Practice", "Murtagh's Patient Education"],
    [],
  ),
  anaesthesia: s(
    ['ANZCA, the college for anaesthesia', 'ANZCA professional documents', 'ANZCA acute pain management: scientific evidence', pbs('anaesthesia')],
    ['Westmead Anaesthetic Manual', 'The First Year: What You Should Know After a Year of Anaesthesia Training (Rathie)', 'Handbook of Communication in Anaesthesia, Pain Management, and Intensive Care (Cyna and colleagues)'],
    ["Miller's Anesthesia", 'Pharmacology and Physiology for Anesthesia (Hemmings and Egan)'],
  ),
  neurosurgery: s(
    ['Royal Australasian College of Surgeons — neurosurgery', 'Neurosurgical Society of Australasia', KURUL, mbs('neurosurgery')],
    ['Essential Neurosurgery (Kaye)', 'Brain Tumors: An Encyclopedic Approach (Kaye and Laws)'],
    ['Youmans and Winn Neurological Surgery', "Greenberg's Handbook of Neurosurgery"],
  ),
  'paediatric-surgery': s(
    ['Royal Australasian College of Surgeons — paediatric surgery', "Royal Children's Hospital clinical practice guidelines", KURUL, mbs('paediatric surgery')],
    ["Jones' Clinical Paediatric Surgery"],
    ["Ashcraft's Pediatric Surgery"],
  ),
  'internal-medicine': s(
    [RACP, 'Therapeutic Guidelines', 'Australian Medicines Handbook', pbs('internal medicine')],
    ["Talley and O'Connor's Clinical Examination", "Talley and O'Connor's Examination Medicine"],
    ["Harrison's Principles of Internal Medicine"],
  ),
  dermatology: s(
    ['Australasian College of Dermatologists', 'Therapeutic Guidelines: Dermatology', KURUL, pbs('dermatology')],
    ['Dermatoscopy and Skin Cancer (Rosendahl)', 'Practical Skin Cancer Surgery'],
    ["Bolognia's Dermatology", "Fitzpatrick's Dermatology"],
  ),
  endocrinology: s(
    ['Endocrine Society of Australia', 'Australian Diabetes Society', RACP, pbs('endocrinology')],
    ['Therapeutic Guidelines: Endocrinology', 'Management of type 2 diabetes: A handbook for general practice (RACGP and Diabetes Australia)'],
    ['Williams Textbook of Endocrinology'],
  ),
  'infectious-diseases': s(
    ['Australasian Society for Infectious Diseases', 'Communicable Diseases Network Australia national guidelines', 'Australian Immunisation Handbook', pbs('infectious diseases')],
    ['Therapeutic Guidelines: Antibiotic', 'Healthcare Associated Infections in Australia'],
    ["Mandell, Douglas, and Bennett's Principles and Practice of Infectious Diseases"],
  ),
  gastroenterology: s(
    ['Gastroenterological Society of Australia', 'Gastroenterological Society of Australia clinical practice guidelines', RACP, pbs('gastroenterology')],
    ['Therapeutic Guidelines: Gastrointestinal', 'Clinical Gastroenterology (Talley)'],
    ["Sleisenger and Fordtran's Gastrointestinal and Liver Disease"],
  ),
  'general-surgery': s(
    ['Royal Australasian College of Surgeons — general surgery', 'General Surgeons Australia', KURUL, mbs('general surgery')],
    ['Fundamental Skills for Surgery'],
    ["Bailey and Love's Short Practice of Surgery", 'Sabiston Textbook of Surgery'],
  ),
  'respiratory-medicine': s(
    ['TSANZ', 'Australian Asthma Handbook', 'Lung Foundation Australia', RACP],
    ['Therapeutic Guidelines: Respiratory'],
    ["Murray and Nadel's Textbook of Respiratory Medicine", "Fishman's Pulmonary Diseases and Disorders"],
  ),
  ophthalmology: s(
    ['RANZCO', 'RANZCO clinical statements', 'National Health and Medical Research Council guidelines for the management of glaucoma', mbs('ophthalmology')],
    [],
    ["Kanski's Clinical Ophthalmology", 'The Wills Eye Manual'],
  ),
  'obstetrics-gynaecology': s(
    ['RANZCOG', 'RANZCOG statements and guidelines', 'Department of Health and Aged Care pregnancy care guidelines', pbs('obstetrics and gynaecology')],
    ["Beischer and MacKay's Obstetrics, Gynaecology and the Newborn", 'Llewellyn-Jones Fundamentals of Obstetrics and Gynaecology'],
    [],
  ),
  cardiology: s(
    ['CSANZ, the cardiac society', 'CSANZ guidelines and position statements', 'National Heart Foundation of Australia', 'Australian guideline for assessing and managing cardiovascular disease risk'],
    ["Practical Cardiology (Baker, Nikolic, and O'Connor)"],
    ["Braunwald's Heart Disease", 'The ESC Textbook of Cardiovascular Medicine'],
  ),
  otolaryngology: s(
    ['Australian Society of Otolaryngology Head and Neck Surgery', 'Royal Australasian College of Surgeons', 'Therapeutic Guidelines: Antibiotic', mbs('otolaryngology')],
    [],
    ["Scott-Brown's Otorhinolaryngology and Head and Neck Surgery", 'Cummings Otolaryngology'],
  ),
  nephrology: s(
    ['ANZSN', 'CARI Guidelines', 'Kidney Health Australia', RACP],
    ['CKD Management in Primary Care (Kidney Health Australia handbook)'],
    ["Brenner and Rector's The Kidney", 'Handbook of Dialysis (Daugirdas)'],
  ),
  neurology: s(
    ['ANZAN', 'Stroke Foundation living clinical guidelines', 'Australian Medicines Handbook', RACP],
    ['Therapeutic Guidelines: Neurology'],
    ["Adams and Victor's Principles of Neurology", "Bradley's Neurology in Clinical Practice"],
  ),
  oncology: s(
    ['Medical Oncology Group of Australia', 'Cancer Council Australia', 'eviQ cancer treatment protocols', 'Cancer Australia'],
    ['Cancer Facts: A Concise Oncology Text (Bishop)'],
    ["DeVita, Hellman, and Rosenberg's Cancer", "Abeloff's Clinical Oncology"],
  ),
  orthopaedics: s(
    ['Australian Orthopaedic Association', 'Australian Orthopaedic Association position statements', 'Royal Australasian College of Surgeons', mbs('orthopaedic')],
    [],
    ["Campbell's Operative Orthopaedics", "Rockwood and Green's Fractures in Adults"],
  ),
  paediatrics: s(
    ['Royal Australasian College of Physicians', "Royal Children's Hospital clinical practice guidelines", 'Australian Immunisation Handbook', "Australian Medicines Handbook Children's Dosing Companion"],
    ['Practical Paediatrics (South and Isaacs)', "Paediatric Handbook (Royal Children's Hospital Melbourne)"],
    [],
  ),
  'plastic-surgery': s(
    ['Australian Society of Plastic Surgeons', 'Royal Australasian College of Surgeons', KURUL, mbs('plastic surgery')],
    [],
    ["Grabb and Smith's Plastic Surgery", "Neligan's Plastic Surgery"],
  ),
  psychiatry: s(
    ['RANZCP clinical practice guidelines', KURUL, 'Australian Medicines Handbook', pbs('psychiatry')],
    ['A Primer of Clinical Psychiatry (Castle and Bassett)', "Psych Lite: Psychiatry That's Easy to Read", 'Therapeutic Guidelines: Psychotropic'],
    ["Kaplan and Sadock's Comprehensive Textbook of Psychiatry"],
  ),
  radiology: s(
    ['RANZCR — radiology', 'RANZCR standards of practice', 'ARPANSA codes of practice', mbs('diagnostic imaging')],
    [],
    ["Grainger and Allison's Diagnostic Radiology", "Chapman and Nakielny's Guide to Radiological Procedures"],
  ),
  rheumatology: s(
    ['Australian Rheumatology Association', 'Australian Rheumatology Association position statements', RACP, pbs('rheumatology')],
    ['Therapeutic Guidelines: Rheumatology'],
    ["Kelley and Firestein's Textbook of Rheumatology"],
  ),
  urology: s(
    ['Royal Australasian College of Surgeons — urology', 'USANZ position statements and guidelines', pbs('urology'), mbs('urology')],
    [],
    ['Campbell-Walsh-Wein Urology', "Smith and Tanagho's General Urology"],
  ),
  'sports-medicine': s(
    ['Australasian College of Sport and Exercise Physicians', 'Australian Institute of Sport', KURUL, pbs('sport and exercise medicine')],
    ["Brukner and Khan's Clinical Sports Medicine"],
    ["DeLee, Drez, and Miller's Orthopaedic Sports Medicine"],
  ),
  'rehabilitation-medicine': s(
    ['Royal Australasian College of Physicians — rehabilitation medicine', 'Australasian Faculty of Rehabilitation Medicine', KURUL, mbs('rehabilitation medicine')],
    ['Neurological Rehabilitation: Optimizing Motor Performance (Carr and Shepherd)'],
    ["DeLisa's Physical Medicine and Rehabilitation", "Braddom's Physical Medicine and Rehabilitation"],
  ),
  'cardio-thoracic-surgery': s(
    ['Royal Australasian College of Surgeons — cardio-thoracic surgery', 'ANZSCTS, the cardiac and thoracic surgery society', 'CSANZ, the cardiac society', mbs('cardio-thoracic surgery')],
    [],
    ['Cardiac Surgery in the Adult (Cohn)', 'Sabiston and Spencer Surgery of the Chest'],
  ),
  'vascular-surgery': s(
    ['Royal Australasian College of Surgeons — vascular surgery', 'ANZSVS, the vascular surgery society', mbs('vascular surgery'), pbs('vascular surgery')],
    [],
    ["Rutherford's Vascular Surgery", "Moore's Vascular and Endovascular Surgery"],
  ),
  'radiation-oncology': s(
    ['RANZCR — radiation oncology', 'eviQ cancer treatment protocols', 'ARPANSA codes of practice', 'Cancer Council Australia'],
    [],
    ["Gunderson and Tepper's Clinical Radiation Oncology", "Perez and Brady's Principles and Practice of Radiation Oncology"],
  ),
  'geriatric-medicine': s(
    ['Royal Australasian College of Physicians — geriatric medicine', 'RACGP Aged Care Clinical Guide', 'Australian Medicines Handbook', pbs('geriatric medicine')],
    ['Australian Medicines Handbook Aged Care Companion'],
    ["Brocklehurst's Textbook of Geriatric Medicine and Gerontology", "Hazzard's Geriatric Medicine and Gerontology"],
  ),
  'immunology-and-allergy': s(
    ['Australasian Society of Clinical Immunology and Allergy', 'ASCIA anaphylaxis guidelines and action plans', 'Australian Immunisation Handbook', RACP],
    [],
    ["Middleton's Allergy", "Rich's Clinical Immunology"],
  ),
  haematology: s(
    ['HSANZ, the haematology society', 'Patient Blood Management Guidelines (National Blood Authority)', 'Australian Red Cross Lifeblood transfusion guidance', RACP],
    [],
    ["Hoffbrand's Essential Haematology", 'Postgraduate Haematology'],
  ),
  'pain-medicine': s(
    ['ANZCA, the college for pain medicine', 'ANZCA acute pain management: scientific evidence', KURUL, pbs('pain medicine')],
    ['Explain Pain (Butler and Moseley)', 'Acute Pain Management: Scientific Evidence (ANZCA and Faculty of Pain Medicine)'],
    ["Bonica's Management of Pain", "Wall and Melzack's Textbook of Pain"],
  ),
  'aesthetic-surgery': s(
    ['Medical Board of Australia — cosmetic surgery', 'Australian Society of Plastic Surgeons', 'Ahpra guidelines for advertising a regulated health service', 'Royal Australasian College of Surgeons'],
    [],
    ['The Art of Aesthetic Surgery (Nahai)', "Grabb and Smith's Plastic Surgery"],
  ),
  'aesthetic-medicine': s(
    ['Medical Board of Australia — non-surgical cosmetic procedures', 'Medical Board of Australia lists hair transplants with non-surgical cosmetic procedures', 'Ahpra guidelines for advertising a regulated health service', 'Australian Medicines Handbook', KURUL],
    [],
    ["Baumann's Cosmetic Dermatology", 'Procedures in Cosmetic Dermatology (Carruthers)'],
  ),
  physiotherapy: s(
    ['Australian Physiotherapy Association', 'Physiotherapy Board of Australia', 'Australian Physiotherapy Association clinical practice guidelines', 'Ahpra registration standards for physiotherapy'],
    ["Maitland's Vertebral Manipulation", 'Clinical Reasoning in Musculoskeletal Practice (Jones and Rivett)'],
    ["Tidy's Physiotherapy"],
  ),
  'clinical-psychology': s(
    ['Australian Psychological Society', 'Psychology Board of Australia', 'Evidence-based psychological interventions in the treatment of mental disorders (Australian Psychological Society literature review)', 'Ahpra registration standards for psychology'],
    [],
    ["Barlow's Clinical Handbook of Psychological Disorders", 'Cognitive Behavior Therapy: Basics and Beyond (Beck)'],
  ),
  dietetics: s(
    ['Dietitians Australia', 'Dietitians Australia National Competency Standards', 'Australian Dietary Guidelines', OZ],
    ['Understanding Nutrition (Australian and New Zealand edition)'],
    ["Krause and Mahan's Food and the Nutrition Care Process"],
  ),
  'occupational-therapy': s(
    ['Occupational Therapy Australia', 'Occupational Therapy Board of Australia', 'Occupational Therapy Australia professional standards', 'Ahpra registration standards for occupational therapy'],
    ['Occupational Therapy in Australia: Professional and Practice Issues'],
    ["Willard and Spackman's Occupational Therapy"],
  ),
  audiology: s(
    ['Audiology Australia', 'Audiology Australia professional practice standards', 'National Acoustic Laboratories', OZ],
    ['Hearing Aids (Dillon)'],
    ["Katz's Handbook of Clinical Audiology"],
  ),
  podiatry: s(
    ['Australian Podiatry Association', 'Podiatry Board of Australia', 'Australian evidence-based guidelines for diabetes-related foot disease', 'Pharmaceutical Benefits Scheme, where a podiatrist prescribes'],
    [],
    ["Neale's Disorders of the Foot and Ankle", "Merriman's Assessment of the Lower Limb"],
  ),
  'speech-pathology': s(
    ['Speech Pathology Australia', 'Speech Pathology Australia practice guidelines', 'Speech Pathology Australia Code of Ethics', OZ],
    ["The Lidcombe Program of Early Stuttering Intervention: A Clinician's Guide"],
    ["Duffy's Motor Speech Disorders", 'Dysphagia: Clinical Management in Adults and Children (Groher and Crary)'],
  ),
}

/** The books of each role, split into Australian / ANZ titles and international texts (for the tests and the prompt block). */
export const AU_KITAP_AYRIMI: Record<Sunulan, AuKitapAyrimi> = Object.fromEntries(
  Object.entries(SATIRLAR).map(([rol, r]) => [rol, { ulusal: r.ulusal, uluslararasi: r.uluslararasi }]),
) as Record<Sunulan, AuKitapAyrimi>

/** Roles for which no Australian- or ANZ-authored book could be verified on 2026-10-22 (see the note above). */
export const AU_ULUSAL_KITABI_OLMAYAN_ROLLER: readonly Sunulan[] = (Object.keys(SATIRLAR) as Sunulan[]).filter((rol) => SATIRLAR[rol].ulusal.length === 0)

export const AU_ASISTAN_KAYNAKLARI: Record<Sunulan, AsistanKaynaklari> = Object.fromEntries(
  Object.entries(SATIRLAR).map(([rol, r]) => [rol, {
    yetkiBaslik: YETKI,
    kitapBaslik: KITAP,
    not: NOT,
    yetki: r.yetki,
    kitaplar: [...r.ulusal, ...r.uluslararasi],
  }]),
) as Record<Sunulan, AsistanKaynaklari>

export function auAsistanKaynaklari(rol: string): AsistanKaynaklari | null {
  return Object.prototype.hasOwnProperty.call(AU_ASISTAN_KAYNAKLARI, rol) ? AU_ASISTAN_KAYNAKLARI[rol as Sunulan] : null
}

/**
 * The prompt block for a future Australian assistant: the counterpart of the Turkish personaEngine's
 * `specialtyKnowhowBlock`. Australian sources first and binding; Australian books next; international texts for
 * depth only; on conflict the Australian source wins. Not called by anything yet (see the note at the top).
 * null = not a role of this pack: there is no block, and never another role's.
 */
export function auAsistanKaynakBlogu(rol: string): string | null {
  const k = auAsistanKaynaklari(rol)
  if (!k) return null
  const a = AU_KITAP_AYRIMI[rol as Sunulan]
  const sat = (liste: readonly string[]) => liste.map((x) => `• ${x}`).join('\n')
  return [
    '=== AUSTRALIAN PRACTICE SOURCES (BINDING) ===',
    'For clinical decisions, doses, work-up and referral use these FIRST.',
    "Do not put another country's guideline in place of an Australian one.",
    'On a conflict, the Australian source below wins over any international text.',
    sat(k.yetki),
    ...(a.ulusal.length ? ['', '=== AUSTRALIAN AND ANZ BOOKS ===', sat(a.ulusal)] : []),
    ...(a.uluslararasi.length ? ['', '=== INTERNATIONAL TEXTS (depth only — not practice authority) ===', sat(a.uluslararasi)] : []),
  ].join('\n')
}
