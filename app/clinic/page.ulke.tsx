/**
 * NOTYA-ULKE-KLINIK-01 — /clinic: the clinic of the account — create one or join with a code; its members, invitations and schedule;
 * ?gorunum=yetkiler "who can help with my patients" and the record; ?gorunum=paylasilan what was shared with the account.
 * Exists only where the country's pack switches `klinikHesaplari` on and lists the route; the screen is the
 * kit's and every word on it is the pack's (components/ulke/UlkeUygulamaSayfasi.tsx).
 */
import React from 'react'
import type { Metadata } from 'next'
import { UlkeUygulamaSayfasi } from '@/components/ulke/UlkeUygulamaSayfasi'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Page() {
  return <UlkeUygulamaSayfasi ekran="klinik" />
}
