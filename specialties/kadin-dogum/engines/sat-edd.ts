/**
 * SAT / EDD / current GA. Cite Naegele (role) and Robinson 1975 CRL dating (public formula).
 * Williams Obstetrik 26 is obstetrik_ders_kitabi for locking policy — not copied.
 */
import type { KadinDogumPayload } from '../schema'
import { addDays, daysToGa, diffDays, type GaWeeksDays } from './dates'

/** Naegele: SAT + 280 days. */
export function naegeleEdd(satIso: string): string {
  return addDays(satIso, 280)
}

/**
 * Robinson (1975) CRL→GA in days: 8.052 × √CRL(mm) + 23.73.
 * Returns {weeks, days} rounded to the nearest day.
 */
export function crlToGa(crlMm: number): GaWeeksDays {
  if (!(crlMm > 0) || crlMm > 90) {
    throw new Error('CRL dating requires a first-trimester CRL (mm)')
  }
  const totalDays = Math.round(8.052 * Math.sqrt(crlMm) + 23.73)
  return daysToGa(totalDays)
}

/** Revised EDD from a CRL measured on `usgDate`: EDD = usgDate + (280 − GA_days). */
export function crlToEdd(crlMm: number, usgDateIso: string): string {
  const ga = crlToGa(crlMm)
  return addDays(usgDateIso, 280 - ga.totalDays)
}

export type DatingInput = {
  sat: string | null
  edd_naegele: string | null
  edd_crl: string | null
  ga_locked: 'sat' | 'crl'
  crl_mm?: number
  crl_usg_date?: string
}

export type DatingResult =
  | { ok: true; weeks: number; days: number; totalDays: number; method: 'sat' | 'crl'; edd: string }
  | { ok: false; reason: 'sat_unknown_require_usg' | 'crl_dating_incomplete' }

/**
 * Current GA from the locked method. If SAT is unknown, USG (CRL) dating is required.
 */
export function currentGa(input: DatingInput, todayIso: string): DatingResult {
  if (input.ga_locked === 'sat') {
    if (!input.sat) return { ok: false, reason: 'sat_unknown_require_usg' }
    const edd = input.edd_naegele ?? naegeleEdd(input.sat)
    const totalDays = diffDays(todayIso, input.sat)
    const { weeks, days } = daysToGa(totalDays)
    return { ok: true, weeks, days, totalDays, method: 'sat', edd }
  }

  if (input.edd_crl) {
    const lmpEquiv = addDays(input.edd_crl, -280)
    const totalDays = diffDays(todayIso, lmpEquiv)
    const { weeks, days } = daysToGa(totalDays)
    return { ok: true, weeks, days, totalDays, method: 'crl', edd: input.edd_crl }
  }

  if (input.crl_mm != null && input.crl_usg_date) {
    const edd = crlToEdd(input.crl_mm, input.crl_usg_date)
    const lmpEquiv = addDays(edd, -280)
    const totalDays = diffDays(todayIso, lmpEquiv)
    const { weeks, days } = daysToGa(totalDays)
    return { ok: true, weeks, days, totalDays, method: 'crl', edd }
  }

  if (!input.sat) return { ok: false, reason: 'sat_unknown_require_usg' }
  return { ok: false, reason: 'crl_dating_incomplete' }
}

export function datingFromPayload(payload: KadinDogumPayload, todayIso: string): DatingResult {
  return currentGa({
    sat: payload.sat,
    edd_naegele: payload.edd_naegele,
    edd_crl: payload.edd_crl,
    ga_locked: payload.ga_locked,
  }, todayIso)
}
