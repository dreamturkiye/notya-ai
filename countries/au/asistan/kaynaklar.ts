/**
 * Practice authority for each role this pack offers.
 *
 * The shape follows the specialist catalogues: national sources first, then book titles.
 * A title is a name. The book is not stored and none of it is copied. Charlie and Clara do not
 * answer a question from these names. A role this pack does not offer (hair transplantation,
 * longevity) has no entry.
 *
 * College names are the ones already opened for the link tiles on 2026-10-19 (./araclar/referanslar.ts).
 * Book titles are the published names of texts used in that role's training. No page was copied.
 * Binational college names stay abbreviated, the same way the tiles write them.
 */
import type { AsistanKaynaklari } from '@/lib/ulke/arayuz/tipler'
import type { AuEkRolAnahtari } from '../klinik/rolListesi'
import type { EnRol } from '../../_dil/en/klinik/roller'

type Sunulan = Exclude<EnRol, 'thoracic-surgery' | 'cardiovascular-surgery' | 'clinic-dermatology' | 'hair-transplant' | 'longevity'> | AuEkRolAnahtari

const NOT = 'Practice authority for this role. A book is named. It is not stored here, and none of it is copied. These names are not an answer to a question.'
const YETKI = 'Australian practice sources'
const KITAP = 'Books named for this role'
const KURUL = 'Medical Board of Australia codes and guidelines'
const RACP = 'Royal Australasian College of Physicians — adult medicine'
const OZ = 'This profession is self-regulated and is not on the Ahpra registration tile'

const y = (yetki: readonly string[], kitaplar: readonly string[]): AsistanKaynaklari => ({
  yetkiBaslik: YETKI,
  kitapBaslik: KITAP,
  not: NOT,
  yetki,
  kitaplar,
})

const pbs = (rol: string) => `Pharmaceutical Benefits Scheme, for medicines in ${rol}`
const mbs = (rol: string) => `Medicare Benefits Schedule, for ${rol} services`

