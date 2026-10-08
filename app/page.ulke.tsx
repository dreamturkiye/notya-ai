/**
 * NOTYA-ULKE-01 — the domain root of a country that is not the pre-split application: the landing page its pack
 * brings (countries/active/sayfalar), in the visitor's language. No pack page, or the feature off → not found.
 * (The pre-split application's root is app/page.tsx, untouched.)
 */
import React from 'react'
import { notFound } from 'next/navigation'
import { AKTIF_SAYFALAR } from '@/countries/active/sayfalar'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'

export const dynamic = 'force-dynamic'

export default function UlkeKokSayfasi({ searchParams }: { searchParams?: AramaParametreleri }) {
  const Acilis = AKTIF_SAYFALAR.acilis
  if (!Acilis || !ozellikAcik('acilisSayfasi')) notFound()
  // Where "request a price" messages go is a setting of the deployment, never a default in code.
  return <Acilis dil={sayfaDili(searchParams)} iletisimEposta={process.env.NOTYA_ILETISIM_EPOSTA?.trim() || null} />
}
