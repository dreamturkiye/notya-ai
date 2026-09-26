/**
 * ACIL-TIP-EXCEPTIONAL-01 — Sevk / yatış paket taslağı. SAF fonksiyon.
 * Madde + hedef. Boarding HIS / yatak panosu YOK. Tanı / doz YOK.
 */
import { dozIceriyorMu, type Dipnot } from './acilTip'

export type SevkHedef = 'yatış' | 'sevk' | 'taburcu_takip' | 'konsultasyon'

export type SevkMadde =
  | 'ozet_not'
  | 'vital_son'
  | 'tetkik_liste'
  | 'ilac_liste_hekim'
  | 'hedef_klinik'
  | 'nakil_guvenlik'
  | 'taburcu_egitim'
  | 'kontrol_randevu'

export const SEVK_HEDEFLER: Array<{ kod: SevkHedef; ad: string }> = [
  { kod: 'yatış', ad: 'Yatış paketi (yatış bekletme HIS yok)' },
  { kod: 'sevk', ad: 'Sevk paketi' },
  { kod: 'taburcu_takip', ad: 'Taburcu + takip paketi' },
  { kod: 'konsultasyon', ad: 'Konsültasyon yönlendirme paketi' },
]

export const SEVK_MADDELER: Array<{ kod: SevkMadde; ad: string }> = [
  { kod: 'ozet_not', ad: 'Klinik özet notu (tanı kilidi yok)' },
  { kod: 'vital_son', ad: 'Son vital değerler kaydı' },
  { kod: 'tetkik_liste', ad: 'Yapılan / bekleyen tetkik listesi' },
  { kod: 'ilac_liste_hekim', ad: 'İlaç listesi (doz hekim yazar; Notya üretmez)' },
  { kod: 'hedef_klinik', ad: 'Hedef klinik / branş belirtildi' },
  { kod: 'nakil_guvenlik', ad: 'Nakil güvenlik kontrol listesi' },
  { kod: 'taburcu_egitim', ad: 'Taburcu uyarı / eğitim verildi' },
  { kod: 'kontrol_randevu', ad: 'Kontrol / acil sonrası randevu belirlendi' },
]

export interface SevkSonuc {
  tamamMi: boolean
  hedef: SevkHedef | null
  maddeler: SevkMadde[]
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string }>
  dipnot: Dipnot
}

export function sevkSkorla(girdi: { hedef?: unknown; maddeler?: unknown; not?: string | null }): SevkSonuc {
  const dipnot: Dipnot = { ref: 'SB_ACIL', not: 'Sevk/yatış paketi taslaktır; yatış bekletme HIS yok, doz hekimin' }
  if (girdi.not && dozIceriyorMu(girdi.not)) {
    return { tamamMi: false, hedef: null, maddeler: [], ozet: 'Sevk notunda mg / ilaç dozu yazılamaz.', gorevOnerileri: [], dipnot }
  }
  const hedefHam = String(girdi.hedef || '')
  const hedefIzin = new Set(SEVK_HEDEFLER.map((h) => h.kod))
  const hedef = hedefIzin.has(hedefHam as SevkHedef) ? (hedefHam as SevkHedef) : null
  if (!hedef) {
    return { tamamMi: false, hedef: null, maddeler: [], ozet: 'Sevk / yatış / taburcu hedefi seçin.', gorevOnerileri: [], dipnot }
  }
  const madIzin = new Set(SEVK_MADDELER.map((m) => m.kod))
  const maddeler = (Array.isArray(girdi.maddeler) ? girdi.maddeler.map(String) : []).filter((k): k is SevkMadde => madIzin.has(k as SevkMadde))
  if (!maddeler.length) {
    return { tamamMi: false, hedef, maddeler, ozet: 'En az bir paket maddesi seçin.', gorevOnerileri: [], dipnot }
  }
  const hedefAd = SEVK_HEDEFLER.find((h) => h.kod === hedef)!.ad
  const madAd = SEVK_MADDELER.filter((m) => maddeler.includes(m.kod)).map((m) => m.ad)
  const gorevOnerileri: Array<{ kod: string; ad: string }> = []
  if (maddeler.includes('kontrol_randevu') || hedef === 'taburcu_takip') {
    gorevOnerileri.push({ kod: 'taburcu_kontrol', ad: 'Acil sonrası kontrol' })
  }
  if (hedef === 'sevk' || hedef === 'yatış') {
    gorevOnerileri.push({ kod: `sevk_${hedef}`, ad: `${hedefAd} takip` })
  }
  return {
    tamamMi: true,
    hedef,
    maddeler,
    ozet: `${hedefAd}: ${madAd.join('; ')}. Yatış bekletme HIS yok; tanı/doz hekimdedir.`,
    gorevOnerileri,
    dipnot,
  }
}
