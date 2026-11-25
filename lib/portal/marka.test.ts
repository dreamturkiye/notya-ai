/**
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25) — "it should be brought to you by the doctor, not brought to you by the Notya
 * company." Pins: brand resolution order (logo → photo → monogram; Notya Klinik clinic first), names / short names,
 * accent contrast, safe image URLs, the doctor-named push, no "Notya" in the portal header or the PIN screen on any of the
 * 30 medical branches + 10 Özel Branşlar, and the footer (KVKK text intact + the small "Notya altyapısıyla" line).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  BILINMEYEN_MARKA, BOLUM_ADI, NOTYA_ALTYAPI, VURGU_SECENEKLERI, guvenliGorselUrl, hekimKisaAdi, markaBildirimBasligi,
  markaCoz, markaKisaEtiket, markaliPushIcerigi, markaMonogrami, markaSekmeBasligi, type MarkaGirdisi,
} from './marka'
import { demoMarka } from './demoMarka'
import { PortalShell } from '../../app/portal/_components/PortalShell'
import { PinGate } from '../../app/portal/_components/PinGate'
import { SPECIALTIES } from '../doktor/specialties'
import { KLINIK_YENI_SLUGS } from '../specialties/klinikDikey'
import { bransEtiketi } from '../doktor/bransAdlari'

;(globalThis as { React?: typeof React }).React = React

const LOGO = 'https://x.supabase.co/storage/v1/object/public/hasta-alani-marka/d/logo-0123456789abcdef.png'
const FOTO = '/api/portal/hasta/TOKEN/marka/gorsel?v=abc123'
const TEMEL: MarkaGirdisi = { hekimAdi: 'Uzm. Dr. Kaan Arıoğlu', brans: 'Çocuk Sağlığı ve Hastalıkları', klinikAdi: 'Arıoğlu Çocuk Kliniği' }

/** The <header> … </header> part of the shell's markup. */
const baslikHtml = (html: string) => html.slice(html.indexOf('<header'), html.indexOf('</header>'))

describe('brand resolution order: logo → photo → monogram', () => {
  it('logo wins over photo', () => {
    const m = markaCoz({ ...TEMEL, logoUrl: LOGO, fotoUrl: FOTO })
    assert.deepEqual(m.gorsel, { tur: 'logo', url: LOGO })
  })
  it('photo when there is no logo', () => {
    assert.deepEqual(markaCoz({ ...TEMEL, fotoUrl: FOTO }).gorsel, { tur: 'foto', url: FOTO })
  })
  it('the doctor can switch the photo off → monogram', () => {
    const m = markaCoz({ ...TEMEL, fotoUrl: FOTO, fotoGoster: false })
    assert.equal(m.gorsel, null)
    assert.equal(m.monogram, 'KA')
  })
  it('nothing uploaded → monogram, name with title, branş · clinic', () => {
    const m = markaCoz(TEMEL)
    assert.equal(m.gorsel, null)
    assert.equal(m.ad, 'Uzm. Dr. Kaan Arıoğlu')
    assert.equal(m.altSatir, 'Çocuk Sağlığı ve Hastalıkları · Arıoğlu Çocuk Kliniği')
    assert.equal(m.kisaAd, 'Dr. Arıoğlu')
    assert.equal(m.klinik, false)
  })
  it('display-name override leads and the clinic is not repeated when the name already carries it', () => {
    const m = markaCoz({ ...TEMEL, gorunenAd: 'Dr. Kaan Arıoğlu Arıoğlu Çocuk Kliniği' })
    assert.equal(m.ad, 'Dr. Kaan Arıoğlu Arıoğlu Çocuk Kliniği')
    assert.equal(m.altSatir, 'Çocuk Sağlığı ve Hastalıkları')
    assert.equal(m.kisaAd, 'Dr. Kaan Arıoğlu Arıoğlu Çocuk Kliniği')
  })
  it('Notya Klinik: clinic name + clinic logo first, the treating doctor underneath', () => {
    const m = markaCoz({ ...TEMEL, logoUrl: 'https://x/own.png', fotoUrl: FOTO, notyaKlinik: { ad: 'Kalamış Sağlık Merkezi', logoUrl: LOGO } })
    assert.equal(m.ad, 'Kalamış Sağlık Merkezi')
    assert.equal(m.altSatir, 'Uzm. Dr. Kaan Arıoğlu · Çocuk Sağlığı ve Hastalıkları')
    assert.deepEqual(m.gorsel, { tur: 'logo', url: LOGO })
    assert.equal(m.klinik, true)
    assert.equal(m.monogram, 'KS')
  })
  it('Notya Klinik without a clinic logo → the doctor\'s own logo, then photo', () => {
    assert.equal(markaCoz({ ...TEMEL, fotoUrl: FOTO, notyaKlinik: { ad: 'Kalamış' } }).gorsel?.tur, 'foto')
  })
  it('unknown doctor → neutral words, never Notya', () => {
    const m = markaCoz({ hekimAdi: null })
    assert.equal(m.ad, 'Doktorunuz')
    assert.doesNotMatch(JSON.stringify(m) + JSON.stringify(BILINMEYEN_MARKA), /Notya/)
  })
})

