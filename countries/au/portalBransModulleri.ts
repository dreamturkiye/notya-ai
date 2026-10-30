/**
 * AU gold depth — per-role patient portal coaching modules (dietetics keeps `portal.beslenme`).
 *
 * CLASSIFIED: specialty-only by role. Each module names care-plan / between-visit-log /
 * care-goals tool keys for that role only. Shared UI never hard-codes these keys (wall D7).
 * Patient-facing: no diagnosis, no dose, no score. Triple Zero (000) stays on the chapter blurb.
 */
import type { Sunulan } from './klinik/asistanAdlari'

export type AuKoclukEtiket = {
  sekmeBaslik: string
  planBaslik: string
  planYok: string
  kahvalti: string
  ogle: string
  aksam: string
  atistirmalik: string
  notlar: string
  gunlukBaslik: string
  gunlukYok: string
  gunlukEkle: string
  gun: string
  ogun: string
  aciklama: string
  kaydet: string
  kaydedildi: string
  kaydedilemedi: string
  hedefBaslik: string
  hedefYok: string
  /** Empty string hides the weight card on the patient portal. */
  agirlikBaslik: string
  agirlikYok: string
  agirlikKg: string
  bmiEtiket: string
  belEtiket: string
  mesajCta: string
  mesajIpucu: string
  cipPlan: string
  cipPlanYok: string
  cipGunluk: string
  cipGunlukYok: string
  cipHedef: string
  cipHedefYok: string
  ogunAdi: Readonly<Record<string, string>>
  kimAdi: Readonly<Record<string, string>>
  hedefAdi: Readonly<Record<string, string>>
}

export type AuKoclukModulu = {
  rol: Exclude<Sunulan, 'dietetics'>
  planAraci: string
  gunlukAraci: string
  hedefAraci: string
  hedefler: readonly string[]
  etiket: AuKoclukEtiket
  /** Short AU-vs-TR note for clinicians / auditors (not shown to patients). */
  auTr: string
}

const OGUN_ADI = {
  kahvalti: 'Progress',
  ogle: 'Symptom or concern',
  aksam: 'Home task done',
  atistirmalik: 'Question for clinic',
  diger: 'Other',
} as const

function etiket(
  sekme: string,
  planBaslik: string,
  hitap: string,
  kim: string,
  slot: readonly [string, string, string, string],
  hedefAdi: Readonly<Record<string, string>>,
): AuKoclukEtiket {
  const hitapCap = hitap.charAt(0).toUpperCase() + hitap.slice(1)
  return {
    sekmeBaslik: sekme,
    planBaslik,
    planYok: `Your ${hitap} has not kept a care plan on this page yet.`,
    kahvalti: slot[0],
    ogle: slot[1],
    aksam: slot[2],
    atistirmalik: slot[3],
    notlar: `Notes from ${hitap}`,
    gunlukBaslik: 'Between-visit notes',
    gunlukYok: 'No notes yet. You can add one below.',
    gunlukEkle: 'Add a note for your clinic',
    gun: 'Date',
    ogun: 'Note type',
    aciklama: 'What you want your clinic to see (no emergency detail — call Triple Zero for that)',
    kaydet: 'Keep this note',
    kaydedildi: `Saved. ${hitapCap} can see it on your file.`,
    kaydedilemedi: 'That note could not be saved. Try again.',
    hedefBaslik: 'Goals you agreed',
    hedefYok: `No shared goals are on this page yet. ${hitapCap} records them with you at a visit.`,
    agirlikBaslik: '',
    agirlikYok: '',
    agirlikKg: '',
    bmiEtiket: '',
    belEtiket: '',
    mesajCta: `Message ${hitap}`,
    mesajIpucu: 'Questions about your plan or a between-visit note? Send a message — this is not for emergencies.',
    cipPlan: 'Care plan',
    cipPlanYok: 'None yet',
    cipGunluk: 'Between-visit notes',
    cipGunlukYok: 'Add a note',
    cipHedef: 'Care goals',
    cipHedefYok: 'None yet',
    ogunAdi: OGUN_ADI,
    kimAdi: { diyetisyen: kim, hasta: 'You' },
    hedefAdi,
  }
}

