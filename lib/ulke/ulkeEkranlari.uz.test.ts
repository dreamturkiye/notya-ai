/**
 * NOTYA-ULKE-01 — everything an UZBEKISTAN build can show or answer, rendered and called for real (NOTYA_COUNTRY=uz).
 *
 *   1. LEAK TEST over every screen of the build: root document, landing page, login, sign-up, holding page,
 *      not-found, error — in Uzbek and in Russian — and over every answer of its API. Nothing of Türkiye.
 *   2. ROUTE TEST: the route files of the build (*.ulke.*) are exactly the paths the pack lists; the middleware
 *      closes every other path of the application, signed in or not; each API route checks the account's country.
 *   3. Login and invitation sign-up behave: another country's account is refused with the neutral code; a code is
 *      needed, is used once, and a failed sign-up leaves nothing behind.
 *
 * Real handlers and components; the database and auth are a stand-in. Synthetic accounts only.
 * The landing page's own content rules: countries/uz/acilis/acilis.test.ts.
 */
process.env.NOTYA_COUNTRY = 'uz'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NOTYA_ILETISIM_EPOSTA = 'pilot@example.com'

import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from './testing/sizintiTarayici'
import { davetKoduHash } from './davet'
import type { DilKodu } from './tipler'

const KOK = resolve(__dirname, '../..')
// A stylesheet is not something Node can run; the pack's page entry imports one.
;(require as unknown as { extensions: Record<string, (m: { exports: unknown }) => void> }).extensions['.css'] = (m) => { m.exports = {} }

