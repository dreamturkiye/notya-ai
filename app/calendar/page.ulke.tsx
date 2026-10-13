/**
 * NOTYA-UZ-RANDEVU-01 — /calendar: the doctor's appointments. The calendar by day or week (?gun=, ?gorunum=), the
 * booking form (?yeni=1), one appointment (?randevu=), the working pattern (?duzen=1).
 * Exists only where the country's pack switches `cekirdekMuayene` and `randevu` on and brings the screen; the screen
 * and its text are the pack's (components/ulke/UlkeUygulamaSayfasi.tsx).
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { UlkeUygulamaSayfasi } from '@/components/ulke/UlkeUygulamaSayfasi'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'
import { ozellikAcik } from '@/lib/ulke/ulke'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Page() {
  if (!ozellikAcik('randevu')) notFound()
  return <UlkeUygulamaSayfasi ekran="takvim" />
}
