import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam } from '@/lib/klinik/katman/sunucu'
import { akisDurumu, takvimHastaAdi } from '@/lib/klinik/katman/takvim'
import { gunEkle, istanbulYerelUtc } from '@/lib/randevu/v2/zaman'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

function adCoz(sifreli: string | null): string {
  if (!sifreli) return ''
  try {
    const ad = JSON.parse(decrypt(sifreli)).ad
    return typeof ad === 'string' ? ad.trim() : ''
  } catch {
    return ''
  }
}

export async function GET(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  const gun = new URL(req.url).searchParams.get('gun') || ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gun)) return NextResponse.json({ error: 'Gün YYYY-AA-GG olmalı.' }, { status: 400 })
  const bas = new Date(istanbulYerelUtc(gun, 0)).toISOString()
  const son = new Date(istanbulYerelUtc(gunEkle(gun, 1), 0)).toISOString()
  const randevular = await baglam.supabase
    .from('randevular')
    .select('id, doktor_id, patient_id, hasta_adi_serbest, baslangic, bitis, tur, durum, klinik_oda_id')
    .in('doktor_id', baglam.doktorlar)
    .gte('baslangic', bas)
    .lt('baslangic', son)
    .neq('durum', 'iptal')
    .order('baslangic')
  if (randevular.error) return NextResponse.json({ error: 'Takvim okunamadı.' }, { status: 500 })
  const adiniGorur = (doktorId: string) => baglam.yonetici || doktorId === baglam.userId
  const hastaIdleri = Array.from(new Set((randevular.data || []).filter((r) => adiniGorur(r.doktor_id)).map((r) => r.patient_id).filter(Boolean)))
  const hastalar = hastaIdleri.length
    ? await baglam.supabase.from('patients').select('id, doctor_id, name_encrypted').in('id', hastaIdleri).in('doctor_id', baglam.doktorlar)
    : { data: [] }
  const hastaAd = new Map<string, string>()
  for (const h of hastalar.data || []) hastaAd.set(h.id, adCoz(h.name_encrypted))
  const kisiler = await baglam.supabase.from('users').select('id, full_name').in('id', baglam.doktorlar)
  const doktorAd = new Map((kisiler.data || []).map((k) => [k.id, k.full_name || 'Hekim']))
  const odalar = await baglam.supabase.from('clinic_odalar').select('id, ad').eq('clinic_id', baglam.klinik.id).eq('aktif', true)
  const satirlar = (randevular.data || []).map((r) => ({
    id: r.id,
    doktorId: r.doktor_id,
    doktorAd: doktorAd.get(r.doktor_id) || 'Hekim',
    odaId: r.klinik_oda_id,
    bas: r.baslangic,
    son: r.bitis,
    tur: r.tur,
    durum: r.durum,
    hasta: takvimHastaAdi(
      baglam.yonetici,
      baglam.userId,
      r.doktor_id,
      r.hasta_adi_serbest || (r.patient_id ? hastaAd.get(r.patient_id) : '') || 'Hasta',
    ),
  }))
  const akis = akisDurumu(Date.now(), satirlar.map((s) => ({
    id: s.id, doktorId: s.doktorId, bas: Date.parse(s.bas), son: Date.parse(s.son), durum: s.durum,
  })))
  return NextResponse.json({
    gun,
    ben: baglam.userId,
    yonetici: baglam.yonetici,
    odalar: odalar.data || [],
    randevular: satirlar,
    akis: {
      odada: akis.odada.map((s) => s.id),
      siradaki: akis.siradaki?.id || null,
      geciken: akis.geciken.map((s) => s.id),
    },
  })
}
