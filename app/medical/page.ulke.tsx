/**
 * Public medical catalogue. The signed-in calculators stay at /tools.
 */
import React from 'react'
import type { Metadata } from 'next'
import { TibbiSayfa } from '@/components/ulke/TibbiSayfa'
import { ACIK_ROBOTS } from '@/lib/ulke/acikIcerik'
import { araclarMetni } from '@/lib/ulke/arayuz'
import { sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'

export const dynamic = 'force-dynamic'

export function generateMetadata({ searchParams }: { searchParams?: AramaParametreleri }): Metadata {
  const dil = sayfaDili(searchParams)
  return { title: `${araclarMetni(dil).kabuk.araclar} — Notya`, robots: ACIK_ROBOTS }
}

export default function Page({ searchParams }: { searchParams?: AramaParametreleri }) {
  return <TibbiSayfa searchParams={searchParams} />
}
