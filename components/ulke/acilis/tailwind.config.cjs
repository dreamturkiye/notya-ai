/**
 * NOTYA-UZ-ACILIS-02 · NOTYA-ULKE-SABLON-01 — isolated Tailwind compile for the country kit's landing page layout
 * (./utilities.css). One stylesheet for every country: the layout is shared, so its classes are.
 *
 * The page mirrors the Turkish doctor landing page, so the THEME is that page's own (tailwind.doktor.config.js,
 * required here and not edited): one source for every colour, type size and shadow, and the two pages cannot drift.
 * Everything else is the kit's: the scope class (.uzl), the files scanned, the output.
 *
 * Recompile after changing a class name in this folder or in one of the shared presentational components listed
 * below (run from the repository root; the result is committed, like app/doktor/utilities.css):
 *
 *   npx tailwindcss -c components/ulke/acilis/tailwind.config.cjs -i components/ulke/acilis/tw-kaynak.css -o components/ulke/acilis/utilities.css --minify
 *
 * A class that is used but not in the compiled file silently vanishes from the page; countries/uz/acilis/acilis.test.ts fails on it.
 */
const turkiye = require('../../../tailwind.doktor.config.js')

module.exports = {
  important: '.uzl',
  corePlugins: { preflight: false },
  content: [
    './components/ulke/acilis/*.tsx',
    // Shared presentational components the page reuses (allowed by name in lib/ulke/ulkeDuvarlari.test.ts).
    './components/doktor-landing/button.tsx',
    './components/doktor-landing/feature.tsx',
    './components/doktor-landing/icons.tsx',
  ],
  theme: turkiye.theme,
}
