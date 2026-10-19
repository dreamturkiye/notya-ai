import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { klinikSlugCoz, muttefikMeslekMi } from '@/lib/specialties/klinikDikey'
import {
  SEANS_ARAC,
  seansBasaEkle,
  seansKapisi,
  seansListesiCoz,
  seansPortalYuku,
  yasKucukMu,
} from '@/lib/klinik/seansDefter'
import { ikiNushaYaz } from '@/lib/klinik/ikiNushaYaz'
import { NUSHA_ROLLERI } from '@/lib/klinik/ikiNusha'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = await req.json().catch(() => null) as {
    patientId?: string
    metin?: string
    rizaIkiNusha?: boolean
    veliOnam?: boolean | null
    fotoKvkk?: boolean
    hekimPlani?: boolean
    kriz112?: boolean
    eski?: unknown
  } | null
  const patientId = String(body?.patientId || '')
  if (!(await hastaSahibiMi(supabase, user.id, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const { data: profil } = await supabase.from('users').select('specialty').eq('id', user.id).maybeSingle()
  const slug = klinikSlugCoz(profil?.specialty)
  if (!slug) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const { data: hasta } = await supabase
    .from('patients')
    .select('dogum_tarihi')
    .eq('id', patientId)
    .eq('doctor_id', user.id)
    .maybeSingle()
  const kapali = seansKapisi({
    metin: String(body?.metin || ''),
    rizaIkiNusha: body?.rizaIkiNusha === true,
    kucuk: yasKucukMu(hasta?.dogum_tarihi ? String(hasta.dogum_tarihi) : ''),
    veliOnam: body?.veliOnam === true,
    muttefik: muttefikMeslekMi(slug),
    hekimPlani: body?.hekimPlani === true,
    fotoKvkk: body?.fotoKvkk === true,
    kriz112: body?.kriz112 === true,
    iso: new Date().toISOString().slice(0, 10),
  })
  if ('hata' in kapali) return NextResponse.json({ error: kapali.hata }, { status: 400 })
  let nusha: { dosyaId: string; hastaId: string }
  try {
    nusha = await ikiNushaYaz(supabase, user.id, patientId, kapali.seans.iso, kapali.seans.id)
  } catch {
    return NextResponse.json({ error: 'İki nüsha yazılamadı.' }, { status: 503 })
  }
  const seans = { ...kapali.seans, dosyaNushaId: nusha.dosyaId, hastaNushaId: nusha.hastaId }
  const { data: mevcut } = await supabase
    .from('ozel_brans_plan')
    .select('girdi')
    .eq('doctor_id', user.id)
    .eq('patient_id', patientId)
    .eq('arac', SEANS_ARAC)
    .maybeSingle()
  const sunucu = seansListesiCoz(mevcut?.girdi)
  const seanslar = seansBasaEkle(sunucu, seans, sunucu.length ? [] : seansListesiCoz(body?.eski))
  const portal = seansPortalYuku()
  const { error } = await supabase.from('ozel_brans_plan').upsert({
    patient_id: patientId,
    doctor_id: user.id,
    slug,
    arac: SEANS_ARAC,
    ozet: kapali.seans.metin,
    portal_satir: portal.portal_satir,
    vadeler: [],
    acil: portal.acil,
    riza: true,
    girdi: { seanslar },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'doctor_id,patient_id,arac' })
  if (error) return NextResponse.json({ error: 'Seans yazılamadı.' }, { status: 503 })
  const nushalar = NUSHA_ROLLERI.map((r) => ({
    rol: r.id,
    ad: r.ad,
    id: r.id === 'dosya' ? nusha.dosyaId : nusha.hastaId,
  }))
  return NextResponse.json({ ok: true, seanslar, nushalar })
}
