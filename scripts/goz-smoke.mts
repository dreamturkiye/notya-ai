#!/usr/bin/env npx tsx
/**
 * GOZ-SMOKE — reproducible Göz Hastalıkları smoke path against the real API routes.
 *
 * Fixture: dedicated QA doctor `qa.goz@notya.ai` (users.specialty = 'goz-hastaliklari'); password only in .env.local
 * as QA_GOZ_PASSWORD (generated on first run, never committed). Two SYNTHETIC patients (no T.C., no phone):
 *  - "TEST Goz Smoke" (67 y, T2DM, glokom) — every run deletes and re-seeds.
 *  - "TEST Goz Smoke Cocuk" (6 y) with kilo/boy on an approved note — proves a göz practice never gets büyüme.
 *
 * Path: bilateral VA/GİB kaydet → kopya-ileri taslak → Nota ekle (O) → glokom (hedef, damla, GA aralığı) → DR evre +
 * dahiliye göz sevkini kapat → anti-VEGF SUT kapısı + kayıt → SGK rapor taslağı → görüntü dual-sign (asistan onaylayamaz
 * kuralı API'de uzman=doktor) → kontrol → portal (PIN) Gözlerim dilimi + modül listesi.
 *
 *   npm run dev   (or SMOKE_BASE_URL=…)   then   npx --yes tsx scripts/goz-smoke.mts
 * Exit code 1 if any expectation fails. Writes smoke-out/goz-smoke.json (gitignored).
 */
import fs from 'fs'
import path from 'path'
import { createHmac, randomBytes } from 'crypto'
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

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const QA_EMAIL = 'qa.goz@notya.ai', QA_AD = 'QA Göz (TEST hesabı)'
const HASTA = 'TEST Goz Smoke', COCUK = 'TEST Goz Smoke Cocuk'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
const gun = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)
const T = gun(0)
type V = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

