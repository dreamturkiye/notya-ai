/**
 * NOTYA-ULKE-DEMO-01 — /demo: book a 60-minute video call with Dr. Gökhan Mamur through Cal.com (Kaan, 2026-10-13:
 * every Notya site). The kit's page (components/ulke/demo) with the active pack's words, in the visitor's language.
 * No page when the landing page is off, the pack does not list /demo or brings no words for it → not found.
 * The booking link is NEXT_PUBLIC_DEMO_BOOKING_URL; without it the page says booking opens soon.
 * Cal.com's script and frame origins are allowed in the Content-Security-Policy of this path only (next.config.mjs).
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { UlkeDemoSayfasi, demoFormu } from '@/components/ulke/demo'
import { acilis } from '@/lib/ulke/arayuz'
import { demoMetni, demoSayfasiVar } from '@/lib/ulke/demo'
import { sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'

export const dynamic = 'force-dynamic'

function sayfa(searchParams: AramaParametreleri) {
  const a = acilis()
  if (!a || !demoSayfasiVar()) return null
  const ham = searchParams?.dil
  const d = demoFormu(a, sayfaDili(searchParams), (Array.isArray(ham) ? ham[0] : ham) ?? null)
  const metin = demoMetni(d)
  return metin ? { a, d, metin } : null
}

export function generateMetadata({ searchParams }: { searchParams?: AramaParametreleri }): Metadata {
  const s = sayfa(searchParams)
  return s ? { title: s.metin.meta.baslik, description: s.metin.meta.aciklama } : {}
}

export default function UlkeDemoRotasi({ searchParams }: { searchParams?: AramaParametreleri }) {
  const s = sayfa(searchParams)
  if (!s) notFound()
  return <UlkeDemoSayfasi acilis={s.a} metin={s.metin} dil={s.d} />
}
