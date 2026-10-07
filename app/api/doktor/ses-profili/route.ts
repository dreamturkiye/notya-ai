/**
 * NOTYA-SES-PROFILI-01 — the signed-in doctor's own voice profile (one row). Not authentication.
 *
 * GET    → { var, profil?: number[256], model_surumu, riza_zamani, created_at, updated_at } (decrypted for its owner:
 *          the browser compares voices locally; the profile never goes anywhere else).
 * PUT    → { profil: number[256], model_surumu, riza: true } — explicit consent is required; stores ONLY the
 *          embedding, encrypted (encryptPII). No audio is ever accepted here.
 * DELETE → deletes the row immediately.
 * Scope: the doctor's own id from the session (pratikOturum + sadeceDoktor: a secretary never reaches it). No
 * patient or other id is read from the request. Patients are never enrolled.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decryptPII, encryptPII } from '@/lib/security/encryption'
import { SES_PROFILI_MODEL_SURUMU, profilGecerliMi } from '@/lib/asistan/sesProfili/ayar'

export const dynamic = 'force-dynamic'

const TABLO = 'doktor_ses_profilleri'

async function doktor(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return { hata: oturum.hata }
  const engel = sadeceDoktor(oturum)
  if (engel) return { hata: engel }
  return { supabase: oturum.supabase, doktorId: oturum.doktorId }
}

export async function GET(req: NextRequest) {
  const d = await doktor(req)
  if ('hata' in d) return d.hata
  const { data, error } = await d.supabase.from(TABLO)
    .select('profil_encrypted, model_surumu, riza_zamani, created_at, updated_at')
    .eq('doctor_id', d.doktorId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Ses profili okunamadı.' }, { status: 500 })
  if (!data) return NextResponse.json({ var: false }, { headers: { 'Cache-Control': 'no-store' } })
  let profil: number[] | null = null
  try {
    const p = JSON.parse(decryptPII(String(data.profil_encrypted || '')))
    profil = profilGecerliMi(p) ? p : null
  } catch { profil = null }
  return NextResponse.json({
    var: Boolean(profil),
    profil,
    model_surumu: data.model_surumu,
    riza_zamani: data.riza_zamani,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(req: NextRequest) {
  const d = await doktor(req)
  if ('hata' in d) return d.hata
  const govde = (await req.json().catch(() => null)) as { profil?: unknown; model_surumu?: unknown; riza?: unknown } | null
  if (!govde || govde.riza !== true) return NextResponse.json({ error: 'Açık rıza olmadan ses profili kaydedilmez.' }, { status: 400 })
  if (govde.model_surumu !== SES_PROFILI_MODEL_SURUMU || !profilGecerliMi(govde.profil)) {
    return NextResponse.json({ error: 'Ses profili geçersiz.' }, { status: 400 })
  }
  const simdi = new Date().toISOString()
  const { data: onceki } = await d.supabase.from(TABLO).select('created_at').eq('doctor_id', d.doktorId).maybeSingle()
  const { error } = await d.supabase.from(TABLO).upsert({
    doctor_id: d.doktorId,
    profil_encrypted: encryptPII(JSON.stringify(govde.profil)),
    model_surumu: SES_PROFILI_MODEL_SURUMU,
    riza_zamani: simdi,
    created_at: onceki?.created_at ?? simdi,
    updated_at: simdi,
  }, { onConflict: 'doctor_id' })
  if (error) return NextResponse.json({ error: 'Ses profili kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const d = await doktor(req)
  if ('hata' in d) return d.hata
  const { error } = await d.supabase.from(TABLO).delete().eq('doctor_id', d.doktorId)
  if (error) return NextResponse.json({ error: 'Ses profili silinemedi.' }, { status: 500 })
  const { data } = await d.supabase.from(TABLO).select('doctor_id').eq('doctor_id', d.doktorId).maybeSingle()
  if (data) return NextResponse.json({ error: 'Ses profili silinemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true, silindi: true })
}
