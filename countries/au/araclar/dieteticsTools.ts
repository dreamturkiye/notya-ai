/**
 * AU clinical dietetics Araçlar — specialty-only (`dietetics`).
 *
 * CLASSIFIED BEFORE ADDING: BRANŞ-only. Cardiology, paediatrics, psychology and every
 * other role must not see these. Visibility: roller: ['dietetics'] on each tile, except
 * IDDSI which is also offered to speech-pathology (shared dysphagia care in Australia).
 * Country: AU pack only this change; us/gb/ca/nz/uz = OPEN GAP until those packs absorb.
 *
 * Built for an Australian clinical dietitian (Dietitians Australia member) beta: malnutrition screening
 * score record, weight-change arithmetic, energy/protein starting estimates (kJ — AU
 * practice), IDDSI level record (CC BY-SA), refeeding risk ticks, enteral rate, person-
 * centred nutrition goals, nutrition-relevant lab value recording (no invented
 * intervals), a structured meal plan, and a short food diary. No medicine dose.
 * No medical diagnosis. No AUSNUT food database in this version.
 *
 * Licence notes (read 2026-10-28):
 * - MST: score recorded only (ECOG pattern); question wording is NOT reproduced — read
 *   from the MST form. Ferguson et al. Nutrition 1999; clinical use cited widely in AU.
 * - IDDSI: framework levels under Creative Commons BY-SA 4.0; descriptors not altered.
 * - Energy/protein: clinician enters kJ/kg and g/kg factors; product does plain multiply.
 *   Starting point only (Queensland Health NEMO estimating-requirements practice).
 */
import type { AracGirdisi, AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunMu, isaret, isaretliler, metin, puan, sayi, sayiMi, secim, tarih } from '@/lib/ulke/araclar/yardimci'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const ROL = 'dietetics' as const
/** IDDSI is shared with speech pathology in Australian dysphagia care (DA + SPA joint role statements). */
const IDDSI_ROLLER = ['dietetics', 'speech-pathology'] as const

const MST_KAYNAK =
  'https://pubmed.ncbi.nlm.nih.gov/10378201/ (read 2026-10-28): Ferguson M, Capra S, Bauer J, Banks M. Development of a valid and reliable malnutrition screening tool for adult acute hospital patients. Nutrition 1999;15:458-64. This tool records the total score only; the two questions are read from the MST form and are not worded here.'
const IDDSI_KAYNAK =
  'https://iddsi.org/standards/framework (read 2026-10-28): © The International Dysphagia Diet Standardisation Initiative 2019. Licensed under Creative Commons BY-SA 4.0. Level numbers only; framework descriptors are not altered or extended.'
const NEMO_KAYNAK =
  'https://www.health.qld.gov.au/nutrition (read 2026-10-28): Queensland Health NEMO nutrition support materials emphasise prediction equations as a starting point with regular reassessment. This tool multiplies the weight by the kilojoule-per-kilogram and protein-per-kilogram factors the dietitian enters; it copies no condition table.'
const DIYET_KAYNAK = 'https://dietitiansaustralia.org.au/ (read 2026-10-28): Dietitians Australia — practising dietitian scope. Meal plan and food diary store clinician/patient wording only — no food composition database and no dose.'

/** Round kJ to nearest 100 (NEMO bedside practice). */
export function yuvarlaKj(kj: number): number {
  return Math.round(kj / 100) * 100
}
/** Round protein grams to nearest 5. */
export function yuvarlaProtein(g: number): number {
  return Math.round(g / 5) * 5
}

export function yuzdeKiloDegisim(onceki: number, simdi: number): number {
  return Math.round(((simdi - onceki) / onceki) * 1000) / 10
}

// ─── 1. MST score record (questions not worded) ─────────────────────────────

export const AU_MST: AracTanimi = {
  anahtar: 'au-mst-score',
  tur: 'olcek',
  alanlar: [puan('toplam', 0, 5)],
  cikti: { sayilar: ['toplam'], bantlar: ['dusuk', 'risk'], uyarilar: [], tarihler: [] },
  kaynak: MST_KAYNAK,
  hesapla: (g) => {
    if (!sayiMi(g.toplam) || !Number.isInteger(g.toplam) || g.toplam < 0 || g.toplam > 5) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [{ anahtar: 'toplam', deger: g.toplam, ondalik: 0, enCok: 5 }],
      bant: g.toplam >= 2 ? 'risk' : 'dusuk',
      uyarilar: [],
      tarihler: [],
    }
  },
}

// ─── 2. Weight change % ─────────────────────────────────────────────────────

