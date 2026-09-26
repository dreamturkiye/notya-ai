/**
 * Persistence for canlı doğum → bebek kartı, NTP-1 stub, calendar tasks.
 * Reuses 029 tables: dogum_olaylari, bebek_kartlari (yenidogan_tarama jsonb),
 * taburcu_checklist (maddeler jsonb + istisna). New 036 tables: bebek_gorevleri,
 * asi_dozlari, lohusa_checklist.
 * Used by /api/doktor/gebelik (sonlandir), /api/doktor/gebelik/dogum (dogum_kaydet),
 * and /api/doktor/yenidogan.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { uploadDocument } from '@/lib/vault/service'
import {
  ASI_V1,
  NTP2_SMS,
  NTP_DISCLAIMER,
  NTP_ETIKET,
  NTP_KEYS,
  YENI_BEBEK_BILDIRIM,
  generateCalendar,
  ntpBelgeSahibi,
  pretermOrLbw,
  taburcuGate,
  type RedKayit,
  type TaburcuChecks,
  type TaburcuIstisna,
} from '@/lib/clinical/yenidogan'

type Sb = SupabaseClient

function yolNorm(v: unknown): 'NSD' | 'C/S' {
  const s = String(v || '').toUpperCase()
  if (s.includes('C/S') || s.includes('SEZARY') || s.includes('SEZARYEN') || s === 'CS' || s.includes('CS_')) return 'C/S'
  return 'NSD'
}

function dogumSekli029(v: unknown): string {
  const s = String(v || '').toLowerCase()
  if (s.includes('c/s') || s.includes('sezary') || s.includes('cs_acil')) return s.includes('acil') ? 'cs_acil' : 'cs_elektif'
  if (s.includes('ssvd')) return 'ssvd'
  if (s.includes('mudahal')) return 'mudahaleli'
  return 'nsd'
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function isoTs(v: unknown, fallback?: string): string | null {
  if (v == null || v === '') return fallback || null
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T12:00:00.000Z`
  const d = new Date(s)
  return isNaN(d.getTime()) ? (fallback || null) : d.toISOString()
}

function asObj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
}

export function redlerFromJson(raw: unknown): RedKayit[] {
  if (!raw || typeof raw !== 'object') return []
  const maddeler = (raw as { maddeler?: unknown }).maddeler
  if (!Array.isArray(maddeler)) return []
  return maddeler.filter((m) => m && typeof m === 'object' && (m as RedKayit).status === 'red') as RedKayit[]
}

/** 029 maddeler jsonb → gate checks. Timestamps or booleans both count. */
export function checksFromMaddeler(maddeler: Record<string, unknown> | null | undefined, tarama?: Record<string, unknown> | null): TaburcuChecks {
  const m = maddeler || {}
  const t = tarama || {}
  const truthy = (v: unknown) => v === true || (typeof v === 'string' && v !== '')
  const ntp1 = Boolean(m.ntp1) || Boolean(m.ntp1_alindi_at) || truthy(t.ntp1)
  const hepb1 = Boolean(m.hepb1) || Boolean(m.hepb1_at) || truthy(t.hepb1)
  const vitk = Boolean(m.vitk) || Boolean(m.vitk_at) || truthy(t.vitk)
  const isitmeYapilmadi = String(m.isitme_sonuc || t.isitme || '') === 'yapilmadi'
  const isitme = (Boolean(m.isitme) || Boolean(m.isitme_at) || truthy(t.isitme)) && !isitmeYapilmadi
  return { ntp1, hepb1, vitk, isitme }
}

/** @deprecated column-shaped checklist — keep for callers; prefer checksFromMaddeler. */
export function checksFromRow(row: Record<string, unknown> | null): TaburcuChecks {
  if (!row) return { ntp1: false, hepb1: false, vitk: false, isitme: false }
  if (row.maddeler && typeof row.maddeler === 'object') return checksFromMaddeler(asObj(row.maddeler))
  return {
    ntp1: Boolean(row.ntp1_alindi_at),
    hepb1: Boolean(row.hepb1_at),
    vitk: Boolean(row.vitk_at),
    isitme: Boolean(row.isitme_at) && String(row.isitme_sonuc || '') !== 'yapilmadi',
  }
}

