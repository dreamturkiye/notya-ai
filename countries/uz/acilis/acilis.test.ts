/**
 * NOTYA-ULKE-01 — the Uzbekistan landing page, rendered for real (react-dom/server) in both languages.
 *
 *   1. Leak test: nothing of Türkiye in what the page shows — terms, reference names, letters (the harness).
 *   2. Uzbekistan's own rules for this page: no price, no demo, no integration claim, no voice profile, no image
 *      evaluation, the assistant unnamed.
 *   3. It links only to itself, /login and /signup, all under the build's path prefix (/uzbek) — never to a Turkish
 *      page — and the switch to Russian is there.
 *   4. Both languages carry the same sections; the copy file documents every line that is on the page.
 */
// First import: fixes the country of this process before the page (and through it the active pack) is loaded.
import '@/lib/ulke/testing/uzDerlemesi'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AcilisSayfasi } from './AcilisSayfasi'
import { ACILIS_ICERIGI, acilisIcerigi } from './icerik'
import { mailtoBaglantisi } from './IletisimFormu'
import { UZ_YASAKLI_IFADELER } from './yasakliIfadeler'
import { UZ_PAKETI } from '../index'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { DilKodu } from '@/lib/ulke/tipler'

const KOK = resolve(__dirname, '../../..')
const DILLER = Object.keys(ACILIS_ICERIGI) as (keyof typeof ACILIS_ICERIGI)[]
const ciz = (dil: DilKodu, iletisimEposta: string | null = 'pilot@example.com') =>
  renderToStaticMarkup(React.createElement(AcilisSayfasi, { dil, iletisimEposta }))
const dizeler = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(dizeler) : [])

