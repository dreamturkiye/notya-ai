/**
 * NOTYA-ULKE-01 — /signup: sign-up with an invitation code, for a country whose launch gates have not passed
 * (docs/COUNTRY-PACK-CHECKLIST.md, rule 9). Exists only where the pack switches `davetliKayit` on; anywhere else
 * this address is "not found", as it was before this page existed.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DavetliKayitFormu from '@/components/ulke/DavetliKayitFormu'
import { acilisCapasi, rolAdi, rolGruplari, uygulamaMetni } from '@/lib/ulke/arayuz'
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
  const a = uygulamaMetni(dil).ayarlar
  // KAYIT-BRANS-01 (Kaan, 2026-11-07): the specialty is a required choice of sign-up — this country's roles only (the
  // pack's list = its regulatory gate), in the pack's groups and the visitor's language. No roles → no question.
  const r = uygulamaMetni(dil).rol
  const grupAdi = { doktor: r.grupDoktor, 'klinik-hekim': r.grupKlinikHekim, 'klinik-muttefik': r.grupKlinikMuttefik } as const
  const bransGruplari = ozellikAcik('cekirdekMuayene')
    ? rolGruplari().map((g) => ({ ad: grupAdi[g.taraf], secenekler: g.roller.map((x) => ({ anahtar: x.anahtar, ad: rolAdi(x.anahtar, dil) ?? x.anahtar })) }))
    : []
  const brans = bransGruplari.length ? { etiket: r.etiket, sec: r.sec, gerekli: r.gerekli, gruplar: bransGruplari } : undefined
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
      brans={brans}
      meslek={{ etiket: a.meslekKaydi, izoh: a.meslekKaydiIzoh, gecersiz: a.meslekKaydiGecersiz }}
    />
  )
}
