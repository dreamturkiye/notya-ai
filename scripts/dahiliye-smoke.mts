#!/usr/bin/env npx tsx
/**
 * DAH-WOW-SMOKE — reproducible dahiliye smoke path against the real API routes.
 *
 * Fixture (decision recorded in docs/DAH-WOW-PROGRESS.md A15): a DEDICATED QA doctor
 * `qa.dahiliye@notya.ai` (users.specialty = 'dahiliye'). The shared `qa.test@notya.ai` account is
 * left untouched (pediatri QA passes depend on it). The password lives only in .env.local as
 * QA_DAHILIYE_PASSWORD (generated on first run, never committed).
 *
 * Patient: one SYNTHETIC patient "TEST — Dahiliye Smoke (sentetik)" (67 y, E, no T.C., no phone,
 * no e-mail). Every run deletes the previous synthetic patient of this QA doctor and re-seeds it.
 *
 * Lab rows (main patient): two panels (≈200 days ago and 4 days ago) are inserted exactly as the extractor
 * would leave them (onayli=false, panel 'raporlandi', belge_analizleri modality 'lab' with a hekim tanısı)
 * and then approved through the REAL route POST /api/doktor/belgeler/analiz/onayla — fast and deterministic
 * for the 22 dahiliye cards.
 *
 * Lab upload path (DAH-LAB-BELGELER, third synthetic patient): a SYNTHETIC digital PDF
 * (core/lab/fixtures/sentetikLabPdf.ts) goes through the whole real pipeline — POST /api/doktor/documents
 * (vault upload) → belgeler/lab 'cikar' (pdfjs structural pass + Claude vision pass, reconciled) → rows land
 * onayli=false and the dahiliye şerit ignores them → 'tablo_onayla' → 'raporla' (Claude writer) → Onayla
 * without a hekim tanısı → 400 → PATCH hekim tanısı → Onayla → rows onayli=true → şerit HbA1c shows 7.9.
 *
 * Smoke path (post-sprint audit): KB kaydet → lab onayla → dahiliye adımları → her kartın hekim
 * kilidi → check-up birleşik rapor → portal ön anket → kohort paneli.
 *
 *   npm run dev                                   # or SMOKE_BASE_URL=https://notya-ai.vercel.app
 *   npx --yes tsx scripts/dahiliye-smoke.mts      # writes smoke-out/dahiliye-smoke.json (gitignored)
 *
 * Exit code 1 if any expectation fails.
 */
import fs from 'fs'
import path from 'path'
import { createHash, createHmac, randomBytes, randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const envPath = path.join(process.cwd(), '.env.local')
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

const { encrypt, decrypt } = await import('../lib/security/encryption')
const { generatePortalPin, hashPortalPin } = await import('../lib/portal/pinAuth')
const { KB_TEKNIK } = await import('../specialties/dahiliye/engines/nudge')
const { score2DmOlasilik } = await import('../specialties/dahiliye/engines/score2diabetes')
const { sentetikLabPdf, SENTETIK_SATIRLAR } = await import('../core/lab/fixtures/sentetikLabPdf')

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const QA_EMAIL = 'qa.dahiliye@notya.ai'
const QA_AD = 'QA Dahiliye (TEST hesabı)'
const HASTA_AD = 'TEST — Dahiliye Smoke (sentetik)'
const HASTA_AD_SCORE2 = 'TEST — Dahiliye Smoke SCORE2 (sentetik)'
const HASTA_AD_LAB = 'TEST — Dahiliye Lab Yukleme Smoke (sentetik)'
const HASTA_AD_OP = 'TEST — Dahiliye Smoke SCORE2-OP (sentetik)'
const HASTA_AD_DM = 'TEST — Dahiliye Smoke SCORE2-Diabetes (sentetik)'
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!
const sb = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const anon = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })

const gun = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)
const T = gun(0)

// ── 1. QA doctor ─────────────────────────────────────────────────────────────
async function qaDoktor(): Promise<{ id: string; token: string; refresh: string; expiresAt: number }> {
  let sifre = process.env.QA_DAHILIYE_PASSWORD || ''
  const yeniSifre = () => { sifre = `Qa-${randomBytes(18).toString('base64url')}`; fs.appendFileSync(envPath, `\n# DAH-WOW-SMOKE QA doktor (qa.dahiliye@notya.ai) — yalnız yerel, commit edilmez\nQA_DAHILIYE_PASSWORD=${sifre}\n`) }
  let id: string | null = null
  for (let page = 1; page <= 20 && !id; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    id = data.users.find((u) => u.email === QA_EMAIL)?.id || null
    if (data.users.length < 200) break
  }
  if (!id) {
    if (!sifre) yeniSifre()
    const { data, error } = await sb.auth.admin.createUser({ email: QA_EMAIL, password: sifre, email_confirm: true, user_metadata: { full_name: QA_AD, specialty: 'dahiliye', qa: true } })
    if (error || !data.user) throw new Error(`createUser: ${error?.message}`)
    id = data.user.id
    console.log(`QA doktor oluşturuldu: ${QA_EMAIL}`)
  } else if (!sifre) {
    yeniSifre()
    const { error } = await sb.auth.admin.updateUserById(id, { password: sifre })
    if (error) throw new Error(`updateUser: ${error.message}`)
  }
  const { error: uErr } = await sb.from('users').upsert({ id, email: QA_EMAIL, full_name: QA_AD, specialty: 'dahiliye', updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (uErr) throw new Error(`users upsert: ${uErr.message}`)
  const { data: s, error: sErr } = await anon.auth.signInWithPassword({ email: QA_EMAIL, password: sifre })
  if (sErr || !s.session) throw new Error(`signIn: ${sErr?.message}`)
  return { id, token: s.session.access_token, refresh: s.session.refresh_token, expiresAt: s.session.expires_at || 0 }
}

// ── 2. Synthetic patient (reset + seed) ──────────────────────────────────────
const DAHILIYE_TABLOLARI = ['dahiliye_sgk_raporlari', 'dahiliye_anemi', 'dahiliye_obezite', 'dahiliye_tarama', 'dahiliye_lab_istemleri', 'dahiliye_asilar', 'dahiliye_asi_profil', 'dahiliye_anketler', 'dahiliye_kart_kilitleri', 'dahiliye_ev_kayitlari', 'dahiliye_kvr', 'dahiliye_ckd', 'dahiliye_ht', 'dahiliye_dm', 'dahiliye_lipid', 'dahiliye_tiroid', 'dahiliye_checkup', 'dahiliye_gorevleri', 'sevkler', 'dahiliye_kirmizi', 'dahiliye_taramalar', 'dahiliye_hf', 'dahiliye_antikoagulan', 'dahiliye_pulm', 'dahiliye_gi', 'dahiliye_ekg', 'dahiliye_tiroid_nodul', 'dahiliye_ramazan', 'dahiliye_checkup_paketleri']

async function hastaSil(doctorId: string) {
  const { data } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId)
  for (const p of data || []) {
    let ad = ''
    try { ad = JSON.parse(decrypt(String(p.name_encrypted))).ad || '' } catch { ad = '' }
    if (![HASTA_AD, HASTA_AD_SCORE2, HASTA_AD_LAB, HASTA_AD_OP, HASTA_AD_DM].includes(ad)) continue
    const pid = String(p.id)
    for (const t of DAHILIYE_TABLOLARI) await sb.from(t).delete().eq('patient_id', pid)
    const { data: kon } = await sb.from('hasta_mesaj_konulari').select('id').eq('patient_id', pid)
    if (kon?.length) await sb.from('hasta_mesajlar').delete().in('konu_id', kon.map((k) => k.id))
    await sb.from('hasta_mesaj_konulari').delete().eq('patient_id', pid)
    await sb.from('lab_satirlar').delete().eq('patient_id', pid)
    await sb.from('lab_paneller').delete().eq('patient_id', pid)
    const { data: an } = await sb.from('belge_analizleri').select('id').eq('patient_id', pid)
    if (an?.length) await sb.from('belge_revizyonlar').delete().in('analiz_id', an.map((a) => a.id))
    await sb.from('belge_analizleri').delete().eq('patient_id', pid)
    await sb.from('medical_documents').delete().eq('patient_id', pid) // blobs cascade
    const { data: ses } = await sb.from('sessions').select('id').eq('patient_id', pid)
    const sesIds = (ses || []).map((s) => s.id)
    if (sesIds.length) {
      const { data: notlar } = await sb.from('notes').select('id').in('session_id', sesIds)
      const notIds = (notlar || []).map((n) => n.id)
      if (notIds.length) { await sb.from('muayene_revizyonlar').delete().in('note_id', notIds); await sb.from('not_duzenlemeleri').delete().in('note_id', notIds); await sb.from('notes').delete().in('id', notIds) }
      await sb.from('sessions').delete().in('id', sesIds)
    }
    for (const t of ['hasta_ilaclar', 'hasta_portal_tokens']) await sb.from(t).delete().eq('patient_id', pid)
    const { error } = await sb.from('patients').delete().eq('id', pid)
    if (error) throw new Error(`önceki sentetik hasta silinemedi: ${error.message}`)
    console.log(`Önceki sentetik hasta silindi (${pid.slice(0, 8)}…)`)
  }
}

async function hastaOlustur(doctorId: string) {
  const { data: p, error } = await sb.from('patients').insert({
    doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad: HASTA_AD })), dob_encrypted: encrypt('1959-03-14'), gender_encrypted: encrypt('E'),
    notes_encrypted: encrypt(JSON.stringify({ not: 'DAH-WOW-SMOKE sentetik QA hastası. Gerçek kişi değildir.' })), is_active: true,
  }).select('id').single()
  if (error || !p) throw new Error(`patients: ${error?.message}`)
  const pid = String(p.id)
  // Active medication list (the patient's own list, as a reçete would have written it — no engine doses).
  const ilac = (ilac_adi: string, etken_madde: string, baslangic: string) => ({ doctor_id: doctorId, patient_id: pid, ilac_adi, etken_madde, baslangic_tarihi: baslangic, aktif: true, onay_durumu: 'onayli' })
  const { error: iErr } = await sb.from('hasta_ilaclar').insert([ilac('Metformin', 'metformin', '2019-02-01'), ilac('Ramipril', 'ramipril', gun(9)), ilac('Atorvastatin', 'atorvastatin', gun(40)), ilac('Apiksaban', 'apiksaban', '2025-11-10')])
  if (iErr) throw new Error(`hasta_ilaclar: ${iErr.message}`)
  return pid
}

