/**
 * AU-KURUCU-01 / AU-DEMO-02 (2026-11-03) - the founding-doctor page (/founding), for whichever pack is active.
 * A country without a founding offer has no page and no "private demo" button outside /demo. A country with one:
 * the counter while places are left, the regular price when full, no counter when unknown, and the demo button only
 * while the booking link is a real Cal.com calendar.
 */
import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { DilKodu } from '@/lib/ulke/tipler'
import type { UlkeAcilisi } from '@/lib/ulke/arayuz/acilisTipleri'

;(require as unknown as { extensions: Record<string, (m: { exports: unknown }) => void> }).extensions['.css'] = (m) => { m.exports = {} }

let a: UlkeAcilisi | null
let T: typeof import('@/lib/billing/ulkeTicari')
let U: typeof import('@/lib/ulke/ulke')
let D: typeof import('@/lib/ulke/demo')
let K: typeof import('./KurucuSayfasi')

before(async () => {
  a = (await import('@/lib/ulke/arayuz')).acilis()
  T = await import('@/lib/billing/ulkeTicari')
  U = await import('@/lib/ulke/ulke')
  D = await import('@/lib/ulke/demo')
  K = await import('./KurucuSayfasi')
})

const ayar = () => T.ulkeTicari(U.ulkePaketi().kod as string)
const ciz = (kalan: number | null) => renderToStaticMarkup(React.createElement(K.KurucuSayfasi, { acilis: a!, dil: U.ulkePaketi().varsayilanDil as DilKodu, kalan, gorsel: '/x.jpg' }))
const metin = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ')

describe('founding page', () => {
  it('a country without a founding offer: no page words, no /founding route, no demo button outside /demo', () => {
    if (ayar()?.kurucuSayfasi) return
    const r = U.ulkePaketi().rotalar
    assert.ok(r === 'hepsi' || !r.sayfalar.includes('/founding'))
    if (!ayar()?.demoDugmesi) assert.equal(D.demoIstegi(), null)
  })

  it('places left: the counter, the founding prices, the founding sign-up links (monthly and yearly), the demo button', () => {
    const t = ayar(); if (!t?.kurucuSayfasi || !a) return
    const m = t.kurucuSayfasi
    const html = ciz(5)
    const g = metin(html)
    assert.ok(g.includes(`5 of ${t.kurucu!.koltuk} founding places left`), 'counter')
    assert.ok(g.includes(t.fiyatlar!.kurucu!.month) && g.includes(t.fiyatlar!.kurucu!.year))
    assert.ok(html.includes('plan=sesli_pro_founding"'), 'monthly founding sign-up')
    assert.ok(html.includes('plan=sesli_pro_founding&amp;interval=year"'), 'yearly founding sign-up')
    assert.ok(g.includes(m.birinciDugme))
    const demo = D.demoIstegi()
    assert.ok(demo, 'the country carries a real booking link')
    assert.ok(html.includes(`href="${demo!.href}"`) && g.includes(m.ikinciDugme))
    assert.ok(!/<video|youtube|vimeo/i.test(html), 'no product video')
  })

  it('full: the regular price and the regular sign-up link, no founding link, the "taken" line', () => {
    const t = ayar(); if (!t?.kurucuSayfasi || !a) return
    const html = ciz(0)
    const g = metin(html)
    assert.ok(g.includes(t.fiyatlar!.normal.month) && g.includes(t.fiyatlar!.normal.year))
    assert.ok(!html.includes('sesli_pro_founding'))
    assert.ok(html.includes('plan=sesli_pro"'))
    assert.ok(g.includes(`All ${t.kurucu!.koltuk} founding places have been taken.`))
    assert.ok(!g.includes(t.kurucuSayfasi.karsilik.baslik), 'no "in return" section once the offer is closed')
  })

  it('unknown (Stripe not readable): the offer without a counter', () => {
    const t = ayar(); if (!t?.kurucuSayfasi || !a) return
    const html = ciz(null)
    assert.ok(!html.includes('data-alan="kurucu-sayac"'))
    assert.ok(html.includes('plan=sesli_pro_founding"'))
  })

  it('no real calendar: the demo button is hidden (never a button to "booking opens soon")', () => {
    const t = ayar(); if (!t?.kurucuSayfasi || !t.demo || !a) return
    const eski = t.demo.adres
    const y = t.demo as { adres: string }
    try {
      for (const kotu of ['', 'https://calendly.com/x', 'http://cal.com/x']) {
        y.adres = kotu
        assert.equal(D.demoIstegi(), null, kotu)
        assert.ok(!metin(ciz(5)).includes(t.kurucuSayfasi.ikinciDugme), kotu)
      }
    } finally { y.adres = eski }
    assert.ok(D.demoIstegi())
  })
})
