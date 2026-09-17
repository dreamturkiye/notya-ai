/**
 * NOTYA-BELGE-01 — Finding ontology (bulgu_kodu).
 * One internal code per finding. Every engine (Claude vision, browser ONNX engines, future GPU engines)
 * maps its own label vocabulary onto these codes; fusion, caps and the acil rule operate on codes, never on
 * label strings. Turkish label + ICD-10 hint live here, not in prompts.
 */
export type BulguKodu = keyof typeof BULGULAR

export type BulguTanim = {
  tr: string
  icd10?: string
  /** acil_bayrak fires by RULE at this probability (Claude may add flags, never remove) */
  acilEsik?: number
  modalite: Modalite[]
}

export type Modalite =
  | 'cxr' | 'xr_kemik' | 'xr_batin' | 'ct' | 'mr' | 'fundus' | 'oct' | 'dis_goz' | 'ekg' | 'eko'
  | 'derm' | 'dermatoskopi' | 'yara' | 'us' | 'mamografi' | 'patoloji' | 'yayma' | 'otoskopi' | 'endoskopi'
  | 'dental' | 'ses_akciger' | 'ses_kalp' | 'ses_oksuruk' | 'ses_konusma' | 'nst' | 'eeg' | 'pet' | 'video_yurume' | 'pdf_rapor' | 'serbest'

