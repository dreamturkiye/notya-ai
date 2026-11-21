/**
 * BUYUME-GRAFIK-V2 (2026-11-20) — birth measurements as the first point of the growth curves (pediatri only).
 *
 * Bug found on Elif's live chart: the birth weight / length / head circumference recorded for the child (the doctor's
 * bebek kartı from the birth flow, or the hasta bilgi formu "Doğum ve Gelişim" answers) were never plotted — the growth
 * route read only approved notes' vitals, so a baby seen once showed no point at "Doğum".
 *
 * Source order per value: bebek kartı (the doctor's record) → intake form. A value is used only when it is plausible
 * for a newborn (a mistyped "3,2" gram or a current head circumference typed into the form must not become a birth
 * point). Pure — no I/O.
 */
import { cmCoz, kiloCoz } from '@/lib/clinical/olcumCoz'

export type DogumParametre = 'kilo' | 'boy' | 'basCevresi'
export type DogumKaynak = 'bebek_karti' | 'intake'
export type DogumOlcumleri = Partial<Record<DogumParametre, { deger: number; kaynak: DogumKaynak }>>

/** Newborn-plausible ranges (kg / cm) — wide enough for very preterm and macrosomic babies. */
export const DOGUM_ARALIK: Record<DogumParametre, [number, number]> = {
  kilo: [0.4, 6],
  boy: [28, 58],
  // Upper bound below a 3-month-old's head: a current head circumference typed into the intake form is not a birth value.
  basCevresi: [20, 39],
}

export interface BebekKartiDogum {
  kilo_gram?: number | string | null
  boy_cm?: number | string | null
  bas_cevresi_cm?: number | string | null
}

function makul(p: DogumParametre, v: number | null): number | null {
  if (v == null || !Number.isFinite(v)) return null
  const [alt, ust] = DOGUM_ARALIK[p]
  return v >= alt && v <= ust ? Math.round(v * 100) / 100 : null
}

function kartSayi(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * kart: bebek_kartlari row (kilo_gram in grams). intake: decrypted hasta_intake_formlari answers
 * (dogumKilosuPed "3200" / "3,2 kg", dogumBoyuPed, basCevresiPed — the head circumference question sits in the
 * form's "Doğum ve Gelişim" section).
 */
export function dogumOlcumleri(kart: BebekKartiDogum | null | undefined, intake: Record<string, unknown> | null | undefined): DogumOlcumleri {
  const out: DogumOlcumleri = {}
  const kg = kartSayi(kart?.kilo_gram)
  const kartDeger: Record<DogumParametre, number | null> = {
    kilo: makul('kilo', kg == null ? null : kg > 50 ? kg / 1000 : kg),
    boy: makul('boy', kartSayi(kart?.boy_cm)),
    basCevresi: makul('basCevresi', kartSayi(kart?.bas_cevresi_cm)),
  }
  const y = intake || {}
  const metin = (...anahtarlar: string[]) => {
    for (const a of anahtarlar) { const v = y[a]; if (v != null && String(v).trim()) return String(v) }
    return null
  }
  const intakeDeger: Record<DogumParametre, number | null> = {
    kilo: makul('kilo', kiloCoz(metin('dogumKilosuPed', 'dogumKilosu', 'dogumAgirligi'))),
    boy: makul('boy', cmCoz(metin('dogumBoyuPed', 'dogumBoyu'))),
    basCevresi: makul('basCevresi', cmCoz(metin('basCevresiPed', 'dogumBasCevresi'))),
  }
  for (const p of ['kilo', 'boy', 'basCevresi'] as DogumParametre[]) {
    if (kartDeger[p] != null) out[p] = { deger: kartDeger[p]!, kaynak: 'bebek_karti' }
    else if (intakeDeger[p] != null) out[p] = { deger: intakeDeger[p]!, kaynak: 'intake' }
  }
  return out
}

/** A note measured within the first week is the birth value already; the record value is then not added again. */
export const DOGUM_NOT_ESIGI_AY = 0.25
