/**
 * ROMATOLOJI-EXCEPTIONAL-01 — DAS28 / BASDAI. SAF fonksiyon.
 * Bant karar desteğidir; tanı (RA/AS) yazılmaz, ilaç dozu yazılmaz.
 * Kaynak: EULAR/ACR pratik yorumu + TRD — güncel eşikleri hekim doğrular.
 */
import type { Dipnot } from './romatoloji'

export type SkorTur = 'das28_crp' | 'das28_esr' | 'basdai'

export type AktiviteBant = 'remisyon' | 'dusuk' | 'orta' | 'yuksek' | 'bilinmiyor'

export const AKTIVITE_BANT_AD: Record<AktiviteBant, string> = {
  remisyon: 'Remisyon bandı — karar desteği',
  dusuk: 'Düşük aktivite — karar desteği',
  orta: 'Orta aktivite — karar desteği',
  yuksek: 'Yüksek aktivite — karar desteği',
  bilinmiyor: 'Aralık yorumlanmadı',
}

export interface SkorSonuc {
  tamamMi: boolean
  tur: SkorTur
  toplam: number | null
  bant: AktiviteBant | null
  bantAd: string
  ozet: string
  dipnot: Dipnot
}

/** DAS28-CRP (Prevoo / EULAR pratik formül). TJC/SJC 0–28; CRP mg/L; PGA 0–100. */
export function das28Crp(tjc: number, sjc: number, crp: number, pga: number): number {
  return 0.56 * Math.sqrt(tjc) + 0.28 * Math.sqrt(sjc) + 0.36 * Math.log(crp + 1) + 0.014 * pga + 0.96
}

/** DAS28-ESR klasik. ESR mm/saat; PGA 0–100. */
export function das28Esr(tjc: number, sjc: number, esr: number, pga: number): number {
  return 0.56 * Math.sqrt(tjc) + 0.28 * Math.sqrt(sjc) + 0.70 * Math.log(Math.max(esr, 1)) + 0.014 * pga
}

export function das28Banti(skor: number): AktiviteBant {
  if (skor < 2.6) return 'remisyon'
  if (skor < 3.2) return 'dusuk'
  if (skor <= 5.1) return 'orta'
  return 'yuksek'
}

/** BASDAI: 6 madde 0–10. Formül (Q1+Q2+Q3+Q4+(Q5+Q6)/2)/5. */
export function basdaiToplam(maddeler: number[]): number | null {
  if (maddeler.length !== 6) return null
  if (maddeler.some((m) => m < 0 || m > 10 || Number.isNaN(m))) return null
  const [q1, q2, q3, q4, q5, q6] = maddeler
  return (q1 + q2 + q3 + q4 + (q5 + q6) / 2) / 5
}

export function basdaiBanti(skor: number): AktiviteBant {
  if (skor < 4) return 'dusuk'
  if (skor < 6) return 'orta'
  return 'yuksek'
}

export interface Das28Girdi {
  tjc: number | null | undefined
  sjc: number | null | undefined
  crp?: number | null | undefined
  esr?: number | null | undefined
  pga: number | null | undefined
  varyant: 'crp' | 'esr'
}

export function das28Skorla(g: Das28Girdi): SkorSonuc {
  const tur: SkorTur = g.varyant === 'esr' ? 'das28_esr' : 'das28_crp'
  const dipnot: Dipnot = { ref: 'EULAR_ACR', not: 'DAS28 bandı karar desteğidir; tanı ve tedavi hekimindir' }
  const { tjc, sjc, pga } = g
  if (tjc == null || sjc == null || pga == null || Number.isNaN(Number(tjc)) || Number.isNaN(Number(sjc)) || Number.isNaN(Number(pga))) {
    return { tamamMi: false, tur, toplam: null, bant: null, bantAd: '—', ozet: 'TJC / SJC / PGA eksik — kısmi skor yorumlanmaz', dipnot }
  }
  const t = Number(tjc), s = Number(sjc), p = Number(pga)
  if (t < 0 || t > 28 || s < 0 || s > 28 || p < 0 || p > 100) {
    return { tamamMi: false, tur, toplam: null, bant: null, bantAd: '—', ozet: 'TJC/SJC 0–28, PGA 0–100 aralığında olmalı', dipnot }
  }
  let toplam: number
  if (g.varyant === 'esr') {
    if (g.esr == null || Number.isNaN(Number(g.esr)) || Number(g.esr) < 1) {
      return { tamamMi: false, tur, toplam: null, bant: null, bantAd: '—', ozet: 'ESR eksik veya geçersiz', dipnot }
    }
    toplam = das28Esr(t, s, Number(g.esr), p)
  } else {
    if (g.crp == null || Number.isNaN(Number(g.crp)) || Number(g.crp) < 0) {
      return { tamamMi: false, tur, toplam: null, bant: null, bantAd: '—', ozet: 'CRP eksik veya geçersiz', dipnot }
    }
    toplam = das28Crp(t, s, Number(g.crp), p)
  }
  const yuvarla = Math.round(toplam * 100) / 100
  const bant = das28Banti(yuvarla)
  return {
    tamamMi: true,
    tur,
    toplam: yuvarla,
    bant,
    bantAd: AKTIVITE_BANT_AD[bant],
    ozet: `DAS28-${g.varyant.toUpperCase()} ${yuvarla} — ${AKTIVITE_BANT_AD[bant]}. Tanı yazılmaz; plan hekimindir.`,
    dipnot,
  }
}

export function basdaiSkorla(maddeler: Array<number | null | undefined>): SkorSonuc {
  const tur: SkorTur = 'basdai'
  const dipnot: Dipnot = { ref: 'TRD', not: 'BASDAI bandı karar desteğidir; spondiloartrit tanısı hekimindir' }
  if (maddeler.length !== 6 || maddeler.some((m) => m == null || Number.isNaN(Number(m)))) {
    return { tamamMi: false, tur, toplam: null, bant: null, bantAd: '—', ozet: '6 madde eksiksiz doldurulmalı — kısmi BASDAI yorumlanmaz', dipnot }
  }
  const sayilar = maddeler.map(Number)
  const toplam = basdaiToplam(sayilar)
  if (toplam == null) {
    return { tamamMi: false, tur, toplam: null, bant: null, bantAd: '—', ozet: 'Her madde 0–10 aralığında olmalı', dipnot }
  }
  const yuvarla = Math.round(toplam * 100) / 100
  const bant = basdaiBanti(yuvarla)
  return {
    tamamMi: true,
    tur,
    toplam: yuvarla,
    bant,
    bantAd: AKTIVITE_BANT_AD[bant],
    ozet: `BASDAI ${yuvarla} — ${AKTIVITE_BANT_AD[bant]}. Tanı yazılmaz; plan hekimindir.`,
    dipnot,
  }
}

export const BASDAI_MADDELER = [
  'Yorgunluk',
  'Boyun / sırt / kalça ağrısı',
  'Diğer eklemlerde ağrı / şişlik',
  'Hassas bölgelerde rahatsızlık',
  'Sabah tutukluğu şiddeti',
  'Sabah tutukluğu süresi (0=yok, 10=≥2 saat)',
] as const
