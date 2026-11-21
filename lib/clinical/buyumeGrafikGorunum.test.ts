/**
 * BUYUME-GRAFIK-V2 — pins the redesigned growth tab markup (server render with Elif's case: real Neyzi curves):
 * soft bands instead of dashed lines, the child's points with the latest value + percentile, the trend note, the age
 * window toggle, the birth point. gorunum-paritesi-ulke: one component, words injected.
 *   npx tsx --test lib/clinical/buyumeGrafikGorunum.test.ts
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { persentilEgrileri, persentilHesapla, ayFarki, type BuyumeParametre } from './buyumeEgrisi'

// tsconfig keeps "jsx": "preserve" for Next; under tsx the components compile with the classic runtime.
;(globalThis as { React?: typeof React }).React = React
let BuyumeEgrileriGorunumu: typeof import('@/components/doktor/HastaBuyumeEgrileri').BuyumeEgrileriGorunumu
let Grafik: typeof import('@/components/doktor/buyume/BuyumeGrafigi').Grafik
let GRAFIK_TR_SOZLER: typeof import('@/components/doktor/buyume/BuyumeGrafigi').GRAFIK_TR_SOZLER

const DOGUM = '2026-09-20'
const OLCUM: { tarih: string; kilo: number; boy: number; bas: number; kaynak: string }[] = [
  { tarih: DOGUM, kilo: 3.2, boy: 50, bas: 34.5, kaynak: 'intake' },
  { tarih: '2026-10-21T09:30:00Z', kilo: 4.2, boy: 54, bas: 37, kaynak: 'muayene' },
  { tarih: '2026-11-18T10:00:00Z', kilo: 5.1, boy: 57.5, bas: 38.6, kaynak: 'muayene' },
]
function param(p: BuyumeParametre, alan: 'kilo' | 'boy' | 'bas') {
  return {
    birim: p === 'kilo' ? 'kg' : 'cm',
    egriler: persentilEgrileri(p, 'female', 24),
    noktalar: OLCUM.map((o) => {
      const ay = o.tarih === DOGUM ? 0 : ayFarki(DOGUM, o.tarih)!
      return { ay, deger: o[alan], tarih: o.tarih, kaynak: o.kaynak, persentil: persentilHesapla(p, 'female', ay, o[alan])!.persentil }
    }),
  }
}
const ELIF = {
  dogumBilinmiyor: false, mevcutYasAy: 2, cinsiyet: 'female' as const, duzeltme: null,
  parametreler: { kilo: param('kilo', 'kilo'), boy: param('boy', 'boy'), basCevresi: param('basCevresi', 'bas'), vki: null },
}

describe('growth tab v2 — markup', () => {
  let html = ''
  before(async () => {
    ;({ BuyumeEgrileriGorunumu } = await import('@/components/doktor/HastaBuyumeEgrileri'))
    ;({ Grafik, GRAFIK_TR_SOZLER } = await import('@/components/doktor/buyume/BuyumeGrafigi'))
    html = renderToStaticMarkup(createElement(BuyumeEgrileriGorunumu, { veri: ELIF }))
  })

  it('no dashed "lab paper" lines; three filled bands and one median per chart', () => {
    assert.doesNotMatch(html, /stroke-dasharray/)
    const bantlar = html.match(/<path d="M[^"]+Z" fill="#(e5eadb|d2ddc8|bccdb2)"/g) || []
    assert.equal(bantlar.length, 9, 'Kilo, Boy, Baş çevresi × 3 bands')
  })
  it('the child is the hero: a dot per measurement (birth included), the latest labelled with value and percentile', () => {
    assert.equal((html.match(/fill="#b03a62"/g) || []).length >= 9, true)
    assert.match(html, /5,1 kg · 5\d\. persentil/)
    assert.match(html, /Persentil kanalında ilerliyor/)
    assert.match(html, /aria-label="Doğum, 20\.09\.2026: 3,2 kg/)
  })
  it('a 2-month-old opens on 0–6 months with a one-tap full range', () => {
    assert.match(html, />0–6 ay</)
    assert.match(html, /Tümü · 0–24 ay/)
    assert.match(html, />6 ay</)
  })
  it('card header: latest value in large type, a percentile chip, age and date', () => {
    assert.match(html, /5,1 kg<\/span>/)
    assert.match(html, /1 ay 29 günlük · 18\.11\.2026/)
  })
  it('words are injectable (one look, another language)', () => {
    const en = renderToStaticMarkup(createElement(Grafik, {
      veri: ELIF.parametreler.kilo, birim: 'kg', ustAy: 6, genislik: 400,
      sozler: { ...GRAFIK_TR_SOZLER, ay: 'mo', yas: 'yr' },
    }))
    assert.match(en, />6 mo</)
  })
})
