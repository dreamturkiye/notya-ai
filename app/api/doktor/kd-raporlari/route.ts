/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — structured KD reports of one patient: obstetric USG, gynaecological USG, NST.
 *
 *   GET    ?patientId=<id>[&tur=<tur>]   → { raporlar }            newest first
 *   GET    ?patientId=<id>&id=<rid>      → { rapor, baslik }       one report with the letterhead for printing
 *   POST   { patientId, id?, tur, gebelikId?, veri }               create, or replace the content of the doctor's own report
 *   DELETE ?patientId=<id>&id=<rid>
 *
 * KD ONLY (brans-alan-sizmasi): the screens mount only for a Kadın Hastalıkları ve Doğum doctor
 * (HastaGebelik → kadinDogumBransi); this route serves the doctor's OWN rows of the doctor's OWN patient and nothing else.
 * HASTA-IZOLASYON: hastaSahibiMi before anything; every statement carries doctor_id AND patient_id; a pregnancy id is
 * accepted only when it is the same doctor's and the same patient's. Content is encrypted (AES-256-GCM).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { yazdirmaBasligi } from '@/lib/doktor/ameliyatNotuSunucu'
import { jinekolojikUsgDogrula, obstetrikUsgDogrula } from '@/specialties/kadin-dogum/engines/usgRaporu'
import { nstDogrula } from '@/specialties/kadin-dogum/engines/nstKtg'

export const dynamic = 'force-dynamic'

const TURLER = ['usg_obstetrik', 'usg_jinekolojik', 'nst'] as const
type Tur = (typeof TURLER)[number]
const BULUNAMADI = () => NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
const RAPOR_YOK = () => NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 })
const KOLONLAR = 'id, tur, gebelik_id, rapor_tarihi, veri_encrypted, created_at, updated_at'
type Satir = { id: string; tur: Tur; gebelik_id: string | null; rapor_tarihi: string; veri_encrypted: string; created_at: string; updated_at: string }

function coz(s: unknown): unknown { try { return JSON.parse(decrypt(String(s || ''))) } catch { return null } }
const disari = (r: Satir) => ({ id: r.id, tur: r.tur, gebelik_id: r.gebelik_id, rapor_tarihi: r.rapor_tarihi, created_at: r.created_at, updated_at: r.updated_at, veri: coz(r.veri_encrypted) })

function dogrula(tur: Tur, veri: unknown) {
  if (tur === 'usg_obstetrik') return obstetrikUsgDogrula(veri)
  if (tur === 'usg_jinekolojik') return jinekolojikUsgDogrula(veri)
  return nstDogrula(veri)
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const sp = req.nextUrl.searchParams
  const patientId = sp.get('patientId') || ''
  if (!patientId || !(await hastaSahibiMi(supabase, doktorId, patientId))) return BULUNAMADI()
  const id = sp.get('id')
  if (id) {
    const [{ data }, baslik] = await Promise.all([
      supabase.from('kd_raporlari').select(KOLONLAR).eq('id', id).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle(),
      yazdirmaBasligi(supabase, doktorId, patientId),
    ])
    if (!data) return RAPOR_YOK()
    return NextResponse.json({ rapor: disari(data as Satir), baslik })
  }
  let q = supabase.from('kd_raporlari').select(KOLONLAR).eq('doctor_id', doktorId).eq('patient_id', patientId)
  const tur = sp.get('tur')
  if (tur && (TURLER as readonly string[]).includes(tur)) q = q.eq('tur', tur)
  const { data } = await q.order('rapor_tarihi', { ascending: false }).limit(100)
  return NextResponse.json({ raporlar: ((data || []) as Satir[]).map(disari) })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const b = (await req.json().catch(() => ({}))) as { patientId?: unknown; id?: unknown; tur?: unknown; gebelikId?: unknown; veri?: unknown }
  const patientId = typeof b.patientId === 'string' ? b.patientId : ''
  if (!patientId || !(await hastaSahibiMi(supabase, doktorId, patientId))) return BULUNAMADI()
  if (typeof b.tur !== 'string' || !(TURLER as readonly string[]).includes(b.tur)) return NextResponse.json({ error: 'Geçersiz rapor türü.' }, { status: 400 })
  const tur = b.tur as Tur
  const d = dogrula(tur, b.veri)
  if (!d.ok) return NextResponse.json({ error: d.hata }, { status: 400 })

  let gebelikId: string | null = null
  if (typeof b.gebelikId === 'string' && b.gebelikId) {
    const { data: g } = await supabase.from('gebelikler').select('id').eq('id', b.gebelikId).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
    if (!g) return NextResponse.json({ error: 'Gebelik bulunamadı.' }, { status: 404 })
    gebelikId = String(g.id)
  }
  const simdi = new Date().toISOString()
  const yuk = { rapor_tarihi: d.veri.tarih, veri_encrypted: encrypt(JSON.stringify(d.veri)), updated_at: simdi }
  if (typeof b.id === 'string' && b.id) {
    const { data, error } = await supabase.from('kd_raporlari').update({ ...yuk, ...(gebelikId ? { gebelik_id: gebelikId } : {}) })
      .eq('id', b.id).eq('doctor_id', doktorId).eq('patient_id', patientId).eq('tur', tur).select(KOLONLAR).maybeSingle()
    if (error) return NextResponse.json({ error: 'Rapor kaydedilemedi.' }, { status: 500 })
    if (!data) return RAPOR_YOK()
    return NextResponse.json({ rapor: disari(data as Satir) })
  }
  const { data, error } = await supabase.from('kd_raporlari')
    .insert({ doctor_id: doktorId, patient_id: patientId, tur, gebelik_id: gebelikId, created_at: simdi, ...yuk })
    .select(KOLONLAR).single()
  if (error || !data) return NextResponse.json({ error: 'Rapor kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ rapor: disari(data as Satir) }, { status: 201 })
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
  const { data } = await supabase.from('kd_raporlari').select('id').eq('id', id).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  if (!data) return RAPOR_YOK()
  await supabase.from('kd_raporlari').delete().eq('id', id).eq('doctor_id', doktorId).eq('patient_id', patientId)
  return NextResponse.json({ ok: true })
}
