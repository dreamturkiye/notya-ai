import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam, yoneticiDegil } from '@/lib/klinik/katman/sunucu'
import { odaAdiDogrula } from '@/lib/klinik/katman/kurulum'

export const dynamic = 'force-dynamic'

const TURLER = new Set(['muayene', 'tedavi', 'diger'])

export async function POST(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  if (!baglam.yonetici) return yoneticiDegil()
  const g = await req.json().catch(() => null) as { ad?: string; tur?: string } | null
  const hata = odaAdiDogrula(g?.ad || '')
  if (hata) return NextResponse.json({ error: hata }, { status: 400 })
  const tur = TURLER.has(g?.tur || '') ? g!.tur : 'muayene'
  const { data, error } = await baglam.supabase.from('clinic_odalar').insert({
    clinic_id: baglam.klinik.id, ad: g!.ad!.trim(), tur, aktif: true,
  }).select('id').single()
  if (error || !data) return NextResponse.json({ error: 'Oda eklenemedi.' }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  if (!baglam.yonetici) return yoneticiDegil()
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Oda yok.' }, { status: 400 })
  const { error } = await baglam.supabase.from('clinic_odalar').delete().eq('id', id).eq('clinic_id', baglam.klinik.id)
  if (error) return NextResponse.json({ error: 'Oda silinemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
