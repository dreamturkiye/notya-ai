/**
 * STRIPE-NOTYA-AU-05, trial model (Kaan, 2026-11-02): the in-app free trial with no card.
 *   - no-card trial start: a new account with no Stripe subscription at all is in its trial, with everything open
 *   - day 15: read-only (AI / voice refused with 402 DENEME_BITTI; nothing is read in a country without a trial)
 *   - the 40-visit cap at visit start
 *   - prompt selection: reason priority, reminders on days 10 and 13, founding offer vs regular prices
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { denemeDurumu, denemeKarari, istemIcerigi, istemNedeni, teklifSec, yanittanIstem } from '@/lib/billing/deneme'
import { ULKE_TICARI } from '@/lib/billing/ulkeTicari'
import { kurucuKoltukKaldiMi, koltukOnbelleginiTemizle, fiyatOnbelleginiTemizle, type FiyatStripe } from '@/lib/billing/kurucuTeklifi'
import { denemeEngeli, denemeOnbellekTemizle, muayeneDenemeKapisi } from './deneme'

const AU = ULKE_TICARI.au
const AYAR = AU.deneme!
const GUN = 24 * 60 * 60 * 1000
const ACILIS = '2026-11-05T09:00:00Z'
const A = Date.parse(ACILIS)

/** A stand-in client: the account row, the subscription rows and the visit count. Counts the reads. */
function sahteDb(g: { acilis?: string | null; abonelik?: Array<Record<string, unknown>>; muayene?: number; hata?: boolean }) {
  const okunan: string[] = []
  const db = {
    from(ad: string) {
      okunan.push(ad)
      const sonuc =
        g.hata ? { data: null, error: new Error('x'), count: null }
        : ad === 'ulke_hesaplari' ? { data: g.acilis === undefined ? { created_at: ACILIS } : g.acilis === null ? null : { created_at: g.acilis }, error: null }
        : ad === 'subscriptions' ? { data: g.abonelik ?? [], error: null }
        : ad === 'ulke_muayeneler' ? { data: null, error: null, count: g.muayene ?? 0 }
        : { data: null, error: null }
      const z: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'order', 'limit', 'maybeSingle']) z[m] = () => z
      z.then = (ok: (x: unknown) => unknown) => Promise.resolve(sonuc).then(ok)
      return z
    },
  }
  return { db: db as unknown as SupabaseClient, okunan }
}

describe('no-card trial start', () => {
  it('AU runs the trial in the app: 15 days, 40 visits, reminders on days 10 and 13, no Stripe involved', () => {
    assert.deepEqual({ gun: AYAR.gun, muayene: AYAR.muayene, hatirlatma: [...AYAR.hatirlatmaGunleri] }, { gun: 15, muayene: 40, hatirlatma: [10, 13] })
    assert.equal(AU.sesDakika?.denemeDakika, 60)
    assert.equal(AU.sesDakika?.aylikDakika, 150)
    // Every other country is unchanged: no in-app trial, so no gate and no prompt.
    for (const [kod, ayar] of Object.entries(ULKE_TICARI)) if (kod !== 'au') assert.equal(ayar.deneme, undefined, kod)
  })

  it('a new account with NO subscription row (no card, no Checkout) is in its trial from signup, with nothing gated', () => {
    const d = denemeDurumu({ ayar: AYAR, hesapAcilis: ACILIS, abonelik: null, simdi: A + 60_000 })
    assert.deepEqual({ tur: d.tur, gun: d.gun, kalanGun: d.kalanGun, bitis: d.bitis }, { tur: 'deneme', gun: 1, kalanGun: 15, bitis: '2026-11-20T09:00:00.000Z' })
    assert.equal(denemeKarari(d, AYAR, 0), null)
  })

  it('an account older than the trial model starts its trial on the model\'s first day', () => {
    const d = denemeDurumu({ ayar: AYAR, hesapAcilis: '2026-10-12T00:00:00Z', abonelik: null, simdi: Date.parse('2026-11-03T00:00:00Z') })
    assert.equal(d.tur, 'deneme')
    assert.equal(d.gun, 2)
  })

  it('a paid plan (or a Stripe trial from the old card-first model) has no trial limits at all', () => {
    for (const status of ['active', 'past_due', 'trialing']) {
      const d = denemeDurumu({ ayar: AYAR, hesapAcilis: ACILIS, abonelik: { status, trial_ends_at: null, current_period_start: null }, simdi: A + 40 * GUN })
      assert.equal(d.tur, 'ucretli', status)
      assert.equal(denemeKarari(d, AYAR, 500), null)
    }
    // A cancelled subscription is not a paid plan.
    assert.equal(denemeDurumu({ ayar: AYAR, hesapAcilis: ACILIS, abonelik: { status: 'canceled', trial_ends_at: null, current_period_start: null }, simdi: A + 16 * GUN }).tur, 'bitti')
  })
})

