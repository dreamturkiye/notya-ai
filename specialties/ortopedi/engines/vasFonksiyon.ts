/**
 * ORTOPEDI-EXCEPTIONAL-01 — VAS + mini fonksiyon özeti. SAF fonksiyon, LLM yok.
 *
 * VAS 0–10 + 4 fonksiyon maddesi 0–4 → toplam 0–16. Bantlar KARAR DESTEĞİDİR;
 * "artroz" / "kaynama yok" tanısı değildir. Motor tanı dili üretmez.
 */
import type { Dipnot } from './ortopedi'

export const FONKSIYON_MADDELER: readonly { id: string; ad: string }[] = [
  { id: 'yurume', ad: 'Yürüme / adım atma' },
  { id: 'merdiven', ad: 'Merdiven inip çıkma' },
  { id: 'gunluk', ad: 'Günlük işler (giyinme, banyo)' },
  { id: 'uyku', ad: 'Ağrı nedeniyle uyku' },
]

export type VasBant = 'hafif' | 'orta' | 'siddetli'

/** Bant adları ŞİDDET dilidir, tanı dili değildir. */
export const VAS_BANT_AD: Record<VasBant, string> = {
  hafif: 'Hafif düzeyde ağrı / fonksiyon kısıtı',
  orta: 'Orta düzeyde ağrı / fonksiyon kısıtı',
  siddetli: 'Şiddetli düzeyde ağrı / fonksiyon kısıtı',
}

export const VAS_ENAZ = 0
export const VAS_ENUST = 10
export const FONK_MADDE_ENAZ = 0
export const FONK_MADDE_ENUST = 4

export interface VasSonuc {
  vas: number | null
  fonksiyonToplam: number | null
  bant: VasBant | null
  bantAd: string
  eksikMadde: number
  tamamMi: boolean
  ozet: string
  dipnot: Dipnot
}

/** VAS ağırlıklı birleşik skor: VAS×0.8 + fonksiyon toplamı → 0–18.4; bant eşikleri pratik. */
export function bantBul(vas: number, fonksiyonToplam: number): VasBant {
  const birlesik = vas * 0.8 + fonksiyonToplam
  if (birlesik <= 6) return 'hafif'
  if (birlesik <= 12) return 'orta'
  return 'siddetli'
}

/**
 * vas: 0–10. maddeler: 4 elemanlı 0–4 dizisi. null / aralık dışı EKSİK sayılır.
 */
export function skorla(
  vas: number | null | undefined,
  maddeler: Array<number | null | undefined>,
): VasSonuc {
  let vasDeger: number | null = null
  if (vas != null && Number.isFinite(Number(vas))) {
    const v = Number(vas)
    if (Number.isInteger(v) && v >= VAS_ENAZ && v <= VAS_ENUST) vasDeger = v
  }

  let toplam = 0
  let sayi = 0
  let eksik = 0
  for (let i = 0; i < FONKSIYON_MADDELER.length; i++) {
    const x = maddeler[i]
    if (x == null || !Number.isFinite(Number(x))) { eksik++; continue }
    const n = Number(x)
    if (n < FONK_MADDE_ENAZ || n > FONK_MADDE_ENUST || !Number.isInteger(n)) { eksik++; continue }
    toplam += n
    sayi++
  }
  const fonksiyonTamam = eksik === 0 && sayi === FONKSIYON_MADDELER.length
  const tamamMi = vasDeger != null && fonksiyonTamam
  const fonksiyonToplam = fonksiyonTamam ? toplam : null
  const bant = tamamMi && vasDeger != null && fonksiyonToplam != null
    ? bantBul(vasDeger, fonksiyonToplam)
    : null
  const ozet = tamamMi && vasDeger != null && fonksiyonToplam != null && bant
    ? `VAS ${vasDeger}/10 · fonksiyon ${fonksiyonToplam}/16 — ${VAS_BANT_AD[bant]} (şiddet karar desteği; tanı hekimin).`
    : `VAS/fonksiyon kısmi: ${vasDeger == null ? 'VAS boş · ' : ''}${eksik} fonksiyon maddesi boş — bant yorumlanmaz`
  return {
    vas: tamamMi ? vasDeger : null,
    fonksiyonToplam,
    bant,
    bantAd: bant ? VAS_BANT_AD[bant] : '—',
    eksikMadde: eksik + (vasDeger == null ? 1 : 0),
    tamamMi,
    ozet,
    dipnot: {
      ref: 'VAS',
      not: 'VAS 0–10 + 4×0–4 fonksiyon. Bant şiddet karar desteğidir; artroz veya başka tanı değildir.',
    },
  }
}

export function sonrakiVasGun(bant: VasBant | null): number {
  if (!bant) return 42
  if (bant === 'siddetli') return 14
  if (bant === 'orta') return 28
  return 56
}
