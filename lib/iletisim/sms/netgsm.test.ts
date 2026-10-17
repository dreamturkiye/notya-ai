/**
 * NETGSM-01 — NetGSM adapter with a mocked fetch: success, every documented send error code, HTTP 406,
 * timeout, malformed / empty responses, Turkish characters, long messages, phone formatting, the
 * non-sending connection test (approved sender names + credit), and "credentials never in logs".
 *
 * Nothing here talks to the live NetGSM API (see docs/OPEN-COMMITMENTS.md NETGSM-01). The request/response
 * shapes are those of NetGSM's official Node client @netgsm/sms 1.1.11 (docs/NETGSM-SMS-research.md).
 * Synthetic data only.
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { netgsmGonder, netgsmBaglantiTest, netgsmKrediSorgula, netgsmNumara, netgsmSayi, netgsmHataMesaji, NETGSM_HATA_MESAJLARI, NETGSM_TABAN_URL } from './netgsm'
import type { NetgsmSmsAyar } from './tipler'

const KOD = 'qa-kullanici-8501234567'
const SIFRE = 'qa-GIZLI-sifre-!@#9'
const AYAR: NetgsmSmsAyar = { saglayici: 'netgsm', kullaniciKodu: KOD, sifre: SIFRE, baslik: 'DRQAKLINIK', aktif: true }
const BASIC = `Basic ${Buffer.from(`${KOD}:${SIFRE}`).toString('base64')}`

const gercekFetch = globalThis.fetch
const gercekKonsol = { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug }
afterEach(() => { globalThis.fetch = gercekFetch; Object.assign(console, gercekKonsol) })

type Cagri = { url: string; init: RequestInit }
function fetchSahtesi(yanit: (c: Cagri) => Promise<Response> | Response) {
  const cagrilar: Cagri[] = []
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => { const c = { url: String(url), init: init || {} }; cagrilar.push(c); return yanit(c) }) as typeof fetch
  return cagrilar
}
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status })

describe('netgsmNumara', () => {
  it('E.164 +90 5xx → 5xxxxxxxxx; Türkiye dışı ve bozuk numaralar null', () => {
    assert.equal(netgsmNumara('+905321112233'), '5321112233')
    for (const x of ['+14155550100', '+902121112233', '05321112233', '5321112233', '', '+90532111223', '+9053211122334']) assert.equal(netgsmNumara(x), null, x)
  })
})

describe('netgsmGonder — başarı', () => {
  it('resmi sabit adrese Basic auth + JSON ile POST eder; encoding TR, iysfilter 0, numara 5xxxxxxxxx; jobid döner', async () => {
    const c = fetchSahtesi(() => json({ code: '00', description: 'queued', jobid: '1234567890' }))
    const r = await netgsmGonder(AYAR, '+905321112233', 'Merhaba, randevunuz yarın.')
    assert.deepEqual(r, { ok: true, saglayiciMesajId: '1234567890' })
    assert.equal(c.length, 1)
    assert.equal(c[0].url, `${NETGSM_TABAN_URL}/sms/rest/v2/send`)
    assert.equal(c[0].url, 'https://api.netgsm.com.tr/sms/rest/v2/send')
    assert.equal(c[0].init.method, 'POST')
    assert.equal((c[0].init.headers as Record<string, string>).Authorization, BASIC)
    assert.equal(c[0].init.redirect, 'error', 'yönlendirme takip edilmemeli')
    assert.ok(c[0].init.signal, 'zaman aşımı sinyali olmalı')
    assert.deepEqual(JSON.parse(String(c[0].init.body)), {
      msgheader: 'DRQAKLINIK', encoding: 'TR', iysfilter: '0', messages: [{ msg: 'Merhaba, randevunuz yarın.', no: '5321112233' }],
    })
  })

  it('jobid sayı olarak gelirse metne çevrilir; jobid yoksa id undefined (yine de başarı)', async () => {
    fetchSahtesi(() => json({ code: '00', jobid: 99 }))
    assert.deepEqual(await netgsmGonder(AYAR, '+905321112233', 'x'), { ok: true, saglayiciMesajId: '99' })
    fetchSahtesi(() => json({ code: '00' }))
    assert.deepEqual(await netgsmGonder(AYAR, '+905321112233', 'x'), { ok: true, saglayiciMesajId: undefined })
  })

  it('Türkçe karakterler gövdeye bozulmadan, tek JSON UTF-8 dizisi olarak girer', async () => {
    const c = fetchSahtesi(() => json({ code: '00', jobid: '1' }))
    const metin = 'Çocuğunuzun aşı randevusu: İstanbul’da ığüşöç İĞÜŞÖÇ ✓'
    await netgsmGonder(AYAR, '+905321112233', metin)
    assert.equal(JSON.parse(String(c[0].init.body)).messages[0].msg, metin)
    assert.equal(JSON.parse(String(c[0].init.body)).encoding, 'TR')
  })

  it('uzun mesaj (birden çok SMS parçası) kesilmeden tek istekte gider; parçalamayı NetGSM yapar', async () => {
    const c = fetchSahtesi(() => json({ code: '00', jobid: '2' }))
    const uzun = 'Merhaba, kontrol randevunuzu hatırlatmak isteriz. '.repeat(30) // ~1470 karakter
    assert.ok(uzun.length > 1000)
    const r = await netgsmGonder(AYAR, '+905321112233', uzun)
    assert.equal(r.ok, true)
    assert.equal(c.length, 1, 'tek istek')
    assert.equal(JSON.parse(String(c[0].init.body)).messages[0].msg, uzun, 'metin kırpılmamalı')
  })
})

describe('netgsmGonder — belgelenmiş hata kodları (gönderim)', () => {
  for (const kod of ['20', '30', '40', '50', '51', '70', '80', '85', '100', '101']) {
    it(`kod ${kod} → net Türkçe mesaj, atmaz`, async () => {
      fetchSahtesi(() => json({ code: kod, description: 'ham' }))
      const r = await netgsmGonder(AYAR, '+905321112233', 'x')
      assert.equal(r.ok, false)
      assert.equal((r as { hata: string }).hata, NETGSM_HATA_MESAJLARI[kod])
      assert.ok(NETGSM_HATA_MESAJLARI[kod].length > 40)
      assert.doesNotMatch((r as { hata: string }).hata, /[Jj]son|undefined|null|\[object/)
    })
  }

  it('HTTP 406 + kod (NetGSM hata gövdesi) aynı şekilde eşlenir', async () => {
    fetchSahtesi(() => json({ code: '40', description: 'msgheader' }, 406))
    const r = await netgsmGonder(AYAR, '+905321112233', 'x')
    assert.deepEqual(r, { ok: false, hata: NETGSM_HATA_MESAJLARI['40'] })
  })

  it('bilinmeyen kod: kodu gösterir ve genel yönlendirme verir', async () => {
    fetchSahtesi(() => json({ code: '777' }))
    const r = await netgsmGonder(AYAR, '+905321112233', 'x')
    assert.equal(r.ok, false)
    assert.match((r as { hata: string }).hata, /^NetGSM hata kodu 777\./)
  })

  it('"kod yok" ya da "00 olmayan" 2xx başarı sayılmaz', async () => {
    for (const g of [{}, { description: 'ok' }, { code: 0 }, { code: '' }, { code: '0' }]) {
      fetchSahtesi(() => json(g))
      const r = await netgsmGonder(AYAR, '+905321112233', 'x')
      assert.equal(r.ok, false, JSON.stringify(g))
    }
  })

  it('açıklama kredi/bakiye diyorsa kredi yok mesajı', () => {
    assert.match(netgsmHataMesaji('999', 'Yetersiz kredi'), /kredi/i)
  })
})

describe('netgsmGonder — ağ ve biçim sorunları', () => {
  it('zaman aşımı: abort edilirse okunur bir hata, atmaz', async () => {
    globalThis.fetch = ((_u: unknown, init?: RequestInit) => new Promise((_res, rej) => {
      init?.signal?.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; rej(e) })
    })) as typeof fetch
    const t = setTimeout.bind(globalThis)
    const onceki = globalThis.setTimeout
    globalThis.setTimeout = ((fn: () => void) => t(fn, 0)) as unknown as typeof setTimeout
    try {
      const r = await netgsmGonder(AYAR, '+905321112233', 'x')
      assert.deepEqual(r, { ok: false, hata: 'NetGSM zaman aşımına uğradı. Biraz sonra tekrar deneyin.' })
    } finally { globalThis.setTimeout = onceki }
  })

  it('ağ hatası (yönlendirme reddi dahil) atmaz, kimlik bilgisi içermeyen hata döner', async () => {
    fetchSahtesi(() => { throw new TypeError(`fetch failed ${KOD}:${SIFRE}`) })
    const r = await netgsmGonder(AYAR, '+905321112233', 'x')
    assert.equal(r.ok, false)
    assert.doesNotMatch(JSON.stringify(r), new RegExp(SIFRE.replace(/[.*+?^${}()|[\]\\!#@]/g, '\\$&')))
    assert.doesNotMatch(JSON.stringify(r), new RegExp(KOD))
  })

  it('bozuk / boş / JSON olmayan gövde: başarı sayılmaz; "gitti mi belirsiz" der', async () => {
    for (const g of ['', 'not json', '<html>502</html>', '[]', 'null', '"00"']) {
      fetchSahtesi(() => new Response(g, { status: 200 }))
      const r = await netgsmGonder(AYAR, '+905321112233', 'x')
      assert.equal(r.ok, false, g)
      assert.match((r as { hata: string }).hata, /okunamayan bir yanıt/)
    }
  })

  it('401/403 + gövdesiz → kimlik hatası mesajı', async () => {
    fetchSahtesi(() => new Response('', { status: 401 }))
    assert.deepEqual(await netgsmGonder(AYAR, '+905321112233', 'x'), { ok: false, hata: NETGSM_HATA_MESAJLARI['30'] })
  })

  it('Türkiye dışı numara ve boş başlık: ağa hiç çıkılmaz', async () => {
    const c = fetchSahtesi(() => json({ code: '00', jobid: '1' }))
    assert.equal((await netgsmGonder(AYAR, '+14155550100', 'x')).ok, false)
    assert.equal((await netgsmGonder({ ...AYAR, baslik: '  ' }, '+905321112233', 'x')).ok, false)
    assert.equal(c.length, 0)
  })

  it('adres sabittir: ayar nesnesi hiçbir URL taşımaz, istek her zaman resmi hosta gider', async () => {
    const c = fetchSahtesi(() => json({ code: '00', jobid: '1' }))
    await netgsmGonder({ ...AYAR, ...({ tabanUrl: 'https://169.254.169.254' } as object) } as NetgsmSmsAyar, '+905321112233', 'x')
    assert.ok(c[0].url.startsWith('https://api.netgsm.com.tr/'))
  })
})

describe('kimlik bilgileri günlüğe yazılmaz', () => {
  it('başarı, hata, zaman aşımı ve test çağrıları boyunca hiçbir console çıktısında şifre/kod yok; hatalar da içermez', async () => {
    const yazilan: string[] = []
    for (const k of ['log', 'info', 'warn', 'error', 'debug'] as const) (console as any)[k] = (...a: unknown[]) => { yazilan.push(a.map(String).join(' ')) }
    const sonuclar: unknown[] = []
    fetchSahtesi(() => json({ code: '00', jobid: '1' })); sonuclar.push(await netgsmGonder(AYAR, '+905321112233', 'x'))
    fetchSahtesi(() => json({ code: '30' })); sonuclar.push(await netgsmGonder(AYAR, '+905321112233', 'x'))
    fetchSahtesi(() => { throw new Error('boom') }); sonuclar.push(await netgsmGonder(AYAR, '+905321112233', 'x'))
    fetchSahtesi((c) => json(c.url.endsWith('/balance') ? { balance: '5,5' } : { code: '00', msgheader: ['DRQAKLINIK'] })); sonuclar.push(await netgsmBaglantiTest(AYAR))
    fetchSahtesi(() => json({ code: '30' })); sonuclar.push(await netgsmBaglantiTest(AYAR), await netgsmKrediSorgula(AYAR))
    const hepsi = JSON.stringify(sonuclar) + yazilan.join('\n')
    assert.ok(!hepsi.includes(SIFRE), 'şifre çıktıda geçmemeli')
    assert.ok(!hepsi.includes(KOD), 'kullanıcı kodu çıktıda geçmemeli')
    assert.ok(!hepsi.includes(Buffer.from(`${KOD}:${SIFRE}`).toString('base64')), 'Basic token çıktıda geçmemeli')
    assert.equal(yazilan.length, 0, 'adaptör hiçbir şey loglamaz')
  })

  it('kredi sorgusu: şifre yalnızca istek gövdesinde gider, URL ve başlıklarda değil', async () => {
    const c = fetchSahtesi(() => json({ balance: '12,5' }))
    await netgsmKrediSorgula(AYAR)
    assert.equal(c[0].url, 'https://api.netgsm.com.tr/balance')
    assert.ok(!c[0].url.includes(SIFRE))
    assert.deepEqual(JSON.parse(String(c[0].init.body)), { usercode: KOD, password: SIFRE, stip: 2 })
  })
})

describe('netgsmSayi / kredi', () => {
  it('virgüllü ve noktalı ondalık, sayı; saçma değerler null', () => {
    assert.equal(netgsmSayi('2,7'), 2.7)
    assert.equal(netgsmSayi('1250.50'), 1250.5)
    assert.equal(netgsmSayi(3), 3)
    assert.equal(netgsmSayi(' 10 '), 10)
    for (const x of ['', 'abc', '1,2,3', null, undefined, NaN, {}]) assert.equal(netgsmSayi(x as unknown), null)
  })

  it('kredi: string, paket dizisi, hata kodu 30, anlaşılmayan yanıt', async () => {
    fetchSahtesi(() => json({ balance: '2,7' })); assert.deepEqual(await netgsmKrediSorgula(AYAR), { ok: true, kredi: 2.7 })
    fetchSahtesi(() => json({ balance: [{ amount: 100, balance_name: 'paket' }, { amount: 50, balance_name: 'x' }] })); assert.deepEqual(await netgsmKrediSorgula(AYAR), { ok: true, kredi: 150 })
    fetchSahtesi(() => json({ code: '30' })); assert.deepEqual(await netgsmKrediSorgula(AYAR), { ok: false, hata: NETGSM_HATA_MESAJLARI['30'] })
    fetchSahtesi(() => new Response('???', { status: 200 })); assert.deepEqual(await netgsmKrediSorgula(AYAR), { ok: true, kredi: null })
    fetchSahtesi(() => json({ code: '70' })); assert.deepEqual(await netgsmKrediSorgula(AYAR), { ok: true, kredi: null })
  })
})

describe('netgsmBaglantiTest — SMS göndermez', () => {
  it('onaylı başlık listesinde (Türkçe büyük/küçük harf duyarsız) → başarı + kredi; yalnızca GET msgheader ve POST balance çağrılır', async () => {
    const c = fetchSahtesi((x) => x.url.endsWith('/balance') ? json({ balance: '8,25' }) : json({ code: '00', msgheader: ['DRQAKLINIK', 'BASKA'] }))
    const r = await netgsmBaglantiTest({ ...AYAR, baslik: 'drqaklinik' })
    assert.deepEqual(r, { ok: true, baslikOnayli: true, kredi: 8.25, uyari: undefined })
    assert.deepEqual(c.map((x) => `${x.init.method} ${x.url}`), ['GET https://api.netgsm.com.tr/sms/rest/v2/msgheader', 'POST https://api.netgsm.com.tr/balance'])
    assert.ok(!c.some((x) => x.url.includes('/send')), 'test SMS göndermemeli')
  })

  it('Türkçe i/İ: "klinik" başlığı "KLİNİK" ile eşleşir', async () => {
    fetchSahtesi((x) => x.url.endsWith('/balance') ? json({ balance: '1' }) : json({ code: '00', msgheader: ['KLİNİK'] }))
    const r = await netgsmBaglantiTest({ ...AYAR, baslik: 'klinik' })
    assert.equal(r.ok && r.baslikOnayli, true)
  })

  it('giriş doğru ama başlık listede yok → ok:true, baslikOnayli:false ve açıklayıcı uyarı', async () => {
    fetchSahtesi((x) => x.url.endsWith('/balance') ? json({ balance: '1' }) : json({ code: '00', msgheaders: ['BASKA'] }))
    const r = await netgsmBaglantiTest(AYAR)
    assert.equal(r.ok, true)
    assert.equal((r as any).baslikOnayli, false)
    assert.match((r as any).uyari, /onaylı başlıklar arasında görünmüyor/)
  })

  it('liste biçimi tanınmazsa baslikOnayli null (yanlış alarm yok)', async () => {
    fetchSahtesi((x) => x.url.endsWith('/balance') ? json({ balance: '1' }) : json({ code: '00' }))
    const r = await netgsmBaglantiTest(AYAR)
    assert.equal(r.ok && r.baslikOnayli, null)
  })

  it('hatalı giriş (30), bozuk yanıt ve ağ hatası → ok:false, Türkçe mesaj', async () => {
    fetchSahtesi(() => json({ code: '30' })); assert.deepEqual(await netgsmBaglantiTest(AYAR), { ok: false, hata: NETGSM_HATA_MESAJLARI['30'] })
    fetchSahtesi(() => new Response('<html>', { status: 200 })); assert.equal((await netgsmBaglantiTest(AYAR)).ok, false)
    fetchSahtesi(() => { throw new TypeError('x') }); assert.equal((await netgsmBaglantiTest(AYAR)).ok, false)
  })
})