async function muayeneOlustur(doctorId: string, pid: string) {
  // Today's muayene (session + SOAP note) so "nota ekle" / "günün notu" writes have a target.
  const { data: s, error: sErr } = await sb.from('sessions').insert({ doctor_id: doctorId, patient_id: pid, status: 'completed', session_type: 'kontrol', specialty: 'dahiliye', duration_seconds: 0, transcript_cleaned: '[DAH-WOW-SMOKE sentetik muayene]' }).select('id').single()
  if (sErr || !s) throw new Error(`sessions: ${sErr?.message}`)
  const { data: n, error: nErr } = await sb.from('notes').insert({ session_id: s.id, doctor_id: doctorId, note_type: 'soap', content_subjektif: 'Kontrol vizit (sentetik QA).', content_degerlendirme: '' }).select('id').single()
  if (nErr || !n) throw new Error(`notes: ${nErr?.message}`)
  return String(n.id)
}

// Canonical rows (units = core/lab/kanonik birim). Borderline/abnormal on purpose.
type Lab = [raw: string, key: string, deger: number, birim: string, low: number | null, high: number | null]
const ONCEKI: Lab[] = [
  ['HbA1c', 'HbA1c', 7.6, '%', 4, 6], ['LDL kolesterol', 'LDL', 158, 'mg/dL', null, 130], ['HDL kolesterol', 'HDL', 40, 'mg/dL', 40, null],
  ['Total kolesterol', 'TChol', 241, 'mg/dL', null, 200], ['eGFR', 'eGFR', 61, 'mL/dk/1.73m²', 90, null], ['Kreatinin', 'Kre', 1.22, 'mg/dL', 0.7, 1.2],
  ['Potasyum', 'K', 4.8, 'mmol/L', 3.5, 5.1], ['Hemoglobin', 'Hb', 13.4, 'g/dL', 13, 17], ['TSH', 'TSH', 4.1, 'mIU/L', 0.4, 4.2],
]
const GUNCEL: Lab[] = [
  ['HbA1c', 'HbA1c', 8.4, '%', 4, 6], ['Açlık glukoz', 'Glu', 168, 'mg/dL', 70, 100], ['LDL kolesterol', 'LDL', 131, 'mg/dL', null, 130],
  ['HDL kolesterol', 'HDL', 37, 'mg/dL', 40, null], ['Trigliserid', 'TG', 236, 'mg/dL', null, 150], ['Total kolesterol', 'TChol', 215, 'mg/dL', null, 200],
  ['eGFR', 'eGFR', 44, 'mL/dk/1.73m²', 90, null], ['Kreatinin', 'Kre', 1.58, 'mg/dL', 0.7, 1.2], ['İdrar albümin/kreatinin', 'UACR', 86, 'mg/g', null, 30],
  ['Potasyum', 'K', 5.4, 'mmol/L', 3.5, 5.1], ['Sodyum', 'Na', 138, 'mmol/L', 136, 145], ['Hemoglobin', 'Hb', 12.1, 'g/dL', 13, 17],
  ['MCV', 'MCV', 79, 'fL', 80, 100], ['Ferritin', 'Ferritin', 22, 'ng/mL', 30, 400], ['Lökosit', 'WBC', 7.2, '10³/µL', 4, 10], ['Trombosit', 'Plt', 188, '10³/µL', 150, 400],
  ['ALT', 'ALT', 41, 'U/L', null, 40], ['AST', 'AST', 38, 'U/L', null, 40], ['TSH', 'TSH', 6.3, 'mIU/L', 0.4, 4.2], ['Serbest T4', 'FT4', 1.05, 'ng/dL', 0.9, 1.7],
]

