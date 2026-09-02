/**
 * NOTYA-INTAKE-01 — hasta bilgi formunu doldurma (PUBLIC — token kimlik doğrulamadır, oturum
 * gerektirmez, /davet/personel/[token] ile aynı desen).
 *
 * GET: token doğrula, doldurulacak şemayı (çekirdek + branşa özel sorular) ve karşılama için
 * hasta adını döndür.
 * POST: yanıtları TEK şifreli JSON blob olarak kaydet, durum='dolduruldu'.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { encrypt, decrypt } from '@/lib/security/encryption'
import { CORE_BOLUMLER } from '@/lib/intake/coreAlanlar'
import { BRANS_SORULARI, BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const supabase = servisSupabase()

  const { data: form } = await supabase
    .from('hasta_intake_formlari')
    .select('id, brans, durum, patient_id, token_expires_at, doktor_id')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!form) return NextResponse.json({ error: 'Form bulunamad\u0131.' }, { status: 404 })
  if (form.token_expires_at && new Date(form.token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Bu form linkinin s\u00fcresi dolmu\u015f. L\u00fctfen klini\u011finizle ileti\u015fime ge\u00e7in.' }, { status: 400 })
  }
  if (form.durum !== 'gonderildi') {
    return NextResponse.json({ error: 'Bu form zaten dolduruldu.' }, { status: 400 })
  }

  const { data: hasta } = await supabase
    .from('patients')
    .select('name_encrypted')
    .eq('id', form.patient_id)
    .maybeSingle()
  let hastaAdi = ''
  try { if (hasta?.name_encrypted) hastaAdi = (JSON.parse(decrypt(hasta.name_encrypted)).ad || '').trim() } catch { /* leave blank */ }

  const { data: doktor } = await supabase
    .from('users')
    .select('first_name, last_name, title')
    .eq('id', form.doktor_id)
    .maybeSingle()
  const doktorAdi = doktor ? [doktor.title, doktor.first_name, doktor.last_name].filter(Boolean).join(' ') : ''

  const bransKey = form.brans as SpecialtyKey
  const bransBolumu = BRANS_SORULARI[bransKey] || null
  const bransEtiket = BRANS_ETIKETLERI[bransKey] || null

  return NextResponse.json({
    hastaAdi,
    doktorAdi,
    coreBolumler: CORE_BOLUMLER,
    bransBolumu,
    bransEtiket,
  })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const supabase = servisSupabase()

  const { data: form } = await supabase
    .from('hasta_intake_formlari')
    .select('id, durum, token_expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!form) return NextResponse.json({ error: 'Form bulunamad\u0131.' }, { status: 404 })
  if (form.token_expires_at && new Date(form.token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Bu form linkinin s\u00fcresi dolmu\u015f.' }, { status: 400 })
  }
  if (form.durum !== 'gonderildi') {
    return NextResponse.json({ error: 'Bu form zaten dolduruldu.' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const { yanitlar } = body as { yanitlar?: Record<string, unknown> }
  if (!yanitlar || typeof yanitlar !== 'object') {
    return NextResponse.json({ error: 'Yan\u0131tlar zorunludur.' }, { status: 400 })
  }
  if (yanitlar.kvkkOnay !== 'Kabul ediyorum' || yanitlar.tedaviOnay !== 'Onayl\u0131yorum') {
    return NextResponse.json({ error: 'KVKK ve tedavi onay\u0131 olmadan form g\u00f6nderilemez.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('hasta_intake_formlari')
    .update({
      form_data_encrypted: encrypt(JSON.stringify(yanitlar)),
      durum: 'dolduruldu',
      dolduruldu_at: new Date().toISOString(),
    })
    .eq('id', form.id)

  if (error) return NextResponse.json({ error: 'Form kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ basarili: true })
}
