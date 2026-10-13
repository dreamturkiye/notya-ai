/**
 * NOTYA-ULKE-01 — Türkiye, build-level facts. Read by next.config.mjs for a Türkiye build and by nothing else.
 * Plain data: no imports, so the config can load it before anything is compiled.
 */
const derleme = {
  kod: 'tr',
  // The value next.config.mjs carried as a literal before 2026-10-08.
  saatDilimi: 'Europe/Istanbul',
  // Türkiye is the pre-split application: its redirects are still the list written in next.config.mjs, untouched.
  // They move here when the landing and login surfaces are split (docs/COUNTRY-PACK-SPLIT-PLAN.md, jobs 3 and 7).
  bolunmemisUygulama: true,
  // Türkiye is the domain root: no path prefix, so next.config.mjs sets no `basePath` (as before).
  yolOnEki: '',
  yonlendirmeler: [],
}

export default derleme
