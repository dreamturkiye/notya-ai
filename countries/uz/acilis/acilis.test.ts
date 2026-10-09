/**
 * NOTYA-UZ-ACILIS-02 — the Uzbekistan landing page, rendered for real (react-dom/server) in all three forms
 * (Uzbek Latin, Uzbek Cyrillic, Russian).
 *
 *   1. Leak test: nothing of Türkiye — in the rendered page AND in every string of the catalogue, shown at first
 *      paint or not (the typed visits, the menu, the form's messages are not in the first HTML).
 *   2. Uzbekistan's own rules for this page: no price, no trial, no demo, no integration claim, no named law, no voice
 *      profile, no image evaluation, the assistant unnamed, "30 specialties" only as what the product is designed for.
 *   3. It mirrors the Turkish page section for section, and reuses only the presentational components named here.
 *   4. It links only to itself, /login and /signup, all under the build's path prefix (/uzbek) — never to a Turkish
 *      page; the Uzbek / Russian switch is in the bar; every form of the page is reachable from the footer.
 *   5. The compiled stylesheet is current; the copy file documents every line.
 */
// First import: fixes the country of this process before the page (and through it the active pack) is loaded.
import '@/lib/ulke/testing/uzDerlemesi'
import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AcilisSayfasi, ACILIS_FONT_HREF } from './AcilisSayfasi'
import { ACILIS_DILLERI, ACILIS_ICERIGI, CAPA, acilisIcerigi, type AcilisDili } from './icerik'
import { mailtoBaglantisi } from './IletisimFormu'
import { UZ_YASAKLI_IFADELER } from './yasakliIfadeler'
import { UZ_PAKETI } from '../index'
import { dilSec } from '@/lib/ulke/ulke'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'

const KOK = resolve(__dirname, '../../..')
const DILLER = [...ACILIS_DILLERI]
const GORSELLER = { xona: '/uzbek/_next/static/media/xona.jpg', stol: '/uzbek/_next/static/media/stol.jpg', yolak: '/uzbek/_next/static/media/yolak.jpg' }
/** The page as app/page.ulke.tsx renders it for the address `?dil=<dil>`. */
const ciz = (dil: AcilisDili, iletisimEposta: string | null = 'pilot@example.com') =>
  renderToStaticMarkup(React.createElement(AcilisSayfasi, { dil: dilSec(dil), istenenDil: dil, iletisimEposta, gorseller: GORSELLER }))
/** Keys whose values are identifiers, not text. */
const KIMLIK = new Set(['capa', 'id', 'rol'])
/** Every piece of text in a catalogue, with its path — whatever the page shows it in. */
function metinler(o: unknown, yol = ''): { yol: string; metin: string }[] {
  if (typeof o === 'string') return [{ yol, metin: o }]
  if (!o || typeof o !== 'object') return []
  return Object.entries(o).flatMap(([k, v]) => (KIMLIK.has(k) ? [] : metinler(v, `${yol}.${k}`)))
}
const sekil = (o: unknown): unknown => (typeof o === 'string' ? '' : Array.isArray(o) ? o.map(sekil) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, KIMLIK.has(k) ? v : sekil(v)])) : o)
const BOLUM_SIRASI = [CAPA.ust, CAPA.suhbat, CAPA.qabul, CAPA.portal, CAPA.maslahat, CAPA.jadval, CAPA.yonalish, CAPA.kuzatuv, CAPA.organish, CAPA.xavfsizlik, CAPA.narx, CAPA.sorov]
const ek = (dil: AcilisDili) => (dil === 'uz-Latn' ? '' : `?dil=${dil}`)
/** Login and sign-up exist in Uzbek Latin and Russian only. */
const genelEk = (dil: AcilisDili) => (dil === 'ru' ? '?dil=ru' : '')

