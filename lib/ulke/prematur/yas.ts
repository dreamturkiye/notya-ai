/**
 * PREMATUR-ULKE-01 — CORRECTED AGE, the arithmetic only. Pure, client-safe, country-neutral: the rule (from which week of
 * gestation a baby is corrected, until which month) is NUMBERS THE PACK STATES (`DuzeltmeKurali`, with its source) — the
 * kit holds none. No sentence is written here: the screen composes the words from the pack (lib/ulke/prematur/ekran.ts).
 *
 * Definition: corrected age = chronological age − (40 weeks − gestational age at birth). The corrected birth date is the
 * expected term date. Postmenstrual age = gestation at birth + chronological age.
 *   Definition: Engle WA, AAP Committee on Fetus and Newborn. Age terminology during the perinatal period.
 *   Pediatrics 2004;114(5):1362-1364.
 *
 * It diagnoses nothing and plots no centile: it counts days. VACCINES USE CHRONOLOGICAL AGE; this file is never read by them.
 */
import { gecerliGun, gunEkle, gunFarki, tamAy } from './tarih'

/** Term gestation (40 weeks = 280 days). */
export const TERM_GUN = 280

/** From which week a baby is corrected, and until which chronological month, for growth and for development. */
export interface DuzeltmeKurali {
  /** Babies born BEFORE this week are corrected. */
  baslangicHafta: number
  /** Growth: corrected while the chronological calendar month is below this. */
  buyumeUstAy: number
  /** Development: the same. */
  gelisimUstAy: number
  /** The source of the rule, as a citation. */
  kaynak: string
}

/** Valid gestation at birth, in days: 20+0 to 45+0 weeks. */
export const GEST_GUN_MIN = 20 * 7
export const GEST_GUN_MAX = 45 * 7

/** Whole weeks (or decimal weeks: 32.57, 32+4 as 32.571…) → whole days. Invalid → null. */
export function gestasyonGunu(haftaOndalik: number | null | undefined): number | null {
  if (haftaOndalik == null || !Number.isFinite(haftaOndalik)) return null
  const g = Math.round(haftaOndalik * 7)
  return g >= GEST_GUN_MIN && g <= GEST_GUN_MAX ? g : null
}

/** Weeks and days → whole days of gestation. Out of range → null. */
export function gestasyonGunuHaftaGun(hafta: number | null | undefined, gun: number | null | undefined): number | null {
  if (hafta == null || !Number.isInteger(hafta) || hafta < 0) return null
  const d = gun == null ? 0 : gun
  if (!Number.isInteger(d) || d < 0 || d > 6) return null
  const toplam = hafta * 7 + d
  return toplam >= GEST_GUN_MIN && toplam <= GEST_GUN_MAX ? toplam : null
}

/** "32+4". '—' (an em dash) is the one sign for "not known"; the screen may replace it with the pack's. */
export const gestasyonMetni = (gestGun: number | null): string => (gestGun == null ? '—' : `${Math.floor(gestGun / 7)}+${gestGun % 7}`)

export interface YasGirdisi { dogumIso: string; /** Days of gestation at birth; null = not known: no correction can be made. */ gestasyonGun: number | null; tarihIso: string }
export interface YasKullanimi {
  /** The age (days) to use for this purpose: the corrected age where it applies (negative before term), the chronological one otherwise. */
  gun: number
  duzeltilmis: boolean
  /** Corrected age below 0: the baby has not reached term yet — a term reference (WHO) does not apply. */
  termOncesi: boolean
}
export type YasDurumKodu = 'ok' | 'gestasyon-yok' | 'gestasyon-gecersiz' | 'tarih-gecersiz'
export interface DuzeltilmisYas {
  gecerli: boolean
  durumKodu: YasDurumKodu
  kronolojikGun: number
  kronolojikAy: number
  prematur: boolean
  /** Days missing to term (280 − gestation); 0 for term and post-term. */
  erkenGun: number
  /** Expected term date (the corrected birth date). null when the baby is not preterm. */
  terimTarihiIso: string | null
  /** Postmenstrual age in days = gestation + chronological. */
  postmenstrualGun: number | null
  duzeltilmisGun: number
  buyume: YasKullanimi
  gelisim: YasKullanimi
}

/**
 * Corrected age. A baby born at or after the rule's start week is NEVER corrected. The upper limit is the chronological
 * CALENDAR month (tamAy): correction ends on the day the baby completes the rule's month.
 */
