/**
 * HASTA-PORTALI-GUNLUK — Türkiye time helpers for the daily health home. Türkiye has been on fixed UTC+3 (no DST) since
 * 2016, so day boundaries are computed with a fixed offset: deterministic in tests, identical on the server and in the
 * browser. Days are 'YYYY-MM-DD' strings in Türkiye time.
 */
export const TR_OFSET_MS = 3 * 3600_000
export const GUN_MS = 86_400_000

const ms = (d: Date | number | string) => (d instanceof Date ? d.getTime() : typeof d === 'number' ? d : new Date(d).getTime())

const gunOnbellek = new Map<string, string>()
/** The Türkiye calendar day of an instant. (ISO strings are memoised: the composer asks for the same rows many times.) */
export function trGun(d: Date | number | string): string {
  if (typeof d === 'string') {
    const v = gunOnbellek.get(d)
    if (v) return v
    if (gunOnbellek.size > 20_000) gunOnbellek.clear()
    const g = new Date(ms(d) + TR_OFSET_MS).toISOString().slice(0, 10)
    gunOnbellek.set(d, g)
    return g
  }
  return new Date(ms(d) + TR_OFSET_MS).toISOString().slice(0, 10)
}

/** Minutes since Türkiye midnight (0..1439). */
export function trDakika(d: Date | number | string): number {
  const t = new Date(ms(d) + TR_OFSET_MS)
  return t.getUTCHours() * 60 + t.getUTCMinutes()
}

/**
 * SAGLIGIM-GORUNUM-V3 (Kaan, 2026-11-25) — minutes since the DEVICE's local midnight (0..1439). Only for the greeting /
 * day-part: a patient in Baltimore at 10:11 is greeted "Günaydın", not by Türkiye's 18:11. Dose schedules, day
 * boundaries and streaks keep the Türkiye helpers above.
 */
export function yerelDakika(d: Date | number = Date.now()): number {
  const t = d instanceof Date ? d : new Date(d)
  return t.getHours() * 60 + t.getMinutes()
}

/** The instant of Türkiye midnight starting `gun`. */
export function trGunBasi(gun: string): Date {
  return new Date(Date.parse(`${gun}T00:00:00Z`) - TR_OFSET_MS)
}

export function gunEkle(gun: string, n: number): string {
  return new Date(Date.parse(`${gun}T00:00:00Z`) + n * GUN_MS).toISOString().slice(0, 10)
}

/** Day difference b − a (whole days). */
export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / GUN_MS)
}

/** 'HH:MM' on a Türkiye day → ISO instant. */
export function trSaatAni(gun: string, saat: string): string {
  const [h, m] = saat.split(':').map((x) => Number(x))
  return new Date(trGunBasi(gun).getTime() + (h * 60 + m) * 60_000).toISOString()
}

export function saatGecerliMi(s: unknown): s is string {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s)
}

/** 'HH:MM' → minutes. */
export function saatDakika(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

/** Is the minute-of-day inside a quiet window that may wrap midnight (e.g. 23:00–07:00)? */
export function sessizSaatteMi(dakika: number, bas: string, bit: string): boolean {
  const b = saatDakika(bas), e = saatDakika(bit)
  if (b === e) return false
  return b < e ? dakika >= b && dakika < e : dakika >= b || dakika < e
}

/** Weekday of a Türkiye day, 0 = Monday … 6 = Sunday. */
export function haftaGunu(gun: string): number {
  return (new Date(`${gun}T00:00:00Z`).getUTCDay() + 6) % 7
}
