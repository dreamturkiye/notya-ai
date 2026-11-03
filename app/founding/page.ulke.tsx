/**
 * AU-KURUCU-01 (Kaan, 2026-11-03) — /founding: the founding-doctor page (components/ulke/acilis/KurucuSayfasi.tsx), in
 * the landing page's look. Exists only where the country has a founding offer with page words (lib/billing/ulkeTicari.ts)
 * and lists /founding among its routes; otherwise not found.
 *
 * The "N of 20 founding places left" counter is read from Stripe through lib/billing/kurucuTeklifi.ts kurucuKalanKoltuk:
 * cached in memory for five minutes, never on an application hot path; unknown (no key, Stripe down) = no counter.
 */
import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { KurucuSayfasi } from '@/components/ulke/acilis/KurucuSayfasi'
import { UlkeKurucuGorseli } from '@/components/ulke/acilis'
import { acilis } from '@/lib/ulke/arayuz'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { yolMeta } from '@/lib/ulke/seo/meta'
import { ulkeTicari } from '@/lib/billing/ulkeTicari'
import { kurucuKalanKoltuk, type FiyatStripe } from '@/lib/billing/kurucuTeklifi'
import { getStripe } from '@/lib/billing/stripeClient'
import type { DilKodu } from '@/lib/ulke/tipler'

export const dynamic = 'force-dynamic'

function sayfa() {
  const a = acilis()
  const p = ulkePaketi()
  const t = ulkeTicari(p.kod as string)
  const r = p.rotalar
  if (!a || !ozellikAcik('acilisSayfasi') || !t?.kurucu || !t.kurucuSayfasi || r === 'hepsi' || !r.sayfalar.includes('/founding')) return null
  return { a, metin: t.kurucuSayfasi, dil: p.varsayilanDil as DilKodu }
}

export function generateMetadata(): Metadata {
  const s = sayfa()
  return s ? yolMeta('/founding', s.metin.meta.baslik, s.metin.meta.aciklama) : {}
}

export default async function UlkeKurucuSayfasi() {
  const s = sayfa()
  if (!s) notFound()
  let stripe: FiyatStripe | null = null
  try { stripe = getStripe() as unknown as FiyatStripe } catch { stripe = null }
  const kalan = await kurucuKalanKoltuk(stripe, ulkePaketi().kod as string)
  return <UlkeKurucuGorseli acilis={s.a} dil={s.dil} kalan={kalan} />
}
