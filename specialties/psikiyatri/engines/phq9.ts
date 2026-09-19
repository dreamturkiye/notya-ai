/**
 * PSIK-EXCEPTIONAL-01 — PHQ-9 (Hasta Sağlık Anketi-9) puanlama motoru. SAF fonksiyon, LLM yok.
 *
 * Kaynak: Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: validity of a brief depression severity
 * measure. J Gen Intern Med 2001;16(9):606–13. Ölçek kamuya açıktır ("no permission required to
 * reproduce, translate, display or distribute"); Türkçe biçimi klinik kullanımda yerleşiktir.
 * Madde metinleri Türkiye'de klinikte kullanılan standart ifadelerle yazılmıştır — uzman hekim
 * doğrulaması `specialistReview` listesindedir (lib/specialties/psikiyatri.ts).
 *
 * ÜRÜN KİLİDİ: toplam puan ve şiddet bandı KARAR DESTEĞİDİR. "Depresyon" tanısı DEĞİLDİR; tanı,
 * ilaç ve doz kararı hekimdedir (DSM-5-TR değerlendirmesi hekimin). 9. madde (ölüm/kendine zarar
 * düşüncesi) pozitif ise skor ne olursa olsun güvenlik değerlendirmesi açılır.
 */
import type { Dipnot } from './psikiyatri'

/** Son 2 hafta sıklık seçenekleri — 0–3 (PHQ-9 standart yanıt seti). */
export const PHQ9_SIKLIK: Array<{ deger: 0 | 1 | 2 | 3; etiket: string }> = [
  { deger: 0, etiket: 'Hiç' },
  { deger: 1, etiket: 'Birkaç gün' },
  { deger: 2, etiket: 'Günlerin yarısından fazlasında' },
  { deger: 3, etiket: 'Neredeyse her gün' },
]

export const PHQ9_YONERGE =
  'Son 2 hafta içinde aşağıdaki sorunlar sizi ne sıklıkta rahatsız etti?'

/** 9 madde, standart sırada. Sıra değiştirilemez: 9. madde güvenlik maddesidir. */
export const PHQ9_MADDELER: readonly string[] = [
  'Yaptığınız işlere karşı ilgi veya zevk duymama',
  'Kendinizi üzgün, çökkün veya umutsuz hissetme',
  'Uykuya dalmakta veya uykuyu sürdürmekte güçlük ya da çok fazla uyuma',
  'Kendinizi yorgun hissetme veya enerjinizin azalması',
  'İştahsızlık veya aşırı yeme',
  'Kendiniz hakkında kötü hissetme; kendinizi başarısız görme ya da kendinizi veya ailenizi hayal kırıklığına uğrattığınızı düşünme',
  'Gazete okumak veya televizyon izlemek gibi işlere dikkatinizi vermekte güçlük',
  'Fark edilecek kadar yavaş hareket etme veya konuşma ya da tam tersine huzursuz olma, yerinizde duramama',
  'Ölseniz daha iyi olacağı ya da kendinize bir şekilde zarar vermeyi düşünme',
]

/** 10. soru (işlevsellik) toplam puana GİRMEZ; ayrı kaydedilir. */
export const PHQ9_ISLEVSELLIK_SORUSU =
  'Bu sorunlar işinizi yapmanızı, evdeki işlerinizi veya insanlarla geçinmenizi ne kadar güçleştirdi?'
export const PHQ9_ISLEVSELLIK_SECENEKLERI: readonly string[] = [
  'Hiç güçleştirmedi', 'Biraz güçleştirdi', 'Çok güçleştirdi', 'Aşırı güçleştirdi',
]

export type Phq9Bant = 'yok' | 'hafif' | 'orta' | 'orta_siddetli' | 'siddetli'

/** Bant adları ŞİDDET dilidir, tanı dili değildir ("… depresyon" yazmaz). */
export const PHQ9_BANT_AD: Record<Phq9Bant, string> = {
  yok: 'Minimal / yok düzeyinde belirti',
  hafif: 'Hafif düzeyde belirti',
  orta: 'Orta düzeyde belirti',
  orta_siddetli: 'Orta-şiddetli düzeyde belirti',
  siddetli: 'Şiddetli düzeyde belirti',
}

/** Standart kesim noktaları: 0–4 / 5–9 / 10–14 / 15–19 / 20–27. */
export const PHQ9_BANT_ARALIK: Array<{ bant: Phq9Bant; alt: number; ust: number }> = [
  { bant: 'yok', alt: 0, ust: 4 },
  { bant: 'hafif', alt: 5, ust: 9 },
  { bant: 'orta', alt: 10, ust: 14 },
  { bant: 'orta_siddetli', alt: 15, ust: 19 },
  { bant: 'siddetli', alt: 20, ust: 27 },
]

