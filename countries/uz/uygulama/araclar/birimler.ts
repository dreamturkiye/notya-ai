/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: UNITS of the tools. The name of every unit a switched-on tool shows, in the
 * three forms, and the unit this country's laboratories report each value in.
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 *
 * `UZ_LAB_BIRIMLERI` IS UNVERIFIED LOCAL CONTENT. Which unit a laboratory in Uzbekistan prints for a value was not
 * checked against a local source; each entry is a starting value the local clinical lead must confirm before a
 * doctor relies on a tool that reads it (docs/COUNTRY-PACK-UZBEKISTAN.md, "Needs local content"). The kit converts
 * from the unit stated here with fixed factors (lib/ulke/araclar/birimler.ts); a wrong unit here is a wrong result.
 */
import type { LabOlcusu } from '@/lib/ulke/araclar/tipler'
import { ayni, u, type Uc } from './yardimci'

export const UZ_ARAC_BIRIMLERI: Readonly<Record<string, Uc>> = {
  mL: u('ml', 'мл', 'мл'),
  'mL/min/1.73m2': u('ml/daq/1,73 m²', 'мл/дақ/1,73 м²', 'мл/мин/1,73 м²'),
  'mg/g': u('mg/g', 'мг/г', 'мг/г'),
  '%': ayni('%'),
  gun: u('kun', 'кун', 'дн.'),
  ay: u('oy', 'ой', 'мес.'),
  dB: u('dB', 'дБ', 'дБ'),
  mg: u('mg', 'мг', 'мг'),
  'mg/kg': u('mg/kg', 'мг/кг', 'мг/кг'),
  saat: u('soat', 'соат', 'ч'),
  mm: u('mm', 'мм', 'мм'),
  'mg/L': u('mg/l', 'мг/л', 'мг/л'),
  'mm/saat': u('mm/soat', 'мм/соат', 'мм/ч'),
  'ng/mL': u('ng/ml', 'нг/мл', 'нг/мл'),
  'ng/mL/yil': u('ng/ml bir yilda', 'нг/мл бир йилда', 'нг/мл в год'),
  dk: u('daqiqa', 'дақиқа', 'мин'),
  // length and weight as the pack measures them (index.ts → uygulama.birimler)
  cm: u('sm', 'см', 'см'),
  kg: u('kg', 'кг', 'кг'),
}

export const UZ_LAB_BIRIMLERI: Readonly<Partial<Record<LabOlcusu, string>>> = {
  // Urine albumin-to-creatinine ratio, read by the KDIGO tool. To verify: mg/g or mg/mmol.
  albuminKreatinin: 'mg/g',
  // NOTYA-ULKE-ARAC-DUZELTME-01: two values a switched-on tool reads are now quantities the pack states the unit of.
  // C-reactive protein (DAS28): mg/l, the unit a national protocol writes, per the country's audit
  // (docs/araclar-denetim/UZ.md, [P2-PROT-JIA]); the screen showed mg/l before. Not confirmed with a local laboratory.
  crp: 'mg/L',
  // Prostate-specific antigen (the rate of change): ng/ml, the unit the national urology centre writes, per the
  // country's audit ([P2-PSA-UZ]); the screen showed ng/ml before. Not confirmed with a local laboratory.
  psa: 'ng/mL',
}

/**
 * HOW A DOSE IS WRITTEN HERE: THE DECIMALS STAND (NOTYA-ULKE-ARAC-DUZELTME-01, fault 1). The rule against a zero after
 * the decimal mark is a national rule of the English-speaking countries, and it is not this country's: the
 * prescribing regulation writes its own examples with one. Source read on 2026-10-10: Order No. 121 of the Minister
 * of Health of 01.07.2020 (registered by the Ministry of Justice under No. 3277), clause 19,
 * https://lex.uz/docs/-4880063 — "qattiq va sochiluvchan dori moddalari grammlarda (0,001; 0,5; 1,0)". The clause is
 * about medicines made up to order and says nothing about rounding a dose. Not confirmed by a local pharmacist.
 */
export const UZ_DOZ_YAZIMI = { sondaSifir: true } as const
