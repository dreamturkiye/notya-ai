/**
 * NOTYA-ULKE-DEMO-01 — "Book a demo", for whichever pack is active (run once per country folder). Names no country.
 *
 *   A. the pack     words for every form of the landing page; /demo listed; the words make no claim and name no address
 *   B. no link      /demo says booking opens soon, embeds nothing; the landing page still shows the button to /demo
 *   C. link set     /demo holds the calendar; the landing page's bar and hero link to /demo in the visitor's form
 *   D. bad link     anything but a Cal.com address leaves /demo on the soon text; the landing button still shows
 * A pack that brings no demo words (Türkiye: its page is the pre-split application's own) has no page and no button.
 */
import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { DilKodu } from '@/lib/ulke/tipler'
import type { UlkeAcilisi } from '@/lib/ulke/arayuz/acilisTipleri'

;(require as unknown as { extensions: Record<string, (m: { exports: unknown }) => void> }).extensions['.css'] = (m) => { m.exports = {} }

const h = React.createElement
const GORSELLER = { xona: '/x.jpg', stol: '/s.jpg', yolak: '/y.jpg' }
const ESKI = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL
const ayarla = (v: string | undefined) => {
  if (v === undefined) delete process.env.NEXT_PUBLIC_DEMO_BOOKING_URL
  else process.env.NEXT_PUBLIC_DEMO_BOOKING_URL = v
}
const govde = (html: string) => (html.split('<main>')[1] ?? '').split('</main>')[0].replace(/<[^>]+>/g, ' ')
const kacisli = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

let D: typeof import('@/lib/ulke/demo')
let U: typeof import('@/lib/ulke/ulke')
let a: UlkeAcilisi | null
let ACIK = false
let FORMLAR: readonly DilKodu[] = []
let DemoSayfasi: typeof import('@/components/ulke/demo/DemoSayfasi').DemoSayfasi
let AcilisSayfasi: typeof import('@/components/ulke/acilis/AcilisSayfasi').AcilisSayfasi

before(async () => {
  D = await import('@/lib/ulke/demo')
  U = await import('@/lib/ulke/ulke')
  a = (await import('@/lib/ulke/arayuz')).acilis()
  DemoSayfasi = (await import('@/components/ulke/demo/DemoSayfasi')).DemoSayfasi
  AcilisSayfasi = (await import('@/components/ulke/acilis/AcilisSayfasi')).AcilisSayfasi
  ACIK = (await import('@/countries/active/demo')).AKTIF_DEMO !== null
  FORMLAR = a?.diller ?? []
})
afterEach(() => ayarla(ESKI))

const demoCiz = (d: DilKodu) => renderToStaticMarkup(h(DemoSayfasi, { acilis: a!, metin: D.demoMetni(d)!, dil: d }))
const acilisCiz = (d: DilKodu) => renderToStaticMarkup(h(AcilisSayfasi, { dil: U.dilSec(d), istenenDil: d, iletisimEposta: null, gorseller: GORSELLER, acilis: a! }))

