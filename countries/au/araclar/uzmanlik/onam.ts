/**
 * ULKE-BRANS-DERINLIK-01 (Kaan, 2026-11-08) — Australia: THE CONSENT DISCUSSION RECORD of every role.
 *
 * Australian law asks the practitioner to warn of MATERIAL RISKS — those a reasonable person in the patient's position
 * would be likely to attach significance to, or that this practitioner knows or should know this patient would
 * (Rogers v Whitaker [1992] HCA 58; (1992) 175 CLR 479). The Medical Board's code of conduct and the shared code of
 * conduct for the other registered professions set out what informed consent involves. This tool records that the
 * discussion took place and what it covered — common elements for every role and the topics specific to that role. It
 * holds no risk percentages and no legal wording of a form: the practice's own consent form stays the document signed.
 *
 * CLASSIFIED: specialty-only — one tool per role (`au-<role>-consent`), visible to that role only. Printed on the
 * practitioner's letterhead (yazdirilir). A tick is a note; nothing is sent.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, isaret, isaretliler, metin } from '@/lib/ulke/araclar/yardimci'
import type { Sunulan } from '../../klinik/asistanAdlari'

const D = 'en-AU'
const m = (x: string) => ({ [D]: x })

const ORTAK: readonly [string, string][] = [
  ['nitelik', 'Nature and purpose of what is proposed explained in plain language'],
  ['riskler', 'Material risks discussed, including those this person said matter to them'],
  ['alternatifler', 'Alternatives discussed, including no treatment or waiting'],
  ['beklenti', 'Expected benefits, recovery and the chance of not achieving the goal discussed'],
  ['maliyet', 'Costs and out-of-pocket fees discussed (informed financial consent)'],
  ['sorular', 'Questions invited and answered'],
  ['yazili', 'Written information given or offered'],
  ['kapasite', 'Capacity to consent confirmed, or substitute decision-maker involved'],
]
const ZORUNLU = ['nitelik', 'riskler', 'alternatifler', 'sorular', 'kapasite']

type Satir = { rol: Sunulan; ad: string; konular: readonly [string, string][] }

const HEKIM = 'Medical Board of Australia. Good medical practice: a code of conduct for doctors in Australia (2020), informed consent'
const PAYLASILAN = 'Ahpra and the National Boards. Shared Code of conduct (2022), informed consent'
const MUTTEFIK: readonly Sunulan[] = ['physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology', 'podiatry', 'speech-pathology']

const S: readonly Satir[] = [
  { rol: 'emergency-medicine', ad: 'Emergency medicine', konular: [['sedasyon', 'Procedural sedation risks'], ['islem', 'Procedure-specific risks (e.g. reduction, drain, wound closure)'], ['ayrilma', 'Risks of leaving before treatment is complete']] },
  { rol: 'family-medicine', ad: 'General practice', konular: [['islem', 'Minor procedure risks (infection, bleeding, scarring)'], ['ilac', 'Medicine benefits, side effects and monitoring'], ['tarama', 'Screening: false positives, false negatives and follow-up']] },
  { rol: 'anaesthesia', ad: 'Anaesthesia', konular: [['teknik', 'Type of anaesthesia and alternatives (general, regional, sedation)'], ['sik', 'Common effects (nausea, sore throat, shivering)'], ['nadir', 'Rare serious risks (dental injury, awareness, nerve injury, anaphylaxis)'], ['oruc', 'Fasting and medicine instructions']] },
  { rol: 'neurosurgery', ad: 'Neurosurgery', konular: [['norolojik', 'New neurological deficit'], ['bos', 'CSF leak and infection'], ['kanama', 'Haemorrhage and stroke'], ['tekrar', 'Recurrence or need for further surgery']] },
  { rol: 'paediatric-surgery', ad: 'Paediatric surgery', konular: [['veli', 'Parent or guardian consent and the child\'s own view'], ['anestezi', 'Anaesthesia in childhood'], ['buyume', 'Effects on growth or later function']] },
  { rol: 'internal-medicine', ad: 'General medicine', konular: [['islem', 'Procedure-specific risks (e.g. lumbar puncture, pleural tap)'], ['ilac', 'Medicine benefits, side effects and monitoring'], ['tani', 'Diagnostic uncertainty and next steps']] },
  { rol: 'dermatology', ad: 'Dermatology', konular: [['iz', 'Scarring and pigment change'], ['nuks', 'Recurrence and need for further treatment'], ['sistemik', 'Systemic medicine risks and blood monitoring'], ['foto', 'Clinical photography and its storage']] },
  { rol: 'endocrinology', ad: 'Endocrinology', konular: [['hipo', 'Hypoglycaemia and sick-day rules'], ['izlem', 'Monitoring and dose-adjustment plan'], ['gebelik', 'Pregnancy implications of treatment']] },
  { rol: 'infectious-diseases', ad: 'Infectious diseases', konular: [['yan_etki', 'Antimicrobial side effects and interactions'], ['direnc', 'Resistance and the importance of completing or stopping as advised'], ['bildirim', 'Public-health notification where the law requires it']] },
  { rol: 'gastroenterology', ad: 'Gastroenterology and hepatology', konular: [['endoskopi', 'Endoscopy risks (perforation, bleeding, missed lesion)'], ['sedasyon', 'Sedation risks'], ['hazirlik', 'Bowel preparation and medicine holds']] },
  { rol: 'general-surgery', ad: 'General surgery', konular: [['enfeksiyon', 'Wound infection and dehiscence'], ['kanama', 'Bleeding and transfusion'], ['vte', 'Venous thromboembolism'], ['donusum', 'Conversion to open surgery or stoma']] },
  { rol: 'cardio-thoracic-surgery', ad: 'Cardio-thoracic surgery', konular: [['inme', 'Stroke and neurocognitive change'], ['ritim', 'Arrhythmia and pacing'], ['bypass', 'Cardiopulmonary bypass and transfusion'], ['solunum', 'Prolonged ventilation and air leak']] },
  { rol: 'respiratory-medicine', ad: 'Respiratory and sleep medicine', konular: [['bronkoskopi', 'Bronchoscopy risks (pneumothorax, bleeding)'], ['cpap', 'CPAP tolerance and driving responsibilities'], ['oksijen', 'Home oxygen safety and smoking']] },
  { rol: 'ophthalmology', ad: 'Ophthalmology', konular: [['gorme', 'Loss of vision'], ['enfeksiyon', 'Endophthalmitis or infection'], ['refraksiyon', 'Refractive outcome and need for glasses'], ['tekrar', 'Need for further procedures']] },
  { rol: 'obstetrics-gynaecology', ad: 'Obstetrics and gynaecology', konular: [['anne', 'Risks to the woman'], ['bebek', 'Risks to the baby'], ['dogurganlik', 'Effect on future fertility and pregnancies'], ['acil', 'Possible need for emergency caesarean or further surgery']] },
  { rol: 'vascular-surgery', ad: 'Vascular surgery', konular: [['amputasyon', 'Limb loss'], ['greft', 'Graft or stent occlusion and infection'], ['kontrast', 'Contrast and kidney injury'], ['kalp', 'Cardiac events']] },
  { rol: 'cardiology', ad: 'Cardiology', konular: [['anjio', 'Angiography risks (bleeding, vessel injury, stroke, kidney injury)'], ['cihaz', 'Device risks (lead displacement, infection)'], ['antikoagulasyon', 'Anticoagulation benefits and bleeding risk']] },
  { rol: 'otolaryngology', ad: 'Otolaryngology – head and neck surgery', konular: [['kanama', 'Post-operative haemorrhage'], ['sinir', 'Nerve injury (facial, recurrent laryngeal)'], ['isitme', 'Hearing, taste or smell change']] },
  { rol: 'nephrology', ad: 'Nephrology', konular: [['diyaliz', 'Dialysis modality, access and lifestyle'], ['biyopsi', 'Kidney biopsy bleeding'], ['nakil', 'Transplant and immunosuppression risks']] },
  { rol: 'neurology', ad: 'Neurology', konular: [['tromboliz', 'Reperfusion therapy benefit and bleeding risk'], ['antiepileptik', 'Antiseizure medicine effects and pregnancy'], ['surus', 'Driving and fitness-to-drive standards']] },
  { rol: 'oncology', ad: 'Medical oncology', konular: [['toksisite', 'Treatment toxicities and when to seek urgent help'], ['niyet', 'Intent of treatment (curative or palliative)'], ['dogurganlik', 'Fertility and pregnancy'], ['calisma', 'Clinical trial participation, if offered']] },
  { rol: 'radiation-oncology', ad: 'Radiation oncology', konular: [['akut', 'Acute effects in the treated area'], ['gec', 'Late effects and second cancers'], ['niyet', 'Intent of treatment'], ['planlama', 'Planning scans, marks and immobilisation']] },
  { rol: 'orthopaedics', ad: 'Orthopaedic surgery', konular: [['enfeksiyon', 'Infection and implant failure'], ['vte', 'Venous thromboembolism'], ['sinir', 'Nerve or vessel injury'], ['rehabilitasyon', 'Rehabilitation and time to recovery']] },
  { rol: 'paediatrics', ad: 'Paediatrics and child health', konular: [['veli', 'Parent or guardian consent and the child\'s own view'], ['asi', 'Vaccine benefits and expected reactions'], ['ilac', 'Medicine dosing by weight and side effects']] },
  { rol: 'plastic-surgery', ad: 'Plastic surgery', konular: [['iz', 'Scarring and asymmetry'], ['flep', 'Flap or graft failure'], ['tekrar', 'Revision surgery'], ['foto', 'Clinical photography and its storage']] },
  { rol: 'psychiatry', ad: 'Psychiatry', konular: [['ilac', 'Medicine benefits, side effects and monitoring'], ['ekt', 'ECT or other procedures, if proposed'], ['gizlilik', 'Confidentiality and its limits'], ['yasal', 'Mental health legislation, if it applies']] },
  { rol: 'radiology', ad: 'Radiology', konular: [['kontrast', 'Contrast reaction and kidney effects'], ['radyasyon', 'Radiation dose, and pregnancy check'], ['girisimsel', 'Interventional procedure risks (bleeding, infection)']] },
  { rol: 'rheumatology', ad: 'Rheumatology', konular: [['immunsupresyon', 'Immunosuppression and infection risk'], ['izlem', 'Blood monitoring schedule'], ['gebelik', 'Pregnancy and contraception with treatment']] },
  { rol: 'urology', ad: 'Urology', konular: [['kontinans', 'Urinary continence'], ['cinsel', 'Sexual function'], ['kanama', 'Bleeding and infection'], ['tekrar', 'Need for further procedures']] },
  { rol: 'sports-medicine', ad: 'Sport and exercise medicine', konular: [['enjeksiyon', 'Injection risks (infection, tendon effects)'], ['donus', 'Return to sport and re-injury risk'], ['madde', 'Anti-doping implications of treatment']] },
  { rol: 'rehabilitation-medicine', ad: 'Rehabilitation medicine', konular: [['program', 'Program intensity and fatigue'], ['botulinum', 'Botulinum toxin or other injection risks, if proposed'], ['hedef', 'Agreed goals and expected function']] },
  { rol: 'geriatric-medicine', ad: 'Geriatric medicine', konular: [['kapasite', 'Capacity assessment and substitute decision-maker'], ['ileri', 'Advance care planning'], ['ilac', 'Deprescribing benefits and risks']] },
  { rol: 'immunology-and-allergy', ad: 'Immunology and allergy', konular: [['provokasyon', 'Oral or drug challenge: risk of a reaction'], ['immunoterapi', 'Allergen immunotherapy: local and systemic reactions'], ['adrenalin', 'Adrenaline device and action plan']] },
  { rol: 'haematology', ad: 'Haematology', konular: [['transfuzyon', 'Transfusion risks and alternatives'], ['kemik_iligi', 'Bone marrow biopsy'], ['antikoagulasyon', 'Anticoagulation bleeding risk']] },
  { rol: 'pain-medicine', ad: 'Pain medicine', konular: [['opioid', 'Opioid risks, dependence and driving'], ['girisim', 'Interventional procedure risks'], ['hedef', 'Realistic goals for pain and function']] },
  { rol: 'aesthetic-surgery', ad: 'Cosmetic surgery', konular: [['psikolojik', 'Psychological assessment and expectations discussed'], ['iz', 'Scarring, asymmetry and revision'], ['bekleme', 'Cooling-off period before the procedure'], ['foto', 'Before-and-after photography and its use']] },
  { rol: 'aesthetic-medicine', ad: 'Non-surgical cosmetic procedures', konular: [['damar', 'Vascular occlusion and visual risk (fillers)'], ['urun', 'Product, batch and expected duration'], ['psikolojik', 'Psychological assessment and expectations discussed'], ['foto', 'Before-and-after photography and its use']] },
  { rol: 'physiotherapy', ad: 'Physiotherapy', konular: [['manuel', 'Manual therapy and manipulation risks'], ['egzersiz', 'Exercise soreness and flare plan'], ['dokunma', 'Physical contact and chaperone offered']] },
  { rol: 'clinical-psychology', ad: 'Clinical psychology', konular: [['gizlilik', 'Confidentiality and its limits'], ['yontem', 'Therapy approach and expected course'], ['kayit', 'Records, reports and who may see them']] },
  { rol: 'dietetics', ad: 'Dietetics', konular: [['diyet', 'Dietary change risks (e.g. weight change, deficiency)'], ['eliminasyon', 'Elimination diets and reintroduction'], ['ek', 'Supplements and interactions']] },
  { rol: 'occupational-therapy', ad: 'Occupational therapy', konular: [['ev', 'Home visit and modifications'], ['ekipman', 'Equipment safety and training'], ['surus', 'Driving assessment, if relevant']] },
  { rol: 'audiology', ad: 'Audiology', konular: [['kalip', 'Ear impressions and ear canal risks'], ['cihaz', 'Hearing device expectations and adjustment period'], ['yonlendirme', 'Referral for medical review where indicated']] },
  { rol: 'podiatry', ad: 'Podiatry', konular: [['cerrahi', 'Nail or minor surgery risks (infection, regrowth)'], ['dolasim', 'Healing with reduced circulation or sensation'], ['ortez', 'Orthoses: break-in and review']] },
  { rol: 'speech-pathology', ad: 'Speech pathology', konular: [['yutma', 'Swallowing assessment (including instrumental) risks'], ['diyet', 'Texture-modified diet and quality of life'], ['program', 'Therapy program and practice expectations']] },
]

export const anahtar = (r: Sunulan) => `au-${r}-consent`

function tanim(x: Satir): AracTanimi {
  const kutular = [...ORTAK.map(([k]) => k), ...x.konular.map(([k]) => k), 'tercuman']
  return {
    anahtar: anahtar(x.rol),
    tur: 'liste',
    alanlar: [metin('islem', { enCok: 80 }), ...kutular.map(isaret)],
    cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['eksik'], tarihler: [] },
    kaynak: `Rogers v Whitaker [1992] HCA 58; (1992) 175 CLR 479 (duty to warn of material risks). ${MUTTEFIK.includes(x.rol) ? PAYLASILAN : HEKIM}. A record of the discussion: no risk figures and no form wording.`,
    yazdirilir: true,
    hesapla: (g) => {
      const secili = isaretliler(g, kutular)
      if (!secili.length) return BOS_SONUC
      return { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: kutular.length }], bant: null, uyarilar: ZORUNLU.every((k) => secili.includes(k)) ? [] : ['eksik'], tarihler: [] }
    },
  }
}

function paket(x: Satir): PaketAraci {
  const alanlar: Record<string, ReturnType<typeof m>> = { islem: m('Treatment or procedure discussed (optional)'), tercuman: m('Professional interpreter used') }
  for (const [k, e] of [...ORTAK, ...x.konular]) alanlar[k] = m(e)
  return {
    anahtar: anahtar(x.rol),
    roller: [x.rol],
    metin: {
      ad: m(`${x.ad}: consent discussion record`),
      aciklama: m('Records that informed consent was discussed and what it covered — the elements every consent needs and the topics specific to this specialty. Printable for the file. The practice\'s own consent form stays the signed document.'),
      alanlar,
      sayilar: { isaretli: m('Items recorded') },
      uyarilar: { eksik: m('Not yet recorded: nature, material risks, alternatives, questions and capacity are the core of a valid consent discussion.') },
      not: m('A record of the discussion you had. Not a consent form and not legal advice.'),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: `Rogers v Whitaker (1992) 175 CLR 479; ${MUTTEFIK.includes(x.rol) ? PAYLASILAN : HEKIM}.`, bildirim: m('A record of the consent discussion. The practitioner remains responsible for obtaining valid consent.') },
  }
}

export const AU_ONAM_SATIRLARI = S
export const AU_ONAM_TANIMLAR: readonly AracTanimi[] = S.map(tanim)
export const auOnamAraclari = (): readonly PaketAraci[] => S.map(paket)
export const AU_ONAM_ANAHTARLARI: readonly string[] = S.map((x) => anahtar(x.rol))