function satir(
  rol: Exclude<Sunulan, 'dietetics'>,
  planBaslik: string,
  sekme: string,
  kim: string,
  hitap: string,
  slot: readonly [string, string, string, string],
  hedefler: readonly string[],
  hedefAdi: Readonly<Record<string, string>>,
  auTr: string,
): AuKoclukModulu {
  return {
    rol,
    planAraci: `au-${rol}-care-plan`,
    gunlukAraci: `au-${rol}-between-visit-log`,
    hedefAraci: `au-${rol}-care-goals`,
    hedefler,
    auTr,
    etiket: etiket(sekme, planBaslik, hitap, kim, slot, hedefAdi),
  }
}

const HEDEF_ADI: Readonly<Record<string, string>> = {
  acil: 'Urgent-result pathway goal',
  aclik: 'Fasting goal',
  adrenalin: 'Adrenaline device goal',
  agri: 'Pain goal',
  aile: 'Family or carer included',
  aksiyon: 'Action-plan goal',
  aktivite: 'Activity goal',
  asi: 'Immunisation goal',
  ayak: 'Foot care goal',
  ayakkabi: 'Footwear goal',
  bakim: 'After-care goal',
  beslenme: 'Feeding or nutrition goal',
  bilis: 'Cognition or memory support goal',
  breys: 'Brace or boot goal',
  buyume: 'Growth check goal',
  cihaz: 'Device care goal',
  cilt: 'Skin care goal',
  damla: 'Eye-drop goal',
  destek: 'Support or carer goal',
  dinleme: 'Listening practice goal',
  diyaliz: 'Dialysis-related goal',
  diyet: 'Diet-related goal',
  dogum: 'Birth-plan discussion goal',
  donus: 'Return or safety goal',
  dusme: 'Falls-prevention goal',
  duyu: 'Sensory goal',
  egitim: 'Education goal',
  egzersiz: 'Exercise goal',
  eklem: 'Joint protection goal',
  ev: 'Home environment goal',
  fonksiyon: 'Function goal',
  foto: 'Photograph consent goal',
  gebelik: 'Pregnancy care goal',
  gelisim: 'Development goal',
  glukoz: 'Glucose goal',
  gorme: 'Vision check goal',
  gunes: 'Sun protection goal',
  gunluk: 'Daily living goal',
  guvenlik: 'Safety goal',
  hazirlik: 'Preparation goal',
  hormon: 'Hormone treatment goal',
  iddsi: 'Texture or IDDSI-related goal',
  ilac: 'Medicines goal',
  inhaler: 'Inhaler technique goal',
  is: 'Work or school goal',
  isitme: 'Hearing goal',
  iyilesme: 'Healing goal',
  izlem: 'Monitoring or review goal',
  izolasyon: 'Isolation or precautions goal',
  kanama: 'Bleeding precautions goal',
  kateter: 'Catheter or device goal',
  kontrast: 'Contrast or prep goal',
  konusma: 'Speech practice goal',
  koruma: 'Eye protection goal',
  kronik: 'Long-term condition goal',
  kurs: 'Course completion goal',
  nefes: 'Breathing / chest physio goal',
  nobet: 'Seizure or episode diary goal',
  norolojik: 'Neurological check goal',
  oksijen: 'Oxygen or breathing goal',
  okuma: 'Home readings goal',
  onleyici: 'Preventive care goal',
  pratik: 'Between-session practice goal',
  risk: 'Risk discussion goal',
  ruh: 'Mood or coping goal',
  rutin: 'Daily routine goal',
  semptom: 'Symptom goal',
  sivi: 'Fluid goal',
  soguma: 'Cooling-off / consent timing goal',
  tansiyon: 'Blood-pressure goal',
  tarama: 'Screening goal',
  tedavi: 'Treatment adherence goal',
  tetik: 'Trigger avoidance goal',
  transfuzyon: 'Transfusion-related goal',
  urun: 'Product use goal',
  uyku: 'Sleep goal',
  uzuv: 'Limb care goal',
  yara: 'Wound or recovery goal',
  yardim: 'Aid or equipment goal',
  yasam: 'Lifestyle goal',
  yuk: 'Load or return-to-load goal',
  yurume: 'Walking goal',
  yutma: 'Swallowing goal',
}