export const BULGULAR = {
  // Chest X-ray
  'CXR.PTX': { tr: 'Pnömotoraks', icd10: 'J93', acilEsik: 0.7, modalite: ['cxr', 'ct'] },
  'CXR.EFF': { tr: 'Plevral efüzyon', icd10: 'J90', modalite: ['cxr', 'ct', 'us'] },
  'CXR.CONS': { tr: 'Konsolidasyon', icd10: 'J18', modalite: ['cxr', 'ct'] },
  'CXR.PNEU': { tr: 'Pnömoni ile uyumlu görünüm', icd10: 'J18.9', modalite: ['cxr', 'ct', 'us'] },
  'CXR.CMG': { tr: 'Kardiyomegali', icd10: 'I51.7', modalite: ['cxr'] },
  'CXR.EDEMA': { tr: 'Pulmoner ödem', icd10: 'J81', modalite: ['cxr', 'ct'] },
  'CXR.ATEL': { tr: 'Atelektazi', icd10: 'J98.1', modalite: ['cxr', 'ct'] },
  'CXR.NOD': { tr: 'Nodül / kitle', icd10: 'R91.1', modalite: ['cxr', 'ct'] },
  'CXR.OPAC': { tr: 'Opasite', modalite: ['cxr'] },
  'CXR.DEV': { tr: 'Cihaz / hat / tüp', modalite: ['cxr', 'xr_batin'] },
  'CXR.HYPER': { tr: 'Hiperinflasyon', modalite: ['cxr'] },
  'CXR.FRACT': { tr: 'Kot kırığı', icd10: 'S22.3', modalite: ['cxr'] },
  'CXR.FIB': { tr: 'Fibrotik değişiklik', icd10: 'J84', modalite: ['cxr', 'ct'] },
  'CXR.PLTHICK': { tr: 'Plevral kalınlaşma', icd10: 'J92', modalite: ['cxr'] },
  'CXR.NORM': { tr: 'Belirgin patoloji izlenmedi', modalite: ['cxr'] },
  // Fundus / OCT
  'FUN.DR0': { tr: 'Diyabetik retinopati yok', modalite: ['fundus'] },
  'FUN.DR1': { tr: 'Hafif nonproliferatif DR', icd10: 'E11.31', modalite: ['fundus'] },
  'FUN.DR2': { tr: 'Orta nonproliferatif DR', icd10: 'E11.32', modalite: ['fundus'] },
  'FUN.DR3': { tr: 'Ağır nonproliferatif DR', icd10: 'E11.33', modalite: ['fundus'] },
  'FUN.DR4': { tr: 'Proliferatif DR', icd10: 'E11.35', modalite: ['fundus'] },
  'FUN.RDR': { tr: 'Sevk gerektiren DR', modalite: ['fundus'] },
  'FUN.GLS': { tr: 'Glokom şüphesi (C/D artışı)', icd10: 'H40.0', modalite: ['fundus', 'oct'] },
  'FUN.AMD': { tr: 'Yaşa bağlı maküla dejenerasyonu', icd10: 'H35.3', modalite: ['fundus', 'oct'] },
  'FUN.PAPIL': { tr: 'Papilödem', icd10: 'H47.1', acilEsik: 0.6, modalite: ['fundus'] },
  'FUN.NORM': { tr: 'Normal fundus', modalite: ['fundus'] },
  // ECG
  'ECG.NORM': { tr: 'Normal EKG', modalite: ['ekg'] },
  'ECG.MI': { tr: 'Miyokard enfarktüsü bulguları', icd10: 'I21', acilEsik: 0.7, modalite: ['ekg'] },
  'ECG.STEMI': { tr: 'STEMI paterni', icd10: 'I21', acilEsik: 0.6, modalite: ['ekg'] },
  'ECG.STTC': { tr: 'ST/T değişiklikleri', modalite: ['ekg'] },
  'ECG.CD': { tr: 'İleti bozukluğu', icd10: 'I45', modalite: ['ekg'] },
  'ECG.HYP': { tr: 'Hipertrofi bulguları', icd10: 'I51.7', modalite: ['ekg'] },
  'ECG.AF': { tr: 'Atriyal fibrilasyon', icd10: 'I48', modalite: ['ekg'] },
  'ECG.BRADY': { tr: 'Bradikardi', icd10: 'R00.1', modalite: ['ekg'] },
  'ECG.TACHY': { tr: 'Taşikardi', icd10: 'R00.0', modalite: ['ekg'] },
  'ECG.QTC': { tr: 'QTc uzaması', icd10: 'I45.8', acilEsik: 0.7, modalite: ['ekg'] },
  // Echo (metrics only in V1)
  'ECHO.LVH': { tr: 'Sol ventrikül hipertrofisi', icd10: 'I51.7', modalite: ['eko'] },
  'ECHO.EF_LOW': { tr: 'Düşük EF izlenimi', icd10: 'I50', modalite: ['eko'] },
  'ECHO.EFF': { tr: 'Perikardiyal efüzyon', icd10: 'I31.3', modalite: ['eko'] },
  // Dermatology
  'DERM.MEL': { tr: 'Melanom şüphesi', icd10: 'C43', acilEsik: 0.75, modalite: ['derm', 'dermatoskopi'] },
  'DERM.BCC': { tr: 'Bazal hücreli karsinom şüphesi', icd10: 'C44', modalite: ['derm', 'dermatoskopi'] },
  'DERM.SCC': { tr: 'Skuamöz hücreli karsinom şüphesi', icd10: 'C44', modalite: ['derm', 'dermatoskopi'] },
  'DERM.NV': { tr: 'Melanositik nevüs', icd10: 'D22', modalite: ['derm', 'dermatoskopi'] },
  'DERM.BKL': { tr: 'Benign keratoz', icd10: 'L82', modalite: ['derm', 'dermatoskopi'] },
  'DERM.AKIEC': { tr: 'Aktinik keratoz', icd10: 'L57.0', modalite: ['derm', 'dermatoskopi'] },
  'DERM.INF': { tr: 'Enfeksiyöz deri lezyonu', modalite: ['derm', 'yara'] },
  'DERM.ECZ': { tr: 'Egzematöz dermatit', icd10: 'L30', modalite: ['derm'] },
  'DERM.PSO': { tr: 'Psoriazis', icd10: 'L40', modalite: ['derm'] },
  'DERM.URT': { tr: 'Ürtiker', icd10: 'L50', modalite: ['derm'] },
  'DERM.MALIGN_RISK': { tr: 'Malignite riski (skor)', modalite: ['derm', 'dermatoskopi'] },
  'YARA.INF': { tr: 'Yara enfeksiyonu bulguları', modalite: ['yara'] },
  'YARA.NEKROZ': { tr: 'Nekroz', modalite: ['yara'] },
  'YANIK.EVRE': { tr: 'Yanık derinliği (tarif)', modalite: ['yara'] },
  // Sound
  'SND.CRACKLE': { tr: 'Raller (krepitasyon)', modalite: ['ses_akciger'] },
  'SND.WHEEZE': { tr: 'Wheezing (hışıltı)', modalite: ['ses_akciger'] },
  'SND.STRIDOR': { tr: 'Stridor', acilEsik: 0.6, modalite: ['ses_akciger', 'ses_konusma'] },
  'SND.RONCHI': { tr: 'Ronküs', modalite: ['ses_akciger'] },
  'SND.DIM': { tr: 'Solunum sesleri azalmış', modalite: ['ses_akciger'] },
  'SND.MURMUR_PRESENT': { tr: 'Üfürüm mevcut', modalite: ['ses_kalp'] },
  'SND.MURMUR_ABSENT': { tr: 'Üfürüm saptanmadı', modalite: ['ses_kalp'] },
  'SND.MURMUR_UNCLEAR': { tr: 'Üfürüm değerlendirilemedi', modalite: ['ses_kalp'] },
  'SND.RHYTHM_IRREG': { tr: 'Düzensiz ritim izlenimi', modalite: ['ses_kalp'] },
  'SND.COUGH_ABN': { tr: 'Anormal öksürük paterni', modalite: ['ses_oksuruk'] },
  'SND.LOWQ': { tr: 'Kayıt kalitesi düşük', modalite: ['ses_akciger', 'ses_kalp', 'ses_oksuruk', 'ses_konusma'] },
  // Bone
  'BONE.FRACT': { tr: 'Kırık şüphesi', icd10: 'T14.2', modalite: ['xr_kemik'] },
  'BONE.DISLOC': { tr: 'Çıkık', icd10: 'T14.3', modalite: ['xr_kemik'] },
  'BONE.EROSION': { tr: 'Erozyon / eklem hasarı', icd10: 'M06', modalite: ['xr_kemik'] },
  'BONE.OA': { tr: 'Dejeneratif değişiklik', icd10: 'M19', modalite: ['xr_kemik'] },
  'BONE.ALIGN': { tr: 'Dizilim bozukluğu', modalite: ['xr_kemik'] },
  'BONE.AGE': { tr: 'Kemik yaşı (metrik)', modalite: ['xr_kemik'] },
  'BONE.NORM': { tr: 'Kırık izlenmedi', modalite: ['xr_kemik'] },
  // Neuro / CT
  'ICH.PRESENT': { tr: 'İntrakraniyal kanama', icd10: 'I62', acilEsik: 0.6, modalite: ['ct'] },
  'ICH.SDH': { tr: 'Subdural kanama', icd10: 'I62.0', acilEsik: 0.6, modalite: ['ct'] },
  'ICH.EDH': { tr: 'Epidural kanama', icd10: 'S06.4', acilEsik: 0.6, modalite: ['ct'] },
  'ICH.SAH': { tr: 'Subaraknoid kanama', icd10: 'I60', acilEsik: 0.6, modalite: ['ct'] },
  'ICH.IPH': { tr: 'İntraparankimal kanama', icd10: 'I61', acilEsik: 0.6, modalite: ['ct'] },
  'CT.ISCH': { tr: 'İskemi bulguları', icd10: 'I63', acilEsik: 0.6, modalite: ['ct', 'mr'] },
  'CT.MASS': { tr: 'Kitle etkisi / orta hat şifti', acilEsik: 0.6, modalite: ['ct', 'mr'] },
  'CT.FREEAIR': { tr: 'Serbest hava', acilEsik: 0.7, modalite: ['ct', 'xr_batin'] },
  'XR.ILEUS': { tr: 'İleus paterni', icd10: 'K56', modalite: ['xr_batin'] },
  // Abdomen / US
  'US.HYDRO': { tr: 'Hidronefroz', icd10: 'N13', modalite: ['us'] },
  'US.STONE': { tr: 'Taş', icd10: 'N20', modalite: ['us', 'xr_batin', 'ct'] },
  'US.THY_NOD': { tr: 'Tiroid nodülü', icd10: 'E04.1', modalite: ['us'] },
  'US.GB_STONE': { tr: 'Safra taşı', icd10: 'K80', modalite: ['us'] },
  'US.FETAL_PLANE': { tr: 'Fetal standart plan', modalite: ['us'] },
  'US.FHR': { tr: 'Fetal kalp hızı (metrik)', modalite: ['us', 'nst'] },
  'US.PRES': { tr: 'Prezentasyon (tarif)', modalite: ['us'] },
  // Mammography
  'MAMMO.RISK': { tr: 'Tarama riski (skor)', modalite: ['mamografi'] },
  'MAMMO.MASS': { tr: 'Kitle', modalite: ['mamografi'] },
  'MAMMO.CALC': { tr: 'Mikrokalsifikasyon', modalite: ['mamografi'] },
  // Pathology / smear
  'PATH.DESC': { tr: 'Mikroskopik tarif', modalite: ['patoloji'] },
  'YAYMA.DESC': { tr: 'Yayma hücre tarifi', modalite: ['yayma'] },
  'YAYMA.BLAST': { tr: 'Blast şüphesi', icd10: 'C95', acilEsik: 0.7, modalite: ['yayma'] },
  // ENT / GI / dental
  'OTO.AOM': { tr: 'Akut otitis media bulguları', icd10: 'H66.9', modalite: ['otoskopi'] },
  'OTO.OME': { tr: 'Effüzyonlu otitis media', icd10: 'H65', modalite: ['otoskopi'] },
  'OTO.PERF': { tr: 'Timpan perforasyonu', icd10: 'H72', modalite: ['otoskopi'] },
  'OTO.NORM': { tr: 'Normal timpan', modalite: ['otoskopi'] },
  'ENDO.POLYP': { tr: 'Polip', icd10: 'K63.5', modalite: ['endoskopi'] },
  'ENDO.ULCER': { tr: 'Ülser', icd10: 'K25', modalite: ['endoskopi'] },
  'ENDO.LESION': { tr: 'Lezyon (tarif)', modalite: ['endoskopi'] },
  'DENT.CARIES': { tr: 'Çürük paterni', icd10: 'K02', modalite: ['dental'] },
  'DENT.PERIAP': { tr: 'Periapikal lezyon', icd10: 'K04', modalite: ['dental'] },
  // Generic
  'GEN.DESC': { tr: 'Serbest tarif', modalite: ['serbest', 'pdf_rapor', 'nst', 'eeg', 'pet', 'video_yurume', 'dis_goz'] },
  'GEN.LOWQ': { tr: 'Görüntü kalitesi düşük', modalite: ['serbest'] },
} as const satisfies Record<string, BulguTanim>

