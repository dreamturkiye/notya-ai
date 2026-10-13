/**
 * NOTYA-ULKE-ARACLAR-01 — /tools: the tools area of a country build — a grid of tools (base tools for every role,
 * role tools for the account's own role), and each tool's own screen at ?arac=<key>.
 * Exists only where the country's pack switches `araclar` on and lists the route; the screen is the kit's and every
 * word on it is the pack's (components/ulke/UlkeUygulamaSayfasi.tsx).
 */
import React from 'react'
import type { Metadata } from 'next'
import { UlkeUygulamaSayfasi } from '@/components/ulke/UlkeUygulamaSayfasi'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Page() {
  return <UlkeUygulamaSayfasi ekran="araclar" />
}
