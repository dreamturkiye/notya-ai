/**
 * NOTYA-DAH-WOW W1.2 — SCORE2 (ESC 2021, ehab309) + KVR kova + LDL hedef + statin yoğunluk açığı.
 * Türkiye ESC 2021 haritasında YÜKSEK risk bölgesindedir → varsayılan bölge 'high'.
 *
 * KAYNAK (DAH-SCORE2-VERIFY, 2026-09-17): SCORE2 working group & ESC Cardiovascular risk collaboration, Eur Heart J
 * 2021;42(25):2439–2454, doi:10.1093/eurheartj/ehab309 — "SCORE2 Updated Supplementary Material.docx" (ehab309
 * supplementary data, PMC8248998, file dated 2021-09-16). Satır satır karşılaştırıldı, fark yok:
 *   - KATSAYI (log SHR, erkek/kadın) + s0 (baseline survival 0.9605 / 0.9776) → Supplementary methods Table 2
 *     ("Model coefficients and baseline survival of the SCORE2 algorithm"; dönüşümler cage=(yaş−60)/5,
 *     csbp=(SBP−120)/20, ctchol=TChol−6 mmol/L, chdl=(HDL−1.3)/0.5). Diyabet katsayısı (0.6457/0.8096) bilerek yok:
 *     tablo dipnotu — SCORE2 diyabetsiz kişide kullanılır, diyabet göstergesi 0 alınır.
 *   - OLCEK (scale1, scale2; low/moderate/high/very high) → Supplementary methods Table 3.
 *   - Kalibrasyon: 1 − exp(−exp(scale1 + scale2 × ln(−ln(1 − ham risk)))) → Supplementary methods Table 4, adım 3.
 *   - Yayımlanmış çalışılmış örnek (Table 4: 50 yaş, sigara, SBP 140, TChol 6.3, HDL 1.4) tests/score2.test.ts'de.
 *
 * GÜVENLİK: SCORE2_ONAYLI=true yalnız yukarıdaki doğrulamadan sonra. Sayısal skor yalnız 40–69 yaş + diyabet yok +
 * kural kovası yokken hesaplanır ve "kova taslak" olarak döner; kategori ve LDL hedefi yalnız hekim kilidiyle
 * (dahiliye_kart_kilitleri) kesinleşir — hiçbir koşulda nota otomatik yazılmaz. SCORE2-OP (≥70, engines/score2op.ts — kapı kapalı)
 * ve SCORE2-Diabetes (DM 40–69, engines/score2diabetes.ts — doğrulandı) ayrı modüllerdir, kendi ONAYLI bayraklarıyla.
 */
import type { Dipnot } from './dahiliye'
import { score2Diabetes, SCORE2_DIABETES_ONAYLI, type DmRiskSinif } from './score2diabetes'
import { score2Op as score2OpHesap, SCORE2_OP_BEKLEME_NOTU } from './score2op'

export const SCORE2_ONAYLI = true

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
const BOLGE_AD: Record<Bolge, string> = { low: 'düşük risk bölgesi', moderate: 'orta risk bölgesi', high: 'yüksek risk bölgesi', very_high: 'çok yüksek risk bölgesi' }
const MGDL_MMOL = 38.67 // kolesterol mg/dL → mmol/L

export interface Score2Girdi {
  yas: number; cinsiyet: Cinsiyet; sigara: boolean; sbp: number
  tcholMgdl: number; hdlMgdl: number; bolge?: Bolge
}

/** Kalibrasyonsuz 10 yıllık risk (olasılık) — Suppl. methods Table 4 adım 1–2. 40–69 dışı null. */
export function score2Kalibrasyonsuz(g: Score2Girdi): number | null {
  if (g.yas < 40 || g.yas > 69) return null
  const k = KATSAYI[g.cinsiyet]
  const cage = (g.yas - 60) / 5, csbp = (g.sbp - 120) / 20
  const ctc = g.tcholMgdl / MGDL_MMOL - 6, chdl = (g.hdlMgdl / MGDL_MMOL - 1.3) / 0.5
  const sig = g.sigara ? 1 : 0
  const lp = k.yas * cage + k.sigara * sig + k.sbp * csbp + k.tchol * ctc + k.hdl * chdl
    + k.sigaraYas * sig * cage + k.sbpYas * csbp * cage + k.tcholYas * ctc * cage + k.hdlYas * chdl * cage
  return 1 - Math.pow(k.s0, Math.exp(lp))
}

