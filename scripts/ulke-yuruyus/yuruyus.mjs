#!/usr/bin/env node
/**
 * NOTYA-UZ-MUAYENE-01 — WALK-THROUGH of an Uzbekistan build in a real browser, against a running build and the
 * stand-in Supabase (./sahte-supabase.mjs). Everything is under the path the country is served at (/uzbek).
 * Synthetic accounts and patients only. No provider is ever contacted: speech recognition and the note model are
 * answered inside the server process by ./sahte-saglayicilar.cjs (see RUN below), which also refuses every other
 * outside address.
 *
 * RUN (nothing here is a dependency of the application; the browser comes from a folder of your own):
 *
 *   mkdir /tmp/yuruyus && cd /tmp/yuruyus && npm i puppeteer-core @sparticuz/chromium @fontsource-variable/fraunces @fontsource/source-sans-3
 *   # terminal 1 — stand-in database, auth and storage
 *   SUPABASE_SERVICE_ROLE_KEY=sahte-servis node <repo>/scripts/ulke-yuruyus/sahte-supabase.mjs 54399
 *   # terminal 2 — the Uzbek production build, with the stand-in providers loaded into the server
 *   cd <repo> && export NOTYA_COUNTRY=uz NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_ANON_KEY=sahte-anon \
 *     SUPABASE_SERVICE_ROLE_KEY=sahte-servis NOTYA_ILETISIM_EPOSTA=pilot@example.com ENCRYPTION_MASTER_KEY=yalniz-yuruyus-icin-sentetik-anahtar \
 *     ELEVENLABS_API_KEY=sahte-anahtar OPENROUTER_API_KEY=sahte-anahtar
 *   npm run build && NODE_OPTIONS="--require $PWD/scripts/ulke-yuruyus/sahte-saglayicilar.cjs" npx next start -p 3111
 *   # terminal 3 — this file, from the folder that has the browser
 *   cd /tmp/yuruyus && node <repo>/scripts/ulke-yuruyus/yuruyus.mjs
 *
 * Settings: TABAN (http://localhost:3111), SUPA (http://127.0.0.1:54399), ON_EK (/uzbek), CIKTI (./cikti, screenshots).
 * Exit code 0 only when every check passed.
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const gerek = createRequire(join(process.env.YURUYUS_MODULLER || process.cwd(), 'x.js'))
const puppeteer = gerek('puppeteer-core')
const chromiumHam = gerek('@sparticuz/chromium')
const chromium = chromiumHam.default ?? chromiumHam

const TABAN = process.env.TABAN || 'http://localhost:3111'
const SUPA = process.env.SUPA || 'http://127.0.0.1:54399'
const ON_EK = process.env.ON_EK ?? '/uzbek'
const CIKTI = process.env.CIKTI || './cikti'
mkdirSync(CIKTI, { recursive: true })
const adres = (rota) => (rota === '/' || /^\/[?#]/.test(rota) ? `${ON_EK}${rota.slice(1)}` : `${ON_EK}${rota}`) || '/'
const OTURUM_ANAHTARI = 'sb-notya-uz-auth-token'

// ── fonts: Google Fonts is answered from local files when the folder has them (some machines block the font host) ──
const FONT = join(process.env.YURUYUS_MODULLER || process.cwd(), 'node_modules')
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
const KIRIL = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'
const KIRIL_EXT = 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'
const yuz = (aile, stil, agirlik, dosya, aralik) => `@font-face{font-family:'${aile}';font-style:${stil};font-weight:${agirlik};font-display:block;src:url(https://fonts.gstatic.com/yerel/${dosya}) format('woff2');unicode-range:${aralik}}`
const FONT_CSS = [
  yuz('Fraunces', 'normal', '100 900', 'fraunces/fraunces-latin-opsz-normal.woff2', LATIN),
  yuz('Fraunces', 'italic', '100 900', 'fraunces/fraunces-latin-opsz-italic.woff2', LATIN),
  yuz('Fraunces', 'normal', '100 900', 'fraunces/fraunces-latin-ext-opsz-normal.woff2', LATIN_EXT),
  yuz('Fraunces', 'italic', '100 900', 'fraunces/fraunces-latin-ext-opsz-italic.woff2', LATIN_EXT),
  ...[400, 500, 600, 700].flatMap((w) => [
    yuz('Source Sans 3', 'normal', w, `ss3/source-sans-3-latin-${w}-normal.woff2`, LATIN),
    yuz('Source Sans 3', 'normal', w, `ss3/source-sans-3-latin-ext-${w}-normal.woff2`, LATIN_EXT),
    yuz('Source Sans 3', 'normal', w, `ss3/source-sans-3-cyrillic-${w}-normal.woff2`, KIRIL),
    yuz('Source Sans 3', 'normal', w, `ss3/source-sans-3-cyrillic-ext-${w}-normal.woff2`, KIRIL_EXT),
  ]),
].join('\n')
const FONT_VAR = existsSync(join(FONT, '@fontsource/source-sans-3'))

const sonuc = []
const kontrol = (ad, kosul, ayrinti = '') => { sonuc.push({ ad, tamam: !!kosul, ayrinti }); console.log(`${kosul ? 'ok  ' : 'FAIL'} ${ad}${ayrinti ? ' — ' + ayrinti : ''}`) }
const bekle = (ms) => new Promise((r) => setTimeout(r, ms))
const TURKCE_HARF = /[çğıİşĞŞ]/

const tarayici = await puppeteer.launch({
  args: [...chromium.args.filter((a) => a !== '--single-process'), '--no-sandbox', '--font-render-hinting=none',
    // The microphone of this browser is a built-in test tone: nothing is recorded from anywhere, and no prompt is shown.
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  executablePath: await chromium.executablePath(), headless: 'shell',
})

async function sayfaAc({ genislik, yukseklik, telefon }) {
  const ctx = await tarayici.createBrowserContext()
  const p = await ctx.newPage()
  await p.setViewport({ width: genislik, height: yukseklik, deviceScaleFactor: telefon ? 2 : 1, isMobile: !!telefon, hasTouch: !!telefon })
  if (telefon) await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
  await p.setBypassCSP(true) // the stand-in Supabase is on localhost, outside the security policy's *.supabase.co
  await p.setRequestInterception(true)
  p.on('request', (r) => {
    const u = r.url()
    if (u.startsWith('https://fonts.googleapis.com/')) return r.respond({ status: 200, contentType: 'text/css', body: FONT_VAR ? FONT_CSS : '' })
    if (u.startsWith('https://fonts.gstatic.com/yerel/')) {
      const [paket, dosya] = u.slice('https://fonts.gstatic.com/yerel/'.length).split('/')
      const yol = paket === 'fraunces' ? join(FONT, '@fontsource-variable/fraunces/files', dosya) : join(FONT, '@fontsource/source-sans-3/files', dosya)
      try { return r.respond({ status: 200, contentType: 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' }, body: readFileSync(yol) }) } catch { return r.respond({ status: 404, body: '' }) }
    }
    r.continue()
  })
  p.istekler = []     // every request the page made to the application, as paths
  p.disari = []       // requests to anything that is neither the application, the stand-in Supabase nor the fonts
  p.sonJeton = null
  p.on('request', (r) => {
    const u = r.url()
    if (u.startsWith(TABAN)) p.istekler.push(u.slice(TABAN.length))
    else if (!u.startsWith(SUPA) && !u.startsWith('https://fonts.g') && !u.startsWith('data:') && !u.startsWith('blob:')) p.disari.push(u)
  })
  p.on('response', (r) => { if (r.url().includes('/auth/v1/token')) p.sonJeton = r.status() })
  p.konsol = []
  p.on('console', (m) => { if (m.type() === 'error') p.konsol.push(m.text()) })
  p.on('pageerror', (e) => p.konsol.push(String(e)))
  return p
}
const git = async (p, rota) => { const r = await p.goto(TABAN + adres(rota), { waitUntil: 'networkidle0', timeout: 180000 }); await p.evaluate(() => document.fonts.ready); return r }
const cek = async (p, ad, tam = true) => { await p.screenshot({ path: join(CIKTI, ad), fullPage: tam }); console.log('   shot', ad) }
const MASA = { genislik: 1440, yukseklik: 900 }, TEL = { genislik: 390, yukseklik: 844, telefon: true }
const yolda = (p, rota) => p.waitForFunction((a) => location.pathname === a, { timeout: 60000 }, adres(rota).split('?')[0])
const metin = (p, sel) => p.$eval(sel, (e) => e.innerText)
const govde = (p) => p.evaluate(() => document.body.innerText)
/** Sets a controlled input the way a person's typing would be seen by the page (works for date fields too). */
const yazDeger = (p, sel, v) => p.evaluate((s, d) => {
  const e = document.querySelector(s)
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), 'value').set.call(e, d)
  e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }))
}, sel, v)
const sec = (p, ad, deger) => p.click(`input[name="${ad}"][value="${deger}"]`)
/** Every link and form address on the page. */
const adresler = async (p) => ({ hepsi: await p.evaluate(() => [...document.querySelectorAll('a[href], form[action]')].map((e) => e.getAttribute('href') ?? e.getAttribute('action'))) })
const onEkAltinda = async (p, ad) => {
  const hepsi = await p.evaluate(() => [...document.querySelectorAll('a[href], form[action]')].map((e) => e.getAttribute('href') ?? e.getAttribute('action')))
  const disari = hepsi.filter((h) => !(h.startsWith('#') || h.startsWith('mailto:') || h === ON_EK || h.startsWith(`${ON_EK}/`) || h.startsWith(`${ON_EK}?`) || h.startsWith(`${ON_EK}#`)))
  kontrol(`${ad}: every link and form stays under ${ON_EK}`, hepsi.length > 0 && disari.length === 0, disari.join(' ') || `${hepsi.length} addresses`)
  const kacak = p.istekler.filter((i) => !(i === ON_EK || i.startsWith(`${ON_EK}/`) || i.startsWith(`${ON_EK}?`)))
  kontrol(`${ad}: every request to the application (pages, API, assets) is under ${ON_EK}`, kacak.length === 0, [...new Set(kacak)].slice(0, 5).join(' '))
  kontrol(`${ad}: no request to any outside service`, p.disari.length === 0, [...new Set(p.disari)].slice(0, 3).join(' '))
}
const api = (p, rota, secenek = {}) => p.evaluate(async (u, s, anahtar) => {
  const oturum = JSON.parse(localStorage.getItem(anahtar) || 'null')
  const r = await fetch(u, { method: s.method || 'GET', headers: { Authorization: `Bearer ${s.jeton ?? oturum?.access_token ?? ''}`, ...(s.govde ? { 'Content-Type': 'application/json' } : {}) }, body: s.govde ? JSON.stringify(s.govde) : undefined })
  const t = await r.text()
  let j = null; try { j = JSON.parse(t) } catch { /* not json */ }
  return { s: r.status, t: t.slice(0, 300), j }
}, adres(rota), secenek, OTURUM_ANAHTARI)

