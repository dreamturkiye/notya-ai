/**
 * Hasta görüntü ceketi — liste + yükleme. Orijinal vault'ta kalır; analiz mevcut POST.
 * HASTA-IZOLASYON: hastaSahibiMi önce; her sorgu doctor_id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { uploadDocument, VaultAccessError, VaultValidationError } from '@/lib/vault/service'
import {
  altTipSecilmeli,
  goruntuYuklemeReddi,
  modalityFinalIcin,
  tipGecerli,
  type GoruntuKaynak,
  type GoruntuTip,
} from '@/lib/doktor/goruntuCalisma'

export const dynamic = 'force-dynamic'

const SEC: GoruntuKaynak[] = ['klinik_yukleme', 'hasta_yukleme', 'dicom', 'hastane_link']

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId gerekli' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, user.id, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const { data, error } = await supabase
    .from('goruntu_calisma')
    .select('id, tip, modalite, bolge, tarih, kaynak, belge_id, calisma_id, dicom_var, asistan_analiz_id, onay_durum, seans_id, hekim_yorum, hastane_link, created_at')
    .eq('doctor_id', user.id)
    .eq('patient_id', patientId)
    .order('tarih', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(80)
  if (error) return NextResponse.json({ error: 'Liste alınamadı' }, { status: 500 })
  return NextResponse.json({
    calismalar: data || [],
    urlTtlSn: 15 * 60,
    dipnot: 'Bu hastanın filmleri.',
  })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'form gerekli' }, { status: 400 })
  const patientId = String(form.get('patientId') || '')
  const tipHam = String(form.get('tip') || '')
  if (!patientId || !tipGecerli(tipHam)) {
    return NextResponse.json({ error: 'Hasta ve tip (XR/EKG/Göz/Derm/MG/US) zorunlu.' }, { status: 400 })
  }
  const tip = tipHam as GoruntuTip
  if (!(await hastaSahibiMi(supabase, user.id, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const file = form.get('file')
  const hastaneLink = String(form.get('hastaneLink') || '').trim() || null
  const kaynak = (SEC.includes(String(form.get('kaynak') || '') as GoruntuKaynak)
    ? String(form.get('kaynak'))
    : 'klinik_yukleme') as GoruntuKaynak
  const bolge = String(form.get('bolge') || '').trim().slice(0, 80) || null
  const tarih = String(form.get('tarih') || '').slice(0, 10) || null
  const seansId = String(form.get('seansId') || '') || null
  const calismaId = String(form.get('calismaId') || '') || randomUUID()
  const altHam = String(form.get('modalite') || '') || null
  if (altTipSecilmeli(tip) && !altHam) {
    return NextResponse.json({ error: 'Alt tip seçin (PA akciğer, kemik, fundus…).' }, { status: 400 })
  }
  const modalite = modalityFinalIcin(tip, altHam)

  let belgeId: string | null = null
  let dicomVar = false
  if (file instanceof File) {
    const red = goruntuYuklemeReddi({ name: file.name, type: file.type, size: file.size, tip })
    if (red) return NextResponse.json({ error: red }, { status: 400 })
    dicomVar = /\.dcm$/i.test(file.name) || file.type === 'application/dicom'
    try {
      const bytes = Buffer.from(await file.arrayBuffer())
      const doc = await uploadDocument({ supabase }, {
        doctorId: user.id,
        patientId,
        visitId: seansId,
        fileName: file.name || 'goruntu',
        fileType: file.type || 'image/jpeg',
        bytes,
        category: `Görüntüler · ${tip}`,
        notes: bolge,
        uploadedBy: user.id,
      })
      belgeId = doc.id
    } catch (e) {
      if (e instanceof VaultValidationError) return NextResponse.json({ error: e.message }, { status: 400 })
      if (e instanceof VaultAccessError) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
      return NextResponse.json({ error: 'Dosya kasaya yazılamadı' }, { status: 500 })
    }
  } else if (!hastaneLink) {
    return NextResponse.json({ error: 'Dosya veya hastane bağlantısı gerekli.' }, { status: 400 })
  }

  const { data, error } = await supabase.from('goruntu_calisma').insert({
    patient_id: patientId,
    doctor_id: user.id,
    tip,
    modalite,
    bolge,
    tarih: tarih || new Date().toISOString().slice(0, 10),
    kaynak: hastaneLink && !belgeId ? 'hastane_link' : kaynak,
    belge_id: belgeId,
    calisma_id: calismaId,
    dicom_var: dicomVar,
    onay_durum: 'taslak',
    seans_id: seansId,
    hastane_link: hastaneLink,
  }).select('id, tip, modalite, bolge, tarih, kaynak, belge_id, calisma_id, onay_durum, created_at').single()
  if (error || !data) return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  return NextResponse.json({ calisma: data }, { status: 201 })
}
