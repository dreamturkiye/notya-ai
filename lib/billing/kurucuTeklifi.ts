/**
 * STRIPE-NOTYA-AU-05 (Kaan, 2026-11-02) - which Stripe price a checkout uses: the founding offer (first N
 * doctors, prices found by LOOKUP KEY at runtime) or the regular Sesli Pro price.
 *
 *   - Prices by lookup key, cached in memory for an hour: no env var is needed (the AU Vercel project is not
 *     reachable by MCP), and an archived/replaced price is picked up within the hour.
 *   - The seat cap is counted in Stripe itself (subscriptions on the founding prices that are trialing,
 *     active, past_due, unpaid or paused), so it is right even when the webhook has not synced yet. A trial
 *     that is cancelled frees its seat. Full = the regular price, with a clear message on the Checkout page.
 *
 * Checkout only - never on any per-request hot path.
 */
import { KURUCU_PLAN_KEY, ulkeTicari, type TicariAralik } from './ulkeTicari'

/** The two Stripe calls this needs, so tests can pass a stand-in. */
export interface FiyatStripe {
  prices: { list(p: { lookup_keys: string[]; active: boolean; limit: number }): Promise<{ data: Array<{ id: string; lookup_key: string | null }> }> }
  subscriptions: {
    list(p: { price: string; status: 'all'; limit: number; starting_after?: string }): Promise<{ data: Array<{ id: string; status: string }>; has_more: boolean }>
  }
}

const ONBELLEK_MS = 60 * 60 * 1000
const fiyatOnbellegi = new Map<string, { id: string | null; bitis: number }>()

/** Test hook. */
export function fiyatOnbelleginiTemizle(): void {
  fiyatOnbellegi.clear()
}

/** Lookup key -> active price id (null = no active price has that key). Cached for an hour. */
export async function fiyatlariAnahtarlaCoz(stripe: FiyatStripe, anahtarlar: string[], simdi = Date.now()): Promise<Record<string, string | null>> {
  const sonuc: Record<string, string | null> = {}
  const eksik: string[] = []
  for (const k of anahtarlar) {
    const o = fiyatOnbellegi.get(k)
    if (o && o.bitis > simdi) sonuc[k] = o.id
    else eksik.push(k)
  }
  if (eksik.length) {
    const { data } = await stripe.prices.list({ lookup_keys: eksik, active: true, limit: Math.max(eksik.length, 10) })
    for (const k of eksik) {
      const id = data.find((p) => p.lookup_key === k)?.id ?? null
      sonuc[k] = id
      fiyatOnbellegi.set(k, { id, bitis: simdi + ONBELLEK_MS })
    }
  }
  return sonuc
}

/** Subscription statuses that hold a founding seat. */
export const KOLTUK_TUTAN = new Set(['trialing', 'active', 'past_due', 'unpaid', 'paused'])

/** Founding seats taken: subscriptions on any of the founding prices that still hold a seat. */
export async function kurucuKoltukSayisi(stripe: FiyatStripe, fiyatIdleri: string[]): Promise<number> {
  let n = 0
  for (const price of fiyatIdleri) {
    let sonra: string | undefined
    for (let sayfa = 0; sayfa < 20; sayfa++) {
      const r = await stripe.subscriptions.list({ price, status: 'all', limit: 100, ...(sonra ? { starting_after: sonra } : {}) })
      n += r.data.filter((s) => KOLTUK_TUTAN.has(s.status)).length
      if (!r.has_more || !r.data.length) break
      sonra = r.data[r.data.length - 1].id
    }
  }
  return n
}

export const KURUCU_DOLU_MESAJI =
  'The founding-doctor offer (first 20 doctors) is now full, so this subscription is at the regular price. Your 15-day free trial still applies.'

export type CheckoutFiyati = {
  priceId: string
  /** The plan the subscription is recorded as (the founding offer is Sesli Pro at a founding price). */
  planKey: 'sesli_pro'
  kurucu: boolean
  /** A founding checkout was asked for but every seat is taken. */
  kurucuDolu: boolean
}

/**
 * The price for a Sesli Pro checkout in `ulke`. `kurucuIstendi` = the invite asked for the founding offer.
 * `envFiyati` = STRIPE_PRICE_SESLI_PRO_* when set (it wins over the lookup key), `yedekFiyat` = the catalog's
 * built-in fallback. null = no price could be found.
 */
export async function sesliProFiyatiSec(g: {
  stripe: FiyatStripe
  ulke: string | null
  aralik: TicariAralik
  kurucuIstendi: boolean
  envFiyati: string | null
  yedekFiyat: string | null
}): Promise<CheckoutFiyati | null> {
  const ayar = ulkeTicari(g.ulke)
  const kurucu = g.kurucuIstendi ? ayar?.kurucu ?? null : null
  const anahtarlar = [
    ...(kurucu ? [kurucu.fiyatAnahtarlari.month, kurucu.fiyatAnahtarlari.year] : []),
    ...(!g.envFiyati && ayar?.sesliProFiyatAnahtarlari ? [ayar.sesliProFiyatAnahtarlari[g.aralik]] : []),
  ]
  const coz = anahtarlar.length ? await fiyatlariAnahtarlaCoz(g.stripe, anahtarlar) : {}

  let kurucuDolu = false
  if (kurucu) {
    const fiyat = coz[kurucu.fiyatAnahtarlari[g.aralik]]
    const tumKurucu = [coz[kurucu.fiyatAnahtarlari.month], coz[kurucu.fiyatAnahtarlari.year]].filter((x): x is string => Boolean(x))
    if (fiyat) {
      const dolu = await kurucuKoltukSayisi(g.stripe, tumKurucu)
      if (dolu < kurucu.koltuk) return { priceId: fiyat, planKey: 'sesli_pro', kurucu: true, kurucuDolu: false }
      kurucuDolu = true
    }
  }
  const duzenli = g.envFiyati || (ayar?.sesliProFiyatAnahtarlari ? coz[ayar.sesliProFiyatAnahtarlari[g.aralik]] : null) || g.yedekFiyat
  return duzenli ? { priceId: duzenli, planKey: 'sesli_pro', kurucu: false, kurucuDolu } : null
}

export { KURUCU_PLAN_KEY }
