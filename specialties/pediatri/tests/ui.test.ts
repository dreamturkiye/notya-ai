/**
 * PEDI-ARACLAR-01 — Araçlar › Pediatri bileşenleri gerçek react-dom/server çıktısıyla: çökmeden çizilir, ilk ekran
 * en az girdiyle başlar (gelişmiş seçenekler kapalı), her klinik çıktı TASLAK dilini taşır, dürüst boş durum metni var.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DozAraci from '../ui/araclar/DozAraci'
import BuyumeStudyosu from '../ui/araclar/BuyumeStudyosu'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))

describe('pediatri araç bileşenleri (SSR)', () => {
  it('Doz: boş başlar, gelişmiş kapalı, taslak + "ilaç önermez" dili', () => {
    const h = ciz(DozAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Notya ilaç veya doz önermez/)
    assert.match(h, /Kilo ve mg\/kg girin/)
    assert.match(h, /aria-expanded="false"/)
    assert.doesNotMatch(h, /Doz başı tavan/) // gelişmiş bölüm kapalıyken çizilmez
    assert.doesNotMatch(h, /value="\d/) // hiçbir sayısal ön değer yok
  })
  it('Büyüme: dürüst boş durum, Neyzi varsayılan, taslak dili', () => {
    const h = ciz(BuyumeStudyosu)
    assert.match(h, /Doğum tarihi ve cinsiyet girin/)
    assert.match(h, /aria-checked="true"[^>]*>Neyzi/)
    assert.match(h, /TASLAK/)
  })
})