async function labPaneliTohumla(doctorId: string, pid: string, numune: string, satirlar: Lab[]) {
  const { data: a, error } = await sb.from('belge_analizleri').insert({
    belge_id: randomUUID(), doctor_id: doctorId, patient_id: pid, brans: 'dahiliye', modality_final: 'lab', de_id_hash: createHash('sha256').update(`dah-smoke-${numune}`).digest('hex'),
    engine_set: 'dah-smoke-seed', durum: 'hekim_duzenledi', sonuc: { ozet: 'Sentetik QA lab paneli (DAH-WOW-SMOKE).', bulgular: [], engines_used: ['dah-smoke-seed'] },
    motor_ciktilari: [], hekim_tanisi: [{ ad: 'Tip 2 diabetes mellitus', icd10: 'E11' }], hekim_ozet: 'Sentetik QA paneli — hekim kontrol etti.',
  }).select('id').single()
  if (error || !a) throw new Error(`belge_analizleri: ${error?.message}`)
  const { data: panel, error: pErr } = await sb.from('lab_paneller').insert({ belge_id: randomUUID(), doctor_id: doctorId, patient_id: pid, analiz_id: a.id, lab_adi: 'QA Sentetik Lab', numune_tarihi: numune, rapor_tarihi: numune, kaynaklar: ['yapi'], extract_json: { qa: 'dah-smoke-seed' }, kalite: 'iyi', tablo_onayli: true, durum: 'raporlandi' }).select('id').single()
  if (pErr || !panel) throw new Error(`lab_paneller: ${pErr?.message}`)
  const rows = satirlar.map(([raw, key, deger, birim, low, high], i) => ({
    panel_id: panel.id, patient_id: pid, doctor_id: doctorId, sira: i, raw_name: raw, canonical_key: key, value_num: deger, value_text: String(deger), unit: birim,
    kanonik_deger: deger, kanonik_birim: birim, ref_low: low, ref_high: high, flag: high != null && deger > high ? 'H' : low != null && deger < low ? 'L' : 'normal', onayli: false, numune_tarihi: numune,
  }))
  const { error: sErr } = await sb.from('lab_satirlar').insert(rows)
  if (sErr) throw new Error(`lab_satirlar: ${sErr.message}`)
  return { analizId: String(a.id), panelId: String(panel.id) }
}

// ── 3. HTTP helpers + expectations ───────────────────────────────────────────
type Adim = { adim: string; durum: number; beklenen: number; ok: boolean; ms: number; ozet: unknown }
const kayit: Adim[] = []
let TOKEN = ''
async function istek(ad: string, method: 'GET' | 'POST' | 'PATCH', yol: string, body?: unknown, beklenen = 200, ekBaslik: Record<string, string> = {}) {
  const t0 = Date.now()
  const r = await fetch(`${BASE}${yol}`, { method, headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), ...ekBaslik }, body: body ? JSON.stringify(body) : undefined })
  const metin = await r.text()
  let json: Record<string, unknown> = {}
  try { json = JSON.parse(metin) } catch { json = { _metin: metin.slice(0, 300) } }
  const ok = r.status === beklenen
  kayit.push({ adim: ad, durum: r.status, beklenen, ok, ms: Date.now() - t0, ozet: json })
  console.log(`${ok ? '✓' : '✗'} ${ad} → ${r.status}${ok ? '' : ` (beklenen ${beklenen}) ${metin.slice(0, 200)}`}`)
  return { r, json }
}
const kontroller: { ad: string; ok: boolean; detay: string }[] = []
function kontrol(ad: string, kosul: boolean, detay: unknown) {
  kontroller.push({ ad, ok: kosul, detay: typeof detay === 'string' ? detay : JSON.stringify(detay) })
  console.log(`${kosul ? '✓' : '✗'} KONTROL ${ad}${kosul ? '' : ` — ${JSON.stringify(detay).slice(0, 300)}`}`)
}
const dah = (pid: string) => `/api/doktor/dahiliye?patientId=${pid}`
const post = (ad: string, pid: string, body: Record<string, unknown>, beklenen = 200) => istek(ad, 'POST', '/api/doktor/dahiliye', { patientId: pid, ...body }, beklenen)
type V = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

// ── 4. Run ───────────────────────────────────────────────────────────────────
const doktor = await qaDoktor()
TOKEN = doktor.token
await hastaSil(doktor.id)
const pid = await hastaOlustur(doktor.id)
console.log(`Sentetik hasta: ${pid.slice(0, 8)}…  base: ${BASE}`)

const me = await istek('users/me specialty', 'GET', '/api/users/me')
kontrol('QA doktor branşı dahiliye (Dahiliye sekmesi görünür)', /dahiliye/.test(String((me.json as V).data?.specialty)), (me.json as V).data?.specialty)

const once = (await istek('GET dahiliye (önce — lab yok)', 'GET', dah(pid))).json as V

// KB kaydet
await post('KB kaydet', pid, { adim: 'kb', sbp: 152, dbp: 94, nabiz: 78 })
const kbTeknikEksik = await post('KB ölçüm tekniği eksik → 409 (kapı)', pid, { adim: 'kbteknik', liste: KB_TEKNIK.slice(0, 3) }, 409)
await post('KB ölçüm tekniği tam', pid, { adim: 'kbteknik', liste: KB_TEKNIK })

// Lab onayla (önceki + güncel panel)
const p1 = await labPaneliTohumla(doktor.id, pid, gun(200), ONCEKI)
const p2 = await labPaneliTohumla(doktor.id, pid, gun(4), GUNCEL)
const onaysiz = (await istek('GET dahiliye (paneller onaysız)', 'GET', dah(pid))).json as V
kontrol('Onaysız lab satırı kartlara girmez', onaysiz.chips?.hba1c == null && onaysiz.chips?.egfr == null, { hba1c: onaysiz.chips?.hba1c, egfr: onaysiz.chips?.egfr })
// Önceki panel: hastanın henüz muayenesi yok → route "Lab değerlendirme" muayenesi açar (NOTYA-LAB-02 yolu).
await istek('Lab onayla (önceki panel, muayene yok → yeni muayene)', 'POST', '/api/doktor/belgeler/analiz/onayla', { analizId: p1.analizId, adim: 'onayla' })
const noteId = await muayeneOlustur(doktor.id, pid)
await istek('Lab onayla (güncel panel)', 'POST', '/api/doktor/belgeler/analiz/onayla', { analizId: p2.analizId, adim: 'onayla', noteId })
const labSonra = (await istek('GET dahiliye (lab onaylı)', 'GET', dah(pid))).json as V
kontrol('Şerit HbA1c Δ onaylı iki panelden', labSonra.chips?.hba1c?.deger === 8.4 && labSonra.chips?.hba1c?.delta === 0.8, labSonra.chips?.hba1c)
kontrol('Şerit eGFR/LDL dolu', labSonra.chips?.egfr?.kanonik_deger === 44 && labSonra.chips?.ldl?.kanonik_deger === 131, { egfr: labSonra.chips?.egfr, ldl: labSonra.chips?.ldl })

