/**
 * NOTYA-ULKE-01 — the entry point to the active country pack's own PAGES (the data half is ./index).
 *
 * Separate from ./index on purpose: the middleware and every client bundle load the data half, and must not carry
 * page components and stylesheets with them.
 *
 * Same build-time selection as ./index: constant branches on the inlined NOTYA_COUNTRY, `require` only inside the
 * branch of its own country (checked by scripts/ulke-duvarlari.mjs, rule D4).
 */
import type { UlkeSayfalari } from '@/lib/ulke/tipler'

/* eslint-disable @typescript-eslint/no-var-requires */
let sayfalar: UlkeSayfalari
if (process.env.NOTYA_COUNTRY === 'uz') {
  sayfalar = require('../uz/acilis/index').UZ_SAYFALARI
} else if (process.env.NOTYA_COUNTRY === 'tr' || !process.env.NOTYA_COUNTRY) {
  sayfalar = require('../tr/sayfalar').TR_SAYFALARI
} else {
  throw new Error(`NOTYA_COUNTRY="${process.env.NOTYA_COUNTRY}" is not a country this build knows. Refusing to guess.`)
}

export const AKTIF_SAYFALAR: UlkeSayfalari = sayfalar
