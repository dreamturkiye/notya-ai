/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Araçlar SSR: doz yok, başka branş sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import EnfIzolasyonAraci from '../ui/araclar/EnfIzolasyonAraci'
import EnfAtbSureAraci from '../ui/araclar/EnfAtbSureAraci'
import EnfViralIzlemAraci from '../ui/araclar/EnfViralIzlemAraci'
import EnfKohortAraci from '../ui/araclar/EnfKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [EnfIzolasyonAraci, EnfAtbSureAraci, EnfViralIzlemAraci, EnfKohortAraci]

describe('Enfeksiyon araç bileşenleri (SSR)', () => {
  it('İzolasyon: TASLAK, HIS yok', () => {
    const h = ciz(EnfIzolasyonAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /HIS|hastane/i)
  })

  it('ATB: doz yok', () => {
    const h = ciz(EnfAtbSureAraci)
    assert.match(h, /TASLAK/)
    assert.doesNotMatch(h, /\d+\s*mg\b/)
  })

  it('Viral: tanı yok', () => {
    const h = ciz(EnfViralIzlemAraci)
    assert.match(h, /TASLAK|karar desteği/i)
  })

  it('Kohort: bayraklı hasta', () => {
    const h = ciz(EnfKohortAraci)
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
