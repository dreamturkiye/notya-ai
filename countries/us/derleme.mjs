/**
 * NOTYA-ULKE-EN-01 — United States (`us`): build-level facts. Read by next.config.mjs for a build of this country
 * and by nothing else. Plain data, so the config can load it before anything is compiled. Its one import is the gate
 * every country build passes (scripts/ulke-derleme-kapisi.mjs): the pack scan, the wall check, and the rule that a
 * country is built with `npm run build:ulke` so that the build proof runs.
 *
 *   NOTYA_COUNTRY=us npm run build:ulke
 */
import { ulkeDerlemeKapisi } from '../../scripts/ulke-derleme-kapisi.mjs'

ulkeDerlemeKapisi('us')

const derleme = {
  kod: 'us',
  saatDilimi: 'America/New_York',
  bolunmemisUygulama: false,
  // The path of the main site this country is served under. Becomes Next's `basePath`. Same value as `yolOnEki` in ./index.ts.
  yolOnEki: '/us',
  yonlendirmeler: [],
}

export default derleme
