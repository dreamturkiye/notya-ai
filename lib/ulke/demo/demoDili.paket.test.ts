/**
 * NOTYA-DEMO-DIL-01 — every word of /demo is in the page's own language (Kaan, 2026-11-06: "each country's demo page
 * entirely in that country's own language"). Run once per country folder, for every form of the active pack. Names
 * no country.
 *
 * The page is rendered with the calendar link set and not set; its visible text, its aria-labels and titles, and its
 * <title> / meta description words are checked against the form's language:
 *   English (en-*)        no Turkish letters, no Cyrillic, no Turkish words of the Türkiye page
 *   Uzbek, Latin (uz-Latn) no Cyrillic, no Turkish letters (Uzbek Latin writes oʻ / gʻ, never ö ü ş ç ğ ı)
 *   Uzbek, Cyrillic; Russian  no Latin word except the brand names below
 * The language switch is exempt by design: each entry names its own form in its own language and carries that `lang`.
 *
 * What this cannot see: the Cal.com calendar inside the iframe. Its words follow the Cal.com event type's
 * "Interface language" setting (or, when that is empty, the visitor's browser) — see docs/OPEN-COMMITMENTS.md,
 * NOTYA-DEMO-DIL-01.
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
const ESKI = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL
const ayarla = (v: string | undefined) => {
  if (v === undefined) delete process.env.NEXT_PUBLIC_DEMO_BOOKING_URL
  else process.env.NEXT_PUBLIC_DEMO_BOOKING_URL = v
}

let D: typeof import('@/lib/ulke/demo')
let a: UlkeAcilisi | null
let ACIK = false
let FORMLAR: readonly DilKodu[] = []
let DemoSayfasi: typeof import('@/components/ulke/demo/DemoSayfasi').DemoSayfasi

before(async () => {
  D = await import('@/lib/ulke/demo')
  a = (await import('@/lib/ulke/arayuz')).acilis()
  DemoSayfasi = (await import('@/components/ulke/demo/DemoSayfasi')).DemoSayfasi
  ACIK = (await import('@/countries/active/demo')).AKTIF_DEMO !== null
  FORMLAR = a?.diller ?? []
})
afterEach(() => ayarla(ESKI))

const cozHtml = (s: string) =>
  s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

/** The words a visitor reads or hears on the page in form `d`: text, aria-labels and titles — minus the language switch. */
export function sayfaSozleri(html: string, d: DilKodu): string {
  const dilDisi = html.replace(/<a\b[^>]*\blang="([^"]+)"[^>]*>[\s\S]*?<\/a>/g, (tam, l: string) => (l === d ? tam : ' '))
  const nitelikler = [...dilDisi.matchAll(/\b(?:aria-label|title|alt|placeholder)="([^"]*)"/g)].map((m) => m[1])
  const metin = dilDisi.replace(/<link\b[^>]*>/g, ' ').replace(/<[^>]+>/g, ' ')
  return cozHtml([metin, ...nitelikler].join('\n')).replace(/\s+/g, ' ').trim()
}

/** Brand and provider names that stay as they are in every language. */
const MARKALAR = /\b(?:notya|Notya\w*|NOTYA|Cal\.com|Dr\.)/g
const TURKCE_HARF = /[çğışöüÇĞİŞÖÜ]/
const KIRIL = /[Ѐ-ӿ]/
const TURKCE_SOZ = /\b(?:planla|randevu|görüşme|gorusme|dakika|saat dilim|ücretsiz|giriş|kayıt|gizlilik|hekim|takvim)\w*/i

/** The first word of `metin` that is not in the language of form `d`, or null. */
export function yabanciSoz(metin: string, d: DilKodu): string | null {
  const m = metin.replace(MARKALAR, ' ')
  if (d.startsWith('en-')) {
    return m.match(TURKCE_HARF)?.[0] ?? m.match(KIRIL)?.[0] ?? m.match(TURKCE_SOZ)?.[0] ?? null
  }
  if (d === 'uz-Latn') return m.match(KIRIL)?.[0] ?? m.match(TURKCE_HARF)?.[0] ?? m.match(TURKCE_SOZ)?.[0] ?? null
  if (d === 'uz-Cyrl' || d === 'ru') return m.match(/[A-Za-z][A-Za-z'ʻ’-]*/)?.[0] ?? null
  return null
}

describe('NOTYA-DEMO-DIL-01 — /demo speaks only the language of its form', () => {
  it('the checker catches a stray word in each kind of form', () => {
    assert.equal(yabanciSoz('Book a demo with Dr. Gokhan Mamur', 'en-GB'), null)
    assert.ok(yabanciSoz('Book a demo — Demo planla', 'en-US'))
    assert.ok(yabanciSoz('Times in your görüşme', 'en-AU'))
    assert.ok(yabanciSoz('Demo uchrashuvga yozilish — Записаться', 'uz-Latn'))
    assert.ok(yabanciSoz('Записаться на демо — Book a demo', 'ru'))
    assert.equal(yabanciSoz('Запись проводится через Cal.com. Notya', 'ru'), null)
    assert.equal(
      sayfaSozleri('<a href="/x" lang="ru">Русский</a><a href="/y" lang="uz-Latn">Oʻzbekcha</a><p>Demo</p>', 'uz-Latn'),
      'Oʻzbekcha Demo',
    )
  })

  it('every form: page text, labels, <title> and description carry no word of another language (link set and not set)', () => {
    if (!ACIK) return
    for (const link of [undefined, 'https://cal.com/example/demo']) {
      ayarla(link)
      for (const d of FORMLAR) {
        const m = D.demoMetni(d)!
        const html = renderToStaticMarkup(h(DemoSayfasi, { acilis: a!, metin: m, dil: d }))
        const sozler = [sayfaSozleri(html, d), m.meta.baslik, m.meta.aciklama].join('\n')
        const yabanci = yabanciSoz(sozler, d)
        assert.equal(yabanci, null, `${d} (${link ? 'link set' : 'no link'}): "${yabanci}" is not ${d}`)
      }
    }
  })
})