async function qaDoktor() {
  let sifre = process.env.QA_GOZ_PASSWORD || ''
  const yeni = () => { sifre = `Qa-${randomBytes(18).toString('base64url')}`; fs.appendFileSync(envPath, `\n# GOZ-SMOKE QA doktor (qa.goz@notya.ai) — yalnız yerel, commit edilmez\nQA_GOZ_PASSWORD=${sifre}\n`) }
  let id: string | null = null
  for (let page = 1; page <= 20 && !id; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    id = data.users.find((u) => u.email === QA_EMAIL)?.id || null
    if (data.users.length < 200) break
  }
  if (!id) {
    if (!sifre) yeni()
    const { data, error } = await sb.auth.admin.createUser({ email: QA_EMAIL, password: sifre, email_confirm: true, user_metadata: { full_name: QA_AD, specialty: 'goz-hastaliklari', qa: true } })
    if (error || !data.user) throw new Error(`createUser: ${error?.message}`)
    id = data.user.id
  } else if (!sifre) { yeni(); await sb.auth.admin.updateUserById(id, { password: sifre }) }
  const { error: uErr } = await sb.from('users').upsert({ id, email: QA_EMAIL, full_name: QA_AD, specialty: 'goz-hastaliklari', updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (uErr) throw new Error(`users: ${uErr.message}`)
  const { data: s, error } = await anon.auth.signInWithPassword({ email: QA_EMAIL, password: sifre })
  if (error || !s.session) throw new Error(`signIn: ${error?.message}`)
  return { id, token: s.session.access_token }
}

const GOZ_TABLOLARI = ['goz_goruntu_okumalari', 'goz_muayeneler', 'goz_glokom', 'goz_dr', 'goz_enjeksiyonlar', 'goz_katarakt', 'goz_sgk_raporlari', 'goz_kontroller', 'goz_pediatrik', 'goz_gorevler', 'goz_kuru_goz', 'hasta_goruntulemeler', 'hasta_intake_formlari', 'sevkler', 'dahiliye_dm', 'dahiliye_gorevleri', 'hasta_portal_tokens']
async function temizle(doctorId: string) {
  const { data } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId)
  for (const p of data || []) {
    let ad = ''; try { ad = JSON.parse(decrypt(String(p.name_encrypted))).ad || '' } catch { ad = '' }
    if (![HASTA, COCUK].includes(ad)) continue
    for (const t of GOZ_TABLOLARI) await sb.from(t).delete().eq('patient_id', p.id)
    const { data: ses } = await sb.from('sessions').select('id').eq('patient_id', p.id)
    const ids = (ses || []).map((s) => s.id)
    if (ids.length) { const { data: n } = await sb.from('notes').select('id').in('session_id', ids); const nid = (n || []).map((x) => x.id); if (nid.length) { await sb.from('not_duzenlemeleri').delete().in('note_id', nid); await sb.from('notes').delete().in('id', nid) } await sb.from('sessions').delete().in('id', ids) }
    const { error } = await sb.from('patients').delete().eq('id', p.id)
    if (error) throw new Error(`hasta silinemedi: ${error.message}`)
  }
}
async function hasta(doctorId: string, ad: string, dob: string, vitaller: Record<string, number> | null) {
  const { data: p, error } = await sb.from('patients').insert({ doctor_id: doctorId, name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(dob), gender_encrypted: encrypt('male'), notes_encrypted: encrypt(JSON.stringify({ not: 'GOZ-SMOKE sentetik QA hastası.' })), is_active: true }).select('id').single()
  if (error || !p) throw new Error(`patients: ${error?.message}`)
  const { data: s } = await sb.from('sessions').insert({ doctor_id: doctorId, patient_id: p.id, status: 'completed', session_type: 'kontrol', specialty: 'goz-hastaliklari', duration_seconds: 0, transcript_cleaned: '[GOZ-SMOKE sentetik]' }).select('id').single()
  await sb.from('notes').insert({ session_id: s!.id, doctor_id: doctorId, note_type: 'soap', content_subjektif: 'Kontrol (sentetik QA).', content_objektif: '', basvuru_yakinmasi: 'Göz kontrolü', vitaller, approved_at: new Date().toISOString() })
  return String(p.id)
}

let TOKEN = ''
const kayit: V[] = []
let hata = 0
async function istek(ad: string, method: 'GET' | 'POST', yol: string, body?: unknown, beklenen = 200, ek: Record<string, string> = {}) {
  const r = await fetch(`${BASE}${yol}`, { method, headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), ...ek }, body: body ? JSON.stringify(body) : undefined })
  const metin = await r.text(); let json: V = {}; try { json = JSON.parse(metin) } catch { json = { _metin: metin.slice(0, 300) } }
  const ok = r.status === beklenen; if (!ok) hata++
  kayit.push({ ad, durum: r.status, ok })
  console.log(`${ok ? '✓' : '✗'} ${ad} → ${r.status}${ok ? '' : ` (beklenen ${beklenen}) ${metin.slice(0, 240)}`}`)
  return { r, json }
}
function kontrol(ad: string, kosul: boolean, detay: unknown) { if (!kosul) hata++; kayit.push({ ad, ok: kosul }); console.log(`${kosul ? '✓' : '✗'} KONTROL ${ad}${kosul ? '' : ` — ${String(JSON.stringify(detay)).slice(0, 300)}`}`) }
const post = (ad: string, pid: string, b: V, beklenen = 200) => istek(ad, 'POST', '/api/doktor/goz', { patientId: pid, ...b }, beklenen)
const get = async (pid: string) => (await istek('GET göz', 'GET', `/api/doktor/goz?patientId=${pid}`)).json

const doktor = await qaDoktor(); TOKEN = doktor.token
await temizle(doktor.id)
const pid = await hasta(doktor.id, HASTA, '1959-03-14', null)
const cocuk = await hasta(doktor.id, COCUK, gun(6 * 365 + 30), { kilo: 21, boy: 116 })
console.log(`Sentetik hastalar hazır · base ${BASE}`)

