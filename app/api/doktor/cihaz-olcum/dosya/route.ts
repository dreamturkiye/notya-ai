/**
 * NOTYA-BLE-02 — device FILES (Cihaz Köprüsü, transport T2).
 * Stethoscope recordings (Eko/Littmann), ECG PDFs (Eko CORE 500 / Kardia), ultrasound images (Butterfly/Clarius)
 * arrive as files shared from the vendor app. They go into the encrypted patient vault (same store as every
 * other belge) tagged category='cihaz-kaydi', plus a cihaz_olcumleri audit row with belge_id → the document.
 * POST multipart: dosya, patientId, notId?, tur (steteskop|ekg|usg|diger), cihazAd?, transport (share-target|dosya-import)
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { uploadDocument, VaultValidationError, VaultAccessError } from '@/lib/vault/service'

export const dynamic = 'force-dynamic'

const TURLER: Record<string, string> = { steteskop: 'Steteskop kaydı', ekg: 'EKG', usg: 'Ultrason görüntüsü', diger: 'Cihaz çıktısı' }

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  const dosya = form.get('dosya')
  const patientId = String(form.get('patientId') || '')
  const notId = String(form.get('notId') || '') || null
  const tur = String(form.get('tur') || 'diger')
  const cihazAd = String(form.get('cihazAd') || '').trim().slice(0, 120)
  const transport = String(form.get('transport') || 'dosya-import') === 'share-target' ? 'share-target' : 'dosya-import'
  if (!patientId) return NextResponse.json({ error: 'Hasta seçimi zorunludur' }, { status: 400 })
  if (!(dosya instanceof File)) return NextResponse.json({ error: 'Dosya zorunludur' }, { status: 400 })
  if (!TURLER[tur]) return NextResponse.json({ error: 'Geçersiz cihaz türü' }, { status: 400 })

  const { data: hasta } = await supabase.from('patients').select('id').eq('id', patientId).eq('doctor_id', user.id).maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })

  try {
    const bytes = Buffer.from(await dosya.arrayBuffer())
    let visitId: string | null = null
    if (notId) {
      const { data: not } = await supabase.from('notes').select('session_id').eq('id', notId).eq('doctor_id', user.id).maybeSingle()
      visitId = not?.session_id ? String(not.session_id) : null
    }
    const document = await uploadDocument(
      { supabase },
      {
        doctorId: user.id, patientId, visitId,
        fileName: dosya.name || `cihaz-${tur}`,
        fileType: dosya.type || 'application/octet-stream',
        bytes,
        notes: [TURLER[tur], cihazAd].filter(Boolean).join(' · '),
        category: 'cihaz-kaydi',
        uploadedBy: user.id,
      }
    )
    const { error } = await supabase.from('cihaz_olcumleri').insert({
      doctor_id: user.id, patient_id: patientId, note_id: notId, tur,
      deger: null, birim: null,
      ayrinti: { dosyaAdi: document.fileName, mime: document.fileType, boyut: document.fileSize },
      belge_id: document.id, kaynak: 'dosya', transport,
      profil: cihazAd ? `${cihazAd} dosyası` : 'Cihaz dosyası',
      cihaz: { ad: cihazAd || null }, onaylandi: true,
    })
    if (error) return NextResponse.json({ error: 'Kayıt yazılamadı (belge yüklendi)' }, { status: 500 })
    return NextResponse.json({ ok: true, document }, { status: 201 })
  } catch (e) {
    if (e instanceof VaultValidationError) return NextResponse.json({ error: e.message }, { status: 400 })
    if (e instanceof VaultAccessError) return NextResponse.json({ error: e.message }, { status: 403 })
    return NextResponse.json({ error: 'Dosya yüklenemedi' }, { status: 500 })
  }
}
