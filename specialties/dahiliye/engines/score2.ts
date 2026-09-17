/**
 * NOTYA-DAH-WOW W1.2 — SCORE2 (ESC 2021, ehab309) + KVR kova + LDL hedef + statin yoğunluk açığı.
 * Kaynak: SCORE2 working group, Eur Heart J 2021;42:2439 — Updated Supplementary p.9 (katsayılar, S0, bölge ölçekleri).
 * Türkiye ESC 2021 haritasında YÜKSEK risk bölgesindedir → varsayılan bölge 'high'.
 *
 * GÜVENLİK KİLİDİ: SCORE2_ONAYLI=false iken sayısal risk DÖNMEZ (null); yalnız kural tabanlı kova (ASKVH / DM+TOD / KBH)
 * ve "doğrulama bekliyor" notu döner. Katsayılar suppl. tablo ile birebir karşılaştırılıp ledger DAH-SCORE2-VERIFY kapanınca
 * true yapılır. Hiçbir koşulda hekim kilidi olmadan kategori nota yazılmaz.
 */
import type { Dipnot } from './dahiliye'

export const SCORE2_ONAYLI = false

export type Cinsiyet = 'erkek' | 'kadin'
export type Bolge = 'low' | 'moderate' | 'high' | 'very_high'
export type KvrKova = 'dusuk_orta' | 'yuksek' | 'cok_yuksek'

const KATSAYI: Record<Cinsiyet, { yas: number; sigara: number; sbp: number; tchol: number; hdl: number; sigaraYas: number; sbpYas: number; tcholYas: number; hdlYas: number; s0: number }> = {
  erkek: { yas: 0.3742, sigara: 0.6012, sbp: 0.2777, tchol: 0.1458, hdl: -0.2698, sigaraYas: -0.0755, sbpYas: -0.0255, tcholYas: -0.0281, hdlYas: 0.0426, s0: 0.9605 },
  kadin: { yas: 0.4648, sigara: 0.7744, sbp: 0.3131, tchol: 0.1002, hdl: -0.2606, sigaraYas: -0.1088, sbpYas: -0.0277, tcholYas: -0.0226, hdlYas: 0.0613, s0: 0.9776 },
}
const OLCEK: Record<Bolge, Record<Cinsiyet, [number, number]>> = {
  low: { erkek: [-0.5699, 0.7476], kadin: [-0.7380, 0.7019] },
  moderate: { erkek: [-0.1565, 0.8009], kadin: [-0.3143, 0.7701] },
  high: { erkek: [0.3207, 0.9360], kadin: [0.5710, 0.9369] },
  very_high: { erkek: [0.5836, 0.8294], kadin: [0.9412, 0.8329] },
}
const MGDL_MMOL = 38.67

export interface Score2Girdi {
  yas: number; cinsiyet: Cinsiyet; sigara: boolean; sbp: number
  tcholMgdl: number; hdlMgdl: number; bolge?: Bolge
}

/** Ham SCORE2 (40–69) — yalnız SCORE2_ONAYLI ise dışarı çıkar. */
export function score2Ham(g: Score2Girdi): number | null {
  if (g.yas < 40 || g.yas > 69) return null
  const k = KATSAYI[g.cinsiyet]
  const cage = (g.yas - 60) / 5, csbp = (g.sbp - 120) / 20
  const ctc = g.tcholMgdl / MGDL_MMOL - 6, chdl = (g.hdlMgdl / MGDL_MMOL - 1.3) / 0.5
  const sig = g.sigara ? 1 : 0
  const lp = k.yas * cage + k.sigara * sig + k.sbp * csbp + k.tchol * ctc + k.hdl * chdl
    + k.sigaraYas * sig * cage + k.sbpYas * csbp * cage + k.tcholYas * ctc * cage + k.hdlYas * chdl * cage
  const ham = 1 - Math.pow(k.s0, Math.exp(lp))
  const [s1, s2] = OLCEK[g.bolge || 'high'][g.cinsiyet]
  const kal = 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - ham))))
  return Math.round(kal * 1000) / 10
}

/** ESC 2021 yaşa göre eşikler. */
export function score2Kova(yas: number, riskPct: number): KvrKova {
  const [a, b] = yas < 50 ? [2.5, 7.5] : yas < 70 ? [5, 10] : [7.5, 15]
  return riskPct < a ? 'dusuk_orta' : riskPct < b ? 'yuksek' : 'cok_yuksek'
}

export interface KvrGirdi {
  sigara?: boolean; sbp?: number; tcholMgdl?: number; hdlMgdl?: number; bolge?: Bolge
  yas: number | null; cinsiyet: Cinsiyet | null
  askvh: boolean; dm: boolean; dmTod: boolean; dmSure10Yil?: boolean
  eGFR: number | null; uacr: number | null
  ldlMgdl: number | null; statinYogunluk: 'yok' | 'dusuk' | 'orta' | 'yuksek'; ezetimib?: boolean
}
export interface KvrSonuc {
  kova: KvrKova | null; kovaNedeni: string; skorGerekli: boolean
  score2: number | null; score2Notu: string
  hedefLdl: number | null; hedefNotu: string
  statinAcigi: string[]; dipnotlar: Dipnot[]
}

