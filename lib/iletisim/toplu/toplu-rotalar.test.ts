/**
 * NOTYA-HASTA-ILETISIMI-01 hardening — the real route handlers against the in-memory Supabase
 * stand-in: gonder (onay gate, fail-closed missing secret, preview drift 409, auth) and the inbound
 * SMS STOP webhook (secret check, STOP/DUR/İPTAL variants, per-doctor scoping).
 *
 * Synthetic QA data only.
 */
import { describe, it, before, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-toplu-rota-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
const PORTAL_SIRRI = 'qa-sentetik-portal-sirri'

let db = new SahteVeritabani()
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  /** The stand-in does not model unique constraints; add the two the bulk-send idempotency relies on (→ 23505). */
  const tekil = (t: string) => {
    const q = c().from(t)
    const anahtar: Record<string, string[]> = { hasta_iletisim_kampanyalari: ['doctor_id', 'idempotency_key'], hasta_iletisim_kampanya_alicilari: ['kampanya_id', 'patient_id', 'kanal'] }
    if (!anahtar[t]) return q
    return new Proxy(q, {
      get: (h, k) => k === 'insert'
        ? (y: Record<string, unknown>) => {
            if (!db.tablo(t).some((r) => anahtar[t].every((a) => r[a] === y[a]))) return h.insert(y)
            const hata = { data: null, error: { code: '23505', message: 'duplicate key' } }
            return Object.assign(Promise.resolve(hata), { select: () => ({ single: async () => hata }) })
          }
        : h[k as string],
    })
  }
  return { from: (t: string) => tekil(t), auth: { getUser: (j?: string) => c().auth.getUser(j) }, storage: { from: (k: string) => c().storage.from(k) }, rpc: (a: string, x: Record<string, string>) => c().rpc(a, x) }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`test ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let encrypt: (s: string) => string
let encryptPII: (s: string) => string
let Req: typeof import('next/server').NextRequest
let GONDER: any
let WEBHOOK: any

function istek(yol: string, o: { token?: string; govde?: unknown; basliklar?: Record<string, string> } = {}) {
  const b: Record<string, string> = { ...(o.basliklar || {}) }
  if (o.token) b.authorization = `Bearer ${o.token}`
  if (o.govde !== undefined) b['content-type'] = 'application/json'
  return new Req(`http://localhost${yol}`, { method: 'POST', headers: b, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof Req>[1])
}
async function coz(r: Response | Promise<Response>) { const y = await r; const m = await y.text(); let json: any = null; try { json = JSON.parse(m) } catch { /* */ } return { status: y.status, json } }

before(async () => {
  ;({ encrypt, encryptPII } = await import('../../security/encryption'))
  Req = (await import('next/server')).NextRequest
  GONDER = await import('../../../app/api/doktor/iletisim/toplu/gonder/route')
  WEBHOOK = await import('../../../app/api/iletisim/sms/webhook/[doktorId]/route')
})

let A: { id: string; token: string }, B: { id: string; token: string }
function kullanici() { const id = randomUUID(); const token = `qa-${id}`; db.kullanicilar.set(token, { id, email: `${id}@ornek.test` }); return { id, token } }
function hastaEkle(doktorId: string, telefon: string, o: { izinSms?: boolean | null; izinEposta?: boolean | null } = {}) {
  return db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta' })), dob_encrypted: encrypt('1980-01-01'),
    phone_encrypted: encrypt(telefon), email_encrypted: encrypt('qa@ornek.test'),
    iletisim_izni_sms: o.izinSms === undefined ? true : o.izinSms, iletisim_izni_eposta: o.izinEposta === undefined ? true : o.izinEposta, iletisim_izni_whatsapp: null,
  }).id as string
}
beforeEach(() => {
  db = new SahteVeritabani()
  A = kullanici(); B = kullanici()
  db.ekle('users', { id: A.id, full_name: 'QA Hekim A', specialty: 'kardiyoloji', email: 'a@ornek.test' })
  db.ekle('users', { id: B.id, full_name: 'QA Hekim B', specialty: 'pediatri', email: 'b@ornek.test' })
  process.env.PORTAL_TOKEN_SECRET = PORTAL_SIRRI
})
afterEach(() => { process.env.PORTAL_TOKEN_SECRET = PORTAL_SIRRI })

const GOVDE = { filtre: {}, kanal: 'sms', govde: 'Merhaba', idempotencyKey: 'k-1' }
const gonder = (token: string | undefined, govde: unknown) => coz(GONDER.POST(istek('/api/doktor/iletisim/toplu/gonder', { token, govde })))
const kampanyalar = () => db.tablo('hasta_iletisim_kampanyalari')
const alicilar = () => db.tablo('hasta_iletisim_kampanya_alicilari')

