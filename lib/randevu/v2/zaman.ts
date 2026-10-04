/**
 * NOTYA-RANDEVU-V2 — Europe/Istanbul wall-clock helpers. Pure, client-safe.
 *
 * Appointment logic (working hours, "yarın 10:00", "sabah 08:00") is Istanbul local time; storage is UTC.
 * Turkey has been UTC+3 all year since 2016, but nothing here hardcodes that: the offset is read from the
 * platform's tz database, so a future DST decision would not silently shift every slot by an hour.
 */

export const TZ = 'Europe/Istanbul'
export const DAKIKA_MS = 60_000
export const GUN_MS = 86_400_000

const bicim = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export type IstanbulAn = {
  /** YYYY-MM-DD in Istanbul. */
  gun: string
  /** Minutes since local midnight (0–1439). */
  dakika: number
  /** 0 = Sunday … 6 = Saturday (Date#getDay convention, same keys as doktor_calisma_saatleri.gunler). */
  haftaGunu: number
}

function parcalar(ms: number): { y: number; mo: number; d: number; h: number; mi: number } {
  const p: Record<string, string> = {}
  for (const x of bicim.formatToParts(new Date(ms))) p[x.type] = x.value
  return { y: Number(p.year), mo: Number(p.month), d: Number(p.day), h: Number(p.hour) % 24, mi: Number(p.minute) }
}

export function istanbulAn(an: Date | number | string): IstanbulAn {
  const ms = typeof an === 'number' ? an : new Date(an).getTime()
  const { y, mo, d, h, mi } = parcalar(ms)
  const gun = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return { gun, dakika: h * 60 + mi, haftaGunu: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() }
}

/** Local minus UTC, in minutes, at the given instant. */
export function istanbulOfsetDk(ms: number): number {
  const { y, mo, d, h, mi } = parcalar(ms)
  const yerel = Date.UTC(y, mo - 1, d, h, mi)
  return Math.round((yerel - Math.floor(ms / DAKIKA_MS) * DAKIKA_MS) / DAKIKA_MS)
}

/** UTC epoch ms of Istanbul wall-clock `gun` (YYYY-MM-DD) at `dakika` minutes after midnight. */
export function istanbulYerelUtc(gun: string, dakika: number): number {
  const [y, mo, d] = gun.split('-').map(Number)
  const tahmin = Date.UTC(y, mo - 1, d) + dakika * DAKIKA_MS
  let t = tahmin - istanbulOfsetDk(tahmin) * DAKIKA_MS
  t = tahmin - istanbulOfsetDk(t) * DAKIKA_MS
  return t
}

export function gunEkle(gun: string, n: number): string {
  return new Date(Date.parse(`${gun}T12:00:00Z`) + n * GUN_MS).toISOString().slice(0, 10)
}

/** "09:30" → 570; null when malformed. */
export function saatDakika(hhmm: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim())
  if (!m) return null
  const h = Number(m[1])
  const mi = Number(m[2])
  if (h > 24 || mi > 59 || (h === 24 && mi > 0)) return null
  return h * 60 + mi
}

export function dakikaSaat(dk: number): string {
  return `${String(Math.floor(dk / 60)).padStart(2, '0')}:${String(dk % 60).padStart(2, '0')}`
}

/** "5 Ekim Pazartesi" */
export function gunEtiketi(an: Date | number | string): string {
  return new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric', month: 'long', weekday: 'long' }).format(new Date(an))
}

/** "14:20" */
export function saatEtiketi(an: Date | number | string): string {
  return new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(an))
}
