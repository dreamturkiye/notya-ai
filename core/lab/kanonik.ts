/**
 * NOTYA-LAB-01 — Canonical lab keys, Turkish/English aliases, LOINC, canonical units, conversions, critical rules.
 * Everything numeric (flag, Δ, trend, unit conversion, critical) is computed HERE in code — never by the model.
 * Reference ranges: printed only. This file never supplies a reference range.
 */
export type KanonikAnahtar = keyof typeof KANONIK

export type KanonikTanim = {
  tr: string
  loinc?: string
  /** canonical unit we store numbers in */
  birim: string
  /** alternative unit → factor to canonical (value * factor). Only unambiguous conversions. */
  donusum?: Record<string, number>
  /** rule-based criticals on the canonical unit */
  kritik?: { dusuk?: number; yuksek?: number; pozitifMetin?: boolean }
  aliases: string[]
}

const a = (...x: string[]) => x

export const KANONIK = {
  WBC: { tr: 'Lökosit (WBC)', loinc: '6690-2', birim: '10³/µL', donusum: { '10^9/L': 1, '10⁹/L': 1, '/µL': 0.001, '/mm³': 0.001, 'K/uL': 1 }, kritik: { dusuk: 1.0, yuksek: 50 }, aliases: a('wbc', 'lökosit', 'lokosit', 'beyaz küre', 'leukocyte', 'leucocyte', 'akyuvar') },
  RBC: { tr: 'Eritrosit (RBC)', loinc: '789-8', birim: '10⁶/µL', donusum: { '10^12/L': 1, '10¹²/L': 1, 'M/uL': 1 }, aliases: a('rbc', 'eritrosit', 'alyuvar', 'erythrocyte') },
  Hb: { tr: 'Hemoglobin', loinc: '718-7', birim: 'g/dL', donusum: { 'g/L': 0.1, 'mmol/L': 1.611 }, kritik: { dusuk: 7, yuksek: 20 }, aliases: a('hb', 'hgb', 'hemoglobin', 'haemoglobin') },
  Hct: { tr: 'Hematokrit', loinc: '4544-3', birim: '%', donusum: { 'L/L': 100 }, kritik: { dusuk: 20, yuksek: 60 }, aliases: a('hct', 'htc', 'hematokrit', 'haematocrit') },
  MCV: { tr: 'MCV', loinc: '787-2', birim: 'fL', aliases: a('mcv', 'ortalama eritrosit hacmi') },
  Plt: { tr: 'Trombosit (PLT)', loinc: '777-3', birim: '10³/µL', donusum: { '10^9/L': 1, '10⁹/L': 1, '/µL': 0.001, 'K/uL': 1 }, kritik: { dusuk: 20, yuksek: 1000 }, aliases: a('plt', 'trombosit', 'platelet', 'thrombocyte') },
  Neu: { tr: 'Nötrofil', loinc: '751-8', birim: '10³/µL', donusum: { '10^9/L': 1, '10⁹/L': 1, '/µL': 0.001 }, kritik: { dusuk: 0.5 }, aliases: a('neu', 'neut', 'nötrofil', 'notrofil', 'neutrophil', 'neu#', 'nötrofil sayısı') },
  NeuPct: { tr: 'Nötrofil %', loinc: '770-8', birim: '%', aliases: a('neu%', 'nötrofil %', 'nötrofil yüzdesi', 'neutrophil %') },
  Lym: { tr: 'Lenfosit', loinc: '731-0', birim: '10³/µL', donusum: { '10^9/L': 1, '10⁹/L': 1, '/µL': 0.001 }, aliases: a('lym', 'lenfosit', 'lymphocyte', 'lym#') },
  LymPct: { tr: 'Lenfosit %', loinc: '736-9', birim: '%', aliases: a('lym%', 'lenfosit %', 'lenfosit yüzdesi') },
  Eo: { tr: 'Eozinofil', loinc: '711-2', birim: '10³/µL', donusum: { '10^9/L': 1, '/µL': 0.001 }, aliases: a('eo', 'eos', 'eozinofil', 'eosinophil', 'eo#') },
  EoPct: { tr: 'Eozinofil %', loinc: '713-8', birim: '%', aliases: a('eo%', 'eozinofil %') },
  MPV: { tr: 'MPV', loinc: '32623-1', birim: 'fL', aliases: a('mpv') },
  RDW: { tr: 'RDW', loinc: '788-0', birim: '%', aliases: a('rdw', 'rdw-cv') },
  Glu: { tr: 'Glukoz', loinc: '2345-7', birim: 'mg/dL', donusum: { 'mmol/L': 18.016 }, kritik: { dusuk: 50, yuksek: 400 }, aliases: a('glukoz', 'glucose', 'açlık kan şekeri', 'aks', 'kan şekeri', 'glu', 'açlık glukozu', 'tokluk kan şekeri') },
  HbA1c: { tr: 'HbA1c', loinc: '4548-4', birim: '%', donusum: { 'mmol/mol': 0.0915 }, aliases: a('hba1c', 'a1c', 'glikozile hemoglobin', 'glikohemoglobin', 'hb a1c') },
  Ure: { tr: 'Üre', loinc: '3091-6', birim: 'mg/dL', donusum: { 'mmol/L': 6.006 }, aliases: a('üre', 'ure', 'urea', 'kan üresi') },
  BUN: { tr: 'BUN', loinc: '3094-0', birim: 'mg/dL', donusum: { 'mmol/L': 2.801 }, aliases: a('bun', 'kan üre azotu', 'urea nitrogen') },
  Kre: { tr: 'Kreatinin', loinc: '2160-0', birim: 'mg/dL', donusum: { 'µmol/L': 0.01131, 'umol/L': 0.01131 }, kritik: { yuksek: 10 }, aliases: a('kreatinin', 'creatinine', 'kre', 'crea', 'krea') },
  eGFR: { tr: 'eGFR', loinc: '62238-1', birim: 'mL/dk/1.73m²', aliases: a('egfr', 'gfr', 'tahmini gfr', 'glomerüler filtrasyon') },
  Na: { tr: 'Sodyum', loinc: '2951-2', birim: 'mmol/L', donusum: { 'mEq/L': 1 }, kritik: { dusuk: 120, yuksek: 160 }, aliases: a('na', 'sodyum', 'sodium', 'na+') },
  K: { tr: 'Potasyum', loinc: '2823-3', birim: 'mmol/L', donusum: { 'mEq/L': 1 }, kritik: { dusuk: 2.5, yuksek: 6.5 }, aliases: a('k', 'potasyum', 'potassium', 'k+') },
  Cl: { tr: 'Klor', loinc: '2075-0', birim: 'mmol/L', donusum: { 'mEq/L': 1 }, aliases: a('cl', 'klor', 'klorür', 'chloride') },
  Ca: { tr: 'Kalsiyum', loinc: '17861-6', birim: 'mg/dL', donusum: { 'mmol/L': 4.008 }, kritik: { dusuk: 6, yuksek: 14 }, aliases: a('ca', 'kalsiyum', 'calcium', 'total kalsiyum') },
  Mg: { tr: 'Magnezyum', loinc: '19123-9', birim: 'mg/dL', donusum: { 'mmol/L': 2.431 }, aliases: a('mg', 'magnezyum', 'magnesium') },
  P: { tr: 'Fosfor', loinc: '2777-1', birim: 'mg/dL', donusum: { 'mmol/L': 3.097 }, aliases: a('fosfor', 'phosphorus', 'inorganik fosfor', 'fosfat') },
  AST: { tr: 'AST', loinc: '1920-8', birim: 'U/L', donusum: { 'IU/L': 1 }, aliases: a('ast', 'sgot', 'aspartat aminotransferaz') },
  ALT: { tr: 'ALT', loinc: '1742-6', birim: 'U/L', donusum: { 'IU/L': 1 }, aliases: a('alt', 'sgpt', 'alanin aminotransferaz') },
  GGT: { tr: 'GGT', loinc: '2324-2', birim: 'U/L', donusum: { 'IU/L': 1 }, aliases: a('ggt', 'gama gt', 'gamma gt', 'gamma-glutamil transferaz') },
  ALP: { tr: 'ALP', loinc: '6768-6', birim: 'U/L', donusum: { 'IU/L': 1 }, aliases: a('alp', 'alkalen fosfataz', 'alkaline phosphatase') },
  TBil: { tr: 'Total bilirubin', loinc: '1975-2', birim: 'mg/dL', donusum: { 'µmol/L': 0.05848, 'umol/L': 0.05848 }, aliases: a('total bilirubin', 'bilirubin total', 't.bil', 'tbil', 'toplam bilirubin') },
  DBil: { tr: 'Direkt bilirubin', loinc: '1968-7', birim: 'mg/dL', donusum: { 'µmol/L': 0.05848, 'umol/L': 0.05848 }, aliases: a('direkt bilirubin', 'direct bilirubin', 'd.bil', 'dbil', 'konjuge bilirubin') },
  LDH: { tr: 'LDH', loinc: '2532-0', birim: 'U/L', donusum: { 'IU/L': 1 }, aliases: a('ldh', 'laktat dehidrogenaz') },
  CK: { tr: 'CK', loinc: '2157-6', birim: 'U/L', donusum: { 'IU/L': 1 }, aliases: a('ck', 'cpk', 'kreatin kinaz', 'creatine kinase') },
  Alb: { tr: 'Albümin', loinc: '1751-7', birim: 'g/dL', donusum: { 'g/L': 0.1 }, aliases: a('albümin', 'albumin', 'alb') },
  TP: { tr: 'Total protein', loinc: '2885-2', birim: 'g/dL', donusum: { 'g/L': 0.1 }, aliases: a('total protein', 'toplam protein', 'protein total') },
  Uric: { tr: 'Ürik asit', loinc: '3084-1', birim: 'mg/dL', donusum: { 'µmol/L': 0.01681, 'umol/L': 0.01681 }, aliases: a('ürik asit', 'urik asit', 'uric acid') },
  Amy: { tr: 'Amilaz', loinc: '1798-8', birim: 'U/L', aliases: a('amilaz', 'amylase') },
  Lip: { tr: 'Lipaz', loinc: '3040-3', birim: 'U/L', aliases: a('lipaz', 'lipase') },
  TChol: { tr: 'Total kolesterol', loinc: '2093-3', birim: 'mg/dL', donusum: { 'mmol/L': 38.67 }, aliases: a('total kolesterol', 'kolesterol', 'cholesterol', 'toplam kolesterol', 'tchol') },
  LDL: { tr: 'LDL kolesterol', loinc: '13457-7', birim: 'mg/dL', donusum: { 'mmol/L': 38.67 }, aliases: a('ldl', 'ldl kolesterol', 'ldl-c') },
  HDL: { tr: 'HDL kolesterol', loinc: '2085-9', birim: 'mg/dL', donusum: { 'mmol/L': 38.67 }, aliases: a('hdl', 'hdl kolesterol', 'hdl-c') },
  TG: { tr: 'Trigliserid', loinc: '2571-8', birim: 'mg/dL', donusum: { 'mmol/L': 88.57 }, aliases: a('trigliserid', 'trigliserit', 'triglyceride', 'tg') },
  TSH: { tr: 'TSH', loinc: '3016-3', birim: 'mIU/L', donusum: { 'µIU/mL': 1, 'uIU/mL': 1, 'mU/L': 1 }, aliases: a('tsh', 'tiroid stimülan hormon') },
  FT4: { tr: 'Serbest T4', loinc: '3024-7', birim: 'ng/dL', donusum: { 'pmol/L': 0.0777 }, aliases: a('ft4', 'serbest t4', 'free t4', 'st4') },
  FT3: { tr: 'Serbest T3', loinc: '3051-0', birim: 'pg/mL', donusum: { 'pmol/L': 0.651 }, aliases: a('ft3', 'serbest t3', 'free t3', 'st3') },
  Ferritin: { tr: 'Ferritin', loinc: '2276-4', birim: 'ng/mL', donusum: { 'µg/L': 1, 'ug/L': 1 }, aliases: a('ferritin') },
  Fe: { tr: 'Demir', loinc: '2498-4', birim: 'µg/dL', donusum: { 'µmol/L': 5.585, 'umol/L': 5.585 }, aliases: a('demir', 'serum demir', 'iron') },
  TIBC: { tr: 'TIBC', loinc: '2500-7', birim: 'µg/dL', donusum: { 'µmol/L': 5.585 }, aliases: a('tibc', 'total demir bağlama', 'demir bağlama kapasitesi', 'tdbk') },
  B12: { tr: 'Vitamin B12', loinc: '2132-9', birim: 'pg/mL', donusum: { 'pmol/L': 1.355 }, aliases: a('b12', 'vitamin b12', 'kobalamin', 'vit b12') },
  Folate: { tr: 'Folat', loinc: '2284-8', birim: 'ng/mL', donusum: { 'nmol/L': 0.441 }, aliases: a('folat', 'folik asit', 'folate') },
  VitD: { tr: 'Vitamin D (25-OH)', loinc: '1989-3', birim: 'ng/mL', donusum: { 'nmol/L': 0.4 }, aliases: a('vitamin d', '25-oh vitamin d', '25 oh d', 'd vitamini', '25-hidroksi vitamin d') },
  CRP: { tr: 'CRP', loinc: '1988-5', birim: 'mg/L', donusum: { 'mg/dL': 10 }, aliases: a('crp', 'c-reaktif protein', 'c reaktif protein') },
  ESR: { tr: 'Sedimentasyon (ESR)', loinc: '4537-7', birim: 'mm/sa', donusum: { 'mm/h': 1, 'mm/hr': 1 }, aliases: a('esr', 'sedimentasyon', 'sedim', 'eritrosit sedimentasyon hızı', 'esh') },
  PCT: { tr: 'Prokalsitonin', loinc: '33959-8', birim: 'ng/mL', donusum: { 'µg/L': 1 }, aliases: a('pct', 'prokalsitonin', 'procalcitonin') },
  INR: { tr: 'INR', loinc: '6301-6', birim: '', kritik: { yuksek: 4 }, aliases: a('inr') },
  PT: { tr: 'Protrombin zamanı', loinc: '5902-2', birim: 'sn', donusum: { 's': 1, 'sec': 1 }, aliases: a('protrombin zamanı', 'prothrombin time', 'pt') },
  aPTT: { tr: 'aPTT', loinc: '14979-9', birim: 'sn', donusum: { 's': 1, 'sec': 1 }, aliases: a('aptt', 'ptt', 'aktive parsiyel tromboplastin') },
  DDimer: { tr: 'D-dimer', loinc: '48065-7', birim: 'ng/mL FEU', donusum: { 'µg/mL': 1000, 'mg/L': 1000 }, aliases: a('d-dimer', 'd dimer', 'ddimer') },
  Troponin: { tr: 'Troponin', loinc: '10839-9', birim: 'ng/L', donusum: { 'pg/mL': 1, 'ng/mL': 1000, 'µg/L': 1000 }, kritik: { pozitifMetin: true }, aliases: a('troponin', 'troponin i', 'troponin t', 'hs-troponin', 'hs troponin', 'tni', 'tnt', 'ctni', 'ctnt') },
  BNP: { tr: 'BNP', loinc: '30934-4', birim: 'pg/mL', aliases: a('bnp') },
  NTproBNP: { tr: 'NT-proBNP', loinc: '33762-6', birim: 'pg/mL', aliases: a('nt-probnp', 'ntprobnp', 'nt probnp', 'pro-bnp', 'probnp') },
  Lactate: { tr: 'Laktat', loinc: '2524-7', birim: 'mmol/L', donusum: { 'mg/dL': 0.111 }, kritik: { yuksek: 4 }, aliases: a('laktat', 'lactate', 'laktik asit') },
  UA_protein: { tr: 'İdrar protein', loinc: '5804-0', birim: 'metin', aliases: a('idrar protein', 'protein idrar', 'urine protein', 'tit protein') },
  UA_blood: { tr: 'İdrar kan', loinc: '5794-3', birim: 'metin', aliases: a('idrar kan', 'idrar eritrosit', 'urine blood', 'hemoglobin idrar') },
  UA_leu: { tr: 'İdrar lökosit', loinc: '5799-2', birim: 'metin', aliases: a('idrar lökosit', 'lökosit esteraz', 'urine leukocyte') },
  UA_nit: { tr: 'İdrar nitrit', loinc: '5802-4', birim: 'metin', aliases: a('idrar nitrit', 'nitrit', 'nitrite') },
  UA_glu: { tr: 'İdrar glukoz', loinc: '5792-7', birim: 'metin', aliases: a('idrar glukoz', 'urine glucose') },
  PSA: { tr: 'PSA', loinc: '2857-1', birim: 'ng/mL', donusum: { 'µg/L': 1 }, aliases: a('psa', 'total psa', 'prostat spesifik antijen') },
  CEA: { tr: 'CEA', loinc: '2039-6', birim: 'ng/mL', aliases: a('cea') },
  AFP: { tr: 'AFP', loinc: '1834-1', birim: 'ng/mL', aliases: a('afp', 'alfa fetoprotein') },
  CA125: { tr: 'CA 125', loinc: '10334-1', birim: 'U/mL', aliases: a('ca125', 'ca 125', 'ca-125') },
  CA199: { tr: 'CA 19-9', loinc: '24108-3', birim: 'U/mL', aliases: a('ca19-9', 'ca 19-9', 'ca199') },
  bHCG: { tr: 'β-hCG', loinc: '19080-1', birim: 'mIU/mL', donusum: { 'IU/L': 1 }, aliases: a('β-hcg', 'beta hcg', 'b-hcg', 'bhcg', 'hcg') },
  RF: { tr: 'Romatoid faktör', loinc: '11572-5', birim: 'IU/mL', aliases: a('romatoid faktör', 'rheumatoid factor', 'rf') },
  antiCCP: { tr: 'Anti-CCP', loinc: '33935-8', birim: 'U/mL', aliases: a('anti-ccp', 'anti ccp', 'ccp') },
  IgE: { tr: 'Total IgE', loinc: '19113-0', birim: 'IU/mL', aliases: a('ige', 'total ige') },
  Li: { tr: 'Lityum', loinc: '14334-7', birim: 'mmol/L', donusum: { 'mEq/L': 1 }, kritik: { yuksek: 1.5 }, aliases: a('lityum', 'lithium') },
  VPA: { tr: 'Valproat düzeyi', loinc: '4086-5', birim: 'µg/mL', donusum: { 'mg/L': 1 }, aliases: a('valproat', 'valproik asit', 'vpa') },
} as const satisfies Record<string, KanonikTanim>

