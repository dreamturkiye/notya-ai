/**
 * ARACLAR-CILA-01 Faz 4 — iki yeni EVRENSEL araç gerçek react-dom/server çıktısıyla:
 * çökmeden çizilir, dürüst boş durum, hekim kilidi dili, hasta seçilmeden nota ekleme pasif,
 * ve hiçbir branşa özgü alan / hazır ilaç-doz metni taşımaz (brans-alan-sizmasi + doz kilidi).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import MuayeneSonuPaketi from '../../components/doktor/araclar/MuayeneSonuPaketi'
import Sablonlarim from '../../components/doktor/araclar/Sablonlarim'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))

describe('evrensel araç bileşenleri (SSR)', () => {
  it('Muayene sonu paketi: beş adım bağlı, hepsi işaretsiz başlar, taslak dili', () => {
    const h = ciz(MuayeneSonuPaketi)
    for (const ad of ['Reçete', 'Rapor', 'Kontrol randevusu', 'Portal özeti', 'SGK provizyon']) assert.ok(h.includes(ad), ad)
    for (const yol of ['/doktor-tools/erecete', '/doktor-tools/sgk-rapor', '/dashboard/doktor/randevular', '/doktor-tools/hasta-portali', '/doktor-tools/sgk-medula']) {
      assert.ok(h.includes(yol), yol)
    }
    assert.doesNotMatch(h, /type="checkbox" checked/) // hiçbir adım ön işaretli değil
    assert.match(h, /0\/5/)
    assert.match(h, /Adım işaretleyin ya da kontrol aralığını yazın/)
    assert.match(h, /TASLAK/)
    assert.match(h, /Önce hasta seçin/)
    assert.match(h, /min-height:44px/)
  })

  it('Sık kullandıklarım: boş başlar, hazır şablon önerilmez, hekim kilidi dili', () => {
    const h = ciz(Sablonlarim)
    assert.match(h, /Yükleniyor…/)
    assert.match(h, /TASLAK/)
    assert.match(h, /Notya ilaç ya da doz önermez — bu alan tamamen sizin yazdığınızdır/)
    assert.match(h, /Şablon bir hatırlatmadır, reçete ya da tanı değildir/)
    assert.match(h, /disabled=""[\s\S]{0,240}Şablonu kaydet/) // ad girilene kadar kaydet pasif
    assert.doesNotMatch(h, /value="[^"]+"/, 'form alanları boş başlar — ön doldurulmuş şablon yok')
    assert.doesNotMatch(h, /\d+\s*mg\b/)
  })

  it('evrensel araçlar hiçbir branşın alanını taşımaz', () => {
    for (const C of [MuayeneSonuPaketi, Sablonlarim]) {
      const h = ciz(C)
      assert.doesNotMatch(h, /Baş Çevresi|Neyzi|gebelik haftası|PASI|logMAR|Fitzpatrick|SCORE2|veli\b/i)
    }
  })
})