export const AU_KILO_DEGISIM: AracTanimi = {
  anahtar: 'au-weight-change',
  tur: 'hesap',
  alanlar: [
    sayi('onceki', 20, 300, { birim: 'kg' }),
    sayi('simdi', 20, 300, { birim: 'kg' }),
    sayi('gun', 1, 730, { tam: true, istege: true }),
  ],
  cikti: {
    sayilar: ['fark_kg', 'yuzde'],
    bantlar: ['artti', 'ayni', 'azaldi_5', 'azaldi_10', 'azaldi_cok'],
    uyarilar: ['kayip_onemli'],
    tarihler: [],
  },
  kaynak: `${DIYET_KAYNAK} Percentage weight change = (current − usual) / usual × 100. Bands at 5% and 10% loss are prompts for the dietitian's assessment, not a diagnosis.`,
  hesapla: (g) => {
    if (!sayiMi(g.onceki) || !sayiMi(g.simdi) || g.onceki <= 0) return BOS_SONUC
    const fark = Math.round((g.simdi - g.onceki) * 10) / 10
    const yuzde = yuzdeKiloDegisim(g.onceki, g.simdi)
    let bant: string = 'ayni'
    if (yuzde > 0.5) bant = 'artti'
    else if (yuzde <= -10) bant = 'azaldi_cok'
    else if (yuzde <= -5) bant = 'azaldi_10'
    else if (yuzde < -0.5) bant = 'azaldi_5'
    const uyarilar = yuzde <= -5 ? ['kayip_onemli'] : []
    return {
      tamam: true,
      sayilar: [
        { anahtar: 'fark_kg', deger: fark, ondalik: 1, birim: 'kg' },
        { anahtar: 'yuzde', deger: yuzde, ondalik: 1 },
      ],
      bant,
      uyarilar,
      tarihler: [],
    }
  },
}

// ─── 3. Energy (kJ) + protein from clinician factors ────────────────────────

export const AU_ENERJI_PROTEIN: AracTanimi = {
  anahtar: 'au-energy-protein',
  tur: 'hesap',
  alanlar: [
    sayi('kilo', 25, 250, { birim: 'kg' }),
    sayi('kj_kg', 60, 200, { tam: true, birim: 'kJ/kg' }),
    sayi('protein_kg', 0.6, 2.5, { birim: 'g/kg' }),
  ],
  cikti: {
    sayilar: ['enerji_kj', 'protein_g'],
    bantlar: [],
    uyarilar: ['baslangic'],
    tarihler: [],
  },
  sonucBirimleri: ['kJ', 'g'],
  kaynak: NEMO_KAYNAK,
  hesapla: (g) => {
    if (!sayiMi(g.kilo) || !sayiMi(g.kj_kg) || !sayiMi(g.protein_kg)) return BOS_SONUC
    if (!Number.isInteger(g.kj_kg)) return BOS_SONUC
    const enerji = yuvarlaKj(g.kilo * g.kj_kg)
    const protein = yuvarlaProtein(g.kilo * g.protein_kg)
    return {
      tamam: true,
      sayilar: [
        { anahtar: 'enerji_kj', deger: enerji, ondalik: 0, birim: 'kJ' },
        { anahtar: 'protein_g', deger: protein, ondalik: 0, birim: 'g' },
      ],
      bant: null,
      uyarilar: ['baslangic'],
      tarihler: [],
    }
  },
}

// ─── 4. IDDSI level record ──────────────────────────────────────────────────

const IDDSI_ICECEK = ['d0', 'd1', 'd2', 'd3', 'd4'] as const
const IDDSI_YIYECEK = ['f3', 'f4', 'f5', 'f6', 'f7'] as const

export const AU_IDDSI: AracTanimi = {
  anahtar: 'au-iddsi-record',
  tur: 'liste',
  alanlar: [
    secim('icecek', IDDSI_ICECEK, true),
    secim('yiyecek', IDDSI_YIYECEK, true),
    isaret('test_yapildi'),
  ],
  cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['test_yok'], tarihler: [] },
  kaynak: IDDSI_KAYNAK,
  hesapla: (g) => {
    const icecek = typeof g.icecek === 'string' && (IDDSI_ICECEK as readonly string[]).includes(g.icecek)
    const yiyecek = typeof g.yiyecek === 'string' && (IDDSI_YIYECEK as readonly string[]).includes(g.yiyecek)
    if (!icecek && !yiyecek) return BOS_SONUC
    const uyarilar = g.test_yapildi === true ? [] : ['test_yok']
    return {
      tamam: true,
      sayilar: [{ anahtar: 'isaretli', deger: (icecek ? 1 : 0) + (yiyecek ? 1 : 0), ondalik: 0, enCok: 2 }],
      bant: null,
      uyarilar,
      tarihler: [],
    }
  },
}