describe('names, monogram, titles', () => {
  it('Turkish casing and titles never become initials', () => {
    assert.equal(markaMonogrami('Prof. Dr. ismail Şahin'), 'İŞ')
    assert.equal(markaMonogrami('Op. Dr. Ülkü Çelik'), 'ÜÇ')
    assert.equal(markaMonogrami('Dyt. Gökçe'), 'GÖ')
    assert.equal(markaMonogrami('Moda ve Dahiliye'), 'MD')
    assert.equal(markaMonogrami(''), 'DR')
  })
  it('short name is the courteous "Dr. Soyad"', () => {
    assert.equal(hekimKisaAdi('Doç. Dr. Ayşe Nur Kaya'), 'Dr. Kaya')
    assert.equal(hekimKisaAdi(''), 'Doktorunuz')
  })
  it('tab / PWA names carry the doctor, Sağlığım second', () => {
    const m = markaCoz(TEMEL)
    assert.equal(markaSekmeBasligi(m), `Dr. Arıoğlu · ${BOLUM_ADI}`)
    assert.equal(markaKisaEtiket(m), 'Dr. Arıoğlu')
    assert.equal(markaKisaEtiket(markaCoz({ ...TEMEL, gorunenAd: 'Dr. Kaan Arıoğlu Çocuk Kliniği' })), 'Dr. Kaan Arıoğlu')
    assert.equal(markaSekmeBasligi(BILINMEYEN_MARKA), BOLUM_ADI)
  })
})

describe('accent list keeps text readable', () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const oran = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  for (const [k, v] of Object.entries(VURGU_SECENEKLERI)) {
    it(`${k}: white initials ≥ 7:1, accent text on cream ≥ 4.5:1`, () => {
      assert.ok(oran('#ffffff', v.koyu) >= 7, `${k} white ${oran('#ffffff', v.koyu).toFixed(2)}`)
      assert.ok(oran(v.koyu, '#f4eee3') >= 4.5, `${k} on cream ${oran(v.koyu, '#f4eee3').toFixed(2)}`)
    })
  }
  it('an unknown accent falls back to the default', () => {
    assert.equal(markaCoz({ ...TEMEL, vurgu: 'neon' }).vurgu, 'petrol')
  })
})

describe('only safe image URLs reach a patient\'s device', () => {
  it('https, same-origin demo images, the token photo route; nothing else', () => {
    assert.equal(guvenliGorselUrl(LOGO), LOGO)
    assert.equal(guvenliGorselUrl('/portal/demo-marka/moda-dahiliye.png'), '/portal/demo-marka/moda-dahiliye.png')
    assert.equal(guvenliGorselUrl(FOTO), FOTO)
    for (const kotu of ['http://x/logo.png', 'javascript:alert(1)', '//evil.example/x.png', 'data:image/svg+xml;base64,PHN2Zz4=', '/portal/x.svg', 'ftp://x/y.png']) {
      assert.equal(guvenliGorselUrl(kotu), null, kotu)
    }
    assert.equal(markaCoz({ ...TEMEL, logoUrl: 'http://tracker.example/l.png' }).gorsel, null)
  })
})

