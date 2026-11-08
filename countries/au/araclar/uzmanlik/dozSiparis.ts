/**
 * ULKE-BRANS-DERINLIK-09 (Kaan, 2026-11-08) — Australia: THE SPECIALTY DOSE ENGINE AND THE ORDER PRESETS of every role, on the
 * kit's engine (lib/ulke/araclar/dozMotoru.ts). Each prescribing medical role gets its own dose tool with its specialty's bases
 * (per kilogram, per square metre, fixed); every role gets its own order list. THE CLINICIAN ENTERS EVERY DOSE: no medicine,
 * default amount or ceiling is here (founder rule, specialties/pediatri/engines/doz.ts) — and nothing is taken from the AMH,
 * eTG or the PBS schedule. The non-prescribing allied professions (physiotherapy, clinical psychology, dietetics, occupational
 * therapy, audiology, speech pathology) get the order list only. PODIATRY (ULKE-BRANS-K9-MUTTEFIK, Kaan 2026-11-08) also gets
 * the dose tool: the Podiatry Board of Australia's endorsement for scheduled medicines lets an endorsed podiatrist "prescribe,
 * supply and use certain scheduled medicines (Schedules 2, 3, 4 and 8) for podiatric conditions" (Registration standard:
 * Endorsement for scheduled medicines, in effect 1 August 2018; podiatryboard.gov.au, read 2026-11-08). The tool says it is
 * for endorsed podiatrists only, and like every role's it holds no medicine, no amount and no maximum.
 *
 * GENERATED (scratch uzgen/au.py). Specialty-only: every tool names exactly one role. Switched on without an Australian
 * clinician's sign-off (owner's order 2026-11-08), listed in ../onaysizAciklar.ts. AU assistant untouched.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { dozAraciTanimi, siparisAraciTanimi, type DozTemeli } from '@/lib/ulke/araclar/dozMotoru'

const D = 'en-AU'
const m = (x: string) => ({ [D]: x })
type Satir = { rol: string; temeller: readonly DozTemeli[]; kalemler: readonly string[] }

export const AU_DOZ_SIPARIS_SATIRLARI: readonly Satir[] = [
  { rol: 'emergency-medicine', temeller: ["kg", "sabit"], kalemler: ["ekg", "qon_umumiy", "biokimyo", "troponin", "rentgen", "kuzatuv"] },
  { rol: 'family-medicine', temeller: ["kg", "sabit"], kalemler: ["qon_umumiy", "siydik", "qand", "lipid", "ekg", "yonaltirish"] },
  { rol: 'anaesthesia', temeller: ["kg", "sabit"], kalemler: ["qon_umumiy", "koagulyatsiya", "qon_guruhi", "ekg", "biokimyo", "ochlik"] },
  { rol: 'neurosurgery', temeller: ["kg", "sabit"], kalemler: ["kt_bosh", "mrt", "koagulyatsiya", "qon_umumiy", "nevrolog", "reabilitatsiya"] },
  { rol: 'paediatric-surgery', temeller: ["kg"], kalemler: ["qon_umumiy", "uzi", "siydik", "koagulyatsiya", "anest_konsult", "kuzatuv"] },
  { rol: 'internal-medicine', temeller: ["kg", "sabit"], kalemler: ["qon_umumiy", "biokimyo", "jigar", "qand", "ekg", "rentgen"] },
  { rol: 'dermatology', temeller: ["sabit", "kg"], kalemler: ["dermatoskopiya", "biopsiya", "surtma", "qon_umumiy", "jigar", "foto"] },
  { rol: 'endocrinology', temeller: ["kg", "sabit"], kalemler: ["hba1c", "qand", "ttg", "lipid", "biokimyo", "siydik_albumin"] },
  { rol: 'infectious-diseases', temeller: ["kg", "sabit"], kalemler: ["qon_ekma", "qon_umumiy", "crp", "jigar", "gepatit", "oiv"] },
  { rol: 'gastroenterology', temeller: ["kg", "sabit"], kalemler: ["jigar", "qon_umumiy", "uzi_qorin", "endoskopiya", "kolonoskopiya", "najas"] },
  { rol: 'general-surgery', temeller: ["kg", "sabit"], kalemler: ["qon_umumiy", "koagulyatsiya", "uzi_qorin", "kt", "qon_guruhi", "anest_konsult"] },
  { rol: 'cardio-thoracic-surgery', temeller: ["kg", "sabit"], kalemler: ["exokg", "koronarografiya", "ekg", "koagulyatsiya", "qon_guruhi", "biokimyo"] },
  { rol: 'respiratory-medicine', temeller: ["kg", "sabit"], kalemler: ["spirometriya", "rentgen", "pulsoksimetriya", "balgam", "kt_kokrak", "uyqu"] },
  { rol: 'ophthalmology', temeller: ["sabit"], kalemler: ["korish", "koz_bosimi", "oct", "korish_maydoni", "tub", "qand"] },
  { rol: 'obstetrics-gynaecology', temeller: ["kg", "sabit"], kalemler: ["uzi_akush", "qon_umumiy", "qon_guruhi", "siydik", "qand_yuk", "ktg"] },
  { rol: 'vascular-surgery', temeller: ["kg", "sabit"], kalemler: ["dupleks", "tpi", "koagulyatsiya", "kt_angio", "lipid", "qon_umumiy"] },
  { rol: 'cardiology', temeller: ["kg", "sabit"], kalemler: ["ekg", "exokg", "xolter", "sutkalik_bosim", "lipid", "yuklama"] },
  { rol: 'otolaryngology', temeller: ["kg", "sabit"], kalemler: ["audiometriya", "timpanometriya", "endoskopiya_lor", "kt_burun", "surtma_tomoq", "laringoskopiya"] },
  { rol: 'nephrology', temeller: ["kg", "sabit"], kalemler: ["biokimyo", "siydik", "siydik_albumin", "uzi_buyrak", "pth", "qon_umumiy"] },
  { rol: 'neurology', temeller: ["kg", "sabit"], kalemler: ["mrt", "kt_bosh", "eeg", "enmg", "dupleks_boyin", "qon_umumiy"] },
  { rol: 'oncology', temeller: ["m2", "kg", "sabit"], kalemler: ["qon_umumiy", "jigar", "biokimyo", "kt", "onko_marker", "gistologiya"] },
  { rol: 'radiation-oncology', temeller: ["kg", "sabit"], kalemler: ["kt_reja", "qon_umumiy", "onko_marker", "gistologiya", "teri", "kuzatuv"] },
  { rol: 'orthopaedics', temeller: ["kg", "sabit"], kalemler: ["rentgen_suyak", "mrt_bogim", "kt", "qon_umumiy", "fizioterapiya", "ortez"] },
  { rol: 'paediatrics', temeller: ["kg"], kalemler: ["qon_umumiy", "siydik", "crp", "rentgen", "ostish", "emlash"] },
  { rol: 'plastic-surgery', temeller: ["kg", "sabit"], kalemler: ["foto", "qon_umumiy", "koagulyatsiya", "anest_konsult", "yara", "gistologiya"] },
  { rol: 'psychiatry', temeller: ["sabit"], kalemler: ["qon_umumiy", "biokimyo", "jigar", "ttg", "ekg", "psixolog"] },
  { rol: 'radiology', temeller: ["kg", "sabit"], kalemler: ["kreatinin", "allergiya", "homila", "oldingi", "kt", "mrt"] },
  { rol: 'rheumatology', temeller: ["kg", "sabit"], kalemler: ["ecr_crp", "rf_accp", "ana", "qon_umumiy", "jigar", "rentgen_suyak"] },
  { rol: 'urology', temeller: ["kg", "sabit"], kalemler: ["siydik", "psa", "uzi_buyrak", "uroflou", "biokimyo", "sistoskopiya"] },
  { rol: 'sports-medicine', temeller: ["kg", "sabit"], kalemler: ["ekg", "rentgen_suyak", "mrt_bogim", "yuklama", "fizioterapiya", "qon_umumiy"] },
  { rol: 'rehabilitation-medicine', temeller: ["kg", "sabit"], kalemler: ["fizioterapiya", "ergoterapiya", "rentgen_suyak", "enmg", "ortez", "nutq"] },
  { rol: 'geriatric-medicine', temeller: ["kg", "sabit"], kalemler: ["kognitiv", "yiqilish", "dorilar", "qon_umumiy", "biokimyo", "ergoterapiya"] },
  { rol: 'immunology-and-allergy', temeller: ["kg", "sabit"], kalemler: ["teri_test", "ige", "umumiy_ige", "spirometriya", "qon_umumiy", "harakat_rejasi"] },
  { rol: 'haematology', temeller: ["kg", "m2", "sabit"], kalemler: ["qon_umumiy", "qon_surtma", "temir", "koagulyatsiya", "b12", "suyak_kostigi"] },
  { rol: 'pain-medicine', temeller: ["kg", "sabit"], kalemler: ["ogriq_shkala", "dorilar", "psixolog", "fizioterapiya", "mrt", "opioid"] },
  { rol: 'aesthetic-surgery', temeller: ["kg", "sabit"], kalemler: ["foto", "qon_umumiy", "koagulyatsiya", "anest_konsult", "yara", "gistologiya"] },
  { rol: 'aesthetic-medicine', temeller: ["sabit"], kalemler: ["foto", "allergiya_tarix", "homila", "partiya", "keyingi", "yara"] },
  { rol: 'physiotherapy', temeller: [], kalemler: ["harakat_hajmi", "kuch", "yurish", "uy_mashq", "ortez", "shifokor"] },
  { rol: 'clinical-psychology', temeller: [], kalemler: ["psixometrik", "uy_mashq", "seans_rejasi", "xavf_rejasi", "shifokor", "yonaltirish"] },
  { rol: 'dietetics', temeller: [], kalemler: ["antropometriya", "qand", "lipid", "temir", "vitamin_d", "ovqat_kundalik"] },
  { rol: 'occupational-therapy', temeller: [], kalemler: ["funksional", "uy", "jihoz", "harakat_hajmi", "uy_mashq", "shifokor"] },
  { rol: 'audiology', temeller: [], kalemler: ["audiometriya", "timpanometriya", "otoakustik", "nutq_audio", "eshitish_apparati", "shifokor"] },
  { rol: 'podiatry', temeller: ["sabit", "kg"], kalemler: ["tpi", "monofilament", "yara", "ortez", "poyabzal", "shifokor"] },
  { rol: 'speech-pathology', temeller: [], kalemler: ["yutish", "instrumental", "nutq_baho", "ovqat_tekstura", "uy_mashq", "shifokor"] },
]

const KALEM: Readonly<Record<string, string>> = {
  allergiya: 'Contrast allergy check',
  allergiya_tarix: 'Allergy and medicine history checked',
  ana: 'Antinuclear antibodies',
  anest_konsult: 'Anaesthetic review',
  antropometriya: 'Anthropometry',
  audiometriya: 'Pure-tone audiometry',
  b12: 'Vitamin B12 and folate',
  balgam: 'Sputum microscopy and culture',
  biokimyo: 'Electrolytes, urea and creatinine',
  biopsiya: 'Skin biopsy with histopathology',
  crp: 'C-reactive protein',
  dermatoskopiya: 'Dermoscopy',
  dorilar: 'Medicine review',
  dupleks: 'Duplex ultrasound',
  dupleks_boyin: 'Carotid duplex ultrasound',
  ecr_crp: 'ESR and CRP',
  eeg: 'EEG',
  ekg: '12-lead ECG',
  emlash: 'Immunisation status check',
  endoskopiya: 'Upper GI endoscopy',
  endoskopiya_lor: 'Nasal endoscopy',
  enmg: 'Nerve conduction studies and EMG',
  ergoterapiya: 'Occupational therapy referral',
  eshitish_apparati: 'Hearing aid assessment',
  exokg: 'Echocardiogram',
  fizioterapiya: 'Physiotherapy referral',
  foto: 'Clinical photography',
  funksional: 'Functional assessment',
  gepatit: 'Hepatitis B and C serology',
  gistologiya: 'Histopathology review',
  harakat_hajmi: 'Range-of-motion measures',
  harakat_rejasi: 'Allergy action plan given',
  hba1c: 'HbA1c',
  homila: 'Pregnancy check where relevant',
  ige: 'Specific IgE',
  instrumental: 'Instrumental swallow study referral',
  jigar: 'Liver function tests',
  jihoz: 'Equipment prescription',
  keyingi: 'Review appointment',
  koagulyatsiya: 'Coagulation screen',
  kognitiv: 'Cognitive screen',
  kolonoskopiya: 'Colonoscopy',
  korish: 'Visual acuity',
  korish_maydoni: 'Visual field test',
  koronarografiya: 'Coronary angiography',
  koz_bosimi: 'Intraocular pressure',
  kreatinin: 'Creatinine before contrast',
  kt: 'CT scan',
  kt_angio: 'CT angiography',
  kt_bosh: 'CT head',
  kt_burun: 'CT sinuses',
  kt_kokrak: 'CT chest',
  kt_reja: 'Planning CT',
  ktg: 'Cardiotocography (CTG)',
  kuch: 'Strength testing',
  kuzatuv: 'Observation and repeat vital signs',
  laringoskopiya: 'Laryngoscopy',
  lipid: 'Lipid profile',
  monofilament: 'Monofilament and vibration testing',
  mrt: 'MRI brain or spine',
  mrt_bogim: 'MRI of the joint',
  najas: 'Faecal occult blood or calprotectin',
  nevrolog: 'Neurological observations chart',
  nutq: 'Speech therapy referral',
  nutq_audio: 'Speech audiometry',
  nutq_baho: 'Communication assessment',
  ochlik: 'Fasting instructions given',
  oct: 'Optical coherence tomography',
  ogriq_shkala: 'Pain and function measures',
  oiv: 'HIV test with consent',
  oldingi: 'Prior imaging for comparison',
  onko_marker: 'Tumour markers as indicated',
  opioid: 'Opioid agreement and review',
  ortez: 'Brace or orthosis',
  ostish: 'Growth measurements',
  otoakustik: 'Otoacoustic emissions',
  ovqat_kundalik: 'Food diary',
  ovqat_tekstura: 'Texture-modified diet recommendation',
  partiya: 'Product and batch recorded',
  poyabzal: 'Footwear review',
  psa: 'PSA after discussion',
  psixolog: 'Psychology referral',
  psixometrik: 'Psychometric assessment',
  pth: 'Calcium, phosphate and PTH',
  pulsoksimetriya: 'Pulse oximetry',
  qand: 'Fasting glucose or HbA1c',
  qand_yuk: 'Oral glucose tolerance test',
  qon_ekma: 'Blood cultures',
  qon_guruhi: 'Blood group and antibody screen',
  qon_surtma: 'Blood film',
  qon_umumiy: 'Full blood count',
  reabilitatsiya: 'Rehabilitation referral',
  rentgen: 'Chest X-ray',
  rentgen_suyak: 'X-ray of the affected part',
  rf_accp: 'Rheumatoid factor and anti-CCP',
  seans_rejasi: 'Session plan agreed',
  shifokor: 'Referral back to the doctor',
  sistoskopiya: 'Cystoscopy',
  siydik: 'Urinalysis',
  siydik_albumin: 'Urine albumin-to-creatinine ratio',
  spirometriya: 'Spirometry',
  surtma: 'Skin scraping for fungal microscopy and culture',
  surtma_tomoq: 'Throat swab',
  sutkalik_bosim: 'Ambulatory blood pressure monitoring',
  suyak_kostigi: 'Bone marrow examination as indicated',
  temir: 'Iron studies',
  teri: 'Skin care review',
  teri_test: 'Skin prick testing',
  timpanometriya: 'Tympanometry',
  tpi: 'Ankle-brachial index',
  troponin: 'Troponin',
  ttg: 'TSH and free T4',
  tub: 'Dilated fundus examination',
  umumiy_ige: 'Total IgE',
  uroflou: 'Uroflowmetry and post-void residual',
  uy: 'Home assessment',
  uy_mashq: 'Home program given',
  uyqu: 'Sleep study',
  uzi: 'Ultrasound',
  uzi_akush: 'Obstetric ultrasound',
  uzi_buyrak: 'Renal ultrasound',
  uzi_qorin: 'Abdominal ultrasound',
  vitamin_d: 'Vitamin D',
  xavf_rejasi: 'Safety plan',
  xolter: '24-hour Holter monitoring',
  yara: 'Wound review',
  yiqilish: 'Falls risk assessment',
  yonaltirish: 'Referral to a specialist',
  yuklama: 'Exercise stress test',
  yurish: 'Gait assessment',
  yutish: 'Swallowing assessment',
}

export const auDozAnahtari = (rol: string) => `au-${rol}-dose`
export const auSiparisAnahtari = (rol: string) => `au-${rol}-orders`
/** The role's name as the pack offers it (generated from the pack's role list). */
const AD: Readonly<Record<string, string>> = {'emergency-medicine': 'Emergency medicine', 'family-medicine': 'General practice', 'anaesthesia': 'Anaesthesia', 'neurosurgery': 'Neurosurgery', 'paediatric-surgery': 'Paediatric surgery', 'internal-medicine': 'General medicine', 'dermatology': 'Dermatology', 'endocrinology': 'Endocrinology', 'infectious-diseases': 'Infectious diseases', 'gastroenterology': 'Gastroenterology and hepatology', 'general-surgery': 'General surgery', 'cardio-thoracic-surgery': 'Cardio-thoracic surgery', 'respiratory-medicine': 'Respiratory and sleep medicine', 'ophthalmology': 'Ophthalmology', 'obstetrics-gynaecology': 'Obstetrics and gynaecology', 'vascular-surgery': 'Vascular surgery', 'cardiology': 'Cardiology', 'otolaryngology': 'Otolaryngology – head and neck surgery', 'nephrology': 'Nephrology', 'neurology': 'Neurology', 'oncology': 'Medical oncology', 'radiation-oncology': 'Radiation oncology', 'orthopaedics': 'Orthopaedic surgery', 'paediatrics': 'Paediatrics and child health', 'plastic-surgery': 'Plastic surgery', 'psychiatry': 'Psychiatry', 'radiology': 'Radiology', 'rheumatology': 'Rheumatology', 'urology': 'Urology', 'sports-medicine': 'Sport and exercise medicine', 'rehabilitation-medicine': 'Rehabilitation medicine', 'geriatric-medicine': 'Geriatric medicine', 'immunology-and-allergy': 'Immunology and allergy', 'haematology': 'Haematology', 'pain-medicine': 'Pain medicine', 'aesthetic-surgery': 'Cosmetic surgery', 'aesthetic-medicine': 'Non-surgical cosmetic procedures', 'physiotherapy': 'Physiotherapist', 'clinical-psychology': 'Psychologist', 'dietetics': 'Dietitian', 'occupational-therapy': 'Occupational therapist', 'audiology': 'Audiologist', 'podiatry': 'Podiatrist', 'speech-pathology': 'Speech pathologist'}
const ad = (rol: string) => AD[rol]

