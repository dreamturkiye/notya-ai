/**
 * NOTYA-UZ-MUAYENE-01 — the signed-in application of an UZBEKISTAN build (NOTYA_COUNTRY=uz), rendered and called
 * for real: first-login language question, settings, home.
 *
 *   1. TEXT: the catalogue exists in three forms (Uzbek Latin, Uzbek Cyrillic, Russian) with the same keys, each in
 *      its own script, and says at its top that it is machine-written and awaits native review.
 *   2. LEAK TEST over every screen in every form: nothing of Türkiye, no Turkish letter, no Turkish address.
 *   3. API: language choices are saved for the caller only, narrowed to the application's languages; an account of
 *      another country, or none, gets the same "no session".
 *
 * Real handlers and components; the database and auth are a stand-in (lib/ulke/testing/sahteVeritabani.ts).
 * Lives inside the pack, like the landing page's test: only a pack's own test may import the pack directly.
 * Synthetic accounts only.
 */
process.env.NOTYA_COUNTRY = 'uz'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0001'

// NOTYA-UZ-ACILIS-02: the pack's page entry now imports photographs and shared landing components.
import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import { sahteVeritabani } from '@/lib/ulke/testing/sahteVeritabani'

const KOK = resolve(__dirname, '../../..')
;(require as unknown as { extensions: Record<string, (m: { exports: unknown }) => void> }).extensions['.css'] = (m) => { m.exports = {} }

const vt = sahteVeritabani()
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: vt.createClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`this test may not use the network: ${String(g)}`) }) as typeof fetch

const A = '10000000-0000-4000-8000-00000000000a'
const B = '10000000-0000-4000-8000-00000000000b'
function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.sorgular.length = 0
  vt.boz.yaz.clear(); vt.boz.oku.clear()
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: A, email: 'qa-a@notya.test', app_metadata: { country: 'uz' } },
    'jeton-b': { id: B, email: 'qa-b@notya.test', app_metadata: { country: 'uz' } },
    'jeton-tr': { id: '10000000-0000-4000-8000-00000000000c', email: 'qa-tr@notya.test', app_metadata: { country: 'tr' } },
    'jeton-damgasiz': { id: '10000000-0000-4000-8000-00000000000d', email: 'qa-d@notya.test', app_metadata: {} },
  })
  vt.tablo('ulke_hesaplari').push(
    { id: A, full_name: 'QA Shifokor A', ulke: 'uz', ui_language: 'uz-Latn' },
    { id: B, full_name: 'QA Врач Б', ulke: 'uz', ui_language: 'ru' },
  )
}

const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
type Form = (typeof FORMLAR)[number]
const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak }), [])
/** Addresses and words of the pre-split application that must never appear on a screen of this build. */
const TURKCE_ADRES = /\/(giris|kayit|dashboard|doktor|doktor-tools|onboarding|asistan|portal|klinik|kvkk|session|intake|randevu)(\/|"|\?|$)/
const ekranTemiz = (html: string, kaynak: string) => {
  temiz(html, kaynak)
  temiz(gorunurMetin(html), `${kaynak} (visible text)`)
  assert.doesNotMatch(html, /[çğıİşĞŞ]/, `${kaynak}: a Turkish letter`)
  for (const m of html.matchAll(/(?:href|action)="([^"]+)"/g)) {
    if (m[1].startsWith('https://fonts.googleapis.com/')) continue
    assert.doesNotMatch(m[1], TURKCE_ADRES, `${kaynak}: links to a page of the pre-split application: ${m[1]}`)
    // NOTYA-UZ-MUAYENE-01: the build is served under /uzbek — an address outside it is another country's site.
    const adres = m[1].split('?')[0]
    assert.ok(adres === ON_EK || adres.startsWith(`${ON_EK}/`), `${kaynak}: "${m[1]}" is outside ${ON_EK}`)
    // "Never offer an address that answers not found": every link is a page this country's pack lists.
    const yol = adres.slice(ON_EK.length) || '/'
    assert.ok(ACIK_SAYFALAR.includes(yol), `${kaynak}: links to ${m[1]}, which is not a page of this build (${ACIK_SAYFALAR.join(' ')})`)
  }
}
let ACIK_SAYFALAR: readonly string[] = []
/** The path of the main site this build is served under (the pack's `yolOnEki`). */
const ON_EK = '/uzbek'
/** Every string of a catalogue, with its dotted key. */
function yaprak(o: unknown, on = ''): [string, string][] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : yaprak(v, `${on}${k}.`)))
}

