/**
 * AU-BETA-02 — the REAL payment adapters, the webhooks and the reconciliation, against FABRICATED request/response fixtures built from the
 * providers' public documentation (see the adapters' headers and docs/au/SOURCES.md). NOTHING here talks to Stripe or Tyro: the Stripe SDK is
 * given a fake fetch (so the requests it really builds are read), Tyro gets a fake fetch, webhooks are signed with the SDK's own test-header generator.
 * What these tests prove is OUR code's behaviour; they do not prove that Stripe or Tyro accept it (docs/au/STRIPE-TEST-RUNBOOK.md does that, by hand).
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createHmac } from 'node:crypto'
import { join } from 'node:path'
import Stripe from 'stripe'
import { sahteVeritabani } from '../testing/sahteVeritabani'
import { stripeAnahtarModu, stripeGizliAnahtarMi, stripeIstemciYap, stripeOlayiDogrula, stripeSaglayici } from './stripe'
import { tyroImzaDogru, tyroOlayiOku, tyroSaglayici } from './tyro'
import { uzlastirKayitlarla, uzlasmaCsv } from './odemeSaglayici'
import { ulkePaketi } from '../ulke'
import { baglantiKaydet, baglantiOku, faturaIade, faturaOde, gercekSaglayiciYap, kimlikOku, uzlasma } from './fatura'
import { stripeWebhookIsle, tyroWebhookIsle } from './webhook'
import type { GercekSaglayici, SaglayiciKaydi } from './saglayiciTipleri'

const KOK = join(__dirname, '../../..')
const D = '10000000-0000-4000-8000-00000000000a'
const D2 = '10000000-0000-4000-8000-00000000000b'
const F1 = '50000000-0000-4000-8000-000000000001'
const KEY = 'rk_test_SYNTHETICKEY0123456789'
const WHSEC = 'whsec_SYNTHETICSECRET0123456789'
const LIVEKEY = ('rk_' + 'live_') + 'SYNTHETICLIVEKEY0123456789'
const LIVEWHSEC = 'whsec_SYNTHETICLIVESECRET0123456789'

type Cagri = { url: string; method: string; headers: Record<string, string>; govde: string }
function sahteGetir(yanitlar: (c: Cagri) => { durum?: number; govde: unknown } | undefined) {
  const cagrilar: Cagri[] = []
  const f = (async (u: unknown, init?: RequestInit) => {
    const h: Record<string, string> = {}
    new Headers(init?.headers).forEach((v, k) => { h[k.toLowerCase()] = v })
    const c: Cagri = { url: String(u), method: init?.method ?? 'GET', headers: h, govde: typeof init?.body === 'string' ? init.body : '' }
    cagrilar.push(c)
    const y = yanitlar(c) ?? { durum: 404, govde: { error: { message: 'no fixture' } } }
    return new Response(JSON.stringify(y.govde), { status: y.durum ?? 200, headers: { 'content-type': 'application/json', 'request-id': 'req_fixture' } })
  }) as typeof fetch
  return { f, cagrilar }
}
const stripeSahte = (yanit: (c: Cagri) => { durum?: number; govde: unknown } | undefined) => {
  const g = sahteGetir(yanit)
  return { ...g, s: stripeIstemciYap(KEY, Stripe.createFetchHttpClient(g.f)) }
}
const form = (g: string) => Object.fromEntries(new URLSearchParams(g))

describe('Stripe: key mode (restricted keys only), full-access keys refused', () => {
  it('reads test / live from a RESTRICTED key prefix; secret, publishable and odd keys are neither', () => {
    assert.equal(stripeAnahtarModu('rk_test_ABCDEFGH1234'), 'test')
    assert.equal(stripeAnahtarModu(('rk_' + 'live_') + 'ABCDEFGH1234'), 'live')
    assert.equal(stripeAnahtarModu('sk_test_ABCDEFGH1234'), null)
    assert.equal(stripeAnahtarModu(('sk_' + 'live_') + 'ABCDEFGH1234'), null)
    assert.equal(stripeAnahtarModu('pk_test_ABCDEFGH1234'), null)
    assert.equal(stripeAnahtarModu('whsec_ABCDEFGH1234'), null)
    assert.equal(stripeAnahtarModu(''), null)
  })
  it('a full-access secret key is recognised in both modes', () => {
    assert.equal(stripeGizliAnahtarMi(('sk_' + 'live_') + 'ABCDEFGH1234'), true)
    assert.equal(stripeGizliAnahtarMi('sk_test_ABCDEFGH1234'), true)
    assert.equal(stripeGizliAnahtarMi(('rk_' + 'live_') + 'ABCDEFGH1234'), false)
    assert.equal(stripeGizliAnahtarMi('pk_live_ABCDEFGH1234'), false)
  })
})

describe('Stripe adapter: the requests the SDK really builds (fabricated responses)', () => {
  it('dogrula: one cheap authenticated read; 401 = bad key, 403 = missing permission', async () => {
    const ok = stripeSahte(() => ({ govde: { object: 'list', data: [], has_more: false, url: '/v1/payment_intents' } }))
    assert.deepEqual(await stripeSaglayici(ok.s).dogrula(), { tamam: true })
    assert.equal(ok.cagrilar[0].method, 'GET'); assert.match(ok.cagrilar[0].url, /\/v1\/payment_intents\?limit=1/)
    assert.equal(ok.cagrilar[0].headers.authorization, `Bearer ${KEY}`)
    const kotu = stripeSahte(() => ({ durum: 401, govde: { error: { type: 'invalid_request_error', message: 'Invalid API Key provided' } } }))
    assert.deepEqual(await stripeSaglayici(kotu.s).dogrula(), { tamam: false, hata: 'anahtar' })
    const izin = stripeSahte(() => ({ durum: 403, govde: { error: { type: 'invalid_request_error', message: 'The provided key does not have the required permissions' } } }))
    assert.deepEqual(await stripeSaglayici(izin.s).dogrula(), { tamam: false, hata: 'izin' })
  })

  it('baslat: a hosted Checkout Session on the DOCTOR\'S account — invoice id in both metadata, integer cents, no platform money fields', async () => {
    const { s, cagrilar } = stripeSahte(() => ({ govde: { id: 'cs_test_1', object: 'checkout.session', url: 'https://checkout.stripe.com/c/pay/cs_test_1', payment_status: 'unpaid' } }))
    const r = await stripeSaglayici(s).baslat({ faturaId: F1, no: 7, tutarKurus: 11000, paraKodu: 'AUD', basariUrl: 'https://notya.io/au/billing?odeme=tamam', iptalUrl: 'https://notya.io/au/billing?odeme=iptal' })
    assert.deepEqual(r, { ref: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' })
    const c = cagrilar[0]; const f = form(c.govde)
    assert.equal(c.method, 'POST'); assert.match(c.url, /\/v1\/checkout\/sessions$/)
    assert.equal(c.headers.authorization, `Bearer ${KEY}`)
    assert.match(c.headers['idempotency-key'], /^notya-cs-/)
    assert.equal(f.mode, 'payment'); assert.equal(f.client_reference_id, F1)
    assert.equal(f['metadata[notya_invoice_id]'], F1); assert.equal(f['payment_intent_data[metadata][notya_invoice_id]'], F1)
    assert.equal(f['line_items[0][price_data][currency]'], 'aud'); assert.equal(f['line_items[0][price_data][unit_amount]'], '11000'); assert.equal(f['line_items[0][quantity]'], '1')
    assert.equal(c.headers['stripe-account'], undefined)
    for (const k of Object.keys(f)) assert.doesNotMatch(k, /application_fee|transfer_data|on_behalf_of|stripe_account/, `not the merchant: ${k}`)
  })

  it('iade: full or partial on the PaymentIntent, idempotency key per (invoice, already refunded, amount)', async () => {
    const { s, cagrilar } = stripeSahte(() => ({ govde: { id: 're_1', object: 'refund', amount: 4000, status: 'succeeded', payment_intent: 'pi_1' } }))
    const sg = stripeSaglayici(s)
    const a = await sg.iade({ faturaId: F1, odemeRef: 'pi_1', kurus: 4000, oncekiIadeKurus: 0 })
    assert.deepEqual(a, { tamam: true, ref: 're_1', iadeKurus: 4000, bekliyor: false })
    const f = form(cagrilar[0].govde)
    assert.match(cagrilar[0].url, /\/v1\/refunds$/); assert.equal(f.payment_intent, 'pi_1'); assert.equal(f.amount, '4000'); assert.equal(f['metadata[notya_invoice_id]'], F1)
    assert.equal(cagrilar[0].headers['idempotency-key'], `notya-rf-${F1}-0-4000`)
    await sg.iade({ faturaId: F1, odemeRef: 'pi_1', kurus: 4000, oncekiIadeKurus: 0 })
    assert.equal(cagrilar[1].headers['idempotency-key'], cagrilar[0].headers['idempotency-key'], 'a retry of the same click is the same refund')
    await sg.iade({ faturaId: F1, odemeRef: 'pi_1', kurus: 4000, oncekiIadeKurus: 4000 })
    assert.notEqual(cagrilar[2].headers['idempotency-key'], cagrilar[0].headers['idempotency-key'], 'a second refund is a different request')
  })

  it('iade: Stripe refusing (already refunded / too much) is a failure, not a success', async () => {
    const { s } = stripeSahte(() => ({ durum: 400, govde: { error: { type: 'invalid_request_error', message: 'Refund amount ($50.00) is greater than unrefunded amount on charge ($40.00)' } } }))
    assert.equal((await stripeSaglayici(s).iade({ faturaId: F1, odemeRef: 'pi_1', kurus: 5000, oncekiIadeKurus: 0 })).tamam, false)
  })

  it('kayitlar: lists the range with the latest charge expanded and reads amount, refunded, currency, invoice id', async () => {
    const pi = (id: string, extra: Record<string, unknown>) => ({ id, object: 'payment_intent', amount: 11000, amount_received: 11000, currency: 'aud', status: 'succeeded', created: 1_790_000_000, metadata: { notya_invoice_id: F1 }, latest_charge: { id: 'ch_1', object: 'charge', amount_refunded: 4000 }, ...extra })
    const { s, cagrilar } = stripeSahte(() => ({ govde: { object: 'list', has_more: false, url: '/v1/payment_intents', data: [pi('pi_1', {}), pi('pi_2', { status: 'requires_payment_method', amount_received: 0, metadata: {}, latest_charge: null })] } }))
    const k = await stripeSaglayici(s).kayitlar(1_789_000_000, 1_791_000_000)
    const u = new URL(cagrilar[0].url)
    assert.equal(u.searchParams.get('created[gte]'), '1789000000'); assert.equal(u.searchParams.get('created[lte]'), '1791000000'); assert.equal(u.searchParams.get('expand[0]'), 'data.latest_charge')
    assert.deepEqual(k[0], { ref: 'pi_1', faturaId: F1, tutarKurus: 11000, iadeKurus: 4000, paraKodu: 'AUD', basarili: true, olusturuldu: 1_790_000_000_000 })
    assert.equal(k[1].basarili, false); assert.equal(k[1].faturaId, null)
  })
})

describe('Stripe webhook signature (stripe.webhooks.constructEvent)', () => {
  const stripe = new Stripe(KEY)
  const govde = JSON.stringify({ id: 'evt_1', object: 'event', type: 'charge.refunded', data: { object: {} } })
  const imza = (g: string, gizli = WHSEC, ts?: number) => stripe.webhooks.generateTestHeaderString({ payload: g, secret: gizli, timestamp: ts })
  it('valid → event; tampered body, wrong secret, stale timestamp, missing header → refused', () => {
    const ok = stripeOlayiDogrula(govde, imza(govde), WHSEC); assert.equal(ok.tamam, true)
    assert.deepEqual(stripeOlayiDogrula(govde + ' ', imza(govde), WHSEC), { tamam: false, neden: 'gecersiz' })
    assert.deepEqual(stripeOlayiDogrula(govde, imza(govde, 'whsec_OTHERSECRET0123456789'), WHSEC), { tamam: false, neden: 'gecersiz' })
    assert.deepEqual(stripeOlayiDogrula(govde, imza(govde, WHSEC, Math.floor(Date.now() / 1000) - 3600), WHSEC), { tamam: false, neden: 'gecersiz' })
    assert.deepEqual(stripeOlayiDogrula(govde, null, WHSEC), { tamam: false, neden: 'imza_yok' })
    assert.deepEqual(stripeOlayiDogrula(govde, imza(govde), ''), { tamam: false, neden: 'gizli_yok' })
  })
})

// ───────────────────────── flows against the stand-in database ─────────────────────────
const vt = sahteVeritabani()
const sb = () => vt.createClient() as unknown as import('@supabase/supabase-js').SupabaseClient
const sahteStripeUret = (tamam = true): ((a: string) => GercekSaglayici) => () => ({ ad: 'stripe', async dogrula() { return tamam ? { tamam: true } : { tamam: false, hata: 'anahtar' } }, async baslat() { throw new Error('unused') }, async iade() { throw new Error('unused') }, async kayitlar() { return [] } })
const fatura = (extra: Record<string, unknown> = {}) => ({ id: F1, ulke: ulkePaketi().kod, doctor_id: D, fatura_no: 1, patient_id: 'p1', session_id: null, govde_encrypted: 'x', alt_toplam_kurus: 10000, vergi_kurus: 1000, toplam_kurus: 11000, iade_kurus: 0, para_kodu: 'AUD', durum: 'taslak', saglayici: null, odeme_ref: null, odendi_at: null, ...extra })
const satir = (ad: string) => vt.tablo(ad)

beforeEach(() => { for (const ad of ['ulke_faturalar', 'ulke_odeme_baglantilari', 'ulke_odeme_olaylari']) vt.tablo(ad).length = 0 })

describe('connection record: restricted keys, live safeguards, key check, encryption', () => {
  it('a full-access secret key is refused in BOTH modes and nothing is stored; a publishable key is invalid', async () => {
    for (const k of [('sk_' + 'live_') + 'ABCDEFGH12345678', 'sk_test_ABCDEFGH12345678']) assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: k, webhookGizli: LIVEWHSEC, canliOnay: true }, fetch, sahteStripeUret()), 'SIR_ANAHTAR', k)
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: 'pk_test_ABCDEFGH12345678' }, fetch, sahteStripeUret()), 'GECERSIZ')
    assert.equal(satir('ulke_odeme_baglantilari').length, 0)
  })
  it('a LIVE key needs its live webhook secret AND the explicit confirmation before anything is checked or stored', async () => {
    let cagrildi = 0
    const sayac = (): ((a: string) => GercekSaglayici) => (a) => { cagrildi++; return sahteStripeUret()(a) }
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, canliOnay: true }, fetch, sayac()), 'WEBHOOK_GEREKLI')
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, webhookGizli: LIVEWHSEC }, fetch, sayac()), 'CANLI_ONAY')
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, webhookGizli: LIVEWHSEC, canliOnay: 'true' }, fetch, sayac()), 'CANLI_ONAY', 'only the boolean true confirms')
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, webhookGizli: 'not-a-secret', canliOnay: true }, fetch, sayac()), 'GECERSIZ')
    assert.equal(cagrildi, 0, 'Stripe is not even asked while a safeguard is missing')
    assert.equal(satir('ulke_odeme_baglantilari').length, 0)
  })
  it('a confirmed live key with its secret is checked, stored ENCRYPTED with mode live, and never read back whole', async () => {
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, webhookGizli: LIVEWHSEC, canliOnay: true }, fetch, sahteStripeUret()), 'TAMAM')
    const satirlar = satir('ulke_odeme_baglantilari'); assert.equal(satirlar.length, 1); assert.equal(satirlar[0].mod, 'live')
    const ham = JSON.stringify(satirlar)
    assert.ok(!ham.includes(LIVEKEY) && !ham.includes(LIVEWHSEC) && !ham.includes('SYNTHETICLIVE'), 'no plaintext credential in the stored row')
    const b = await baglantiOku(sb(), D)
    assert.deepEqual(b, { saglayici: 'stripe', mod: 'live', sonDort: LIVEKEY.slice(-4), webhookKurulu: true, etkin: true })
    assert.ok(!JSON.stringify(b).includes('SYNTHETIC'))
    assert.equal((await kimlikOku(sb(), D))?.mod, 'live')
  })
  it('a test webhook secret is never carried over to a live key (and the reverse); a live secret is kept for the same mode', async () => {
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY, webhookGizli: WHSEC }, fetch, sahteStripeUret())
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, canliOnay: true }, fetch, sahteStripeUret()), 'WEBHOOK_GEREKLI')
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, webhookGizli: LIVEWHSEC, canliOnay: true }, fetch, sahteStripeUret())
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, canliOnay: true }, fetch, sahteStripeUret()), 'TAMAM')
    assert.equal((await kimlikOku(sb(), D))?.kimlik.webhookGizli, LIVEWHSEC)
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY }, fetch, sahteStripeUret())
    const t = await kimlikOku(sb(), D); assert.equal(t?.mod, 'test'); assert.equal(t?.kimlik.webhookGizli, undefined, 'the live secret does not follow the key back to test mode')
  })
  it('a pack that offers only Stripe refuses Tyro', async () => {
    const eski = ulkePaketi().uzanti?.fatura
    if (!eski || (eski.saglayicilar ?? ['stripe']).includes('tyro')) return
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'tyro', istemciId: 'abc', istemciGizli: 'def', konumId: 'ghi' }), 'GECERSIZ')
  })
  it('a key Stripe rejects is not stored', async () => {
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY }, fetch, sahteStripeUret(false)), 'ANAHTAR_REDDEDILDI')
    assert.equal(satir('ulke_odeme_baglantilari').length, 0)
  })
  it('a checked test key is stored ENCRYPTED and never read back whole; the webhook secret is format-checked', async () => {
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY, webhookGizli: 'not-a-secret' }, fetch, sahteStripeUret()), 'GECERSIZ')
    assert.equal(await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY, webhookGizli: WHSEC }, fetch, sahteStripeUret()), 'TAMAM')
    const ham = JSON.stringify(satir('ulke_odeme_baglantilari'))
    assert.ok(!ham.includes(KEY) && !ham.includes(WHSEC) && !ham.includes('SYNTHETICKEY'), 'no plaintext credential in the stored row')
    const b = await baglantiOku(sb(), D)
    assert.deepEqual(b, { saglayici: 'stripe', mod: 'test', sonDort: KEY.slice(-4), webhookKurulu: true, etkin: true })
    assert.ok(!JSON.stringify(b).includes('SYNTHETIC'))
    assert.equal((await kimlikOku(sb(), D))?.kimlik.anahtar, KEY)
    assert.equal(await baglantiOku(sb(), D2), null, 'another doctor has no connection')
  })
  it('saving again without a webhook secret keeps the one already stored', async () => {
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY, webhookGizli: WHSEC }, fetch, sahteStripeUret())
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY }, fetch, sahteStripeUret())
    assert.equal((await kimlikOku(sb(), D))?.kimlik.webhookGizli, WHSEC)
  })
})

describe('pay and refund through a real adapter (stand-in adapter, stand-in database)', () => {
  const sahteGercek = (cagri: string[]): GercekSaglayici => ({ ad: 'stripe', async dogrula() { return { tamam: true } },
    async baslat(i) { cagri.push(`baslat:${i.faturaId}:${i.tutarKurus}`); return { ref: 'cs_test_9', url: 'https://checkout.stripe.com/c/pay/cs_test_9' } },
    async iade(i) { cagri.push(`iade:${i.odemeRef}:${i.kurus}:${i.oncekiIadeKurus}`); return { tamam: true, ref: 're_9', iadeKurus: i.kurus, bekliyor: false } }, async kayitlar() { return [] } })
  it('Pay does NOT mark the invoice paid: it keeps the draft, stores the session and returns the hosted URL', async () => {
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY }, fetch, sahteStripeUret()); satir('ulke_faturalar').push(fatura())
    const cagri: string[] = []
    const r = await faturaOde(sb(), D, F1, { basariUrl: 'https://x/ok', iptalUrl: 'https://x/no' }, Date.now(), (k, s) => (k && s ? sahteGercek(cagri) : null))
    assert.deepEqual(r, { tamam: true, url: 'https://checkout.stripe.com/c/pay/cs_test_9', paySecret: undefined, bekliyor: true })
    const f = satir('ulke_faturalar')[0]; assert.equal(f.durum, 'taslak'); assert.equal(f.saglayici, 'stripe'); assert.equal(f.odeme_ref, 'cs_test_9')
    assert.deepEqual(cagri, [`baslat:${F1}:11000`])
    assert.equal(f.odeme_modu, 'test', 'the mode of the connection is recorded on the invoice')
  })
  it('a payment started under a LIVE connection is recorded as live, and is refunded only through a live connection', async () => {
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, webhookGizli: LIVEWHSEC, canliOnay: true }, fetch, sahteStripeUret()); satir('ulke_faturalar').push(fatura())
    const cagri: string[] = []
    await faturaOde(sb(), D, F1, { basariUrl: 'https://x/ok', iptalUrl: 'https://x/no' }, Date.now(), (k, s) => (k && s ? sahteGercek(cagri) : null))
    assert.equal(satir('ulke_faturalar')[0].odeme_modu, 'live')
    satir('ulke_faturalar')[0].durum = 'odendi'; satir('ulke_faturalar')[0].odeme_ref = 'pi_live_9'
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY }, fetch, sahteStripeUret())
    assert.deepEqual(await faturaIade(sb(), D, F1, 100, (k, s) => (k && s ? sahteGercek(cagri) : null)), { tamam: false, kod: 'DURUM' }, 'a live payment is not refunded through a test connection')
    assert.ok(!cagri.some((c) => c.startsWith('iade')))
  })
  it('without a connection Pay is the DEMO payment and says so in the stored provider', async () => {
    satir('ulke_faturalar').push(fatura())
    const r = await faturaOde(sb(), D, F1)
    assert.equal(r.tamam, true); assert.equal(satir('ulke_faturalar')[0].saglayici, 'demo'); assert.equal(satir('ulke_faturalar')[0].durum, 'odendi')
  })
  it('another doctor cannot pay or refund this invoice', async () => {
    satir('ulke_faturalar').push(fatura())
    assert.deepEqual(await faturaOde(sb(), D2, F1), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await faturaIade(sb(), D2, F1, 100), { tamam: false, kod: 'NOT_FOUND' })
  })
  it('refund: partial then rest through the connected account; never above what is left', async () => {
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY }, fetch, sahteStripeUret())
    satir('ulke_faturalar').push(fatura({ durum: 'odendi', saglayici: 'stripe', odeme_ref: 'pi_9' }))
    const cagri: string[] = []; const u = (k: unknown, s: unknown) => (k && s ? sahteGercek(cagri) : null)
    assert.deepEqual(await faturaIade(sb(), D, F1, 4000, u), { tamam: true, iadeKurus: 4000 })
    assert.deepEqual(await faturaIade(sb(), D, F1, 7001, u), { tamam: false, kod: 'GECERSIZ' })
    assert.deepEqual(await faturaIade(sb(), D, F1, 7000, u), { tamam: true, iadeKurus: 11000 })
    assert.deepEqual(cagri, ['iade:pi_9:4000:0', 'iade:pi_9:7000:4000'])
  })
  it('an invoice paid on the provider is refunded on the provider: no connection → the refund fails, it is not faked', async () => {
    satir('ulke_faturalar').push(fatura({ durum: 'odendi', saglayici: 'stripe', odeme_ref: 'pi_9' }))
    assert.deepEqual(await faturaIade(sb(), D, F1, 100), { tamam: false, kod: 'BASARISIZ' })
  })
  it('gercekSaglayiciYap: Tyro stays off without NOTYA_TYRO_ETKIN; Stripe needs a restricted key (test or live), never a secret key', () => {
    assert.equal(gercekSaglayiciYap({ tyro: { istemciId: 'a', istemciGizli: 'b', konumId: 'c' } }, 'tyro'), null)
    assert.equal(gercekSaglayiciYap({ anahtar: ('rk_' + 'live_') + 'ABCDEFGH12345678' }, 'stripe')?.ad, 'stripe')
    assert.equal(gercekSaglayiciYap({ anahtar: ('sk_' + 'live_') + 'ABCDEFGH12345678' }, 'stripe'), null)
    assert.equal(gercekSaglayiciYap({ anahtar: 'sk_test_ABCDEFGH12345678' }, 'stripe'), null)
    assert.equal(gercekSaglayiciYap({ anahtar: KEY }, 'stripe')?.ad, 'stripe')
    assert.equal(gercekSaglayiciYap(null, null), null)
  })
})

describe('Stripe webhook handler: verified, de-duplicated, amount-checked', () => {
  const stripe = new Stripe(KEY)
  const olay = (id: string, type: string, obj: Record<string, unknown>, livemode = false) => JSON.stringify({ id, object: 'event', type, livemode, created: Math.floor(Date.now() / 1000), data: { object: obj } })
  const imzali = (g: string, gizli = WHSEC) => stripe.webhooks.generateTestHeaderString({ payload: g, secret: gizli })
  const oturum = (extra: Record<string, unknown> = {}) => ({ id: 'cs_test_9', object: 'checkout.session', payment_status: 'paid', amount_total: 11000, currency: 'aud', payment_intent: 'pi_9', metadata: { notya_invoice_id: F1 }, ...extra })
  beforeEach(async () => { await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: KEY, webhookGizli: WHSEC }, fetch, sahteStripeUret()); satir('ulke_faturalar').push(fatura({ saglayici: 'stripe', odeme_ref: 'cs_test_9' })) })

  it('a signed checkout.session.completed marks the invoice paid with the PaymentIntent as reference', async () => {
    const g = olay('evt_1', 'checkout.session.completed', oturum())
    assert.deepEqual(await stripeWebhookIsle(sb(), D, g, imzali(g)), { durum: 200, sonuc: 'paid' })
    const f = satir('ulke_faturalar')[0]; assert.equal(f.durum, 'odendi'); assert.equal(f.odeme_ref, 'pi_9'); assert.ok(f.odendi_at)
  })
  it('LIVE connection: a signed live event is processed with the live secret and the invoice is stamped live; a test-mode event is ignored', async () => {
    satir('ulke_odeme_baglantilari').length = 0
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, webhookGizli: LIVEWHSEC, canliOnay: true }, fetch, sahteStripeUret())
    const t = olay('evt_t', 'checkout.session.completed', oturum(), false)
    assert.deepEqual(await stripeWebhookIsle(sb(), D, t, imzali(t, LIVEWHSEC)), { durum: 200, sonuc: 'mode_mismatch' })
    assert.equal((await stripeWebhookIsle(sb(), D, t, imzali(t, WHSEC))).durum, 400, 'the test secret does not sign for a live connection')
    assert.equal(satir('ulke_odeme_olaylari').length, 0); assert.equal(satir('ulke_faturalar')[0].durum, 'taslak')
    const g = olay('evt_l', 'checkout.session.completed', oturum(), true)
    assert.deepEqual(await stripeWebhookIsle(sb(), D, g, imzali(g, LIVEWHSEC)), { durum: 200, sonuc: 'paid' })
    assert.equal(satir('ulke_faturalar')[0].odeme_modu, 'live')
  })
  it('TEST connection: a live-mode event is ignored even when somebody signed it', async () => {
    const g = olay('evt_x', 'checkout.session.completed', oturum(), true)
    assert.deepEqual(await stripeWebhookIsle(sb(), D, g, imzali(g)), { durum: 200, sonuc: 'mode_mismatch' })
    assert.equal(satir('ulke_faturalar')[0].durum, 'taslak')
  })
  it('REPLAY: the same event again is acknowledged and not processed twice', async () => {
    const g = olay('evt_1', 'checkout.session.completed', oturum())
    await stripeWebhookIsle(sb(), D, g, imzali(g))
    const once = JSON.stringify(satir('ulke_faturalar')[0])
    assert.deepEqual(await stripeWebhookIsle(sb(), D, g, imzali(g)), { durum: 200, sonuc: 'duplicate' })
    assert.equal(JSON.stringify(satir('ulke_faturalar')[0]), once); assert.equal(satir('ulke_odeme_olaylari').length, 1)
  })
  it('bad signature → 400, nothing recorded, nothing changed; unsigned → 400; no endpoint → 404', async () => {
    const g = olay('evt_2', 'checkout.session.completed', oturum())
    assert.equal((await stripeWebhookIsle(sb(), D, g, imzali(g, 'whsec_WRONGSECRET0123456789'))).durum, 400)
    assert.equal((await stripeWebhookIsle(sb(), D, g, null)).durum, 400)
    assert.equal((await stripeWebhookIsle(sb(), D, g + ' ', imzali(g))).durum, 400)
    assert.equal(satir('ulke_odeme_olaylari').length, 0); assert.equal(satir('ulke_faturalar')[0].durum, 'taslak')
    assert.equal((await stripeWebhookIsle(sb(), D2, g, imzali(g))).durum, 404, 'another doctor\'s id finds no endpoint')
  })
  it('the AMOUNT and CURRENCY must equal the invoice: a smaller or foreign-currency payment does not mark it paid', async () => {
    for (const [i, extra] of [{ amount_total: 100 }, { currency: 'usd' }].entries()) {
      const g = olay(`evt_m${i}`, 'checkout.session.completed', oturum(extra))
      assert.deepEqual(await stripeWebhookIsle(sb(), D, g, imzali(g)), { durum: 200, sonuc: 'mismatch' })
    }
    assert.equal(satir('ulke_faturalar')[0].durum, 'taslak')
  })
  it('an unpaid session, another doctor\'s invoice id and unrelated events change nothing', async () => {
    for (const [i, g] of [olay('evt_u1', 'checkout.session.completed', oturum({ payment_status: 'unpaid' })), olay('evt_u2', 'payment_intent.created', {})].entries()) assert.equal((await stripeWebhookIsle(sb(), D, g, imzali(g))).sonuc, 'ignored', String(i))
    satir('ulke_faturalar').push(fatura({ id: '50000000-0000-4000-8000-000000000002', doctor_id: D2, fatura_no: 1 }))
    const g = olay('evt_u3', 'checkout.session.completed', oturum({ metadata: { notya_invoice_id: '50000000-0000-4000-8000-000000000002' } }))
    assert.equal((await stripeWebhookIsle(sb(), D, g, imzali(g))).sonuc, 'unknown_invoice')
    assert.equal(satir('ulke_faturalar').find((x) => x.doctor_id === D2)?.durum, 'taslak')
  })
  it('charge.refunded raises the invoice\'s refunded total to the provider\'s figure, never lowers it', async () => {
    const g0 = olay('evt_p', 'checkout.session.completed', oturum()); await stripeWebhookIsle(sb(), D, g0, imzali(g0))
    const g1 = olay('evt_r1', 'charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: 'pi_9', amount_refunded: 4000 })
    assert.equal((await stripeWebhookIsle(sb(), D, g1, imzali(g1))).sonuc, 'refund_synced'); assert.equal(satir('ulke_faturalar')[0].iade_kurus, 4000)
    const g2 = olay('evt_r2', 'charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: 'pi_9', amount_refunded: 1000 })
    await stripeWebhookIsle(sb(), D, g2, imzali(g2)); assert.equal(satir('ulke_faturalar')[0].iade_kurus, 4000)
    const g3 = olay('evt_r3', 'charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: 'pi_9', amount_refunded: 999999 })
    await stripeWebhookIsle(sb(), D, g3, imzali(g3)); assert.equal(satir('ulke_faturalar')[0].iade_kurus, 11000)
  })
})

describe('Tyro adapter and webhook (fabricated fixtures from the documented surface)', () => {
  const K = { istemciId: 'client_abc12345', istemciGizli: 'secret_xyz98765', konumId: 'tc-examplelocation-3000' }
  const fix = (c: Cagri) => {
    if (c.url.endsWith('/openid-configuration')) return { govde: { token_endpoint: 'https://auth.connect.tyro.com/oauth/token' } }
    if (c.url.endsWith('/oauth/token')) return { govde: { access_token: 'jwt.fixture', expires_in: 43200, token_type: 'Bearer' } }
    if (c.url === 'https://api.tyro.com/connect/pay/requests' && c.method === 'POST') return { govde: { id: 'pr_1', paySecret: 'ps_fixture' } }
    if (c.url === 'https://api.tyro.com/connect/pay/requests/pr_1') return { govde: { id: 'pr_1', status: 'SUCCESS', total: { amount: 11000, currency: 'AUD' }, origin: { orderId: F1 } } }
    if (c.url === 'https://api.tyro.com/connect/pay/refunds') return { govde: { id: 'rf_1' } }
    return undefined
  }
  it('token by client credentials via the discovery document, cached; the Pay Request carries the documented fields and a Bearer JWT', async () => {
    const { f, cagrilar } = sahteGetir(fix)
    const t = tyroSaglayici({ ...K, istemciId: 'client_unique_a' }, f)
    const r = await t.baslat({ faturaId: F1, no: 1, tutarKurus: 11000, paraKodu: 'AUD', basariUrl: '', iptalUrl: '' })
    assert.deepEqual(r, { ref: 'pr_1', paySecret: 'ps_fixture' })
    const tok = cagrilar.find((c) => c.url.endsWith('/oauth/token'))!; const tf = form(tok.govde)
    assert.equal(tf.grant_type, 'client_credentials'); assert.equal(tf.client_id, 'client_unique_a')
    const pr = cagrilar.find((c) => c.url.endsWith('/pay/requests') && c.method === 'POST')!
    assert.equal(pr.headers.authorization, 'Bearer jwt.fixture')
    assert.deepEqual(JSON.parse(pr.govde), { locationId: K.konumId, provider: { name: 'TYRO', method: 'CARD' }, origin: { orderId: F1 }, total: { amount: 11000, currency: 'AUD' } })
    await t.baslat({ faturaId: F1, no: 1, tutarKurus: 11000, paraKodu: 'AUD', basariUrl: '', iptalUrl: '' })
    assert.match(String(cagrilar.find((c) => c.url.endsWith('/oauth/token'))?.govde ?? ''), /audience=https%3A%2F%2Fapp\.connect\.tyro/, 'token request carries the documented App audience')
    assert.equal(cagrilar.filter((c) => c.url.endsWith('/oauth/token')).length, 1, 'the 12-hour JWT is cached (Tyro rejects more than 12 tokens in 11 h)')
  })
  it('a refused token is a failed check; a refund is sent for the Pay Request; reading a Pay Request maps status SUCCESS', async () => {
    const kotu = sahteGetir((c) => c.url.endsWith('/openid-configuration') ? fix(c) : { durum: 401, govde: {} })
    assert.deepEqual(await tyroSaglayici({ ...K, istemciId: 'client_unique_b' }, kotu.f).dogrula(), { tamam: false, hata: 'anahtar' })
    const { f, cagrilar } = sahteGetir(fix); const t = tyroSaglayici({ ...K, istemciId: 'client_unique_c' }, f)
    assert.equal((await t.iade({ faturaId: F1, odemeRef: 'pr_1', kurus: 4000, oncekiIadeKurus: 0 })).tamam, true)
    assert.equal(JSON.parse(cagrilar.find((c) => c.url.endsWith('/pay/refunds'))!.govde).payRequestId, 'pr_1')
    assert.deepEqual(await t.odemeyiOku('pr_1'), { ref: 'pr_1', faturaId: F1, tutarKurus: 11000, iadeKurus: 0, paraKodu: 'AUD', basarili: true, olusturuldu: 0 })
  })
  const GIZLI = 'tyro-signing-key-fixture'
  const govde = JSON.stringify({ type: 'PAY_REQUEST_SUCCESS', data: { id: 'pr_1', uri: 'https://api.tyro.com/connect/pay/requests/pr_1', resource: 'payrequest' } })
  it('signature: HMAC-SHA256 of the raw body with the pre-shared key (hex or base64); tampered / wrong key / bare hash / missing refused', () => {
    const h = createHmac('sha256', GIZLI).update(govde).digest()
    assert.equal(tyroImzaDogru(govde, h.toString('hex'), GIZLI), true); assert.equal(tyroImzaDogru(govde, h.toString('base64'), GIZLI), true)
    assert.equal(tyroImzaDogru(govde + ' ', h.toString('hex'), GIZLI), false); assert.equal(tyroImzaDogru(govde, h.toString('hex'), 'other'), false)
    assert.equal(tyroImzaDogru(govde, null, GIZLI), false); assert.equal(tyroImzaDogru(govde, '', GIZLI), false)
    const cirplak = (require('node:crypto') as typeof import('node:crypto')).createHash('sha256').update(govde).digest('hex')
    assert.equal(tyroImzaDogru(govde, cirplak, GIZLI), false, 'a bare hash with no key proves nothing')
  })
  it('payload reader: type and data.id are required', () => {
    assert.equal(tyroOlayiOku(govde)?.data.id, 'pr_1'); assert.equal(tyroOlayiOku('{}'), null); assert.equal(tyroOlayiOku('nope'), null)
  })
  it('handler: PAY_REQUEST_SUCCESS is confirmed with Tyro itself, then the invoice is paid; a replay is ignored; bad signature → 400', async () => {
    await baglantiKaydet(sb(), D, { saglayici: 'tyro', ...K, webhookGizli: GIZLI }, sahteGetir(fix).f)
    assert.equal((await baglantiOku(sb(), D))?.etkin, false, 'Tyro is saved but not active without NOTYA_TYRO_ETKIN')
    satir('ulke_faturalar').push(fatura({ saglayici: 'tyro', odeme_ref: 'pr_1' }))
    const imza = createHmac('sha256', GIZLI).update(govde).digest('hex'); const { f } = sahteGetir(fix)
    assert.equal((await tyroWebhookIsle(sb(), D, govde, 'bad', f)).durum, 400)
    assert.deepEqual(await tyroWebhookIsle(sb(), D, govde, imza, f), { durum: 200, sonuc: 'paid' })
    assert.equal(satir('ulke_faturalar')[0].durum, 'odendi')
    assert.deepEqual(await tyroWebhookIsle(sb(), D, govde, imza, f), { durum: 200, sonuc: 'duplicate' })
  })
})

describe('reconciliation against what the provider LISTS', () => {
  const t0 = Date.parse('2026-10-10T00:00:00Z'), t1 = Date.parse('2026-10-20T00:00:00Z'), ic = Date.parse('2026-10-15T00:00:00Z')
  const inv = (id: string, no: number, extra: Record<string, unknown> = {}) => ({ id, no, toplamKurus: 11000, iadeKurus: 0, durum: 'odendi', ref: `pi_${no}`, paraKodu: 'AUD', odendiAt: ic, ...extra })
  const k = (ref: string, faturaId: string | null, extra: Partial<SaglayiciKaydi> = {}): SaglayiciKaydi => ({ ref, faturaId, tutarKurus: 11000, iadeKurus: 0, paraKodu: 'AUD', basarili: true, olusturuldu: ic, ...extra })
  it('every outcome: matched, refunded, amount mismatch, currency mismatch, missing at provider, missing in Notya, not paid', () => {
    const r = uzlastirKayitlarla(
      [inv('a', 1), inv('b', 2, { iadeKurus: 4000 }), inv('c', 3), inv('d', 4), inv('e', 5), inv('f', 6, { durum: 'taslak', ref: null, odendiAt: null })],
      [k('pi_1', 'a'), k('pi_2', 'b', { iadeKurus: 4000 }), k('pi_3', 'c', { tutarKurus: 9000 }), k('pi_4', 'd', { paraKodu: 'USD' }), k('pi_x', null), k('pi_open', 'e', { basarili: false })], t0, t1)
    const by = Object.fromEntries(r.map((x) => [x.no || x.ref, x.sonuc]))
    assert.deepEqual(by, { 1: 'eslesti', 2: 'iade_edildi', 3: 'uyusmadi', 4: 'uyusmadi', 5: 'saglayicida_yok', 6: 'odenmedi', pi_x: 'notya_yok' })
  })
  it('a refunded total that differs between Notya and the provider is a mismatch', () => {
    assert.equal(uzlastirKayitlarla([inv('a', 1, { iadeKurus: 1000 })], [k('pi_1', 'a', { iadeKurus: 4000 })], t0, t1)[0].sonuc, 'uyusmadi')
  })
  it('matches by metadata invoice id even when the stored reference is still the session id; invoices outside the range are not judged', () => {
    assert.equal(uzlastirKayitlarla([inv('a', 1, { ref: 'cs_test_1' })], [k('pi_1', 'a')], t0, t1)[0].sonuc, 'eslesti')
    assert.deepEqual(uzlastirKayitlarla([inv('a', 1, { odendiAt: t1 + 86_400_000 })], [], t0, t1), [])
  })
  it('a provider payment for an invoice outside the period is not reported as missing in Notya', () => {
    assert.deepEqual(uzlastirKayitlarla([inv('a', 1, { odendiAt: t1 + 86_400_000 })], [k('pi_1', 'a')], t0, t1), [])
  })
  it('the CSV keeps its formula-injection guard on the new rows', () => {
    const rows = uzlastirKayitlarla([], [k('=HYPERLINK("x")', null)], t0, t1)
    assert.match(uzlasmaCsv(rows), /'=HYPERLINK/)
  })
})

describe('reconciliation through a connection judges only the invoices of its own mode', () => {
  it('a test-mode payment is not reported missing at a live account', async () => {
    const { encrypt } = await import('@/lib/security/encryption')
    const govde = encrypt(JSON.stringify({ v: 1, kalemler: [{ aciklama: 'x', kalemNo: '', tutarKurus: 10000, muaf: false }], satici: {}, tarih: '2026-10-22' }))
    const ic = Date.now() - 86_400_000
    await baglantiKaydet(sb(), D, { saglayici: 'stripe', anahtar: LIVEKEY, webhookGizli: LIVEWHSEC, canliOnay: true }, fetch, sahteStripeUret())
    satir('ulke_faturalar').push(
      fatura({ id: F1, fatura_no: 1, govde_encrypted: govde, durum: 'odendi', saglayici: 'stripe', odeme_ref: 'pi_t', odeme_modu: 'test', odendi_at: new Date(ic).toISOString() }),
      fatura({ id: '50000000-0000-4000-8000-000000000003', fatura_no: 2, govde_encrypted: govde, durum: 'odendi', saglayici: 'stripe', odeme_ref: 'pi_l', odeme_modu: 'live', odendi_at: new Date(ic).toISOString() }),
    )
    const sag: GercekSaglayici = { ad: 'stripe', async dogrula() { return { tamam: true } }, async baslat() { throw new Error('unused') }, async iade() { throw new Error('unused') },
      async kayitlar() { return [{ ref: 'pi_l', faturaId: '50000000-0000-4000-8000-000000000003', tutarKurus: 11000, iadeKurus: 0, paraKodu: 'AUD', basarili: true, olusturuldu: ic }] } }
    const r = await uzlasma(sb(), D, undefined, (k, s) => (k && s ? sag : null))
    assert.equal(r.gercek, true)
    assert.deepEqual(r.satirlar.map((x) => [x.no, x.sonuc]), [[2, 'eslesti']], 'only the live invoice is judged')
    assert.equal(r.satirlar.some((x) => x.ref === 'pi_t'), false, 'the test-mode invoice is not part of a live reconciliation')
  })
})

describe('credentials are not logged and not sent to the client', () => {
  it('no adapter or flow file writes to the console, and no route returns a credential field', () => {
    // The Tyro webhook route exists only in the Australian build.
    for (const f of ['lib/ulke/fatura/stripe.ts', 'lib/ulke/fatura/tyro.ts', 'lib/ulke/fatura/webhook.ts', 'lib/ulke/fatura/fatura.ts', 'app/api/ulke/odeme-webhook/stripe/route.ulke.ts', 'app/api/ulke/odeme-webhook/tyro/route.ulke.ts', 'app/api/ulke/odeme-baglantisi/route.ulke.ts'].filter((x) => existsSync(join(KOK, x)))) {
      assert.doesNotMatch(readFileSync(join(KOK, f), 'utf8'), /console\.(log|info|warn|error|debug)/, f)
    }
    const r = readFileSync(join(KOK, 'app/api/ulke/odeme-baglantisi/route.ulke.ts'), 'utf8')
    assert.doesNotMatch(r, /kimlik\b|istemciGizli:\s*b|anahtar:\s*b/)
  })
  it('the no-platform-fee rule holds in the Stripe adapter source (no application fee, no transfer, no on-behalf-of)', () => {
    const s = readFileSync(join(KOK, 'lib/ulke/fatura/stripe.ts'), 'utf8')
    assert.doesNotMatch(s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''), /application_fee|transfer_data|on_behalf_of|stripeAccount/)
  })
})