// ─── 5. Refeeding risk ticks ────────────────────────────────────────────────

const REFEED = ['bmi_dusuk', 'kilo_kaybi', 'az_alim', 'elektrolit', 'alkol'] as const

export const AU_REFEEDING: AracTanimi = {
  anahtar: 'au-refeeding-risk',
  tur: 'liste',
  alanlar: [...REFEED.map(isaret), isaret('yok')],
  cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['refeeding'], tarihler: [] },
  kaynak: `${DIYET_KAYNAK} Clinician ticks only. Thresholds and pathways stay with the dietitian and the treating team. Nothing is sent.`,
  hesapla: (g: AracGirdisi) => {
    const secili = isaretliler(g, REFEED)
    const yok = g.yok === true
    if ((yok && secili.length > 0) || (!yok && secili.length === 0)) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: REFEED.length }],
      bant: null,
      uyarilar: secili.length ? ['refeeding'] : [],
      tarihler: [],
    }
  },
}

// ─── 6. Enteral rate ────────────────────────────────────────────────────────

export const AU_ENTERAL: AracTanimi = {
  anahtar: 'au-enteral-rate',
  tur: 'hesap',
  alanlar: [
    sayi('hacim', 50, 5000, { birim: 'mL' }),
    sayi('saat', 1, 24, { birim: 'saat' }),
  ],
  cikti: { sayilar: ['hiz'], bantlar: [], uyarilar: ['gonderilmedi'], tarihler: [] },
  sonucBirimleri: ['mL/h'],
  kaynak: `${DIYET_KAYNAK} Rate = total volume ÷ hours. The regimen and product stay with the dietitian; nothing is ordered from this screen.`,
  hesapla: (g) => {
    if (!sayiMi(g.hacim) || !sayiMi(g.saat) || g.saat <= 0) return BOS_SONUC
    const hiz = Math.round((g.hacim / g.saat) * 10) / 10
    return {
      tamam: true,
      sayilar: [{ anahtar: 'hiz', deger: hiz, ondalik: 1, birim: 'mL/h' }],
      bant: null,
      uyarilar: ['gonderilmedi'],
      tarihler: [],
    }
  },
}

// ─── 7. Person-centred nutrition goals ──────────────────────────────────────

const HEDEFLER = ['agirlik', 'alim', 'yutma', 'semptom', 'egitim', 'aile'] as const

export const AU_NUTRITION_GOALS: AracTanimi = {
  anahtar: 'au-nutrition-goals',
  tur: 'liste',
  alanlar: [...HEDEFLER.map(isaret), sayi('aralik', 1, 180, { tam: true, istege: true })],
  cikti: { sayilar: ['isaretli'], bantlar: [], uyarilar: ['hedef_yok'], tarihler: [] },
  kaynak: `${DIYET_KAYNAK} Person-centred goals the dietitian records with the client. No calorie target is stored as a prescription.`,
  hesapla: (g) => {
    const secili = isaretliler(g, HEDEFLER)
    if (!secili.length) {
      return { tamam: true, sayilar: [{ anahtar: 'isaretli', deger: 0, ondalik: 0, enCok: HEDEFLER.length }], bant: null, uyarilar: ['hedef_yok'], tarihler: [] }
    }
    return {
      tamam: true,
      sayilar: [{ anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: HEDEFLER.length }],
      bant: null,
      uyarilar: [],
      tarihler: [],
    }
  },
}

// ─── 8. Nutrition-relevant labs (values recorded; no diagnosis bands) ───────

/**
 * Common APD working panel: glycaemia, blood count context, lipids, kidney,
 * inflammation, albumin, iron/B12/folate, refeeding electrolytes. Values only —
 * no "normal" / disease band is invented here. The dietitian reads the lab report.
 */
const LAB_SAYI_ALANLARI = [
  'hba1c',
  'glukoz',
  'hb',
  'kolesterol',
  'kreatinin',
  'crp',
  'uacr',
  'albumin',
  'ferritin',
  'b12',
  'folate',
  'potasyum',
  'fosfat',
  'magnezyum',
] as const

