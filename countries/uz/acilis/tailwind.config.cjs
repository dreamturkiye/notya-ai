/**
 * NOTYA-UZ-ACILIS-02 — isolated Tailwind compile for the Uzbekistan landing page (./utilities.css).
 *
 * The page mirrors the Turkish doctor landing page, so the THEME is that page's own (tailwind.doktor.config.js,
 * required here and not edited): one source for every colour, type size and shadow, and the two pages cannot drift.
 * Everything else is this pack's: the scope class (.uzl), the files scanned, the output.
 *
 * Recompile after changing a class name in this folder or in one of the shared presentational components listed
 * below (run from the repository root; the result is committed, like app/doktor/utilities.css):
 *
 *   npx tailwindcss -c countries/uz/acilis/tailwind.config.cjs -i countries/uz/acilis/tw-kaynak.css -o countries/uz/acilis/utilities.css --minify
 *
 * A class that is used but not in the compiled file silently vanishes from the page; ./acilis.test.ts fails on it.
 */
const turkiye = require('../../../tailwind.doktor.config.js')

module.exports = {
  important: '.uzl',
  corePlugins: { preflight: false },
  content: [
    './countries/uz/acilis/*.tsx',
    // Shared presentational components the page reuses (allowed by name in lib/ulke/ulkeDuvarlari.test.ts).
    './components/doktor-landing/button.tsx',
    './components/doktor-landing/feature.tsx',
    './components/doktor-landing/icons.tsx',
  ],
  theme: turkiye.theme,
}
