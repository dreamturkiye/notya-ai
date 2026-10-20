/**
 * NOTYA-SIFRE-SIFIRLA-01 (Kaan, 2026-10-20) — /password-reset: completes the forgot-password email link for a
 * country build. Exists only where the login page itself does (`cekirdekGiris`) — same gate, same reasoning.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SifreSifirlaFormu from '@/components/ulke/SifreSifirlaFormu'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { yuzeyMetinleri } from '@/lib/ulke/metin'
import { dilliYol, dilSecenekleri, sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function PasswordResetPage({ searchParams }: { searchParams?: AramaParametreleri }) {
  if (!ozellikAcik('cekirdekGiris')) notFound()
  const dil = sayfaDili(searchParams)
  const girisMetni = yuzeyMetinleri('giris', dil)
  return (
    <SifreSifirlaFormu
      dil={dil}
      diller={dilSecenekleri('/password-reset')}
      anaSayfa={dilliYol('/', dil)}
      anaSayfaAdi={girisMetni.anaSayfa}
      girisHref={dilliYol('/login', dil)}
    />
  )
}
