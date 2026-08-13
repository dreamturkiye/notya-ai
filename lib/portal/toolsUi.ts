/** Shared client helpers for portal pages (mali + avukat). */

/**
 * Reads the Supabase access token straight from localStorage.
 * Portal pages avoid createClient() on mount because the session is only ever
 * needed as a Bearer header, and the SDK adds a full auth round-trip.
 */
export function getAccessToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    const key =
      Object.keys(localStorage).find((k) => k.includes('auth-token') || k.startsWith('sb-')) || ''
    const raw = localStorage.getItem('auth-token') || (key ? localStorage.getItem(key) : null)
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return String(parsed?.access_token || parsed?.currentSession?.access_token || '')
  } catch {
    return ''
  }
}

/** Picks a display name off a müşteri row regardless of ASCII/Turkish column naming. */
export function musteriAdi(row: Record<string, unknown> | null | undefined): string {
  if (!row) return 'İsimsiz Müşteri'
  const candidates = [row.sirket_adi, row['şirket_adi'], row.ad, row.unvan, row.name]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return 'İsimsiz Müşteri'
}

/** Narrows an unknown API payload down to an array, so `.map` is always safe. */
export function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}