// 1. Bilateral VA/GİB (geçmiş vizit doğrudan tabloya, bugünkü API'den)
await sb.from('goz_muayeneler').insert({ patient_id: pid, doctor_id: doktor.id, tarih: gun(120), va: { sag: { uzak_cc: '0,63' }, sol: { uzak_cc: '0,8' } }, gib_sag: 26, gib_sol: 19, gib_yontem: 'applanasyon' })
await post('VA okunamayan değer → 400', pid, { adim: 'olcum', olcum: { va: { sag: { uzak_sc: 'bulanık' } } } }, 400)
let v = await get(pid)
kontrol('kopya-ileri taslak son vizitten, onay gerekli', v.kopya?.kaynakTarih === gun(120) && v.kopya?.onayGerekli === true, v.kopya)
await post('Bilateral VA/GİB kaydet', pid, { adim: 'olcum', olcum: { va: { sag: { uzak_sc: '0,4', uzak_cc: '0,8' }, sol: { uzak_cc: '0,8', yakin: 'J2' } }, gibSag: 22, gibSol: 17, gibYontem: 'applanasyon' } })
await post('Nota ekle (Objektif)', pid, { adim: 'olcum_nota' })
const { data: not } = await sb.from('sessions').select('id').eq('patient_id', pid).limit(1).single().then(async ({ data }) => sb.from('notes').select('content_objektif').eq('session_id', data!.id).single())
kontrol('Objektif satırı OD/OS VA + GİB', /OD: sc 0,4, cc 0,8.*GİB \(aplanasyon\) — OD: 22 mmHg; OS: 17 mmHg/.test(String(not?.content_objektif)), not?.content_objektif)

// 2. Glokom
await post('Glokom kartı (hekim)', pid, { adim: 'glokom', taniHekim: 'POAG', goz: 'iki', hedefSag: 18, hedefSol: 18, damlalar: [{ ad: 'Latanoprost', goz: 'iki', siklik: 'akşam 1 damla' }, { ad: 'Timolol', goz: 'sag', siklik: 'günde 2' }], sonGormeAlani: gun(250), gaAralikAy: 6, octAralikAy: null })
v = await get(pid)
kontrol('şerit: OD GİB 22 hedef 18 üstü, OS değil; harf farkı OD +5', v.serit.gib.ustSag === true && v.serit.gib.ustSol === false && v.serit.va.harfSag === 5, v.serit)
kontrol('glokom: GA gecikmiş görevi + OCT aralığı hekim görevi', v.gorevler.some((g: V) => g.kod === 'glokom_ga') && v.gorevler.some((g: V) => g.kod === 'glokom_oct_aralik'), v.gorevler)
kontrol('glokom: titrasyon önerisi yok', !/damla ekle|dozu artır|titr/i.test(JSON.stringify(v.glokom)), v.glokom?.degerlendirme?.bayraklar)

// 3. DR + dahiliye köprüsü
await sb.from('dahiliye_dm').insert({ patient_id: pid, doctor_id: doktor.id, tip: 'T2', ilac_siniflari: ['metformin'] })
const { data: sevk } = await sb.from('sevkler').insert({ patient_id: pid, doctor_id: doktor.id, hedef: 'goz', not_metni: 'DM yıllık göz dibi (retinopati taraması)', kaynak: 'dm' }).select('id').single()
v = await get(pid)
kontrol('açık dahiliye göz sevki görünür', v.acikGozSevkleri.some((s: V) => s.id === sevk!.id), v.acikGozSevkleri)
await post('Sevk kapat — evre yokken 400', pid, { adim: 'dr_sevk_kapat', sevkId: sevk!.id }, 400)
await post('DR kartı: OD orta NPDR + merkezi DMÖ, OS hafif', pid, { adim: 'dr', dr: { dmTip: 'T2', evreSag: 'orta_npdr', evreSol: 'hafif_npdr', dmoSag: 'merkez_tutan', dmoSol: 'yok', sonFundus: T } })
const kap = await post('Sevk kapat + geri bildirim', pid, { adim: 'dr_sevk_kapat', sevkId: sevk!.id })
v = await get(pid)
kontrol('DR iki sütun: TEMD 3–6 ay, ICO 1–3 ay (merkezi DMÖ), çakışma işaretli', v.dr.degerlendirme.kontrol.catisma === true && /TEMD/.test(v.dr.degerlendirme.kontrol.tr.gerekce) && /Merkezi tutan/.test(v.dr.degerlendirme.kontrol.uluslararasi.gerekce), v.dr.degerlendirme.kontrol)
const { data: dm } = await sb.from('dahiliye_dm').select('son_goz_dibi').eq('patient_id', pid).single()
kontrol('dahiliye DM kartına son göz dibi yazıldı + sevk kapandı', dm?.son_goz_dibi === T && /Orta NPDR/.test(String(kap.json.geriBildirim)), { dm, g: kap.json })

