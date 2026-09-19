/**
 * NEFROLOJI-EXCEPTIONAL-01 — Anemi-CKD izlem. SAF fonksiyon.
 * Hb (± ferritin) → izlem aralığı (karar desteği). ESA / eritropoietin dozu YAZILMAZ.
 */
import type { Dipnot } from './nefroloji'
import { ayEkle } from './nefroloji'

export type AnemiBant = 'hedef_yakin' | 'dikkat' | 'dusuk' | 'bilinmiyor'

export const ANEMI_BANT_AD: Record<AnemiBant, string> = {
  hedef_yakin: 'Hedefe yakın — karar desteği',
  dikkat: 'Dikkat aralığı — karar desteği',
  dusuk: 'Düşük uç — karar desteği',
  bilinmiyor: 'Aralık yorumlanmadı',
}

export interface AnemiSonuc {
  tamamMi: boolean
  hb: number | null
  bant: AnemiBant | null
  bantAd: string
  sonrakiAy: number | null
  ozet: string
  dipnot: Dipnot
}

/** Hb g/dL — KBH anemi için kaba bant; tanı ve ESA dozu yazılmaz. */
export function hbBanti(hb: number): AnemiBant {
  if (hb >= 11 && hb <= 13) return 'hedef_yakin'
  if (hb >= 10 && hb < 11) return 'dikkat'
  if (hb < 10) return 'dusuk'
  return 'dikkat'
}

function sonrakiAyIcin(bant: AnemiBant): number {
  if (bant === 'dusuk') return 1
  if (bant === 'dikkat') return 2
  return 3
}

export function anemiSkorla(hbHam: number | null | undefined, ferritinHam?: number | null): AnemiSonuc {
  const dipnot: Dipnot = { ref: 'TND_KBH', not: 'Anemi-CKD bandı karar desteğidir; ESA dozu hekimindir' }
  if (hbHam == null || Number.isNaN(Number(hbHam))) {
    return {
      tamamMi: false, hb: null, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'Hb eksik — anemi izlemi yorumlanmaz', dipnot,
    }
  }
  const hb = Number(hbHam)
  if (hb < 3 || hb > 22) {
    return {
      tamamMi: false, hb, bant: null, bantAd: '—', sonrakiAy: null,
      ozet: 'Hb g/dL makul aralık dışında — hekim doğrular', dipnot,
    }
  }
  const bant = hbBanti(hb)
  const sonrakiAy = sonrakiAyIcin(bant)
  const fer = ferritinHam == null || Number.isNaN(Number(ferritinHam)) ? null : Number(ferritinHam)
  const ferNot = fer != null ? ` · Ferritin ${fer} kaydedildi (yorum hekimde)` : ''
  return {
    tamamMi: true,
    hb,
    bant,
    bantAd: ANEMI_BANT_AD[bant],
    sonrakiAy,
    ozet: `Hb ${hb} g/dL — ${ANEMI_BANT_AD[bant]}. Önerilen izlem ~${sonrakiAy} ay.${ferNot} ESA dozu Notya yazılmaz.`,
    dipnot,
  }
}

export function anemiSonrakiTarih(tarih: string, sonrakiAy: number | null): string | null {
  if (sonrakiAy == null) return null
  return ayEkle(tarih, sonrakiAy)
}

export const ANEMI_KONTROL_LISTESI: readonly string[] = [
  'Hb ve demir paneli (ferritin / TSAT) hekim değerlendirmesinde',
  'Kanama / hemoliz / demir eksikliği ayrımı hekimde',
  'ESA başlama / doz / hedef Hb hekim reçetesinde — Notya doz üretmez',
  'Demir IV / oral seçimi hekimde',
  'Kontrol Hb tarihi hasta ile paylaşıldı',
]