// ───────────────────────── stand-in Supabase ─────────────────────────
type Hesap = { id: string; email: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
let hesaplar: Record<string, Hesap>
let satirlar: Record<string, Record<string, unknown> | undefined>
let tercihler: Record<string, Record<string, unknown> | undefined>
let kodlar: Map<string, { ulke: string; kalan: number }>
let olaylar: string[]
let boz: { hesapOlustur?: boolean; satirYaz?: boolean; satirOku?: boolean }
const GECERLI_KOD = 'QATEST0000000001'

function sifirla() {
  hesaplar = {
    'jeton-uz': { id: '10000000-0000-4000-8000-000000000001', email: 'qa-uz@notya.test', app_metadata: { provider: 'email', country: 'uz' } },
    'jeton-uz-ru': { id: '10000000-0000-4000-8000-000000000002', email: 'qa-ru@notya.test', app_metadata: { country: 'uz' } },
    'jeton-tr': { id: '10000000-0000-4000-8000-000000000003', email: 'qa-tr@notya.test', app_metadata: { country: 'tr' } },
    'jeton-damgasiz': { id: '10000000-0000-4000-8000-000000000004', email: 'qa-damgasiz@notya.test', app_metadata: { provider: 'email' } },
    'jeton-uz-satirsiz': { id: '10000000-0000-4000-8000-000000000005', email: 'qa-satirsiz@notya.test', app_metadata: { country: 'uz' } },
    'jeton-uz-satir-tr': { id: '10000000-0000-4000-8000-000000000006', email: 'qa-satir-tr@notya.test', app_metadata: { country: 'uz' } },
    'jeton-uz-eski-sema': { id: '10000000-0000-4000-8000-000000000007', email: 'qa-eski@notya.test', app_metadata: { country: 'uz' } },
  }
  satirlar = {
    [hesaplar['jeton-uz'].id]: { id: hesaplar['jeton-uz'].id, full_name: 'QA Shifokor Bir', country: 'uz', ui_language: 'uz-Latn' },
    [hesaplar['jeton-uz-ru'].id]: { id: hesaplar['jeton-uz-ru'].id, full_name: 'QA Shifokor Ikki', country: 'uz', ui_language: 'ru' },
    [hesaplar['jeton-uz-satir-tr'].id]: { id: hesaplar['jeton-uz-satir-tr'].id, full_name: 'QA Uch', country: 'tr', ui_language: 'tr' },
    // A database where migration 128 was never applied: the row has no country column at all.
    [hesaplar['jeton-uz-eski-sema'].id]: { id: hesaplar['jeton-uz-eski-sema'].id, full_name: 'QA Toʻrt' },
  }
  kodlar = new Map([[davetKoduHash(GECERLI_KOD), { ulke: 'uz', kalan: 1 }], [davetKoduHash('QATEST0000000TRR'), { ulke: 'tr', kalan: 1 }]])
  // The Russian-language account has answered the first-login question and writes its notes in Uzbek Cyrillic.
  tercihler = { [hesaplar['jeton-uz-ru'].id]: { not_dili: 'uz-Cyrl', soruldu_at: '2026-10-08T05:00:00Z' } }
  olaylar = []
  boz = {}
}
sifirla()

function sahteCreateClient() {
  return {
    auth: {
      getUser: async (jwt?: string) => {
        const u = jwt ? hesaplar[jwt] : undefined
        return u ? { data: { user: { user_metadata: {}, app_metadata: {}, ...u } }, error: null } : { data: { user: null }, error: { message: 'invalid JWT' } }
      },
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      admin: {
        createUser: async (g: { email: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) => {
          if (boz.hesapOlustur || Object.values(hesaplar).some((h) => h.email === g.email)) { olaylar.push('hesap-reddedildi'); return { data: { user: null }, error: { message: 'A user with this email address has already been registered' } } }
          const id = `20000000-0000-4000-8000-${String(Object.keys(hesaplar).length).padStart(12, '0')}`
          hesaplar[`jeton-yeni-${id}`] = { id, email: g.email, app_metadata: g.app_metadata, user_metadata: g.user_metadata }
          olaylar.push(`hesap:${g.email}:${JSON.stringify(g.app_metadata)}`)
          return { data: { user: { id, email: g.email } }, error: null }
        },
        deleteUser: async (id: string) => { for (const [k, h] of Object.entries(hesaplar)) if (h.id === id) delete hesaplar[k]; olaylar.push(`hesap-silindi:${id}`); return { data: null, error: null } },
      },
    },
    rpc: async (ad: string, a: { p_hash: string; p_ulke?: string }) => {
      const k = kodlar.get(a.p_hash)
      if (ad === 'davet_kodu_kullan') {
        if (!k || k.ulke !== a.p_ulke || k.kalan < 1) return { data: false, error: null }
        k.kalan--; olaylar.push('kod-kullanildi')
        return { data: true, error: null }
      }
      if (ad === 'davet_kodu_iade') { if (k) k.kalan++; olaylar.push('kod-iade'); return { data: null, error: null } }
      throw new Error(`stand-in: rpc ${ad} not implemented`)
    },
    from: (tablo: string) => {
      assert.ok(tablo === 'users' || tablo === 'hekim_dil_tercihleri', `the account API touched a table it has no business with: ${tablo}`)
      let id = ''
      if (tablo === 'hekim_dil_tercihleri') {
        // NOTYA-UZ-MUAYENE-01: read by /api/ulke/hesap, always by the caller's own id. Its behaviour is tested in countries/uz/uygulama/uygulama.test.ts.
        const t: Record<string, unknown> = {
          select: () => t,
          eq: (k: string, v: string) => { assert.equal(k, 'doctor_id'); id = v; return t },
          maybeSingle: async () => ({ data: tercihler[id] ?? null, error: null }),
        }
        return t
      }
      const z: Record<string, unknown> = {
        select: () => z,
        eq: (_k: string, v: string) => { id = v; return z },
        maybeSingle: async () => (boz.satirOku ? { data: null, error: { code: '42703', message: 'column users.country does not exist' } } : { data: satirlar[id] ?? null, error: null }),
        upsert: async (g: Record<string, unknown>) => {
          if (boz.satirYaz) return { data: null, error: { code: '23505', message: 'duplicate' } }
          satirlar[String(g.id)] = g; olaylar.push(`satir:${g.email}:${g.country}:${g.ui_language}`)
          return { data: null, error: null }
        },
      }
      return z
    },
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`this test may not use the network: ${String(g)}`) }) as typeof fetch

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak }), [])
const DILLER: DilKodu[] = ['uz-Latn', 'ru']
const sp = (dil: DilKodu) => (dil === 'uz-Latn' ? {} : { dil })

