/**
 * ENDOKRINOLOJI-KDIGO-KBH-01 — diyabetik böbrek hastalığı RİSK KATEGORİSİ, KDIGO'dan izin gerektirmeyecek şekilde.
 *
 * Why endokrinoloji gets this tool (sourced, not assumed): the American Diabetes Association and KDIGO published a
 * JOINT consensus report, "Diabetes Management in Chronic Kidney Disease: A Consensus Report by the ADA and KDIGO"
 * (Diabetes Care 2022 / Kidney Int. 2022; https://kdigo.org/wp-content/uploads/2023/04/Diabetes-Management-in-
 * Chronic-Kidney-Disease-Consensus-Report-by-the-ADA-and-KDIGO.pdf, opened this session, 2026-10-13), making CKD
 * staging (the eGFR × albuminuria/ACR heat map) and risk categorisation a STANDING part of diabetes care, not a
 * nephrology-only concern — screening, staging and treatment intensification for diabetic kidney disease are
 * explicitly endocrinology/diabetes-team work in that consensus. This is a fresh, endokrinoloji-flavoured copy of
 * the kit's own risk-tier arithmetic — see the design note below for what is and is not reproduced from KDIGO.
 *
 * `dahiliye/engines/ckd.ts` and `nefroloji/engines/egfr.ts` already carry a CKD tool on `main`, but BOTH reproduce
 * KDIGO's own coloured heat-map legend (`yesil`/`sari`/`turuncu`/`kirmizi` keys + "Düşük risk hücresi" wording
 * copied from KDIGO's figure legend) — a real licensing exposure flagged separately and left untouched here. This
 * file does NOT copy that pattern: no colour, no chart, the guideline's own plain-English risk-tier words only.
 *
 * WHAT IS AN OPEN FACT (reproduced here) AND WHAT IS KDIGO'S OWN EXPRESSION (deliberately not reproduced):
 *
 *   open fact       the eGFR category boundaries (G1–G5) and the albuminuria/ACR category boundaries (A1–A3): a
 *                   classification of measured kidney function and urine albumin, not an artistic or creative
 *                   choice. [KDIGO-FULL] Table 2 and Table 3 (both p. S137), opened this session (2026-10-13).
 *                   The four risk-tier NAMES ("low risk", "moderately increased risk", "high risk", "very high
 *                   risk") are themselves the guideline's own open clinical vocabulary for describing risk in
 *                   words: [KDIGO-FULL] p. S126, the legend of the CGA prognosis figure, read this session:
 *                   "Green: low risk (if no other markers of kidney disease, no CKD); Yellow: moderately increased
 *                   risk; Orange: high risk; Red: very high risk." The same four words, with the same legend
 *                   sentence, appear in the predecessor guideline [KDIGO-2012] p. 6.
 *   open fact       THAT a worse GFR category or a worse albuminuria category never lowers the tier (monotonicity)
 *                   — read as TEXT from [KDIGO-2012] p. 8 (frequency-of-monitoring grid) and p. 14 (monitor/refer
 *                   grid), not guessed from the 2024 chart image.
 *   KDIGO's own     the coloured chart itself — its grid shape, its specific colours (green/yellow/orange/red
 *   expression      cells) and its layout. NONE OF THAT IS HERE. This file returns one of four plain words
 *                   (`dusuk`/`orta`/`yuksek`/`cokYuksek`), the ordinary English-meaning translations of the
 *                   guideline's own tier names, never a colour key. No colour is defined anywhere in this file.
 *
 * Standing kilitler (same as the rest of this chapter): tanı kilidi hekimde; Notya doz/ilaç önerisi üretmez; bu
 * tier bir karar desteğidir, laboratuvar sonucunun kendisi değil.
 *
 * NOT ADDED to `lib/doktor/doktorAraclari.ts` (the Doktor Araçları tile catalog) by this change — off for every
 * doctor until a clinician reviews and signs off the tile copy and visibility, same ship pattern as
 * `lib/ulke/araclar/tanimlar/kbhRiskKategorisi.ts` (country-pack kit, same day): engine + tests land first,
 * pending review, no route/tile wiring yet.
 *
 * SOURCES, opened this session (2026-10-13):
 *   [KDIGO-FULL] KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney
 *     Disease. Kidney Int. 2024;105(4S):S117-S314 — https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf
 *     Table 2 (GFR categories, p. S137), Table 3 (albuminuria categories, p. S137), prognosis figure legend (p. S126).
 *   [KDIGO-2012] KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney
 *     Disease. Kidney Int. Suppl. 2013;3(1) — https://kdigo.org/wp-content/uploads/2017/02/KDIGO_2012_CKD_GL.pdf
 *     prognosis colour legend (p. 6), frequency-of-monitoring grid (p. 8), monitor/refer grid (p. 14).
 *   [ADA-KDIGO-2022] Diabetes Management in Chronic Kidney Disease: A Consensus Report by the ADA and KDIGO.
 *     Diabetes Care 2022;45(12):3075-3090 / Kidney Int. 2022;102(5):990-999 —
 *     https://kdigo.org/wp-content/uploads/2023/04/Diabetes-Management-in-Chronic-Kidney-Disease-Consensus-Report-by-the-ADA-and-KDIGO.pdf
 *     — the basis for endokrinoloji's visibility (diabetic kidney disease staging/monitoring is diabetes-team work).
 */
