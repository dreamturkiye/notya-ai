/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: ROLE TOOLS, first part, in the order of the role list: emergency
 * medicine, anaesthesia, neurosurgery, paediatric surgery, general surgery, internal medicine, dermatology,
 * endocrinology, infectious diseases.
 *
 * Every tool names the roles that see it (classify before adding: .cursor/skills/specialty-doktor-araclari/SKILL.md).
 * A tool of one role is on no other role's grid and does not open from its address for another role.
 *
 * MACHINE-WRITTEN. No clinician of any country has read a line. The lists are the product's own checklists; the
 * arithmetic is the kit's and cites its published source. NO NATIONAL REFERENCE CONTENT: no drug, dose, schedule,
 * protocol or reference range. Written in en-GB spelling.
 */
import { DERI_BOLGELERI } from '@/lib/ulke/araclar/tanimlar/cerrahiDahiliyeDerm'
import { DOZSUZ, GOZLEM_TARIHI, gorev, ISARETLI_BULGU, ISARETLI_MADDE, KARAR, kendiAdi, SONRAKI_KONTROL, SONRAKI_KONTROL_TARIHI, TAMAMLANAN, type HamArac } from './yardimci'

/** The four body regions of the two skin indices, as their fields name them. */
const BOLGE: Readonly<Record<(typeof DERI_BOLGELERI)[number], string>> = { bas: 'Head and neck', ust: 'Upper limbs', govde: 'Trunk', alt: 'Lower limbs' }
const bolgeAlanlari = (ekler: Readonly<Record<string, string>>): Record<string, string> => Object.fromEntries(DERI_BOLGELERI.flatMap((b) => Object.entries(ekler).map(([ek, ad]) => [`${b}_${ek}`, `${BOLGE[b]}: ${ad}`])))

const KDIGO_BANTLARI = { yesil: 'Low risk (green cell)', sari: 'Moderately increased risk (yellow cell)', turuncu: 'High risk (orange cell)', kirmizi: 'Very high risk (red cell)' }
/** GFR categories carry no laboratory unit of a country. The albuminuria categories do: each country's pack writes A1 to A3 in its own unit. */
export const KDIGO_G = { G1: 'G1: GFR 90 or above', G2: 'G2: GFR 60 to 89', G3a: 'G3a: GFR 45 to 59', G3b: 'G3b: GFR 30 to 44', G4: 'G4: GFR 15 to 29', G5: 'G5: GFR below 15' }
/**
 * The albuminuria categories with the guideline's limits IN BOTH UNITS, as it prints them: the kit compares a value
 * with the limits of the unit it was typed in (NOTYA-ULKE-ARAC-DUZELTME-01, fault 5), so one wording serves every pack.
 */
export const KDIGO_A = { A1: 'A1: albumin-to-creatinine ratio below 30 mg/g (below 3 mg/mmol)', A2: 'A2: albumin-to-creatinine ratio 30 to 300 mg/g (3 to 30 mg/mmol)', A3: 'A3: albumin-to-creatinine ratio above 300 mg/g (above 30 mg/mmol)' }
/** Said in place of a risk cell while the urine result is missing: the cell is defined by two results. */
export const KDIGO_UACR_YOK = 'No urine albumin-to-creatinine ratio was entered: the risk cell needs both results and is not shown'

