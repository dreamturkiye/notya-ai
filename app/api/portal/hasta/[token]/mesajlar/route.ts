import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  AUTO_ACK_TEXT,
  loadPortalMessages,
  resolvePortalToken,
} from '@/lib/portal/messages'
import { pingDoctorNewMessage } from '@/lib/portal/notifyPractice'

export const dynamic = 'force-dynamic'

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })

  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })

  const messages = await loadPortalMessages(client, tok.patient_id)
  return NextResponse.json({ messages })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })

  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })

  let body: { konuId?: string; konu?: string; metin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const metin = String(body.metin || '').trim()
  if (!metin || metin.length > 4000) {
    return NextResponse.json({ error: 'Mesaj 1–4000 karakter olmalı.' }, { status: 400 })
  }

  const now = new Date().toISOString()
  let konuId = body.konuId ? String(body.konuId) : ''
  let isNew = false

  if (konuId) {
    const { data: existing } = await client
      .from('hasta_mesaj_konulari')
      .select('id')
      .eq('id', konuId)
      .eq('patient_id', tok.patient_id)
      .eq('doctor_id', tok.doctor_id)
      .maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Konu bulunamadı' }, { status: 404 })
  } else {
    const konu = String(body.konu || '').trim() || metin.slice(0, 80)
    const { data: created, error } = await client
      .from('hasta_mesaj_konulari')
      .insert({
        doctor_id: tok.doctor_id,
        patient_id: tok.patient_id,
        konu,
        hasta_klasor: 'gonderilen',
        son_mesaj_at: now,
        okundu_hasta: true,
        okundu_pratik: false,
      })
      .select('id')
      .single()
    if (error || !created) {
      return NextResponse.json({ error: 'Konu oluşturulamadı' }, { status: 500 })
    }
    konuId = created.id
    isNew = true
  }

  const { error: msgErr } = await client.from('hasta_mesajlar').insert({
    konu_id: konuId,
    taraf: 'hasta',
    yazar_user_id: null,
    metin,
  })
  if (msgErr) {
    return NextResponse.json({ error: 'Mesaj kaydedilemedi' }, { status: 500 })
  }

  if (isNew) {
    await client.from('hasta_mesajlar').insert({
      konu_id: konuId,
      taraf: 'klinik',
      yazar_user_id: null,
      metin: AUTO_ACK_TEXT,
    })
  }

  await client
    .from('hasta_mesaj_konulari')
    .update({
      son_mesaj_at: now,
      okundu_pratik: false,
      okundu_hasta: true,
      hasta_klasor: isNew ? 'gonderilen' : 'gonderilen',
      pratik_arsiv: false,
    })
    .eq('id', konuId)

  // Fire-and-forget style: await but never fail the patient response on ping errors
  try {
    await pingDoctorNewMessage(client, tok.doctor_id)
  } catch {
    /* ignore */
  }

  const messages = await loadPortalMessages(client, tok.patient_id)
  return NextResponse.json({ ok: true, konuId, messages })
}
