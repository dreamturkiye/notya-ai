/**
 * GET  /api/doktor/mesajlar/[konuId] — thread + messages; marks practice-read
 * POST /api/doktor/mesajlar/[konuId] — reply { metin }
 * DELETE /api/doktor/mesajlar/[konuId] — { mesajId } sil (ekler CASCADE)
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { notifyPatientNewPracticeMessage } from '@/lib/portal/notifyPatientEmail'
import { mesajEkleriGetir } from '@/lib/portal/mesajEk'

export const dynamic = 'force-dynamic'

async function patientLabel(supabase: any, patientId: string): Promise<string> {
  const { data } = await supabase
    .from('patients')
    .select('name_encrypted')
    .eq('id', patientId)
    .maybeSingle()
  if (!data?.name_encrypted) return 'Hasta'
  try {
    const raw = decrypt(data.name_encrypted)
    const parsed = JSON.parse(raw) as { ad?: string }
    return (parsed.ad || raw || 'Hasta').trim() || 'Hasta'
  } catch {
    return 'Hasta'
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { konuId: string } }
) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { data: konu } = await supabase
    .from('hasta_mesaj_konulari')
    .select('id, patient_id, konu, son_mesaj_at, okundu_pratik, created_at')
    .eq('id', params.konuId)
    .eq('doctor_id', doktorId)
    .maybeSingle()

  if (!konu) return NextResponse.json({ error: 'Konu bulunamadı' }, { status: 404 })

  await supabase
    .from('hasta_mesaj_konulari')
    .update({ okundu_pratik: true })
    .eq('id', konu.id)

  const { data: msgs } = await supabase
    .from('hasta_mesajlar')
    .select('id, taraf, metin, created_at, yazar_user_id')
    .eq('konu_id', konu.id)
    .order('created_at', { ascending: true })

  const hastaAdi = await patientLabel(supabase, konu.patient_id)
  const ekMap = await mesajEkleriGetir(supabase, (msgs || []).map((m: { id: string }) => m.id))

  return NextResponse.json({
    thread: {
      id: konu.id,
      patientId: konu.patient_id,
      hastaAdi,
      konu: konu.konu,
      sonMesajAt: konu.son_mesaj_at,
    },
    messages: (msgs || []).map((m: { id: string; taraf: string; metin: string; created_at: string }) => ({
      id: m.id,
      taraf: m.taraf,
      metin: m.metin,
      tarih: m.created_at,
      kimden:
        m.taraf === 'hasta' ? hastaAdi : m.taraf === 'klinik' ? 'Klinik' : 'Doktor',
      ekler: ekMap.get(m.id) || [],
    })),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { konuId: string } }
) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user, rol } = oturum

  let body: { metin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const metin = String(body.metin || '').trim()
  if (!metin || metin.length > 4000) {
    return NextResponse.json({ error: 'Mesaj 1–4000 karakter olmalı.' }, { status: 400 })
  }

  const { data: konu } = await supabase
    .from('hasta_mesaj_konulari')
    .select('id, patient_id')
    .eq('id', params.konuId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!konu) return NextResponse.json({ error: 'Konu bulunamadı' }, { status: 404 })

  const now = new Date().toISOString()
  const { error } = await supabase.from('hasta_mesajlar').insert({
    konu_id: konu.id,
    taraf: rol === 'sekreter' ? 'klinik' : 'doktor',
    yazar_user_id: user.id,
    metin,
  })
  if (error) return NextResponse.json({ error: 'Yanıt kaydedilemedi' }, { status: 500 })

  await supabase
    .from('hasta_mesaj_konulari')
    .update({
      son_mesaj_at: now,
      okundu_hasta: false,
      okundu_pratik: true,
      hasta_klasor: 'gelen',
      pratik_arsiv: false,
    })
    .eq('id', konu.id)

  try {
    await notifyPatientNewPracticeMessage(supabase, {
      doctorId: doktorId,
      patientId: konu.patient_id,
      konuId: konu.id,
    })
  } catch {
    /* never fail the reply on queue errors */
  }

  return NextResponse.json({ ok: true })
}

/** Delete one message (attachments CASCADE). Empty thread is removed. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { konuId: string } }
) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  let body: { mesajId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const mesajId = String(body.mesajId || '').trim()
  if (!mesajId) return NextResponse.json({ error: 'mesajId gerekli' }, { status: 400 })

  const { data: konu } = await supabase
    .from('hasta_mesaj_konulari')
    .select('id')
    .eq('id', params.konuId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!konu) return NextResponse.json({ error: 'Konu bulunamadı' }, { status: 404 })

  const { data: msg } = await supabase
    .from('hasta_mesajlar')
    .select('id')
    .eq('id', mesajId)
    .eq('konu_id', konu.id)
    .maybeSingle()
  if (!msg) return NextResponse.json({ error: 'Mesaj bulunamadı' }, { status: 404 })

  const { error } = await supabase.from('hasta_mesajlar').delete().eq('id', mesajId)
  if (error) return NextResponse.json({ error: 'Mesaj silinemedi' }, { status: 500 })

  const { count } = await supabase
    .from('hasta_mesajlar')
    .select('id', { count: 'exact', head: true })
    .eq('konu_id', konu.id)
  if (!count) {
    await supabase.from('hasta_mesaj_konulari').delete().eq('id', konu.id)
    return NextResponse.json({ ok: true, konuSilindi: true })
  }
  return NextResponse.json({ ok: true, konuSilindi: false })
}