describe('POST /api/doktor/iletisim/toplu/gonder', () => {
  it('oturum yok → 401, hiçbir şey yazılmaz', async () => {
    const y = await gonder(undefined, { ...GOVDE, onay: true })
    assert.equal(y.status, 401)
    assert.equal(kampanyalar().length, 0)
  })

  it('onay !== true → 400 (eksik, false, "true" ve 1 dahil) ve kampanya oluşmaz', async () => {
    hastaEkle(A.id, '0532 111 22 33')
    for (const onay of [undefined, false, 'true', 1, null]) {
      const y = await gonder(A.token, { ...GOVDE, ...(onay === undefined ? {} : { onay }) })
      assert.equal(y.status, 400, String(onay))
      assert.match(y.json.error, /onay gereklidir/)
    }
    assert.equal(kampanyalar().length, 0)
    assert.equal(alicilar().length, 0)
  })

  it('geçersiz kanal → 400', async () => {
    const y = await gonder(A.token, { ...GOVDE, kanal: 'whatsapp', onay: true })
    assert.equal(y.status, 400)
    assert.match(y.json.error, /Geçersiz kanal/)
  })

  it('PORTAL_TOKEN_SECRET yok + e-posta kanalı → 503 Türkçe hata, hiçbir şey oluşturulmaz/gönderilmez', async () => {
    hastaEkle(A.id, '0532 111 22 33')
    delete process.env.PORTAL_TOKEN_SECRET
    for (const kanal of ['eposta', 'ikisi']) {
      const y = await gonder(A.token, { ...GOVDE, kanal, onay: true })
      assert.equal(y.status, 503, kanal)
      assert.equal(y.json.kod, 'vazgec_anahtari_yok')
      assert.match(y.json.error, /abonelikten çıkma bağlantısı oluşturulamıyor/)
    }
    assert.equal(kampanyalar().length, 0)
    assert.equal(alicilar().length, 0)
  })

  it('PORTAL_TOKEN_SECRET yok ama yalnız SMS → engellenmez (anahtar hatası dönmez)', async () => {
    delete process.env.PORTAL_TOKEN_SECRET
    const y = await gonder(A.token, { ...GOVDE, kanal: 'sms', onay: true })
    assert.notEqual(y.status, 503)
    assert.equal(kampanyalar().length, 1)
  })

  it('önizleme sapması → 409 ve "önizlemeyi yenileyin" mesajı; kampanya oluşmaz', async () => {
    for (let i = 0; i < 10; i++) hastaEkle(A.id, '0532 111 22 33')
    const y = await gonder(A.token, { ...GOVDE, onay: true, onizlemeHedefSayisi: 2 })
    assert.equal(y.status, 409)
    assert.equal(y.json.kod, 'onizleme_degisti')
    assert.match(y.json.error, /önizlemeyi yenileyip/)
    assert.equal(kampanyalar().length, 0)
  })

  it('SMS gateway bağlı değil → alıcılar gonderici_yok ile atlanır, hiç SMS gitmez; kampanya tamamlandı', async () => {
    hastaEkle(A.id, '0532 111 22 33')
    hastaEkle(B.id, '0532 999 88 77') // başka hekimin hastası kapsama girmez
    const y = await gonder(A.token, { ...GOVDE, onay: true, onizlemeHedefSayisi: 1 })
    assert.equal(y.status, 200, JSON.stringify(y.json))
    assert.equal(y.json.durum, 'tamamlandi')
    assert.equal(y.json.sonuclar.length, 1)
    assert.equal(y.json.sonuclar[0].sebep, 'gonderici_yok')
    assert.ok(alicilar().every((r) => r.doctor_id === A.id))
    assert.equal(y.json.smsManuelListesi.length, 1)
  })

  it('aynı anahtarla ikinci istek aynı kampanyayı döndürür, yeni satır eklemez', async () => {
    hastaEkle(A.id, '0532 111 22 33')
    const y1 = await gonder(A.token, { ...GOVDE, onay: true })
    const satir = alicilar().length
    const y2 = await gonder(A.token, { ...GOVDE, onay: true })
    assert.equal(y2.status, 200)
    assert.equal(y2.json.kampanyaId, y1.json.kampanyaId)
    assert.equal(alicilar().length, satir)
  })

  it('maxDuration tanımlı (Vercel)', () => {
    assert.equal(GONDER.maxDuration, 300)
  })
})

