/**
 * NOTYA-RANDEVU-V2 — 'Hasta Portalı Randevu' settings (Entegrasyonlar card).
 *
 * GET    → { ayar, istisnalar, tabloVar } — doktor and sekreter (the secretary may see whether it is on).
 * PUT    { ayar }                           — doctor only: the switch and the booking policy.
 * POST   { baslangicGun, bitisGun }         — doctor only: add an izin range (whole Istanbul days, inclusive).
 * DELETE ?id=                               — doctor only: remove one izin range.
 * Working hours stay where they live today: /api/doktor/calisma-saatleri (doktor_calisma_saatleri).
 * Every read and write is scoped by doktorId (pratikOturum); no patient data here.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { ayarNormalize, ayarSatiri } from '@/lib/randevu/v2/ayar'
import { ayarGetir } from '@/lib/randevu/v2/sunucu'
import { gunEkle, istanbulYerelUtc } from '@/lib/randevu/v2/zaman'

export const dynamic = 'force-dynamic'

const GUN = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const ayar = await ayarGetir(supabase, doktorId)
  const { data, error } = await supabase.from('randevu_istisnalari').select('id, baslangic, bitis, neden')
    .eq('doktor_id', doktorId).gt('bitis', new Date().toISOString()).order('baslangic', { ascending: true }).limit(100)
  const tabloVar = !(error && tabloYokMu(error))
  return NextResponse.json({ ayar, istisnalar: data || [], tabloVar })
}

export async function PUT(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const red = sadeceDoktor(oturum)
  if (red) return red
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const ayar = ayarNormalize((body as { ayar?: unknown }).ayar)
  const { error } = await supabase.from('randevu_portal_ayarlari').upsert(ayarSatiri(doktorId, ayar), { onConflict: 'doktor_id' })
  if (error) {
    return NextResponse.json(
      { error: tabloYokMu(error) ? 'Bu özellik henüz etkin değil.' : 'Ayarlar kaydedilemedi.' },
      { status: tabloYokMu(error) ? 503 : 500 },
    )
  }
  return NextResponse.json({ ayar })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const red = sadeceDoktor(oturum)
  if (red) return red
  const { supabase, doktorId } = oturum

  const b = (await req.json().catch(() => ({}))) as { baslangicGun?: string; bitisGun?: string }
  const bas = String(b.baslangicGun || '')
  const son = String(b.bitisGun || bas)
  if (!GUN.test(bas) || !GUN.test(son) || son < bas) {
    return NextResponse.json({ error: 'Geçerli bir tarih aralığı seçin.' }, { status: 400 })
  }
  const { data, error } = await supabase.from('randevu_istisnalari').insert({
    doktor_id: doktorId,
    baslangic: new Date(istanbulYerelUtc(bas, 0)).toISOString(),
    bitis: new Date(istanbulYerelUtc(gunEkle(son, 1), 0)).toISOString(),
    neden: 'izin',
  }).select('id, baslangic, bitis, neden').single()
  if (error) return NextResponse.json({ error: 'İzin kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ istisna: data })
}

export async function DELETE(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const red = sadeceDoktor(oturum)
  if (red) return red
  const { supabase, doktorId } = oturum

  const id = new URL(req.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  const { error } = await supabase.from('randevu_istisnalari').delete().eq('id', id).eq('doktor_id', doktorId)
  if (error) return NextResponse.json({ error: 'İzin silinemedi.' }, { status: 500 })
  return NextResponse.json({ silindi: true })
}
