/**
 * TOPLU-ULKE-01 — the copy of the batch confirm card (EylemToplu) for the ACTIVE country.
 *
 * Same build-time selection as ./index and ./arayuz: constant branches on the inlined NOTYA_COUNTRY, `require` only
 * inside the branch of its own country (scripts/ulke-duvarlari.mjs, D4/D5). No country configured = Türkiye's text.
 * An unknown code is an error, never a guess.
 */
import type { TopluMetin } from '@/components/core/topluMetin'

/* eslint-disable @typescript-eslint/no-var-requires */
let toplu: TopluMetin
if (process.env.NOTYA_COUNTRY === 'uz') {
  toplu = require('../uz/toplu').UZ_TOPLU
} else if (process.env.NOTYA_COUNTRY === 'gb') {
  toplu = require('../gb/toplu').GB_TOPLU
} else if (process.env.NOTYA_COUNTRY === 'us') {
  toplu = require('../us/toplu').US_TOPLU
} else if (process.env.NOTYA_COUNTRY === 'au') {
  toplu = require('../au/toplu').AU_TOPLU
} else if (process.env.NOTYA_COUNTRY === 'nz') {
  toplu = require('../nz/toplu').NZ_TOPLU
} else if (process.env.NOTYA_COUNTRY === 'ca') {
  toplu = require('../ca/toplu').CA_TOPLU
} else if (process.env.NOTYA_COUNTRY === 'tr' || !process.env.NOTYA_COUNTRY) {
  toplu = require('../tr/toplu').TOPLU_METIN_TR
} else {
  throw new Error(`NOTYA_COUNTRY="${process.env.NOTYA_COUNTRY}" is not a country this build knows. Refusing to guess.`)
}

export const AKTIF_TOPLU: TopluMetin = toplu
