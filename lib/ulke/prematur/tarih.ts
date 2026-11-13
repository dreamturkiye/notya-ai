/**
 * PREMATUR-ULKE-01 — calendar arithmetic of the prematurity module, on 'YYYY-MM-DD' days. Pure, client-safe, no clock.
 * The same arithmetic as the Türkiye module's (specialties/pediatri/engines/girdi.ts); the kit does not import that
 * file (wall rule D7), so the parity test (./prematur.test.ts) keeps the two equal.
 */
const GUN_MS = 86_400_000

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** true = a real calendar day written 'YYYY-MM-DD'. */
export const gecerliGun = (s: unknown): s is string => typeof s === 'string' && ISO.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s

/** A day plus a number of days (negative = before). */
export function gunEkle(iso: string, gun: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

/** A day plus calendar months; 31 January + 1 month = the last day of February. */
export function ayEkle(iso: string, ay: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const hedef = new Date(Date.UTC(y, m - 1 + ay, 1))
  const sonGun = new Date(Date.UTC(hedef.getUTCFullYear(), hedef.getUTCMonth() + 1, 0)).getUTCDate()
  hedef.setUTCDate(Math.min(d, sonGun))
  return hedef.toISOString().slice(0, 10)
}

/** Days from `a` to `b` (positive when `b` is later). */
export const gunFarki = (a: string, b: string): number => Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / GUN_MS)

/** Completed calendar months from the birth day to a day. */
export function tamAy(dogumIso: string, tarihIso: string): number {
  const [y1, m1, d1] = dogumIso.slice(0, 10).split('-').map(Number)
  const [y2, m2, d2] = tarihIso.slice(0, 10).split('-').map(Number)
  let ay = (y2 - y1) * 12 + (m2 - m1)
  if (d2 < d1) ay -= 1
  return ay
}
