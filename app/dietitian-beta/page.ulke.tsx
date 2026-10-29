/**
 * AU Clinical Dietitian marketing landing.
 * Specialty-specific surface (dietetics). Allow-listed only on the AU pack.
 */
import React from 'react'
import type { Metadata } from 'next'
import { Syne, Literata } from 'next/font/google'
import { notFound } from 'next/navigation'
import { DietitianBetaLanding } from '@/components/ulke/dietitian-beta/DietitianBetaLanding'
import { PORTAL_SAYFASI } from '@/lib/ulke/portal/sabitler'
import { rotaAcikMi } from '@/lib/ulke/rotaKapisi'
import { ulkePaketi } from '@/lib/ulke/ulke'

export const dynamic = 'force-dynamic'

const YOL = '/dietitian-beta'

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-db-display',
  display: 'swap',
})

const literata = Literata({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-db-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Notya for Australian Clinical Dietitians',
  description:
    'An AI clinical assistant steeped in Australian dietetic practice — ADIME, kJ, MST, IDDSI, and a patient portal your clients use between visits.',
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  referrer: 'no-referrer',
}

export default function DietitianBetaSayfasi() {
  const paket = ulkePaketi()
  if (paket.kod !== 'au') notFound()
  if (!rotaAcikMi(paket.rotalar, YOL)) notFound()
  if (!rotaAcikMi(paket.rotalar, PORTAL_SAYFASI)) notFound()
  return (
    <div className={`${syne.variable} ${literata.variable}`}>
      <DietitianBetaLanding />
    </div>
  )
}
