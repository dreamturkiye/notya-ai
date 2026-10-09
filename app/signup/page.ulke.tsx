/**
 * NOTYA-ULKE-01 — /signup: sign-up with an invitation code, for a country whose launch gates have not passed
 * (docs/COUNTRY-PACK-CHECKLIST.md, rule 9). Exists only where the pack switches `davetliKayit` on; anywhere else
 * this address is "not found", as it was before this page existed.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DavetliKayitFormu from '@/components/ulke/DavetliKayitFormu'
import { acilisCapasi } from '@/lib/ulke/arayuz'
import { kayitKoduGerekliMi } from '@/lib/ulke/davet'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { yuzeyMetinleri } from '@/lib/ulke/metin'
import { dilliYol, dilSecenekleri, sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function SignupPage({ searchParams }: { searchParams?: AramaParametreleri }) {
  if (!ozellikAcik('davetliKayit')) notFound()
  const dil = sayfaDili(searchParams)
  return (
    <DavetliKayitFormu
      kodGerekli={kayitKoduGerekliMi(ulkePaketi())}
      dil={dil}
      metin={yuzeyMetinleri('davetliKayit', dil)}
      anaSayfaAdi={yuzeyMetinleri('giris', dil).anaSayfa}
      diller={dilSecenekleri('/signup')}
      anaSayfa={dilliYol('/', dil)}
      giris={dilliYol('/login', dil)}
      fiyat={dilliYol('/', dil, acilisCapasi('narx') ? `#${acilisCapasi('narx')}` : '')}
    />
  )
}
