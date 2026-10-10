/**
 * NOTYA-UZ-ACILIS-02 — the Uzbekistan landing page, rendered for real (react-dom/server) in all three forms
 * (Uzbek Latin, Uzbek Cyrillic, Russian).
 *
 *   1. Leak test: nothing of Türkiye — in the rendered page AND in every string of the catalogue, shown at first
 *      paint or not (the typed visits, the menu, the form's messages are not in the first HTML).
 *   2. Uzbekistan's own rules for this page: no trial, no demo, no integration claim, no named law, no voice
 *      profile, no image evaluation, no biography of the assistant, "30 specialties" only as what the product is
 *      designed for.
 *   2a. NOTYA-UZ-FIYAT-UNVAN-01 — PRICES: the amounts are the pack's price list, written by the pack's number rules;
 *      each equals the Turkish page's price for the same plan at the recorded rate, rounded as recorded; nothing of
 *      the Turkish currency is anywhere; plans the Turkish page sells by quote carry no amount.
 *   2b. NOTYA-UZ-FIYAT-UNVAN-01 — THE ASSISTANT'S NAME: the page names one persona, the counterpart of the one the
 *      Turkish page features, by short title and given name, read from the owner's list (never written in the copy).
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
import { AcilisSayfasi, narxSatirlari } from '@/components/ulke/acilis/AcilisSayfasi'
import { Narx } from '@/components/ulke/acilis/Narx'
import { sayiYazKuralla } from '@/lib/ulke/arayuz/sayi'
import { ACILIS_ASISTAN_ROLU, ACILIS_DILLERI, ACILIS_ICERIGI, CAPA, UZ_ACILIS, acilisIcerigi, type AcilisDili } from './icerik'
import { UZ_FIYATLAR, UZ_FIYAT_DONUSUMU, uzFiyatDonustur } from './fiyatlar'
import { UZ_ASISTAN_ADLARI } from '../klinik/asistanAdlari'
import { uzAsistanKimligi } from '../klinik/asistanKimligi'
import { UZ_ASISTAN_UNVANLARI } from '../klinik/asistanUnvanlari'

/** The pack's own stylesheet address for the page's fonts (was a constant of the layout before the layout became shared). */
const ACILIS_FONT_HREF = UZ_ACILIS.fontHref
import { mailtoBaglantisi } from '@/components/ulke/acilis/IletisimFormu'
import { UZ_YASAKLI_IFADELER } from './yasakliIfadeler'
import { UZ_PAKETI } from '../index'
import { dilSec } from '@/lib/ulke/ulke'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'

const KOK = resolve(__dirname, '../../..')
const DILLER = [...ACILIS_DILLERI]
const GORSELLER = { xona: '/uzbek/_next/static/media/xona.jpg', stol: '/uzbek/_next/static/media/stol.jpg', yolak: '/uzbek/_next/static/media/yolak.jpg' }
/** The page as app/page.ulke.tsx renders it for the address `?dil=<dil>`. */
const ciz = (dil: AcilisDili, iletisimEposta: string | null = 'pilot@example.com') =>
  renderToStaticMarkup(React.createElement(AcilisSayfasi, { dil: dilSec(dil), istenenDil: dil, iletisimEposta, gorseller: GORSELLER, acilis: UZ_ACILIS }))
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
/** An amount as the pack writes numbers: its own separators, the currency's own decimal places. */
const tutar = (n: number) => sayiYazKuralla(n, UZ_PAKETI.bicim, UZ_PAKETI.paraBirimi.ondalikHane)
/** The price line of a plan as a form of the page shows it. */
const narxSatiri = (dil: AcilisDili, id: string) => { const a = UZ_FIYATLAR[id]?.aylik; const n = ACILIS_ICERIGI[dil].narx; return typeof a === 'number' ? n.oylik.replace('%', tutar(a)) : n.sorovNarx }
/** Section 10 with ONE group of plans shown: the first paint holds only the first group, the other is a tap away. */
const cizNarx = (dil: AcilisDili, grup: number) => { const n = ACILIS_ICERIGI[dil].narx; return renderToStaticMarkup(React.createElement(Narx, { metin: { ...n, gruplar: [n.gruplar[grup]] }, fiyatlar: narxSatirlari(UZ_ACILIS), capa: CAPA.narx, sorovHref: `#${CAPA.sorov}` })) }
/** Everything a form of the page can show about prices: both groups rendered, and every price line. */
const fiyatMetni = (dil: AcilisDili) => [gorunurMetin(cizNarx(dil, 0)), gorunurMetin(cizNarx(dil, 1)), ...Object.keys(UZ_FIYATLAR).map((id) => narxSatiri(dil, id))].join('\n')
/**
 * The Turkish landing page's plans, READ AS TEXT (never imported: its content file is Türkiye's). Per group, in the
 * page's order: the monthly price in lira (null = sold by quote), the badge, and how many lines the plan lists.
 */