describe('A. the pack', () => {
  it('a pack without demo words has no page and no button', () => {
    if (ACIK) return
    ayarla('https://cal.com/example')
    assert.equal(D.demoSayfasiVar(), false)
    for (const d of FORMLAR) assert.equal(D.demoDugmesi(d), null)
  })

  it('words for every form of the landing page; /demo is a route of the pack; the landing page is on', () => {
    if (!ACIK) return
    assert.ok(a, 'a pack with demo words has a landing page')
    assert.ok(FORMLAR.length > 0)
    for (const d of FORMLAR) assert.ok(D.demoMetni(d), `no demo words for "${d}"`)
    assert.equal(D.demoSayfasiVar(), true)
  })

  it('each form: a 60-minute video call with Dr. Gökhan Mamur, in the visitor\'s own time zone; booking by Cal.com; no claim, no address', () => {
    if (!ACIK) return
    for (const d of FORMLAR) {
      const m = D.demoMetni(d)!
      assert.match(m.giris, /\b60\b/, d)
      assert.match(m.giris, /Mamur|Мамур/, d)
      assert.match(m.saglayici, /Cal\.com/, d)
      const duzlestir = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(duzlestir) : v && typeof v === 'object' ? Object.values(v).flatMap(duzlestir) : [])
      const hepsi = duzlestir(m).join('\n')
      assert.doesNotMatch(hepsi, /@|mailto:|https?:\/\//, `${d}: no address of any kind`)
      assert.doesNotMatch(hepsi, /complian|certif|HIPAA|GDPR|integrat|интеграц|guarant|гарант|kafolat|\$|£|€|%|price|narx|нарх|цен|so'm|soʻm|сум|сўм/i, `${d}: no claim, no price`)
    }
  })
})

const acilisDugmesi = (d: DilKodu) => {
  const l = acilisCiz(d)
  const href = `href="${kacisli(D.demoAdresi(d))}"`
  assert.equal(l.split(href).length - 1, 3, `${d}: one button in the bar, one in the hero, one in the demo section`)
  assert.equal(l.split('bg-[#1e3a8a]').length - 1, 3, `${d}: the demo button uses the contrasting fill`)
  assert.ok(D.demoAdresi(d).startsWith(U.ulkePaketi().yolOnEki ?? '/'), `${d}: under the build's path prefix`)
  assert.ok(l.includes('id="demo"'), `${d}: the landing page has the demo section`)
  const m = D.demoMetni(d)!
  assert.ok(l.includes(kacisli(m.bolum.baslik)), `${d}: the demo section's heading`)
  assert.ok(l.includes(kacisli(m.bolum.govde)), `${d}: the demo section's body`)
  for (const row of m.bolum.satirlar) assert.ok(l.includes(kacisli(row.k)), `${d}: the demo section's card row "${row.k}"`)
  assert.deepEqual(D.demoDugmesi(d), { href: D.demoAdresi(d), etiket: m.dugme })
}

describe('B. no link', () => {
  it('/demo says booking opens soon, embeds nothing; the landing page still links to it', () => {
    if (!ACIK) return
    for (const v of [undefined, '', '   ']) {
      ayarla(v)
      for (const d of FORMLAR) {
        const m = D.demoMetni(d)!
        const s = demoCiz(d)
        assert.ok(s.includes(`>${kacisli(m.baslik)}</h1>`), d)
        assert.ok(s.includes(kacisli(m.giris)), d)
        assert.ok(s.includes(kacisli(m.yakinda)), d)
        assert.ok(s.includes(kacisli(m.saglayici)), d)
        assert.ok(!s.includes(`aria-label="${kacisli(m.takvimEtiketi)}"`), d)
        assert.doesNotMatch(govde(s), /@/, `${d}: no e-mail address`)
        acilisDugmesi(d)
      }
    }
  })
})

describe('C. link set', () => {
  it('/demo holds the calendar; the bar, the hero and the demo section of the landing page link to /demo in the same form', () => {
    if (!ACIK) return
    ayarla('https://cal.com/example')
    for (const d of FORMLAR) {
      const m = D.demoMetni(d)!
      const s = demoCiz(d)
      assert.ok(s.includes(`aria-label="${kacisli(m.takvimEtiketi)}"`), d)
      assert.ok(!s.includes(kacisli(m.yakinda)), d)
      assert.ok(s.includes(kacisli(m.saglayici)), d)
      acilisDugmesi(d)
    }
  })
})

describe('D. bad link', () => {
  it('anything but https://cal.com/… or https://app.cal.com/… counts as no link', () => {
    if (!ACIK) return
    for (const v of ['http://cal.com/x', 'https://calendly.com/x', 'https://cal.com', 'https://evil.com/cal.com/x', 'cal.com/x']) {
      ayarla(v)
      for (const d of FORMLAR) {
        assert.ok(demoCiz(d).includes(kacisli(D.demoMetni(d)!.yakinda)), v)
        acilisDugmesi(d)
      }
    }
  })
})
