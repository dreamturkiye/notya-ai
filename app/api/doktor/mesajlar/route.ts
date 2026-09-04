/**
 * Shared practice inbox — doktor + sekreter (pratikOturum).
 * GET  /api/doktor/mesajlar — list threads (+ optional ?unread=1)
 * POST /api/doktor/mesajlar — start thread to a patient { patientId, konu, metin }
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'

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

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const unreadOnly = new URL(req.url).searchParams.get('unread') === '1'

  let q = supabase
    .from('hasta_mesaj_konulari')
    .select('id, patient_id, konu, son_mesaj_at, okundu_pratik, pratik_arsiv, created_at')
    .eq('doctor_id', doktorId)
    .eq('pratik_arsiv', false)
    .order('son_mesaj_at', { ascending: false })
    .limit(100)

  if (unreadOnly) q = q.eq('okundu_pratik', false)

  const { data: konular, error } = await q
  if (error) return NextResponse.json({ error: 'Mesajlar alınamadı' }, { status: 500 })

  const list = konular || []
  const unreadCount = list.filter((k: { okundu_pratik: boolean }) => !k.okundu_pratik).length

  const enriched = await Promise.all(
    list.map(async (k: {
      id: string
      patient_id: string
      konu: string
      son_mesaj_at: string
      okundu_pratik: boolean
      created_at: string
    }) => {
      const { data: last } = await supabase
        .from('hasta_mesajlar')
        .select('metin, taraf, created_at')
        .eq('konu_id', k.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const hastaAdi = await patientLabel(supabase, k.patient_id)
      return {
        id: k.id,
        patientId: k.patient_id,
        hastaAdi,
        konu: k.konu,
        sonMesajAt: k.son_mesaj_at,
        okundu: k.okundu_pratik,
        ozet: last?.metin ? String(last.metin).slice(0, 140) : '',
        sonTaraf: last?.taraf || null,
      }
    })
  )

  return NextResponse.json({ threads: enriched, unreadCount })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user, rol } = oturum

  let body: { patientId?: string; konu?: string; metin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const patientId = String(body.patientId || '')
  const metin = String(body.metin || '').trim()
  const konu = String(body.konu || '').trim() || metin.slice(0, 80)
  if (!patientId || !metin) {
    return NextResponse.json({ error: 'patientId ve metin zorunlu' }, { status: 400 })
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!patient) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })

  const now = new Date().toISOString()
  const { data: created, error } = await supabase
    .from('hasta_mesaj_konulari')
    .insert({
      doctor_id: doktorId,
      patient_id: patientId,
      konu,
      hasta_klasor: 'gelen',
      son_mesaj_at: now,
      okundu_hasta: false,
      okundu_pratik: true,
    })
    .select('id')
    .single()

  if (error || !created) {
    return NextResponse.json({ error: 'Konu oluşturulamadı' }, { status: 500 })
  }

  await supabase.from('hasta_mesajlar').insert({
    konu_id: created.id,
    taraf: rol === 'sekreter' ? 'klinik' : 'doktor',
    yazar_user_id: user.id,
    metin,
  })

  return NextResponse.json({ ok: true, konuId: created.id })
}