describe('Uzbekistan landing page', () => {
  it('ships in every switched-on language of the pack, Uzbek (Latin) first', () => {
    assert.deepEqual(DILLER, [...UZ_PAKETI.acikDiller])
    assert.equal(DILLER[0], UZ_PAKETI.varsayilanDil)
    assert.throws(() => acilisIcerigi('tr'), /No fallback/)
    assert.throws(() => acilisIcerigi('uz-Cyrl'), /No fallback/)
  })

  for (const dil of DILLER) {
    it(`${dil}: nothing of Türkiye in the rendered page (terms, reference names, letters)`, () => {
      for (const adres of ['pilot@example.com', null]) {
        const html = ciz(dil, adres)
        assert.ok(html.length > 8000, 'the page did not render')
        assert.deepEqual(sizintiTara(html, { hedefUlke: 'uz', kaynak: `landing ${dil}` }), [])
        assert.deepEqual(sizintiTara(gorunurMetin(html), { hedefUlke: 'uz', kaynak: `landing ${dil} (visible text)` }), [])
      }
    })

    it(`${dil}: no price, no demo, no integration claim, no voice profile, no image evaluation, no name for the assistant`, () => {
      const metin = gorunurMetin(ciz(dil))
      for (const y of UZ_YASAKLI_IFADELER) assert.doesNotMatch(metin, y.desen, y.neden)
      // The one number allowed on the page is the phone example in the request form and the year in the footer.
      const sayilar = (metin.replace(ACILIS_ICERIGI[dil].fiyat.form.telefonOrnek, '').match(/\d{3,}/g) || []).filter((s) => s !== String(new Date().getFullYear()))
      assert.deepEqual(sayilar, [], 'unexpected numbers on the page')
    })

    it(`${dil}: links only to itself, /login and /signup; the language switch is visible`, () => {
      const html = ciz(dil)
      const hrefler = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))
      assert.ok(hrefler.length > 12)
      const ek = dil === 'uz-Latn' ? '' : `\\?dil=${dil}`
      // NOTYA-UZ-MUAYENE-01: the build is served under /uzbek; a link to '/login' would land on Türkiye's site.
      const izinli = new RegExp(`^(#[a-z]+|/uzbek(\\?dil=(uz-Latn|ru))?(#top)?|/uzbek${ek}(#top)?|/uzbek/login(${ek})?|/uzbek/signup(${ek})?)$`)
      for (const h of hrefler) assert.match(h, izinli, `link to ${h}`)
      assert.ok(hrefler.includes(dil === 'uz-Latn' ? '/uzbek/login' : `/uzbek/login?dil=${dil}`))
      assert.ok(hrefler.includes(dil === 'uz-Latn' ? '/uzbek/signup' : `/uzbek/signup?dil=${dil}`))
      // The switch: both languages named in their own words, the other one a real link.
      assert.match(html, /hrefLang="ru"[^>]*>[\s\S]*?Русский/)
      assert.match(html, /hrefLang="uz-Latn"[^>]*>[\s\S]*?Oʻzbekcha/)
      assert.ok(hrefler.includes('/uzbek?dil=ru') && hrefler.includes('/uzbek'))
      assert.match(html, new RegExp(`<div class="uzl" lang="${dil}"`))
      assert.doesNotMatch(html, /<img\b|<script\b|\/landing\/|\/doktor|\/klinik|\/giris|\/kayit|\/kvkk|notya\.(io|ai)/)
    })

    it(`${dil}: the request form appears only when the deployment has an address for it`, () => {
      assert.match(ciz(dil, 'pilot@example.com'), /<form class="uzl-kart uzl-form"/)
      const yok = ciz(dil, null)
      assert.doesNotMatch(yok, /<form\b/)
      assert.ok(yok.includes(ACILIS_ICERIGI[dil].fiyat.formYok))
      // The address itself is never printed on the page.
      assert.doesNotMatch(ciz(dil, 'pilot@example.com'), /pilot@example\.com/)
    })
  }

  it('both languages have the same sections, in the same order, and no empty line', () => {
    const [uz, ru] = [ACILIS_ICERIGI['uz-Latn'], ACILIS_ICERIGI.ru]
    assert.deepEqual(ru.bolumler.map((b) => [b.id, b.no, b.maddeler.length, b.kart.satirlar.length]), uz.bolumler.map((b) => [b.id, b.no, b.maddeler.length, b.kart.satirlar.length]))
    assert.deepEqual(uz.bolumler.map((b) => b.id), ['qabul', 'jadval', 'bemor', 'maslahat', 'yordamchi', 'klinika'])
    assert.equal(uz.kahraman.serit.length, ru.kahraman.serit.length)
    for (const dil of DILLER) {
      const hepsi = dizeler(ACILIS_ICERIGI[dil])
      assert.ok(hepsi.length > 90)
      for (const d of hepsi) assert.ok(d.trim().length > 0, `${dil}: empty line`)
    }
    // Uzbek is written with U+02BB, never with a plain apostrophe or a typographic quote in its place.
    for (const d of dizeler(uz)) assert.doesNotMatch(d, /[oOgG]['‘’`]/, d)
    // Russian text is Russian: no Uzbek-Latin sentence left behind (the brand and the phone example aside).
    for (const d of dizeler(ru)) {
      if (d === ru.altBilgi.haklar || d === ru.fiyat.form.telefonOrnek || /^[a-z]+$/.test(d) || /^\d+$/.test(d)) continue
      assert.match(d, /[а-яё]/i, `Russian line without Cyrillic: ${d}`)
    }
  })

  it('"request a price" builds a message for the visitor own mail app; nothing goes to a server', () => {
    const m = ACILIS_ICERIGI['uz-Latn'].fiyat.form
    const link = mailtoBaglantisi('pilot@example.com', m, { adSoyad: 'QA Sinov', kurum: 'QA Klinika', telefon: '+998 90 123 45 67', uzmanlik: 'Pediatriya', mesaj: '' })
    assert.ok(link.startsWith('mailto:pilot@example.com?subject='))
    const govde = decodeURIComponent(link.split('&body=')[1])
    assert.equal(govde, 'Ism va familiya: QA Sinov\nKlinika yoki amaliyot: QA Klinika\nTelefon: +998 90 123 45 67\nYoʻnalish: Pediatriya')
    const kaynak = readFileSync(join(KOK, 'countries/uz/acilis/IletisimFormu.tsx'), 'utf8')
    assert.doesNotMatch(kaynak, /\bfetch\(|XMLHttpRequest|sendBeacon|action=/)
  })

  it('the copy file documents the page: every Uzbek and Russian line on the page is in docs/uz-landing/COPY.md', () => {
    const kopya = readFileSync(join(KOK, 'docs/uz-landing/COPY.md'), 'utf8').replace(/ /g, ' ')
    assert.match(kopya, /machine-written/i)
    assert.match(kopya, /native speaker/i)
    for (const dil of DILLER) {
      const t = ACILIS_ICERIGI[dil]
      const sayfada = [
        t.kahraman.ustBaslik, t.kahraman.baslik, t.kahraman.baslikVurgu, t.kahraman.giris, ...t.kahraman.serit,
        ...t.bolumler.flatMap((b) => [b.ustBaslik, b.baslik, b.baslikVurgu, b.govde, ...b.maddeler]),
        t.guvence, t.fiyat.baslik, t.fiyat.baslikVurgu, t.fiyat.govde, t.altBilgi.tanim,
      ]
      for (const satir of sayfada) assert.ok(kopya.includes(satir.replace(/ /g, ' ')), `${dil}: not in COPY.md → ${satir}`)
    }
    for (const y of UZ_YASAKLI_IFADELER) {
      // The rules are stated in the file in English; its Uzbek and Russian lines must still obey them.
      const satirlar = kopya.split('\n').filter((s) => /^\|/.test(s)).map((s) => s.split('|').slice(1, 3).join(' '))
      for (const s of satirlar) assert.doesNotMatch(s, y.desen, `${y.neden}: ${s.slice(0, 80)}`)
    }
  })
})
