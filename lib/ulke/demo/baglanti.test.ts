/**
 * NOTYA-ULKE-DEMO-01 — only a Cal.com booking address switches "Book a demo" on.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { demoBaglantisiCoz } from './baglanti'

const KOK = resolve(__dirname, '../../..')

describe('demoBaglantisiCoz', () => {
  it('accepts https://cal.com/… and https://app.cal.com/…', () => {
    assert.deepEqual(demoBaglantisiCoz('https://cal.com/notya/demo'), { url: 'https://cal.com/notya/demo', origin: 'https://cal.com', calLink: 'notya/demo' })
    assert.deepEqual(demoBaglantisiCoz('  https://app.cal.com/gokhan/60min/  '), { url: 'https://app.cal.com/gokhan/60min', origin: 'https://app.cal.com', calLink: 'gokhan/60min' })
    assert.equal(demoBaglantisiCoz('https://cal.com/example')?.calLink, 'example')
    assert.equal(demoBaglantisiCoz('https://cal.com/notya/demo?month=2026-11')?.calLink, 'notya/demo')
  })

  it('treats anything else as empty', () => {
    for (const ham of [undefined, null, '', '   ', 'cal.com/notya', 'http://cal.com/notya', 'https://cal.com', 'https://cal.com/', 'https://calendly.com/notya', 'https://evil.com/cal.com/notya', 'https://cal.com.evil.com/notya', 'https://notcal.com/notya', 'https://eu.cal.com/notya', 'https://user:pw@cal.com/notya', 'https://cal.com:8443/notya', 'https://cal.com/notya"><script>', 'https://cal.com/no%20ya', 'javascript:alert(1)']) {
      assert.equal(demoBaglantisiCoz(ham as string), null, String(ham))
    }
  })
})

describe('Content-Security-Policy of /demo (next.config.mjs)', () => {
  const k = readFileSync(join(KOK, 'next.config.mjs'), 'utf8')
  it('a country build widens the policy for /demo only, with Cal.com\'s script, frame and font origins', () => {
    assert.match(k, /source: ['"]\/demo['"]/)
    assert.match(k, /const CAL_EMBED = ['"]https:\/\/app\.cal\.com https:\/\/cal\.com['"]/)
    assert.match(k, /frame-src 'self' \$\{CAL_EMBED\}/)
    // The /demo entry is added after the catch-all one (the later entry wins) and never for the pre-split application.
    assert.ok(k.indexOf("source: '/demo'") > k.indexOf('source: "/(.*)"'))
    assert.match(k, /bolunmemisUygulama \? \[\] : \[\s*\{\s*source: '\/demo'/)
  })
})
