/**
 * ARACLAR-CILA-01 — Araçlar › Dermatoloji bileşenleri gerçek react-dom/server çıktısıyla: çökmeden çizilir,
 * her klinik çıktı TASLAK dilini taşır, manşet sayı kartı ve dürüst boş durum var (pediatri kalıbı).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import PasiEasiAraci from '../ui/araclar/PasiEasiAraci'
import GopKapiAraci from '../ui/araclar/GopKapiAraci'
import FototerapiDefteriAraci from '../ui/araclar/FototerapiDefteriAraci'
import YamaAraci from '../ui/araclar/YamaAraci'
import DermKohortPaneli from '../ui/araclar/DermKohortPaneli'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))

describe('dermatoloji araç bileşenleri (SSR)', () => {
  it('PASI / EASI: skor segmenti, manşet skor, SCORAD katlanır kapalı, taslak dili', () => {
    const h = ciz(PasiEasiAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /aria-checked="true"[^>]*>PASI \(psoriasis\)/)
    assert.match(h, /aria-expanded="false"[^>]*>.*SCORAD/)
    assert.match(h, /Alan derecesi \(A\) girilmeden skor 0 kalır/)
  })

  it('GÖP kapı: engel sayısı manşette, asitretin notu katlanır, taslak dili', () => {
    const h = ciz(GopKapiAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /açık kapı engeli/)
    assert.match(h, /aria-expanded="false"[^>]*>.*Asitretin farkı/)
    assert.match(h, /doz ve endikasyon Notya tarafından önerilmez/)
  })

  it('Fototerapi defteri: kümülatif doz manşette, MED / yanık katlanır kapalı, solaryum uyarısı', () => {
    const h = ciz(FototerapiDefteriAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /kümülatif doz/)
    assert.match(h, /aria-expanded="false"[^>]*>.*MED testi · yanık/)
    assert.match(h, /Solaryum tedavi cihazı değildir/)
  })

  it('Yama D2 / D4: takvim manşette, durum rozeti, taslak dili', () => {
    const h = ciz(YamaAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /D2 okuma/)
    assert.match(h, /D4 okuma/)
    assert.match(h, /antijen işaretli/)
  })

  it('Kohort: yükleniyor durumu, hasta-güvenli mesaj notu, 44 px dokunma hedefi', () => {
    const h = ciz(DermKohortPaneli)
    assert.match(h, /Yükleniyor…/)
    assert.match(h, /min-height:44px/)
  })

  it('başka branşın alanı derm araçlarına sızmaz', () => {
    for (const C of [PasiEasiAraci, GopKapiAraci, FototerapiDefteriAraci, YamaAraci, DermKohortPaneli]) {
      assert.doesNotMatch(ciz(C), /Baş Çevresi|Neyzi|logMAR|SCORE2|veli\b/i)
    }
  })
})
