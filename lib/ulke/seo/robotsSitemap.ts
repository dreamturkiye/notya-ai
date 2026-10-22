/**
 * AU-SEO-01 — robots.txt and sitemap.xml of a country build. Both follow the single indexing switch.
 * Switch OFF: robots disallows everything, no sitemap. ON: public pages allowed, everything else disallowed, sitemap listed.
 * The files are served at the host root through rewrites (next.config.mjs) and live at <prefix>/robots.txt in the build.
 */
import { ulkePaketi } from '@/lib/ulke/ulke'
import { ACIK_ICERIK_YOLLARI } from '@/lib/ulke/acikIcerik'
import { ROBOTS_HERKESE_KAPALI } from '@/lib/ulke/rotaKapisi'
import { kendiSite, mutlakAdres } from './siteler'

export function indekslenebilirMi(): boolean {
  return !ulkePaketi().aramaMotorlarinaGizli
}

export function robotsMetni(): string {
  if (!indekslenebilirMi()) return ROBOTS_HERKESE_KAPALI
  const s = kendiSite()
  const sat = ['User-agent: *', 'Allow: /$']
  for (const y of ACIK_ICERIK_YOLLARI) sat.push(`Allow: ${s.onEk}${y === '/' ? '' : y}$`)
  sat.push(`Allow: ${s.onEk}/_next/static/`, `Allow: ${s.onEk}/_next/image`, 'Disallow: /', '', `Sitemap: ${s.origin}/sitemap.xml`)
  return `${sat.join('\n')}\n`
}

/** null = no sitemap (switch off). */
export function sitemapXml(): string | null {
  if (!indekslenebilirMi()) return null
  const s = kendiSite()
  const urls = ACIK_ICERIK_YOLLARI.map((y) => `  <url><loc>${mutlakAdres(s, y)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