async function giris(p, eposta, sifre) {
  for (const [id, v] of [['#ulke-giris-eposta', eposta], ['#ulke-giris-sifre', sifre]]) {
    await p.click(id, { clickCount: 3 }); await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace')
    await p.type(id, v)
    const yazilan = await p.$eval(id, (e) => e.value)
    if (yazilan !== v) throw new Error(`field ${id} holds "${yazilan}", expected "${v}"`)
  }
  p.sonJeton = null
  await p.click('button[type=submit]')
}

// ───────────────────────── 1. landing page under the prefix: desktop + phone, Uzbek + Russian ─────────────────────────
for (const [dil, rota] of [['uz', '/'], ['ru', '/?dil=ru']]) {
  for (const [boyut, b] of [['desktop', MASA], ['phone', TEL]]) {
    const p = await sayfaAc(b)
    const r = await git(p, rota)
    const ad = `landing ${dil} ${boyut}`
    kontrol(`${ad}: 200 at ${adres(rota)}`, r.status() === 200, String(r.status()))
    kontrol(`${ad}: noindex header`, /noindex/.test(r.headers()['x-robots-tag'] || ''), r.headers()['x-robots-tag'])
    const bilgi = await p.evaluate(() => ({
      lang: document.documentElement.lang, kok: document.querySelector('.uzl')?.getAttribute('lang'),
      robots: document.querySelector('meta[name=robots]')?.getAttribute('content') || '',
      tasma: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      form: !!document.querySelector('form.uzl-form'), manifest: !!document.querySelector('link[rel=manifest]'),
    }))
    kontrol(`${ad}: html lang uz-Latn, page lang ${dil === 'ru' ? 'ru' : 'uz-Latn'}`, bilgi.lang === 'uz-Latn' && bilgi.kok === (dil === 'ru' ? 'ru' : 'uz-Latn'), `${bilgi.lang}/${bilgi.kok}`)
    kontrol(`${ad}: robots meta noindex`, /noindex/.test(bilgi.robots), bilgi.robots)
    kontrol(`${ad}: no horizontal overflow`, bilgi.tasma <= 0, `overflow ${bilgi.tasma}px`)
    kontrol(`${ad}: request form shown, no app manifest`, bilgi.form && !bilgi.manifest)
    await onEkAltinda(p, ad)
    kontrol(`${ad}: scripts and styles were loaded from ${ON_EK}/_next/`, p.istekler.some((i) => i.startsWith(`${ON_EK}/_next/static/`)), `${p.istekler.length} requests`)
    kontrol(`${ad}: no console errors`, p.konsol.length === 0, p.konsol.join(' | ').slice(0, 300))
    if (boyut === 'desktop') await cek(p, `landing-${boyut}-${dil}.png`)
    await p.browserContext().close()
  }
}
{
  const p = await sayfaAc(MASA)
  await git(p, '/')
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.uzl-dil a[hreflang=ru]')])
  kontrol('language switch: Uzbek → Russian, still under the prefix', p.url() === `${TABAN}${ON_EK}?dil=ru` && (await p.evaluate(() => document.querySelector('.uzl').lang)) === 'ru', p.url())
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.uzl-dil a[hreflang=uz-Latn]')])
  kontrol('language switch: Russian → Uzbek', p.url() === `${TABAN}${ON_EK}` && (await p.evaluate(() => document.querySelector('.uzl').lang)) === 'uz-Latn', p.url())
  const r = await p.goto(`${TABAN}${ON_EK}/`, { waitUntil: 'networkidle0' })
  kontrol(`${ON_EK}/ (with a trailing slash) ends on ${ON_EK}`, p.url() === `${TABAN}${ON_EK}` && r.status() === 200, `${r.status()} ${p.url()}`)
  await p.browserContext().close()
}

