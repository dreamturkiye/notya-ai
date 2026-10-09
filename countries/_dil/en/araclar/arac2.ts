/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: ROLE TOOLS, second part: thoracic surgery, respiratory medicine,
 * ophthalmology, cardiovascular surgery, otolaryngology, nephrology, oncology. Same rules as ./arac1.ts.
 *
 * MACHINE-WRITTEN. No clinician of any country has read a line. Written in en-GB spelling.
 */
import { DIS_KULAK, KULAK_ZARI, KULAKLAR, otoAlani } from '@/lib/ulke/araclar/tanimlar/kalpKbb'
import { KDIGO_A_MG_G, KDIGO_G } from './arac1'
import { DOZSUZ, GOZLEM_TARIHI, gorev, ISARETLI_MADDE, KARAR, SONRAKI_KONTROL, SONRAKI_KONTROL_TARIHI, type HamArac } from './yardimci'

const KULAK: Readonly<Record<(typeof KULAKLAR)[number], string>> = { sag: 'Right ear', sol: 'Left ear' }
const DIS: Readonly<Record<(typeof DIS_KULAK)[number], string>> = {
  normal: 'ear canal clear, nothing abnormal',
  buson: 'wax blocking the ear canal',
  akinti: 'discharge in the ear canal',
  odem_hassasiyet: 'swelling of the ear canal, or pain on pressing the tragus',
  yabanci_cisim: 'a foreign body in the ear canal',
}
const ZAR: Readonly<Record<(typeof KULAK_ZARI)[number], string>> = {
  sag_gorunum: 'eardrum looks normal, light reflex seen',
  hiperemik: 'eardrum red',
  matlasmis: 'eardrum dull',
  retrakte: 'eardrum retracted',
  bombe: 'eardrum bulging',
  perforasyon: 'perforation of the eardrum',
  tup_var: 'a ventilation tube is in place',
  seviye_hava_kabarcigi: 'a fluid level or an air bubble behind the eardrum',
  degerlendirilemedi: 'the eardrum could not be assessed',
}
const otoAlanlari = (): Record<string, string> => Object.fromEntries(KULAKLAR.flatMap((y) => [
  ...DIS_KULAK.map((k) => [otoAlani(y, 'dis', k), `${KULAK[y]}: ${DIS[k]}`] as const),
  ...KULAK_ZARI.map((k) => [otoAlani(y, 'zar', k), `${KULAK[y]}: ${ZAR[k]}`] as const),
]))
/** The findings that need a decision at this visit, as the kit raises them: the finding, and that sentence. */
const OTO_UYARI_ZAR = ['perforasyon', 'bombe', 'retrakte', 'degerlendirilemedi'] as const
const OTO_UYARI_DIS = ['akinti', 'yabanci_cisim', 'odem_hassasiyet'] as const
const otoUyarilari = (): Record<string, string> => Object.fromEntries(KULAKLAR.flatMap((y) => [
  ...OTO_UYARI_ZAR.map((k) => [otoAlani(y, 'zar', k), `${KULAK[y]}: ${ZAR[k]} — a decision is needed at this visit`] as const),
  ...OTO_UYARI_DIS.map((k) => [otoAlani(y, 'dis', k), `${KULAK[y]}: ${DIS[k]} — a decision is needed at this visit`] as const),
]))

const TEST_SONUCU = { pozitif: 'Positive', negatif: 'Negative', yapilamadi: 'Could not be done' }

