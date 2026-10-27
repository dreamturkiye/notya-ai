/**
 * STRIPE-NOTYA-01 (Kaan, 2026-10-27) — Notya's own SaaS plan catalog: a doctor paying Notya for
 * the app itself. NOT lib/accounting/ (the doctor billing their OWN patients — different system,
 * different Stripe customers, untouched by this file).
 *
 * Config-driven on purpose: price/product IDs come from env vars, never hardcoded, so pointing
 * this at Kaan's own dedicated Notya Stripe account later (instead of the shared StopThreatAI
 * account, acct_1SX5XF2LZ4pKabuO) is an env-var change, not a code change. The literal test-mode
 * IDs below are only the fallback used when an env var is unset, so local/dev and this sandbox's
 * own walkthrough work without a .env.local — set the real env vars in Vercel for anything that
 * matters. See .env.example for the full STRIPE_* list.
 */

export type NotyaPlanKey =
  | 'metin_asistan'
  | 'sesli_pro'
  | 'muayenehane'
  | 'klinik_taban'
  | 'klinik_koltuk'

export type NotyaBillingInterval = 'month' | 'year'

export interface NotyaPlanDef {
  key: NotyaPlanKey
  label: string
  /** Per-seat volume pricing (Hekim Koltuğu) — checkout must collect a seat count. */
  perSeat: boolean
  priceIds: Record<NotyaBillingInterval, string>
}

const envOrFallback = (envVar: string, fallback: string): string =>
  (process.env[envVar] && process.env[envVar]!.trim()) || fallback

// Fallback IDs: the live test-mode catalog created in the StopThreatAI Stripe account
// (acct_1SX5XF2LZ4pKabuO, livemode:false) on 2026-10-27 — see docs/OPEN-COMMITMENTS.md
// STRIPE-NOTYA-01. The catalog described there as already existing was NOT actually present in
// the connected account when this job ran; it was recreated from scratch, same prices.
export const NOTYA_PLANS: NotyaPlanDef[] = [
  {
    key: 'metin_asistan',
    label: 'Notya Metin Asistan',
    perSeat: false,
    priceIds: {
      month: envOrFallback('STRIPE_PRICE_METIN_ASISTAN_MONTH', 'price_1UVBHT2LZ4pKabuOYzLlxInh'),
      year: envOrFallback('STRIPE_PRICE_METIN_ASISTAN_YEAR', 'price_1UVBHV2LZ4pKabuOXT7lmz8m'),
    },
  },
  {
    key: 'sesli_pro',
    label: 'Notya Sesli Pro',
    perSeat: false,
    priceIds: {
      month: envOrFallback('STRIPE_PRICE_SESLI_PRO_MONTH', 'price_1UVBHW2LZ4pKabuOvsUsZujf'),
      year: envOrFallback('STRIPE_PRICE_SESLI_PRO_YEAR', 'price_1UVBHY2LZ4pKabuO4dVDnhbY'),
    },
  },
  {
    key: 'muayenehane',
    label: 'Notya Muayenehane',
    perSeat: false,
    priceIds: {
      month: envOrFallback('STRIPE_PRICE_MUAYENEHANE_MONTH', 'price_1UVBHZ2LZ4pKabuOK684jicj'),
      year: envOrFallback('STRIPE_PRICE_MUAYENEHANE_YEAR', 'price_1UVBHb2LZ4pKabuOwrKVk8u3'),
    },
  },
  {
    key: 'klinik_taban',
    label: 'Notya Klinik Taban',
    perSeat: false,
    priceIds: {
      month: envOrFallback('STRIPE_PRICE_KLINIK_TABAN_MONTH', 'price_1UVBHc2LZ4pKabuO1OJo3sZC'),
      year: envOrFallback('STRIPE_PRICE_KLINIK_TABAN_YEAR', 'price_1UVBHe2LZ4pKabuOIyrheEKW'),
    },
  },
  {
    key: 'klinik_koltuk',
    label: 'Notya Klinik Hekim Koltuğu',
    perSeat: true,
    priceIds: {
      // Tiered volume pricing (1-4 / 5-9 / 10+ seats) — quantity = seat count, set at checkout.
      month: envOrFallback('STRIPE_PRICE_KLINIK_KOLTUK_MONTH', 'price_1UVBHg2LZ4pKabuOb3Q9736l'),
      year: envOrFallback('STRIPE_PRICE_KLINIK_KOLTUK_YEAR', 'price_1UVBHi2LZ4pKabuO5EMaq92F'),
    },
  },
]

export const NOTYA_TRIAL_DAYS = 15

export function planByKey(key: string): NotyaPlanDef | null {
  return NOTYA_PLANS.find((p) => p.key === key) || null
}

export function planByPriceId(priceId: string): { plan: NotyaPlanDef; interval: NotyaBillingInterval } | null {
  for (const plan of NOTYA_PLANS) {
    for (const interval of ['month', 'year'] as const) {
      if (plan.priceIds[interval] === priceId) return { plan, interval }
    }
  }
  return null
}