export const AU_NUTRITION_LABS: AracTanimi = {
  anahtar: 'au-nutrition-labs',
  tur: 'hesap',
  alanlar: [
    sayi('hba1c', 3, 20, { lab: 'hba1c', istege: true }),
    sayi('glukoz', 1, 40, { lab: 'glukoz', istege: true }),
    // Plain g/L (AU reporting). Avoid kit key `hemoglobin` in AU-authored tools — en-AU spelling check.
    sayi('hb', 40, 220, { birim: 'g/L', istege: true }),
    sayi('kolesterol', 1, 20, { lab: 'kolesterol', istege: true }),
    sayi('kreatinin', 20, 2000, { lab: 'kreatinin', istege: true }),
    sayi('crp', 0, 500, { lab: 'crp', istege: true }),
    sayi('uacr', 0, 10000, { lab: 'albuminKreatinin', istege: true }),
    sayi('albumin', 10, 60, { birim: 'g/L', istege: true }),
    sayi('ferritin', 1, 5000, { birim: 'ug/L', istege: true }),
    sayi('b12', 50, 2000, { birim: 'pmol/L', istege: true }),
    sayi('folate', 1, 100, { birim: 'nmol/L', istege: true }),
    sayi('potasyum', 1.5, 8, { birim: 'mmol/L', istege: true }),
    sayi('fosfat', 0.2, 4, { birim: 'mmol/L', istege: true }),
    sayi('magnezyum', 0.2, 2, { birim: 'mmol/L', istege: true }),
  ],
  cikti: {
    sayilar: [...LAB_SAYI_ALANLARI, 'dolu'],
    bantlar: [],
    uyarilar: ['lab_kayit', 'lab_yok'],
    tarihler: [],
  },
  sonucBirimleri: ['g/L', 'ug/L', 'pmol/L', 'nmol/L', 'mmol/L', 'mg/mmol', 'umol/L', 'mg/L', '%', 'mmol/mol'],
  kaynak: `${DIYET_KAYNAK} Nutrition-relevant results the dietitian types from the lab report. Units follow Australian laboratory reporting (HbA1c % or mmol/mol; glucose mmol/L; haemoglobin g/L). No reference interval and no diagnosis is stored.`,
  hesapla: (g) => {
    const sayilar: { anahtar: string; deger: number; ondalik: number; birim?: string }[] = []
    for (const k of LAB_SAYI_ALANLARI) {
      const v = g[k]
      if (!sayiMi(v)) continue
      const birim =
        k === 'hb' || k === 'albumin' ? 'g/L'
        : k === 'ferritin' ? 'ug/L'
        : k === 'b12' ? 'pmol/L'
        : k === 'folate' ? 'nmol/L'
        : k === 'potasyum' || k === 'fosfat' || k === 'magnezyum' ? 'mmol/L'
        : undefined
      sayilar.push({ anahtar: k, deger: v, ondalik: k === 'fosfat' || k === 'magnezyum' || k === 'potasyum' ? 2 : 1, ...(birim ? { birim } : {}) })
    }
    if (!sayilar.length) {
      return { tamam: true, sayilar: [{ anahtar: 'dolu', deger: 0, ondalik: 0, enCok: LAB_SAYI_ALANLARI.length }], bant: null, uyarilar: ['lab_yok'], tarihler: [] }
    }
    return {
      tamam: true,
      sayilar: [...sayilar, { anahtar: 'dolu', deger: sayilar.length, ondalik: 0, enCok: LAB_SAYI_ALANLARI.length }],
      bant: null,
      uyarilar: ['lab_kayit'],
      tarihler: [],
    }
  },
}

// ─── 9. Meal plan (breakfast / lunch / dinner / snacks) ─────────────────────

/**
 * Structured meal plan the dietitian keeps on the file and the patient can read on
 * the portal. Short free-text per meal (no AUSNUT). At least one meal slot required.
 */
export const AU_MEAL_PLAN: AracTanimi = {
  anahtar: 'au-meal-plan',
  tur: 'liste',
  alanlar: [
    tarih('plan_tarihi'),
    metin('kahvalti'),
    metin('ogle'),
    metin('aksam'),
    metin('atistirmalik'),
    metin('notlar'),
  ],
  cikti: { sayilar: ['dolu'], bantlar: [], uyarilar: ['plan_bos', 'portal'], tarihler: ['plan_tarihi'] },
  kaynak: `${DIYET_KAYNAK} Structured meal plan wording the dietitian writes. Not a prescription and not a nutrient analysis.`,
  hesapla: (g) => {
    if (!gunMu(g.plan_tarihi)) return BOS_SONUC
    const slotlar = ['kahvalti', 'ogle', 'aksam', 'atistirmalik'] as const
    const dolu = slotlar.filter((k) => typeof g[k] === 'string' && String(g[k]).trim()).length
    if (!dolu) {
      return { tamam: true, sayilar: [{ anahtar: 'dolu', deger: 0, ondalik: 0, enCok: 4 }], bant: null, uyarilar: ['plan_bos'], tarihler: [{ anahtar: 'plan_tarihi', tarih: g.plan_tarihi as string }] }
    }
    return {
      tamam: true,
      sayilar: [{ anahtar: 'dolu', deger: dolu, ondalik: 0, enCok: 4 }],
      bant: null,
      uyarilar: ['portal'],
      tarihler: [{ anahtar: 'plan_tarihi', tarih: g.plan_tarihi as string }],
    }
  },
}

