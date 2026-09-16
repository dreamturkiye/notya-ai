/**
 * Product rules from SB programs — not legal advice.
 * Dual-cite conflicts; never merge ACOG/clinic overlay into the SB column.
 */
import type { AsiKod, DualCite, NtpCanonicalKey } from './types'
import { NTP_DISCLAIMER } from './types'

export { NTP_DISCLAIMER }

export const NTP_KEYS: readonly NtpCanonicalKey[] = [
  'ntp_pku',
  'ntp_tsh',
  'ntp_biotinidaz',
  'ntp_irt',
  'ntp_17ohp',
  'ntp_sma',
]

export const NTP_ETIKET: Record<NtpCanonicalKey, string> = {
  ntp_pku: 'FKU (fenilketonüri)',
  ntp_tsh: 'KHT (konjenital hipotiroidi / TSH)',
  ntp_biotinidaz: 'Biotinidaz',
  ntp_irt: 'KF (kistik fibroz / IRT)',
  ntp_17ohp: 'KAH (konjenital adrenal hiperplazi / 17-OHP)',
  ntp_sma: 'SMA',
}

export const NTP_ALIASES: Record<NtpCanonicalKey, string[]> = {
  ntp_pku: ['pku', 'fku', 'fenilketonüri', 'fenilketonuri', 'phenylalanine', 'phe', 'yenidoğan pku'],
  ntp_tsh: ['ntp tsh', 'yenidoğan tsh', 'kht', 'konjenital hipotiroidi', 'topuk tsh', 'newborn tsh'],
  ntp_biotinidaz: ['biotinidaz', 'biotinidase', 'btd'],
  ntp_irt: ['irt', 'immunoreactive trypsinogen', 'kistik fibroz', 'kf tarama', 'cf screen'],
  ntp_17ohp: ['17-ohp', '17 ohp', '17ohp', 'kah', 'cah', 'konjenital adrenal'],
  ntp_sma: ['sma', 'spinal müsküler atrofi', 'spinal muskular', 'smn1'],
}

export const TABURCU_ZORUNLU: readonly ('ntp1' | 'hepb1' | 'vitk' | 'isitme')[] = [
  'ntp1',
  'hepb1',
  'vitk',
  'isitme',
]

export const TABURCU_ETIKET: Record<string, string> = {
  ntp1: 'NTP-1 topuk örneği (taburcu öncesi, oral beslenme sonrası, ideal ≥48 saat)',
  hepb1: 'Hepatit B 1. doz (doğumda)',
  vitk: 'K vitamini 1 mg IM',
  isitme: 'İşitme taraması',
  pulseox: 'Pulse-oksijen (KKH tarama)',
  kirmizi_refleks: 'Kırmızı refleks',
  dvit: 'D vitamini 400 IU (3 damla) — 1. haftadan 2 yaşına',
  emzirme: 'Emzirme danışmanlığı',
  ntp2: 'NTP-2 (3–5. gün, ASM)',
}

export const ASI_V1: { kod: AsiKod; etiket: string; gun: number }[] = [
  { kod: 'HEPB1', etiket: 'Hepatit B 1. doz (monovalan, doğum)', gun: 0 },
  { kod: 'HEPB2', etiket: 'Hepatit B 2. doz', gun: 30 },
  { kod: 'BCG', etiket: 'BCG (verem)', gun: 60 },
  { kod: 'DABTIPA_HIB1', etiket: 'DaBT-İPA-Hib 1. doz', gun: 60 },
  { kod: 'KPA1', etiket: 'KPA 1. doz', gun: 60 },
  { kod: 'DABTIPA_HIB2', etiket: 'DaBT-İPA-Hib 2. doz', gun: 120 },
  { kod: 'KPA2', etiket: 'KPA 2. doz', gun: 120 },
  { kod: 'HEPB3', etiket: 'Hepatit B 3. doz', gun: 180 },
  { kod: 'DABTIPA_HIB3', etiket: 'DaBT-İPA-Hib 3. doz', gun: 180 },
  { kod: 'OPA1', etiket: 'OPA 1. doz', gun: 180 },
  { kod: 'KPA3', etiket: 'KPA 3. doz (rapel penceresi 12. ay)', gun: 365 },
  { kod: 'KPA4', etiket: 'KPA rapel', gun: 365 },
  { kod: 'KKK1', etiket: 'KKK 1. doz', gun: 365 },
  { kod: 'VARICELLA', etiket: 'Suçiçeği (varisella)', gun: 365 },
  { kod: 'DABTIPA_HIB4', etiket: 'DaBT-İPA-Hib rapel', gun: 547 },
  { kod: 'OPA2', etiket: 'OPA 2. doz', gun: 547 },
  { kod: 'HEPA1', etiket: 'Hepatit A 1. doz', gun: 547 },
  { kod: 'HEPA2', etiket: 'Hepatit A 2. doz', gun: 730 },
]