export const AU_ASISTAN_KAYNAKLARI: Record<Sunulan, AsistanKaynaklari> = {
  'emergency-medicine': y(
    ['Australasian College for Emergency Medicine', 'Therapeutic Guidelines: Antibiotic', 'Australian Immunisation Handbook', pbs('emergency medicine')],
    ['Textbook of Adult Emergency Medicine (Cameron)', "Tintinalli's Emergency Medicine"],
  ),
  'family-medicine': y(
    ['Royal Australian College of General Practitioners', 'RACGP Guidelines for preventive activities in general practice', 'Australian Medicines Handbook', pbs('general practice')],
    ["Murtagh's General Practice", 'Therapeutic Guidelines'],
  ),
  anaesthesia: y(
    ['ANZCA, the college for anaesthesia', 'ANZCA professional documents', 'ANZCA acute pain management: scientific evidence', pbs('anaesthesia')],
    ["Miller's Anesthesia", 'Clinical Anesthesia (Barash)'],
  ),
  neurosurgery: y(
    ['Royal Australasian College of Surgeons — neurosurgery', 'Neurosurgical Society of Australasia', KURUL, mbs('neurosurgery')],
    ['Youmans and Winn Neurological Surgery', "Greenberg's Handbook of Neurosurgery"],
  ),
  'paediatric-surgery': y(
    ['Royal Australasian College of Surgeons — paediatric surgery', "Royal Children's Hospital clinical practice guidelines", KURUL, mbs('paediatric surgery')],
    ["Ashcraft's Pediatric Surgery", "Holcomb and Ashcraft's Pediatric Surgery"],
  ),
  'internal-medicine': y(
    [RACP, 'Therapeutic Guidelines', 'Australian Medicines Handbook', pbs('internal medicine')],
    ["Talley and O'Connor's Clinical Examination", "Harrison's Principles of Internal Medicine"],
  ),
  dermatology: y(
    ['Australasian College of Dermatologists', 'Therapeutic Guidelines: Dermatology', KURUL, pbs('dermatology')],
    ["Bolognia's Dermatology", "Fitzpatrick's Dermatology"],
  ),
  endocrinology: y(
    ['Endocrine Society of Australia', 'Australian Diabetes Society', RACP, pbs('endocrinology')],
    ['Therapeutic Guidelines: Endocrinology', 'Williams Textbook of Endocrinology'],
  ),
  'infectious-diseases': y(
    ['Australasian Society for Infectious Diseases', 'Communicable Diseases Network Australia national guidelines', 'Australian Immunisation Handbook', pbs('infectious diseases')],
    ['Therapeutic Guidelines: Antibiotic', "Mandell, Douglas, and Bennett's Principles and Practice of Infectious Diseases"],
  ),
  gastroenterology: y(
    ['Gastroenterological Society of Australia', 'Gastroenterological Society of Australia clinical practice guidelines', RACP, pbs('gastroenterology')],
    ['Therapeutic Guidelines: Gastrointestinal', "Sleisenger and Fordtran's Gastrointestinal and Liver Disease"],
  ),
  'general-surgery': y(
    ['Royal Australasian College of Surgeons — general surgery', 'General Surgeons Australia', KURUL, mbs('general surgery')],
    ["Schwartz's Principles of Surgery", 'Sabiston Textbook of Surgery'],
  ),
  'respiratory-medicine': y(
    ['TSANZ', 'Australian Asthma Handbook', 'Lung Foundation Australia', RACP],
    ['Therapeutic Guidelines: Respiratory', "Murray and Nadel's Textbook of Respiratory Medicine"],
  ),
  ophthalmology: y(
    ['RANZCO', 'RANZCO clinical statements', KURUL, mbs('ophthalmology')],
    ["Kanski's Clinical Ophthalmology", 'American Academy of Ophthalmology Basic and Clinical Science Course'],
  ),
  'obstetrics-gynaecology': y(
    ['RANZCOG', 'RANZCOG statements and guidelines', 'Department of Health and Aged Care pregnancy care guidelines', pbs('obstetrics and gynaecology')],
    ['Llewellyn-Jones Fundamentals of Obstetrics and Gynaecology', 'Williams Obstetrics'],
  ),
  cardiology: y(
    ['CSANZ, the cardiac society', 'CSANZ guidelines and position statements', 'National Heart Foundation of Australia', 'Australian guideline for assessing and managing cardiovascular disease risk'],
    ["Braunwald's Heart Disease", "Hurst's the Heart"],
  ),
  otolaryngology: y(
    ['Australian Society of Otolaryngology Head and Neck Surgery', 'Royal Australasian College of Surgeons', 'Therapeutic Guidelines: Antibiotic', mbs('otolaryngology')],
    ['Cummings Otolaryngology', "Bailey's Head and Neck Surgery"],
  ),
  nephrology: y(
    ['ANZSN', 'CARI Guidelines', 'Kidney Health Australia', RACP],
    ["Brenner and Rector's The Kidney", 'Comprehensive Clinical Nephrology'],
  ),
  neurology: y(
    ['ANZAN', 'Stroke Foundation living clinical guidelines', 'Therapeutic Guidelines: Neurology', RACP],
    ["Adams and Victor's Principles of Neurology", "Bradley's Neurology in Clinical Practice"],
  ),
  oncology: y(
    ['Medical Oncology Group of Australia', 'Cancer Council Australia', 'eviQ cancer treatment protocols', 'Cancer Australia'],
    ["DeVita, Hellman, and Rosenberg's Cancer", "Abeloff's Clinical Oncology"],
  ),
  orthopaedics: y(
    ['Australian Orthopaedic Association', 'Australian Orthopaedic Association position statements', 'Royal Australasian College of Surgeons', mbs('orthopaedic')],
    ["Campbell's Operative Orthopaedics", "Rockwood and Green's Fractures in Adults"],
  ),
  paediatrics: y(
    ['Royal Australasian College of Physicians', "Royal Children's Hospital clinical practice guidelines", 'Australian Immunisation Handbook', "Australian Medicines Handbook Children's Dosing Companion"],
    ["Paediatric Handbook (Royal Children's Hospital Melbourne)", 'Nelson Textbook of Pediatrics'],
  ),
  'plastic-surgery': y(
    ['Australian Society of Plastic Surgeons', 'Royal Australasian College of Surgeons', KURUL, mbs('plastic surgery')],
    ["Grabb and Smith's Plastic Surgery", "Neligan's Plastic Surgery"],
  ),
  psychiatry: y(
    ['RANZCP clinical practice guidelines', KURUL, 'Australian Medicines Handbook', pbs('psychiatry')],
    ['Therapeutic Guidelines: Psychotropic', "Kaplan and Sadock's Comprehensive Textbook of Psychiatry"],
  ),
  radiology: y(
    ['RANZCR — radiology', 'RANZCR standards of practice', 'ARPANSA codes of practice', mbs('diagnostic imaging')],
    ["Grainger and Allison's Diagnostic Radiology", "Brant and Helms' Fundamentals of Diagnostic Radiology"],
  ),
  rheumatology: y(
    ['Australian Rheumatology Association', 'Australian Rheumatology Association position statements', RACP, pbs('rheumatology')],
    ['Therapeutic Guidelines: Rheumatology', "Kelley and Firestein's Textbook of Rheumatology"],
  ),
  urology: y(
    ['Royal Australasian College of Surgeons — urology', KURUL, pbs('urology'), mbs('urology')],
    ['Campbell-Walsh-Wein Urology', "Smith and Tanagho's General Urology"],
  ),
  'sports-medicine': y(
    ['Australasian College of Sport and Exercise Physicians', 'Australian Institute of Sport', KURUL, pbs('sport and exercise medicine')],
    ["Brukner and Khan's Clinical Sports Medicine", "DeLee, Drez, and Miller's Orthopaedic Sports Medicine"],
  ),
  'rehabilitation-medicine': y(
    ['Royal Australasian College of Physicians — rehabilitation medicine', 'Australasian Faculty of Rehabilitation Medicine', KURUL, mbs('rehabilitation medicine')],
    ["DeLisa's Physical Medicine and Rehabilitation", "Braddom's Physical Medicine and Rehabilitation"],
  ),
  'cardio-thoracic-surgery': y(
    ['Royal Australasian College of Surgeons — cardio-thoracic surgery', 'CSANZ, the cardiac society', KURUL, mbs('cardio-thoracic surgery')],
    ['Cardiac Surgery in the Adult (Cohn)', 'Sabiston and Spencer Surgery of the Chest'],
  ),
  'vascular-surgery': y(
    ['Royal Australasian College of Surgeons — vascular surgery', KURUL, mbs('vascular surgery'), pbs('vascular surgery')],
    ["Rutherford's Vascular Surgery", "Moore's Vascular and Endovascular Surgery"],
  ),
  'radiation-oncology': y(
    ['RANZCR — radiation oncology', 'eviQ cancer treatment protocols', 'ARPANSA codes of practice', 'Cancer Council Australia'],
    ["Gunderson and Tepper's Clinical Radiation Oncology", "Perez and Brady's Principles and Practice of Radiation Oncology"],
  ),
  'geriatric-medicine': y(
    ['Royal Australasian College of Physicians — geriatric medicine', 'RACGP Aged Care Clinical Guide', 'Australian Medicines Handbook', pbs('geriatric medicine')],
    ["Brocklehurst's Textbook of Geriatric Medicine and Gerontology", "Hazzard's Geriatric Medicine and Gerontology"],
  ),
  'immunology-and-allergy': y(
    ['Australasian Society of Clinical Immunology and Allergy', 'ASCIA anaphylaxis guidelines and action plans', 'Australian Immunisation Handbook', RACP],
    ["Middleton's Allergy", "Abbas' Cellular and Molecular Immunology"],
  ),
  haematology: y(
    ['HSANZ, the haematology society', 'eviQ cancer treatment protocols', 'Australian Red Cross Lifeblood transfusion guidance', RACP],
    ["Hoffbrand's Essential Haematology", 'Postgraduate Haematology'],
  ),
  'pain-medicine': y(
    ['ANZCA, the college for pain medicine', 'ANZCA acute pain management: scientific evidence', KURUL, pbs('pain medicine')],
    ["Bonica's Management of Pain", "Wall and Melzack's Textbook of Pain"],
  ),
  'aesthetic-surgery': y(
    ['Medical Board of Australia — cosmetic surgery', 'Australian Society of Plastic Surgeons', 'Ahpra guidelines for advertising a regulated health service', 'Royal Australasian College of Surgeons'],
    ['The Art of Aesthetic Surgery (Nahai)', 'Aesthetic Plastic Surgery (Aston)'],
  ),
  'aesthetic-medicine': y(
    ['Medical Board of Australia — non-surgical cosmetic procedures', 'Ahpra guidelines for advertising a regulated health service', 'Australian Medicines Handbook', KURUL],
    ["Baumann's Cosmetic Dermatology", 'Procedures in Cosmetic Dermatology (Carruthers)'],
  ),
  physiotherapy: y(
    ['Australian Physiotherapy Association', 'Physiotherapy Board of Australia', 'Australian Physiotherapy Association clinical practice guidelines', 'Ahpra registration standards for physiotherapy'],
    ["Maitland's Vertebral Manipulation", "Carr and Shepherd's Neurological Rehabilitation"],
  ),
  'clinical-psychology': y(
    ['Australian Psychological Society', 'Psychology Board of Australia', 'Australian Psychological Society ethical guidelines', 'Ahpra registration standards for psychology'],
    ["Barlow's Clinical Handbook of Psychological Disorders", "Beck's Cognitive Therapy of Depression"],
  ),
  dietetics: y(
    ['Dietitians Australia', 'Dietitians Australia National Competency Standards', 'National Health and Medical Research Council', OZ],
    ['Australian Dietary Guidelines', "Krause and Mahan's Food and the Nutrition Care Process"],
  ),
  'occupational-therapy': y(
    ['Occupational Therapy Australia', 'Occupational Therapy Board of Australia', 'Occupational Therapy Australia professional standards', 'Ahpra registration standards for occupational therapy'],
    ["Willard and Spackman's Occupational Therapy", "Creek's Occupational Therapy and Mental Health"],
  ),
  audiology: y(
    ['Audiology Australia', 'Audiology Australia professional practice standards', 'National Acoustic Laboratories', OZ],
    ['Hearing Aids (Dillon)', "Katz's Handbook of Clinical Audiology"],
  ),
  podiatry: y(
    ['Australian Podiatry Association', 'Podiatry Board of Australia', 'Australian Podiatry Association clinical resources', 'Pharmaceutical Benefits Scheme, where a podiatrist prescribes'],
    ["Neale's Disorders of the Foot and Ankle", "Merriman's Assessment of the Lower Limb"],
  ),
  'speech-pathology': y(
    ['Speech Pathology Australia', 'Speech Pathology Australia practice guidelines', 'Speech Pathology Australia Code of Ethics', OZ],
    ["Duffy's Motor Speech Disorders", "Shipley's Assessment in Speech-Language Pathology"],
  ),
}

export function auAsistanKaynaklari(rol: string): AsistanKaynaklari | null {
  return Object.prototype.hasOwnProperty.call(AU_ASISTAN_KAYNAKLARI, rol) ? AU_ASISTAN_KAYNAKLARI[rol as Sunulan] : null
}
