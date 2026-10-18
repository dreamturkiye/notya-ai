import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam, yoneticiDegil } from '@/lib/klinik/katman/sunucu'
import { yerlestirmeReddi, type KlinikRandevu } from '@/lib/klinik/katman/takvim'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  if (!baglam.yonetici) return yoneticiDegil()
  const g = await req.json().catch(() => null) as { randevuId?: string; odaId?: string | null } | null
  if (!g?.randevuId) return NextResponse.json({ error: 'Randevu yok.' }, { status: 400 })
  const randevu = await baglam.supabase
    .from('randevular')
    .select('id, doktor_id, baslangic, bitis, durum')
    .eq('id', g.randevuId)
    .in('doktor_id', baglam.doktorlar)
    .maybeSingle()
  if (!randevu.data || randevu.data.durum === 'iptal') return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })
  const odaId = g.odaId || null
  if (odaId) {
    const oda = await baglam.supabase.from('clinic_odalar').select('id').eq('id', odaId).eq('clinic_id', baglam.klinik.id).eq('aktif', true).maybeSingle()
    if (!oda.data) return NextResponse.json({ error: 'Oda bulunamadı.' }, { status: 404 })
  }
  const komsu = await baglam.supabase
    .from('randevular')
    .select('id, doktor_id, klinik_oda_id, baslangic, bitis')
    .in('doktor_id', baglam.doktorlar)
    .neq('durum', 'iptal')
    .lt('baslangic', randevu.data.bitis)
    .gt('bitis', randevu.data.baslangic)
  if (komsu.error) return NextResponse.json({ error: 'Çakışma kontrolü yapılamadı.' }, { status: 500 })
  const mevcut: KlinikRandevu[] = (komsu.data || []).map((r) => ({
    id: r.id, doktorId: r.doktor_id, odaId: r.klinik_oda_id, bas: Date.parse(r.baslangic), son: Date.parse(r.bitis),
  }))
  const red = yerlestirmeReddi(mevcut, {
    id: randevu.data.id,
    doktorId: randevu.data.doktor_id,
    odaId,
    bas: Date.parse(randevu.data.baslangic),
    son: Date.parse(randevu.data.bitis),
  })
  if (red) return NextResponse.json({ error: red === 'oda' ? 'Bu oda o saatte dolu.' : 'Bu hekimin saati dolu.' }, { status: 409 })
  const { error } = await baglam.supabase.from('randevular').update({ klinik_oda_id: odaId }).eq('id', randevu.data.id).eq('doktor_id', randevu.data.doktor_id)
  if (error) return NextResponse.json({ error: 'Oda bağlanamadı.' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
