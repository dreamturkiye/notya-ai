/**
 * NETGSM-01 — provider selection, the settings route, the bulk-send channel status and the opt-out
 * footer, through the REAL route handlers against the in-memory Supabase stand-in. The NetGSM / Android
 * HTTP endpoints are a mocked fetch; nothing here talks to a live provider.
 *
 * Covers: default provider stays the Android gateway; sms-ayarlari is doctor-only (personel 403) and never
 * returns a credential; sms-durum is open to personel but carries no credential; credentials are encrypted
 * at rest; the footer never promises STOP for NetGSM (and does for Android); a provider switch mid-send is
 * refused instead of mis-sending; opted-out patients stay excluded.
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
type Cagri = { url: string; init: RequestInit }
let cagrilar: Cagri[] = []
let netgsmYanit: (c: Cagri) => Response = () => new Response(JSON.stringify({ code: '00', jobid: 'J-1' }), { status: 200 })
globalThis.fetch = (async (g: unknown, init?: RequestInit) => {
  const c = { url: String(g), init: init || {} }
  cagrilar.push(c)
  if (c.url.startsWith('https://api.netgsm.com.tr/') || c.url.startsWith('https://android.ornek.test/')) return netgsmYanit(c)
  throw new Error(`test ağ erişimi yapamaz: ${String(g)}`)
}) as typeof fetch

let encrypt: (s: string) => string
let encryptPII: (s: string) => string
let Req: typeof import('next/server').NextRequest
let GONDER: any
let AYARLAR: any
let DURUM: any
let AYAR: typeof import('./ayar')

function istek(yol: string, o: { token?: string; govde?: unknown; basliklar?: Record<string, string>; metot?: string } = {}) {
  const b: Record<string, string> = { ...(o.basliklar || {}) }
  if (o.token) b.authorization = `Bearer ${o.token}`
  if (o.govde !== undefined) b['content-type'] = 'application/json'
  return new Req(`http://localhost${yol}`, { method: o.metot || 'POST', headers: b, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof Req>[1])
}
async function coz(r: Response | Promise<Response>) { const y = await r; const m = await y.text(); let json: any = null; try { json = JSON.parse(m) } catch { /* */ } return { status: y.status, json } }

before(async () => {
  ;({ encrypt, encryptPII } = await import('../../security/encryption'))
  Req = (await import('next/server')).NextRequest
  GONDER = await import('../../../app/api/doktor/iletisim/toplu/gonder/route')
  AYARLAR = await import('../../../app/api/doktor/iletisim/toplu/sms-ayarlari/route')
  DURUM = await import('../../../app/api/doktor/iletisim/toplu/sms-durum/route')
  AYAR = await import('./ayar')
})

let A: { id: string; token: string }, B: { id: string; token: string }, S: { id: string; token: string; personelId: string }
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
  const sk = kullanici()
  const personelId = db.ekle('personel', { doktor_id: A.id, user_id: sk.id, ad_soyad: 'QA Sekreter', email: 's@ornek.test', rol: 'sekreter', aktif: true }).id as string
  S = { ...sk, personelId }
  cagrilar = []
  netgsmYanit = () => new Response(JSON.stringify({ code: '00', jobid: 'J-1' }), { status: 200 })
  process.env.PORTAL_TOKEN_SECRET = PORTAL_SIRRI
})
afterEach(() => { process.env.PORTAL_TOKEN_SECRET = PORTAL_SIRRI })


