/**
 * The public medical catalogue: every switched-on tool and every empty slot is on the page,
 * with the beta line and the contact addresses. A key the pack does not have is not found.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { betaNotu } from './acikIcerik'
import { arayuz } from './arayuz'
import { bicimli } from './araclar/paket'
import { sizintiYok } from './testing/sizintiTarayici'
import { ulkePaketi } from './ulke'
import { YASAL_EPOSTA } from './yasal/eposta'

const icinde = (html: string, s: string) => html.includes(s) || html.includes(s.replaceAll("'", '&#x27;'))

describe('public medical catalogue', () => {
  it('lists the tools, the slots, the beta line and the contact addresses', async () => {
    const paket = ulkePaketi()
    if (paket.rotalar === 'hepsi' || !paket.ozellikler.araclar) return
    const Sayfa = (await import('../../app/medical/page.ulke')).default
    const dil = paket.varsayilanDil
    const html = renderToStaticMarkup(React.createElement(Sayfa, { searchParams: {} }))
    const icerik = arayuz().araclar
    assert.ok(icerik && icerik.araclar.length > 0)
    assert.ok(html.includes(betaNotu(dil)))
    for (const p of icerik!.araclar) {
      const ad = bicimli(p.metin.ad, dil)
      assert.ok(ad && icinde(html, ad), p.anahtar)
      assert.ok(html.includes(`arac=${encodeURIComponent(p.anahtar)}`) || html.includes(`arac=${p.anahtar}`), p.anahtar)
    }
    for (const y of icerik!.yuvalar) assert.ok(html.includes(`arac=${y.anahtar}`), y.anahtar)
    for (const adres of Object.values(YASAL_EPOSTA)) assert.ok(html.includes(adres), adres)
    sizintiYok(html, { hedefUlke: ulkePaketi().kod, kaynak: '/medical' })
    const bir = icerik!.araclar[0]
    const tek = renderToStaticMarkup(React.createElement(Sayfa, { searchParams: { arac: bir.anahtar } }))
    assert.ok(icinde(tek, bicimli(bir.metin.ad, dil)))
    assert.ok(tek.includes(betaNotu(dil)))
    const yuva = icerik!.yuvalar[0]
    if (yuva) {
      const bos = renderToStaticMarkup(React.createElement(Sayfa, { searchParams: { arac: yuva.anahtar } }))
      assert.ok(bos.includes(betaNotu(dil)))
      assert.ok(bos.includes(`data-yuva="${yuva.anahtar}"`))
    }
    assert.throws(() => renderToStaticMarkup(React.createElement(Sayfa, { searchParams: { arac: 'no-such-tool' } })))
  })
})
