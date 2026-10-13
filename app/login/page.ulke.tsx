/**
 * NOTYA-ULKE-01 — /login: the core login page, in the languages of the country this deployment serves.
 *
 * Exists only where the country's pack switches it on (`cekirdekGiris`). In the pre-split application (Türkiye
 * today) this address never reaches here: next.config.mjs redirects /login to /giris, as before.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GirisFormu from '@/components/ulke/GirisFormu'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { yuzeyMetinleri } from '@/lib/ulke/metin'
import { dilliYol, dilSecenekleri, sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'
import { UYGULAMA_EKRANLARI } from '@/lib/ulke/tipler'
import { ulkeYolu } from '@/lib/ulke/yol'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function LoginPage({ searchParams }: { searchParams?: AramaParametreleri }) {
  if (!ozellikAcik('cekirdekGiris')) notFound()
  const dil = sayfaDili(searchParams)
  return (
    <GirisFormu
      dil={dil}
      metin={yuzeyMetinleri('giris', dil)}
      ret={yuzeyMetinleri('hesap', dil).girisReddi}
      diller={dilSecenekleri('/login')}
      anaSayfa={dilliYol('/', dil)}
      kayit={ozellikAcik('davetliKayit') ? dilliYol('/signup', dil) : null}
      sonra={ulkeYolu(ozellikAcik('cekirdekMuayene') ? UYGULAMA_EKRANLARI.bugun : '/welcome')}
    />
  )
}
