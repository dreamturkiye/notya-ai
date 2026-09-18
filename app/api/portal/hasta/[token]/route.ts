import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { loadPortalMessages } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { imagingDisplayLabel, imagingPortalKind } from '@/lib/doktor/imagingModalities'
import { yasamsalBulguOzeti } from '@/lib/clinical/yasamsalBulgular'
import { bransEtiketi } from '@/lib/doktor/bransAdlari'
import { persentilEgrileri, ayFarki } from '@/lib/clinical/buyumeEgrisi'
import { hesaplaHedefBoy } from '@/lib/clinical/hedefBoy'
import { pediatriSekmesiUygun, yasYilKesir } from '@/lib/doktor/hastaDosyaSekmeleri'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { portalModulAktif, portalModulleri } from '@/lib/portal/moduller'
import { dahiliyeKartlari } from '@/lib/portal/dahiliyeKartlari'
import { derimHatirlatmalari, seansAraligi, sonrakiKontrol } from '@/specialties/dermatoloji/engines/portal-derim'
import {
  hedefOzetleri,
  sonrakiKontrol as dahiliyeSonrakiKontrol,
  takibimHatirlatmalari,
} from '@/specialties/dahiliye/engines/portal-takibim'
import { decrypt } from '@/lib/security/encryption'
import type {
  PortalBundle,
  PortalMedication,
  PortalMedChange,
  PortalResult,
  PortalVisit,
} from '@/lib/portal/types'

export const dynamic = 'force-dynamic'

