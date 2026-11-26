/**
 * TR-PROTOKOL-KUTUPHANESI — international society documents used in Turkish practice (KAYNAK-BIRLESTIRME-ESC, 2026-11-26).
 *
 *  - ESC: every guideline / consensus document on the ESC's own "All ESC Practice Guidelines" listing, read 2026-11-26. TKD
 *    endorses and translates ESC guidelines, so they are the cardiology practice authority in Türkiye (TURKISH_REFS
 *    kardiyoloji). Research log: docs/kaynak/ESC-KILAVUZLARI.md.
 *  - GOLD / GINA (via TTD), KDIGO (via Türk Nefroloji Derneği), EAU (via TÜD), ERC (acil / anestezi resüsitasyon) — the
 *    international sources the static TR stacks already name. Research log: docs/kaynak/PROTOKOL-KUTUPHANESI-ARASTIRMA.md.
 *
 * Same rule as belgeler.ts: a year is recorded only when the society's own official listing / page names the document with
 * it. A Turkish (TKD) version is named only when found on tkd.org.tr — none could be confirmed on 2026-11-26 (see the log).
 */
import type { BransKodu, OdakGuncellemesi, ProtokolBelgesi } from './tipler'

export const ULUSLARARASI_ARASTIRMA_TARIHI = '2026-11-26'
const T = ULUSLARARASI_ARASTIRMA_TARIHI

/** The ESC's official listing of its current guidelines (read in full 2026-11-26) — the only page the monthly check reads for ESC. */
export const ESC_LISTESI = 'https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/'
const escUrl = (slug: string) => `${ESC_LISTESI}${slug}/`
const TKD_NOTU = 'TKD Türkçe sürümü tkd.org.tr\'de bu kılavuz için doğrulanamadı (TKD 33 ESC kılavuzunu çevirdiğini belirtiyor; kılavuz bazında liste okunamadı).'

type EscSatiri = {
  id: string
  yil: number
  /** Title exactly as the ESC listing gives it. */
  ozgun: string
  /** Turkish title. */
  baslik: string
  /** Turkish short name for the prompt line and chips. */
  kisa: string
  slug: string
  branslar: BransKodu[]
  /** Lower-case topic words (TR + EN). The citation lock binds an "ESC <year>" mention to a guideline through these. */
  konu: string[]
  /** Lower-case names used with "ESC" in text (TR + EN): "atriyal fibrilasyon", "af", "atrial fibrillation". */
  adlar: string[]
  ortak?: string
  tur?: ProtokolBelgesi['tur']
  odak?: OdakGuncellemesi[]
  durum?: ProtokolBelgesi['durum']
  yerineGelen?: string
  not?: string
}

/** Citation names: "esc af kılavuz", "esc 2024 af", "esc/tkd 2024 af", "2024 esc af" (+ the focused-update years). */
function escAdlari(s: EscSatiri): string[] {
  const kod = (s.ortak || 'ESC').toLocaleLowerCase('tr-TR')
  const yillar = [s.yil, ...(s.odak || []).map((o) => o.yil)]
  const out = new Set<string>()
  for (const ad of s.adlar) {
    for (const k of new Set(['esc', kod])) {
      out.add(`${k} ${ad} kılavuz`)
      out.add(`${k} ${ad} guideline`)
      for (const y of yillar) {
        out.add(`${k} ${y} ${ad}`)
        out.add(`${y} ${k} ${ad}`)
      }
    }
    for (const y of yillar) out.add(`esc/tkd ${y} ${ad}`)
  }
  return [...out]
}

