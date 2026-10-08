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
  vt.tablo('users').push(
    { id: A, full_name: 'QA Shifokor A', country: 'uz', ui_language: 'uz-Latn' },
    { id: B, full_name: 'QA Врач Б', country: 'uz', ui_language: 'ru' },
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
    assert.match(m[1], /^\/(start|today|settings|patients|patients\/new|patient|visit|login)?(\?[^"]*)?$/, `${kaynak}: unexpected address ${m[1]}`)
  }
}
/** Every string of a catalogue, with its dotted key. */
function yaprak(o: unknown, on = ''): [string, string][] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : yaprak(v, `${on}${k}.`)))
}

describe('Uzbekistan application: text in three forms', () => {
  let M: typeof import('./metinler')
  before(async () => { M = await import('./metinler') })

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
  let Kabuk: typeof import('./Kabuk')
  let Baslangic: typeof import('./Baslangic')
  let Ayarlar: typeof import('./Ayarlar')
  let Bugun: typeof import('./Bugun')
  let M: typeof import('./metinler')
  let Layout: typeof import('../../../app/layout.ulke')
  before(async () => {
    Kabuk = await import('./Kabuk')
    Baslangic = await import('./Baslangic')
    Ayarlar = await import('./Ayarlar')
    Bugun = await import('./Bugun')
    M = await import('./metinler')
    Layout = await import('../../../app/layout.ulke')
  })
  const belge = (sayfa: React.ReactElement) => renderToStaticMarkup(React.createElement(Layout.default, null, sayfa))
  const cerceve = (f: Form, aktif: 'bugun' | 'hastalar' | 'ayarlar', ic: React.ReactElement) =>
    belge(React.createElement(Kabuk.Cerceve, { dil: f, m: M.uygulamaMetni(f), ad: 'QA Shifokor', aktif, cikis: () => {}, children: ic }))

  it('the route pages render the pack\'s screens; before the account is known they show only "loading"', async () => {
    for (const [dosya, ekran] of [['start', 'baslangic'], ['today', 'bugun'], ['settings', 'ayarlar']] as const) {
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
      for (const s of [m.bugun.selam, m.bugun.baslik, m.bugun.muayeneBaslat, m.bugun.yeniHasta, m.arama.etiket, m.arama.ornek, m.arama.dugme, m.durum.taslak, m.durum.onayli, m.bugun.hastasiz, 'QA Bemor Karimova']) assert.ok(g.includes(s), s)
      // Times are shown in Tashkent time (UTC+5), digits only.
      assert.ok(g.includes('09:30') && g.includes('11:05') && g.includes('12:00'))
      for (const h of ['/visit', '/patients/new', '/patients', '/visit?not=n1']) assert.ok(html.includes(`href="${h}"`), h)
      assert.match(html, /<form class="uza-arama" action="\/patients" method="get"/)
      ekranTemiz(html, `/today (${f})`)
      const bos = cerceve(f, 'bugun', React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA', muayeneler: [], hata: false }))
      assert.ok(gorunurMetin(bos).includes(m.bugun.bos))
    })
  }

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
    assert.equal(vt.tablo('users').find((u) => u.id === A)!.country, 'uz', 'the country stamp is not something this route writes')
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
    assert.equal(vt.tablo('users').find((u) => u.id === A)!.ui_language, 'uz-Latn')
  })

  it('a body cannot name another account: only the caller\'s rows are written', async () => {
    await tercihler.POST(istek('/api/ulke/tercihler', 'jeton-a', { arayuzDili: 'ru', notDili: 'ru', doctor_id: B, id: B, doktorId: B }))
    assert.deepEqual(vt.tablo('hekim_dil_tercihleri').map((s) => s.doctor_id), [A])
    assert.equal(vt.tablo('users').find((u) => u.id === B)!.ui_language, 'ru')
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

  it('home: today\'s visits of a doctor with none', async () => {
    assert.deepEqual(await cevap(await bugun.GET(istek('/api/ulke/bugun', 'jeton-a'))), { s: 200, j: { muayeneler: [] } })
  })
})
