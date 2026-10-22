/**
 * NOTYA-ULKE-01 — the domain root of a country that is not the pre-split application: the country kit's landing
 * page layout (components/ulke/acilis) with the content its pack brings (countries/active/arayuz), in the visitor's
 * language. No landing content in the pack, or the feature off → not found.
 * (The pre-split application's root is app/page.tsx, untouched.)
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { UlkeAcilisSayfasi } from '@/components/ulke/acilis'
import { acilisFormu } from '@/components/ulke/acilis/AcilisSayfasi'
import { sayfaMeta } from '@/lib/ulke/seo/meta'
import { yapisalVeri } from '@/lib/ulke/seo/yapisalVeri'
import { JsonLd } from '@/components/ulke/JsonLd'
import { acilis } from '@/lib/ulke/arayuz'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'

export const dynamic = 'force-dynamic'

export function generateMetadata({ searchParams }: { searchParams?: AramaParametreleri }): Metadata {
  const icerik = acilis()
  if (!icerik || !ozellikAcik('acilisSayfasi')) return {}
  const ham = searchParams?.dil
  const d = acilisFormu(icerik, sayfaDili(searchParams), (Array.isArray(ham) ? ham[0] : ham) ?? null)
  const t = icerik.icerik[d]?.meta
  return sayfaMeta('home', { baslik: t?.baslik, aciklama: t?.aciklama })
}

export default function UlkeKokSayfasi({ searchParams }: { searchParams?: AramaParametreleri }) {
  const icerik = acilis()
  if (!icerik || !ozellikAcik('acilisSayfasi')) notFound()
  // Where "request a price" messages go is a setting of the deployment, never a default in code.
  const ham = searchParams?.dil
  return <><JsonLd veri={yapisalVeri()} /><UlkeAcilisSayfasi acilis={icerik} dil={sayfaDili(searchParams)} istenenDil={(Array.isArray(ham) ? ham[0] : ham) ?? null} iletisimEposta={process.env.NOTYA_ILETISIM_EPOSTA?.trim() || null} /></>
}
