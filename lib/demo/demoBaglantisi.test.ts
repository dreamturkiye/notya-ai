/**
 * NOTYA-DEMO-01 — "Demo planla": only a Cal.com link switches it on; both states rendered with react-dom/server.
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { demoBaglantisiCoz, demoCspGenislet, demoYoluMu } from './demoBaglantisi'
import { Hero } from '../../components/doktor-landing/hero'
import { SiteNav } from '../../components/doktor-landing/site-nav'
import DemoPage from '../../app/demo/page'

// The landing components use the automatic JSX runtime under Next; tsx compiles them with the classic one.
;(globalThis as { React?: typeof React }).React = React

const ESKI = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL
afterEach(() => {
  if (ESKI === undefined) delete process.env.NEXT_PUBLIC_DEMO_BOOKING_URL
  else process.env.NEXT_PUBLIC_DEMO_BOOKING_URL = ESKI
})

describe('demoBaglantisiCoz', () => {
  it('accepts https://cal.com/… and https://app.cal.com/…', () => {
    assert.deepEqual(demoBaglantisiCoz('https://cal.com/notya/demo'), {
      url: 'https://cal.com/notya/demo',
      origin: 'https://cal.com',
      calLink: 'notya/demo',
    })
    assert.deepEqual(demoBaglantisiCoz('  https://app.cal.com/gokhan/60min/  '), {
      url: 'https://app.cal.com/gokhan/60min',
      origin: 'https://app.cal.com',
      calLink: 'gokhan/60min',
    })
    assert.equal(demoBaglantisiCoz('https://cal.com/example')?.calLink, 'example')
    assert.equal(demoBaglantisiCoz('https://cal.com/notya/demo?month=2026-11')?.calLink, 'notya/demo')
  })

  it('treats anything else as empty', () => {
    for (const ham of [
      undefined,
      null,
      '',
      '   ',
      'cal.com/notya',
      'http://cal.com/notya',
      'https://cal.com',
      'https://cal.com/',
      'https://calendly.com/notya',
      'https://evil.com/cal.com/notya',
      'https://cal.com.evil.com/notya',
      'https://notcal.com/notya',
      'https://eu.cal.com/notya',
      'https://user:pw@cal.com/notya',
      'https://cal.com:8443/notya',
      'https://cal.com/notya"><script>',
      'https://cal.com/no%20ya',
      'javascript:alert(1)',
    ]) {
      assert.equal(demoBaglantisiCoz(ham as string), null, String(ham))
    }
  })
})

describe('demo CSP', () => {
  const CSP =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; frame-src 'self' blob:; script-src-elem 'self' blob:; connect-src 'self'"

  it('adds Cal.com to script, script-elem, frame and font directives only', () => {
    const g = demoCspGenislet(CSP)
    assert.match(g, /script-src 'self' 'unsafe-inline' https:\/\/app\.cal\.com https:\/\/cal\.com/)
    assert.match(g, /script-src-elem 'self' blob: https:\/\/app\.cal\.com https:\/\/cal\.com/)
    assert.match(g, /frame-src 'self' blob: https:\/\/app\.cal\.com https:\/\/cal\.com/)
    assert.match(g, /font-src 'self' https:\/\/fonts\.gstatic\.com https:\/\/app\.cal\.com https:\/\/cal\.com/)
    assert.match(g, /default-src 'self'; /)
    assert.match(g, /connect-src 'self'(;|$)/)
  })

  it('adds a missing frame-src as self + Cal.com', () => {
    const g = demoCspGenislet("default-src 'self'; script-src 'self'")
    assert.match(g, /frame-src 'self' https:\/\/app\.cal\.com https:\/\/cal\.com/)
    assert.doesNotMatch(g, /script-src-elem/)
  })

  it('applies to /demo only', () => {
    assert.equal(demoYoluMu('/demo'), true)
    assert.equal(demoYoluMu('/demo/'), true)
    for (const p of ['/', '/doktor', '/demox', '/dashboard/doktor', '/api/demo']) assert.equal(demoYoluMu(p), false, p)
  })
})

describe('landing + /demo, both states', () => {
  it('link NOT set: no "Demo planla" button in header or hero; page says booking opens soon, embeds nothing', () => {
    delete process.env.NEXT_PUBLIC_DEMO_BOOKING_URL
    assert.doesNotMatch(renderToStaticMarkup(createElement(Hero)), /Demo planla|href="\/demo"/)
    assert.doesNotMatch(renderToStaticMarkup(createElement(SiteNav)), /Demo planla|href="\/demo"/)
    const s = renderToStaticMarkup(createElement(DemoPage))
    assert.match(s, /<h1[^>]*>Demo planla<\/h1>/)
    assert.match(s, /Dr\. Gökhan Mamur ile 60 dakikalık bir görüntülü görüşme/)
    assert.match(s, /kendi saat diliminizde/)
    assert.match(s, /Demo randevuları çok yakında açılıyor\./)
    assert.match(s, /Randevu işlemleri Cal\.com üzerinden yürütülür\./)
    assert.doesNotMatch(s, /aria-label="Demo randevu takvimi"/)
    assert.doesNotMatch(s, /@|mailto:/, 'no e-mail address')
    assert.doesNotMatch(s, /href="\/demo"/, 'no button to itself')
  })

  it('link not a Cal.com address: same as not set', () => {
    process.env.NEXT_PUBLIC_DEMO_BOOKING_URL = 'https://calendly.com/notya/demo'
    assert.doesNotMatch(renderToStaticMarkup(createElement(Hero)), /Demo planla/)
    assert.match(renderToStaticMarkup(createElement(DemoPage)), /çok yakında açılıyor/)
  })

  it('link set: header + hero buttons point to /demo; page holds the calendar', () => {
    process.env.NEXT_PUBLIC_DEMO_BOOKING_URL = 'https://cal.com/example'
    assert.match(renderToStaticMarkup(createElement(Hero)), /href="\/demo"[^>]*>Demo planla/)
    assert.match(renderToStaticMarkup(createElement(SiteNav)), /href="\/demo"[^>]*>Demo planla/)
    const s = renderToStaticMarkup(createElement(DemoPage))
    assert.match(s, /aria-label="Demo randevu takvimi"/)
    assert.doesNotMatch(s, /çok yakında açılıyor/)
    assert.match(s, /Randevu işlemleri Cal\.com üzerinden yürütülür\./)
    // the nav on /demo sends section links back to the landing
    assert.match(s, /href="\/doktor#fiyat"/)
  })

  it('/demo copy makes no compliance, certification, integration, price or result claims', () => {
    process.env.NEXT_PUBLIC_DEMO_BOOKING_URL = 'https://cal.com/example'
    const main = renderToStaticMarkup(createElement(DemoPage)).split('<main>')[1].split('</main>')[0].replace(/<[^>]+>/g, ' ')
    assert.doesNotMatch(main, /KVKK|uyumlu|sertifika|onaylı|entegrasyon|₺|fiyat|garanti|%/i)
  })
})