// Dahiliye adımları
await post('DM değerlendir', pid, { adim: 'dm', tip: 'T2', taniTarihi: '2014-05-01', hedefHba1c: 7, ilacSiniflari: ['metformin'], sonGozDibi: gun(500) })
await post('DM döngü', pid, { adim: 'dmdongu', kky: false, sonAyakFoto: gun(420) })
await post('Lipid değerlendir', pid, { adim: 'lipid', statin: 'atorvastatin', statinBaslangic: gun(40), hedefLdl: 55 })
await post('Tiroid değerlendir', pid, { adim: 'tiroid', kiloKg: 94 })
await post('Tiroid nodül (US tarifi)', pid, { adim: 'nodul', lokasyon: 'sağ lob', girdi: { bilesim: 'solid', ekojenite: 'hipo', sekil: 'genis', kenar: 'duzgun', odak: 'yok', boyutMm: 14, usTarihi: gun(10) } })
await post('KVR girdileri', pid, { adim: 'kvr', sigara: false, askvh: false, dmTod: true, statinYogunluk: 'orta' })
await post('KBH (RAS blokeri + nefro sevk paketi)', pid, { adim: 'ckd', rasBlokeri: true, sglt2: false, nsaii: false, sevk: true })
for (const [i, [s, d]] of [[148, 92], [144, 90], [151, 93], [139, 86]].entries()) await post(`Ev kayıt KB #${i + 1}`, pid, { adim: 'evkayit', tip: 'kb', sbp: s, dbp: d, olcumAt: new Date(Date.now() - (i + 1) * 86400000).toISOString() })
for (const [i, g] of [156, 182].entries()) await post(`Ev kayıt glukoz #${i + 1}`, pid, { adim: 'evkayit', tip: 'glukoz', deger: g, aclik: true, olcumAt: new Date(Date.now() - (i + 1) * 86400000).toISOString() })
await post('Ev kayıt tip geçersiz → 400', pid, { adim: 'evkayit', tip: 'insulin', deger: 10 }, 400)
const izlem = await post('İlaç izlem görevleri', pid, { adim: 'ilacizlem' })
kontrol('İlaç izlem ≥1 görev (ramipril K/Cr, statin ALT, metformin B12)', Number((izlem.json as V).sayi) >= 1, izlem.json)
await post('Anemi girdisi', pid, { adim: 'anemi', gisKanama: false })
await post('Obezite', pid, { adim: 'obezite', kiloKg: 94, boyCm: 172, belCm: 108, komorbidite: { ht: true, dislipidemi: true } })
await post('KETEM tarama', pid, { adim: 'tarama', sonGgk: gun(900) })
await post('Aşı profili', pid, { adim: 'asiprofil', akciger: true })
await post('Aşı kaydı (grip, geçen sezon)', pid, { adim: 'asi', asi: 'grip', tarih: gun(330) })
await post('HT başlangıç paneli istemi', pid, { adim: 'htpanel' })
await post('KY / GDMT', pid, { adim: 'hf', ef: 47, nyha: 2, ekoTarihi: gun(60), yatis12Ay: false })
await post('Antikoagülan (AF, DOAK)', pid, { adim: 'antikoagulan', endikasyon: 'af', kiloKg: 94, hasBled: { alkol: false } })
await post('KOAH spirometri', pid, { adim: 'pulm', tani: 'koah', fev1Fvc: 0.62, fev1Yuzde: 68, mmrc: 2, cat: 14, ortaAlevlenme: 1, sonSpirometri: gun(400), teknik: [] })
await post('Office GI (GÖRH + H. pylori)', pid, { adim: 'gi', gerd: { tipikSemptom: true }, hp: { test: 'pozitif', eradikasyonBitis: gun(20), ppiKesimTarihi: gun(6) } })
await post('EKG acil bulgu, onaysız → 409 (kırmızı kapı)', pid, { adim: 'ekg', girdi: { ritim: 'sinus', hiz: 88, stElevasyon: true, gogusAgrisi: true } }, 409)
const ekg = await post('EKG şablon (LVH)', pid, { adim: 'ekg', sablon: 'lvh' })
await post('EKG hekim onayı', pid, { adim: 'ekgonay', ekgId: (ekg.json as V).ekgId })
await post('Kırmızı bayrak kontrolü', pid, { adim: 'kirmizi', gogusAgrisi: false, yeniEkg: false, ates: false })

// Quality nudges — result must NOT reach the note until "Nota ekle"
await post('FRAIL taraması', pid, { adim: 'nudge', tip: 'frail', cevaplar: { yorgunluk: true, hastalik: true } })
await post('Düşme taraması', pid, { adim: 'nudge', tip: 'dusme', cevaplar: { dengesiz: true } })
await post('PHQ-2', pid, { adim: 'nudge', tip: 'phq2', cevaplar: { ilgi: 1, cokkunluk: 1 } })
const notOnce = await sb.from('notes').select('content_degerlendirme').eq('id', noteId).single()
kontrol('Tarama sonucu nota otomatik yazılmadı (C6)', !/FRAIL/.test(String(notOnce.data?.content_degerlendirme || '')), 'FRAIL yok')
await post('FRAIL → Nota ekle (hekim)', pid, { adim: 'notaekle', tip: 'frail' })
const notSonra = await sb.from('notes').select('content_degerlendirme').eq('id', noteId).single()
kontrol('Nota ekle sonrası FRAIL notta', /FRAIL/.test(String(notSonra.data?.content_degerlendirme || '')), 'FRAIL var')
const nudgeV = (await istek('GET dahiliye (Nota ekle sonrası)', 'GET', dah(pid))).json as V
kontrol('Nota ekle sonrası FRAIL sonucu işaretli (CTA gizlenir), düşme henüz eklenmedi', !!nudgeV.wow?.w4?.son?.frail?.nota_eklendi_at && !nudgeV.wow?.w4?.son?.dusme?.nota_eklendi_at, { frail: nudgeV.wow?.w4?.son?.frail?.nota_eklendi_at, dusme: nudgeV.wow?.w4?.son?.dusme?.nota_eklendi_at })

// Hekim kilitleri (every card)
const kilitler: [string, string, unknown][] = [
  ['ht', 'evre', 'Evre 1 HT (hekim)'], ['ht', 'hedef', { sbp: 130, dbp: 80 }], ['dm', 'hedef_hba1c', 7], ['dm', 'tip', 'T2'], ['lipid', 'hedef_ldl', 55],
  ['kvr', 'kategori', 'cok_yuksek'], ['kvr', 'hedef_ldl', 55], ['ckd', 'evre', 'G3b A2'], ['tiroid', 'tani', 'Subklinik hipotiroidi (izlem)'],
  ['anemi', 'plan', 'Demir eksikliği: GİS değerlendirme planı'], ['obezite', 'plan', 'Yaşam tarzı + TEMD basamak 2 değerlendirme'], ['hf', 'nyha', 2],
  ['antikoagulan', 'ajan', 'DOAK (apiksaban) — doz hekim yazar'], ['antikoagulan', 'endikasyon', 'af'], ['gi', 'plan', 'H. pylori kontrol testi'], ['pulm', 'tani', 'KOAH GOLD 2'],
  ['asi', 'plan', 'Grip + PCV20'], ['tarama', 'plan', 'GGK / kolonoskopi'], ['ekg', 'rapor', 'LVH'], ['nodul', 'tarif', 'TI-RADS tarzı izlem'], ['sgk', 'rapor', 'statin'],
  ['nudge', 'kirilganlik', 'ön-kırılgan'],
]
for (const [kart, alan, deger] of kilitler) await post(`Hekim kilidi ${kart}.${alan}`, pid, { adim: 'kilit', kart, alan, deger, kaynak: 'dah-smoke' })
await post('Kilitlenemez alan (dm.insulin_doz) → 400', pid, { adim: 'kilit', kart: 'dm', alan: 'insulin_doz', deger: 10 }, 400)
const sgk = await post('SGK rapor taslağı (statin)', pid, { adim: 'sgkrapor', sablon: 'statin', sureAy: 12 })
const sgkSatir = await sb.from('dahiliye_sgk_raporlari').select('draft').eq('id', String((sgk.json as V).raporId)).single()
kontrol('SGK taslağı DB\'de ad / T.C. saklamaz', (sgkSatir.data?.draft as V)?.hastaAdi === '' && (sgkSatir.data?.draft as V)?.tcSon4 === '', { hastaAdi: (sgkSatir.data?.draft as V)?.hastaAdi, tcSon4: (sgkSatir.data?.draft as V)?.tcSon4 })
kontrol('SGK statin taslağı KVR kilidini okur', !JSON.stringify((sgk.json as V).eksikler || []).includes('KVR kategorisi'), (sgk.json as V).eksikler)
await post('SGK rapor hekim kilidi', pid, { adim: 'sgkkilit', raporId: (sgk.json as V).raporId })

