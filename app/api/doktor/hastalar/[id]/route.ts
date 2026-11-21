import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { encrypt, decrypt } from '@/lib/security/encryption'
import { hastaAramaIndeksiniGuncelle } from '@/lib/doktor/hastaAramaIndeksi'
import {
  cinsiyetSakla,
  notlardanOzetAlanlari,
  notesOzetGuncelle,
} from '@/lib/doktor/hastaOzetKayit'
import { klinikOzetleriNotesOku } from '@/lib/doktor/hastaKlinikOzet'
import { izinVarMi } from '@/lib/doktor/personelYetki'
import { FORM_AKTARIM_ILETISIM, formdanDosyayaFark } from '@/lib/intake/formdanDosyaya'
import { veliDiliMi } from '@/lib/specialties/kapsam'

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
  // NOTYA-SEKRETER-01: sekreter bağlı hekimin hasta dosyasını okuyabilir.
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum

  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', params.id)
    .eq('doctor_id', doktorId)
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
  const klinik = klinikOzetleriNotesOku(notesData)

  // FORM-DOSYA-AKTAR-01 (2026-11-21): "Formdan dosyaya aktar" — on request only (never on the patient-file hot path):
  // the latest submitted Hasta Bilgi Formu of THIS patient under THIS doctor (patient already proven ours above), as a
  // diff against the card. Decrypted here; nothing is written — the doctor confirms rows and they go through PUT.
  if (req.nextUrl.searchParams.get('formAktarim') === '1') {
    if (!izinVarMi(rol, 'hasta.dosya.yaz') && !izinVarMi(rol, 'hasta.dosya.oku')) return NextResponse.json({ formAktarim: null })
    const { data: formlar } = await supabase
      .from('hasta_intake_formlari')
      .select('id, form_data_encrypted, dolduruldu_at, created_at')
      .eq('patient_id', patient.id)
      .eq('doktor_id', doktorId)
      .not('form_data_encrypted', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
    const form = (formlar?.[0] ?? null) as { id: string; form_data_encrypted: string | null; dolduruldu_at: string | null; created_at: string | null } | null
    if (!form?.form_data_encrypted) return NextResponse.json({ formAktarim: { formVar: false, satirlar: [] } })
    let yanit: Record<string, unknown> = {}
    try { yanit = JSON.parse(decrypt(form.form_data_encrypted) || '{}') } catch { yanit = {} }
    let satirlar = formdanDosyayaFark(yanit, ozet, { veli: veliDiliMi({ hastaDogumIso: ozet.dogum_tarihi }) })
    // A role that may not write the clinical file is offered identity + contact rows only (same rule as PUT).
    if (!izinVarMi(rol, 'hasta.dosya.yaz')) satirlar = satirlar.filter((s) => FORM_AKTARIM_ILETISIM.includes(s.alan))
    return NextResponse.json({ formAktarim: { formVar: true, formTarihi: form.dolduruldu_at || form.created_at, satirlar } })
  }

  // MOBIL-PERSONEL-01: a role that may not read the clinical file (hasta_danismani) gets identity + contact only —
  // no history, allergies, medications, clinical summaries or parental heights.
  if (!izinVarMi(rol, 'hasta.dosya.oku')) {
    return NextResponse.json({
      patient: {
        id: patient.id,
        ad_soyad: ozet.ad_soyad,
        dogum_tarihi: ozet.dogum_tarihi,
        cinsiyet: ozet.cinsiyet,
        telefon: ozet.telefon,
        eposta: ozet.eposta,
        sehir: ozet.sehir,
        anne_adi: ozet.anne_adi,
        baba_adi: ozet.baba_adi,
        adres: ozet.adres,
        dogum_yeri: ozet.dogum_yeri,
        veli_adi: ozet.veli_adi,
        veli_yakinlik: ozet.veli_yakinlik,
        veli_telefon: ozet.veli_telefon,
        acil_kisi_adi: ozet.acil_kisi_adi,
        acil_kisi_yakinlik: ozet.acil_kisi_yakinlik,
        acil_kisi_telefon: ozet.acil_kisi_telefon,
        is_active: patient.is_active,
        created_at: patient.created_at,
      },
    })
  }

  return NextResponse.json({
    patient: {
      id: patient.id,
      ...ozet,
      genel_ozet: klinik.genelOzet,
      son_muayene_ozeti: klinik.sonMuayeneOzeti,
      klinik_ozet_guncelleme: klinik.klinikOzetGuncelleme,
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
  // NOTYA-SEKRETER-01: ön büro iletişim/kimlik güncellemesi — kapsam doktorId.
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum

  const bodyHam = await req.json()
  // MOBIL-PERSONEL-01: without clinical-file write access only identity + contact fields are accepted.
  const ILETISIM_ALANLARI = ['ad_soyad', 'dogum_tarihi', 'cinsiyet', 'telefon', 'eposta', 'sehir', 'anne_adi', 'baba_adi',
    // FORM-DOSYA-AKTAR-01: the card's new contact fields (insurance stays clinical-file only).
    'adres', 'dogum_yeri', 'veli_adi', 'veli_yakinlik', 'veli_telefon', 'acil_kisi_adi', 'acil_kisi_yakinlik', 'acil_kisi_telefon']
  const body = izinVarMi(rol, 'hasta.dosya.yaz')
    ? bodyHam
    : Object.fromEntries(Object.entries(bodyHam || {}).filter(([k]) => ILETISIM_ALANLARI.includes(k)))

  const { data: mevcut, error: okumaHata } = await supabase
    .from('patients')
    .select('id, notes_encrypted, email_encrypted')
    .eq('id', params.id)
    .eq('doctor_id', doktorId)
    .maybeSingle()

  if (okumaHata || !mevcut) {
    return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  let yeniAd: string | null = null

  if (body.ad_soyad !== undefined) {
    const ad = String(body.ad_soyad || '').trim()
    if (ad) { updateData.name_encrypted = encrypt(JSON.stringify({ ad })); yeniAd = ad }
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
    .eq('doctor_id', doktorId)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
  }

  if (yeniAd) await hastaAramaIndeksiniGuncelle(supabase, doktorId, data.id, yeniAd)

  return NextResponse.json({ ok: true, id: data.id })
}