export const BULGU_KODLARI = Object.keys(BULGULAR) as BulguKodu[]

export function bulguTr(kodu: string): string {
  return (BULGULAR as Record<string, BulguTanim>)[kodu]?.tr || kodu
}

export function acilEsik(kodu: string): number | undefined {
  return (BULGULAR as Record<string, BulguTanim>)[kodu]?.acilEsik
}

export function gecerliKod(kodu: string): kodu is BulguKodu {
  return kodu in BULGULAR
}

/** Modality display names (doctor-facing) */
export const MODALITE_TR: Record<Modalite, string> = {
  cxr: 'Röntgen (akciğer grafisi)', xr_kemik: 'Röntgen (kemik)', xr_batin: 'Röntgen (batın)', ct: 'BT kesiti', mr: 'MR kesiti',
  fundus: 'Fundus', oct: 'OCT', dis_goz: 'Dış göz fotoğrafı', ekg: 'EKG', eko: 'Ekokardiyografi',
  derm: 'Deri lezyonu fotoğrafı', dermatoskopi: 'Dermatoskopi', yara: 'Yara / yanık fotoğrafı', us: 'Ultrason',
  mamografi: 'Mamografi', patoloji: 'Patoloji / mikroskopi', yayma: 'Periferik yayma', otoskopi: 'Otoskopi',
  endoskopi: 'Endoskopi', dental: 'Dental grafi', ses_akciger: 'Akciğer sesi', ses_kalp: 'Kalp sesi',
  ses_oksuruk: 'Öksürük kaydı', ses_konusma: 'Ses / konuşma kaydı', nst: 'NST', eeg: 'EEG', pet: 'PET/BT',
  video_yurume: 'Yürüme videosu', pdf_rapor: 'Rapor (PDF)', serbest: 'Serbest görüntü',
}