describe('Uzbekistan landing page', () => {
  it('is written in three forms, Uzbek (Latin) first; the pack\'s public languages are among them; no fallback', () => {
    assert.deepEqual(DILLER, ['uz-Latn', 'uz-Cyrl', 'ru'])
    assert.deepEqual(Object.keys(ACILIS_ICERIGI), DILLER)
    assert.equal(DILLER[0], UZ_PAKETI.varsayilanDil)
    for (const d of UZ_PAKETI.acikDiller) assert.ok((DILLER as string[]).includes(d), d)
    assert.throws(() => acilisIcerigi('tr'), /No fallback/)
  })

  it('an address that asks for a form the page does not have gets the public language, never a guess', () => {
    const R = (dil: 'uz-Latn' | 'ru', istenenDil: string | null) => renderToStaticMarkup(React.createElement(AcilisSayfasi, { dil, istenenDil, iletisimEposta: null, gorseller: GORSELLER }))
    assert.match(R('uz-Latn', 'tr'), /<div class="uzl" lang="uz-Latn"/)
    assert.match(R('uz-Latn', null), /<div class="uzl" lang="uz-Latn"/)
    assert.match(R('uz-Latn', 'uz-Cyrl'), /<div class="uzl" lang="uz-Cyrl"/)
    assert.match(R('ru', 'ru'), /<div class="uzl" lang="ru"/)
  })

  for (const dil of DILLER) {
    const t = ACILIS_ICERIGI[dil]

    it(`${dil}: nothing of Türkiye — rendered page, and every string of the catalogue`, () => {
      for (const adres of ['pilot@example.com', null]) {
        const html = ciz(dil, adres)
        assert.ok(html.length > 20000, 'the page did not render')
        assert.deepEqual(sizintiTara(html, { hedefUlke: 'uz', kaynak: `landing ${dil}` }), [])
        assert.deepEqual(sizintiTara(gorunurMetin(html), { hedefUlke: 'uz', kaynak: `landing ${dil} (visible text)` }), [])
      }
      // The first HTML does not hold everything: the visits are typed in the browser, the menu and the form's
      // messages appear on a tap. So every string is scanned by itself as well.
      const hepsi = metinler(t)
      assert.ok(hepsi.length > 200, `${hepsi.length} strings`)
      for (const { yol, metin } of hepsi) assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak: `catalogue ${dil}${yol}` }), [])
    })

    it(`${dil}: no price, trial, demo, integration claim, named law, voice profile, image evaluation or name for the assistant`, () => {
      const gorunen = gorunurMetin(ciz(dil))
      for (const y of UZ_YASAKLI_IFADELER) {
        assert.doesNotMatch(gorunen, y.desen, y.neden)
        for (const { yol, metin } of metinler(t)) assert.doesNotMatch(metin, y.desen, `${y.neden} — ${yol}`)
      }
      // Numbers. Allowed: section numbers, the clock and the figures of the fictional visits (age, weight, dose),
      // the phone example, the count of specialties. Nothing that could be read as an amount of money.
      const izinli = new Set(['720', '500', '250'])
      for (const { yol, metin } of metinler(t)) {
        if (metin === t.sorov.form.telefonOrnek) continue
        for (const s of metin.match(/\d{3,}/g) || []) assert.ok(izinli.has(s), `unexpected number ${s} in ${yol}`)
      }
      const sayfadaki = (gorunen.replace(t.sorov.form.telefonOrnek, '').match(/\d{3,}/g) || []).filter((s) => s !== String(new Date().getFullYear()) && !izinli.has(s))
      assert.deepEqual(sayfadaki, [], 'unexpected numbers on the page')
    })

    it(`${dil}: "30 specialties" is what the product is designed for, never what is switched on`, () => {
      const otuz = metinler(t).filter((m) => /\b30\b/.test(m.metin))
      assert.ok(otuz.length >= 2)
      for (const m of otuz) assert.match(m.metin, /moʻljallangan|мўлжалланган|[Рр]ассчитан/, `${m.yol}: ${m.metin}`)
      assert.equal(t.yonalish.royxat.length, 30)
      assert.equal(new Set(t.yonalish.royxat).size, 30)
    })

    it(`${dil}: the same sections as the Turkish page, in its order, numbered as there`, () => {
      const html = ciz(dil)
      const idler = [...html.matchAll(/<section id="([a-z]+)"/g)].map((m) => m[1])
      assert.deepEqual(idler, BOLUM_SIRASI)
      assert.equal((html.match(/<section\b/g) || []).length, BOLUM_SIRASI.length)
      const ustBasliklar = [t.suhbat, t.qabul, t.portal, t.maslahat, t.jadval, t.yonalish, t.kuzatuv, t.organish, t.xavfsizlik, t.narx].map((b) => b.ustBaslik)
      ustBasliklar.forEach((u, i) => {
        assert.ok(u.startsWith(`${String(i + 1).padStart(2, '0')} — `), u)
        assert.ok(html.includes(u), `not on the page: ${u}`)
      })
      for (let i = 1; i < ustBasliklar.length; i++) assert.ok(html.indexOf(ustBasliklar[i]) > html.indexOf(ustBasliklar[i - 1]), 'section order')
      // The bar: the five numbered links of the Turkish bar, to the same five sections.
      assert.deepEqual(t.nav.havolalar.map((h) => [h.no, h.capa]), [['01', CAPA.suhbat], ['03', CAPA.portal], ['06', CAPA.yonalish], ['09', CAPA.xavfsizlik], ['10', CAPA.narx]])
      // Hero: two-part headline, two buttons, the photograph with its caption, four statements in the strip.
      assert.match(html, new RegExp(`<h1[^>]*>${t.kahraman.baslik}<span[^>]*italic[^>]*text-pine[^>]*>${t.kahraman.baslikVurgu}</span></h1>`))
      assert.equal(t.kahraman.serit.length, 4)
      // The three photographs of the Turkish page, each with a description and a caption.
      const gorseller = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
      assert.deepEqual(gorseller.map((g) => /src="([^"]+)"/.exec(g)![1]), [GORSELLER.xona, GORSELLER.stol, GORSELLER.yolak])
      for (const g of gorseller) assert.match(g, /alt="[^"]{20,}"/)
    })

    it(`${dil}: buttons — request a price leads to the request form, the second hero button to the illustration on this page`, () => {
      const html = ciz(dil)
      const dugme = (etiket: string) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([^<]*)</g)].filter((m) => m[2] === etiket).map((m) => m[1])
      // Top-bar filled button, hero main button and every row of the price section: the request form. No trial.
      assert.deepEqual(dugme(t.nav.sorov), [`#${CAPA.sorov}`, `#${CAPA.sorov}`].concat(t.nav.sorov === t.narx.dugme ? t.narx.rejalar.map(() => `#${CAPA.sorov}`) : []))
      assert.equal(t.nav.sorov, t.kahraman.birinciDugme)
      assert.deepEqual(dugme(t.kahraman.ikinciDugme), [`#${CAPA.suhbat}`])
      assert.match(html, new RegExp(`<section id="${CAPA.sorov}"[\\s\\S]*<form class="uzl-form`))
      // "Giriş" → the Uzbek login; sign-up stays by invitation code.
      assert.deepEqual(dugme(t.nav.giris).slice(0, 1), [`/uzbek/login${genelEk(dil)}`])
      assert.deepEqual(dugme(t.sorov.davetBaglantisi), [`/uzbek/signup${genelEk(dil)}`])
      assert.deepEqual(dugme(t.altBilgi.kayit), [`/uzbek/signup${genelEk(dil)}`])
    })

    it(`${dil}: links only to itself, /login and /signup under /uzbek; the Uzbek / Russian switch is in the bar`, () => {
      const html = ciz(dil)
      const hrefler = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))
      assert.ok(hrefler.length > 15)
      // NOTYA-UZ-MUAYENE-01: the build is served under /uzbek; a link to '/login' would land on Türkiye's site.
      const izinli = new RegExp(`^(#(${BOLUM_SIRASI.join('|')})|/uzbek(\\?dil=(uz-Cyrl|ru))?|/uzbek/login(\\?dil=ru)?|/uzbek/signup(\\?dil=ru)?)$`)
      for (const h of hrefler) assert.match(h, izinli, `link to ${h}`)
      for (const h of hrefler.filter((x) => x.startsWith('#'))) assert.ok(html.includes(`id="${h.slice(1)}"`), `${h} has no target on the page`)
      // The switch in the bar: Uzbek and Russian, named in their own words, the other one a real link.
      const cubuk = /<header[\s\S]*?<\/header>/.exec(html)![0]
      const secici = [...cubuk.matchAll(/<a href="([^"]+)" hrefLang="([^"]+)" lang="[^"]+" title="([^"]+)"( aria-current="true")?/g)].map((m) => [m[1], m[2], m[3], !!m[4]])
      assert.deepEqual(secici, [
        [dil === 'uz-Cyrl' ? '/uzbek?dil=uz-Cyrl' : '/uzbek', dil === 'uz-Cyrl' ? 'uz-Cyrl' : 'uz-Latn', dil === 'uz-Cyrl' ? 'Ўзбекча' : 'Oʻzbekcha', dil !== 'ru'],
        ['/uzbek?dil=ru', 'ru', 'Русский', dil === 'ru'],
      ])
      // The footer: every form of the page, the current one marked.
      const alt = /<footer[\s\S]*<\/footer>/.exec(html)![0]
      assert.deepEqual([...alt.matchAll(/hrefLang="([^"]+)"/g)].map((m) => m[1]), DILLER)
      assert.match(alt, new RegExp(`href="/uzbek${ek(dil).replace('?', '\\?')}" hrefLang="${dil}" lang="${dil}" title="[^"]+" aria-current="true"`))
      assert.match(html, new RegExp(`^<div class="uzl" lang="${dil}">`))
      // Nothing of the Turkish site: its pages, its registration, its legal page, its domain, its photographs by path.
      assert.doesNotMatch(html, /<script\b|"\/landing\/|\/doktor|\/klinik|\/giris|\/kayit|\/kvkk|\/asistan|\/home"|notya\.(io|ai)/)
      assert.equal((html.match(/<link\b/g) || []).length, 1)
      assert.ok(html.includes(`<link rel="stylesheet" href="${ACILIS_FONT_HREF.replace(/&/g, '&amp;')}"/>`))
    })

    it(`${dil}: the request form appears only when the deployment has an address for it`, () => {
      assert.match(ciz(dil, 'pilot@example.com'), /<form class="uzl-form /)
      const yok = ciz(dil, null)
      assert.doesNotMatch(yok, /<form\b/)
      assert.ok(yok.includes(t.sorov.formYok))
      // The address itself is never printed on the page.
      assert.doesNotMatch(ciz(dil, 'pilot@example.com'), /pilot@example\.com/)
    })
  }

  it('the three forms carry the same page: same shape, no empty line, each in its own script', () => {
    const [uz, kiril, ru] = [ACILIS_ICERIGI['uz-Latn'], ACILIS_ICERIGI['uz-Cyrl'], ACILIS_ICERIGI.ru]
    assert.deepEqual(sekil(kiril), sekil(uz))
    assert.deepEqual(sekil(ru), sekil(uz))
    for (const dil of DILLER) for (const { yol, metin } of metinler(ACILIS_ICERIGI[dil])) assert.ok(metin.trim().length > 0, `${dil}${yol}: empty line`)
    // Uzbek Latin is written with U+02BB, never with a plain apostrophe or a typographic quote in its place.
    for (const { metin } of metinler(uz)) {
      assert.doesNotMatch(metin, /[oOgG]['‘’`]/, metin)
      assert.doesNotMatch(metin, /[а-яёўқғҳ]/i, `Cyrillic in the Latin form: ${metin}`)
    }
    // Uzbek Cyrillic and Russian: no Latin word left behind (the brand, units of the clock and the phone aside).
    const latinsiz = (m: string) => m.replace(/Notya/g, '').replace(/[0-9+:·—\s]/g, '')
    for (const [ad, k] of [['uz-Cyrl', kiril], ['ru', ru]] as const) {
      for (const { yol, metin } of metinler(k)) {
        assert.doesNotMatch(latinsiz(metin), /[A-Za-zʻʼ]/, `${ad}${yol}: Latin letters in "${metin}"`)
        if (latinsiz(metin)) assert.match(metin, /[а-яёўқғҳ]/i, `${ad}${yol}: no Cyrillic in "${metin}"`)
      }
    }
    // Uzbek Cyrillic is Uzbek, not Russian: its own letters are there; Russian has none of them.
    assert.match(metinler(kiril).map((m) => m.metin).join(' '), /ў[\s\S]*қ[\s\S]*ғ[\s\S]*ҳ/)
    for (const { metin } of metinler(ru)) assert.doesNotMatch(metin, /[ўқғҳ]/i, metin)
  })

  it('"request a price" builds a message for the visitor own mail app; nothing goes to a server', () => {
    const m = ACILIS_ICERIGI['uz-Latn'].sorov.form
    const link = mailtoBaglantisi('pilot@example.com', m, { adSoyad: 'QA Sinov', kurum: 'QA Klinika', telefon: '+998 90 123 45 67', uzmanlik: 'Pediatriya', mesaj: '' })
    assert.ok(link.startsWith('mailto:pilot@example.com?subject='))
    const govde = decodeURIComponent(link.split('&body=')[1])
    assert.equal(govde, 'Ism va familiya: QA Sinov\nKlinika yoki amaliyot: QA Klinika\nTelefon: +998 90 123 45 67\nYoʻnalish: Pediatriya')
    const kaynak = readFileSync(join(KOK, 'countries/uz/acilis/IletisimFormu.tsx'), 'utf8')
    assert.doesNotMatch(kaynak, /\bfetch\(|XMLHttpRequest|sendBeacon|action=/)
  })

  it('reuses from the Turkish landing page only presentational components, and none of its content', () => {
    const izinli = ['@/components/doktor-landing/button', '@/components/doktor-landing/cn', '@/components/doktor-landing/feature', '@/components/doktor-landing/icons']
    const kullanilan = new Set<string>()
    for (const ad of readdirSync(join(KOK, 'countries/uz/acilis')).filter((d) => /\.tsx?$/.test(d) && !d.endsWith('.test.ts'))) {
      const kaynak = readFileSync(join(KOK, 'countries/uz/acilis', ad), 'utf8')
      for (const m of kaynak.matchAll(/from\s+'([^']+)'/g)) {
        if (/doktor-landing|klinik-landing|app\/doktor|app\/klinik/.test(m[1])) { assert.ok(izinli.includes(m[1]), `${ad} imports ${m[1]}`); kullanilan.add(m[1]) }
        assert.doesNotMatch(m[1], /lib\/doktor\/specialties|countries\/tr|\/content$/, `${ad} imports ${m[1]}`)
      }
    }
    assert.deepEqual([...kullanilan].sort(), izinli)
  })

  it('the compiled stylesheet is current, uses the Turkish page\'s own theme, and nothing on the page is unstyled', () => {
    const css = readFileSync(join(KOK, 'countries/uz/acilis/utilities.css'), 'utf8')
    const taban = readFileSync(join(KOK, 'countries/uz/acilis/acilis.css'), 'utf8')
    // Recompiled here with the same command as in tailwind.config.cjs; a class added without recompiling fails this.
    const r = spawnSync(process.execPath, [join(KOK, 'node_modules/tailwindcss/lib/cli.js'), '-c', 'countries/uz/acilis/tailwind.config.cjs', '-i', 'countries/uz/acilis/tw-kaynak.css', '--minify'], { cwd: KOK, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.equal(css.trim(), r.stdout.trim(), 'countries/uz/acilis/utilities.css is stale — recompile it (command in tailwind.config.cjs)')
    // Same colours and type scale as the Turkish page: the theme is its config, not a copy.
    assert.match(readFileSync(join(KOK, 'countries/uz/acilis/tailwind.config.cjs'), 'utf8'), /theme: turkiye\.theme/)
    for (const deger of ['rgb(243 246 245', 'rgb(14 107 102', 'clamp(2.45rem,5.2vw,5.15rem)', 'var(--font-fraunces)', 'var(--font-outfit-face)']) assert.ok(css.includes(deger), deger)
    assert.match(taban, /--font-fraunces: 'Fraunces', /)
    assert.match(taban, /--font-outfit-face: 'Outfit', /)
    // Every class the page renders with is defined (scope and hook classes aside).
    const kanca = new Set(['uzl', 'uzl-dil', 'uzl-dil-alt', 'uzl-form', 'group'])
    const kacis = (c: string) => c.replace(/[^a-zA-Z0-9_-]/g, (h) => `\\${h}`)
    for (const dil of DILLER) {
      for (const adres of ['pilot@example.com', null]) {
        const siniflar = new Set([...ciz(dil, adres).matchAll(/\bclass="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean))
        assert.ok(siniflar.size > 120)
        for (const c of siniflar) {
          if (kanca.has(c)) continue
          assert.ok(css.includes(`.${kacis(c)}`) || taban.includes(`.${c}`), `class "${c}" is on the page but in neither stylesheet`)
        }
      }
    }
    // Everything is scoped: this stylesheet is loaded on every screen of the build.
    for (const kural of taban.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map((k) => k.split('{')[0].trim()).filter((s) => s && !s.startsWith('@') && !/^(from|to|\d+%)/.test(s))) {
      for (const secici of kural.split(',')) assert.match(secici.trim(), /^\.uzl/, `unscoped rule: ${secici.trim()}`)
    }
  })

  it('the copy file documents the page: every Uzbek and Russian line is in docs/uz-landing/COPY.md, with English beside it', () => {
    const kopya = readFileSync(join(KOK, 'docs/uz-landing/COPY.md'), 'utf8').replace(/ /g, ' ')
    assert.match(kopya, /machine-written/i)
    assert.match(kopya, /native speaker/i)
    assert.match(kopya, /\| Keep \|/); assert.match(kopya, /\| Adapt \|/); assert.match(kopya, /\| Drop \|/)
    const kacis = (s: string) => s.replace(/ /g, ' ').replace(/\|/g, '\\|')
    for (const dil of ['uz-Latn', 'ru'] as const) {
      for (const { yol, metin } of metinler(ACILIS_ICERIGI[dil])) assert.ok(kopya.includes(kacis(metin)), `${dil}${yol}: not in COPY.md → ${metin}`)
    }
    for (const y of UZ_YASAKLI_IFADELER) {
      // The rules are stated in the file in English; its Uzbek and Russian lines must still obey them.
      const satirlar = kopya.split('\n').filter((s) => /^\| `/.test(s)).map((s) => s.split('|').slice(2, 4).join(' '))
      assert.ok(satirlar.length > 150)
      for (const s of satirlar) assert.doesNotMatch(s, y.desen, `${y.neden}: ${s.slice(0, 80)}`)
    }
  })
})
