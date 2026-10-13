/**
 * NOTYA-UZ-MUAYENE-01 — "today" in a time zone of the country, as instants: the ACCOUNT's zone where the caller
 * passes it (lib/ulke/uygulama/saatDilimi.ts), the pack's default (`saatDilimi`) otherwise.
 * A deployment's server clock is UTC; a visit at 02:00 in Tashkent belongs to that Tashkent day.
 */
import { ulkePaketi } from '../ulke'

/** YYYY-MM-DD of `an` in the country's time zone. */
export function ulkeGunu(an: Date = new Date(), dilim: string = ulkePaketi().saatDilimi): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: dilim, year: 'numeric', month: '2-digit', day: '2-digit' }).format(an)
}

/** The instant the country's current day began. */
export function ulkeGunBasi(an: Date = new Date(), dilim: string = ulkePaketi().saatDilimi): Date {
  const ad = new Intl.DateTimeFormat('en-US', { timeZone: dilim, timeZoneName: 'longOffset' }).formatToParts(an).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  const fark = /GMT([+-]\d{2}:\d{2})/.exec(ad)?.[1] ?? '+00:00'
  return new Date(`${ulkeGunu(an, dilim)}T00:00:00${fark}`)
}
