/**
 * NOTYA-ULKE-01 — Uzbekistan, build-level facts. Read by next.config.mjs for an Uzbekistan build and by nothing else.
 * Plain data, so the config can load it before anything is compiled. Its one import is the "to be supplied" scan
 * (NOTYA-ULKE-SABLON-01): a pack with anything still marked cannot be built. It runs here — in the country's own
 * build file — and not in package.json, so a build with no country set never runs it.
 */
import { paketTamOlmali } from '../../scripts/ulke-paket-denetimi.mjs'

paketTamOlmali('uz')

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
