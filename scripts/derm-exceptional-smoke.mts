#!/usr/bin/env npx tsx
/**
 * DERM-EXCEPTIONAL-01 — every new derm adım / action against the real API routes (DERM-MD-BETA pack, synthetic only).
 *
 * Fixture: the same QA doctor as derm-prompts-smoke (`qa.derm@notya.ai`, users.specialty = 'dermatoloji'; password only
 * in .env.local as QA_DERM_PASSWORD, generated on first run). SYNTHETIC patients (no T.C., no phone), deleted and
 * re-seeded every run:
 *  - "TEST Derm Exc Yetiskin" (34 y, K) — klinik ünite, lezyon → ABCDE → melanom acil görevi, resmî tanı (hekim),
 *    punch işlemi + onam + yara/dikiş/patoloji görevleri, izotretinoin GÖP kapısı (β-hCG + onam) ve aylık görev,
 *    biyolojik lab kapısı, skor kaydı, fototerapi seansı (solaryum reddi), yama D2/D4 kursu, foto onamı,
 *    Belge → derm_vision_reads dual-sign köprüsü + uzman onayı, Asistana raporla (gerçek Tier A, sentetik gri görüntü),
 *    Sağlığım › Derim hasta-güvenli hatırlatmaları.
 *  - "TEST Derm Exc Cocuk" (6 y) — pediatrik derm şablonu; erişkin hastada pediatri alanı görünmez (branş sızması).
 *
 *   npm run dev   (or SMOKE_BASE_URL=…)   then   npx --yes tsx scripts/derm-exceptional-smoke.mts
 * Exit code 1 if any expectation fails. Writes smoke-out/derm-exceptional-smoke.json (gitignored).
 */
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { randomBytes, randomUUID } from 'crypto'
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

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const QA_EMAIL = 'qa.derm@notya.ai'
const QA_AD = 'QA Dermatoloji (TEST hesabı)'
const YETISKIN = 'TEST Derm Exc Yetiskin', COCUK = 'TEST Derm Exc Cocuk'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
const gun = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)
const T = gun(0)
type V = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

async function qaDoktor(): Promise<{ id: string; token: string }> {
  let sifre = process.env.QA_DERM_PASSWORD || ''
  const yeniSifre = () => {
    sifre = `Qa-${randomBytes(18).toString('base64url')}`
    fs.appendFileSync(envPath, `\n# DERM QA doktor (qa.derm@notya.ai) — yalnız yerel, commit edilmez\nQA_DERM_PASSWORD=${sifre}\n`)
  }
  let id: string | null = null
  for (let page = 1; page <= 20 && !id; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    id = data.users.find((u) => u.email === QA_EMAIL)?.id || null
    if (data.users.length < 200) break
  }
  if (!id) {
    if (!sifre) yeniSifre()
    const { data, error } = await sb.auth.admin.createUser({ email: QA_EMAIL, password: sifre, email_confirm: true, user_metadata: { full_name: QA_AD, specialty: 'dermatoloji', qa: true } })
    if (error || !data.user) throw new Error(`createUser: ${error?.message}`)
    id = data.user.id
  } else if (!sifre) {
    yeniSifre()
    const { error } = await sb.auth.admin.updateUserById(id, { password: sifre })
    if (error) throw new Error(`updateUser: ${error.message}`)
  }
  await sb.from('users').upsert({ id, email: QA_EMAIL, full_name: QA_AD, specialty: 'dermatoloji', updated_at: new Date().toISOString() }, { onConflict: 'id' })
  const { data: s, error } = await anon.auth.signInWithPassword({ email: QA_EMAIL, password: sifre })
  if (error || !s.session) throw new Error(`signIn: ${error?.message}`)
  return { id, token: s.session.access_token }
}

