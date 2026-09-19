/**
 * ARACLAR-CILA-01 — Araçlar › Dahiliye bileşenleri gerçek react-dom/server çıktısıyla: çökmeden çizilir,
 * her klinik çıktı TASLAK dilini taşır, manşet sayı kartı ve dürüst boş durum var (pediatri kalıbı).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Score2Araci from '../ui/araclar/Score2Araci'
import CkdAraci from '../ui/araclar/CkdAraci'
import PolifarmasiAraci from '../ui/araclar/PolifarmasiAraci'
import AntikoagAraci from '../ui/araclar/AntikoagAraci'
import SgkRaporAraci from '../ui/araclar/SgkRaporAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))

describe('dahiliye araç bileşenleri (SSR)', () => {
  it('SCORE2: cinsiyet segmenti, manşet risk, lipid bölümü katlanır kapalı, taslak dili', () => {
    const h = ciz(Score2Araci)
    assert.match(h, /TASLAK/)
    assert.match(h, /aria-checked="true"[^>]*>Erkek/)
    assert.match(h, /aria-expanded="false"[^>]*>.*Lipid durumu/)
    assert.match(h, /sayısal risk hesaplanmadı/)
  })

  it('CKD: evre manşeti, önceki eGFR katlanır kapalı, dürüst boş durum, taslak dili', () => {
    const h = ciz(CkdAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /eGFR girilmedi — evre verilmez/)
    assert.match(h, /aria-expanded="false"[^>]*>.*Önceki eGFR/)
  })

  it('Polifarmasi: ilaç / öneri sayıları manşette, ≥65 yaş kapısı görünür, taslak dili', () => {
    const h = ciz(PolifarmasiAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /aktif ilaç satırı/)
    assert.match(h, /durdurmayı değerlendir/)
    assert.match(h, /tarama ≥65 yaş için uygulanır/)
  })

  it('Antikoagülan: CHA₂DS₂-VASc manşeti, HAS-BLED skor iddiası yok, ilaç bölümü katlanır', () => {
    const h = ciz(AntikoagAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /işaretli bileşen toplamı/)
    assert.match(h, /SKOR İDDİASI YOK/)
    assert.match(h, /aria-expanded="false"[^>]*>.*Eş zamanlı ilaçlar/)
  })

  it('SGK ilaç raporu: eksik sayısı manşette, T.C. yazılmaz dili, taslak dili', () => {
    const h = ciz(SgkRaporAraci)
    assert.match(h, /TASLAK/)
    assert.match(h, /SUT maddesi tamam/)
    assert.match(h, /T\.C\. kimlik no taslağa yazılmaz/)
    assert.doesNotMatch(h, /\d+\s*mg\b/)
  })

  it('başka branşın alanı dahiliye araçlarına sızmaz', () => {
    for (const C of [Score2Araci, CkdAraci, PolifarmasiAraci, AntikoagAraci, SgkRaporAraci]) {
      assert.doesNotMatch(ciz(C), /Baş Çevresi|Neyzi|logMAR|PASI|Fitzpatrick|veli\b/i)
    }
  })
})
