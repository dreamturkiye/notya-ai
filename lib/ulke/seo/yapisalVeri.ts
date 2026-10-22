/**
 * AU-SEO-01 — schema.org JSON-LD. Facts only: operator Notya LLC (Baltimore, MD, US), contact kaan@notya.io.
 * No ABN, no Australian address, no regulator or approval claim, no price, no rating.
 */
import { ulkePaketi } from '@/lib/ulke/ulke'
import { kendiSite, mutlakAdres } from './siteler'
import { seoMetni } from './metinler'

export const OPERATOR = { ad: 'Notya LLC', sehir: 'Baltimore', bolge: 'MD', ulke: 'US', eposta: 'kaan@notya.io' } as const

export function yapisalVeri(): Record<string, unknown> {
  const p = ulkePaketi()
  const s = kendiSite()
  const kok = mutlakAdres(s, '/')
  const t = seoMetni(p.kod as string, 'home')
  const aciklama = t?.aciklama ?? p.kabuk.aciklama
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${kok}#org`, name: 'Notya', legalName: OPERATOR.ad, url: kok,
        email: OPERATOR.eposta,
        address: { '@type': 'PostalAddress', addressLocality: OPERATOR.sehir, addressRegion: OPERATOR.bolge, addressCountry: OPERATOR.ulke },
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: OPERATOR.eposta },
      },
      { '@type': 'WebSite', '@id': `${kok}#site`, url: kok, name: 'Notya', inLanguage: p.varsayilanDil, publisher: { '@id': `${kok}#org` } },
      {
        '@type': 'SoftwareApplication', '@id': `${kok}#app`, name: 'Notya', description: aciklama, url: kok,
        applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: p.varsayilanDil,
        provider: { '@id': `${kok}#org` },
      },
    ],
  }
}
