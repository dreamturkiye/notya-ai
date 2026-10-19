import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { SAC_FOTO_KATEGORI } from '@/lib/doktor/belgeTurleri'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import { listDocuments, uploadDocument, VaultValidationError } from '@/lib/vault/service'
import { portalSatirlari } from '@/lib/klinik/ozelAracCalistir'
import {
  SAC_FOTO_ARAC,
  cekimPenceresi,
  fotoDosyaDurumu,
  fotoNotCoz,
  fotoNotu,
  fotoRolMu,
  type FotoKayit,
} from '@/specialties/sac-ekimi/engines/fotoDosya'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function sacDoktorMu(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from('users').select('specialty').eq('id', userId).maybeSingle()
  const specialty = data && typeof data === 'object' && 'specialty' in data ? String(data.specialty || '') : ''
  return klinikSlugCoz(specialty) === 'sac-ekimi'
}

function kayitlar(notes: Array<string | null>, ids: string[]): FotoKayit[] {
  const out: FotoKayit[] = []
  notes.forEach((n, i) => {
    const coz = fotoNotCoz(n)
    if (coz) out.push({ ...coz, id: ids[i] })
  })
  return out
}

async function sahipMi(supabase: SupabaseClient, userId: string, patientId: string): Promise<boolean> {
  return (await hastaSahibiMi(supabase, userId, patientId)) && (await sacDoktorMu(supabase, userId))
}

async function durumYaz(supabase: SupabaseClient, userId: string, patientId: string, islem: string) {
  const belgeler = await listDocuments({ supabase }, userId, { patientId })
  const dosyalar = kayitlar(belgeler.map((b) => b.notes), belgeler.map((b) => b.id)).filter((d) => d.islem === islem)
  const durum = fotoDosyaDurumu(islem, dosyalar)
  if ('hata' in durum) return { durum: null, uyari: durum.hata, dosyalar }
  const bugun = new Date().toISOString().slice(0, 10)
  const hatir = durum.hatirlatma
  const portal = portalSatirlari(hatir ? [hatir] : [], bugun)
  const { error } = await supabase.from('ozel_brans_plan').upsert({
    patient_id: patientId,
    doctor_id: userId,
    slug: 'sac-ekimi',
    arac: SAC_FOTO_ARAC,
    ozet: durum.ozet.slice(0, 800),
    portal_satir: portal,
    vadeler: hatir ? [hatir] : [],
    acil: null,
    riza: dosyalar.length > 0,
    girdi: { islem },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'doctor_id,patient_id,arac' })
  return { durum, uyari: error ? 'Hatırlatma yazılamadı.' : '', dosyalar }
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  const islem = req.nextUrl.searchParams.get('islem') || ''
  if (!(await sahipMi(supabase, user.id, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  try {
    const belgeler = await listDocuments({ supabase }, user.id, { patientId })
    const dosyalar = kayitlar(belgeler.map((b) => b.notes), belgeler.map((b) => b.id))
      .filter((d) => !islem || d.islem === islem)
    const durum = islem ? fotoDosyaDurumu(islem, dosyalar) : null
    return NextResponse.json({
      dosyalar: dosyalar.map((d) => ({ id: d.id, rol: d.rol, islem: d.islem, cekim: d.cekim })),
      durum: durum && !('hata' in durum) ? durum : null,
    })
  } catch {
    return NextResponse.json({ error: 'Fotoğraflar okunamadı.' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const jsonMu = (req.headers.get('content-type') || '').includes('application/json')
  if (jsonMu) {
    const body = await req.json().catch(() => null) as { patientId?: string; islem?: string } | null
    const patientId = String(body?.patientId || '')
    const islem = String(body?.islem || '')
    if (!(await sahipMi(supabase, user.id, patientId))) {
      return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    }
    try {
      const yaz = await durumYaz(supabase, user.id, patientId, islem)
      if (!yaz.durum) return NextResponse.json({ error: yaz.uyari || 'İşlem gününü girin.' }, { status: 400 })
      return NextResponse.json({ ok: true, durum: yaz.durum, uyari: yaz.uyari })
    } catch {
      return NextResponse.json({ error: 'Hatırlatma yazılamadı.' }, { status: 503 })
    }
  }

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Dosya zorunludur.' }, { status: 400 })
  const patientId = String(form.get('patientId') || '')
  const rol = String(form.get('rol') || '')
  const islem = String(form.get('islem') || '')
  const cekim = String(form.get('cekim') || '')
  const file = form.get('file')
  if (!(await sahipMi(supabase, user.id, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  if (form.get('riza') !== '1') return NextResponse.json({ error: 'Fotoğraf için ayrı KVKK rızası zorunlu.' }, { status: 400 })
  if (!fotoRolMu(rol)) return NextResponse.json({ error: 'Fotoğraf rolü yok.' }, { status: 400 })
  const pencere = cekimPenceresi(rol, islem, cekim)
  if (pencere !== true) return NextResponse.json({ error: pencere }, { status: 400 })
  if (!(file instanceof File)) return NextResponse.json({ error: 'Dosya zorunludur.' }, { status: 400 })
  try {
    const bytes = Buffer.from(await file.arrayBuffer())
    const belge = await uploadDocument({ supabase }, {
      doctorId: user.id,
      patientId,
      visitId: null,
      fileName: file.name || `${rol}.jpg`,
      fileType: file.type || 'image/jpeg',
      bytes,
      notes: fotoNotu(rol, islem, cekim),
      category: SAC_FOTO_KATEGORI,
      uploadedBy: user.id,
    })
    const yaz = await durumYaz(supabase, user.id, patientId, islem)
    return NextResponse.json({ ok: true, id: belge.id, durum: yaz.durum, uyari: yaz.uyari }, { status: 201 })
  } catch (e) {
    if (e instanceof VaultValidationError) return NextResponse.json({ error: e.message }, { status: 400 })
    return NextResponse.json({ error: 'Fotoğraf yazılamadı.' }, { status: 503 })
  }
}
