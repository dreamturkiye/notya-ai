/**
 * NOTYA-UZ-MUAYENE-01 — /visit: a visit. Choose the patient (no parameter), confirm consent and record (?hasta=),
 * then the recorded visit with its transcript (?seans=) and its note (?not=).
 * Exists only where the country's pack switches `cekirdekMuayene` on and brings the screen; the screen and its
 * text are the pack's (components/ulke/UlkeUygulamaSayfasi.tsx).
 */
import React from 'react'
import type { Metadata } from 'next'
import { UlkeUygulamaSayfasi } from '@/components/ulke/UlkeUygulamaSayfasi'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Page() {
  return <UlkeUygulamaSayfasi ekran="muayene" />
}
