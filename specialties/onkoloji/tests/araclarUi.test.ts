/**
 * ONKOLOJI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, tanı/evre yok, branş sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import OnkoKurAraci from '../ui/araclar/OnkoKurAraci'
import OnkoToksisiteAraci from '../ui/araclar/OnkoToksisiteAraci'
import OnkoSutAraci from '../ui/araclar/OnkoSutAraci'
import OnkoKohortAraci from '../ui/araclar/OnkoKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [OnkoKurAraci, OnkoToksisiteAraci, OnkoSutAraci, OnkoKohortAraci]

describe('Onkoloji araç bileşenleri (SSR)', () => {
  it('Kür: TASLAK, doz yok', () => {
    const h = ciz(OnkoKurAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /mg\/m|AUC|BSA|doz/i)
  })
  it('Toksisite: grade tanı değil', () => {
    const h = ciz(OnkoToksisiteAraci)
    assert.match(h, /TASLAK/)
  })
  it('SUT: e-imza yok', () => {
    const h = ciz(OnkoSutAraci)
    assert.match(h, /TASLAK|e-imza|Medula/i)
  })
  it('Kohort: bayraklı hasta', () => {
    const h = ciz(OnkoKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
  })
  it('doz yok ve başka branşın alanı sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\/m/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|PHQ-9|SCORE2|CAT\/mMRC|HbA1c|veli\b/i)
    }
  })
})
