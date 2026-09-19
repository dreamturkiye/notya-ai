/**
 * GOGUS-EXCEPTIONAL-01 — Araçlar › göğüs bileşenleri SSR smoke.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import GogusCatMmrcAraci from '../ui/araclar/GogusCatMmrcAraci'
import GogusAksiyonPlaniAraci from '../ui/araclar/GogusAksiyonPlaniAraci'
import GogusInhalerAraci from '../ui/araclar/GogusInhalerAraci'
import GogusSgkAraci from '../ui/araclar/GogusSgkAraci'
import GogusKohortAraci from '../ui/araclar/GogusKohortAraci'

const ciz = (C: ComponentType) => renderToStaticMarkup(createElement(C))
const ARACLAR = [GogusCatMmrcAraci, GogusAksiyonPlaniAraci, GogusInhalerAraci, GogusSgkAraci, GogusKohortAraci]

describe('GOGUS araç bileşenleri (SSR)', () => {
  it('CAT/mMRC: karar desteği, tanı yok', () => {
    const h = ciz(GogusCatMmrcAraci)
    assert.match(h, /CAT/)
    assert.match(h, /karar desteği/i)
    assert.doesNotMatch(h, /tanı koy|tanısı konur/i)
  })

  it('aksiyon planı: 112, doz yok', () => {
    const h = ciz(GogusAksiyonPlaniAraci)
    assert.match(h, /Astım|KOAH/)
    assert.match(h, /mcg|puff|doz yazmayın/i)
  })

  it('inhaler: teknik liste, mcg yok sayı olarak', () => {
    const h = ciz(GogusInhalerAraci)
    assert.match(h, /Teknik/)
    assert.doesNotMatch(h, /\d+\s*mg\b/)
  })

  it('SGK: T.C. yok', () => {
    const h = ciz(GogusSgkAraci)
    assert.match(h, /T\.C\.|kimlik/i)
    assert.doesNotMatch(h, /\d{11}/)
  })

  it('kohort: klinik skor taşımaz dili', () => {
    const h = ciz(GogusKohortAraci)
    assert.match(h, /kohort/i)
    assert.doesNotMatch(h, /Baş Çevresi|Neyzi|PHQ-9|lobektomi|VATS/i)
  })

  it('doz ve cerrahi sızıntısı yok', () => {
    for (const C of ARACLAR) {
      const h = ciz(C)
      assert.doesNotMatch(h, /\d+\s*mg\b/)
      assert.doesNotMatch(h, /ameliyathane|lobektomi|gogus-cerrahisi/i)
    }
  })
})