export function istisnaFromRow(raw: unknown): TaburcuIstisna | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const nedenRaw = String(r.neden || r.tur || '')
  const neden = nedenRaw === 'red' ? 'redd' : nedenRaw
  if (neden !== 'erken_taburcu' && neden !== 'redd' && neden !== 'sevk') return null
  const aciklama = String(r.aciklama || '').trim()
  const kaydeden = String(r.kaydeden || '')
  const at = String(r.at || '')
  if (!aciklama) return null
  return { neden: neden as TaburcuIstisna['neden'], aciklama, kaydeden, at }
}

export function istisnaToDb(ist: TaburcuIstisna): Record<string, unknown> {
  return {
    tur: ist.neden === 'redd' ? 'red' : ist.neden,
    neden: ist.neden,
    aciklama: ist.aciklama,
    kaydeden: ist.kaydeden,
    at: ist.at,
  }
}

/** Flatten 029 maddeler + kapatildi for TaburcuPaketi (still column-shaped). */
export function taburcuUiFromRow(row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return null
  const m = asObj(row.maddeler)
  return {
    ...row,
    ntp1_alindi_at: m.ntp1_alindi_at || (m.ntp1 ? row.updated_at : null) || null,
    ntp1_barkod: m.ntp1_barkod || null,
    ntp1_beslenme_sonrasi: m.ntp1_beslenme_sonrasi ?? null,
    ntp2_randevu_at: m.ntp2_randevu_at || null,
    ntp2_yer: m.ntp2_yer || 'ASM',
    hepb1_at: m.hepb1_at || (m.hepb1 ? row.updated_at : null) || null,
    vitk_at: m.vitk_at || (m.vitk ? row.updated_at : null) || null,
    isitme_at: m.isitme_at || (m.isitme ? row.updated_at : null) || null,
    isitme_sonuc: m.isitme_sonuc || null,
    pulseox_at: m.pulseox_at || (m.pulseox ? row.updated_at : null) || null,
    pulseox_sonuc: m.pulseox_sonuc || null,
    kirmizi_refleks: m.kirmizi_refleks ?? null,
    gkd_risk: Boolean(m.gkd_risk ?? m.gkd),
    dvit_baslandi: Boolean(m.dvit_baslandi ?? m.dvit),
    emzirme_danismanlik: Boolean(m.emzirme_danismanlik ?? m.emzirme),
    taburcu_onay_at: row.kapatildi ? (row.kapatildi_at || row.updated_at) : null,
    red_json: row.red_json || { maddeler: [] },
    istisna: row.istisna || null,
  }
}

export type CanliDogumGirdi = {
  doktorId: string
  anneId: string
  gebelikId: string
  dogumTarihi: string
  dogumSekli?: string | null
  dogumNotu?: string | null
  apgar1?: number | null
  apgar5?: number | null
  kiloGram?: number | null
  boyCm?: number | null
  basCm?: number | null
  gestHafta?: number | null
  cinsiyet?: string | null
  bebekAdi?: string | null
  kanGrubu?: string | null
  gkdRisk?: boolean
  /** Spine already created dogum_olaylari — reuse instead of inserting another. */
  mevcutDogumId?: string | null
  /** Spine already created the bebek patient. */
  mevcutBebekPatientId?: string | null
  mevcutKartId?: string | null
}

