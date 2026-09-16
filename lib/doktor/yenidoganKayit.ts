/**
 * Persistence for canlı doğum → bebek kartı, NTP-1 stub, calendar tasks.
 * Used by /api/doktor/gebelik (sonlandir) and /api/doktor/yenidogan.
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
  if (s.includes('C/S') || s.includes('SEZARY') || s.includes('SEZARYEN') || s === 'CS') return 'C/S'
  return 'NSD'
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
}

export async function olusturCanliDogum(sb: Sb, g: CanliDogumGirdi): Promise<{
  bebekPatientId: string
  dogumId: string
  kartId: string
  zatenVar: boolean
}> {
  const { data: mevcut } = await sb.from('gebelikler').select('yenidogan_patient_id').eq('id', g.gebelikId).eq('doctor_id', g.doktorId).maybeSingle()
  if (mevcut?.yenidogan_patient_id) {
    const { data: dogum } = await sb.from('dogum_olaylari').select('id').eq('bebek_id', mevcut.yenidogan_patient_id).maybeSingle()
    const { data: kart } = await sb.from('bebek_kartlari').select('id').eq('patient_id', mevcut.yenidogan_patient_id).maybeSingle()
    if (dogum && kart) {
      return { bebekPatientId: mevcut.yenidogan_patient_id, dogumId: dogum.id, kartId: kart.id, zatenVar: true }
    }
  }

  const { data: anne } = await sb.from('patients').select('name_encrypted').eq('id', g.anneId).maybeSingle()
  let anneSoyad = ''
  try {
    const n = JSON.parse(anne?.name_encrypted ? decrypt(anne.name_encrypted) : '{}') as { ad?: string; soyad?: string }
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

  const preterm = pretermOrLbw({ gestHafta: g.gestHafta ?? null, kiloGram: g.kiloGram ?? null })
  const lbw = g.kiloGram != null && g.kiloGram < 2500

  const { data: dogum, error: dogumHata } = await sb.from('dogum_olaylari').insert({
    doctor_id: g.doktorId,
    anne_id: g.anneId,
    bebek_id: yeni.id,
    gebelik_id: g.gebelikId,
    dogum_at: isoTs(g.dogumTarihi, new Date().toISOString()),
    yol: yolNorm(g.dogumSekli),
    apgar_1: g.apgar1 ?? null,
    apgar_5: g.apgar5 ?? null,
    kilo: g.kiloGram ?? null,
    boy: g.boyCm ?? null,
    bas: g.basCm ?? null,
    gest_hafta: g.gestHafta ?? null,
    canli: true,
  }).select('id').single()
  if (dogumHata || !dogum) throw new Error(dogumHata?.message || 'Doğum olayı kaydedilemedi')

  const { data: kart, error: kartHata } = await sb.from('bebek_kartlari').insert({
    doctor_id: g.doktorId,
    patient_id: yeni.id,
    anne_id: g.anneId,
    dogum_id: dogum.id,
    cinsiyet,
    kan_grubu: g.kanGrubu ?? null,
    preterm,
    lbw,
  }).select('id').single()
  if (kartHata || !kart) throw new Error(kartHata?.message || 'Bebek kartı oluşturulamadı')

  await sb.from('taburcu_checklist').insert({
    doctor_id: g.doktorId,
    dogum_id: dogum.id,
    gkd_risk: Boolean(g.gkdRisk),
  })
  await sb.from('lohusa_checklist').insert({
    doctor_id: g.doktorId,
    dogum_id: dogum.id,
    anne_id: g.anneId,
  })

  await sb.from('gebelikler').update({
    yenidogan_patient_id: yeni.id,
    updated_at: new Date().toISOString(),
  }).eq('id', g.gebelikId).eq('doctor_id', g.doktorId)

  return { bebekPatientId: yeni.id, dogumId: dogum.id, kartId: kart.id, zatenVar: false }
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
    anne_id: t.hedef === 'anne' ? input.anneId : input.anneId,
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

export function checksFromRow(row: Record<string, unknown> | null): TaburcuChecks {
  return {
    ntp1: Boolean(row?.ntp1_alindi_at),
    hepb1: Boolean(row?.hepb1_at),
    vitk: Boolean(row?.vitk_at),
    isitme: Boolean(row?.isitme_at) && String(row?.isitme_sonuc || '') !== 'yapilmadi',
  }
}

export function redlerFromJson(raw: unknown): RedKayit[] {
  if (!raw || typeof raw !== 'object') return []
  const maddeler = (raw as { maddeler?: unknown }).maddeler
  if (!Array.isArray(maddeler)) return []
  return maddeler.filter((m) => m && typeof m === 'object' && (m as RedKayit).status === 'red') as RedKayit[]
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
  const { data: kart } = await sb.from('bebek_kartlari').select('*').eq('dogum_id', input.dogumId).maybeSingle()
  if (!kart) return { ok: false, error: 'Bebek kartı yok — canlı doğum bebek kartı oluşturmalıdır.' }
  const { data: cl } = await sb.from('taburcu_checklist').select('*').eq('dogum_id', input.dogumId).maybeSingle()
  if (cl?.taburcu_onay_at) {
    return { ok: true, bebekId: dogum.bebek_id, sms: NTP2_SMS(String(cl.ntp2_randevu_at || ''), '') }
  }

  const redler = redlerFromJson(cl?.red_json)
  const gate = taburcuGate({
    checks: checksFromRow(cl),
    redler,
    istisna: input.istisna || (cl?.istisna as TaburcuIstisna | null) || null,
    dogumAt: String(dogum.dogum_at),
  })
  if (!gate.ok) return { ok: false, error: gate.neden }

  // Stub only when the heel sample was actually taken — refuse/istisna must not invent an NTP-1 belge.
  let ntp1BelgeId: string | undefined
  if (cl?.ntp1_alindi_at) {
    const stub = await ntp1OrnekStub(sb, {
      doktorId: input.doktorId,
      bebekId: dogum.bebek_id,
      anneId: dogum.anne_id,
      ntp1At: String(cl.ntp1_alindi_at),
      barkod: cl?.ntp1_barkod,
    })
    ntp1BelgeId = stub.belgeId
  }

  const dogumGun = String(dogum.dogum_at).slice(0, 10)
  const ntp2Bas = addDaysSafe(dogumGun, 3)
  const ntp2Son = addDaysSafe(dogumGun, 5)

  await takvimiYaz(sb, {
    doktorId: input.doktorId,
    bebekId: dogum.bebek_id,
    anneId: dogum.anne_id,
    dogumAt: String(dogum.dogum_at),
    pretermOrLbw: Boolean(kart.preterm || kart.lbw),
    gkdRisk: Boolean(cl?.gkd_risk),
    extra: gate.gorevler,
  })

  if (cl?.hepb1_at) {
    await sb.from('asi_dozlari').upsert({
      doctor_id: input.doktorId,
      bebek_id: dogum.bebek_id,
      kod: 'HEPB1',
      due_at: dogumGun,
      given_at: String(cl.hepb1_at).slice(0, 10),
      yer: 'hastane',
    }, { onConflict: 'bebek_id,kod' })
  }

  await yeniBebekBildir(sb, {
    doktorId: input.doktorId,
    bebekId: dogum.bebek_id,
    anneId: dogum.anne_id,
    dogumAt: String(dogum.dogum_at),
  })

  await sb.from('taburcu_checklist').update({
    ntp2_randevu_at: ntp2Bas,
    ntp2_yer: cl?.ntp2_yer || 'ASM',
    istisna: input.istisna || cl?.istisna || null,
    taburcu_onay_at: new Date().toISOString(),
    onaylayan: input.onaylayan,
    updated_at: new Date().toISOString(),
  }).eq('dogum_id', input.dogumId)

  return {
    ok: true,
    bebekId: dogum.bebek_id,
    ntp1BelgeId,
    sms: NTP2_SMS(ntp2Bas, ntp2Son),
  }
}

function addDaysSafe(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export { num, isoTs, yolNorm }
