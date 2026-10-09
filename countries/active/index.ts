/**
 * NOTYA-ULKE-01 — THE entry point to the active country pack (data). The UI half is ./sayfalar.
 *
 * Core code imports a pack from here and from nowhere else; countries/<kod>/ is walled off
 * (scripts/ulke-duvarlari.mjs runs before every country build and in `npm test`).
 *
 * Selected at BUILD time. next.config.mjs inlines process.env.NOTYA_COUNTRY as a literal, so each `if` below has a
 * constant condition; the bundler keeps the one true branch and never even reads the `require` in the others. A build
 * for one country therefore does not contain another country's pack — scripts/ulke-derleme-kaniti.mjs checks the build
 * output for the other packs' marker strings after every build.
 *
 * Shape of this file is checked (lib/ulke/ulkeDuvarlari.test.ts): one `if` per country, `require` only inside it.
 * No country configured = Türkiye, exactly as before countries existed. An unknown code is an error, never a guess.
 */
import type { UlkePaketi } from '@/lib/ulke/tipler'

/* eslint-disable @typescript-eslint/no-var-requires */
let paket: UlkePaketi
if (process.env.NOTYA_COUNTRY === 'uz') {
  paket = require('../uz/index').UZ_PAKETI
} else if (process.env.NOTYA_COUNTRY === 'gb') {
  paket = require('../gb/index').GB_PAKETI
} else if (process.env.NOTYA_COUNTRY === 'us') {
  paket = require('../us/index').US_PAKETI
} else if (process.env.NOTYA_COUNTRY === 'au') {
  paket = require('../au/index').AU_PAKETI
} else if (process.env.NOTYA_COUNTRY === 'nz') {
  paket = require('../nz/index').NZ_PAKETI
} else if (process.env.NOTYA_COUNTRY === 'tr' || !process.env.NOTYA_COUNTRY) {
  paket = require('../tr/index').TR_PAKETI
} else {
  throw new Error(`NOTYA_COUNTRY="${process.env.NOTYA_COUNTRY}" is not a country this build knows. Refusing to guess.`)
}

export const AKTIF_PAKET: UlkePaketi = paket
