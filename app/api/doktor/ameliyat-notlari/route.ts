/**
 * AMELIYAT-NOTU-01 (Kaan, 2026-11-05) — the operation notes of one patient. CORE route (every surgical branch).
 *
 *   GET    ?patientId=<id>            → { notlar, sablonlar }    the patient's notes (newest first) and the templates of the
 *                                                                 doctor's OWN branch ([] outside KD today)
 *   GET    ?patientId=<id>&id=<nid>    → { not, baslik }          one note with the letterhead for printing
 *   POST   { patientId, id?, sablon?, dogumId?, veri, imzala? }   create, or update an UNSIGNED note; `imzala` signs it
 *   DELETE ?patientId=<id>&id=<nid>    → only an unsigned draft
 *
 * HASTA-IZOLASYON: the patient is proven to be the doctor's (hastaSahibiMi) before anything is read or written; every
 * note statement carries doctor_id AND patient_id; a delivery id (sezaryen) is accepted only when that delivery is the
 * same doctor's and the same patient's. Doctor only (sadeceDoktor): the note is the surgeon's signed document.
 * A SIGNED note never changes (medico-legal record): a correction is a new note.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { ameliyatNotuDogrula } from '@/lib/doktor/ameliyatNotu'
import { ameliyatSablonlariBransIcin, doktorBransiOku, notuCoz, notuSifrele, sablonGecerliMi, yazdirmaBasligi } from '@/lib/doktor/ameliyatNotuSunucu'

export const dynamic = 'force-dynamic'

const BULUNAMADI = () => NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
const NOT_YOK = () => NextResponse.json({ error: 'Ameliyat notu bulunamadı.' }, { status: 404 })
const KOLONLAR = 'id, ameliyat_tarihi, sablon, dogum_id, veri_encrypted, imzalandi_at, created_at, updated_at'
type Satir = { id: string; ameliyat_tarihi: string; sablon: string | null; dogum_id: string | null; veri_encrypted: string; imzalandi_at: string | null; created_at: string; updated_at: string }
const disari = (r: Satir) => ({ id: r.id, ameliyat_tarihi: r.ameliyat_tarihi, sablon: r.sablon, dogum_id: r.dogum_id, imzalandi_at: r.imzalandi_at, created_at: r.created_at, updated_at: r.updated_at, veri: notuCoz(r.veri_encrypted) })

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  const id = req.nextUrl.searchParams.get('id')
  if (!patientId || !(await hastaSahibiMi(supabase, doktorId, patientId))) return BULUNAMADI()

  if (id) {
    const [{ data }, baslik] = await Promise.all([
      supabase.from('ameliyat_notlari').select(KOLONLAR).eq('id', id).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle(),
      yazdirmaBasligi(supabase, doktorId, patientId),
    ])
    if (!data) return NOT_YOK()
    return NextResponse.json({ not: disari(data as Satir), baslik })
  }

  const [{ data }, brans] = await Promise.all([
    supabase.from('ameliyat_notlari').select(KOLONLAR).eq('doctor_id', doktorId).eq('patient_id', patientId).order('ameliyat_tarihi', { ascending: false }).limit(100),
    doktorBransiOku(supabase, doktorId),
  ])
  const sablonlar = await ameliyatSablonlariBransIcin(brans)
  return NextResponse.json({ notlar: ((data || []) as Satir[]).map(disari), sablonlar })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const b = (await req.json().catch(() => ({}))) as { patientId?: unknown; id?: unknown; sablon?: unknown; dogumId?: unknown; veri?: unknown; imzala?: unknown }
  const patientId = typeof b.patientId === 'string' ? b.patientId : ''
  if (!patientId || !(await hastaSahibiMi(supabase, doktorId, patientId))) return BULUNAMADI()

  const imza = b.imzala === true
  const d = ameliyatNotuDogrula(b.veri, { imza })
  if (!d.ok) return NextResponse.json({ error: d.hata, alan: d.alan }, { status: 400 })

  // A delivery (sezaryen) is linked only when it is this doctor's AND this patient's.
  let dogumId: string | null = null
  if (typeof b.dogumId === 'string' && b.dogumId) {
    const { data: dogum } = await supabase.from('dogum_olaylari').select('id').eq('id', b.dogumId).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
    if (!dogum) return NextResponse.json({ error: 'Doğum kaydı bulunamadı.' }, { status: 404 })
    dogumId = String(dogum.id)
  }
  const sablon = await sablonGecerliMi(await doktorBransiOku(supabase, doktorId), b.sablon)
  const simdi = new Date().toISOString()
  const yuk = { ameliyat_tarihi: d.tarih, veri_encrypted: notuSifrele(d.veri), updated_at: simdi, ...(imza ? { imzalandi_at: simdi } : {}) }

  if (typeof b.id === 'string' && b.id) {
    const { data: mevcut } = await supabase.from('ameliyat_notlari').select('id, imzalandi_at').eq('id', b.id).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
    if (!mevcut) return NOT_YOK()
    if (mevcut.imzalandi_at) return NextResponse.json({ error: 'İmzalanmış ameliyat notu değiştirilemez; düzeltme için yeni not ekleyin.' }, { status: 409 })
    const { data, error } = await supabase.from('ameliyat_notlari')
      .update({ ...yuk, ...(sablon ? { sablon } : {}), ...(dogumId ? { dogum_id: dogumId } : {}) })
      .eq('id', b.id).eq('doctor_id', doktorId).eq('patient_id', patientId)
      .select(KOLONLAR).single()
    if (error || !data) return NextResponse.json({ error: 'Ameliyat notu kaydedilemedi.' }, { status: 500 })
    return NextResponse.json({ not: disari(data as Satir) })
  }

  const { data, error } = await supabase.from('ameliyat_notlari')
    .insert({ doctor_id: doktorId, patient_id: patientId, sablon, dogum_id: dogumId, created_at: simdi, ...yuk })
    .select(KOLONLAR).single()
  if (error || !data) return NextResponse.json({ error: 'Ameliyat notu kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ not: disari(data as Satir) }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!patientId || !(await hastaSahibiMi(supabase, doktorId, patientId))) return BULUNAMADI()
  const { data: mevcut } = await supabase.from('ameliyat_notlari').select('id, imzalandi_at').eq('id', id).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  if (!mevcut) return NOT_YOK()
  if (mevcut.imzalandi_at) return NextResponse.json({ error: 'İmzalanmış ameliyat notu silinemez.' }, { status: 409 })
  await supabase.from('ameliyat_notlari').delete().eq('id', id).eq('doctor_id', doktorId).eq('patient_id', patientId)
  return NextResponse.json({ ok: true })
}
