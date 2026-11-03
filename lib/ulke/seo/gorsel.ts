/**
 * AU-SEO-02 (2026-11-03) - the link-preview image of a country site: a STATIC 1200x630 PNG under public/og/ (made by
 * scripts/og-gorsel.py), never a dynamic opengraph-image route (app/opengraph-image.ulke.tsx broke Next 14.2 country
 * builds under pageExtensions). A country without an entry keeps the plain "summary" card with no image.
 * The file is served through the route gate's static prefix '/og/' (lib/ulke/rotaKapisi.ts).
 */
import type { Metadata } from 'next'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { kendiSite, mutlakAdres } from './siteler'

export const OG_GORSELLERI: Readonly<Record<string, { yol: string; alt: string }>> = {
  au: { yol: '/og/au-1200x630.png', alt: 'Notya: a documentation assistant for doctors in Australia' },
}

export const OG_GENISLIK = 1200
export const OG_YUKSEKLIK = 630

/** The image fields of `openGraph` and the card of `twitter` for the active country. */
export function ogGorselAlanlari(): { og: NonNullable<Metadata['openGraph']>; twitter: { card: 'summary' | 'summary_large_image'; images?: string[] } } {
  const g = OG_GORSELLERI[ulkePaketi().kod as string]
  if (!g) return { og: {}, twitter: { card: 'summary' } }
  const url = mutlakAdres(kendiSite(), g.yol)
  return { og: { images: [{ url, width: OG_GENISLIK, height: OG_YUKSEKLIK, alt: g.alt, type: 'image/png' }] }, twitter: { card: 'summary_large_image', images: [url] } }
}
