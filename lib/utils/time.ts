// Shared İstanbul timezone utility for all Notya AI date/time operations
// All times displayed and calculated in Europe/Istanbul (UTC+3)

export const TZ = 'Europe/Istanbul'
export const LOCALE = 'tr-TR'

export function nowİstanbul(): Date {
  return new Date(new Date().toLocaleString(LOCALE, { timeZone: TZ }))
}

export function formatDateTime(iso: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleString(LOCALE, { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', ...opts })
}

export function formatDate(iso: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleDateString(LOCALE, { timeZone: TZ, day: '2-digit', month: 'long', year: 'numeric', ...opts })
}

export function formatTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  return date.toLocaleTimeString(LOCALE, { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
}

export function todayİstanbul(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

export function daysUntil(dateStr: string): number {
  const now = new Date(new Date().toLocaleString(LOCALE, { timeZone: TZ }))
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

export function formatTL(amount: number): string {
  return amount.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL'
}
