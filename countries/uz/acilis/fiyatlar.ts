/**
 * NOTYA-UZ-FIYAT-UNVAN-01 — Uzbekistan: WHAT EACH PLAN OF THE LANDING PAGE COSTS. Data, in one place: a price is
 * changed here, once, and all three forms of the page follow. No amount is written in the copy (./icerik.ts).
 *
 * The owner, 2026-10-09: "On the landing page convert the turkish prices to Uzbek prices in turn. Use todays exchnage
 * prices." So each monthly price is the Turkish landing page's price for the same plan, converted to soʻm and rounded
 * to the nearest 10 000 soʻm. Plans the Turkish page sells by quote have no amount here either (`aylik: null`).
 *
 * ── CONVERSION RECORD ────────────────────────────────────────────────────────────────────────────────────────────
 *   Source     Central Bank of Uzbekistan, official exchange rate (cbu.uz, archive of rates, JSON for one currency:
 *              https://cbu.uz/ru/arkhiv-kursov-valyut/json/TRY/2026-10-09/), read on 2026-10-09.
 *   Rate       1 Turkish lira (TRY) = 240.71 soʻm (UZS), the rate dated 09.10.2026 (the day before: 240.04).
 *   Rounding   to the nearest 10 000 soʻm.
 *
 *   plan (Turkish page)        Turkish price / month     exact conversion        shown
 *   starter  (first plan)      1 490 TRY                 358 657.90 soʻm         360 000 soʻm
 *   pro      (second plan)     3 490 TRY                 840 077.90 soʻm         840 000 soʻm
 *   practice (third plan)      5 990 TRY               1 441 852.90 soʻm       1 440 000 soʻm
 *   clinic5, clinic10, clinic20, enterprise              by quote on the Turkish page → by request here, no amount
 *
 *   At the time of reading, the bank's page of all rates still listed the rate dated 08.10.2026 (240.04); the three
 *   shown amounts are the same at either rate.
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * ./acilis.test.ts holds the list to the record: every amount shown must equal the Turkish page's price for the plan
 * in the same position, times the recorded rate, rounded as recorded. A price the owner later sets by hand is changed
 * in BOTH places (the amount below and that plan's line of `UZ_FIYAT_DONUSUMU`), or the test fails by name.
 *
 * NOTHING OF THE SOURCE CURRENCY IS SHOWN: the page writes no lira sign, code or amount (./yasakliIfadeler.ts).
 * How an amount is written (separator, no decimals) is the pack's number rules (../index.ts → `bicim`, `paraBirimi`);
 * the currency word in each text form is the copy's (./icerik.ts → `narx.oylik`).
 *
 * THE COMMERCIAL PROMISES beside these prices (taxes not included, two months with yearly prepayment, the founding
 * doctors' discount) mirror the Turkish page and AWAIT THE OWNER'S CONFIRMATION FOR UZBEKISTAN
 * (docs/OPEN-COMMITMENTS.md, NOTYA-UZ-FIYAT-UNVAN-01).
 */
import type { AcilisFiyatlari } from '@/lib/ulke/arayuz/acilisTipleri'

/** How the amounts below were arrived at. Read by the test and by people; no screen reads it. */
export const UZ_FIYAT_DONUSUMU = {
  kaynak: 'cbu.uz',
  /** The date the rate carries. */
  kurTarihi: '2026-10-09',
  /** Soʻm for one unit of the source currency. */
  kur: 240.71,
  /** Each converted monthly price is rounded to the nearest multiple of this many soʻm. */
  yuvarlama: 10_000,
  /** Plan id → the monthly price on the source page, in the source currency. */
  kaynakAylik: { starter: 1490, pro: 3490, practice: 5990 } as Readonly<Record<string, number>>,
} as const

/** The rule of the record, as a function: source price × rate, to the nearest `yuvarlama`. */
export const uzFiyatDonustur = (kaynakTutar: number): number => Math.round((kaynakTutar * UZ_FIYAT_DONUSUMU.kur) / UZ_FIYAT_DONUSUMU.yuvarlama) * UZ_FIYAT_DONUSUMU.yuvarlama

/**
 * THE PRICE LIST. `aylik`: whole soʻm for one month; null = the price is given on request. `oneCikan`: the plan
 * carries the badge (the same plans as on the Turkish page). Plan ids are the copy's (./icerik.ts → `narx.gruplar`).
 */
export const UZ_FIYATLAR: AcilisFiyatlari = {
  // one doctor
  starter: { aylik: 360_000, oneCikan: false },
  pro: { aylik: 840_000, oneCikan: true },
  practice: { aylik: 1_440_000, oneCikan: false },
  // clinics: by request
  clinic5: { aylik: null, oneCikan: false },
  clinic10: { aylik: null, oneCikan: true },
  clinic20: { aylik: null, oneCikan: false },
  enterprise: { aylik: null, oneCikan: false },
}