/**
 * Route files of a build that is not the pre-split application: *.ulke.tsx / *.ulke.ts under app/, and ONE file with
 * the third route extension of such a build, app/not-found.mjs (that file says why it cannot be not-found.ulke.tsx).
 */
function ulkeRotaDosyalari() {
  const sayfalar: string[] = [], api: string[] = [], ozel: string[] = []
  const gez = (dizin: string) => {
    for (const ad of readdirSync(dizin)) {
      const yol = join(dizin, ad)
      if (statSync(yol).isDirectory()) { gez(yol); continue }
      if (ad.endsWith('.mjs')) {
        assert.equal(relative(KOK, yol).split(sep).join('/'), 'app/not-found.mjs', 'mjs is a route extension in a country build: the only .mjs file allowed under app/ is app/not-found.mjs')
        ozel.push('/not-found')
        continue
      }
      // not-found is absent on purpose: as not-found.ulke.tsx the production build fails (app/not-found.mjs).
      const m = /^(page|route|layout|error|global-error|loading|template|default)\.ulke\.(tsx|ts)$/.exec(ad)
      if (!m) { assert.doesNotMatch(ad, /\.ulke\./, `unexpected *.ulke.* file that is not a route file: ${relative(KOK, yol)}`); continue }
      const url = '/' + relative(join(KOK, 'app'), dizin).split(sep).filter(Boolean).filter((p) => !(p.startsWith('(') && p.endsWith(')'))).join('/')
      if (m[1] === 'page') sayfalar.push(url)
      else if (m[1] === 'route') api.push(url)
      else ozel.push(`${url === '/' ? '' : url}/${m[1]}`)
    }
  }
  gez(join(KOK, 'app'))
  return { sayfalar: sayfalar.sort(), api: api.sort(), ozel: ozel.sort() }
}

