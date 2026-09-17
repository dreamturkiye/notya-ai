/**
 * Semantic Geri / İleri — Notya navigation contract
 *
 * Inspired by clinical EHRs (Epic Chart Review, Athena) and consumer patterns
 * (Apple HIG “Up”, Material “Up vs Back”, Notion/Linear parent crumbs):
 *
 * 1. Primary Geri is ALWAYS an explicit parent destination — never history.back().
 * 2. Parent = the section the user was working in (Belgeler, Muayene Geçmişi,
 *    Ayarlar, Mali panel), not the browser stack or a nested file preview.
 * 3. Top-level hub pages with a primary nav (DoktorNav / MaliNav) do not need
 *    a page-level Geri; nested sub-pages and print/detail views do.
 * 4. İn-page overlays (büyüme fullscreen, görüntüleme viewer) dismiss with ← Geri
 *    back to the list/parent UI state — not a route change.
 * 5. İleri is for the next step in a known workflow (wizard step, Yazdır after
 *    edit) — optional; only when the forward destination is unambiguous.
 * 6. Specialty chapters (Göz / Deri / Dahiliye / KD) live ON the hasta chart;
 *    their “back” is the chart tab URL (?tab=goz|deri|…). Sub-tools opened as
 *    routes (onam yazdır, belge değerlendir) return to that tab.
 */

import type { HastaDosyaSekmeId } from '@/lib/doktor/hastaDosyaSekmeleri'

export const DOKTOR_ANA = '/dashboard/doktor'
export const HASTA_LISTESI = '/dashboard/doktor/hastalar'
export const AYARLAR = '/dashboard/doktor/ayarlar'
export const MALI_PANEL = '/dashboard/mali'
export const AVUKAT_PANEL = '/dashboard/avukat'
export const KLINIK_PANEL = '/dashboard/klinik'

export function hastaDosyaHref(patientId: string, tab?: HastaDosyaSekmeId | null): string {
  const base = `${HASTA_LISTESI}/${encodeURIComponent(patientId)}`
  if (!tab || tab === 'ozet') return base
  return `${base}?tab=${encodeURIComponent(tab)}`
}

/** Lab / röntgen değerlendirme → Belge kasası */
export function hastaBelgelerHref(patientId: string): string {
  return hastaDosyaHref(patientId, 'belgeler')
}

export function hastaGoruntulemeHref(patientId: string): string {
  return hastaDosyaHref(patientId, 'goruntuleme')
}

export function hastaMuayeneHref(patientId: string): string {
  return hastaDosyaHref(patientId, 'muayene')
}

export function hastaGebelikHref(patientId: string): string {
  return hastaDosyaHref(patientId, 'gebelik')
}

/** Yeni seans: return to that patient’s chart if known, else doktor hub. */
export function seansGeriHref(patientId?: string | null): string {
  const id = String(patientId ?? '').trim()
  return id ? hastaDosyaHref(id) : DOKTOR_ANA
}

/** Note editor Geri → Muayene Geçmişi (not the print view). */
export function notDuzenleGeriHref(patientId?: string | null): string {
  const id = String(patientId ?? '').trim()
  return id ? hastaMuayeneHref(id) : HASTA_LISTESI
}

/** Settings children (entegrasyonlar, personel, hesap, erecete). */
export function ayarlarGeriHref(): string {
  return AYARLAR
}

export function maliPanelHref(): string {
  return MALI_PANEL
}

/** Onam print → Gebelik tab when patientId present. */
export function onamGeriHref(patientId?: string | null): string {
  const id = String(patientId ?? '').trim()
  return id ? hastaGebelikHref(id) : DOKTOR_ANA
}
