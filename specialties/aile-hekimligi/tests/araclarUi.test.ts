/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, pediatri sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AileAsiTaramaAraci from '../ui/araclar/AileAsiTaramaAraci'
import AileKronikAraci from '../ui/araclar/AileKronikAraci'
import AileSevkAraci from '../ui/araclar/AileSevkAraci'
import AileKohortAraci from '../ui/araclar/AileKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [AileAsiTaramaAraci, AileKronikAraci, AileSevkAraci, AileKohortAraci]

describe('Aile hekimliği araç bileşenleri (SSR)', () => {
  it('Aşı/tarama: TASLAK, doz yok', () => {
    const h = ciz(AileAsiTaramaAraci)
    assert.match(h, /TASLAK/)
    assert.doesNotMatch(h, /\d+\s*mg\b/)
  })

  it('Kronik: doz yok, vade dili', () => {
    const h = ciz(AileKronikAraci)
    assert.match(h, /TASLAK|doz/i)
    assert.doesNotMatch(h, /\d+\s*mg\b/)
  })

  it('Sevk: 112, tanı yok', () => {
    const h = ciz(AileSevkAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /112/)
    assert.match(h, /tanı yazmaz/i)
  })

  it('Kohort: bayraklı hasta', () => {
    const h = ciz(AileKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
  })

  it('doz yok ve başka branşın alanı sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|PHQ-9|MIDAS|SCORE2|veli\b/i)
    }
  })
})
