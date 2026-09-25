/**
 * NOTYA-BETA-0925 — "Not oluşturulamadı" on a long session: one retry on transient failures, failure marking with a
 * sanitized code, a readable log line, and the stuck `processing` session sweep. The real end route runs against the
 * in-memory Supabase with a mocked SOAP generator (no network, no model). Synthetic QA data only.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-soap-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'

let db = new SahteVeritabani()
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return { from: (t: string) => c().from(t), auth: { getUser: (j?: string) => c().auth.getUser(j) }, storage: { from: (k: string) => c().storage.from(k) }, rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a) }
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
class SahteAnthropic { messages = { create: async () => { throw new Error('bu testte model çağrılmaz') } } }
{
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
const yerel = (ad: string) => pathToFileURL(join(__dirname, ad)).href

const TRANSKRIPT = 'Sentetik GIZLI-TRANSKRIPT-9Z: üç gündür öksürük, ateş yok.'
/** Each call to the mocked generator takes the next scripted outcome: an Error to throw, or 'ok'. */
let senaryo: (Error | 'ok')[] = []
let uretimSayisi = 0
mock.module(yerel('soapUret.ts'), {
  namedExports: {
    soapNotuUret: async () => {
      uretimSayisi++
      const s = senaryo.shift() ?? 'ok'
      if (s !== 'ok') throw s
      return { soap: { subjektif: 'Sentetik S', objektif: 'Sentetik O', degerlendirme: 'Sentetik D', plan: 'Sentetik P' }, tani: 'Sentetik' }
    },
    stilOrnekleriDerle: () => '',
    stilProfiliDamit: async () => '',
    dozKilitliBrans: () => false,
  },
})
mock.module(yerel('hizLimiti.ts'), { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })
mock.module(pathToFileURL(join(__dirname, '../alarm.ts')).href, { namedExports: { kritikAlarm: async () => undefined } })
globalThis.fetch = (async (g: unknown) => { throw new Error(`soap testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let S: typeof import('./soapYeniden')
let bitir: { POST: (r: unknown, c: { params: { id: string } }) => Promise<Response> }
let NextRequestSinifi: typeof import('next/server').NextRequest

/** Anthropic SDK 0.27 APIError shape (status + body) without importing the SDK. */
function apiHatasi(status: number, tur: string, ad = 'APIError') {
  const e = new Error(`${status} {"type":"error","error":{"type":"${tur}","message":"sentetik"}}`) as Error & { status: number; error: unknown }
  e.name = ad
  e.status = status
  e.error = { type: 'error', error: { type: tur, message: 'sentetik' } }
  return e
}
function ciktiHatasi() { const e = new Error('SOAP çıktısı ayrıştırılamadı (onarılamadı)'); e.name = 'SoapCiktiHatasi'; return e }

before(async () => {
  S = await import('./soapYeniden')
  NextRequestSinifi = (await import('next/server')).NextRequest
  bitir = await import('../../app/api/sessions/[id]/end/route') as never
})

describe('geçici hata sınıflaması', () => {
  it('bozuk JSON, overloaded / 529, 5xx, ağ ve zaman aşımı geçicidir', () => {
    assert.ok(S.geciciSoapHatasiMi(ciktiHatasi()))
    assert.ok(S.geciciSoapHatasiMi(new SyntaxError('Unexpected token')))
    assert.ok(S.geciciSoapHatasiMi(apiHatasi(529, 'overloaded_error')))
    assert.ok(S.geciciSoapHatasiMi(apiHatasi(500, 'api_error', 'InternalServerError')))
    assert.ok(S.geciciSoapHatasiMi(apiHatasi(503, 'api_error')))
    assert.ok(S.geciciSoapHatasiMi(Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' })))
    assert.ok(S.geciciSoapHatasiMi(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } })))
  })
  it('bakiye, yetki, geçersiz istek ve hız sınırı geçici değildir', () => {
    assert.ok(!S.geciciSoapHatasiMi(apiHatasi(400, 'invalid_request_error')))
    assert.ok(!S.geciciSoapHatasiMi(new Error('400 Your credit balance is too low')))
    assert.ok(!S.geciciSoapHatasiMi(apiHatasi(401, 'authentication_error')))
    assert.ok(!S.geciciSoapHatasiMi(apiHatasi(429, 'rate_limit_error')))
    assert.ok(!S.geciciSoapHatasiMi(new Error('Not kaydedilemedi: duplicate key 500')))
  })
  it('hata kodu: sınıf + durum + tür; mesaj metni (model çıktısı / transkript) yok; en çok 200 karakter', () => {
    assert.equal(S.soapHataKodu(apiHatasi(529, 'overloaded_error')), 'APIError status=529 type=overloaded_error')
    const sizdiran = new SyntaxError(`Unexpected token in JSON: "${TRANSKRIPT}"`)
    const kod = S.soapHataKodu(sizdiran)
    assert.ok(!kod.includes('GIZLI-TRANSKRIPT'), kod)
    assert.ok(!S.soapHataLogMetni(sizdiran).includes('GIZLI-TRANSKRIPT'))
    assert.ok(S.soapHataKodu(Object.assign(new Error('x'), { name: 'A'.repeat(500) })).length <= 200)
  })
})

describe('soapUretYeniden — bir kez, yalnız süre yetiyorsa', () => {
  const sahteSaat = () => { let t = 0; return { simdi: () => t, ilerlet: (ms: number) => { t += ms } } }

  it('geçici hata → kısa bekleme → ikinci deneme başarılı', async () => {
    const saat = sahteSaat()
    const beklemeler: number[] = []
    let n = 0
    const r = await S.soapUretYeniden(async () => { n++; saat.ilerlet(5_000); if (n === 1) throw apiHatasi(529, 'overloaded_error'); return 'not' }, {
      baslangicMs: 0, sureSiniriMs: 300_000, simdi: saat.simdi, bekle: async (ms) => { beklemeler.push(ms) },
    })
    assert.deepEqual(r, { sonuc: 'not', deneme: 2 })
    assert.deepEqual(beklemeler, [S.SOAP_TEKRAR_BEKLEME_MS])
  })
  it('geçici olmayan hata tekrar denenmez', async () => {
    let n = 0
    await assert.rejects(S.soapUretYeniden(async () => { n++; throw apiHatasi(400, 'invalid_request_error') }, { baslangicMs: 0, sureSiniriMs: 300_000, bekle: async () => {} }))
    assert.equal(n, 1)
  })
  it('süre sınırında pay yoksa tekrar denenmez (ilk deneme 200 sn sürdü)', async () => {
    const saat = sahteSaat()
    let n = 0
    await assert.rejects(S.soapUretYeniden(async () => { n++; saat.ilerlet(200_000); throw ciktiHatasi() }, { baslangicMs: 0, sureSiniriMs: 300_000, simdi: saat.simdi, bekle: async () => {} }))
    assert.equal(n, 1)
  })
  it('ikinci deneme de düşerse hata olduğu gibi fırlatılır; üçüncü deneme yok', async () => {
    let n = 0
    await assert.rejects(
      S.soapUretYeniden(async () => { n++; throw apiHatasi(529, 'overloaded_error') }, { baslangicMs: Date.now(), sureSiniriMs: 300_000, bekle: async () => {} }),
      (e: Error & { status?: number }) => e.status === 529,
    )
    assert.equal(n, 2)
  })
})

type Sahne = { doktor: { id: string; token: string }; diger: { id: string; token: string }; hasta: string }
function sahne(): Sahne {
  db = new SahteVeritabani()
  senaryo = []
  uretimSayisi = 0
  const kullanici = () => { const id = randomUUID(); const token = `qa-${id}`; db.kullanicilar.set(token, { id }); return { id, token } }
  const doktor = kullanici()
  const diger = kullanici()
  db.ekle('users', { id: doktor.id, full_name: 'QA Hekim', specialty: 'dahiliye' })
  const hasta = db.ekle('patients', { doctor_id: doktor.id, is_active: true }).id
  return { doktor, diger, hasta }
}
const once = (dk: number) => new Date(Date.now() - dk * 60_000).toISOString()

describe('takılı seans taraması (98e6fb44 deseni)', () => {
  let s: Sahne
  beforeEach(() => { s = sahne() })

  it('eski, notsuz processing seans failed olur; notlu, yeni ve başka doktorunki dokunulmaz', async () => {
    const takili = db.ekle('sessions', { doctor_id: s.doktor.id, patient_id: s.hasta, status: 'processing', created_at: once(40), ended_at: once(40) }).id
    const notlu = db.ekle('sessions', { doctor_id: s.doktor.id, patient_id: s.hasta, status: 'processing', created_at: once(40), ended_at: once(40) }).id
    db.ekle('notes', { session_id: notlu, doctor_id: s.doktor.id })
    const yeni = db.ekle('sessions', { doctor_id: s.doktor.id, patient_id: s.hasta, status: 'processing', created_at: once(2), ended_at: null }).id
    const eskiAmaYeniBitti = db.ekle('sessions', { doctor_id: s.doktor.id, patient_id: s.hasta, status: 'processing', created_at: once(90), ended_at: once(3) }).id
    const baskasi = db.ekle('sessions', { doctor_id: s.diger.id, status: 'processing', created_at: once(40), ended_at: once(40) }).id

    const kapanan = await S.takiliSeanslariKapat(db.istemci() as never, s.doktor.id, null)
    assert.deepEqual(kapanan, [takili])
    const satir = (id: string) => db.tablo('sessions').find((x) => x.id === id)!
    assert.equal(satir(takili).status, 'failed')
    assert.match(satir(takili).error_message, /^StuckProcessing/)
    for (const id of [notlu, yeni, eskiAmaYeniBitti, baskasi]) assert.equal(satir(id).status, 'processing', id)
  })
})

describe('gerçek rota: POST /api/sessions/[id]/end', () => {
  let s: Sahne
  let seans: string
  let hatalar: string[]
  let orijinalHata: typeof console.error
  beforeEach(() => {
    s = sahne()
    seans = db.ekle('sessions', { doctor_id: s.doktor.id, patient_id: s.hasta, status: 'processing' }).id
    hatalar = []
    orijinalHata = console.error
    console.error = (...a: unknown[]) => { hatalar.push(a.map(String).join(' ')) }
  })
  const cagir = async () => {
    const req = new NextRequestSinifi(`http://localhost/api/sessions/${seans}/end`, {
      method: 'POST', headers: { authorization: `Bearer ${s.doktor.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ transcript: TRANSKRIPT, context: { specialty: 'dahiliye' } }),
    } as ConstructorParameters<typeof NextRequestSinifi>[1])
    try {
      const y = await bitir.POST(req, { params: { id: seans } })
      return { status: y.status, json: await y.json() }
    } finally { console.error = orijinalHata }
  }

  it('geçici hata (529) bir kez tekrar denenir; ikinci deneme notu kaydeder, seans completed', async () => {
    senaryo = [apiHatasi(529, 'overloaded_error'), 'ok']
    const y = await cagir()
    assert.equal(y.status, 200, JSON.stringify(y.json))
    assert.equal(uretimSayisi, 2)
    assert.equal(db.tablo('notes').filter((n) => n.session_id === seans).length, 1)
    const satir = db.tablo('sessions').find((x) => x.id === seans)!
    assert.equal(satir.status, 'completed')
    assert.equal(satir.error_message, null)
  })

  it('iki geçici hata: 500 + Türkçe mesaj, seans failed + temiz kod, hata tek satırda loglanır, transkript sızmaz', async () => {
    senaryo = [ciktiHatasi(), new SyntaxError(`Unexpected token in JSON: "${TRANSKRIPT}"`)]
    const y = await cagir()
    assert.equal(y.status, 500)
    assert.match(y.json.error, /Not oluşturulamadı/)
    assert.equal(uretimSayisi, 2)
    const satir = db.tablo('sessions').find((x) => x.id === seans)!
    assert.equal(satir.status, 'failed')
    assert.ok(satir.error_message && satir.error_message.length <= 200)
    assert.match(satir.error_message, /SyntaxError/)
    assert.ok(!satir.error_message.includes('GIZLI-TRANSKRIPT'))
    const satirlar = hatalar.filter((h) => h.startsWith('[sessions/end] not üretilemedi:'))
    assert.equal(satirlar.length, 1, hatalar.join('\n'))
    assert.ok(!satirlar[0].includes('\n'))
    assert.ok(hatalar.every((h) => !h.includes('GIZLI-TRANSKRIPT')), 'loglarda transkript olmamalı')
    assert.equal(db.tablo('notes').filter((n) => n.session_id === seans).length, 0)
  })

  it('geçici olmayan hata (400 geçersiz istek) tekrar denenmez; seans failed', async () => {
    senaryo = [apiHatasi(400, 'invalid_request_error')]
    const y = await cagir()
    assert.equal(y.status, 500)
    assert.equal(uretimSayisi, 1)
    assert.equal(db.tablo('sessions').find((x) => x.id === seans)!.error_message, 'APIError status=400 type=invalid_request_error')
  })

  it('başarısız seans yeniden bitirilebilir (istemci aynı seansı kullanır): kod temizlenir, not tek', async () => {
    senaryo = [apiHatasi(400, 'invalid_request_error')]
    await cagir()
    senaryo = ['ok']
    console.error = (...a: unknown[]) => { hatalar.push(a.map(String).join(' ')) }
    const y = await cagir()
    assert.equal(y.status, 200)
    const satir = db.tablo('sessions').find((x) => x.id === seans)!
    assert.equal(satir.status, 'completed')
    assert.equal(satir.error_message, null)
    assert.equal(db.tablo('notes').filter((n) => n.session_id === seans).length, 1)
  })

  it('başka doktorun seansı: 404, hiçbir seans işaretlenmez', async () => {
    const yabanci = db.ekle('sessions', { doctor_id: s.diger.id, status: 'processing' }).id
    const req = new NextRequestSinifi(`http://localhost/api/sessions/${yabanci}/end`, {
      method: 'POST', headers: { authorization: `Bearer ${s.doktor.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ transcript: TRANSKRIPT }),
    } as ConstructorParameters<typeof NextRequestSinifi>[1])
    const y = await bitir.POST(req, { params: { id: yabanci } })
    console.error = orijinalHata
    assert.equal(y.status, 404)
    assert.equal(db.tablo('sessions').find((x) => x.id === yabanci)!.status, 'processing')
  })
})