// Check-up: V1 kayıt + paket defteri + birleşik rapor + hekim kilidi
await post('Check-up V1 kaydı', pid, { adim: 'checkup', panelIds: [p2.panelId], sustur: true })
await post('Check-up paketi başlat (ileri65, kendi ödemeli)', pid, { adim: 'checkuppaket', sku: 'ileri65', tarih: gun(6) })
const paketV = (await istek('GET dahiliye (paket)', 'GET', dah(pid))).json as V
const paket = paketV.wow?.w3?.checkup?.paketler?.[0]
kontrol('Paket kalemleri onaylı lab ile tamamlanıyor', paket && paket.tamamlanan > 0, paket && { tamamlanan: paket.tamamlanan, zorunlu: paket.zorunluToplam })
const kirilganlik = paket?.kalemler?.find((k: V) => k.kod === 'kirilganlik')
kontrol('Check-up "Kırılganlık + düşme taraması" dahiliye_taramalar kaydıyla otomatik tamam', kirilganlik?.tamam === true && kirilganlik?.kaynak === 'tarama', kirilganlik)
const taslak = await post('Birleşik rapor (taslak)', pid, { adim: 'checkuprapor', paketId: paket?.id })
kontrol('Birleşik rapor TASLAK damgası', JSON.stringify((taslak.json as V).rapor).includes('TASLAK'), 'TASLAK')
await post('Check-up kart kilidi (rapor)', pid, { adim: 'kilit', kart: 'checkup', alan: 'rapor', deger: 'onaylı', kaynak: 'dah-smoke' })
await post('Birleşik rapor hekim onayı', pid, { adim: 'checkupkilit', paketId: paket?.id })
const kilitliRapor = await post('Birleşik rapor (hekim onaylı)', pid, { adim: 'checkuprapor', paketId: paket?.id })
kontrol('Birleşik rapor hekim onaylı', JSON.stringify((kilitliRapor.json as V).rapor).includes('hekim onaylı'), 'hekim onaylı')

// Portal ön anket (PIN-gated) → doktor "Subjektif'e ekle"
const secret = process.env.PORTAL_TOKEN_SECRET
let portalLink: string | null = null
if (secret) {
  const tokenHash = createHmac('sha256', secret).update(`${pid}${doktor.id}${Date.now()}`).digest('hex')
  const pin = generatePortalPin()
  const { error } = await sb.from('hasta_portal_tokens').insert({ token_hash: tokenHash, doctor_id: doktor.id, patient_id: pid, expires_at: new Date(Date.now() + 2 * 86400000).toISOString(), created_at: new Date().toISOString(), pin_hash: hashPortalPin(pin) })
  if (error) throw new Error(`hasta_portal_tokens: ${error.message}`)
  portalLink = tokenHash
  const saved = TOKEN; TOKEN = ''
  await istek('Portal anket PIN olmadan → 401', 'POST', `/api/portal/hasta/${tokenHash}/dahiliye-anket`, {}, 401)
  const u = await istek('Portal PIN unlock', 'POST', `/api/portal/hasta/${tokenHash}/unlock`, { pin })
  const cookie = (u.r.headers.get('set-cookie') || '').split(';')[0]
  await istek('Portal ön anket gönder', 'POST', `/api/portal/hasta/${tokenHash}/dahiliye-anket`, { kb: [{ sbp: 146, dbp: 90 }, { sbp: 149, dbp: 91 }], glukoz: [{ deger: 162, aclik: true }], kilo: 94, kacirilanDoz: '1-2', semptomlar: [], sorular: 'Sentetik QA sorusu: statin kas ağrısı yapar mı?' }, 200, { Cookie: cookie })
  TOKEN = saved
  const v = (await istek('GET dahiliye (ön anket)', 'GET', dah(pid))).json as V
  const anketId = v.wow?.w2?.anket?.id
  kontrol('Ön anket doktor tarafında görünür', !!anketId, v.wow?.w2?.anket)
  await post("Ön anket → Subjektif'e ekle (hekim)", pid, { adim: 'anketsoap', anketId })
} else kontrol('PORTAL_TOKEN_SECRET yok — portal adımı atlandı', false, 'env')

// Kohort paneli + 1-tap hatırlatma
const kohort = (await istek('Kohort paneli', 'GET', '/api/doktor/dahiliye/kohort')).json as V
const satir = (kohort.satirlar || []).find((s: V) => s.patientId === pid)
kontrol('Sentetik hasta kohortta bayraklı', !!satir && satir.bayraklar.length > 0, satir)
const recall = await istek('Kohort 1-tap hatırlatma', 'POST', '/api/doktor/dahiliye/kohort', { patientIds: [pid] })
const recallMsg = await sb.from('hasta_mesajlar').select('metin, hasta_mesaj_konulari!inner(patient_id)').eq('hasta_mesaj_konulari.patient_id', pid).limit(1)
kontrol('Hatırlatma mesajında klinik değer yok', (recall.json as V).gonderilen === 1 && !/\d+[.,]\d|mg\/dL|HbA1c|LDL|eGFR/i.test(String(recallMsg.data?.[0]?.metin || '')), recallMsg.data?.[0]?.metin)
await istek('Kohort 7 gün içinde ikinci hatırlatma atlanır', 'POST', '/api/doktor/dahiliye/kohort', { patientIds: [pid] })