// ───────────────────────── 2. outside the prefix this build serves nothing ─────────────────────────
{
  const p = await sayfaAc(MASA)
  for (const yol of ['/', '/login', '/signup', '/today', '/patients', '/visit', '/doktor', '/giris', '/dashboard/doktor', '/api/ulke/hesap', '/api/users/me', '/robots.txt', '/manifest.json', '/sw.js', '/_next/static/chunks/main.js']) {
    const r = await p.goto(TABAN + yol, { waitUntil: 'domcontentloaded' })
    const t = await govde(p)
    kontrol(`outside ${ON_EK}: ${yol} is not found, and says so in Uzbek or not at all`, r.status() === 404 && !TURKCE_HARF.test(t) && (t === '' || t.includes('Sahifa topilmadi')), `${r.status()} ${t.slice(0, 40).replace(/\s+/g, ' ')}`)
  }
  await p.goto(TABAN + '/yoq', { waitUntil: 'networkidle0' })
  const { hepsi } = await adresler(p)
  kontrol('the not-found page leads back to the Uzbek landing page', hepsi.includes(ON_EK) && !hepsi.includes('/'), hepsi.join(' '))
  await p.browserContext().close()
}

// ───────────────────────── 3. login: refusals, then the first-login question ─────────────────────────
const A = await sayfaAc(MASA) // doctor A — stays signed in for the rest of the walk-through
{
  const p = A
  const r = await git(p, '/login')
  kontrol('login page: 200, Uzbek', r.status() === 200 && (await metin(p, 'button[type=submit]')) === 'Kirish')
  await onEkAltinda(p, 'login page')
  const RET = 'Elektron pochta yoki parol notoʻgʻri.'
  for (const [ad, eposta, sifre] of [['wrong password', 'qa-uz@notya.test', 'yanlis-parol'], ['Turkish account', 'qa-tr@notya.test', 'sinov-parol-3'], ['unstamped account', 'qa-damgasiz@notya.test', 'sinov-parol-4']]) {
    await giris(p, eposta, sifre)
    await p.waitForSelector('[role=alert]', { timeout: 20000 })
    await bekle(400)
    const mesaj = await metin(p, '[role=alert]')
    kontrol(`login refused (${ad}): the one neutral sentence, still on ${adres('/login')}`, mesaj === RET && new URL(p.url()).pathname === adres('/login'), mesaj)
    kontrol(`login refused (${ad}): ${ad === 'wrong password' ? 'the auth service said no' : 'the password WAS right — refused because of the country'}`, p.sonJeton === (ad === 'wrong password' ? 400 : 200), `auth answered ${p.sonJeton}`)
    const oturum = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('auth-token')).map((k) => localStorage.getItem(k)).join(''))
    kontrol(`login refused (${ad}): no session kept in the browser`, !oturum)
  }
  await giris(p, 'qa-uz@notya.test', 'sinov-parol-1')
  await yolda(p, '/start')
  await p.waitForSelector('h1', { timeout: 60000 })
  kontrol('first login → the language question, in the language chosen at sign-up (Uzbek, Latin)', (await metin(p, 'h1')) === 'Qaysi tilda ishlaysiz?')
  const anahtarlar = await p.evaluate(() => Object.keys(localStorage))
  kontrol('the session is stored under a key that names the country, and nowhere else', JSON.stringify(anahtarlar) === JSON.stringify([OTURUM_ANAHTARI]), anahtarlar.join(' '))
  const cerezler = [await p.evaluate(() => document.cookie), ...(await p.cookies()).map((c) => c.name)].filter(Boolean)
  kontrol('no cookie is set', cerezler.length === 0, cerezler.join(' '))
  kontrol('the question cannot be skipped: no navigation on it', !(await p.$('.uza-nav')))
  // Uzbek or Russian? — and for Uzbek: Latin or Cyrillic? The screen re-reads itself as soon as a choice is made.
  await sec(p, 'dil', 'ru'); await bekle(150)
  kontrol('choosing Russian: the question is now in Russian and the script question is gone', (await metin(p, 'h1')) === 'На каком языке вы работаете?' && !(await p.$('input[name=yazi]')))
  await sec(p, 'dil', 'uz'); await bekle(100); await sec(p, 'yazi', 'Cyrl'); await bekle(150)
  kontrol('choosing Uzbek + Cyrillic: the question is now in Uzbek Cyrillic', (await metin(p, 'h1')) === 'Қайси тилда ишлайсиз?')
  await cek(p, 'start-uz-cyrl.png', false)
  await sec(p, 'yazi', 'Latn'); await bekle(150)
  await p.click('button[type=submit]')
  await yolda(p, '/today')
  await p.waitForSelector('h1', { timeout: 60000 })
  kontrol('answer saved → the home, in Uzbek Latin', (await govde(p)).includes('Bugungi koʻriklar') && (await metin(p, 'h1')) === 'QA Shifokor Bir')
  const tercih = await (await fetch(`${SUPA}/__tablo/hekim_dil_tercihleri`)).json()
  kontrol('the answer is stored for this account: notes in Uzbek Latin, question answered', tercih.length === 1 && tercih[0].doctor_id === 'aaaaaaaa-0000-4000-8000-000000000001' && tercih[0].not_dili === 'uz-Latn' && !!tercih[0].soruldu_at, JSON.stringify(tercih))
  await onEkAltinda(p, 'home')
  await cek(p, 'today-uz.png', false)
  await git(p, '/start')
  await yolda(p, '/today')
  kontrol('the question is asked once: going back to it returns to the home', true)
  await git(p, '/welcome')
  await yolda(p, '/today')
  kontrol(`the old holding page address now leads to the home (${adres('/welcome')} → ${adres('/today')})`, true)
}

