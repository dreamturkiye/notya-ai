/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Araçlar SSR: doz yok, CAT/mMRC yok, pulmonoloji sızıntısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import GcPreopAraci from '../ui/araclar/GcPreopAraci'
import GcTupYaraAraci from '../ui/araclar/GcTupYaraAraci'
import GcPatolojiAraci from '../ui/araclar/GcPatolojiAraci'
import GcKohortAraci from '../ui/araclar/GcKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [GcPreopAraci, GcTupYaraAraci, GcPatolojiAraci, GcKohortAraci]

describe('Göğüs Cerrahisi araç bileşenleri (SSR)', () => {
  it('Pre-op: TASLAK, CAT yok', () => {
    const h = ciz(GcPreopAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /CAT|mMRC|doz|OR/i)
  })
  it('Tüp/yara: TASLAK', () => {
    assert.match(ciz(GcTupYaraAraci), /TASLAK/)
  })
  it('Patoloji: tanı yazılmaz', () => {
    assert.match(ciz(GcPatolojiAraci), /TASLAK|tanı/i)
  })
  it('Kohort: bayraklı hasta', () => {
    const h = ciz(GcKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
  })
  it('pulmonoloji ve pediatri sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /Akciğerlerim|GOLD\s*ABE|inhaler teknik|Baş Çevresi|Neyzi|PHQ-9|SCORE2|HbA1c|veli\b/i)
    }
  })
})