const DOZ_ALANLARI: Readonly<Record<string, string>> = {
  ilac: 'Medicine name (optional, for the record)', temel: 'Basis of the calculation', kilo: 'Weight', boy: 'Height (optional, for body-surface area)',
  bsa: 'Body-surface area, your own figure (optional)', miktar: 'Dose: per kilogram, per square metre or per dose', mod: 'The dose entered is',
  doz_sayisi: 'Doses per day', kons_mg: 'Strength: milligrams (optional)', kons_ml: 'Strength: in millilitres (optional)',
  tavan_doz_mg: 'Your own maximum single dose (optional)', tavan_gun_mg: 'Your own maximum daily dose (optional)',
}

/** A line put before the tool's note for a role whose prescribing depends on an endorsement (ULKE-BRANS-K9-MUTTEFIK). */
const ON_NOT: Readonly<Record<string, string>> = {
  podiatry: 'For podiatrists whose registration carries the Podiatry Board of Australia\'s endorsement for scheduled medicines, within that endorsement and its national list only. ',
}

function dozPaketi(x: Satir): PaketAraci {
  const var_ = new Set(dozAraciTanimi(auDozAnahtari(x.rol), x.temeller).alanlar.map((a) => a.anahtar))
  const alanlar = Object.fromEntries(Object.entries(DOZ_ALANLARI).filter(([k]) => var_.has(k)).map(([k, v]) => [k, m(v)]))
  const TEMEL: Record<string, string> = { kg: 'Per kilogram of body weight', m2: 'Per square metre of body-surface area', sabit: 'Fixed dose' }
  return {
    anahtar: auDozAnahtari(x.rol),
    roller: [x.rol],
    metin: {
      ad: m(`${ad(x.rol)}: dose calculator`),
      aciklama: m('Arithmetic on the numbers YOU enter: per kilogram, per square metre or a fixed dose, and doses per day; with a strength, the volume. The tool knows no medicine, no recommended dose and no maximum of its own.'),
      alanlar,
      secenekler: { temel: Object.fromEntries(x.temeller.map((t) => [t, m(TEMEL[t])])), ...(var_.has('mod') ? { mod: { gun: m('Per day'), doz: m('Per dose') } } : {}) },
      sayilar: {
        doz_mg: m('Single dose'), gunluk_mg: m('Daily dose'), aralik_saat: m('Time between doses'), bsa: m('Body-surface area'),
        doz_ml: m('Volume per dose'), gunluk_ml: m('Volume per day'), tavanli_doz_mg: m('Single dose within your maximum'), tavanli_doz_ml: m('Volume per dose within your maximum'),
      },
      uyarilar: {
        tavan_doz: m('The single dose worked out is above the maximum you entered'), tavan_gun: m('The daily dose worked out is above the maximum you entered'),
        kilo_birim: m('The weight is unusually high: check the unit'), ml_yuvarlanmadi: m('The volume is arithmetic, not rounded to any measuring device: check that your device can measure it'),
        ml_kucuk: m('The volume of one dose is under one millilitre: a finely graduated device is needed'),
      },
      not: m(`${ON_NOT[x.rol] ?? ''}Arithmetic on your numbers. The medicine, the dose and any maximum are the prescriber\'s decision and are checked against the product information and the current guideline by the prescriber.`),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: 'Notya\'s own arithmetic (2026-11-08); body-surface area by Mosteller RD, N Engl J Med 1987;317(17):1098. No dose from the AMH, eTG or PBS is held.', bildirim: m('Arithmetic on the numbers you entered. The dose is the prescriber\'s.') },
  }
}