// ───────────────────────── 4. patients: new patient, file, search in either script ─────────────────────────
let hastaA = ''
{
  const p = A
  await git(p, '/patients/new')
  await p.waitForSelector('#uza-h-ad')
  await p.click('button[type=submit]'); await bekle(150)
  kontrol('new patient: the name is required', (await metin(p, '[role=alert]')) === 'Familiya va ismni kiriting.')
  await p.type('#uza-h-ad', 'QA Karimova Dilnoza')
  await p.type('#uza-h-ota', 'Rustam qizi')
  await yazDeger(p, '#uza-h-dogum', '2021-03-07')
  await p.type('#uza-h-tel', '+998 90 000 00 01')
  await sec(p, 'cinsiyet', 'female')
  await p.click('button[type=submit]'); await bekle(150)
  kontrol('new patient: the patient\'s own language is required', (await metin(p, '[role=alert]')) === 'Bemorning tilini tanlang.')
  await sec(p, 'hasta-dili', 'uz')
  await onEkAltinda(p, 'new patient')
  await p.click('button[type=submit]')
  await yolda(p, '/patient')
  await p.waitForFunction(() => document.querySelector('h1')?.innerText.includes('Karimova'), { timeout: 60000 })
  hastaA = new URL(p.url()).searchParams.get('id')
  const g = await govde(p)
  kontrol('patient saved → the patient file, with what was entered', /^[0-9a-f-]{36}$/.test(hastaA) && ['QA Karimova Dilnoza Rustam qizi', '07.03.2021', '+998 90 000 00 01', 'Ayol', 'Oʻzbekcha', 'Hali tasdiqlangan qayd yoʻq.'].every((x) => g.includes(x)), g.replace(/\s+/g, ' ').slice(0, 160))
  await onEkAltinda(p, 'patient file')
  const ham = JSON.stringify([await (await fetch(`${SUPA}/__tablo/patients`)).json(), await (await fetch(`${SUPA}/__tablo/hasta_ulke_bilgisi`)).json()])
  kontrol('in the database the name, patronymic, birth date and phone are encrypted', !/Karimova|Rustam|2021-03-07|998 90 000/.test(ham) && ham.includes('aaaaaaaa-0000-4000-8000-000000000001'))
  for (const q of ['karimova', 'Каримова', 'rustam', '0000 01']) {
    await git(p, `/patients?q=${encodeURIComponent(q)}`)
    await p.waitForSelector('.uza-liste, .uza-bos')
    kontrol(`find the patient by "${q}"`, (await govde(p)).includes('QA Karimova Dilnoza'))
  }
  await git(p, '/today')
  await p.type('#uza-arama', 'Dilnoza')
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.uza-arama button[type=submit]')])
  kontrol('the search on the home goes to the patient list under the prefix', new URL(p.url()).pathname === adres('/patients') && new URL(p.url()).searchParams.get('q') === 'Dilnoza', p.url())
}

