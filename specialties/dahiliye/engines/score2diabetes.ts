/**
 * DAH-SCORE2-DIABETES — SCORE2-Diabetes (ESC 2023, ehad260): tip 2 diyabet, 40–69 yaş, ASKVH / ağır hedef organ hasarı yok.
 *
 * KAYNAK (2026-09-17): SCORE2-Diabetes working group & ESC Cardiovascular risk collaboration, Eur Heart J 2023;44(28):2544–2556,
 * doi:10.1093/eurheartj/ehad260 (PMC10361012) — "supplementary_material.pdf" + "appendix_2.xlsx" (resmi hesaplayıcı).
 *   - KATSAYI (log SHR, SCORE2 + diyabete özgü; erkek/kadın) → Supplementary Methods Table 1, adım 1.
 *     Dönüşümler: cage=(yaş−60)/5, csbp=(SBP−120)/20, ctchol=TChol−6, chdl=(HDL−1.3)/0.5, cagediab=(tanı yaşı−50)/5,
 *     chba1c=(HbA1c mmol/mol−31)/9.34, clnegfr=(ln eGFR−4.5)/0.15 (+ kare terimi).
 *   - s0 0.9605 (erkek) / 0.9776 (kadın) → Table 1 adım 2 (SCORE2 ile aynı); ölçekler → Table 1 adım 3 (SCORE2 ile aynı).
 *   - Resmi hesaplayıcı formülleri (appendix_2.xlsx "values" sayfası) satır satır aynı.
 * DOĞRULAMA (tests/score2diabetes.test.ts): ana makale Results örnekleri (orta bölge 60 yaş erkek %11.0 / %17.2, kadın %12.7;
 * düşük bölge %12.9 / %9.8; çok yüksek bölge %31.2 / %34.0) ve resmi hesaplayıcının kayıtlı örneği (53 yaş sigara içen,
 * 4 bölge × 2 cinsiyet, yüksek bölge erkek %15.39 / kadın %16.01) yeniden üretildi. Ana makaledeki kadın "%7.9" değeri bu
 * katsayılarla %7.6 çıkar (diğer 7 değer ±0.05 içinde) — test dışında bırakıldı, ledger'a yazıldı.
 *
 * GÜVENLİK: sayısal skor yalnız SCORE2_DIABETES_ONAYLI + tüm girdiler (onaylı HbA1c ve eGFR lab satırı, diyabet tanı yaşı) varsa.
 * Kategori ESC 2023 diyabet kılavuzu eşikleri (<%5 düşük, %5–<10 orta, %10–<20 yüksek, ≥%20 çok yüksek) → kova taslağı; hekim kilitler.
 */
import type { Cinsiyet, Bolge } from './score2'

export const SCORE2_DIABETES_ONAYLI = true

const B: Record<Cinsiyet, { yas: number; sigara: number; sbp: number; dm: number; tchol: number; hdl: number; sigaraYas: number; sbpYas: number; dmYas: number; tcholYas: number; hdlYas: number; taniYas: number; hba1c: number; egfr: number; egfr2: number; hba1cYas: number; egfrYas: number; s0: number }> = {
  erkek: { yas: 0.5368, sigara: 0.4774, sbp: 0.1322, dm: 0.6457, tchol: 0.1102, hdl: -0.1087, sigaraYas: -0.0672, sbpYas: -0.0268, dmYas: -0.0983, tcholYas: -0.0181, hdlYas: 0.0095, taniYas: -0.0998, hba1c: 0.0955, egfr: -0.0591, egfr2: 0.0058, hba1cYas: -0.0134, egfrYas: 0.0115, s0: 0.9605 },
  kadin: { yas: 0.6624, sigara: 0.6139, sbp: 0.1421, dm: 0.8096, tchol: 0.1127, hdl: -0.1568, sigaraYas: -0.1122, sbpYas: -0.0167, dmYas: -0.1272, tcholYas: -0.0200, hdlYas: 0.0186, taniYas: -0.118, hba1c: 0.1173, egfr: -0.0640, egfr2: 0.0062, hba1cYas: -0.0196, egfrYas: 0.0169, s0: 0.9776 },
}
const OLCEK: Record<Bolge, Record<Cinsiyet, [number, number]>> = {
  low: { erkek: [-0.5699, 0.7476], kadin: [-0.7380, 0.7019] },
  moderate: { erkek: [-0.1565, 0.8009], kadin: [-0.3143, 0.7701] },
  high: { erkek: [0.3207, 0.9360], kadin: [0.5710, 0.9369] },
  very_high: { erkek: [0.5836, 0.8294], kadin: [0.9412, 0.8329] },
}
const MGDL_MMOL = 38.67

