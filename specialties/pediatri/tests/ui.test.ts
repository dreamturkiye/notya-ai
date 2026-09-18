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
import AsiPlanlayici from '../ui/araclar/AsiPlanlayici'
import GelisimPaneli from '../ui/araclar/GelisimPaneli'
import PediKohortPaneli from '../ui/araclar/PediKohortPaneli'

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
  it('Aşı planı: tek girdiyle başlar, ileri seçenekler kapalı, hiçbir doz ön işaretli değil, dürüst boş durum + taslak dili', () => {
    const h = ciz(AsiPlanlayici)
    assert.match(h, /Doğum tarihini \(ya da yaşı\) yazın/)
    assert.match(h, /aria-expanded="false"[^>]*>.*Prematüre/)
    assert.doesNotMatch(h, /Gebelik haftası/) // katlanır bölüm kapalı
    assert.doesNotMatch(h, /Yapıldı|Kayıtlı ·/) // doz otomatik "yapıldı" sayılmaz
    assert.match(h, /TASLAK/)
    assert.match(h, /baştan başlatılmaz/)
  })
  it('Gelişim paneli: dürüst boş durum, nota otomatik yazmaz dili', () => {
    const h = ciz(GelisimPaneli)
    assert.match(h, /bu vizitte gereken taramalar/)
    assert.match(h, /TASLAK/)
    assert.match(h, /Bugünkü Muayene Formuna Ekle/)
    assert.doesNotMatch(h, /Denver/)
  })
  it('Kohort paneli: yükleniyor durumu, beş bayrak filtresi, hasta-güvenli mesaj notu', () => {
    const h = ciz(PediKohortPaneli)
    assert.match(h, /Yükleniyor…/)
    for (const b of ['Aşı gecikmiş', 'Sağlam çocuk izlemi kaçmış', 'Persentil kayması', 'D vitamini / demir', 'İşitme · görme · otizm taraması']) assert.ok(h.includes(b), b)
    assert.match(h, /tanı, ölçüm ya da ilaç adı içermez/)
    assert.match(h, /min-height:44px/)
  })
})
