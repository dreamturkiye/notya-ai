/**
 * BELGE-NO-01 (Kaan, 2026-11-05) — /verify?c=<code>: THE PUBLIC VERIFICATION PAGE of a printed record, reached from the QR
 * code on the paper. It shows ONLY what is not patient data: the document number, the revision, the date, the doctor's
 * title and name, whether this revision is the current one, and the integrity hash of what was printed. Nothing else is
 * read (belge_dogrula returns nothing else). Rate-limited per address; never indexed; never cached.
 */
import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ULKE_STIL as S, UlkeKart } from '@/components/ulke/UlkeKart'
import { araclarMetni } from '@/lib/ulke/arayuz'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { sayfaDili, type AramaParametreleri } from '@/lib/ulke/sayfaDili'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { belgeDogrula } from '@/lib/belge/sunucu'
import { hizSiniri, istekIp } from '@/lib/belge/hizSiniri'
import { belgeIslevi } from '@/lib/ulke/belge/sunucu'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }
const SINIR = hizSiniri(30, 60_000)

export default async function DogrulamaSayfasi({ searchParams }: { searchParams?: AramaParametreleri & { c?: string } }) {
  const dil = sayfaDili(searchParams)
  let m
  try { m = araclarMetni(dil).dogrulama } catch { m = undefined }
  if (!m) notFound()
  const satir = (etiket: string, deger: string) => <p style={{ margin: '6px 0' }}><span style={{ color: '#6d6055' }}>{etiket}</span> <b>{deger}</b></p>
  let govde: React.ReactNode
  if (!SINIR.izinli(istekIp(headers()))) govde = <p role="alert">{m.cokFazla}</p>
  else {
    const kod = typeof searchParams?.c === 'string' ? searchParams.c.trim().toUpperCase() : ''
    const r = kod ? await belgeDogrula(belgeIslevi(ulkeServisSupabase()), kod) : null
    govde = !r ? <p role="alert">{m.bulunamadi}</p> : (
      <div>
        {satir(m.belgeNo, r.belgeNo)}
        {satir(m.rev, String(r.rev))}
        {satir(m.tarih, new Date(r.tarih).toISOString().slice(0, 10))}
        {satir(m.hekim, r.hekim)}
        <p style={{ margin: '10px 0', fontWeight: 700, color: r.guncel ? '#2E6E4E' : '#9a3412' }}>{r.guncel ? m.guncel : yerine(m.eski, String(r.guncelRev))}</p>
        {satir(m.ozet, r.ozet)}
      </div>
    )
  }
  return (
    <UlkeKart dil={dil} altBaslik={m.baslik} genislik={520}>
      <p style={S.alt}>{m.aciklama}</p>
      <div style={{ wordBreak: 'break-all' }}>{govde}</div>
    </UlkeKart>
  )
}
