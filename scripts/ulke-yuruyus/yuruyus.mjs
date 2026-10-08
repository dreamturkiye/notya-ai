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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
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
// Scenario and call log shared with the stand-in providers inside the server (./sahte-saglayicilar.cjs).
const YURUYUS_DIZIN = process.env.YURUYUS_DIZIN || join(tmpdir(), 'notya-yuruyus')
mkdirSync(YURUYUS_DIZIN, { recursive: true })
const SENARYO = join(YURUYUS_DIZIN, 'senaryo.json')
const GUNLUK = join(YURUYUS_DIZIN, 'cagrilar.jsonl')
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

// ───────────────────────── 7. a visit: consent → recording → transcript → note (speech and model are stand-ins) ─────────────────────────
const cagrilar = () => (existsSync(GUNLUK) ? readFileSync(GUNLUK, 'utf8').split('\n').filter(Boolean).map((x) => JSON.parse(x)) : [])
const senaryoYaz = (s) => writeFileSync(SENARYO, JSON.stringify(s))
const tabloOku = async (ad) => (await fetch(`${SUPA}/__tablo/${ad}`)).json()
const alan = (p, b) => p.$eval(`#uza-not-${b}`, (e) => e.value)
/** From the patient's visit screen: tick consent, record the test tone for a moment, stop, and wait for what opens. */
async function kayitYap(p) {
  await p.waitForSelector('input[name=riza]')
  await p.click('input[name=riza]')
  await p.waitForFunction(() => !document.querySelector('.uza-form button.uza-dugme').disabled)
  await p.click('.uza-form button.uza-dugme')
  await p.waitForSelector('.uza-sure', { timeout: 20000 })
  await bekle(2600)
  const sure = await metin(p, '.uza-sure')
  await p.click('.uza-kayit .uza-dugme')
  await p.waitForFunction(() => new URLSearchParams(location.search).has('seans') || new URLSearchParams(location.search).has('not'), { timeout: 120000 })
  await p.waitForSelector('[data-alan=not], [data-eylem=not-yaz]', { timeout: 60000 })
  return sure
}
let notYuksek = '', notDusuk = '', seansYuksek = ''
{
  const p = A
  writeFileSync(GUNLUK, '')
  senaryoYaz({ stt: 'yuksek', model: 'tamam' })
  await git(p, '/today')
  await p.waitForSelector('.uza-karsilama a.uza-dugme')
  kontrol('the home now offers "start a visit"', (await metin(p, '.uza-karsilama a.uza-dugme')) === 'Koʻrikni boshlash')
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.uza-karsilama a.uza-dugme')])
  await p.waitForSelector('.uza-liste a.uza-satir')
  kontrol(`"start a visit" → choose the patient, at ${adres('/visit')}`, new URL(p.url()).pathname === adres('/visit') && (await govde(p)).includes('Avval bemorni tanlang.') && (await govde(p)).includes('QA Karimova Dilnoza'))
  await onEkAltinda(p, 'visit: choose the patient')
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.uza-liste a.uza-satir')])
  await p.waitForSelector('input[name=riza]')
  kontrol('the visit screen of that patient', new URL(p.url()).searchParams.get('hasta') === hastaA && (await metin(p, 'h1')) === 'QA Karimova Dilnoza Rustam qizi')
  kontrol('a five-year-old: the pediatric template is preselected; only the two open templates are offered', await p.$eval('input[name=sablon][value=pediatri]', (e) => e.checked) && (await p.$$eval('input[name=sablon]', (l) => l.map((e) => e.value).join())) === 'genel,pediatri')
  // CONSENT blocks recording.
  const once = await p.evaluate(() => ({ kapali: document.querySelector('.uza-form button.uza-dugme').disabled, isaretli: document.querySelector('input[name=riza]').checked, ipucu: document.querySelector('#uza-riza-ipucu')?.innerText }))
  kontrol('consent: the box starts unticked and the record button is disabled, with the reason under it', once.kapali && !once.isaretli && once.ipucu === 'Yozishni boshlash uchun rozilikni belgilang.', JSON.stringify(once))
  await p.evaluate(() => document.querySelector('.uza-form button.uza-dugme').click())
  await bekle(500)
  kontrol('consent: pressing the disabled button records nothing', !(await p.$('.uza-sure')) && cagrilar().length === 0)
  const rizasiz = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: 'aaaaaaaa-0000-4000-8000-000000000001/yoq.webm', hastaId: hastaA, sablon: 'genel' } })
  kontrol('consent: the server refuses a visit without it as well', rizasiz.s === 400 && rizasiz.t === '{"code":"RIZA_GEREKLI"}', `${rizasiz.s} ${rizasiz.t}`)
  await onEkAltinda(p, 'visit: consent')
  await cek(p, 'visit-consent-uz.png', false)

  // HIGH confidence: one speech pass, then the note in Uzbek.
  const sure = await kayitYap(p)
  notYuksek = new URL(p.url()).searchParams.get('not') || ''
  let g = await govde(p)
  kontrol('recording ran with a timer; then the NOTE of the visit opened', /^00:0[2-9]$/.test(sure) && /^[0-9a-f-]{36}$/.test(notYuksek) && new URL(p.url()).pathname === adres('/visit'), `${sure} ${p.url()}`)
  let c = cagrilar()
  const stt = c.filter((x) => x.tur === 'stt'), mdl = c.filter((x) => x.tur === 'model')
  kontrol('high confidence: the speech engine was asked ONCE, with scribe_v2, no language, and the recording', stt.length === 1 && stt[0].model === 'scribe_v2' && stt[0].dil === null && stt[0].bayt > 200 && stt[0].anahtar, JSON.stringify(stt))
  kontrol('the note was asked for ONCE, in Uzbek (Latin), through the gateway, with "do not keep this data"', mdl.length === 1 && mdl[0].is === 'not' && mdl[0].dil === 'uz-Latn' && mdl[0].model.length > 3 && mdl[0].veriToplama === 'deny' && mdl[0].sistemUzunluk > 1200, JSON.stringify(mdl))
  kontrol('the model was given the age — and nothing that says who the patient is', mdl[0]?.yasVar === true && mdl[0]?.kimlikVar === false, JSON.stringify(mdl[0]))
  const yuklemeler = (await (await fetch(`${SUPA}/__gunluk`)).json()).filter((x) => x.startsWith('POST /storage/v1/object/'))
  kontrol('the recording was uploaded to the doctor\'s own folder of the recordings bucket', yuklemeler.length === 1 && yuklemeler[0].startsWith('POST /storage/v1/object/muayene-sesleri/aaaaaaaa-0000-4000-8000-000000000001/'), yuklemeler.join(' '))
  kontrol('the recording is gone from storage once transcribed', (await (await fetch(`${SUPA}/__depo`)).json()).length === 0)
  let kayitlar = await tabloOku('muayene_dil_kaydi')
  seansYuksek = kayitlar[0]?.session_id || ''
  kontrol('stored with the visit: predicted language and its probability, consent stamp, one pass', kayitlar.length === 1 && kayitlar[0].taninan_dil === 'uzb' && kayitlar[0].dil_olasiligi === 0.97 && kayitlar[0].gecis_sayisi === 1 && kayitlar[0].ikinci_gecis === false && kayitlar[0].dusuk_guven === false && kayitlar[0].riza_surumu === 'uz-taslak-2026-10-08' && !!kayitlar[0].riza_at && kayitlar[0].not_dili === 'uz-Latn', JSON.stringify(kayitlar[0]))
  kontrol('NOTE in Uzbek: a draft with four sections to edit, written from the visit', (await alan(p, 's')).includes('uch kundan beri isitma') && (await alan(p, 'p')).includes('Uch kundan keyin qayta koʻrik.') && g.includes('Qoralama') && g.includes('Shikoyatlar va anamnez') && g.includes('Obyektiv koʻrik') && g.includes('Tashxis va baholash') && g.includes('Reja'))
  kontrol('the doctor is told the model wrote it; the visit language is named; no low-confidence notice', g.includes('Qaydni sunʼiy intellekt tayyorladi.') && g.includes('oʻzbekcha') && !g.includes('diqqat bilan tekshiring') && !g.includes('ikkinchi marta'))
  kontrol('the transcript is kept with the note', (await p.$eval('[data-alan=transkript]', (e) => e.textContent)).includes('Qizimning uch kundan beri isitmasi bor'))
  await onEkAltinda(p, 'note (draft)')
  await cek(p, 'note-draft-uz.png')
  let notSatiri = (await tabloOku('notes'))[0]
  kontrol('in the database: a note of this doctor, NOT approved', notSatiri.id === notYuksek && notSatiri.doctor_id === 'aaaaaaaa-0000-4000-8000-000000000001' && !notSatiri.approved_at && notSatiri.content_plan.includes('Uch kundan keyin'))

  // The doctor edits and saves the draft.
  await p.click('#uza-not-p'); await p.keyboard.down('Control'); await p.keyboard.press('End'); await p.keyboard.up('Control')
  await p.type('#uza-not-p', ' Paratsetamol 250 mg.')
  await p.click('[data-eylem=kaydet]')
  await p.waitForSelector('.uza-bilgi-kutu')
  notSatiri = (await tabloOku('notes'))[0]
  kontrol('the doctor edits the draft and saves it', (await metin(p, '.uza-bilgi-kutu')) === 'Qoralama saqlandi.' && notSatiri.content_plan.endsWith('Paratsetamol 250 mg.') && !notSatiri.approved_at)

  // ONE CLICK: the same note in Russian, as a second draft.
  kontrol('one button offers the note in the other language', (await metin(p, '[data-eylem=yeniden-yaz]')) === 'Rus tilida qayta yozish')
  await p.click('[data-eylem=yeniden-yaz]')
  await p.waitForSelector('input[name=taslak-dili]', { timeout: 60000 })
  await p.waitForFunction(() => document.querySelector('input[name=taslak-dili][value=ru]')?.checked, { timeout: 20000 })
  g = await govde(p)
  kontrol('REWRITE in Russian: a second draft opens, marked as the second, and the first is still there to choose', (await alan(p, 's')).includes('третий день температура') && g.includes('Bu ikkinchi qoralama.') && (await p.$$eval('input[name=taslak-dili]', (l) => l.map((e) => e.value).join())) === 'uz-Latn,ru' && !(await p.$('[data-eylem=yeniden-yaz]')))
  kontrol('the rewrite was made from the note as the doctor had edited it', (await alan(p, 'p')).includes('парацетамол 250 мг'))
  c = cagrilar().filter((x) => x.tur === 'model')
  kontrol('the rewrite was ONE more model call, in Russian, with no patient identity in it', c.length === 2 && c[1].is === 'yeniden' && c[1].dil === 'ru' && c[1].duzeltmeVar === true && c[1].kimlikVar === false && c[1].veriToplama === 'deny', JSON.stringify(c[1]))
  notSatiri = (await tabloOku('notes'))[0]
  let dilSatiri = (await tabloOku('not_dil_kaydi'))[0]
  kontrol('in the database the Uzbek note is untouched; the Russian draft is stored beside it', notSatiri.content_subjektif.includes('uch kundan beri isitma') && !notSatiri.approved_at && dilSatiri.not_dili === 'uz-Latn' && dilSatiri.ikinci_dil === 'ru' && dilSatiri.ikinci_s.includes('температура'))
  await sec(p, 'taslak-dili', 'uz-Latn'); await bekle(150)
  kontrol('switching back shows the Uzbek draft, with the doctor\'s edit', (await alan(p, 'p')).endsWith('Paratsetamol 250 mg.') && !(await govde(p)).includes('Bu ikkinchi qoralama.'))
  await sec(p, 'taslak-dili', 'ru'); await bekle(150)
  await cek(p, 'note-second-draft-ru.png')

  // APPROVE the Russian draft.
  await p.click('[data-eylem=onayla]')
  await p.waitForSelector('[data-bolum=s]', { timeout: 30000 })
  g = await govde(p)
  kontrol('APPROVE: the Russian draft becomes the note; it is shown as text with nothing left to change it', g.includes('Tasdiqlangan') && g.includes('Qayd tasdiqlandi va bemor varaqasiga saqlandi.') && (await metin(p, '[data-bolum=s]')).includes('третий день температура') && !(await p.$('textarea')) && !(await p.$('[data-eylem]')) && !(await p.$('input[name=taslak-dili]')))
  notSatiri = (await tabloOku('notes'))[0]
  dilSatiri = (await tabloOku('not_dil_kaydi'))[0]
  kontrol('in the database: approved by this doctor, Russian text; the Uzbek draft is kept beside it', !!notSatiri.approved_at && notSatiri.approved_by === 'aaaaaaaa-0000-4000-8000-000000000001' && notSatiri.content_plan.includes('парацетамол 250 мг') && dilSatiri.not_dili === 'ru' && dilSatiri.ikinci_dil === 'uz-Latn' && dilSatiri.ikinci_p.endsWith('Paratsetamol 250 mg.'))
  await cek(p, 'note-approved-ru.png')
  // AN APPROVED NOTE IS NEVER OVERWRITTEN.
  const onceki = JSON.stringify([await tabloOku('notes'), await tabloOku('not_dil_kaydi')])
  const modelOnce = cagrilar().filter((x) => x.tur === 'model').length
  const gecKayit = await api(p, '/api/ulke/not', { method: 'PATCH', govde: { notId: notYuksek, dil: 'ru', s: 'OʻZGARTIRILDI', o: '', a: '', p: '' } })
  const ikinciOnay = await api(p, '/api/ulke/not/onayla', { method: 'POST', govde: { notId: notYuksek, dil: 'ru', s: 'OʻZGARTIRILDI', o: 'x', a: 'x', p: 'x' } })
  const gecYeniden = await api(p, '/api/ulke/not/yeniden-yaz', { method: 'POST', govde: { notId: notYuksek } })
  kontrol('approved note: a late save, a second approval and a rewrite are all refused (409 ONAYLI)', [gecKayit, ikinciOnay, gecYeniden].every((r) => r.s === 409 && r.t === '{"code":"ONAYLI"}'), [gecKayit, ikinciOnay, gecYeniden].map((r) => `${r.s} ${r.t}`).join(' | '))
  kontrol('approved note: nothing changed in the database and no model was called', JSON.stringify([await tabloOku('notes'), await tabloOku('not_dil_kaydi')]) === onceki && cagrilar().filter((x) => x.tur === 'model').length === modelOnce)
  await p.reload({ waitUntil: 'networkidle0' })
  await p.waitForSelector('[data-bolum=s]')
  kontrol('approved note: after a reload it is the same text, still read-only', (await metin(p, '[data-bolum=p]')).includes('парацетамол 250 мг') && !(await p.$('textarea')))
  await onEkAltinda(p, 'note (approved)')

  // LOW confidence + the model is down: the second speech pass runs, the visit is kept, the note is asked for again.
  senaryoYaz({ stt: 'dusuk', model: 'hata' })
  const sttOnce = cagrilar().filter((x) => x.tur === 'stt').length
  await git(p, `/visit?hasta=${hastaA}`)
  await kayitYap(p)
  const seansDusuk = new URL(p.url()).searchParams.get('seans') || ''
  g = await govde(p)
  c = cagrilar().filter((x) => x.tur === 'stt').slice(sttOnce)
  kontrol('low confidence: a SECOND speech pass ran, forced to the doctor\'s note language (Uzbek) — and no third', c.length === 2 && c[0].dil === null && c[1].dil === 'uzb' && c[0].bayt === c[1].bayt && c.every((x) => x.model === 'scribe_v2'), JSON.stringify(c))
  kontrol('the model failed: the recorded visit opens instead, says so in Uzbek, keeps the transcript and offers to try again', /^[0-9a-f-]{36}$/.test(seansDusuk) && g.includes('Qaydni tayyorlab boʻlmadi. Suhbat matni saqlandi.') && g.includes('Qizimda uch kundan beri isitma') && (await metin(p, '[data-eylem=not-yaz]')) === 'Qaydni qaytadan tayyorlash', g.replace(/\s+/g, ' ').slice(0, 200))
  kontrol('low confidence: the better transcript (the second) was kept', !g.includes('yotal burun ishtaha past'))
  kontrol('low confidence stayed low: a plain notice, and the second pass is mentioned', g.includes('Qaydni diqqat bilan tekshiring.') && g.includes('ikkinchi marta qayta ishlandi') && g.includes('aniqlanmadi'))
  kayitlar = await tabloOku('muayene_dil_kaydi')
  const k2 = kayitlar.find((k) => k.session_id === seansDusuk)
  kontrol('stored with the visit: the second pass (for counting cost), which pass was kept, still low', !!k2 && k2.ikinci_gecis === true && k2.ikinci_gecis_dili === 'uzb' && k2.gecis_sayisi === 2 && k2.secilen_gecis === 2 && k2.dusuk_guven === true && k2.taninan_dil === 'uzb' && k2.dil_olasiligi === 0.52, JSON.stringify(k2))
  kontrol('no note was stored for the failed attempt', (await tabloOku('notes')).length === 1)
  await onEkAltinda(p, 'recorded visit (note failed)')
  await cek(p, 'visit-note-failed-uz.png')
  senaryoYaz({ stt: 'yuksek', model: 'tamam' })
  await p.click('[data-eylem=not-yaz]')
  await p.waitForFunction(() => new URLSearchParams(location.search).has('not'), { timeout: 120000 })
  await p.waitForSelector('#uza-not-s', { timeout: 60000 })
  notDusuk = new URL(p.url()).searchParams.get('not') || ''
  g = await govde(p)
  kontrol('asked again, the note IS written — and its screen asks the doctor to check it carefully', /^[0-9a-f-]{36}$/.test(notDusuk) && notDusuk !== notYuksek && (await alan(p, 's')).includes('uch kundan beri isitma') && g.includes('Yozuv sifati yoki tili sababli matn notoʻgʻri tanilgan boʻlishi mumkin. Qaydni diqqat bilan tekshiring.') && g.includes('ikkinchi marta qayta ishlandi'))
  await cek(p, 'note-low-confidence-uz.png')
  kontrol('no outside address was contacted by the server', !cagrilar().some((x) => x.tur === 'REFUSED'), JSON.stringify(cagrilar().filter((x) => x.tur === 'REFUSED')))

  await git(p, `/patient?id=${hastaA}`)
  await p.waitForSelector('.uza-liste')
  const dosya = await adresler(p)
  g = await govde(p)
  kontrol('the patient file: the approved note under "approved notes", the draft under "drafts", and a new visit can be started', g.includes('Tasdiqlangan qaydlar') && g.includes('Tasdiqlanmagan qoralamalar') && dosya.hepsi.includes(`${ON_EK}/visit?not=${notYuksek}`) && dosya.hepsi.includes(`${ON_EK}/visit?not=${notDusuk}`) && dosya.hepsi.includes(`${ON_EK}/visit?hasta=${hastaA}`), dosya.hepsi.join(' '))
  await git(p, '/today')
  await p.waitForSelector('.uza-liste')
  const bugun = await p.$$eval('.uza-liste a.uza-satir', (l) => l.map((e) => `${e.getAttribute('href')} ${e.innerText.replace(/\s+/g, ' ')}`))
  kontrol('the home lists today\'s two visits, one approved and one draft, each leading to its note', bugun.length === 2 && bugun.some((b) => b.includes(`?not=${notYuksek}`) && b.includes('Tasdiqlangan')) && bugun.some((b) => b.includes(`?not=${notDusuk}`) && b.includes('Qoralama')), bugun.join(' | '))
}
{
  // ISOLATION on visits and notes: doctor B and doctor A's visit, note, patient and folder.
  const p = B
  const r = await api(p, `/api/ulke/muayene?id=${seansYuksek}`)
  const yok = await api(p, '/api/ulke/muayene?id=30000000-0000-4000-8000-00000000dead')
  kontrol('doctor B asks the API for doctor A\'s visit: the same answer as for a visit that does not exist', r.s === 404 && r.t === '{"code":"NOT_FOUND"}' && yok.t === r.t, `${r.s} ${r.t}`)
  const onceki = JSON.stringify([await tabloOku('notes'), await tabloOku('not_dil_kaydi')])
  const once = cagrilar().length
  const denemeler = [
    ['read', await api(p, `/api/ulke/not?id=${notDusuk}`)],
    ['write a note for the visit', await api(p, '/api/ulke/not', { method: 'POST', govde: { seansId: seansYuksek } })],
    ['save', await api(p, '/api/ulke/not', { method: 'PATCH', govde: { notId: notDusuk, dil: 'uz-Latn', s: 'YABANCI', o: '', a: '', p: '' } })],
    ['rewrite', await api(p, '/api/ulke/not/yeniden-yaz', { method: 'POST', govde: { notId: notDusuk } })],
    ['approve', await api(p, '/api/ulke/not/onayla', { method: 'POST', govde: { notId: notDusuk, dil: 'uz-Latn', s: 'YABANCI', o: 'x', a: 'x', p: 'x' } })],
  ]
  for (const [ad, d] of denemeler) kontrol(`doctor B cannot ${ad} doctor A's note: not found`, d.s === 404 && d.t === '{"code":"NOT_FOUND"}', `${d.s} ${d.t}`)
  kontrol('doctor A\'s notes are unchanged and no model was called for doctor B\'s attempts', JSON.stringify([await tabloOku('notes'), await tabloOku('not_dil_kaydi')]) === onceki && cagrilar().length === once)
  for (const [ad, rota, beklenen] of [['visit', `/visit?seans=${seansYuksek}`, 'Приём не найден.'], ['note', `/visit?not=${notYuksek}`, 'Запись не найдена.']]) {
    await git(p, rota)
    await p.waitForSelector('[role=alert]')
    const g = await govde(p)
    kontrol(`doctor B opens the address of doctor A's ${ad}: "not found", no text of it, no patient`, g.includes(beklenen) && !/isitma|температура|Karimova|Qizim/.test(g), g.replace(/\s+/g, ' ').slice(0, 100))
  }
  const yabanciHasta = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: 'aaaaaaaa-0000-4000-8000-000000000002/x.webm', hastaId: hastaA, sablon: 'genel', riza: true } })
  kontrol('doctor B cannot record a visit for doctor A\'s patient', yabanciHasta.s === 404 && yabanciHasta.t === '{"code":"NOT_FOUND"}', `${yabanciHasta.s} ${yabanciHasta.t}`)
  const yabanciYol = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: 'aaaaaaaa-0000-4000-8000-000000000001/x.webm', hastaId: hastaB, sablon: 'genel', riza: true } })
  kontrol('doctor B cannot name a recording in doctor A\'s folder', yabanciYol.s === 400 && yabanciYol.j?.alan === 'yol', `${yabanciYol.s} ${yabanciYol.t}`)
  kontrol('none of it reached the speech engine or the model', cagrilar().length === once)
  // Doctor B's own visit: the same recording, a note in RUSSIAN (B's note language), offered in Uzbek.
  await git(p, '/visit')
  await p.waitForSelector('.uza-liste a.uza-satir')
  kontrol('doctor B\'s patient picker offers only doctor B\'s patient', (await govde(p)).includes('Иванов') && !(await govde(p)).includes('Karimova'))
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.uza-liste a.uza-satir')])
  await kayitYap(p)
  const mdl = cagrilar().filter((x) => x.tur === 'model').pop()
  kontrol('doctor B: the note is written in Russian, on a phone-sized screen, and can be rewritten in Uzbek', new URL(p.url()).searchParams.has('not') && (await alan(p, 's')).includes('третий день температура') && mdl.is === 'not' && mdl.dil === 'ru' && (await metin(p, '[data-eylem=yeniden-yaz]')) === 'Переписать на узбекском' && (await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0)
  await cek(p, 'note-phone-ru.png')
  const notlar = await tabloOku('notes')
  kontrol('three notes in the database, each under its own doctor', notlar.length === 3 && notlar.filter((n) => n.doctor_id === 'aaaaaaaa-0000-4000-8000-000000000001').length === 2 && notlar.filter((n) => n.doctor_id === 'aaaaaaaa-0000-4000-8000-000000000002').length === 1)
  const kullanim = await tabloOku('ai_token_kullanim')
  kontrol('every model call left a usage row with the doctor and the task — and no patient', kullanim.length >= 4 && kullanim.every((k) => /^aaaaaaaa-0000-4000-8000-00000000000[12]$/.test(k.doctor_id) && ['soap', 'not-uretimi'].includes(k.gorev) && !('patient_id' in k)), JSON.stringify(kullanim[0]))
}

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
