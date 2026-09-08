#!/usr/bin/env npx tsx
/**
 * Seed a realistic TEST patient so every Sağlığım portal section is populated.
 *
 * Creates, under Dr. Gökhan Mamur: one patient, three sessions with APPROVED
 * SOAP notes carrying vitals, active + stopped medications, two lab panels
 * (one with an abnormal flag), two imaging studies (one with a file, one
 * report-only), two message threads, and a PIN-protected portal token.
 *
 * The patient name is prefixed "TEST —" so it is obvious in the doctor's list.
 * Re-running replaces the previously seeded test patient.
 *
 *   npx --yes tsx scripts/seed-portal-test-patient.mts
 */
import fs from 'fs'
import path from 'path'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Load .env.local before touching modules that read env at call time.
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

const { encryptPII } = await import('../lib/security/encryption')
const { generatePortalPin, hashPortalPin } = await import('../lib/portal/pinAuth')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const TEST_NAME = 'TEST — Elif Yılmaz (Portal)'
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000)
const iso = (d: number) => daysAgo(d).toISOString()
const ymd = (d: number) => daysAgo(d).toISOString().slice(0, 10)

// ── Doctor: Dr. Gökhan Mamur (pick the account that owns patients) ───────────
const { data: users, error: usersError } = await sb.from('users').select('id, full_name, email').limit(100)
if (usersError) throw new Error(`users: ${usersError.message}`)

const candidates = (users || []).filter((u) => /mamur/i.test(String(u.full_name || u.email || '')))
if (!candidates.length) throw new Error('Dr. Gökhan Mamur bulunamadı')

let doctor = candidates[0]
let best = -1
for (const c of candidates) {
  const { count } = await sb.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', c.id)
  if ((count ?? 0) > best) {
    best = count ?? 0
    doctor = c
  }
}
const doctorId = doctor.id as string
console.log(`Doktor: ${doctor.full_name} (${doctorId.slice(0, 8)}…, mevcut hasta: ${best})`)

// ── Clean up a previous run ─────────────────────────────────────────────────
const { data: existing } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId)
for (const p of existing || []) {
  let plain = ''
  try {
    const { decryptPII } = await import('../lib/security/encryption')
    plain = decryptPII(String(p.name_encrypted || ''))
  } catch {
    plain = ''
  }
  if (plain !== TEST_NAME) continue
  console.log(`Önceki test hastası siliniyor: ${String(p.id).slice(0, 8)}…`)
  const { data: oldSessions } = await sb.from('sessions').select('id').eq('patient_id', p.id)
  const oldIds = (oldSessions || []).map((s) => s.id)
  if (oldIds.length) await sb.from('notes').delete().in('session_id', oldIds)
  await sb.from('sessions').delete().eq('patient_id', p.id)
  const { data: oldKonular } = await sb.from('hasta_mesaj_konulari').select('id').eq('patient_id', p.id)
  const konuIds = (oldKonular || []).map((k) => k.id)
  if (konuIds.length) await sb.from('hasta_mesajlar').delete().in('konu_id', konuIds)
  await sb.from('hasta_mesaj_konulari').delete().eq('patient_id', p.id)
  for (const t of ['hasta_ilaclar', 'hasta_lab_sonuclari', 'hasta_goruntulemeler', 'hasta_portal_tokens']) {
    await sb.from(t).delete().eq('patient_id', p.id)
  }
  await sb.from('patients').delete().eq('id', p.id)
}

// ── Patient ─────────────────────────────────────────────────────────────────
const { data: patient, error: patientError } = await sb
  .from('patients')
  .insert({
    doctor_id: doctorId,
    name_encrypted: encryptPII(TEST_NAME),
    dob_encrypted: encryptPII('2017-03-14'),
    gender_encrypted: encryptPII('K'),
    phone_encrypted: encryptPII('+905551112233'),
    notes_encrypted: encryptPII('Portal QA için oluşturulmuş test hastası. Gerçek hasta değildir.'),
    is_active: true,
  })
  .select('id')
  .single()
if (patientError || !patient) throw new Error(`patients: ${patientError?.message}`)
const patientId = patient.id as string
console.log(`Hasta oluşturuldu: ${patientId.slice(0, 8)}…`)

