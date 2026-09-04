import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { loadPortalMessages } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { imagingDisplayLabel, imagingPortalKind } from '@/lib/doktor/imagingModalities'
import type {
  PortalBundle,
  PortalMedication,
  PortalMedChange,
  PortalResult,
  PortalVisit,
} from '@/lib/portal/types'

export const dynamic = 'force-dynamic'

type LabTest = {
  testName?: string
  ad?: string
  name?: string
  deger?: string | number
  value?: string | number
  birim?: string
  unit?: string
  referans?: string
  ref?: string
  anormal?: boolean
  abnormal?: boolean
  flag?: string
}

function parseLabTests(testler: unknown): LabTest[] {
  if (Array.isArray(testler)) return testler as LabTest[]
  if (testler && typeof testler === 'object' && Array.isArray((testler as { tests?: unknown }).tests)) {
    return (testler as { tests: LabTest[] }).tests
  }
  return []
}

function labRowsFromTests(tests: LabTest[]) {
  return tests.map((t, idx) => {
    const test = String(t.testName || t.ad || t.name || `Test ${idx + 1}`)
    const deger = String(t.deger ?? t.value ?? '—')
    const birim = String(t.birim || t.unit || '')
    const referans = String(t.referans || t.ref || '')
    const anormal = Boolean(
      t.anormal ?? t.abnormal ?? (typeof t.flag === 'string' && /abnormal|yüksek|dusuk|düşük|h/i.test(t.flag))
    )
    return { test, deger, birim, referans, anormal }
  })
}