// 4. Anti-VEGF
const kapi = await post('SUT kapısı: ranibizumab muayenehane', pid, { adim: 'sgk_kapi', basamak: 'muayenehane', enjeksiyon: { goz: 'sag', ajan: 'ranibizumab', endikasyon: 'dmo', faz: 'yukleme', dozNo: 1, tarih: T, durum: 'planli' } })
kontrol('muayenehane uyarısı + yükleme takvimi 3 doz', kapi.json.kapi.uyarilar.some((u: string) => /basamağı değildir/.test(u)) && kapi.json.takvim.length === 3, kapi.json)
// GOZ-EXCEPTIONAL-01: "yapıldı" IVT odası kontrol listesi ister (onam, göz işareti = kayıt gözü, ilaç + lot, asepsi)
await post('Bevacizumab yükleme 1 (yapıldı)', pid, { adim: 'enjeksiyon', basamak: '2', ivtKontrol: { onam: true, goz_isaret: true, isaretliGoz: 'sag', ilac_lot: true, lot: 'QA-SMOKE-LOT', asepsi: true }, enjeksiyon: { goz: 'sag', ajan: 'bevacizumab', endikasyon: 'dmo', faz: 'yukleme', dozNo: 1, tarih: gun(14), durum: 'yapildi' } })
await post('Bevacizumab yükleme 2 (planlı)', pid, { adim: 'enjeksiyon', basamak: '2', enjeksiyon: { goz: 'sag', ajan: 'bevacizumab', endikasyon: 'dmo', faz: 'yukleme', dozNo: 2, tarih: gun(-16), durum: 'planli' } })
const imp = await post('SUT kapısı: implant 14 gün sonra → engel', pid, { adim: 'sgk_kapi', basamak: '3', enjeksiyon: { goz: 'sag', ajan: 'deksametazon_implant', endikasyon: 'dmo', faz: 'idame', tarih: T, durum: 'planli' } })
kontrol('implant anti-VEGF sonrası 1 ay engeli', imp.json.kapi.engeller.some((e: string) => /1 ay/.test(e)), imp.json.kapi)
const rap = await post('SGK rapor taslağı (bevacizumab başlangıç)', pid, { adim: 'sgkrapor', sablon: 'anti_vegf_baslangic', goz: 'sag', ajan: 'bevacizumab', endikasyon: 'dmo', anamnez: 'T2DM, merkezi DMÖ (sentetik)', vaBaslangic: '0,4', okt: T, mfkBaslangic: 410 })
kontrol('rapor: 1 ay tek hekim, eksik renkli resim + FFA, hasta adı saklanmadı', /1 ay süreli tek hekim/.test(rap.json.raporTipi) && rap.json.eksikler.includes('Lezyona ait renkli resim'), rap.json)
const { data: rapRow } = await sb.from('goz_sgk_raporlari').select('draft').eq('id', rap.json.id).single()
kontrol('DB taslağında hasta adı yok', (rapRow?.draft as V)?.hastaAdi === '', rapRow?.draft)
await post('Eksikli rapor kilit → 400', pid, { adim: 'sgkrapor_kilit', id: rap.json.id }, 400)

