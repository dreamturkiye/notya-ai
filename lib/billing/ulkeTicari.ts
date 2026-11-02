/**
 * STRIPE-NOTYA-AU-05 (Kaan, 2026-11-02) - per-country COMMERCIAL settings of Notya's own subscription:
 * the founding-doctor offer, Stripe lookup keys used instead of env vars, and the live-voice minute caps.
 *
 * One table, one entry per country. A country that is not listed (or a key left out) means: the feature
 * is OFF and nothing changes for that country. Only Australia is set today; every other country's trial,
 * caps and founding offer wait on Kaan's decision (docs/OPEN-COMMITMENTS.md STRIPE-NOTYA-AU-05).
 *
 * Kept free of any other module on purpose: the live-assistant route of a country build imports it, and
 * nothing reachable from a country route may carry another country's text (lib/ulke/ulkeDuvarlari.test.ts).
 */

export type TicariAralik = 'month' | 'year'

export interface SesDakikaSiniri {
  /** Live voice minutes in total during the free trial (also: an account with no live subscription). */
  denemeDakika: number
  /** Live voice minutes per billing period on a paid plan (founding and regular alike). */
  aylikDakika: number
}

export interface KurucuTeklifi {
  /** How many doctors can take the founding price. Enforced server-side at checkout. */
  koltuk: number
  /** Stripe lookup keys of the founding prices, resolved at runtime (no env var). */
  fiyatAnahtarlari: Record<TicariAralik, string>
}

export interface UlkeTicariAyar {
  /** Stripe lookup keys of the regular Sesli Pro prices; used when the STRIPE_PRICE_SESLI_PRO_* env var is unset. */
  sesliProFiyatAnahtarlari?: Record<TicariAralik, string>
  kurucu?: KurucuTeklifi
  sesDakika?: SesDakikaSiniri
}

export const ULKE_TICARI: Readonly<Record<string, UlkeTicariAyar>> = {
  // Kaan, 2026-11-02: founding A$79/month (not locked) or A$948/year (locked for that year), first 20 doctors;
  // regular A$149/month or A$1,490/year; 15-day trial with a card; live voice 60 min in the trial, 150 min per
  // billing month on any paid plan. The text assistant stays unlimited.
  au: {
    sesliProFiyatAnahtarlari: { month: 'notya_au_doctor_monthly', year: 'notya_au_doctor_yearly' },
    kurucu: { koltuk: 20, fiyatAnahtarlari: { month: 'notya_au_founding_monthly', year: 'notya_au_founding_yearly' } },
    sesDakika: { denemeDakika: 60, aylikDakika: 150 },
  },
}

export function ulkeTicari(kod: string | null | undefined): UlkeTicariAyar | null {
  return (kod && ULKE_TICARI[kod]) || null
}

/** The invite-link plan key of the founding offer: `?plan=sesli_pro_founding&interval=month|year`. */
export const KURUCU_PLAN_KEY = 'sesli_pro_founding'
