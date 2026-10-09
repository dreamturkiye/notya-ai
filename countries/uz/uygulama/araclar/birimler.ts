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
}

export const UZ_LAB_BIRIMLERI: Readonly<Partial<Record<LabOlcusu, string>>> = {
  // Urine albumin-to-creatinine ratio, read by the KDIGO tool. To verify: mg/g or mg/mmol.
  albuminKreatinin: 'mg/g',
}
