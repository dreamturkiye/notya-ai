/**
 * ULKE-BRANS-DERINLIK-05 (Kaan, 2026-11-08) — Australia: THE SPECIALTY REPORT of every role, printed on the
 * practitioner's letterhead with the document number and verification QR code of BELGE-NO-01, so it can be given to the
 * patient or sent to the referring practitioner and checked by whoever receives it.
 *
 * Each role's report has the sections its specialists write (an echocardiography/ECG report, an audiological assessment,
 * a spirometry report, a dermoscopy report …). The sections hold the practitioner's own words — what was measured and
 * found, and their impression. No section is pre-filled with a normal value, a reference range or a diagnosis; the
 * specialty score tools (./index.ts) sit beside it for the numbers.
 *
 * CLASSIFIED: specialty-only — one tool per role (`au-<role>-report`), visible to that role only.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, metin, tarih } from '@/lib/ulke/araclar/yardimci'
import type { Sunulan } from '../../klinik/asistanAdlari'

const D = 'en-AU'
const m = (x: string) => ({ [D]: x })

type Satir = { rol: Sunulan; ad: string; bolumler: readonly [string, string][] }

const S: readonly Satir[] = [
  { rol: 'emergency-medicine', ad: 'Emergency department discharge letter', bolumler: [['seyir', 'Course in the department'], ['tetkik', 'Investigations and results'], ['taburcu', 'Discharge condition and safety-net advice']] },
  { rol: 'family-medicine', ad: 'GP referral letter', bolumler: [['soru', 'Question for the specialist'], ['oyku', 'Relevant history, medicines and allergies'], ['tetkik', 'Investigations to date']] },
  { rol: 'anaesthesia', ad: 'Pre-anaesthetic assessment report', bolumler: [['havayolu', 'Airway assessment'], ['komorbidite', 'Comorbidities and functional capacity'], ['plan', 'Anaesthetic plan discussed']] },
  { rol: 'neurosurgery', ad: 'Neurosurgical consultation report', bolumler: [['norolojik', 'Neurological examination'], ['goruntu', 'Imaging reviewed'], ['secenek', 'Options discussed']] },
  { rol: 'paediatric-surgery', ad: 'Paediatric surgical report', bolumler: [['muayene', 'Examination'], ['goruntu', 'Imaging and investigations'], ['plan', 'Surgical plan discussed with the family']] },
  { rol: 'internal-medicine', ad: 'General medicine consultation report', bolumler: [['sorunlar', 'Problem list'], ['tetkik', 'Investigations and results'], ['ilac', 'Medicine review']] },
  { rol: 'dermatology', ad: 'Dermoscopy and skin examination report', bolumler: [['lezyon', 'Lesion site, size and morphology'], ['dermoskopi', 'Dermoscopic features'], ['foto', 'Photographs taken (reference)']] },
  { rol: 'endocrinology', ad: 'Endocrinology report', bolumler: [['metabolik', 'Metabolic and hormonal results'], ['izlem', 'Glucose / device data reviewed'], ['komplikasyon', 'Complication screening']] },
  { rol: 'infectious-diseases', ad: 'Infectious diseases consultation report', bolumler: [['mikrobiyoloji', 'Microbiology results'], ['antimikrobiyal', 'Antimicrobial history'], ['izlem', 'Monitoring plan']] },
  { rol: 'gastroenterology', ad: 'Endoscopy report', bolumler: [['islem', 'Procedure and sedation'], ['bulgu', 'Findings by segment'], ['biyopsi', 'Biopsies and therapy']] },
  { rol: 'general-surgery', ad: 'Surgical consultation report', bolumler: [['muayene', 'Examination'], ['goruntu', 'Imaging and investigations'], ['secenek', 'Options and risks discussed']] },
  { rol: 'cardio-thoracic-surgery', ad: 'Cardio-thoracic surgical report', bolumler: [['fonksiyon', 'Cardiac and lung function results'], ['goruntu', 'Imaging and angiography reviewed'], ['secenek', 'Options and risks discussed']] },
  { rol: 'respiratory-medicine', ad: 'Spirometry and lung function report', bolumler: [['olcum', 'Measured values (pre and post bronchodilator)'], ['kalite', 'Test quality and effort'], ['yorum', 'Pattern described']] },
  { rol: 'ophthalmology', ad: 'Ophthalmic examination report', bolumler: [['gorme', 'Visual acuity and refraction'], ['bas', 'Intraocular pressure'], ['fundus', 'Anterior segment and fundus findings']] },
  { rol: 'obstetrics-gynaecology', ad: 'Obstetric / gynaecological report', bolumler: [['muayene', 'Examination'], ['usg', 'Ultrasound findings'], ['plan', 'Plan discussed']] },
  { rol: 'vascular-surgery', ad: 'Vascular assessment report', bolumler: [['basinc', 'Ankle, toe and arm pressures, indices'], ['dupleks', 'Duplex findings'], ['secenek', 'Options discussed']] },
  { rol: 'cardiology', ad: 'Echocardiography and ECG report', bolumler: [['ekg', 'ECG findings and intervals'], ['eko', 'Echocardiography findings (chambers, function, valves)'], ['karsilastirma', 'Comparison with previous studies']] },
  { rol: 'otolaryngology', ad: 'ENT examination report', bolumler: [['muayene', 'Ear, nose and throat examination'], ['endoskopi', 'Endoscopy findings'], ['isitme', 'Hearing tests reviewed']] },
  { rol: 'nephrology', ad: 'Nephrology report', bolumler: [['bobrek', 'Kidney function and urine results'], ['diyaliz', 'Dialysis adequacy and access'], ['ilac', 'Medicine review for kidney function']] },
  { rol: 'neurology', ad: 'Neurophysiology / neurology report', bolumler: [['muayene', 'Neurological examination'], ['ncs', 'Nerve conduction / EMG / EEG findings'], ['goruntu', 'Imaging reviewed']] },
  { rol: 'oncology', ad: 'Oncology treatment summary', bolumler: [['tani', 'Diagnosis, stage and pathology as reported'], ['tedavi', 'Treatment given and response'], ['toksisite', 'Toxicities recorded']] },
  { rol: 'radiation-oncology', ad: 'Radiation therapy summary', bolumler: [['hedef', 'Treated site and intent'], ['doz', 'Dose and fractionation delivered'], ['reaksiyon', 'Acute reactions recorded']] },
  { rol: 'orthopaedics', ad: 'Orthopaedic assessment report', bolumler: [['muayene', 'Examination and range of motion'], ['goruntu', 'Imaging reviewed'], ['secenek', 'Options discussed']] },
  { rol: 'paediatrics', ad: 'Paediatric report', bolumler: [['buyume', 'Growth and development'], ['muayene', 'Examination'], ['asi', 'Immunisation status']] },
  { rol: 'plastic-surgery', ad: 'Plastic surgery report', bolumler: [['yara', 'Wound, scar or defect described'], ['foto', 'Photographs taken (reference)'], ['secenek', 'Reconstructive options discussed']] },
  { rol: 'psychiatry', ad: 'Psychiatric assessment report', bolumler: [['durum', 'Mental state examination'], ['risk', 'Risk assessment'], ['formulasyon', 'Formulation']] },
  { rol: 'radiology', ad: 'Imaging report', bolumler: [['teknik', 'Technique'], ['bulgu', 'Findings'], ['karsilastirma', 'Comparison']] },
  { rol: 'rheumatology', ad: 'Rheumatology report', bolumler: [['eklem', 'Joint examination and counts'], ['laboratuvar', 'Laboratory and serology results'], ['aktivite', 'Disease activity measures']] },
  { rol: 'urology', ad: 'Urology report', bolumler: [['muayene', 'Examination'], ['akim', 'Flow, residual and imaging results'], ['secenek', 'Options discussed']] },
  { rol: 'sports-medicine', ad: 'Sports medicine assessment report', bolumler: [['muayene', 'Examination and functional tests'], ['yuk', 'Training load reviewed'], ['donus', 'Return-to-activity plan discussed']] },
  { rol: 'rehabilitation-medicine', ad: 'Rehabilitation assessment report', bolumler: [['fonksiyon', 'Functional measures'], ['hedef', 'Goals agreed'], ['ekip', 'Team input']] },
  { rol: 'geriatric-medicine', ad: 'Comprehensive geriatric assessment report', bolumler: [['bilissel', 'Cognition and mood'], ['fonksiyon', 'Function, falls and mobility'], ['ilac', 'Medicine review']] },
  { rol: 'immunology-and-allergy', ad: 'Allergy assessment report', bolumler: [['test', 'Skin prick / specific IgE / challenge results'], ['reaksiyon', 'Reaction history'], ['plan', 'Action plan provided']] },
  { rol: 'haematology', ad: 'Haematology report', bolumler: [['kan', 'Blood count and film results'], ['koagulasyon', 'Coagulation results'], ['kemik_iligi', 'Bone marrow findings, if done']] },
  { rol: 'pain-medicine', ad: 'Pain medicine assessment report', bolumler: [['agri', 'Pain history and measures'], ['fonksiyon', 'Function and mood'], ['ilac', 'Medicine and opioid review']] },
  { rol: 'aesthetic-surgery', ad: 'Cosmetic surgery consultation report', bolumler: [['degerlendirme', 'Assessment and measurements'], ['psikolojik', 'Psychological screening outcome'], ['secenek', 'Options, risks and costs discussed']] },
  { rol: 'aesthetic-medicine', ad: 'Cosmetic procedure record', bolumler: [['bolge', 'Areas treated'], ['urun', 'Product, batch and amount'], ['sonrasi', 'Aftercare given']] },
  { rol: 'physiotherapy', ad: 'Physiotherapy assessment report', bolumler: [['olcum', 'Range of motion, strength and gait'], ['olcek', 'Outcome measures'], ['plan', 'Treatment plan']] },
  { rol: 'clinical-psychology', ad: 'Psychological assessment report', bolumler: [['olcekler', 'Psychometric measures administered'], ['formulasyon', 'Formulation'], ['plan', 'Treatment plan']] },
  { rol: 'dietetics', ad: 'Dietetic assessment report', bolumler: [['antropometri', 'Anthropometry'], ['alim', 'Intake assessment'], ['plan', 'Nutrition plan']] },
  { rol: 'occupational-therapy', ad: 'Occupational therapy functional report', bolumler: [['fonksiyon', 'Functional assessment'], ['ev', 'Home environment'], ['oneri', 'Equipment and modification recommendations']] },
  { rol: 'audiology', ad: 'Audiological assessment report', bolumler: [['odyogram', 'Audiogram (air and bone conduction)'], ['timpanogram', 'Tympanometry and reflexes'], ['konusma', 'Speech testing']] },
  { rol: 'podiatry', ad: 'Podiatric assessment report', bolumler: [['vaskuler', 'Vascular assessment (pulses, pressures)'], ['norolojik', 'Neurological assessment (monofilament, vibration)'], ['yara', 'Wound or skin findings']] },
  { rol: 'speech-pathology', ad: 'Swallowing / communication assessment report', bolumler: [['yutma', 'Swallowing assessment findings'], ['iletisim', 'Communication assessment findings'], ['oneri', 'Diet texture and strategy recommendations']] },
]

const anahtar = (r: Sunulan) => `au-${r}-report`

function tanim(x: Satir): AracTanimi {
  const bolum = [...x.bolumler.map(([k]) => k), 'sonuc', 'oneri']
  return {
    anahtar: anahtar(x.rol),
    tur: 'liste',
    alanlar: [tarih('tarih', true), metin('endikasyon', { enCok: 80 }), ...bolum.map((k) => metin(k, { uzun: true })), metin('kopya', { enCok: 80 })],
    cikti: { sayilar: ['dolu'], bantlar: [], uyarilar: ['sonuc_yok'], tarihler: ['tarih'] },
    kaynak: null,
    yazdirilir: true,
    hesapla: (g) => {
      const dolu = bolum.filter((k) => typeof g[k] === 'string' && (g[k] as string).trim()).length
      if (!dolu) return BOS_SONUC
      return { tamam: true, sayilar: [{ anahtar: 'dolu', deger: dolu, ondalik: 0, enCok: bolum.length }], bant: null, uyarilar: typeof g.sonuc === 'string' && g.sonuc.trim() ? [] : ['sonuc_yok'], tarihler: typeof g.tarih === 'string' ? [{ anahtar: 'tarih', tarih: g.tarih }] : [] }
    },
  }
}

function paket(x: Satir): PaketAraci {
  const alanlar: Record<string, ReturnType<typeof m>> = { tarih: m('Date of the assessment or study (optional)'), endikasyon: m('Reason for the report (optional)'), sonuc: m('Impression'), oneri: m('Recommendations'), kopya: m('Copy to (optional)') }
  for (const [k, e] of x.bolumler) alanlar[k] = m(e)
  return {
    anahtar: anahtar(x.rol),
    roller: [x.rol],
    metin: {
      ad: m(x.ad),
      aciklama: m('A structured report in your own words, printed on your letterhead with a document number and a verification code, to give to the patient or send to the referrer. Nothing is pre-filled and nothing is sent from this screen.'),
      alanlar,
      sayilar: { dolu: m('Sections written') },
      uyarilar: { sonuc_yok: m('No impression written yet.') },
      tarihler: { tarih: m('Date of the assessment') },
      not: m('Your report, in your words. Read it before you print or send it.'),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: 'Notya\'s own report outline (2026-11-08): section headings only, no third-party content; printed with the BELGE-NO-01 document number and verification code.', bildirim: m('Your report, printed on your letterhead with a document number. Nothing is sent from this screen.') },
  }
}

export const AU_RAPOR_SATIRLARI = S
export const AU_RAPOR_TANIMLAR: readonly AracTanimi[] = S.map(tanim)
export const auRaporAraclari = (): readonly PaketAraci[] => S.map(paket)
export const AU_RAPOR_ANAHTARLARI: readonly string[] = S.map((x) => anahtar(x.rol))
