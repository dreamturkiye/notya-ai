/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: UNITS of the tools. The name of every unit a switched-on tool shows, in the
 * three forms, and the unit this country's laboratories report each value in.
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 *
 * `UZ_LAB_BIRIMLERI` IS UNVERIFIED LOCAL CONTENT. No laboratory in Uzbekistan and no local clinician has confirmed
 * one entry. Since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ) each entry but one states THE UNIT A NATIONAL DOCUMENT WRITES THE
 * VALUE IN, with the document beside it (opened that day; countries/uz/uygulama/araclar/kendi/kendi.test.ts holds
 * every entry to its source). A document's unit is not a laboratory's print-out: the local clinical lead confirms
 * each before a doctor relies on a tool that reads it (docs/COUNTRY-PACK-UZBEKISTAN.md, "Needs local content").
 * The kit converts from the unit stated here with fixed factors (lib/ulke/araclar/birimler.ts); a wrong unit here is
 * a wrong result. NO LIMIT OF ANY VALUE IS STATED HERE: a unit only.
 *
 * THE DOCUMENTS, each opened on 2026-10-10:
 *   [ANC]    «Сборник национальных клинических протоколов по антенатальному уходу», Ministry of Health and the
 *            Republican Specialised Scientific-Practical Medical Centre of Obstetrics and Gynaecology; approved by the
 *            centre's Scientific Council on 29.07.2021, minutes No. 7 (the copy read carries no order number).
 *            https://uzbekistan.unfpa.org/sites/default/files/submissions/protokoly_anu_1_2_3_4_5_6_12_13_rus.pdf
 *   [CARD]   the collection of national clinical protocols on cardiology of 2015, "developed and distributed by the
 *            Ministry of Health" (the copy read carries no order number).
 *            https://extranet.who.int/ncdccs/Data/UZB_D1_КП%20по%20кардиологии%20рус%20.pdf
 *   [JIA]    «Национальный клинический протокол по ведению больных с ювенильным артритом с системным началом у
 *            детей», an annex to the Minister of Health's order No. 180 of 23.06.2025.
 *            https://api-portal.gov.uz/uploads/10/2026/03/07/c1e87c90-ebfe-7f4a-e9cd-655fdc8ee3a0_media_.pdf
 *   [PSA]    Kadirov N.U. et al., on the early diagnosis of prostate cancer, Klinik va profilaktik tibbiyot jurnali
 *            2024, No. 4 (authors of the Republican Specialised Scientific-Practical Medical Centre of Urology).
 *            A PAPER, NOT A PROTOCOL OF THE MINISTRY: the weakest of the four.
 *            https://fjsti.uz/uploads/img/yangilikar/Klinik%20va%20profilaktik%20tibbiyot%20jurnali/JCPM%204-2024/Kadirov%20N.U..pdf
 * NOT FOUND in any national text read (so nothing is stated): the unit of serum creatinine. The unit of the urine
 * albumin-to-creatinine ratio was not found either; its entry below is the starting value it always was.
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
  // NOTYA-ULKE-UYGULA-UZ: the units of the tools only this country has (./kendi/tanimlar.ts)
  'kg/m2': u('kg/m²', 'кг/м²', 'кг/м²'),
  hafta: u('hafta', 'ҳафта', 'нед.'),
}

/** One entry of the table below with where its unit was read; `kaynak: null` = no national text read states it. */
export const UZ_LAB_BIRIM_KAYNAKLARI: Readonly<Partial<Record<LabOlcusu, { birim: string; kaynak: 'ANC' | 'CARD' | 'JIA' | 'PSA' | null; yer: string }>>> = {
  // NOT FOUND in a national text (the two national standards of 2024 name the test without a unit). To verify: mg/g or mg/mmol.
  albuminKreatinin: { birim: 'mg/g', kaynak: null, yer: 'not found: a starting value, unverified' },
  // [ANC]: the collection writes the haemoglobin of the antenatal examinations in g/l.
  hemoglobin: { birim: 'g/L', kaynak: 'ANC', yer: 'haemoglobin, as the collection writes its values' },
  // [ANC]: plasma glucose in mmol/l. [CARD] writes glucose in mmol/l too.
  glukoz: { birim: 'mmol/L', kaynak: 'ANC', yer: 'plasma glucose, as the collection writes its values; the cardiology collection of 2015 writes mmol/l too' },
  // [ANC]: glycated haemoglobin in per cent.
  hba1c: { birim: '%', kaynak: 'ANC', yer: 'glycated haemoglobin, as the collection writes its values' },
  // [CARD]: total cholesterol in mmol/l.
  kolesterol: { birim: 'mmol/L', kaynak: 'CARD', yer: 'total cholesterol, as the collection writes its values' },
  // [JIA]: C-reactive protein in mg/l (and the sedimentation rate in mm/h). Read by DAS28, which is switched on.
  crp: { birim: 'mg/L', kaynak: 'JIA', yer: 'C-reactive protein, as the protocol writes its values' },
  // [PSA]: ng/ml. Read by the PSA rate of change, which is switched on. A paper of the national centre, not a protocol.
  psa: { birim: 'ng/mL', kaynak: 'PSA', yer: 'throughout the paper' },
}

/**
 * The unit each laboratory value is typed in here. Four entries are new on 2026-10-10 (haemoglobin, glucose, glycated
 * haemoglobin, cholesterol): NO SWITCHED-ON TOOL READS THEM TODAY, so no screen changed; they are stated so that the
 * day a tool that reads one is switched on, 110 typed for a haemoglobin is read as g/l and not as g/dl.
 */
export const UZ_LAB_BIRIMLERI: Readonly<Partial<Record<LabOlcusu, string>>> = Object.fromEntries(Object.entries(UZ_LAB_BIRIM_KAYNAKLARI).map(([k, v]) => [k, v.birim]))

/**
 * HOW A DOSE IS WRITTEN HERE: THE DECIMALS STAND (NOTYA-ULKE-ARAC-DUZELTME-01, fault 1). The rule against a zero after
 * the decimal mark is a national rule of the English-speaking countries, and it is not this country's: the
 * prescribing regulation writes its own examples with one. Source read on 2026-10-10: Order No. 121 of the Minister
 * of Health of 01.07.2020 (registered by the Ministry of Justice under No. 3277), clause 19,
 * https://lex.uz/docs/-4880063 — "qattiq va sochiluvchan dori moddalari grammlarda (0,001; 0,5; 1,0)". The clause is
 * about medicines made up to order and says nothing about rounding a dose. Not confirmed by a local pharmacist.
 */
export const UZ_DOZ_YAZIMI = { sondaSifir: true } as const
