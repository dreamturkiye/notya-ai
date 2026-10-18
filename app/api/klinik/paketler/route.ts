import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam, yoneticiDegil } from '@/lib/klinik/katman/sunucu'
import { paketDogrula, planDogrula } from '@/lib/klinik/katman/kurulum'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  if (!baglam.yonetici) return yoneticiDegil()
  const g = await req.json().catch(() => null) as { tur?: string; ad?: string; seans?: number; ucretKurus?: number; taksit?: number; pesinatKurus?: number; paketId?: string } | null
  if (g?.tur === 'plan') {
    const hata = planDogrula({ ad: g.ad || '', taksit: Number(g.taksit), pesinatKurus: Number(g.pesinatKurus || 0) })
    if (hata) return NextResponse.json({ error: hata }, { status: 400 })
    const { data, error } = await baglam.supabase.from('clinic_odeme_planlari').insert({
      clinic_id: baglam.klinik.id,
      paket_id: g.paketId || null,
      ad: g.ad!.trim(),
      taksit: g.taksit,
      pesinat_kurus: g.pesinatKurus || 0,
    }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'Plan eklenemedi.' }, { status: 500 })
    return NextResponse.json({ id: data.id })
  }
  const hata = paketDogrula({ ad: g?.ad || '', seans: Number(g?.seans), ucretKurus: Number(g?.ucretKurus || 0) })
  if (hata) return NextResponse.json({ error: hata }, { status: 400 })
  const { data, error } = await baglam.supabase.from('clinic_paketler').insert({
    clinic_id: baglam.klinik.id, ad: g!.ad!.trim(), seans: g!.seans, ucret_kurus: g!.ucretKurus || 0, aktif: true,
  }).select('id').single()
  if (error || !data) return NextResponse.json({ error: 'Paket eklenemedi.' }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