describe('POST /api/iletisim/sms/webhook/[doktorId] — STOP/DUR/İPTAL', () => {
  const SIR = 'qa-webhook-sirri'
  const TEL = '0532 111 22 33'
  const wh = (doktorId: string, govde: unknown, sir: string | null = SIR) =>
    coz(WEBHOOK.POST(istek(`/api/iletisim/sms/webhook/${doktorId}`, { govde, basliklar: sir === null ? {} : { 'x-notya-webhook-secret': sir } }), { params: Promise.resolve({ doktorId }) }))
  const izin = (id: string) => db.tablo('patients').find((p) => p.id === id)!.iletisim_izni_sms

  beforeEach(() => { db.ekle('iletisim_sms_ayarlari', { doctor_id: A.id, webhook_sirri_encrypted: encryptPII(SIR) }) })

  for (const metin of ['STOP', 'stop', ' Stop ', 'STOP.', 'DUR', 'dur', 'İPTAL', 'iptal', 'IPTAL']) {
    it(`geçerli sır + "${metin}" → o hekimin hastasının SMS izni kapanır ve kayıt düşer`, async () => {
      const hasta = hastaEkle(A.id, TEL)
      const y = await wh(A.id, { phoneNumber: '+905321112233', message: metin })
      assert.equal(y.status, 200)
      assert.equal(izin(hasta), false, metin)
      assert.equal(db.tablo('iletisim_izin_kayitlari').filter((k) => k.patient_id === hasta && k.kaynak === 'vazgecme' && k.izin === false).length, 1)
    })
  }

  it('farklı gövde alan adları (from/text) da çalışır', async () => {
    const hasta = hastaEkle(A.id, TEL)
    await wh(A.id, { from: '905321112233', text: 'STOP' })
    assert.equal(izin(hasta), false)
  })

  it('yanlış sır → 200 döner ama hiçbir şey değişmez', async () => {
    const hasta = hastaEkle(A.id, TEL)
    const y = await wh(A.id, { phoneNumber: '+905321112233', message: 'STOP' }, 'yanlis-sir')
    assert.equal(y.status, 200)
    assert.equal(izin(hasta), true)
    assert.equal(db.tablo('iletisim_izin_kayitlari').length, 0)
  })

  it('sır başlığı yok / boş → değişmez', async () => {
    const hasta = hastaEkle(A.id, TEL)
    await wh(A.id, { phoneNumber: '+905321112233', message: 'STOP' }, null)
    await wh(A.id, { phoneNumber: '+905321112233', message: 'STOP' }, '')
    assert.equal(izin(hasta), true)
  })

  it('sır sadece önek/uzantı olarak eşleşirse kabul edilmez', async () => {
    const hasta = hastaEkle(A.id, TEL)
    await wh(A.id, { phoneNumber: '+905321112233', message: 'STOP' }, SIR.slice(0, -1))
    await wh(A.id, { phoneNumber: '+905321112233', message: 'STOP' }, `${SIR}x`)
    assert.equal(izin(hasta), true)
  })

  it('STOP olmayan mesaj → değişmez', async () => {
    const hasta = hastaEkle(A.id, TEL)
    await wh(A.id, { phoneNumber: '+905321112233', message: 'Merhaba, randevu almak istiyorum' })
    await wh(A.id, { phoneNumber: '+905321112233', message: 'stop lütfen' })
    assert.equal(izin(hasta), true)
  })

  it('hekim kapsamı: aynı numaralı başka hekimin hastası etkilenmez', async () => {
    const hastaA = hastaEkle(A.id, TEL)
    const hastaB = hastaEkle(B.id, TEL)
    await wh(A.id, { phoneNumber: '+905321112233', message: 'STOP' })
    assert.equal(izin(hastaA), false)
    assert.equal(izin(hastaB), true, 'B hekimin hastası dokunulmamış olmalı')
  })

  it("hekim kapsamı: A'nın sırrı B'nin adresinde işe yaramaz (B'nin kendi sırrı yoksa hiçbir şey olmaz)", async () => {
    const hastaB = hastaEkle(B.id, TEL)
    const y = await wh(B.id, { phoneNumber: '+905321112233', message: 'STOP' }, SIR)
    assert.equal(y.status, 200)
    assert.equal(izin(hastaB), true)
  })

  it('pasif hasta ve UUID olmayan doktorId yok sayılır', async () => {
    const pasif = hastaEkle(A.id, TEL)
    db.tablo('patients').find((p) => p.id === pasif)!.is_active = false
    await wh(A.id, { phoneNumber: '+905321112233', message: 'STOP' })
    assert.equal(izin(pasif), true)
    const y = await wh('../../etc', { phoneNumber: '+905321112233', message: 'STOP' })
    assert.equal(y.status, 200)
  })
})