import type { Dipnot } from './endokrinoloji'

/** eGFR categories, the guideline's own keys (G1–G5), unchanged. */
export const KDIGO_G = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'] as const
export type KdigoG = (typeof KDIGO_G)[number]

/** Albuminuria/ACR categories, the guideline's own keys (A1–A3), unchanged. */
export const KDIGO_A = ['A1', 'A2', 'A3'] as const
export type KdigoA = (typeof KDIGO_A)[number]

export function gKategorisi(eGFR: number): KdigoG {
  return eGFR >= 90 ? 'G1' : eGFR >= 60 ? 'G2' : eGFR >= 45 ? 'G3a' : eGFR >= 30 ? 'G3b' : eGFR >= 15 ? 'G4' : 'G5'
}

export function aKategorisi(acrMgG: number): KdigoA {
  return acrMgG < 30 ? 'A1' : acrMgG <= 300 ? 'A2' : 'A3'
}

/** This file's own four risk-tier keys. Plain words, no colour — see the file header for why. */
export const KBH_RISK_TIYERLERI = ['dusuk', 'orta', 'yuksek', 'cokYuksek'] as const
export type KbhRiskTiyeri = (typeof KBH_RISK_TIYERLERI)[number]

/**
 * The composite risk tier of a GFR category and an albuminuria category — this file's own arithmetic on the open
 * category ordering (see header for the monitoring-grid cross-check). Independent of the blocked, colour-keyed
 * `kdigoRenk` functions in `dahiliye/engines/ckd.ts` / `nefroloji/engines/egfr.ts`; neither is imported here.
 */
export function kbhRiskTiyeri(g: KdigoG, a: KdigoA): KbhRiskTiyeri {
  const gi = KDIGO_G.indexOf(g)
  const ai = KDIGO_A.indexOf(a)
  if (gi >= 4) return 'cokYuksek'
  if (gi === 3) return ai === 0 ? 'yuksek' : 'cokYuksek'
  if (gi === 2) return ai === 0 ? 'orta' : ai === 1 ? 'yuksek' : 'cokYuksek'
  return ai === 0 ? 'dusuk' : ai === 1 ? 'orta' : 'yuksek'
}

export interface KbhRiskGirdi {
  /** eGFR, mL/min/1.73m² — her zaman bu birim (guideline). */
  eGFR: number | null
  /** ACR, mg/g — isteğe bağlı; eksikse tier verilmez (bkz. hesapla). */
  acr: number | null
}

export interface KbhRiskSonuc {
  tamamMi: boolean
  g: KdigoG | null
  a: KdigoA | null
  tiyer: KbhRiskTiyeri | null
  ozet: string
  dipnot: Dipnot
}

const DIPNOT: Dipnot = {
  ref: 'KDIGO_2024',
  not: 'KDIGO 2024 eGFR × ACR risk kategorisi — diyabetik böbrek hastalığı izlemi karar desteğidir (ADA-KDIGO 2022 konsensüsü); tanı ve tedavi kararı hekimindir',
}

/**
 * eGFR alone is not enough for a tier: a missing ACR gives only the GFR category, never a guessed tier (no silent
 * default — the same "no tier without both results" rule as the country-pack kit's `kbh-risk-kategorisi`).
 */
export function kbhRiskDegerlendir(g: KbhRiskGirdi): KbhRiskSonuc {
  if (g.eGFR == null || Number.isNaN(g.eGFR) || g.eGFR < 1 || g.eGFR > 200) {
    return { tamamMi: false, g: null, a: null, tiyer: null, ozet: 'eGFR eksik veya makul aralık dışında (1–200) — risk kategorisi verilmez', dipnot: DIPNOT }
  }
  const gk = gKategorisi(g.eGFR)
  if (g.acr == null || Number.isNaN(g.acr) || g.acr < 0) {
    return { tamamMi: true, g: gk, a: null, tiyer: null, ozet: `eGFR ${g.eGFR} → ${gk}. ACR girilmedi — risk kategorisi için ACR gerekli (karar desteği, tanı değil)`, dipnot: DIPNOT }
  }
  const ak = aKategorisi(g.acr)
  const tiyer = kbhRiskTiyeri(gk, ak)
  return {
    tamamMi: true,
    g: gk,
    a: ak,
    tiyer,
    ozet: `eGFR ${g.eGFR} × ACR ${g.acr} mg/g → ${gk} × ${ak} · risk kategorisi: ${tiyer}. Karar desteğidir; tanı ve tedavi (RAS blokeri / SGLT2i dahil) kararı hekimindir.`,
    dipnot: DIPNOT,
  }
}
