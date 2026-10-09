/**
 * NOTYA-ULKE-SABLON-01 — the entry point to what the active country pack brings for the SHARED SCREENS: catalogues
 * per language form, role names, assistant names, note templates (the type: lib/ulke/arayuz/tipler.ts).
 *
 * The screens themselves are the country kit's (components/ulke/uygulama/, components/ulke/acilis/); a pack brings
 * content, never a screen. Read through lib/ulke/arayuz, never directly.
 *
 * Separate from ./index (data every bundle loads, the middleware included) because catalogues are large, and from
 * ./klinik (server only) because these are shown in a browser.
 *
 * Same build-time selection as ./index: constant branches on the inlined NOTYA_COUNTRY, `require` only inside the
 * branch of its own country (scripts/ulke-duvarlari.mjs, rule D4). null = the country brings none: Türkiye's screens
 * are the pre-split application's own and do not come through this door.
 */
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'

/* eslint-disable @typescript-eslint/no-var-requires */
let arayuz: UlkeArayuzu | null
if (process.env.NOTYA_COUNTRY === 'uz') {
  arayuz = require('../uz/arayuz').UZ_ARAYUZ
} else if (process.env.NOTYA_COUNTRY === 'gb') {
  arayuz = require('../gb/arayuz').GB_ARAYUZ
} else if (process.env.NOTYA_COUNTRY === 'us') {
  arayuz = require('../us/arayuz').US_ARAYUZ
} else if (process.env.NOTYA_COUNTRY === 'tr' || !process.env.NOTYA_COUNTRY) {
  arayuz = null
} else {
  throw new Error(`NOTYA_COUNTRY="${process.env.NOTYA_COUNTRY}" is not a country this build knows. Refusing to guess.`)
}

export const AKTIF_ARAYUZ: UlkeArayuzu | null = arayuz
