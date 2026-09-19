/**
 * UROLOJI-EXCEPTIONAL-01 — IPSS-7 özeti. SAF fonksiyon, LLM yok.
 *
 * 7 madde 0–5 → toplam 0–35. Bantlar yerleşik şiddet sınıflamasından gelir ve KARAR DESTEĞİDİR:
 * "BPH tanısı" değildir. QoL (0–6) ayrı tutulur. Motor tanı dili üretmez.
 */
import type { Dipnot } from './uroloji'

export const IPSS_MADDELER: readonly { id: string; ad: string }[] = [
  { id: 'bosalma', ad: 'Tam boşalamama hissi' },
  { id: 'sik_idrar', ad: 'Sık idrara çıkma (2 saatten kısa aralık)' },
  { id: 'kesik', ad: 'Kesik kesik idrar' },
  { id: 'acil', ad: 'Tutamama / ani sıkışma' },
  { id: 'zayif', ad: 'Zayıf idrar akışı' },
  { id: 'zorlanma', ad: 'İdrar yaparken zorlanma / ıkınma' },
  { id: 'nokturi', ad: 'Gece idrara kalkma (noktüri)' },
]

export type IpssBant = 'hafif' | 'orta' | 'siddetli'

/** Bant adları ŞİDDET dilidir, tanı dili değildir — "BPH" yoktur. */
export const IPSS_BANT_AD: Record<IpssBant, string> = {
  hafif: 'Hafif düzeyde alt üriner yol semptom şiddeti',
  orta: 'Orta düzeyde alt üriner yol semptom şiddeti',
  siddetli: 'Şiddetli düzeyde alt üriner yol semptom şiddeti',
}

/** Toplam 0–35: 0–7 hafif · 8–19 orta · 20–35 şiddetli. */
export const IPSS_BANT_ARALIK: Array<{ bant: IpssBant; alt: number; ust: number }> = [
  { bant: 'hafif', alt: 0, ust: 7 },
  { bant: 'orta', alt: 8, ust: 19 },
  { bant: 'siddetli', alt: 20, ust: 35 },
]

export const IPSS_MADDE_ENAZ = 0
export const IPSS_MADDE_ENUST = 5
export const QOL_ENAZ = 0
export const QOL_ENUST = 6

export interface IpssSonuc {
  toplam: number | null
  bant: IpssBant | null
  bantAd: string
  qol: number | null
  eksikMadde: number
  tamamMi: boolean
  ozet: string
  dipnot: Dipnot
}

export function bantBul(toplam: number): IpssBant {
  for (const a of IPSS_BANT_ARALIK) if (toplam >= a.alt && toplam <= a.ust) return a.bant
  return toplam < 0 ? 'hafif' : 'siddetli'
}

/**
 * maddeler: 7 elemanlı 0–5 dizisi. null / aralık dışı EKSİK sayılır.
 * qol: 0–6 ayrı; toplam skora GİRMEZ.
 */
export function skorla(
  maddeler: Array<number | null | undefined>,
  qol: number | null | undefined = null,
): IpssSonuc {
  let toplam = 0
  let sayi = 0
  let eksik = 0
  for (let i = 0; i < IPSS_MADDELER.length; i++) {
    const v = maddeler[i]
    if (v == null || !Number.isFinite(Number(v))) { eksik++; continue }
    const n = Number(v)
    if (n < IPSS_MADDE_ENAZ || n > IPSS_MADDE_ENUST || !Number.isInteger(n)) { eksik++; continue }
    toplam += n
    sayi++
  }
  const tamamMi = eksik === 0 && sayi === IPSS_MADDELER.length
  const skor = tamamMi ? toplam : null
  const bant = skor != null ? bantBul(skor) : null
  let qolDeger: number | null = null
  if (qol != null && Number.isFinite(Number(qol))) {
    const q = Number(qol)
    if (Number.isInteger(q) && q >= QOL_ENAZ && q <= QOL_ENUST) qolDeger = q
  }
  const qolMetin = qolDeger != null ? ` Yaşam kalitesi (ayrı): ${qolDeger}/6.` : ''
  const ozet = tamamMi && skor != null && bant
    ? `IPSS toplam ${skor}/35 — ${IPSS_BANT_AD[bant]} (şiddet karar desteği; tanı hekimin).${qolMetin}`
    : `IPSS kısmi: ${eksik} madde boş — toplam yorumlanmaz`
  return {
    toplam: skor,
    bant,
    bantAd: bant ? IPSS_BANT_AD[bant] : '—',
    qol: qolDeger,
    eksikMadde: eksik,
    tamamMi,
    ozet,
    dipnot: {
      ref: 'IPSS',
      not: 'IPSS-7 toplamı 0–35; bantlar 0–7 / 8–19 / 20–35. Şiddet karar desteğidir; BPH veya başka tanı değildir.',
    },
  }
}

export function sonrakiIpssGun(bant: IpssBant | null): number {
  if (!bant) return 180
  if (bant === 'siddetli') return 90
  if (bant === 'orta') return 180
  return 365
}
