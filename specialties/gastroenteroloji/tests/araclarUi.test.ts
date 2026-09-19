/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, dahiliye/pediatri sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import GastroIbdIbsAraci from '../ui/araclar/GastroIbdIbsAraci'
import GastroEndoskopiAraci from '../ui/araclar/GastroEndoskopiAraci'
import GastroHepatitAraci from '../ui/araclar/GastroHepatitAraci'
import GastroKohortAraci from '../ui/araclar/GastroKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [GastroIbdIbsAraci, GastroEndoskopiAraci, GastroHepatitAraci, GastroKohortAraci]

describe('Gastroenteroloji araç bileşenleri (SSR)', () => {
  it('IBD/IBS: TASLAK, tanı yok', () => {
    const h = ciz(GastroIbdIbsAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /karar desteği|doz yok/i)
  })

  it('Endoskopi: HIS yok', () => {
    const h = ciz(GastroEndoskopiAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /HIS/i)
  })

  it('Hepatit: antiviral doz yok', () => {
    const h = ciz(GastroHepatitAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /antiviral|doz/i)
  })

  it('Kohort: bayraklı hasta', () => {
    const h = ciz(GastroKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
  })

  it('doz yok ve başka branşın alanı sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|PHQ-9|SCORE2|CAT\/mMRC|HbA1c|veli\b/i)
    }
  })
})