// SCORE2 (SCORE2_ONAYLI=true) — ikinci sentetik hasta, diyabetsiz, 40–69 yaş: KVR kartı sayısal SCORE2 yolunu çalıştırır.
// Girdiler EHJ 2021 ehab309 Updated Supplementary Material, Suppl. methods Table 4 örneği: erkek 50 yaş, sigara, SBP 140,
// TChol 6.3 mmol/L, HDL 1.4 mmol/L → yüksek risk bölgesi (Türkiye) yayımlanmış risk 0.0881 → %8.8, kova "yüksek" (50–69: %5–<10).
const dob50 = new Date(Date.now() - (50 * 365.25 + 120) * 86400000).toISOString().slice(0, 10)
const { data: p2Hasta, error: p2Err } = await sb.from('patients').insert({ doctor_id: doktor.id, name_encrypted: encrypt(JSON.stringify({ ad: HASTA_AD_SCORE2 })), dob_encrypted: encrypt(dob50), gender_encrypted: encrypt('E'), notes_encrypted: encrypt(JSON.stringify({ not: 'DAH-SCORE2-VERIFY sentetik QA hastası. Gerçek kişi değildir.' })), is_active: true }).select('id').single()
if (p2Err || !p2Hasta) throw new Error(`patients (SCORE2): ${p2Err?.message}`)
const pidS = String(p2Hasta.id)
const noteS = await muayeneOlustur(doktor.id, pidS)
const lipS = await labPaneliTohumla(doktor.id, pidS, gun(3), [['Total kolesterol', 'TChol', 243.621, 'mg/dL', null, 200], ['HDL kolesterol', 'HDL', 54.138, 'mg/dL', 40, null], ['LDL kolesterol', 'LDL', 160, 'mg/dL', null, 130]])
await istek('SCORE2 hasta: lipid paneli onayla', 'POST', '/api/doktor/belgeler/analiz/onayla', { analizId: lipS.analizId, adim: 'onayla', noteId: noteS })
await post('SCORE2 hasta: KB kaydet (SBP 140)', pidS, { adim: 'kb', sbp: 140, dbp: 88, nabiz: 76 })
await post('SCORE2 hasta: KVR girdileri (sigara, ASKVH yok, DM yok)', pidS, { adim: 'kvr', sigara: true, askvh: false, dmTod: false, statinYogunluk: 'yok' })
const kvrV = (await istek('GET dahiliye (SCORE2 hasta)', 'GET', dah(pidS))).json as V
const kvrS = kvrV.wow?.kvr?.sonuc
kontrol('KVR kartı SCORE2 %8.8 (Suppl. Table 4 yüksek risk bölgesi erkek 0.0881)', kvrS?.score2 === 8.8, { score2: kvrS?.score2, not: kvrS?.score2Notu })
kontrol('SCORE2 kova taslak "yüksek" + ESC_SCORE2 Kaynak dipnotu', kvrS?.kova === 'yuksek' && (kvrS?.dipnotlar || []).some((d: V) => d.ref === 'ESC_SCORE2'), { kova: kvrS?.kova, neden: kvrS?.kovaNedeni })
kontrol('SCORE2 kategori hekim kilidi yokken kilitsiz, nota yazılmadı', !kvrV.wow?.kvr?.kilitKategori && !/SCORE2/.test(String((await sb.from('notes').select('content_degerlendirme, content_plan').eq('id', noteS).single()).data?.content_degerlendirme || '')), { kilit: kvrV.wow?.kvr?.kilitKategori })
await post('SCORE2 hasta: KVR kategori hekim kilidi', pidS, { adim: 'kilit', kart: 'kvr', alan: 'kategori', deger: 'yuksek', kaynak: 'dah-smoke-score2' })
const kvrKilitV = (await istek('GET dahiliye (SCORE2 kilit sonrası)', 'GET', dah(pidS))).json as V
kontrol('SCORE2 kategori hekim kilidiyle kesinleşti', kvrKilitV.wow?.kvr?.kilitKategori === 'yuksek', kvrKilitV.wow?.kvr?.kilitKategori)

// SCORE2-OP (DAH-SCORE2-OP, SCORE2_OP_ONAYLI=false) — ≥70 yaş sentetik hasta: KVR kartı OP yoluna gider, sayı YOK, hekim kategori kilitler.
async function yasliHasta(ad: string, yil: number, not: string) {
  const dob = new Date(Date.now() - (yil * 365.25 + 120) * 86400000).toISOString().slice(0, 10)
  const { data, error } = await sb.from('patients').insert({ doctor_id: doktor.id, name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(dob), gender_encrypted: encrypt('E'), notes_encrypted: encrypt(JSON.stringify({ not })), is_active: true }).select('id').single()
  if (error || !data) throw new Error(`patients (${ad}): ${error?.message}`)
  return String(data.id)
}
const pidOp = await yasliHasta(HASTA_AD_OP, 75, 'DAH-SCORE2-OP sentetik QA hastası. Gerçek kişi değildir.')
const noteOp = await muayeneOlustur(doktor.id, pidOp)
const lipOp = await labPaneliTohumla(doktor.id, pidOp, gun(3), [['Total kolesterol', 'TChol', 212.685, 'mg/dL', null, 200], ['HDL kolesterol', 'HDL', 50.271, 'mg/dL', 40, null], ['LDL kolesterol', 'LDL', 140, 'mg/dL', null, 130], ['eGFR', 'eGFR', 78, 'mL/dk/1.73m²', 90, null]])
await istek('SCORE2-OP hasta: lipid paneli onayla', 'POST', '/api/doktor/belgeler/analiz/onayla', { analizId: lipOp.analizId, adim: 'onayla', noteId: noteOp })
await post('SCORE2-OP hasta: KB kaydet (SBP 140)', pidOp, { adim: 'kb', sbp: 140, dbp: 80, nabiz: 72 })
await post('SCORE2-OP hasta: KVR girdileri (75 yaş, sigara, ASKVH/DM yok)', pidOp, { adim: 'kvr', sigara: true, askvh: false, dmTod: false, statinYogunluk: 'yok' })
const opV = (await istek('GET dahiliye (SCORE2-OP hasta)', 'GET', dah(pidOp))).json as V
const opS = opV.wow?.kvr?.sonuc
kontrol('≥70 yaş KVR: SCORE2-OP yolu, doğrulama kapısı kapalı → sayısal skor yok (SCORE2 de yok)', opS?.score2Op == null && opS?.score2 == null && /SCORE2-OP/.test(String(opS?.score2Notu || '')), { score2Op: opS?.score2Op, not: opS?.score2Notu })
kontrol('≥70 yaş KVR: uydurma kova yok, nota yazılmadı', opS?.kova == null && !/SCORE2/.test(String((await sb.from('notes').select('content_degerlendirme').eq('id', noteOp).single()).data?.content_degerlendirme || '')), { kova: opS?.kova })
await post('SCORE2-OP hasta: KVR kategori hekim kilidi (klinik karar)', pidOp, { adim: 'kilit', kart: 'kvr', alan: 'kategori', deger: 'yuksek', kaynak: 'dah-smoke-score2op' })
const opKilitV = (await istek('GET dahiliye (SCORE2-OP kilit sonrası)', 'GET', dah(pidOp))).json as V
kontrol('≥70 yaş KVR kategori yalnız hekim kilidiyle', opKilitV.wow?.kvr?.kilitKategori === 'yuksek', opKilitV.wow?.kvr?.kilitKategori)

