/**
 * NOTYA-UZ-MUAYENE-01 — the entry point to the active country pack's CLINICAL half: how a visit is listened to and
 * how its note is written (speech settings, consent version, note templates, instructions to the model).
 *
 * SERVER ONLY. Separate from ./index (data every bundle loads) and ./sayfalar (screens): thresholds and model
 * instructions have no business in a browser bundle or in the middleware.
 *
 * Same build-time selection as ./index: constant branches on the inlined NOTYA_COUNTRY, `require` only inside the
 * branch of its own country (scripts/ulke-duvarlari.mjs, rule D4). null = the country brings none: Türkiye's visit
 * is the pre-split application's own pipeline, which does not come through this door.
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'

/* eslint-disable @typescript-eslint/no-var-requires */
let klinik: UlkeKlinigi | null
if (process.env.NOTYA_COUNTRY === 'uz') {
  klinik = require('../uz/klinik/index').UZ_KLINIK
} else if (process.env.NOTYA_COUNTRY === 'gb') {
  klinik = require('../gb/klinik/index').GB_KLINIK
} else if (process.env.NOTYA_COUNTRY === 'us') {
  klinik = require('../us/klinik/index').US_KLINIK
} else if (process.env.NOTYA_COUNTRY === 'au') {
  klinik = require('../au/klinik/index').AU_KLINIK
} else if (process.env.NOTYA_COUNTRY === 'nz') {
  klinik = require('../nz/klinik/index').NZ_KLINIK
} else if (process.env.NOTYA_COUNTRY === 'tr' || !process.env.NOTYA_COUNTRY) {
  klinik = require('../tr/klinik').TR_KLINIK
} else {
  throw new Error(`NOTYA_COUNTRY="${process.env.NOTYA_COUNTRY}" is not a country this build knows. Refusing to guess.`)
}

export const AKTIF_KLINIK: UlkeKlinigi | null = klinik
