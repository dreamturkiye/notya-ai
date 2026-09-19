/**
 * GOGUS-EXCEPTIONAL-01 — CAT (COPD Assessment Test) + mMRC + GOLD ABE grubu. SAF fonksiyon, LLM yok.
 *
 * Kilitler: skor ve grup KARAR DESTEĞİDİR; "KOAH tanısı" veya "astım tanısı" yazılmaz.
 * Doz / basamak üretmez. GOLD evre (1–4) yalnız FEV1% hekim elle girdiyse hesaplanır.
 * Kaynak: GOLD (mMRC/CAT eşikleri); TTD klinik kullanım.
 */
import type { Dipnot } from './gogus'

/** CAT 8 madde — her biri 0–5. */
export const CAT_MADDELER: readonly string[] = [
  'Öksürük',
  'Balgam',
  'Göğüste baskı / sıkışma',
  'Eforla nefes darlığı',
  'Ev içi aktivite kısıtı',
  'Evden dışarı çıkma güveni',
  'Uyku',
  'Enerji',
]

export type MmrcSeviye = 0 | 1 | 2 | 3 | 4

export const MMRC_AD: Record<MmrcSeviye, string> = {
  0: '0 — Yoğun efor dışında nefes darlığı yok',
  1: '1 — Hızlı yürüyüş veya hafif yokuşta nefes darlığı',
  2: '2 — Düz zeminde yaşıtlarından yavaş yürür / durup dinlenir',
  3: '3 — ~100 m veya birkaç dakika yürüyüşte durur',
  4: '4 — Evden çıkamaz veya giyinirken nefes darlığı',
}

export type GoldGrup = 'A' | 'B' | 'E'

export interface CatMmrcGirdi {
  /** CAT madde puanları (0–5); eksik madde varsa toplam yorumlanmaz */
  catMaddeler?: Array<number | null | undefined>
  /** Elle girilmiş CAT toplamı (0–40) — maddeler yoksa */
  catToplam?: number | null
  mmrc?: number | null
  ortaAlevlenme12Ay?: number
  yatisliAlevlenme12Ay?: number
  /** Bronkodilatör sonrası FEV1 % beklenen — hekim girer; cihaz entegrasyonu YOK */
  fev1Yuzde?: number | null
}

export interface CatMmrcSonuc {
  cat: number | null
  catTamam: boolean
  mmrc: MmrcSeviye | null
  grup: GoldGrup | null
  goldEvre: 1 | 2 | 3 | 4 | null
  ozet: string
  uyarilar: string[]
  dipnotlar: Dipnot[]
}

export function catTopla(maddeler: Array<number | null | undefined>): { toplam: number | null; tamam: boolean; eksik: number } {
  let eksik = 0
  let t = 0
  for (const m of maddeler) {
    if (m == null || !Number.isFinite(m) || m < 0 || m > 5) { eksik++; continue }
    t += Math.round(m)
  }
  if (eksik || maddeler.length !== 8) return { toplam: null, tamam: false, eksik: eksik || Math.abs(8 - maddeler.length) }
  return { toplam: t, tamam: true, eksik: 0 }
}

export function mmrcGecerliMi(x: unknown): x is MmrcSeviye {
  return x === 0 || x === 1 || x === 2 || x === 3 || x === 4
}

export function goldGrupHesapla(g: {
  mmrc: number | null
  cat: number | null
  ortaAlevlenme12Ay: number
  yatisliAlevlenme12Ay: number
}): GoldGrup | null {
  if (g.ortaAlevlenme12Ay >= 2 || g.yatisliAlevlenme12Ay >= 1) return 'E'
  const semptom = (g.mmrc != null && g.mmrc >= 2) || (g.cat != null && g.cat >= 10)
  if (semptom) return 'B'
  if (g.mmrc != null || g.cat != null) return 'A'
  return null
}

export function goldEvreHesapla(fev1Yuzde: number | null | undefined): 1 | 2 | 3 | 4 | null {
  if (fev1Yuzde == null || !Number.isFinite(fev1Yuzde)) return null
  if (fev1Yuzde >= 80) return 1
  if (fev1Yuzde >= 50) return 2
  if (fev1Yuzde >= 30) return 3
  return 4
}

export function catMmrcDegerlendir(g: CatMmrcGirdi): CatMmrcSonuc {
  const dip: Dipnot[] = [
    { ref: 'GOLD', not: 'mMRC ≥2 veya CAT ≥10 semptomlu (B); ≥2 orta alevlenme veya ≥1 yatışlı alevlenme → E grubu' },
    { ref: 'TTD', not: 'CAT ve mMRC karar desteğidir; tanı ve tedavi basamağı hekimdedir' },
  ]
  const uyarilar: string[] = []
  let cat: number | null = null
  let catTamam = false

  if (g.catMaddeler && g.catMaddeler.length) {
    const c = catTopla(g.catMaddeler)
    cat = c.toplam
    catTamam = c.tamam
    if (!c.tamam) uyarilar.push(`${c.eksik} CAT maddesi eksik — toplam yorumlanmaz (Notya madde uydurmaz)`)
  } else if (g.catToplam != null && Number.isFinite(g.catToplam)) {
    const t = Math.round(g.catToplam)
    if (t < 0 || t > 40) uyarilar.push('CAT toplamı 0–40 aralığında olmalı')
    else { cat = t; catTamam = true }
  }

  const mmrc = mmrcGecerliMi(g.mmrc) ? g.mmrc : null
  if (g.mmrc != null && !mmrcGecerliMi(g.mmrc)) uyarilar.push('mMRC 0–4 aralığında olmalı')

  const orta = Math.max(0, Math.round(g.ortaAlevlenme12Ay ?? 0))
  const yatis = Math.max(0, Math.round(g.yatisliAlevlenme12Ay ?? 0))
  const grup = goldGrupHesapla({ mmrc, cat, ortaAlevlenme12Ay: orta, yatisliAlevlenme12Ay: yatis })
  const goldEvre = goldEvreHesapla(g.fev1Yuzde ?? null)

  const parcalar: string[] = []
  if (cat != null && catTamam) parcalar.push(`CAT ${cat}/40`)
  if (mmrc != null) parcalar.push(`mMRC ${mmrc}`)
  if (grup) parcalar.push(`GOLD grubu ${grup} (karar desteği)`)
  if (goldEvre) parcalar.push(`GOLD evre ${goldEvre} (FEV1% hekim girişi; tanı değil)`)
  const ozet = parcalar.length
    ? `${parcalar.join(' · ')}. Tanı ve tedavi kararı hekimindir.`
    : 'CAT / mMRC girilmedi — semptom skoru hesaplanmadı.'

  return { cat, catTamam, mmrc, grup, goldEvre, ozet, uyarilar, dipnotlar: dip }
}