describe('push: the doctor is the sender, still no clinical word', () => {
  it('title = short brand name; the reminder subject moves into the body', () => {
    const p = markaliPushIcerigi({ baslik: 'İlaç saati · 08:00', govde: 'Bir ilacınız işaretlenmeyi bekliyor.', yol: '', etiket: 'e' }, 'Dr. Arıoğlu')
    assert.equal(p.baslik, 'Dr. Arıoğlu')
    assert.equal(p.govde, 'İlaç saati · 08:00 — Bir ilacınız işaretlenmeyi bekliyor.')
    assert.equal(markaliPushIcerigi({ baslik: BOLUM_ADI, govde: 'x', yol: '', etiket: 'e' }, 'Dr. Arıoğlu').govde, 'x')
    assert.equal(markaliPushIcerigi({ baslik: 'A', govde: 'x', yol: '', etiket: 'e' }, null).baslik, 'A')
    assert.equal(markaBildirimBasligi(''), BOLUM_ADI)
  })
})

describe('portal header, PIN screen and footer — all 30 branches + 10 Özel Branşlar', () => {
  const branslar = [...SPECIALTIES.map((s) => s.key), ...KLINIK_YENI_SLUGS]
  it('the list really is 40', () => assert.equal(new Set(branslar).size, 40))
  for (const b of branslar) {
    it(`${b}: doctor in the header, no "Notya" in it; footer keeps KVKK + "Notya altyapısıyla"`, () => {
      for (const marka of [markaCoz({ ...TEMEL, brans: bransEtiketi(b) }), markaCoz({ ...TEMEL, brans: bransEtiketi(b), logoUrl: LOGO }), markaCoz({ ...TEMEL, brans: bransEtiketi(b), notyaKlinik: { ad: 'Kalamış Sağlık Merkezi' } })]) {
        const html = renderToStaticMarkup(createElement(PortalShell, { basePath: '/portal/hasta/T', hastaAdi: 'Ayşe Yılmaz', marka, children: createElement('p', null, 'icerik') }))
        const bas = baslikHtml(html)
        assert.match(bas, /data-testid="portal-hekim-marka"/)
        assert.ok(bas.includes(marka.ad.replace(/&/g, '&amp;')), 'doctor / clinic name in the header')
        assert.ok(bas.includes(BOLUM_ADI))
        assert.doesNotMatch(bas, /Notya/, 'no Notya in the header')
        assert.match(bas, /data-testid="portal-header-hasta-adi"/)
        const alt = html.slice(html.indexOf('<footer'))
        assert.ok(alt.includes(NOTYA_ALTYAPI))
        assert.match(alt, /6698 sayılı KVKK/)
        assert.match(alt, /href="\/kvkk"/)
        assert.match(alt, /href="\/gizlilik"/)
        assert.match(alt, /veri sorumlusu doktorunuz/)
        assert.match(alt, /112/)
      }
      const pin = renderToStaticMarkup(createElement(PinGate, { token: 'T', onUnlocked: () => undefined, marka: markaCoz({ ...TEMEL, brans: bransEtiketi(b) }) }))
      assert.ok(pin.includes('Uzm. Dr. Kaan Arıoğlu'))
      assert.equal((pin.match(/Notya/g) || []).length, 1, 'the PIN screen names Notya once — in the footer line')
      assert.ok(pin.includes(NOTYA_ALTYAPI))
    })
  }
  it('no brand passed → neutral header, still no Notya', () => {
    const html = renderToStaticMarkup(createElement(PortalShell, { basePath: '/p', children: null }))
    assert.doesNotMatch(baslikHtml(html), /Notya/)
  })
  it('demo variants (logo / foto / monogram / klinik) resolve to their own mark', () => {
    assert.equal(demoMarka('logo').gorsel?.tur, 'logo')
    assert.equal(demoMarka('foto').gorsel?.tur, 'foto')
    assert.equal(demoMarka('monogram').gorsel, null)
    assert.equal(demoMarka('klinik').klinik, true)
  })
})
