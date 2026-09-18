#!/usr/bin/env npx tsx
/**
 * GOZ-EXCEPTIONAL-01 — every new göz adım against the real API routes (GOZ-MD-BETA pack, synthetic only).
 *
 * Fixture: the same QA doctor as goz-smoke (`qa.goz@notya.ai`, users.specialty = 'goz-hastaliklari'; password only in .env.local
 * as QA_GOZ_PASSWORD). SYNTHETIC patients (no T.C., no phone), deleted and re-seeded every run:
 *  - "TEST Goz Exc Yetiskin" (67 y) — VA/RAPD/refraksiyon, fundus→DR, lazer, glokom meta + EGS ön ayar, IVT listesi, katarakt
 *    biyometri + post-op + GİL taslağı, biyomikroskopi/keratokonus, OCT kalınlık, acil yıkama, intake kırmızı bayrak, hatırlatma,
 *    kohort, Belge → dual-sign köprüsü, Asistana raporla (gerçek Tier A çağrısı, sentetik gri görüntü).
 *  - "TEST Goz Exc Bebek" (2 ay) — ROP kartı; erişkinde ROP reddi ve pediatrik sekme kapısı.
 * Also: Araçlar göz stüdyo sayfaları 200.
 *
 *   npm run dev   (or SMOKE_BASE_URL=…)   then   npx --yes tsx scripts/goz-exceptional-smoke.mts
 * Exit code 1 if any expectation fails. Writes smoke-out/goz-exceptional-smoke.json (gitignored).
 */
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { createHmac, randomBytes, randomUUID } from 'crypto'
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
const { encrypt, decrypt } = await import('../lib/security/encryption')

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const QA_EMAIL = 'qa.goz@notya.ai'
const YETISKIN = 'TEST Goz Exc Yetiskin', BEBEK = 'TEST Goz Exc Bebek'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
const gun = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)
const T = gun(0)
type V = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

async function qaDoktor() {
  const sifre = process.env.QA_GOZ_PASSWORD || ''
  if (!sifre) throw new Error('QA_GOZ_PASSWORD yok — önce scripts/goz-smoke.mts çalıştırın (QA hesabını o oluşturur).')
  const { data: s, error } = await anon.auth.signInWithPassword({ email: QA_EMAIL, password: sifre })
  if (error || !s.session) throw new Error(`signIn: ${error?.message}`)
  return { id: s.session.user.id, token: s.session.access_token }
}

