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

/**
 * Kaan, 2026-11-02 (STRIPE-NOTYA-AU-05, trial model): the free trial runs IN THE APP, from the account's creation,
 * with no card and no Stripe involvement. Stripe Checkout is used only when the doctor chooses to pay (charged at once).
 */
export interface UygulamaIciDeneme {
  /** Trial length in days, counted from the account's creation (or `taban`, whichever is later). */
  gun: number
  /** Recorded visits allowed during the trial. */
  muayene: number
  /** Days of the trial (1-based) on which a gentle upgrade reminder is shown once. */
  hatirlatmaGunleri: readonly number[]
  /** Accounts created before the trial model existed start their trial on this day (YYYY-MM-DD, UTC). */
  taban: string
}

/** Prices as the upgrade prompt shows them (display only; Checkout charges the Stripe price). */
export interface FiyatGosterimi { month: string; year: string }

/** The upgrade prompt's words, in the country's application language. `{n}` = a number. */
export interface YukseltmeMetni {
  bittiBaslik: string; bittiGovde: string
  muayeneBaslik: string; muayeneGovde: string
  sesBaslik: string; sesGovde: string
  hatirlatmaBaslik: string; hatirlatmaBaslikBir: string; hatirlatmaGovde: string
  kurucuTeklif: string; normalTeklif: string
  aylikDugme: string; yillikDugme: string
  sonra: string; aciliyor: string; acilamadi: string
  saltOkunurBant: string; yukseltDugme: string
}

export interface UlkeTicariAyar {
  /** Stripe lookup keys of the regular Sesli Pro prices; used when the STRIPE_PRICE_SESLI_PRO_* env var is unset. */
  sesliProFiyatAnahtarlari?: Record<TicariAralik, string>
  kurucu?: KurucuTeklifi
  sesDakika?: SesDakikaSiniri
  /** The in-app free trial (no card). Absent = the country has none (checkout keeps its own behaviour). */
  deneme?: UygulamaIciDeneme
  fiyatlar?: { normal: FiyatGosterimi; kurucu?: FiyatGosterimi }
  yukseltme?: YukseltmeMetni
}

export const ULKE_TICARI: Readonly<Record<string, UlkeTicariAyar>> = {
  // Kaan, 2026-11-02: founding A$79/month (not locked) or A$948/year (locked for that year), first 20 doctors;
  // regular A$149/month or A$1,490/year; live voice 60 min in the trial, 150 min per billing month on any paid plan.
  // The text assistant stays unlimited. Trial (Kaan, 2026-11-02, later the same day): 15 days, NO card ("Most people
  // would not try the product with a card requirement"), 40 recorded visits, read-only after day 15, upgrade prompts
  // at each limit and on days 10 and 13, leading with the founding offer while seats remain.
  au: {
    sesliProFiyatAnahtarlari: { month: 'notya_au_doctor_monthly', year: 'notya_au_doctor_yearly' },
    kurucu: { koltuk: 20, fiyatAnahtarlari: { month: 'notya_au_founding_monthly', year: 'notya_au_founding_yearly' } },
    sesDakika: { denemeDakika: 60, aylikDakika: 150 },
    deneme: { gun: 15, muayene: 40, hatirlatmaGunleri: [10, 13], taban: '2026-11-02' },
    fiyatlar: { normal: { month: 'A$149', year: 'A$1,490' }, kurucu: { month: 'A$79', year: 'A$948' } },
    yukseltme: {
      bittiBaslik: 'Your 15-day free trial has ended',
      bittiGovde: 'Your account is now read-only. Your patients and notes are all still here, and you can view and export them. Upgrade to keep recording visits and using the assistant.',
      muayeneBaslik: 'You have used all {n} trial visits',
      muayeneGovde: 'Upgrade to keep recording visits. Everything you have done so far carries over.',
      sesBaslik: 'You have used your {n} live voice minutes',
      sesGovde: 'The text assistant is still available. Upgrade for 150 live voice minutes every month. Everything you have done so far carries over.',
      hatirlatmaBaslik: 'Your free trial ends in {n} days',
      hatirlatmaBaslikBir: 'Your free trial ends tomorrow',
      hatirlatmaGovde: 'Upgrade any time and everything you have done so far carries over.',
      kurucuTeklif: 'Founding doctor offer for the first 20 doctors: A$79 a month, or A$948 a year with the price locked for the year.',
      normalTeklif: 'A$149 a month, or A$1,490 a year.',
      aylikDugme: '{p} / month',
      yillikDugme: '{p} / year',
      sonra: 'Not now',
      aciliyor: 'Opening checkout…',
      acilamadi: 'Checkout could not be opened. Please try again.',
      saltOkunurBant: 'Read-only: your free trial has ended. Your patients and notes are safe.',
      yukseltDugme: 'Upgrade',
    },
  },
}

export function ulkeTicari(kod: string | null | undefined): UlkeTicariAyar | null {
  return (kod && ULKE_TICARI[kod]) || null
}

/** The invite-link plan key of the founding offer: `?plan=sesli_pro_founding&interval=month|year`. */
export const KURUCU_PLAN_KEY = 'sesli_pro_founding'