describe('Uzbekistan application: text in three forms', () => {
  let M: typeof import('./metinler')
  before(async () => {
    M = await import('./metinler')
    const izin = (await import('@/lib/ulke/ulke')).ulkePaketi().rotalar
    assert.notEqual(izin, 'hepsi')
    if (izin !== 'hepsi') ACIK_SAYFALAR = izin.sayfalar
  })

  it('the catalogue says, at its top, that it is machine-written and awaits native review', () => {
    const bas = readFileSync(join(KOK, 'countries/uz/uygulama/metinler.ts'), 'utf8').slice(0, 1400)
    assert.match(bas, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./)
  })

  it('same keys in Uzbek Latin, Uzbek Cyrillic and Russian; nothing empty; the forms are the pack\'s application languages', async () => {
    const { ulkePaketi } = await import('@/lib/ulke/ulke')
    assert.deepEqual([...M.UZ_UYGULAMA_DILLERI], [...(ulkePaketi().uygulama?.diller ?? [])])
    assert.deepEqual(Object.keys(M.UZ_UYGULAMA_METINLERI).sort(), [...FORMLAR].sort())
    const anahtarlar = yaprak(M.UZ_UYGULAMA_METINLERI['uz-Latn']).map(([k]) => k)
    assert.ok(anahtarlar.length > 100, `catalogue looks too small: ${anahtarlar.length}`)
    for (const f of FORMLAR) {
      const y = yaprak(M.UZ_UYGULAMA_METINLERI[f])
      assert.deepEqual(y.map(([k]) => k), anahtarlar, f)
      for (const [k, v] of y) assert.ok(v.trim().length > 0, `${f}/${k} empty`)
    }
  })

  it('each form is written in its own script, and none is a copy of another', () => {
    const [lat, kir, ru] = FORMLAR.map((f) => yaprak(M.UZ_UYGULAMA_METINLERI[f]))
    for (let i = 0; i < lat.length; i++) {
      const [k, l] = lat[i]
      assert.doesNotMatch(l, /[Ѐ-ӿ]/, `uz-Latn/${k} has a Cyrillic letter`)
      // Uzbek Latin writes oʻ / gʻ with U+02BB and the tutuq belgisi with U+02BC — never an ASCII apostrophe.
      assert.doesNotMatch(l, /['`‘’]/, `uz-Latn/${k} uses a plain apostrophe`)
      assert.doesNotMatch(kir[i][1], /[A-Za-z]/, `uz-Cyrl/${k} has a Latin letter`)
      assert.doesNotMatch(ru[i][1], /[A-Za-zўқғҳЎҚҒҲ]/, `ru/${k} has a Latin or Uzbek-only letter`)
      assert.notEqual(kir[i][1], ru[i][1] === kir[i][1] && kir[i][1].length > 12 ? kir[i][1] : '', `uz-Cyrl/${k} is the Russian sentence`)
    }
    // Uzbek Cyrillic is Uzbek: across the catalogue it uses the letters Russian does not have.
    assert.match(kir.map(([, v]) => v).join(' '), /ў/); assert.match(kir.map(([, v]) => v).join(' '), /қ/)
    assert.match(kir.map(([, v]) => v).join(' '), /ғ/); assert.match(kir.map(([, v]) => v).join(' '), /ҳ/)
    temiz(FORMLAR.flatMap((f) => yaprak(M.UZ_UYGULAMA_METINLERI[f]).map(([, v]) => v)).join('\n'), 'application catalogue')
  })

  it('a form the country does not have is never shown: anything else is Uzbek in Latin script', () => {
    for (const ham of ['tr', 'en', '', null, undefined, 'uz', 'UZ-LATN']) assert.equal(M.uzUygulamaDili(ham), 'uz-Latn', String(ham))
    assert.equal(M.uygulamaMetni('tr').kabuk.cikis, 'Chiqish')
    assert.deepEqual([M.dilBirlestir('uz', 'Latn'), M.dilBirlestir('uz', 'Cyrl'), M.dilBirlestir('ru', 'Cyrl'), M.dilBirlestir('ru', 'Latn')], ['uz-Latn', 'uz-Cyrl', 'ru', 'ru'])
  })
})

describe('Uzbekistan application: screens (first-login question, settings, home)', () => {
  let Kabuk: typeof import('@/components/ulke/uygulama/Kabuk')
  let Baslangic: typeof import('@/components/ulke/uygulama/Baslangic')
  let Ayarlar: typeof import('@/components/ulke/uygulama/Ayarlar')
  let Bugun: typeof import('@/components/ulke/uygulama/Bugun')
  let Hastalar: typeof import('@/components/ulke/uygulama/Hastalar')
  let M: typeof import('./metinler')
  let Layout: typeof import('../../../app/layout.ulke')
  before(async () => {
    Kabuk = await import('@/components/ulke/uygulama/Kabuk')
    Baslangic = await import('@/components/ulke/uygulama/Baslangic')
    Ayarlar = await import('@/components/ulke/uygulama/Ayarlar')
    Bugun = await import('@/components/ulke/uygulama/Bugun')
    Hastalar = await import('@/components/ulke/uygulama/Hastalar')
    M = await import('./metinler')
    Layout = await import('../../../app/layout.ulke')
  })
  const belge = (sayfa: React.ReactElement) => renderToStaticMarkup(React.createElement(Layout.default, null, sayfa))
  const cerceve = (f: Form, aktif: 'bugun' | 'hastalar' | 'ayarlar', ic: React.ReactElement) =>
    belge(React.createElement(Kabuk.Cerceve, { dil: f, m: M.uygulamaMetni(f), ad: 'QA Shifokor', aktif, cikis: () => {}, children: ic }))

  it('the route pages render the pack\'s screens; before the account is known they show only "loading"', async () => {
    const { UYGULAMA_EKRANLARI } = await import('@/lib/ulke/tipler')
    const { UYGULAMA_EKRAN_BILESENLERI: UZ_UYGULAMA } = await import('@/components/ulke/uygulama')
    // Every screen the pack brings has its page, and the pack lists that page — and the other way round.
    for (const [ekran, yol] of Object.entries(UYGULAMA_EKRANLARI)) {
      const var_ = ekran in UZ_UYGULAMA
      assert.equal(ACIK_SAYFALAR.includes(yol), var_, `${yol}: the pack's page list and its screens disagree`)
      assert.equal(require('node:fs').existsSync(join(KOK, 'app', yol.slice(1), 'page.ulke.tsx')), var_, `${yol}: route file`)
    }
    assert.equal(Kabuk.HAZIR.muayene, 'muayene' in UZ_UYGULAMA, 'HAZIR.muayene must say whether the visit screen exists')
    for (const [dosya, ekran] of [['start', 'baslangic'], ['today', 'bugun'], ['settings', 'ayarlar'], ['patients', 'hastalar'], ['patients/new', 'yeniHasta'], ['patient', 'hasta']] as const) {
      const Sayfa = (await import(`../../../app/${dosya}/page.ulke`)) as { default: () => React.ReactElement }
      const html = belge(Sayfa.default())
      assert.ok(html.includes('Yuklanmoqda…'), dosya)
      assert.match(html, /<div class="uza" lang="uz-Latn"/, dosya)
      ekranTemiz(html, `/${dosya} (loading)`)
      const kaynak = readFileSync(join(KOK, `app/${dosya}/page.ulke.tsx`), 'utf8')
      assert.match(kaynak, new RegExp(`<UlkeUygulamaSayfasi ekran="${ekran}" />`))
    }
  })

  for (const f of FORMLAR) {
    const temel = f === 'ru' ? 'ru' : 'uz'
    const yazi = f === 'uz-Cyrl' ? 'Cyrl' : 'Latn'

    it(`${f}: first-login question — "Uzbek or Russian?", and for Uzbek "Latin or Cyrillic?"`, () => {
      const m = M.uygulamaMetni(f)
      const html = belge(React.createElement(Baslangic.BaslangicGorunumu, { temel, yazi, setTemel: () => {}, setYazi: () => {}, gonder: () => {}, bekliyor: false, hata: false }))
      assert.match(html, new RegExp(`<div class="uza" lang="${f}"`))
      for (const s of [m.baslangic.baslik, m.baslangic.aciklama, m.baslangic.devam]) assert.ok(gorunurMetin(html).includes(s), s)
      // Each language is offered in its own language, whatever the screen's language is.
      assert.ok(html.includes('>Русский</span>'))
      assert.ok(html.includes(yazi === 'Cyrl' ? '>Ўзбекча</span>' : '>Oʻzbekcha</span>'))
      const secenekler = (ad: string) => [...html.matchAll(/<input\b[^>]*>/g)].map((x) => x[0]).filter((x) => x.includes(`name="${ad}"`)).map((x) => /value="([^"]+)"/.exec(x)![1])
      assert.deepEqual(secenekler('dil'), ['uz', 'ru'])
      // The script question exists only for Uzbek, with each script named in that script.
      assert.deepEqual(secenekler('yazi'), temel === 'uz' ? ['Latn', 'Cyrl'] : [])
      if (temel === 'uz') assert.ok(html.includes('>Lotin yozuvi</span>') && html.includes('>Кирилл ёзуви</span>'))
      // No way out of the question except answering it: no navigation.
      assert.doesNotMatch(html, /class="uza-nav"/)
      ekranTemiz(html, `/start (${f})`)
    })

    it(`${f}: settings — interface language, note language, script`, () => {
      const m = M.uygulamaMetni(f)
      const html = cerceve(f, 'ayarlar', React.createElement(Ayarlar.AyarlarGorunumu, { m, d: { arayuz: temel, not: temel, yazi }, set: () => {}, gonder: () => {}, bekliyor: false, sonuc: 'tamam' }))
      for (const s of [m.ayarlar.baslik, m.ayarlar.arayuzDili, m.ayarlar.notDili, m.ayarlar.kaydet, m.ayarlar.kaydedildi, m.kabuk.bugun, m.kabuk.hastalar, m.kabuk.ayarlar, m.kabuk.cikis]) assert.ok(gorunurMetin(html).includes(s), s)
      assert.equal(gorunurMetin(html).includes(m.ayarlar.yazi), temel === 'uz', 'the script question is shown only while Uzbek is in use')
      assert.match(html, /aria-current="page">[^<]+<\/a>/)
      ekranTemiz(html, `/settings (${f})`)
    })

    it(`${f}: home — today's visits, patient search, new patient, start a visit`, () => {
      const m = M.uygulamaMetni(f)
      const muayeneler = [
        { seansId: 's1', notId: 'n1', hastaId: 'h1', hastaAdi: 'QA Bemor Karimova', baslangic: '2026-10-08T04:30:00Z', durum: 'taslak' as const },
        { seansId: 's2', notId: 'n2', hastaId: 'h2', hastaAdi: 'QA Пациент Иванов', baslangic: '2026-10-08T06:05:00Z', durum: 'onayli' as const },
        { seansId: 's3', notId: null, hastaId: null, hastaAdi: '', baslangic: '2026-10-08T07:00:00Z', durum: 'notsuz' as const },
      ]
      const html = cerceve(f, 'bugun', React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA Shifokor', muayeneler, hata: false }))
      const g = gorunurMetin(html)
      for (const s of [m.bugun.selam, m.bugun.baslik, m.bugun.yeniHasta, m.arama.etiket, m.arama.ornek, m.arama.dugme, m.durum.taslak, m.durum.onayli, m.bugun.hastasiz, 'QA Bemor Karimova']) assert.ok(g.includes(s), s)
      // Times are shown in Tashkent time (UTC+5), digits only.
      assert.ok(g.includes('09:30') && g.includes('11:05') && g.includes('12:00'))
      for (const h of ['/uzbek/today', '/uzbek/settings', '/uzbek/patients/new', '/uzbek/patients', ...(Kabuk.HAZIR.muayene ? ['/uzbek/visit', '/uzbek/visit?not=n1'] : [])]) assert.ok(html.includes(`href="${h}"`), h)
      // A screen that has not landed is not linked at all (it would answer "not found").
      assert.equal(html.includes('href="/uzbek/visit'), Kabuk.HAZIR.muayene)
      assert.doesNotMatch(html, /href="\/(?!uzbek[\/"?#])/, 'a link outside the path prefix')
      assert.equal(g.includes(m.bugun.muayeneBaslat), Kabuk.HAZIR.muayene)
      assert.match(html, /<form class="uza-arama" action="\/uzbek\/patients" method="get"/)
      ekranTemiz(html, `/today (${f})`)
      const bos = cerceve(f, 'bugun', React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA', muayeneler: [], hata: false }))
      assert.ok(gorunurMetin(bos).includes(m.bugun.bos))
    })
  }

  for (const f of FORMLAR) {
    const HASTA = { id: '30000000-0000-4000-8000-000000000001', ad: 'QA Karimova Dilnoza', otaIsmi: 'Rustam qizi', dogumTarihi: '2021-03-07', cinsiyet: 'female' as const, telefon: '+998 90 000 00 01', dil: 'uz', ulusalKimlik: '00000000000001' }

    it(`${f}: patients — list with search, and the empty states`, () => {
      const m = M.uygulamaMetni(f)
      const html = cerceve(f, 'hastalar', React.createElement(Hastalar.HastalarGorunumu, { m, q: 'karim', hastalar: [HASTA, { ...HASTA, id: 'x2', ad: 'QA Иванов Пётр', otaIsmi: '', dil: 'ru' }], hata: false }))
      const g = gorunurMetin(html)
      for (const x of [m.hastalar.baslik, m.bugun.yeniHasta, m.arama.etiket, 'QA Karimova Dilnoza Rustam qizi', 'QA Иванов Пётр', '07.03.2021', 'karim']) assert.ok(g.includes(x), x)
      assert.ok(html.includes(`href="/uzbek/patient?id=${HASTA.id}"`))
      ekranTemiz(html, `/patients (${f})`)
      const bos = (q: string) => gorunurMetin(cerceve(f, 'hastalar', React.createElement(Hastalar.HastalarGorunumu, { m, q, hastalar: [], hata: false })))
      assert.ok(bos('').includes(m.hastalar.bos)); assert.ok(bos('zzz').includes(m.arama.sonucYok))
    })

    it(`${f}: new patient — name, patronymic, birth date, sex, phone, the patient's language, optional identity number`, () => {
      const m = M.uygulamaMetni(f)
      const html = cerceve(f, 'hastalar', React.createElement(Hastalar.YeniHastaGorunumu, { m, dil: f, a: Hastalar.BOS_HASTA, set: () => {}, gonder: () => {}, bekliyor: false, hata: 'dil', telefonOrnek: '+998 90 123 45 67' }))
      const g = gorunurMetin(html)
      const y = m.yeniHasta
      for (const x of [y.baslik, y.ad, y.otaIsmi, y.istegeBagli, y.dogumTarihi, y.cinsiyet, y.kadin, y.erkek, y.telefon, y.dil, y.ulusalKimlik, y.kaydet, y.iptal, y.dilGerekli]) assert.ok(g.includes(x ?? "\u0000"), String(x))
      const girdiler = [...html.matchAll(/<input\b[^>]*>/g)].map((x) => x[0])
      assert.deepEqual(girdiler.filter((x) => x.includes('name="hasta-dili"')).map((x) => /value="([^"]+)"/.exec(x)![1]), ['uz', 'ru'])
      assert.ok(html.includes('>Русский</span>'), 'Russian is offered in Russian')
      // Nothing of Türkiye's patient form: no Turkish identity number, no field that validates one.
      assert.doesNotMatch(html, /maxLength="11"|pattern=/i)
      assert.doesNotMatch(html, /required/)
      ekranTemiz(html, `/patients/new (${f})`)
    })

    it(`${f}: patient file — details in the doctor's language, approved notes, drafts`, () => {
      const m = M.uygulamaMetni(f)
      const muayeneler = [
        { seansId: 's1', notId: 'n1', baslangic: '2026-10-07T20:30:00Z', durum: 'onayli' as const },
        { seansId: 's2', notId: 'n2', baslangic: '2026-10-08T05:00:00Z', durum: 'taslak' as const },
        { seansId: 's3', notId: null, baslangic: '2026-10-08T06:00:00Z', durum: 'notsuz' as const },
      ]
      const html = cerceve(f, 'hastalar', React.createElement(Hastalar.HastaDosyasiGorunumu, { m, hasta: HASTA, muayeneler, bugun: new Date('2026-10-08T12:00:00Z') }))
      const g = gorunurMetin(html)
      for (const x of [m.hasta.baslik, 'QA Karimova Dilnoza Rustam qizi', '07.03.2021', m.hasta.yas, '5', m.yeniHasta.kadin, '+998 90 000 00 01', m.diller.uz, '00000000000001', m.hasta.notlar, m.hasta.taslaklar, m.durum.onayli, m.durum.taslak, '08.10.2026']) assert.ok(g.includes(x), x)
      assert.equal(html.includes(`href="/uzbek/visit?hasta=${HASTA.id}"`), Kabuk.HAZIR.muayene)
      ekranTemiz(html, `/patient (${f})`)
      const bos = gorunurMetin(cerceve(f, 'hastalar', React.createElement(Hastalar.HastaDosyasiGorunumu, { m, hasta: { ...HASTA, otaIsmi: '', dogumTarihi: '', cinsiyet: '', telefon: '', ulusalKimlik: '' }, muayeneler: [] })))
      assert.ok(bos.includes(m.hasta.notYok)); assert.ok(!bos.includes(m.hasta.yas)); assert.ok(!bos.includes(m.hasta.taslaklar))
    })
  }

  it('age: whole years, months under two years, nothing without a birth date', () => {
    const m = M.uygulamaMetni('uz-Latn')
    const bugun = new Date('2026-10-08T12:00:00Z')
    assert.equal(Hastalar.yasYaz(m, '2021-03-07', bugun), '5')
    assert.equal(Hastalar.yasYaz(m, '2026-03-09', bugun), '6 oy')
    assert.equal(Hastalar.yasYaz(m, '2024-10-09', bugun), '23 oy')
    assert.equal(Hastalar.yasYaz(m, '2024-10-08', bugun), '2')
    assert.equal(Hastalar.yasYaz(M.uygulamaMetni('ru'), '2026-03-09', bugun), '6 мес.')
    assert.equal(Hastalar.yasYaz(m, '', bugun), ''); assert.equal(Hastalar.yasYaz(m, '2027-01-01', bugun), '')
  })

  it('settings read the account as two languages and one script', () => {
    assert.deepEqual(Ayarlar.ayarDurumu({ dil: 'ru', notDili: 'uz-Cyrl' }), { arayuz: 'ru', not: 'uz', yazi: 'Cyrl' })
    assert.deepEqual(Ayarlar.ayarDurumu({ dil: 'uz-Latn', notDili: 'ru' }), { arayuz: 'uz', not: 'ru', yazi: 'Latn' })
    assert.deepEqual(Ayarlar.ayarDurumu({ dil: 'ru', notDili: 'ru' }), { arayuz: 'ru', not: 'ru', yazi: 'Latn' })
  })

  it('dates and times are digits in the country\'s time zone — no month name to translate', () => {
    assert.equal(Kabuk.tarihYaz('2019-03-07'), '07.03.2019')
    assert.equal(Kabuk.tarihYaz('2026-10-07T20:30:00Z'), '08.10.2026') // already the 8th in Tashkent
    assert.equal(Kabuk.saatYaz('2026-10-07T20:30:00Z'), '01:30')
    assert.equal(Kabuk.tarihYaz('yo-q'), '')
  })
})

describe('Uzbekistan application: language choices API', () => {
  let tercihler: typeof import('../../../app/api/ulke/tercihler/route.ulke')
  let hesapRota: typeof import('../../../app/api/ulke/hesap/route.ulke')
  let bugun: typeof import('../../../app/api/ulke/bugun/route.ulke')
  let NextRequest: typeof import('next/server').NextRequest
  before(async () => {
    tercihler = await import('../../../app/api/ulke/tercihler/route.ulke')
    hesapRota = await import('../../../app/api/ulke/hesap/route.ulke')
    bugun = await import('../../../app/api/ulke/bugun/route.ulke')
    NextRequest = (await import('next/server')).NextRequest
  })
  beforeEach(sifirla)

  const istek = (yol: string, jeton?: string, govde?: unknown) => new NextRequest(`https://uz.notya.test${yol}`, {
    method: govde === undefined ? 'GET' : 'POST',
    headers: { ...(jeton ? { authorization: `Bearer ${jeton}` } : {}), 'content-type': 'application/json' },
    ...(govde === undefined ? {} : { body: typeof govde === 'string' ? govde : JSON.stringify(govde) }),
  })
  const cevap = async (r: Response) => { const j = await r.json(); temiz(JSON.stringify(j), 'API answer'); return { s: r.status, j } }
  const hesap = async (jeton: string) => (await cevap(await hesapRota.GET(istek('/api/ulke/hesap', jeton)))).j

  it('first login: the question has not been answered; notes follow the interface language', async () => {
    assert.deepEqual(await hesap('jeton-a'), { ulke: 'uz', dil: 'uz-Latn', durum: 'uygulama', ad: 'QA Shifokor A', notDili: 'uz-Latn', dilSoruldu: false })
    assert.deepEqual(await hesap('jeton-b'), { ulke: 'uz', dil: 'ru', durum: 'uygulama', ad: 'QA Врач Б', notDili: 'ru', dilSoruldu: false })
  })

  it('answering sets the interface language and the note language, for the caller only', async () => {
    assert.deepEqual(await cevap(await tercihler.POST(istek('/api/ulke/tercihler', 'jeton-a', { arayuzDili: 'uz-Cyrl', notDili: 'uz-Cyrl' }))), { s: 200, j: { ok: true, dil: 'uz-Cyrl', notDili: 'uz-Cyrl' } })
    assert.deepEqual(await hesap('jeton-a'), { ulke: 'uz', dil: 'uz-Cyrl', durum: 'uygulama', ad: 'QA Shifokor A', notDili: 'uz-Cyrl', dilSoruldu: true })
    // The other doctor is untouched.
    assert.deepEqual(await hesap('jeton-b'), { ulke: 'uz', dil: 'ru', durum: 'uygulama', ad: 'QA Врач Б', notDili: 'ru', dilSoruldu: false })
    assert.deepEqual(vt.tablo('hekim_dil_tercihleri').map((s) => s.doctor_id), [A])
    assert.equal(vt.tablo('ulke_hesaplari').find((u) => u.id === A)!.ulke, 'uz', 'the country stamp is not something this route writes')
    // Settings: interface in Russian, notes in Uzbek Latin — both stay changeable.
    assert.equal((await tercihler.POST(istek('/api/ulke/tercihler', 'jeton-a', { arayuzDili: 'ru', notDili: 'uz-Latn' }))).status, 200)
    assert.deepEqual(await hesap('jeton-a'), { ulke: 'uz', dil: 'ru', durum: 'uygulama', ad: 'QA Shifokor A', notDili: 'uz-Latn', dilSoruldu: true })
    assert.equal(vt.tablo('hekim_dil_tercihleri').length, 1)
  })

  it('a language the application does not offer is refused — Turkish above all — and nothing is written', async () => {
    for (const g of [{ arayuzDili: 'tr', notDili: 'uz-Latn' }, { arayuzDili: 'uz-Latn', notDili: 'tr' }, { arayuzDili: 'en', notDili: 'en' }, { arayuzDili: 'uz', notDili: 'ru' }, { notDili: 'ru' }, {}, 'not json']) {
      const r = await cevap(await tercihler.POST(istek('/api/ulke/tercihler', 'jeton-a', g)))
      assert.equal(r.s, 400, JSON.stringify(g)); assert.equal(r.j.code, 'GECERSIZ')
    }
    assert.deepEqual(vt.tablo('hekim_dil_tercihleri'), [])
    assert.equal(vt.tablo('ulke_hesaplari').find((u) => u.id === A)!.ui_language, 'uz-Latn')
  })

  it('a body cannot name another account: only the caller\'s rows are written', async () => {
    await tercihler.POST(istek('/api/ulke/tercihler', 'jeton-a', { arayuzDili: 'ru', notDili: 'ru', doctor_id: B, id: B, doktorId: B }))
    assert.deepEqual(vt.tablo('hekim_dil_tercihleri').map((s) => s.doctor_id), [A])
    assert.equal(vt.tablo('ulke_hesaplari').find((u) => u.id === B)!.ui_language, 'ru')
    for (const q of vt.sorgular.filter((x) => x.islem !== 'select')) assert.ok(!q.filtreler.join(' ').includes(B), JSON.stringify(q))
  })

  it('no session, an account of another country and an unstamped account all get the same "no session", on every route', async () => {
    for (const jeton of [undefined, 'jeton-olmayan', 'jeton-tr', 'jeton-damgasiz']) {
      assert.deepEqual(await cevap(await tercihler.POST(istek('/api/ulke/tercihler', jeton, { arayuzDili: 'ru', notDili: 'ru' }))), { s: 401, j: { code: 'OTURUM_YOK' } }, String(jeton))
      assert.deepEqual(await cevap(await bugun.GET(istek('/api/ulke/bugun', jeton))), { s: 401, j: { code: 'OTURUM_YOK' } }, String(jeton))
    }
    assert.deepEqual(vt.tablo('hekim_dil_tercihleri'), [])
  })

  it('if the choice cannot be saved the answer is a code, and the question stays unanswered', async () => {
    vt.boz.yaz.add('hekim_dil_tercihleri')
    assert.deepEqual(await cevap(await tercihler.POST(istek('/api/ulke/tercihler', 'jeton-a', { arayuzDili: 'ru', notDili: 'ru' }))), { s: 500, j: { code: 'BASARISIZ' } })
    vt.boz.yaz.clear()
    assert.equal((await hesap('jeton-a')).dilSoruldu, false)
    // A database without migration 130: the account still gets in, and is simply asked.
    vt.boz.oku.add('hekim_dil_tercihleri')
    assert.equal((await hesap('jeton-a')).dilSoruldu, false)
  })

  it('home: today\'s visits and appointments (NOTYA-UZ-RANDEVU-01) of a doctor with none', async () => {
    assert.deepEqual(await cevap(await bugun.GET(istek('/api/ulke/bugun', 'jeton-a'))), { s: 200, j: { muayeneler: [], randevular: [] } })
  })
})

describe('Uzbekistan application: patients API and patient isolation', () => {
  let hastalar: typeof import('../../../app/api/ulke/hastalar/route.ulke')
  let hasta: typeof import('../../../app/api/ulke/hasta/route.ulke')
  let bugun: typeof import('../../../app/api/ulke/bugun/route.ulke')
  let NextRequest: typeof import('next/server').NextRequest
  before(async () => {
    hastalar = await import('../../../app/api/ulke/hastalar/route.ulke')
    hasta = await import('../../../app/api/ulke/hasta/route.ulke')
    bugun = await import('../../../app/api/ulke/bugun/route.ulke')
    NextRequest = (await import('next/server')).NextRequest
  })
  beforeEach(sifirla)

  const istek = (yol: string, jeton?: string, govde?: unknown) => new NextRequest(`https://uz.notya.test${yol}`, {
    method: govde === undefined ? 'GET' : 'POST',
    headers: { ...(jeton ? { authorization: `Bearer ${jeton}` } : {}), 'content-type': 'application/json' },
    ...(govde === undefined ? {} : { body: typeof govde === 'string' ? govde : JSON.stringify(govde) }),
  })
  const cevap = async (r: Response) => { const j = await r.json(); temiz(JSON.stringify(j), 'API answer'); return { s: r.status, j } }
  const ekle = async (jeton: string, g: Record<string, unknown>) => cevap(await hastalar.POST(istek('/api/ulke/hastalar', jeton, g)))
  const liste = async (jeton: string, q = '') => (await cevap(await hastalar.GET(istek(`/api/ulke/hastalar${q ? `?q=${encodeURIComponent(q)}` : ''}`, jeton)))).j.hastalar as { id: string; ad: string }[]
  const KARIMOVA = { ad: '  QA Karimova   Dilnoza ', otaIsmi: 'Rustam qizi', dogumTarihi: '2021-03-07', cinsiyet: 'female', telefon: '+998 90 000 00 01', dil: 'uz', ulusalKimlik: '00000000000001' }
  const IVANOV = { ad: 'QA Иванов Пётр', otaIsmi: 'Сергеевич', dogumTarihi: '1980-12-31', cinsiyet: 'male', telefon: '', dil: 'ru', ulusalKimlik: '' }

  it('create and read back: every field, the patient\'s language per patient, nothing Turkish stored', async () => {
    const r = await ekle('jeton-a', KARIMOVA)
    assert.equal(r.s, 200)
    const { id, olusturuldu, ...alanlar } = r.j.hasta
    assert.match(id, /^[0-9a-f-]{36}$/); assert.ok(olusturuldu)
    assert.deepEqual(alanlar, { ad: 'QA Karimova Dilnoza', otaIsmi: 'Rustam qizi', dogumTarihi: '2021-03-07', cinsiyet: 'female', telefon: '+998 90 000 00 01', dil: 'uz', ulusalKimlik: '00000000000001' })
    assert.equal((await ekle('jeton-a', IVANOV)).j.hasta.dil, 'ru')
    const dosya = await cevap(await hasta.GET(istek(`/api/ulke/hasta?id=${id}`, 'jeton-a')))
    assert.equal(dosya.s, 200)
    assert.deepEqual({ ...dosya.j.hasta, olusturuldu: undefined }, { ...r.j.hasta, olusturuldu: undefined })
    assert.deepEqual(dosya.j.muayeneler, [])
    // In the database: the doctor is the caller, personal data is encrypted, and no Turkish identity number exists.
    const [satir] = vt.tablo('ulke_hastalar')
    assert.equal(satir.doctor_id, A)
    assert.ok(!('tc_kimlik_hash' in satir) || satir.tc_kimlik_hash == null)
    const ham = JSON.stringify(vt.tablolar)
    for (const acik of ['Karimova', 'Rustam', '2021-03-07', '+998 90 000 00 01', '00000000000001', 'Иванов', 'Сергеевич']) assert.ok(!ham.includes(acik), `stored in the clear: ${acik}`)
    const [ek] = vt.tablo('hasta_ulke_bilgisi')
    assert.deepEqual([ek.patient_id, ek.doctor_id, ek.dil], [id, A, 'uz'])
  })

  it('only the name and the patient\'s language are required; the identity number is not validated', async () => {
    const r = await ekle('jeton-a', { ad: 'QA Yolgʻiz Ism', dil: 'uz', ulusalKimlik: 'AB-12 / yoʻq' })
    assert.equal(r.s, 200)
    assert.deepEqual([r.j.hasta.otaIsmi, r.j.hasta.dogumTarihi, r.j.hasta.cinsiyet, r.j.hasta.telefon, r.j.hasta.ulusalKimlik], ['', '', '', '', 'AB-12 / yoʻq'])
    const vakalar: [Record<string, unknown> | string, string][] = [
      [{ ...KARIMOVA, ad: '' }, 'ad'], [{ ...KARIMOVA, ad: 'x' }, 'ad'], [{ ...KARIMOVA, ad: 12345 }, 'ad'], ['not json', 'ad'],
      [{ ...KARIMOVA, dogumTarihi: '2021-02-30' }, 'dogumTarihi'], [{ ...KARIMOVA, dogumTarihi: '07.03.2021' }, 'dogumTarihi'], [{ ...KARIMOVA, dogumTarihi: '2999-01-01' }, 'dogumTarihi'], [{ ...KARIMOVA, dogumTarihi: '1700-01-01' }, 'dogumTarihi'],
      [{ ...KARIMOVA, cinsiyet: 'Kadin' }, 'cinsiyet'],
      [{ ...KARIMOVA, dil: '' }, 'dil'], [{ ...KARIMOVA, dil: 'tr' }, 'dil'], [{ ...KARIMOVA, dil: 'uz-Latn' }, 'dil'], [{ ...KARIMOVA, dil: undefined }, 'dil'],
    ]
    for (const [g, alan] of vakalar) assert.deepEqual(await ekle('jeton-a', g as Record<string, unknown>), { s: 400, j: { code: 'GECERSIZ', alan } }, JSON.stringify(g).slice(0, 80))
    assert.equal(vt.tablo('ulke_hastalar').length, 1)
  })

  it('find: by name in either script, by patronymic, by phone digits; sorted by name', async () => {
    await ekle('jeton-a', KARIMOVA); await ekle('jeton-a', IVANOV)
    await ekle('jeton-a', { ad: 'QA Gʻulomov Hasan', dil: 'uz', telefon: '90 555 44 33' })
    // Order is the collation of the pack's locale (uz-Latn-UZ): in the Uzbek Latin alphabet Gʻ comes after Z.
    assert.deepEqual((await liste('jeton-a')).map((h) => h.ad), ['QA Karimova Dilnoza', 'QA Gʻulomov Hasan', 'QA Иванов Пётр'])
    const bul = async (q: string) => (await liste('jeton-a', q)).map((h) => h.ad)
    for (const q of ['karimova', 'КАРИМОВА', 'Каримова Дилноза', 'dilnoza karim', 'rustam']) assert.deepEqual(await bul(q), ['QA Karimova Dilnoza'], q)
    for (const q of ['Иванов', 'ivanov', 'Ivanov Pyotr', 'сергеевич']) assert.deepEqual(await bul(q), ['QA Иванов Пётр'], q)
    for (const q of ['Gʻulomov', "G'ulomov", 'Gulomov', 'Ғуломов', 'Ғуломов Ҳасан', 'Xasan', 'Khasan']) assert.deepEqual(await bul(q), ['QA Gʻulomov Hasan'], q)
    assert.deepEqual(await bul('555 44'), ['QA Gʻulomov Hasan'])
    assert.deepEqual(await bul('0000 01'), ['QA Karimova Dilnoza'])
    assert.deepEqual(await bul('zzz'), [])
  })

  it('ISOLATION: a doctor lists, finds and opens only their own patients — in both directions', async () => {
    const a = (await ekle('jeton-a', KARIMOVA)).j.hasta
    const b = (await ekle('jeton-b', { ...IVANOV, ad: 'QA GIZLI-B Иванов' })).j.hasta
    for (const [jeton, kendi, yabanci] of [['jeton-a', a, b], ['jeton-b', b, a]] as const) {
      assert.deepEqual((await liste(jeton)).map((h) => h.id), [kendi.id], jeton)
      for (const q of ['QA', 'karimova', 'иванов', 'GIZLI', '0000', '998']) {
        const idler = (await liste(jeton, q)).map((h) => h.id)
        assert.ok(!idler.includes(yabanci.id), `${jeton} found the other doctor's patient with "${q}"`)
      }
      // Positive control: the route does read a file — the caller's own.
      assert.equal((await cevap(await hasta.GET(istek(`/api/ulke/hasta?id=${kendi.id}`, jeton)))).s, 200)
      // The other doctor's patient: the same answer as an id that does not exist, and nothing of the patient in it.
      const r = await hasta.GET(istek(`/api/ulke/hasta?id=${yabanci.id}`, jeton))
      const govde = await r.text()
      assert.equal(r.status, 404); assert.equal(govde, '{"code":"NOT_FOUND"}')
      assert.equal(await (await hasta.GET(istek('/api/ulke/hasta?id=30000000-0000-4000-8000-00000000dead', jeton))).text(), govde)
    }
    for (const id of ['', 'abc', "' or 1=1 --", `${a.id},${b.id}`]) assert.equal((await hasta.GET(istek(`/api/ulke/hasta?id=${encodeURIComponent(id)}`, 'jeton-b'))).status, 404, id)
  })

  it('ISOLATION: a body cannot create a patient for another doctor, and every patient query carries the caller\'s id', async () => {
    const r = await ekle('jeton-a', { ...KARIMOVA, doctor_id: B, doktorId: B, id: '30000000-0000-4000-8000-000000000bad', patient_id: 'x' })
    assert.equal(r.s, 200)
    assert.deepEqual(vt.tablo('ulke_hastalar').map((s) => s.doctor_id), [A])
    assert.notEqual(r.j.hasta.id, '30000000-0000-4000-8000-000000000bad')
    assert.deepEqual(await liste('jeton-b'), [])
    await liste('jeton-a', 'karim'); await hasta.GET(istek(`/api/ulke/hasta?id=${r.j.hasta.id}`, 'jeton-a')); await bugun.GET(istek('/api/ulke/bugun', 'jeton-a'))
    const hastaTablolari = new Set(['ulke_hastalar', 'hasta_ulke_bilgisi', 'ulke_muayeneler', 'ulke_notlar'])
    const sorgular = vt.sorgular.filter((q) => hastaTablolari.has(q.tablo) && q.islem !== 'insert')
    assert.ok(sorgular.length >= 6, 'the routes did not run')
    for (const q of sorgular) assert.ok(q.filtreler.some((f) => f === `doctor_id=eq.${A}` || f === `doctor_id=eq.${B}`), `a query on ${q.tablo} without the doctor: ${JSON.stringify(q)}`)
  })

  it('a patient whose language record cannot be written is not saved at all', async () => {
    vt.boz.yaz.add('hasta_ulke_bilgisi')
    // The stand-in fails every write on the table it is told to break; the clean-up delete is on `patients`.
    assert.deepEqual(await ekle('jeton-a', KARIMOVA), { s: 500, j: { code: 'BASARISIZ' } })
    assert.deepEqual(vt.tablo('ulke_hastalar'), [])
  })

  it('no session, another country\'s account: "no session" on every patient route, nothing read', async () => {
    const a = (await ekle('jeton-a', KARIMOVA)).j.hasta
    for (const jeton of [undefined, 'jeton-olmayan', 'jeton-tr', 'jeton-damgasiz']) {
      for (const r of [await hastalar.GET(istek('/api/ulke/hastalar', jeton)), await hastalar.POST(istek('/api/ulke/hastalar', jeton, KARIMOVA)), await hasta.GET(istek(`/api/ulke/hasta?id=${a.id}`, jeton))]) {
        assert.deepEqual(await cevap(r), { s: 401, j: { code: 'OTURUM_YOK' } }, String(jeton))
      }
    }
    assert.equal(vt.tablo('ulke_hastalar').length, 1)
  })
})