// ── Sessions + APPROVED notes with vitals ───────────────────────────────────
const visits = [
  {
    days: 124,
    yakinma: 'Tekrarlayan hışıltı ve gece öksürüğü',
    s: 'Anne, son üç haftada özellikle geceleri artan öksürük ve hışıltı tarifliyor. Koşarken çabuk yoruluyor. Ailede astım öyküsü var (baba).',
    o: 'Genel durum iyi, bilinç açık. Solunum sesleri bilateral kaba, ekspiryumda yaygın sibilan ronkus. Retraksiyon yok. Orofarenks doğal, timpanik membranlar intakt.',
    d: 'Bulgular ve aile öyküsü ile uyumlu olarak astım düşünülmüştür. Enfeksiyon lehine ateş veya akut bulgu saptanmadı.',
    p: 'İnhaler kortikosteroid başlandı, ihtiyaç halinde salbutamol reçete edildi. Spacer kullanımı anneye gösterildi. Ev içi tetikleyiciler (toz, sigara dumanı) konuşuldu. Dört hafta sonra kontrol.',
    vitaller: { tansiyon: '95/60', nabiz: 96, spo2: 96, kilo: 27.4, ates: 36.8, solunum: 24 },
  },
  {
    days: 52,
    yakinma: 'Astım kontrol muayenesi',
    s: 'Anne, inhaler tedavi sonrası gece öksürüğünün büyük ölçüde geçtiğini bildiriyor. Son ayda kurtarıcı inhaler yalnızca iki kez kullanılmış. Okulda beden eğitimi derslerine katılabiliyor.',
    o: 'Solunum sesleri her iki akciğerde doğal, ek ses yok. Boy ve kilo persentilleri yaşına uygun seyrediyor.',
    d: 'Astım kontrolü iyi. Mevcut idame tedavisi etkili.',
    p: 'İdame inhaler aynı dozda sürdürülecek. Kurtarıcı inhaler ihtiyaç halinde. Hemogram ve D vitamini istendi. Üç ay sonra kontrol.',
    vitaller: { tansiyon: '98/62', nabiz: 88, spo2: 98, kilo: 28.1, ates: 36.6, solunum: 20 },
  },
  {
    days: 6,
    yakinma: 'Boğaz ağrısı ve ateş',
    s: 'İki gündür boğaz ağrısı ve 38.4 °C ölçülen ateş. Yutma güçlüğü var, kusma yok. Hışıltı eşlik etmiyor.',
    o: 'Tonsiller hiperemik ve hipertrofik, üzerinde eksuda mevcut. Bilateral servikal LAP palpabl, hassas. Akciğer sesleri doğal.',
    d: 'Akut tonsillofarenjit. Boğaz kültürü alındı; astım açısından alevlenme bulgusu yok.',
    p: 'On gün amoksisilin başlandı, ateş için parasetamol önerildi. Bol sıvı ve istirahat. Ateş üç günde düşmezse yeniden değerlendirme. İnhaler idame tedavisi kesilmeyecek.',
    vitaller: { tansiyon: '100/64', nabiz: 104, spo2: 97, kilo: 28.6, ates: 38.4, solunum: 22 },
  },
]

for (const v of visits) {
  const { data: session, error: sErr } = await sb
    .from('sessions')
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      specialty: 'pediatri',
      status: 'completed',
      started_at: iso(v.days),
      ended_at: iso(v.days),
      created_at: iso(v.days),
      duration_seconds: 720,
      patient_consent_given: true,
      patient_consent_at: iso(v.days),
    })
    .select('id')
    .single()
  if (sErr || !session) throw new Error(`sessions: ${sErr?.message}`)

  const { error: nErr } = await sb.from('notes').insert({
    session_id: session.id,
    doctor_id: doctorId,
    note_type: 'soap',
    basvuru_yakinmasi: v.yakinma,
    content_subjektif: v.s,
    content_objektif: v.o,
    content_degerlendirme: v.d,
    content_plan: v.p,
    vitaller: v.vitaller,
    // The share gate: only approved notes reach the patient.
    approved_at: iso(v.days),
    approved_by: doctorId,
    created_at: iso(v.days),
    ai_model: 'seed-script',
  })
  if (nErr) throw new Error(`notes: ${nErr.message}`)
}
console.log(`${visits.length} ziyaret + onaylı not eklendi`)