describe('day 15: read-only', () => {
  beforeEach(() => denemeOnbellekTemizle())

  it('the trial ends exactly 15 days after signup', () => {
    assert.equal(denemeDurumu({ ayar: AYAR, hesapAcilis: ACILIS, abonelik: null, simdi: A + 15 * GUN - 1 }).tur, 'deneme')
    const d = denemeDurumu({ ayar: AYAR, hesapAcilis: ACILIS, abonelik: null, simdi: A + 15 * GUN })
    assert.equal(d.tur, 'bitti')
    assert.equal(d.kalanGun, 0)
    assert.equal(denemeKarari(d, AYAR), 'DENEME_BITTI')
  })

  it('AI generation and live voice are refused with 402 DENEME_BITTI; one read a minute at most', async () => {
    const { db, okunan } = sahteDb({ acilis: ACILIS })
    const r = await denemeEngeli(db, 'hesap-1', 'au', A + 16 * GUN)
    assert.ok(r)
    assert.equal(r!.status, 402)
    assert.deepEqual(await r!.json(), { code: 'DENEME_BITTI' })
    const okumaSayisi = okunan.length
    assert.equal((await denemeEngeli(db, 'hesap-1', 'au', A + 16 * GUN + 1000))!.status, 402)
    assert.equal(okunan.length, okumaSayisi, 'second call served from the minute cache')
    assert.ok(!okunan.includes('ulke_muayeneler'), 'the AI gate never counts visits')
  })

  it('inside the trial, paid, a country without a trial, or a failed read: allowed (fail open)', async () => {
    assert.equal(await denemeEngeli(sahteDb({ acilis: new Date().toISOString() }).db, 'h2', 'au'), null)
    assert.equal(await denemeEngeli(sahteDb({ acilis: '2026-01-01T00:00:00Z', abonelik: [{ status: 'active', trial_ends_at: null, current_period_start: null }] }).db, 'h3', 'au'), null)
    const uz = sahteDb({ acilis: '2026-01-01T00:00:00Z' })
    assert.equal(await denemeEngeli(uz.db, 'h4', 'uz'), null)
    assert.deepEqual(uz.okunan, [], 'nothing is read in a country without an in-app trial')
    assert.equal(await denemeEngeli(sahteDb({ hata: true }).db, 'h5', 'au'), null)
  })

  it('a visit start after day 15 is refused as read-only, whatever the visit count', async () => {
    assert.equal(await muayeneDenemeKapisi(sahteDb({ acilis: ACILIS, muayene: 3 }).db, 'h6', 'au', A + 20 * GUN), 'DENEME_BITTI')
  })
})

