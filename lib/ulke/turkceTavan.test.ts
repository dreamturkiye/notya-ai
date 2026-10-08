/**
 * NOTYA-ULKE-01 — ratchet: the number of shared source files that carry user-visible Turkish text may only go down.
 * Count and definition: scripts/ulke-turkce-tavan.mjs (letters ç ğ ı ö ş ü İ in a string, template or JSX text — a
 * proxy, said so in its output). New Turkish text belongs in countries/tr.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const KOK = resolve(__dirname, '../..')

describe('Turkish text outside countries/tr: ceiling', () => {
  const r = spawnSync('node', [join(KOK, 'scripts/ulke-turkce-tavan.mjs'), '--liste'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  const kayit = JSON.parse(readFileSync(join(KOK, 'countries/turkce-tavan.json'), 'utf8')) as { tavan: number; taranan: number }
  const sayim = Number(/\] (\d+) of \d+ source files/.exec(r.stdout)?.[1])

  it('the count is at or below the recorded ceiling', () => {
    assert.ok(Number.isInteger(sayim) && sayim > 0, `could not read the count:\n${r.stdout}\n${r.stderr}`)
    assert.ok(sayim <= kayit.tavan, `${sayim} files carry user-visible Turkish text, ceiling is ${kayit.tavan}. Move the new text into countries/tr (docs/COUNTRY-PACK-SPLIT-PLAN.md).\n${r.stderr}`)
    assert.equal(r.status, 0, r.stderr)
  })

  it('the output says it is a proxy', () => {
    assert.match(r.stdout, /proxy: a string, template or JSX text containing ç ğ ı ö ş ü İ — not a language detector/)
  })

  it('nothing new in this foundation carries Turkish text: lib/ulke, the other packs, the entry point', () => {
    const liste = r.stdout.split('\n').map((s) => s.trim())
    const yasak = liste.filter((d) => /^(lib\/ulke\/|countries\/(?!tr\/)|components\/ulke\/|app\/(login|signup|welcome|api\/ulke)\/|middleware\.ulke\.ts$)|\.ulke\.(ts|tsx)$/.test(d))
    assert.deepEqual(yasak, [])
  })

  it('the ceiling cannot be raised by the script', () => {
    const betik = readFileSync(join(KOK, 'scripts/ulke-turkce-tavan.mjs'), 'utf8')
    assert.match(betik, /refusing to RAISE the ceiling/)
    assert.ok(kayit.tavan > 0 && kayit.tavan <= kayit.taranan)
  })
})
