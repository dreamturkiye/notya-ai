/**
 * DENEME-BILDIRIM-01 + KURUCU-KONSOL-01 (Kaan, 2026-11-07). Synthetic QA data only; the database and auth are stand-ins
 * (lib/security/testing/sahteSupabase.ts), the route handlers are real. No network: fetch throws unless a test passes its own.
 *
 *   1. Signature: a good one passes; a wrong, expired, future, replayed or other-country signature is refused.
 *   2. The internal e-mail: words, time zones, exclusions; it is claimed ONCE per account and never for staff, mali/avukat,
 *      Kaan's test account; no key → nothing sent; the send carries an idempotency key.
 *   3. The console: unauthenticated and non-founder requests get 404; the founder gets data; a failing country shows
 *      "unavailable" and the page still renders; no patient field survives into the payload.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { imzaBellegiTemizle, imzaDogrula, imzaUret, IMZA_PENCERESI_MS, sinirlayici } from './imza'
import { bildirimDisiMi, bildirimEpostasi, bildirimGonder, bildirimZamani, kurucuEpostalari } from './denemeBildirimi'
import { hastaAlaniVarMi, hesapSatiriTemizle, ozetHesapla, ulkeYanitiTemizle, type KurucuUlkeYaniti } from './tipler'
import { konsolVerisiTopla, ulkeIstatistigiCek } from './konsol'
import { donusumSay, stripeDonusumuOku } from './stripeDonusum'
import { trDenemeKaydiBildir } from './trDenemeBildir'
import { TR_SOZLUK } from './trBildirimMetni'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
delete process.env.RESEND_API_KEY
delete process.env.FOUNDER_STATS_SECRET
delete process.env.STRIPE_SECRET_KEY
delete process.env.FOUNDER_EMAILS

let db = new SahteVeritabani()
let authListesi: Array<Record<string, unknown>> = []
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: {
      getUser: async (jwt?: string) => c().auth.getUser(jwt),
      admin: { listUsers: async () => ({ data: { users: authListesi }, error: null }) },
    },
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
globalThis.fetch = (async (g: unknown) => { throw new Error(`the founder tests must not reach the network: ${String(g)}`) }) as typeof fetch

const GIZLI = 'q'.repeat(48)
let NextRequestSinifi: typeof import('next/server').NextRequest
let OZET: Record<string, any>
before(async () => {
  NextRequestSinifi = (await import('next/server')).NextRequest
  OZET = await import('../../app/api/kurucu/ozet/route')
})
beforeEach(() => { db = new SahteVeritabani(); authListesi = []; imzaBellegiTemizle() })

describe('signature between the console and a country build', () => {
  it('a fresh signature for this country passes once', () => {
    const t = 1_800_000_000_000
    assert.deepEqual(imzaDogrula(GIZLI, imzaUret(GIZLI, 'au', t), 'au', t + 1000), { ok: true })
  })
  it('a bad, expired, future, replayed or other-country signature is refused', () => {
    const t = 1_800_000_000_000
    const b = imzaUret(GIZLI, 'au', t)
    assert.equal(imzaDogrula('w'.repeat(48), b, 'au', t).ok, false)
    assert.deepEqual(imzaDogrula(GIZLI, b, 'gb', t), { ok: false, neden: 'imza' })
    assert.deepEqual(imzaDogrula(GIZLI, imzaUret(GIZLI, 'au', t - IMZA_PENCERESI_MS - 1), 'au', t), { ok: false, neden: 'suresi-gecmis' })
    assert.deepEqual(imzaDogrula(GIZLI, imzaUret(GIZLI, 'au', t + 5 * 60 * 1000), 'au', t), { ok: false, neden: 'suresi-gecmis' })
    assert.deepEqual(imzaDogrula(GIZLI, b, 'au', t), { ok: true })
    assert.deepEqual(imzaDogrula(GIZLI, b, 'au', t + 10), { ok: false, neden: 'tekrar' })
    const kurcalanmis = b.replace(/s=([0-9a-f])/, (_m, c) => `s=${c === 'a' ? 'b' : 'a'}`)
    assert.equal(imzaDogrula(GIZLI, kurcalanmis, 'au', t).ok, false)
    assert.deepEqual(imzaDogrula(GIZLI, 'garbage', 'au', t), { ok: false, neden: 'bicim' })
    assert.deepEqual(imzaDogrula(undefined, b, 'au', t), { ok: false, neden: 'gizli-yok' })
    assert.deepEqual(imzaDogrula('short', b, 'au', t), { ok: false, neden: 'gizli-yok' })
  })
  it('the rate limiter stops a burst', () => {
    const s = sinirlayici(3, 60_000)
    assert.deepEqual([1, 2, 3, 4].map(() => s.izinli('ip', 1000)), [true, true, true, false])
    assert.equal(s.izinli('ip', 62_000), true)
  })
})

describe('the internal trial-signup e-mail', () => {
  it('TR words in Turkish with Türkiye time; country builds in English with US Eastern', () => {
    const an = new Date('2026-11-07T12:00:00Z')
    const tr = bildirimEpostasi({ ulke: 'tr', ad: 'QA Hekim', eposta: 'qa@ornek.test', telefon: '+905550000000', bransEtiketi: 'Kardiyoloji', plan: 'trial', zaman: an, toplam: 11 }, TR_SOZLUK)
    assert.equal(tr.konu, 'Yeni deneme kaydı — TR — Kardiyoloji')
    assert.match(tr.metin, /15:00 \(Türkiye saati\)/)
    assert.match(tr.metin, /Telefon: \+905550000000/)
    assert.match(tr.metin, /Toplam doktor kaydı \(TR, bu dahil\): 11/)
    assert.match(tr.metin, /Plan: Ücretsiz deneme/)
    const au = bildirimEpostasi({ ulke: 'au', ad: 'QA Doctor', eposta: 'qa@example.test', bransEtiketi: 'General practice', plan: 'trial', zaman: an, toplam: 3 })
    assert.equal(au.konu, 'New trial signup — AU — General practice')
    assert.match(au.metin, /07:00 \(US Eastern\)/)
    assert.match(au.metin, /Phone: not given/)
    assert.equal(bildirimZamani('uz', an).endsWith('(US Eastern)'), true)
    assert.match(bildirimEpostasi({ ulke: 'tr', ad: 'x', eposta: 'x@y.z', bransEtiketi: 'Pediatri (Çocuk Sağlığı)', plan: 'paid-pending', planAnahtari: 'sesli_pro', zaman: an, toplam: 1 }, TR_SOZLUK).metin, /Ücretli plan seçildi \(sesli_pro\)/)
    assert.equal(hastaAlaniVarMi({ konu: au.konu }), false)
    assert.doesNotMatch(au.html, /<script/i)
  })
  it('Kaan\'s test account and the founders are never notified', () => {
    assert.deepEqual(kurucuEpostalari(undefined), ['kaan@notya.io'])
    assert.equal(bildirimDisiMi('KaanAri@Mac.com'), true)
    assert.equal(bildirimDisiMi('kaan@notya.io'), true)
    assert.equal(bildirimDisiMi('qa@ornek.test'), false)
  })
  it('no key → nothing is sent; with a key → one POST to Resend with an idempotency key', async () => {
    assert.deepEqual(await bildirimGonder({ konu: 'k', metin: 'm', html: 'h' }, 'id-1', { apiAnahtari: '' }), { durum: 'anahtar-yok' })
    const cagrilar: Array<{ url: string; init: RequestInit }> = []
    const f = (async (url: string, init: RequestInit) => { cagrilar.push({ url, init }); return new Response('{"id":"x"}', { status: 200 }) }) as unknown as typeof fetch
    assert.deepEqual(await bildirimGonder({ konu: 'k', metin: 'm', html: 'h' }, 'id-1', { apiAnahtari: 're_test', fetchFn: f }), { durum: 'gonderildi' })
    assert.equal(cagrilar[0].url, 'https://api.resend.com/emails')
    assert.equal((cagrilar[0].init.headers as Record<string, string>)['Idempotency-Key'], 'id-1')
    assert.deepEqual(JSON.parse(String(cagrilar[0].init.body)).to, ['kaan@notya.io'])
    const kotu = (async () => { throw new Error('down') }) as unknown as typeof fetch
    assert.equal((await bildirimGonder({ konu: 'k', metin: 'm', html: 'h' }, 'id-1', { apiAnahtari: 're_test', fetchFn: kotu })).durum, 'hata')
  })

  const hekim = (o: { email?: string; meta?: Record<string, unknown>; satir?: Record<string, unknown> } = {}) => {
    const id = randomUUID()
    const email = o.email || `qa-${id.slice(0, 8)}@ornek.test`
    db.ekle('users', { id, email, first_name: 'QA', last_name: 'Hekim', specialty: 'kardiyoloji', profession_type: 'doktor', cep_telefonu: '+905550000000', deneme_bildirim_at: null, ...(o.satir || {}) })
    return { id, email, user_metadata: o.meta || {} }
  }

  it('claimed exactly once per account; the second call sends nothing', async () => {
    const sb = db.istemci() as any
    const u = hekim()
    const gonderilen: string[] = []
    const f = (async (_u: string, init: RequestInit) => { gonderilen.push(JSON.parse(String(init.body)).subject); return new Response('{}', { status: 200 }) }) as unknown as typeof fetch
    process.env.RESEND_API_KEY = 're_test'
    try {
      assert.equal(await trDenemeKaydiBildir(sb, u, { fetchFn: f }), 'gonderildi')
      assert.equal(await trDenemeKaydiBildir(sb, u, { fetchFn: f }), 'zaten')
    } finally { delete process.env.RESEND_API_KEY }
    assert.deepEqual(gonderilen, ['Yeni deneme kaydı — TR — Kardiyoloji'])
    assert.ok(db.tablo('users').find((r) => r.id === u.id)?.deneme_bildirim_at)
  })
  it('without RESEND_API_KEY the account is still recorded (count stays right) and nothing is sent', async () => {
    const sb = db.istemci() as any
    assert.equal(await trDenemeKaydiBildir(sb, hekim()), 'anahtar-yok')
  })
  it('staff, mali / avukat and Kaan\'s test account are left out (no claim)', async () => {
    const sb = db.istemci() as any
    const personel = hekim({ meta: { personel: true } })
    const personelSatiri = hekim()
    db.ekle('personel', { id: randomUUID(), user_id: personelSatiri.id, doktor_id: randomUUID(), rol: 'sekreter' })
    const mali = hekim({ satir: { profession_type: 'mali', specialty: 'Muhasebe' } })
    const kaan = hekim({ email: 'kaanari@mac.com' })
    for (const u of [personel, personelSatiri, mali, kaan]) assert.equal(await trDenemeKaydiBildir(sb, u), 'disarida')
    assert.equal(db.tablo('users').filter((r) => r.deneme_bildirim_at).length, 0)
  })
  it('the routes call it after their own write, through arkaPlanda (never awaited by the response)', () => {
    for (const yol of ['app/api/users/profile/route.ts', 'app/api/users/brans/route.ts']) {
      const s = readFileSync(join(__dirname, '../..', yol), 'utf8')
      assert.match(s, /arkaPlanda\(\(\) => trDenemeKaydiBildir\(/, yol)
    }
  })
})

const ornekHesap = (o: Record<string, unknown> = {}) => hesapSatiriTemizle({ ad: 'QA', eposta: 'qa@example.test', brans: 'family-medicine', bransEtiketi: 'General practice', plan: 'trial', onboardingTamam: true, denemeKalanGun: 2, bransSecildi: true, kayit: new Date().toISOString(), sonGiris: null, not7: 1, not30: 2, muayene7: 3, muayene30: 4, ...o })

describe('founder console', () => {
  it('GET /api/kurucu/ozet: no token, a bad token and a non-founder account all get 404', async () => {
    db.kullanicilar.set('qa-doktor', { id: randomUUID(), email: 'qa-doktor@ornek.test' })
    for (const baslik of [{}, { authorization: 'Bearer yanlis' }, { authorization: 'Bearer null' }, { authorization: 'Bearer qa-doktor' }] as Record<string, string>[]) {
      const y = await OZET.GET(new NextRequestSinifi('http://localhost/api/kurucu/ozet', { headers: baslik }))
      assert.equal(y.status, 404, JSON.stringify(baslik))
    }
  })
  it('the founder gets the console; countries without the secret show unavailable; Kaan\'s test account is named, not counted', async () => {
    const kurucuId = randomUUID()
    db.kullanicilar.set('qa-kurucu', { id: kurucuId, email: 'kaan@notya.io' })
    const d1 = randomUUID()
    authListesi = [
      { id: d1, email: 'qa-1@ornek.test', created_at: new Date().toISOString(), last_sign_in_at: null, user_metadata: { trial_ends: new Date(Date.now() + 2 * 86400000).toISOString() } },
      { id: randomUUID(), email: 'kaanari@mac.com', created_at: new Date().toISOString(), user_metadata: {} },
      { id: kurucuId, email: 'kaan@notya.io', created_at: new Date().toISOString(), user_metadata: {} },
    ]
    db.ekle('users', { id: d1, email: 'qa-1@ornek.test', first_name: 'QA', last_name: 'Bir', specialty: 'pediatri', profession_type: 'doktor' })
    db.ekle('notes', { id: randomUUID(), doctor_id: d1, session_id: randomUUID(), content_subjektif: 'GIZLI-NOT-ICERIGI', created_at: new Date().toISOString() })
    db.ekle('sessions', { id: randomUUID(), doctor_id: d1, patient_id: randomUUID(), created_at: new Date().toISOString() })
    const y = await OZET.GET(new NextRequestSinifi('http://localhost/api/kurucu/ozet', { headers: { authorization: 'Bearer qa-kurucu' } }))
    assert.equal(y.status, 200)
    const veri = await y.json()
    const tr = veri.ulkeler.find((u: any) => u.ulke === 'tr')
    assert.equal(tr.durum, 'tamam')
    assert.equal(tr.veri.hesaplar.length, 1)
    assert.equal(tr.veri.hesaplar[0].not7, 1)
    assert.equal(tr.veri.hesaplar[0].muayene30, 1)
    assert.equal(tr.veri.hesaplar[0].denemeKalanGun, 2)
    assert.deepEqual(tr.veri.testHesaplari.sort(), ['kaan@notya.io', 'kaanari@mac.com'])
    assert.equal(veri.ulkeler.filter((u: any) => u.durum === 'erisilemez').length, 6)
    assert.equal(veri.stripe.durum, 'bagli-degil')
    assert.equal(hastaAlaniVarMi(veri), false)
    assert.doesNotMatch(JSON.stringify(veri), /GIZLI-NOT-ICERIGI/)
  })
  it('a country answer carrying patient fields is stripped to the allowed doctor-account keys', () => {
    const kotu = { uretildi: 'x', hesaplar: [{ ...ornekHesap(), patient_id: 'p', hasta_adi: 'GIZLI', content_plan: 'GIZLI' }], testHesaplari: [] }
    const temiz = ulkeYanitiTemizle('au', kotu)!
    assert.equal(hastaAlaniVarMi(temiz), false)
    assert.doesNotMatch(JSON.stringify(temiz), /GIZLI/)
    assert.equal(ulkeYanitiTemizle('au', { hesaplar: 'no' }), null)
  })
  it('the request to a country is signed for that country, and a failing or slow country does not break the page', async () => {
    let baslik = ''
    const f = (async (_u: string, init: RequestInit) => { baslik = (init.headers as Record<string, string>)['x-notya-kurucu-imza']; return new Response(JSON.stringify({ uretildi: 'x', hesaplar: [ornekHesap()], testHesaplari: [] }), { status: 200 }) }) as unknown as typeof fetch
    const ok = await ulkeIstatistigiCek('au', 'https://au.example.test/au', { gizli: GIZLI, fetchFn: f })
    assert.equal(ok.ok, true)
    assert.deepEqual(imzaDogrula(GIZLI, baslik, 'au'), { ok: true })
    const veri = await konsolVerisiTopla({
      tr: async () => ({ ulke: 'tr', uretildi: 'x', hesaplar: [ornekHesap({ plan: 'paid', denemeKalanGun: null })], testHesaplari: ['kaanari@mac.com'] }),
      ulke: async (u) => (u === 'au' ? { ok: true as const, veri: { ulke: 'au', uretildi: 'x', hesaplar: [ornekHesap()], testHesaplari: [] } as KurucuUlkeYaniti } : u === 'gb' ? Promise.reject(new Error('boom')) : { ok: false as const, neden: 'timeout' }),
      stripe: async () => ({ durum: 'bagli-degil' as const }),
    })
    assert.deepEqual(veri.ulkeler.map((u) => `${u.ulke}:${u.durum}`), ['tr:tamam', 'us:erisilemez', 'gb:erisilemez', 'ca:erisilemez', 'au:tamam', 'nz:erisilemez', 'uz:erisilemez'])
    assert.equal(veri.toplam.toplam, 2)
    assert.equal(veri.toplam.ucretli, 1)
    assert.equal(veri.toplam.ucGundeBitecek, 1)
    const { KonsolGorunumu } = await import('../../components/kurucu/KurucuKonsolu')
    const html = renderToStaticMarkup(React.createElement(KonsolGorunumu, { veri }))
    assert.match(html, /Unavailable \(timeout\)/)
    assert.match(html, /Not connected\./)
    assert.match(html, /General practice/)
    assert.match(html, /kaanari@mac\.com \(TR\)/)
  })
  it('summary tiles', () => {
    const simdi = Date.parse('2026-11-07T12:00:00Z')
    const o = ozetHesapla([
      ornekHesap({ kayit: '2026-11-07T08:00:00Z', denemeKalanGun: 10 }),
      ornekHesap({ kayit: '2026-11-03T08:00:00Z', denemeKalanGun: 1 }),
      ornekHesap({ kayit: '2026-10-20T08:00:00Z', plan: 'paid', denemeKalanGun: null }),
      ornekHesap({ kayit: '2026-09-01T08:00:00Z', denemeKalanGun: 0 }),
    ], simdi)
    assert.deepEqual(o, { bugun: 1, yedi: 2, otuz: 3, aktifDeneme: 2, ucGundeBitecek: 1, ucretli: 1, toplam: 4 })
  })
  it('Stripe conversions: Notya subscriptions only, by currency; no key → not connected', async () => {
    const simdi = 1_800_000_000
    const s = donusumSay([
      { status: 'trialing', metadata: { supabase_user_id: 'a' }, items: { data: [{ price: { currency: 'try' } }] } },
      { status: 'active', trial_end: simdi - 10, metadata: { notya_plan_key: 'sesli_pro' }, items: { data: [{ price: { currency: 'aud' } }] } },
      { status: 'active', metadata: {}, items: { data: [{ price: { currency: 'usd' } }] } },
    ], simdi)
    assert.deepEqual(s.toplam, { deneme: 1, aktif: 1, denemedenUcretliye: 1, iptal: 0 })
    assert.equal(s.ulkeler.tr.deneme, 1)
    assert.equal(s.ulkeler.au.denemedenUcretliye, 1)
    assert.deepEqual(await stripeDonusumuOku({ anahtar: '' }), { durum: 'bagli-degil' })
    const listele = async () => ({ data: [{ id: 's1', status: 'canceled', metadata: { supabase_user_id: 'x' }, items: { data: [{ price: { currency: 'gbp' } }] } }], has_more: false })
    const r = await stripeDonusumuOku({ listele })
    assert.equal(r.durum, 'tamam')
  })
})
