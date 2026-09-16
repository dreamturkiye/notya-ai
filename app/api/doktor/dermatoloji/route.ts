/**
 * NOTYA-DERM-clinic-fit — Deri klinik durumu.
 * GET  ?patientId= → hasta_derm + ziyaretler + lezyonlar + skorlar + fototerapi + yama + vision + foto_meta + görüntüleme + belge analizleri
 * POST { action, patientId, ... }
 * Live tables are CRUD truth. Photos remain hasta_goruntulemeler (coreImageId). Belgeler remain vault (documentId).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { PHOTO_DEVICES } from '@/specialties/dermatoloji/engines/phototherapy-log'
import { VISION_DISCLAIMER, uzmanOnay } from '@/specialties/dermatoloji/imaging/vision-tools'
import { defaultVisitType } from '@/specialties/dermatoloji/engines/clinic-fit'
import type { ClinicUnit } from '@/specialties/dermatoloji/types'

export const dynamic = 'force-dynamic'

const DERM_MODALITELER = ['derm', 'dermatoskopi', 'yara']

function isoDate(v: unknown, fallback?: string): string {
  const s = String(v || fallback || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : (fallback || new Date().toISOString().slice(0, 10))
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function mapSkor(row: Record<string, unknown>) {
  return {
    id: row.id,
    recorded_at: isoDate(row.recorded_at),
    ...(row.pasi != null ? { pasi: Number(row.pasi) } : {}),
    ...(row.easi != null ? { easi: Number(row.easi) } : {}),
    ...(row.dlqi != null ? { dlqi: Number(row.dlqi) } : {}),
    ...(row.uas7 != null ? { uas7: Number(row.uas7) } : {}),
    ...(row.salt != null ? { salt: Number(row.salt) } : {}),
    ...(row.pdai != null ? { pdai: Number(row.pdai) } : {}),
  }
}

function mapSeans(row: Record<string, unknown>) {
  return {
    date: isoDate(row.seans_tarihi || row.date),
    device: String(row.device || ''),
    j_cm2: Number(row.j_cm2 || 0),
    med_test: row.med_test === true,
    burn: row.burn === true,
    ...(row.session_photo_core_image_id ? { sessionPhotoCoreImageId: String(row.session_photo_core_image_id) } : {}),
  }
}

function mapYama(row: Record<string, unknown>) {
  return {
    id: row.id,
    series: 'european_baseline' as const,
    appliedAt: isoDate(row.applied_at),
    readD2: row.read_d2 ? isoDate(row.read_d2) : null,
    readD4: row.read_d4 ? isoDate(row.read_d4) : null,
    photoIds: Array.isArray(row.photo_ids) ? row.photo_ids.map(String) : [],
    positives: Array.isArray(row.positives) ? row.positives.map(String) : [],
  }
}

function mapVision(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    assetIds: Array.isArray(row.asset_ids) ? row.asset_ids.map(String) : [],
    task: row.task,
    status: row.status,
    drafted_by: row.drafted_by,
    approved_by: row.approved_by ?? null,
    observations: String(row.observations || ''),
    differentials: Array.isArray(row.differentials) ? row.differentials.map(String) : [],
    next_step: String(row.next_step || ''),
    disclaimer: VISION_DISCLAIMER,
  }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  let { data: kayit, error: kayitErr } = await supabase.from('hasta_derm').select('*')
    .eq('patient_id', patientId).eq('doctor_id', doktorId).maybeSingle()
  if (kayitErr && /hasta_derm|schema cache|does not exist/i.test(kayitErr.message || '')) {
    return NextResponse.json({
      error: 'Dermatoloji klinik tabloları henüz uygulanmadı. Önizleme/prod aynı Supabase — 027_derm_clinic_fit.sql uygulayın.',
      migration: '027',
    }, { status: 503 })
  }
  if (kayitErr) return NextResponse.json({ error: kayitErr.message || 'Kayıt yüklenemedi' }, { status: 500 })

  if (!kayit) {
    const { data: created, error: insErr } = await supabase.from('hasta_derm').insert({
      patient_id: patientId,
      doctor_id: doktorId,
      unit: 'genel',
      visit_type: 'genel-poliklinik',
    }).select('*').single()
    if (insErr) return NextResponse.json({ error: insErr.message || 'Kayıt oluşturulamadı' }, { status: 500 })
    kayit = created
  }

  const epId = kayit.id as string
  const [
    ziyaretler,
    lezyonlar,
    skorlar,
    fototerapi,
    yama,
    vision,
    fotoMeta,
    goruntulemeler,
    belgeAnalizleri,
  ] = await Promise.all([
    supabase.from('derm_ziyaretleri').select('*').eq('hasta_derm_id', epId).order('tarih', { ascending: false }),
    supabase.from('derm_lezyonlar').select('*').eq('hasta_derm_id', epId).order('created_at', { ascending: true }),
    supabase.from('derm_skor_anlari').select('*').eq('hasta_derm_id', epId).order('recorded_at', { ascending: false }),
    supabase.from('derm_fototerapi_seanslari').select('*').eq('hasta_derm_id', epId).order('seans_tarihi', { ascending: false }),
    supabase.from('derm_yama_kurslari').select('*').eq('hasta_derm_id', epId).order('applied_at', { ascending: false }),
    supabase.from('derm_vision_reads').select('*').eq('hasta_derm_id', epId).order('created_at', { ascending: false }),
    supabase.from('derm_foto_meta').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId),
    supabase.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi, rapor_metni, goruntuleme_tarihi, created_at, dosya_url')
      .eq('patient_id', patientId).eq('doctor_id', doktorId).order('goruntuleme_tarihi', { ascending: false }).limit(80),
    supabase.from('belge_analizleri').select('id, belge_id, durum, sonuc, hekim_tanisi, hekim_ozet, modality_final, olusturuldu, onaylandi_at')
      .eq('patient_id', patientId).eq('doctor_id', doktorId)
      .in('modality_final', DERM_MODALITELER)
      .order('olusturuldu', { ascending: false }).limit(12),
  ])

  return NextResponse.json({
    kayit,
    ziyaretler: ziyaretler.data || [],
    lezyonlar: lezyonlar.data || [],
    skorlar: (skorlar.data || []).map((r) => mapSkor(r as Record<string, unknown>)),
    fototerapi: (fototerapi.data || []).map((r) => mapSeans(r as Record<string, unknown>)),
    yama: (yama.data || []).map((r) => mapYama(r as Record<string, unknown>)),
    vision: (vision.data || []).map((r) => mapVision(r as Record<string, unknown>)),
    fotoMeta: fotoMeta.data || [],
    goruntulemeler: goruntulemeler.data || [],
    belgeAnalizleri: belgeAnalizleri.data || [],
  })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Gövde okunamadı.' }, { status: 400 })
  const patientId = String(body.patientId || '')
  const action = String(body.action || '')
  if (!patientId || !action) return NextResponse.json({ error: 'patientId ve action zorunludur.' }, { status: 400 })

  const { data: kayit0, error: kayitErr } = await supabase.from('hasta_derm').select('*')
    .eq('patient_id', patientId).eq('doctor_id', doktorId).maybeSingle()
  if (kayitErr) return NextResponse.json({ error: kayitErr.message || 'Kayıt yok' }, { status: 500 })
  let kayit = kayit0
  if (!kayit) {
    const { data: created, error: insErr } = await supabase.from('hasta_derm').insert({
      patient_id: patientId, doctor_id: doktorId, unit: 'genel', visit_type: 'genel-poliklinik',
    }).select('*').single()
    if (insErr) return NextResponse.json({ error: insErr.message || 'Kayıt oluşturulamadı' }, { status: 500 })
    kayit = created
  }
  const epId = kayit.id as string
  const now = new Date().toISOString()

  if (action === 'klinik') {
    const patch: Record<string, unknown> = { updated_at: now }
    if (typeof body.unit === 'string') {
      patch.unit = body.unit
      patch.visit_type = body.visit_type || defaultVisitType(body.unit as ClinicUnit)
    }
    if (typeof body.visit_type === 'string') patch.visit_type = body.visit_type
    if (body.patient_derm && typeof body.patient_derm === 'object') patch.patient_derm = body.patient_derm
    if (body.gop && typeof body.gop === 'object') patch.gop = body.gop
    if (body.total_body_map !== undefined) patch.total_body_map = body.total_body_map
    if (body.hair_workup !== undefined) patch.hair_workup = body.hair_workup
    if (body.bullous_workup !== undefined) patch.bullous_workup = body.bullous_workup
    if (body.behcet_card !== undefined) patch.behcet_card = body.behcet_card
    if (body.last_tbse_iso !== undefined) patch.last_tbse_iso = body.last_tbse_iso || null
    if (body.next_photo_iso !== undefined) patch.next_photo_iso = body.next_photo_iso || null
    if (typeof body.acitretin_ban === 'boolean') patch.acitretin_ban = body.acitretin_ban
    if (typeof body.tb_screen === 'boolean') patch.tb_screen = body.tb_screen
    if (typeof body.hbv_screen === 'boolean') patch.hbv_screen = body.hbv_screen
    if (body.bzbh_kind !== undefined) patch.bzbh_kind = body.bzbh_kind || null
    if (typeof body.ugly_duckling === 'boolean') patch.ugly_duckling = body.ugly_duckling
    if (typeof body.psa_joint === 'boolean') patch.psa_joint = body.psa_joint
    const { error } = await supabase.from('hasta_derm').update(patch).eq('id', epId).eq('doctor_id', doktorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'ziyaret') {
    const unit = String(body.unit || kayit.unit || 'genel')
    const { error } = await supabase.from('derm_ziyaretleri').insert({
      hasta_derm_id: epId,
      doctor_id: doktorId,
      tarih: isoDate(body.tarih),
      unit,
      visit_type: String(body.visit_type || defaultVisitType(unit as ClinicUnit)),
      checklist: body.checklist && typeof body.checklist === 'object' ? body.checklist : {},
      not_metni: body.not_metni ? String(body.not_metni).slice(0, 4000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (unit !== kayit.unit) {
      await supabase.from('hasta_derm').update({ unit, visit_type: defaultVisitType(unit as ClinicUnit), updated_at: now }).eq('id', epId)
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'lezyon') {
    const region = String(body.region || '').trim()
    if (!region) return NextResponse.json({ error: 'Bölge zorunludur.' }, { status: 400 })
    const row = {
      hasta_derm_id: epId,
      region,
      morphology: String(body.morphology || 'unspecified'),
      body_map_node: body.body_map_node ? String(body.body_map_node) : null,
      notes: body.notes ? String(body.notes).slice(0, 2000) : null,
      document_id: body.documentId ? String(body.documentId) : null,
      updated_at: now,
    }
    if (body.id) {
      const { error } = await supabase.from('derm_lezyonlar').update(row).eq('id', String(body.id)).eq('hasta_derm_id', epId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase.from('derm_lezyonlar').insert(row)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'skor') {
    const { error } = await supabase.from('derm_skor_anlari').insert({
      hasta_derm_id: epId,
      recorded_at: isoDate(body.recorded_at),
      pasi: num(body.pasi),
      easi: num(body.easi),
      dlqi: num(body.dlqi),
      uas7: num(body.uas7),
      salt: num(body.salt),
      pdai: num(body.pdai),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'fototerapi-seans') {
    const device = String(body.device || '')
    if (/solarium|solaryum/i.test(device)) {
      return NextResponse.json({ error: 'Solaryum yasaktır (2018). Cihaz olarak kaydedilmez.' }, { status: 400 })
    }
    if (!(PHOTO_DEVICES as readonly string[]).includes(device)) {
      return NextResponse.json({ error: 'Geçerli fototerapi cihazı seçin (NB-UVB, PUVA, eksimer, UVA1).' }, { status: 400 })
    }
    const { error } = await supabase.from('derm_fototerapi_seanslari').insert({
      hasta_derm_id: epId,
      seans_tarihi: isoDate(body.date),
      device,
      j_cm2: Number(body.j_cm2 || 0),
      med_test: body.med_test === true,
      burn: body.burn === true,
      session_photo_core_image_id: body.sessionPhotoCoreImageId || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'yama') {
    const applied = isoDate(body.appliedAt || body.applied_at)
    const row = {
      hasta_derm_id: epId,
      series: 'european_baseline',
      applied_at: applied,
      read_d2: body.readD2 || body.read_d2 ? isoDate(body.readD2 || body.read_d2) : null,
      read_d4: body.readD4 || body.read_d4 ? isoDate(body.readD4 || body.read_d4) : null,
      photo_ids: Array.isArray(body.photoIds) ? body.photoIds : (body.photo_ids || []),
      positives: String(body.positives || '').split(',').map((s) => s.trim()).filter(Boolean),
      updated_at: now,
    }
    if (Array.isArray(body.positives)) row.positives = body.positives.map(String)
    if (body.id) {
      const { error } = await supabase.from('derm_yama_kurslari').update(row).eq('id', String(body.id)).eq('hasta_derm_id', epId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase.from('derm_yama_kurslari').insert(row)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'vision') {
    const status = String(body.status || 'draft')
    const drafted = (body.drafted_by === 'uzman' ? 'uzman' : 'asistan') as 'asistan' | 'uzman'
    let approved_by: string | null = body.approved_by ? String(body.approved_by) : null
    let finalStatus = status
    if (body.onay === true) {
      const gate = uzmanOnay({
        id: 'tmp',
        assetIds: [],
        task: 'morfoloji',
        status: 'draft',
        drafted_by: drafted,
        approved_by: null,
        observations: '',
        differentials: [],
        next_step: '',
        disclaimer: VISION_DISCLAIMER,
      }, 'uzman')
      if (!gate.ok) return NextResponse.json({ error: 'Asistan kendi taslağını onaylayamaz.' }, { status: 403 })
      finalStatus = 'onayli'
      approved_by = 'uzman'
    }
    if (body.id && body.onay === true) {
      const { error } = await supabase.from('derm_vision_reads').update({
        status: finalStatus, approved_by, updated_at: now,
      }).eq('id', String(body.id)).eq('hasta_derm_id', epId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    const { error } = await supabase.from('derm_vision_reads').insert({
      hasta_derm_id: epId,
      asset_ids: Array.isArray(body.assetIds) ? body.assetIds : [],
      task: String(body.task || 'morfoloji'),
      status: finalStatus === 'onayli' ? 'onayli' : 'draft',
      drafted_by: drafted,
      approved_by,
      observations: String(body.observations || ''),
      differentials: Array.isArray(body.differentials) ? body.differentials : [],
      next_step: String(body.next_step || ''),
      disclaimer: VISION_DISCLAIMER,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'foto-meta') {
    const coreImageId = String(body.coreImageId || '')
    if (!coreImageId) return NextResponse.json({ error: 'coreImageId zorunludur.' }, { status: 400 })
    const row = {
      doctor_id: doktorId,
      patient_id: patientId,
      core_image_id: coreImageId,
      lesion_id: body.lesionId ? String(body.lesionId) : null,
      document_id: body.documentId ? String(body.documentId) : null,
      kind: body.kind ? String(body.kind) : null,
      genital_consent: body.genital_consent === true,
      pediatric_consent: body.pediatric_consent === true,
      education_anonymized: body.education_anonymized === true,
      patient_share: body.patient_share === true,
      updated_at: now,
    }
    const { error } = await supabase.from('derm_foto_meta').upsert(row, { onConflict: 'doctor_id,core_image_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Bilinmeyen işlem.' }, { status: 400 })
}
