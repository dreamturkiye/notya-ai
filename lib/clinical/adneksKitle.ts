/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — THE ADNEXAL MASS: IOTA Simple Rules, the Risk of Malignancy Index (RMI I) and the
 * O-RADS US v2022 category. Obstetrics and gynaecology only. Pure, country-neutral: KEYS AND NUMBERS ONLY.
 *
 *   IOTA Simple Rules   Timmerman D et al. Simple ultrasound-based rules for the diagnosis of ovarian cancer. Ultrasound
 *                       Obstet Gynecol 2008;31:681-690. Five benign (B1-B5) and five malignant (M1-M5) features: only
 *                       M-features = malignant; only B-features = benign; both or none = inconclusive.
 *   RMI I               Jacobs I et al. Br J Obstet Gynaecol 1990;97:922-929, as set out in NICE CG122 (2011), appendix
 *                       "Risk of malignancy index (RMI I)", read 2026-11-05: RMI = U x M x CA-125 (IU/mL); one point each
 *                       for multilocular cyst, solid areas, metastases, ascites, bilateral lesions; U = 0 (0 points), 1
 *                       (1 point), 3 (2 to 5 points); M = 1 premenopausal, 3 postmenopausal. THE CUT-OFF IS THE COUNTRY'S
 *                       (NICE CG122: refer at 250 or greater; RCOG Green-top 34 uses 200): a build states it or shows none.
 *   O-RADS US v2022     American College of Radiology O-RADS US v2022 assessment categories (Strachowski LM et al.,
 *                       Radiology 2023). Categories 0 to 5 from the lexicon descriptors below. The ACR documents could not
 *                       be opened in this session; the rules were checked against the Ontario Health O-RADS quick
 *                       reference (version 2025-12, based on v2022). Recorded in docs/OPEN-COMMITMENTS.md KD-OPERATOR-01.
 *
 * ADNEX (IOTA's multivariable model) is NOT computed: its coefficients could not be read from the primary source in this
 * session. The builds record its nine inputs for IOTA's own calculator (OPEN-COMMITMENTS KD-OPERATOR-01).
 */

// ───────────────────────── IOTA Simple Rules ─────────────────────────

export const IOTA_B = ['b1_unilokuler', 'b2_solid_7mm_alti', 'b3_akustik_golge', 'b4_duzgun_multilokuler_10cm_alti', 'b5_akim_yok'] as const
export const IOTA_M = ['m1_duzensiz_solid', 'm2_asit', 'm3_dort_papiller', 'm4_duzensiz_multilokuler_solid_10cm', 'm5_cok_guclu_akim'] as const
export type IotaSonucu = 'benign' | 'malign' | 'belirsiz'

export function iotaBasitKurallar(isaretli: readonly string[]): { sonuc: IotaSonucu; b: number; m: number } {
  const s = new Set(isaretli)
  const b = IOTA_B.filter((k) => s.has(k)).length
  const m = IOTA_M.filter((k) => s.has(k)).length
  const sonuc: IotaSonucu = m > 0 && b === 0 ? 'malign' : b > 0 && m === 0 ? 'benign' : 'belirsiz'
  return { sonuc, b, m }
}

// ───────────────────────── RMI I ─────────────────────────

export const RMI_USG_OZELLIKLERI = ['multilokuler', 'solid_alan', 'metastaz', 'asit', 'bilateral'] as const

export function rmiU(isaretli: readonly string[]): 0 | 1 | 3 {
  const s = new Set(isaretli)
  const n = RMI_USG_OZELLIKLERI.filter((k) => s.has(k)).length
  return n === 0 ? 0 : n === 1 ? 1 : 3
}

/** RMI I. null where CA-125 is not a number. `esik` (the country's) gives `esikUstu`; without one, null. */
export function rmi1(g: { usg: readonly string[]; postmenopozal: boolean; ca125: number | null }, esik?: number | null): { rmi: number; u: number; m: number; esikUstu: boolean | null } | null {
  if (typeof g.ca125 !== 'number' || !Number.isFinite(g.ca125) || g.ca125 < 0) return null
  const u = rmiU(g.usg)
  const m = g.postmenopozal ? 3 : 1
  const rmi = Math.round(u * m * g.ca125 * 10) / 10
  return { rmi, u, m, esikUstu: typeof esik === 'number' && Number.isFinite(esik) ? rmi >= esik : null }
}

// ───────────────────────── O-RADS US v2022 ─────────────────────────

export const ORADS_LEZYON = ['degerlendirilemedi', 'yok_fizyolojik', 'klasik_benign', 'unilokuler', 'bilokuler', 'multilokuler', 'solid'] as const
export type OradsLezyon = (typeof ORADS_LEZYON)[number]
export type OradsGirdi = {
  lezyon: OradsLezyon
  /** Largest diameter, cm. */
  boyutCm?: number | null
  /** Unilocular, smooth, anechoic (a simple cyst). */
  basitKist?: boolean
  icDuvarDuzensiz?: boolean
  solidBilesen?: boolean
  /** Papillary projections (unilocular cyst with a solid component). */
  papillerSayisi?: number | null
  /** Solid lesion: outer contour irregular. */
  disKonturDuzensiz?: boolean
  /** Colour score 1 (none) to 4 (very strong). */
  renkSkoru?: 1 | 2 | 3 | 4 | null
  asitVeyaPeritonNodulu?: boolean
  postmenopozal?: boolean
}
export type OradsKategori = 0 | 1 | 2 | 3 | 4 | 5

/** The category, or null where a descriptor the rule needs is missing (`eksik`). */
export function oradsKategori(g: OradsGirdi): { kategori: OradsKategori | null; eksik: string[] } {
  const eksik: string[] = []
  if (g.lezyon === 'degerlendirilemedi') return { kategori: 0, eksik }
  if (g.asitVeyaPeritonNodulu) return { kategori: 5, eksik }
  if (g.lezyon === 'yok_fizyolojik') return { kategori: 1, eksik }
  const boyut = typeof g.boyutCm === 'number' && Number.isFinite(g.boyutCm) && g.boyutCm > 0 ? g.boyutCm : null
  const cs = g.renkSkoru ?? null
  if (g.lezyon === 'klasik_benign') {
    if (boyut == null) return { kategori: null, eksik: ['boyut'] }
    return { kategori: boyut < 10 ? 2 : 3, eksik }
  }
  if (g.lezyon === 'solid') {
    if (g.disKonturDuzensiz) return { kategori: 5, eksik }
    if (cs == null) return { kategori: null, eksik: ['renk_skoru'] }
    return { kategori: cs === 4 ? 5 : cs === 1 ? 3 : 4, eksik }
  }
  if (g.lezyon === 'unilokuler') {
    if (g.solidBilesen) {
      if (typeof g.papillerSayisi !== 'number') return { kategori: null, eksik: ['papiller_sayisi'] }
      return { kategori: g.papillerSayisi >= 4 ? 5 : 4, eksik }
    }
    if (g.icDuvarDuzensiz) return { kategori: 3, eksik }
    if (boyut == null) return { kategori: null, eksik: ['boyut'] }
    if (g.basitKist && !g.postmenopozal && boyut <= 3) return { kategori: 1, eksik }
    return { kategori: boyut <= 10 ? 2 : 3, eksik }
  }
  if (g.lezyon === 'bilokuler') {
    if (g.solidBilesen) return { kategori: 4, eksik }
    if (g.icDuvarDuzensiz) return { kategori: 4, eksik }
    if (boyut == null) return { kategori: null, eksik: ['boyut'] }
    return { kategori: boyut <= 10 ? 2 : 3, eksik }
  }
  // multilocular
  if (g.solidBilesen) {
    if (cs == null) return { kategori: null, eksik: ['renk_skoru'] }
    return { kategori: cs >= 3 ? 5 : 4, eksik }
  }
  if (g.icDuvarDuzensiz) return { kategori: 4, eksik }
  if (cs == null) return { kategori: null, eksik: ['renk_skoru'] }
  if (cs === 4) return { kategori: 4, eksik }
  if (boyut == null) return { kategori: null, eksik: ['boyut'] }
  return { kategori: boyut < 10 ? 3 : 4, eksik }
}

/** Risk of malignancy of each O-RADS category (v2022), as numbers: [from, to) per cent; null = not applicable. */
export const ORADS_RISK: Readonly<Record<OradsKategori, readonly [number, number] | null>> = {
  0: null, 1: [0, 0], 2: [0, 1], 3: [1, 10], 4: [10, 50], 5: [50, 100],
}

/**
 * The nine ADNEX predictors (three clinical, six ultrasound), RECORDED for the clinician to enter in IOTA's own ADNEX
 * calculator; this product computes no ADNEX risk. Predictor list checked 2026-11-05 (Radiopaedia, "IOTA ADNEX model";
 * Van Calster B et al., BMJ 2014;349:g5920).
 */
export const ADNEX_GIRDILERI = ['yas', 'ca125', 'onkoloji_merkezi', 'lezyon_en_buyuk_mm', 'solid_en_buyuk_mm', 'on_lokulden_fazla', 'papiller_sayisi', 'akustik_golge', 'asit'] as const
