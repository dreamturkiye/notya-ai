/**
 * ORTOPEDI-EXCEPTIONAL-01 — Araçlar › ortopedi bileşenleri SSR.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import OrtoKirikAlciAraci from '../ui/araclar/OrtoKirikAlciAraci'
import OrtoVasAraci from '../ui/araclar/OrtoVasAraci'
import OrtoOpProtokolAraci from '../ui/araclar/OrtoOpProtokolAraci'
import OrtoKohortAraci from '../ui/araclar/OrtoKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [OrtoKirikAlciAraci, OrtoVasAraci, OrtoOpProtokolAraci, OrtoKohortAraci]

describe('Ortopedi araç bileşenleri (SSR)', () => {
  it('VAS: manşet, karar desteği, tanı kilidi yok', () => {
    const h = ciz(OrtoVasAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /karar desteği/i)
    assert.match(h, /VAS/)
    assert.match(h, /tanı yazılmaz/i)
  })

  it('Kırık/alçı: NV ve izlem dili', () => {
    const h = ciz(OrtoKirikAlciAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /NV|Alçı|Ortez/i)
  })

  it('Op-sonrası: ameliyathane planı yok', () => {
    const h = ciz(OrtoOpProtokolAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Ameliyathane planı|HIS/i)
  })

  it('Kohort: bayraklı hasta manşeti', () => {
    const h = ciz(OrtoKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
  })

  it('doz yok ve başka branşın alanı ortopedi araçlarına sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|PHQ-9|IPSS|veli\b/i)
    }
  })
})