// SCORE2-Diabetes (DAH-SCORE2-DIABETES, ONAYLI=true) — DM 60 yaş erkek: ehad260 örnek profili (SBP 140, TChol 5.5, HDL 1.3, HbA1c 50 mmol/mol, eGFR 90, tanı yaşı 60).
const pidDm = await yasliHasta(HASTA_AD_DM, 60, 'DAH-SCORE2-DIABETES sentetik QA hastası. Gerçek kişi değildir.')
const noteDm = await muayeneOlustur(doktor.id, pidDm)
const HBA1C_YUZDE = Math.round((50 / 10.929 + 2.15) * 1000) / 1000
const labDm = await labPaneliTohumla(doktor.id, pidDm, gun(3), [['Total kolesterol', 'TChol', 212.685, 'mg/dL', null, 200], ['HDL kolesterol', 'HDL', 50.271, 'mg/dL', 40, null], ['LDL kolesterol', 'LDL', 125, 'mg/dL', null, 130], ['HbA1c', 'HbA1c', HBA1C_YUZDE, '%', 4, 6], ['eGFR', 'eGFR', 90, 'mL/dk/1.73m²', 90, null], ['Kreatinin', 'Kre', 0.9, 'mg/dL', 0.7, 1.2]])
const dmOnaysiz = (await istek('GET dahiliye (SCORE2-Diabetes hasta, lab onaysız)', 'GET', dah(pidDm))).json as V
await post('SCORE2-Diabetes hasta: DM kartı (T2)', pidDm, { adim: 'dm', tip: 'T2', hedefHba1c: 7 })
await post('SCORE2-Diabetes hasta: KB kaydet (SBP 140)', pidDm, { adim: 'kb', sbp: 140, dbp: 85, nabiz: 74 })
await post('SCORE2-Diabetes hasta: KVR girdileri (sigara yok, DM tanı yaşı 60)', pidDm, { adim: 'kvr', sigara: false, askvh: false, dmTod: false, statinYogunluk: 'yok', dmTaniYasi: 60 })
const dmOnaysizV = (await istek('GET dahiliye (SCORE2-Diabetes hasta, onay öncesi)', 'GET', dah(pidDm))).json as V
kontrol('SCORE2-Diabetes: onaysız lab satırıyla skor yok (TEMD yedeği, eksikler notta)', dmOnaysizV.wow?.kvr?.sonuc?.score2Diabetes == null && /eksik/.test(String(dmOnaysizV.wow?.kvr?.sonuc?.score2Notu || '')), dmOnaysizV.wow?.kvr?.sonuc?.score2Notu)
void dmOnaysiz
await istek('SCORE2-Diabetes hasta: lab paneli onayla', 'POST', '/api/doktor/belgeler/analiz/onayla', { analizId: labDm.analizId, adim: 'onayla', noteId: noteDm })
const dmV = (await istek('GET dahiliye (SCORE2-Diabetes hasta)', 'GET', dah(pidDm))).json as V
const dmS = dmV.wow?.kvr?.sonuc
const dmBeklenen = Math.round(score2DmOlasilik({ yas: 60, cinsiyet: 'erkek', sigara: false, sbp: 140, tcholMmol: 212.685 / 38.67, hdlMmol: 50.271 / 38.67, hba1cMmolMol: (HBA1C_YUZDE - 2.15) * 10.929, eGFR: 90, taniYasi: 60, bolge: 'high' }) * 1000) / 10
kontrol(`DM 60 yaş KVR: SCORE2-Diabetes %${dmBeklenen} (yüksek risk bölgesi; orta bölge yayımlanmış %11.0 profili)`, dmS?.score2Diabetes === dmBeklenen && dmS?.score2 == null, { score2Diabetes: dmS?.score2Diabetes, not: dmS?.score2Notu })
kontrol('SCORE2-Diabetes kova taslak "yüksek" (ESC 2023 %10–<20) + ESC_SCORE2_DIABETES Kaynak', dmS?.kova === 'yuksek' && (dmS?.dipnotlar || []).some((d: V) => d.ref === 'ESC_SCORE2_DIABETES'), { kova: dmS?.kova, neden: dmS?.kovaNedeni })
await post('SCORE2-Diabetes hasta: KVR kategori hekim kilidi', pidDm, { adim: 'kilit', kart: 'kvr', alan: 'kategori', deger: 'yuksek', kaynak: 'dah-smoke-score2dm' })
const dmKilitV = (await istek('GET dahiliye (SCORE2-Diabetes kilit sonrası)', 'GET', dah(pidDm))).json as V
kontrol('SCORE2-Diabetes kategori hekim kilidiyle kesinleşti', dmKilitV.wow?.kvr?.kilitKategori === 'yuksek', dmKilitV.wow?.kvr?.kilitKategori)

// Lab upload path (DAH-LAB-BELGELER) — third synthetic patient, real upload → extraction → onayla.
const { data: labHasta, error: lhErr } = await sb.from('patients').insert({ doctor_id: doktor.id, name_encrypted: encrypt(JSON.stringify({ ad: HASTA_AD_LAB })), dob_encrypted: encrypt('1966-06-02'), gender_encrypted: encrypt('K'), notes_encrypted: encrypt(JSON.stringify({ not: 'DAH-LAB-BELGELER sentetik QA hastası. Gerçek kişi değildir.' })), is_active: true }).select('id').single()
if (lhErr || !labHasta) throw new Error(`patients (lab yükleme): ${lhErr?.message}`)
const pidL = String(labHasta.id)
const noteL = await muayeneOlustur(doktor.id, pidL)
const labOnce = (await istek('Lab yükleme hasta: GET dahiliye (lab yok)', 'GET', dah(pidL))).json as V
kontrol('Lab yükleme hasta: yüklemeden önce şeritte HbA1c yok', labOnce.chips?.hba1c == null, labOnce.chips?.hba1c)
const pdf = sentetikLabPdf(gun(2), gun(1), 'TEST Dahiliye Lab Yukleme Smoke')
const form = new FormData()
form.append('file', new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }), 'sentetik-lab-dah-smoke.pdf')
form.append('patientId', pidL); form.append('category', 'lab')
const t0Up = Date.now()
const upR = await fetch(`${BASE}/api/doktor/documents`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: form })
const upJ = (await upR.json().catch(() => ({}))) as V
kayit.push({ adim: 'Lab PDF yükle (vault, multipart)', durum: upR.status, beklenen: 201, ok: upR.status === 201, ms: Date.now() - t0Up, ozet: upJ })
console.log(`${upR.status === 201 ? '✓' : '✗'} Lab PDF yükle (vault, multipart) → ${upR.status}`)
const belgeId = String(upJ.document?.id || '')
const cikar = await istek('Lab çıkar (pdfjs yapı + Claude görsel, uzlaştır)', 'POST', '/api/doktor/belgeler/lab', { adim: 'cikar', documentId: belgeId })
const labPanelId = String((cikar.json as V).panelId || '')
kontrol('Çıkarım: tüm sentetik satırlar, yapı kaynağı dahil', Number((cikar.json as V).ozet?.toplam) >= SENTETIK_SATIRLAR.length && ((cikar.json as V).kaynaklar || []).includes('yapi'), cikar.json)
const cikanSatirlar = (await sb.from('lab_satirlar').select('raw_name, canonical_key, value_num, unit, kanonik_deger, kanonik_birim, flag, onayli, numune_tarihi, dogrulanacak').eq('panel_id', labPanelId).order('sira')).data || []
const anahtarlar = new Set(cikanSatirlar.map((r) => r.canonical_key))
kontrol('Çıkarım: canonical_key eşleşmesi (HbA1c, Glu, Kre, LDL, K, ALT)', SENTETIK_SATIRLAR.every((s) => anahtarlar.has(s.beklenenKey)), [...anahtarlar])
const a1cSatir = cikanSatirlar.find((r) => r.canonical_key === 'HbA1c')
const kreSatir = cikanSatirlar.find((r) => r.canonical_key === 'Kre')
kontrol('Çıkarım: HbA1c 7.9 %, numune tarihi basılı tarihten', Number(a1cSatir?.kanonik_deger) === 7.9 && a1cSatir?.numune_tarihi === gun(2), a1cSatir)
kontrol('Çıkarım: Kreatinin 88 µmol/L → mg/dL kanonik birim', kreSatir?.kanonik_birim === 'mg/dL' && Math.abs(Number(kreSatir?.kanonik_deger) - 0.995) < 0.01, kreSatir)
kontrol('Çıkarım sonrası tüm satırlar onayli=false', cikanSatirlar.length > 0 && cikanSatirlar.every((r) => r.onayli === false), cikanSatirlar.map((r) => r.onayli))
const labOnaysiz = (await istek('Lab yükleme hasta: GET dahiliye (çıkarıldı, onaysız)', 'GET', dah(pidL))).json as V
kontrol('Onaysız çıkarılmış satır şeride/kartlara girmez (HbA1c, LDL)', labOnaysiz.chips?.hba1c == null && labOnaysiz.chips?.ldl == null, { hba1c: labOnaysiz.chips?.hba1c, ldl: labOnaysiz.chips?.ldl })
const labTablo = (await istek('Lab tablo GET (hekim ekranı verisi)', 'GET', `/api/doktor/belgeler/lab?documentId=${belgeId}`)).json as V
await istek('Lab raporla tablo onayı olmadan → 409', 'POST', '/api/doktor/belgeler/lab', { adim: 'raporla', panelId: labPanelId }, 409)
await istek('Lab tablo onayla (hekim)', 'POST', '/api/doktor/belgeler/lab', { adim: 'tablo_onayla', panelId: labPanelId })
const raporla = await istek('Lab raporla (Claude yazar, taslak)', 'POST', '/api/doktor/belgeler/lab', { adim: 'raporla', panelId: labPanelId })
const labAnalizId = String((raporla.json as V).analizId || '')
const labRapor = ((await istek('Lab rapor GET (Kaynak dipnotları)', 'GET', `/api/doktor/belgeler/lab?documentId=${belgeId}`)).json as V).analiz?.sonuc?.lab
kontrol('Lab raporu: her olası tanı + öneri Kaynak ref_code taşır (dahiliye, C4)', !!labRapor?.kaynak && labRapor.kaynak.tanilar.length === labRapor.tanilar.length && labRapor.kaynak.oneri.length > 0 && labRapor.kaynak.oneri.some((d: V) => d.ref === 'TEMD_DM2026'), { tanilar: labRapor?.tanilar?.map((t: V) => t.icd10), kaynak: labRapor?.kaynak })
kontrol('Lab raporu reçete ipucunda doz yok', !/\d+\s*(mg|mcg|µg|ünite|tablet)/i.test(String(labRapor?.recete_ipucu || '')), labRapor?.recete_ipucu)
await istek('Onayla hekim tanısı olmadan → 400 (hekim kilidi)', 'POST', '/api/doktor/belgeler/analiz/onayla', { analizId: labAnalizId, adim: 'onayla', noteId: noteL }, 400)
await istek('Resmi tanıyı kilitle (hekim)', 'PATCH', '/api/doktor/belgeler/analiz', { analizId: labAnalizId, alan: 'hekim_tanisi', sonraki: [{ ad: 'Tip 2 diabetes mellitus', icd10: 'E11' }] })
const labOnayla = await istek('Lab onayla (yüklenen PDF paneli)', 'POST', '/api/doktor/belgeler/analiz/onayla', { analizId: labAnalizId, adim: 'onayla', noteId: noteL })
const onayliSatirlar = (await sb.from('lab_satirlar').select('onayli').eq('panel_id', labPanelId)).data || []
kontrol('Onayla sonrası panelin tüm satırları onayli=true', onayliSatirlar.length === cikanSatirlar.length && onayliSatirlar.every((r) => r.onayli === true), onayliSatirlar.length)
const labOnayli = (await istek('Lab yükleme hasta: GET dahiliye (onaylı)', 'GET', dah(pidL))).json as V
kontrol('Şerit HbA1c yüklenen PDF\'ten (7.9, onaylı satır)', labOnayli.chips?.hba1c?.deger === 7.9 && labOnayli.chips?.hba1c?.tarih === gun(2), labOnayli.chips?.hba1c)
const notL = await sb.from('notes').select('content_objektif').eq('id', noteL).single()
kontrol('Lab bloğu nota yalnız Onayla ile yazıldı (Objektif [Lab])', /\[Lab\]/.test(String(notL.data?.content_objektif || '')), String(notL.data?.content_objektif || '').slice(0, 120))