/** SB Bebek izlem pencereleri (yasal taban). Midpoint used as due_at. */
export const SB_BEBEK_IZLEM: { id: string; etiket: string; gunBas: number; gunSon: number; due: number }[] = [
  { id: 'dogum', etiket: 'Doğum izlemi', gunBas: 0, gunSon: 0, due: 0 },
  { id: 'd1_10', etiket: '1–10. gün izlemi', gunBas: 1, gunSon: 10, due: 7 },
  { id: 'd15', etiket: '15. gün izlemi', gunBas: 15, gunSon: 15, due: 15 },
  { id: 'd41', etiket: '41. gün izlemi', gunBas: 41, gunSon: 41, due: 41 },
  { id: 'ay2', etiket: '2. ay izlemi', gunBas: 55, gunSon: 70, due: 60 },
  { id: 'ay3', etiket: '3. ay izlemi', gunBas: 85, gunSon: 100, due: 90 },
  { id: 'ay4', etiket: '4. ay izlemi', gunBas: 110, gunSon: 130, due: 120 },
  { id: 'ay6', etiket: '6. ay izlemi', gunBas: 170, gunSon: 190, due: 180 },
  { id: 'ay9', etiket: '9. ay izlemi', gunBas: 250, gunSon: 280, due: 270 },
]

export const LOHUSA_GOREVLER: { id: string; etiket: string; gunBas: number; gunSon: number; due: number }[] = [
  { id: 'pp_hastane', etiket: 'Lohusa — hastane (ilk 24–48 saat)', gunBas: 0, gunSon: 1, due: 0 },
  { id: 'pp_2_5', etiket: 'Lohusa — ev/klinik 2–5. gün', gunBas: 2, gunSon: 5, due: 3 },
  { id: 'pp_13_17', etiket: 'Lohusa — 13–17. gün', gunBas: 13, gunSon: 17, due: 15 },
  { id: 'pp_30_40', etiket: 'Lohusa — 30–40. gün', gunBas: 30, gunSon: 40, due: 35 },
]

export const KAYNAK = {
  ntp: 'T.C. SB HSGM Ulusal Yenidoğan Tarama Programı (FKU, KHT, biotinidaz, KF, KAH, SMA)',
  bebekIzlem: 'T.C. SB Bebek İzlem Protokolü (doğum, 1–10. gün, 15. gün, 41. gün, 2/3/4/6/9. ay)',
  dsbyr: 'T.C. SB Doğum Sonu Bakım Yönetim Rehberi (DSBYR) — lohusa izlem',
  dobyr: 'T.C. SB Doğum Öncesi Bakım Yönetim Rehberi (DÖBYR)',
  gbp: 'T.C. SB Genişletilmiş Bağışıklama Programı (GBP) — V1 kod listesi',
  gbp2025: 'T.C. SB GBP 2025 — 6\'lı karma (DaBT-İPA-Hib-HepB); 1. ay tekil HepB kaldırıldı (HBsAg+ istisna)',
  dvit: 'SB D vitamini profilaksisi: 400 IU (3 damla), 1. hafta → 2 yaş',
  demir: 'SB demir profilaksisi: 4. ay (preterm/düşük doğum ağırlığında daha erken)',
  kalca: 'Gelişimsel kalça displazisi: risk varsa US; yoksa ~3–6. hafta aile hekimi taraması',
  enabiz: 'Notya e-Nabız / ulusal tarama kaydı yerine geçmez — klinik kontrol listesi ve meslektaş aracıdır',
}

export const CIFT_ATIF: Record<string, DualCite> = {
  ay9: {
    sb: 'SB Bebek İzlem: 9. ay (~270. gün) penceresi yasal tabandır.',
    overlay: 'Ürün brifi 250. gün izlem penceresi listeler (aynı 9. ay kuşağı).',
    hint: 'Çelişkiyi birleştirmeyin — 9. ay izlemini SB penceresinde tutun; 250. gün brif notudur.',
  },
  hepa2: {
    sb: 'SB GBP: Hepatit A 2. doz 24. ay.',
    overlay: 'Aşı satırı 2/4/6/12/18. ayı listeler; HEPA2 bu satırda yok, kod listesinde var.',
    hint: 'HEPA2 24. ayda kalır — 18. aya kaydırılmaz.',
  },
  hepb2: {
    sb: 'Klasik GBP: HepB 0 / 1 / 6. ay. V1 kod: HEPB1–3.',
    overlay: '2025 6\'lı karma: 1. ay tekil HepB kaldırıldı (anne HBsAg+ istisna).',
    hint: 'Bu paket V1 kod listesini kullanır; 2025 hexavalent overlay ayrı not edilir, birleştirilmez.',
  },
  lohusa40: {
    sb: 'DSBYR 4. izlem 30–42. gün.',
    overlay: 'Ürün brifi 30–40. gün.',
    hint: 'Görev penceresi 30–40; DSBYR 42. gün bitiş notu ayrıca gösterilir.',
  },
}

export const NTP2_SMS = (ntp2Bas: string, ntp2Son: string) =>
  `Bebeğinizin 2. topuk kanı (yenidoğan tarama, NTP-2) ${ntp2Bas}–${ntp2Son} tarihleri arasında aile sağlığı merkezinde (ASM) alınmalıdır. ${NTP_DISCLAIMER} Notya e-Nabız veya ulusal tarama kaydı yerine geçmez.`

export const YENI_BEBEK_BILDIRIM = 'Yeni bebek — kadın-doğum taburcu paketi ile pediatri iş listesine düştü. Ayşe bebek kartını açabilir.'
