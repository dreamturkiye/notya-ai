/**
 * STRIPE-NOTYA-AU-05 - founding offer: price resolution by lookup key (cached), the server-side seat cap and the
 * fallback to the regular price when the offer is full.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { fiyatlariAnahtarlaCoz, fiyatOnbelleginiTemizle, kurucuKoltukSayisi, sesliProFiyatiSec, type FiyatStripe } from './kurucuTeklifi'
import { ULKE_TICARI, KURUCU_PLAN_KEY } from './ulkeTicari'

const FIYATLAR: Record<string, string> = {
  notya_au_founding_monthly: 'price_found_m',
  notya_au_founding_yearly: 'price_found_y',
  notya_au_doctor_monthly: 'price_reg_m',
  notya_au_doctor_yearly: 'price_reg_y',
}

function sahteStripe(abonelikler: Record<string, string[]>) {
  const cagrilar = { fiyat: 0, abonelik: 0 }
  const s: FiyatStripe = {
    prices: {
      async list(p) {
        cagrilar.fiyat++
        return { data: p.lookup_keys.filter((k) => FIYATLAR[k]).map((k) => ({ id: FIYATLAR[k], lookup_key: k })) }
      },
    },
    subscriptions: {
      async list(p) {
        cagrilar.abonelik++
        return { data: (abonelikler[p.price] ?? []).map((status, i) => ({ id: `sub_${p.price}_${i}`, status })), has_more: false }
      },
    },
  }
  return { s, cagrilar }
}

describe('AU commercial settings', () => {
  it('AU founding = 20 seats, A$79 monthly / A$948 yearly lookup keys; caps 60 trial / 150 paid; no other country set', () => {
    assert.equal(ULKE_TICARI.au.kurucu?.koltuk, 20)
    assert.deepEqual(ULKE_TICARI.au.kurucu?.fiyatAnahtarlari, { month: 'notya_au_founding_monthly', year: 'notya_au_founding_yearly' })
    assert.deepEqual(ULKE_TICARI.au.sesDakika, { denemeDakika: 60, aylikDakika: 150 })
    assert.deepEqual(Object.keys(ULKE_TICARI), ['au'])
    assert.equal(KURUCU_PLAN_KEY, 'sesli_pro_founding')
  })
})

describe('price resolution by lookup key', () => {
  beforeEach(() => fiyatOnbelleginiTemizle())

  it('resolves keys and serves the second call from the cache (one Stripe call)', async () => {
    const { s, cagrilar } = sahteStripe({})
    const a = await fiyatlariAnahtarlaCoz(s, ['notya_au_founding_monthly', 'notya_au_founding_yearly', 'missing_key'])
    assert.deepEqual(a, { notya_au_founding_monthly: 'price_found_m', notya_au_founding_yearly: 'price_found_y', missing_key: null })
    await fiyatlariAnahtarlaCoz(s, ['notya_au_founding_monthly'])
    assert.equal(cagrilar.fiyat, 1)
  })

  it('the cache expires after an hour', async () => {
    const { s, cagrilar } = sahteStripe({})
    await fiyatlariAnahtarlaCoz(s, ['notya_au_doctor_monthly'], 0)
    await fiyatlariAnahtarlaCoz(s, ['notya_au_doctor_monthly'], 61 * 60 * 1000)
    assert.equal(cagrilar.fiyat, 2)
  })
})

describe('founding seat cap', () => {
  beforeEach(() => fiyatOnbelleginiTemizle())

  it('counts only seat-holding statuses across both founding prices', async () => {
    const { s } = sahteStripe({ price_found_m: ['trialing', 'active', 'canceled', 'incomplete_expired'], price_found_y: ['past_due', 'canceled'] })
    assert.equal(await kurucuKoltukSayisi(s, ['price_found_m', 'price_found_y']), 3)
  })

  it('under the cap: the founding price for the chosen interval', async () => {
    const { s } = sahteStripe({ price_found_m: Array(19).fill('trialing') })
    assert.deepEqual(await sesliProFiyatiSec({ stripe: s, ulke: 'au', aralik: 'year', kurucuIstendi: true, envFiyati: null, yedekFiyat: 'price_test' }),
      { priceId: 'price_found_y', planKey: 'sesli_pro', kurucu: true, kurucuDolu: false })
  })

  it('full (20 seats taken, monthly + yearly together): falls back to the regular AU price by lookup key and says so', async () => {
    const { s } = sahteStripe({ price_found_m: Array(12).fill('active'), price_found_y: Array(8).fill('trialing') })
    assert.deepEqual(await sesliProFiyatiSec({ stripe: s, ulke: 'au', aralik: 'month', kurucuIstendi: true, envFiyati: null, yedekFiyat: 'price_test' }),
      { priceId: 'price_reg_m', planKey: 'sesli_pro', kurucu: false, kurucuDolu: true })
  })

  it('regular checkout: env var wins over the lookup key; no env var uses the lookup key', async () => {
    const { s, cagrilar } = sahteStripe({})
    assert.equal((await sesliProFiyatiSec({ stripe: s, ulke: 'au', aralik: 'month', kurucuIstendi: false, envFiyati: 'price_env', yedekFiyat: 'price_test' }))?.priceId, 'price_env')
    assert.equal(cagrilar.fiyat, 0)
    assert.equal((await sesliProFiyatiSec({ stripe: s, ulke: 'au', aralik: 'year', kurucuIstendi: false, envFiyati: null, yedekFiyat: 'price_test' }))?.priceId, 'price_reg_y')
    assert.equal(cagrilar.abonelik, 0)
  })

  it('a country without settings: no founding offer, the catalog fallback, no Stripe call', async () => {
    const { s, cagrilar } = sahteStripe({})
    assert.deepEqual(await sesliProFiyatiSec({ stripe: s, ulke: 'gb', aralik: 'month', kurucuIstendi: true, envFiyati: null, yedekFiyat: 'price_test' }),
      { priceId: 'price_test', planKey: 'sesli_pro', kurucu: false, kurucuDolu: false })
    assert.deepEqual(cagrilar, { fiyat: 0, abonelik: 0 })
  })
})
