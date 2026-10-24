/**
 * LOOK-PARITY (2026-10-24) — an internal note must never reach a screen.
 * "A clinician has not read this wording." (and the lawyer / native-reader variants) are notes for the team, not for
 * the doctor or the patient. This guard scans every source file that can carry visible words, in all six countries.
 * (The legal drafts' own "draft, not reviewed" banner is a separate, deliberate legal label: it says "this text".)
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KOK = join(__dirname, '..', '..')
const KOKLER = ['countries', 'lib/ulke', 'components', 'app']
const YASAK = /\b(?:clinician|lawyer|native (?:reader|speaker)|doctor|solicitor)s?(?: and (?:a |an )?\w+)? (?:has|have) not read this wording\b/i

function gez(d: string, c: string[] = []): string[] {
  for (const ad of readdirSync(d)) {
    if (ad === 'node_modules' || ad === '.next') continue
    const y = join(d, ad)
    if (statSync(y).isDirectory()) gez(y, c)
    else if (/\.tsx?$/.test(ad) && !/\.test\.tsx?$/.test(ad)) c.push(y)
  }
  return c
}

describe('no internal "has not read this wording" note on any screen', () => {
  it('appears in no source string of any country', () => {
    const bulunan: string[] = []
    for (const k of KOKLER) {
      for (const f of gez(join(KOK, k))) {
        readFileSync(f, 'utf8').split('\n').forEach((satir, i) => {
          const t = satir.trim()
          if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return
          if (YASAK.test(satir)) bulunan.push(`${f.slice(KOK.length + 1)}:${i + 1}`)
        })
      }
    }
    assert.deepEqual(bulunan, [])
  })
})
