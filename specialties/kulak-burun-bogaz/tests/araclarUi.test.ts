/**
 * KBB-EXCEPTIONAL-01 — Araçlar › KBB bileşenleri gerçek react-dom/server çıktısıyla:
 * çökmeden çizilir, her klinik çıktı TASLAK dilini taşır, manşet sayı kartı ve dürüst boş durum var,
 * hiçbir araç doz yazmaz ve başka branşın alanı sızmaz.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import KbbOtoskopiAraci from '../ui/araclar/KbbOtoskopiAraci'
import KbbOdyometriAraci from '../ui/araclar/KbbOdyometriAraci'
import KbbVertigoAraci from '../ui/araclar/KbbVertigoAraci'
import KbbSgkAraci from '../ui/araclar/KbbSgkAraci'
import KbbKohortAraci from '../ui/araclar/KbbKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [KbbOtoskopiAraci, KbbOdyometriAraci, KbbVertigoAraci, KbbSgkAraci, KbbKohortAraci]

describe('KBB araç bileşenleri (SSR)', () => {
  it('Otoskopi: sağ/sol kulak, boş dürüstlüğü, taslak dili, tanı yok', () => {
    const h = ciz(KbbOtoskopiAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Sağ kulak/)
    assert.match(h, /Sol kulak/)
    assert.match(h, /Henüz bulgu işaretlenmedi/)
    assert.match(h, /tanı yazmaz/i)
  })

  it('Odyometri: PTA manşeti, karar desteği bandı, eksik frekans dürüstlüğü', () => {
    const h = ciz(KbbOdyometriAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /PTA/)
    assert.match(h, /karar desteği/i)
    assert.match(h, /frekans boş|Eşikleri girin/)
  })

  it('Vertigo: santral şüphesi, 112 yönlendirmesi, taslak dili', () => {
    const h = ciz(KbbVertigoAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /112/)
    assert.match(h, /santral şüphesi/i)
    assert.match(h, /Dix-Hallpike/)
  })

  it('SGK işitme: eksik sayısı, T.C. ve cihaz bedeli taslağa girmez', () => {
    const h = ciz(KbbSgkAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /eksik/i)
    assert.match(h, /kimlik numarası bu çıktıda yer almaz/)
  })

  it('Kohort paneli: bayraklı hasta manşeti, hasta diline kilit', () => {
    const h = ciz(KbbKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
    assert.match(h, /tanı, dB değeri, işitme bandı ve ilaç adı yazılmaz/)
  })

  it('doz yok ve başka branşın alanı KBB araçlarına sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|PHQ-9|veli\b/i)
    }
  })
})