// 5. Görüntü dual-sign + Ayşe + compare + kuru göz + intake
const { data: img } = await sb.from('hasta_goruntulemeler').insert({ doctor_id: doktor.id, patient_id: pid, modalite: 'oct', vucut_bolgesi: 'sağ göz', goruntuleme_tarihi: T, rapor_metni: null }).select('id').single()
const { data: img2 } = await sb.from('hasta_goruntulemeler').insert({ doctor_id: doktor.id, patient_id: pid, modalite: 'oct', vucut_bolgesi: 'sağ göz', goruntuleme_tarihi: gun(60), rapor_metni: null }).select('id').single()
await post('OCT okuma taslağı (asistan)', pid, { adim: 'goruntu_okuma', eylem: 'taslak', goruntuId: img!.id, taslak: 'Foveal kalınlık artmış görünüm, intraretinal kistik alanlar? (sentetik)', taslakYazan: 'asistan', goz: 'sag' })
v = await get(pid)
const ok1 = v.goruntuler.find((g: V) => g.id === img!.id)?.okumalar[0] // sıra created_at'e bağlı — kimlikle bul
kontrol('okuma draft + disclaimer', ok1?.durum === 'draft' && /tanı değildir/.test(ok1?.disclaimer), ok1)
await post('Uzman onayı', pid, { adim: 'goruntu_okuma', eylem: 'onayla', id: ok1.id })
await post('Onaylı okumayı tekrar düzelt → 403', pid, { adim: 'goruntu_okuma', eylem: 'duzelt', id: ok1.id, uzmanMetin: 'x' }, 403)
const ayse = await post('Ayşe OCT taslağı', pid, { adim: 'goruntu_okuma', eylem: 'ayse_taslak', goruntuId: img!.id, goz: 'sag' })
kontrol('Ayşe taslak üretildi', ayse.json.ok === true, ayse.json)
const kiyas = await post('OCT yan yana karşılaştır', pid, { adim: 'goruntu_okuma', eylem: 'kiyas', aId: img!.id, bId: img2!.id })
kontrol('karşılaştırma aynı göz+modalite', /OCT karşılaştırması/.test(String(kiyas.json.baslik)), kiyas.json)
await post('Kuru göz OSDI/Schirmer/TBUT', pid, { adim: 'kuru_goz', osdi: 28, schirmerSag: 8, schirmerSol: 12, tbutSag: 6, tbutSol: 11 })
v = await get(pid)
kontrol('kuru göz kaydı + ozet', v.kuruGoz?.length >= 1 && /OSDI/.test(v.kuruGoz[0].ozet.ozetSatir), v.kuruGoz?.[0])

const intakeToken = createHmac('sha256', 'goz-smoke-intake').update(`${pid}${Date.now()}`).digest('hex')
await sb.from('hasta_intake_formlari').insert({
  doktor_id: doktor.id, patient_id: pid, brans: 'goz-hastaliklari', durum: 'dolduruldu', gonderim_kanali: 'elden', // 009 CHECK: kolon varsayılanı 'link' listede yok
  token_hash: intakeToken, token_expires_at: new Date(Date.now() + 86400000).toISOString(),
  form_data_encrypted: encrypt(JSON.stringify({
    bransAlanlari: {
      basvuruNedeni: 'Kontrol', mevcutGozSikayetleri: ['Bulanık Görme', 'Göz Kuruluğu'],
      bilinenGozHastaliklari: ['Glokom'], kronikRahatsizliklarGoz: ['Diyabet'],
      oncekiGozOperasyonlari: ['Yok'], aileGozHastaligiOykusu: ['Bilinmiyor'],
    },
  })),
  dolduruldu_at: new Date().toISOString(),
})
await post('Intake → Subjektif (Nota ekle S)', pid, { adim: 'intake_nota' })
const { data: notS } = await sb.from('sessions').select('id').eq('patient_id', pid).limit(1).single().then(async ({ data }) => sb.from('notes').select('content_subjektif').eq('session_id', data!.id).single())
kontrol('intake Subjektif hasta beyanı', /Başvuru nedeni \(hasta beyanı\): Kontrol/.test(String(notS?.content_subjektif)), notS?.content_subjektif)

