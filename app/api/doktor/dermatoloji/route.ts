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
import { DERIM_HATIRLATMA_METNI, hastaGuvenliMi, type DerimHatirlatmaKodu } from '@/specialties/dermatoloji/engines/derimHatirlatma'
import type { ClinicUnit } from '@/specialties/dermatoloji/types'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'

export const dynamic = 'force-dynamic'

const DERM_MODALITELER = ['derm', 'dermatoskopi', 'yara']
// DERM-EXCEPTIONAL-01 — 054 migration CHECK'leriyle aynı liste
const ERITEM_YANITLARI = ['yok', 'minimal', 'agrili', 'bullu'] as const
const YAMA_SERILERI = ['european_baseline', 'ek_kozmetik', 'ek_sac', 'ek_mesleki', 'ek_hekim'] as const
const DERMOSKOPI_ALGORITMALARI = ['uc_nokta', 'yedi_nokta', 'cash'] as const

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
    // DERM-EXCEPTIONAL-01: bölge çalışma sayfası çıktıları
    ...(row.scorad != null ? { scorad: Number(row.scorad) } : {}),
    ...(row.iga != null ? { iga: Number(row.iga) } : {}),
    ...(row.bsa_pct != null ? { bsa_pct: Number(row.bsa_pct) } : {}),
    ...(row.ek && typeof row.ek === 'object' ? { ek: row.ek } : {}),
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
    // DERM-EXCEPTIONAL-01: ünite v2 — doz adımı hekim protokolünden, hesaplanmaz
    ...(row.seans_no != null ? { seans_no: Number(row.seans_no) } : {}),
    ...(row.doz_adimi_pct != null ? { doz_adimi_pct: Number(row.doz_adimi_pct) } : {}),
    ...(row.eritem ? { eritem: String(row.eritem) } : {}),
    ...(row.kacirilan_gun != null ? { kacirilan_gun: Number(row.kacirilan_gun) } : {}),
    ...(row.yanik_protokolu && typeof row.yanik_protokolu === 'object' ? { yanik_protokolu: row.yanik_protokolu } : {}),
    ...(row.not_hemsire ? { not: String(row.not_hemsire) } : {}),
  }
}

