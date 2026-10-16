/**
 * NOTYA-HASTA-ILETISIMI-01 hardening — android-sms-gateway client (fetch mocked: success, non-2xx,
 * timeout, network error, redirect refusal) and the SSRF guard on the doctor-supplied base URL.
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { androidGatewayGonder, androidGatewayBaglantiTest } from './androidGateway'
import { gatewayUrlDogrula } from './gatewayUrl'
import type { SmsAyar } from './tipler'

const AYAR: SmsAyar = { saglayici: 'android_sms_gateway', tabanUrl: 'https://sms.ornek-klinik.test', kullaniciAdi: 'kullanici', sifre: 'sifre', gonderenNumara: null, aktif: true }
const gercekFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = gercekFetch; delete process.env.SMS_GATEWAY_IZINLI_HOSTLAR })

function fetchSahtesi(yanit: () => Promise<Response> | Response) {
  const cagrilar: { url: string; init: RequestInit }[] = []
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => { cagrilar.push({ url: String(url), init: init || {} }); return yanit() }) as typeof fetch
  return cagrilar
}

describe('androidGatewayGonder', () => {
  it('başarı: /message adresine Basic auth + E.164 alıcıyla POST eder, sağlayıcı id döner', async () => {
    const c = fetchSahtesi(() => new Response(JSON.stringify({ id: 'msg-1', state: 'Pending' }), { status: 200 }))
    const r = await androidGatewayGonder(AYAR, '+905321112233', 'Merhaba')
    assert.deepEqual(r, { ok: true, saglayiciMesajId: 'msg-1' })
    assert.equal(c.length, 1)
    assert.equal(c[0].url, 'https://sms.ornek-klinik.test/message')
    assert.equal(c[0].init.method, 'POST')
    assert.equal((c[0].init.headers as Record<string, string>).Authorization, `Basic ${Buffer.from('kullanici:sifre').toString('base64')}`)
    assert.deepEqual(JSON.parse(String(c[0].init.body)), { message: 'Merhaba', phoneNumbers: ['+905321112233'] })
    assert.equal(c[0].init.redirect, 'error', 'yönlendirme takip edilmemeli')
  })

  it('başarı: gövdesiz 201 de kabul edilir (id yok)', async () => {
    fetchSahtesi(() => new Response('', { status: 201 }))
    assert.deepEqual(await androidGatewayGonder(AYAR, '+905321112233', 'x'), { ok: true, saglayiciMesajId: undefined })
  })

  it('2xx dışı: durum kodu + gövde ile hata, atmaz', async () => {
    fetchSahtesi(() => new Response('kimlik doğrulama başarısız', { status: 401 }))
    const r = await androidGatewayGonder(AYAR, '+905321112233', 'x')
    assert.equal(r.ok, false)
    assert.match((r as { hata: string }).hata, /^Gateway 401: kimlik doğrulama/)
  })

  it('zaman aşımı: abort edilirse okunur bir hata döner', async () => {
    globalThis.fetch = ((_u: unknown, init?: RequestInit) => new Promise((_res, rej) => {
      init?.signal?.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; rej(e) })
    })) as typeof fetch
    const t = setTimeout.bind(globalThis)
    // shrink the 15 s client timeout for the test by firing timers immediately
    const onceki = globalThis.setTimeout
    globalThis.setTimeout = ((fn: () => void) => t(fn, 0)) as unknown as typeof setTimeout
    try {
      const r = await androidGatewayGonder(AYAR, '+905321112233', 'x')
      assert.deepEqual(r, { ok: false, hata: 'Gateway zaman aşımına uğradı.' })
    } finally { globalThis.setTimeout = onceki }
  })

  it('ağ hatası: atmaz, { ok:false } döner', async () => {
    fetchSahtesi(() => { throw new TypeError('fetch failed') })
    const r = await androidGatewayGonder(AYAR, '+905321112233', 'x')
    assert.equal(r.ok, false)
    assert.match((r as { hata: string }).hata, /bağlanılamadı: fetch failed/i)
  })

  it('güvensiz taban adres (kayıtlı eski değer) çağrılmaz: ağa hiç çıkılmaz', async () => {
    const c = fetchSahtesi(() => new Response('{}', { status: 200 }))
    for (const url of ['http://169.254.169.254', 'https://127.0.0.1', 'http://sms.ornek.test', 'https://10.0.0.5']) {
      const r = await androidGatewayGonder({ ...AYAR, tabanUrl: url }, '+905321112233', 'x')
      assert.equal(r.ok, false, url)
    }
    assert.equal(c.length, 0)
  })
})

describe('androidGatewayBaglantiTest', () => {
  it('200 → ok, 401 → şifre reddedildi, 500 → durum kodu', async () => {
    fetchSahtesi(() => new Response('ok', { status: 200 }))
    assert.deepEqual(await androidGatewayBaglantiTest(AYAR), { ok: true })
    fetchSahtesi(() => new Response('', { status: 401 }))
    assert.deepEqual(await androidGatewayBaglantiTest(AYAR), { ok: false, hata: 'Kullanıcı adı/şifre reddedildi.' })
    fetchSahtesi(() => new Response('', { status: 500 }))
    assert.deepEqual(await androidGatewayBaglantiTest(AYAR), { ok: false, hata: 'Gateway 500 döndürdü.' })
  })
})

describe('gatewayUrlDogrula — SSRF koruması', () => {
  const kabul = ['https://api.sms-gate.app/3rdparty/v1', 'https://sms.ornek-klinik.test', 'https://sms.ornek-klinik.test:8443/', 'https://8.8.8.8', 'https://[2606:4700:4700::1111]']
  const red = [
    'http://sms.ornek-klinik.test', // plain http
    'ftp://sms.ornek-klinik.test', 'file:///etc/passwd', 'javascript:alert(1)', 'sms.ornek-klinik.test', '',
    'https://localhost', 'https://localhost:3000', 'https://a.localhost', 'https://127.0.0.1', 'https://127.1.2.3', 'https://0.0.0.0',
    'https://2130706433', // decimal 127.0.0.1 — URL parser canonicalises it
    'https://0x7f.0.0.1',
    'https://10.1.2.3', 'https://172.16.0.1', 'https://172.31.255.255', 'https://192.168.1.10', 'https://100.64.0.1',
    'https://169.254.169.254', 'https://169.254.169.254/latest/meta-data', 'https://metadata.google.internal', 'https://224.0.0.1', 'https://255.255.255.255',
    'https://[::1]', 'https://[::]', 'https://[fd00::1]', 'https://[fe80::1]', 'https://[::ffff:127.0.0.1]', 'https://[::ffff:10.0.0.1]', 'https://[::ffff:a9fe:a9fe]',
    'https://intranet', 'https://yazici.local', 'https://kullanici:sifre@sms.ornek-klinik.test', 'https://sms.ornek-klinik.test?x=1', 'https://sms.ornek-klinik.test/#f',
  ]
  for (const u of kabul) it(`kabul: ${u}`, () => assert.equal(gatewayUrlDogrula(u).ok, true, u))
  for (const u of red) it(`red: ${u || '(boş)'}`, () => assert.equal(gatewayUrlDogrula(u).ok, false, u))

  it('sondaki / temizlenir', () => {
    assert.deepEqual(gatewayUrlDogrula('https://sms.ornek-klinik.test/api/'), { ok: true, url: 'https://sms.ornek-klinik.test/api' })
  })

  it('belgelenmiş istisna: operatörün env izin listesindeki host (http/özel adres dahil) kabul edilir, diğerleri hâlâ reddedilir', () => {
    process.env.SMS_GATEWAY_IZINLI_HOSTLAR = 'sms.ic-ag.ornek, 192.168.1.50'
    assert.equal(gatewayUrlDogrula('http://sms.ic-ag.ornek:8080').ok, true)
    assert.equal(gatewayUrlDogrula('http://192.168.1.50:8080').ok, true)
    assert.equal(gatewayUrlDogrula('http://192.168.1.51').ok, false)
    assert.equal(gatewayUrlDogrula('http://169.254.169.254').ok, false)
  })
})