// ── Medications ─────────────────────────────────────────────────────────────
const { error: medErr } = await sb.from('hasta_ilaclar').insert([
  {
    doctor_id: doctorId,
    patient_id: patientId,
    ilac_adi: 'Flixotide 50 mcg inhaler',
    etken_madde: 'Flutikazon propiyonat',
    doz: '2 puf',
    kullanim_sikli: 'Günde 2 kez (sabah-akşam)',
    baslangic_tarihi: ymd(124),
    aktif: true,
    yazan_doktor: 'Dr. Gökhan Mamur',
    notlar: 'Spacer ile kullanın. Her kullanımdan sonra ağzı su ile çalkalayın.',
  },
  {
    doctor_id: doctorId,
    patient_id: patientId,
    ilac_adi: 'Ventolin 100 mcg inhaler',
    etken_madde: 'Salbutamol',
    doz: '2 puf',
    kullanim_sikli: 'İhtiyaç halinde (hışıltı/nefes darlığında)',
    baslangic_tarihi: ymd(124),
    aktif: true,
    yazan_doktor: 'Dr. Gökhan Mamur',
    notlar: 'Haftada ikiden fazla ihtiyaç duyulursa kontrole gelin.',
  },
  {
    doctor_id: doctorId,
    patient_id: patientId,
    ilac_adi: 'Amoksisilin 500 mg süspansiyon',
    etken_madde: 'Amoksisilin',
    doz: '500 mg',
    kullanim_sikli: 'Günde 2 kez, 10 gün',
    baslangic_tarihi: ymd(6),
    aktif: true,
    yazan_doktor: 'Dr. Gökhan Mamur',
    notlar: 'Kürü tamamlayın; ateş düşse bile bırakmayın.',
  },
  {
    doctor_id: doctorId,
    patient_id: patientId,
    ilac_adi: 'Montelukast 5 mg çiğneme tableti',
    etken_madde: 'Montelukast',
    doz: '5 mg',
    kullanim_sikli: 'Akşam 1 tablet',
    baslangic_tarihi: ymd(124),
    bitis_tarihi: ymd(52),
    aktif: false,
    yazan_doktor: 'Dr. Gökhan Mamur',
    notlar: 'İnhaler tedavi ile kontrol sağlandığı için sonlandırıldı.',
  },
])
if (medErr) throw new Error(`hasta_ilaclar: ${medErr.message}`)
console.log('4 ilaç eklendi (3 aktif, 1 sonlandırıldı)')

// ── Labs ────────────────────────────────────────────────────────────────────
const { error: labErr } = await sb.from('hasta_lab_sonuclari').insert([
  {
    doctor_id: doctorId,
    patient_id: patientId,
    lab_adi: 'Hemogram ve D vitamini',
    sonuc_tarihi: ymd(50),
    created_at: iso(50),
    testler: [
      { testName: 'Hemoglobin', deger: '12.4', birim: 'g/dL', referans: '11.5 - 15.5', anormal: false },
      { testName: 'Lökosit', deger: '7.8', birim: '10³/µL', referans: '4.5 - 13.5', anormal: false },
      { testName: 'Trombosit', deger: '295', birim: '10³/µL', referans: '150 - 450', anormal: false },
      { testName: 'Eozinofil', deger: '6.8', birim: '%', referans: '0 - 5', anormal: true },
      { testName: '25-OH D vitamini', deger: '17', birim: 'ng/mL', referans: '30 - 100', anormal: true },
    ],
  },
  {
    doctor_id: doctorId,
    patient_id: patientId,
    lab_adi: 'Boğaz kültürü ve CRP',
    sonuc_tarihi: ymd(4),
    created_at: iso(4),
    testler: [
      { testName: 'CRP', deger: '18', birim: 'mg/L', referans: '0 - 5', anormal: true },
      { testName: 'Boğaz kültürü', deger: 'A grubu beta hemolitik streptokok üredi', birim: '', referans: 'Üreme yok', anormal: true },
    ],
  },
])
if (labErr) throw new Error(`hasta_lab_sonuclari: ${labErr.message}`)
console.log('2 lab paneli eklendi')

