/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — Araçlar SSR: ilaç dozu yok, pediatri sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import FtrSeansAraci from '../ui/araclar/FtrSeansAraci'
import FtrVasOdiAraci from '../ui/araclar/FtrVasOdiAraci'
import FtrEgzersizAraci from '../ui/araclar/FtrEgzersizAraci'
import FtrKohortAraci from '../ui/araclar/FtrKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [FtrSeansAraci, FtrVasOdiAraci, FtrEgzersizAraci, FtrKohortAraci]

describe('FTR araç bileşenleri (SSR)', () => {
  it('Seans: taslak, ilaç yok', () => {
    const h = ciz(FtrSeansAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /ilaç/i)
  })

  it('VAS/ODI: karar desteği', () => {
    const h = ciz(FtrVasOdiAraci)
    assert.match(h, /TASLAK|karar desteği/i)
  })

  it('Egzersiz: ilaç dozu değil', () => {
    const h = ciz(FtrEgzersizAraci)
    assert.match(h, /TASLAK|ilaç/i)
    assert.doesNotMatch(h, /\d+\s*mg\b/)
  })

  it('Kohort: bayraklı hasta', () => {
    const h = ciz(FtrKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
  })

  it('doz yok ve başka branşın alanı sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|PHQ-9|veli\b/i)
    }
  })
})
