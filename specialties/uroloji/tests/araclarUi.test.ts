/**
 * UROLOJI-EXCEPTIONAL-01 — Araçlar › üroloji bileşenleri SSR.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import UroIpssAraci from '../ui/araclar/UroIpssAraci'
import UroPsaAraci from '../ui/araclar/UroPsaAraci'
import UroAcilAraci from '../ui/araclar/UroAcilAraci'
import UroKohortAraci from '../ui/araclar/UroKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [UroIpssAraci, UroPsaAraci, UroAcilAraci, UroKohortAraci]

describe('Üroloji araç bileşenleri (SSR)', () => {
  it('IPSS: manşet, karar desteği, tanı kilidi yok', () => {
    const h = ciz(UroIpssAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /karar desteği/i)
    assert.match(h, /IPSS/)
    assert.match(h, /tanı yazılmaz/i)
  })

  it('PSA: ng/mL, karar desteği, kanser tanısı yok', () => {
    const h = ciz(UroPsaAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /ng\/mL|PSA/)
    assert.match(h, /karar desteği/i)
    assert.match(h, /kanser tanısı yazılmaz/i)
  })

  it('Acil: 112 yönlendirmesi, taslak dili', () => {
    const h = ciz(UroAcilAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /112/)
    assert.match(h, /hematuri|Hematuri|idrar kanaması/i)
  })

  it('Kohort: bayraklı hasta manşeti, hasta diline kilit', () => {
    const h = ciz(UroKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
    assert.match(h, /tanı|PSA sayı|IPSS skor/i)
  })

  it('doz yok ve başka branşın alanı üroloji araçlarına sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|PHQ-9|veli\b/i)
    }
  })
})
