/**
 * NOTYA-ULKE-MESAJ-01 — THE SCREENS OF "MY TEMPLATES", for whichever pack is active (run once per country folder).
 * Names no country: every expectation is read from the active pack's catalogue (SablonMetni).
 *
 *   A. the tool's screen   the notice that no patient's data belongs in a template, ALWAYS; the list (name, where it
 *                          is offered, text as text); the form for a new template and for an edit; THE DELETING
 *                          WARNING BEFORE THE CONFIRMATION; every refusal in the pack's words
 *   B. the picker          folded away; one button per template; nothing where the list could not be read; "no
 *                          template for this place"; drawn under each section of a DRAFT and never on an approved
 *                          note; drawn under the message box
 *   C. rules               every sentence is the pack's; the tile opens the kit's own screen; mounted only where the
 *                          country has templates
 *   D. catalogue and leak  the same shape and placeholders in every form; nothing of another country
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { SablonMetni } from '@/lib/ulke/arayuz'
import type { Sablon } from '@/lib/ulke/sablon/sabitler'
import type { DilKodu, UlkePaketi } from '@/lib/ulke/tipler'

;(require as unknown as { extensions: Record<string, (m: { exports: unknown }) => void> }).extensions['.css'] = (m) => { m.exports = {} }

const KOK = resolve(__dirname, '../..')
const h = React.createElement
const bos = () => {}
const kod = (d: string) => readFileSync(join(KOK, d), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
function yaprak(o: unknown, on = ''): [string, string][] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : yaprak(v, `${on}${k}.`)))
}

let paket: UlkePaketi
let ACIK = false
let FORMLAR: readonly DilKodu[] = []
let A: typeof import('@/lib/ulke/arayuz')
let Y: typeof import('@/lib/ulke/arayuz/yerTutucu')
let C: typeof import('@/lib/ulke/sablon/sabitler')
let E: typeof import('./uygulama/Sablonlarim')
let Kabuk: typeof import('./uygulama/Kabuk')
let Not: typeof import('./uygulama/Not')
let Mesaj: typeof import('./uygulama/HastaMesajlari')

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: paket.kod, kaynak }), [])
const GUN = '2026-10-12T05:00:00.000Z'
const QA = 'QA-TEMPLATE'
const SABLONLAR = (): Sablon[] => [
  { id: 's1', ad: `${QA} name one`, metin: `${QA} text one\nsecond line <i>not markup</i>`, kapsam: 'not', guncellendi: GUN },
  { id: 's2', ad: `${QA} name two`, metin: `${QA} text two`, kapsam: 'hepsi', guncellendi: GUN },
]

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  ACIK = paket.ozellikler.cekirdekMuayene === true && Boolean(arayuz?.sablonMetinleri)
  FORMLAR = paket.uygulama?.diller ?? []
  if (!ACIK) return
  A = await import('@/lib/ulke/arayuz'); Y = await import('@/lib/ulke/arayuz/yerTutucu'); C = await import('@/lib/ulke/sablon/sabitler')
  E = await import('./uygulama/Sablonlarim'); Kabuk = await import('./uygulama/Kabuk'); Not = await import('./uygulama/Not'); Mesaj = await import('./uygulama/HastaMesajlari')
})

const x = (dil: DilKodu): SablonMetni => A.sablonMetni(dil)
const cerceve = (dil: DilKodu, ic: React.ReactNode) => renderToStaticMarkup(h(Kabuk.Cerceve, { dil, m: A.uygulamaMetni(dil), ad: 'QA Doctor', aktif: 'araclar', cikis: bos, children: ic }))
type Ek = Partial<Parameters<typeof import('./uygulama/Sablonlarim').SablonlarimGorunumu>[0]>
const ekran = (dil: DilKodu, sablonlar: Sablon[] | null, ek: Ek = {}) => cerceve(dil, h(E.SablonlarimGorunumu, { x: x(dil), sablonlar, form: E.BOS_SABLON, setForm: bos, kaydet: bos, bekliyor: false, hata: null, bildirim: null, duzenle: bos, vazgec: bos, silSorulan: null, silIste: bos, silOnayla: bos, silVazgec: bos, ...ek }))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const var_ = (html: string, metin: string, ne: string) => assert.ok(html.includes(esc(metin)), `${ne}: "${metin}" is not on the screen`)
const yok = (html: string, metin: string, ne: string) => assert.ok(!html.includes(esc(metin)), `${ne}: "${metin}" is on the screen`)
const say = (html: string, re: RegExp) => (html.match(re) ?? []).length

describe('"my templates" — the tool\'s screen', () => {
  it('a pack without the templates\' catalogue has nothing to draw', async () => {
    if (ACIK) return
    assert.ok(!(await import('@/countries/active/arayuz')).AKTIF_ARAYUZ?.sablonMetinleri)
  })

  it('NO PATIENT\'S DATA IN A TEMPLATE — said always: while loading, with none, with some, while editing, in every form', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil)
      for (const [ad, html] of [['loading', ekran(dil, null)], ['could not be read', ekran(dil, null, { yuklenemedi: true })], ['none', ekran(dil, [])], ['some', ekran(dil, SABLONLAR())], ['editing', ekran(dil, SABLONLAR(), { form: { id: 's1', ad: 'a', metin: 'b', kapsam: 'not' } })]] as const) {
        var_(html, s.uyari, `${dil} ${ad}`)
        assert.equal(say(html, /data-alan="sablon-uyari"/g), 1)
        temiz(gorunurMetin(html), `templates ${dil} ${ad}`)
      }
      var_(ekran(dil, null, { yuklenemedi: true }), s.yuklenemedi, `${dil} failed`)
      assert.doesNotMatch(ekran(dil, null), /<form|<textarea|data-eylem=/, `${dil}: something is offered before the list is known`)
    }
  })

  it('THE LIST AND THE FORM: each template with its name, where it is offered and its text AS TEXT; an empty list says so; the form for a new one', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil)
      const hic = ekran(dil, [])
      for (const m of [s.bos, s.yeni, s.ad, s.metin, s.kapsamEtiketi, s.kapsam.not, s.kapsam.mesaj, s.kapsam.hepsi, s.kaydet]) var_(hic, m, `${dil} empty`)
      for (const m of [s.duzenle, s.sil, s.silUyari, s.duzenleBaslik]) yok(hic, m, `${dil} empty`)
      const html = ekran(dil, SABLONLAR())
      for (const m of [`${QA} name one`, `${QA} name two`, `${QA} text two`, `${QA} text one\nsecond line <i>not markup</i>`, s.duzenle, s.sil]) var_(html, m, `${dil} list`)
      assert.doesNotMatch(html, /<i>not markup<\/i>/, 'a template\'s text was drawn as markup')
      assert.match(html, /data-bolum="sablonlarim" data-sablon-adedi="2"/)
      assert.match(html, /data-sablon="s1" data-kapsam="not"/); assert.match(html, /data-sablon="s2" data-kapsam="hepsi"/)
      assert.equal(say(html, /data-eylem="sablon-duzenle"/g), 2); assert.equal(say(html, /data-eylem="sablon-sil"/g), 2)
      yok(html, s.bos, `${dil} list`); yok(html, s.silUyari, `${dil}: the warning before anybody asked`)
      assert.match(html, new RegExp(`<input[^>]*name="ad"[^>]*maxLength="${C.SABLON_AD_AZAMI}"`)); assert.match(html, new RegExp(`<textarea[^>]*name="metin"[^>]*maxLength="${C.SABLON_METIN_AZAMI}"`))
      // the three places, one of them chosen
      assert.equal(say(html, /name="sablon-kapsam"/g), 3)
      // editing: the heading changes, the fields hold the template, and "cancel" leaves the edit
      const duzen = ekran(dil, SABLONLAR(), { form: { id: 's1', ad: `${QA} name one`, metin: `${QA} text one`, kapsam: 'not' } })
      var_(duzen, s.duzenleBaslik, `${dil} edit`); yok(duzen, `>${s.yeni}<`, `${dil} edit`)
      assert.match(duzen, /data-bolum="sablon-formu" data-duzenlenen="s1"/); assert.equal(say(duzen, /data-eylem="sablon-vazgec"/g), 1)
      assert.equal(say(html, /data-eylem="sablon-vazgec"/g), 0)
      for (const [hata, metin] of [['ad', s.adGerekli], ['metin', s.metinGerekli], ['uzun', Y.yerine(s.cokUzun, C.SABLON_METIN_AZAMI)], ['cok', Y.yerine(s.cokFazla, C.SABLON_ADET_AZAMI)], ['kaydedilemedi', s.kaydedilemedi], ['yapilamadi', s.kaydedilemedi]] as const) var_(ekran(dil, SABLONLAR(), { hata }), metin, `${dil} ${hata}`)
      var_(ekran(dil, SABLONLAR(), { bildirim: 'kaydedildi' }), s.kaydedildi, `${dil} saved`); var_(ekran(dil, SABLONLAR(), { bildirim: 'silindi' }), s.silindi, `${dil} deleted`)
      var_(ekran(dil, SABLONLAR(), { bekliyor: true }), s.kaydediliyor, `${dil} saving`)
    }
  })

  it('DELETING: WHAT IT DOES IS SHOWN BEFORE THE CONFIRMATION — for that template only, in place of its two buttons', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil)
      const html = ekran(dil, SABLONLAR(), { silSorulan: 's2' })
      for (const m of [s.silUyari, s.silOnay, s.vazgec]) var_(html, m, `${dil} confirm`)
      assert.ok(html.indexOf(esc(s.silUyari)) < html.indexOf('data-eylem="sablon-sil-onayla"'), `${dil}: the warning comes after the confirmation`)
      assert.equal(say(html, /data-eylem="sablon-sil-onayla"/g), 1); assert.equal(say(html, /data-eylem="sablon-sil-vazgec"/g), 1)
      // the other template keeps its two buttons; the asked one has neither
      assert.equal(say(html, /data-eylem="sablon-sil"/g), 1); assert.equal(say(html, /data-eylem="sablon-duzenle"/g), 1)
      assert.ok(html.indexOf('data-sablon="s2"') < html.indexOf('data-alan="sablon-sil-onay"'))
      assert.equal(say(ekran(dil, SABLONLAR(), { silSorulan: 'another' }), /sablon-sil-onayla/g), 0)
    }
  })
})

describe('"my templates" — the picker', () => {
  const secici = (dil: DilKodu, sablonlar: Sablon[] | null, hedef = 's') => renderToStaticMarkup(h(E.SablonSecici, { x: x(dil), sablonlar, ekle: bos, hedef }))

  it('folded away, one button per template with its name only; says that the text is ADDED AT THE END; nothing at all where the list is not known', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil)
      assert.equal(secici(dil, null), '', `${dil}: a picker without a list`)
      const html = secici(dil, SABLONLAR())
      assert.match(html, /^<details class="[^"]*" data-alan="sablon-secici" data-hedef="s" data-sablon-adedi="2"><summary>/)
      assert.doesNotMatch(html, /<details[^>]* open/, 'the picker is open by itself')
      for (const m of [s.seciciEkle, s.seciciNot, `${QA} name one`, `${QA} name two`]) var_(html, m, `${dil} picker`)
      yok(html, `${QA} text one`, `${dil}: the picker shows the text before it is chosen`)
      assert.equal(say(html, /<button type="button"[^>]*data-sablon="s[12]"/g), 2)
      const bosHtml = secici(dil, [])
      var_(bosHtml, s.seciciBos, `${dil} empty picker`); assert.equal(say(bosHtml, /<button/g), 0)
      // the way to the screen where templates are kept, where the country has the tools area
      if (paket.ozellikler.araclar) for (const p of [html, bosHtml]) { assert.match(p, /href="[^"]*\?arac=sablonlarim" data-eylem="sablon-yonet"/); var_(p, s.yonet, `${dil} manage`) }
      temiz(gorunurMetin(html), `picker ${dil}`)
    }
  })

  it('IN A NOTE: under each of the four sections of a DRAFT, and nowhere on an APPROVED note', () => {
    if (!ACIK) return
    const dil = FORMLAR[0]
    const sablon = paket.uygulama?.roller?.[0] ?? A.genelSablon()
    const muayene = { seansId: 'v1', baslangic: GUN, sablon, hasta: { id: 'h1', ad: 'QA Patient', otaIsmi: '', dogumTarihi: '1990-05-05', cinsiyet: '' as const, telefon: '', dil: '', ulusalKimlik: '' }, konusma: null, metin: 'QA transcript', notId: 'n1', notDurumu: 'taslak' as const }
    const not = (onayli: boolean) => ({ notId: 'n1', seansId: 'v1', onayli, onayTarihi: onayli ? GUN : null, dil, icerik: { s: 'QA-S', o: 'QA-O', a: 'QA-A', p: 'QA-P' }, ikinci: null, yenidenYazilabilir: null, alanAnahtarlari: [], muayene }) as unknown as import('./uygulama/Not').NotDetayi
    const ciz = (onayli: boolean, ek: boolean) => cerceve(dil, h(Not.NotGorunumu, { m: A.uygulamaMetni(dil), not: not(onayli), aktifDil: dil, setAktifDil: bos, icerik: not(onayli).icerik, setIcerik: bos, islem: null, bildirim: null, kaydet: bos, yenidenYaz: bos, onayla: bos, ...(ek ? { sablonEki: (b: string) => h(E.SablonSecici, { x: x(dil), sablonlar: SABLONLAR(), ekle: bos, hedef: b }) } : {}) }))
    const taslak = ciz(false, true)
    for (const b of ['s', 'o', 'a', 'p']) {
      assert.equal(say(taslak, new RegExp(`data-alan="sablon-secici" data-hedef="${b}"`, 'g')), 1, `section ${b}`)
      assert.ok(taslak.indexOf(`id="uza-not-${b}"`) < taslak.indexOf(`data-hedef="${b}"`), `section ${b}: the picker is not under its own text box`)
    }
    assert.equal(say(ciz(false, false), /sablon-secici/g), 0, 'a picker where the country has no templates')
    assert.equal(say(ciz(true, true), /sablon-secici/g), 0, 'A PICKER ON AN APPROVED NOTE')
  })

  it('IN A MESSAGE: under the text box of the doctor\'s card', () => {
    if (!ACIK || !A.arayuz().mesajMetinleri) return
    const dil = FORMLAR[0]
    const html = cerceve(dil, h(Mesaj.HastaMesajGorunumu, { x: A.mesajMetni(dil).hekim, g: { yazismalar: [], erisim: 'acik' }, metin: '', setMetin: bos, gonder: bos, bekliyor: false, hata: null, kapatSorulan: null, kapatIste: bos, kapatOnayla: bos, kapatVazgec: bos, ek: h(E.SablonSecici, { x: x(dil), sablonlar: SABLONLAR(), ekle: bos, hedef: 'mesaj' }) }))
    assert.equal(say(html, /data-alan="sablon-secici" data-hedef="mesaj"/g), 1)
    assert.ok(html.indexOf('id="uza-mesaj-metin"') < html.indexOf('data-hedef="mesaj"') && html.indexOf('data-hedef="mesaj"') < html.indexOf('data-eylem="mesaj-gonder"'))
  })
})

describe('"my templates" — rules', () => {
  it('EVERY SENTENCE IS THE PACK\'S: the kit\'s files carry no text of their own and write no address by hand', () => {
    for (const d of ['components/ulke/uygulama/Sablonlarim.tsx', 'lib/ulke/sablon/sablon.ts', 'lib/ulke/sablon/sabitler.ts', 'lib/ulke/sablon/denetim.ts', 'app/api/ulke/sablonlar/route.ulke.ts']) {
      const k = kod(d)
      assert.doesNotMatch(k, /[^\x00-\x7F—–·…‹›«»]/, `${d} carries a letter outside ASCII: text belongs in a pack`)
      if (!d.endsWith('sabitler.ts')) assert.doesNotMatch(k, /['"`]\/(calendar|visit|patient|today|settings|portal|tools|api\/ulke)\b/, `${d} writes an address by hand`)
      assert.doesNotMatch(k, />\s*[A-Za-z][a-z]+ [a-z]+[^<{]*</, `${d} has a sentence written into the screen`)
      assert.doesNotMatch(k, /lib\/ai|countries\/active\/klinik|modelGecidi/, `${d} reaches for a model`)
    }
  })

  it('the tile opens the kit\'s own screen; the pickers are mounted only where the country has templates, and insert at the end by the doctor\'s click', () => {
    assert.match(kod('components/ulke/uygulama/Araclar.tsx'), /x\.tanim\.ekran === 'sablonlarim' \? <Sablonlarim u=\{u\} \/>/)
    const not = kod('components/ulke/uygulama/Not.tsx'), hastalar = kod('components/ulke/uygulama/Hastalar.tsx'), mesaj = kod('components/ulke/uygulama/HastaMesajlari.tsx')
    assert.match(not, /useSablonlar\(api, Boolean\(hesap\) && ozellikAcik\('hekimSablonlari'\) && not !== null && !not\.onayli, 'not'\)/)
    assert.match(not, /sablonEki=\{ozellikAcik\('hekimSablonlari'\) \? \(b, mesgul\) => <SablonSecici /)
    assert.match(not, /\[b\]: sonaEkle\(icerik\[b\], t\)/)
    assert.match(hastalar, /<HastaMesajKarti u=\{u\} hastaId=\{veri\.hasta\.id\} sablonlar=\{ozellikAcik\('hekimSablonlari'\)\} \/>/)
    assert.match(mesaj, /useSablonlar\(api, Boolean\(hesap\) && sablonlarAcik === true, 'mesaj'\)/)
    assert.match(mesaj, /sonaEkle\(eski, t, MESAJ_AZAMI\)/)
    // the picker hands the text over on a click and does nothing by itself
    const secici = kod('components/ulke/uygulama/Sablonlarim.tsx')
    assert.match(secici, /onClick=\{\(\) => ekle\(s\.metin\)\}/)
    assert.equal((secici.match(/ekle\(/g) ?? []).length, 1, 'a template is inserted from somewhere else than the click')
  })
})

describe('"my templates" — the catalogue', () => {
  it('is the same shape in every form, each entry is there, a sentence keeps its placeholders in every form, and nothing of another country is in it', () => {
    if (!ACIK) return
    const ilk = yaprak(x(FORMLAR[0]))
    assert.equal(ilk.length, 29, `${ilk.length} entries`)
    for (const dil of FORMLAR) {
      const y = yaprak(x(dil))
      assert.deepEqual(y.map((e) => e[0]), ilk.map((e) => e[0]), `${dil}: not the same keys as ${FORMLAR[0]}`)
      for (let n = 0; n < y.length; n++) {
        assert.ok(y[n][1].trim().length > 0, `${dil}/${y[n][0]} is empty`)
        assert.deepEqual([...y[n][1].matchAll(/%\d?/g)].map((e) => e[0]).sort(), [...ilk[n][1].matchAll(/%\d?/g)].map((e) => e[0]).sort(), `${dil}/${y[n][0]}: the placeholders differ from ${FORMLAR[0]}`)
        temiz(y[n][1], `templates catalogue ${dil}/${y[n][0]}`)
      }
      for (const k of ['cokUzun', 'cokFazla'] as const) assert.match(x(dil)[k], /%(?!\d)/, `${dil}/${k}`)
    }
  })
})
