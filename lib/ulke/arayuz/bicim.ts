/**
 * NOTYA-ULKE-SABLON-01 — how the active country WRITES a day and a time of day. Client-safe; every rule is the
 * pack's (`bicim`, `uygulama.saatBicimi`, `uygulama.saatDilimleri`), none is the kit's.
 *
 *   day          the pack's pattern (`bicim.tarihDeseni`): DD.MM.YYYY, MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD …
 *                Digits only, so there is nothing to translate.
 *   time of day  24-hour 'HH:MM', or 12-hour as the pack's locale writes it ("2:30 PM"). The 12-hour day-period
 *                words come from the platform's data for the pack's own locale (`bicim.yerel`), not from this file.
 *   time zone    the ACCOUNT's (one of the pack's list), the pack's default until the account is known.
 *
 * Times are stored as instants and typed as 24-hour 'HH:MM'; only what a person READS follows `saatBicimi`.
 */
import { ulkePaketi } from '../ulke'
import { gunYazDesenle } from '../uygulama/zaman'

/** The pack's own day pattern. */
export const tarihDeseni = (): string => ulkePaketi().bicim.tarihDeseni

/** The pack's default time zone, and the zones an account may choose. */
export const varsayilanSaatDilimi = (): string => ulkePaketi().saatDilimi
export const saatDilimleri = (): readonly string[] => ulkePaketi().uygulama?.saatDilimleri ?? [ulkePaketi().saatDilimi]
/** `ham` when it is one of the pack's zones; otherwise the pack's default. Never a zone the pack does not list. */
export const saatDilimiSec = (ham: unknown): string => (typeof ham === 'string' && saatDilimleri().includes(ham) ? ham : varsayilanSaatDilimi())

/**
 * THE ACCOUNT'S TIME ZONE, on the client. Set once when the account is known (components/ulke/uygulama/Kabuk.tsx);
 * every date and time the screens write afterwards uses it. Before that, and in a plain render, it is the pack's
 * default. A value that is not on the pack's list is ignored.
 */
let hesabinDilimi: string | null = null
export function hesapSaatDilimiAyarla(ham: unknown): void { hesabinDilimi = typeof ham === 'string' && saatDilimleri().includes(ham) ? ham : null }
export const hesapSaatDilimi = (): string => hesabinDilimi ?? varsayilanSaatDilimi()

const saatBicimi = (): 24 | 12 => ulkePaketi().uygulama?.saatBicimi ?? 24

const onIki = new Map<string, Intl.DateTimeFormat>()
function onIkilik(yerel: string): Intl.DateTimeFormat {
  let b = onIki.get(yerel)
  if (!b) { b = new Intl.DateTimeFormat(yerel, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true }); onIki.set(yerel, b) }
  return b
}

/** A wall-clock time 'HH:MM' (24-hour, as stored and typed) as the country writes it. '' for anything else. */
export function saatGoster(saat: string | null | undefined): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(saat ?? ''))
  if (!m) return ''
  const s = Number(m[1]) % 24, d = Number(m[2])
  const yirmiDort = `${String(s).padStart(2, '0')}:${m[2]}`
  return saatBicimi() === 24 ? yirmiDort : onIkilik(ulkePaketi().bicim.yerel).format(new Date(Date.UTC(2000, 0, 1, s, d)))
}

/** A day in the pack's pattern, from an ISO date or timestamp, in `saatDilimi` (the account's). '' when it cannot be written. */
export function tarihYaz(iso: string | null | undefined, saatDilimi: string = hesapSaatDilimi()): string {
  if (!iso) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return gunYazDesenle(iso, tarihDeseni())
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return ''
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: saatDilimi, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(t)
  const al = (tur: string) => p.find((x) => x.type === tur)?.value ?? ''
  return gunYazDesenle(`${al('year')}-${al('month')}-${al('day')}`, tarihDeseni())
}

/** A time of day as the country writes it, from an ISO timestamp, in `saatDilimi` (the account's). */
export function saatYaz(iso: string | null | undefined, saatDilimi: string = hesapSaatDilimi()): string {
  if (!iso) return ''
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return ''
  return saatGoster(new Intl.DateTimeFormat('en-GB', { timeZone: saatDilimi, hour: '2-digit', minute: '2-digit', hour12: false }).format(t))
}
