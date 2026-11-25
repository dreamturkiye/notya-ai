/**
 * AKKS gate, part 1 — a change to any AKKS-watched file (prompts, model policy, assistant routing, source registry; see
 * core/akks/izleme.ts) must be acknowledged before it ships:
 *
 *   npm run akks:izle -- --yaz "<what changed>"
 *
 * After deploy the nightly AKKS cron measures the new hash as a GATE run against the accepted baseline; the result is on
 * /kurucu/ayse-kalite and `npm run akks:kapi -- --url <host> --son` exits 1 on a regression (docs/AKKS.md "Gate").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { manifestFarki, manifestOzeti, type IzlenenManifest } from '../../core/akks/izleme'
import { simdikiDosyalar } from './izlemeDosyalari'

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')

describe('AKKS watched-file manifest', () => {
  it('core/akks/izlenen.json matches the watched files (otherwise: npm run akks:izle -- --yaz "<what changed>")', () => {
    const kayitli = JSON.parse(readFileSync(path.join(KOK, 'core', 'akks', 'izlenen.json'), 'utf8')) as IzlenenManifest
    const f = manifestFarki(kayitli.dosyalar, simdikiDosyalar(KOK))
    assert.deepEqual(f, { degisen: [], eklenen: [], silinen: [] }, `AKKS-watched files changed — acknowledge with: npm run akks:izle -- --yaz "<what changed>"`)
    assert.equal(kayitli.ozet, manifestOzeti(kayitli.dosyalar))
  })
})