// ───────────────────────── 5. settings: interface language and note language ─────────────────────────
{
  const p = A
  await git(p, '/settings')
  await p.waitForSelector('input[name=arayuz]')
  await sec(p, 'arayuz', 'ru'); await p.click('button[type=submit]')
  await p.waitForFunction(() => document.querySelector('h1')?.innerText === 'Настройки', { timeout: 30000 })
  kontrol('settings: interface in Russian, notes stay in Uzbek — the page re-reads itself in Russian', (await govde(p)).includes('Сохранено.'))
  await p.reload({ waitUntil: 'networkidle0' })
  await p.waitForFunction(() => document.querySelector('h1')?.innerText === 'Настройки', { timeout: 30000 })
  kontrol('settings survive a reload', await p.$eval('input[name=not][value=uz]', (e) => e.checked))
  await sec(p, 'arayuz', 'uz'); await p.click('button[type=submit]')
  await p.waitForFunction(() => document.querySelector('h1')?.innerText === 'Sozlamalar', { timeout: 30000 })
  await onEkAltinda(p, 'settings')
}

// ───────────────────────── 6. isolation between two doctors ─────────────────────────
const B = await sayfaAc(TEL)
let hastaB = ''
{
  const p = B
  await git(p, '/login?dil=ru')
  kontrol('login page in Russian', (await metin(p, 'button[type=submit]')) === 'Войти')
  await giris(p, 'qa-ru@notya.test', 'sinov-parol-2')
  await yolda(p, '/start')
  await p.waitForSelector('h1')
  kontrol('doctor B: first-login question in Russian (the language of the account)', (await metin(p, 'h1')) === 'На каком языке вы работаете?')
  await p.click('button[type=submit]')
  await yolda(p, '/today')
  await git(p, '/patients')
  await p.waitForSelector('.uza-bos')
  kontrol('doctor B: an empty patient list — doctor A\'s patient is not in it', (await govde(p)).includes('Пациентов пока нет.') && !(await govde(p)).includes('Karimova'))
  for (const q of ['Karimova', 'QA', 'Dilnoza', '998']) {
    await git(p, `/patients?q=${encodeURIComponent(q)}`)
    await p.waitForSelector('.uza-bos')
    kontrol(`doctor B: searching "${q}" does not find doctor A's patient`, !(await govde(p)).includes('Karimova'))
  }
  await git(p, `/patient?id=${hastaA}`)
  await p.waitForSelector('[role=alert]')
  const g = await govde(p)
  kontrol('doctor B opens the address of doctor A\'s patient: "patient not found", nothing of the patient', g.includes('Пациент не найден.') && !/Karimova|Rustam|07\.03\.2021|998 90/.test(g), g.replace(/\s+/g, ' ').slice(0, 120))
  const r = await api(p, `/api/ulke/hasta?id=${hastaA}`)
  const yok = await api(p, '/api/ulke/hasta?id=30000000-0000-4000-8000-00000000dead')
  kontrol('doctor B asks the API for doctor A\'s patient: the same answer as for an id that does not exist', r.s === 404 && r.t === '{"code":"NOT_FOUND"}' && yok.t === r.t, `${r.s} ${r.t}`)
  // B's own patient, for the other direction.
  await git(p, '/patients/new')
  await p.waitForSelector('#uza-h-ad')
  await p.type('#uza-h-ad', 'QA Иванов Пётр'); await sec(p, 'hasta-dili', 'ru')
  await p.click('button[type=submit]')
  await yolda(p, '/patient')
  await p.waitForFunction(() => document.querySelector('h1')?.innerText.includes('Иванов'), { timeout: 60000 })
  hastaB = new URL(p.url()).searchParams.get('id')
  kontrol('doctor B saves a patient of their own', /^[0-9a-f-]{36}$/.test(hastaB) && hastaB !== hastaA)
  await cek(p, 'patient-phone-ru.png', false)
}
{
  const p = A
  await git(p, '/patients')
  await p.waitForSelector('.uza-liste')
  const g = await govde(p)
  kontrol('doctor A: sees their own patient and not doctor B\'s', g.includes('QA Karimova Dilnoza') && !g.includes('Иванов'))
  const r = await api(p, `/api/ulke/hasta?id=${hastaB}`)
  kontrol('doctor A asks the API for doctor B\'s patient: not found', r.s === 404 && r.t === '{"code":"NOT_FOUND"}', `${r.s} ${r.t}`)
  const jetonsuz = await api(p, `/api/ulke/hasta?id=${hastaA}`, { jeton: 'yoq' })
  kontrol('without a valid session the API says "no session", with a code and no sentence', jetonsuz.s === 401 && jetonsuz.t === '{"code":"OTURUM_YOK"}', `${jetonsuz.s} ${jetonsuz.t}`)
}

