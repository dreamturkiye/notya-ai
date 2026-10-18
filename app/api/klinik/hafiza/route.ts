import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam } from '@/lib/klinik/katman/sunucu'
import { hafizaKarti } from '@/lib/klinik/katman/motor'
import { gorunurZiyaretler, ziyaretOzeti } from '@/lib/klinik/katman/takvim'
import { istanbulAn } from '@/lib/randevu/v2/zaman'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  const randevuId = new URL(req.url).searchParams.get('randevuId') || ''
  if (!randevuId) return NextResponse.json({ error: 'Randevu yok.' }, { status: 400 })
  const randevu = await baglam.supabase
    .from('randevular')
    .select('id, doktor_id, patient_id, baslangic, tur, durum')
    .eq('id', randevuId)
    .in('doktor_id', baglam.doktorlar)
    .maybeSingle()
  if (randevu.error) return NextResponse.json({ error: 'Randevu okunamadı.' }, { status: 500 })
  if (!randevu.data) return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })
  if (!baglam.yonetici && randevu.data.doktor_id !== baglam.userId) {
    return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })
  }
  const hastaId = randevu.data.patient_id
  const gecmis = hastaId
    ? await baglam.supabase
      .from('randevular')
      .select('id, doktor_id, baslangic, tur, durum')
      .eq('patient_id', hastaId)
      .in('doktor_id', baglam.doktorlar)
      .neq('durum', 'iptal')
      .order('baslangic', { ascending: false })
      .limit(12)
    : { data: [], error: null }
  if (gecmis.error) return NextResponse.json({ error: 'Geçmiş okunamadı.' }, { status: 500 })
  const kisiler = await baglam.supabase.from('users').select('id, full_name').in('id', baglam.doktorlar)
  const ad = new Map((kisiler.data || []).map((k) => [k.id, k.full_name || 'Hekim']))
  const ziyaretler = gorunurZiyaretler(baglam.yonetici, baglam.userId, (gecmis.data || []).map((r) => ({
    doktorId: r.doktor_id,
    tarih: istanbulAn(r.baslangic).gun,
    ozet: `${ad.get(r.doktor_id) || 'Hekim'} · ${ziyaretOzeti(r.tur, r.durum)}`,
  })))
  const kapanis = await baglam.supabase
    .from('clinic_ziyaret_kapanis')
    .select('takip_notu, geldi')
    .eq('clinic_id', baglam.klinik.id)
    .eq('randevu_id', randevuId)
    .maybeSingle()
  const takipler = kapanis.data?.takip_notu
    ? [{ sahip: ad.get(randevu.data.doktor_id) || 'Klinik', metin: String(kapanis.data.takip_notu).slice(0, 240) }]
    : []
  const kart = hafizaKarti({
    ziyaretler,
    takipler,
    paket: null,
    gelmeler: (gecmis.data || []).map((r) => ({ tarih: istanbulAn(r.baslangic).gun, gelmedi: r.durum === 'gelmedi' })),
  })
  return NextResponse.json({ kart, kapanis: kapanis.data ? { geldi: kapanis.data.geldi } : null })
}