/** Bölgeye kalibre 10 yıllık risk (olasılık) — Suppl. methods Table 3 ölçekleri + Table 4 adım 3. */
export function score2Olasilik(g: Score2Girdi): number | null {
  const ham = score2Kalibrasyonsuz(g)
  return ham == null ? null : score2Kalibre(ham, g.cinsiyet, g.bolge || 'high')
}
export function score2Kalibre(ham: number, cinsiyet: Cinsiyet, bolge: Bolge): number {
  const [s1, s2] = OLCEK[bolge][cinsiyet]
  return 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - ham))))
}

/** SCORE2 % (bir ondalık) — kvrDegerlendir yalnız SCORE2_ONAYLI ise dışarı çıkarır. */
export function score2Ham(g: Score2Girdi): number | null {
  const p = score2Olasilik(g)
  return p == null ? null : Math.round(p * 1000) / 10
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
  /** SCORE2-Diabetes girdileri: onaylı HbA1c (%) ve diyabet tanı yaşı. */
  hba1cYuzde?: number | null; dmTaniYasi?: number | null
}
export interface KvrSonuc {
  kova: KvrKova | null; kovaNedeni: string; skorGerekli: boolean
  score2: number | null; score2Notu: string
  score2Diabetes: number | null; score2DmSinif: DmRiskSinif | null; score2Op: number | null
  hedefLdl: number | null; hedefNotu: string
  statinAcigi: string[]; dipnotlar: Dipnot[]
}

const KOVA_SIRA: Record<KvrKova, number> = { dusuk_orta: 0, yuksek: 1, cok_yuksek: 2 }
const DM_SINIF_AD: Record<DmRiskSinif, string> = { dusuk: 'düşük', orta: 'orta', yuksek: 'yüksek', cok_yuksek: 'çok yüksek' }