const SIFRE = 'qa-NETGSM-gizli-sifre-42'
const KOD = '8501234567'
const NG_GOVDE = { saglayici: 'netgsm', netgsmKullaniciKodu: KOD, netgsmSifre: SIFRE, netgsmBaslik: 'DRQAKLINIK', aktif: true }
const ANDROID_GOVDE = { saglayici: 'android_sms_gateway', tabanUrl: 'https://android.ornek.test', kullaniciAdi: 'kul', sifre: 'android-sifre-1', aktif: true }
const kaydet = (token: string | undefined, govde: unknown) => coz(AYARLAR.POST(istek('/api/doktor/iletisim/toplu/sms-ayarlari', { token, govde })))
const oku = (token: string | undefined) => coz(AYARLAR.GET(istek('/api/doktor/iletisim/toplu/sms-ayarlari', { token, metot: 'GET' })))
const durum = (token: string | undefined) => coz(DURUM.GET(istek('/api/doktor/iletisim/toplu/sms-durum', { token, metot: 'GET' })))
const satir = (id: string) => db.tablo('iletisim_sms_ayarlari').find((r) => r.doctor_id === id)
const GONDER_GOVDE = { filtre: {}, kanal: 'sms', govde: 'Merhaba, randevu hatırlatması.', onay: true }
const gonder = (token: string | undefined, o: Record<string, unknown> = {}) => coz(GONDER.POST(istek('/api/doktor/iletisim/toplu/gonder', { token, govde: { ...GONDER_GOVDE, idempotencyKey: `k-${randomUUID()}`, ...o } })))
const gidenMetin = () => {
  const c = cagrilar.find((x) => x.url.endsWith('/sms/rest/v2/send') || x.url.endsWith('/message'))
  if (!c) return null
  const b = JSON.parse(String(c.init.body))
  return String(b.messages ? b.messages[0].msg : b.message)
}
const SIFRELER = [SIFRE, 'android-sifre-1']
const sizdirmaYok = (v: unknown) => { const s = JSON.stringify(v); for (const x of SIFRELER) assert.ok(!s.includes(x), `yanıtta kimlik bilgisi var: ${x}`) }

describe('sağlayıcı seçimi — varsayılan Android kalır', () => {
  it('ayar satırı olmayan hekim: SMS bağlı değil (null), durum "hazır değil"', async () => {
    assert.equal(await AYAR.smsAyarGetir(db.istemci() as any, A.id), null)
    const y = await durum(A.token)
    assert.equal(y.status, 200)
    assert.equal(y.json.saglayici, null)
    assert.equal(y.json.hazir, false)
  })

  it('saglayici verilmeden kaydedilen (eski istemci) ayar Android olarak okunur ve eskisi gibi çalışır', async () => {
    const { saglayici: _s, ...eski } = ANDROID_GOVDE
    const y = await kaydet(A.token, eski)
    assert.equal(y.status, 200, JSON.stringify(y.json))
    assert.equal(satir(A.id)!.saglayici, 'android_sms_gateway')
    const ayar = await AYAR.smsAyarGetir(db.istemci() as any, A.id)
    assert.equal(ayar!.saglayici, 'android_sms_gateway')
    assert.equal((ayar as any).tabanUrl, 'https://android.ornek.test')
  })

  it('bilinmeyen saglayici değeri Android’e düşer (NetGSM yalnızca açıkça "netgsm" ile)', () => {
    for (const x of [undefined, null, '', 'twilio', 'NETGSM', 'netgsm ', 5]) assert.equal(AYAR.smsSaglayiciAdi(x), 'android_sms_gateway')
    assert.equal(AYAR.smsSaglayiciAdi('netgsm'), 'netgsm')
  })

  it('Android satırı okunurken yalnızca migration 166 sütunları gerekir (NetGSM sütunları ilk sorguda istenmez)', async () => {
    await kaydet(A.token, ANDROID_GOVDE)
    const ayar = await AYAR.smsAyarGetir(db.istemci() as any, A.id)
    assert.equal(ayar!.saglayici, 'android_sms_gateway')
  })

  it('Android ile gönderim: eski STOP satırı eklenir ve /message adresine gider', async () => {
    await kaydet(A.token, ANDROID_GOVDE)
    hastaEkle(A.id, '0532 111 22 33')
    const y = await gonder(A.token)
    assert.equal(y.status, 200, JSON.stringify(y.json))
    assert.equal(y.json.sonuclar[0].durum, 'gonderildi')
    const m = gidenMetin()!
    assert.match(m, /STOP yazıp gönderin\.$/)
    assert.ok(cagrilar.every((c) => !c.url.includes('netgsm')), 'Android hekim NetGSM’e hiç çıkmaz')
  })
})