const ESC_SATIRLARI: EscSatiri[] = [
  // ─── 2026 (ESC Congress 2026; EHJ, 28 August 2026) ─────────────────────────────────────────────────────────────────
  { id: 'esc-kalp-yetersizligi-2026', yil: 2026, ozgun: '2026 ESC Guidelines for the management of heart failure', baslik: 'Kalp Yetersizliği Yönetimi Kılavuzu', kisa: 'ESC Kalp Yetersizliği Kılavuzu', slug: 'heart-failure',
    branslar: ['kardiyoloji', 'dahiliye', 'kalp-damar-cerrahisi', 'acil-tip'],
    konu: ['kalp yetersizliği', 'kalp yetmezliği', 'ky', 'heart failure', 'hfref', 'hfpef', 'hfmref', 'dekompanse', 'ejeksiyon fraksiyonu'],
    adlar: ['kalp yetersizliği', 'kalp yetmezliği', 'ky', 'heart failure'],
    not: 'EHJ, DOI 10.1093/eurheartj/ehag100. 2021 kılavuzu ve 2023 odak güncellemesinin yerini aldı (ESC listesinde artık yalnız 2026 sürümü var).' },
  { id: 'esc-kvh-kbh-2026', yil: 2026, ozgun: '2026 ESC Guidelines for the management of cardiovascular disease and chronic kidney disease', baslik: 'Kardiyovasküler Hastalık ve Kronik Böbrek Hastalığı Yönetimi Kılavuzu', kisa: 'ESC KVH ve Kronik Böbrek Hastalığı Kılavuzu', slug: 'cvd-chronic-kidney-disease',
    branslar: ['kardiyoloji', 'nefroloji', 'dahiliye'],
    konu: ['kronik böbrek hastalığı', 'kbh', 'ckd', 'böbrek', 'egfr', 'albüminüri', 'kidney'],
    adlar: ['kvh ve kbh', 'kronik böbrek hastalığı', 'kbh', 'cardiovascular disease and chronic kidney disease', 'ckd'],
    not: 'EHJ, DOI 10.1093/eurheartj/ehag098. İlk ESC KVH-KBH kılavuzu; ACC haberine göre ERA ile geliştirildi (ESC sayfası ortak kuruluş adı vermiyor).' },
  { id: 'esc-kardiyak-rehabilitasyon-2026', yil: 2026, ozgun: '2026 ESC Guidelines on Cardiac Rehabilitation', baslik: 'Kardiyak Rehabilitasyon Kılavuzu', kisa: 'ESC Kardiyak Rehabilitasyon Kılavuzu', slug: 'cardiac-rehabilitation',
    branslar: ['kardiyoloji', 'fizik-tedavi', 'fizyoterapi'],
    konu: ['kardiyak rehabilitasyon', 'kalp rehabilitasyonu', 'cardiac rehabilitation', 'egzersiz eğitimi', 'faz ii'],
    adlar: ['kardiyak rehabilitasyon', 'kalp rehabilitasyonu', 'cardiac rehabilitation'],
    not: 'EHJ, DOI 10.1093/eurheartj/ehag099. İlk ESC kardiyak rehabilitasyon kılavuzu.' },
  { id: 'esc-evrensel-mi-tanimi-2026', yil: 2026, ozgun: 'Fifth Universal Definition of Myocardial Infarction (2026)', baslik: 'Beşinci Evrensel Miyokard Enfarktüsü Tanımı', kisa: 'ESC/ACC/AHA/WHF Beşinci Evrensel MI Tanımı', slug: 'universal-definition-myocardial-infarction',
    tur: 'uluslararasi-uzlasi', branslar: ['kardiyoloji', 'acil-tip', 'dahiliye'],
    konu: ['miyokard enfarktüsü', 'enfarktüs', 'mi', 'troponin', 'miyokard hasarı', 'myocardial infarction', 'evrensel tanım'],
    adlar: ['evrensel miyokard enfarktüsü tanımı', 'evrensel mi tanımı', 'universal definition of myocardial infarction'],
    not: 'ESC/ACC/AHA/WHF ortak uzlaşı belgesi (kılavuz değil); EHJ, DOI 10.1093/eurheartj/ehag101. ESC sayfası 2018 Dördüncü Tanım\'ın durumunu belirtmiyor.' },
  // ─── 2025 ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  { id: 'esc-kapak-2025', yil: 2025, ozgun: '2025 ESC/EACTS Guidelines for the management of valvular heart disease', baslik: 'Kapak Hastalıkları Yönetimi Kılavuzu', kisa: 'ESC/EACTS Kapak Hastalıkları Kılavuzu', slug: 'valvular-heart-disease', ortak: 'ESC/EACTS',
    branslar: ['kardiyoloji', 'kalp-damar-cerrahisi'],
    konu: ['kapak', 'aort darlığı', 'aort yetersizliği', 'mitral', 'triküspit', 'tavi', 'tavr', 'valvular', 'valvüler'],
    adlar: ['kapak hastalıkları', 'kapak', 'valvular heart disease'] },
  { id: 'esc-miyokardit-perikardit-2025', yil: 2025, ozgun: '2025 ESC Guidelines for the management of myocarditis and pericarditis', baslik: 'Miyokardit ve Perikardit Yönetimi Kılavuzu', kisa: 'ESC Miyokardit ve Perikardit Kılavuzu', slug: 'myocarditis-and-pericarditis',
    branslar: ['kardiyoloji', 'acil-tip', 'dahiliye'],
    konu: ['miyokardit', 'perikardit', 'perikardiyal', 'myocarditis', 'pericarditis', 'kolşisin'],
    adlar: ['miyokardit ve perikardit', 'miyokardit', 'perikardit', 'myocarditis and pericarditis'] },
  { id: 'esc-gebelik-2025', yil: 2025, ozgun: '2025 ESC Guidelines for the management of cardiovascular disease and pregnancy', baslik: 'Gebelikte Kardiyovasküler Hastalık Yönetimi Kılavuzu', kisa: 'ESC Gebelik ve Kardiyovasküler Hastalık Kılavuzu', slug: 'cardiovascular-diseases-during-pregnancy-management-of',
    branslar: ['kardiyoloji', 'kadin-hastaliklari-dogum'],
    konu: ['gebelik', 'gebe', 'pregnancy', 'peripartum', 'postpartum', 'lohusa'],
    adlar: ['gebelik ve kardiyovasküler hastalık', 'gebelikte kardiyovasküler hastalık', 'gebelik', 'cardiovascular disease and pregnancy', 'pregnancy'] },
  { id: 'esc-dislipidemi-2019', yil: 2019, ozgun: '2019 ESC/EAS Guidelines for the management of dyslipidaemias', baslik: 'Dislipidemi Yönetimi Kılavuzu', kisa: 'ESC/EAS Dislipidemi Kılavuzu', slug: 'dyslipidaemias-management', ortak: 'ESC/EAS',
    odak: [{ yil: 2025, baslik: '2025 Focused Update of the 2019 ESC/EAS Guidelines for the management of dyslipidaemias', url: escUrl('dyslipidaemias') }],
    branslar: ['kardiyoloji', 'dahiliye', 'endokrinoloji', 'aile-hekimligi'],
    konu: ['dislipidemi', 'lipid', 'ldl', 'kolesterol', 'statin', 'trigliserid', 'lp(a)', 'dyslipidaemia', 'dyslipidemia'],
    adlar: ['dislipidemi', 'lipid', 'dyslipidaemias', 'dyslipidemia'],
    not: '2019 kılavuzu + 2025 odak güncellemesi birlikte geçerli (ESC listesi ikisini de güncel olarak gösteriyor).' },
  { id: 'esc-ruh-sagligi-uzlasi-2025', yil: 2025, ozgun: '2025 ESC Clinical Consensus Statement on mental health and cardiovascular disease', baslik: 'Ruh Sağlığı ve Kardiyovasküler Hastalık Klinik Uzlaşı Bildirgesi', kisa: 'ESC Ruh Sağlığı ve KVH Uzlaşı Bildirgesi', slug: 'mental-health-and-cvd',
    tur: 'uluslararasi-uzlasi', branslar: ['kardiyoloji', 'psikiyatri'],
    konu: ['ruh sağlığı', 'depresyon', 'anksiyete', 'mental health', 'psikolojik'],
    adlar: ['ruh sağlığı ve kardiyovasküler hastalık', 'ruh sağlığı', 'mental health and cardiovascular disease'],
    not: 'Klinik uzlaşı bildirgesidir (kılavuz değil); ESC kılavuz listesinde yer alıyor.' },
  // ─── 2024 ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  { id: 'esc-atriyal-fibrilasyon-2024', yil: 2024, ozgun: '2024 ESC Guidelines for the management of atrial fibrillation', baslik: 'Atriyal Fibrilasyon Yönetimi Kılavuzu', kisa: 'ESC Atriyal Fibrilasyon Kılavuzu', slug: 'atrial-fibrillation',
    branslar: ['kardiyoloji', 'dahiliye', 'noroloji', 'acil-tip', 'kalp-damar-cerrahisi'],
    konu: ['atriyal fibrilasyon', 'af', 'atrial fibrillation', 'cha2ds2', 'noak', 'doak', 'ablasyon'],
    adlar: ['atriyal fibrilasyon', 'af', 'atrial fibrillation'] },
  { id: 'esc-kronik-koroner-sendrom-2024', yil: 2024, ozgun: '2024 ESC Guidelines for the management of chronic coronary syndromes', baslik: 'Kronik Koroner Sendromlar Yönetimi Kılavuzu', kisa: 'ESC Kronik Koroner Sendromlar Kılavuzu', slug: 'chronic-coronary-syndromes',
    branslar: ['kardiyoloji', 'kalp-damar-cerrahisi', 'dahiliye'],
    konu: ['kronik koroner sendrom', 'kks', 'ccs', 'stabil angina', 'angina', 'koroner arter hastalığı', 'chronic coronary'],
    adlar: ['kronik koroner sendrom', 'kks', 'chronic coronary syndromes', 'ccs'] },
  { id: 'esc-hipertansiyon-2024', yil: 2024, ozgun: '2024 ESC Guidelines for the Management of Elevated Blood Pressure and Hypertension', baslik: 'Yüksek Kan Basıncı ve Hipertansiyon Yönetimi Kılavuzu', kisa: 'ESC Hipertansiyon Kılavuzu', slug: 'elevated-blood-pressure-and-hypertension',
    branslar: ['kardiyoloji', 'dahiliye', 'nefroloji', 'endokrinoloji', 'aile-hekimligi'],
    konu: ['hipertansiyon', 'kan basıncı', 'tansiyon', 'hypertension', 'blood pressure'],
    adlar: ['hipertansiyon', 'ht', 'yüksek kan basıncı', 'hypertension', 'elevated blood pressure and hypertension'] },
  { id: 'esc-periferik-arter-aort-2024', yil: 2024, ozgun: '2024 ESC Guidelines for the management of peripheral arterial and aortic diseases', baslik: 'Periferik Arter ve Aort Hastalıkları Yönetimi Kılavuzu', kisa: 'ESC Periferik Arter ve Aort Hastalıkları Kılavuzu', slug: 'peripheral-arterial-and-aortic-diseases',
    branslar: ['kardiyoloji', 'kalp-damar-cerrahisi'],
    konu: ['periferik arter', 'aort', 'anevrizma', 'diseksiyon', 'klodikasyon', 'karotis', 'peripheral arterial', 'aortic'],
    adlar: ['periferik arter ve aort hastalıkları', 'periferik arter', 'aort hastalıkları', 'peripheral arterial and aortic diseases'] },
  // ─── 2023 ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  { id: 'esc-akut-koroner-sendrom-2023', yil: 2023, ozgun: '2023 ESC Guidelines for the management of acute coronary syndromes', baslik: 'Akut Koroner Sendromlar Yönetimi Kılavuzu', kisa: 'ESC Akut Koroner Sendromlar Kılavuzu', slug: 'acute-coronary-syndromes',
    branslar: ['kardiyoloji', 'acil-tip', 'kalp-damar-cerrahisi', 'dahiliye'],
    konu: ['akut koroner sendrom', 'aks', 'acs', 'stemi', 'nstemi', 'nste-aks', 'unstabil angina', 'dapt', 'göğüs ağrısı'],
    adlar: ['akut koroner sendrom', 'aks', 'acute coronary syndromes', 'acs'] },
  { id: 'esc-kardiyomiyopati-2023', yil: 2023, ozgun: '2023 ESC Guidelines for the management of cardiomyopathies', baslik: 'Kardiyomiyopatiler Yönetimi Kılavuzu', kisa: 'ESC Kardiyomiyopatiler Kılavuzu', slug: 'cardiomyopathy',
    branslar: ['kardiyoloji'],
    konu: ['kardiyomiyopati', 'hcm', 'dcm', 'arvc', 'hipertrofik', 'dilate', 'cardiomyopathy'],
    adlar: ['kardiyomiyopati', 'cardiomyopathies'] },
  { id: 'esc-diyabet-kvh-2023', yil: 2023, ozgun: '2023 ESC Guidelines for the management of cardiovascular disease in patients with diabetes', baslik: 'Diyabetli Hastalarda Kardiyovasküler Hastalık Yönetimi Kılavuzu', kisa: 'ESC Diyabet ve KVH Kılavuzu', slug: 'cvd-and-diabetes',
    branslar: ['kardiyoloji', 'endokrinoloji', 'dahiliye'],
    konu: ['diyabet', 'diabetes', 'dm', 'sglt2', 'glp-1', 'hba1c'],
    adlar: ['diyabet ve kvh', 'diyabet', 'diabetes'] },
  { id: 'esc-endokardit-2023', yil: 2023, ozgun: '2023 ESC Guidelines for the management of endocarditis', baslik: 'Endokardit Yönetimi Kılavuzu', kisa: 'ESC Endokardit Kılavuzu', slug: 'endocarditis',
    branslar: ['kardiyoloji', 'enfeksiyon-hastaliklari', 'kalp-damar-cerrahisi'],
    konu: ['endokardit', 'endocarditis', 'duke', 'vejetasyon'],
    adlar: ['endokardit', 'endocarditis'] },
  // ─── 2022 ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  { id: 'esc-kardiyo-onkoloji-2022', yil: 2022, ozgun: '2022 ESC Guidelines on cardio-oncology', baslik: 'Kardiyo-Onkoloji Kılavuzu', kisa: 'ESC Kardiyo-Onkoloji Kılavuzu', slug: 'cardio-oncology',
    branslar: ['kardiyoloji', 'onkoloji'],
    konu: ['kardiyo-onkoloji', 'kardiyoonkoloji', 'kardiyotoksisite', 'kardiyotoksik', 'antrasiklin', 'trastuzumab', 'cardio-oncology'],
    adlar: ['kardiyo-onkoloji', 'kardiyoonkoloji', 'cardio-oncology'] },
  { id: 'esc-kardiyak-olmayan-cerrahi-2022', yil: 2022, ozgun: '2022 ESC Guidelines on Cardiovascular Assessment and Management of Patients Undergoing Non Cardiac Surgery', baslik: 'Kardiyak Olmayan Cerrahi Geçirecek Hastalarda Kardiyovasküler Değerlendirme ve Yönetim Kılavuzu', kisa: 'ESC Kardiyak Olmayan Cerrahi Kılavuzu', slug: 'non-cardiac-surgery',
    branslar: ['kardiyoloji', 'anestezi', 'dahiliye', 'genel-cerrahi'],
    konu: ['kardiyak olmayan cerrahi', 'preoperatif', 'perioperatif', 'ameliyat öncesi', 'non-cardiac surgery', 'cerrahi risk'],
    adlar: ['kardiyak olmayan cerrahi', 'non-cardiac surgery', 'non cardiac surgery'] },
  { id: 'esc-pulmoner-hipertansiyon-2022', yil: 2022, ozgun: '2022 ESC/ERS Guidelines for the diagnosis and treatment of pulmonary hypertension', baslik: 'Pulmoner Hipertansiyon Tanı ve Tedavi Kılavuzu', kisa: 'ESC/ERS Pulmoner Hipertansiyon Kılavuzu', slug: 'pulmonary-hypertension', ortak: 'ESC/ERS',
    branslar: ['kardiyoloji', 'gogus-hastaliklari'],
    konu: ['pulmoner hipertansiyon', 'pulmoner arter hipertansiyonu', 'pah', 'cteph', 'pulmonary hypertension'],
    adlar: ['pulmoner hipertansiyon', 'ph', 'pulmonary hypertension'] },
  { id: 'esc-ventrikuler-aritmi-2022', yil: 2022, ozgun: '2022 ESC Guidelines: management of patients with ventricular arrhythmias and the prevention of sudden cardiac death', baslik: 'Ventriküler Aritmili Hastaların Yönetimi ve Ani Kardiyak Ölümün Önlenmesi Kılavuzu', kisa: 'ESC Ventriküler Aritmiler ve Ani Kardiyak Ölüm Kılavuzu', slug: 'ventricular-arrhythmias-and-the-prevention-of-sudden-cardiac-death',
    branslar: ['kardiyoloji'],
    konu: ['ventriküler aritmi', 'ventriküler taşikardi', 'vt', 'ani kardiyak ölüm', 'ani ölüm', 'icd', 'ventricular arrhythmia', 'sudden cardiac death'],
    adlar: ['ventriküler aritmi', 'ani kardiyak ölüm', 'ventricular arrhythmias'] },
  // ─── 2021 ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  { id: 'esc-pacing-crt-2021', yil: 2021, ozgun: '2021 ESC Guidelines on cardiac pacing and cardiac resynchronization therapy', baslik: 'Kardiyak Pacing ve Kardiyak Resenkronizasyon Tedavisi Kılavuzu', kisa: 'ESC Kardiyak Pacing ve CRT Kılavuzu', slug: 'cardiac-pacing-and-cardiac-resynchronization-therapy',
    branslar: ['kardiyoloji'],
    konu: ['pacemaker', 'kalp pili', 'pacing', 'crt', 'resenkronizasyon', 'av blok', 'bradikardi'],
    adlar: ['pacing', 'kalp pili', 'crt', 'cardiac pacing'] },
  { id: 'esc-kvh-onleme-2021', yil: 2021, ozgun: '2021 ESC Guidelines on Cardiovascular Disease Prevention in Clinical Practice', baslik: 'Klinik Pratikte Kardiyovasküler Hastalıkların Önlenmesi Kılavuzu', kisa: 'ESC KVH Önleme Kılavuzu', slug: 'cvd-prevention',
    branslar: ['kardiyoloji', 'aile-hekimligi', 'dahiliye'],
    konu: ['önleme', 'korunma', 'prevention', 'score2', 'risk faktörü', 'kardiyovasküler risk'],
    adlar: ['kvh önleme', 'önleme', 'korunma', 'prevention', 'cardiovascular disease prevention'] },
  // ─── 2020 ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  { id: 'esc-eriskin-konjenital-2020', yil: 2020, ozgun: '2020 ESC Guidelines for the management of Adult Congenital Heart Disease (previously Grown-Up Congenital Heart Disease)', baslik: 'Erişkin Konjenital Kalp Hastalıkları Yönetimi Kılavuzu', kisa: 'ESC Erişkin Konjenital Kalp Hastalıkları Kılavuzu', slug: 'adult-congenital-heart-disease',
    branslar: ['kardiyoloji', 'kalp-damar-cerrahisi'],
    konu: ['konjenital', 'doğumsal kalp', 'achd', 'congenital', 'fallot', 'asd', 'vsd'],
    adlar: ['erişkin konjenital kalp hastalıkları', 'konjenital kalp', 'adult congenital heart disease', 'achd'] },
  { id: 'esc-spor-kardiyolojisi-2020', yil: 2020, ozgun: '2020 ESC Guidelines on Sports Cardiology and Exercise in Patients with Cardiovascular Disease', baslik: 'Spor Kardiyolojisi ve Kardiyovasküler Hastalıkta Egzersiz Kılavuzu', kisa: 'ESC Spor Kardiyolojisi Kılavuzu', slug: 'sports-cardiology-and-exercise',
    branslar: ['kardiyoloji', 'spor-hekimligi'],
    konu: ['spor', 'sporcu', 'egzersiz', 'sports cardiology', 'athlete', 'katılım öncesi'],
    adlar: ['spor kardiyolojisi', 'sports cardiology'] },
  // ─── 2019 / 2018 (still on the ESC listing as current) ─────────────────────────────────────────────────────────────
  { id: 'esc-pulmoner-emboli-2019', yil: 2019, ozgun: '2019 Guidelines on Acute Pulmonary Embolism (Diagnosis and Management of)', baslik: 'Akut Pulmoner Emboli Tanı ve Yönetimi Kılavuzu', kisa: 'ESC Akut Pulmoner Emboli Kılavuzu', slug: 'acute-pulmonary-embolism',
    branslar: ['kardiyoloji', 'gogus-hastaliklari', 'acil-tip', 'dahiliye'],
    konu: ['pulmoner emboli', 'pe', 'pte', 'pulmonary embolism', 'venöz tromboemboli', 'vte', 'dvt'],
    adlar: ['pulmoner emboli', 'akut pulmoner emboli', 'pe', 'pulmonary embolism'] },
  { id: 'esc-svt-2019', yil: 2019, ozgun: '2019 Guidelines on Supraventricular Tachycardia', baslik: 'Supraventriküler Taşikardi Kılavuzu', kisa: 'ESC Supraventriküler Taşikardi Kılavuzu', slug: 'supraventricular-tachycardia',
    branslar: ['kardiyoloji', 'acil-tip'],
    konu: ['supraventriküler taşikardi', 'svt', 'avnrt', 'avrt', 'wpw', 'supraventricular'],
    adlar: ['supraventriküler taşikardi', 'svt', 'supraventricular tachycardia'] },
  { id: 'esc-revaskularizasyon-2018', yil: 2018, ozgun: '2018 ESC/EACTS Guidelines on Myocardial Revascularisation', baslik: 'Miyokardiyal Revaskülarizasyon Kılavuzu', kisa: 'ESC/EACTS Miyokardiyal Revaskülarizasyon Kılavuzu', slug: 'myocardial-revascularisation', ortak: 'ESC/EACTS',
    branslar: ['kardiyoloji', 'kalp-damar-cerrahisi'],
    konu: ['revaskülarizasyon', 'pci', 'cabg', 'bypass', 'stent', 'revascularisation', 'revascularization'],
    adlar: ['miyokardiyal revaskülarizasyon', 'revaskülarizasyon', 'myocardial revascularisation'],
    not: 'ESC listesinde hâlâ güncel görünüyor; koroner konularda 2023 AKS ve 2024 KKS kılavuzları daha yenidir — çakışmada onlar.' },
  { id: 'esc-senkop-2018', yil: 2018, ozgun: '2018 Guidelines for Diagnosis/Management of Syncope', baslik: 'Senkop Tanı ve Yönetimi Kılavuzu', kisa: 'ESC Senkop Kılavuzu', slug: 'syncope',
    branslar: ['kardiyoloji', 'noroloji', 'acil-tip'],
    konu: ['senkop', 'bayılma', 'syncope', 'tilt'],
    adlar: ['senkop', 'syncope'] },
  // ─── superseded (named in the old static kardiyoloji stack) ────────────────────────────────────────────────────────
  { id: 'esc-kalp-yetersizligi-2021', yil: 2021, ozgun: '2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure', baslik: 'Akut ve Kronik Kalp Yetersizliği Tanı ve Tedavi Kılavuzu', kisa: 'ESC Kalp Yetersizliği Kılavuzu (2021)', slug: 'focused-update-on-heart-failure-guidelines',
    odak: [{ yil: 2023, baslik: '2023 Focused Update of the 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure', url: 'https://www.escardio.org/guidelines/clinical-practice-guidelines/focused-update-on-heart-failure-guidelines/' }],
    branslar: ['kardiyoloji', 'dahiliye', 'kalp-damar-cerrahisi'], konu: ['kalp yetersizliği'], adlar: [],
    durum: 'yerine-yenisi-geldi', yerineGelen: 'esc-kalp-yetersizligi-2026',
    not: 'Odak güncellemesi 2023\'tedir (eski statik listedeki "2024 Odak Güncelleme" yanlıştı). 2026 ESC KY kılavuzu ikisinin de yerini aldı.' },
]