describe('40-visit cap at visit start', () => {
  it('39 recorded visits: the 40th may start; 40: refused with DENEME_MUAYENE; paid: no cap', async () => {
    const yeni = new Date(Date.now() - 2 * GUN).toISOString()
    assert.equal(await muayeneDenemeKapisi(sahteDb({ acilis: yeni, muayene: 39 }).db, 'h7', 'au'), null)
    assert.equal(await muayeneDenemeKapisi(sahteDb({ acilis: yeni, muayene: 40 }).db, 'h8', 'au'), 'DENEME_MUAYENE')
    assert.equal(await muayeneDenemeKapisi(sahteDb({ acilis: yeni, muayene: 400, abonelik: [{ status: 'active', trial_ends_at: null, current_period_start: null }] }).db, 'h9', 'au'), null)
  })

  it('one round trip: account, subscription and visit count read together; nothing at all outside a trial country', async () => {
    const { db, okunan } = sahteDb({ acilis: new Date().toISOString(), muayene: 1 })
    await muayeneDenemeKapisi(db, 'h10', 'au')
    assert.deepEqual([...okunan].sort(), ['subscriptions', 'ulke_hesaplari', 'ulke_muayeneler'])
    const gb = sahteDb({ muayene: 99 })
    assert.equal(await muayeneDenemeKapisi(gb.db, 'h11', 'gb'), null)
    assert.deepEqual(gb.okunan, [])
  })
})