export const EN_ARACLAR_1: readonly HamArac[] = [
  // ── emergency medicine. Not for cardiology, neurology or family medicine: triage of an emergency department. ──
  {
    anahtar: 'esi-triyaj', roller: ['emergency-medicine'],
    ad: 'ESI triage level',
    aciklama: 'Records the ESI level you chose (1 to 5) and the resources expected. The tool does not work the level out.',
    alanlar: {
      seviye: 'ESI level',
      resus_hemen: 'An immediate life-saving intervention is needed',
      yuksek_risk: 'A high-risk situation, or vital functions may be under threat',
      siddetli_agri_distress: 'Severe pain or distress',
      coklu_kaynak: 'Several resources are expected (tests, procedures)',
      tek_kaynak: 'One resource is expected',
      kaynak_yok: 'No resource is needed',
    },
    secenekler: { seviye: kendiAdi(['1', '2', '3', '4', '5']) },
    bantlar: { esi1: 'ESI 1', esi2: 'ESI 2', esi3: 'ESI 3', esi4: 'ESI 4', esi5: 'ESI 5' },
    uyarilar: { yeniden_degerlendirme: gorev('reassessment and observation of vital signs'), resus_takip: gorev('resuscitation and close observation') },
    not: KARAR,
  },
  {
    anahtar: 'kritik-yol', roller: ['emergency-medicine'],
    ad: 'Critical conditions checklist',
    aciklama: 'Records which critical pathway was marked and which items were done.',
    alanlar: {
      stemi: 'Suspected ST-elevation myocardial infarction or acute coronary syndrome',
      inme: 'Suspected stroke or transient ischaemic attack',
      travma: 'Major trauma',
      sepsis: 'Suspected sepsis',
      hava_yolu: 'Critical airway or breathing problem',
      saat_kaydi: 'Time of onset of symptoms or of the event recorded',
      ekg_10dk: 'Early ECG arranged (the doctor interprets it)',
      noroloji_skala: 'Focused neurological assessment recorded',
      goruntu_plan: 'Imaging arranged',
      travma_primer: 'Primary survey done (ABCDE)',
      kan_kultur: 'Measures for infection or sepsis started (doses are the doctor\'s)',
      hava_yolu_hazir: 'Airway equipment ready, help called',
      hekim_yonlendirme: 'Decision on referral, consultation or admission made by the doctor',
    },
    sayilar: { yol: 'Critical pathways marked', madde: 'Items done' },
    not: DOZSUZ,
  },

  // ── anaesthesia. Not for surgery roles: the anaesthetist's own assessment before and after an operation. ──
  {
    anahtar: 'asa-preop', roller: ['anaesthesia'],
    ad: 'ASA class and pre-operative checklist',
    aciklama: 'Items of the pre-anaesthetic assessment, and the ASA physical status class you stated (I to VI), with the mark E where the operation is an emergency.',
    alanlar: {
      asa_sinif: 'ASA class (optional)',
      asa_acil: 'E: emergency surgery (a mark added to the class)',
      anamnez_tamam: 'Anaesthetic history taken',
      asa_siniflandirma: 'ASA physical status class recorded',
      acil_lab_goruntu: 'Date set for the laboratory tests and imaging that are needed',
      aclik_onam: 'Fasting rules and informed consent discussed',
      alerji_ilac_listesi: 'Allergies and current medicines checked with the patient',
      hava_yolu_degerlendirme: 'Airway assessed',
      kardiyopulmoner_risk: 'Heart and lung risk factors assessed',
      kontrol_randevu: 'Pre-operative or follow-up visit booked',
    },
    secenekler: { asa_sinif: kendiAdi(['I', 'II', 'III', 'IV', 'V', 'VI']) },
    sayilar: { isaretli: ISARETLI_MADDE },
    bantlar: { I: 'ASA I', II: 'ASA II', III: 'ASA III', IV: 'ASA IV', V: 'ASA V', VI: 'ASA VI' },
    uyarilar: { asa_acil: 'E: emergency surgery', kontrol_randevu: gorev('follow-up visit'), acil_lab_goruntu: gorev('test results'), hava_yolu_degerlendirme: gorev('airway note'), alerji_ilac_listesi: gorev('allergies and list of medicines') },
    not: DOZSUZ,
  },
  {
    anahtar: 'hava-yolu-notu', roller: ['anaesthesia'],
    ad: 'Airway note',
    aciklama: 'Findings of the airway assessment, and the date of the next check.',
    alanlar: {
      mallampati_kaydi: 'Mallampati class and mouth opening recorded',
      zor_hava_yolu_bayrak: 'A difficult airway is thought likely',
      boyun_hareket_kisit: 'Neck movement is limited',
      dis_protez_notu: 'Note on teeth, dentures or loose teeth made',
      obezite_osahs: 'Obesity, or a risk of obstructive sleep apnoea',
      onceki_zor_entubasyon: 'A difficult intubation in the past',
      tarih: SONRAKI_KONTROL_TARIHI,
    },
    sayilar: { isaretli: ISARETLI_BULGU },
    tarihler: { tarih: SONRAKI_KONTROL },
    not: DOZSUZ,
  },
  {
    anahtar: 'postop-agri', roller: ['anaesthesia'],
    ad: 'Post-operative pain follow-up',
    aciklama: 'A pain score (0 to 10), findings to watch, and the date of the next check. No medicine or dose is stated.',
    alanlar: {
      agri_skala_kaydi: 'Pain score recorded',
      bolgesel_agri: 'Pain at the operation site',
      bulanti_kusma: 'Nausea or vomiting',
      sedasyon_izlem: 'Sedation and level of consciousness are being observed',
      analjezi_plan_hatirlat: 'Reminder of the pain relief plan given (doses are the doctor\'s)',
      kontrol_agri_randevu: 'Follow-up visit for pain booked',
      agri_skor: 'Pain score from 0 to 10 (optional)',
      tarih: SONRAKI_KONTROL_TARIHI,
    },
    sayilar: { isaretli: ISARETLI_BULGU, agri_skor: 'Pain score' },
    tarihler: { tarih: SONRAKI_KONTROL },
    not: DOZSUZ,
  },

  // ── neurosurgery. Not for neurology: the surgeon's follow-up after an operation. ──
  {
    anahtar: 'noro-postop', roller: ['neurosurgery'],
    ad: 'Checklist after a neurosurgical operation',
    aciklama: 'Items of post-operative follow-up. No dose of any medicine is stated.',
    alanlar: {
      yara_kontrol: 'Wound, drain and dressing examined',
      norolojik_muayene: 'Focused neurological examination recorded',
      agri_skalasi: 'Pain score recorded',
      dvt_profilaksi_hatirlat: 'Reminder about prevention of deep vein thrombosis given (doses are the doctor\'s)',
      steroid_azaltma_izlem: 'Date set to review the reduction of steroids (doses are the doctor\'s)',
      goruntu_kontrol: 'Follow-up imaging arranged',
      taburcu_egitim: 'Before discharge, the patient was told what to watch for at home',
      kontrol_randevu: 'Follow-up visit booked',
    },
    sayilar: { isaretli: ISARETLI_MADDE },
    uyarilar: { goruntu_kontrol: gorev('follow-up imaging'), kontrol_randevu: gorev('follow-up visit'), yara_kontrol: gorev('wound check') },
    not: DOZSUZ,
  },
  {
    anahtar: 'nobet-bilinc', roller: ['neurosurgery'],
    ad: 'Seizure and consciousness follow-up',
    aciklama: 'Findings observed, and the date of the next check. No diagnosis and no dose of any medicine is stated.',
    alanlar: {
      nobet_gozlemi: 'A seizure was observed and recorded',
      bilinc_degisikligi: 'A change in the level of consciousness is observed',
      glasgow_kaydi: 'Glasgow Coma Scale score recorded',
      pupil_asimetri: 'Note on unequal pupils or their reaction to light made',
      yeni_fokal_bulgu: 'A new focal sign is observed',
      ilac_uyumu_hatirlat: 'Reminder about taking medicines as prescribed given',
      tarih: SONRAKI_KONTROL_TARIHI,
    },
    sayilar: { isaretli: ISARETLI_BULGU },
    tarihler: { tarih: SONRAKI_KONTROL },
    not: DOZSUZ,
  },

  // ── paediatric surgery ──
  {
    anahtar: 'cocuk-prepost-op', roller: ['paediatric-surgery'],
    ad: 'Checklist before and after an operation',
    aciklama: 'Items done before or after the operation, and the date of the operation. No dose of any medicine is stated.',
    alanlar: {
      tip: 'List',
      onam: 'Consent for the operation obtained from a parent or guardian and recorded',
      laboratuvar: 'Pre-operative laboratory tests done',
      goruntu: 'Pre-operative imaging and its report seen',
      acil_kisi: 'Details of an emergency contact obtained',
      anestezi_not: 'The anaesthetist\'s note is in the patient\'s documents',
      postop_yara: 'Care of the wound and dressing explained',
      postop_agri: 'Pain relief plan explained (doses are the doctor\'s)',
      postop_beslenme: 'Limits on eating and activity explained',
      kontrol_plan: 'Date of the follow-up visit set',
      postop_acil_yol: 'What to do if the child gets worse explained',
      etiket: 'Short name of the operation (optional)',
      ameliyat_tarihi: 'Date of the operation (optional)',
    },
    secenekler: { tip: { preop: 'Before the operation', postop: 'After the operation' } },
    sayilar: { tamamlanan: TAMAMLANAN },
    tarihler: { ameliyat_tarihi: 'Date of the operation' },
    not: DOZSUZ,
  },
  // Two roles see it: both follow a wound, a drain and stitches after their own operations.
  {
    anahtar: 'yara-dren-izlem', roller: ['paediatric-surgery', 'general-surgery'],
    ad: 'Wound, drain and stitches follow-up',
    aciklama: 'What is being followed, the date and the next check. No diagnosis of infection and no dose of any medicine is stated.',
    alanlar: {
      tip: 'What is being followed',
      bolge: 'Site (optional)',
      tarih: GOZLEM_TARIHI,
      sonraki_kontrol: SONRAKI_KONTROL_TARIHI,
      dren_cikis_ml: 'Drain output (optional)',
    },
    secenekler: { tip: { yara: 'Wound', dren: 'Drain', dikis: 'Removal of stitches', taburcu_kontrol: 'Check after discharge' } },
    sayilar: { dren_cikis_ml: 'Drain output' },
    tarihler: { tarih: GOZLEM_TARIHI, sonraki_kontrol: SONRAKI_KONTROL },
    not: DOZSUZ,
  },

  // ── general surgery ──
  {
    anahtar: 'genel-preop', roller: ['general-surgery'],
    ad: 'Pre-operative checklist',
    aciklama: 'Items done before the operation, and its planned date. No dose of any medicine is stated.',
    alanlar: {
      onam: 'Consent for the operation obtained and recorded',
      laboratuvar: 'Pre-operative laboratory tests done',
      goruntu: 'Pre-operative imaging and its report seen',
      anticoag_durdur: 'Plan for blood-thinning medicines decided by the doctor',
      acil_kisi: 'Details of an emergency contact obtained',
      anestezi_not: 'The anaesthetist\'s note is in the patient\'s documents',
      etiket: 'Short name of the operation (optional)',
      ameliyat_tarihi: 'Planned date of the operation (optional)',
    },
    sayilar: { tamamlanan: TAMAMLANAN },
    tarihler: { ameliyat_tarihi: 'Planned date of the operation' },
    not: DOZSUZ,
  },

  // ── internal medicine. The referral flags are for a non-nephrologist; the nephrologist's grid is a tool of its own. ──
  {
    anahtar: 'kdigo-evre', roller: ['internal-medicine'],
    ad: 'Chronic kidney disease: KDIGO categories',
    aciklama: 'The GFR category (G1 to G5), the albuminuria category (A1 to A3) and, once both results are entered, the risk cell they fall in. No treatment plan and no follow-up interval is stated.',
    alanlar: { egfr: 'Estimated GFR', uacr: 'Urine albumin-to-creatinine ratio (without it no risk cell is shown)', egfr_bir_yil_once: 'An earlier GFR (optional)' },
    bantlar: KDIGO_BANTLARI,
    // Each referral line says what the guideline's list names AND what one result cannot show (the kit's definition cites the list).
    uyarilar: {
      ...KDIGO_G, ...KDIGO_A,
      uacr_yok: KDIGO_UACR_YOK,
      sevk_egfr30: 'On the KDIGO list of circumstances for referral to a kidney specialist: GFR below 30',
      sevk_acr_hematuri: 'The ratio is 300 mg/g (30 mg/mmol) or more. The KDIGO list of circumstances for referral names this as a consistent finding together with blood in the urine: one result does not show either',
      sevk_acr700: 'The ratio is above 700 mg/g (70 mg/mmol). The KDIGO list of circumstances for referral names this as a consistent finding: one result does not show that',
      sevk_dusus20: 'GFR is more than 20% below the earlier value. The KDIGO list of circumstances for referral names a sustained fall of more than 20%: two results do not show that the fall is sustained',
    },
    not: KARAR,
  },

  // ── dermatology. The three indices are published scores: the arithmetic and its source are the kit's. ──
  {
    anahtar: 'pasi', roller: ['dermatology'],
    ad: 'PASI score',
    aciklama: 'Psoriasis Area and Severity Index. Four regions; in each, erythema, induration and scaling (0 to 4) and an area score (0 = none, 1 = 1 to 9%, 2 = 10 to 29%, 3 = 30 to 49%, 4 = 50 to 69%, 5 = 70 to 89%, 6 = 90 to 100%). The score appears once every region is finished: its area score and, where the area is not 0, its three signs. The tool shows the score and names no grade of severity.',
    alanlar: bolgeAlanlari({ e: 'erythema (0 to 4)', i: 'induration (0 to 4)', d: 'scaling (0 to 4)', a: 'area involved (0 to 6)' }),
    sayilar: { pasi: 'PASI' },
    not: KARAR,
  },
  {
    anahtar: 'easi', roller: ['dermatology'],
    ad: 'EASI score',
    aciklama: 'Eczema Area and Severity Index. Four regions; in each, four signs (0 to 3) and an area score (0 = none, 1 = 1 to 9%, 2 = 10 to 29%, 3 = 30 to 49%, 4 = 50 to 69%, 5 = 70 to 89%, 6 = 90 to 100%). The weight of each region depends on the age of the patient: under 8 years, or 8 years or over. The score appears once the age is chosen and every region is finished: its area score and, where the area is not 0, its four signs.',
    alanlar: { yas: 'Age of the patient', ...bolgeAlanlari({ e: 'erythema (0 to 3)', i: 'oedema or papulation (0 to 3)', d: 'excoriation (0 to 3)', l: 'lichenification (0 to 3)', a: 'area involved (0 to 6)' }) },
    secenekler: { yas: { yedi_ve_alti: 'Under 8 years', sekiz_ve_ustu: '8 years or over' } },
    sayilar: { easi: 'EASI' },
    bantlar: { temiz: 'Clear (0)', neredeyse_temiz: 'Almost clear (0.1 to 1.0)', hafif: 'Mild (1.1 to 7.0)', orta: 'Moderate (7.1 to 21.0)', siddetli: 'Severe (21.1 to 50.0)', cok_siddetli: 'Very severe (50.1 to 72.0)' },
    not: KARAR,
  },
  {
    anahtar: 'scorad', roller: ['dermatology'],
    ad: 'SCORAD index',
    aciklama: 'Severity of atopic dermatitis: A, the percentage of skin involved; B, the intensity of six signs (0 to 3); C, itch and sleep loss (0 to 10). The sum of one fifth of A, three and a half times B, and C. The index appears once every field is filled in.',
    alanlar: {
      yayginlik: 'Area of skin involved',
      eritem: 'Erythema (0 to 3)',
      odem: 'Oedema or papulation (0 to 3)',
      sizinti: 'Oozing or crusts (0 to 3)',
      ekskoriasyon: 'Excoriation (0 to 3)',
      likenifikasyon: 'Lichenification (0 to 3)',
      kuruluk: 'Dryness of skin that is not involved (0 to 3)',
      kasinti: 'Itch, as the patient rates it (0 to 10)',
      uykusuzluk: 'Sleep loss, as the patient rates it (0 to 10)',
    },
    sayilar: { scorad: 'SCORAD', a: 'A: extent', b: 'B: intensity', c: 'C: subjective symptoms' },
    bantlar: { hafif: 'Mild (below 25)', orta: 'Moderate (25 to 50)', siddetli: 'Severe (above 50)' },
    not: KARAR,
  },
  {
    anahtar: 'yama-okuma', roller: ['dermatology'],
    ad: 'Patch test: reading days',
    aciklama: 'From the day the patches were applied, the second and the fourth day are worked out (D2, D4).',
    alanlar: { uygulama: 'Date the patches were applied' },
    tarihler: { d2: 'First reading (D2)', d4: 'Second reading (D4)' },
    not: 'This tool holds no list of allergens; the doctor reads the result.',
  },

  // ── endocrinology ──
  {
    anahtar: 'rejim-karti', roller: ['endocrinology'],
    ad: 'Insulin and thyroid treatment: date card',
    aciklama: 'The date a treatment started and the date of the next check. No medicine and no dose is stated.',
    alanlar: { insulin_baslangic: 'Insulin: start date', insulin_kontrol: 'Insulin: next check', tiroid_baslangic: 'Thyroid treatment: start date', tiroid_kontrol: 'Thyroid treatment: next check' },
    tarihler: { insulin_baslangic: 'Insulin: start date', insulin_kontrol: 'Insulin: next check', tiroid_baslangic: 'Thyroid treatment: start date', tiroid_kontrol: 'Thyroid treatment: next check' },
    not: DOZSUZ,
  },

  // ── infectious diseases ──
  {
    anahtar: 'antibiyotik-sure', roller: ['infectious-diseases'],
    ad: 'Antibiotic course: counting days',
    aciklama: 'From the start date and the number of days, the last day of the course and a review date are worked out. The start date counts as day 1. No medicine, no dose and no recommended length is stated.',
    alanlar: { baslangic: 'Start date of the course', sure_gun: 'Length of the course', kontrol: 'Review date (optional)', sinif: 'Group of the antibiotic, in a few words (optional)' },
    tarihler: { bitis: 'Last day of the course', kontrol: 'Review' },
    not: DOZSUZ,
  },
]
