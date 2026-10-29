/**
 * Temporary AU Clinical Dietitian beta invite landing.
 * Specialty-specific marketing surface (dietetics). Allow-listed only on the AU pack.
 * Remove when the invite closes.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DietitianBetaLanding } from '@/components/ulke/dietitian-beta/DietitianBetaLanding'
import { PORTAL_SAYFASI } from '@/lib/ulke/portal/sabitler'
import { rotaAcikMi } from '@/lib/ulke/rotaKapisi'
import { ulkePaketi } from '@/lib/ulke/ulke'

export const dynamic = 'force-dynamic'

const YOL = '/dietitian-beta'

export const metadata: Metadata = {
  title: 'Notya for Australian Clinical Dietitians — private beta',
  description:
    'An AI clinical assistant steeped in Australian dietetic practice — ADIME, kJ, MST, IDDSI, and a patient portal your clients use between visits.',
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  referrer: 'no-referrer',
}

export default function DietitianBetaSayfasi() {
  const paket = ulkePaketi()
  if (paket.kod !== 'au') notFound()
  if (!rotaAcikMi(paket.rotalar, YOL)) notFound()
  // Portal is part of the pitch — keep the page off if the pack ever drops it.
  if (!rotaAcikMi(paket.rotalar, PORTAL_SAYFASI)) notFound()
  return <DietitianBetaLanding />
}
