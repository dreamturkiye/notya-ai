/**
 * NOTYA-ULKE-KLINIK-01 — /desk: the front-desk workspace of a clinic — the appointments and the minimal patient card of the
 * doctors who gave the account a permission.
 * Exists only where the country's pack switches `klinikHesaplari` on (and `randevu`) and lists the route; the screen is the
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
  return <UlkeUygulamaSayfasi ekran="onBuro" />
}