export const KANONIK_ANAHTARLAR = Object.keys(KANONIK) as KanonikAnahtar[]

export function normalizeAd(s: string): string {
  return s.toLocaleLowerCase('tr-TR').replace(/[()*:]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Map a raw test name to a canonical key. Doctor aliases (per doctor) take precedence. Exact alias first, then bounded prefix/suffix. */
export function kanonikBul(rawName: string, doktorAliaslari?: Record<string, string>): KanonikAnahtar | null {
  const n = normalizeAd(rawName)
  if (!n) return null
  if (doktorAliaslari) { const hit = doktorAliaslari[n]; if (hit && hit in KANONIK) return hit as KanonikAnahtar }
  for (const k of KANONIK_ANAHTARLAR) for (const al of KANONIK[k].aliases) if (n === al) return k
  let best: { k: KanonikAnahtar; len: number } | null = null
  for (const k of KANONIK_ANAHTARLAR) for (const al of KANONIK[k].aliases) {
    if (al.length < 3) continue
    if (n.startsWith(al + ' ') || n.startsWith(al + '-') || n.endsWith(' ' + al)) if (!best || al.length > best.len) best = { k, len: al.length }
  }
  return best?.k || null
}

function normBirim(u: string): string {
  return u.trim().replace(/μ/g, 'µ').replace(/\s+/g, '').replace(/^10\^3\/(µ|u)l$/i, '10³/µL').replace(/^10\^6\/(µ|u)l$/i, '10⁶/µL').replace(/^10\^9\/l$/i, '10^9/L').replace(/^10\^12\/l$/i, '10^12/L').replace(/mm3/i, 'mm³').replace(/\/ul$/i, '/µL').replace(/dl$/i, 'dL').replace(/ml$/i, 'mL').replace(/^ml/i, 'mL').replace(/\/hr?$/i, '/h')
}

/** Convert a value in `unit` to the canonical unit of `key`. null = not convertible (→ unit_mismatch). */
export function kanonikBirimeCevir(key: KanonikAnahtar, value: number, unit: string | null): { deger: number; birim: string } | null {
  const t = KANONIK[key] as KanonikTanim
  if (!unit || !unit.trim() || t.birim === '' || t.birim === 'metin') return { deger: value, birim: t.birim }
  const u = normBirim(unit), c = normBirim(t.birim)
  if (u.toLowerCase() === c.toLowerCase()) return { deger: value, birim: t.birim }
  for (const [alt, f] of Object.entries(t.donusum || {})) if (normBirim(alt).toLowerCase() === u.toLowerCase()) return { deger: value * f, birim: t.birim }
  return null
}

export type KritikSonuc = { kritik: boolean; neden?: string }
export function kritikMi(key: KanonikAnahtar, deger: number | null, metin: string | null): KritikSonuc {
  const t = KANONIK[key] as KanonikTanim
  const k = t.kritik; if (!k) return { kritik: false }
  if (k.pozitifMetin && metin && /pozitif|positive|\+/i.test(metin)) return { kritik: true, neden: `${t.tr} pozitif` }
  if (deger == null) return { kritik: false }
  if (k.dusuk !== undefined && deger <= k.dusuk) return { kritik: true, neden: `${t.tr} ${deger} ${t.birim} (≤${k.dusuk})` }
  if (k.yuksek !== undefined && deger >= k.yuksek) return { kritik: true, neden: `${t.tr} ${deger} ${t.birim} (≥${k.yuksek})` }
  return { kritik: false }
}

export function kanonikTr(key: string): string { return (KANONIK as Record<string, KanonikTanim>)[key]?.tr || key }
