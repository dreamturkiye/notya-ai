/**
 * NOTYA-ULKE-01 — the root shell of a country that is not the pre-split application: document title, description,
 * search-engine instruction and viewport, all from the active pack. (The pre-split application keeps the literals in
 * app/layout.tsx untouched.)
 */
import type { Metadata, Viewport } from 'next'
import { ulkePaketi } from './ulke'

export function ulkeKabukMetadata(): Metadata {
  const p = ulkePaketi()
  return {
    title: p.kabuk.baslik,
    description: p.kabuk.aciklama,
    formatDetection: { telephone: false },
    ...(p.aramaMotorlarinaGizli ? { robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } } : {}),
  }
}

export function ulkeKabukViewport(): Viewport {
  return { width: 'device-width', initialScale: 1, themeColor: ulkePaketi().kabuk.zemin, viewportFit: 'cover' }
}
