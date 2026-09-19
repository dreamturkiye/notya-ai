/**
 * PSIK-EXCEPTIONAL-01 — GAD-7 (Yaygın Anksiyete Bozukluğu-7) puanlama motoru. SAF fonksiyon, LLM yok.
 *
 * Kaynak: Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized
 * anxiety disorder: the GAD-7. Arch Intern Med 2006;166(10):1092–7. Ölçek kamuya açıktır; Türkçe
 * biçimi klinik kullanımda yerleşiktir. Madde metinleri Türkiye'de klinikte kullanılan standart
 * ifadelerle yazılmıştır — uzman hekim doğrulaması `specialistReview` listesindedir.
 *
 * ÜRÜN KİLİDİ: toplam ve şiddet bandı KARAR DESTEĞİDİR, "anksiyete bozukluğu" tanısı değildir.
 * Tanı, ilaç ve doz kararı hekimindedir.
 */
import type { Dipnot } from './psikiyatri'

export { PHQ9_SIKLIK as GAD7_SIKLIK } from './phq9'

export const GAD7_YONERGE =
  'Son 2 hafta içinde aşağıdaki sorunlar sizi ne sıklıkta rahatsız etti?'

export const GAD7_MADDELER: readonly string[] = [
  'Gergin, kaygılı veya endişeli hissetme',
  'Endişelenmeyi durduramama veya kontrol edememe',
  'Farklı konularda aşırı endişelenme',
  'Gevşeyip rahatlayamama',
  'Yerinde duramayacak kadar huzursuz olma',
  'Kolayca sinirlenme veya çabuk öfkelenme',
  'Sanki kötü bir şey olacakmış gibi korku duyma',
]

export type Gad7Bant = 'yok' | 'hafif' | 'orta' | 'siddetli'

/** Bant adları ŞİDDET dilidir, tanı dili değildir. */
export const GAD7_BANT_AD: Record<Gad7Bant, string> = {
  yok: 'Minimal / yok düzeyinde belirti',
  hafif: 'Hafif düzeyde belirti',
  orta: 'Orta düzeyde belirti',
  siddetli: 'Şiddetli düzeyde belirti',
}

/** Standart kesim noktaları: 0–4 / 5–9 / 10–14 / 15–21. Tarama eşiği 10. */
export const GAD7_BANT_ARALIK: Array<{ bant: Gad7Bant; alt: number; ust: number }> = [
  { bant: 'yok', alt: 0, ust: 4 },
  { bant: 'hafif', alt: 5, ust: 9 },
  { bant: 'orta', alt: 10, ust: 14 },
  { bant: 'siddetli', alt: 15, ust: 21 },
]

export const GAD7_ENUST = 21
export const GAD7_MADDE_SAYISI = 7
export const GAD7_TARAMA_ESIGI = 10

export interface Gad7Sonuc {
  toplam: number
  bant: Gad7Bant
  bantAd: string
  /** ≥10: ileri değerlendirme eşiği (tanı değil) */
  esikUstu: boolean
  eksikMadde: number
  tamamMi: boolean
  ozet: string
  dipnot: Dipnot
}

function bantBul(toplam: number): Gad7Bant {
  for (const a of GAD7_BANT_ARALIK) if (toplam >= a.alt && toplam <= a.ust) return a.bant
  return 'siddetli'
}

/** maddeler: 7 elemanlı 0–3 dizisi. Eksik/aralık dışı değer 0 sayılmaz, EKSİK sayılır. */
export function skorla(maddeler: Array<number | null | undefined>): Gad7Sonuc {
  let toplam = 0
  let eksik = 0
  for (let i = 0; i < GAD7_MADDE_SAYISI; i++) {
    const v = maddeler[i]
    if (v == null || !Number.isFinite(Number(v))) { eksik++; continue }
    const n = Math.trunc(Number(v))
    if (n < 0 || n > 3) { eksik++; continue }
    toplam += n
  }
  const bant = bantBul(toplam)
  const tamamMi = eksik === 0
  return {
    toplam,
    bant,
    bantAd: GAD7_BANT_AD[bant],
    esikUstu: tamamMi && toplam >= GAD7_TARAMA_ESIGI,
    eksikMadde: eksik,
    tamamMi,
    ozet: tamamMi
      ? `GAD-7 ${toplam}/21 — ${GAD7_BANT_AD[bant]} (karar desteği; tanı hekimin)`
      : `GAD-7 kısmi: ${eksik} madde boş — toplam yorumlanmaz`,
    dipnot: {
      ref: 'GAD7_KAYNAK',
      not: 'Toplam 0–21; kesim 5/10/15. ≥10 ileri değerlendirme eşiğidir, tanı değildir. Şiddet bandı karar desteğidir.',
    },
  }
}

/** İki ölçüm arası değişim; yorum TASLAKTIR. */
export function degisim(onceki: number | null, simdi: number): { fark: number | null; yuzde: number | null; not: string } {
  if (onceki == null || onceki <= 0) return { fark: null, yuzde: null, not: 'Karşılaştırma için önceki GAD-7 yok' }
  const fark = simdi - onceki
  const yuzde = Math.round(((onceki - simdi) / onceki) * 100)
  if (simdi < 5) return { fark, yuzde, not: `Toplam ${simdi} (<5) — minimal belirti aralığı; işlevsellik hekim değerlendirmesi` }
  if (yuzde >= 50) return { fark, yuzde, not: `Önceki ölçüme göre %${yuzde} azalma — yanıt olarak yorumlanabilir (hekim kararı)` }
  if (fark > 0) return { fark, yuzde, not: `Önceki ölçüme göre ${fark} puan artış — plan gözden geçirilir (hekim)` }
  return { fark, yuzde, not: `Önceki ölçüme göre %${yuzde} değişim — kısmi; izlem aralığı hekim kararı` }
}

export function sonrakiOlcumGun(bant: Gad7Bant): number {
  if (bant === 'siddetli') return 14
  if (bant === 'orta') return 28
  return 90
}