// ── Imaging: one with a file, one report-only ───────────────────────────────
const { error: imgErr } = await sb.from('hasta_goruntulemeler').insert([
  {
    doctor_id: doctorId,
    patient_id: patientId,
    modalite: 'xray',
    vucut_bolgesi: 'Akciğer (PA)',
    goruntuleme_tarihi: ymd(122),
    created_at: iso(122),
    radyolog: 'Dr. Selin Aydın',
    rapor_metni:
      'Her iki akciğer havalanması simetrik. Aktif infiltrasyon veya konsolidasyon saptanmadı. Kalp gölgesi ve mediasten normal sınırlarda. Kostofrenik sinüsler açık.',
    dosya_url: '/sagligim/chest-xray-pa.jpg',
  },
  {
    doctor_id: doctorId,
    patient_id: patientId,
    modalite: 'us',
    vucut_bolgesi: 'Boyun (servikal lenf nodları)',
    goruntuleme_tarihi: ymd(4),
    created_at: iso(4),
    radyolog: 'Dr. Selin Aydın',
    rapor_metni:
      'Bilateral servikal zincirde en büyüğü 12 mm olan, reaktif görünümde lenf nodları izlendi. Patolojik boyut veya yapı bozukluğu saptanmadı. Tükürük bezleri doğal.',
    // No file uploaded — portal must say "Görüntü dosyası paylaşılmadı".
    dosya_url: null,
  },
])
if (imgErr) throw new Error(`hasta_goruntulemeler: ${imgErr.message}`)
console.log('2 görüntüleme eklendi (1 dosyalı, 1 sadece rapor)')

// ── Messages ────────────────────────────────────────────────────────────────
const threads = [
  {
    konu: 'Kontrol randevusu hatırlatması',
    klasor: 'gelen' as const,
    okundu_hasta: false,
    days: 5,
    mesajlar: [
      {
        taraf: 'klinik' as const,
        metin:
          'Merhaba, Elif’in astım kontrolü için 3 hafta sonraki randevusunu hatırlatmak istedik. Uygun olmadığınız bir gün varsa bu mesaja yanıt verebilirsiniz.',
        days: 5,
      },
    ],
  },
  {
    konu: 'Antibiyotik sonrası ateş devam ediyor mu?',
    klasor: 'gonderilen' as const,
    okundu_hasta: true,
    days: 2,
    mesajlar: [
      {
        taraf: 'hasta' as const,
        metin:
          'Doktor bey, amoksisilinin üçüncü gününde ateş 37.2 °C’ye düştü ama boğaz ağrısı hâlâ var. İlaca devam etmeli miyiz?',
        days: 3,
      },
      {
        taraf: 'doktor' as const,
        metin:
          'Ateşin düşmesi tedaviye yanıt verdiğini gösteriyor. Boğaz ağrısı birkaç gün daha sürebilir. Kürü 10 güne tamamlayın, bol sıvı alsın. Ateş yeniden 38 °C üzerine çıkarsa haber verin.',
        days: 2,
      },
    ],
  },
]

for (const t of threads) {
  const { data: konu, error: kErr } = await sb
    .from('hasta_mesaj_konulari')
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      konu: t.konu,
      hasta_klasor: t.klasor,
      okundu_hasta: t.okundu_hasta,
      okundu_pratik: true,
      son_mesaj_at: iso(t.days),
      created_at: iso(t.mesajlar[0].days),
    })
    .select('id')
    .single()
  if (kErr || !konu) throw new Error(`hasta_mesaj_konulari: ${kErr?.message}`)

  for (const m of t.mesajlar) {
    const { error: mErr } = await sb.from('hasta_mesajlar').insert({
      konu_id: konu.id,
      taraf: m.taraf,
      metin: m.metin,
      yazar_user_id: m.taraf === 'hasta' ? null : doctorId,
      created_at: iso(m.days),
    })
    if (mErr) throw new Error(`hasta_mesajlar: ${mErr.message}`)
  }
}
console.log(`${threads.length} mesaj konusu eklendi`)

// ── Portal token + PIN (same derivation as the doctor tool) ─────────────────
const secret = process.env.PORTAL_TOKEN_SECRET
if (!secret) throw new Error('PORTAL_TOKEN_SECRET tanımlı değil')

const timestamp = Date.now()
const tokenHash = createHmac('sha256', secret).update(`${patientId}${doctorId}${timestamp}`).digest('hex')
const pin = generatePortalPin()

const { error: tokErr } = await sb.from('hasta_portal_tokens').insert({
  token_hash: tokenHash,
  doctor_id: doctorId,
  patient_id: patientId,
  expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  created_at: new Date().toISOString(),
  pin_hash: hashPortalPin(pin),
})
if (tokErr) throw new Error(`hasta_portal_tokens: ${tokErr.message}`)

const base = process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app'
console.log('\n──────────────────────────────────────────────')
console.log('Portal hazır')
console.log(`Link: ${base}/portal/hasta/${tokenHash}`)
console.log(`PIN:  ${pin}`)
console.log('──────────────────────────────────────────────')