const sonra = (await istek('GET dahiliye (sonra)', 'GET', dah(pid))).json as V

// ── 5. Output ────────────────────────────────────────────────────────────────
const cikti = path.join(process.cwd(), 'smoke-out')
fs.mkdirSync(cikti, { recursive: true })
const ozet = {
  calisma: new Date().toISOString(), base: BASE, qaDoktor: QA_EMAIL, hasta: HASTA_AD,
  adimlar: kayit.map(({ adim, durum, beklenen, ok, ms }) => ({ adim, durum, beklenen, ok, ms })),
  kontroller,
  once: { serit: once.serit, chips: once.chips },
  sonra: { serit: sonra.serit, chips: sonra.chips, kvr: sonra.wow?.kvr, ckd: sonra.wow?.ckd, ev: { kb: sonra.wow?.ev?.kb, glukoz: sonra.wow?.ev?.glukoz }, izlem: sonra.wow?.izlem, w2: sonra.wow?.w2, w3: sonra.wow?.w3, w4: sonra.wow?.w4?.nudgeler, sgkRaporlar: sonra.wow?.sgkRaporlar?.map((r: V) => ({ sablon: r.sablon, durum: r.durum, eksikler: r.eksikler })), dm: sonra.dm?.degerlendirme, lipid: sonra.lipid?.degerlendirme, tiroid: sonra.tiroid?.degerlendirme, ht: sonra.ht?.[0]?.degerlendirme, gorevler: sonra.gorevler?.map((g: V) => ({ kod: g.kod, ad: g.ad, due: g.due, kaynak: g.kaynak })), sevkler: sonra.sevkler?.map((s: V) => ({ hedef: s.hedef, kaynak: s.kaynak })), ilacUyari: sonra.ilacUyari },
  checkupRapor: (kilitliRapor.json as V).rapor,
  kohort: satir ? { bayraklar: satir.bayraklar, gecikmisSayi: satir.gecikmisSayi, oncelik: satir.oncelik, portalVar: satir.portalVar } : null,
  kbTeknikKapi: kbTeknikEksik.json,
  score2: { sonuc: kvrS, kilitKategori: kvrKilitV.wow?.kvr?.kilitKategori },
  score2Op: { sonuc: opS, kilitKategori: opKilitV.wow?.kvr?.kilitKategori },
  score2Diabetes: { sonuc: dmS, beklenen: dmBeklenen, kilitKategori: dmKilitV.wow?.kvr?.kilitKategori },
  labYukleme: { belgeId, panelId: labPanelId, analizId: labAnalizId, cikar: cikar.json, raporKaynak: labRapor?.kaynak, raporTanilar: labRapor?.tanilar?.map((t: V) => ({ ad: t.ad, icd10: t.icd10, guven_pct: t.guven_pct })), satirlarCikarimSonrasi: cikanSatirlar, tablo: { panel: labTablo.panel && { kaynaklar: labTablo.panel.kaynaklar, kalite: labTablo.panel.kalite, durum: labTablo.panel.durum, numune_tarihi: labTablo.panel.numune_tarihi, kimlik_uyari: labTablo.panel.kimlik_uyari } }, onaysizChips: { hba1c: labOnaysiz.chips?.hba1c ?? null, ldl: labOnaysiz.chips?.ldl ?? null }, onayla: labOnayla.json, onayliSatirSayisi: onayliSatirlar.length, onayliChips: { hba1c: labOnayli.chips?.hba1c, ldl: labOnayli.chips?.ldl, k: labOnayli.chips?.k } },
}
fs.writeFileSync(path.join(cikti, 'dahiliye-smoke.json'), JSON.stringify(ozet, null, 2))
// Browser session for screenshots (local only, gitignored).
fs.writeFileSync(path.join(cikti, 'session.json'), JSON.stringify({ patientId: pid, score2PatientId: pidS, score2OpPatientId: pidOp, score2DmPatientId: pidDm, labPatientId: pidL, labDocumentId: belgeId, portalToken: portalLink, auth: { access_token: doktor.token, refresh_token: doktor.refresh, expires_at: doktor.expiresAt } }))
const hatali = kayit.filter((k) => !k.ok).length + kontroller.filter((k) => !k.ok).length
console.log(`\n${kayit.length} istek, ${kontroller.length} kontrol, ${hatali} hata → smoke-out/dahiliye-smoke.json`)
process.exit(hatali ? 1 : 0)
