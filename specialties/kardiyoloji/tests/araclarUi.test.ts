/**
 * KARDIO-EXCEPTIONAL-01 — Araçlar › Kardiyoloji bileşenleri SSR.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import KardioScore2Araci from '../ui/araclar/KardioScore2Araci'
import KardioHtKkyAraci from '../ui/araclar/KardioHtKkyAraci'
import KardioSgkAraci from '../ui/araclar/KardioSgkAraci'
import KardioKohortAraci from '../ui/araclar/KardioKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [KardioScore2Araci, KardioHtKkyAraci, KardioSgkAraci, KardioKohortAraci]

describe('Kardiyoloji araç bileşenleri (SSR)', () => {
  it('SCORE2: manşet, karar desteği, taslak dili', () => {
    const h = ciz(KardioScore2Araci)
    assert.match(h, /TASLAK/)
    assert.match(h, /SCORE2/)
    assert.match(h, /karar desteği/i)
  })

  it('HT/KKY: dürüst boş durum, doz yok', () => {
    const h = ciz(KardioHtKkyAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Henüz ölçüm veya not girilmedi|İzlem/)
  })

  it('SGK: eksik sayısı, T.C. yazılmaz', () => {
    const h = ciz(KardioSgkAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /kimlik numarası bu çıktıda yer almaz/)
  })

  it('Kohort: bayraklı hasta manşeti, hasta diline kilit', () => {
    const h = ciz(KardioKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
    assert.match(h, /SCORE2 değeri|tanı/)
  })

  it('doz yok ve başka branşın alanı kardiyoloji araçlarına sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|PHQ-9|veli\b|PTA/i)
    }
  })
})
