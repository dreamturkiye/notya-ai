/**
 * Public medical catalogue. The signed-in calculators stay at /tools.
 */
import React from 'react'
import type { Metadata } from 'next'
import { TibbiSayfa, tibbiDili } from '@/components/ulke/TibbiSayfa'
import { sayfaMeta } from '@/lib/ulke/seo/meta'
import { araclarMetni } from '@/lib/ulke/arayuz'
import type { AramaParametreleri } from '@/lib/ulke/sayfaDili'

export const dynamic = 'force-dynamic'

export function generateMetadata({ searchParams }: { searchParams?: AramaParametreleri }): Metadata {
  const dil = tibbiDili(searchParams)
  return sayfaMeta('catalogue', { baslik: `${araclarMetni(dil).kabuk.araclar} — Notya` })
}

export default function Page({ searchParams }: { searchParams?: AramaParametreleri }) {
  return <TibbiSayfa searchParams={searchParams} />
}