// 6. Kontrol + portal
await post('Kontrol (dilatasyonlu)', pid, { adim: 'kontrol', tarih: gun(-30), neden: 'Glokom ve retina kontrolü', dilatasyon: true })
const secret = process.env.PORTAL_TOKEN_SECRET
if (secret) {
  const portal = async (p: string, ad: string) => {
    const tok = createHmac('sha256', secret).update(`${p}${doktor.id}${Date.now()}`).digest('hex'); const pin = generatePortalPin()
    await sb.from('hasta_portal_tokens').insert({ token_hash: tok, doctor_id: doktor.id, patient_id: p, expires_at: new Date(Date.now() + 2 * 86400000).toISOString(), created_at: new Date().toISOString(), pin_hash: hashPortalPin(pin) })
    const kayitli = TOKEN; TOKEN = ''
    const u = await istek(`${ad}: PIN unlock`, 'POST', `/api/portal/hasta/${tok}/unlock`, { pin })
    const cookie = (u.r.headers.get('set-cookie') || '').split(';')[0]
    const b = (await istek(`${ad}: bundle`, 'GET', `/api/portal/hasta/${tok}`, undefined, 200, { Cookie: cookie })).json
    const anket = (await istek(`${ad}: ön anket (göz pratiği)`, 'GET', `/api/portal/hasta/${tok}/dahiliye-anket`, undefined, 200, { Cookie: cookie })).json
    TOKEN = kayitli
    return { b, anket }
  }
  const { b, anket } = await portal(pid, 'Portal yetişkin')
  kontrol('portal modülleri yalnız Gözlerim; nav /gozlerim', JSON.stringify(b.portal.moduller) === '["gozlerim"]' && b.portal.nav[0]?.path === '/gozlerim', b.portal)
  kontrol('Gözlerim: kontrol + dilatasyon, 2 damla, enjeksiyon tarihleri, VA/GİB serisi, OCT bildirimi', b.goz?.sonrakiKontrol?.dilatasyon === true && b.goz.damlalar.length === 2 && b.goz.islemler.length === 2 && b.goz.olcumler.length === 2 && b.goz.goruntuler.length === 2, b.goz) // iki OCT (karşılaştırma adımı ikinciyi ekler)
  kontrol('Gözlerim: ilaç adı / okuma metni / tanı dili sızmıyor', !/bevacizumab|Foveal|intraretinal|NPDR|glokomunuz/i.test(JSON.stringify(b.goz)), b.goz)
  kontrol('göz pratiği: büyüme/gebelik/jine yok; dahiliye ön anket kapalı', b.buyume === null && b.gebelik === null && b.jinekoloji === null && anket.uygun === false, { buyume: b.buyume, anket })
  const c = await portal(cocuk, 'Portal çocuk')
  kontrol('6 yaşında çocuk + kilo/boy ölçümü, göz pratiği → büyüme eğrisi YOK (pediatri portalı ≠ göz portalı)', c.b.buyume === null && c.b.hedefBoy === null && JSON.stringify(c.b.portal.moduller) === '["gozlerim"]', c.b.portal)
} else console.log('PORTAL_TOKEN_SECRET yok — portal adımları atlandı')

// 7. Sekreter salt okur — (QA sekreter hesabı yok; API sadeceDoktor koruması kodda). Son durum:
v = await get(pid)
kontrol('şerit: sıradaki enjeksiyon + DR evresi', /OD/.test(String(v.serit.sonrakiEnjeksiyon)) && /Orta NPDR/.test(String(v.serit.drEvre)), v.serit)

fs.mkdirSync('smoke-out', { recursive: true })
fs.writeFileSync('smoke-out/goz-smoke.json', JSON.stringify({ base: BASE, tarih: new Date().toISOString(), kayit }, null, 2))
console.log(`\n${kayit.length} adım/kontrol · ${hata} hata`)
process.exit(hata ? 1 : 0)