/** HbA1c % (NGSP/DCCT) → mmol/mol (IFCC) — IFCC–NGSP ana denklemi. */
export const hba1cMmolMol = (yuzde: number) => (yuzde - 2.15) * 10.929

export interface Score2DmGirdi {
  yas: number; cinsiyet: Cinsiyet; sigara: boolean; sbp: number; tcholMmol: number; hdlMmol: number
  hba1cMmolMol: number; eGFR: number; taniYasi: number; bolge?: Bolge
}

export function score2DmLp(g: Score2DmGirdi): number {
  const k = B[g.cinsiyet]
  const cage = (g.yas - 60) / 5, csbp = (g.sbp - 120) / 20, ctc = g.tcholMmol - 6, chdl = (g.hdlMmol - 1.3) / 0.5
  const cad = (g.taniYasi - 50) / 5, ch = (g.hba1cMmolMol - 31) / 9.34, ce = (Math.log(g.eGFR) - 4.5) / 0.15, sig = g.sigara ? 1 : 0
  return k.yas * cage + k.sigara * sig + k.sbp * csbp + k.dm + k.tchol * ctc + k.hdl * chdl
    + k.sigaraYas * cage * sig + k.sbpYas * cage * csbp + k.dmYas * cage + k.tcholYas * cage * ctc + k.hdlYas * cage * chdl
    + k.taniYas * cad + k.hba1c * ch + k.egfr * ce + k.egfr2 * ce * ce + k.hba1cYas * ch * cage + k.egfrYas * ce * cage
}
export function score2DmKalibrasyonsuz(g: Score2DmGirdi): number { return 1 - Math.pow(B[g.cinsiyet].s0, Math.exp(score2DmLp(g))) }
export function score2DmOlasilik(g: Score2DmGirdi): number {
  const [s1, s2] = OLCEK[g.bolge || 'high'][g.cinsiyet]
  return 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - score2DmKalibrasyonsuz(g)))))
}

export type DmRiskSinif = 'dusuk' | 'orta' | 'yuksek' | 'cok_yuksek'
export const dmRiskSinifi = (pct: number): DmRiskSinif => (pct < 5 ? 'dusuk' : pct < 10 ? 'orta' : pct < 20 ? 'yuksek' : 'cok_yuksek')

export interface Score2DmHesapGirdi {
  yas: number | null; cinsiyet: Cinsiyet | null; sigara: boolean; sbp?: number | null; tcholMgdl?: number | null; hdlMgdl?: number | null
  hba1cYuzde: number | null; eGFR: number | null; taniYasi: number | null; bolge?: Bolge
}
/** Tüm girdiler + ONAYLI ise % (bir ondalık); eksikleri adıyla döner — uydurma değer yok. */
export function score2Diabetes(g: Score2DmHesapGirdi): { skor: number | null; sinif: DmRiskSinif | null; eksik: string[] } {
  const eksik: string[] = []
  if (g.yas == null || g.cinsiyet == null) eksik.push('yaş/cinsiyet')
  if (g.sbp == null) eksik.push('SBP (bugünkü KB)')
  if (g.tcholMgdl == null) eksik.push('total kolesterol (onaylı lab)')
  if (g.hdlMgdl == null) eksik.push('HDL (onaylı lab)')
  if (g.hba1cYuzde == null) eksik.push('HbA1c (onaylı lab)')
  if (g.eGFR == null) eksik.push('eGFR (onaylı kreatinin/eGFR satırı)')
  if (g.taniYasi == null) eksik.push('diyabet tanı yaşı (DM kartı tanı tarihi veya KVR kartı)')
  if (!SCORE2_DIABETES_ONAYLI || eksik.length || g.yas! < 40 || g.yas! > 69) return { skor: null, sinif: null, eksik }
  const taniYasi = Math.min(g.taniYasi!, g.yas!)
  const p = score2DmOlasilik({ yas: g.yas!, cinsiyet: g.cinsiyet!, sigara: g.sigara, sbp: g.sbp!, tcholMmol: g.tcholMgdl! / MGDL_MMOL, hdlMmol: g.hdlMgdl! / MGDL_MMOL, hba1cMmolMol: hba1cMmolMol(g.hba1cYuzde!), eGFR: g.eGFR!, taniYasi, bolge: g.bolge || 'high' })
  const skor = Math.round(p * 1000) / 10
  return { skor, sinif: dmRiskSinifi(skor), eksik }
}