function escBelgesi(s: EscSatiri): ProtokolBelgesi {
  const odak = s.odak || []
  return {
    id: s.id,
    baslik: s.baslik,
    ozgunBaslik: s.ozgun,
    kisaAd: s.kisa,
    yayinciKodu: 'ULUSLARARASI',
    yayinci: s.ortak === 'ESC/EACTS' ? 'European Society of Cardiology (ESC) · EACTS' : s.ortak === 'ESC/EAS' ? 'European Society of Cardiology (ESC) · European Atherosclerosis Society (EAS)' : s.ortak === 'ESC/ERS' ? 'European Society of Cardiology (ESC) · European Respiratory Society (ERS)' : s.tur === 'uluslararasi-uzlasi' && s.id.includes('evrensel') ? 'ESC · ACC · AHA · WHF' : 'European Society of Cardiology (ESC)',
    tur: s.tur || 'uluslararasi-kilavuz',
    surum: odak.length ? `${s.yil} + ${odak.map((o) => `${o.yil} Odak Güncellemesi`).join(' + ')}` : String(s.yil),
    yil: s.yil,
    url: s.slug.startsWith('focused-update') ? odak[0]?.url ?? null : escUrl(s.slug),
    odakGuncellemeleri: odak.length ? odak : undefined,
    takipUrl: [ESC_LISTESI],
    yalnizTakipUrl: true,
    branslar: s.branslar,
    konu: s.konu,
    atifAdlari: s.durum === 'yerine-yenisi-geldi' ? [] : escAdlari(s),
    durum: s.durum || 'guncel',
    yerineGelen: s.yerineGelen,
    sonDogrulama: T,
    dogrulamaYontemi: 'resmi-liste',
    kurumKodlari: ['ESC'],
    not: [s.not, TKD_NOTU].filter(Boolean).join(' '),
  }
}