// VISIT — sections 7 and 8 are added with the visit screen (recording → transcript → note → approve).

// ───────────────────────── 9. every other screen of the application is closed, signed in or not ─────────────────────────
{
  const p = A
  for (const yol of ['/dashboard/doktor', '/doktor-tools', '/doktor-tools/erecete', '/giris/doktor', '/kayit', '/onboarding', '/asistan', '/doktor', '/klinik', '/home', '/kvkk', '/portal/demo', '/session/new', '/api/users/me', '/api/doktor/hastalar', '/api/sessions/ses-yukle', '/api/notes', '/manifest.json', '/sw.js', '/sitemap.xml', '/uzbek/today']) {
    const y = await p.evaluate(async (u) => { const r = await fetch(u, { headers: { Authorization: 'Bearer x' } }); return { s: r.status, t: (await r.text()).slice(0, 200) } }, ON_EK + yol)
    kontrol(`signed-in Uzbek account: ${ON_EK}${yol} does not exist`, y.s === 404 && !TURKCE_HARF.test(y.t), `${y.s} ${y.t.slice(0, 60)}`)
  }
  const robots = await p.evaluate(async (u) => (await fetch(u)).text(), `${ON_EK}/robots.txt`)
  kontrol('robots.txt under the prefix disallows everything', robots === 'User-agent: *\nDisallow: /\n', JSON.stringify(robots))
  await git(p, '/today')
  await p.waitForSelector('.uza-hesap button')
  await p.click('.uza-hesap button')
  await yolda(p, '/login')
  kontrol(`logout → back to ${adres('/login')}, and the session is gone from the browser`, (await p.evaluate(() => Object.keys(localStorage).length)) === 0)
  await git(p, '/today')
  await yolda(p, '/login')
  kontrol('a screen of the application without a session → the login page', true)
  kontrol('doctor A: no console errors in the whole walk-through', p.konsol.filter((k) => !/40[014]|Failed to load resource/.test(k)).length === 0, p.konsol.join(' | ').slice(0, 300))
  await p.browserContext().close()
  kontrol('doctor B: no console errors in the whole walk-through', B.konsol.filter((k) => !/40[014]|Failed to load resource/.test(k)).length === 0, B.konsol.join(' | ').slice(0, 300))
  await B.browserContext().close()
}