function turkPlanlari(): Record<'bireysel' | 'klinik', { fiyat: number | null; oneCikan: boolean; madde: number }[]> {
  const kaynak = readFileSync(join(KOK, 'components/doktor-landing/content.ts'), 'utf8')
  const grup = (ad: string) => {
    const govde = new RegExp(`export const ${ad} = \\[([\\s\\S]*?)\\n\\] as const`).exec(kaynak)
    assert.ok(govde, `${ad} not found in the Turkish landing content: the price test must be re-read against it`)
    return govde![1].split(/\n  \{\n/).slice(1).map((p) => {
      const fiyat = /price: "([^"]+)"/.exec(p)![1]
      const madde = /items: \[([\s\S]*?)\]/.exec(p)![1].match(/"(?:[^"\\]|\\.)*"/g)!.length
      return { fiyat: /^[\d.]+$/.test(fiyat) ? Number(fiyat.replace(/\./g, '')) : null, oneCikan: /highlight: true/.test(p), madde }
    })
  }
  return { bireysel: grup('INDIVIDUAL_PLANS'), klinik: grup('CLINIC_PLANS') }
}
/** The persona the Turkish landing page features, read as text: the specialty key of the assistant it names. */
function turkSayfasininAsistani(): { rol: string; unvanliKisa: string; tamAd: string } {
  const icerik = readFileSync(join(KOK, 'components/doktor-landing/content.ts'), 'utf8')
  const adlar = [...new Set([...icerik.matchAll(/specialist: "([^"]+)"/g)].map((m) => m[1]))]
  assert.equal(adlar.length, 1, 'the Turkish page features one assistant')
  const katalog = readFileSync(join(KOK, 'lib/asistan/specialistsCatalog.ts'), 'utf8')
  const kisa = adlar[0].split(' ').slice(1).join(' ')
  const m = new RegExp(`specialtyKey: '([^']+)',\\s*name: '([^']+)',\\s*shortName: '${kisa}'`).exec(katalog)
  assert.ok(m, `the Turkish catalogue has no specialist called "${kisa}"`)
  return { rol: m![1], unvanliKisa: adlar[0], tamAd: m![2] }
}
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
    const R = (dil: 'uz-Latn' | 'ru', istenenDil: string | null) => renderToStaticMarkup(React.createElement(AcilisSayfasi, { dil, istenenDil, iletisimEposta: null, gorseller: GORSELLER, acilis: UZ_ACILIS }))
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

    it(`${dil}: no trial, demo, integration claim, named law, voice profile, image evaluation, foreign currency or biography of the assistant`, () => {
      const gorunen = gorunurMetin(ciz(dil))
      for (const y of UZ_YASAKLI_IFADELER) {
        // A rule marked for the copy only (an amount written into a sentence) does not apply to the page, which shows the price list.
        if (!y.yalnizMetin) { assert.doesNotMatch(gorunen, y.desen, y.neden); assert.doesNotMatch(fiyatMetni(dil), y.desen, `${y.neden} — price section`) }
        for (const { yol, metin } of metinler(t)) assert.doesNotMatch(metin, y.desen, `${y.neden} — ${yol}`)
      }
      // Numbers. Allowed: section numbers, the clock and the figures of the fictional visits (age, weight, dose),
      // the phone example, the count of specialties. Nothing that could be read as an amount of money.
      const izinli = new Set(['720', '500', '250'])
      for (const { yol, metin } of metinler(t)) {
        if (metin === t.sorov.form.telefonOrnek) continue
        for (const s of metin.match(/\d{3,}/g) || []) assert.ok(izinli.has(s), `unexpected number ${s} in ${yol}`)
      }
      // On the page, beside those: the amounts of the price list, exactly as the pack writes numbers — and nothing else.
      let fiyatsiz = gorunen.replace(t.sorov.form.telefonOrnek, '')
      for (const r of t.narx.gruplar[0].rejalar) { const satir = narxSatiri(dil, r.id); assert.ok(fiyatsiz.includes(satir), `the price line of "${r.id}" is not on the page: ${satir}`); fiyatsiz = fiyatsiz.replace(satir, '') }
      const sayfadaki = (fiyatsiz.match(/\d{3,}/g) || []).filter((s) => s !== String(new Date().getFullYear()) && !izinli.has(s))
      assert.deepEqual(sayfadaki, [], 'unexpected numbers on the page')
      assert.doesNotMatch(fiyatsiz, /\d[\d\s.,]*\s*(soʻm|so'm|сум|сўм|UZS)/i, 'an amount of money on the page that is not a line of the price list')
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

    it(`${dil}: buttons — every button of the bar, the hero and the price section leads to the request form; the second hero button to the illustration on this page`, () => {
      const html = ciz(dil)
      const baglantilar = (kaynak: string, etiket: string) => [...kaynak.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([^<]*)</g)].filter((m) => m[2] === etiket).map((m) => m[1])
      const dugme = (etiket: string) => baglantilar(html, etiket)
      // Top-bar filled button and hero main button: the request form. No trial, no sign-up without an invitation.
      assert.deepEqual(dugme(t.nav.sorov), [`#${CAPA.sorov}`, `#${CAPA.sorov}`])
      assert.equal(t.nav.sorov, t.kahraman.birinciDugme)
      // Price section: a plan with an amount says "leave a request", a plan without one says "request a price" — both go to the request form.
      const [yakka, klinika] = [cizNarx(dil, 0), cizNarx(dil, 1)]
      assert.deepEqual(baglantilar(yakka, t.narx.dugme), t.narx.gruplar[0].rejalar.map(() => `#${CAPA.sorov}`))
      assert.deepEqual(baglantilar(klinika, t.narx.sorovDugme), t.narx.gruplar[1].rejalar.map(() => `#${CAPA.sorov}`))
      assert.deepEqual(baglantilar(yakka, t.narx.sorovDugme).concat(baglantilar(klinika, t.narx.dugme)), [], 'a plan carries the wrong button')
      for (const kaynak of [yakka, klinika]) for (const m of kaynak.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) assert.equal(m[1], `#${CAPA.sorov}`, 'a button of the price section leads somewhere else')
      assert.deepEqual(dugme(t.narx.dugme), t.narx.gruplar[0].rejalar.map(() => `#${CAPA.sorov}`), 'the first paint shows the first group of plans')
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

  // ───────────────────────── NOTYA-UZ-FIYAT-UNVAN-01: prices ─────────────────────────

  it('prices: every amount shown equals the Turkish page\'s price for the same plan at the recorded rate, rounded as recorded', () => {
    const tr = turkPlanlari()
    const D = UZ_FIYAT_DONUSUMU
    const [yakka, klinika] = ACILIS_ICERIGI['uz-Latn'].narx.gruplar
    // Same plans as the Turkish page, in its order: three for one doctor (with amounts), four for clinics (by quote).
    assert.deepEqual([yakka.rejalar.length, klinika.rejalar.length], [tr.bireysel.length, tr.klinik.length])
    assert.deepEqual(Object.keys(UZ_FIYATLAR), [...yakka.rejalar, ...klinika.rejalar].map((r) => r.id), 'the price list names exactly the plans of the copy, in its order')
    assert.ok(tr.bireysel.every((p) => typeof p.fiyat === 'number') && tr.klinik.every((p) => p.fiyat === null), 'the Turkish page changed which plans carry a price: re-read the conversion')
    yakka.rejalar.forEach((r, i) => {
      const kaynak = tr.bireysel[i].fiyat as number
      assert.equal(D.kaynakAylik[r.id], kaynak, `${r.id}: the recorded source price is not the Turkish page's (${kaynak})`)
      const tam = kaynak * D.kur
      const yuvarlak = Math.round(tam / D.yuvarlama) * D.yuvarlama
      assert.equal(uzFiyatDonustur(kaynak), yuvarlak)
      assert.equal(UZ_FIYATLAR[r.id].aylik, yuvarlak, `${r.id}: ${kaynak} × ${D.kur} = ${tam.toFixed(2)} → ${yuvarlak}, the price list says ${UZ_FIYATLAR[r.id].aylik}`)
      assert.ok(Math.abs(yuvarlak - tam) <= D.yuvarlama / 2 && yuvarlak % D.yuvarlama === 0, `${r.id}: not the nearest ${D.yuvarlama}`)
      assert.equal(UZ_FIYATLAR[r.id].oneCikan, tr.bireysel[i].oneCikan, `${r.id}: the badge`)
      assert.equal(r.maddeler.length, tr.bireysel[i].madde, `${r.id}: as many lines as the Turkish plan (one line there may be shortened here, none dropped whole)`)
    })
    klinika.rejalar.forEach((r, i) => {
      assert.equal(UZ_FIYATLAR[r.id].aylik, null, `${r.id}: sold by quote on the Turkish page, so no amount here`)
      assert.equal(D.kaynakAylik[r.id], undefined, `${r.id}: a quote-only plan has no source price`)
      assert.equal(UZ_FIYATLAR[r.id].oneCikan, tr.klinik[i].oneCikan, `${r.id}: the badge`)
      assert.equal(r.maddeler.length, tr.klinik[i].madde, `${r.id}: as many lines as the Turkish plan`)
    })
    // The figures of this job, as plain numbers, so a silent change of the rule cannot pass.
    assert.deepEqual([D.kur, D.kurTarihi, D.yuvarlama], [240.71, '2026-10-09', 10000])
    assert.deepEqual(yakka.rejalar.map((r) => [D.kaynakAylik[r.id], UZ_FIYATLAR[r.id].aylik]), [[1490, 360000], [3490, 840000], [5990, 1440000]])
  })

  it('prices: written by the pack\'s number rules, with the currency as each form writes it; the same amounts in all three forms', () => {
    assert.deepEqual([UZ_PAKETI.bicim.binlikAyraci, UZ_PAKETI.paraBirimi.ondalikHane, UZ_PAKETI.paraBirimi.kod], [' ', 0, 'UZS'])
    assert.deepEqual([360000, 840000, 1440000].map(tutar), ['360 000', '840 000', '1 440 000'])
    assert.deepEqual(['starter', 'pro', 'practice'].map((id) => narxSatiri('uz-Latn', id)), ['360 000 soʻm / oy', '840 000 soʻm / oy', '1 440 000 soʻm / oy'])
    assert.deepEqual(['starter', 'pro', 'practice'].map((id) => narxSatiri('uz-Cyrl', id)), ['360 000 сўм / ой', '840 000 сўм / ой', '1 440 000 сўм / ой'])
    assert.deepEqual(['starter', 'pro', 'practice'].map((id) => narxSatiri('ru', id)), ['360 000 сум / мес.', '840 000 сум / мес.', '1 440 000 сум / мес.'])
    assert.equal(ACILIS_ICERIGI['uz-Latn'].narx.oylik.includes(UZ_PAKETI.paraBirimi.simge), true, 'the Latin form writes the currency as the pack names it')
    for (const dil of DILLER) {
      const n = ACILIS_ICERIGI[dil].narx
      const [yakka, klinika] = [cizNarx(dil, 0), cizNarx(dil, 1)]
      const satirlar = (html: string) => [...html.matchAll(/data-alan="narx">([^<]*)</g)].map((m) => m[1])
      assert.deepEqual(satirlar(yakka), n.gruplar[0].rejalar.map((r) => narxSatiri(dil, r.id)), `${dil}: one doctor`)
      assert.deepEqual(satirlar(klinika), n.gruplar[1].rejalar.map(() => n.sorovNarx), `${dil}: clinics are by request, without an amount`)
      assert.doesNotMatch(gorunurMetin(klinika), /\d{3,}/, `${dil}: a number in the clinic plans`)
      // The badge sits on the plans the price list marks, and on no other.
      const rozet = (html: string) => [...html.matchAll(/<li[^>]*data-reja="([^"]+)"[\s\S]*?<\/li>\s*(?=<li[^>]*data-reja|<\/ol>)/g)].filter((m) => m[0].includes(`>${n.tavsiya}<`)).map((m) => m[1])
      assert.deepEqual([...rozet(yakka), ...rozet(klinika)], Object.entries(UZ_FIYATLAR).filter(([, f]) => f.oneCikan).map(([id]) => id), `${dil}: the badge`)
      // The switch: both groups by name, the first selected; the first paint of the page is the first group.
      const sekmeler = [...renderToStaticMarkup(React.createElement(Narx, { metin: n, fiyatlar: narxSatirlari(UZ_ACILIS), capa: CAPA.narx, sorovHref: '#x' })).matchAll(/role="tab" aria-selected="(true|false)" data-guruh="([^"]+)"[^>]*>([^<]+)</g)].map((m) => [m[1], m[2], m[3]])
      assert.deepEqual(sekmeler, n.gruplar.map((g, i) => [String(i === 0), g.id, g.ad]), `${dil}: the switch`)
      // The line under each list is that group's own.
      assert.ok(gorunurMetin(yakka).includes(n.gruplar[0].izoh) && gorunurMetin(klinika).includes(n.gruplar[1].izoh) && !gorunurMetin(klinika).includes(n.gruplar[0].izoh))
    }
    // An amount the price list does not give is never guessed: a plan without an entry shows "on request".
    const n = ACILIS_ICERIGI['uz-Latn'].narx
    const bos = renderToStaticMarkup(React.createElement(Narx, { metin: { ...n, gruplar: [n.gruplar[0]] }, fiyatlar: {}, capa: CAPA.narx, sorovHref: '#x' }))
    assert.deepEqual([...bos.matchAll(/data-alan="narx">([^<]*)</g)].map((m) => m[1]), n.gruplar[0].rejalar.map(() => n.sorovNarx))
    assert.doesNotMatch(gorunurMetin(bos), /\d{3,}/)
  })

  it('prices: no lira sign, no "TL", no lira amount — on the page, in the price section of both groups, in the copy, in the price data', () => {
    const LIRA = /₺|(?<![\p{L}\p{N}])(TL|TRY)(?![\p{L}\p{N}])|(?<!\p{L})(lira\p{L}*|лир(а|ы|у|е|ой|ами|ах)?)(?!\p{L})/iu
    const tr = turkPlanlari()
    // Every way the Turkish amounts could be written: 1490, 1.490, 1 490, 1,490.
    const tutarlar = tr.bireysel.map((p) => String(p.fiyat)).map((s) => new RegExp(`(?<![\\d])${s.slice(0, -3)}[\\s.,]?${s.slice(-3)}(?![\\d])`))
    assert.equal(tutarlar.length, 3)
    for (const dil of DILLER) {
      const parcalar = [gorunurMetin(ciz(dil)), fiyatMetni(dil), ...metinler(ACILIS_ICERIGI[dil]).map((m) => m.metin)]
      for (const p of parcalar) {
        assert.doesNotMatch(p, LIRA, `${dil}: something of the lira`)
        for (const d of tutarlar) assert.doesNotMatch(p, d, `${dil}: a Turkish amount`)
        assert.deepEqual(sizintiTara(p, { hedefUlke: 'uz', kaynak: `prices ${dil}` }), [])
      }
    }
    // The price list a browser may receive: plan ids, amounts of soʻm, the badge. No currency of another country, no source price.
    const veri = JSON.stringify(UZ_FIYATLAR)
    assert.doesNotMatch(veri, LIRA)
    for (const d of tutarlar) assert.doesNotMatch(veri, d)
    assert.deepEqual(sizintiTara(veri, { hedefUlke: 'uz', kaynak: 'price list' }), [])
    // The record keeps the source prices as bare numbers; it names no currency of another country either.
    assert.doesNotMatch(JSON.stringify({ ...UZ_FIYAT_DONUSUMU, kaynakAylik: 0 }), LIRA)
    assert.deepEqual(sizintiTara(JSON.stringify(UZ_FIYAT_DONUSUMU), { hedefUlke: 'uz', kaynak: 'conversion record' }), [])
  })

  it('prices: the copy mirrors the Turkish plans and leaves out what exists only in Türkiye; the footnotes carry no trial and name no tax', () => {
    for (const dil of DILLER) {
      const n = ACILIS_ICERIGI[dil].narx
      assert.deepEqual(n.gruplar.map((g) => g.id), ['solo', 'clinic'])
      assert.deepEqual(n.gruplar.map((g) => g.rejalar.map((r) => r.id)), [['starter', 'pro', 'practice'], ['clinic5', 'clinic10', 'clinic20', 'enterprise']])
      assert.ok(n.oylik.includes('%') && !/\d/.test(n.oylik), 'the amount is the price list\'s, not the copy\'s')
      // The session limit of the first plan and "unlimited" of the second, as on the Turkish page.
      assert.match(n.gruplar[0].rejalar[0].maddeler[0], /\b60\b/)
      assert.doesNotMatch(n.gruplar[0].rejalar[1].maddeler.join(' '), /\d/)
      // Users per clinic plan.
      assert.deepEqual(n.gruplar[1].rejalar.slice(0, 3).map((r) => /\d+/.exec(r.maddeler[0])?.[0]), ['5', '10', '20'])
      // Footnote of the priced plans: taxes (not a named tax), two months with yearly prepayment, 40% for the first 50 doctors for 12 months.
      const [yakkaIzoh, klinikaIzoh] = n.gruplar.map((g) => g.izoh)
      assert.deepEqual((yakkaIzoh.match(/\d+/g) || []).sort(), ['12', '2', '40', '50'], `${dil}: the figures of the footnote`)
      assert.match(yakkaIzoh, /soliqlar|солиқлар|[Нн]алоги/, `${dil}: "taxes", in the plural and unnamed`)
      assert.doesNotMatch(yakkaIzoh + klinikaIzoh, /QQS|ҚҚС|НДС|\bKDV\b|\bVAT\b/i, `${dil}: a tax is named`)
      assert.doesNotMatch(klinikaIzoh, /\d/, `${dil}: the clinic footnote promises no figure`)
      // Sign-up stays by invitation: both footnotes say so, and nothing promises a trial or a card-free start.
      for (const izoh of [yakkaIzoh, klinikaIzoh]) assert.match(izoh, /taklif kodi|таклиф коди|код[ау]? приглашения/, `${dil}: by invitation`)
      assert.doesNotMatch(JSON.stringify(n), /bepul|бепул|бесплатн|sinov|синов|пробн|kredit|кредит|bank karta|банк карта|банковск/i, `${dil}: a trial or a payment card`)
    }
  })

  it('prices: the record is written beside the data and in the country document, figure for figure', () => {
    const D = UZ_FIYAT_DONUSUMU
    const satirlar = Object.entries(D.kaynakAylik).map(([id, kaynak]) => ({ id, kaynak, tam: (kaynak * D.kur).toFixed(2), gosterilen: UZ_FIYATLAR[id].aylik as number }))
    const bosluklu = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    for (const [ad, yol] of [['the comment beside the price data', 'countries/uz/acilis/fiyatlar.ts'], ['the country document', 'docs/COUNTRY-PACK-UZBEKISTAN.md']] as const) {
      const metin = readFileSync(join(KOK, yol), 'utf8')
      for (const parca of ['cbu.uz', String(D.kur), '09.10.2026', ...satirlar.flatMap((x) => [bosluklu(String(x.kaynak)), bosluklu(x.tam), bosluklu(String(x.gosterilen))])]) assert.ok(metin.includes(parca), `${ad} does not carry "${parca}"`)
    }
  })

  // ───────────────────────── NOTYA-UZ-FIYAT-UNVAN-01: the assistant's name ─────────────────────────

  it('the page names ONE assistant, the counterpart of the persona the Turkish page features, by short title and given name', () => {
    const tr = turkSayfasininAsistani()
    // The Turkish page: "Prof. <given>" of its paediatrics professor ("Prof. Dr. <given> <family>" in the catalogue).
    assert.match(tr.unvanliKisa, /^Prof\. \S+$/)
    assert.match(tr.tamAd, /^Prof\. Dr\. \S+ \S+$/)
    assert.equal(ACILIS_ASISTAN_ROLU, tr.rol, 'the featured role is the Turkish page\'s')
    const digerleri = UZ_ASISTAN_ADLARI.filter((a) => a.bransAnahtari !== ACILIS_ASISTAN_ROLU)
    assert.equal(digerleri.length, 39)
    // NOTYA-ULKE-UYGULA-UZ (2026-10-10): five roles of the owner's list left the role list with the audit of the
    // specialties. Their names stay in the list (it is the owner's) and are shown nowhere: no identity is made for them.
    assert.deepEqual(digerleri.filter((a) => !uzAsistanKimligi(a.bransAnahtari, 'uz-Latn')).map((a) => a.bransAnahtari).sort(), ['diyetisyen', 'ergoterapi', 'longevity', 'odyoloji', 'sac-ekimi'])
    for (const dil of DILLER) {
      const t = ACILIS_ICERIGI[dil]
      const k = uzAsistanKimligi(ACILIS_ASISTAN_ROLU, dil)!
      assert.equal(k.unvanliKisaAd, `${UZ_ASISTAN_UNVANLARI[dil]['prof-dr'].kisa} ${k.kisaAd}`)
      // Where the Turkish page names its assistant, this page names its own: hero, section 01, the three example visits, the first plan.
      assert.ok(t.kahraman.giris.startsWith(`${k.unvanliKisaAd} `), `${dil}: hero`)
      assert.ok(t.suhbat.govde.includes(k.unvanliKisaAd), `${dil}: section 01`)
      assert.deepEqual(t.suhbat.sahneler.map((s) => s.yordamchi), [k.unvanliKisaAd, k.unvanliKisaAd, k.unvanliKisaAd])
      assert.deepEqual(t.suhbat.sahneler.flatMap((s) => s.navbatlar.filter((n) => n.rol === 'yordamchi').map((n) => n.kim)), [k.kisaAd, k.kisaAd], `${dil}: the speaker is the given name alone`)
      assert.ok(t.narx.gruplar[0].rejalar[0].maddeler.some((m) => m.endsWith(k.unvanliKisaAd)), `${dil}: the first plan`)
      const html = gorunurMetin(ciz(dil))
      assert.ok(html.includes(k.unvanliKisaAd))
      for (const { yol, metin } of metinler(t)) {
        // A title never stands without the featured given name, and never as the full form with the family name.
        for (const u of Object.values(UZ_ASISTAN_UNVANLARI[dil]).flatMap((x) => [x.tam, x.kisa])) {
          for (const m of metin.matchAll(new RegExp(`(?<![\\p{L}])${u.replace(/\./g, '\\.')}(?![\\p{L}])\\s*(\\S*)`, 'gu'))) assert.equal(m[1].replace(/[.,;:!?»”]+$/, ''), k.kisaAd, `${dil}${yol}: the title "${u}" stands before "${m[1]}"`)
        }
        assert.ok(!metin.includes(k.tamAd) && !metin.includes(k.tamAd.split(' ').slice(-2).join(' ')), `${dil}${yol}: the full name is not for the landing page`)
        // No other role's assistant is named anywhere on the page.
        for (const a of digerleri) { const ad = uzAsistanKimligi(a.bransAnahtari, dil)?.kisaAd; if (!ad) continue; assert.doesNotMatch(metin, new RegExp(`(?<![\\p{L}])${ad}(?![\\p{L}])`, 'u'), `${dil}${yol}: names ${a.bransAnahtari}'s assistant`) }
      }
      // Leak scan over the name and the titles themselves, in this form.
      for (const x of [k.tamAd, k.unvanliKisaAd, k.kisaAd, ...Object.values(UZ_ASISTAN_UNVANLARI[dil]).flatMap((u) => [u.tam, u.kisa])]) assert.deepEqual(sizintiTara(x, { hedefUlke: 'uz', kaynak: `assistant ${dil}` }), [])
    }
    // ONE SOURCE: the name is read from the owner's list; the copy file does not write it.
    const kaynak = readFileSync(join(KOK, 'countries/uz/acilis/icerik.ts'), 'utf8')
    for (const dil of DILLER) assert.ok(!kaynak.includes(uzAsistanKimligi(ACILIS_ASISTAN_ROLU, dil)!.kisaAd), `countries/uz/acilis/icerik.ts writes the featured name itself (${dil})`)
    assert.match(kaynak, /uzAsistanKimligi\(ACILIS_ASISTAN_ROLU, dil\)/)
  })

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
    const kaynak = readFileSync(join(KOK, 'components/ulke/acilis/IletisimFormu.tsx'), 'utf8')
    assert.doesNotMatch(kaynak, /\bfetch\(|XMLHttpRequest|sendBeacon|action=/)
  })

  it('reuses from the Turkish landing page only presentational components, and none of its content', () => {
    const izinli = ['@/components/doktor-landing/button', '@/components/doktor-landing/cn', '@/components/doktor-landing/feature', '@/components/doktor-landing/icons']
    const kullanilan = new Set<string>()
    // The layout (the country kit's) and the pack's own landing files: both are held to the rule.
    const dosyalar = ['components/ulke/acilis', 'countries/uz/acilis'].flatMap((d) => readdirSync(join(KOK, d)).filter((x) => /\.tsx?$/.test(x) && !x.endsWith('.test.ts')).map((x) => `${d}/${x}`))
    for (const ad of dosyalar) {
      const kaynak = readFileSync(join(KOK, ad), 'utf8')
      for (const m of kaynak.matchAll(/from\s+'([^']+)'/g)) {
        if (/doktor-landing|klinik-landing|app\/doktor|app\/klinik/.test(m[1])) { assert.ok(izinli.includes(m[1]), `${ad} imports ${m[1]}`); kullanilan.add(m[1]) }
        assert.doesNotMatch(m[1], /lib\/doktor\/specialties|countries\/tr|\/content$/, `${ad} imports ${m[1]}`)
      }
    }
    assert.deepEqual([...kullanilan].sort(), izinli)
  })

  it('the compiled stylesheet is current, uses the Turkish page\'s own theme, and nothing on the page is unstyled', () => {
    const css = readFileSync(join(KOK, 'components/ulke/acilis/utilities.css'), 'utf8')
    const taban = readFileSync(join(KOK, 'components/ulke/acilis/acilis.css'), 'utf8')
    // Recompiled here with the same command as in tailwind.config.cjs; a class added without recompiling fails this.
    const r = spawnSync(process.execPath, [join(KOK, 'node_modules/tailwindcss/lib/cli.js'), '-c', 'components/ulke/acilis/tailwind.config.cjs', '-i', 'components/ulke/acilis/tw-kaynak.css', '--minify'], { cwd: KOK, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.equal(css.trim(), r.stdout.trim(), 'components/ulke/acilis/utilities.css is stale — recompile it (command in tailwind.config.cjs)')
    // Same colours and type scale as the Turkish page: the theme is its config, not a copy.
    assert.match(readFileSync(join(KOK, 'components/ulke/acilis/tailwind.config.cjs'), 'utf8'), /theme: turkiye\.theme/)
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
