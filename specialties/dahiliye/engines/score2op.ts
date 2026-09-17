/**
 * DAH-SCORE2-OP — SCORE2-OP (ESC 2021, ehab312): ≥70 yaş 10 yıllık ölümcül + ölümcül olmayan KVH riski.
 *
 * KAYNAK (2026-09-17): SCORE2-OP working group & ESC Cardiovascular risk collaboration, Eur Heart J 2021;42(25):2455–2467,
 * doi:10.1093/eurheartj/ehab312 — "Supplementary material_20210604_v2.docx" (ehab312_supplementary_data.zip; PMC8248997 kopyası
 * ile OUP silverchair kopyası bayt bayt aynı).
 *   - KATSAYI (erkek/kadın, yaş/diyabet/sigara/SBP/TChol/HDL + yaş etkileşimleri) → Supplementary Methods Table 3 (ana makale
 *     Table 2 ile aynı; SBP ana makalede "per 10 mmHg" 0.094/0.102 = burada mmHg başına 0.0094/0.0102).
 *   - Merkezleme yaş 73, SBP 150, TChol 6, HDL 1.4; s0 0.7576 / 0.8082; ortalama LP 0.0929 / 0.2290 → Suppl. Methods Table 2–3.
 *   - Bölge ölçekleri (scale1, scale2) → Supplementary Methods Table 1.
 *
 * NEDEN SCORE2_OP_ONAYLI=false (doğrulama kapısı geçmedi — tahmin yok):
 *   Yayımlanmış çalışılmış örnek (Suppl. Methods Table 3: 75 yaş, sigara, SBP 140, TChol 5.5, HDL 1.3) adım 1–2'yi birebir
 *   doğrular (LP kadın 0.5029 / erkek 0.3298; kalibrasyonsuz 0.2442 / 0.2966) — tests/score2op.test.ts. Ancak adım 3'te örnek
 *   "düşük risk bölgesi" için −0.85/0.82 (kadın) ve −0.61/0.89 (erkek) ölçeklerini kullanır; aynı belgenin Table 1'i düşük bölge
 *   için −0.52/1.01 ve −0.34/1.19 verir. Ana makalenin bölgeler arası örneği (75 yaş sigara içen, SBP 150, non-HDL 4.5: erkek
 *   %16→%37, kadın %14→%44) iki ölçek setiyle de yeniden üretilemedi. Türkiye'nin kullanacağı YÜKSEK risk bölgesi ölçeklerini
 *   (Table 1: 0.08/1.15 erkek, 0.38/1.09 kadın) doğrulayan yayımlanmış bir sayı bulunamadı → sayısal SCORE2-OP dışarı çıkmaz.
 *   ESC 2021 kılavuz ek materyali (ehab484) otomatik indirilemedi (Cloudflare). Ledger: DAH-SCORE2-OP OPEN.
 */
import type { Cinsiyet, Bolge } from './score2'

export const SCORE2_OP_ONAYLI = false

const KATSAYI: Record<Cinsiyet, { yas: number; dm: number; sigara: number; sbp: number; tchol: number; hdl: number; dmYas: number; sigaraYas: number; sbpYas: number; tcholYas: number; hdlYas: number; s0: number; ortLp: number }> = {
  erkek: { yas: 0.0634, dm: 0.4245, sigara: 0.3524, sbp: 0.0094, tchol: 0.0850, hdl: -0.3564, dmYas: -0.0174, sigaraYas: -0.0247, sbpYas: -0.0005, tcholYas: 0.0073, hdlYas: 0.0091, s0: 0.7576, ortLp: 0.0929 },
  kadin: { yas: 0.0789, dm: 0.6010, sigara: 0.4921, sbp: 0.0102, tchol: 0.0605, hdl: -0.3040, dmYas: -0.0107, sigaraYas: -0.0255, sbpYas: -0.0004, tcholYas: -0.0009, hdlYas: 0.0154, s0: 0.8082, ortLp: 0.2290 },
}
/** Suppl. Methods Table 1 — yüksek risk bölgesi ölçekleri yayımlanmış örnekle doğrulanamadı (yukarıya bakın). */
const OLCEK: Record<Bolge, Record<Cinsiyet, [number, number]>> = {
  low: { erkek: [-0.34, 1.19], kadin: [-0.52, 1.01] },
  moderate: { erkek: [0.01, 1.25], kadin: [-0.1, 1.1] },
  high: { erkek: [0.08, 1.15], kadin: [0.38, 1.09] },
  very_high: { erkek: [0.05, 0.7], kadin: [0.38, 0.69] },
}
const MGDL_MMOL = 38.67

export interface Score2OpGirdi { yas: number; cinsiyet: Cinsiyet; sigara: boolean; dm: boolean; sbp: number; tcholMgdl: number; hdlMgdl: number; bolge?: Bolge }

/** Suppl. Methods Table 2 adım 1 — doğrusal öngörücü. */
export function score2OpLp(g: Score2OpGirdi): number {
  const k = KATSAYI[g.cinsiyet]
  const a = g.yas - 73, s = g.sbp - 150, t = g.tcholMgdl / MGDL_MMOL - 6, h = g.hdlMgdl / MGDL_MMOL - 1.4
  const dm = g.dm ? 1 : 0, sig = g.sigara ? 1 : 0
  return k.yas * a + k.dm * dm + k.sigara * sig + k.sbp * s + k.tchol * t + k.hdl * h
    + k.dmYas * a * dm + k.sigaraYas * a * sig + k.sbpYas * a * s + k.tcholYas * a * t + k.hdlYas * a * h
}
/** Adım 2 — kalibrasyonsuz 10 yıllık risk. <70 yaş null. */
export function score2OpKalibrasyonsuz(g: Score2OpGirdi): number | null {
  if (g.yas < 70) return null
  const k = KATSAYI[g.cinsiyet]
  return 1 - Math.pow(k.s0, Math.exp(score2OpLp(g) - k.ortLp))
}
/** Adım 3 formülü — ölçekler parametre (yayımlanmış örneğin kendi ölçekleriyle test edilir). */
export function score2OpKalibreFormul(ham: number, s1: number, s2: number): number {
  return 1 - Math.exp(-Math.exp(s1 + s2 * Math.log(-Math.log(1 - ham))))
}
export function score2OpOlasilik(g: Score2OpGirdi): number | null {
  const ham = score2OpKalibrasyonsuz(g)
  if (ham == null) return null
  const [s1, s2] = OLCEK[g.bolge || 'high'][g.cinsiyet]
  return score2OpKalibreFormul(ham, s1, s2)
}
/** SCORE2-OP % (bir ondalık) — YALNIZ SCORE2_OP_ONAYLI ise; aksi halde null (uydurma sayı yok). */
export function score2Op(g: Score2OpGirdi): number | null {
  if (!SCORE2_OP_ONAYLI) return null
  const p = score2OpOlasilik(g)
  return p == null ? null : Math.round(p * 1000) / 10
}
export const SCORE2_OP_BEKLEME_NOTU = '≥70 yaş: SCORE2-OP yolu — yayımlanmış ek materyalde bölge ölçekleri çelişkili (Suppl. Table 1 ≠ çalışılmış örnek), Türkiye yüksek risk bölgesi kalibrasyonu doğrulanamadı; sayısal skor gösterilmez, kategori hekim kararı (kırılganlık, yaşam beklentisi, tercihler)'
