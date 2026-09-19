/**
 * KBB-EXCEPTIONAL-01 — Odyometri saf ses ortalaması (PTA) özeti. SAF fonksiyon, LLM yok.
 *
 * PTA = 0,5 / 1 / 2 / 4 kHz hava yolu eşiklerinin aritmetik ortalaması (dB HL). Şiddet bandı yerleşik
 * odyolojik sınıflamadan gelir ve KARAR DESTEĞİDİR: "işitme kaybı tanısı" değildir, kayıp TİPİNİ
 * (iletim / sensorinöral / mikst) Notya ATAMAZ — hava-kemik aralığı yorumu ve tanı hekimindedir.
 *
 * Motor odyogram çizmez, eşik uydurmaz ve eksik frekansla ortalama yorumlamaz.
 */
import type { Dipnot, Yan } from './kbb'
import { YAN_AD } from './kbb'

/** PTA'ya giren standart frekanslar (kHz) — sıra değişmez. */
export const PTA_FREKANSLARI: readonly number[] = [0.5, 1, 2, 4]

export type OdyoBant = 'normal' | 'hafif' | 'orta' | 'orta_ileri' | 'ileri' | 'cok_ileri'

/** Bant adları ŞİDDET dilidir, tanı dili değildir. */
export const ODYO_BANT_AD: Record<OdyoBant, string> = {
  normal: 'Normal sınırlarda',
  hafif: 'Hafif derecede işitme kaybı düzeyi',
  orta: 'Orta derecede işitme kaybı düzeyi',
  orta_ileri: 'Orta-ileri derecede işitme kaybı düzeyi',
  ileri: 'İleri derecede işitme kaybı düzeyi',
  cok_ileri: 'Çok ileri derecede işitme kaybı düzeyi',
}

/** Yerleşik PTA sınırları (dB HL): ≤25 / 26–40 / 41–55 / 56–70 / 71–90 / >90. */
export const ODYO_BANT_ARALIK: Array<{ bant: OdyoBant; alt: number; ust: number }> = [
  { bant: 'normal', alt: -10, ust: 25 },
  { bant: 'hafif', alt: 26, ust: 40 },
  { bant: 'orta', alt: 41, ust: 55 },
  { bant: 'orta_ileri', alt: 56, ust: 70 },
  { bant: 'ileri', alt: 71, ust: 90 },
  { bant: 'cok_ileri', alt: 91, ust: 130 },
]

export const PTA_ENAZ = -10
export const PTA_ENUST = 130

/** Hekimin seçtiği kayıp tipi — motor ATAMAZ, yalnız etiketi bilir. */
export type KayipTipi = 'normal' | 'iletim' | 'sensorinoral' | 'mikst' | 'belirsiz'
export const KAYIP_TIPI_AD: Record<KayipTipi, string> = {
  normal: 'Normal / kayıp yok (hekim)',
  iletim: 'İletim tipi (hekim)',
  sensorinoral: 'Sensorinöral tip (hekim)',
  mikst: 'Mikst tip (hekim)',
  belirsiz: 'Tip belirlenmedi',
}
export const KAYIP_TIPLERI = Object.keys(KAYIP_TIPI_AD) as KayipTipi[]

export function kayipTipiGecerliMi(x: unknown): x is KayipTipi {
  return typeof x === 'string' && (KAYIP_TIPLERI as string[]).includes(x)
}

export interface OdyoSonuc {
  /** ortalama dB HL — eksik frekans varsa yalnız girilenlerden hesaplanır ve yorumlanmaz */
  pta: number | null
  bant: OdyoBant | null
  bantAd: string
  eksikFrekans: number
  tamamMi: boolean
  /** hekim yüzünde gösterilecek tek satır karar desteği metni */
  ozet: string
  dipnot: Dipnot
}

export function bantBul(pta: number): OdyoBant {
  for (const a of ODYO_BANT_ARALIK) if (pta >= a.alt && pta <= a.ust) return a.bant
  return pta < PTA_ENAZ ? 'normal' : 'cok_ileri'
}

/**
 * esikler: 4 elemanlı dB HL dizisi (0,5 / 1 / 2 / 4 kHz). null / aralık dışı değer EKSİK sayılır
 * (0 dB kabul edilmez); eksik varsa `tamamMi=false` ve ortalama yorumlanmaz.
 */
