/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — IBD / IBS skor takip. SAF fonksiyon.
 * Skor → şiddet bandı (karar desteği). Tanı yazmaz, doz yazmaz.
 * Kaynak: TGD IBD / IBS klinik kullanım — güncel eşikleri hekim doğrular.
 */
import type { Dipnot } from './gastroenteroloji'
import { ayEkle } from './gastroenteroloji'

export type SkorTur = 'mayo_kismi' | 'hbi' | 'ibs_sss' | 'diger'

export type SkorBant = 'hafif' | 'orta' | 'siddetli' | 'remisyon' | 'bilinmiyor'

export const SKOR_BANT_AD: Record<SkorBant, string> = {
  remisyon: 'Remisyon / düşük aktivite — karar desteği',
  hafif: 'Hafif aktivite — karar desteği',
  orta: 'Orta aktivite — karar desteği',
  siddetli: 'Yüksek aktivite — karar desteği',
  bilinmiyor: 'Aralık yorumlanmadı',
}

export const SKOR_TUR_ETIKET: Record<SkorTur, string> = {
  mayo_kismi: 'Mayo kısmi (ÜK)',
  hbi: 'Harvey-Bradshaw (Crohn)',
  ibs_sss: 'IBS-SSS',
  diger: 'Diğer (hekim etiketi)',
}

export interface SkorSonuc {
  tamamMi: boolean
  tur: SkorTur
  skor: number | null
  bant: SkorBant | null
  bantAd: string
  sonrakiAy: number | null
  ozet: string
  dipnot: Dipnot
}

/** Mayo kısmi 0–9: remisyon ≤2, hafif 3–5, orta 6–7, şiddetli ≥8 — karar desteği. */
export function mayoBanti(skor: number): SkorBant {
  if (skor <= 2) return 'remisyon'
  if (skor <= 5) return 'hafif'
  if (skor <= 7) return 'orta'
  return 'siddetli'
}

/** HBI: remisyon <5, hafif 5–7, orta 8–16, şiddetli >16 — karar desteği. */
export function hbiBanti(skor: number): SkorBant {
  if (skor < 5) return 'remisyon'
  if (skor <= 7) return 'hafif'
  if (skor <= 16) return 'orta'
  return 'siddetli'
}

/** IBS-SSS 0–500: <75 remisyon, 75–174 hafif, 175–299 orta, ≥300 şiddetli — karar desteği. */
export function ibsSssBanti(skor: number): SkorBant {
  if (skor < 75) return 'remisyon'
  if (skor < 175) return 'hafif'
  if (skor < 300) return 'orta'
  return 'siddetli'
}

function sonrakiAyIcin(bant: SkorBant): number {
  if (bant === 'siddetli') return 1
  if (bant === 'orta') return 2
  if (bant === 'hafif') return 3
  return 6
}

export function skorHesapla(tur: SkorTur, skorHam: number | null | undefined): SkorSonuc {
  const dipnot: Dipnot = {
    ref: tur === 'ibs_sss' ? 'TGD_IBS' : 'TGD_IBD',
    not: 'Skor bandı karar desteğidir; tanı ve tedavi hekimindir',
  }
  if (skorHam == null || skorHam === ('' as unknown) || Number.isNaN(Number(skorHam))) {
    return {
      tamamMi: false, tur, skor: null, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'Skor eksik — kısmi skor yorumlanmaz', dipnot,
    }
  }
  const skor = Number(skorHam)
  if (tur === 'mayo_kismi' && (skor < 0 || skor > 9)) {
    return {
      tamamMi: false, tur, skor, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'Mayo kısmi 0–9 aralığında olmalı', dipnot,
    }
  }
  if (tur === 'hbi' && (skor < 0 || skor > 40)) {
    return {
      tamamMi: false, tur, skor, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'HBI makul aralık dışında — hekim doğrular', dipnot,
    }
  }
  if (tur === 'ibs_sss' && (skor < 0 || skor > 500)) {
    return {
      tamamMi: false, tur, skor, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'IBS-SSS 0–500 aralığında olmalı', dipnot,
    }
  }
  if (tur === 'diger') {
    return {
      tamamMi: true, tur, skor, bant: 'bilinmiyor', bantAd: SKOR_BANT_AD.bilinmiyor, sonrakiAy: 3,
      ozet: `Skor ${skor} kaydedildi — izlem aralığı hekim kararı (öneri 3 ay).`, dipnot,
    }
  }
  const bant = tur === 'mayo_kismi' ? mayoBanti(skor) : tur === 'hbi' ? hbiBanti(skor) : ibsSssBanti(skor)
  const sonrakiAy = sonrakiAyIcin(bant)
  return {
    tamamMi: true,
    tur,
    skor,
    bant,
    bantAd: SKOR_BANT_AD[bant],
    sonrakiAy,
    ozet: `${SKOR_TUR_ETIKET[tur]} ${skor} — ${SKOR_BANT_AD[bant]}. Önerilen kontrol ~${sonrakiAy} ay (karar desteği; tanı/doz hekimin).`,
    dipnot,
  }
}

export function sonrakiKontrolTarihi(tarih: string, sonrakiAy: number | null): string | null {
  if (sonrakiAy == null) return null
  return ayEkle(tarih, sonrakiAy)
}
