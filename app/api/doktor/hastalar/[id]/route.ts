import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { encrypt, decrypt } from '@/lib/security/encryption'
import {
  cinsiyetSakla,
  notlardanOzetAlanlari,
  notesOzetGuncelle,
} from '@/lib/doktor/hastaOzetKayit'

export const dynamic = 'force-dynamic'

function coz(v: string | null | undefined): string {
  if (!v) return ''
  try {
    return decrypt(v)
  } catch {
    return ''
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single()

  if (error || !patient) {
    return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  }

  let name = 'Bilinmiyor'
  let dob: string | null = null
  let gender: string | null = null
  let phone: string | null = null
  let email: string | null = null
  let notesData: Record<string, unknown> = {}
  try {
    if (patient.name_encrypted) name = JSON.parse(decrypt(patient.name_encrypted)).ad || 'Bilinmiyor'
  } catch { /* ignore */ }
  try {
    if (patient.dob_encrypted) dob = decrypt(patient.dob_encrypted)
  } catch { /* ignore */ }
  try {
    if (patient.gender_encrypted) gender = decrypt(patient.gender_encrypted)
  } catch { /* ignore */ }
  try {
    if (patient.phone_encrypted) phone = decrypt(patient.phone_encrypted)
  } catch { /* ignore */ }
  try {
    if (patient.email_encrypted) email = decrypt(patient.email_encrypted)
  } catch { /* ignore */ }
  try {
    if (patient.notes_encrypted) notesData = JSON.parse(decrypt(patient.notes_encrypted))
  } catch { /* ignore */ }

  const ozet = notlardanOzetAlanlari(notesData, {
    ad_soyad: name,
    dogum_tarihi: dob,
    cinsiyetHam: gender,
    telefon: phone,
    eposta: email,
  })

  return NextResponse.json({
    patient: {
      id: patient.id,
      ...ozet,
      anne_boy_cm:
        typeof notesData.anneBoyCm === 'number'
          ? notesData.anneBoyCm
          : notesData.anneBoyCm != null
            ? Number(notesData.anneBoyCm) || null
            : null,
      baba_boy_cm:
        typeof notesData.babaBoyCm === 'number'
          ? notesData.babaBoyCm
          : notesData.babaBoyCm != null
            ? Number(notesData.babaBoyCm) || null
            : null,
      is_active: patient.is_active,
      created_at: patient.created_at,
    },
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const body = await req.json()

  const { data: mevcut, error: okumaHata } = await supabase
    .from('patients')
    .select('id, notes_encrypted, email_encrypted')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (okumaHata || !mevcut) {
    return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.ad_soyad !== undefined) {
    const ad = String(body.ad_soyad || '').trim()
    if (ad) updateData.name_encrypted = encrypt(JSON.stringify({ ad }))
  }
  if (body.dogum_tarihi !== undefined) {
    const d = String(body.dogum_tarihi || '').trim()
    updateData.dob_encrypted = d ? encrypt(d) : null
  }
  if (body.cinsiyet !== undefined) {
    const sakla = cinsiyetSakla(body.cinsiyet)
    updateData.gender_encrypted = sakla ? encrypt(sakla) : null
  }
  if (body.telefon !== undefined) {
    const t = String(body.telefon || '').trim()
    updateData.phone_encrypted = t ? encrypt(t) : null
  }
  if (body.eposta !== undefined) {
    const e = String(body.eposta || '').trim()
    updateData.email_encrypted = e ? encrypt(e) : null
  }

  let notes: Record<string, unknown> = {}
  try {
    notes = JSON.parse(coz(mevcut.notes_encrypted) || '{}')
  } catch {
    notes = {}
  }
  const { notes: yeniNotes, notesDegisti } = notesOzetGuncelle(notes, body)
  if (notesDegisti) {
    updateData.notes_encrypted = encrypt(JSON.stringify(yeniNotes))
  }

  const { data, error } = await supabase
    .from('patients')
    .update(updateData)
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