function parseBp(tansiyon: unknown): { sistolik: number; diastolik: number } | null {
  if (typeof tansiyon !== 'string') return null
  const m = tansiyon.match(/(\d+)\s*[/]\s*(\d+)/)
  if (!m) return null
  return { sistolik: Number(m[1]), diastolik: Number(m[2]) }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token
  if (!token) {
    return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { data: tokenData, error: tokenError } = await sb
    .from('hasta_portal_tokens')
    .select('patient_id, doctor_id, expires_at, pin_hash')
    .eq('token_hash', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })
  }

  const locked = requirePortalUnlock(request, token, {
    patient_id: tokenData.patient_id as string,
    doctor_id: tokenData.doctor_id as string,
    expires_at: tokenData.expires_at as string,
    pin_hash: (tokenData.pin_hash as string | null) ?? null,
  })
  if (locked) return locked

  const patientId = tokenData.patient_id as string
  const bundle: PortalBundle = emptyPortalBundle()

  // Sessions + notes → visits
  const { data: sessionsRaw } = await sb
    .from('sessions')
    .select('id, created_at, specialty, approved_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(20)

  const sessionIds = (sessionsRaw || []).map((s) => s.id)
  type NoteRow = {
    session_id: string
    content_subjektif?: string | null
    content_objektif?: string | null
    content_degerlendirme?: string | null
    content_plan?: string | null
    basvuru_yakinmasi?: string | null
    vitaller?: Record<string, string | number | null> | null
    specialty?: string | null
    created_at?: string | null
  }
  const notesBySession = new Map<string, NoteRow>()
  if (sessionIds.length) {
    const { data: notes } = await sb
      .from('notes')
      .select(
        'session_id, content_subjektif, content_objektif, content_degerlendirme, content_plan, basvuru_yakinmasi, vitaller, specialty, created_at'
      )
      .in('session_id', sessionIds)
    for (const n of notes || []) {
      const sid = String(n.session_id || '')
      if (!sid || notesBySession.has(sid)) continue
      notesBySession.set(sid, n as NoteRow)
    }
  }

  const visits: PortalVisit[] = (sessionsRaw || []).map((s) => {
    const note = notesBySession.get(s.id)
    const vitaller = note?.vitaller && typeof note.vitaller === 'object' ? note.vitaller : undefined
    return {
      id: s.id,
      tarih: s.created_at,
      brans: String(s.specialty || note?.specialty || 'Genel'),
      basvuruNedeni: String(note?.basvuru_yakinmasi || 'Muayene').trim() || 'Muayene',
      hekim: 'Doktorunuz',
      ozetKisa: String(note?.content_degerlendirme || note?.content_plan || 'Ziyaret kaydı').slice(0, 160),
      subjektif: note?.content_subjektif ? String(note.content_subjektif) : undefined,
      objektif: note?.content_objektif ? String(note.content_objektif) : undefined,
      degerlendirme: note?.content_degerlendirme ? String(note.content_degerlendirme) : undefined,
      plan: note?.content_plan ? String(note.content_plan) : undefined,
      vitaller,
      takip: note?.content_plan ? String(note.content_plan).slice(0, 120) : undefined,
    }
  })
  bundle.visits = visits

  // Medications + history
  const { data: medsRaw } = await sb
    .from('hasta_ilaclar')
    .select('id, ilac_adi, doz, kullanim_sikli, notlar, aktif, baslangic_tarihi, bitis_tarihi, yazan_doktor')
    .eq('patient_id', patientId)
    .order('baslangic_tarihi', { ascending: false })
    .limit(60)

  const medications: PortalMedication[] = (medsRaw || []).map((m) => ({
    id: m.id,
    ad: String(m.ilac_adi || 'İlaç'),
    doz: String(m.doz || '—'),
    siklik: String(m.kullanim_sikli || '—'),
    baslangic: String(m.baslangic_tarihi || '').slice(0, 10) || '—',
    bitis: m.bitis_tarihi ? String(m.bitis_tarihi).slice(0, 10) : null,
    aktif: Boolean(m.aktif),
    not: m.notlar ? String(m.notlar) : undefined,
    yazan: m.yazan_doktor ? String(m.yazan_doktor) : undefined,
  }))
  bundle.medications = medications

  const medicationHistory: PortalMedChange[] = []
  for (const m of medsRaw || []) {
    const ad = String(m.ilac_adi || 'İlaç')
    if (m.baslangic_tarihi) {
      medicationHistory.push({
        id: `${m.id}-start`,
        tarih: String(m.baslangic_tarihi).slice(0, 10),
        tip: 'baslandi',
        ilacAdi: ad,
        aciklama: `${ad} başlandı${m.doz ? ` (${m.doz})` : ''}.`,
      })
    }
    if (m.bitis_tarihi || m.aktif === false) {
      medicationHistory.push({
        id: `${m.id}-stop`,
        tarih: String(m.bitis_tarihi || m.baslangic_tarihi || '').slice(0, 10) || '—',
        tip: 'durduruldu',
        ilacAdi: ad,
        aciklama: `${ad} sonlandırıldı.`,
      })
    }
  }
  medicationHistory.sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
  bundle.medicationHistory = medicationHistory

  // Labs → results
  const { data: labRaw } = await sb
    .from('hasta_lab_sonuclari')
    .select('id, testler, created_at, lab_adi, sonuc_tarihi')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(15)

  const results: PortalResult[] = []
  for (const row of labRaw || []) {
    const labs = labRowsFromTests(parseLabTests(row.testler))
    const anyAbnormal = labs.some((l) => l.anormal)
    results.push({
      id: row.id,
      tur: 'laboratuvar',
      baslik: String(row.lab_adi || 'Laboratuvar sonucu'),
      tarih: String(row.sonuc_tarihi || row.created_at),
      ozet:
        labs
          .slice(0, 3)
          .map((l) => `${l.test}  ·  ${l.deger}${l.birim ? ` ${l.birim}` : ''}`)
          .join(' · ') || 'Lab sonucu',
      durum: anyAbnormal ? 'anormal' : 'normal',
      labSatirlari: labs,
    })
  }

  // Imaging — columns from hasta_goruntulemeler schema
  const { data: imgRaw } = await sb
    .from('hasta_goruntulemeler')
    .select('id, created_at, modalite, vucut_bolgesi, rapor_metni, goruntuleme_tarihi, dosya_url')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(15)

  for (const row of imgRaw || []) {
    const tip = String(row.modalite || '')
    const tur = imagingPortalKind(tip)
    const tarih = String(row.goruntuleme_tarihi || row.created_at)
    const modaliteLabel = imagingDisplayLabel(tip, 'patient')
    results.push({
      id: row.id,
      tur,
      baslik: [modaliteLabel, row.vucut_bolgesi].filter(Boolean).join(' · ') || 'Görüntüleme',
      tarih,
      ozet: String(row.rapor_metni || 'Rapor paylaşıldı').slice(0, 140),
      durum: 'raporlandi',
      modalite: modaliteLabel,
      gorselUrl: row.dosya_url || '/sagligim/imaging-placeholder.jpg',
      raporMetni: row.rapor_metni ? String(row.rapor_metni) : undefined,
    })
  }

  results.sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
  bundle.results = results

  // Tracking from latest notes with vitals
  for (const note of notesBySession.values()) {
    const v = note.vitaller
    if (!v || typeof v !== 'object') continue
    const tarih = String(note.created_at || '').slice(0, 10)
    if (!tarih) continue
    const bp = parseBp(v.tansiyon)
    if (bp) bundle.tracking.tansiyon.push({ tarih, ...bp })
    if (typeof v.kilo === 'number') bundle.tracking.kilo.push({ tarih, deger: v.kilo })
    if (typeof v.nabiz === 'number') bundle.tracking.nabiz.push({ tarih, deger: Number(v.nabiz) })
    if (typeof v.spo2 === 'number') bundle.tracking.spo2.push({ tarih, deger: Number(v.spo2) })
  }
  if (bundle.tracking.tansiyon.length || bundle.tracking.kilo.length) {
    const lastBp = bundle.tracking.tansiyon[bundle.tracking.tansiyon.length - 1]
    const lastKilo = bundle.tracking.kilo[bundle.tracking.kilo.length - 1]
    const lastNabiz = bundle.tracking.nabiz[bundle.tracking.nabiz.length - 1]
    bundle.tracking.sonVitalOzet = [
      lastBp ? `TA ${lastBp.sistolik}/${lastBp.diastolik}` : null,
      lastNabiz ? `Nabız ${lastNabiz.deger}` : null,
      lastKilo ? `Kilo ${lastKilo.deger} kg` : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  // Messages from DB
  const messages = await loadPortalMessages(sb, patientId)
  bundle.messages = messages
  bundle.history = emptyPortalBundle().history

  // Summary chips
  const aktifIlac = medications.filter((m) => m.aktif).length
  const lastLab = results.find((r) => r.tur === 'laboratuvar')
  const unreadMsgs = messages.filter((m) => !m.okundu).length
  bundle.summary = {
    aktifIlac,
    bekleyenMesaj: unreadMsgs,
    sonLabOzet: lastLab?.ozet || 'Henüz lab sonucu yok',
    yaklasanKontrol: null,
    sonAktivite: [
      ...messages.slice(0, 2).map((m) => ({
        id: `m-${m.id}`,
        tur: 'mesaj' as const,
        baslik: `Mesaj: ${m.konu}`,
        tarih: m.tarih,
        href: 'mesajlar',
      })),
      ...visits.slice(0, 2).map((v) => ({
        id: `v-${v.id}`,
        tur: 'ziyaret' as const,
        baslik: `${v.brans} ziyareti`,
        tarih: v.tarih,
        href: 'ziyaretler',
      })),
      ...results.slice(0, 2).map((r) => ({
        id: `r-${r.id}`,
        tur: 'sonuc' as const,
        baslik: r.baslik,
        tarih: r.tarih,
        href: 'sonuclar',
      })),
    ]
      .sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
      .slice(0, 6),
  }

  // Intentionally omit first name from greeting payload
  return NextResponse.json(bundle)
}
