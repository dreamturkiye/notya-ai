/**
 * NOTYA-ULKE-01 — /signup: sign-up with an invitation code, for a country whose launch gates have not passed
 * (docs/COUNTRY-PACK-CHECKLIST.md, rule 9). Exists only where the pack switches `davetliKayit` on; anywhere else
 * this address is "not found", as it was before this page existed.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DavetliKayitFormu from '@/components/ulke/DavetliKayitFormu'
import { acilisCapasi, uygulamaMetni } from '@/lib/ulke/arayuz'
import { kayitKoduGerekliMi } from '@/lib/ulke/davet'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { yuzeyMetinleri } from '@/lib/ulke/metin'
import { dilliYol, dilSecenekleri, sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'
import { ulkeKabukViewport } from '@/lib/ulke/kabuk'

export const dynamic = 'force-dynamic'
export const viewport = ulkeKabukViewport()
export const metadata: Metadata = { robots: { index: false, follow: false } }

// STRIPE-NOTYA-AU-02: the 3 solo-doctor plan keys this build's Stripe catalog actually prices
// (lib/billing/stripePlans.ts) — Klinik/Kurumsal are out of scope here, same boundary as main's /kayit fix.
const SELF_SERVE_PLAN_KEYS = new Set(['metin_asistan', 'sesli_pro', 'muayenehane'])

export default function SignupPage({ searchParams }: { searchParams?: AramaParametreleri }) {
  if (!ozellikAcik('davetliKayit')) notFound()
  const dil = sayfaDili(searchParams)
  const a = uygulamaMetni(dil).ayarlar
  // STRIPE-NOTYA-AU-02: /api/ulke/kayit creates the account server-side and returns no session (by design —
  // the browser never gets a service-role-issued token), so there is nowhere to call checkout from right here.
  // The doctor's first real session is their first /login right after. Carry the chosen plan forward on that
  // link; GirisFormu drives checkout from there once it actually has a session.
  const planHam = typeof searchParams?.plan === 'string' ? searchParams.plan : null
  const plan = planHam && SELF_SERVE_PLAN_KEYS.has(planHam) ? planHam : null
  const girisYolu = dilliYol('/login', dil)
  return (
    <DavetliKayitFormu
      kodGerekli={kayitKoduGerekliMi(ulkePaketi())}
      dil={dil}
      metin={yuzeyMetinleri('davetliKayit', dil)}
      anaSayfaAdi={yuzeyMetinleri('giris', dil).anaSayfa}
      diller={dilSecenekleri('/signup')}
      anaSayfa={dilliYol('/', dil)}
      giris={plan ? `${girisYolu}${girisYolu.includes('?') ? '&' : '?'}plan=${plan}` : girisYolu}
      fiyat={dilliYol('/', dil, acilisCapasi('narx') ? `#${acilisCapasi('narx')}` : '')}
      meslek={ulkePaketi().uzanti?.muayenehane?.meslekKaydiTasi ? undefined : { etiket: a.meslekKaydi, izoh: a.meslekKaydiIzoh, gecersiz: a.meslekKaydiGecersiz }}
    />
  )
}
