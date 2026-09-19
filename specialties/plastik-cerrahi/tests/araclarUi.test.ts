/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, tanı yok, derm/OR sızmaz.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import PlastikFotoAraci from '../ui/araclar/PlastikFotoAraci'
import PlastikYaraAraci from '../ui/araclar/PlastikYaraAraci'
import PlastikOnamAraci from '../ui/araclar/PlastikOnamAraci'
import PlastikKohortAraci from '../ui/araclar/PlastikKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [PlastikFotoAraci, PlastikYaraAraci, PlastikOnamAraci, PlastikKohortAraci]

describe('Plastik araç bileşenleri (SSR)', () => {
  it('Foto: TASLAK, AI tanı yok', () => {
    const h = ciz(PlastikFotoAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /AI tanı|PASI/i)
  })
  it('Yara: TASLAK, OR/HIS yok', () => {
    const h = ciz(PlastikYaraAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /OR\/HIS|tanı/i)
  })
  it('Onam: TASLAK', () => {
    const h = ciz(PlastikOnamAraci)
    assert.match(h, /TASLAK/)
  })
  it('Kohort: bayraklı hasta', () => {
    const h = ciz(PlastikKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
  })
  it('doz yok ve başka branşın alanı sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\/m/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|gebelik haftası|PHQ-9|SCORE2|CAT\/mMRC|HbA1c|veli\b/i)
    }
  })
})