describe('upgrade prompt selection', () => {
  const d = (gunSonra: number) => denemeDurumu({ ayar: AYAR, hesapAcilis: ACILIS, abonelik: null, simdi: A + gunSonra * GUN + 1000 })

  it('most pressing first: day 15 > visit cap > voice minutes > reminders; nothing before day 10; nothing when paid', () => {
    assert.equal(istemNedeni({ durum: d(15), ayar: AYAR, muayeneSayisi: 40, sesDakika: 60, sesSiniri: 60 })?.neden, 'bitti')
    assert.equal(istemNedeni({ durum: d(3), ayar: AYAR, muayeneSayisi: 40, sesDakika: 60, sesSiniri: 60 })?.neden, 'muayene')
    assert.equal(istemNedeni({ durum: d(3), ayar: AYAR, muayeneSayisi: 12, sesDakika: 60, sesSiniri: 60 })?.neden, 'ses')
    assert.equal(istemNedeni({ durum: d(3), ayar: AYAR, muayeneSayisi: 12, sesDakika: 59, sesSiniri: 60 }), null)
    assert.equal(istemNedeni({ durum: d(8), ayar: AYAR, muayeneSayisi: 0, sesDakika: 0, sesSiniri: 60 }), null)
    const odenen = denemeDurumu({ ayar: AYAR, hesapAcilis: ACILIS, abonelik: { status: 'active', trial_ends_at: null, current_period_start: null }, simdi: A + 20 * GUN })
    assert.equal(istemNedeni({ durum: odenen, ayar: AYAR, muayeneSayisi: 99, sesDakika: 999, sesSiniri: 60 }), null)
  })

  it('gentle reminders: day 10 (6 days left) and day 13 (3 days left), each its own key', () => {
    assert.deepEqual(istemNedeni({ durum: d(9), ayar: AYAR, muayeneSayisi: 0, sesDakika: 0, sesSiniri: 60 }), { neden: 'hatirlatma', kalanGun: 6, hatirlatmaGunu: 10 })
    assert.deepEqual(istemNedeni({ durum: d(11), ayar: AYAR, muayeneSayisi: 0, sesDakika: 0, sesSiniri: 60 }), { neden: 'hatirlatma', kalanGun: 4, hatirlatmaGunu: 10 })
    assert.deepEqual(istemNedeni({ durum: d(12), ayar: AYAR, muayeneSayisi: 0, sesDakika: 0, sesSiniri: 60 }), { neden: 'hatirlatma', kalanGun: 3, hatirlatmaGunu: 13 })
  })

  it('founding offer leads while a seat is left (or the count is unknown); regular once full or with no offer', () => {
    assert.equal(teklifSec(true, true), 'kurucu')
    assert.equal(teklifSec(true, null), 'kurucu')
    assert.equal(teklifSec(true, false), 'normal')
    assert.equal(teklifSec(false, true), 'normal')
  })

  it('the words and the one-click checkout target: founding A$79 / A$948, regular A$149 / A$1,490', () => {
    const k = istemIcerigi(AU, { neden: 'muayene', teklif: 'kurucu' }, { muayene: 40, ses: 60 })!
    assert.equal(k.baslik, 'You have used all 40 trial visits')
    assert.equal(k.planKey, 'sesli_pro_founding')
    assert.match(k.teklif, /A\$79 a month, or A\$948 a year with the price locked for the year/)
    assert.deepEqual([k.aylik, k.yillik], ['A$79 / month', 'A$948 / year'])
    const n = istemIcerigi(AU, { neden: 'ses', teklif: 'normal' }, { muayene: 40, ses: 60 })!
    assert.equal(n.baslik, 'You have used your 60 live voice minutes')
    assert.equal(n.planKey, 'sesli_pro')
    assert.deepEqual([n.aylik, n.yillik], ['A$149 / month', 'A$1,490 / year'])
    assert.equal(istemIcerigi(AU, { neden: 'bitti', teklif: 'kurucu' }, { muayene: 40, ses: 60 })!.baslik, 'Your 15-day free trial has ended')
    assert.equal(istemIcerigi(AU, { neden: 'hatirlatma', teklif: 'kurucu', kalanGun: 3 }, { muayene: 40, ses: 60 })!.baslik, 'Your free trial ends in 3 days')
    assert.equal(istemIcerigi(AU, { neden: 'hatirlatma', teklif: 'kurucu', kalanGun: 1 }, { muayene: 40, ses: 60 })!.baslik, 'Your free trial ends tomorrow')
    assert.equal(istemIcerigi(ULKE_TICARI.gb ?? null, { neden: 'bitti', teklif: 'normal' }, { muayene: 40, ses: 60 }), null)
  })

  it('which refusals open the prompt: read-only, visit cap, trial voice minutes - not a paid plan\'s monthly minutes', () => {
    assert.equal(yanittanIstem(402, { code: 'DENEME_BITTI' }), 'bitti')
    assert.equal(yanittanIstem(402, { code: 'DENEME_MUAYENE' }), 'muayene')
    assert.equal(yanittanIstem(429, { code: 'SES_DAKIKA', tur: 'deneme' }), 'ses')
    assert.equal(yanittanIstem(429, { code: 'SES_DAKIKA', tur: 'abonesiz' }), 'ses')
    assert.equal(yanittanIstem(429, { code: 'SES_DAKIKA', tur: 'ucretli' }), null)
    assert.equal(yanittanIstem(429, { code: 'LIMIT' }), null)
  })

  it('founding seats left: counted from paid founding subscriptions in Stripe, cached', async () => {
    let cagri = 0
    const stripe = (dolu: number): FiyatStripe => ({
      prices: { list: async () => ({ data: [{ id: 'pm', lookup_key: 'notya_au_founding_monthly' }, { id: 'py', lookup_key: 'notya_au_founding_yearly' }] }) },
      subscriptions: { list: async (p) => { cagri++; return { data: p.price === 'pm' ? Array.from({ length: dolu }, (_, i) => ({ id: `s${i}`, status: 'active' })) : [], has_more: false } } },
    })
    koltukOnbelleginiTemizle(); fiyatOnbelleginiTemizle()
    assert.equal(await kurucuKoltukKaldiMi(stripe(19), 'au'), true)
    koltukOnbelleginiTemizle()
    assert.equal(await kurucuKoltukKaldiMi(stripe(20), 'au'), false)
    const once = cagri
    assert.equal(await kurucuKoltukKaldiMi(stripe(0), 'au'), false, 'cached for ten minutes')
    assert.equal(cagri, once)
    assert.equal(await kurucuKoltukKaldiMi(stripe(0), 'gb'), null)
  })
})