// ─── 10. Food diary / intake note ───────────────────────────────────────────

const OGUNLER = ['kahvalti', 'ogle', 'aksam', 'atistirmalik', 'diger'] as const
const KIMLER = ['diyetisyen', 'hasta'] as const

/** Short dated intake note. Dietitian or patient (via portal) can keep an entry. */
export const AU_FOOD_DIARY: AracTanimi = {
  anahtar: 'au-food-diary',
  tur: 'liste',
  alanlar: [
    tarih('gun'),
    secim('ogun', OGUNLER),
    metin('aciklama', { istege: false }),
    secim('kim', KIMLER),
  ],
  cikti: { sayilar: ['dolu'], bantlar: [], uyarilar: ['portal'], tarihler: ['gun'] },
  kaynak: `${DIYET_KAYNAK} Short food-diary / intake note. Not a nutrient analysis.`,
  hesapla: (g) => {
    if (!gunMu(g.gun)) return BOS_SONUC
    if (typeof g.ogun !== 'string' || !(OGUNLER as readonly string[]).includes(g.ogun)) return BOS_SONUC
    if (typeof g.kim !== 'string' || !(KIMLER as readonly string[]).includes(g.kim)) return BOS_SONUC
    if (typeof g.aciklama !== 'string' || !g.aciklama.trim()) return BOS_SONUC
    return {
      tamam: true,
      sayilar: [{ anahtar: 'dolu', deger: 1, ondalik: 0, enCok: 1 }],
      bant: null,
      uyarilar: ['portal'],
      tarihler: [{ anahtar: 'gun', tarih: g.gun as string }],
    }
  },
}

export const AU_DIYET_TANIMLAR: readonly AracTanimi[] = [
  AU_MST,
  AU_KILO_DEGISIM,
  AU_ENERJI_PROTEIN,
  AU_IDDSI,
  AU_REFEEDING,
  AU_ENTERAL,
  AU_NUTRITION_GOALS,
  AU_NUTRITION_LABS,
  AU_MEAL_PLAN,
  AU_FOOD_DIARY,
]

export const AU_DIYET_ANAHTARLARI: readonly string[] = AU_DIYET_TANIMLAR.map((t) => t.anahtar)

function paket(p: {
  anahtar: string
  ad: string
  aciklama: string
  alanlar: Record<string, string>
  secenekler?: Record<string, Record<string, string>>
  sayilar?: Record<string, string>
  bantlar?: Record<string, string>
  uyarilar?: Record<string, string>
  /** Result-line date labels (`cikti.tarihler`) — distinct from `alanlar` field labels. */
  tarihler?: Record<string, string>
  not: string
  lisans: { hakSahibi: string; kaynak: string; bildirim: string }
  roller?: readonly string[]
}): PaketAraci {
  return {
    anahtar: p.anahtar,
    roller: [...(p.roller ?? [ROL])],
    metin: {
      ad: m(p.ad),
      aciklama: m(p.aciklama),
      alanlar: Object.fromEntries(Object.entries(p.alanlar).map(([k, v]) => [k, m(v)])),
      ...(p.secenekler
        ? { secenekler: Object.fromEntries(Object.entries(p.secenekler).map(([k, sec]) => [k, Object.fromEntries(Object.entries(sec).map(([s, v]) => [s, m(v)]))])) }
        : {}),
      ...(p.sayilar ? { sayilar: Object.fromEntries(Object.entries(p.sayilar).map(([k, v]) => [k, m(v)])) } : {}),
      ...(p.bantlar ? { bantlar: Object.fromEntries(Object.entries(p.bantlar).map(([k, v]) => [k, m(v)])) } : {}),
      ...(p.uyarilar ? { uyarilar: Object.fromEntries(Object.entries(p.uyarilar).map(([k, v]) => [k, m(v)])) } : {}),
      ...(p.tarihler ? { tarihler: Object.fromEntries(Object.entries(p.tarihler).map(([k, v]) => [k, m(v)])) } : {}),
      not: m(p.not),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: p.lisans.hakSahibi,
      kaynak: p.lisans.kaynak,
      bildirim: m(p.lisans.bildirim),
    },
  }
}

