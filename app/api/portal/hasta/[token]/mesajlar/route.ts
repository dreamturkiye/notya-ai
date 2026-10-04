import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  AUTO_ACK_TEXT,
  loadPortalMessages,
  resolvePortalToken,
} from '@/lib/portal/messages'
import { MESAJ_EK_AZAMI, VaultValidationError, mesajEkleriYukle } from '@/lib/portal/mesajEk'
import { pingDoctorNewMessage } from '@/lib/portal/notifyPractice'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'

export const dynamic = 'force-dynamic'
/** Multipart message + attachments (vault 4 MB each). */
export const runtime = 'nodejs'

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) }, auth: { persistSession: false } })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })

  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })

  const locked = requirePortalUnlock(req, params.token, tok)
  if (locked) return locked

  const messages = await loadPortalMessages(client, tok.patient_id, tok.doctor_id)
  return NextResponse.json({ messages })
}

/** Mark a thread as read by the patient (clears bekleyen mesaj on home). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })

  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })

  const locked = requirePortalUnlock(req, params.token, tok)
  if (locked) return locked

  let body: { konuId?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const konuId = String(body.konuId || '').trim()
  if (!konuId || body.action !== 'read') {
    return NextResponse.json({ error: 'konuId ve action=read gerekli' }, { status: 400 })
  }

  const { data: konu } = await client
    .from('hasta_mesaj_konulari')
    .select('id')
    .eq('id', konuId)
    .eq('patient_id', tok.patient_id)
    .eq('doctor_id', tok.doctor_id)
    .maybeSingle()

  if (!konu) return NextResponse.json({ error: 'Konu bulunamadı' }, { status: 404 })

  await client
    .from('hasta_mesaj_konulari')
    .update({ okundu_hasta: true })
    .eq('id', konuId)

  const messages = await loadPortalMessages(client, tok.patient_id, tok.doctor_id)
  return NextResponse.json({ ok: true, messages })
}

async function okuGovde(req: NextRequest): Promise<{
  konuId?: string
  konu?: string
  metin: string
  files: Array<{ fileName: string; fileType: string; bytes: Buffer }>
}> {
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData()
    const metin = String(fd.get('metin') || '').trim()
    const konuId = fd.get('konuId') ? String(fd.get('konuId')) : undefined
    const konu = fd.get('konu') ? String(fd.get('konu')) : undefined
    const raw = [...fd.getAll('ek'), ...fd.getAll('file')].filter((x): x is File => typeof File !== 'undefined' && x instanceof File)
    const files: Array<{ fileName: string; fileType: string; bytes: Buffer }> = []
    for (const f of raw.slice(0, MESAJ_EK_AZAMI)) {
      const ab = await f.arrayBuffer()
      files.push({ fileName: f.name || 'belge', fileType: f.type || '', bytes: Buffer.from(ab) })
    }
    return { konuId, konu, metin, files }
  }
  let body: { konuId?: string; konu?: string; metin?: string }
  try {
    body = await req.json()
  } catch {
    throw new Error('Geçersiz istek')
  }
  return {
    konuId: body.konuId ? String(body.konuId) : undefined,
    konu: body.konu ? String(body.konu) : undefined,
    metin: String(body.metin || '').trim(),
    files: [],
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })

  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })

  const locked = requirePortalUnlock(req, params.token, tok)
  if (locked) return locked

  let govde: Awaited<ReturnType<typeof okuGovde>>
  try {
    govde = await okuGovde(req)
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const metin = govde.metin || (govde.files.length ? '📎 Dosya eki' : '')
  if (!metin || metin.length > 4000) {
    return NextResponse.json({ error: 'Mesaj 1–4000 karakter olmalı veya en az bir dosya ekleyin.' }, { status: 400 })
  }
  if (govde.files.length > MESAJ_EK_AZAMI) {
    return NextResponse.json({ error: `En fazla ${MESAJ_EK_AZAMI} dosya ekleyebilirsiniz.` }, { status: 400 })
  }

  const now = new Date().toISOString()
  let konuId = govde.konuId ? String(govde.konuId) : ''
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
    const konu = String(govde.konu || '').trim() || metin.slice(0, 80)
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

  const { data: msg, error: msgErr } = await client
    .from('hasta_mesajlar')
    .insert({
      konu_id: konuId,
      taraf: 'hasta',
      yazar_user_id: null,
      metin,
    })
    .select('id')
    .single()
  if (msgErr || !msg) {
    return NextResponse.json({ error: 'Mesaj kaydedilemedi' }, { status: 500 })
  }

  if (govde.files.length) {
    try {
      await mesajEkleriYukle(client, {
        mesajId: msg.id,
        doctorId: tok.doctor_id,
        patientId: tok.patient_id,
        files: govde.files,
      })
    } catch (e) {
      await client.from('hasta_mesajlar').delete().eq('id', msg.id)
      if (isNew) await client.from('hasta_mesaj_konulari').delete().eq('id', konuId)
      const err = e instanceof VaultValidationError ? e.message : 'Dosya eklenemedi'
      return NextResponse.json({ error: err }, { status: 400 })
    }
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
      hasta_klasor: 'gonderilen',
      pratik_arsiv: false,
    })
    .eq('id', konuId)

  try {
    await pingDoctorNewMessage(client, tok.doctor_id)
  } catch {
    /* ignore */
  }

  const messages = await loadPortalMessages(client, tok.patient_id, tok.doctor_id)
  return NextResponse.json({ ok: true, konuId, messages })
}
