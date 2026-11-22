/**
 * Adult BMI (VKİ) — WHO classification for muayene notes / vitals.
 * Pediatric VKİ uses Neyzi percentiles (lib/clinical/buyumeEgrisi); do not use this for <18.
 *
 * DEMO-1121 bug 2 (2026-11-21): a printed report labelled a 2-month-old "VKİ 15,7 — Zayıf". Adult WHO cut-offs are
 * never applied under 18 years: pass the patient's age in months and this returns null for a child (unknown age keeps
 * the old behaviour — adult branş screens without a birth date). Under 2 years there is no BMI category at all (no
 * weight-for-length table in the code); 2–18 years the category comes only from the age/sex BMI percentile
 * (buyumePersentilleriniHesapla → vki / vkiSinif, pediatric context) — elsewhere no category is shown.
 */
import { cmCoz, kiloCoz } from './olcumCoz'
export type EriskinVkiSinif = 'zayif' | 'normal' | 'fazla_kilolu' | 'obez'

export type EriskinVkiSonuc = {
  deger: number
  sinif: EriskinVkiSinif
  /** UI / print label, e.g. "Normal" or "Obez (sınıf I)" */
  etiket: string
  /** Compact: "24,2 — Normal" */
  ozet: string
}

/** 18 years in months — below it adult BMI categories are never used. */
export const ERISKIN_VKI_ALT_AY = 216

/** Adult WHO BMI category allowed for this age? Unknown age (null) → true (legacy adult behaviour). */
export function eriskinVkiYasUygun(yasAy: number | null | undefined): boolean {
  return yasAy == null || !Number.isFinite(yasAy) || yasAy >= ERISKIN_VKI_ALT_AY
}

function sayi(raw: unknown, tur: 'kilo' | 'cm'): number | null {
  if (raw == null || raw === '') return null
  return tur === 'kilo' ? kiloCoz(raw as string | number) : cmCoz(raw as string | number)
}

export function eriskinVkiSiniflandir(vki: number): Pick<EriskinVkiSonuc, 'sinif' | 'etiket'> {
  if (vki < 18.5) return { sinif: 'zayif', etiket: 'Zayıf' }
  if (vki < 25) return { sinif: 'normal', etiket: 'Normal' }
  if (vki < 30) return { sinif: 'fazla_kilolu', etiket: 'Fazla kilolu' }
  if (vki < 35) return { sinif: 'obez', etiket: 'Obez (sınıf I)' }
  if (vki < 40) return { sinif: 'obez', etiket: 'Obez (sınıf II)' }
  return { sinif: 'obez', etiket: 'Obez (sınıf III)' }
}

export function eriskinVkiHesapla(kiloKg: unknown, boyCm: unknown, yasAy?: number | null): EriskinVkiSonuc | null {
  if (!eriskinVkiYasUygun(yasAy)) return null
  const kilo = sayi(kiloKg, 'kilo')
  const boy = sayi(boyCm, 'cm')
  if (kilo == null || boy == null || boy < 50) return null
  const vki = kilo / Math.pow(boy / 100, 2)
  if (!Number.isFinite(vki) || vki < 10 || vki > 80) return null
  const deger = Math.round(vki * 10) / 10
  const { sinif, etiket } = eriskinVkiSiniflandir(deger)
  const degerTr = deger.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: Number.isInteger(deger) ? 0 : 1 })
  return { deger, sinif, etiket, ozet: `${degerTr} — ${etiket}` }
}

/** From a vitals bag (string or number kilo/boy). */
export function eriskinVkiVitalerden(vitaller: Record<string, unknown> | null | undefined, yasAy?: number | null): EriskinVkiSonuc | null {
  if (!vitaller) return null
  return eriskinVkiHesapla(vitaller.kilo, vitaller.boy, yasAy)
}