export const ESC_BELGELERI: ProtokolBelgesi[] = ESC_SATIRLARI.map(escBelgesi)

/** Other international documents the static TR stacks name (GOLD / GINA via TTD, KDIGO, EAU via TÜD, ERC). */
export const DIGER_ULUSLARARASI_BELGELER: ProtokolBelgesi[] = [
  {
    id: 'gold-2027',
    baslik: 'KOAH\'ın Önlenmesi, Tanısı ve Yönetimi için Küresel Strateji — GOLD 2027 Raporu',
    ozgunBaslik: '2027 GOLD Report',
    kisaAd: 'GOLD KOAH Raporu',
    yayinciKodu: 'ULUSLARARASI', yayinci: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD)', tur: 'uluslararasi-kilavuz',
    surum: '2027 Raporu (v1.1, 20 Kasım 2026)', yil: 2027,
    url: 'https://goldcopd.org',
    takipUrl: ['https://goldcopd.org/2026-gold-report-and-pocket-guide/'],
    branslar: ['gogus-hastaliklari', 'aile-hekimligi', 'dahiliye'],
    konu: ['koah', 'copd', 'kronik obstrüktif', 'bronkodilatör', 'alevlenme'],
    atifAdlari: ['gold raporu', 'gold 2027', 'gold report', 'gold kılavuz'],
    durum: 'guncel', sonDogrulama: T, dogrulamaYontemi: 'resmi-liste', kurumKodlari: ['GOLD'],
    not: 'goldcopd.org menüsü "2027 GOLD Report and Pocket Guide" ve "GOLD-Report-2027-FINAL-v1.1-20Nov2026" dosyasına bağlanıyor. Türk Toraks Derneği uyarlaması ayrıca doğrulanmadı.',
  },
  {
    id: 'gina-2026',
    baslik: 'Astım Yönetimi ve Önlenmesi için Küresel Strateji — GINA 2026 Strateji Raporu',
    ozgunBaslik: '2026 GINA Strategy Report (Global Strategy for Asthma Management and Prevention)',
    kisaAd: 'GINA Astım Strateji Raporu',
    yayinciKodu: 'ULUSLARARASI', yayinci: 'Global Initiative for Asthma (GINA)', tur: 'uluslararasi-kilavuz',
    surum: '2026 Strateji Raporu', yil: 2026,
    url: 'https://ginasthma.org/2026-gina-strategy-report/',
    branslar: ['gogus-hastaliklari', 'pediatri', 'aile-hekimligi', 'dahiliye'],
    konu: ['astım', 'asthma', 'ics', 'formoterol', 'wheezing'],
    atifAdlari: ['gina raporu', 'gina 2026', 'gina strateji', 'gina report', 'gina kılavuz'],
    durum: 'guncel', sonDogrulama: T, dogrulamaYontemi: 'resmi-liste', kurumKodlari: ['GINA'],
    not: 'ginasthma.org güncel sürüm olarak 2026 raporunu sunuyor (eski raporlar "Archived Reports" altında). Türk Toraks Derneği uyarlaması ayrıca doğrulanmadı.',
  },
  {
    id: 'kdigo-kbh-2024',
    baslik: 'Kronik Böbrek Hastalığının Değerlendirilmesi ve Yönetimi Klinik Uygulama Kılavuzu (KDIGO 2024)',
    ozgunBaslik: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease',
    kisaAd: 'KDIGO KBH Kılavuzu',
    yayinciKodu: 'ULUSLARARASI', yayinci: 'Kidney Disease: Improving Global Outcomes (KDIGO)', tur: 'uluslararasi-kilavuz',
    surum: '2024 (Kidney International, Mart 2024)', yil: 2024,
    url: 'https://kdigo.org/guidelines/ckd/',
    branslar: ['nefroloji', 'dahiliye'],
    konu: ['kronik böbrek hastalığı', 'kbh', 'ckd', 'egfr', 'albüminüri'],
    atifAdlari: ['kdigo kbh', 'kdigo ckd', 'kdigo 2024 kbh', 'kdigo 2024 ckd', 'kdigo kronik böbrek hastalığı'],
    durum: 'guncel', sonDogrulama: T, dogrulamaYontemi: 'resmi-liste',
    // No citation-lock code: KDIGO has several current guidelines with different years (AKI, glomerular, diabetes in CKD …);
    // only this one is in the registry, so a "KDIGO <year>" lock would strip correct citations of the others.
    not: 'kdigo.org: 2012 kılavuzunu güncelledi; "KDIGO 2027 CKD Guideline: Medications Management Focused Update" hazırlıkta (yayın tarihi yok). Türk Nefroloji Derneği uyarlaması ayrıca doğrulanmadı.',
  },
  {
    id: 'eau-2026',
    baslik: 'EAU Üroloji Kılavuzları — 2026 baskısı',
    ozgunBaslik: 'EAU Guidelines. Edn. presented at the EAU Annual Congress London 2026',
    kisaAd: 'EAU Kılavuzları',
    yayinciKodu: 'ULUSLARARASI', yayinci: 'European Association of Urology (EAU) · EAU Guidelines Office', tur: 'uluslararasi-kilavuz',
    surum: '2026 baskısı (EAU Kongresi, Londra 2026)', yil: 2026,
    url: 'https://uroweb.org/guidelines',
    takipUrl: ['https://uroweb.org/guidelines/how-to-cite-the-eau-guidelines/'],
    branslar: ['uroloji'],
    konu: ['üroloji', 'prostat', 'mesane', 'böbrek taşı', 'taş', 'üriner', 'bph', 'enkontinans', 'ereksiyon', 'urology'],
    atifAdlari: ['eau kılavuz', 'eau guidelines', 'eau 2026'],
    durum: 'guncel', sonDogrulama: T, dogrulamaYontemi: 'resmi-liste', kurumKodlari: ['EAU'],
    not: 'uroweb.org atıf sayfası güncel baskıyı "presented at the EAU Annual Congress London 2026" olarak veriyor. TÜD uyarlaması ayrıca doğrulanmadı.',
  },
  {
    id: 'erc-2025',
    baslik: 'Avrupa Resüsitasyon Konseyi Kılavuzları 2025',
    ozgunBaslik: 'European Resuscitation Council Guidelines 2025',
    kisaAd: 'ERC Resüsitasyon Kılavuzları',
    yayinciKodu: 'ULUSLARARASI', yayinci: 'European Resuscitation Council (ERC)', tur: 'uluslararasi-kilavuz',
    surum: '2025', yil: 2025,
    url: 'https://www.erc.edu/science-research/guidelines/guidelines-2025/',
    branslar: ['acil-tip', 'anestezi', 'pediatri'],
    konu: ['resüsitasyon', 'kpr', 'cpr', 'kardiyak arrest', 'arrest', 'yaşam desteği', 'life support', 'defibrilasyon'],
    atifAdlari: ['erc kılavuz', 'erc guidelines', 'erc 2025', 'avrupa resüsitasyon konseyi'],
    durum: 'guncel', sonDogrulama: T, dogrulamaYontemi: 'resmi-liste', kurumKodlari: ['ERC'],
    not: 'erc.edu: "the newest edition of the ERC guidelines on resuscitation 2025"; Yetişkin İleri Yaşam Desteği ve Pediatrik Yaşam Desteği bölümleri dahil.',
  },
]

export const ULUSLARARASI_BELGELER: ProtokolBelgesi[] = [...ESC_BELGELERI, ...DIGER_ULUSLARARASI_BELGELER]