export function skorla(esikler: Array<number | null | undefined>, yan: Yan = 'sag'): OdyoSonuc {
  let toplam = 0
  let sayi = 0
  let eksik = 0
  for (let i = 0; i < PTA_FREKANSLARI.length; i++) {
    const v = esikler[i]
    if (v == null || !Number.isFinite(Number(v))) { eksik++; continue }
    const n = Number(v)
    if (n < PTA_ENAZ || n > PTA_ENUST) { eksik++; continue }
    toplam += n
    sayi++
  }
  const tamamMi = eksik === 0 && sayi === PTA_FREKANSLARI.length
  const pta = sayi ? Math.round((toplam / sayi) * 10) / 10 : null
  const bant = tamamMi && pta != null ? bantBul(pta) : null
  const ozet = tamamMi && pta != null && bant
    ? `${YAN_AD[yan]} PTA ${pta} dB — ${ODYO_BANT_AD[bant]} (karar desteği; tanı ve kayıp tipi hekimin)`
    : `${YAN_AD[yan]} PTA kısmi: ${eksik} frekans boş — ortalama yorumlanmaz`
  return {
    pta,
    bant,
    bantAd: bant ? ODYO_BANT_AD[bant] : '—',
    eksikFrekans: eksik,
    tamamMi,
    ozet,
    dipnot: {
      ref: 'ODYOLOJI_SINIFLAMA',
      not: 'PTA = 0,5/1/2/4 kHz hava yolu eşiklerinin ortalaması. Bant karar desteğidir; iletim / sensorinöral / mikst ayrımı ve tanı hekimindedir.',
    },
  }
}

/** Doğrudan PTA sayısı girildiğinde (odyometri cihazından okunan ortalama) bant. */
export function ptaBandi(pta: number | null | undefined): { bant: OdyoBant | null; ad: string } {
  if (pta == null || !Number.isFinite(Number(pta))) return { bant: null, ad: '—' }
  const n = Number(pta)
  if (n < PTA_ENAZ || n > PTA_ENUST) return { bant: null, ad: '—' }
  const bant = bantBul(n)
  return { bant, ad: ODYO_BANT_AD[bant] }
}

/**
 * İki ölçüm arası değişim. Test-retest değişkenliği nedeniyle ≥10 dB fark anlamlı kabul edilir;
 * yorum cümlesi TASLAKTIR — "kötüleşme var" kararı hekimin.
 */
export function degisim(onceki: number | null, simdi: number | null): { fark: number | null; not: string } {
  if (onceki == null || simdi == null) return { fark: null, not: 'Karşılaştırma için önceki odyometri yok' }
  const fark = Math.round((simdi - onceki) * 10) / 10
  if (Math.abs(fark) < 10) return { fark, not: `Önceki ölçüme göre ${fark > 0 ? '+' : ''}${fark} dB — test-retest aralığında, değişim olarak yorumlanmaz` }
  if (fark >= 10) return { fark, not: `Önceki ölçüme göre ${fark} dB artış — eşik yükselmesi; neden ve plan hekim değerlendirmesi` }
  return { fark, not: `Önceki ölçüme göre ${Math.abs(fark)} dB düşüş — eşiklerde iyileşme; hekim doğrular` }
}

/**
 * Tekrar ölçüm aralığı önerisi (gün). Ağır bantlarda daha sık; hekim susturabilir.
 * Klinik karar değil, takvim taslağıdır.
 */
export function sonrakiOlcumGun(bant: OdyoBant | null): number {
  if (!bant) return 180
  if (bant === 'ileri' || bant === 'cok_ileri') return 90
  if (bant === 'orta' || bant === 'orta_ileri') return 180
  return 365
}

/** Asimetri uyarısı — iki kulak PTA farkı ≥15 dB ise tek taraflı değerlendirme gündeme gelir (hekim kararı). */
export const ASIMETRI_ESIGI_DB = 15

export function asimetriNotu(sagPta: number | null, solPta: number | null): string | null {
  if (sagPta == null || solPta == null) return null
  const fark = Math.abs(Math.round((sagPta - solPta) * 10) / 10)
  if (fark < ASIMETRI_ESIGI_DB) return null
  return `İki kulak arasında ${fark} dB fark — tek taraflı / asimetrik kayıp olarak ayrıca değerlendirilir (ileri tetkik kararı hekimin).`
}
