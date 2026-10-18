import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam, yoneticiDegil } from '@/lib/klinik/katman/sunucu'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  if (!baglam.yonetici) return yoneticiDegil()
  const g = await req.json().catch(() => null) as { randevuId?: string; geldi?: boolean; paketDus?: boolean; takipNotu?: string } | null
  if (!g?.randevuId) return NextResponse.json({ error: 'Randevu yok.' }, { status: 400 })
  const randevu = await baglam.supabase
    .from('randevular')
    .select('id')
    .eq('id', g.randevuId)
    .in('doktor_id', baglam.doktorlar)
    .maybeSingle()
  if (!randevu.data) return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })
  const not = (g.takipNotu || '').trim().slice(0, 240)
  const { error } = await baglam.supabase.from('clinic_ziyaret_kapanis').upsert({
    clinic_id: baglam.klinik.id,
    randevu_id: g.randevuId,
    kapatan_id: baglam.userId,
    geldi: Boolean(g.geldi),
    paket_dus: Boolean(g.paketDus),
    takip_notu: not || null,
  }, { onConflict: 'clinic_id,randevu_id' })
  if (error) return NextResponse.json({ error: 'Kapanış yazılamadı.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