function siparisPaketi(x: Satir): PaketAraci {
  const alanlar: Record<string, ReturnType<typeof m>> = { diger: m('Other (write your own)'), aciklama: m('Note') }
  for (const k of x.kalemler) alanlar[k] = m(KALEM[k])
  return {
    anahtar: auSiparisAnahtari(x.rol),
    roller: [x.rol],
    metin: {
      ad: m(`${ad(x.rol)}: order presets`),
      aciklama: m('Investigations and referrals this specialty commonly orders: tick, add your own, put them in the note or print them with a document number. Ticking orders nothing and sends nothing.'),
      alanlar,
      sayilar: { secilen: m('Items ticked') },
      not: m('Your list for the record; what to order is the clinician\'s decision. Request forms and MBS/PBS rules stay with the practice.'),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: 'Notya\'s own list (2026-11-08): item names only, no result, threshold, dose or MBS item.', bildirim: m('Your own list. Nothing is sent.') },
  }
}

const DOZLU = AU_DOZ_SIPARIS_SATIRLARI.filter((x) => x.temeller.length > 0)
export const AU_DOZ_SIPARIS_TANIMLAR: readonly AracTanimi[] = [...DOZLU.map((x) => dozAraciTanimi(auDozAnahtari(x.rol), x.temeller)), ...AU_DOZ_SIPARIS_SATIRLARI.map((x) => siparisAraciTanimi(auSiparisAnahtari(x.rol), x.kalemler))]
export const auDozSiparisAraclari = (): readonly PaketAraci[] => [...DOZLU.map(dozPaketi), ...AU_DOZ_SIPARIS_SATIRLARI.map(siparisPaketi)]
export const AU_DOZ_SIPARIS_ANAHTARLARI: readonly string[] = [...DOZLU.map((x) => auDozAnahtari(x.rol)), ...AU_DOZ_SIPARIS_SATIRLARI.map((x) => auSiparisAnahtari(x.rol))]
