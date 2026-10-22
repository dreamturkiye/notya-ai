/**
 * NOTYA-ULKE-01 — the root shell of a country that is not the pre-split application: document title, description,
 * search-engine instruction and viewport, all from the active pack. (The pre-split application keeps the literals in
 * app/layout.tsx untouched.)
 */
import type { Metadata, Viewport } from 'next'
import { ulkePaketi } from './ulke'

/** AU-MKT-AUDIT (2026-10-22): a tab icon that needs no file route (public/ is closed by the country gate): an inline SVG monogram. */
const SEKME_SIMGESI = (zemin: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2f4334"/><text x="32" y="45" font-family="Georgia,serif" font-size="40" text-anchor="middle" fill="${zemin}">n</text></svg>`)}`

export function ulkeKabukMetadata(): Metadata {
  const p = ulkePaketi()
  const yerel = /^[a-z]{2}-[A-Z]{2}$/.test(p.varsayilanDil) ? p.varsayilanDil.replace('-', '_') : undefined
  return {
    title: p.kabuk.baslik,
    description: p.kabuk.aciklama,
    icons: { icon: SEKME_SIMGESI(p.kabuk.zemin) },
    // Link previews carry the page's own title and description only: no image, no claim.
    openGraph: { type: 'website', siteName: p.kabuk.baslik, title: p.kabuk.baslik, description: p.kabuk.aciklama, ...(yerel ? { locale: yerel } : {}) },
    twitter: { card: 'summary', title: p.kabuk.baslik, description: p.kabuk.aciklama },
    formatDetection: { telephone: false },
    ...(p.aramaMotorlarinaGizli ? { robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } } : {}),
  }
}

export function ulkeKabukViewport(): Viewport {
  return { width: 'device-width', initialScale: 1, themeColor: ulkePaketi().kabuk.zemin, viewportFit: 'cover' }
}
