/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, dahiliye/pediatri sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import EndoLabIzlemAraci from '../ui/araclar/EndoLabIzlemAraci'
import EndoDxaAraci from '../ui/araclar/EndoDxaAraci'
import EndoRejimAraci from '../ui/araclar/EndoRejimAraci'
import EndoKohortAraci from '../ui/araclar/EndoKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [EndoLabIzlemAraci, EndoDxaAraci, EndoRejimAraci, EndoKohortAraci]

describe('Endokrinoloji araç bileşenleri (SSR)', () => {
  it('Lab izlem: TASLAK, CGM yok, tanı yok', () => {
    const h = ciz(EndoLabIzlemAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /CGM|doz yok|karar desteği/i)
  })

  it('DXA: T-skor / tanı yok', () => {
    const h = ciz(EndoDxaAraci)
    assert.match(h, /TASLAK/)
    assert.doesNotMatch(h, /T-skor yorum|tanı koy/i)
  })

  it('Rejim: ünite/mcg yok', () => {
    const h = ciz(EndoRejimAraci)
    assert.match(h, /TASLAK|tarih/i)
    assert.doesNotMatch(h, /\d+\s*(mg|IU|Ü)\b/)
  })

  it('Kohort: bayraklı hasta', () => {
    const h = ciz(EndoKohortAraci)
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
