/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, ortopedi/FTR/pediatri sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import RomaDas28BasdaiAraci from '../ui/araclar/RomaDas28BasdaiAraci'
import RomaLabIzlemAraci from '../ui/araclar/RomaLabIzlemAraci'
import RomaBiyolojikSutAraci from '../ui/araclar/RomaBiyolojikSutAraci'
import RomaKohortAraci from '../ui/araclar/RomaKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [RomaDas28BasdaiAraci, RomaLabIzlemAraci, RomaBiyolojikSutAraci, RomaKohortAraci]

describe('Romatoloji araç bileşenleri (SSR)', () => {
  it('DAS28: TASLAK, tanı yok', () => {
    const h = ciz(RomaDas28BasdaiAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /karar desteği|doz yok/i)
  })

  it('Lab/eklem: TASLAK', () => {
    assert.match(ciz(RomaLabIzlemAraci), /TASLAK/)
  })

  it('SUT: doz/HIS yok', () => {
    const h = ciz(RomaBiyolojikSutAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /doz|infüzyon|HIS/i)
  })

  it('Kohort: bayraklı hasta', () => {
    const h = ciz(RomaKohortAraci)
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
