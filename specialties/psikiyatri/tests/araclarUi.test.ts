/**
 * PSIK-EXCEPTIONAL-01 / ARACLAR-CILA-01 — Araçlar › Psikiyatri bileşenleri gerçek react-dom/server çıktısıyla:
 * çökmeden çizilir, her klinik çıktı TASLAK dilini taşır, manşet sayı kartı ve dürüst boş durum var,
 * hiçbir araç doz yazmaz ve başka branşın alanı sızmaz.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import PhqGadAraci from '../ui/araclar/PhqGadAraci'
import RiskAraci from '../ui/araclar/RiskAraci'
import IlacIzlemAraci from '../ui/araclar/IlacIzlemAraci'
import PsikSgkAraci from '../ui/araclar/PsikSgkAraci'
import PsikKohortAraci from '../ui/araclar/PsikKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [PhqGadAraci, RiskAraci, IlacIzlemAraci, PsikSgkAraci, PsikKohortAraci]

describe('psikiyatri araç bileşenleri (SSR)', () => {
  it('PHQ-9 / GAD-7: ölçek segmenti, manşet skor, boş madde dürüstlüğü, taslak dili', () => {
    const h = ciz(PhqGadAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /aria-checked="true"[^>]*>PHQ-9/)
    assert.match(h, /0 \/ 27/)
    assert.match(h, /9 madde boş/)
    // Şiddet bandı tanı değildir — dil karar desteği olarak kalır.
    assert.match(h, /karar desteği/i)
  })

  it('Güvenlik & acil triyaj: 112 yönlendirmesi, bayrak manşeti, hekim onayı kapısı', () => {
    const h = ciz(RiskAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /112/)
    assert.match(h, /Güvenlik bayrağı/)
    assert.match(h, /Bayrak yok/)
  })

  it('Psikotrop izlem: hasta seçilmeden kural kütüphanesi okunur, doz yazılmaz', () => {
    const h = ciz(IlacIzlemAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Kural kütüphanesi/)
    assert.match(h, /Doz ve titrasyon yazılmaz/)
  })

  it('Psikotrop rapor: eksik sayısı manşette, T.C. ve doz taslağa girmez', () => {
    const h = ciz(PsikSgkAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Eksik alan/)
    assert.match(h, /kimlik numarası bu çıktıda yer almaz/)
  })

  it('Kohort paneli: bayraklı hasta manşeti, hasta diline kilit', () => {
    const h = ciz(PsikKohortAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bayraklı hasta/)
    assert.match(h, /tanı, ölçek adı, skor ve ilaç adı yazılmaz/)
  })

  it('doz yok ve başka branşın alanı psikiyatri araçlarına sızmaz', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|gebelik haftası|veli\b/i)
    }
  })
})