export const PHQ9_ENUST = 27
export const PHQ9_MADDE_SAYISI = 9

export interface Phq9Sonuc {
  toplam: number
  bant: Phq9Bant
  bantAd: string
  /** 9. madde (ölüm / kendine zarar düşüncesi) ≥1 → güvenlik değerlendirmesi zorunlu */
  ozkıyımMadde9: boolean
  /** eksik madde sayısı — 0 değilse toplam KISMİ sayılır ve yorumlanmaz */
  eksikMadde: number
  tamamMi: boolean
  /** hekim yüzünde gösterilecek tek satır karar desteği metni */
  ozet: string
  dipnot: Dipnot
}

function bantBul(toplam: number): Phq9Bant {
  for (const a of PHQ9_BANT_ARALIK) if (toplam >= a.alt && toplam <= a.ust) return a.bant
  return 'siddetli'
}

/**
 * maddeler: 9 elemanlı 0–3 dizisi. null / undefined / aralık dışı değer EKSİK sayılır (0 kabul edilmez);
 * toplam yalnız girilen maddelerden hesaplanır ve `tamamMi=false` olur.
 */
export function skorla(maddeler: Array<number | null | undefined>): Phq9Sonuc {
  let toplam = 0
  let eksik = 0
  for (let i = 0; i < PHQ9_MADDE_SAYISI; i++) {
    const v = maddeler[i]
    if (v == null || !Number.isFinite(Number(v))) { eksik++; continue }
    const n = Math.trunc(Number(v))
    if (n < 0 || n > 3) { eksik++; continue }
    toplam += n
  }
  const madde9 = maddeler[8]
  const ozkıyımMadde9 = madde9 != null && Number.isFinite(Number(madde9)) && Math.trunc(Number(madde9)) >= 1
  const bant = bantBul(toplam)
  const tamamMi = eksik === 0
  const ozet = tamamMi
    ? `PHQ-9 ${toplam}/27 — ${PHQ9_BANT_AD[bant]} (karar desteği; tanı hekimin)`
    : `PHQ-9 kısmi: ${eksik} madde boş — toplam yorumlanmaz`
  return {
    toplam,
    bant,
    bantAd: PHQ9_BANT_AD[bant],
    ozkıyımMadde9,
    eksikMadde: eksik,
    tamamMi,
    ozet,
    dipnot: {
      ref: 'PHQ9_KAYNAK',
      not: 'Toplam 0–27; kesim 5/10/15/20. Şiddet bandı karar desteğidir, DSM-5-TR tanısı değildir. 9. madde pozitifse güvenlik değerlendirmesi yapılır.',
    },
  }
}

/**
 * İki ölçüm arası değişim. Klinik anlamlı yanıt eşiği literatürde ≥%50 azalma; remisyon <5.
 * Yorum cümlesi TASLAKTIR — "tedaviye yanıt var" kararı hekimin.
 */
export function degisim(onceki: number | null, simdi: number): { fark: number | null; yuzde: number | null; not: string } {
  if (onceki == null || onceki <= 0) return { fark: null, yuzde: null, not: 'Karşılaştırma için önceki PHQ-9 yok' }
  const fark = simdi - onceki
  const yuzde = Math.round(((onceki - simdi) / onceki) * 100)
  if (simdi < 5) return { fark, yuzde, not: `Toplam ${simdi} (<5) — minimal belirti aralığı; süreklilik ve işlevsellik hekim değerlendirmesi` }
  if (yuzde >= 50) return { fark, yuzde, not: `Önceki ölçüme göre %${yuzde} azalma — yanıt olarak yorumlanabilir (hekim kararı)` }
  if (fark > 0) return { fark, yuzde, not: `Önceki ölçüme göre ${fark} puan artış — plan gözden geçirilir (hekim)` }
  return { fark, yuzde, not: `Önceki ölçüme göre %${yuzde} değişim — kısmi; izlem aralığı hekim kararı` }
}

/** Tekrar ölçüm aralığı önerisi (ay) — akut evrede 2–4 hafta, stabilde 3 ay. Hekim susturabilir. */
export function sonrakiOlcumGun(bant: Phq9Bant): number {
  if (bant === 'siddetli' || bant === 'orta_siddetli') return 14
  if (bant === 'orta') return 28
  return 90
}
