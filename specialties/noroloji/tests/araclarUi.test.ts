/**
 * NOROLOJI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, pediatri sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import NoroInmeAraci from '../ui/araclar/NoroInmeAraci'
import NoroMigrenAraci from '../ui/araclar/NoroMigrenAraci'
import NoroIlacIzlemAraci from '../ui/araclar/NoroIlacIzlemAraci'
import NoroKohortAraci from '../ui/araclar/NoroKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [NoroInmeAraci, NoroMigrenAraci, NoroIlacIzlemAraci, NoroKohortAraci]

describe('Nöroloji araç bileşenleri (SSR)', () => {
  it('İnme: 112, taslak, tanı yok', () => {
    const h = ciz(NoroInmeAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /112/)
    assert.match(h, /tanı yazmaz/i)
  })

  it('MIDAS: karar desteği, eksik dürüstlüğü', () => {
    const h = ciz(NoroMigrenAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /MIDAS|karar desteği/i)
  })

  it('İlaç izlem: doz yok, sınıf düzeyi', () => {
    const h = ciz(NoroIlacIzlemAraci)
    assert.match(h, /TASLAK|doz/i)
    assert.doesNotMatch(h, /\d+\s*mg\b/)
  })

  it('Kohort: bayraklı hasta, klinik bilgi kilidi', () => {
    const h = ciz(NoroKohortAraci)
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
