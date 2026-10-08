/**
 * NOTYA-ULKE-01 — Uzbekistan, build-level facts. Read by next.config.mjs for an Uzbekistan build and by nothing else.
 * Plain data: no imports, so the config can load it before anything is compiled.
 */
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
