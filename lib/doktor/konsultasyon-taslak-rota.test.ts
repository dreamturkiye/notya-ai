/**
 * AYSE-KONSULTASYON-01 — Ayşe'nin istem ve yanıt taslakları, GERÇEK route handler'ıyla (veritabanı, kasa ve model sahte).
 * Sentetik QA verisi. Model isteği yakalanır: kademe, önbellek, bağlamın içeriği ve kimlik sızmaması doğrulanır.
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-konsultasyon-taslak-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'

let db = new SahteVeritabani()
const KOK = resolve(__dirname, '../..')
const yerel = (yol: string) => pathToFileURL(join(KOK, yol)).href

function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}

/** Modele giden her istek + testin belirlediği davranış. */
const istekler: any[] = []
type ModelDavranisi = (istek: any) => any
let modelDavranisi: ModelDavranisi = () => { throw new Error('model çağrılmamalıydı') }
function metinYanit(text: string, stop_reason = 'end_turn') {
  return { content: [{ type: 'text', text }], stop_reason, model: 'sahte', usage: { input_tokens: 10, output_tokens: 10 } }
}
{
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  class SahteAnthropic { messages = { create: async (istek: any) => { istekler.push(istek); return modelDavranisi(istek) } } }
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module].filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
/** Kasa: yalnız downloadDocument kullanılır — hekim kapsamı gerçek rotada belgeBu() ile zaten doğrulanmış olur. */
const indirilen: string[] = []
class VaultAccessError extends Error {}
class VaultValidationError extends Error {}
mock.module(yerel('lib/vault/service.ts'), {
  namedExports: {
    downloadDocument: async (_d: unknown, doktorId: string, belgeId: string) => {
      indirilen.push(`${doktorId}:${belgeId}`)
      const b = db.tablo('medical_documents').find((x) => x.id === belgeId && x.doctor_id === doktorId)
      if (!b) throw new VaultAccessError()
      return { meta: { id: belgeId }, bytes: Buffer.from('%PDF-1.4 sentetik konsültan raporu') }
    },
    uploadDocument: async () => { throw new Error('yok') }, listDocuments: async () => [], getDocumentMeta: async () => { throw new VaultAccessError() },
    softDeleteDocument: async () => undefined, VaultAccessError, VaultValidationError,
  },
})
mock.module(yerel('lib/alarm.ts'), { namedExports: { kritikAlarm: async () => undefined } })
globalThis.fetch = (async (g: unknown) => { throw new Error(`taslak testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let encrypt: (s: string) => string
let R: Record<string, any>
let T: typeof import('./konsultasyonTaslagi')
let M: typeof import('../ai/modeller')
let S: typeof import('../ai/saglayici')

function iste(yontem: string, token: string, govde?: unknown) {
  return new NextRequestSinifi('http://localhost/api/doktor/konsultasyon', {
    method: yontem,
    headers: { authorization: `Bearer ${token}`, ...(govde !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: govde !== undefined ? JSON.stringify(govde) : undefined,
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
const post = async (token: string, govde: unknown) => { const y = await R.POST(iste('POST', token, govde)); return { status: y.status, j: await y.json().catch(() => ({})) } }
const patch = async (token: string, govde: unknown) => { const y = await R.PATCH(iste('PATCH', token, govde)); return { status: y.status, j: await y.json().catch(() => ({})) } }

type Hekim = { id: string; token: string; hasta: string; konsultasyon: string; belge: string; foto: string }
function hekimKur(harf: string, specialty = 'pediatri'): Hekim {
  const id = randomUUID()
  const token = `qa-taslak-${harf}`
  db.kullanicilar.set(token, { id })
  db.ekle('users', { id, full_name: `Dr. QA Hekim ${harf}`, specialty })
  const hasta = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `GIZLIAD${harf}`, soyad: 'Sentetik' })), dob_encrypted: encrypt('2021-03-01'), gender_encrypted: encrypt('male'), phone_encrypted: encrypt('05550009999') }).id
  const eski = db.ekle('sessions', { doctor_id: id, patient_id: hasta, status: 'completed', created_at: '2025-11-02T09:00:00Z' }).id
  db.ekle('notes', { session_id: eski, doctor_id: id, created_at: '2025-11-02T09:30:00Z', approved_at: '2025-11-02T10:00:00Z', content_tani: `Akut otitis media ${harf}-ONCEKI`, content_degerlendirme: 'Sağ kulak zarı hiperemik.', content_plan: `ESKI-PLAN-${harf}` })
  const son = db.ekle('sessions', { doctor_id: id, patient_id: hasta, status: 'completed', created_at: '2026-09-12T09:00:00Z' }).id
  db.ekle('notes', { session_id: son, doctor_id: id, created_at: '2026-09-12T09:30:00Z', approved_at: null, basvuru_yakinmasi: `Üç gündür sağ kulak ağrısı ${harf}-SON`, content_objektif: 'Sağ kulak zarı bombeli.', content_degerlendirme: 'Akut otitis media düşünüldü.', content_plan: 'Antibiyotik başlandı.', content_ilaclar: [{ ad: 'Amoksisilin-klavulanat', doz: '400 mg/5 mL', kullanim: '2x5 mL' }], vitaller: { ates: 38.4 } })
  db.ekle('hasta_ilaclar', { doctor_id: id, patient_id: hasta, ilac_adi: `Montelukast ${harf}`, doz: '4 mg', kullanim_sikli: '1x1', aktif: true })
  const belge = db.ekle('medical_documents', { doctor_id: id, patient_id: hasta, file_name: `kbb-raporu-${harf}.pdf`, file_type: 'application/pdf', deleted_at: null }).id
  const foto = db.ekle('medical_documents', { doctor_id: id, patient_id: hasta, file_name: `kbb-foto-${harf}.jpg`, file_type: 'image/jpeg', deleted_at: null }).id
  const konsultasyon = db.ekle('sevkler', { doctor_id: id, patient_id: hasta, hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz', klinik_soru: 'Sayın Meslektaşım,\n\nHastamız.\n\nİşitme kaybı açısından konsültasyonunuzu rica ederim.\n\nSaygılarımla,\nDr. QA', aciliyet: 'rutin', istem_tarihi: '2026-09-12', durum: 'yanit_bekleniyor', kaynak: 'konsultasyon', belge_id: belge }).id
  return { id, token, hasta, konsultasyon, belge, foto }
}

const GOVDE = 'Dört yaşındaki erkek hastamız üç gündür sağ kulak ağrısı ile başvurdu. Muayenesinde sağ kulak zarı bombeli idi.\n\nAkut otitis media düşünülerek amoksisilin-klavulanat 400 mg/5 mL başlandı.\n\nİşitme açısından değerlendirilmesi ve gerekli görmeniz halinde ileri tetkik ve tedavi önerileriniz açısından Kulak Burun Boğaz Hastalıkları konsültasyonunuzu rica ederim.'

describe('AYSE-KONSULTASYON-01 — istem taslağı (gerçek rota)', () => {
  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    R = await import('../../app/api/doktor/konsultasyon/route')
    T = await import('./konsultasyonTaslagi')
    M = await import('../ai/modeller')
    S = await import('../ai/saglayici')
  })
  let A: Hekim, B: Hekim
  beforeEach(() => {
    db = new SahteVeritabani(); istekler.length = 0; indirilen.length = 0
    modelDavranisi = () => metinYanit(GOVDE)
    A = hekimKur('A'); B = hekimKur('B', 'kardiyoloji')
    // Kirli satır: B'nin A'nın hastasına düşmüş seansı/notu — A'nın taslak bağlamına GİRMEMELİ
    const hileli = db.ekle('sessions', { doctor_id: B.id, patient_id: A.hasta, status: 'completed', created_at: '2026-09-13T09:00:00Z' }).id
    db.ekle('notes', { session_id: hileli, doctor_id: B.id, created_at: '2026-09-13T09:30:00Z', content_degerlendirme: 'HILELI-B-NOTU' })
  })

  it('taslak DOLU döner: "Sayın Meslektaşım," + gövde + imza; hiçbir şey KAYDEDİLMEZ', async () => {
    const sevkOnce = db.tablo('sevkler').length
    const y = await post(A.token, { islem: 'istem_taslagi', patientId: A.hasta, hedefBrans: 'kulak-burun-bogaz' })
    assert.equal(y.status, 200, JSON.stringify(y.j))
    assert.equal(y.j.ok, true)
    assert.ok(y.j.taslak.startsWith('Sayın Meslektaşım,\n\nDört yaşındaki'))
    assert.ok(y.j.taslak.endsWith('Saygılarımla,\nDr. QA Hekim A\nÇocuk Sağlığı ve Hastalıkları'), y.j.taslak)
    assert.equal(y.j.kaynak.sonMuayene, '2026-09-12')
    assert.equal(y.j.kaynak.vizitSayisi, 2)
    assert.equal(db.tablo('sevkler').length, sevkOnce, 'taslak kayıt açmaz')
  })

  it("model: 'klinik-analiz' → GÜÇLÜ; sabit prompt önbellekli; dosya user mesajında; son muayene ağırlıklı; kimlik ve kirli satır YOK", async () => {
    await post(A.token, { islem: 'istem_taslagi', patientId: A.hasta, hedefBrans: 'kulak-burun-bogaz', not: 'işitme kaybı şüphesi' })
    assert.equal(istekler.length, 1)
    const i = istekler[0]
    assert.equal(i.model, S.dogrudanModelAdi(M.gucluModel()), 'HIZLI modele düştü')
    assert.equal(i.system.length, 1)
    assert.deepEqual(i.system[0].cache_control, { type: 'ephemeral' })
    assert.equal(i.system[0].text, T.ISTEM_TASLAK_SISTEMI)
    const u = String(i.messages[0].content)
    for (const p of ['A-SON', 'Sağ kulak zarı bombeli', 'ates: 38.4', '400 mg/5 mL', 'A-ONCEKI', 'Montelukast A', 'Kulak Burun Boğaz Hastalıkları', 'işitme kaybı şüphesi']) assert.ok(u.includes(p), p)
    assert.ok(!u.includes('ESKI-PLAN-A'), 'önceki vizitin planı (ham metin) gitmemeli')
    for (const yasak of ['GIZLIAD', '05550009999', A.hasta, 'HILELI-B-NOTU', 'B-SON', 'Montelukast B']) assert.ok(!JSON.stringify(i).includes(yasak), `modele sızdı: ${yasak}`)
  })

  it('HATA YOLU: model hatası / kredi yok → 200 { ok:false, "Taslak oluşturulamadı…" }; form yine kaydedebilir', async () => {
    modelDavranisi = () => { const e = new Error('400 {"type":"error","error":{"message":"Your credit balance is too low"}}'); throw e }
    const y = await post(A.token, { islem: 'istem_taslagi', patientId: A.hasta, hedefBrans: 'kulak-burun-bogaz' })
    assert.equal(y.status, 200)
    assert.deepEqual({ ok: y.j.ok, error: y.j.error }, { ok: false, error: T.TASLAK_OLUSTURULAMADI })
    // Hekim elle yazar ve oluşturur — kilitlenmedi
    const k = await post(A.token, { patientId: A.hasta, hedefBrans: 'kulak-burun-bogaz', klinikSoru: 'İşitme kaybı var mı? Elle yazılan istem.' })
    assert.equal(k.status, 201)
  })

  it('F3: model ham JSON ya da kesilmiş metin döndürürse hekime gösterilmez', async () => {
    modelDavranisi = () => metinYanit('{"govde":"Sayın meslektaşım"}')
    assert.equal((await post(A.token, { islem: 'istem_taslagi', patientId: A.hasta, hedefBrans: 'kulak-burun-bogaz' })).j.ok, false)
    modelDavranisi = () => metinYanit(GOVDE, 'max_tokens')
    const y = await post(A.token, { islem: 'istem_taslagi', patientId: A.hasta, hedefBrans: 'kulak-burun-bogaz' })
    assert.equal(y.j.ok, false)
    assert.ok(!('taslak' in y.j))
  })

  it('uydurma doz yer tutucu olur; dosyadaki doz kalır', async () => {
    modelDavranisi = () => metinYanit(`${GOVDE}\n\nAyrıca ibuprofen 100 mg verildi.`)
    const y = await post(A.token, { islem: 'istem_taslagi', patientId: A.hasta, hedefBrans: 'kulak-burun-bogaz' })
    assert.ok(y.j.taslak.includes('400 mg/5 mL'))
    assert.ok(!y.j.taslak.includes('100 mg') && y.j.taslak.includes(T.DOZ_YER_TUTUCU))
    assert.deepEqual(y.j.dozUyarisi, ['100 mg'])
  })

  it('dosyada muayene yoksa model ÇAĞRILMAZ; form boş ama kullanılabilir', async () => {
    const bos = db.ekle('patients', { doctor_id: A.id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA' })) }).id
    const y = await post(A.token, { islem: 'istem_taslagi', patientId: bos, hedefBrans: 'kulak-burun-bogaz' })
    assert.equal(y.status, 200)
    assert.equal(y.j.neden, 'dosya_bos')
    assert.match(y.j.error, /elle yazabilirsiniz/i)
    assert.equal(istekler.length, 0)
  })

  it('HASTA-İZOLASYON: A, B\'nin hastası için taslak alamaz (404) ve B\'nin dosyası modele gitmez; serbest metin branş reddedilir', async () => {
    const y = await post(A.token, { islem: 'istem_taslagi', patientId: B.hasta, hedefBrans: 'kulak-burun-bogaz' })
    assert.equal(y.status, 404)
    assert.equal(istekler.length, 0)
    assert.equal((await post(A.token, { islem: 'istem_taslagi', patientId: A.hasta, hedefBrans: 'KBB' })).status, 400)
  })
})

describe('AYSE-KONSULTASYON-01 — yanıt özeti taslağı (gerçek rota)', () => {
  let A: Hekim, B: Hekim
  beforeEach(() => {
    db = new SahteVeritabani(); istekler.length = 0; indirilen.length = 0
    modelDavranisi = () => metinYanit('İşitme kaybı saptanmadı; odyometri ve timpanometri normal.')
    A = hekimKur('A'); B = hekimKur('B')
  })

  it("PDF rapor: kasadan (hekim kapsamlı) okunur, 'goruntu-inceleme' → GÜÇLÜ, sabit prompt önbellekli; taslak kaydedilmez, durum değişmez", async () => {
    const y = await post(A.token, { islem: 'yanit_taslagi', id: A.konsultasyon })
    assert.equal(y.status, 200, JSON.stringify(y.j))
    assert.deepEqual({ ok: y.j.ok, taslak: y.j.taslak, kaynak: y.j.kaynak }, { ok: true, taslak: 'İşitme kaybı saptanmadı; odyometri ve timpanometri normal.', kaynak: 'ayse' })
    assert.deepEqual(indirilen, [`${A.id}:${A.belge}`])
    const i = istekler[0]
    assert.equal(i.model, S.dogrudanModelAdi(M.gucluModel()))
    assert.deepEqual(i.system[0].cache_control, { type: 'ephemeral' })
    assert.equal(i.system[0].text, T.YANIT_TASLAK_SISTEMI)
    assert.equal(i.messages[0].content[0].type, 'document')
    assert.ok(i.messages[0].content[1].text.includes('İşitme kaybı açısından konsültasyonunuzu rica ederim.'), 'klinik soru mektubun özünden')
    assert.ok(i.messages[0].content[1].text.includes('Kulak Burun Boğaz Hastalıkları'))
    const s = db.tablo('sevkler').find((x) => x.id === A.konsultasyon)!
    assert.equal(s.durum, 'yanit_bekleniyor', 'hekim onaylamadan yanıtlandı olmaz')
    assert.equal(s.yanit_ozeti ?? null, null)
    // Hekim onaylar → ancak şimdi yanıtlandı
    const onay = await patch(A.token, { id: A.konsultasyon, islem: 'yanit', yanitOzeti: y.j.taslak })
    assert.equal(onay.j.konsultasyon.durum, 'yanitlandi')
  })

  it('mevcut belge_analizleri taslağı varsa ONU kullanır — ikinci analiz (model çağrısı) yok', async () => {
    db.ekle('belge_analizleri', { belge_id: A.belge, doctor_id: A.id, patient_id: A.hasta, brans: 'pediatri', modality_final: 'diger', durum: 'onaylandi', de_id_hash: 'x', engine_set: 'tierA-v1', motor_ciktilari: [], hekim_ozet: 'Odyometri normal, işitme kaybı yok.', sonuc: { ozet: 'eski' }, olusturuldu: '2026-09-18T10:00:00Z' })
    const y = await post(A.token, { islem: 'yanit_taslagi', id: A.konsultasyon })
    assert.deepEqual({ ok: y.j.ok, taslak: y.j.taslak, kaynak: y.j.kaynak, d: y.j.belgeDurumu }, { ok: true, taslak: 'Odyometri normal, işitme kaybı yok.', kaynak: 'belge_analizi', d: 'onaylandi' })
    assert.equal(istekler.length, 0)
    assert.deepEqual(indirilen, [])
  })

  it('fotoğraf rapor: önce kimliksizleştirilmiş türev istenir; türevle görüntü bloğu GÜÇLÜ modele gider', async () => {
    const ilk = await post(A.token, { islem: 'yanit_taslagi', id: A.konsultasyon, belgeId: A.foto })
    assert.deepEqual({ ok: ilk.j.ok, neden: ilk.j.neden }, { ok: false, neden: 'deid_gerekli' })
    assert.equal(istekler.length, 0)
    const y = await post(A.token, { islem: 'yanit_taslagi', id: A.konsultasyon, belgeId: A.foto, deid: { mime: 'image/jpeg', base64: Buffer.from('jpeg').toString('base64') } })
    assert.equal(y.j.ok, true)
    assert.equal(istekler[0].messages[0].content[0].type, 'image')
    assert.equal(istekler[0].model, S.dogrudanModelAdi(M.gucluModel()))
  })

  it('HATA YOLU: rapor okunamadı / model hatası → ok:false "elle yazabilirsiniz"; hekim özeti elle yazıp kaydedebilir', async () => {
    modelDavranisi = () => metinYanit(T.RAPOR_OKUNAMADI)
    const a = await post(A.token, { islem: 'yanit_taslagi', id: A.konsultasyon })
    assert.deepEqual({ ok: a.j.ok, neden: a.j.neden }, { ok: false, neden: 'yetersiz' })
    assert.match(a.j.error, /elle yazabilirsiniz/i)
    modelDavranisi = () => { throw new Error('ağ') }
    const b = await post(A.token, { islem: 'yanit_taslagi', id: A.konsultasyon })
    assert.deepEqual({ ok: b.j.ok, error: b.j.error }, { ok: false, error: T.TASLAK_OLUSTURULAMADI })
    assert.equal((await patch(A.token, { id: A.konsultasyon, islem: 'yanit', yanitOzeti: 'Elle yazılmış özet.' })).j.konsultasyon.durum, 'yanitlandi')
  })

  it('HASTA-İZOLASYON: A, B\'nin konsültasyonuna ya da B\'nin raporuna taslak alamaz (404); kasadan B\'nin belgesi okunmaz', async () => {
    assert.equal((await post(A.token, { islem: 'yanit_taslagi', id: B.konsultasyon })).status, 404)
    assert.equal((await post(A.token, { islem: 'yanit_taslagi', id: A.konsultasyon, belgeId: B.belge })).status, 404)
    assert.equal(istekler.length, 0)
    assert.deepEqual(indirilen, [])
  })
})
