/**
 * AU-SEO-01 — where each country site lives, for canonical, hreflang, Open Graph and the sitemap.
 * Own site: NOTYA_SITE_ORIGIN (https only) overrides the origin of THIS deployment; otherwise the table.
 * Hosts other than au are the expected pattern and must be confirmed before their indexing is switched on.
 */
import { ulkePaketi } from '@/lib/ulke/ulke'

export type Site = { origin: string; onEk: string; hreflang: string }

export const SITELER: Readonly<Record<string, Site>> = {
  au: { origin: 'https://au.notya.io', onEk: '/au', hreflang: 'en-AU' },
  us: { origin: 'https://us.notya.io', onEk: '/us', hreflang: 'en-US' },
  gb: { origin: 'https://uk.notya.io', onEk: '/uk', hreflang: 'en-GB' },
  ca: { origin: 'https://ca.notya.io', onEk: '/ca', hreflang: 'en-CA' },
  nz: { origin: 'https://nz.notya.io', onEk: '/nz', hreflang: 'en-NZ' },
  uz: { origin: 'https://notya.io', onEk: '/uzbek', hreflang: 'uz-Latn' },
}

export function mutlakAdres(site: Site, yol: string): string {
  return `${site.origin}${site.onEk}${yol === '/' ? '' : yol}`
}

export function kendiSite(): Site {
  const kod = ulkePaketi().kod as string
  const s = SITELER[kod]
  if (!s) throw new Error(`No site entry for country "${kod}"`)
  const o = process.env.NOTYA_SITE_ORIGIN?.trim().replace(/\/+$/, '')
  return o && /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(o) ? { ...s, origin: o } : s
}

/** hreflang map: this site always; sister sites only when named in NOTYA_HREFLANG_SITES ("au,us,gb"), so we never point at a noindex site. */
export function hreflangHaritasi(yol: string): Record<string, string> {
  const kendi = kendiSite()
  const kod = ulkePaketi().kod as string
  const liste = (process.env.NOTYA_HREFLANG_SITES ?? '').split(',').map((x) => x.trim()).filter((x) => x && x !== kod && SITELER[x])
  const out: Record<string, string> = { [kendi.hreflang]: mutlakAdres(kendi, yol) }
  for (const k of liste) out[SITELER[k].hreflang] = mutlakAdres(SITELER[k], yol)
  return out
}