// `sessions.specialty` holds a slug ('pediatri', 'kadin-dogum'); patients read the branch name via bransEtiketi
// (lib/doktor/bransAdlari) — "Pediatri · Doktorunuz", "Kadın Hastalıkları ve Doğum · Doktorunuz".

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
    global: { fetch: (u: RequestInfo | URL, o?: RequestInit) => fetch(u, { ...o, cache: 'no-store' }) },
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
  const doctorId = tokenData.doctor_id as string
  const bundle: PortalBundle = emptyPortalBundle()

  // Sessions + notes → visits.
  // KVKK/QA 2026-09-08: the portal must show ONLY notes the doctor has APPROVED. Approval is the
  // share gate — an unapproved note is a draft (provisional wording, possible errors, reasoning
  // the doctor never meant to share). Approval lives on notes.approved_at (sessions has no such
  // column). Previously every session mapped to a patient-visible visit regardless, leaking
  // drafts and even sessions whose note was unapproved/absent. Now: pull sessions, then keep only
  // those whose note is approved.
  const { data: sessionsRaw } = await sb
    .from('sessions')
    .select('id, created_at, specialty')
    .eq('patient_id', patientId)
    // HASTA-IZOLASYON-01: every portal read is scoped to the token's linked doctor as well as the
    // patient — a row another doctor managed to file under this patient id never reaches the portal.
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(40)

  const sessionIds = (sessionsRaw || []).map((s) => s.id)
  type NoteRow = {
    session_id: string
    content_subjektif?: string | null
    content_objektif?: string | null
    content_degerlendirme?: string | null
    content_plan?: string | null
    basvuru_yakinmasi?: string | null
    vitaller?: Record<string, string | number | null> | null
    created_at?: string | null
  }
  const notesBySession = new Map<string, NoteRow>()
  if (sessionIds.length) {
    // QA 2026-09-08: this select used to request `specialty`, which does not
    // exist on notes (it lives on sessions). Postgres rejected the whole query
    // with 42703, the error was discarded, and every patient's Ziyaretler and
    // Takip rendered empty — even for approved notes. Branch comes from the
    // session row instead, and query errors are no longer swallowed silently.
    const { data: notes, error: notesError } = await sb
      .from('notes')
      .select(
        'session_id, content_subjektif, content_objektif, content_degerlendirme, content_plan, basvuru_yakinmasi, vitaller, created_at, approved_at'
      )
      .in('session_id', sessionIds)
      .eq('doctor_id', doctorId)
      .not('approved_at', 'is', null)
    if (notesError) {
      console.error('[portal] notes query failed', notesError)
      return NextResponse.json({ error: 'Portal verileri yüklenemedi.' }, { status: 500 })
    }
    for (const n of notes || []) {
      const sid = String(n.session_id || '')
      if (!sid || notesBySession.has(sid)) continue
      notesBySession.set(sid, n as NoteRow)
    }
  }

  // Keep only sessions that have an APPROVED note (the share gate).
  const visibleSessions = (sessionsRaw || []).filter((s) => notesBySession.has(s.id)).slice(0, 20)

  const visits: PortalVisit[] = visibleSessions.map((s) => {
    const note = notesBySession.get(s.id)
    const vitaller = note?.vitaller && typeof note.vitaller === 'object' ? note.vitaller : undefined
    return {
      id: s.id,
      tarih: s.created_at,
      brans: bransEtiketi(s.specialty),
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

  // Medications + history.
  // NOTYA-RECETE-01: nottan aktarılan reçeteler 'beklemede' durumunda gelir ve
  // hastaya GÖSTERİLMEZ — hangisinin aktif olduğuna doktor panelden karar verir
  // (Dr. Mamur, 2026-09-08 — Seçenek C). Biten bir antibiyotik kürünü aylar sonra
  // "Aktif" diye göstermek zararlı olacağı için karar tahmin edilmez.
  const { data: medsRaw } = await sb
    .from('hasta_ilaclar')
    .select('id, ilac_adi, doz, kullanim_sikli, notlar, aktif, baslangic_tarihi, bitis_tarihi, yazan_doktor')
    .eq('patient_id', patientId)
    .eq('doctor_id', doctorId)
    .eq('onay_durumu', 'onayli')
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
    .eq('doctor_id', doctorId)
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
    .eq('doctor_id', doctorId)
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
      // KVKK/QA 2026-09-08: this used to fall back to a decorative stock photo
      // (/sagligim/imaging-placeholder.jpg) when no file was uploaded, and the
      // portal rendered it with "İndir" + "Tam ekran" — presenting a stock
      // image as the patient's own scan. No file means no image, full stop.
      gorselUrl: row.dosya_url ? String(row.dosya_url) : null,
      raporMetni: row.rapor_metni ? String(row.rapor_metni) : undefined,
    })
  }

  results.sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
  bundle.results = results

  const buyumeHamNoktalar: { tarihIso: string; kilo: number | null; boy: number | null; basCevresi: number | null }[] = []
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
    const boyN = typeof v.boy === 'number' ? v.boy : parseFloat(String(v.boy ?? '')) || null
    const basN = typeof v.basCevresi === 'number' ? v.basCevresi : parseFloat(String(v.basCevresi ?? '')) || null
    const kiloN = typeof v.kilo === 'number' ? v.kilo : null
    if (kiloN || boyN || basN) buyumeHamNoktalar.push({ tarihIso: String(note.created_at || ''), kilo: kiloN, boy: boyN, basCevresi: basN })
  }
  if (bundle.tracking.tansiyon.length || bundle.tracking.kilo.length) {
    const lastBp = bundle.tracking.tansiyon[bundle.tracking.tansiyon.length - 1]
    const lastKilo = bundle.tracking.kilo[bundle.tracking.kilo.length - 1]
    const lastNabiz = bundle.tracking.nabiz[bundle.tracking.nabiz.length - 1]
    const lastSpo2 = bundle.tracking.spo2[bundle.tracking.spo2.length - 1]
    const ozet = yasamsalBulguOzeti({
      tansiyon: lastBp ? `${lastBp.sistolik}/${lastBp.diastolik}` : null,
      nabiz: lastNabiz?.deger ?? null,
      spo2: lastSpo2?.deger ?? null,
      kilo: lastKilo?.deger ?? null,
    })
    if (ozet) bundle.tracking.sonVitalOzet = ozet
  }

  // SAGLIGIM-PORTAL-REGISTRY — specialty slices attach ONLY via lib/portal/moduller.ts eligibility
  // (token doctor's specialty × patient records × age). Previously büyüme was computed for every patient
  // with a DOB (adults included) and Pap/HPV reminders for every woman, whatever the practice.
  const hastaRow = (await sb.from('patients').select('dob_encrypted, gender_encrypted, notes_encrypted, gender').eq('id', patientId).eq('doctor_id', doctorId).maybeSingle()).data
  const coz = (v: unknown) => { try { return v ? decrypt(String(v)) : null } catch { return null } }
  const dogumIso = coz(hastaRow?.dob_encrypted)
  const cinsiyetHam = coz(hastaRow?.gender_encrypted) || ''
  const doktorBransi = await hekimBransi(sb, tokenData.doctor_id as string)
  const { data: geb } = await sb.from('gebelikler').select('id, sat, tdt').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('durum', 'aktif').order('created_at', { ascending: false }).limit(1).maybeSingle()
  const { data: ks } = await sb.from('kadin_sagligi').select('son_pap, son_hpv, son_mamografi, son_dxa, son_kolorektal, hrt, hrt_baslangic, histerektomi').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
  const { data: kontr } = await sb.from('kontrasepsiyon').select('yontem, baslangic, ria_notu, aktif').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('aktif', true).maybeSingle()
  bundle.portal = portalModulleri({
    doktorBransi,
    hastaYasYil: yasYilKesir(dogumIso),
    gebelikAktif: !!geb,
    kdKaydi: !!ks || !!kontr,
    buyumeOlcumu: buyumeHamNoktalar.length > 0,
    dahiliyeKaydi: (await dahiliyeKartlari(sb, patientId, doctorId)).length > 0,
  })
  const modulAktif = (id: Parameters<typeof portalModulAktif>[1]) => portalModulAktif(bundle, id)

  // Büyüme Eğrileri (Neyzi standartları) — doktor tarafındakiyle aynı hesap, hasta portalında da
  if (modulAktif('buyume')) {
    const cinsiyet = cinsiyetHam === 'male' || cinsiyetHam === 'female' ? cinsiyetHam : null
    if (dogumIso && cinsiyet) {
      const mevcutYasAy = ayFarki(dogumIso) ?? 0
      const ustSinir = Math.max(24, mevcutYasAy + 6)
      const noktalar: Record<'kilo' | 'boy' | 'basCevresi' | 'vki', { ay: number; deger: number; tarih: string }[]> = { kilo: [], boy: [], basCevresi: [], vki: [] }
      for (const n of buyumeHamNoktalar) {
        const ay = ayFarki(dogumIso, n.tarihIso)
        if (ay === null) continue
        if (n.kilo != null) noktalar.kilo.push({ ay, deger: n.kilo, tarih: n.tarihIso })
        if (n.boy != null) noktalar.boy.push({ ay, deger: n.boy, tarih: n.tarihIso })
        if (n.basCevresi != null) noktalar.basCevresi.push({ ay, deger: n.basCevresi, tarih: n.tarihIso })
        if (n.kilo != null && n.boy != null && ay >= 24) noktalar.vki.push({ ay, deger: Math.round((n.kilo / Math.pow(n.boy / 100, 2)) * 100) / 100, tarih: n.tarihIso })
      }
      bundle.buyume = {
        dogumBilinmiyor: false,
        mevcutYasAy,
        cinsiyet,
        parametreler: {
          kilo: { birim: 'kg', egriler: persentilEgrileri('kilo', cinsiyet, ustSinir), noktalar: noktalar.kilo },
          boy: { birim: 'cm', egriler: persentilEgrileri('boy', cinsiyet, ustSinir), noktalar: noktalar.boy },
          basCevresi: { birim: 'cm', egriler: persentilEgrileri('basCevresi', cinsiyet, ustSinir), noktalar: noktalar.basCevresi },
          vki: mevcutYasAy >= 24 || noktalar.vki.length > 0
            ? { birim: 'kg/m²', egriler: persentilEgrileri('vki', cinsiyet, ustSinir).map((s) => ({ ...s, noktalar: s.noktalar.filter((n) => n.ay >= 24) })), noktalar: noktalar.vki }
            : null,
        },
      }
    }
    try {
      if (pediatriSekmesiUygun(dogumIso)) {
        const notlar = hastaRow?.notes_encrypted ? (() => { try { return JSON.parse(decrypt(String(hastaRow.notes_encrypted))) as Record<string, unknown> } catch { return {} } })() : {}
        const anne = notlar.anneBoyCm
        const baba = notlar.babaBoyCm
        if (anne != null && baba != null) {
          const h = hesaplaHedefBoy({ anneBoy: Number(anne), babaBoy: Number(baba), cinsiyet: cinsiyetHam || cinsiyet })
          if (h.ok) bundle.hedefBoy = h.sonuc
        }
      }
    } catch (e) { console.error('[portal] hedefBoy:', e) }
  }

  // NOTYA-KHD-05 — aktif gebelik varsa anne için "Gebeliğim"
  if (modulAktif('gebelik') && geb) try {
    const { gebelikYasi, izlemDurumlari } = await import('@/lib/clinical/gebelik')
    const y = gebelikYasi(geb.sat, geb.tdt)
    if (y) {
      const { data: izl } = await sb.from('gebelik_izlemleri').select('tarih, hafta, kilo, fetal_kalp_atimi').eq('gebelik_id', geb.id).order('tarih', { ascending: false }).limit(20)
      const son = izl?.[0] || null
      const takvim = izlemDurumlari(y.hafta, (izl || []).map((i) => i.hafta))
      const buHafta: string[] = []
      if (y.hafta >= 11 && y.hafta <= 14) buHafta.push('11-14. hafta: ense saydamlığı ultrasonu dönemi.')
      if (y.hafta >= 18 && y.hafta <= 22) buHafta.push('18-22. hafta: ayrıntılı ultrason dönemi.')
      if (y.hafta >= 24 && y.hafta <= 28) buHafta.push('24-28. hafta: şeker tarama testi dönemi.')
      if (y.hafta >= 36) buHafta.push('Doğum belirtilerini ve ne zaman başvuracağınızı doktorunuzla konuşun.')
      const z = takvim.find((t) => t.durum === 'zamani' || t.durum === 'gecikmis')
      if (z) buHafta.push(`${z.etiket} (${z.haftaBas}-${z.haftaSon}. hafta) için randevunuzu planlayın.`)
      bundle.gebelik = { hafta: y.hafta, gun: y.gun, trimester: y.trimester, metin: y.metin, toplamGun: y.toplamGun, tdt: geb.tdt,
        takvim: takvim.map((t) => ({ no: t.no, etiket: t.etiket, haftaBas: t.haftaBas, haftaSon: t.haftaSon, durum: t.durum, maddeler: t.maddeler })),
        sonIzlem: son ? { tarih: son.tarih, hafta: son.hafta, kilo: son.kilo, fetalKalpAtimi: son.fetal_kalp_atimi } : null, buHafta }
    }
  } catch (e) { console.error('[portal] gebelik:', e) }

  // NOTYA-JINE-04 — Pap/HPV/RİA due reminders (no diagnosis)
  if (modulAktif('jinekoloji')) try {
    const { dueHesapla } = await import('@/specialties/kadin-dogum/engines/jinekoloji-spine')
    const dob = dogumIso ? dogumIso.slice(0, 10) : null
    const gender = String(hastaRow?.gender || '').toLowerCase()
    if (gender.includes('kadın') || gender.includes('kadin') || gender.includes('female') || gender === 'f' || ks) {
      const bugun = new Date().toISOString().slice(0, 10)
      const ria = kontr && String(kontr.yontem).startsWith('ria_') ? (String(kontr.yontem).slice(4) as 'cu5' | 'cu10' | 'lng5' | 'lng8') : null
      const due = dueHesapla({
        dob, bugun,
        sonPap: ks?.son_pap || null, sonHpv: ks?.son_hpv || null, sonMamografi: ks?.son_mamografi || null,
        sonDxa: ks?.son_dxa || null, sonGgk: ks?.son_kolorektal || null, hrt: !!ks?.hrt, hrtBaslangic: ks?.hrt_baslangic || null,
        riaTakildi: ria && kontr?.baslangic ? String(kontr.baslangic) : null, riaTipi: ria, histerektomi: !!ks?.histerektomi, gebe: !!bundle.gebelik,
      })
      const hat = due.filter((d) => d.kod === 'pap' || d.kod === 'hpv' || d.kod === 'ria' || d.kod === 'mamografi').map((d) => ({
        ad: d.ad, due: d.due, durum: d.durum === 'gecikti' || d.durum === 'yaklasiyor' || d.durum === 'planli' ? d.durum : 'planli' as const,
      }))
      const riaIp = kontr?.ria_notu && typeof kontr.ria_notu === 'object' ? String((kontr.ria_notu as { ip_kontrol_tarihi?: string }).ip_kontrol_tarihi || '') || null : null
      if (hat.length || riaIp) {
        bundle.jinekoloji = {
          hatirlatmalar: hat,
          riaIpKontrol: riaIp,
          not: 'Bu hatırlatmalar bilgilendirme amaçlıdır; sonuç ve plan doktorunuzdadır.',
        }
      }
    }
  } catch (e) { console.error('[portal] jinekoloji:', e) }

  // GOZ-PORTAL — "Gözlerim": MD-entered goz_* rows only (kontrol / damla / enjeksiyon dates), clinic-recorded
  // VA/GİB numbers and image-ready notices. No tanı, no report text, no AI read content, no drug names.
  if (modulAktif('gozlerim')) try {
    const { vaGoster, enIyiUzak } = await import('@/specialties/goz-hastaliklari/engines/va')
    const bugun = new Date().toISOString().slice(0, 10)
    const birYilOnce = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const GOZ_ETIKET: Record<string, string> = { sag: 'Sağ göz', sol: 'Sol göz', iki: 'İki göz' }
    const [kontrolQ, glokomQ, enjQ, muayeneQ, goruntuQ] = await Promise.all([
      sb.from('goz_kontroller').select('tarih, neden, dilatasyon').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('durum', 'planli').gte('tarih', bugun).order('tarih', { ascending: true }).limit(1).maybeSingle(),
      sb.from('goz_glokom').select('id, damlalar').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle(),
      sb.from('goz_enjeksiyonlar').select('id, goz, ajan, tarih, durum').eq('patient_id', patientId).eq('doctor_id', doctorId).in('durum', ['planli', 'yapildi']).gte('tarih', birYilOnce).order('tarih', { ascending: true }).limit(40),
      sb.from('goz_muayeneler').select('tarih, va, gib_sag, gib_sol, created_at').eq('patient_id', patientId).eq('doctor_id', doctorId).order('tarih', { ascending: false }).order('created_at', { ascending: false }).limit(12),
      sb.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi, goruntuleme_tarihi, created_at').eq('patient_id', patientId).eq('doctor_id', doctorId).in('modalite', ['oct', 'fundus', 'on_segment']).order('created_at', { ascending: false }).limit(20),
    ])
    const k = kontrolQ.data
    type DamlaHam = { ad?: string; goz?: string; siklik?: string; baslangic?: string | null }
    const damlalarHam: DamlaHam[] = Array.isArray(glokomQ.data?.damlalar) ? (glokomQ.data!.damlalar as DamlaHam[]) : []
    const sayi = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))
    const TUR: Record<string, string> = { oct: 'OCT', fundus: 'Göz dibi fotoğrafı', on_segment: 'Ön segment fotoğrafı' }
    bundle.goz = {
      sonrakiKontrol: k ? { tarih: String(k.tarih), neden: String(k.neden || 'Kontrol'), dilatasyon: !!k.dilatasyon } : null,
      damlalar: damlalarHam.filter((d) => d && d.ad).map((d, i) => ({
        id: `${glokomQ.data?.id || 'g'}-${i}`,
        ad: String(d.ad),
        goz: GOZ_ETIKET[String(d.goz || '')] || 'Belirtilmedi',
        siklik: String(d.siklik || '—'),
        baslangic: d.baslangic ? String(d.baslangic).slice(0, 10) : null,
      })),
      islemler: (enjQ.data || []).map((e) => ({
        id: String(e.id),
        tarih: String(e.tarih),
        ad: e.ajan === 'deksametazon_implant' ? 'Göz içi implant' : 'Göz içi enjeksiyon',
        goz: GOZ_ETIKET[String(e.goz)] || 'Belirtilmedi',
        durum: e.durum === 'yapildi' ? 'yapildi' as const : 'planli' as const,
      })),
      olcumler: (muayeneQ.data || []).slice().reverse().map((m) => {
        const va = (m.va && typeof m.va === 'object' ? m.va : {}) as { sag?: Parameters<typeof enIyiUzak>[0]; sol?: Parameters<typeof enIyiUzak>[0] }
        const sag = enIyiUzak(va.sag), sol = enIyiUzak(va.sol)
        return { tarih: String(m.tarih), vaSag: sag ? vaGoster(sag) : null, vaSol: sol ? vaGoster(sol) : null, gibSag: sayi(m.gib_sag), gibSol: sayi(m.gib_sol) }
      }),
      goruntuler: (goruntuQ.data || []).map((g) => {
        const bolge = String(g.vucut_bolgesi || '').toLocaleLowerCase('tr-TR')
        const goz = /iki g|bilateral/.test(bolge) || (/sağ|sag\b/.test(bolge) && /sol/.test(bolge)) ? 'İki göz' : /sağ|sag\b/.test(bolge) ? 'Sağ göz' : /sol/.test(bolge) ? 'Sol göz' : 'Belirtilmedi'
        return { id: String(g.id), tarih: String(g.goruntuleme_tarihi || g.created_at), tur: TUR[String(g.modalite)] || 'Göz görüntüsü', goz }
      }),
      not: 'Değerler muayenehanede kaydedildiği gibidir; yorum ve plan doktorunuzdadır.',
    }
  } catch (e) { console.error('[portal] gozlerim:', e) }

  // DERM-PORTAL / DERM-EXCEPTIONAL-01 — "Derim": photo notices, doctor-triggered reminders (β-hCG vadesi,
  // fototerapi seansı, yama D2/D4, yara/dikiş/biyopsi kontrolü, TBSE), procedure and session dates.
  // Every reminder title comes from derimHatirlatmalari (kod → sabit hasta-güvenli başlık); the doctor's own
  // görev metni is never forwarded. No tanı, morfoloji, skor, or dose language.
  if (modulAktif('dermatoloji')) try {
    const bugun = new Date().toISOString().slice(0, 10)
    const birYilOnce = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const ISLEM_ADI: Record<string, string> = {
      punch: 'Deri biyopsisi', shave: 'Yüzeyel biyopsi', eksizyon: 'Eksizyon', kriyo: 'Kriyoterapi',
      koter: 'Koter', tirnak_avulsiyon: 'Tırnak işlemi', sigil: 'İşlem', kuretaj: 'Küretaj',
    }
    const FOTO_TUR: Record<string, string> = { foto: 'Klinik fotoğraf', dermatoskopi: 'Dermoskopi fotoğrafı' }
    const { data: epizot } = await sb.from('hasta_derm').select('id, last_tbse_iso, next_photo_iso').eq('patient_id', patientId).eq('doctor_id', doctorId).maybeSingle()
    const epId = epizot?.id ? String(epizot.id) : null
    const bos = <T>() => Promise.resolve({ data: [] as T[] })
    const [gorevQ, imgQ, islemQ, ftQ, ilacQ, yamaQ] = await Promise.all([
      sb.from('derm_gorevleri').select('due, kod, durum').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }).limit(20),
      sb.from('hasta_goruntulemeler').select('id, modalite, goruntuleme_tarihi, created_at').eq('patient_id', patientId).eq('doctor_id', doctorId).in('modalite', ['foto', 'dermatoskopi']).order('created_at', { ascending: false }).limit(20),
      sb.from('derm_islemler').select('tarih, tur').eq('patient_id', patientId).eq('doctor_id', doctorId).gte('tarih', birYilOnce).order('tarih', { ascending: false }).limit(15),
      epId ? sb.from('derm_fototerapi_seanslari').select('seans_tarihi, device').eq('hasta_derm_id', epId).order('seans_tarihi', { ascending: false }).limit(12) : bos<{ seans_tarihi: string; device: string | null }>(),
      sb.from('derm_ilac_guvenlik').select('ilac, aylik_due, aktif').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('aktif', true).limit(10),
      epId ? sb.from('derm_yama_kurslari').select('applied_at, read_d2, read_d4').eq('hasta_derm_id', epId).order('applied_at', { ascending: false }).limit(5) : bos<{ applied_at: string; read_d2: string | null; read_d4: string | null }>(),
    ])
    const seanslar = (ftQ.data || []).map((s) => ({ tarih: String(s.seans_tarihi), cihaz: s.device ? String(s.device) : null }))
    const hatirlatmalar = derimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due) : null })),
      ilacGuvenlik: (ilacQ.data || []).map((r) => ({ ilac: String(r.ilac || ''), aylikDue: r.aylik_due ? String(r.aylik_due) : null })),
      yamaKurslari: (yamaQ.data || []).map((y) => ({
        series: 'european_baseline' as const,
        appliedAt: String(y.applied_at || '').slice(0, 10),
        readD2: y.read_d2 ? String(y.read_d2).slice(0, 10) : null,
        readD4: y.read_d4 ? String(y.read_d4).slice(0, 10) : null,
        photoIds: [], positives: [],
      })),
      sonFototerapiSeansi: seanslar[0]?.tarih?.slice(0, 10) || null,
      fototerapiAralikGun: seansAraligi(seanslar.map((s) => s.tarih)),
      sonTbse: epizot?.last_tbse_iso ? String(epizot.last_tbse_iso).slice(0, 10) : null,
      sonrakiFoto: epizot?.next_photo_iso ? String(epizot.next_photo_iso).slice(0, 10) : null,
    })
    bundle.deri = {
      sonrakiKontrol: sonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      fotograflar: (imgQ.data || []).map((g) => ({
        id: String(g.id),
        tarih: String(g.goruntuleme_tarihi || g.created_at),
        tur: FOTO_TUR[String(g.modalite)] || 'Klinik fotoğraf',
      })),
      islemler: (islemQ.data || []).map((i) => ({ tarih: String(i.tarih), ad: ISLEM_ADI[String(i.tur)] || 'Klinik işlem' })),
      fototerapi: seanslar,
      labHatirlatma: hatirlatmalar.filter((h) => /kan (testi|kontrol)/i.test(h.ad)).map((h) => ({ ad: h.ad, due: h.due })),
      not: 'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tanı dili kullanılmaz.',
    }
  } catch (e) { console.error('[portal] derim:', e) }

  // DAH-EXCEPTIONAL-01 — "Takibim": hekim görevleri + kilitli hedefler + ev ölçüm özeti.
  // Görev başlıkları kod → sabit hasta-güvenli metin; tanı/doz yok.
  if (modulAktif('dahiliye')) try {
    const bugun = new Date().toISOString().slice(0, 10)
    const [gorevQ, kilitQ, evKbQ, evGlukozQ] = await Promise.all([
      sb.from('dahiliye_gorevleri').select('kod, due, durum').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }).limit(20),
      sb.from('dahiliye_kart_kilitleri').select('kart, alan, deger, created_at').eq('patient_id', patientId).eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(40),
      sb.from('dahiliye_ev_kayitlari').select('tip, sbp, dbp, deger, olcum_at').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('tip', 'kb').order('olcum_at', { ascending: false }).limit(14),
      sb.from('dahiliye_ev_kayitlari').select('tip, deger, olcum_at').eq('patient_id', patientId).eq('doctor_id', doctorId).eq('tip', 'glukoz').order('olcum_at', { ascending: false }).limit(14),
    ])
    const hatirlatmalar = takibimHatirlatmalari({
      bugun,
      gorevler: (gorevQ.data || []).map((g) => ({ kod: String(g.kod || ''), due: g.due ? String(g.due).slice(0, 10) : null })),
      hedefler: [],
      evKbOzet: null,
      evGlukozOzet: null,
      sonrakiKontrolIso: null,
    })
    // Latest lock per kart|alan — hedef metinleri hasta-güvenli özetlenir
    const gorulen = new Set<string>()
    const hedefGirdi: Array<{ kod: string; metin: string | null }> = []
    for (const k of kilitQ.data || []) {
      const key = `${k.kart}|${k.alan}`
      if (gorulen.has(key)) continue
      gorulen.add(key)
      const kart = String(k.kart || '')
      const alan = String(k.alan || '')
      if (kart === 'ht' && (alan === 'hedef' || alan === 'hedef_hekim')) hedefGirdi.push({ kod: 'kb', metin: JSON.stringify(k.deger ?? '') })
      else if (kart === 'dm' && (alan === 'hedef' || alan === 'hedef_hba1c')) hedefGirdi.push({ kod: 'hba1c', metin: String((k.deger as { hedef?: unknown })?.hedef ?? k.deger ?? '') })
      else if (kart === 'kvr' && (alan === 'hedef_ldl' || alan === 'kova')) hedefGirdi.push({ kod: 'ldl', metin: String((k.deger as { ldl?: unknown })?.ldl ?? k.deger ?? '') })
      else if (kart === 'hedef' && alan === 'kart') hedefGirdi.push({ kod: 'kilo', metin: 'Yaşam tarzı hedefi' })
    }
    const kbSatirlar = evKbQ.data || []
    const glSatirlar = evGlukozQ.data || []
    let evKbOzet: string | null = null
    if (kbSatirlar.length) {
      const son = kbSatirlar[0]
      if (son.sbp != null && son.dbp != null) {
        evKbOzet = `Son: ${son.sbp}/${son.dbp} mmHg (${String(son.olcum_at).slice(0, 10)}) · ${kbSatirlar.length} kayıt`
      }
    }
    let evGlukozOzet: string | null = null
    if (glSatirlar.length) {
      const son = glSatirlar[0]
      if (son.deger != null) {
        evGlukozOzet = `Son: ${son.deger} mg/dL (${String(son.olcum_at).slice(0, 10)}) · ${glSatirlar.length} kayıt`
      }
    }
    bundle.kronik = {
      sonrakiKontrol: dahiliyeSonrakiKontrol(hatirlatmalar),
      hatirlatmalar: hatirlatmalar.map((h) => ({ ad: h.ad, due: h.due, durum: h.durum })),
      hedefler: hedefOzetleri(hedefGirdi),
      evKbOzet,
      evGlukozOzet,
      not: 'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Acil durumda 112.',
    }
  } catch (e) { console.error('[portal] takibim:', e) }

  // Messages from DB
  const messages = await loadPortalMessages(sb, patientId, doctorId)
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