/** Kural kovası (skor gerekmez) → skor (onaylıysa) → LDL hedef + statin açığı. Hekim kilitler. */
export function kvrDegerlendir(g: KvrGirdi): KvrSonuc {
  const dip: Dipnot[] = [{ ref: 'TEMD_LIPID', not: 'ESC 2021/TEMD: ASKVH, DM+hedef organ hasarı, ağır KBH → çok yüksek risk (skor gerekmez); LDL hedefleri kategoriye göre' }]
  let kova: KvrKova | null = null, neden = ''
  const kbhAgir = (g.eGFR != null && g.eGFR < 30) || (g.eGFR != null && g.eGFR < 45 && g.uacr != null && g.uacr > 30)
  const kbhOrta = !kbhAgir && g.eGFR != null && ((g.eGFR < 45) || (g.eGFR < 60 && g.uacr != null && g.uacr > 30))
  if (g.askvh) { kova = 'cok_yuksek'; neden = 'Aterosklerotik KVH öyküsü' }
  else if (g.dm && g.dmTod) { kova = 'cok_yuksek'; neden = 'Diyabet + hedef organ hasarı' }
  else if (kbhAgir) { kova = 'cok_yuksek'; neden = 'Ağır KBH (eGFR <30 veya eGFR <45 + albüminüri)' }
  else if (g.dm && (g.dmSure10Yil || (g.yas != null && g.yas >= 50))) { kova = 'yuksek'; neden = 'Diyabet ≥10 yıl / ≥50 yaş (hedef organ hasarı yok)' }
  else if (kbhOrta) { kova = 'yuksek'; neden = 'Orta KBH (KDIGO)' }
  else if (g.sbp != null && g.sbp >= 180) { kova = 'yuksek'; neden = 'SBP ≥180' }
  else if (g.tcholMgdl != null && g.tcholMgdl / MGDL_MMOL > 8) { kova = 'yuksek'; neden = 'Total kolesterol >8 mmol/L (~310 mg/dL)' }
  const skorGerekli = kova == null
  let score2: number | null = null, score2Notu = ''
  if (skorGerekli) {
    if (g.yas == null || g.cinsiyet == null || g.sbp == null || g.tcholMgdl == null || g.hdlMgdl == null) score2Notu = 'SCORE2 için yaş, cinsiyet, sigara, SBP, TChol, HDL gerekir'
    else if (g.yas < 40) score2Notu = '<40 yaş: SCORE2 tanımlı değil — yaşam tarzı; risk faktörü yoğunluğu ile klinik karar'
    else if (g.yas > 69) score2Notu = '≥70 yaş: SCORE2-OP (ledger DAH-SCORE2-OP) — doğrulanmış katsayı gelene kadar klinik karar'
    else if (g.dm) score2Notu = 'Diyabet: SCORE2-Diabetes (ledger DAH-SCORE2-DIABETES) — şimdilik TEMD kuralı: DM = en az yüksek risk'
    else if (!SCORE2_ONAYLI) score2Notu = 'SCORE2 sayısal hesap katsayı doğrulaması bekliyor (EHJ 2021 suppl. p9) — kategori hekim kararı'
    else { score2 = score2Ham({ yas: g.yas, cinsiyet: g.cinsiyet, sigara: !!g.sigara, sbp: g.sbp, tcholMgdl: g.tcholMgdl, hdlMgdl: g.hdlMgdl, bolge: g.bolge || 'high' }); if (score2 != null) { kova = score2Kova(g.yas, score2); neden = `SCORE2 %${score2} (yüksek risk bölgesi)` } }
    if (g.dm && kova == null) { kova = 'yuksek'; neden = neden || 'Diyabet (TEMD: en az yüksek risk)' }
  }
  const hedefLdl = kova === 'cok_yuksek' ? 55 : kova === 'yuksek' ? 70 : kova === 'dusuk_orta' ? 100 : null
  const hedefNotu = hedefLdl ? `LDL hedef önerisi <${hedefLdl} mg/dL${kova !== 'dusuk_orta' ? ' ve başlangıçtan ≥%50 düşüş' : ''} — hekim kilitler` : 'Kategori kilitlenince LDL hedefi önerilir'
  const statinAcigi: string[] = []
  if (hedefLdl && g.ldlMgdl != null && g.ldlMgdl > hedefLdl) {
    const gerekli = Math.round((1 - hedefLdl / g.ldlMgdl) * 100)
    const yog = gerekli >= 50 ? 'yüksek yoğunluk statin sınıfı' : gerekli >= 30 ? 'orta yoğunluk statin sınıfı' : 'düşük–orta yoğunluk statin sınıfı'
    if (g.statinYogunluk === 'yok') statinAcigi.push(`LDL ${g.ldlMgdl} → hedef <${hedefLdl}: ~%${gerekli} düşüş gerekir → ${yog} (hekim dozu yazar)`)
    else if (g.statinYogunluk === 'yuksek') statinAcigi.push(`Yüksek yoğunluk statin altında LDL ${g.ldlMgdl} > hedef: ${g.ezetimib ? 'PCSK9 inhibitörü için lipid/kardiyoloji sevk' : 'ezetimib ekleme'} — hekim`)
    else statinAcigi.push(`${g.statinYogunluk} yoğunluk statin altında hedef dışı: yoğunluk artışı veya ezetimib — hekim`)
  }
  return { kova, kovaNedeni: neden, skorGerekli, score2, score2Notu, hedefLdl, hedefNotu, statinAcigi, dipnotlar: dip }
}
