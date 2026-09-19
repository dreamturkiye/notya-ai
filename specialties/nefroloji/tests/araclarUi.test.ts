/**
 * NEFROLOJI-EXCEPTIONAL-01 — Araçlar SSR: ESA doz yok, dahiliye/pediatri sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import NefEgfrAraci from '../ui/araclar/NefEgfrAraci'
import NefDiyalizAraci from '../ui/araclar/NefDiyalizAraci'
import NefAnemiAraci from '../ui/araclar/NefAnemiAraci'
import NefKohortAraci from '../ui/araclar/NefKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [NefEgfrAraci, NefDiyalizAraci, NefAnemiAraci, NefKohortAraci]

describe('Nefroloji araç bileşenleri (SSR)', () => {
  it('eGFR: TASLAK, tanı yok', () => {
    const h = ciz(NefEgfrAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /karar desteği/i)
  })

  it('Diyaliz: HIS yok', () => {
    const h = ciz(NefDiyalizAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /HIS|UF/i)
  })

  it('Anemi: ESA doz yok', () => {
    const h = ciz(NefAnemiAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /ESA/)
  })

  it('Kohort: bayraklı hasta + checklist', () => {
    const h = ciz(NefKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
  })

  it('doz yok ve başka branşın alanı sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|PHQ-9|SCORE2|CAT\/mMRC|veli\b/i)
    }
  })
})
