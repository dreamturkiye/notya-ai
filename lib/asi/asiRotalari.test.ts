/**
 * ASI-KARNESI-01 — aşı rotaları GERÇEK handler'larla (yalnız veritabanı, oturum ve model sahte).
 *
 *  Karne okuma / toplu onay (app/api/doktor/asilar/karne):
 *   - okunan satırlar onaysız KAYDEDİLMEZ — sunucuda da (hekimOnayi yoksa, okunamadı satır düzeltilmemişse 400, 0 satır)
 *   - toplu onay + satır düzeltme: hekimin düzelttiği değer kaydedilene aynen yansır; kaynak='beyan' + kanıt izi
 *   - 'oku' asilar'a hiçbir şey yazmaz; okunamayan satır "okunamadı" gelir, tarih/doz uydurulmaz
 *   - karne okuma 'goruntu-inceleme' → GÜÇLÜ kademe (HIZLI'ya düşmez), model adı çağrı yerinde yazılmaz
 *   - sekreter karneyi okutamaz / onaylayamaz (klinik karar)
 *  Dijital aşı karnesi (Sağlığım bundle + PDF — portal ve hekim):
 *   - geçerli token + PIN → 200 PDF; token yok / PIN yok → reddedilir; başka hastanın kaydı PDF'e ve bundle'a girmez
 *   - hekim PDF'i: kendi hastası 200, yabancı hasta 404; portal ile AYNI içerik
 *  Hekim onaylı hatırlatma (app/api/doktor/asilar/hatirlatma):
 *   - hekim onayı olmadan gönderilmez (400, mesaj yok, işaret yok); gönderilen tekrar gönderilmez (409)
 *   - liste yalnız hekimin kendi hastaları; önizleme = gönderilen metin; sekreter görür ama gönderemez
 * Sentetik veri — gerçek hasta yok.
 *
 *   npm test  (--experimental-test-module-mocks)
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-asi-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'
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
/** Modele giden her istek (model adı + içerik) ve sıradaki sahte yanıt. */
const modelIstekleri: Array<Record<string, any>> = []
let modelYaniti = '{}'
class SahteAnthropic {
  messages = {
    create: async (istek: Record<string, any>) => {
      modelIstekleri.push(istek)
      return { content: [{ type: 'text', text: modelYaniti }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
    },
  }
}
{
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
mock.module(yerel('lib/doktor/hizLimiti.ts'), { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })
globalThis.fetch = (async (girdi: unknown) => { throw new Error(`aşı rota testi ağ erişimi yapamaz: ${String(girdi)}`) }) as typeof fetch

// ─── Sahne ────────────────────────────────────────────────────────────────────────────────────────
let encrypt: (s: string) => string
let encryptBytes: (b: Buffer) => Buffer
let NextRequestSinifi: typeof import('next/server').NextRequest
let gucluModel: () => string
let hizliModel: () => string

type Hekim = { id: string; token: string; hasta: string; karne: string; sekreterToken: string; portalToken: string; bosHasta: string; bosPortalToken: string; yaklasanAsi: string; gecikenAsi: string; tarihsizAsi: string }
/** Türkiye takvim gününe göre bugünden n gün sonrası (YYYY-MM-DD). */
const gunSonra = (n: number) => new Date(Date.now() + 3 * 3600e3 + n * 86400e3).toISOString().slice(0, 10)
function hekimKur(harf: 'A' | 'B'): Hekim {
  const id = randomUUID()
  const token = `qa-asi-token-${harf}`
  db.kullanicilar.set(token, { id, email: `qa-asi-${harf}@ornek.test` })
  db.ekle('users', { id, full_name: `Dr. QA Hekim ${harf}`, specialty: 'pediatri' })
  const hasta = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `QA Çocuk ${harf}`, soyad: 'Işıkoğlu' })), dob_encrypted: encrypt('2024-03-10') }).id
  const karne = randomUUID()
  db.ekle('medical_documents', { id: karne, doctor_id: id, patient_id: hasta, file_name: 'asi-karnesi.jpg', file_type: 'image/jpeg', file_size: 12, category: 'Aşı karnesi', storage_backend: 'db', storage_key: `db:${karne}`, uploaded_by: id, deleted_at: null })
  db.bloblar.set(karne, encryptBytes(Buffer.from('sentetik-karne-goruntusu')).toString('base64'))
  const sekreter = randomUUID(), sekreterToken = `qa-asi-sekreter-${harf}`
  db.kullanicilar.set(sekreterToken, { id: sekreter })
  db.ekle('personel', { user_id: sekreter, doktor_id: id, aktif: true })
  // Dijital karne: bu hekimin bu hastaya girdiği iki kayıt (biri karneden aktarılmış) + hekimin girdiği sonraki doz tarihi
  db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: `Hepatit B ${harf}-İşaret`, doz_no: 1, kategori: 'pediatrik', uygulama_tarihi: '2024-03-10', kaynak: 'beyan', belge_id: karne })
  db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: `KKK ${harf}-İşaret`, doz_no: 1, kategori: 'pediatrik', uygulama_tarihi: '2025-03-12', sonraki_doz_tarihi: '2099-03-01', kaynak: 'kayit' })
  const portalToken = `qa-asi-portal-${harf}`
  db.ekle('hasta_portal_tokens', { token_hash: portalToken, doctor_id: id, patient_id: hasta, expires_at: new Date(Date.now() + 30 * 86400e3).toISOString(), pin_hash: 'sentetik' })
  const bosHasta = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `QA Kayıtsız ${harf}` })), dob_encrypted: encrypt('1980-01-01') }).id
  const bosPortalToken = `qa-asi-portal-bos-${harf}`
  db.ekle('hasta_portal_tokens', { token_hash: bosPortalToken, doctor_id: id, patient_id: bosHasta, expires_at: new Date(Date.now() + 30 * 86400e3).toISOString(), pin_hash: 'sentetik' })
  // Hatırlatma: biri 10 gün sonra (gönderilmedi), biri 20 gün önce (zaten gönderildi), biri tarihsiz; biri sonraki dozu kaydedilmiş
  const yaklasanAsi = db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: `Suçiçeği ${harf}-İşaret`, doz_no: 1, kategori: 'pediatrik', uygulama_tarihi: '2025-03-12', sonraki_doz_tarihi: gunSonra(10), kaynak: 'kayit', hatirlatma_gonderildi: false }).id
  const gecikenAsi = db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: `Td ${harf}-İşaret`, doz_no: null, kategori: 'pediatrik', uygulama_tarihi: '2025-01-01', sonraki_doz_tarihi: gunSonra(-20), kaynak: 'kayit', hatirlatma_gonderildi: true }).id
  const tarihsizAsi = db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: `BCG ${harf}-İşaret`, doz_no: null, kategori: 'pediatrik', uygulama_tarihi: '2024-03-12', kaynak: 'kayit', hatirlatma_gonderildi: false }).id
  db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: 'Hepatit A', doz_no: 1, kategori: 'pediatrik', uygulama_tarihi: '2025-03-12', sonraki_doz_tarihi: gunSonra(3), kaynak: 'kayit', hatirlatma_gonderildi: false })
  db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: 'Hepatit A', doz_no: 2, kategori: 'pediatrik', uygulama_tarihi: gunSonra(-2), kaynak: 'kayit', hatirlatma_gonderildi: false })
  return { id, token, hasta, karne, sekreterToken, portalToken, bosHasta, bosPortalToken, yaklasanAsi, gecikenAsi, tarihsizAsi }
}
/** X hekiminin Y'nin hastasına iliştirdiği kayıt (düzeltme öncesi açıklardan kalmış olabilecek kirli satır). */
function hileliKur(x: Hekim, y: Hekim, harf: string) {
  db.ekle('asilar', { doktor_id: x.id, patient_id: y.hasta, asi_adi: `Hileli ${harf}-GIZLI`, doz_no: 1, kategori: 'pediatrik', uygulama_tarihi: '2025-01-01', sonraki_doz_tarihi: gunSonra(5), kaynak: 'kayit', hatirlatma_gonderildi: false })
}
function sahneKur() {
  db = new SahteVeritabani()
  modelIstekleri.length = 0
  const A = hekimKur('A'), B = hekimKur('B')
  hileliKur(A, B, 'A'); hileliKur(B, A, 'B')
  taban = db.tablo('asilar').length
  return { A, B }
}
/** Sahnedeki hazır aşı satırlarının sayısı — karne testleri yalnız YENİ yazılanlara bakar. */
let taban = 0
async function portalCerezi(token: string): Promise<string> {
  const { setUnlockCookie, UNLOCK_COOKIE } = await import('../portal/pinAuth')
  const { NextResponse } = await import('next/server')
  const res = NextResponse.json({})
  setUnlockCookie(res, token)
  return `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
}
async function pdfMetni(metinVeyaBuf: string | Buffer): Promise<string> {
  const buf = typeof metinVeyaBuf === 'string' ? Buffer.from(metinVeyaBuf, 'latin1') : metinVeyaBuf
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), disableFontFace: true, useSystemFonts: false, isEvalSupported: false }).promise
  let t = ''
  for (let i = 1; i <= doc.numPages; i++) t += ((await (await doc.getPage(i)).getTextContent()).items as Array<{ str?: string }>).map((x) => x.str || '').join(' ') + '\n'
  return t.replace(/\s+/g, ' ')
}
const asilar = () => db.tablo('asilar').slice(taban)

function iste(yontem: string, yol: string, o: { token?: string; govde?: unknown; cerez?: string } = {}) {
  const h: Record<string, string> = {}
  if (o.token) h.authorization = `Bearer ${o.token}`
  if (o.govde !== undefined) h['content-type'] = 'application/json'
  if (o.cerez) h.cookie = o.cerez
  return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: h, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined })
}
async function coz(r: Response | Promise<Response>) {
  const y = await r
  const bayt = Buffer.from(await y.arrayBuffer())
  const metin = bayt.toString('utf8')
  let json: any = null
  try { json = JSON.parse(metin) } catch { /* ikili yanıt */ }
  return { status: y.status, metin, json, bayt, tur: y.headers.get('content-type') || '', ek: y.headers.get('content-disposition') || '' }
}
const prm = <T extends object>(p: T) => ({ params: p })

const OKUMA = JSON.stringify({
  asi_karnesi: true, okunabilirlik: 'kismi', dogum_tarihi: '2024-03-10', not: null,
  satirlar: [
    { asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2024-03-10', ham_metin: 'Hep B 10.03.2024', emin: true, okunamayan_alanlar: [] },
    { asi_adi: 'KPA', doz_no: 2, uygulama_tarihi: '2024-07-15', ham_metin: 'KPA ? 15.07.2024 (soluk)', emin: false, okunamayan_alanlar: [] },
    { asi_adi: 'Rotateq', doz_no: 1, uygulama_tarihi: null, ham_metin: 'Rotateq — tarih okunmuyor', emin: true, okunamayan_alanlar: ['uygulama_tarihi'] },
  ],
})

// ─── Paket ────────────────────────────────────────────────────────────────────────────────────────
describe('ASI-KARNESI-01 — karne okuma ve toplu onay (gerçek rota)', () => {
  let karne: typeof import('../../app/api/doktor/asilar/karne/route')
  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    ;({ encryptBytes } = await import('../vault/crypto'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    ;({ gucluModel, hizliModel } = await import('../ai/modeller'))
    karne = await import('../../app/api/doktor/asilar/karne/route')
  })

  it("'oku': GÜÇLÜ kademe, görüntü modele gider; asilar'a HİÇBİR şey yazılmaz; okunamayan satır uydurulmaz", async () => {
    const { A } = sahneKur()
    modelYaniti = OKUMA
    const y = await coz(karne.POST(iste('POST', '/api/doktor/asilar/karne', { token: A.token, govde: { adim: 'oku', belgeId: A.karne } })))
    assert.equal(y.status, 200, y.metin)
    assert.equal(asilar().length, 0, 'okuma adımı kayıt açmamalı')
    assert.equal(y.json.taslak, true)
    // model kademesi: goruntu-inceleme → GÜÇLÜ; HIZLI değil
    assert.equal(modelIstekleri.length, 1)
    assert.equal(modelIstekleri[0].model, gucluModel())
    assert.notEqual(modelIstekleri[0].model, hizliModel())
    const icerik = JSON.stringify(modelIstekleri[0].messages)
    assert.ok(icerik.includes('"type":"image"'), 'karne görüntüsü modele gitmeli')
    assert.ok(!icerik.includes('QA Çocuk'), 'hasta adı modele gitmez')
    const [hep, kpa, rota] = y.json.satirlar
    assert.deepEqual([hep.asiAdi, hep.dozNo, hep.uygulamaTarihi, hep.okunamadi], ['Hepatit B', 1, '2024-03-10', false])
    assert.deepEqual([kpa.dozNo, kpa.uygulamaTarihi, kpa.okunamadi], [null, null, true], 'emin olunmayan satırda tarih/doz uydurulmaz')
    assert.deepEqual([rota.uygulamaTarihi, rota.okunamadi], [null, true])
    assert.equal(hep.eslesme.grup, 'takvim')
    assert.equal(rota.eslesme.grup, 'ozel', 'takvim dışı / özel aşı ayrı grupta')
  })

  it("'onayla' hekimOnayi olmadan 400 — satır yazılmaz (istemci atlasa da sunucu engeller)", async () => {
    const { A } = sahneKur()
    for (const hekimOnayi of [undefined, false, 'true', 1]) {
      const y = await coz(karne.POST(iste('POST', '/api/doktor/asilar/karne', { token: A.token, govde: { adim: 'onayla', belgeId: A.karne, hekimOnayi, satirlar: [{ asiAdi: 'KKK', dozNo: 1, uygulamaTarihi: '2025-03-12' }] } })))
      assert.equal(y.status, 400, String(hekimOnayi))
    }
    assert.equal(asilar().length, 0)
  })

  it("'onayla': okunamadı satır düzeltilmeden gönderilirse TÜM istek reddedilir (yarım kayıt yok)", async () => {
    const { A } = sahneKur()
    const y = await coz(karne.POST(iste('POST', '/api/doktor/asilar/karne', { token: A.token, govde: { adim: 'onayla', belgeId: A.karne, hekimOnayi: true, satirlar: [
      { asiAdi: 'Hepatit B', dozNo: 1, uygulamaTarihi: '2024-03-10' },
      { asiAdi: 'KPA', dozNo: null, uygulamaTarihi: null, okunamadi: true },
    ] } })))
    assert.equal(y.status, 400)
    assert.equal(asilar().length, 0)
  })

  it("'onayla': hekimin düzelttiği değer kaydedilene AYNEN yansır; kaynak='beyan' + belge izi + onay anı", async () => {
    const { A } = sahneKur()
    const y = await coz(karne.POST(iste('POST', '/api/doktor/asilar/karne', { token: A.token, govde: { adim: 'onayla', belgeId: A.karne, hekimOnayi: true, satirlar: [
      { asiAdi: 'Hepatit B', dozNo: 1, uygulamaTarihi: '2024-03-10' },
      { asiAdi: 'KPA (Pnömokok)', dozNo: 2, uygulamaTarihi: '2024-07-16', okunamadi: true, hekimDuzeltti: true },
    ] } })))
    assert.equal(y.status, 200, y.metin)
    assert.equal(y.json.kaydedilen, 2)
    const satirlar = asilar()
    assert.equal(satirlar.length, 2)
    const kpa = satirlar.find((r) => r.asi_adi === 'KPA (Pnömokok)')!
    assert.deepEqual([kpa.doz_no, kpa.uygulama_tarihi], [2, '2024-07-16'], 'hekimin düzelttiği değer')
    for (const r of satirlar) {
      assert.equal(r.kaynak, 'beyan')
      assert.equal(r.belge_id, A.karne)
      assert.ok(r.hekim_onay_at)
      assert.equal(r.doktor_id, A.id)
      assert.equal(r.patient_id, A.hasta)
      assert.equal(r.kategori, 'pediatrik')
    }
  })

  it('sekreter okutamaz ve onaylayamaz (403), yazı yok', async () => {
    const { A } = sahneKur()
    modelYaniti = OKUMA
    for (const govde of [{ adim: 'oku', belgeId: A.karne }, { adim: 'onayla', belgeId: A.karne, hekimOnayi: true, satirlar: [{ asiAdi: 'KKK', dozNo: 1, uygulamaTarihi: '2025-03-12' }] }]) {
      const y = await coz(karne.POST(iste('POST', '/api/doktor/asilar/karne', { token: A.sekreterToken, govde })))
      assert.equal(y.status, 403)
    }
    assert.equal(asilar().length, 0)
    assert.equal(modelIstekleri.length, 0)
  })

  it('başka hekimin karnesi: okunamaz, onaylanamaz (404), modele gitmez', async () => {
    const { A, B } = sahneKur()
    modelYaniti = OKUMA
    const oku = await coz(karne.POST(iste('POST', '/api/doktor/asilar/karne', { token: A.token, govde: { adim: 'oku', belgeId: B.karne } })))
    const onay = await coz(karne.POST(iste('POST', '/api/doktor/asilar/karne', { token: A.token, govde: { adim: 'onayla', belgeId: B.karne, hekimOnayi: true, satirlar: [{ asiAdi: 'KKK', dozNo: 1, uygulamaTarihi: '2025-03-12' }] } })))
    assert.equal(oku.status, 404)
    assert.equal(onay.status, 404)
    assert.equal(modelIstekleri.length, 0)
    assert.equal(asilar().length, 0)
  })
})

describe('ASI-KARNESI-01 — dijital aşı karnesi: Sağlığım bundle + PDF (gerçek rotalar)', () => {
  let portal: typeof import('../../app/api/portal/hasta/[token]/route')
  let portalPdf: typeof import('../../app/api/portal/hasta/[token]/asi-karnesi/pdf/route')
  let hekimPdf: typeof import('../../app/api/doktor/asilar/karne/pdf/route')
  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    ;({ encryptBytes } = await import('../vault/crypto'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    portal = await import('../../app/api/portal/hasta/[token]/route')
    portalPdf = await import('../../app/api/portal/hasta/[token]/asi-karnesi/pdf/route')
    hekimPdf = await import('../../app/api/doktor/asilar/karne/pdf/route')
  })

  it('portal PDF: geçerli token + PIN → 200 PDF; yalnız o hastanın, o doktorun kayıtları; e-Nabız + kaynak ayrımı', async () => {
    const { A } = sahneKur()
    const y = await coz(portalPdf.GET(iste('GET', `/api/portal/hasta/${A.portalToken}/asi-karnesi/pdf`, { cerez: await portalCerezi(A.portalToken) }), prm({ token: A.portalToken })))
    assert.equal(y.status, 200, y.metin.slice(0, 200))
    assert.equal(y.tur, 'application/pdf')
    assert.match(y.ek, /^attachment; filename="asi-karnesi-\d{4}-\d{2}-\d{2}\.pdf"/)
    const t = await pdfMetni(y.bayt)
    assert.ok(t.includes('Hepatit B A-İşaret') && t.includes('KKK A-İşaret'), t.slice(0, 300))
    assert.ok(t.includes('QA Çocuk A Işıkoğlu'), 'hasta adı PDF\'te (Türkçe karakter)')
    assert.ok(!t.includes('Hileli B-GIZLI') && !t.includes('B-İşaret'), 'başka doktorun bu hastaya iliştirdiği kayıt PDF\'e girmez')
    assert.ok(t.includes('e-Nabız') && t.includes('Bu karne bilgi amaçlıdır'))
    assert.ok(t.includes('Karneden aktarıldı · hekim onaylı') && t.includes('Klinikte uygulandı'))
    assert.ok(t.includes('01.03.2099'), 'hekimin girdiği sonraki doz tarihi')
  })

  it('portal PDF: PIN açılmamış → 401; token yok/uydurma → 404; başka hastanın token\'ı yalnız kendi hastasını verir', async () => {
    const { A, B } = sahneKur()
    const pinsiz = await coz(portalPdf.GET(iste('GET', `/api/portal/hasta/${A.portalToken}/asi-karnesi/pdf`), prm({ token: A.portalToken })))
    assert.equal(pinsiz.status, 401)
    const uydurma = await coz(portalPdf.GET(iste('GET', '/api/portal/hasta/yok/asi-karnesi/pdf', { cerez: await portalCerezi('yok') }), prm({ token: 'yok' })))
    assert.equal(uydurma.status, 404)
    const bos = await coz(portalPdf.GET(iste('GET', '/api/portal/hasta//asi-karnesi/pdf'), prm({ token: '' })))
    assert.equal(bos.status, 404)
    // A'nın PIN çerezi B'nin token'ında geçmez (çerez token'a bağlı)
    const capraz = await coz(portalPdf.GET(iste('GET', `/api/portal/hasta/${B.portalToken}/asi-karnesi/pdf`, { cerez: await portalCerezi(A.portalToken) }), prm({ token: B.portalToken })))
    assert.equal(capraz.status, 401)
    const bKendi = await coz(portalPdf.GET(iste('GET', `/api/portal/hasta/${B.portalToken}/asi-karnesi/pdf`, { cerez: await portalCerezi(B.portalToken) }), prm({ token: B.portalToken })))
    const t = await pdfMetni(bKendi.bayt)
    assert.ok(t.includes('KKK B-İşaret') && !t.includes('A-İşaret') && !t.includes('Hileli A-GIZLI'))
  })

  it('portal PDF: aşı kaydı olmayan hasta → 404 (boş karne üretilmez)', async () => {
    const { A } = sahneKur()
    const y = await coz(portalPdf.GET(iste('GET', `/api/portal/hasta/${A.bosPortalToken}/asi-karnesi/pdf`, { cerez: await portalCerezi(A.bosPortalToken) }), prm({ token: A.bosPortalToken })))
    assert.equal(y.status, 404)
  })

  it('Sağlığım bundle: kayıt varsa Aşı Karnesi modülü + veri (her branşta); kirli satır yok; kayıt yoksa modül yok', async () => {
    const { A } = sahneKur()
    const y = await coz(portal.GET(iste('GET', `/api/portal/hasta/${A.portalToken}`, { cerez: await portalCerezi(A.portalToken) }), prm({ token: A.portalToken })))
    assert.equal(y.status, 200, y.metin.slice(0, 200))
    assert.ok(y.json.portal.moduller.includes('asi-karnesi'))
    assert.ok(y.json.portal.nav.some((n: { path: string }) => n.path === '/asi-karnesi'))
    const k = y.json.asiKarnesi
    const yap = k.yapilanlar.map((a: { ad: string; kaynak: string }) => `${a.ad}|${a.kaynak}`)
    assert.ok(yap.includes('Hepatit B A-İşaret|karne') && yap.includes('KKK A-İşaret|klinik'), yap.join())
    assert.deepEqual(k.siradakiler.map((x: { ad: string }) => x.ad), ['Suçiçeği A-İşaret', 'KKK A-İşaret'], 'geçmiş tarih ve 2. dozu kaydedilmiş Hepatit A sıradaki değil')
    assert.ok(!y.metin.includes('Hileli B-GIZLI'))
    assert.match(k.uyari.metin, /e-Nabız/)
    const bos = await coz(portal.GET(iste('GET', `/api/portal/hasta/${A.bosPortalToken}`, { cerez: await portalCerezi(A.bosPortalToken) }), prm({ token: A.bosPortalToken })))
    assert.equal(bos.status, 200)
    assert.equal(bos.json.asiKarnesi, null)
    assert.ok(!bos.json.portal.moduller.includes('asi-karnesi'))
  })

  it('hekim PDF: kendi hastası 200 (portal ile aynı içerik); yabancı hasta 404; oturumsuz 401; sekreter basabilir', async () => {
    const { A, B } = sahneKur()
    const y = await coz(hekimPdf.GET(iste('GET', `/api/doktor/asilar/karne/pdf?patientId=${A.hasta}`, { token: A.token })))
    assert.equal(y.status, 200, y.metin.slice(0, 200))
    assert.equal(y.tur, 'application/pdf')
    const t = await pdfMetni(y.bayt)
    assert.ok(t.includes('Hepatit B A-İşaret') && !t.includes('Hileli B-GIZLI'))
    const p = await coz(portalPdf.GET(iste('GET', `/api/portal/hasta/${A.portalToken}/asi-karnesi/pdf`, { cerez: await portalCerezi(A.portalToken) }), prm({ token: A.portalToken })))
    assert.equal(await pdfMetni(p.bayt), t, 'hekim ve Sağlığım AYNI PDF içeriğini üretir')
    const yabanci = await coz(hekimPdf.GET(iste('GET', `/api/doktor/asilar/karne/pdf?patientId=${B.hasta}`, { token: A.token })))
    assert.equal(yabanci.status, 404)
    assert.ok(!yabanci.metin.includes('B-İşaret'))
    const oturumsuz = await coz(hekimPdf.GET(iste('GET', `/api/doktor/asilar/karne/pdf?patientId=${A.hasta}`)))
    assert.equal(oturumsuz.status, 401)
    const sekreter = await coz(hekimPdf.GET(iste('GET', `/api/doktor/asilar/karne/pdf?patientId=${A.hasta}`, { token: A.sekreterToken })))
    assert.equal(sekreter.status, 200)
  })
})

describe('ASI-KARNESI-01 — hekim onaylı aşı hatırlatması (gerçek rota)', () => {
  let hat: typeof import('../../app/api/doktor/asilar/hatirlatma/route')
  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    ;({ encryptBytes } = await import('../vault/crypto'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    hat = await import('../../app/api/doktor/asilar/hatirlatma/route')
  })
  const konular = (h: Hekim) => db.tablo('hasta_mesaj_konulari').filter((k) => k.patient_id === h.hasta && k.konu === 'Aşı hatırlatması')
  const isaretli = (asiId: string) => db.tablo('asilar').find((a) => a.id === asiId)?.hatirlatma_gonderildi
  const gonder = (h: Hekim, govde: unknown, token = h.token) => coz(hat.POST(iste('POST', '/api/doktor/asilar/hatirlatma', { token, govde })))

  it('liste: yalnız kendi hastası, pencere içi; kirli satır ve sonraki dozu kaydedilmiş satır yok; önizleme metni hazır', async () => {
    const { A } = sahneKur()
    const y = await coz(hat.GET(iste('GET', '/api/doktor/asilar/hatirlatma', { token: A.token })))
    assert.equal(y.status, 200, y.metin)
    const s = y.json.satirlar as Array<Record<string, any>>
    assert.deepEqual(s.map((x) => x.asiAdi), ['Suçiçeği A-İşaret', 'Td A-İşaret'], 'gönderilmemiş önce; 2099 ve Hepatit A (2. doz kayıtlı) yok')
    assert.deepEqual(s.map((x) => [x.durum, x.gonderildi]), [['yaklasiyor', false], ['gecikti', true]])
    assert.equal(s[0].hastaAdi, 'QA Çocuk A Işıkoğlu')
    assert.equal(s[0].portalVar, true)
    assert.match(s[0].onizleme.metin, /^Merhaba, Çocuğunuzun kayıtlı bir sonraki aşı tarihi/)
    assert.ok(!y.metin.includes('GIZLI') && !y.metin.includes('B-İşaret') && !y.metin.includes('QA Çocuk B'), 'başka hekimin hastası listede')
    const tek = await coz(hat.GET(iste('GET', `/api/doktor/asilar/hatirlatma?patientId=${A.hasta}`, { token: A.token })))
    assert.equal(tek.json.satirlar.length, 2)
  })

  it('hekim onayı olmadan GÖNDERİLMEZ: 400, mesaj yok, işaret değişmez', async () => {
    const { A } = sahneKur()
    for (const hekimOnayi of [undefined, false, 'true', 1]) {
      const y = await gonder(A, { asiId: A.yaklasanAsi, hekimOnayi })
      assert.equal(y.status, 400, String(hekimOnayi))
    }
    assert.equal(konular(A).length, 0)
    assert.equal(isaretli(A.yaklasanAsi), false)
  })

  it('onayla → Sağlığım mesajı (önizlemedeki metnin aynısı) + işaret; ikinci gönderim 409, yeni mesaj yok', async () => {
    const { A } = sahneKur()
    const liste = await coz(hat.GET(iste('GET', '/api/doktor/asilar/hatirlatma', { token: A.token })))
    const onizleme = liste.json.satirlar.find((x: { asiId: string }) => x.asiId === A.yaklasanAsi).onizleme
    const y = await gonder(A, { asiId: A.yaklasanAsi, hekimOnayi: true })
    assert.equal(y.status, 200, y.metin)
    assert.equal(isaretli(A.yaklasanAsi), true)
    const k = konular(A)
    assert.equal(k.length, 1)
    assert.equal(k[0].doctor_id, A.id)
    const mesaj = db.tablo('hasta_mesajlar').filter((m) => m.konu_id === k[0].id)
    assert.equal(mesaj.length, 1)
    assert.equal(mesaj[0].metin, onizleme.metin, 'hekimin gördüğü metin gönderilen metin')
    assert.equal(mesaj[0].taraf, 'doktor')
    const tekrar = await gonder(A, { asiId: A.yaklasanAsi, hekimOnayi: true })
    assert.equal(tekrar.status, 409)
    assert.equal(konular(A).length, 1, 'mükerrer mesaj')
    const zaten = await gonder(A, { asiId: A.gecikenAsi, hekimOnayi: true })
    assert.equal(zaten.status, 409, 'önceden gönderilmiş satır')
  })

  it('sekreter listeyi görür ama gönderemez (403); tarihsiz satır 400', async () => {
    const { A } = sahneKur()
    const liste = await coz(hat.GET(iste('GET', '/api/doktor/asilar/hatirlatma', { token: A.sekreterToken })))
    assert.equal(liste.status, 200)
    assert.equal((await gonder(A, { asiId: A.yaklasanAsi, hekimOnayi: true }, A.sekreterToken)).status, 403)
    assert.equal(konular(A).length, 0)
    assert.equal((await gonder(A, { asiId: A.tarihsizAsi, hekimOnayi: true })).status, 400)
  })

  it('başka hekimin aşı kaydı: 404, mesaj yok, işaret değişmez; başka hekimin hastası tek hasta filtresinde 404', async () => {
    const { A, B } = sahneKur()
    const y = await gonder(A, { asiId: B.yaklasanAsi, hekimOnayi: true })
    assert.equal(y.status, 404)
    assert.equal(konular(B).length, 0)
    assert.equal(isaretli(B.yaklasanAsi), false)
    const tek = await coz(hat.GET(iste('GET', `/api/doktor/asilar/hatirlatma?patientId=${B.hasta}`, { token: A.token })))
    assert.equal(tek.status, 404)
    assert.ok(!tek.metin.includes('B-İşaret'))
  })
})