function mapMed(row: Record<string, unknown>) {
  return {
    id: row.id,
    date: isoDate(row.tarih),
    device: String(row.device || ''),
    deger: Number(row.deger || 0),
    birim: String(row.birim || ''),
    ...(row.test_foto_core_image_id ? { testPhotoCoreImageId: String(row.test_foto_core_image_id) } : {}),
    ...(row.not_hekim ? { not: String(row.not_hekim) } : {}),
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
  // HASTA-IZOLASYON-01: this route auto-creates a hasta_derm episode — never for a foreign patient.
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

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
    medKayitlari,
    biyolojikRaporlar,
    dermoskopiSkorlari,
    islemler,
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
    // DERM-EXCEPTIONAL-01 — 054 tabloları. Migration uygulanmadıysa boş döner, sayfa yine açılır.
    supabase.from('derm_med_kayitlari').select('*').eq('hasta_derm_id', epId).order('tarih', { ascending: false }).limit(40),
    supabase.from('derm_biyolojik_raporlar').select('*').eq('hasta_derm_id', epId).order('created_at', { ascending: false }).limit(20),
    supabase.from('derm_dermoskopi_skorlari').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(40),
    supabase.from('derm_islemler').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).order('tarih', { ascending: false }).limit(40),
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
    medKayitlari: (medKayitlari.data || []).map((r) => mapMed(r as Record<string, unknown>)),
    biyolojikRaporlar: biyolojikRaporlar.data || [],
    dermoskopiSkorlari: dermoskopiSkorlari.data || [],
    islemler: islemler.data || [],
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
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

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
    // DERM-EXCEPTIONAL-01: hekimin işaretlediği acil bayraklar, kilitlediği basamak, yapılandırılmış izlem kartları
    if (body.acil_isaretleri !== undefined) {
      patch.acil_isaretleri = Array.isArray(body.acil_isaretleri) ? body.acil_isaretleri.map(String) : null
    }
    if (body.basamak_kilidi !== undefined) patch.basamak_kilidi = body.basamak_kilidi || null
    if (body.psa_triyaj !== undefined) patch.psa_triyaj = body.psa_triyaj || null
    if (body.behcet_izlem !== undefined) patch.behcet_izlem = body.behcet_izlem || null
    if (body.bulloz_izlem !== undefined) patch.bulloz_izlem = body.bulloz_izlem || null
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
      // DERM-EXCEPTIONAL-01: bölge dökümü (PASI/EASI bölge bölge, SCORAD alanları) jsonb'da
      scorad: num(body.scorad),
      iga: num(body.iga),
      bsa_pct: num(body.bsa_pct),
      ek: body.ek && typeof body.ek === 'object' ? body.ek : null,
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
      // v2: doz adımı hemşire/hekim protokolünden girilir — Notya hesaplamaz
      seans_no: num(body.seans_no),
      doz_adimi_pct: num(body.doz_adimi_pct),
      eritem: (ERITEM_YANITLARI as readonly string[]).includes(String(body.eritem)) ? String(body.eritem) : null,
      kacirilan_gun: num(body.kacirilan_gun),
      yanik_protokolu: body.yanik_protokolu && typeof body.yanik_protokolu === 'object' ? body.yanik_protokolu : null,
      not_hemsire: body.not ? String(body.not).slice(0, 2000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // MED / MPD testi — cihaz başına, hekim okur ve girer
  if (action === 'med') {
    const device = String(body.device || '')
    if (!(PHOTO_DEVICES as readonly string[]).includes(device)) {
      return NextResponse.json({ error: 'Geçerli fototerapi cihazı seçin.' }, { status: 400 })
    }
    const deger = num(body.deger)
    if (!deger || deger <= 0) return NextResponse.json({ error: 'MED değeri zorunludur.' }, { status: 400 })
    const { error } = await supabase.from('derm_med_kayitlari').insert({
      patient_id: patientId, doctor_id: doktorId, hasta_derm_id: epId,
      tarih: isoDate(body.date),
      device,
      deger,
      birim: String(body.birim || 'mJ/cm²'),
      test_foto_core_image_id: body.testPhotoCoreImageId || null,
      not_hekim: body.not ? String(body.not).slice(0, 1000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'yama') {
    const applied = isoDate(body.appliedAt || body.applied_at)
    const seri = String(body.series || 'european_baseline')
    const row: Record<string, unknown> = {
      hasta_derm_id: epId,
      series: (YAMA_SERILERI as readonly string[]).includes(seri) ? seri : 'european_baseline',
      applied_at: applied,
      read_d2: body.readD2 || body.read_d2 ? isoDate(body.readD2 || body.read_d2) : null,
      read_d4: body.readD4 || body.read_d4 ? isoDate(body.readD4 || body.read_d4) : null,
      photo_ids: Array.isArray(body.photoIds) ? body.photoIds : (body.photo_ids || []),
      positives: String(body.positives || '').split(',').map((s) => s.trim()).filter(Boolean),
      updated_at: now,
      // ICDRG okuma dereceleri: { alerjenKodu: '+' | '++' | ... } — hekim okur
      d2_dereceler: body.d2Dereceler && typeof body.d2Dereceler === 'object' ? body.d2Dereceler : null,
      d4_dereceler: body.d4Dereceler && typeof body.d4Dereceler === 'object' ? body.d4Dereceler : null,
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

  // Kozmetik işlem izlenebilirliği — lot + komplikasyon. Yalnız kozmetik ünitesi UI'sinden gelir.
  if (action === 'kozmetik-islem') {
    const tur = String(body.tur || '').trim()
    if (!tur) return NextResponse.json({ error: 'İşlem türü zorunludur.' }, { status: 400 })
    const { error } = await supabase.from('derm_islemler').insert({
      patient_id: patientId, doctor_id: doktorId,
      tur,
      tarih: isoDate(body.tarih),
      onam_id: body.onamId ? String(body.onamId) : null,
      islem_notu: { bolge: body.bolge ? String(body.bolge) : null, kozmetik: true },
      urun: body.urun ? String(body.urun).slice(0, 200) : null,
      lot_no: body.lot_no ? String(body.lot_no).slice(0, 80) : null,
      son_kullanma: body.son_kullanma ? isoDate(body.son_kullanma) : null,
      test_spot: body.test_spot === true,
      komplikasyonlar: Array.isArray(body.komplikasyonlar) ? body.komplikasyonlar.map(String) : [],
      komplikasyon_notu: body.komplikasyon_notu ? String(body.komplikasyon_notu).slice(0, 2000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Dermoskopi çalışma sayfası sonucu — tanı değil, uzman kararına girdi
  if (action === 'dermoskopi-skor') {
    const algoritma = String(body.algoritma || '')
    if (!(DERMOSKOPI_ALGORITMALARI as readonly string[]).includes(algoritma)) {
      return NextResponse.json({ error: 'Geçerli algoritma seçin (3 nokta / 7 nokta / CASH).' }, { status: 400 })
    }
    const { error } = await supabase.from('derm_dermoskopi_skorlari').insert({
      patient_id: patientId, doctor_id: doktorId,
      lezyon_id: body.lezyonId ? String(body.lezyonId) : null,
      algoritma,
      toplam: Number(body.toplam || 0),
      esik_ustu: body.esikUstu === true,
      isaretli: Array.isArray(body.isaretli) ? body.isaretli.map(String) : [],
      not_hekim: body.not ? String(body.not).slice(0, 2000) : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Biyolojik/sistemik SUT rapor taslağı. Doz saklanmaz; Medula girişini hekim yapar (canlı gönderim yok).
  if (action === 'biyolojik-rapor') {
    const sablon = body.sablon === 'idame' ? 'idame' : 'baslangic'
    const endikasyon = String(body.endikasyon || '').trim()
    if (!endikasyon) return NextResponse.json({ error: 'Endikasyon zorunludur.' }, { status: 400 })
    const eksikler = Array.isArray(body.eksikler) ? body.eksikler.map(String) : []
    const kilitli = body.kilitle === true
    if (kilitli && eksikler.length > 0) {
      return NextResponse.json({ error: 'Eksik zorunlu maddeler var — taslak kilitlenemez.' }, { status: 400 })
    }
    const row: Record<string, unknown> = {
      patient_id: patientId, doctor_id: doktorId, hasta_derm_id: epId,
      sablon, endikasyon,
      etken_madde: body.etkenMadde ? String(body.etkenMadde).slice(0, 200) : null,
      taslak_metni: body.taslakMetni ? String(body.taslakMetni).slice(0, 20000) : null,
      eksikler,
      kilitli,
      kilit_at: kilitli ? now : null,
      updated_at: now,
    }
    if (body.id) {
      const { error } = await supabase.from('derm_biyolojik_raporlar').update(row)
        .eq('id', String(body.id)).eq('doctor_id', doktorId).eq('patient_id', patientId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase.from('derm_biyolojik_raporlar').insert(row)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // Derim (hasta portalı) hatırlatması — hekim tetikler; metin hasta-güvenli sabit listeden gelir.
  // Portal bunu `derm_gorevleri` üzerinden okur (bundle.deri.hatirlatmalar) — yeni portal alanı gerekmez.
  if (action === 'hatirlatma') {
    const kod = String(body.kod || '').replace(/^derim_/, '') as DerimHatirlatmaKodu
    const ad = DERIM_HATIRLATMA_METNI[kod]
    if (!ad) return NextResponse.json({ error: 'Bilinmeyen hatırlatma kodu.' }, { status: 400 })
    if (!hastaGuvenliMi(ad)) {
      return NextResponse.json({ error: 'Hatırlatma metni hasta portalı için uygun değil.' }, { status: 400 })
    }
    const { error } = await supabase.from('derm_gorevleri').insert({
      patient_id: patientId, doctor_id: doktorId,
      kod: `derim_${kod}`,
      ad,
      due: body.due ? isoDate(body.due) : null,
      kaynak: 'hekim',
      durum: 'acik',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Bilinmeyen işlem.' }, { status: 400 })
}