const HASTA_TABLOLARI = ['derm_gorevleri', 'derm_islemler', 'derm_ilac_guvenlik', 'derm_foto_meta', 'jine_gorevleri', 'onamlar', 'belge_analizleri', 'hasta_goruntulemeler', 'lab_satirlar', 'hasta_hatirlatma', 'hasta_portal_tokens']
const EPIZOT_TABLOLARI = ['derm_vision_reads', 'derm_yama_kurslari', 'derm_fototerapi_seanslari', 'derm_skor_anlari', 'derm_lezyonlar', 'derm_ziyaretleri']

async function temizle(doctorId: string) {
  const { data } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId)
  for (const p of data || []) {
    let ad = ''; try { ad = JSON.parse(decrypt(String(p.name_encrypted))).ad || '' } catch { ad = '' }
    if (![YETISKIN, COCUK].includes(ad)) continue
    const { data: hd } = await sb.from('hasta_derm').select('id').eq('patient_id', p.id)
    for (const e of hd || []) for (const t of EPIZOT_TABLOLARI) await sb.from(t).delete().eq('hasta_derm_id', e.id)
    await sb.from('hasta_derm').delete().eq('patient_id', p.id)
    for (const t of HASTA_TABLOLARI) await sb.from(t).delete().eq('patient_id', p.id)
    const { data: konular } = await sb.from('hasta_mesaj_konulari').select('id').eq('patient_id', p.id)
    const kid = (konular || []).map((k) => k.id)
    if (kid.length) { await sb.from('hasta_mesajlar').delete().in('konu_id', kid); await sb.from('hasta_mesaj_konulari').delete().in('id', kid) }
    const { data: ses } = await sb.from('sessions').select('id').eq('patient_id', p.id)
    const ids = (ses || []).map((s) => s.id)
    if (ids.length) {
      const { data: n } = await sb.from('notes').select('id').in('session_id', ids)
      const nid = (n || []).map((x) => x.id)
      if (nid.length) { await sb.from('not_duzenlemeleri').delete().in('note_id', nid); await sb.from('notes').delete().in('id', nid) }
      await sb.from('sessions').delete().in('id', ids)
    }
    const { error } = await sb.from('patients').delete().eq('id', p.id)
    if (error) throw new Error(`hasta silinemedi: ${error.message}`)
  }
}

async function hasta(doctorId: string, ad: string, dob: string) {
  const { data: p, error } = await sb.from('patients').insert({
    doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(dob),
    gender_encrypted: encrypt('female'), notes_encrypted: encrypt(JSON.stringify({ not: 'DERM-EXCEPTIONAL sentetik QA hastası.' })), is_active: true,
  }).select('id').single()
  if (error || !p) throw new Error(`patients: ${error?.message}`)
  const { data: s } = await sb.from('sessions').insert({ doctor_id: doctorId, patient_id: p.id, status: 'completed', session_type: 'kontrol', specialty: 'dermatoloji', duration_seconds: 0, transcript_cleaned: '[DERM-EXCEPTIONAL sentetik]' }).select('id').single()
  await sb.from('notes').insert({ session_id: s!.id, doctor_id: doctorId, note_type: 'soap', content_subjektif: 'Kontrol (sentetik QA).', content_objektif: '', basvuru_yakinmasi: 'Deri kontrolü', approved_at: new Date().toISOString() })
  return { id: String(p.id), seans: String(s!.id) }
}

/** Sentetik gri PNG (kimlik yok, klinik içerik yok) — Tier A yolunu gerçek modelle uçtan uca sınar. */
function griPng(k = 96): string {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
  const parca = (tip: string, veri: Buffer) => { const u = Buffer.alloc(4); u.writeUInt32BE(veri.length); const tv = Buffer.concat([Buffer.from(tip), veri]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(tv)); return Buffer.concat([u, tv, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(k, 0); ihdr.writeUInt32BE(k, 4); ihdr[8] = 8; ihdr[9] = 0
  const ham = Buffer.alloc((k + 1) * k); for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) ham[y * (k + 1) + 1 + x] = 60 + ((x * y) % 40)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), parca('IHDR', ihdr), parca('IDAT', zlib.deflateSync(ham)), parca('IEND', Buffer.alloc(0))]).toString('base64')
}

