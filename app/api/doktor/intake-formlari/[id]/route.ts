/**
 * NOTYA-INTAKE-01 — tekil form: doldurulmuş yanıtları görüntüle, "incelendi" olarak işaretle.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { data: form } = await supabase
    .from('hasta_intake_formlari')
    .select('*')
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .maybeSingle()
  if (!form) return NextResponse.json({ error: 'Form bulunamad\u0131.' }, { status: 404 })

  let yanitlar: Record<string, unknown> = {}
  try { if (form.form_data_encrypted) yanitlar = JSON.parse(decrypt(form.form_data_encrypted)) } catch { /* leave empty */ }

  return NextResponse.json({
    form: {
      id: form.id,
      brans: form.brans,
      durum: form.durum,
      gonderildiAt: form.gonderildi_at,
      doldurulduAt: form.dolduruldu_at,
      incelendiAt: form.incelendi_at,
      yanitlar,
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user } = oturum

  const { data, error } = await supabase
    .from('hasta_intake_formlari')
    .update({ durum: 'incelendi', incelendi_at: new Date().toISOString(), incelendi_by: user.id })
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .eq('durum', 'dolduruldu')
    .select('id')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Form g\u00fcncellenemedi.' }, { status: 500 })
  return NextResponse.json({ basarili: true })
}
