/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — FTR seans planı taslağı. SAF fonksiyon.
 * Modalite + seans sayısı / haftalık sıklık. İlaç adı ve doz YOK.
 * SGK seans üst sınırları hekim tarafından doğrulanır (SUT değişir).
 */
import type { Dipnot } from './fizik-tedavi'

export const FTR_MODALITELER: readonly string[] = [
  'Sıcak paket / yüzeyel ısı',
  'Soğuk uygulama',
  'TENS / elektroterapi',
  'Ultrason (terapötik)',
  'Kısa dalga / diyatermi',
  'Tedavi edici egzersiz',
  'Manuel terapi / mobilizasyon',
  'Traksiyon',
  'Hidroterapi / havuz',
  'Ortez / yardımcı cihaz eğitimi',
]

export interface SeansGirdi {
  bolge: string
  modaliteler: string[]
  seansSayisi: number | null
  haftalikSiklik: number | null
  not?: string | null
}

export interface SeansSonuc {
  tamamMi: boolean
  ozet: string
  uyari: string[]
  dipnot: Dipnot
}

export function seansPlani(g: SeansGirdi): SeansSonuc {
  const dipnot: Dipnot = { ref: 'SGK_SUT', not: 'Seans sayısı ve endikasyon SUT koşullarına bağlıdır; güncel metni hekim doğrular' }
  const uyari: string[] = []
  const bolge = String(g.bolge || '').trim()
  const modal = (g.modaliteler || []).map(String).filter(Boolean)
  if (!bolge) {
    return { tamamMi: false, ozet: 'Bölge boş — seans planı yazılmaz', uyari, dipnot }
  }
  if (!modal.length) {
    return { tamamMi: false, ozet: 'En az bir modalite seçin', uyari, dipnot }
  }
  const sayi = g.seansSayisi == null || Number.isNaN(Number(g.seansSayisi)) ? null : Number(g.seansSayisi)
  const siklik = g.haftalikSiklik == null || Number.isNaN(Number(g.haftalikSiklik)) ? null : Number(g.haftalikSiklik)
  if (sayi == null || sayi < 1 || sayi > 60) {
    return { tamamMi: false, ozet: 'Seans sayısı 1–60 aralığında olmalı', uyari, dipnot }
  }
  if (siklik == null || siklik < 1 || siklik > 7) {
    return { tamamMi: false, ozet: 'Haftalık sıklık 1–7 aralığında olmalı', uyari, dipnot }
  }
  if (sayi > 30) uyari.push('Yüksek seans sayısı — SGK/SUT endikasyon ve rapor koşullarını hekim doğrulasın')
  const not = g.not ? String(g.not).slice(0, 500) : ''
  const ozet = [
    `FTR seans planı (taslak): ${bolge}`,
    `Modalite: ${modal.join(', ')}`,
    `Toplam ${sayi} seans · haftada ${siklik} gün`,
    not ? `Hekim notu: ${not}` : null,
    'İlaç / doz yazılmaz. Seans ve rapor kararı hekimindir.',
  ].filter(Boolean).join(' · ')
  return { tamamMi: true, ozet, uyari, dipnot }
}
