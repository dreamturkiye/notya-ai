/**
 * NOTYA-ULKE-PORTAL-01 — /portal: the PATIENT's page (a link the doctor gave, and a PIN; no account).
 * Exists only where the country's pack switches `hastaPortali` on, brings the portal's catalogue and lists the
 * route. The screen is the kit's (components/ulke/portal/); every sentence on it is the pack's.
 *
 * PRIVACY: never indexed, never kept by a shared cache, no referrer (the middleware sets the headers as well).
 * The link's token is in the address FRAGMENT, which no server ever receives: this file reads nothing of the request.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'
import { PortalSayfasi } from '@/components/ulke/portal'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'
import { PORTAL_SAYFASI } from '@/lib/ulke/portal/sabitler'
import { rotaAcikMi } from '@/lib/ulke/rotaKapisi'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default function Page() {
  if (!ozellikAcik('cekirdekMuayene') || !ozellikAcik('hastaPortali') || !AKTIF_ARAYUZ?.portalMetinleri || !rotaAcikMi(ulkePaketi().rotalar, PORTAL_SAYFASI)) notFound()
  return <PortalSayfasi />
}