describe('POST /sms-ayarlari — yalnızca hekim', () => {
  it('oturum yok → 401; sekreter (personel) → 403 ve hiçbir satır yazılmaz', async () => {
    assert.equal((await kaydet(undefined, NG_GOVDE)).status, 401)
    const y = await kaydet(S.token, NG_GOVDE)
    assert.equal(y.status, 403)
    assert.equal(db.tablo('iletisim_sms_ayarlari').length, 0)
    assert.equal((await oku(S.token)).status, 403, 'sekreter ayarı okuyamaz da')
  })

  it('hekim NetGSM kaydeder: şifre şifreli saklanır, düz metin hiçbir yerde yok; yanıtta kimlik bilgisi yok', async () => {
    const y = await kaydet(A.token, NG_GOVDE)
    assert.equal(y.status, 200, JSON.stringify(y.json))
    sizdirmaYok(y.json)
    const r = satir(A.id)!
    assert.equal(r.saglayici, 'netgsm')
    assert.equal(r.netgsm_kullanici_adi, KOD)
    assert.equal(r.netgsm_baslik, 'DRQAKLINIK')
    assert.notEqual(r.netgsm_sifre_encrypted, SIFRE)
    assert.ok(!JSON.stringify(r).includes(SIFRE), 'veritabanı satırında düz şifre olmamalı')
    assert.equal(y.json.webhookSirriYeni, null, 'NetGSM için webhook sırrı üretilmez (gelen STOP yok)')
    assert.equal(y.json.webhookUrl, null)
    assert.equal(r.webhook_sirri_encrypted ?? null, null)
    const g = await oku(A.token)
    sizdirmaYok(g.json)
    assert.equal(g.json.ayar.saglayici, 'netgsm')
    assert.equal(g.json.ayar.netgsm.sifreVar, true)
    assert.equal(g.json.ayar.netgsm.kullaniciKodu, KOD)
  })

  it('şifre boş bırakılırsa kayıtlı olan korunur; ilk kayıtta şifre zorunlu', async () => {
    const ilk = await kaydet(A.token, { ...NG_GOVDE, netgsmSifre: '' })
    assert.equal(ilk.status, 400)
    assert.match(ilk.json.error, /şifresi zorunludur/)
    await kaydet(A.token, NG_GOVDE)
    const once = satir(A.id)!.netgsm_sifre_encrypted
    const y = await kaydet(A.token, { ...NG_GOVDE, netgsmSifre: null, netgsmBaslik: 'YENIBASLIK' })
    assert.equal(y.status, 200)
    assert.equal(satir(A.id)!.netgsm_sifre_encrypted, once)
    assert.equal(satir(A.id)!.netgsm_baslik, 'YENIBASLIK')
  })

  it('etkinken kullanıcı kodu ve başlık zorunlu; kontrol karakteri / aşırı uzun değer reddedilir', async () => {
    assert.equal((await kaydet(A.token, { ...NG_GOVDE, netgsmKullaniciKodu: '' })).status, 400)
    assert.equal((await kaydet(A.token, { ...NG_GOVDE, netgsmBaslik: ' ' })).status, 400)
    assert.equal((await kaydet(A.token, { ...NG_GOVDE, netgsmBaslik: 'AB\nCD' })).status, 400)
    assert.equal((await kaydet(A.token, { ...NG_GOVDE, netgsmBaslik: 'X'.repeat(41) })).status, 400)
    assert.equal(db.tablo('iletisim_sms_ayarlari').length, 0)
  })

  it('başka hekimin ayarına dokunulmaz: A’nın kaydı B’nin satırını etkilemez', async () => {
    await kaydet(B.token, ANDROID_GOVDE)
    await kaydet(A.token, NG_GOVDE)
    assert.equal(satir(B.id)!.saglayici, 'android_sms_gateway')
    assert.equal(satir(A.id)!.saglayici, 'netgsm')
    sizdirmaYok((await oku(B.token)).json)
  })

  it('bağlantı testi (NetGSM): yalnızca msgheader + balance çağrılır, /send asla; sonuçta kredi ve başlık durumu var, kimlik bilgisi yok', async () => {
    netgsmYanit = (c) => new Response(JSON.stringify(c.url.endsWith('/balance') ? { balance: '42,5' } : { code: '00', msgheader: ['DRQAKLINIK'] }), { status: 200 })
    const y = await kaydet(A.token, { ...NG_GOVDE, test: true })
    assert.equal(y.status, 200, JSON.stringify(y.json))
    assert.equal(y.json.baglantiTest.ok, true)
    assert.equal(y.json.baglantiTest.kredi, 42.5)
    assert.equal(y.json.baglantiTest.baslikOnayli, true)
    assert.deepEqual(cagrilar.map((c) => c.url), ['https://api.netgsm.com.tr/sms/rest/v2/msgheader', 'https://api.netgsm.com.tr/balance'])
    sizdirmaYok(y.json)
  })

  it('bağlantı testi: NetGSM kimlik reddederse hata Türkçe ve doğrudan gösterilir', async () => {
    netgsmYanit = () => new Response(JSON.stringify({ code: '30' }), { status: 200 })
    const y = await kaydet(A.token, { ...NG_GOVDE, test: true })
    assert.equal(y.json.baglantiTest.ok, false)
    assert.match(y.json.baglantiTest.hata, /kullanıcı kodu veya şifresi kabul edilmedi/)
    sizdirmaYok(y.json)
  })

  it('Android’den NetGSM’e ve geri geçiş: seçim saklanır, diğer sağlayıcının bilgileri silinmez', async () => {
    await kaydet(A.token, ANDROID_GOVDE)
    await kaydet(A.token, NG_GOVDE)
    assert.equal((await AYAR.smsAyarGetir(db.istemci() as any, A.id))!.saglayici, 'netgsm')
    await kaydet(A.token, { ...ANDROID_GOVDE, sifre: null })
    const geri = await AYAR.smsAyarGetir(db.istemci() as any, A.id)
    assert.equal(geri!.saglayici, 'android_sms_gateway')
    assert.equal(satir(A.id)!.netgsm_kullanici_adi, KOD, 'NetGSM bilgileri durur')
  })
})

