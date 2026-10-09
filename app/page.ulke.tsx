/**
 * NOTYA-ULKE-01 — the domain root of a country that is not the pre-split application: the country kit's landing
 * page layout (components/ulke/acilis) with the content its pack brings (countries/active/arayuz), in the visitor's
 * language. No landing content in the pack, or the feature off → not found.
 * (The pre-split application's root is app/page.tsx, untouched.)
 */
import React from 'react'
import { notFound } from 'next/navigation'
import { UlkeAcilisSayfasi } from '@/components/ulke/acilis'
import { acilis } from '@/lib/ulke/arayuz'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'

export const dynamic = 'force-dynamic'

export default function UlkeKokSayfasi({ searchParams }: { searchParams?: AramaParametreleri }) {
  const icerik = acilis()
  if (!icerik || !ozellikAcik('acilisSayfasi')) notFound()
  // Where "request a price" messages go is a setting of the deployment, never a default in code.
  const ham = searchParams?.dil
  return <UlkeAcilisSayfasi acilis={icerik} dil={sayfaDili(searchParams)} istenenDil={(Array.isArray(ham) ? ham[0] : ham) ?? null} iletisimEposta={process.env.NOTYA_ILETISIM_EPOSTA?.trim() || null} />
}
