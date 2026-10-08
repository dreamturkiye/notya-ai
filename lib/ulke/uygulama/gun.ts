/**
 * NOTYA-UZ-MUAYENE-01 — "today" in the country's own time zone (the pack's `saatDilimi`), as instants.
 * A deployment's server clock is UTC; a visit at 02:00 in Tashkent belongs to that Tashkent day.
 */
import { ulkePaketi } from '../ulke'

/** YYYY-MM-DD of `an` in the country's time zone. */
export function ulkeGunu(an: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ulkePaketi().saatDilimi, year: 'numeric', month: '2-digit', day: '2-digit' }).format(an)
}

/** The instant the country's current day began. */
export function ulkeGunBasi(an: Date = new Date()): Date {
  const dilim = ulkePaketi().saatDilimi
  const ad = new Intl.DateTimeFormat('en-US', { timeZone: dilim, timeZoneName: 'longOffset' }).formatToParts(an).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  const fark = /GMT([+-]\d{2}:\d{2})/.exec(ad)?.[1] ?? '+00:00'
  return new Date(`${ulkeGunu(an)}T00:00:00${fark}`)
}
