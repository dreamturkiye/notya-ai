/**
 * NOTYA-UZ-RANDEVU-01 — wall-clock time of the country a build serves (the pack's `saatDilimi`). Pure, client-safe:
 * no clock is read here, everything comes in as arguments.
 *
 * An appointment is stored as an INSTANT (UTC); a doctor thinks in the country's own day and hour. Every conversion
 * between the two goes through this file, and the offset is read from the platform's time-zone database — never a
 * fixed number of hours — so a deployment whose server clock is UTC puts 00:30 in Tashkent on the right day.
 *
 * Days are 'YYYY-MM-DD' strings, times of day are minutes after local midnight, weekdays are ISO (1 = Monday … 7 = Sunday).
 */
export const DAKIKA_MS = 60_000
export const GUN_DK = 1440

export type YerelAn = { gun: string; dakika: number; haftaGunu: number }

const bicimler = new Map<string, Intl.DateTimeFormat>()
function bicim(dilim: string): Intl.DateTimeFormat {
  let b = bicimler.get(dilim)
  if (!b) {
    b = new Intl.DateTimeFormat('en-GB', { timeZone: dilim, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    bicimler.set(dilim, b)
  }
  return b
}

function parcalar(ms: number, dilim: string): { y: number; a: number; g: number; s: number; d: number } {
  const p: Record<string, string> = {}
  for (const x of bicim(dilim).formatToParts(new Date(ms))) p[x.type] = x.value
  return { y: Number(p.year), a: Number(p.month), g: Number(p.day), s: Number(p.hour) % 24, d: Number(p.minute) }
}

const iki = (n: number) => String(n).padStart(2, '0')
const gunYaz = (y: number, a: number, g: number) => `${String(y).padStart(4, '0')}-${iki(a)}-${iki(g)}`

/** ISO weekday of a calendar day: 1 = Monday … 7 = Sunday. */
export function haftaGunu(gun: string): number {
  const [y, a, g] = gun.split('-').map(Number)
  return new Date(Date.UTC(y, a - 1, g)).getUTCDay() || 7
}

/** The country's day, minute of the day and weekday at an instant. */
export function yerelAn(an: number | string | Date, dilim: string): YerelAn {
  const ms = typeof an === 'number' ? an : new Date(an).getTime()
  const { y, a, g, s, d } = parcalar(ms, dilim)
  const gun = gunYaz(y, a, g)
  return { gun, dakika: s * 60 + d, haftaGunu: haftaGunu(gun) }
}

/** Local minus UTC, in minutes, at an instant. */
export function ofsetDk(ms: number, dilim: string): number {
  const { y, a, g, s, d } = parcalar(ms, dilim)
  return Math.round((Date.UTC(y, a - 1, g, s, d) - Math.floor(ms / DAKIKA_MS) * DAKIKA_MS) / DAKIKA_MS)
}

/** The instant (epoch ms) of the country's wall clock on `gun` at `dakika` minutes after midnight. */
export function yerelUtc(gun: string, dakika: number, dilim: string): number {
  const [y, a, g] = gun.split('-').map(Number)
  const tahmin = Date.UTC(y, a - 1, g) + dakika * DAKIKA_MS
  let t = tahmin - ofsetDk(tahmin, dilim) * DAKIKA_MS
  t = tahmin - ofsetDk(t, dilim) * DAKIKA_MS
  return t
}

/** true = a real calendar day written YYYY-MM-DD. */
export function gunGecerli(gun: unknown): boolean {
  if (typeof gun !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(gun)) return false
  const [y, a, g] = (gun as string).split('-').map(Number)
  const t = new Date(Date.UTC(y, a - 1, g))
  return t.getUTCFullYear() === y && t.getUTCMonth() === a - 1 && t.getUTCDate() === g
}

export function gunEkle(gun: string, n: number): string {
  const [y, a, g] = gun.split('-').map(Number)
  const t = new Date(Date.UTC(y, a - 1, g + n))
  return gunYaz(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}

/** The first day of the week `gun` lies in. `haftaBasi` is the pack's: 1 = weeks start on Monday, 7 = on Sunday. */
export function haftaninIlkGunu(gun: string, haftaBasi: 1 | 7): string {
  const hg = haftaGunu(gun)
  return gunEkle(gun, -(haftaBasi === 1 ? hg - 1 : hg % 7))
}

/**
 * A day as a person types it → 'YYYY-MM-DD', or null. Accepts the pack's own pattern (`tarihDeseni`, for example
 * DD.MM.YYYY) and the ISO form a date field sends. Nothing is guessed: 31.02.2027 is null, and so is a two-digit year.
 */
export function gunCoz(ham: unknown, tarihDeseni: string): string | null {
  if (typeof ham !== 'string') return null
  const t = ham.trim()
  if (gunGecerli(t)) return t
  const sira = tarihDeseni.match(/DD|MM|YYYY/g)
  const ayrac = tarihDeseni.replace(/DD|MM|YYYY/g, '')[0]
  if (!sira || sira.length !== 3 || !ayrac) return null
  const parca = t.split(ayrac).map((x) => x.trim())
  if (parca.length !== 3 || parca.some((x) => !/^\d+$/.test(x))) return null
  const deger: Record<string, string> = {}
  sira.forEach((s, i) => { deger[s] = parca[i] })
  if (deger.YYYY.length !== 4 || deger.MM.length > 2 || deger.DD.length > 2) return null
  const gun = gunYaz(Number(deger.YYYY), Number(deger.MM), Number(deger.DD))
  return gunGecerli(gun) ? gun : null
}

/** A day in the pack's own pattern: '2026-10-09' → '09.10.2026'. Digits only, so there is nothing to translate. */
export function gunYazDesenle(gun: string, tarihDeseni: string): string {
  if (!gunGecerli(gun)) return ''
  const [y, a, g] = gun.split('-')
  return tarihDeseni.replace('YYYY', y).replace('MM', a).replace('DD', g)
}

/** 'HH:MM' (24 hours; '24:00' allowed as the end of a day) → minutes after midnight, or null. */
export function saatCoz(ham: unknown): number | null {
  if (typeof ham !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(ham.trim())
  if (!m) return null
  const s = Number(m[1]); const d = Number(m[2])
  if (d > 59 || s > 24 || (s === 24 && d !== 0)) return null
  return s * 60 + d
}

/** Minutes after midnight → 'HH:MM'. */
export function saatYazDk(dakika: number): string {
  return `${iki(Math.floor(dakika / 60))}:${iki(dakika % 60)}`
}
