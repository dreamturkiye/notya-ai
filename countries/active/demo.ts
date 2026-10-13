/**
 * NOTYA-ULKE-DEMO-01 — the entry point to the active pack's words for the "Book a demo" page (the type:
 * lib/ulke/demo/tipler.ts). Read through lib/ulke/demo, never directly.
 *
 * Same build-time selection as ./index: constant branches on the inlined NOTYA_COUNTRY, `require` only inside the
 * branch of its own country (scripts/ulke-duvarlari.mjs, rule D4). null = the country brings none: Türkiye's demo
 * page is the pre-split application's own (app/demo/page.tsx) and does not come through this door.
 */
import type { UlkeDemosu } from '@/lib/ulke/demo/tipler'

/* eslint-disable @typescript-eslint/no-var-requires */
let demo: UlkeDemosu | null
if (process.env.NOTYA_COUNTRY === 'uz') {
  demo = require('../uz/demo').UZ_DEMO
} else if (process.env.NOTYA_COUNTRY === 'gb') {
  demo = require('../gb/demo').GB_DEMO
} else if (process.env.NOTYA_COUNTRY === 'us') {
  demo = require('../us/demo').US_DEMO
} else if (process.env.NOTYA_COUNTRY === 'au') {
  demo = require('../au/demo').AU_DEMO
} else if (process.env.NOTYA_COUNTRY === 'nz') {
  demo = require('../nz/demo').NZ_DEMO
} else if (process.env.NOTYA_COUNTRY === 'ca') {
  demo = require('../ca/demo').CA_DEMO
} else if (process.env.NOTYA_COUNTRY === 'tr' || !process.env.NOTYA_COUNTRY) {
  demo = null
} else {
  throw new Error(`NOTYA_COUNTRY="${process.env.NOTYA_COUNTRY}" is not a country this build knows. Refusing to guess.`)
}

export const AKTIF_DEMO: UlkeDemosu | null = demo
