import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { cinsiyetTr } from '@/lib/utils/cinsiyet'
import { hesaplaHedefBoy } from '@/lib/clinical/hedefBoy'

export const dynamic = 'force-dynamic'

function notlariCoz(notesEncrypted: string | null | undefined): Record<string, unknown> {
  if (!notesEncrypted) return {}
  try {
    return JSON.parse(decrypt(notesEncrypted)) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, name_encrypted, gender_encrypted, notes_encrypted')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single()

  if (error || !patient) {
    return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  }

  let ad = 'Hasta'
  try {
    if (patient.name_encrypted) ad = JSON.parse(decrypt(patient.name_encrypted)).ad || 'Hasta'
  } catch { /* ignore */ }
  let cinsiyetHam: string | null = null
  try {
    if (patient.gender_encrypted) cinsiyetHam = decrypt(patient.gender_encrypted)
  } catch { /* ignore */ }

  const notlar = notlariCoz(patient.notes_encrypted)
  const anneBoyCm = notlar.anneBoyCm ?? null
  const babaBoyCm = notlar.babaBoyCm ?? null
  const hesap = anneBoyCm != null && babaBoyCm != null
    ? hesaplaHedefBoy({ anneBoy: Number(anneBoyCm), babaBoy: Number(babaBoyCm), cinsiyet: cinsiyetHam })
    : null

  return NextResponse.json({
    hastaId: patient.id,
    ad,
    cinsiyet: cinsiyetTr(cinsiyetHam),
    anneBoyCm,
    babaBoyCm,
    sonuc: hesap && hesap.ok ? hesap.sonuc : null,
    hata: hesap && !hesap.ok ? hesap.hata : null,
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const body = await req.json().catch(() => ({})) as { anneBoy?: unknown; babaBoy?: unknown; cinsiyet?: unknown }

  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, gender_encrypted, notes_encrypted')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single()

  if (error || !patient) {
    return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  }

  let cinsiyetHam: string | null = null
  try {
    if (patient.gender_encrypted) cinsiyetHam = decrypt(patient.gender_encrypted)
  } catch { /* ignore */ }

  const kayitli = hesaplaHedefBoy({
    anneBoy: body.anneBoy as string | number,
    babaBoy: body.babaBoy as string | number,
    cinsiyet: cinsiyetHam || String(body.cinsiyet || ''),
  })
  if (!kayitli.ok) {
    return NextResponse.json({ error: kayitli.hata }, { status: 400 })
  }

  const notlar = notlariCoz(patient.notes_encrypted)
  notlar.anneBoyCm = kayitli.sonuc.anneCm
  notlar.babaBoyCm = kayitli.sonuc.babaCm

  const { error: upErr } = await supabase
    .from('patients')
    .update({
      notes_encrypted: encrypt(JSON.stringify(notlar)),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('doctor_id', user.id)

  if (upErr) {
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sonuc: kayitli.sonuc, anneBoyCm: kayitli.sonuc.anneCm, babaBoyCm: kayitli.sonuc.babaCm })
}
