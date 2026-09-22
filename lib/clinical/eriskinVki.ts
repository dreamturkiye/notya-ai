/**
 * Adult BMI (VKİ) — WHO classification for muayene notes / vitals.
 * Pediatric VKİ uses Neyzi percentiles (lib/clinical/buyumeEgrisi); do not use this for <18.
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

export function eriskinVkiHesapla(kiloKg: unknown, boyCm: unknown): EriskinVkiSonuc | null {
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
export function eriskinVkiVitalerden(vitaller: Record<string, unknown> | null | undefined): EriskinVkiSonuc | null {
  if (!vitaller) return null
  return eriskinVkiHesapla(vitaller.kilo, vitaller.boy)
}
