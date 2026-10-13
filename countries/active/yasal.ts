/**
 * NOTYA-ULKE-YASAL-01 — policy text of the country this build serves.
 * null on the pre-split application: its legal page is app/kvkk/page.tsx, not this door.
 *
 * Same build-time selection as ./arayuz.ts (scripts/ulke-duvarlari.mjs, rule D4).
 */
import type { YasalKapisi } from '@/lib/ulke/yasal/tipler'

/* eslint-disable @typescript-eslint/no-var-requires */
let yasal: YasalKapisi | null
if (process.env.NOTYA_COUNTRY === 'uz') {
  yasal = require('../uz/yasal').UZ_YASAL
} else if (process.env.NOTYA_COUNTRY === 'gb') {
  yasal = require('../gb/yasal').GB_YASAL
} else if (process.env.NOTYA_COUNTRY === 'us') {
  yasal = require('../us/yasal').US_YASAL
} else if (process.env.NOTYA_COUNTRY === 'au') {
  yasal = require('../au/yasal').AU_YASAL
} else if (process.env.NOTYA_COUNTRY === 'nz') {
  yasal = require('../nz/yasal').NZ_YASAL
} else if (process.env.NOTYA_COUNTRY === 'ca') {
  yasal = require('../ca/yasal').CA_YASAL
} else if (process.env.NOTYA_COUNTRY === 'tr' || !process.env.NOTYA_COUNTRY) {
  yasal = null
} else {
  throw new Error(`NOTYA_COUNTRY="${process.env.NOTYA_COUNTRY}" is not a country this build knows. Refusing to guess.`)
}

export const AKTIF_YASAL: YasalKapisi | null = yasal