export function duzeltilmisYas(g: YasGirdisi, kural: DuzeltmeKurali): DuzeltilmisYas {
  const bos = (kod: YasDurumKodu, kron = 0): DuzeltilmisYas => ({
    gecerli: false, durumKodu: kod, kronolojikGun: kron, kronolojikAy: 0, prematur: false, erkenGun: 0, terimTarihiIso: null,
    postmenstrualGun: null, duzeltilmisGun: kron,
    buyume: { gun: kron, duzeltilmis: false, termOncesi: false }, gelisim: { gun: kron, duzeltilmis: false, termOncesi: false },
  })
  if (!gecerliGun(g.dogumIso.slice(0, 10)) || !gecerliGun(g.tarihIso.slice(0, 10))) return bos('tarih-gecersiz')
  const kron = gunFarki(g.dogumIso, g.tarihIso)
  if (kron < 0) return bos('tarih-gecersiz')
  const kronAy = tamAy(g.dogumIso, g.tarihIso)
  if (g.gestasyonGun == null) return { ...bos('gestasyon-yok', kron), kronolojikAy: kronAy }
  if (!Number.isInteger(g.gestasyonGun) || g.gestasyonGun < GEST_GUN_MIN || g.gestasyonGun > GEST_GUN_MAX) return { ...bos('gestasyon-gecersiz', kron), kronolojikAy: kronAy }

  const prematur = g.gestasyonGun < kural.baslangicHafta * 7
  const erken = prematur ? TERM_GUN - g.gestasyonGun : 0
  const duz = kron - erken
  const kullanim = (ustAy: number): YasKullanimi => {
    const uygula = prematur && kronAy < ustAy
    return uygula ? { gun: duz, duzeltilmis: true, termOncesi: duz < 0 } : { gun: kron, duzeltilmis: false, termOncesi: false }
  }
  return {
    gecerli: true, durumKodu: 'ok', kronolojikGun: kron, kronolojikAy: kronAy, prematur, erkenGun: erken,
    terimTarihiIso: prematur ? gunEkle(g.dogumIso, erken) : null,
    postmenstrualGun: g.gestasyonGun + kron, duzeltilmisGun: duz,
    buyume: kullanim(kural.buyumeUstAy), gelisim: kullanim(kural.gelisimUstAy),
  }
}

/** Decimal months (≥ 0) for a growth curve — the corrected age where it applies; null before term (no reference). */
export function buyumeAyi(y: DuzeltilmisYas): number | null {
  if (!y.gecerli) return y.kronolojikGun >= 0 ? y.kronolojikGun / 30.4375 : null
  if (y.buyume.termOncesi) return null
  return y.buyume.gun / 30.4375
}

/** Postmenstrual age as "36+2" (weeks+days). */
export const postmenstrualMetni = (y: DuzeltilmisYas): string => (y.postmenstrualGun == null ? '—' : `${Math.floor(y.postmenstrualGun / 7)}+${y.postmenstrualGun % 7}`)

/**
 * HOW A CORRECTED AGE IS SAID, as a shape — the screen writes the sentence from the pack's words:
 *   none      not preterm, or not corrected                      before-term  days to term, as weeks and days
 *   days      under 31 days                                      months       completed months from the term date
 *   years     24 months and over: years and months
 */
export type YasBicimi =
  | { tur: 'yok' }
  | { tur: 'term-oncesi'; hafta: number; gun: number }
  | { tur: 'gun'; gun: number }
  | { tur: 'ay'; ay: number }
  | { tur: 'yil'; yil: number; ay: number }

export function duzeltilmisYasBicimi(y: DuzeltilmisYas, tarihIso: string): YasBicimi {
  if (!y.gecerli || !y.prematur || !y.terimTarihiIso) return { tur: 'yok' }
  if (y.duzeltilmisGun < 0) { const e = -y.duzeltilmisGun; return { tur: 'term-oncesi', hafta: Math.floor(e / 7), gun: e % 7 } }
  const gun = y.duzeltilmisGun
  if (gun < 31) return { tur: 'gun', gun }
  const ay = tamAy(y.terimTarihiIso, tarihIso)
  if (ay < 24) return { tur: 'ay', ay }
  return { tur: 'yil', yil: Math.floor(ay / 12), ay: ay % 12 }
}

