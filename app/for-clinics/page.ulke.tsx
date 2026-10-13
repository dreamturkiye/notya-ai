/**
 * NOTYA-ULKE-KLINIK-ACILIS — /for-clinics: the public clinic landing. Same kit as the root landing
 * (components/ulke/acilis), the pack's clinic copy, the visitor's language. The signed-in clinic
 * screen stays at /clinic. No landing content, or the feature off → not found.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { UlkeKlinikSayfasi } from '@/components/ulke/acilis'
import { acilisFormu } from '@/components/ulke/acilis/AcilisSayfasi'
import { ACIK_ROBOTS } from '@/lib/ulke/acikIcerik'
import { acilis } from '@/lib/ulke/arayuz'
import { sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'
import { ozellikAcik } from '@/lib/ulke/ulke'

export const dynamic = 'force-dynamic'

export function generateMetadata({ searchParams }: { searchParams?: AramaParametreleri }): Metadata {
  const icerik = acilis()
  if (!icerik || !ozellikAcik('acilisSayfasi')) return {}
  const ham = searchParams?.dil
  const d = acilisFormu(icerik, sayfaDili(searchParams), (Array.isArray(ham) ? ham[0] : ham) ?? null)
  const t = icerik.icerik[d]?.klinik.meta
  return t ? { title: t.baslik, description: t.aciklama, robots: ACIK_ROBOTS } : {}
}

export default function UlkeKlinikAcilisSayfasi({ searchParams }: { searchParams?: AramaParametreleri }) {
  const icerik = acilis()
  if (!icerik || !ozellikAcik('acilisSayfasi')) notFound()
  const ham = searchParams?.dil
  return (
    <UlkeKlinikSayfasi
      acilis={icerik}
      dil={sayfaDili(searchParams)}
      istenenDil={(Array.isArray(ham) ? ham[0] : ham) ?? null}
      iletisimEposta={process.env.NOTYA_ILETISIM_EPOSTA?.trim() || null}
    />
  )
}