let TOKEN = ''
const kayit: V[] = []
let hataSayisi = 0
async function istek(ad: string, method: 'GET' | 'POST', yol: string, body?: unknown, beklenen = 200) {
  const r = await fetch(`${BASE}${yol}`, { method, headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const metin = await r.text(); let json: V = {}; try { json = JSON.parse(metin) } catch { json = { _metin: metin.slice(0, 300) } }
  const ok = r.status === beklenen; if (!ok) hataSayisi++
  kayit.push({ ad, durum: r.status, ok })
  console.log(`${ok ? '✓' : '✗'} ${ad} → ${r.status}${ok ? '' : ` (beklenen ${beklenen}) ${metin.slice(0, 240)}`}`)
  return { r, json, metin }
}
function kontrol(ad: string, kosul: boolean, detay: unknown) {
  if (!kosul) hataSayisi++
  kayit.push({ ad, ok: kosul })
  console.log(`${kosul ? '✓' : '✗'} KONTROL ${ad}${kosul ? '' : ` — ${String(JSON.stringify(detay)).slice(0, 300)}`}`)
}
const klinik = (ad: string, pid: string, b: V, beklenen = 200) => istek(ad, 'POST', '/api/doktor/dermatoloji', { patientId: pid, ...b }, beklenen)
const spine = (ad: string, pid: string, b: V, beklenen = 200) => istek(ad, 'POST', '/api/doktor/dermatoloji/spine', { patientId: pid, ...b }, beklenen)
const getKlinik = async (pid: string) => (await istek('GET deri klinik', 'GET', `/api/doktor/dermatoloji?patientId=${pid}`)).json
const getSpine = async (pid: string) => (await istek('GET deri spine', 'GET', `/api/doktor/dermatoloji/spine?patientId=${pid}`)).json
const objektif = async (seans: string) => String((await sb.from('notes').select('content_objektif').eq('session_id', seans).single()).data?.content_objektif || '')

const doktor = await qaDoktor(); TOKEN = doktor.token
await temizle(doktor.id)
const Y = await hasta(doktor.id, YETISKIN, '1992-04-11')
const C = await hasta(doktor.id, COCUK, gun(6 * 365))
const pid = Y.id
console.log(`Sentetik hastalar hazır · base ${BASE}`)

// ── Klinik ünite + ziyaret + Fitzpatrick ──
await klinik('Klinik ünite (nevüs-tümör) + Fitzpatrick', pid, { action: 'klinik', unit: 'nevus-tumor', patient_derm: { fitzpatrick: 'II', occupation: 'ofis', atopic: false, family_atopy: false }, last_tbse_iso: gun(400) })
await klinik('Ziyaret kaydı', pid, { action: 'ziyaret', tarih: T, unit: 'nevus-tumor', checklist: { TBSE: true } })
let v = await getKlinik(pid)
kontrol('ünite + Fitzpatrick saklandı', v.kayit?.unit === 'nevus-tumor' && v.kayit?.patient_derm?.fitzpatrick === 'II', v.kayit)

// ── Lezyon → ABCDE → melanom acil görevi → resmî tanı (hekim kilidi) ──
await klinik('Lezyon (bölge zorunlu) → 400', pid, { action: 'lezyon', morphology: 'makül' }, 400)
await klinik('Lezyon kaydı (sırt)', pid, { action: 'lezyon', region: 'sırt', morphology: 'pigmente makül', notes: 'Sentetik QA lezyonu.' })
v = await getKlinik(pid)
const lezyonId = v.lezyonlar?.[0]?.id
kontrol('lezyon yazıldı', !!lezyonId, v.lezyonlar)
await spine('ABCDE 4/5 → melanom acil bayrağı', pid, { adim: 'lezyon_degerlendir', lezyonId, abcde: { asimetri: true, sinir: true, renk: true, cap6mm: true, evrim: false }, boyutMm: 8 })
let sp = await getSpine(pid)
kontrol('melanom görevi açıldı; değerlendirme tanı değil', sp.gorevler?.some((g: V) => String(g.kod).startsWith('melanom_')) && /histopatoloji/.test(String(sp.lezyonlar?.[0]?.degerlendirme?.not)), { g: sp.gorevler, l: sp.lezyonlar?.[0]?.degerlendirme })
await spine('Serbest metin resmî tanı → 400', pid, { adim: 'lezyon_tani', lezyonId, resmiTani: 'Kesinlikle melanom' }, 400)
await spine('Resmî tanı (hekim, katalogdan)', pid, { adim: 'lezyon_tani', lezyonId, resmiTani: 'Melanom şüphesi' })

// ── İşlem odası: punch + onam + yara / dikiş / patoloji görevleri ──
const isl = await spine('Punch biyopsi + onam', pid, { adim: 'islem', tur: 'punch', tarih: T, lezyonId, onamKaydet: true, islemNotu: { anestezi: 'lidokain (hekim)', punch_mm: 4 } })
sp = await getSpine(pid)
kontrol('yara + sütür + patoloji görevleri açıldı', ['yara_punch', 'sutur_punch', 'pat_punch'].every((k) => sp.gorevler.some((g: V) => String(g.kod).startsWith(k))), sp.gorevler.map((g: V) => g.kod))
kontrol('işlem notunda doz uydurulmadı', !/\d+\s?(mg|ml)\b/i.test(await objektif(Y.seans)), await objektif(Y.seans))
await spine('Patoloji sonucu aynı lezyona bağlandı', pid, { adim: 'islem_patoloji', islemId: isl.json.islemId, patolojiSonuc: 'Sentetik QA: benign melanositik lezyon.' })
sp = await getSpine(pid)
kontrol('patoloji görevi kapandı', !sp.gorevler.some((g: V) => String(g.kod).startsWith('pat_')), sp.gorevler.map((g: V) => g.kod))

// ── GÖP izotretinoin: β-hCG kapısı + aylık görev + KD köprüsü ──
await spine('İzotretinoin — β-hCG yok → 409', pid, { adim: 'izotretinoin_basla', onamKaydet: true }, 409)
await sb.from('lab_satirlar').insert({ patient_id: pid, canonical_key: 'bHCG', value_text: 'negatif', kanonik_deger: 1, numune_tarihi: gun(5), onayli: true })
await spine('İzotretinoin başla (negatif β-hCG + onam)', pid, { adim: 'izotretinoin_basla', onamKaydet: true })
sp = await getSpine(pid)
kontrol('aylık β-hCG görevi + KD köprüsü', sp.gorevler.some((g: V) => g.kod === 'izo_bhcg'), sp.gorevler.map((g: V) => g.kod))
const { data: jine } = await sb.from('jine_gorevleri').select('kod').eq('patient_id', pid).eq('kod', 'izo_bhcg_derm').maybeSingle()
kontrol('kadın-doğum tarafına teratojen görevi düştü', !!jine, jine)

// ── Biyolojik lab kapısı ──
const biyo = await spine('Biyolojik kapısı (labsız)', pid, { adim: 'biyolojik_kapisi' })
kontrol('kapı eksikleri listeliyor, doz yok', biyo.json.kapisi?.hazir === false && biyo.json.kapisi.eksik.length > 0 && !/\bmg\b/.test(JSON.stringify(biyo.json.kapisi)), biyo.json.kapisi)
await spine('Biyolojik başlat — eksik lab → 409', pid, { adim: 'biyolojik_basla', ilac: 'sekukinumab' }, 409)

// ── Skor + fototerapi (solaryum yasak) + yama D2/D4 ──
await klinik('Skor kaydı', pid, { action: 'skor', recorded_at: T, pasi: 12.4, dlqi: 9 })
await klinik('Solaryum cihazı → 400', pid, { action: 'fototerapi-seans', date: T, device: 'solaryum', j_cm2: 1 }, 400)
await klinik('Fototerapi seansı −6 gün', pid, { action: 'fototerapi-seans', date: gun(6), device: 'nb-uvb-311', j_cm2: 0.3 })
await klinik('Fototerapi seansı −3 gün', pid, { action: 'fototerapi-seans', date: gun(3), device: 'nb-uvb-311', j_cm2: 0.4 })
await klinik('Fototerapi seansı bugün', pid, { action: 'fototerapi-seans', date: T, device: 'nb-uvb-311', j_cm2: 0.5 })
await klinik('Yama kursu (D2/D4 açık)', pid, { action: 'yama', appliedAt: gun(4) })
v = await getKlinik(pid)
kontrol('skor + 3 seans + yama kursu', v.skorlar?.[0]?.pasi === 12.4 && v.fototerapi?.length === 3 && v.yama?.length === 1, { s: v.skorlar, f: v.fototerapi?.length, y: v.yama })

// ── Belge → derm dual-sign köprüsü ──
const belgeId = randomUUID()
const { data: analiz } = await sb.from('belge_analizleri').insert({
  belge_id: belgeId, doctor_id: doktor.id, patient_id: pid, brans: 'dermatoloji', modality_final: 'dermatoskopi',
  de_id_hash: 'derm-exc-smoke', engine_set: 'tierA-v1', durum: 'taslak', motor_ciktilari: [], fusion: { capPct: 85 },
  sonuc: { modalite: 'Dermatoskopi', kalite: 'iyi', ozet: 'Sentetik: asimetrik pigmente lezyon, düzensiz ağ.', bulgular: ['Düzensiz pigment ağı (sentetik)'], tanilar: [{ ad: 'Melanom şüphesi', icd10: 'C43', guven_pct: 84, guven_bant: 'yüksek', destek: [], karsi: [] }], acil_bayrak: true, oneri: '', sinirlar: [], hekim_tanisi: [], engines_used: ['claude-vision'] },
}).select('id').single()
const { data: ekgAnaliz } = await sb.from('belge_analizleri').insert({
  belge_id: randomUUID(), doctor_id: doktor.id, patient_id: pid, brans: 'dermatoloji', modality_final: 'ekg',
  de_id_hash: 'derm-exc-smoke-ekg', engine_set: 'tierA-v1', durum: 'taslak', motor_ciktilari: [], fusion: { capPct: 85 },
  sonuc: { modalite: 'EKG', kalite: 'iyi', ozet: 'Sentetik.', bulgular: [], tanilar: [], acil_bayrak: false, oneri: '', sinirlar: [], hekim_tanisi: [], engines_used: [] },
}).select('id').single()
await klinik('Köprü: bölge yok → 400', pid, { action: 'goruntu-okuma', eylem: 'belge_taslak', analizId: analiz!.id }, 400)
await klinik('Köprü: "tüm vücut" → 400 (okuma lezyon başına)', pid, { action: 'goruntu-okuma', eylem: 'belge_taslak', analizId: analiz!.id, bolge: 'tüm vücut' }, 400)
await klinik('Köprü: EKG analizi → 400 (yalnız derm modaliteleri)', pid, { action: 'goruntu-okuma', eylem: 'belge_taslak', analizId: ekgAnaliz!.id, bolge: 'sırt' }, 400)
const kopru = await klinik('Belge → derm dual-sign taslağı (sırt)', pid, { action: 'goruntu-okuma', eylem: 'belge_taslak', analizId: analiz!.id, bolge: 'sırt' })
await klinik('Aynı analiz ikinci kez → 409', pid, { action: 'goruntu-okuma', eylem: 'belge_taslak', analizId: analiz!.id, bolge: 'sırt' }, 409)
v = await getKlinik(pid)
const okuma = (v.vision || []).find((r: V) => r.belgeAnalizId === analiz!.id)
kontrol('okuma: asistan draft, dermoskopi_ipucu, güven 85 (Fitzpatrick kayıtlı), tanı değil etiketi',
  okuma?.status === 'draft' && okuma?.drafted_by === 'asistan' && okuma?.task === 'dermoskopi_ipucu' && okuma?.guvenUstPct === 85 && okuma?.bolge === 'sırt'
  && /tanı değildir — resmî tanıyı hekim lezyon kartında kilitler/.test(String(okuma?.observations)), okuma)
kontrol('taslakta doz / skor yok', !/\b\d+\s?(mg|J\/cm)/i.test(String(okuma?.observations)) && !/PASI|EASI/.test(String(okuma?.observations)), okuma?.observations)
kontrol('köprü yanıtı güven üst sınırını döndü', kopru.json.guvenUst === 85, kopru.json)
await klinik('Uzman onayı (dual-sign)', pid, { action: 'vision', id: okuma.id, onay: true, drafted_by: 'asistan' })
v = await getKlinik(pid)
const onayli = (v.vision || []).find((r: V) => r.id === okuma.id)
kontrol('onaylı okuma; lezyonun resmî tanısı değişmedi (hekim kilidi)', onayli?.status === 'onayli' && onayli?.approved_by === 'uzman' && v.lezyonlar[0].resmi_tani === 'Melanom şüphesi', { o: onayli, l: v.lezyonlar[0].resmi_tani })

// ── Asistana raporla: gerçek Tier A, sentetik gri görüntü ──
const { data: img } = await sb.from('hasta_goruntulemeler').insert({ doctor_id: doktor.id, patient_id: pid, modalite: 'dermatoskopi', vucut_bolgesi: 'sırt', goruntuleme_tarihi: T }).select('id').single()
await klinik('Asistana raporla: KVKK onayı yok → 400', pid, { action: 'goruntu-okuma', eylem: 'asistana_raporla', coreImageId: img!.id, bolge: 'sırt', deid: { mime: 'image/png', base64: griPng() } }, 400)
const ar = await klinik('Asistana raporla (gerçek Tier A, sentetik gri görüntü)', pid, { action: 'goruntu-okuma', eylem: 'asistana_raporla', coreImageId: img!.id, bolge: 'sağ kol', kimlikYok: true, deid: { mime: 'image/png', base64: griPng() } })
v = await getKlinik(pid)
const canli = (v.vision || []).find((r: V) => r.bolge === 'sağ kol')
kontrol('Asistana raporla: draft eklendi (Tier A veya morfoloji yedeği), uzman onayı bekliyor',
  ar.json.ok === true && canli?.status === 'draft' && ['belge_tier_a', 'morfoloji_iskelet'].includes(String(canli?.kaynak)), { ar: ar.json, canli })

// ── Foto onamı ──
await klinik('Foto onam kaydı', pid, { action: 'foto-meta', coreImageId: img!.id, kind: 'dermoskopi_polarize', lesionId: lezyonId, patient_share: true })
v = await getKlinik(pid)
kontrol('foto meta yazıldı', (v.fotoMeta || []).some((f: V) => f.core_image_id === img!.id), v.fotoMeta)

// ── Pediatrik derm şablonu (çocuk hastada) + branş sızması ──
await spine('Pediatrik şablon (6 yaş)', C.id, { adim: 'pediatrik', sablon: 'atopik' })
const spC = await getSpine(C.id)
kontrol('çocukta pediatrik derm görevi açıldı', spC.gorevler.some((g: V) => g.kod === 'ped_atopik'), spC.gorevler.map((g: V) => g.kod))
const yetiskinJson = JSON.stringify(await getKlinik(pid))
kontrol('erişkin derm kaydında pediatri / göz alanı yok (branş sızması)',
  !/Baş Çevresi|persentil|Neyzi|fundus|GİB|mmHg/i.test(yetiskinJson), yetiskinJson.slice(0, 200))

// ── Sağlığım › Derim: hekim tetikli, hasta-güvenli (mint → PIN → bundle) ──
const portal = await istek('Doktor Araçları › hasta portalı linki', 'POST', '/api/doktor/araclar/hasta-portali', { hastaId: pid })
const portalToken = String(portal.json.portalUrl || '').split('/').pop() || ''
const pin = String(portal.json.pin || '')
if (portalToken && pin) {
  const unlock = await fetch(`${BASE}/api/portal/hasta/${portalToken}/unlock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) })
  const cerez = (unlock.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ')
  kontrol('portal PIN kilidi açıldı', unlock.status === 200 && !!cerez, unlock.status)
  const pr = await fetch(`${BASE}/api/portal/hasta/${portalToken}`, { headers: { Cookie: cerez } })
  const pj = (await pr.json().catch(() => ({}))) as V
  kayit.push({ ad: 'Sağlığım bundle (Derim)', durum: pr.status, ok: pr.status === 200 })
  if (pr.status !== 200) hataSayisi++
  const deri = pj.deri
  const adlar = (deri?.hatirlatmalar || []).map((h: V) => String(h.ad))
  kontrol('Derim: β-hCG, yara kontrol, yama D2/D4, fototerapi seansı, TBSE',
    adlar.some((a: string) => /gebelik testi/.test(a)) && adlar.some((a: string) => /Yara bakımı/.test(a))
    && adlar.some((a: string) => /Yama testi okuması/.test(a)) && adlar.some((a: string) => /Fototerapi seansı/.test(a))
    && adlar.some((a: string) => /Tüm vücut deri kontrolü/.test(a)), adlar)
  kontrol('Derim hasta-güvenli: tanı / skor / doz / ilaç adı yok',
    !/melanom|PASI|EASI|DLQI|izotretinoin|J\/cm|ABCDE|morfoloji/i.test(JSON.stringify(deri || {})), JSON.stringify(deri).slice(0, 400))
  kontrol('Derim: yaklaşan kontrol kartı + seans listesi dolu', !!deri?.sonrakiKontrol?.tarih && (deri?.fototerapi || []).length === 3, { k: deri?.sonrakiKontrol, f: deri?.fototerapi?.length })
} else {
  kontrol('Sağlığım portal linki + PIN üretildi', false, portal.json)
}

// ── Araçlar: derm stüdyo sayfaları (Workstream B) ──
for (const r of ['derm-pasi', 'derm-gop', 'derm-fototerapi', 'derm-yama', 'derm-kohort']) {
  const s = await fetch(`${BASE}/doktor-tools/${r}`)
  kontrol(`/doktor-tools/${r} 200`, s.status === 200, s.status)
}

// ── Audit HTML yayında, Araçlar'a bağlı değil ──
const auditR = await fetch(`${BASE}/derm-exceptional-audit.html`)
kontrol('/derm-exceptional-audit.html 200', auditR.status === 200, auditR.status)
const araclarKatalog = fs.readFileSync(path.join(process.cwd(), 'lib/doktor/doktorAraclari.ts'), 'utf8')
kontrol('audit HTML Araçlar kataloğunda yok', !/derm-exceptional-audit/.test(araclarKatalog), 'katalog')

fs.mkdirSync('smoke-out', { recursive: true })
fs.writeFileSync('smoke-out/derm-exceptional-smoke.json', JSON.stringify({ base: BASE, tarih: new Date().toISOString(), kayit }, null, 2))
console.log(`\n${kayit.length} adım/kontrol · ${hataSayisi} hata`)
process.exit(hataSayisi ? 1 : 0)
