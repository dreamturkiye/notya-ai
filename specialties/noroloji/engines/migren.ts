/**
 * NOROLOJI-EXCEPTIONAL-01 — Migren engellilik (MIDAS tarzı) skoru. SAF fonksiyon.
 * Son 3 ayda 5 soru → toplam + bant. Bant KARAR DESTEĞİDİR; "migren tanısı" veya doz yazılmaz.
 * Kaynak: MIDAS (Stewart ve ark.); TR klinik kullanım — güncel eşikleri hekim doğrular.
 */
import type { Dipnot } from './noroloji'

export type MigrenBant = 'minimal' | 'hafif' | 'orta' | 'siddetli'

export const MIGREN_BANT_AD: Record<MigrenBant, string> = {
  minimal: 'Minimal engellilik (0–5) — karar desteği',
  hafif: 'Hafif engellilik (6–10) — karar desteği',
  orta: 'Orta engellilik (11–20) — karar desteği',
  siddetli: 'Şiddetli engellilik (21+) — karar desteği',
}

/** MIDAS 5 madde — hasta/hekim doldurur; sayı gün sayısıdır. */
export const MIGREN_MADDELER: readonly string[] = [
  'Son 3 ayda baş ağrısı nedeniyle iş veya okul kaçırılan gün sayısı',
  'Son 3 ayda baş ağrısı varken iş/okul veriminin yarıdan az olduğu gün sayısı',
  'Son 3 ayda baş ağrısı nedeniyle ev işi yapılamayan gün sayısı',
  'Son 3 ayda baş ağrısı varken ev işi veriminin yarıdan az olduğu gün sayısı',
  'Son 3 ayda baş ağrısı nedeniyle aile / sosyal / eğlence kaçırılan gün sayısı',
]

export interface MigrenSonuc {
  tamamMi: boolean
  eksikMadde: number
  toplam: number | null
  bant: MigrenBant | null
  bantAd: string
  ozet: string
  dipnot: Dipnot
}

export function migrenBanti(toplam: number): MigrenBant {
  if (toplam <= 5) return 'minimal'
  if (toplam <= 10) return 'hafif'
  if (toplam <= 20) return 'orta'
  return 'siddetli'
}

/**
 * maddeler: 5 sayı (0–90 makul üst). Eksik madde varsa toplanmaz ve yorumlanmaz.
 */
export function skorla(maddeler: Array<number | null | undefined>): MigrenSonuc {
  const dipnot: Dipnot = { ref: 'MIDAS', not: 'MIDAS bandı karar desteğidir; tanı ve tedavi hekimindir' }
  const sayilar = maddeler.map((x) => (x == null || x === ('' as unknown) || Number.isNaN(Number(x)) ? null : Number(x)))
  const eksik = sayilar.filter((x) => x == null).length
  if (eksik || sayilar.length < 5) {
    return {
      tamamMi: false,
      eksikMadde: eksik || 5 - sayilar.length,
      toplam: null,
      bant: null,
      bantAd: '—',
      ozet: `MIDAS eksik: ${eksik || 5 - sayilar.length} madde boş — kısmi skor yorumlanmaz`,
      dipnot,
    }
  }
  for (const n of sayilar as number[]) {
    if (n < 0 || n > 90) {
      return {
        tamamMi: false,
        eksikMadde: 0,
        toplam: null,
        bant: null,
        bantAd: '—',
        ozet: 'Gün sayıları 0–90 aralığında olmalı',
        dipnot,
      }
    }
  }
  const toplam = (sayilar as number[]).reduce((a, b) => a + b, 0)
  const bant = migrenBanti(toplam)
  return {
    tamamMi: true,
    eksikMadde: 0,
    toplam,
    bant,
    bantAd: MIGREN_BANT_AD[bant],
    ozet: `MIDAS toplam ${toplam} — ${MIGREN_BANT_AD[bant]}. Bant karar desteğidir; tanı ve doz hekimindir.`,
    dipnot,
  }
}

export function sonrakiOlcekGun(bant: MigrenBant | null): number {
  if (bant === 'siddetli' || bant === 'orta') return 90
  return 180
}
