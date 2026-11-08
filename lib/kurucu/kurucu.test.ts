/**
 * DENEME-BILDIRIM-01 + KURUCU-KONSOL-01 (Kaan, 2026-11-07). Synthetic QA data only; the database and auth are stand-ins
 * (lib/security/testing/sahteSupabase.ts), the route handlers are real. No network: fetch throws unless a test passes its own.
 *
 *   1. Signature: a good one passes; a wrong, expired, future, replayed or other-country signature is refused.
 *   2. The internal e-mail: words, time zones, exclusions; it is claimed ONCE per account and never for staff, mali/avukat,
 *      Kaan's test account; no SMTP_PASS → nothing sent; sent over SMTP from kaan@notya.io to kaan@notya.io.
 *   2b. /api/internal/signup-notify (DENEME-BILDIRIM-02): 404 for unsigned, expired, replayed, re-bodied or extra-key
 *      requests; a valid one is accepted and sent through the same SMTP sender; the payload carries no patient field.
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
import { govdeImzaDogrula, govdeImzaUret, IMZA_BASLIGI, imzaBellegiTemizle, imzaDogrula, imzaUret, IMZA_PENCERESI_MS, sinirlayici } from './imza'
import { BILDIRIM_YUKU_ANAHTARLARI, bildirimDisiMi, bildirimEpostasi, bildirimYuku, bildirimYukuCoz, bildirimZamani, kurucuEpostalari, SIGNUP_NOTIFY_AMAC } from './denemeBildirimi'
import { bildirimGonder, type TasiyiciKur } from './smtpGonder'
import { hastaAlaniVarMi, hesapSatiriTemizle, ozetHesapla, ulkeYanitiTemizle, type KurucuUlkeYaniti } from './tipler'
import { konsolVerisiTopla, ulkeIstatistigiCek } from './konsol'
import { donusumSay, stripeDonusumuOku } from './stripeDonusum'
import { trDenemeKaydiBildir } from './trDenemeBildir'
import { TR_SOZLUK } from './trBildirimMetni'
import { kurucuVerisiniAl, oturumTokeniniBekle, OTURUM_BEKLEME_ADIMLARI, kardesKokAdresi, type KurucuYanit } from './oturumBekle'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
delete process.env.RESEND_API_KEY
delete process.env.SMTP_PASS
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
  it('no SMTP_PASS → a no-op that never connects; with it → one SMTP send from and to kaan@notya.io, "Notya Bildirim"', async () => {
    let kuruldu = 0
    const gonderilen: Array<Record<string, any>> = []
    const ayarlar: Array<Record<string, any>> = []
    const kur: TasiyiciKur = async (a) => { kuruldu += 1; ayarlar.push(a); return { sendMail: async (p) => { gonderilen.push(p as any) }, close: () => {} } }
    assert.deepEqual(await bildirimGonder({ konu: 'k', metin: 'm', html: 'h' }, 'id-1', { env: {}, tasiyiciKur: kur }), { durum: 'sifre-yok' })
    assert.deepEqual(await bildirimGonder({ konu: 'k', metin: 'm', html: 'h' }, 'id-1', { env: { SMTP_PASS: '' }, tasiyiciKur: kur }), { durum: 'sifre-yok' })
    assert.equal(kuruldu, 0, 'without the password the transport is never even built')
    assert.deepEqual(await bildirimGonder({ konu: 'k', metin: 'm', html: 'h' }, 'id-1', { env: { SMTP_PASS: 'test-only' }, tasiyiciKur: kur }), { durum: 'gonderildi' })
    assert.deepEqual({ ...ayarlar[0], auth: { user: ayarlar[0].auth.user } }, { host: 'smtp.purelymail.com', port: 465, secure: true, auth: { user: 'kaan@notya.io' } })
    assert.deepEqual(gonderilen[0].from, { name: 'Notya Bildirim', address: 'kaan@notya.io' })
    assert.equal(gonderilen[0].to, 'kaan@notya.io')
    assert.equal(gonderilen[0].subject, 'k')
    assert.match(gonderilen[0].messageId, /^<deneme-[0-9a-f]{32}@notya\.io>$/)
    const kotu: TasiyiciKur = async () => ({ sendMail: async () => { throw Object.assign(new Error('535 auth failed secret-echo'), { code: 'EAUTH' }) } })
    const h = await bildirimGonder({ konu: 'k', metin: 'm', html: 'h' }, 'id-1', { env: { SMTP_PASS: 'test-only' }, tasiyiciKur: kotu })
    assert.equal(h.durum, 'hata')
    assert.doesNotMatch(String(h.ayrinti), /secret-echo|test-only/, 'the server reply and the password never reach the log')
  })
  it('no Resend path remains in the signup alert', () => {
    for (const yol of ['lib/kurucu/denemeBildirimi.ts', 'lib/kurucu/smtpGonder.ts', 'lib/kurucu/trDenemeBildir.ts', 'app/api/internal/signup-notify/route.ts']) {
      const k = readFileSync(join(__dirname, '../..', yol), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      assert.doesNotMatch(k, /resend|RESEND_API_KEY/i, yol)
    }
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
    const kur: TasiyiciKur = async () => ({ sendMail: async (p) => { gonderilen.push(p.subject) } })
    const env = { SMTP_PASS: 'test-only' }
    assert.equal(await trDenemeKaydiBildir(sb, u, { env, tasiyiciKur: kur }), 'gonderildi')
    assert.equal(await trDenemeKaydiBildir(sb, u, { env, tasiyiciKur: kur }), 'zaten')
    assert.deepEqual(gonderilen, ['Yeni deneme kaydı — TR — Kardiyoloji'])
    assert.ok(db.tablo('users').find((r) => r.id === u.id)?.deneme_bildirim_at)
  })
  it('without SMTP_PASS the account is still recorded (count stays right) and nothing is sent', async () => {
    const sb = db.istemci() as any
    let kuruldu = 0
    const u = hekim()
    assert.equal(await trDenemeKaydiBildir(sb, u, { tasiyiciKur: async () => { kuruldu += 1; return { sendMail: async () => {} } } }), 'sifre-yok')
    assert.equal(kuruldu, 0)
    assert.ok(db.tablo('users').find((r) => r.id === u.id)?.deneme_bildirim_at)
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

describe('POST /api/internal/signup-notify (country alerts, sent from Türkiye only)', () => {
  let ROTA: Record<string, any>
  before(async () => { ROTA = await import('../../app/api/internal/signup-notify/route') })
  let ipSayac = 0
  const yuk = (o: Record<string, unknown> = {}) => ({ ...bildirimYuku({ ulke: 'au', ad: 'QA Doctor', eposta: 'qa-au@example.test', telefon: null, bransEtiketi: 'General practice', plan: 'trial', zaman: new Date('2026-11-08T10:00:00Z'), toplam: 4 }), ...o })
  const istek = (govde: string, baslik?: string | null) => {
    const h: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': `203.0.113.${(ipSayac++ % 250) + 1}` }
    if (baslik) h[IMZA_BASLIGI] = baslik
    return new NextRequestSinifi('https://www.notya.io/api/internal/signup-notify', { method: 'POST', headers: h, body: govde })
  }
  const imzali = (govde: string, t = Date.now()) => govdeImzaUret(GIZLI, SIGNUP_NOTIFY_AMAC, govde, t)

  it('unsigned, wrongly signed, expired, replayed, re-bodied and GET requests all get 404', async () => {
    process.env.FOUNDER_STATS_SECRET = GIZLI
    try {
      const govde = JSON.stringify(yuk())
      assert.equal((await ROTA.POST(istek(govde))).status, 404, 'unsigned')
      assert.equal((await ROTA.POST(istek(govde, govdeImzaUret('w'.repeat(48), SIGNUP_NOTIFY_AMAC, govde)))).status, 404, 'other secret')
      assert.equal((await ROTA.POST(istek(govde, imzali(govde, Date.now() - IMZA_PENCERESI_MS - 1000)))).status, 404, 'expired')
      assert.equal((await ROTA.POST(istek(govde, imzaUret(GIZLI, 'au')))).status, 404, 'a founder-stats signature is not a signup-notify signature')
      assert.equal((await ROTA.POST(istek(JSON.stringify(yuk({ ad: 'Someone Else' })), imzali(govde)))).status, 404, 'signature lifted onto another body')
      const b = imzali(govde)
      assert.equal((await ROTA.POST(istek(govde, b))).status, 202, 'the first, valid one')
      assert.equal((await ROTA.POST(istek(govde, b))).status, 404, 'replayed')
      assert.equal((await ROTA.GET()).status, 404, 'GET')
    } finally { delete process.env.FOUNDER_STATS_SECRET }
  })
  it('no secret configured → 404 even for a well-formed signature', async () => {
    const govde = JSON.stringify(yuk())
    assert.equal((await ROTA.POST(istek(govde, imzali(govde)))).status, 404)
  })
  it('the payload is exactly the doctor-account keys; any other key (a patient field included) is refused with 404', async () => {
    assert.deepEqual(Object.keys(yuk()).sort(), [...BILDIRIM_YUKU_ANAHTARLARI].sort())
    // (tipler.hastaAlaniVarMi is not used here: it also flags 'telefon', and the doctor's own phone is part of the alert by Kaan's spec.)
    for (const k of Object.keys(yuk())) assert.doesNotMatch(k, /hasta|patient|tc|nhs|medicare|note|not$|visit|muayene|tani|diagnos/i)
    assert.ok(bildirimYukuCoz(yuk()))
    for (const fazla of [{ hasta_adi: 'X' }, { patient_name: 'X' }, { notes: 'x' }]) assert.equal(bildirimYukuCoz({ ...yuk(), ...fazla }), null)
    assert.equal(bildirimYukuCoz({ ...yuk(), ulke: 'tr' }), null, 'Türkiye sends its own alerts directly')
    assert.equal(bildirimYukuCoz({ ...yuk(), ad: 'a\r\nBcc: x@y.z' }), null, 'no header injection through a field')
    process.env.FOUNDER_STATS_SECRET = GIZLI
    try {
      const govde = JSON.stringify({ ...yuk(), hasta_adi: 'Patient Name' })
      assert.equal((await ROTA.POST(istek(govde, imzali(govde)))).status, 404)
    } finally { delete process.env.FOUNDER_STATS_SECRET }
  })
  it('the endpoint is rate-limited per address', async () => {
    const govde = JSON.stringify(yuk())
    const h = { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.7' }
    const durumlar: number[] = []
    for (let i = 0; i < 32; i++) durumlar.push((await ROTA.POST(new NextRequestSinifi('https://www.notya.io/api/internal/signup-notify', { method: 'POST', headers: h, body: govde }))).status)
    assert.equal(durumlar.slice(0, 30).every((d) => d === 404), true)
    assert.equal(durumlar[31], 429)
  })
  it('a valid alert without SMTP_PASS is accepted (202) and is a logged no-op; it goes through the SMTP sender only', () => {
    const k = readFileSync(join(__dirname, '../..', 'app/api/internal/signup-notify/route.ts'), 'utf8')
    assert.match(k, /govdeImzaDogrula\(process\.env\.FOUNDER_STATS_SECRET/)
    assert.match(k, /arkaPlanda\(async \(\) => \{\s*const s = await bildirimGonder\(bildirimEpostasi\(kayit\)/)
    assert.match(k, /bildirimDisiMi\(kayit\.eposta\)/)
  })
  it('body-bound signatures: good passes once, a changed body or purpose fails', () => {
    const t = 1_800_000_000_000
    const b = govdeImzaUret(GIZLI, SIGNUP_NOTIFY_AMAC, '{"a":1}', t)
    assert.deepEqual(govdeImzaDogrula(GIZLI, b, SIGNUP_NOTIFY_AMAC, '{"a":2}', t), { ok: false, neden: 'imza' })
    assert.deepEqual(govdeImzaDogrula(GIZLI, b, 'other', '{"a":1}', t), { ok: false, neden: 'imza' })
    assert.deepEqual(govdeImzaDogrula(GIZLI, b, SIGNUP_NOTIFY_AMAC, '{"a":1}', t), { ok: true })
    assert.deepEqual(govdeImzaDogrula(GIZLI, b, SIGNUP_NOTIFY_AMAC, '{"a":1}', t), { ok: false, neden: 'tekrar' })
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

describe('founder console — session hydration and token path (KURUCU-KONSOL-02, 2026-11-08)', () => {
  const anlik = async () => {}
  const yanit = (status: number, govde: unknown = {}): KurucuYanit => ({ status, ok: status >= 200 && status < 300, json: async () => govde })

  it('waits for a session that appears after mount instead of deciding 404 at once', async () => {
    let okuma = 0
    const t = await oturumTokeniniBekle(async () => (++okuma >= 4 ? 'gec-gelen' : null), anlik)
    assert.equal(t, 'gec-gelen')
    assert.equal(okuma, 4)
  })
  it('a logged-out visitor still ends on not-found after the whole wait, with no API call', async () => {
    let okuma = 0
    let cagri = 0
    const bekleyisler: number[] = []
    const s = await kurucuVerisiniAl({ tokenAl: async () => { okuma++; return null }, getir: async () => { cagri++; return yanit(200) }, bekle: async (ms) => { bekleyisler.push(ms) } })
    assert.deepEqual(s, { tur: 'yok' })
    assert.equal(okuma, OTURUM_BEKLEME_ADIMLARI.length)
    assert.equal(cagri, 0)
    assert.ok(bekleyisler.reduce((a, b) => a + b, 0) >= 2000, 'waits at least 2 s for hydration')
  })
  it('a storage read that throws is treated as "not yet", not as a crash', async () => {
    let n = 0
    const t = await oturumTokeniniBekle(async () => { if (++n < 2) throw new Error('storage blocked'); return 'tok' }, anlik)
    assert.equal(t, 'tok')
  })
  it('the token is sent as a Bearer header and the founder gets the data', async () => {
    const gonderilen: string[] = []
    const s = await kurucuVerisiniAl<{ x: number }>({ tokenAl: async () => 'tok-1', getir: async (t) => { gonderilen.push(t); return yanit(200, { x: 1 }) }, bekle: anlik })
    assert.deepEqual(s, { tur: 'tamam', veri: { x: 1 } })
    assert.deepEqual(gonderilen, ['tok-1'])
  })
  it('a 404 on a stale token gets exactly one forced refresh and retry', async () => {
    const istekler: Array<string | undefined> = []
    const s = await kurucuVerisiniAl({
      tokenAl: async (o) => (o?.forceRefresh ? 'yeni' : 'eski'),
      getir: async (t) => { istekler.push(t); return t === 'yeni' ? yanit(200, { ok: 1 }) : yanit(404) },
      bekle: anlik,
    })
    assert.equal(s.tur, 'tamam')
    assert.deepEqual(istekler, ['eski', 'yeni'])
  })
  it('a non-founder stays on not-found after the one retry; a failed refresh does not loop', async () => {
    let cagri = 0
    assert.deepEqual(await kurucuVerisiniAl({ tokenAl: async (o) => (o?.forceRefresh ? 'yeni' : 'eski'), getir: async () => { cagri++; return yanit(404) }, bekle: anlik }), { tur: 'yok' })
    assert.equal(cagri, 2)
    cagri = 0
    assert.deepEqual(await kurucuVerisiniAl({ tokenAl: async (o) => (o?.forceRefresh ? null : 'eski'), getir: async () => { cagri++; return yanit(404) }, bekle: anlik }), { tur: 'yok' })
    assert.equal(cagri, 1)
  })
  it('a server error shows the retry message, never the console or a login hint', async () => {
    assert.deepEqual(await kurucuVerisiniAl({ tokenAl: async () => 't', getir: async () => yanit(500), bekle: anlik }), { tur: 'hata' })
    assert.deepEqual(await kurucuVerisiniAl({ tokenAl: async () => 't', getir: async () => { throw new Error('offline') }, bekle: anlik }), { tur: 'hata' })
  })
  it('unmounting stops the wait', async () => {
    let iptal = false
    let okuma = 0
    const t = await oturumTokeniniBekle(async () => { okuma++; iptal = true; return null }, anlik, OTURUM_BEKLEME_ADIMLARI, () => iptal)
    assert.equal(t, null)
    assert.equal(okuma, 1)
  })
  it('server: lower-case "bearer", extra spaces and a mixed-case allowlist entry still admit the founder; others stay 404', async () => {
    const onceki = process.env.FOUNDER_EMAILS
    process.env.FOUNDER_EMAILS = ' Kaan@Notya.io , KAANARI@mac.com '
    try {
      db.kullanicilar.set('qa-mac', { id: randomUUID(), email: 'kaanari@mac.com' })
      db.kullanicilar.set('qa-baska', { id: randomUUID(), email: 'baska@ornek.test' })
      for (const h of ['Bearer qa-mac', 'bearer qa-mac', 'BEARER   qa-mac  ']) {
        const y = await OZET.GET(new NextRequestSinifi('http://localhost/api/kurucu/ozet', { headers: { authorization: h } }))
        assert.equal(y.status, 200, h)
      }
      const y = await OZET.GET(new NextRequestSinifi('http://localhost/api/kurucu/ozet', { headers: { authorization: 'bearer qa-baska' } }))
      assert.equal(y.status, 404)
    } finally {
      if (onceki === undefined) delete process.env.FOUNDER_EMAILS
      else process.env.FOUNDER_EMAILS = onceki
    }
  })
  it('the console waits through the shared helper (no single-shot token read left in the component)', () => {
    const src = readFileSync(join(process.cwd(), 'components/kurucu/KurucuKonsolu.tsx'), 'utf8')
    assert.match(src, /kurucuVerisiniAl/)
    assert.doesNotMatch(src, /if \(!token\) \{ if \(!iptal\) setD\(\{ tur: 'yok' \}\)/)
    assert.doesNotMatch(src, /DOKTOR_GIRIS|\/giris|sign in|log in/i)
  })
})

describe('founder console — notya.io and www.notya.io are two session stores (KURUCU-KONSOL-03, 2026-11-08)', () => {
  const anlik = async () => {}
  const yanit = (status: number, govde: unknown = {}): KurucuYanit => ({ status, ok: status >= 200 && status < 300, json: async () => govde })

  it('no session on this origin → exactly one hop to the sibling origin, marked so it cannot loop', () => {
    assert.equal(kardesKokAdresi('https://notya.io/kurucu', false), 'https://www.notya.io/kurucu#h')
    assert.equal(kardesKokAdresi('https://www.notya.io/kurucu', false), 'https://notya.io/kurucu#h')
    assert.equal(kardesKokAdresi('https://WWW.notya.io/kurucu?x=1', false), 'https://notya.io/kurucu#h')
    assert.equal(kardesKokAdresi('https://www.notya.io/kurucu#h', false), null, 'already hopped → not-found here')
    assert.equal(kardesKokAdresi('https://notya.io/kurucu#h', false), null)
  })
  it('a session that was read but refused (non-founder) gets no hop; previews, localhost and junk get none either', () => {
    assert.equal(kardesKokAdresi('https://notya.io/kurucu', true), null)
    assert.equal(kardesKokAdresi('https://notya-ai-getvelacom.vercel.app/kurucu', false), null)
    assert.equal(kardesKokAdresi('http://localhost:3000/kurucu', false), null)
    assert.equal(kardesKokAdresi('http://notya.io/kurucu', false), null)
    assert.equal(kardesKokAdresi('not a url', false), null)
  })
  it('founder logged in only on www: apex finds no token (hop), www finds it and the founder gets the console', async () => {
    const depolar: Record<string, string | null> = { 'notya.io': null, 'www.notya.io': 'tok-www' }
    const ac = async (href: string) => {
      let goruldu = false
      const host = new URL(href).hostname
      const s = await kurucuVerisiniAl<{ ok: number }>({
        tokenAl: async () => { const t = depolar[host]; if (t) goruldu = true; return t },
        getir: async (t) => (t === 'tok-www' ? yanit(200, { ok: 1 }) : yanit(404)),
        bekle: anlik,
      })
      return { s, kardes: s.tur === 'yok' ? kardesKokAdresi(href, goruldu) : null }
    }
    const apex = await ac('https://notya.io/kurucu')
    assert.deepEqual(apex, { s: { tur: 'yok' }, kardes: 'https://www.notya.io/kurucu#h' })
    const www = await ac(apex.kardes!)
    assert.deepEqual(www, { s: { tur: 'tamam', veri: { ok: 1 } }, kardes: null })
  })
  it('logged out on both origins: one hop, then the standard not-found; a non-founder session: not-found with no hop', async () => {
    const bos = await kurucuVerisiniAl({ tokenAl: async () => null, getir: async () => yanit(200), bekle: anlik })
    assert.deepEqual(bos, { tur: 'yok' })
    assert.equal(kardesKokAdresi('https://www.notya.io/kurucu#h', false), null)
    let goruldu = false
    const baska = await kurucuVerisiniAl({ tokenAl: async () => { goruldu = true; return 'baska' }, getir: async () => yanit(404), bekle: anlik })
    assert.deepEqual(baska, { tur: 'yok' })
    assert.equal(kardesKokAdresi('https://notya.io/kurucu', goruldu), null)
  })
  it('the console hops through the shared helper and still carries no login hint', () => {
    const src = readFileSync(join(process.cwd(), 'components/kurucu/KurucuKonsolu.tsx'), 'utf8')
    assert.match(src, /kardesKokAdresi\(href, tokenGoruldu\)/)
    assert.match(src, /ensureDoctorAccessToken/)
    assert.doesNotMatch(src, /DOKTOR_GIRIS|\/giris|sign in|log in/i)
  })
})