export function auDieteticsAraclari(): readonly PaketAraci[] {
  return [
    paket({
      anahtar: 'au-mst-score',
      ad: 'Malnutrition Screening Tool (MST): record the score',
      aciklama: 'Record the MST total (0 to 5) from the form you used with the patient. The two screening questions are not worded here — read them from the MST form. A total of 2 or more is the usual threshold for further dietetic assessment in Australian hospitals.',
      alanlar: { toplam: 'MST total score' },
      sayilar: { toplam: 'MST total' },
      bantlar: {
        dusuk: 'Score 0–1: not flagged as at risk on this screen',
        risk: 'Score 2–5: at risk on MST — continue to full nutrition assessment',
      },
      not: 'A record of the score you assessed. Not a malnutrition diagnosis. Assessment and care planning are the dietitian\'s.',
      lisans: {
        hakSahibi: 'Ferguson M, Capra S, Bauer J, Banks M (original MST publication)',
        kaynak: MST_KAYNAK,
        bildirim: 'MST score recorded only. Questions are read from the MST form. Ferguson et al. Nutrition 1999;15:458-64.',
      },
    }),
    paket({
      anahtar: 'au-weight-change',
      ad: 'Weight change (kg and %)',
      aciklama: 'Works out the change in kilograms and the percentage change from the usual (or earlier) weight to the current weight. A loss of 5% or more raises a note for your assessment. Optional: days over which the change happened (for your note only).',
      alanlar: {
        onceki: 'Usual or earlier weight',
        simdi: 'Current weight',
        gun: 'Days between the two weights (optional)',
      },
      sayilar: { fark_kg: 'Change in weight', yuzde: 'Percentage change' },
      bantlar: {
        artti: 'Weight has increased',
        ayni: 'Little or no change',
        azaldi_5: 'Loss under 5%',
        azaldi_10: 'Loss of 5% to under 10%',
        azaldi_cok: 'Loss of 10% or more',
      },
      uyarilar: {
        kayip_onemli: 'Weight loss of 5% or more from the earlier weight. Continue your nutrition assessment. This is not a diagnosis.',
      },
      not: 'Arithmetic only. Unintentional versus intentional loss, fluid status and body composition stay in your assessment.',
      lisans: { hakSahibi: 'Notya', kaynak: `${DIYET_KAYNAK} Percentage weight change arithmetic.`, bildirim: 'Weight change worked out from the two weights you entered. Not a diagnosis.' },
    }),
    paket({
      anahtar: 'au-energy-protein',
      ad: 'Estimated energy (kJ) and protein',
      aciklama: 'Multiplies the weight you enter by the kilojoules-per-kilogram and grams-of-protein-per-kilogram factors you choose. Results are rounded (energy to the nearest 100 kJ, protein to the nearest 5 g) as a bedside starting point. Australian clinical practice uses kilojoules, not kilocalories, on this screen.',
      alanlar: {
        kilo: 'Weight used for the estimate',
        kj_kg: 'Kilojoules per kilogram per day (your factor)',
        protein_kg: 'Grams of protein per kilogram per day (your factor)',
      },
      sayilar: { enerji_kj: 'Estimated energy', protein_g: 'Estimated protein' },
      uyarilar: {
        baslangic: 'Starting estimate only. Reassess against intake, weight trend and clinical status. Nothing was prescribed from this screen.',
      },
      not: 'You choose the factors for this patient. Condition-specific ranges stay in your guidelines and are not copied here. No meal plan is stored.',
      lisans: {
        hakSahibi: 'Queensland Health NEMO (practice pattern for starting estimates)',
        kaynak: NEMO_KAYNAK,
        bildirim: 'Starting estimate from the weight and factors you entered. Rounded for bedside use. Not a prescription.',
      },
    }),
    paket({
      anahtar: 'au-iddsi-record',
      roller: IDDSI_ROLLER,
      ad: 'IDDSI food and drink levels',
      aciklama: 'Records the IDDSI drink level (0–4) and/or food level (3–7) you are using with this patient. Level numbers only — framework descriptors are not rewritten here. Tick when you (or speech pathology) confirmed the level with an IDDSI test method. Offered to dietetics and speech pathology only.',
      alanlar: {
        icecek: 'Drink level (IDDSI 0–4)',
        yiyecek: 'Food level (IDDSI 3–7)',
        test_yapildi: 'Level confirmed with an IDDSI testing method under serving conditions',
      },
      secenekler: {
        icecek: { d0: '0 Thin', d1: '1 Slightly thick', d2: '2 Mildly thick', d3: '3 Moderately thick', d4: '4 Extremely thick' },
        yiyecek: { f3: '3 Liquidised', f4: '4 Pureed', f5: '5 Minced & moist', f6: '6 Soft & bite-sized', f7: '7 Easy to chew / Regular' },
      },
      sayilar: { isaretli: 'Levels recorded' },
      uyarilar: {
        test_yok: 'An IDDSI testing method was not recorded for this note. Confirm texture under serving conditions before relying on the level.',
      },
      not: 'Speech pathology and dietetics share dysphagia care in Australia. This record does not replace a swallow assessment.',
      lisans: {
        hakSahibi: 'International Dysphagia Diet Standardisation Initiative (IDDSI)',
        kaynak: IDDSI_KAYNAK,
        bildirim: '© IDDSI 2019 @ https://iddsi.org/framework. Creative Commons BY-SA 4.0. Level numbers only; descriptors not altered.',
      },
    }),
    paket({
      anahtar: 'au-refeeding-risk',
      ad: 'Refeeding risk signs (dietitian ticks)',
      aciklama: 'Tick the clinical concerns you are weighing for refeeding risk. A tick raises a pathway note for the treating team. Thresholds, electrolytes and feeding rates stay with you — nothing is prescribed here.',
      alanlar: {
        bmi_dusuk: 'Very low body mass index or severe undernutrition concern',
        kilo_kaybi: 'Large unintentional weight loss',
        az_alim: 'Little or no nutritional intake for a prolonged period',
        elektrolit: 'Low potassium, phosphate or magnesium already noted',
        alkol: 'High alcohol intake with poor nutrition',
        yok: 'None of these concerns on this review',
      },
      sayilar: { isaretli: 'Concerns ticked' },
      uyarilar: {
        refeeding: 'Refeeding risk concerns were ticked. Coordinate electrolytes, thiamine and feeding rate with the treating team. Call Triple Zero (000) if the patient is unstable. Nothing was ordered from this screen.',
      },
      not: 'A record of your ticks. Not a diagnosis and not a feed prescription.',
      lisans: { hakSahibi: 'Notya', kaynak: `${DIYET_KAYNAK} Clinician ticks for refeeding concerns.`, bildirim: 'Refeeding concerns you ticked. Not a prescription. Triple Zero (000) if unstable.' },
    }),
    paket({
      anahtar: 'au-enteral-rate',
      ad: 'Enteral feed rate (mL/h)',
      aciklama: 'Works out millilitres per hour from the total volume and the hours over which you plan to run the feed. The formula, product and advance plan stay in your note — nothing is ordered from this screen.',
      alanlar: {
        hacim: 'Total volume for the period',
        saat: 'Hours over which that volume will run',
      },
      sayilar: { hiz: 'Rate' },
      uyarilar: {
        gonderilmedi: 'Rate worked out in this note. Nothing was ordered or sent to a pump or pharmacy.',
      },
      not: 'Continuous or cyclic plans are yours to set. Bolus volumes are not converted here.',
      lisans: { hakSahibi: 'Notya', kaynak: `${DIYET_KAYNAK} Volume ÷ hours.`, bildirim: 'Feed rate from the volume and hours you entered. Nothing was ordered.' },
    }),
    paket({
      anahtar: 'au-nutrition-goals',
      ad: 'Nutrition care goals (with the client)',
      aciklama: 'Records the person-centred goals you agreed with the client (and family or carer when involved). Optional days until the next dietetic review. No kilojoule or protein target is stored as a prescription on this screen.',
      alanlar: {
        agirlik: 'Weight or muscle goal agreed',
        alim: 'Intake or fortification goal agreed',
        yutma: 'Texture / IDDSI or swallowing-related nutrition goal agreed',
        semptom: 'Symptom or tolerance goal agreed',
        egitim: 'Education or food-skills goal agreed',
        aile: 'Family or carer included in the goal-setting',
        aralik: 'Days until the next dietetic review (optional)',
      },
      sayilar: { isaretli: 'Goals recorded' },
      uyarilar: {
        hedef_yok: 'No goal was ticked. Agree at least one goal with the client when you keep this note.',
      },
      not: 'Community and outpatient dietitians often work by shared goals with family. This screen stores ticks only.',
      lisans: { hakSahibi: 'Notya', kaynak: `${DIYET_KAYNAK} Person-centred goal ticks.`, bildirim: 'Goals you agreed with the client. No prescription is stored here.' },
    }),
    paket({
      anahtar: 'au-nutrition-labs',
      ad: 'Nutrition lab results (record values)',
      aciklama: 'Type recent nutrition-relevant results from the lab report: HbA1c, glucose, haemoglobin, cholesterol, creatinine, CRP, urine ACR, albumin, ferritin, B12, folate, and potassium / phosphate / magnesium. Australian units. Enter only what you have — empty fields stay empty. No reference interval and no diagnosis is stored on this screen.',
      alanlar: {
        hba1c: 'HbA1c',
        glukoz: 'Glucose',
        hb: 'Haemoglobin',
        kolesterol: 'Total cholesterol',
        kreatinin: 'Creatinine',
        crp: 'C-reactive protein',
        uacr: 'Urine albumin-to-creatinine ratio',
        albumin: 'Serum albumin',
        ferritin: 'Ferritin',
        b12: 'Vitamin B12',
        folate: 'Folate',
        potasyum: 'Potassium',
        fosfat: 'Phosphate',
        magnezyum: 'Magnesium',
      },
      sayilar: {
        hba1c: 'HbA1c',
        glukoz: 'Glucose',
        hb: 'Haemoglobin',
        kolesterol: 'Cholesterol',
        kreatinin: 'Creatinine',
        crp: 'CRP',
        uacr: 'uACR',
        albumin: 'Albumin',
        ferritin: 'Ferritin',
        b12: 'B12',
        folate: 'Folate',
        potasyum: 'Potassium',
        fosfat: 'Phosphate',
        magnezyum: 'Magnesium',
        dolu: 'Results recorded',
      },
      uyarilar: {
        lab_kayit: 'Values recorded as you typed them from the report. Interpret with the lab\'s own intervals and the treating team. This is not a diagnosis.',
        lab_yok: 'No result was entered. Add at least one value from the report when you keep this note.',
      },
      not: 'A working record for nutrition assessment. Albumin alone is not a malnutrition diagnosis. Ferritin rises in inflammation — read with CRP. Electrolytes matter for refeeding risk with the treating team.',
      lisans: {
        hakSahibi: 'Notya',
        kaynak: `${DIYET_KAYNAK} Clinician-typed nutrition lab values in Australian units.`,
        bildirim: 'Lab values you typed. No interval and no diagnosis stored. Triple Zero (000) if the patient is unstable.',
      },
    }),
    paket({
      anahtar: 'au-meal-plan',
      ad: 'Meal plan (breakfast · lunch · dinner · snacks)',
      aciklama: 'Write a clear, readable meal plan for this patient: breakfast, lunch, dinner and snacks. Short lines work best (what to eat, texture notes, fortification). No food-composition database — this is the plan you agreed, not a nutrient analysis. The current plan is shown on the patient portal.',
      alanlar: {
        plan_tarihi: 'Date this plan starts',
        kahvalti: 'Breakfast',
        ogle: 'Lunch',
        aksam: 'Dinner',
        atistirmalik: 'Snacks',
        notlar: 'Notes for the patient (optional)',
      },
      sayilar: { dolu: 'Meal slots filled' },
      tarihler: { plan_tarihi: 'Plan start date' },
      uyarilar: {
        plan_bos: 'Add at least one of breakfast, lunch, dinner or snacks before keeping this plan.',
        portal: 'This plan is kept on the file and can be shown on the patient portal. It is not a prescription.',
      },
      not: 'Replace the previous plan by keeping a new one. Older plans stay in the tool history on the file.',
      lisans: {
        hakSahibi: 'Notya',
        kaynak: `${DIYET_KAYNAK} Meal-plan wording only.`,
        bildirim: 'Meal plan you wrote. Not a nutrient analysis and not a prescription.',
      },
    }),
    paket({
      anahtar: 'au-food-diary',
      ad: 'Food diary / intake note',
      aciklama: 'A short dated intake note: which meal or snack, what was eaten or offered, and who wrote it (you or the patient). Recent entries appear on the patient portal. Not a nutrient analysis.',
      alanlar: {
        gun: 'Date of the intake',
        ogun: 'Meal or snack',
        aciklama: 'What was eaten or offered (short description)',
        kim: 'Who wrote this entry',
      },
      secenekler: {
        ogun: {
          kahvalti: 'Breakfast',
          ogle: 'Lunch',
          aksam: 'Dinner',
          atistirmalik: 'Snack',
          diger: 'Other / between meals',
        },
        kim: {
          diyetisyen: 'Dietitian',
          hasta: 'Patient (or carer)',
        },
      },
      sayilar: { dolu: 'Entry kept' },
      tarihler: { gun: 'Intake date' },
      uyarilar: {
        portal: 'This entry is kept on the file and can be shown on the patient portal.',
      },
      not: 'Keep one entry per meal or snack. Fluid intake can go in the description.',
      lisans: {
        hakSahibi: 'Notya',
        kaynak: `${DIYET_KAYNAK} Short food-diary note.`,
        bildirim: 'Intake note you or the patient wrote. Not a nutrient analysis.',
      },
    }),
  ]
}