describe('GET /sms-durum — gönderim ekranı hangi kanalın göndereceğini gösterir', () => {
  it('sekreter de okuyabilir; NetGSM: etiket + canlı kredi + vazgeçme satırı; kimlik bilgisi yok', async () => {
    await kaydet(A.token, NG_GOVDE)
    cagrilar = []
    netgsmYanit = () => new Response(JSON.stringify({ balance: '7,5' }), { status: 200 })
    const y = await durum(S.token)
    assert.equal(y.status, 200)
    assert.equal(y.json.saglayici, 'netgsm')
    assert.equal(y.json.hazir, true)
    assert.match(y.json.etiket, /NetGSM.*DRQAKLINIK/)
    assert.deepEqual(y.json.kredi, { deger: 7.5 })
    assert.equal(y.json.vazgecYakalanir, false)
    assert.doesNotMatch(y.json.vazgecSatiri, /STOP/)
    sizdirmaYok(y.json)
    assert.equal(JSON.stringify(y.json).includes(KOD), false, 'kullanıcı kodu da dönmez')
  })

  it('NetGSM kredi okunamazsa kredi.deger null ve hata metni var, 200 döner', async () => {
    await kaydet(A.token, NG_GOVDE)
    netgsmYanit = () => new Response(JSON.stringify({ code: '30' }), { status: 200 })
    const y = await durum(A.token)
    assert.equal(y.status, 200)
    assert.equal(y.json.kredi.deger, null)
    assert.ok(y.json.kredi.hata)
  })

  it('Android: etiket, STOP satırı, kredi alanı yok ve NetGSM’e hiç çıkılmaz', async () => {
    await kaydet(A.token, ANDROID_GOVDE)
    cagrilar = []
    const y = await durum(A.token)
    assert.equal(y.json.saglayici, 'android_sms_gateway')
    assert.equal(y.json.vazgecYakalanir, true)
    assert.match(y.json.vazgecSatiri, /STOP/)
    assert.equal(y.json.kredi, undefined)
    assert.equal(cagrilar.length, 0)
  })

  it('pasif (aktif:false) bağlantı → hazır değil; oturum yok → 401; başka hekimin ayarı görünmez', async () => {
    await kaydet(A.token, { ...NG_GOVDE, aktif: false })
    assert.equal((await durum(A.token)).json.hazir, false)
    assert.equal((await durum(undefined)).status, 401)
    await kaydet(B.token, NG_GOVDE)
    assert.equal((await durum(A.token)).json.hazir, false, 'A pasif; B’nin etkin ayarı A’ya sızmaz')
  })
})

