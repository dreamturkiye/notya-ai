/**
 * NOTYA-ULKE-01 — /welcome: the ONE page a signed-in account sees in a country whose pilot has not started
 * ("your pilot access is being prepared"). Exists only where the pack switches `bekletmeSayfasi` on.
 * The text of every switched-on language is handed to the client, which shows the account's own language.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import BekletmeEkrani from '@/components/ulke/BekletmeEkrani'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { yuzeyMetinleri } from '@/lib/ulke/metin'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'
import { UYGULAMA_EKRANLARI, type DilKodu, type YuzeyMetinleri } from '@/lib/ulke/tipler'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function WelcomePage() {
  if (!ozellikAcik('bekletmeSayfasi')) notFound()
  // NOTYA-UZ-MUAYENE-01: where the application is switched on, the home replaces this page.
  if (ozellikAcik('cekirdekMuayene')) redirect(UYGULAMA_EKRANLARI.bugun)
  const p = ulkePaketi()
  const metinler: Partial<Record<DilKodu, YuzeyMetinleri<'bekletme'>>> = {}
  for (const dil of p.acikDiller) metinler[dil] = yuzeyMetinleri('bekletme', dil)
  return <BekletmeEkrani varsayilanDil={p.varsayilanDil} metinler={metinler} giris="/login" />
}
