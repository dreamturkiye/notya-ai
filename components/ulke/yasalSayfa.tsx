/**
 * NOTYA-ULKE-YASAL-01 — one policy page. The words come from the active pack. Holds no statute name of its own.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AKTIF_YASAL } from '@/countries/active/yasal'
import { ULKE_STIL as S, UlkeKart } from '@/components/ulke/UlkeKart'
import { ACIK_ROBOTS, betaNotu } from '@/lib/ulke/acikIcerik'
import { dilliYol, type AramaParametreleri } from '@/lib/ulke/sayfaDili'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { YASAL_YOLLAR, type YasalAnahtar, type YasalDilPaketi } from '@/lib/ulke/yasal/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'

function dilBul(ham: string | null): YasalDilPaketi | null {
  const k = AKTIF_YASAL
  if (!k?.diller.length) return null
  return k.diller.find((d) => d.kod === ham) ?? k.diller.find((d) => d.kod === ulkePaketi().varsayilanDil) ?? k.diller[0]
}

function sec(anahtar: YasalAnahtar, searchParams: AramaParametreleri) {
  const ham = searchParams?.dil
  const dil = dilBul(Array.isArray(ham) ? ham[0] : ham ?? null)
  const belge = dil?.belgeler.find((b) => b.anahtar === anahtar) ?? null
  return { dil, belge }
}

export function yasalSayfasi(anahtar: YasalAnahtar) {
  const yol = YASAL_YOLLAR[anahtar]
  function generateMetadata({ searchParams }: { searchParams?: AramaParametreleri }): Metadata {
    const { belge } = sec(anahtar, searchParams)
    return belge ? { title: `${belge.baslik} — Notya`, robots: ACIK_ROBOTS } : {}
  }
  function Sayfa({ searchParams }: { searchParams?: AramaParametreleri }) {
    const { dil, belge } = sec(anahtar, searchParams)
    if (!dil || !belge || !AKTIF_YASAL) notFound()
    const diller = AKTIF_YASAL.diller.map((d) => ({ kod: d.kod as DilKodu, ad: d.ad, href: dilliYol(yol, d.kod as DilKodu) }))
    return (
      <UlkeKart dil={dil.kod as DilKodu} genislik={820} anaSayfa={{ href: dilliYol('/', dil.kod as DilKodu), ad: dil.geri }} diller={diller}>
        <p style={S.bilgi} data-beta="evet">{betaNotu(dil.kod)}</p>
        <h1 style={{ margin: '16px 0 12px', fontSize: 28, lineHeight: 1.25 }}>{belge.baslik}</h1>
        <p style={S.bilgi}>{belge.inceleme}</p>
        {belge.bolumler.map((b) => (
          <section key={b.baslik}>
            <h2 style={{ margin: '28px 0 8px', fontSize: 18 }}>{b.baslik}</h2>
            {b.paragraflar.map((p, i) => <p key={i} style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6 }}>{p}</p>)}
          </section>
        ))}
        <nav style={{ ...S.alt, textAlign: 'left' }} aria-label={belge.baslik}>
          {dil.belgeler.map((b) => (
            <a key={b.anahtar} href={dilliYol(YASAL_YOLLAR[b.anahtar], dil.kod as DilKodu)} style={{ ...S.baglanti, display: 'inline-block', marginRight: 16 }}>{b.baslik}</a>
          ))}
        </nav>
      </UlkeKart>
    )
  }
  return { generateMetadata, Sayfa }
}