describe('vazgeçme (STOP) satırı doğruluk kuralı', () => {
  it('NetGSM ile giden SMS "STOP yazın" demez; kliniği aramayı söyler ve gerçekten NetGSM’e gider', async () => {
    await kaydet(A.token, NG_GOVDE)
    hastaEkle(A.id, '0532 111 22 33')
    const y = await gonder(A.token)
    assert.equal(y.status, 200, JSON.stringify(y.json))
    assert.equal(y.json.sonuclar[0].durum, 'gonderildi')
    const m = gidenMetin()!
    assert.ok(m.startsWith('Merhaba, randevu hatırlatması.'))
    assert.doesNotMatch(m, /STOP/i, 'sistemin yapmadığı bir şeyi vaat etmemeli')
    assert.match(m, /muayenehanemizi arayarak bildirebilirsiniz\.$/)
    assert.match(m, /112/)
    const c = cagrilar.find((x) => x.url.endsWith('/send'))!
    assert.equal(c.url, 'https://api.netgsm.com.tr/sms/rest/v2/send')
    assert.equal(JSON.parse(String(c.init.body)).messages[0].no, '5321112233')
    assert.equal(db.tablo('hasta_iletisim_kampanya_alicilari')[0].saglayici_mesaj_id, 'J-1')
  })

  it('smsVazgecSatiri: yalnızca android STOP der', async () => {
    const { smsVazgecSatiri, TOPLU_SMS_VAZGEC_SATIRI } = await import('../toplu/sablonlar')
    assert.equal(smsVazgecSatiri('android_sms_gateway'), TOPLU_SMS_VAZGEC_SATIRI)
    assert.equal(smsVazgecSatiri(undefined), TOPLU_SMS_VAZGEC_SATIRI)
    assert.doesNotMatch(smsVazgecSatiri('netgsm'), /STOP/i)
  })

  it('izin vermeyen (iletisim_izni_sms=false) ve izni olmayan (null) hastaya NetGSM’den de SMS gitmez', async () => {
    await kaydet(A.token, NG_GOVDE)
    hastaEkle(A.id, '0532 111 22 33', { izinSms: false })
    hastaEkle(A.id, '0532 111 22 34', { izinSms: null })
    const tamam = hastaEkle(A.id, '0532 111 22 35')
    const y = await gonder(A.token)
    assert.equal(y.status, 200)
    const gonderilen = cagrilar.filter((c) => c.url.endsWith('/send'))
    assert.equal(gonderilen.length, 1)
    assert.equal(JSON.parse(String(gonderilen[0].init.body)).messages[0].no, '5321112235')
    assert.equal(y.json.sonuclar.filter((s: any) => s.sebep === 'izin_yok').length, 2)
    assert.ok(tamam)
  })

  it('NetGSM hatası alıcıda "basarisiz" olarak Türkçe nedenle kaydedilir; kampanya yine tamamlanır', async () => {
    await kaydet(A.token, NG_GOVDE)
    hastaEkle(A.id, '0532 111 22 33')
    netgsmYanit = () => new Response(JSON.stringify({ code: '40' }), { status: 200 })
    const y = await gonder(A.token)
    assert.equal(y.status, 200)
    assert.equal(y.json.sonuclar[0].durum, 'basarisiz')
    assert.match(y.json.sonuclar[0].sebep, /başlığı \(gönderici adı\) NetGSM hesabınızda tanımlı değil/)
    assert.equal(db.tablo('hasta_iletisim_kampanya_alicilari')[0].durum, 'basarisiz')
    sizdirmaYok(db.tablo('hasta_iletisim_kampanya_alicilari'))
  })

  it('sağlayıcı gönderim sırasında değişirse (footer başka kanal içindi) alıcıya GİTMEZ', async () => {
    await kaydet(A.token, NG_GOVDE)
    const { smsGonder } = await import('./gonderici')
    const sup = db.istemci()
    // metin Android için (STOP satırlı) yazıldı ama bağlantı artık NetGSM
    const r = await smsGonder(sup as any, { doktorId: A.id, patientId: 'p', alici: '+905321112233', metin: 'x STOP yazıp gönderin.', beklenenSaglayici: 'android_sms_gateway' })
    assert.equal(r.ok, false)
    assert.match((r as any).hata, /değiştirildi/)
    assert.equal(cagrilar.filter((c) => c.url.endsWith('/send')).length, 0)
  })

  it('kayıtlı sağlayıcı "netgsm" ama NetGSM bilgileri eksikse (şifre yok) hazır değil: sessizce Android’e düşmez', async () => {
    db.ekle('iletisim_sms_ayarlari', { doctor_id: A.id, saglayici: 'netgsm', aktif: true, taban_url: 'https://android.ornek.test', kullanici_adi: 'k', sifre_encrypted: 'x' })
    assert.equal(await AYAR.smsAyarGetir(db.istemci() as any, A.id), null)
  })
})
