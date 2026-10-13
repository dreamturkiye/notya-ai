/**
 * NOTYA-ULKE-01 — Uzbekistan, build-level facts. Read by next.config.mjs for an Uzbekistan build and by nothing else.
 * Plain data, so the config can load it before anything is compiled. Its one import is the gate every country build
 * passes (NOTYA-ULKE-SABLON-01, scripts/ulke-derleme-kapisi.mjs): the pack scan, the wall check, and the rule that a
 * country is built with `npm run build:ulke` so that the build proof runs. The gate is here — in the country's own
 * build file — and not in package.json, so a build with no country set never meets it.
 */
import { ulkeDerlemeKapisi } from '../../scripts/ulke-derleme-kapisi.mjs'

ulkeDerlemeKapisi('uz')

const derleme = {
  kod: 'uz',
  saatDilimi: 'Asia/Tashkent',
  bolunmemisUygulama: false,
  // NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08): this country is served under a path of the main site (notya.io/uzbek),
  // not at an address of its own. Becomes Next's `basePath`. Same value as `yolOnEki` in ./index.ts (a test compares).
  yolOnEki: '/uzbek',
  yonlendirmeler: [],
}

export default derleme
