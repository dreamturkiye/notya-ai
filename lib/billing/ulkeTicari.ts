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

/**
 * AU-DEMO-02 (Kaan, 2026-11-03) - the country's own demo booking link: the 30-minute Cal.com event tied to Dr. Gokhan
 * Mamur (since 2026-11-06 the country's own Cal.com event, e.g. demo-au; until then the Turkish event). Wins over that env var
 * on this country's /demo page; the founding page and the upgrade prompt show their demo button only while it is a valid
 * Cal.com address (lib/ulke/demo). Absent = the env var alone, as before.
 */
export interface DemoRandevusu { adres: string }

/** AU-KURUCU-01 (Kaan, 2026-11-03) - the words of the founding-doctor page (/founding). `{n}` = places left, `{k}` = all places. */
export interface KurucuSayfasiMetni {
  meta: { baslik: string; aciklama: string }
  ustBaslik: string; baslik: string; baslikVurgu: string; giris: string
  sayac: string; sayacBir: string; dolu: string
  birinciDugme: string; ikinciDugme: string; yillikBaglanti: string
  teklif: { ustBaslik: string; baslik: string; baslikVurgu: string; govde: string; maddeler: string[]; kartEtiketi: string; kartNot: string }
  doluTeklif: { ustBaslik: string; baslik: string; baslikVurgu: string; govde: string; maddeler: string[]; kartEtiketi: string; kartNot: string }
  deneme: { ustBaslik: string; baslik: string; baslikVurgu: string; govde: string; maddeler: string[]; kartEtiketi: string; kartNot: string }
  karsilik: { ustBaslik: string; baslik: string; baslikVurgu: string; govde: string; maddeler: string[]; kartEtiketi: string; kartNot: string }
  /** `govdeDemosuz`: the same closing line when no demo can be booked (the button is hidden). */
  kapanis: { ustBaslik: string; baslik: string; baslikVurgu: string; govde: string; govdeDemosuz: string }
  kartSatirlari: { aylik: string; yillik: string; yer: string; deneme: string; kart: string; sinir: string; sonra: string }
  denemeDegerleri: { sure: string; kart: string; sinir: string; sonra: string }
  denemeSinirlari: string
  doluFiyatNotu: string
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
  demo?: DemoRandevusu
  /** The words of /founding; with `kurucu`, the page exists (the route must also be listed in the pack). */
  kurucuSayfasi?: KurucuSayfasiMetni
  /** The demo button's words where it appears outside /demo (founding page, upgrade prompt). */
  demoDugmesi?: string
  /**
   * AU-HUKUK-YANIT-01 (Kaan, 2026-11-05): the supplier line on Notya's OWN subscription invoices and receipts, set as the
   * Stripe customer's invoice footer by app/api/billing/checkout. Absent = no footer is set (Türkiye unchanged).
   */
  faturaNotu?: string
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
    // NOTYA-DEMO-DIL-01b (Kaan, 2026-11-06): the Australian page books Dr. Mamur's own AU event, not the Turkish one.
    demo: { adres: 'https://app.cal.com/han-mamur-sugmbo/demo-au' },
    demoDugmesi: 'Book a 30-minute private demo',
    // GST answer of the Australian lawyer (2026-11-05): invoices/receipts note that the supplier is a non-resident.
    faturaNotu: 'Supplier: Notya LLC, a United States company (3424 Sollers Point Rd., Baltimore, MD 21222, USA). Notya LLC is a non-resident supplier with no Australian ABN.',
    // AU-KURUCU-01 (Kaan, 2026-11-03). Every fact here is a setting above (seats, prices, trial days and caps) and is
    // checked against them in lib/billing/kurucuSayfasi.test.ts. No diagnosis or treatment claim, no regulator, no competitor.
    kurucuSayfasi: {
      meta: {
        baslik: 'Founding doctors — Notya Australia',
        aciklama: 'The first 20 doctors in Australia get Notya at A$79 a month, or A$948 a year with the price locked for the year. Start with a 15-day free trial, no card needed.',
      },
      ustBaslik: 'Founding doctors · Australia',
      baslik: 'Be one of the first 20.',
      baslikVurgu: 'Help shape Notya.',
      giris: 'Notya records the visit with your patient’s consent and drafts the note for you to read, correct and approve. We are opening it to 20 founding doctors in Australia at a founding price, in return for your honest feedback.',
      sayac: '{n} of {k} founding places left',
      sayacBir: '1 of {k} founding places left',
      dolu: 'All {k} founding places have been taken.',
      birinciDugme: 'Start your free trial',
      ikinciDugme: 'Book a 30-minute private demo',
      yillikBaglanti: 'Prefer to pay yearly? Start with the yearly founding price',
      teklif: {
        ustBaslik: 'What founding doctors get',
        baslik: 'A founding price,',
        baslikVurgu: 'for the first 20 doctors only.',
        govde: 'Available while places remain. Choose monthly or yearly when you upgrade from your trial. Monthly prices may change with 30 days’ notice. Annual prices are locked for the prepaid year.',
        maddeler: ['A$79 a month, or A$948 a year with the price locked for that year', 'Live voice: 150 minutes a month on any paid plan; the text assistant has no minute limit', 'A direct line to the founders for questions and requests', 'Everything you do in the trial carries over when you upgrade'],
        kartEtiketi: 'Founding offer',
        kartNot: 'From the 21st doctor the regular price applies: A$149 a month or A$1,490 a year.',
      },
      doluTeklif: {
        ustBaslik: 'Pricing',
        baslik: 'The founding places are taken.',
        baslikVurgu: 'The regular plan is open.',
        govde: 'You can still start with the same 15-day free trial, with no card. If you upgrade, the regular price applies.',
        maddeler: ['A$149 a month, or A$1,490 a year', 'Live voice: 150 minutes a month; the text assistant has no minute limit', 'Everything you do in the trial carries over when you upgrade'],
        kartEtiketi: 'Regular plan',
        kartNot: 'Prices in Australian dollars.',
      },
      deneme: {
        ustBaslik: 'The free trial',
        baslik: '15 days,',
        baslikVurgu: 'no card needed.',
        govde: 'Your trial starts when your account is created. You are not asked for a card and nothing is charged unless you choose to upgrade.',
        maddeler: ['Up to 40 recorded visits and 60 minutes of live voice during the trial', 'After day 15 your account becomes read-only: your patients and notes stay, and you can view and export them', 'Upgrade any time from inside the app'],
        kartEtiketi: 'Trial',
        kartNot: 'You read, correct and approve every note. Nothing becomes part of the record until you do.',
      },
      karsilik: {
        ustBaslik: 'What we ask in return',
        baslik: 'Your feedback,',
        baslikVurgu: 'and a few words if it helps you.',
        govde: 'Founding doctors tell us what works and what does not, so we can fix it quickly. If Notya saves you time, we will ask for a short testimonial we may quote, with your permission and in your own words. Wherever we quote a founding doctor, we say so: “Founding doctor — receives the founding pricing.”',
        maddeler: ['Tell us what to fix, by email or a short call', 'A short testimonial, only if you are happy with Notya and only with your written permission', 'Every quote is labelled “Founding doctor — receives the founding pricing.”', 'No patient information is ever part of feedback or a testimonial'],
        kartEtiketi: 'In return',
        kartNot: 'You can stop at any time.',
      },
      kapanis: {
        ustBaslik: 'Founding doctors',
        baslik: 'Start your 15-day trial.',
        baslikVurgu: 'No card needed.',
        govde: 'Or book a 30-minute private video call and see an example visit, start to finish, before you sign up.',
        govdeDemosuz: 'Your trial starts when your account is created, and everything you do in it carries over when you upgrade.',
      },
      kartSatirlari: { aylik: 'Monthly', yillik: 'Yearly, price locked for the year', yer: 'Places', deneme: 'Trial', kart: 'Card', sinir: 'Trial limits', sonra: 'After day 15' },
      denemeDegerleri: { sure: '15 days', kart: 'Not needed', sinir: '40 visits · 60 voice minutes', sonra: 'Read-only' },
      denemeSinirlari: '40 visits, 60 voice minutes',
      doluFiyatNotu: 'Regular price',
    },
  },
}

export function ulkeTicari(kod: string | null | undefined): UlkeTicariAyar | null {
  return (kod && ULKE_TICARI[kod]) || null
}

/** The invite-link plan key of the founding offer: `?plan=sesli_pro_founding&interval=month|year`. */
export const KURUCU_PLAN_KEY = 'sesli_pro_founding'