export const EN_ARACLAR_2: readonly HamArac[] = [
  // ── thoracic surgery ──
  {
    anahtar: 'toraks-preop', roller: ['thoracic-surgery'],
    ad: 'Checklist before a chest operation',
    aciklama: 'Items of respiratory preparation before the operation. The first three items not yet done are shown as follow-up tasks.',
    alanlar: {
      sft_yapildi: 'Lung function tested, the result is with the doctor',
      goruntu_hazir: 'Chest images (CT or X-ray) are ready for the doctor',
      anestezi_degerlendirme: 'Pre-anaesthetic assessment arranged or done',
      sigara_sorgulandi: 'Smoking history taken',
      kan_lab_hazir: 'Pre-operative blood tests are ready for the doctor',
      onam_konustu: 'Consent for the operation has been discussed',
      kardiyak_risk_hekim: 'Cardiac risk is being assessed by the doctor',
    },
    sayilar: { isaretli: ISARETLI_MADDE },
    uyarilar: {
      sft_yapildi: gorev('lung function test'),
      goruntu_hazir: gorev('chest images'),
      anestezi_degerlendirme: gorev('pre-anaesthetic assessment'),
      sigara_sorgulandi: gorev('smoking history'),
      kan_lab_hazir: gorev('pre-operative blood tests'),
      onam_konustu: gorev('discussion of consent'),
      kardiyak_risk_hekim: gorev('assessment of cardiac risk'),
    },
    not: DOZSUZ,
  },
  {
    anahtar: 'toraks-tup-yara', roller: ['thoracic-surgery'],
    ad: 'Chest drain and wound follow-up',
    aciklama: 'What is being followed, its state, the date and the next check. No diagnosis and no dose of any medicine is stated.',
    alanlar: { tip: 'What is being followed', durum: 'State', tarih: GOZLEM_TARIHI, sonraki_kontrol: SONRAKI_KONTROL_TARIHI },
    secenekler: {
      tip: { toraks_tup: 'Chest drain', yara: 'Operation wound', dren: 'Drain' },
      durum: { izlemde: 'Being followed', cikarildi: 'Removed', iyilesiyor: 'Healing', dikkat: 'Needs attention: the doctor assesses' },
    },
    tarihler: { tarih: GOZLEM_TARIHI, sonraki_kontrol: SONRAKI_KONTROL },
    not: DOZSUZ,
  },

  // ── respiratory medicine. Not for thoracic surgery or family medicine: a check of how a device is used. ──
  {
    anahtar: 'inhaler-teknik', roller: ['respiratory-medicine'],
    ad: 'Inhaler technique',
    aciklama: 'The type of device and the steps the patient did correctly. No medicine, dose or number of puffs is stated.',
    alanlar: {
      cihaz: 'Device',
      ortak_hazirlik: 'Device prepared correctly (cap, shaking or loading a capsule)',
      ortak_ekspirasyon: 'Breathed out fully before inhaling (not into the device)',
      ortak_dudak: 'Lips sealed around the mouthpiece',
      ortak_nefes_tutma: 'Breath held for 5 to 10 seconds',
      ortak_agiz_calkalama: 'Mouth rinsed after inhaling (where needed)',
      ortak_doz_sayaci: 'Dose counter checked, or that the device is not empty',
      odi_inspirasyon: 'Breath in is slow and deep',
      odi_ara_parca: 'A spacer is used (where the doctor advised one)',
      kti_inspirasyon: 'Breath in is fast and strong',
      kti_kapsul: 'Capsule or blister loaded correctly',
      softmist_hazirlik: 'Device (cartridge, dose) prepared',
      softmist_inspirasyon: 'Breath in is slow and deep',
      nebul_maske: 'Mask or mouthpiece placed correctly',
      nebul_sure: 'Treatment lasts as long as the doctor said',
      diger_adimlar: 'The steps the doctor explained were done',
      kontrol_ay: 'Check the technique again after (optional)',
    },
    secenekler: { cihaz: { odi: 'Pressurised metered-dose inhaler', kti: 'Dry powder inhaler', soft_mist: 'Soft mist inhaler', nebul: 'Nebuliser', diger: 'Another device' } },
    sayilar: { tamamlanan: 'Steps done correctly' },
    tarihler: { sonraki: 'Next check of technique' },
    not: DOZSUZ,
  },

  // ── ophthalmology ──
  {
    anahtar: 'gorme-keskinligi', roller: ['ophthalmology'],
    ad: 'Visual acuity: logMAR',
    aciklama: 'A decimal acuity or a Snellen fraction is turned into logMAR; the difference between two measurements is shown in letters (a positive number is an improvement).',
    alanlar: {
      goz: 'Eye (optional)',
      bicim: 'Notation',
      simdi_ondalik: 'Acuity now (decimal)',
      onceki_ondalik: 'Acuity before (optional)',
      simdi_pay: 'Now: top number of the fraction',
      simdi_payda: 'Now: bottom number of the fraction',
      onceki_pay: 'Before: top number of the fraction (optional)',
      onceki_payda: 'Before: bottom number of the fraction (optional)',
    },
    secenekler: { goz: { sag: 'Right eye', sol: 'Left eye' }, bicim: { ondalik: 'Decimal', kesir: 'Snellen fraction' } },
    sayilar: { logmar: 'logMAR now', onceki_logmar: 'logMAR before', harf_farki: 'Difference in letters' },
    not: KARAR,
  },

  // ── cardiovascular surgery ──
  {
    anahtar: 'kalp-damar-preop', roller: ['cardiovascular-surgery'],
    ad: 'Checklist before a heart or vascular operation',
    aciklama: 'Items of the pre-operative risk assessment. The first three items not yet done are shown as follow-up tasks. No dose is stated.',
    alanlar: {
      goruntu_hazir: 'Images of the vessels or the heart (angiography, Doppler, coronary angiography) are ready for the doctor',
      anestezi_degerlendirme: 'Pre-anaesthetic assessment arranged or done',
      kan_lab_hazir: 'Pre-operative blood tests are ready for the doctor',
      eko_raporu_hekim: 'The echocardiogram or cardiology report is with the doctor',
      antikoag_sorgulandi: 'Use of anticoagulant and antiplatelet medicines checked (no dose is stated)',
      onam_konustu: 'Consent for the operation has been discussed',
      sigara_sorgulandi: 'Smoking history taken',
      kardiyak_risk_hekim: 'Peri-operative cardiac risk is being assessed by the doctor',
    },
    sayilar: { isaretli: ISARETLI_MADDE },
    uyarilar: {
      goruntu_hazir: gorev('images of the vessels or the heart'),
      anestezi_degerlendirme: gorev('pre-anaesthetic assessment'),
      kan_lab_hazir: gorev('pre-operative blood tests'),
      eko_raporu_hekim: gorev('echocardiogram report'),
      antikoag_sorgulandi: gorev('check of anticoagulant and antiplatelet medicines'),
      onam_konustu: gorev('discussion of consent'),
      sigara_sorgulandi: gorev('smoking history'),
      kardiyak_risk_hekim: gorev('assessment of peri-operative cardiac risk'),
    },
    not: DOZSUZ,
  },
  {
    anahtar: 'greft-yara-izlem', roller: ['cardiovascular-surgery'],
    ad: 'Vascular graft and wound follow-up',
    aciklama: 'What is being followed, its state, the date and the next check. No diagnosis and no dose of any medicine is stated.',
    alanlar: { tip: 'What is being followed', durum: 'State', tarih: GOZLEM_TARIHI, sonraki_kontrol: SONRAKI_KONTROL_TARIHI },
    secenekler: {
      tip: { greft: 'Vascular graft', yara: 'Operation wound', bypass: 'Bypass', stent_graft: 'Stent graft' },
      durum: { izlemde: 'Being followed', iyilesiyor: 'Healing', dikkat: 'Needs attention: the doctor assesses', kapandi: 'Healed' },
    },
    tarihler: { tarih: GOZLEM_TARIHI, sonraki_kontrol: SONRAKI_KONTROL },
    not: DOZSUZ,
  },
  {
    anahtar: 'antikoagulan-vadeleri', roller: ['cardiovascular-surgery'],
    ad: 'Antithrombotic treatment: review dates',
    aciklama: 'The group of the medicine, the date of the next check and of the next laboratory test. No name of a medicine, no dose and no target value is stated.',
    alanlar: { sinif: 'Group of the medicine', sonraki_kontrol: SONRAKI_KONTROL_TARIHI, lab_vadesi: 'Date of the next laboratory test (optional)' },
    secenekler: { sinif: { warfarin: 'Warfarin or another vitamin K antagonist', doac: 'Direct oral anticoagulant', lmwh: 'Low molecular weight heparin', antiplatelet: 'Antiplatelet', diger: 'Other' } },
    tarihler: { sonraki_kontrol: SONRAKI_KONTROL, lab_vadesi: 'Laboratory test' },
    not: DOZSUZ,
  },

  // ── otolaryngology ──
  {
    anahtar: 'odyometri-pta', roller: ['otolaryngology'],
    ad: 'Pure-tone audiometry: average threshold',
    aciklama: 'The average of the air-conduction thresholds at 0.5, 1, 2 and 4 kHz, the grade of hearing loss, the change from an earlier measurement and the difference from the other ear.',
    alanlar: {
      kulak: 'Ear (optional)',
      e05: 'Threshold at 0.5 kHz',
      e1: 'Threshold at 1 kHz',
      e2: 'Threshold at 2 kHz',
      e4: 'Threshold at 4 kHz',
      onceki_pta: 'Earlier average threshold (optional)',
      karsi_pta: 'Average threshold of the other ear (optional)',
    },
    secenekler: { kulak: { sag: 'Right ear', sol: 'Left ear' } },
    sayilar: { pta: 'Average threshold', fark: 'Change from the earlier measurement' },
    bantlar: {
      normal: 'Within normal limits (up to 25 dB)',
      hafif: 'Mild hearing loss (26 to 40 dB)',
      orta: 'Moderate hearing loss (41 to 55 dB)',
      orta_ileri: 'Moderately severe hearing loss (56 to 70 dB)',
      ileri: 'Severe hearing loss (71 to 90 dB)',
      cok_ileri: 'Profound hearing loss (above 90 dB)',
    },
    uyarilar: {
      esik_artisi: 'The threshold is 10 dB or more higher than at the earlier measurement',
      esik_azalisi: 'The threshold is 10 dB or more lower than at the earlier measurement',
      asimetri: 'The two ears differ by 15 dB or more',
    },
    not: 'The grade supports a decision; the type of hearing loss and the diagnosis are the doctor\'s.',
  },
  {
    anahtar: 'otoskopi-notu', roller: ['otolaryngology'],
    ad: 'Otoscopy note',
    aciklama: 'For each ear, what the ear canal and the eardrum look like; a result appears once both ears are marked. No diagnosis is stated.',
    alanlar: {
      ...otoAlanlari(),
      ek_pnomatik: 'On pneumatic otoscopy the eardrum moves less',
      ek_weber: 'Weber test lateralises',
      ek_rinne: 'Rinne test negative',
      ek_mastoid: 'Tenderness over the mastoid',
      ek_postaurikuler: 'Swelling or redness behind the ear',
      ek_isitme_kaybi: 'The patient reports hearing loss',
      ek_cinlama: 'The patient reports tinnitus',
    },
    uyarilar: otoUyarilari(),
    not: KARAR,
  },
  {
    anahtar: 'vertigo-notu', roller: ['otolaryngology'],
    ad: 'Vertigo: positional test note',
    aciklama: 'Results of the tests and manoeuvres done, the features of the nystagmus, and signs that point to a central cause. No diagnosis and no medicine is stated.',
    alanlar: {
      dix_hallpike: 'Dix-Hallpike test',
      supine_roll: 'Supine roll test (horizontal canal)',
      epley: 'Epley manoeuvre (done by the doctor)',
      barbecue: 'Lempert (barbecue) roll manoeuvre (done by the doctor)',
      head_impulse: 'Head impulse test',
      romberg: 'Romberg test and gait',
      nis_torsiyonel: 'Nystagmus torsional or up-beating',
      nis_horizontal: 'Nystagmus horizontal',
      nis_latans_var: 'There is a latent period (a delay of a few seconds)',
      nis_yorulabilir: 'Nystagmus fatigues on repetition',
      nis_latans_yok: 'No latent period, or the nystagmus does not fatigue',
      nis_yon_degistiren: 'Nystagmus changes direction',
      nis_fiksasyon: 'Nystagmus is not suppressed by fixation',
      santral_cift_gorme: 'Central sign: double vision, slurred speech or difficulty swallowing',
      santral_yuz: 'Central sign: facial asymmetry, numbness or weakness',
      santral_ayakta: 'Central sign: cannot stand or walk without support',
      santral_nistagmus: 'Central sign: nystagmus without a latent period, not fatiguing or changing direction',
      santral_fiksasyon: 'Central sign: nystagmus not suppressed by fixation',
      santral_bas_agrisi: 'Central sign: sudden, severe and unusual headache',
      kulak_belirtisi: 'There are ear symptoms (hearing loss, tinnitus, fullness)',
    },
    secenekler: { dix_hallpike: TEST_SONUCU, supine_roll: TEST_SONUCU, epley: TEST_SONUCU, barbecue: TEST_SONUCU, head_impulse: TEST_SONUCU, romberg: TEST_SONUCU },
    bantlar: { manevra_uygun: 'No sign of a central cause was marked', manevra_uygun_degil: 'A central cause is suspected: a repositioning manoeuvre is not indicated' },
    uyarilar: {
      santral_suphe: 'A central cause is suspected: urgent neurological assessment first',
      repozisyon_santral: 'A repositioning manoeuvre is recorded together with a central sign: state the reason in the note',
      nistagmus_eksik: 'A test is positive and no feature of the nystagmus is marked',
    },
    not: DOZSUZ,
  },

  // ── nephrology. The grid without referral flags: the reader is the specialist. ──
  {
    anahtar: 'kdigo-serit', roller: ['nephrology'],
    ad: 'KDIGO grid: GFR and albuminuria',
    aciklama: 'The GFR category (G1 to G5), the albuminuria category (A1 to A3) and the risk cell. No treatment plan and no follow-up interval is stated.',
    alanlar: { egfr: 'Estimated GFR', uacr: 'Urine albumin-to-creatinine ratio (optional)' },
    bantlar: { yesil: 'Low risk (green cell)', sari: 'Moderately increased risk (yellow cell)', turuncu: 'High risk (orange cell)', kirmizi: 'Very high risk (red cell)' },
    uyarilar: { ...KDIGO_G, ...KDIGO_A_MG_G },
    not: KARAR,
  },
  {
    anahtar: 'diyaliz-seans', roller: ['nephrology'],
    ad: 'Dialysis session and next date',
    aciklama: 'The type of dialysis, the date of the session and the date of the next session or check. No machine setting is stated.',
    alanlar: { modalite: 'Type of dialysis', tarih: 'Date of the session', sonraki_seans: 'Date of the next session or check (optional)' },
    secenekler: { modalite: { hd: 'Haemodialysis', pd: 'Peritoneal dialysis', hdf: 'Haemodiafiltration', diger: 'Other' } },
    tarihler: { tarih: 'Date of the session', sonraki_seans: 'Next session or check' },
    not: DOZSUZ,
  },

  // ── oncology ──
  {
    anahtar: 'kur-sayaci', roller: ['oncology'],
    ad: 'Treatment cycle counter',
    aciklama: 'Which cycle this is, how many there are in all, and the dates of the last and the next cycle. No regimen, medicine or dose is stated.',
    alanlar: { protokol: 'Short name of the regimen (optional)', mevcut_kur: 'Number of the current cycle', toplam_kur: 'Cycles in all (optional)', son_kur: 'Date of the last cycle (optional)', sonraki_kur: 'Date of the next cycle (optional)' },
    sayilar: { kur: 'Cycle' },
    tarihler: { son_kur: 'Last cycle', sonraki_kur: 'Next cycle' },
    not: DOZSUZ,
  },
  {
    anahtar: 'toksisite-listesi', roller: ['oncology'],
    ad: 'Side effects checklist',
    aciklama: 'Side effects seen during treatment are marked. No grade and no change of dose is stated.',
    alanlar: {
      bulanti_kusma: 'Nausea or vomiting',
      ishal: 'Diarrhoea',
      mukozit: 'Mucositis or mouth ulcers',
      notropeni_risk: 'Risk of neutropenia, temperature being watched',
      anemi_halsizlik: 'Tiredness, anaemia being watched',
      noropati: 'Signs of neuropathy',
      deri_reaksiyon: 'Skin reaction',
      kardiyak_belirti: 'Heart symptoms (the doctor assesses)',
      bobrek_lab: 'Plan for kidney and laboratory checks',
      infeksiyon: 'Sign of infection',
    },
    sayilar: { isaretli: 'Side effects marked' },
    not: DOZSUZ,
  },
]
