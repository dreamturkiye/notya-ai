#!/usr/bin/env npx tsx
/**
 * KD · Derm · KBB beta-impress TEST kartları (PHI yok, gerçek beta hastası değil).
 *
 * Her kart adı `TEST —` önekli. Aynı hekimde önceki impress kartları silinip yeniden yazılır.
 * Üç branş hesabı users.specialty ile bulunur; hesap yoksa o branş atlanır.
 *
 *   npx --yes tsx scripts/seed-beta-impress-patients.mts
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}

const { encryptPII, decryptPII } = await import('../lib/security/encryption')
const { bransAnahtari } = await import('../lib/specialties/bransAnahtari')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const MARKER = 'beta-impress-2026'
const ymd = (iso: string) => iso.slice(0, 10)
const today = ymd(new Date().toISOString())
const daysAgo = (d: number) => ymd(new Date(Date.now() - d * 86400000).toISOString())
const sat28hf = daysAgo(28 * 7)

type Kart = { ad: string; dogum: string; cinsiyet: string; not: string }

async function doktorBul(hedef: string[]): Promise<{ id: string; ad: string; specialty: string } | null> {
  const { data, error } = await sb.from('users').select('id, full_name, email, specialty').limit(400)
  if (error) throw new Error(`users: ${error.message}`)
  const aday = (data || []).filter((u) => {
    const k = bransAnahtari(String(u.specialty || ''))
    return k != null && hedef.includes(k)
  })
  if (!aday.length) return null
  let best = aday[0]
  let n = -1
  for (const c of aday) {
    const { count } = await sb.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', c.id)
    if ((count ?? 0) > n) {
      n = count ?? 0
      best = c
    }
  }
  return { id: best.id as string, ad: String(best.full_name || best.email), specialty: String(best.specialty || '') }
}

async function impressSil(doctorId: string) {
  const { data: existing } = await sb.from('patients').select('id, name_encrypted, notes_encrypted').eq('doctor_id', doctorId)
  for (const p of existing || []) {
    let ad = ''
    let not = ''
    try {
      ad = decryptPII(String(p.name_encrypted || ''))
      not = decryptPII(String(p.notes_encrypted || ''))
    } catch {
      continue
    }
    if (!ad.startsWith('TEST —') || !not.includes(MARKER)) continue
    console.log(`  siliniyor: ${ad}`)
    const { data: sessions } = await sb.from('sessions').select('id').eq('patient_id', p.id)
    const sid = (sessions || []).map((s) => s.id)
    if (sid.length) await sb.from('notes').delete().in('session_id', sid)
    await sb.from('sessions').delete().eq('patient_id', p.id)
    const { data: gebelikler } = await sb.from('gebelikler').select('id').eq('patient_id', p.id)
    const gid = (gebelikler || []).map((g) => g.id)
    if (gid.length) {
      await sb.from('gebelik_izlemleri').delete().in('gebelik_id', gid)
      await sb.from('lohusa_izlemleri').delete().in('gebelik_id', gid)
    }
    const { data: derm } = await sb.from('hasta_derm').select('id').eq('patient_id', p.id)
    const did = (derm || []).map((d) => d.id)
    if (did.length) {
      await sb.from('derm_skor_anlari').delete().in('hasta_derm_id', did)
      await sb.from('derm_lezyonlar').delete().in('hasta_derm_id', did)
    }
    for (const t of ['serviks_taramalari', 'jine_vizitler', 'jine_gorevleri', 'kadin_sagligi', 'derm_gorevleri', 'hasta_derm', 'kbb_odyometri', 'kbb_gorevleri', 'kbb_risk', 'hasta_kbb', 'gebelikler']) {
      await sb.from(t).delete().eq('patient_id', p.id)
    }
    await sb.from('patients').delete().eq('id', p.id)
  }
}

async function hastaYaz(doctorId: string, k: Kart): Promise<string> {
  const { data, error } = await sb
    .from('patients')
    .insert({
      doctor_id: doctorId,
      name_encrypted: encryptPII(k.ad),
      dob_encrypted: encryptPII(k.dogum),
      gender_encrypted: encryptPII(k.cinsiyet),
      phone_encrypted: encryptPII('+905550000000'),
      notes_encrypted: encryptPII(`${MARKER}. ${k.not} Gerçek hasta değildir.`),
      is_active: true,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`patients ${k.ad}: ${error?.message}`)
  // NOTYA-AYSE-GERI-07: a seeded patient gets its blind name index rows like every created patient.
  const { hastaAramaIndeksiniGuncelle } = await import('../lib/doktor/hastaAramaIndeksi')
  await hastaAramaIndeksiniGuncelle(sb, doctorId, data.id as string, k.ad)
  return data.id as string
}

async function soapYaz(doctorId: string, patientId: string, specialty: string, yakinma: string, s: string, o: string, d: string, p: string) {
  const now = new Date().toISOString()
  const { data: seans, error: se } = await sb
    .from('sessions')
    .insert({
      doctor_id: doctorId, patient_id: patientId, specialty,
      status: 'completed', started_at: now, ended_at: now,
      duration_seconds: 720, patient_consent_given: true, patient_consent_at: now,
    })
    .select('id')
    .single()
  if (se || !seans) {
    console.warn(`  seans atlandı: ${se?.message || 'id yok'}`)
    return
  }
  const { error: ne } = await sb.from('notes').insert({
    session_id: seans.id,
    doctor_id: doctorId,
    note_type: 'soap',
    basvuru_yakinmasi: yakinma,
    content_subjektif: s,
    content_objektif: o,
    content_degerlendirme: d,
    content_plan: p,
    approved_at: now,
    approved_by: doctorId,
    ai_model: 'seed-beta-impress',
  })
  if (ne) console.warn(`  not atlandı: ${ne.message}`)
}

async function kdKartlar(doctorId: string) {
  const gebeId = await hastaYaz(doctorId, {
    ad: 'TEST — Ayşe Demir (28 hf)',
    dogum: '1994-05-12',
    cinsiyet: 'K',
    not: 'Orta risk gebe; izlem + NST + lab. Gün 1: SAT → çift takvim → izlem → NST.',
  })
  const { data: geb, error: ge } = await sb.from('gebelikler').insert({
    patient_id: gebeId, doctor_id: doctorId, sat: sat28hf, tdt_kaynak: 'sat',
    gravida: 2, para: 1, abortus: 0, yasayan: 1,
    onceki_sezaryen_sayisi: 1, onceki_sezaryen_kesi_tipi: 'alt_transvers',
    risk_sinifi: 'orta', kan_grubu: 'A', rh_negatif: true,
    durum: 'aktif',
    lab_panel: { ogtt: { glukoz0: 86, glukoz60: 162, glukoz120: 128, sonuc: 'normal' } },
    nst_kayitlari: [{ tarih: daysAgo(3), sonuc: 'reaktif', not: 'TEST kartı' }],
    anti_d_uygulamalari: [{ tarih: daysAgo(10), hafta: 28, not: 'profilaksi planı — doz hekim' }],
    ilk_vizit_lab: { hemogram: 'ok', tsh: 'ok', hbsag: 'negatif' },
  }).select('id').single()
  if (ge || !geb) throw new Error(`gebelikler: ${ge?.message}`)
  await sb.from('gebelik_izlemleri').insert({
    gebelik_id: geb.id, doctor_id: doctorId, tarih: today, hafta: 28,
    kilo: 71.2, tansiyon_sistolik: 118, tansiyon_diastolik: 74,
    fundus_yuksekligi: 27, fetal_kalp_atimi: 142, proteinuri: 'negatif',
    servikal_uzunluk: 34,
    ogtt: { glukoz0: 86, glukoz60: 162, glukoz120: 128, sonuc: 'normal' },
    usg: { prezentasyon: 'baş', amnion: 'normal' },
    not_metni: 'TEST — 28 hf orta risk izlem (fundus / FKA / USG / OGTT / serviks).',
  })
  await soapYaz(doctorId, gebeId, 'kadin-hastaliklari-dogum', '28. hafta kontrol',
    'Hareketleri hissediyor. Baş ağrısı, görme bulanıklığı, vajinal kanama yok.',
    'TA 118/74. Fundus 27 cm. FKA 142. Servikal uzunluk 34 mm.',
    'Orta risk gebe izlemi — tanı hekimde.',
    'NST reaktif. Anti-D kaydı var. 2 hafta sonra kontrol.')

  const jineId = await hastaYaz(doctorId, {
    ad: 'TEST — Selin Kaya (Pap)',
    dogum: '1986-11-03',
    cinsiyet: 'K',
    not: 'Jine — gecikmiş Pap. Gün 1 jine / MEC / Pap turu.',
  })
  await sb.from('kadin_sagligi').insert({
    patient_id: jineId, doctor_id: doctorId, son_pap: '2022-02-10', son_hpv: null,
  }).then(({ error }) => { if (error) console.warn('kadin_sagligi:', error.message) })
  await sb.from('serviks_taramalari').insert({
    patient_id: jineId, doctor_id: doctorId, tarih: '2022-02-10',
    pap_sonuc: 'NILM', hpv: null, hekim_onayladi: true, sonraki_due: '2025-02-10',
  })
  await sb.from('jine_gorevleri').insert({
    patient_id: jineId, doctor_id: doctorId, kod: 'serviks', ad: 'Pap / HPV tarama hatırlatması',
    due: daysAgo(30), kaynak: 'serviks', durum: 'acik',
  })
  await soapYaz(doctorId, jineId, 'kadin-hastaliklari-dogum', 'Yıllık jinekolojik kontrol — Pap gecikmiş',
    'Son Pap 2022. Kanama düzensizliği yok. Kontrasepsiyon kondom.',
    'Spekulum doğal. Bimanuel doğal.',
    'Serviks taraması gecikmiş — plan hekimde.',
    'Pap + HPV önerildi. MEC danışmanlığı.')

  const lohusaId = await hastaYaz(doctorId, {
    ad: 'TEST — Elif Koç (lohusa)',
    dogum: '1992-08-21',
    cinsiyet: 'K',
    not: 'Lohusa + bebek köprüsü. Gün 4 doğum / lohusa turu.',
  })
  const bebekId = await hastaYaz(doctorId, {
    ad: 'TEST — Bebek Koç (yenidoğan)',
    dogum: daysAgo(12),
    cinsiyet: 'K',
    not: 'Lohusa köprüsü bebek kartı. Pediatri içeriği yok.',
  })
  await sb.from('gebelikler').insert({
    patient_id: lohusaId, doctor_id: doctorId, sat: daysAgo(40 * 7),
    gravida: 1, para: 1, abortus: 0, yasayan: 1,
    durum: 'tamamlandi', dogum_tarihi: daysAgo(12), dogum_sekli: 'NSD',
    yenidogan_patient_id: bebekId, risk_sinifi: 'dusuk',
  })
  await soapYaz(doctorId, lohusaId, 'kadin-hastaliklari-dogum', 'Lohusa 2. hafta kontrol',
    'Emzirme var. Loşi azalıyor. Ateş yok.',
    'TA 110/70. Uterus involüsyonunda.',
    'Lohusa izlemi — tanı hekimde.',
    '6. hafta kontrol. Bebek kartı açık.')
  console.log(`  KD: ${gebeId.slice(0, 8)}… / ${jineId.slice(0, 8)}… / ${lohusaId.slice(0, 8)}…`)
}

async function dermKartlar(doctorId: string) {
  const psoId = await hastaYaz(doctorId, {
    ad: 'TEST — Mert Aydın (psoriasis)',
    dogum: '1988-04-09',
    cinsiyet: 'E',
    not: 'Psoriasis PASI + biyolojik lab kapısı. Gün 1 ünite → lezyon → PASI → Kohort.',
  })
  const { data: ep, error: ee } = await sb.from('hasta_derm').insert({
    patient_id: psoId, doctor_id: doctorId, unit: 'psoriasis', visit_type: 'yandal',
    patient_derm: { fitzpatrick: 'III', occupation: 'öğretmen' },
    tb_screen: true, hbv_screen: true,
  }).select('id').single()
  if (ee || !ep) throw new Error(`hasta_derm pso: ${ee?.message}`)
  await sb.from('derm_lezyonlar').insert({
    hasta_derm_id: ep.id, region: 'extensor-elbow-L', morphology: 'plaque', body_map_node: 'extensor-L',
    notes: 'TEST lezyon — tanı hekimde',
  })
  await sb.from('derm_skor_anlari').insert({
    hasta_derm_id: ep.id, recorded_at: today, pasi: 16.2, dlqi: 12,
  })
  await soapYaz(doctorId, psoId, 'dermatoloji', 'Plak psoriasis kontrol',
    'Dirsek ve dizlerde pullanma. Kaşıntı orta. Eklem ağrısı yok.',
    'Fitzpatrick III. PASI 16,2. DLQI 12. TB ve HBV taraması işaretli.',
    'Skor kaydı — resmi tanı hekim katalogundan.',
    'Biyolojik SUT taslağı Araçlar’da. Doz yazılmaz.')

  const gopId = await hastaYaz(doctorId, {
    ad: 'TEST — Zeynep Arslan (GÖP)',
    dogum: '1999-07-18',
    cinsiyet: 'K',
    not: 'İzotretinoin GÖP yetişkin. Gün 1 GÖP kapısı.',
  })
  await sb.from('hasta_derm').insert({
    patient_id: gopId, doctor_id: doctorId, unit: 'akne', visit_type: 'genel-poliklinik',
    patient_derm: { fitzpatrick: 'II' },
    gop: {
      two_contraception: true,
      hcg_iso: daysAgo(12),
      hcg_negative: true,
      cycle_day: 3,
      rx_days: 30,
      start_iso: daysAgo(5),
    },
  })
  await soapYaz(doctorId, gopId, 'dermatoloji', 'İzotretinoin GÖP kontrol',
    'İki yöntem korunma devam. Gebelik yok.',
    'Son 30 gün negatif β-hCG kaydı var. Doz yazılmadı.',
    'GÖP kapısı — tedavi kararı hekimde.',
    'Aylık β-hCG görevi. Doz uydurma yok.')
  console.log(`  Derm: ${psoId.slice(0, 8)}… / ${gopId.slice(0, 8)}…`)
}

async function kbbKartlar(doctorId: string) {
  const id = await hastaYaz(doctorId, {
    ad: 'TEST — Hasan Yıldız (KBB)',
    dogum: '1979-01-22',
    cinsiyet: 'E',
    not: 'Bilateral PTA + otoskopi + Dix-Hallpike + bir SGK eksik satırı. Gün 1 omurga.',
  })
  const { data: ep, error } = await sb.from('hasta_kbb').insert({
    patient_id: id, doctor_id: doctorId, next_kontrol: daysAgo(-21),
    notes: {
      otoskopi: { sag: { disKulak: ['normal'], tm: ['intakt'] }, sol: { disKulak: ['normal'], tm: ['intakt'] } },
      timpanometri: { sag: 'A', sol: 'A' },
      vertigo: { manevra: 'dix_hallpike', santral: false, taraf: 'sag' },
    },
  }).select('id').single()
  if (error || !ep) throw new Error(`hasta_kbb: ${error?.message}`)
  await sb.from('kbb_odyometri').insert([
    { patient_id: id, doctor_id: doctorId, hasta_kbb_id: ep.id, tarih: today, yan: 'sag', pta_db: 38, tip: null, hekim_kilit: true, maddeler: { esikler: [30, 35, 40, 45], bant: 'hafif' } },
    { patient_id: id, doctor_id: doctorId, hasta_kbb_id: ep.id, tarih: today, yan: 'sol', pta_db: 32, tip: null, hekim_kilit: true, maddeler: { esikler: [25, 30, 35, 40], bant: 'hafif' } },
  ])
  await sb.from('kbb_gorevleri').insert({
    patient_id: id, doctor_id: doctorId, kod: 'rapor_sgk', ad: 'SGK işitme raporu — odyolojik güncellik penceresi eksik',
    due: daysAgo(5), durum: 'acik', kaynak: 'sgk',
  })
  await soapYaz(doctorId, id, 'kulak-burun-bogaz', 'İşitme ve denge kontrolü',
    'Sağ kulakta dolgunluk. Dönme hissi yatarken. Santral nörolojik yakınma yok.',
    'Otoskopi sağ+sol TM intakt. PTA sağ 38 / sol 32 dB (hava yolu). Dix-Hallpike sağ — santral işaret yok.',
    'Karar desteği — tanı ve kayıp tipi hekimde.',
    'SGK taslağında odyolojik güncellik satırı eksik. Kontrol 3 hafta.')
  console.log(`  KBB: ${id.slice(0, 8)}…`)
}

const kd = await doktorBul(['kadin-hastaliklari-dogum'])
const derm = await doktorBul(['dermatoloji'])
const kbb = await doktorBul(['kulak-burun-bogaz'])

if (kd) {
  console.log(`KD hekim: ${kd.ad} (${kd.specialty})`)
  await impressSil(kd.id)
  await kdKartlar(kd.id)
} else console.warn('KD hekim bulunamadı — atlandı')

if (derm) {
  console.log(`Derm hekim: ${derm.ad} (${derm.specialty})`)
  await impressSil(derm.id)
  await dermKartlar(derm.id)
} else console.warn('Dermatoloji hekim bulunamadı — atlandı')

if (kbb) {
  console.log(`KBB hekim: ${kbb.ad} (${kbb.specialty})`)
  await impressSil(kbb.id)
  await kbbKartlar(kbb.id)
} else console.warn('KBB hekim bulunamadı — atlandı')

if (!kd && !derm && !kbb) {
  console.error('Hiçbir branş hesabı yok. users.specialty kontrol edin.')
  process.exit(1)
}
console.log('TEST — impress kartları hazır.')
