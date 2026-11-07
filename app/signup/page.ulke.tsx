/**
 * NOTYA-ULKE-01 — /signup: sign-up with an invitation code, for a country whose launch gates have not passed
 * (docs/COUNTRY-PACK-CHECKLIST.md, rule 9) — or without one where the pack opens sign-up (`uygulama.kayitAcik`). Exists only where the pack switches `davetliKayit` on; anywhere else
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

// STRIPE-NOTYA-AU-02: the 3 solo-doctor plan keys this build's Stripe catalog actually prices
// (lib/billing/stripePlans.ts) — Klinik/Kurumsal are out of scope here, same boundary as main's /kayit fix.
// STRIPE-NOTYA-AU-05: + the founding offer (`sesli_pro_founding`, with `interval=month|year`).
const SELF_SERVE_PLAN_KEYS = new Set(['metin_asistan', 'sesli_pro', 'muayenehane', 'sesli_pro_founding'])

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
  // STRIPE-NOTYA-AU-02: /api/ulke/kayit creates the account server-side and returns no session (by design —
  // the browser never gets a service-role-issued token), so there is nowhere to call checkout from right here.
  // The doctor's first real session is their first /login right after. Carry the chosen plan forward on that
  // link; GirisFormu drives checkout from there once it actually has a session.
  const planHam = typeof searchParams?.plan === 'string' ? searchParams.plan : null
  const plan = planHam && SELF_SERVE_PLAN_KEYS.has(planHam) ? planHam : null
  const aralik = searchParams?.interval === 'year' ? 'year' : null
  const girisYolu = dilliYol('/login', dil)
  return (
    <DavetliKayitFormu
      kodGerekli={kayitKoduGerekliMi(ulkePaketi())}
      dil={dil}
      metin={yuzeyMetinleri('davetliKayit', dil)}
      anaSayfaAdi={yuzeyMetinleri('giris', dil).anaSayfa}
      diller={dilSecenekleri('/signup')}
      anaSayfa={dilliYol('/', dil)}
      giris={plan ? `${girisYolu}${girisYolu.includes('?') ? '&' : '?'}plan=${plan}${aralik ? `&interval=${aralik}` : ''}` : girisYolu}
      fiyat={dilliYol('/', dil, acilisCapasi('narx') ? `#${acilisCapasi('narx')}` : '')}
      cokDeneme={yuzeyMetinleri('giris', dil).cokDeneme}
      brans={brans}
      meslek={ulkePaketi().uzanti?.muayenehane?.meslekKaydiTasi ? undefined : { etiket: a.meslekKaydi, izoh: a.meslekKaydiIzoh, gecersiz: a.meslekKaydiGecersiz }}
    />
  )
}
