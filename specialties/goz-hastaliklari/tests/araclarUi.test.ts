/**
 * ARACLAR-CILA-01 — Araçlar › Göz bileşenleri gerçek react-dom/server çıktısıyla: çökmeden çizilir,
 * her klinik çıktı TASLAK dilini taşır, manşet sayı kartı ve dürüst boş durum var (pediatri kalıbı).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import GilKodAraci from '../ui/araclar/GilKodAraci'
import VaAraci from '../ui/araclar/VaAraci'
import SutVegfAraci from '../ui/araclar/SutVegfAraci'
import SgkRaporAraci from '../ui/araclar/SgkRaporAraci'
import GozKohortPaneli from '../ui/araclar/GozKohortPaneli'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))

describe('göz araç bileşenleri (SSR)', () => {
  it('GİL kod: arama boş başlar, tip segmenti açık, kalem sayısı manşette, taslak dili', () => {
    const h = ciz(GilKodAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /role="radiogroup"/) // Secim yerine Segment
    assert.match(h, /aria-checked="true"[^>]*>Tümü/)
    assert.match(h, /EK-3\/G toplam/)
    assert.doesNotMatch(h, /₺|TL\b/) // bedel gösterilmez
  })

  it('VA: iki vizit alanı, ETDRS farkı manşette, taslak dili', () => {
    const h = ciz(VaAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Önceki vizit/)
    assert.match(h, /ETDRS farkı/)
    assert.match(h, /karşılaştırma için iki vizit gerekir/)
  })

  it('SUT anti-VEGF: engel / uyarı manşeti, dayanaklar katlanır, taslak dili', () => {
    const h = ciz(SutVegfAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /ödeme engeli/)
    assert.match(h, /aria-expanded="false"[^>]*>.*SUT dayanakları/)
    assert.match(h, /geçmiş girilmedi/)
  })

  it('SGK rapor: eksik sayısı manşette, ileri alanlar kapalı, taslak dili', () => {
    const h = ciz(SgkRaporAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /eksik zorunlu madde/)
    assert.match(h, /SUT maddesi tamam/)
    assert.match(h, /aria-expanded="false"[^>]*>.*MFK ve görüntüleme tarihleri/)
    assert.match(h, /T\.C\. kimlik no ve doz yazılmaz/)
  })

  it('Kohort: yükleniyor durumu, hasta-güvenli mesaj notu, 44 px dokunma hedefi', () => {
    const h = ciz(GozKohortPaneli)
    assert.match(h, /Yükleniyor…/)
    assert.match(h, /tanı ve klinik değer içermez/)
    assert.match(h, /min-height:44px/)
  })

  it('başka branşın alanı göz araçlarına sızmaz', () => {
    for (const C of [GilKodAraci, VaAraci, SutVegfAraci, SgkRaporAraci, GozKohortPaneli]) {
      assert.doesNotMatch(ciz(C), /Baş Çevresi|Neyzi|gebelik haftası|PASI|Fitzpatrick|veli/i)
    }
  })
})