const SATIRLAR: readonly AuKoclukModulu[] = [
  satir('emergency-medicine', 'After-care plan', 'Care plan & notes', 'ED clinician', 'your clinician', ['What to watch for', 'When to return', 'Medicines or scripts given', 'Questions for follow-up'], ['izlem', 'donus', 'ilac', 'destek', 'egitim', 'aile'], { izlem: HEDEF_ADI.izlem, donus: HEDEF_ADI.donus, ilac: HEDEF_ADI.ilac, destek: HEDEF_ADI.destek, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: Triple Zero (000) + Australasian Triage Scale context; TR: 112 + Acil Tip engines. No ATS score stored here.'),
  satir('family-medicine', 'Your GP care plan', 'Care plan & diary', 'GP', 'your GP', ['Focus this week', 'Home checks or lifestyle', 'Results or medicines to bring', 'Questions for your GP'], ['onleyici', 'kronik', 'ilac', 'yasam', 'izlem', 'aile'], { onleyici: HEDEF_ADI.onleyici, kronik: HEDEF_ADI.kronik, ilac: HEDEF_ADI.ilac, yasam: HEDEF_ADI.yasam, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: RACGP Red Book / MBS items as links; wellness inside GP. TR: aile hekimliği engines + SGK. No MBS item copied.'),
  satir('anaesthesia', 'Before your anaesthetic', 'Prep plan & notes', 'anaesthetist', 'your anaesthetist', ['Fasting and prep', 'Medicines on the day', 'What to tell the team', 'Questions before anaesthetic'], ['hazirlik', 'ilac', 'aclik', 'risk', 'destek', 'aile'], { hazirlik: HEDEF_ADI.hazirlik, ilac: HEDEF_ADI.ilac, aclik: HEDEF_ADI.aclik, risk: HEDEF_ADI.risk, destek: HEDEF_ADI.destek, aile: HEDEF_ADI.aile }, 'AU: ANZCA fasting culture; peri-op checklists. TR: anestezi engines. No fasting hours invented here.'),
  satir('neurosurgery', 'Neurosurgery care plan', 'Care plan & diary', 'neurosurgeon', 'your neurosurgeon', ['Wound and recovery focus', 'Home precautions', 'Symptoms to report', 'Questions for review'], ['yara', 'norolojik', 'aktivite', 'izlem', 'egitim', 'aile'], { yara: HEDEF_ADI.yara, norolojik: HEDEF_ADI.norolojik, aktivite: HEDEF_ADI.aktivite, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: RACS / NSA pathways as clinician judgment. TR: beyin-cerrahisi engines. No grade stored.'),
  satir('paediatric-surgery', 'Your child\'s surgery plan', 'Care plan & diary', 'surgeon', 'your surgeon', ['Recovery focus', 'Home care for your child', 'What to bring to review', 'Questions for the surgeon'], ['yara', 'agri', 'beslenme', 'aktivite', 'izlem', 'aile'], { yara: HEDEF_ADI.yara, agri: HEDEF_ADI.agri, beslenme: HEDEF_ADI.beslenme, aktivite: HEDEF_ADI.aktivite, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: parent/guardian wording by age; RACS paediatric. TR: cocuk-cerrahisi. No dose invented.'),
  satir('internal-medicine', 'Physician care plan', 'Care plan & diary', 'physician', 'your physician', ['Focus this period', 'Home readings or tasks', 'Results to bring', 'Questions for review'], ['kronik', 'ilac', 'okuma', 'yasam', 'izlem', 'aile'], { kronik: HEDEF_ADI.kronik, ilac: HEDEF_ADI.ilac, okuma: HEDEF_ADI.okuma, yasam: HEDEF_ADI.yasam, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: RACP physician practice; PBS/MHR. TR: dahiliye engines + SGK. No score invented.'),
  satir('dermatology', 'Skin care plan', 'Care plan & diary', 'dermatologist', 'your dermatologist', ['Skin care focus', 'Home skin care', 'Photographs or products to bring', 'Questions for review'], ['cilt', 'urun', 'gunes', 'izlem', 'egitim', 'aile'], { cilt: HEDEF_ADI.cilt, urun: HEDEF_ADI.urun, gunes: HEDEF_ADI.gunes, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: ACD; photographs in practice record. TR: dermatoloji + Derim portal. No morphology score here.'),
  satir('endocrinology', 'Hormone care plan', 'Care plan & diary', 'endocrinologist', 'your endocrinologist', ['Hormone care focus', 'Home readings', 'Results to bring', 'Questions for review'], ['glukoz', 'hormon', 'ilac', 'yasam', 'izlem', 'aile'], { glukoz: HEDEF_ADI.glukoz, hormon: HEDEF_ADI.hormon, ilac: HEDEF_ADI.ilac, yasam: HEDEF_ADI.yasam, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: ADS/ESA practice; glucose mmol/L. TR: endokrinoloji engines. No target invented.'),
  satir('infectious-diseases', 'Infection care plan', 'Care plan & diary', 'ID physician', 'your doctor', ['Infection care focus', 'Course or isolation notes', 'Results to bring', 'Questions for review'], ['kurs', 'izolasyon', 'asi', 'izlem', 'egitim', 'aile'], { kurs: HEDEF_ADI.kurs, izolasyon: HEDEF_ADI.izolasyon, asi: HEDEF_ADI.asi, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: CDNA notifiable list (doctors). TR: enfeksiyon + bildirim. No notice sent from this panel.'),
  satir('gastroenterology', 'Digestive care plan', 'Care plan & diary', 'gastroenterologist', 'your gastroenterologist', ['Digestive care focus', 'Diet or prep at home', 'Results or prep notes', 'Questions for review'], ['diyet', 'semptom', 'hazirlik', 'ilac', 'izlem', 'aile'], { diyet: HEDEF_ADI.diyet, semptom: HEDEF_ADI.semptom, hazirlik: HEDEF_ADI.hazirlik, ilac: HEDEF_ADI.ilac, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: GESA; bowel-prep clinician wording. TR: gastroenteroloji engines. No prep hours invented.'),
  satir('general-surgery', 'Surgery care plan', 'Care plan & diary', 'surgeon', 'your surgeon', ['Recovery focus', 'Wound care at home', 'What to bring to review', 'Questions for the surgeon'], ['yara', 'agri', 'aktivite', 'beslenme', 'izlem', 'aile'], { yara: HEDEF_ADI.yara, agri: HEDEF_ADI.agri, aktivite: HEDEF_ADI.aktivite, beslenme: HEDEF_ADI.beslenme, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: RACS. TR: genel-cerrahi engines. No protocol copied.'),
  satir('respiratory-medicine', 'Breathing care plan', 'Care plan & diary', 'respiratory physician', 'your doctor', ['Breathing focus', 'Inhaler or home tasks', 'Peak flow or results to bring', 'Questions for review'], ['inhaler', 'egzersiz', 'oksijen', 'semptom', 'izlem', 'aile'], { inhaler: HEDEF_ADI.inhaler, egzersiz: HEDEF_ADI.egzersiz, oksijen: HEDEF_ADI.oksijen, semptom: HEDEF_ADI.semptom, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: TSANZ; inhaler technique clinician-owned. TR: gogus-hastaliklari. No spirometry band invented.'),
  satir('ophthalmology', 'Eye care plan', 'Care plan & diary', 'ophthalmologist', 'your ophthalmologist', ['Eye care focus', 'Drops or home care', 'What to bring to review', 'Questions for review'], ['damla', 'gorme', 'koruma', 'izlem', 'egitim', 'aile'], { damla: HEDEF_ADI.damla, gorme: HEDEF_ADI.gorme, koruma: HEDEF_ADI.koruma, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: RANZCO; VA not interpreted on portal. TR: goz engines + Gözlerim. No IOP colour here.'),
  satir('obstetrics-gynaecology', 'Pregnancy or gynaecology plan', 'Care plan & diary', 'specialist', 'your specialist', ['Visit focus', 'Home notes or kick counts', 'Results or scans to bring', 'Questions for review'], ['gebelik', 'semptom', 'tarama', 'dogum', 'izlem', 'aile'], { gebelik: HEDEF_ADI.gebelik, semptom: HEDEF_ADI.semptom, tarama: HEDEF_ADI.tarama, dogum: HEDEF_ADI.dogum, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: RANZCOG; antenatal schedule clinician-owned. TR: kadin-dogum + Gebeliğim. No gestation calculator here.'),
  satir('cardiology', 'Heart care plan', 'Care plan & diary', 'cardiologist', 'your cardiologist', ['Heart care focus', 'Home blood-pressure or activity', 'Results to bring', 'Questions for review'], ['tansiyon', 'aktivite', 'ilac', 'semptom', 'izlem', 'aile'], { tansiyon: HEDEF_ADI.tansiyon, aktivite: HEDEF_ADI.aktivite, ilac: HEDEF_ADI.ilac, semptom: HEDEF_ADI.semptom, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: CSANZ; Absolute CVD risk is link-out only. TR: kardiyoloji SCORE2-style engines. No equation copied.'),
  satir('otolaryngology', 'ENT care plan', 'Care plan & diary', 'ENT specialist', 'your ENT specialist', ['ENT care focus', 'Home care', 'Device or results to bring', 'Questions for review'], ['isitme', 'yutma', 'yara', 'cihaz', 'izlem', 'aile'], { isitme: HEDEF_ADI.isitme, yutma: HEDEF_ADI.yutma, yara: HEDEF_ADI.yara, cihaz: HEDEF_ADI.cihaz, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: ASOHNS. TR: KBB engines. No audiogram thresholds invented.'),
  satir('nephrology', 'Kidney care plan', 'Care plan & diary', 'nephrologist', 'your nephrologist', ['Kidney care focus', 'Fluid or home readings', 'Results to bring', 'Questions for review'], ['sivi', 'diyaliz', 'ilac', 'diyet', 'izlem', 'aile'], { sivi: HEDEF_ADI.sivi, diyaliz: HEDEF_ADI.diyaliz, ilac: HEDEF_ADI.ilac, diyet: HEDEF_ADI.diyet, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: ANZSN; eGFR not colour-banded here. TR: nefroloji engines. No CKD stage invented.'),
  satir('neurology', 'Neurology care plan', 'Care plan & diary', 'neurologist', 'your neurologist', ['Neurology focus', 'Home tasks or seizure diary', 'Results to bring', 'Questions for review'], ['nobet', 'ilac', 'aktivite', 'semptom', 'izlem', 'aile'], { nobet: HEDEF_ADI.nobet, ilac: HEDEF_ADI.ilac, aktivite: HEDEF_ADI.aktivite, semptom: HEDEF_ADI.semptom, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: ANZAN; stroke → Triple Zero. TR: noroloji engines. No NIHSS stored.'),
  satir('oncology', 'Oncology care plan', 'Care plan & diary', 'oncologist', 'your oncologist', ['Treatment focus', 'Home care between visits', 'Results to bring', 'Questions for review'], ['tedavi', 'semptom', 'beslenme', 'destek', 'izlem', 'aile'], { tedavi: HEDEF_ADI.tedavi, semptom: HEDEF_ADI.semptom, beslenme: HEDEF_ADI.beslenme, destek: HEDEF_ADI.destek, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: COSA/MOGA; ECOG grade tool exists separately. TR: onkoloji + SUT. No dose here.'),
  satir('orthopaedics', 'Bone and joint plan', 'Care plan & diary', 'orthopaedic surgeon', 'your surgeon', ['Joint or bone focus', 'Home exercises or brace care', 'What to bring to review', 'Questions for review'], ['egzersiz', 'breys', 'agri', 'yuk', 'izlem', 'aile'], { egzersiz: HEDEF_ADI.egzersiz, breys: HEDEF_ADI.breys, agri: HEDEF_ADI.agri, yuk: HEDEF_ADI.yuk, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: AOA; no concussion protocol copied. TR: ortopedi engines. No Ottawa rules stored.'),
  satir('paediatrics', 'Your child\'s care plan', 'Care plan & diary', 'paediatrician', 'your paediatrician', ['Focus for your child', 'Home care or feeds', 'Growth or immunisation notes', 'Questions for review'], ['buyume', 'asi', 'beslenme', 'gelisim', 'izlem', 'aile'], { buyume: HEDEF_ADI.buyume, asi: HEDEF_ADI.asi, beslenme: HEDEF_ADI.beslenme, gelisim: HEDEF_ADI.gelisim, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: WHO growth + NIP; CDC/ANZSPED still open for 2–18. TR: pediatri engines (asi/buyume/doz). No invented percentile.'),
  satir('plastic-surgery', 'Reconstructive care plan', 'Care plan & diary', 'plastic surgeon', 'your surgeon', ['Recovery focus', 'Wound care at home', 'What to bring to review', 'Questions for review'], ['yara', 'agri', 'aktivite', 'izlem', 'egitim', 'aile'], { yara: HEDEF_ADI.yara, agri: HEDEF_ADI.agri, aktivite: HEDEF_ADI.aktivite, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: ASPS; reconstructive ≠ cosmetic cooling-off. TR: plastik-cerrahi. No flap score here.'),
  satir('psychiatry', 'Psychiatry care plan', 'Care plan & notes', 'psychiatrist', 'your psychiatrist', ['Session focus', 'Between-session notes', 'Sleep or medicine notes', 'Questions for next session'], ['uyku', 'ilac', 'guvenlik', 'rutin', 'izlem', 'aile'], { uyku: HEDEF_ADI.uyku, ilac: HEDEF_ADI.ilac, guvenlik: HEDEF_ADI.guvenlik, rutin: HEDEF_ADI.rutin, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: RANZCP; K10 is separate screen tool. TR: psikiyatri. No diagnosis on portal.'),
  satir('radiology', 'Imaging prep plan', 'Prep plan & notes', 'radiologist', 'your radiologist', ['Preparation focus', 'What to bring', 'Fasting or contrast notes', 'Questions before imaging'], ['hazirlik', 'kontrast', 'acil', 'izlem', 'egitim', 'aile'], { hazirlik: HEDEF_ADI.hazirlik, kontrast: HEDEF_ADI.kontrast, acil: HEDEF_ADI.acil, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: RANZCR; report explained by referrer. TR: radyoloji. No BIRADS stored.'),
  satir('rheumatology', 'Joint care plan', 'Care plan & diary', 'rheumatologist', 'your rheumatologist', ['Joint care focus', 'Home exercises or notes', 'Results to bring', 'Questions for review'], ['eklem', 'ilac', 'egzersiz', 'semptom', 'izlem', 'aile'], { eklem: HEDEF_ADI.eklem, ilac: HEDEF_ADI.ilac, egzersiz: HEDEF_ADI.egzersiz, semptom: HEDEF_ADI.semptom, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: ARA; no DAS copied. TR: romatoloji. No score here.'),
  satir('urology', 'Urology care plan', 'Care plan & diary', 'urologist', 'your urologist', ['Urology focus', 'Home care', 'Results to bring', 'Questions for review'], ['semptom', 'kateter', 'izlem', 'egitim', 'yasam', 'aile'], { semptom: HEDEF_ADI.semptom, kateter: HEDEF_ADI.kateter, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, yasam: HEDEF_ADI.yasam, aile: HEDEF_ADI.aile }, 'AU: USANZ. TR: uroloji. No lab number on portal.'),
  satir('sports-medicine', 'Return-to-activity plan', 'Care plan & diary', 'sports physician', 'your doctor', ['Activity focus', 'Home rehab tasks', 'Pain or training notes', 'Questions for review'], ['donus', 'egzersiz', 'agri', 'yuk', 'izlem', 'aile'], { donus: HEDEF_ADI.donus, egzersiz: HEDEF_ADI.egzersiz, agri: HEDEF_ADI.agri, yuk: HEDEF_ADI.yuk, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: ACSEP; no concussion protocol copied. TR: spor-hekimligi. No RTP day invented.'),
  satir('rehabilitation-medicine', 'Rehabilitation plan', 'Care plan & diary', 'rehab physician', 'your doctor', ['Rehab focus', 'Home exercises', 'Aids or notes to bring', 'Questions for review'], ['fonksiyon', 'egzersiz', 'yardim', 'agri', 'izlem', 'aile'], { fonksiyon: HEDEF_ADI.fonksiyon, egzersiz: HEDEF_ADI.egzersiz, yardim: HEDEF_ADI.yardim, agri: HEDEF_ADI.agri, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: AFRM. TR: fizik-tedavi. No FIM copied.'),
  satir('aesthetic-surgery', 'Cosmetic surgery plan', 'Care plan & diary', 'surgeon', 'your surgeon', ['Recovery focus', 'Home care after surgery', 'Cooling-off or consent notes', 'Questions for review'], ['iyilesme', 'soguma', 'yara', 'izlem', 'egitim', 'aile'], { iyilesme: HEDEF_ADI.iyilesme, soguma: HEDEF_ADI.soguma, yara: HEDEF_ADI.yara, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: Medical Board cosmetic surgery guidelines (cooling-off). TR: estetik-cerrahi. Plan tool already exists.'),
  satir('aesthetic-medicine', 'Cosmetic care plan', 'Care plan & diary', 'clinician', 'your clinician', ['Treatment focus', 'Home after-care', 'What was agreed at the visit', 'Questions for review'], ['bakim', 'soguma', 'foto', 'izlem', 'egitim', 'aile'], { bakim: HEDEF_ADI.bakim, soguma: HEDEF_ADI.soguma, foto: HEDEF_ADI.foto, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: Board non-surgical + hair transplant under this role. TR: medikal-estetik/sac-ekimi. No filler dose.'),
  satir('physiotherapy', 'Movement plan', 'Care plan & diary', 'physiotherapist', 'your physiotherapist', ['Session focus', 'Home exercises', 'Pain or function notes', 'Questions for next session'], ['egzersiz', 'agri', 'fonksiyon', 'yuk', 'izlem', 'aile'], { egzersiz: HEDEF_ADI.egzersiz, agri: HEDEF_ADI.agri, fonksiyon: HEDEF_ADI.fonksiyon, yuk: HEDEF_ADI.yuk, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: APA; no medical diagnosis. TR: fizyoterapi. Session plan already exists; this adds coaching depth.'),
  satir('clinical-psychology', 'Session plan', 'Care plan & notes', 'psychologist', 'your psychologist', ['Session focus', 'Between-session practice', 'Mood or sleep notes', 'Questions for next session'], ['pratik', 'uyku', 'ruh', 'guvenlik', 'izlem', 'aile'], { pratik: HEDEF_ADI.pratik, uyku: HEDEF_ADI.uyku, ruh: HEDEF_ADI.ruh, guvenlik: HEDEF_ADI.guvenlik, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: APS; no photograph line; K10 separate. TR: klinik-psikolog. No score on portal.'),
  satir('occupational-therapy', 'Daily-activity plan', 'Care plan & diary', 'occupational therapist', 'your OT', ['Session focus', 'Home or work tasks', 'Task practice notes', 'Questions for next session'], ['gunluk', 'is', 'ev', 'duyu', 'izlem', 'aile'], { gunluk: HEDEF_ADI.gunluk, is: HEDEF_ADI.is, ev: HEDEF_ADI.ev, duyu: HEDEF_ADI.duyu, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: OT Australia; no medical diagnosis. TR: ergoterapi.'),
  satir('audiology', 'Hearing care plan', 'Care plan & diary', 'audiologist', 'your audiologist', ['Hearing focus', 'Device care at home', 'Listening diary notes', 'Questions for review'], ['cihaz', 'dinleme', 'bakim', 'izlem', 'egitim', 'aile'], { cihaz: HEDEF_ADI.cihaz, dinleme: HEDEF_ADI.dinleme, bakim: HEDEF_ADI.bakim, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: Audiology Australia; hearing figures stay in hearing tools. TR: odyoloji.'),
  satir('cardio-thoracic-surgery', 'Chest surgery plan', 'Care plan & diary', 'surgeon', 'your surgeon', ['Recovery focus', 'Wound and drain care', 'What to bring to review', 'Questions for the surgeon'], ['yara', 'nefes', 'aktivite', 'agri', 'izlem', 'aile'], { yara: HEDEF_ADI.yara, nefes: HEDEF_ADI.nefes, aktivite: HEDEF_ADI.aktivite, agri: HEDEF_ADI.agri, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: Board split cardio-thoracic (not TR thoracic alone). TR: gogus-cerrahisi.'),
  satir('vascular-surgery', 'Vascular care plan', 'Care plan & diary', 'vascular surgeon', 'your surgeon', ['Recovery focus', 'Limb or wound care', 'What to bring to review', 'Questions for the surgeon'], ['uzuv', 'yara', 'yurume', 'ilac', 'izlem', 'aile'], { uzuv: HEDEF_ADI.uzuv, yara: HEDEF_ADI.yara, yurume: HEDEF_ADI.yurume, ilac: HEDEF_ADI.ilac, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: Board vascular split. TR: kalp-damar-cerrahisi vessel half.'),
  satir('radiation-oncology', 'Radiotherapy plan', 'Care plan & diary', 'radiation oncologist', 'your doctor', ['Treatment focus', 'Home care during radiotherapy', 'Side-effect notes', 'Questions for review'], ['tedavi', 'cilt', 'beslenme', 'semptom', 'izlem', 'aile'], { tedavi: HEDEF_ADI.tedavi, cilt: HEDEF_ADI.cilt, beslenme: HEDEF_ADI.beslenme, semptom: HEDEF_ADI.semptom, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: RANZCR RO; no dose stored. TR: covered under onkoloji chapter depth.'),
  satir('geriatric-medicine', 'Later-life care plan', 'Care plan & diary', 'geriatrician', 'your geriatrician', ['Care focus', 'Home supports or medicines', 'Results or carer notes', 'Questions for review'], ['dusme', 'ilac', 'beslenme', 'bilis', 'izlem', 'aile'], { dusme: HEDEF_ADI.dusme, ilac: HEDEF_ADI.ilac, beslenme: HEDEF_ADI.beslenme, 'bilis': HEDEF_ADI['bilis'], izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: ANZSGM; medicines list culture. TR: maps to dahiliye-like depth.'),
  satir('immunology-and-allergy', 'Allergy care plan', 'Care plan & diary', 'immunologist', 'your immunologist', ['Allergy care focus', 'Action plan at home', 'Triggers or adrenaline notes', 'Questions for review'], ['aksiyon', 'tetik', 'adrenalin', 'izlem', 'egitim', 'aile'], { aksiyon: HEDEF_ADI.aksiyon, tetik: HEDEF_ADI.tetik, adrenalin: HEDEF_ADI.adrenalin, izlem: HEDEF_ADI.izlem, egitim: HEDEF_ADI.egitim, aile: HEDEF_ADI.aile }, 'AU: ASCIA action plans clinician-owned. TR: immunology not a separate TR chapter key.'),
  satir('haematology', 'Blood care plan', 'Care plan & diary', 'haematologist', 'your haematologist', ['Blood care focus', 'Home care notes', 'Results to bring', 'Questions for review'], ['kanama', 'transfuzyon', 'ilac', 'semptom', 'izlem', 'aile'], { kanama: HEDEF_ADI.kanama, transfuzyon: HEDEF_ADI.transfuzyon, ilac: HEDEF_ADI.ilac, semptom: HEDEF_ADI.semptom, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: HSANZ. TR: maps to dahiliye/onko adjacent.'),
  satir('pain-medicine', 'Pain care plan', 'Care plan & diary', 'pain specialist', 'your pain specialist', ['Pain care focus', 'Home strategies', 'Pain diary notes', 'Questions for review'], ['agri', 'uyku', 'aktivite', 'ilac', 'izlem', 'aile'], { agri: HEDEF_ADI.agri, uyku: HEDEF_ADI.uyku, aktivite: HEDEF_ADI.aktivite, ilac: HEDEF_ADI.ilac, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: FPM ANZCA; no opioid dose invented. TR: maps to rehab/pain adjacent.'),
  satir('podiatry', 'Foot care plan', 'Care plan & diary', 'podiatrist', 'your podiatrist', ['Foot care focus', 'Footwear or home care', 'Wound or pain notes', 'Questions for review'], ['ayak', 'ayakkabi', 'yara', 'agri', 'izlem', 'aile'], { ayak: HEDEF_ADI.ayak, ayakkabi: HEDEF_ADI.ayakkabi, yara: HEDEF_ADI.yara, agri: HEDEF_ADI.agri, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: Podiatry Board / APodA. TR: no direct pediatri equivalent — AU-only allied.'),
  satir('speech-pathology', 'Speech and swallow plan', 'Care plan & diary', 'speech pathologist', 'your speech pathologist', ['Session focus', 'Home practice', 'Swallow or speech notes', 'Questions for next session'], ['pratik', 'yutma', 'konusma', 'iddsi', 'izlem', 'aile'], { pratik: HEDEF_ADI.pratik, yutma: HEDEF_ADI.yutma, konusma: HEDEF_ADI.konusma, iddsi: HEDEF_ADI.iddsi, izlem: HEDEF_ADI.izlem, aile: HEDEF_ADI.aile }, 'AU: SPA; IDDSI shared with dietetics. TR: no direct chapter — AU-only allied.'),
]

export const AU_KOCLUK_MODULLERI: Readonly<Record<string, AuKoclukModulu>> = Object.fromEntries(
  SATIRLAR.map((s) => [s.rol, s]),
)

export const AU_KOCLUK_ROLLERI: readonly string[] = SATIRLAR.map((s) => s.rol)

export const AU_KOCLUK_ANAHTARLARI: readonly string[] = SATIRLAR.flatMap((s) => [s.planAraci, s.gunlukAraci, s.hedefAraci])