/** Kural kovası (skor gerekmez) → skor (onaylıysa: SCORE2 / SCORE2-Diabetes / SCORE2-OP) → LDL hedef + statin açığı. Hekim kilitler. */
export function kvrDegerlendir(g: KvrGirdi): KvrSonuc {
  const dip: Dipnot[] = [{ ref: 'TEMD_LIPID', not: 'ESC 2021/TEMD: ASKVH, DM+hedef organ hasarı, ağır KBH → çok yüksek risk (skor gerekmez); LDL hedefleri kategoriye göre' }]
  const bolge = g.bolge || 'high'
  let kova: KvrKova | null = null, neden = ''
  const kbhAgir = (g.eGFR != null && g.eGFR < 30) || (g.eGFR != null && g.eGFR < 45 && g.uacr != null && g.uacr > 30)
  const kbhOrta = !kbhAgir && g.eGFR != null && ((g.eGFR < 45) || (g.eGFR < 60 && g.uacr != null && g.uacr > 30))
  if (g.askvh) { kova = 'cok_yuksek'; neden = 'Aterosklerotik KVH öyküsü' }
  else if (g.dm && g.dmTod) { kova = 'cok_yuksek'; neden = 'Diyabet + hedef organ hasarı' }
  else if (kbhAgir) { kova = 'cok_yuksek'; neden = 'Ağır KBH (eGFR <30 veya eGFR <45 + albüminüri)' }
  // SCORE2-Diabetes (ESC 2023): DM 40–69, çok yüksek kural kovası yoksa; eksik girdide TEMD kuralı yedek kalır.
  let score2Notu = ''
  const dmSkor = kova == null && g.dm && g.yas != null && g.yas >= 40 && g.yas <= 69
    ? score2Diabetes({ yas: g.yas, cinsiyet: g.cinsiyet, sigara: !!g.sigara, sbp: g.sbp, tcholMgdl: g.tcholMgdl, hdlMgdl: g.hdlMgdl, hba1cYuzde: g.hba1cYuzde ?? null, eGFR: g.eGFR, taniYasi: g.dmTaniYasi ?? null, bolge })
    : null
  const dmSkorVar = dmSkor?.skor != null
  if (dmSkor && !dmSkorVar) score2Notu = SCORE2_DIABETES_ONAYLI ? `SCORE2-Diabetes için eksik: ${dmSkor.eksik.join(', ')} — şimdilik TEMD kuralı: DM = en az yüksek risk` : 'Diyabet: SCORE2-Diabetes doğrulama bekliyor — şimdilik TEMD kuralı: DM = en az yüksek risk'
  let ikincil: KvrKova | null = null, ikincilNeden = ''
  if (kova == null) {
    if (g.dm && !dmSkorVar && (g.dmSure10Yil || (g.yas != null && g.yas >= 50))) { ikincil = 'yuksek'; ikincilNeden = 'Diyabet ≥10 yıl / ≥50 yaş (hedef organ hasarı yok)' }
    else if (kbhOrta) { ikincil = 'yuksek'; ikincilNeden = 'Orta KBH (KDIGO)' }
    else if (g.sbp != null && g.sbp >= 180) { ikincil = 'yuksek'; ikincilNeden = 'SBP ≥180' }
    else if (g.tcholMgdl != null && g.tcholMgdl / MGDL_MMOL > 8) { ikincil = 'yuksek'; ikincilNeden = 'Total kolesterol >8 mmol/L (~310 mg/dL)' }
  }
  const skorGerekli = kova == null && (ikincil == null || dmSkorVar)
  let score2: number | null = null, score2Op: number | null = null
  if (dmSkorVar) {
    const dmKova: KvrKova = dmSkor!.sinif === 'cok_yuksek' ? 'cok_yuksek' : dmSkor!.sinif === 'yuksek' ? 'yuksek' : 'dusuk_orta'
    const skorNeden = `SCORE2-Diabetes %${dmSkor!.skor} (${BOLGE_AD[bolge]}; ESC 2023 sınıf: ${DM_SINIF_AD[dmSkor!.sinif!]}) — hekim kilitler`
    if (ikincil && KOVA_SIRA[ikincil] > KOVA_SIRA[dmKova]) { kova = ikincil; neden = `${ikincilNeden}; ${skorNeden}` } else { kova = dmKova; neden = skorNeden }
    dip.push({ ref: 'ESC_SCORE2_DIABETES', not: `SCORE2-Diabetes 10 yıllık KVH riski (tip 2 DM, 40–69 yaş; HbA1c, eGFR, tanı yaşı dahil); ${BOLGE_AD[bolge]} kalibrasyonu (Türkiye = yüksek risk bölgesi); ESC 2023 eşikleri <%5 düşük, %5–<10 orta, %10–<20 yüksek, ≥%20 çok yüksek` })
  } else if (kova == null && ikincil) { kova = ikincil; neden = ikincilNeden }
  if (skorGerekli && !dmSkorVar) {
    if (g.yas == null || g.cinsiyet == null || g.sbp == null || g.tcholMgdl == null || g.hdlMgdl == null) score2Notu = score2Notu || 'SCORE2 için yaş, cinsiyet, sigara, SBP, TChol, HDL gerekir'
    else if (g.yas < 40) score2Notu = '<40 yaş: SCORE2 tanımlı değil — yaşam tarzı; risk faktörü yoğunluğu ile klinik karar'
    else if (g.yas > 69) {
      score2Op = score2OpHesap({ yas: g.yas, cinsiyet: g.cinsiyet, sigara: !!g.sigara, dm: g.dm, sbp: g.sbp, tcholMgdl: g.tcholMgdl, hdlMgdl: g.hdlMgdl, bolge })
      if (score2Op == null) score2Notu = SCORE2_OP_BEKLEME_NOTU
      else { kova = score2Kova(g.yas, score2Op); neden = `SCORE2-OP %${score2Op} (${BOLGE_AD[bolge]}) — hekim kilitler`; dip.push({ ref: 'ESC_SCORE2_OP', not: `SCORE2-OP 10 yıllık KVH riski (≥70 yaş); ${BOLGE_AD[bolge]} kalibrasyonu; eşikler %7.5/%15` }) }
    }
    else if (g.dm) score2Notu = score2Notu || 'Diyabet: SCORE2-Diabetes girdileri eksik — şimdilik TEMD kuralı: DM = en az yüksek risk'
    else if (!SCORE2_ONAYLI) score2Notu = 'SCORE2 sayısal hesap katsayı doğrulaması bekliyor (EHJ 2021 suppl. p9) — kategori hekim kararı'
    else { score2 = score2Ham({ yas: g.yas, cinsiyet: g.cinsiyet, sigara: !!g.sigara, sbp: g.sbp, tcholMgdl: g.tcholMgdl, hdlMgdl: g.hdlMgdl, bolge }); if (score2 != null) { kova = score2Kova(g.yas, score2); neden = `SCORE2 %${score2} (${BOLGE_AD[bolge]}) — hekim kilitler`; dip.push({ ref: 'ESC_SCORE2', not: `SCORE2 10 yıllık ölümcül + ölümcül olmayan KVH riski (40–69 yaş, diyabetsiz); ${BOLGE_AD[bolge]} kalibrasyonu (Türkiye = yüksek risk bölgesi); eşikler <50 yaş %2.5/%7.5, 50–69 yaş %5/%10` }) } }
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
  return { kova, kovaNedeni: neden, skorGerekli, score2, score2Notu, score2Diabetes: dmSkor?.skor ?? null, score2DmSinif: dmSkor?.sinif ?? null, score2Op, hedefLdl, hedefNotu, statinAcigi, dipnotlar: dip }
}