describe('an Uzbekistan build: screens', () => {
  let Layout: typeof import('../../app/layout.ulke')
  let Kok: typeof import('../../app/page.ulke')
  let Login: typeof import('../../app/login/page.ulke')
  let Signup: typeof import('../../app/signup/page.ulke')
  let Welcome: typeof import('../../app/welcome/page.ulke')
  let Bulunamadi: typeof import('../../app/not-found.mjs')
  let Hata: typeof import('../../app/error.ulke')
  let GenelHata: typeof import('../../app/global-error.ulke')
  let Bekletme: typeof import('../../components/ulke/BekletmeEkrani')
  let metin: typeof import('./metin')

  before(async () => {
    Layout = await import('../../app/layout.ulke')
    Kok = await import('../../app/page.ulke')
    Login = await import('../../app/login/page.ulke')
    Signup = await import('../../app/signup/page.ulke')
    Welcome = await import('../../app/welcome/page.ulke')
    Bulunamadi = await import('../../app/not-found.mjs')
    Hata = await import('../../app/error.ulke')
    GenelHata = await import('../../app/global-error.ulke')
    Bekletme = await import('../../components/ulke/BekletmeEkrani')
    metin = await import('./metin')
  })

  /** A page as the browser gets it: inside the root document of the build. */
  const belge = (sayfa: React.ReactElement) => renderToStaticMarkup(React.createElement(Layout.default, null, sayfa))

  it('root document: Uzbek, the pack title, told to stay out of search engines, none of the Turkish shell', () => {
    const html = belge(React.createElement('main', null, 'x'))
    assert.match(html, /^<html lang="uz-Latn">/)
    assert.doesNotMatch(html, /manifest|serviceWorker|sw\.js|apple-mobile-web-app|lang="tr"/)
    const m = Layout.metadata as { title: string; description: string; robots: { index: boolean; follow: boolean }; manifest?: string }
    assert.equal(m.title, 'Notya')
    assert.deepEqual([m.robots.index, m.robots.follow], [false, false])
    assert.equal(m.manifest, undefined)
    temiz(`${m.title}\n${m.description}`, 'root metadata')
    temiz(html, 'root document')
    const kaynak = readFileSync(join(KOK, 'app/layout.ulke.tsx'), 'utf8')
    assert.doesNotMatch(kaynak, /Asistan|TurkceDogrulama|chromeTheme|globals\.css/, 'the country shell must not pull in the pre-split shell')
  })

  for (const dil of DILLER) {
    it(`${dil}: landing page at the root, inside the root document`, () => {
      const html = belge(Kok.default({ searchParams: sp(dil) }))
      assert.match(html, new RegExp(`<div class="uzl" lang="${dil}"`))
      assert.ok(html.includes(dil === 'ru' ? 'запись ведёт Notya.' : 'yozuvni Notya yozadi.'))
      temiz(html, `/ (${dil})`)
      temiz(gorunurMetin(html), `/ (${dil}, visible text)`)
    })

    it(`${dil}: login page`, () => {
      const html = belge(Login.default({ searchParams: sp(dil) }))
      const g = metin.yuzeyMetinleri('giris', dil)
      for (const s of [g.altBaslik, g.eposta, g.sifre, g.gonder, g.davetSorusu, g.kayitBaglantisi]) assert.ok(html.includes(s), s)
      assert.match(html, new RegExp(`<div lang="${dil}"`))
      assert.match(html, /href="\/signup(\?dil=ru)?"/)
      assert.doesNotMatch(html, /\/giris|\/kayit|\/dashboard|\/onboarding|supabase\.co/)
      temiz(html, `/login (${dil})`)
    })

    it(`${dil}: sign-up page (invitation code)`, () => {
      const html = belge(Signup.default({ searchParams: sp(dil) }))
      const g = metin.yuzeyMetinleri('davetliKayit', dil)
      for (const s of [g.baslik, g.aciklama, g.davetKodu, g.adSoyad, g.eposta, g.sifre, g.sifreTekrar, g.dil, g.gonder]) assert.ok(html.includes(s), s)
      // The account chooses its interface language among the country's switched-on languages — and only those.
      assert.deepEqual([...html.matchAll(/<option[^>]*value="([^"]+)"/g)].map((m) => m[1]), ['uz-Latn', 'ru'])
      assert.doesNotMatch(html, /\/giris|\/kayit|\/kvkk|checkbox/)
      temiz(html, `/signup (${dil})`)
    })

    it(`${dil}: holding page — the one page a signed-in account sees`, () => {
      const m = metin.yuzeyMetinleri('bekletme', dil)
      const html = belge(React.createElement(Bekletme.BekletmeIcerigi, { dil, metin: m, ad: 'QA Shifokor', yukleniyor: false, cikis: () => {} }))
      assert.ok(html.includes(m.baslik) && html.includes(m.govde) && html.includes(m.cikis))
      // It offers exactly one thing to do: log out. No link into the application.
      assert.deepEqual([...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((x) => x[1]), ['/'])
      assert.equal((html.match(/<button\b/g) || []).length, 1)
      temiz(html, `/welcome (${dil})`)
    })
  }

  it('holding page address: where the application is switched on, /welcome sends the account to its home', () => {
    // NOTYA-UZ-MUAYENE-01: the pack switches `cekirdekMuayene` on, so the home (/today) replaces the holding page.
    assert.throws(() => Welcome.default(), (e: unknown) => /NEXT_REDIRECT;[a-z]+;\/today;/.test(String((e as { digest?: string }).digest)))
    const giris = belge(Login.default({ searchParams: {} }))
    assert.doesNotMatch(giris, /\/welcome/)
  })

  it('not-found and error pages: Uzbek, from the pack, never the browser error text', () => {
    const yok = belge(Bulunamadi.default())
    assert.ok(yok.includes('Sahifa topilmadi'))
    temiz(yok, 'not-found')
    const hata = belge(Hata.default({ error: Object.assign(new Error('Cannot read properties of undefined (reading "id") — Hasta bulunamadı.'), {}), reset: () => {} }))
    assert.ok(hata.includes('Xatolik yuz berdi') && hata.includes('Qaytadan urinish'))
    assert.doesNotMatch(hata, /Cannot read|Hasta/)
    temiz(hata, 'error')
    const genel = renderToStaticMarkup(GenelHata.default({ error: new Error('x'), reset: () => {} }))
    assert.match(genel, /^<html lang="uz-Latn">/)
    temiz(genel, 'global-error')
  })

  it('a language the country has not switched on is never shown: Turkish and Cyrillic Uzbek fall to Uzbek Latin', () => {
    for (const dil of ['tr', 'uz-Cyrl', 'en', 'xx']) {
      const html = belge(Login.default({ searchParams: { dil } }))
      assert.match(html, /<div lang="uz-Latn"/, dil)
      assert.ok(html.includes('Hisobingizga kiring'), dil)
      temiz(html, `/login?dil=${dil}`)
    }
  })
})

describe('an Uzbekistan build: routes', () => {
  let paket: typeof import('./ulke')
  let kapi: typeof import('./rotaKapisi')
  let ara: typeof import('../../middleware.ulke')
  let NextRequest: typeof import('next/server').NextRequest
  before(async () => {
    paket = await import('./ulke')
    kapi = await import('./rotaKapisi')
    ara = await import('../../middleware.ulke')
    NextRequest = (await import('next/server')).NextRequest
  })

  it('the route files of the build are exactly what the pack lists — no more, no fewer', () => {
    const izin = paket.ulkePaketi().rotalar
    assert.notEqual(izin, 'hepsi')
    if (izin === 'hepsi') return
    const d = ulkeRotaDosyalari()
    assert.deepEqual(d.sayfalar, [...izin.sayfalar].sort())
    assert.deepEqual(d.sayfalar, ['/', '/login', '/settings', '/signup', '/start', '/today', '/welcome'])
    assert.deepEqual(d.api, ['/api/ulke/bugun', '/api/ulke/hesap', '/api/ulke/kayit', '/api/ulke/tercihler'])
    for (const a of d.api) assert.ok(izin.apiOnEkleri.some((o) => `${a}/`.startsWith(o)), `${a} is a route file but the pack does not list it`)
    for (const o of izin.apiOnEkleri) assert.ok(d.api.some((a) => `${a}/`.startsWith(o)), `the pack lists ${o} but no route file exists`)
    assert.deepEqual(d.ozel, ['/error', '/global-error', '/layout', '/not-found'])
    assert.ok(existsSync(join(KOK, 'middleware.ulke.ts')))
  })

  it('the build takes only *.ulke.* files as routes, plus app/not-found.mjs (so no Turkish route file is compiled into it)', async () => {
    const config = readFileSync(join(KOK, 'next.config.mjs'), 'utf8')
    assert.match(config, /\.\.\.\(ulkeDerleme\.bolunmemisUygulama \? \{\} : \{ pageExtensions: \['ulke\.tsx', 'ulke\.ts', 'mjs'\] \}\)/)
    // `mjs` exists for the root not-found page alone. Nothing else may become a route through it: no other .mjs under
    // app/ (ulkeRotaDosyalari above), and none of the root files or folders Next would also read with that extension.
    assert.deepEqual(ulkeRotaDosyalari().ozel.filter((o) => o === '/not-found'), ['/not-found'])
    assert.ok(!existsSync(join(KOK, 'app/not-found.ulke.tsx')), 'app/not-found.ulke.tsx breaks the production build of a country — the page is app/not-found.mjs')
    for (const ad of ['middleware.mjs', 'instrumentation.mjs', 'pages', 'src']) assert.ok(!existsSync(join(KOK, ad)), `${ad} would be read as a route source by a country build`)
    // One line, no text of its own: the page is the pack-driven component every country shares.
    const yok = readFileSync(join(KOK, 'app/not-found.mjs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim()
    assert.equal(yok, "export { UlkeBulunamadi as default } from '../components/ulke/UlkeSistemSayfasi'")
    const derleme = (await import(pathToFileURL(join(KOK, 'countries/uz/derleme.mjs')).href)).default
    assert.equal(derleme.bolunmemisUygulama, false)
    assert.deepEqual(derleme.yonlendirmeler, [])
  })

  it('middleware: listed paths pass with "do not index"; every other path of the application is 404 before any screen', () => {
    const git = (yol: string) => ara.middleware(new NextRequest(`https://uz.notya.test${yol}`))
    for (const yol of ['/', '/?dil=ru', '/login', '/signup', '/welcome', '/start', '/today', '/settings', '/api/ulke/hesap', '/api/ulke/kayit', '/api/ulke/tercihler', '/api/ulke/bugun', '/_next/static/chunks/x.js']) {
      const r = git(yol)
      assert.equal(r.status, 200, yol)
      assert.match(r.headers.get('x-robots-tag') || '', /noindex, nofollow/, yol)
      assert.equal(r.headers.get('x-frame-options'), 'DENY', yol)
    }
    const kapali = ['/doktor', '/klinik', '/home', '/kvkk', '/giris', '/giris/doktor', '/kayit', '/onboarding', '/dashboard', '/dashboard/doktor', '/dashboard/klinik', '/asistan', '/doktor-tools', '/doktor-tools/erecete', '/doktor-tools/enabiz', '/klinik-tools', '/portal/demo', '/intake/x', '/install', '/session/new', '/login/x', '/welcome/x', '/api', '/api/users/me', '/api/users/profile', '/api/doktor/hastalar', '/api/notes', '/api/sessions/start', '/api/cron/kvkk-imha', '/api/billing/webhook', '/api/ulkeler', '/manifest.json', '/sw.js', '/sitemap.xml', '/dahiliye-final-audit.html', '/sagligim/a.png', '/icon-192.png']
    for (const yol of kapali) {
      const r = git(yol)
      assert.equal(r.status, 404, yol)
      assert.match(r.headers.get('x-robots-tag') || '', /noindex/, yol)
    }
    const robots = git('/robots.txt')
    assert.equal(robots.status, 200)
    assert.match(robots.headers.get('content-type') || '', /^text\/plain/)
    const kaynak = readFileSync(join(KOK, 'middleware.ulke.ts'), 'utf8')
    assert.ok(kaynak.indexOf('rotaAcikMi(izin, pathname)') < kaynak.indexOf('NextResponse.next()'))
  })

  it('robots.txt disallows everything and API refusals carry a code, not a sentence', async () => {
    const git = (yol: string) => ara.middleware(new NextRequest(`https://uz.notya.test${yol}`))
    assert.equal(await git('/robots.txt').text(), kapi.ROBOTS_HERKESE_KAPALI)
    assert.deepEqual(await git('/api/users/me').json(), { code: 'NOT_FOUND' })
    assert.equal(await git('/dashboard/doktor').text(), '')
  })

  it('every API route of the build checks the account\'s country, except the short list that must be open', () => {
    const ACIK = new Map([['app/api/ulke/kayit/route.ulke.ts', 'creates the account: there is no session yet; guarded by the invitation code']])
    const d = ulkeRotaDosyalari()
    for (const a of d.api) {
      const yol = `app${a}/route.ulke.ts`
      const kaynak = readFileSync(join(KOK, yol), 'utf8')
      if (ACIK.has(yol)) { assert.match(kaynak, /davet_kodu_kullan/); continue }
      assert.match(kaynak, /\b(ulkeOturum|doktorOturum|pratikOturum)\(req\)/, `${yol} does not authenticate through a country-checked helper`)
    }
    for (const yol of ACIK.keys()) assert.ok(existsSync(join(KOK, yol)), `stale entry: ${yol}`)
  })
})

describe('an Uzbekistan build: account API', () => {
  let hesapRota: typeof import('../../app/api/ulke/hesap/route.ulke')
  let kayitRota: typeof import('../../app/api/ulke/kayit/route.ulke')
  let NextRequest: typeof import('next/server').NextRequest
  before(async () => {
    hesapRota = await import('../../app/api/ulke/hesap/route.ulke')
    kayitRota = await import('../../app/api/ulke/kayit/route.ulke')
    NextRequest = (await import('next/server').then((m) => m)).NextRequest
  })
  beforeEach(sifirla)

  const hesap = async (jeton?: string) => {
    const r = await hesapRota.GET(new NextRequest('https://uz.notya.test/api/ulke/hesap', { headers: jeton ? { authorization: `Bearer ${jeton}` } : {} }))
    const j = await r.json()
    temiz(JSON.stringify(j), 'GET /api/ulke/hesap')
    return { s: r.status, j }
  }
  const kayit = async (govde: unknown) => {
    const r = await kayitRota.POST(new NextRequest('https://uz.notya.test/api/ulke/kayit', { method: 'POST', body: typeof govde === 'string' ? govde : JSON.stringify(govde), headers: { 'content-type': 'application/json' } }))
    const j = await r.json()
    temiz(JSON.stringify(j), 'POST /api/ulke/kayit')
    return { s: r.status, j }
  }
  const GECERLI = { adSoyad: 'QA Yangi Shifokor', eposta: 'QA-Yangi@Notya.Test', sifre: 'yangi-parol-9', davetKodu: 'qate-st00-0000-0001', dil: 'ru' }

  it('hesap: an Uzbek account gets its country, its languages and whether the language question was answered; nothing else', async () => {
    assert.deepEqual(await hesap('jeton-uz'), { s: 200, j: { ulke: 'uz', dil: 'uz-Latn', durum: 'uygulama', ad: 'QA Shifokor Bir', notDili: 'uz-Latn', dilSoruldu: false } })
    assert.deepEqual(await hesap('jeton-uz-ru'), { s: 200, j: { ulke: 'uz', dil: 'ru', durum: 'uygulama', ad: 'QA Shifokor Ikki', notDili: 'uz-Cyrl', dilSoruldu: true } })
  })

  it('hesap: no session, a Turkish account and an unstamped account all get the same "no session"', async () => {
    for (const jeton of [undefined, 'jeton-olmayan', 'null', 'jeton-tr', 'jeton-damgasiz']) {
      assert.deepEqual(await hesap(jeton), { s: 401, j: { code: 'OTURUM_YOK' } }, String(jeton))
    }
  })

  it('hesap: fail closed — no row, a row of another country, a database without the country column, an unreadable row', async () => {
    for (const jeton of ['jeton-uz-satirsiz', 'jeton-uz-satir-tr', 'jeton-uz-eski-sema']) {
      assert.deepEqual(await hesap(jeton), { s: 403, j: { code: 'HESAP_REDDI' } }, jeton)
    }
    boz.satirOku = true
    assert.deepEqual(await hesap('jeton-uz'), { s: 403, j: { code: 'HESAP_REDDI' } })
  })

  it('kayit: a valid code creates the account stamped uz, with the chosen language, and uses the code up', async () => {
    assert.deepEqual(await kayit(GECERLI), { s: 200, j: { ok: true } })
    assert.deepEqual(olaylar, ['kod-kullanildi', 'hesap:qa-yangi@notya.test:{"country":"uz"}', 'satir:qa-yangi@notya.test:uz:ru'])
    assert.equal(kodlar.get(davetKoduHash(GECERLI_KOD))!.kalan, 0)
    // The same code again: refused, nothing created.
    olaylar = []
    assert.deepEqual(await kayit({ ...GECERLI, eposta: 'qa-ikkinchi@notya.test' }), { s: 400, j: { code: 'KOD_GECERSIZ' } })
    assert.deepEqual(olaylar, [])
  })

  it('kayit: no code, a malformed code, an unknown code, a code issued for another country — refused, nothing created', async () => {
    for (const davetKodu of [undefined, '', 'abc', 'ABCD-EFGH-JKMN-PQR', 'ABCD-EFGH-JKMN-PQRS', 'QATEST0000000TRR']) {
      const r = await kayit({ ...GECERLI, davetKodu })
      assert.equal(r.s, 400, String(davetKodu))
      assert.ok(['KOD_GECERSIZ', 'EKSIK_ALAN'].includes(r.j.code), `${davetKodu} → ${r.j.code}`)
    }
    assert.deepEqual(olaylar.filter((o) => !o.startsWith('kod')), [])
    assert.equal(kodlar.get(davetKoduHash(GECERLI_KOD))!.kalan, 1, 'a refused attempt must not burn the real code')
    assert.equal(kodlar.get(davetKoduHash('QATEST0000000TRR'))!.kalan, 1, 'a code of another country must not be consumed here')
  })

  it('kayit: bad input is refused before the code is touched', async () => {
    const vakalar: [Record<string, unknown> | string, string][] = [
      ['not json', 'EKSIK_ALAN'],
      [{ ...GECERLI, adSoyad: '' }, 'EKSIK_ALAN'],
      [{ ...GECERLI, adSoyad: 'x'.repeat(121) }, 'EKSIK_ALAN'],
      [{ ...GECERLI, eposta: 'yo-q' }, 'EPOSTA_GECERSIZ'],
      [{ ...GECERLI, sifre: '1234567' }, 'SIFRE_KISA'],
      [{ ...GECERLI, sifre: 12345678 }, 'EKSIK_ALAN'],
    ]
    for (const [g, kod] of vakalar) assert.deepEqual(await kayit(g), { s: 400, j: { code: kod } }, JSON.stringify(g).slice(0, 60))
    assert.deepEqual(olaylar, [])
  })

  it('kayit: a language the country has not switched on becomes the country default, never Turkish', async () => {
    for (const dil of ['tr', 'uz-Cyrl', '', undefined]) {
      sifirla()
      assert.equal((await kayit({ ...GECERLI, dil })).s, 200, String(dil))
      assert.ok(olaylar.includes('satir:qa-yangi@notya.test:uz:uz-Latn'), `${dil}: ${olaylar.join(' | ')}`)
    }
  })

  it('kayit: an address that already has an account gets the same answer as any failure, and the code is given back', async () => {
    assert.deepEqual(await kayit({ ...GECERLI, eposta: 'qa-uz@notya.test' }), { s: 400, j: { code: 'OLUSTURULAMADI' } })
    assert.deepEqual(olaylar, ['kod-kullanildi', 'hesap-reddedildi', 'kod-iade'])
    assert.equal(kodlar.get(davetKoduHash(GECERLI_KOD))!.kalan, 1)
  })

  it('kayit: if the account row cannot be written, the auth account is removed and the code is given back', async () => {
    boz.satirYaz = true
    const once = Object.keys(hesaplar).length
    assert.deepEqual(await kayit(GECERLI), { s: 500, j: { code: 'OLUSTURULAMADI' } })
    assert.equal(Object.keys(hesaplar).length, once, 'a half-created account was left behind')
    assert.deepEqual(olaylar.map((o) => o.split(':')[0]), ['kod-kullanildi', 'hesap', 'hesap-silindi', 'kod-iade'])
    assert.equal(kodlar.get(davetKoduHash(GECERLI_KOD))!.kalan, 1)
  })
})
