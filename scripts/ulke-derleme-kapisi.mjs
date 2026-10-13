/**
 * NOTYA-ULKE-SABLON-01 — THE GATE EVERY COUNTRY BUILD PASSES. Called by the country's own build file:
 *
 *   countries/<code>/derleme.mjs:   ulkeDerlemeKapisi('<code>')
 *
 * next.config.mjs loads that file ONLY for the country being built, so a build with no NOTYA_COUNTRY (Türkiye) never
 * comes here: its `prebuild`, `build` and `postbuild` in package.json are what they are on main, and its own build
 * file (countries/tr/derleme.mjs) is plain data. The checks are the country side's, and they run on the country side:
 *
 *   1. PACK SCAN   nothing in the pack is still marked "to be supplied"   (scripts/ulke-paket-denetimi.mjs)
 *   2. WALLS       no code crosses between countries                       (scripts/ulke-duvarlari.mjs)
 *   3. BUILD PROOF the finished build holds this country's pack and no other (scripts/ulke-derleme-kaniti.mjs).
 *      A proof needs the finished build, so it cannot run from here: `npm run build:ulke` (scripts/ulke-derle.mjs)
 *      runs the build and then the proof. To make sure it is never skipped, a bare `next build` for a country is
 *      REFUSED here unless it was started by that command.
 *
 * 1 runs whenever the file is loaded (it reads a few files). 2 and 3 concern the build and run only in the process
 * that is `next build` itself — not in its workers, not for `next start` or `next dev`.
 * The same three checks also run in the country test suite (`npm run test:ulke`).
 */
import { paketTamOlmali } from './ulke-paket-denetimi.mjs'
import { duvarlariDenetle } from './ulke-duvarlari.mjs'

const dur = (mesaj) => { const h = new Error(mesaj); h.stack = h.message; throw h }

/** true in the one process that is `next build` (its workers and every other command answer false). */
export const nextDerlemesiMi = (argv = process.argv) => /(^|[\\/])next$/.test(argv[1] ?? '') && argv[2] === 'build'

export function ulkeDerlemeKapisi(kod, { argv = process.argv, ortam = process.env } = {}) {
  paketTamOlmali(kod)
  if (!nextDerlemesiMi(argv)) return
  const { ihlaller } = duvarlariDenetle()
  if (ihlaller.length) {
    console.error(`\n[ulke-duvarlari] ${ihlaller.length} wall violation(s):`)
    for (const i of ihlaller) console.error(`  ${i.kural}  ${i.dosya}: ${i.mesaj}`)
    dur(`The build of "${kod}" stops: ${ihlaller.length} wall violation(s) between countries (listed above). Rules: scripts/ulke-duvarlari.mjs.`)
  }
  if (ortam.NOTYA_ULKE_DERLEME !== '1') {
    dur(`A country is built with:  NOTYA_COUNTRY=${kod} npm run build:ulke\n` +
      `That command runs this build and then proves, on the build output, that it holds the "${kod}" pack and no other country's. A bare "next build" would skip the proof, so it is refused.`)
  }
}
