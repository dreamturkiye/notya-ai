/**
 * AU-BETA-01 — a policy page that belongs to one pack's extension (`uzanti.belgeler`), outside the shared policy-document
 * set. Same look as the shared policy pages. Not found where the pack brings no such page.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ULKE_STIL as S, UlkeKart } from '@/components/ulke/UlkeKart'
import { ACIK_ROBOTS, betaNotu } from '@/lib/ulke/acikIcerik'
import { ulkePaketi } from '@/lib/ulke/ulke'
import type { DilKodu } from '@/lib/ulke/tipler'

export function uzantiBelgesi(slug: string) {
  const belge = () => ulkePaketi().uzanti?.belgeler?.[slug] ?? null
  function generateMetadata(): Metadata {
    const b = belge()
    return b ? { title: `${b.baslik} — Notya`, robots: ACIK_ROBOTS } : {}
  }
  function Sayfa() {
    const b = belge()
    if (!b) notFound()
    const dil = ulkePaketi().varsayilanDil as DilKodu
    return (
      <UlkeKart dil={dil} genislik={820} anaSayfa={{ href: '/', ad: 'Home' }} diller={[]}>
        <p style={S.bilgi} data-beta="evet">{betaNotu(dil)}</p>
        <h1 style={{ margin: '16px 0 12px', fontSize: 28, lineHeight: 1.25 }}>{b!.baslik}</h1>
        <p style={S.bilgi}>{b!.inceleme}</p>
        {b!.bolumler.map((x) => (
          <section key={x.baslik}>
            <h2 style={{ margin: '28px 0 8px', fontSize: 18 }}>{x.baslik}</h2>
            {x.paragraflar.map((p, i) => <p key={i} style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6 }}>{p}</p>)}
          </section>
        ))}
      </UlkeKart>
    )
  }
  return { generateMetadata, Sayfa }
}