const TABLOLAR = ['goz_goruntu_okumalari', 'goz_oct_olcumleri', 'goz_lazerler', 'goz_rop_taramalari', 'goz_acil_kayitlari', 'goz_muayeneler', 'goz_glokom', 'goz_dr', 'goz_enjeksiyonlar', 'goz_katarakt', 'goz_sgk_raporlari', 'goz_kontroller', 'goz_pediatrik', 'goz_gorevler', 'goz_kuru_goz', 'belge_analizleri', 'hasta_goruntulemeler', 'hasta_intake_formlari', 'hasta_hatirlatma']
async function temizle(doctorId: string) {
  const { data } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId)
  for (const p of data || []) {
    let ad = ''; try { ad = JSON.parse(decrypt(String(p.name_encrypted))).ad || '' } catch { ad = '' }
    if (![YETISKIN, BEBEK].includes(ad)) continue
    for (const t of TABLOLAR) await sb.from(t).delete().eq('patient_id', p.id)
    const { data: konular } = await sb.from('hasta_mesaj_konulari').select('id').eq('patient_id', p.id)
    const kid = (konular || []).map((k) => k.id)
    if (kid.length) { await sb.from('hasta_mesajlar').delete().in('konu_id', kid); await sb.from('hasta_mesaj_konulari').delete().in('id', kid) }
    const { data: ses } = await sb.from('sessions').select('id').eq('patient_id', p.id)
    const ids = (ses || []).map((s) => s.id)
    if (ids.length) { const { data: n } = await sb.from('notes').select('id').in('session_id', ids); const nid = (n || []).map((x) => x.id); if (nid.length) { await sb.from('not_duzenlemeleri').delete().in('note_id', nid); await sb.from('notes').delete().in('id', nid) } await sb.from('sessions').delete().in('id', ids) }
    const { error } = await sb.from('patients').delete().eq('id', p.id)
    if (error) throw new Error(`hasta silinemedi: ${error.message}`)
  }
}
async function hasta(doctorId: string, ad: string, dob: string) {
  const { data: p, error } = await sb.from('patients').insert({ doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(dob), gender_encrypted: encrypt('female'), notes_encrypted: encrypt(JSON.stringify({ not: 'GOZ-EXCEPTIONAL sentetik QA hastası.' })), is_active: true }).select('id').single()
  if (error || !p) throw new Error(`patients: ${error?.message}`)
  const { data: s } = await sb.from('sessions').insert({ doctor_id: doctorId, patient_id: p.id, status: 'completed', session_type: 'kontrol', specialty: 'goz-hastaliklari', duration_seconds: 0, transcript_cleaned: '[GOZ-EXCEPTIONAL sentetik]' }).select('id').single()
  await sb.from('notes').insert({ session_id: s!.id, doctor_id: doctorId, note_type: 'soap', content_subjektif: 'Kontrol (sentetik QA).', content_objektif: '', basvuru_yakinmasi: 'Göz kontrolü', approved_at: new Date().toISOString() })
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
let hata = 0
async function istek(ad: string, method: 'GET' | 'POST', yol: string, body?: unknown, beklenen = 200) {
  const r = await fetch(`${BASE}${yol}`, { method, headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const metin = await r.text(); let json: V = {}; try { json = JSON.parse(metin) } catch { json = { _metin: metin.slice(0, 300) } }
  const ok = r.status === beklenen; if (!ok) hata++
  kayit.push({ ad, durum: r.status, ok })
  console.log(`${ok ? '✓' : '✗'} ${ad} → ${r.status}${ok ? '' : ` (beklenen ${beklenen}) ${metin.slice(0, 240)}`}`)
  return { r, json, metin }
}
function kontrol(ad: string, kosul: boolean, detay: unknown) { if (!kosul) hata++; kayit.push({ ad, ok: kosul }); console.log(`${kosul ? '✓' : '✗'} KONTROL ${ad}${kosul ? '' : ` — ${String(JSON.stringify(detay)).slice(0, 300)}`}`) }
const post = (ad: string, pid: string, b: V, beklenen = 200) => istek(ad, 'POST', '/api/doktor/goz', { patientId: pid, ...b }, beklenen)
const get = async (pid: string) => (await istek('GET göz', 'GET', `/api/doktor/goz?patientId=${pid}`)).json
const objektif = async (seans: string) => String((await sb.from('notes').select('content_objektif').eq('session_id', seans).single()).data?.content_objektif || '')

const doktor = await qaDoktor(); TOKEN = doktor.token
await temizle(doktor.id)
const Y = await hasta(doktor.id, YETISKIN, '1959-03-14')
const B = await hasta(doktor.id, BEBEK, gun(60))
const pid = Y.id
console.log(`Sentetik hastalar hazır · base ${BASE}`)

// ── VA / GİB: RAPD + refraksiyon ──
await post('Refraksiyon aks eksik → 400', pid, { adim: 'olcum', olcum: { va: { sag: { uzak_cc: '0,8' } } }, refraksiyon: { sag: { sph: '-1', cyl: '-0,75' } } }, 400)
await post('VA + GİB + RAPD sol + refraksiyon', pid, { adim: 'olcum', olcum: { va: { sag: { uzak_cc: '0,8' }, sol: { uzak_cc: '0,5' } }, gibSag: 16, gibSol: 19, gibYontem: 'applanasyon', rapd: 'sol' }, refraksiyon: { sag: { sph: '-1,25', cyl: '-0,50', aks: '90' }, sol: { sph: '+0,75' } } })
await post('Nota ekle (O)', pid, { adim: 'olcum_nota' })
kontrol('Objektif: RAPD + refraksiyon satırı', /RAPD sol \(OS\)/.test(await objektif(Y.seans)) && /Refraksiyon — OD: −1,25 sph −0,50 cyl × 90°/.test(await objektif(Y.seans)), await objektif(Y.seans))

// ── Fundus → DR (hekim onaylı) + şerit → Objektif ──
await post('Fundus kaydet', pid, { adim: 'fundus', fundus: { tarih: T, dilate: true, ortam: 'berrak', sag: { disk: 'pembe, kenar net', cd: '0,3', makula: 'dağınık mikroanevrizma' }, sol: { disk: 'pembe', cd: '0,4', makula: 'refle doğal' } } })
await post('Fundus → DR hekim onayı yok → 400', pid, { adim: 'fundus_dr', evreSag: 'orta_npdr', fundusTarihi: T }, 400)
await post('Fundus → DR (hekim seçti + onayladı)', pid, { adim: 'fundus_dr', hekimOnay: true, evreSag: 'orta_npdr', evreSol: 'yok', dmoSag: 'merkez_disi', dmoSol: 'yok', fundusTarihi: T })
let v = await get(pid)
kontrol('DR kartı: hekimin evresi + fundus tarihi, TEMD↔ICO pencereleri', v.dr?.satir?.evre_sag === 'orta_npdr' && v.dr?.satir?.son_fundus === T && !!v.dr?.degerlendirme?.kontrol, v.dr)
kontrol('VA çipi fundus satırından sonra da dolu', v.serit.va.sag === '0,8', v.serit.va)
await post("Şeridi Objektif'e yaz", pid, { adim: 'serit_nota' })
kontrol('Objektif: vizit şeridi + göz dibi', /Vizit şeridi .*VA OD 0,8, OS 0,5; GİB \(aplanasyon\) OD 16 \/ OS 19 mmHg; RAPD sol/.test(await objektif(Y.seans)) && /Göz dibi \(dilate; ortam: berrak\)/.test(await objektif(Y.seans)), await objektif(Y.seans))

// ── DR lazer ──
await post('Lazer: tip yok → 400', pid, { adim: 'lazer', goz: 'sag', tarih: T }, 400)
await post('Lazer PRP OD + kontrol + nota', pid, { adim: 'lazer', goz: 'sag', tip: 'prp', tarih: T, seansNo: 1, kontrolTarihi: gun(-28), notaEkle: true })
v = await get(pid)
kontrol('lazer kaydı + bağlı kontrol', v.lazerler?.length === 1 && v.lazerler[0].hekimAdi && v.kontroller.some((k: V) => /Lazer sonrası kontrol/.test(k.neden)), { l: v.lazerler, k: v.kontroller })

// ── Glokom: gonyo / paki / VF meta + EGS ön ayar ──
await post('Glokom Shaffer 5 → 400', pid, { adim: 'glokom', taniHekim: 'POAG', goz: 'iki', shafferSag: 5 }, 400)
await post('Glokom meta + EGS yeni tanı ön ayarı (hekim kaydeder)', pid, { adim: 'glokom', taniHekim: 'POAG', goz: 'iki', hedefSag: 17, hedefSol: 17, damlalar: [{ ad: 'Latanoprost', goz: 'iki', siklik: 'akşam' }], shafferSag: 3, shafferSol: 3, gonyoSol: 'Spaeth D40r', pakiSag: 512, pakiSol: 505, gormeAlaniCihaz: 'Humphrey 24-2 SITA', sonGormeAlani: gun(200), gaAralikAy: 4, aralikOnerisi: 'egs_yeni_tani' })
v = await get(pid)
kontrol('glokom meta saklandı; ön ayar etiketi; OCT aralığı boş', v.glokom?.meta?.pakiSag === 512 && v.glokom?.meta?.aralikOnerisi === 'egs_yeni_tani' && v.glokom?.kart?.gaAralikAy === 4 && v.glokom?.kart?.octAralikAy === null && v.glokomOneriEtiketi === 'öneri — hekim kilitler', v.glokom)
kontrol('GA gecikmiş görevi (4 ay aralık, son GA 200 gün önce)', v.gorevler.some((g: V) => g.kod === 'glokom_ga'), v.gorevler)

// ── Anti-VEGF: IVT odası listesi ──
const enj = { goz: 'sag', ajan: 'bevacizumab', endikasyon: 'dmo', faz: 'yukleme', dozNo: 1, tarih: T, durum: 'yapildi' }
await post('IVT yapıldı — liste yok → 400', pid, { adim: 'enjeksiyon', basamak: '2', enjeksiyon: enj }, 400)
const yanlis = await post('IVT yapıldı — YANLIŞ GÖZ işareti → 400', pid, { adim: 'enjeksiyon', basamak: '2', enjeksiyon: enj, ivtKontrol: { onam: true, goz_isaret: true, isaretliGoz: 'sol', ilac_lot: true, lot: 'QA-LOT', asepsi: true } }, 400)
kontrol('yanlış göz mesajı', /YANLIŞ GÖZ/.test(String(yanlis.json.error)), yanlis.json)
await post('IVT yapıldı — liste tamam', pid, { adim: 'enjeksiyon', basamak: '2', enjeksiyon: enj, ivtKontrol: { onam: true, goz_isaret: true, isaretliGoz: 'sag', ilac_lot: true, lot: 'QA-LOT-7', asepsi: true, saat: '10:15' } })
await post('Planlı IVT (14 gün içinde)', pid, { adim: 'enjeksiyon', basamak: '2', enjeksiyon: { ...enj, dozNo: 2, tarih: gun(-10), durum: 'planli' } })
v = await get(pid)
kontrol('IVT listesi kayıtta (lot)', v.enjeksiyonlar.some((e: V) => e.durum === 'yapildi' && e.ivtKontrol?.lot === 'QA-LOT-7'), v.enjeksiyonlar)

// ── Katarakt: biyometri + post-op + GİL taslağı ──
await post('Biyometri AL 234 → 400', pid, { adim: 'katarakt', goz: 'sol', biyometri: { alMm: 234 } }, 400)
const kontrolListesi = Object.fromEntries(['va_refraksiyon', 'biyometri', 'gil_secimi', 'on_segment', 'fundus_makula', 'gib', 'alfa_bloker', 'antikoagulan', 'onam'].map((k) => [k, true]))
await post('Katarakt planı + biyometri + EK-3/G', pid, { adim: 'katarakt', goz: 'sol', gilTipi: 'torik', ek3gKod: 'G10110', planlananTarih: gun(-20), checklist: kontrolListesi, biyometri: { alMm: '23,48', k1D: '43,25', k2D: '44,50', kAks: '95', aSabiti: '118,9', cihaz: 'Optik biyometre', tarih: T } })
v = await get(pid)
const kat = v.katarakt.find((k: V) => k.goz === 'sol')
kontrol('biyometri saklandı; GİL gücü alanı yok', kat?.biyometri?.alMm === 23.48 && kat?.ek3g_kod === 'G10110' && !/guc|power|iol_d/i.test(JSON.stringify(kat)), kat)
const po = await post('Post-op 1. gün + endoftalmi bayrağı', pid, { adim: 'katarakt_postop', id: kat.id, zaman: 'gun1', kayit: { tarih: T, va: '0,3', gib: 18, kornea: 'hafif ödem', endoftalmiBayrak: true } })
kontrol('post-op: aynı gün acil uyarısı', po.json.uyarilar?.some((u: string) => /aynı gün/.test(u)), po.json)
await post('Katarakt nota (biyometri + post-op)', pid, { adim: 'katarakt_nota', id: kat.id })
kontrol('Objektif: biyometri + ENDOFTALMİ satırı, güç yok', /AL 23,48 mm/.test(await objektif(Y.seans)) && /ENDOFTALMİ ŞÜPHESİ/.test(await objektif(Y.seans)) && !/GİL gücü: ?[+-]?\d/.test(await objektif(Y.seans)), await objektif(Y.seans))
const gil = await post('SGK GİL bilgi notu (Katarakt kartından)', pid, { adim: 'sgkrapor', sablon: 'katarakt_gil', goz: 'sol', vaSimdi: '0,3', anamnez: 'Bulanık görme (sentetik)' })
kontrol('GİL: biyometri + EK-3/G + kontrol listesi dolu → eksik yok; Medula hekim', gil.json.eksikler?.length === 0 && gil.json.sutKontrol.some((x: V) => /Medula/.test(x.madde)), gil.json)

// ── Ön segment ──
await post('Biyomikroskopi boş → 400', pid, { adim: 'biyomikroskopi', biyomikroskopi: { sag: {}, sol: {} } }, 400)
await post('Biyomikroskopi OD/OS', pid, { adim: 'biyomikroskopi', biyomikroskopi: { floresein: true, sag: { kapak: 'doğal', konjonktiva: 'sakin', kornea: 'saydam', onKamara: 'derin, sakin', iris: 'doğal', lens: 'nükleer +1' }, sol: { kornea: 'inferior punktat boyanma', lens: 'nükleer +2' } } })
await post('Keratokonus izlemi', pid, { adim: 'keratokonus', keratokonus: { topoNot: 'inferior dikleşme (sentetik)', kmaxSag: '51,2', cxlSag: gun(300) } })
await post('Ön segment nota', pid, { adim: 'on_segment_nota' })
kontrol('Objektif: biyomikroskopi + keratokonus', /Biyomikroskopi \(floresein boyalı\) — OD: kapak doğal/.test(await objektif(Y.seans)) && /Kmax OD 51,2 D/.test(await objektif(Y.seans)), await objektif(Y.seans))

// ── Görüntü: OCT kalınlık + Belge köprüsü + Asistana raporla ──
const { data: oct } = await sb.from('hasta_goruntulemeler').insert({ doctor_id: doktor.id, patient_id: pid, modalite: 'oct', vucut_bolgesi: 'sağ göz', goruntuleme_tarihi: T }).select('id').single()
const { data: fun } = await sb.from('hasta_goruntulemeler').insert({ doctor_id: doktor.id, patient_id: pid, modalite: 'fundus', vucut_bolgesi: 'sol göz', goruntuleme_tarihi: T }).select('id').single()
await post('OCT kalınlık fundusa → 400', pid, { adim: 'oct_olcum', goruntuId: fun!.id, goz: 'sol', mfkMikron: 300 }, 400)
await post('OCT MFK / RNFL (hekim)', pid, { adim: 'oct_olcum', goruntuId: oct!.id, goz: 'sag', mfkMikron: 342, rnflMikron: 88 })
const belgeId = randomUUID()
const { data: analiz } = await sb.from('belge_analizleri').insert({ belge_id: belgeId, doctor_id: doktor.id, patient_id: pid, brans: 'goz', modality_final: 'fundus', de_id_hash: 'goz-exc-smoke', engine_set: 'tierA-v1', durum: 'taslak', motor_ciktilari: [], fusion: { capPct: 85 }, sonuc: { modalite: 'Fundus', kalite: 'iyi', ozet: 'Sentetik: arka kutupta dağınık noktasal kırmızı lezyon görünümü.', bulgular: ['Noktasal kırmızı lezyonlar (sentetik)'], tanilar: [{ ad: 'Orta nonproliferatif DR', icd10: 'E11.32', guven_pct: 84, guven_bant: 'yüksek', destek: [], karsi: [] }], acil_bayrak: false, oneri: '', sinirlar: [], hekim_tanisi: [], engines_used: ['claude-vision'] } }).select('id').single()
await post('Belge → göz: OU → 400 (OD/OS zorunlu)', pid, { adim: 'goruntu_okuma', eylem: 'belge_taslak', analizId: analiz!.id, goz: 'iki' }, 400)
await post('Belge → göz dual-sign taslağı (OS, tek alan)', pid, { adim: 'goruntu_okuma', eylem: 'belge_taslak', analizId: analiz!.id, goz: 'sol', tekAlan: true })
await post('Aynı analiz ikinci kez → 409', pid, { adim: 'goruntu_okuma', eylem: 'belge_taslak', analizId: analiz!.id, goz: 'sol' }, 409)
v = await get(pid)
const bo = v.belgeOkumalari?.[0]
kontrol('Belge okuması: asistan draft, güven ≤70, evre değil etiketi, OS', bo?.durum === 'draft' && bo?.taslak_yazan === 'asistan' && bo?.guven_ust_pct === 70 && bo?.goz === 'sol' && /evre değildir/.test(bo?.taslak) && /\(%70\)/.test(bo?.taslak), bo)
await post('Uzman onayı (dual-sign)', pid, { adim: 'goruntu_okuma', eylem: 'onayla', id: bo.id })
v = await get(pid)
kontrol('onaylı okuma DR kartını değiştirmedi (evre hekim kilidi)', v.belgeOkumalari[0].durum === 'onayli' && v.dr.satir.evre_sag === 'orta_npdr' && v.dr.satir.evre_sol === 'yok', { o: v.belgeOkumalari[0].durum, dr: v.dr.satir })
await post('Asistana raporla: KVKK onayı yok → 400', pid, { adim: 'goruntu_okuma', eylem: 'asistana_raporla', goruntuId: fun!.id, goz: 'sol', deid: { mime: 'image/png', base64: griPng(), hash: 'x' } }, 400)
const ar = await post('Asistana raporla (gerçek Tier A, sentetik gri görüntü)', pid, { adim: 'goruntu_okuma', eylem: 'asistana_raporla', goruntuId: fun!.id, goz: 'sol', kimlikYok: true, tekAlanFundus: true, deid: { mime: 'image/png', base64: griPng(), hash: 'gri' } })
v = await get(pid)
const funOk = v.goruntuler.find((g: V) => g.id === fun!.id)?.okumalar?.[0]
kontrol('Asistana raporla: draft eklendi (Tier A veya kontrol listesi yedeği), uzman onayı bekliyor', ar.json.ok === true && funOk?.durum === 'draft' && ['belge_tier_a', 'ayse_iskelet'].includes(funOk?.kaynak), { ar: ar.json, funOk })
kontrol('OCT kalınlık GET', v.octOlcumleri.some((o: V) => o.goruntu_id === oct!.id && o.mfk_mikron === 342), v.octOlcumleri)

// ── Acil: yıkama zamanlayıcısı + intake kırmızı bayrak ──
const bas = await post('Kimyasal yıkama başlat', pid, { adim: 'acil_kayit', eylem: 'baslat', phOnce: '9' })
await new Promise((r) => setTimeout(r, 1500))
const bit = await post('Yıkama bitir', pid, { adim: 'acil_kayit', eylem: 'bitir', id: bas.json.id })
kontrol('dakika kaydedildi', typeof bit.json.dakika === 'number' && bit.json.dakika >= 0, bit.json)
await post('Acil kaydı güncelle (VA saat, pH, eylem)', pid, { adim: 'acil_kayit', eylem: 'kaydet', id: bas.json.id, phSonra: '7', va: { sag: '0,6', sol: '0,8', saat: '10:40' }, kontrol: { 'VA saatli kaydedildi (OD / OS)': true } })
await post('Acil nota', pid, { adim: 'acil_nota', id: bas.json.id })
kontrol('Objektif: yıkama süresi + pH + VA saati', /Kimyasal temas — göz yıkaması/.test(await objektif(Y.seans)) && /pH önce 9 \/ sonra 7/.test(await objektif(Y.seans)) && /VA \(10:40\) OD 0,6/.test(await objektif(Y.seans)), await objektif(Y.seans))
await sb.from('hasta_intake_formlari').insert({ doktor_id: doktor.id, patient_id: pid, brans: 'goz-hastaliklari', durum: 'dolduruldu', gonderim_kanali: 'elden', token_hash: createHmac('sha256', 'goz-exc').update(`${pid}${Date.now()}`).digest('hex'), token_expires_at: new Date(Date.now() + 86400000).toISOString(), form_data_encrypted: encrypt(JSON.stringify({ bransAlanlari: { basvuruNedeni: 'Kontrol', acilBelirtiler: ['Kimyasal madde teması', 'Perde / gölge inmesi'] } })), dolduruldu_at: new Date().toISOString() })
v = await get(pid)
kontrol('intake kutuları serbest metin olmadan acil bandını açtı', v.acil.some((a: V) => a.kod === 'kimyasal_yanik') && v.acil.some((a: V) => a.kod === 'retina_dekolmani_suphesi') && v.acil[0].oncelik === 'hemen', v.acil)

// ── Pediatrik / ROP kapısı ──
await post('ROP erişkinde → 400', pid, { adim: 'rop', tarih: T, zonSag: 'II' }, 400)
kontrol('erişkin: pediatrik sekme ve ROP kartı kapalı', v.pediatrikGorunum.pediatrikSekme === false && v.pediatrikGorunum.ropKart === false, v.pediatrikGorunum)
await post('ROP taraması (bebek, hekim zon/evre)', B.id, { adim: 'rop', tarih: T, dogumHaftasi: 29, dogumAgirligiG: 1250, zonSag: 'II', evreSag: '1', plusSag: 'yok', zonSol: 'II', evreSol: '0', plusSol: 'yok', sonrakiTarama: gun(-14), notaEkle: true })
const vb = await get(B.id)
kontrol('bebek: ROP kartı + PMA + SB endikasyonu + kontrol', vb.pediatrikGorunum.ropKart === true && vb.rop[0]?.pmaHafta >= 37 && vb.ropEndikasyon?.var === true && vb.kontroller.some((k: V) => k.neden === 'ROP tarama kontrolü'), { g: vb.pediatrikGorunum, r: vb.rop, e: vb.ropEndikasyon })
await post('Pediatrik şaşılık testleri', B.id, { adim: 'pediatrik', tip: 'sasilik', coverTest: 'uzak/yakın ortotropik (sentetik)', hirschberg: 'santral', krimsky: '—' })

// ── Recall: hasta dosyasından + kohort ──
await sb.from('goz_kontroller').insert({ patient_id: pid, doctor_id: doktor.id, tarih: gun(20), neden: 'Glokom kontrolü (sentetik)', dilatasyon: false })
v = await get(pid)
kontrol('hatırlatma bayrakları (kontrol gecikti + GA)', v.hatirlatma.bayraklar.includes('kontrol_gecikti') && v.hatirlatma.bayraklar.includes('ga_oct_gecikti'), v.hatirlatma)
await post('Hastaya hatırlatma gönder', pid, { adim: 'hatirlatma' })
await post('7 gün içinde ikinci hatırlatma → 400', pid, { adim: 'hatirlatma' }, 400)
const { data: mesaj } = await sb.from('hasta_mesaj_konulari').select('id').eq('patient_id', pid).eq('konu', 'Göz kontrol hatırlatması').limit(1).single()
const { data: govde } = await sb.from('hasta_mesajlar').select('metin').eq('konu_id', mesaj!.id).single()
kontrol('mesaj hasta-güvenli: 112 var, tanı / değer / ilaç yok', /112/.test(String(govde?.metin)) && !/glokom|retinopati|mmHg|bevacizumab|NPDR/i.test(String(govde?.metin)), govde)
v = await get(pid)
kontrol('dönüş görevi açıldı', v.gorevler.some((g: V) => g.kod === 'hatirlatma_takip'), v.gorevler)
const koh = await istek('Göz kohort GET', 'GET', '/api/doktor/goz/kohort')
const satir = koh.json.satirlar?.find((s: V) => s.patientId === pid)
kontrol('kohort: hasta bayraklı (IVT penceresi, GA, kontrol)', !!satir && satir.bayraklar.includes('ivt_penceresi') && satir.bayraklar.includes('kontrol_gecikti'), satir)
const kp = await istek('Göz kohort 1-tap (7 gün içinde) → atlanır', 'POST', '/api/doktor/goz/kohort', { patientIds: [pid, randomUUID()] })
kontrol('kohort POST: yakın gönderim + yabancı kimlik atlandı', kp.json.gonderilen === 0 && kp.json.atlanan === 2, kp.json)

// ── Araçlar stüdyo sayfaları ──
for (const r of ['goz-va', 'goz-sut-vegf', 'goz-sgk-rapor', 'goz-gil-kod', 'goz-kohort']) {
  const s = await fetch(`${BASE}/doktor-tools/${r}`)
  kontrol(`/doktor-tools/${r} 200`, s.status === 200, s.status)
}

fs.mkdirSync('smoke-out', { recursive: true })
fs.writeFileSync('smoke-out/goz-exceptional-smoke.json', JSON.stringify({ base: BASE, tarih: new Date().toISOString(), kayit }, null, 2))
console.log(`\n${kayit.length} adım/kontrol · ${hata} hata`)
process.exit(hata ? 1 : 0)
