/** Calendar-date helpers (UTC date-only). Stay inside this specialty folder. */

export function parseIsoDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error('invalid ISO date')
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

export function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return formatIsoDate(d)
}

export function diffDays(laterIso: string, earlierIso: string): number {
  const a = parseIsoDate(laterIso).getTime()
  const b = parseIsoDate(earlierIso).getTime()
  return Math.round((a - b) / 86_400_000)
}

export type GaWeeksDays = { weeks: number; days: number; totalDays: number }

export function daysToGa(totalDays: number): GaWeeksDays {
  const weeks = Math.floor(totalDays / 7)
  const days = totalDays % 7
  return { weeks, days, totalDays }
}

export function gaToDays(weeks: number, days = 0): number {
  return weeks * 7 + days
}

export function parseGaToken(token: string): GaWeeksDays {
  const m = /^(\d+)\+(\d)$/.exec(token)
  if (!m) throw new Error('expected GA token like 11+0')
  return { weeks: Number(m[1]), days: Number(m[2]), totalDays: Number(m[1]) * 7 + Number(m[2]) }
}
