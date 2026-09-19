/**
 * ASI-KARNESI-01 — aşı rotaları GERÇEK handler'larla (yalnız veritabanı, oturum ve model sahte).
 *
 *  Karne okuma / toplu onay (app/api/doktor/asilar/karne):
 *   - okunan satırlar onaysız KAYDEDİLMEZ — sunucuda da (hekimOnayi yoksa, okunamadı satır düzeltilmemişse 400, 0 satır)
 *   - toplu onay + satır düzeltme: hekimin düzelttiği değer kaydedilene aynen yansır; kaynak='beyan' + kanıt izi
 *   - 'oku' asilar'a hiçbir şey yazmaz; okunamayan satır "okunamadı" gelir, tarih/doz uydurulmaz
 *   - karne okuma 'goruntu-inceleme' → GÜÇLÜ kademe (HIZLI'ya düşmez), model adı çağrı yerinde yazılmaz
 *   - sekreter karneyi okutamaz / onaylayamaz (klinik karar)
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

type Hekim = { id: string; token: string; hasta: string; karne: string; sekreterToken: string }
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
  return { id, token, hasta, karne, sekreterToken }
}
function sahneKur() {
  db = new SahteVeritabani()
  modelIstekleri.length = 0
  return { A: hekimKur('A'), B: hekimKur('B') }
}
const asilar = () => db.tablo('asilar')

function iste(yontem: string, yol: string, o: { token?: string; govde?: unknown; cerez?: string } = {}) {
  const h: Record<string, string> = {}
  if (o.token) h.authorization = `Bearer ${o.token}`
  if (o.govde !== undefined) h['content-type'] = 'application/json'
  if (o.cerez) h.cookie = o.cerez
  return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: h, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined })
}
async function coz(r: Response | Promise<Response>) {
  const y = await r
  const metin = await y.text()
  let json: any = null
  try { json = JSON.parse(metin) } catch { /* ikili yanıt */ }
  return { status: y.status, metin, json }
}

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
