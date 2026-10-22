/**
 * AU-SEO-01 — head tags of a PUBLIC page: title, description, canonical, hreflang, Open Graph, Twitter, robots.
 * robots follows the country's single indexing switch (pack.aramaMotorlarinaGizli); signed-in pages never use this.
 */
import type { Metadata } from 'next'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { ACIK_ROBOTS, GIZLI_ROBOTS } from '@/lib/ulke/acikIcerik'
import { YASAL_YOLLAR } from '@/lib/ulke/yasal/tipler'
import { hreflangHaritasi, kendiSite, mutlakAdres } from './siteler'
import { seoMetni, type SeoSayfa } from './metinler'

export const SEO_YOLLARI: Readonly<Record<SeoSayfa, string>> = {
  home: '/', forClinics: '/for-clinics', catalogue: '/medical',
  privacy: YASAL_YOLLAR.privacy, terms: YASAL_YOLLAR.terms, cookies: YASAL_YOLLAR.cookies, 'data-request': YASAL_YOLLAR['data-request'],
  accessibility: YASAL_YOLLAR.accessibility, medical: YASAL_YOLLAR.medical, security: YASAL_YOLLAR.security, refund: YASAL_YOLLAR.refund, copyright: YASAL_YOLLAR.copyright,
}

export function sayfaMeta(sayfa: SeoSayfa, yedek: { baslik?: string; aciklama?: string }): Metadata {
  const p = ulkePaketi()
  const t = seoMetni(p.kod as string, sayfa)
  const baslik = t?.baslik ?? yedek.baslik
  const aciklama = t?.aciklama ?? yedek.aciklama
  const yol = SEO_YOLLARI[sayfa]
  const url = mutlakAdres(kendiSite(), yol)
  const yerel = /^[a-z]{2}-[A-Z]{2}$/.test(p.varsayilanDil) ? p.varsayilanDil.replace('-', '_') : undefined
  return {
    ...(baslik ? { title: baslik } : {}),
    ...(aciklama ? { description: aciklama } : {}),
    alternates: { canonical: url, languages: hreflangHaritasi(yol) },
    openGraph: { type: 'website', url, siteName: 'Notya', ...(baslik ? { title: baslik } : {}), ...(aciklama ? { description: aciklama } : {}), ...(yerel ? { locale: yerel } : {}) },
    twitter: { card: 'summary', ...(baslik ? { title: baslik } : {}), ...(aciklama ? { description: aciklama } : {}) },
    robots: p.aramaMotorlarinaGizli ? GIZLI_ROBOTS : ACIK_ROBOTS,
  }
}
