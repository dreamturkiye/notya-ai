/**
 * Hasta dış film yükler → taslak. Hekim Onayla olmadan portala geri yansımaz.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { uploadDocument, VaultValidationError } from '@/lib/vault/service'
import {
  goruntuYuklemeReddi,
  modalityFinalIcin,
  tipGecerli,
  type GoruntuTip,
} from '@/lib/doktor/goruntuCalisma'

export const dynamic = 'force-dynamic'

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) }, auth: { persistSession: false } })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })
  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })
  const locked = requirePortalUnlock(req, params.token, tok)
  if (locked) return locked

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  const tipHam = String(form?.get('tip') || 'diger')
  if (!(file instanceof File) || !tipGecerli(tipHam)) {
    return NextResponse.json({ error: 'Dosya ve tip gerekli.' }, { status: 400 })
  }
  const tip = tipHam as GoruntuTip
  const red = goruntuYuklemeReddi({ name: file.name, type: file.type, size: file.size, tip })
  if (red) return NextResponse.json({ error: red }, { status: 400 })

  try {
    const bytes = Buffer.from(await file.arrayBuffer())
    const doc = await uploadDocument({ supabase: client }, {
      doctorId: tok.doctor_id,
      patientId: tok.patient_id,
      fileName: file.name || 'hasta-film',
      fileType: file.type || 'image/jpeg',
      bytes,
      category: `Görüntüler · ${tip}`,
      uploadedBy: tok.doctor_id,
    })
    const { data, error } = await client.from('goruntu_calisma').insert({
      patient_id: tok.patient_id,
      doctor_id: tok.doctor_id,
      tip,
      modalite: modalityFinalIcin(tip, String(form?.get('modalite') || '') || null),
      bolge: String(form?.get('bolge') || '').slice(0, 80) || null,
      tarih: new Date().toISOString().slice(0, 10),
      kaynak: 'hasta_yukleme',
      belge_id: doc.id,
      calisma_id: randomUUID(),
      onay_durum: 'taslak',
    }).select('id').single()
    if (error || !data) return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id, durum: 'taslak' }, { status: 201 })
  } catch (e) {
    if (e instanceof VaultValidationError) return NextResponse.json({ error: e.message }, { status: 400 })
    return NextResponse.json({ error: 'Yüklenemedi' }, { status: 500 })
  }
}
