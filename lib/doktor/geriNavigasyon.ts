/**
 * Semantic “Geri” destinations for doktor flows.
 * Prefer explicit hrefs over history.back() so evaluation pages return to the
 * section the doctor came from (e.g. Belgeler), not a nested file preview.
 */

import type { HastaDosyaSekmeId } from '@/lib/doktor/hastaDosyaSekmeleri'

export function hastaDosyaHref(patientId: string, tab?: HastaDosyaSekmeId | null): string {
  const base = `/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}`
  if (!tab || tab === 'ozet') return base
  return `${base}?tab=${encodeURIComponent(tab)}`
}

/** After lab / röntgen değerlendirme — always return to Belge kasası, not Özet or a raw file. */
export function hastaBelgelerHref(patientId: string): string {
  return hastaDosyaHref(patientId, 'belgeler')
}

export function hastaGoruntulemeHref(patientId: string): string {
  return hastaDosyaHref(patientId, 'goruntuleme')
}