// ───────────────────────── 10. sign-up by invitation code ─────────────────────────
{
  const p = await sayfaAc(MASA)
  const r = await git(p, '/signup')
  kontrol('sign-up page: 200', r.status() === 200)
  await onEkAltinda(p, 'sign-up page')
  const doldur = async (kod, eposta) => {
    for (const [id, v] of [['#ulke-kayit-kod', kod], ['#ulke-kayit-ad', 'QA Yangi Shifokor'], ['#ulke-kayit-eposta', eposta], ['#ulke-kayit-sifre', 'yangi-parol-9'], ['#ulke-kayit-sifre2', 'yangi-parol-9']]) {
      await p.click(id, { clickCount: 3 }); await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace'); if (v) await p.type(id, v)
    }
    await p.select('#ulke-kayit-dil', 'ru')
    await p.click('button[type=submit]')
  }
  await doldur('', 'qa-yangi@notya.test')
  await p.waitForSelector('[role=alert]')
  kontrol('sign-up without a code: refused in the browser', (await metin(p, '[role=alert]')) === 'Barcha maydonlarni toʻldiring.')
  await doldur('ABCD-EFGH-JKMN-PQRS', 'qa-yangi@notya.test')
  await p.waitForFunction(() => document.querySelector('[role=alert]')?.innerText.includes('Taklif kodi'), { timeout: 30000 })
  kontrol('sign-up with an unknown code: refused by the server', (await metin(p, '[role=alert]')) === 'Taklif kodi yaroqsiz yoki allaqachon ishlatilgan.')
  await doldur('qate-st00-0000-0001', 'qa-yangi@notya.test')
  await p.waitForSelector('[role=status]', { timeout: 30000 })
  kontrol('sign-up with a valid code: account created', (await metin(p, '[role=status]')) === 'Hisobingiz yaratildi. Endi kirishingiz mumkin.')
  kontrol('sign-up posted to the API under the prefix', p.istekler.includes(`${ON_EK}/api/ulke/kayit`))
  const ikinci = await p.evaluate(async (u) => { const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adSoyad: 'QA Ikkinchi', eposta: 'qa-ikkinchi@notya.test', sifre: 'yangi-parol-9', davetKodu: 'QATEST0000000001', dil: 'uz-Latn' }) }); return { s: r.status, j: await r.json() } }, adres('/api/ulke/kayit'))
  kontrol('the same code a second time: refused', ikinci.s === 400 && ikinci.j.code === 'KOD_GECERSIZ', JSON.stringify(ikinci))
  await git(p, '/login')
  await giris(p, 'qa-yangi@notya.test', 'yangi-parol-9')
  await yolda(p, '/start')
  await p.waitForSelector('h1', { timeout: 60000 })
  kontrol('new account: lands on the first-login question in the language chosen at sign-up (Russian)', (await metin(p, 'h1')) === 'На каком языке вы работаете?')
  await p.browserContext().close()
}

await tarayici.close()
const kalan = sonuc.filter((s) => !s.tamam)
console.log(`\n${sonuc.length - kalan.length}/${sonuc.length} checks passed`)
if (kalan.length) console.log('FAILED:\n' + kalan.map((k) => `  ${k.ad}${k.ayrinti ? ' — ' + k.ayrinti : ''}`).join('\n'))
process.exit(kalan.length ? 1 : 0)
