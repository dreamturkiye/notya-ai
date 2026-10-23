/**
 * AU-DEPTH-PARITY-03 — Türkiye's /asistan page, rendered through the shared views (AsistanSayfaGorunumu,
 * YaziliSohbetGorunumu), is byte for byte the markup the page produced BEFORE it was made country-neutral.
 * asistanSayfa.baseline.json was captured from the old page; the scenarios are lib/asistan/tests/asistanSayfaSenaryolari.ts.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AsistanSayfaTR } from '@/components/asistan/AsistanSayfaTR'
import { senaryolar } from './tests/asistanSayfaSenaryolari'

const BAZ = JSON.parse(readFileSync(join(__dirname, 'tests/asistanSayfa.baseline.json'), 'utf8')) as Record<string, string>

describe('Türkiye /asistan through the shared views: markup unchanged', () => {
  for (const s of senaryolar()) {
    it(s.ad, () => {
      const html = renderToStaticMarkup(React.createElement(AsistanSayfaTR, { o: s.o, mobilBaslangic: s.mobil }))
      assert.ok(BAZ[s.ad], `no stored markup for ${s.ad}`)
      assert.equal(html, BAZ[s.ad])
    })
  }
  it('every stored scenario is still run', () => {
    assert.deepEqual(Object.keys(BAZ).sort(), senaryolar().map((s) => s.ad).sort())
  })
})