export async function olusturCanliDogum(sb: Sb, g: CanliDogumGirdi): Promise<{
  bebekPatientId: string
  dogumId: string
  kartId: string
  zatenVar: boolean
}> {
  const { data: gebelik } = await sb.from('gebelikler').select('patient_id, yenidogan_patient_id').eq('id', g.gebelikId).eq('doctor_id', g.doktorId).maybeSingle()
  if (!gebelik?.patient_id) throw new Error('Gebelik bulunamadı.')
  if (String(gebelik.patient_id) !== String(g.anneId)) throw new Error('Hasta bulunamadı.')
  const { data: anneKayit } = await sb.from('patients').select('name_encrypted').eq('id', g.anneId).eq('doctor_id', g.doktorId).maybeSingle()
  if (!anneKayit) throw new Error('Hasta bulunamadı.')
  if (g.mevcutDogumId) {
    const { data: dogumSahip } = await sb.from('dogum_olaylari').select('id').eq('id', g.mevcutDogumId).eq('doctor_id', g.doktorId).eq('gebelik_id', g.gebelikId).maybeSingle()
    if (!dogumSahip) throw new Error('Doğum bulunamadı.')
  }
  if (g.mevcutBebekPatientId) {
    const { data: bebekSahip } = await sb.from('patients').select('id').eq('id', g.mevcutBebekPatientId).eq('doctor_id', g.doktorId).maybeSingle()
    if (!bebekSahip) throw new Error('Hasta bulunamadı.')
  }
  if (g.mevcutKartId) {
    const { data: kartSahip } = await sb.from('bebek_kartlari').select('id').eq('id', g.mevcutKartId).eq('doctor_id', g.doktorId).maybeSingle()
    if (!kartSahip) throw new Error('Bebek kartı bulunamadı.')
  }
  if (gebelik.yenidogan_patient_id) {
    const { data: kart } = await sb.from('bebek_kartlari').select('id, dogum_id').eq('bebek_patient_id', gebelik.yenidogan_patient_id).eq('doctor_id', g.doktorId).maybeSingle()
    if (kart) {
      await baglaLohusaVeTakvim(sb, {
        doktorId: g.doktorId,
        bebekId: gebelik.yenidogan_patient_id,
        anneId: g.anneId,
        dogumId: kart.dogum_id,
        dogumAt: isoTs(g.dogumTarihi, new Date().toISOString()) || new Date().toISOString(),
        preterm: pretermOrLbw({ gestHafta: g.gestHafta ?? null, kiloGram: g.kiloGram ?? null }),
        gkdRisk: Boolean(g.gkdRisk),
      })
      return { bebekPatientId: gebelik.yenidogan_patient_id, dogumId: kart.dogum_id, kartId: kart.id, zatenVar: true }
    }
  }

  let dogumId = g.mevcutDogumId || null
  if (!dogumId) {
    const { data: mevcutDogum } = await sb.from('dogum_olaylari')
      .select('id, durum')
      .eq('gebelik_id', g.gebelikId)
      .eq('doctor_id', g.doktorId)
      .neq('durum', 'kapandi')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    dogumId = mevcutDogum?.id || null
  }

  const dogumZamani = isoTs(g.dogumTarihi, new Date().toISOString()) || new Date().toISOString()
  const sekil = dogumSekli029(g.dogumSekli)

  if (dogumId) {
    await sb.from('dogum_olaylari').update({
      dogum_sekli: sekil,
      dogum_zamani: dogumZamani,
      canli_dogum: true,
      durum: 'lohusa',
      not_metni: g.dogumNotu || undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', dogumId).eq('doctor_id', g.doktorId)
  } else {
    const { data: dogum, error: dogumHata } = await sb.from('dogum_olaylari').insert({
      gebelik_id: g.gebelikId,
      patient_id: g.anneId,
      doctor_id: g.doktorId,
      durum: 'lohusa',
      dogum_sekli: sekil,
      dogum_zamani: dogumZamani,
      canli_dogum: true,
      not_metni: g.dogumNotu || null,
    }).select('id').single()
    if (dogumHata || !dogum) throw new Error(dogumHata?.message || 'Doğum olayı kaydedilemedi')
    dogumId = dogum.id
  }
  if (!dogumId) throw new Error('Doğum olayı kaydedilemedi')

  const { data: mevcutKart } = await sb.from('bebek_kartlari')
    .select('id, bebek_patient_id')
    .eq('dogum_id', dogumId)
    .eq('doctor_id', g.doktorId)
    .not('bebek_patient_id', 'is', null)
    .order('sira', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (mevcutKart?.bebek_patient_id) {
    await sb.from('gebelikler').update({
      yenidogan_patient_id: mevcutKart.bebek_patient_id,
      updated_at: new Date().toISOString(),
    }).eq('id', g.gebelikId).eq('doctor_id', g.doktorId)
    await baglaLohusaVeTakvim(sb, {
      doktorId: g.doktorId,
      bebekId: mevcutKart.bebek_patient_id,
      anneId: g.anneId,
      dogumId,
      dogumAt: dogumZamani,
      preterm: pretermOrLbw({ gestHafta: g.gestHafta ?? null, kiloGram: g.kiloGram ?? null }),
      gkdRisk: Boolean(g.gkdRisk),
    })
    return { bebekPatientId: mevcutKart.bebek_patient_id, dogumId, kartId: mevcutKart.id, zatenVar: true }
  }

  let bebekPatientId = g.mevcutBebekPatientId || null
  if (!bebekPatientId) {
    let anneSoyad = ''
    try {
      const n = JSON.parse(anneKayit.name_encrypted ? decrypt(anneKayit.name_encrypted) : '{}') as { ad?: string; soyad?: string }
      anneSoyad = String(n.soyad || n.ad || '').split(' ').slice(-1)[0] || ''
    } catch { /* ad çözülemedi */ }

    const bebekAdi = String(g.bebekAdi || '').trim() || `Yenidoğan${anneSoyad ? ' ' + anneSoyad : ''}`
    const cinsiyet = g.cinsiyet ? String(g.cinsiyet) : null
    const notlar = {
      dogumBilgisi: true,
      apgar1: g.apgar1 ?? null,
      apgar5: g.apgar5 ?? null,
      dogumKilosuGram: g.kiloGram ?? null,
      dogumBoyuCm: g.boyCm ?? null,
      dogumBasCevresiCm: g.basCm ?? null,
      dogumSekli: g.dogumSekli ?? null,
      anneGebelikId: g.gebelikId,
      anneId: g.anneId,
    }

    const { data: yeni, error: yeniHata } = await sb.from('patients').insert({
      doctor_id: g.doktorId,
      name_encrypted: encrypt(JSON.stringify({ ad: bebekAdi })),
      dob_encrypted: encrypt(String(g.dogumTarihi).slice(0, 10)),
      gender_encrypted: cinsiyet ? encrypt(cinsiyet) : null,
      notes_encrypted: encrypt(JSON.stringify(notlar)),
      is_active: true,
    }).select('id').single()
    if (yeniHata || !yeni) throw new Error(yeniHata?.message || 'Bebek kaydı oluşturulamadı')
    bebekPatientId = yeni.id
  }
  if (!bebekPatientId) throw new Error('Bebek kaydı oluşturulamadı')

  const preterm = pretermOrLbw({ gestHafta: g.gestHafta ?? null, kiloGram: g.kiloGram ?? null })
  const lbw = g.kiloGram != null && g.kiloGram < 2500
  const cinsKod = cinsiyetKod(g.cinsiyet)

  let kartId = g.mevcutKartId || null
  if (!kartId) {
    const { data: kart, error: kartHata } = await sb.from('bebek_kartlari').insert({
      dogum_id: dogumId,
      gebelik_id: g.gebelikId,
      anne_patient_id: g.anneId,
      bebek_patient_id: bebekPatientId,
      doctor_id: g.doktorId,
      sira: 1,
      cinsiyet: cinsKod,
      dogum_zamani: dogumZamani,
      gebelik_haftasi: g.gestHafta ?? null,
      kilo_gram: g.kiloGram ?? null,
      boy_cm: g.boyCm ?? null,
      bas_cevresi_cm: g.basCm ?? null,
      apgar1: g.apgar1 ?? null,
      apgar5: g.apgar5 ?? null,
      canli: true,
      yenidogan_tarama: g.gkdRisk ? { gkd: true } : {},
      gorevler: [],
      kan_grubu: g.kanGrubu ?? null,
      preterm,
      lbw,
    }).select('id').single()
    if (kartHata || !kart) throw new Error(kartHata?.message || 'Bebek kartı oluşturulamadı')
    kartId = kart.id
  } else {
    await sb.from('bebek_kartlari').update({
      bebek_patient_id: bebekPatientId,
      preterm,
      lbw,
      kan_grubu: g.kanGrubu ?? null,
    }).eq('id', kartId).eq('doctor_id', g.doktorId)
  }
  if (!kartId) throw new Error('Bebek kartı oluşturulamadı')

  const { data: cl } = await sb.from('taburcu_checklist').select('id').eq('dogum_id', dogumId).eq('bebek_id', kartId).maybeSingle()
  if (!cl) {
    await sb.from('taburcu_checklist').insert({
      doctor_id: g.doktorId,
      dogum_id: dogumId,
      bebek_id: kartId,
      maddeler: g.gkdRisk ? { gkd: true, gkd_risk: true } : {},
    })
  }

  await sb.from('gebelikler').update({
    yenidogan_patient_id: bebekPatientId,
    updated_at: new Date().toISOString(),
  }).eq('id', g.gebelikId).eq('doctor_id', g.doktorId)

  await baglaLohusaVeTakvim(sb, {
    doktorId: g.doktorId,
    bebekId: bebekPatientId,
    anneId: g.anneId,
    dogumId,
    dogumAt: dogumZamani,
    preterm,
    gkdRisk: Boolean(g.gkdRisk),
  })

  return { bebekPatientId, dogumId, kartId, zatenVar: false }
}

function cinsiyetKod(v: unknown): 'K' | 'E' | null {
  const s = String(v || '').toLowerCase()
  if (s === 'e' || s === 'erkek' || s === 'male' || s === 'm') return 'E'
  if (s === 'k' || s === 'kız' || s === 'kiz' || s === 'female' || s === 'f') return 'K'
  return null
}

/** After spine or visit-first live birth: lohusa checklist + calendar (idempotent). */
export async function baglaLohusaVeTakvim(sb: Sb, input: {
  doktorId: string
  bebekId: string
  anneId: string
  dogumId: string
  dogumAt: string
  preterm: boolean
  gkdRisk: boolean
}): Promise<void> {
  const { data: loh } = await sb.from('lohusa_checklist').select('id').eq('dogum_id', input.dogumId).maybeSingle()
  if (!loh) {
    await sb.from('lohusa_checklist').insert({
      doctor_id: input.doktorId,
      dogum_id: input.dogumId,
      anne_id: input.anneId,
    })
  }
  await takvimiYaz(sb, {
    doktorId: input.doktorId,
    bebekId: input.bebekId,
    anneId: input.anneId,
    dogumAt: input.dogumAt,
    pretermOrLbw: input.preterm,
    gkdRisk: input.gkdRisk,
  })
}

function ntpStubCsv(): Buffer {
  const satirlar = [
    'Test,Sonuç,Bayrak',
    ...NTP_KEYS.map((k) => `${NTP_ETIKET[k]},,`),
  ]
  return Buffer.from(satirlar.join('\n'), 'utf8')
}

export async function ntp1OrnekStub(sb: Sb, input: {
  doktorId: string
  bebekId: string
  anneId: string
  ntp1At?: string | null
  barkod?: string | null
}): Promise<{ belgeId: string; panelId: string }> {
  const sahip = ntpBelgeSahibi({ belgePatientId: input.bebekId, bebekPatientId: input.bebekId, annePatientId: input.anneId })
  if (!sahip.ok) throw new Error(sahip.neden)

  const { data: mevcut } = await sb.from('lab_paneller')
    .select('id, belge_id')
    .eq('patient_id', input.bebekId)
    .eq('doctor_id', input.doktorId)
    .eq('panel_type', 'yenidogan_tarama')
    .eq('sample_no', '1')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (mevcut?.id && mevcut.belge_id) return { belgeId: mevcut.belge_id, panelId: mevcut.id }

  const meta = await uploadDocument({ supabase: sb }, {
    doctorId: input.doktorId,
    patientId: input.bebekId,
    fileName: 'NTP-1-ornek-alindi.csv',
    fileType: 'text/csv',
    bytes: ntpStubCsv(),
    notes: `NTP-1 örnek alındı — sonuç bekleniyor. ${NTP_DISCLAIMER} Barkod: ${input.barkod || '—'}`,
    category: 'lab',
    uploadedBy: input.doktorId,
  })

  const numune = (input.ntp1At || new Date().toISOString()).slice(0, 10)
  const { data: panel, error } = await sb.from('lab_paneller').insert({
    belge_id: meta.id,
    doctor_id: input.doktorId,
    patient_id: input.bebekId,
    lab_adi: 'Ulusal Yenidoğan Tarama (NTP-1)',
    numune_tarihi: numune,
    panel_type: 'yenidogan_tarama',
    sample_no: '1',
    durum: 'ornek_alindi',
    kaynaklar: ['stub'],
    extract_json: { stub: true, disclaimer: NTP_DISCLAIMER },
  }).select('id').single()
  if (error || !panel) throw new Error(error?.message || 'NTP-1 panel yazılamadı')

  const satirlar = NTP_KEYS.map((k, i) => ({
    panel_id: panel.id,
    patient_id: input.bebekId,
    doctor_id: input.doktorId,
    sira: i,
    raw_name: NTP_ETIKET[k],
    canonical_key: k,
    flag: 'unknown',
    numune_tarihi: numune,
  }))
  await sb.from('lab_satirlar').insert(satirlar)
  return { belgeId: meta.id, panelId: panel.id }
}

export async function takvimiYaz(sb: Sb, input: {
  doktorId: string
  bebekId: string
  anneId: string
  dogumAt: string
  pretermOrLbw: boolean
  gkdRisk: boolean
  extra?: ReturnType<typeof generateCalendar>
}): Promise<{ gorev: number; asi: number }> {
  const plan = [
    ...generateCalendar({
      dogumAt: input.dogumAt,
      pretermOrLbw: input.pretermOrLbw,
      gkdRisk: input.gkdRisk,
      skipHastaneLohusa: true,
    }),
    ...(input.extra || []),
  ]

  const { data: mevcutGorev } = await sb.from('bebek_gorevleri').select('kind, due_at, title, asi_kod').eq('bebek_id', input.bebekId)
  const gorevKey = new Set((mevcutGorev || []).map((g) => `${g.kind}|${g.due_at}|${g.asi_kod || g.title}`))

  const yeniGorev = plan.filter((t) => !gorevKey.has(`${t.kind}|${t.due_at}|${t.asi_kod || t.title}`)).map((t) => ({
    doctor_id: input.doktorId,
    bebek_id: input.bebekId,
    anne_id: input.anneId,
    kind: t.kind,
    due_at: t.due_at,
    due_end_at: t.due_end_at || null,
    status: 'bekliyor',
    source: t.source,
    title: t.title,
    notes: t.notes || null,
    asi_kod: t.asi_kod || null,
  }))
  if (yeniGorev.length) await sb.from('bebek_gorevleri').insert(yeniGorev)

  const { data: mevcutAsi } = await sb.from('asi_dozlari').select('kod').eq('bebek_id', input.bebekId)
  const asiVar = new Set((mevcutAsi || []).map((a) => a.kod))
  const yeniAsi = ASI_V1.filter((a) => !asiVar.has(a.kod)).map((a) => ({
    doctor_id: input.doktorId,
    bebek_id: input.bebekId,
    kod: a.kod,
    due_at: plan.find((t) => t.asi_kod === a.kod)?.due_at || input.dogumAt.slice(0, 10),
  }))
  if (yeniAsi.length) await sb.from('asi_dozlari').insert(yeniAsi)

  return { gorev: yeniGorev.length, asi: yeniAsi.length }
}

export async function yeniBebekBildir(sb: Sb, input: {
  doktorId: string
  bebekId: string
  anneId: string
  dogumAt: string
}): Promise<void> {
  const { data: varMi } = await sb.from('bebek_gorevleri').select('id').eq('bebek_id', input.bebekId).eq('kind', 'yeni_bebek').maybeSingle()
  if (varMi) return
  await sb.from('bebek_gorevleri').insert({
    doctor_id: input.doktorId,
    bebek_id: input.bebekId,
    anne_id: input.anneId,
    kind: 'yeni_bebek',
    due_at: input.dogumAt.slice(0, 10),
    status: 'bekliyor',
    source: 'sistem',
    title: YENI_BEBEK_BILDIRIM,
  })
}

export function mergeTaburcuMaddeler(mevcut: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const m = { ...mevcut }
  const setBool = (key: string, spineKey: string, atKey: string, val: unknown) => {
    if (val === null || val === '') {
      m[spineKey] = false
      m[atKey] = null
      return
    }
    m[spineKey] = true
    m[atKey] = isoTs(val) || val
  }
  if (patch.ntp1AlindiAt !== undefined) setBool('ntp1', 'ntp1', 'ntp1_alindi_at', patch.ntp1AlindiAt)
  if (patch.hepb1At !== undefined) setBool('hepb1', 'hepb1', 'hepb1_at', patch.hepb1At)
  if (patch.vitkAt !== undefined) setBool('vitk', 'vitk', 'vitk_at', patch.vitkAt)
  if (patch.isitmeAt !== undefined) setBool('isitme', 'isitme', 'isitme_at', patch.isitmeAt)
  if (patch.pulseoxAt !== undefined) {
    if (patch.pulseoxAt) { m.pulseox = true; m.pulseox_at = isoTs(patch.pulseoxAt) }
    else { m.pulseox = false; m.pulseox_at = null }
  }
  if (patch.ntp1Barkod !== undefined) m.ntp1_barkod = patch.ntp1Barkod === '' ? null : patch.ntp1Barkod
  if (patch.ntp2RandevuAt !== undefined) {
    m.ntp2_randevu_at = patch.ntp2RandevuAt
    m.ntp2_randevu = Boolean(patch.ntp2RandevuAt)
  }
  if (patch.ntp2Yer !== undefined) m.ntp2_yer = patch.ntp2Yer
  if (patch.isitmeSonuc !== undefined) {
    m.isitme_sonuc = patch.isitmeSonuc
    if (patch.isitmeSonuc && patch.isitmeSonuc !== 'yapilmadi') m.isitme = true
  }
  if (patch.pulseoxSonuc !== undefined) {
    m.pulseox_sonuc = patch.pulseoxSonuc
    if (patch.pulseoxSonuc) m.pulseox = true
  }
  if (patch.ntp1BeslenmeSonrasi !== undefined) m.ntp1_beslenme_sonrasi = Boolean(patch.ntp1BeslenmeSonrasi)
  if (patch.kirmiziRefleks !== undefined) m.kirmizi_refleks = Boolean(patch.kirmiziRefleks)
  if (patch.gkdRisk !== undefined) { m.gkd_risk = Boolean(patch.gkdRisk); m.gkd = Boolean(patch.gkdRisk) }
  if (patch.dvitBaslandi !== undefined) { m.dvit_baslandi = Boolean(patch.dvitBaslandi); m.dvit = Boolean(patch.dvitBaslandi) }
  if (patch.emzirmeDanismanlik !== undefined) { m.emzirme_danismanlik = Boolean(patch.emzirmeDanismanlik); m.emzirme = Boolean(patch.emzirmeDanismanlik) }
  if (patch.kalcaUsRandevuAt !== undefined) m.kalca_us_randevu_at = patch.kalcaUsRandevuAt
  return m
}

export async function tamamlaTaburcu(sb: Sb, input: {
  doktorId: string
  dogumId: string
  onaylayan: string
  istisna?: TaburcuIstisna | null
}): Promise<{
  ok: boolean
  error?: string
  sms?: string
  bebekId?: string
  ntp1BelgeId?: string
}> {
  const { data: dogum } = await sb.from('dogum_olaylari').select('*').eq('id', input.dogumId).eq('doctor_id', input.doktorId).maybeSingle()
  if (!dogum) return { ok: false, error: 'Doğum kaydı bulunamadı.' }
  const { data: kart } = await sb.from('bebek_kartlari').select('*').eq('dogum_id', input.dogumId).order('sira', { ascending: true }).limit(1).maybeSingle()
  if (!kart) return { ok: false, error: 'Bebek kartı yok — canlı doğum bebek kartı oluşturmalıdır.' }
  const bebekPatientId = kart.bebek_patient_id as string | null
  if (!bebekPatientId) return { ok: false, error: 'Bebek kartı yok — canlı doğum bebek kartı oluşturmalıdır.' }
  const anneId = String(kart.anne_patient_id || dogum.patient_id)
  const { data: cl } = await sb.from('taburcu_checklist').select('*').eq('dogum_id', input.dogumId).maybeSingle()
  if (cl?.kapatildi) {
    const m = asObj(cl.maddeler)
    return { ok: true, bebekId: bebekPatientId, sms: NTP2_SMS(String(m.ntp2_randevu_at || ''), '') }
  }

  const maddeler = asObj(cl?.maddeler)
  const tarama = asObj(kart.yenidogan_tarama)
  const redler = redlerFromJson(cl?.red_json)
  const gate = taburcuGate({
    checks: checksFromMaddeler(maddeler, tarama),
    redler,
    istisna: input.istisna || istisnaFromRow(cl?.istisna),
    dogumAt: String(dogum.dogum_zamani || new Date().toISOString()),
  })
  if (!gate.ok) return { ok: false, error: gate.neden }

  // Stub only when the heel sample was actually taken — refuse/istisna must not invent an NTP-1 belge.
  let ntp1BelgeId: string | undefined
  if (maddeler.ntp1_alindi_at || maddeler.ntp1 === true || tarama.ntp1) {
    const stub = await ntp1OrnekStub(sb, {
      doktorId: input.doktorId,
      bebekId: bebekPatientId,
      anneId,
      ntp1At: maddeler.ntp1_alindi_at ? String(maddeler.ntp1_alindi_at) : null,
      barkod: maddeler.ntp1_barkod ? String(maddeler.ntp1_barkod) : null,
    })
    ntp1BelgeId = stub.belgeId
  }

  const dogumGun = String(dogum.dogum_zamani || new Date().toISOString()).slice(0, 10)
  const ntp2Bas = addDaysSafe(dogumGun, 3)
  const ntp2Son = addDaysSafe(dogumGun, 5)
  const preterm = Boolean(kart.preterm || kart.lbw) || pretermOrLbw({
    gestHafta: kart.gebelik_haftasi == null ? null : Number(kart.gebelik_haftasi),
    kiloGram: kart.kilo_gram == null ? null : Number(kart.kilo_gram),
  })

  await takvimiYaz(sb, {
    doktorId: input.doktorId,
    bebekId: bebekPatientId,
    anneId,
    dogumAt: String(dogum.dogum_zamani || dogumGun),
    pretermOrLbw: preterm,
    gkdRisk: Boolean(maddeler.gkd_risk ?? maddeler.gkd ?? tarama.gkd),
    extra: gate.gorevler,
  })

  if (maddeler.hepb1_at || maddeler.hepb1) {
    await sb.from('asi_dozlari').upsert({
      doctor_id: input.doktorId,
      bebek_id: bebekPatientId,
      kod: 'HEPB1',
      due_at: dogumGun,
      given_at: String(maddeler.hepb1_at || dogumGun).slice(0, 10),
      yer: 'hastane',
    }, { onConflict: 'bebek_id,kod' })
  }

  await yeniBebekBildir(sb, {
    doktorId: input.doktorId,
    bebekId: bebekPatientId,
    anneId,
    dogumAt: String(dogum.dogum_zamani || dogumGun),
  })

  const yeniMaddeler = {
    ...maddeler,
    ntp2_randevu: true,
    ntp2_randevu_at: ntp2Bas,
    ntp2_yer: maddeler.ntp2_yer || 'ASM',
  }
  const istisnaDb = input.istisna ? istisnaToDb(input.istisna) : (cl?.istisna || null)

  await sb.from('taburcu_checklist').update({
    maddeler: yeniMaddeler,
    istisna: istisnaDb,
    kapatildi: true,
    kapatildi_at: new Date().toISOString(),
    onaylayan: input.onaylayan,
    updated_at: new Date().toISOString(),
  }).eq('dogum_id', input.dogumId)

  await sb.from('dogum_olaylari').update({
    durum: 'taburcu',
    updated_at: new Date().toISOString(),
  }).eq('id', input.dogumId)

  return {
    ok: true,
    bebekId: bebekPatientId,
    ntp1BelgeId,
    sms: NTP2_SMS(ntp2Bas, ntp2Son),
  }
}

function addDaysSafe(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export { num, isoTs, yolNorm, asObj, dogumSekli029 }
