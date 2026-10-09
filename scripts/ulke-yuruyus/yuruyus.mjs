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
 *   mkdir /tmp/yuruyus && cd /tmp/yuruyus && npm i puppeteer-core @sparticuz/chromium @fontsource-variable/fraunces @fontsource/source-sans-3 \
 *     @fontsource-variable/outfit @fontsource-variable/source-serif-4 @fontsource-variable/onest   # the last three: landing page only
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
 * NOTYA-UZ-RANDEVU-01 — step 8b walks through appointments: set working hours, book from the calendar, the
 * double-booking and outside-hours answers, copy a reminder in Russian, move, start the visit from the appointment,
 * approve the note and see the appointment done, the week view, the home, a phone.
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
// NOTYA-UZ-ACILIS-02 — the landing page asks for other faces than the application screens (the Turkish landing page's
// two, upright and with the weight axis only, as that page loads them, and a Cyrillic companion for each).
const ACILIS_FONT_CSS = [
  ...[['latin', LATIN], ['latin-ext', LATIN_EXT]].flatMap(([alt, aralik]) => [
    yuz('Fraunces', 'normal', '100 900', `fraunces/fraunces-${alt}-wght-normal.woff2`, aralik),
    yuz('Outfit', 'normal', '100 900', `outfit/outfit-${alt}-wght-normal.woff2`, aralik),
  ]),
  ...[['cyrillic', KIRIL], ['cyrillic-ext', KIRIL_EXT]].flatMap(([alt, aralik]) => [
    yuz('Source Serif 4', 'normal', '200 900', `source-serif-4/source-serif-4-${alt}-wght-normal.woff2`, aralik),
    yuz('Onest', 'normal', '100 900', `onest/onest-${alt}-wght-normal.woff2`, aralik),
  ]),
].join('\n')
const ACILIS_FONT_VAR = existsSync(join(FONT, '@fontsource-variable/outfit'))
const FONT_PAKETI = { fraunces: '@fontsource-variable/fraunces', outfit: '@fontsource-variable/outfit', 'source-serif-4': '@fontsource-variable/source-serif-4', onest: '@fontsource-variable/onest', ss3: '@fontsource/source-sans-3' }

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
    if (u.startsWith('https://fonts.googleapis.com/')) {
      if (u.includes('family=Outfit')) return r.respond({ status: 200, contentType: 'text/css', body: ACILIS_FONT_VAR ? ACILIS_FONT_CSS : '' })
      return r.respond({ status: 200, contentType: 'text/css', body: FONT_VAR ? FONT_CSS : '' })
    }
    if (u.startsWith('https://fonts.gstatic.com/yerel/')) {
      const [paket, dosya] = u.slice('https://fonts.gstatic.com/yerel/'.length).split('/')
      const yol = join(FONT, FONT_PAKETI[paket] ?? FONT_PAKETI.ss3, 'files', dosya)
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
// NOTYA-UZ-ACILIS-02 — the page rebuilt on the Turkish landing page: its three ways out, and its third form.
{
  const p = await sayfaAc(MASA)
  await git(p, '/')
  const bolumler = await p.evaluate(() => [...document.querySelectorAll('.uzl section[id]')].map((e) => e.id))
  kontrol('landing: the twelve sections of the Turkish page, in its order', bolumler.join(' ') === 'top suhbat qabul portal maslahat jadval yonalish kuzatuv organish xavfsizlik narx sorov', bolumler.join(' '))
  const gorseller = await p.evaluate(() => [...document.querySelectorAll('.uzl img')].map((e) => ({ src: e.getAttribute('src'), tamam: e.complete && e.naturalWidth > 0 })))
  kontrol(`landing: the three photographs load, from ${ON_EK}/_next/static/media/`, gorseller.length === 3 && gorseller.every((g) => g.tamam && g.src.startsWith(`${ON_EK}/_next/static/media/`)), JSON.stringify(gorseller))
  const yazi = await p.evaluate(() => ({ baslik: getComputedStyle(document.querySelector('.uzl h1')).fontFamily, govde: getComputedStyle(document.querySelector('.uzl h1 + p')).fontFamily, zemin: getComputedStyle(document.querySelector('.uzl')).backgroundColor }))
  kontrol('landing: the Turkish page\'s faces and ground (Fraunces headline, Outfit text, #f3f6f5)', /^Fraunces/.test(yazi.baslik.replace(/["']/g, '')) && /^Outfit/.test(yazi.govde.replace(/["']/g, '')) && yazi.zemin === 'rgb(243, 246, 245)', JSON.stringify(yazi))
  // landing → request form: the filled button in the bar and the main hero button
  for (const [ad, sel] of [['top-bar button', '.uzl header a[href="#sorov"]'], ['hero button', '.uzl #top a[href="#sorov"]']]) {
    await p.evaluate(() => window.scrollTo(0, 0)); await bekle(150)
    await p.click(sel); await bekle(700)
    const form = await p.evaluate(() => { const f = document.querySelector('#sorov form.uzl-form'); if (!f) return null; const k = f.getBoundingClientRect(); return { gorunur: k.top < innerHeight && k.bottom > 0, capa: location.hash, alanlar: f.querySelectorAll('input, textarea').length } })
    kontrol(`landing → request form (${ad}): the form is on screen`, !!form && form.gorunur && form.capa === '#sorov' && form.alanlar === 5, JSON.stringify(form))
  }
  kontrol('landing: "request a price" never names an amount or a trial', !/\d\s*(soʻm|сум|сўм|UZS|USD|\$)|bepul|бесплатн/i.test(await govde(p)))
  // the second hero button: the typed illustration on this same page — no other address, no video, no account
  await p.evaluate(() => window.scrollTo(0, 0)); await bekle(150)
  const onceki = p.istekler.length
  await p.click('.uzl #top a[href="#suhbat"]'); await bekle(700)
  const suhbat = await p.evaluate(() => ({ capa: location.hash, yol: location.pathname, ust: Math.round(document.querySelector('#suhbat').getBoundingClientRect().top), video: document.querySelectorAll('video, iframe, audio').length }))
  kontrol('landing: the second hero button scrolls to the illustration on the page (no video, no other page, no request)', suhbat.capa === '#suhbat' && suhbat.yol === ON_EK && Math.abs(suhbat.ust) < 120 && suhbat.video === 0 && p.istekler.length === onceki, JSON.stringify(suhbat))
  // landing → login
  await p.evaluate(() => window.scrollTo(0, 0)); await bekle(150)
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('.uzl header a[href$="/login"]')])
  kontrol('landing → login: the Uzbek login page', new URL(p.url()).pathname === adres('/login') && !!(await p.$('#ulke-giris-eposta')) && (await metin(p, 'button[type=submit]')) === 'Kirish', p.url())
  // landing → invitation sign-up (the link beside the request form, and the one in the footer)
  for (const [ad, sel] of [['beside the request form', '.uzl #sorov a[href$="/signup"]'], ['footer', '.uzl footer a[href$="/signup"]']]) {
    await git(p, '/')
    await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.evaluate((s) => document.querySelector(s).click(), sel)])
    const g = await govde(p)
    kontrol(`landing → invitation sign-up (${ad}): the sign-up page asks for an invitation code`, new URL(p.url()).pathname === adres('/signup') && /taklif kodi/i.test(g), p.url())
  }
  // the third form: Uzbek in Cyrillic script, from the footer; its login link is the public (Latin) one
  await git(p, '/')
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.evaluate(() => document.querySelector('.uzl footer a[hreflang="uz-Cyrl"]').click())])
  const kiril = await p.evaluate(() => ({ lang: document.querySelector('.uzl').lang, h1: document.querySelector('h1').innerText, giris: document.querySelector('.uzl footer a[href*="/login"]').getAttribute('href') }))
  kontrol('landing in Uzbek Cyrillic, from the footer', p.url() === `${TABAN}${ON_EK}?dil=uz-Cyrl` && kiril.lang === 'uz-Cyrl' && /Бемор хонадан чиққанда/.test(kiril.h1) && kiril.giris === adres('/login'), JSON.stringify(kiril))
  kontrol('landing in Uzbek Cyrillic: no Turkish letter, no console error', !TURKCE_HARF.test(await govde(p)) && p.konsol.length === 0, p.konsol.join(' | ').slice(0, 200))
  await p.browserContext().close()
}
// the menu of the phone layout: section links, request a price, login
{
  const p = await sayfaAc(TEL)
  await git(p, '/?dil=ru')
  await p.click('.uzl header button[aria-expanded]'); await bekle(200)
  const menu = await p.evaluate(() => [...document.querySelectorAll('.uzl nav[aria-label="Мобильное меню"] a')].map((a) => `${a.getAttribute('href')} ${a.innerText.replace(/\s+/g, ' ')}`))
  kontrol('landing, phone: the menu opens with the five section links, request a price and login', menu.length === 7 && menu[5].startsWith('#sorov') && menu[6].startsWith(`${ON_EK}/login?dil=ru`), menu.join(' | '))
  await p.evaluate(() => document.querySelector('.uzl nav[aria-label="Мобильное меню"] a[href="#narx"]').click()); await bekle(600)
  kontrol('landing, phone: a menu link closes the menu and goes to its section', !(await p.$('.uzl nav[aria-label="Мобильное меню"]')) && (await p.evaluate(() => location.hash)) === '#narx')
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
  // NOTYA-UZ-BRANSLAR-01 — the second question, in the language just chosen: what are you? One of 40 roles.
  await p.waitForSelector('[data-alan=rol-sorusu] select[name=rol]', { timeout: 60000 })
  const rolSorusu = await p.evaluate(() => ({
    yol: location.pathname, h1: document.querySelector('h1').innerText, nav: !!document.querySelector('.uza-nav'),
    gruplar: [...document.querySelectorAll('select[name=rol] optgroup')].map((g) => `${g.label}:${g.children.length}`).join('|'),
    adlar: [...document.querySelectorAll('select[name=rol] optgroup option')].map((o) => o.textContent),
  }))
  kontrol('after the language: "what are you?", in Uzbek Latin, on the same address, with no navigation', rolSorusu.yol === adres('/start') && rolSorusu.h1 === 'Mutaxassisligingiz qaysi?' && !rolSorusu.nav, JSON.stringify(rolSorusu).slice(0, 160))
  kontrol('40 roles in three groups (30 doctor specialties, 5 clinic doctors, 5 clinic allied professions), by name — never by internal key, no Turkish letter', rolSorusu.gruplar === 'Shifokor mutaxassisligi:30|Klinika shifokori:5|Klinika mutaxassisi:5' && rolSorusu.adlar.includes('Kardiologiya') && rolSorusu.adlar.includes('Diyetolog') && !rolSorusu.adlar.some((a) => /kardiyoloji|diyetisyen|-hastaliklari|-cerrahi/.test(a)) && !TURKCE_HARF.test(rolSorusu.adlar.join(' ')), rolSorusu.gruplar)
  await p.click('button[type=submit]'); await bekle(400)
  kontrol('the role question cannot be skipped: without a choice nothing is saved and the page stays', new URL(p.url()).pathname === adres('/start') && (await (await fetch(`${SUPA}/__tablo/hekim_rolu`)).json()).length === 0)
  await p.select('select[name=rol]', 'pediatri')
  await cek(p, 'start-role-uz.png', false)
  await p.click('button[type=submit]')
  await yolda(p, '/today')
  await p.waitForSelector('h1', { timeout: 60000 })
  const rolSatiri = await (await fetch(`${SUPA}/__tablo/hekim_rolu`)).json()
  kontrol('the role is stored for this account and for no other', rolSatiri.length === 1 && rolSatiri[0].doctor_id === 'aaaaaaaa-0000-4000-8000-000000000001' && rolSatiri[0].rol === 'pediatri', JSON.stringify(rolSatiri))
  await p.waitForSelector('[data-alan=asistan-ad]')
  kontrol('the home shows this role\'s assistant by the owner\'s name, with one neutral line and no biography', (await metin(p, '[data-alan=asistan-ad]')) === 'Dr. Malika Nazarova' && (await metin(p, '[data-alan=asistan-satir]')) === 'Katta hamkasbingiz · Pediatriya' && !/\d+\s*yil|professor|tajriba/i.test(await metin(p, '[data-alan=asistan]')), await metin(p, '[data-alan=asistan]'))
  kontrol('answer saved → the home, in Uzbek Latin', (await govde(p)).includes('Bugungi koʻriklar') && (await metin(p, 'h1')) === 'QA Shifokor Bir')
  const tercih = await (await fetch(`${SUPA}/__tablo/hekim_dil_tercihleri`)).json()
  kontrol('the answer is stored for this account: notes in Uzbek Latin, question answered', tercih.length === 1 && tercih[0].doctor_id === 'aaaaaaaa-0000-4000-8000-000000000001' && tercih[0].not_dili === 'uz-Latn' && !!tercih[0].soruldu_at, JSON.stringify(tercih))
  await onEkAltinda(p, 'home')
  await cek(p, 'today-uz.png', false)
  await git(p, '/start')
  await yolda(p, '/today')
  kontrol('both questions are asked once: going back to them returns to the home', true)
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
  const ham = JSON.stringify([await (await fetch(`${SUPA}/__tablo/ulke_hastalar`)).json(), await (await fetch(`${SUPA}/__tablo/hasta_ulke_bilgisi`)).json()])
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
  // NOTYA-UZ-BRANSLAR-01 — B is not a doctor: a clinic allied profession (dietitian), chosen in Russian.
  await p.waitForSelector('[data-alan=rol-sorusu] select[name=rol]', { timeout: 60000 })
  kontrol('doctor B: the role question in Russian, with the allied professions as their own group', (await metin(p, 'h1')) === 'Какая у вас специальность?' && (await p.$$eval('select[name=rol] optgroup', (l) => l.map((g) => g.label).join('|'))) === 'Врачебная специальность|Врач клиники|Специалист клиники' && (await p.$eval('select[name=rol] option[value=diyetisyen]', (o) => o.textContent)) === 'Диетолог')
  await p.select('select[name=rol]', 'diyetisyen')
  await p.click('button[type=submit]')
  await yolda(p, '/today')
  await p.waitForSelector('[data-alan=asistan-ad]', { timeout: 60000 })
  // The Russian form of the owner's name is DERIVED by rule (countries/uz/yozuv.ts) and awaits a native reader.
  kontrol('B\'s home: the allied role\'s assistant with the profession\'s own title (not "Dr."), in the machine-derived Russian form', (await metin(p, '[data-alan=asistan-ad]')) === 'Диетолог Махлиё Турсунова' && (await metin(p, '[data-alan=asistan-satir]')) === 'Ваш старший коллега · Диетолог', await metin(p, '[data-alan=asistan]'))
  kontrol('two accounts, two roles, one row each', JSON.stringify((await (await fetch(`${SUPA}/__tablo/hekim_rolu`)).json()).map((r) => r.rol).sort()) === '["diyetisyen","pediatri"]')
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
// NOTYA-UZ-BRANSLAR-01 — a role's fields on the note screen: the labels that are drawn, and one field's text.
const alanEtiketleri = (p) => p.$$eval('[data-alan-anahtar] label, [data-alan-anahtar] h3', (l) => l.map((e) => e.innerText.trim()))
const alanDegeri = (p, k) => p.$eval(`#uza-alan-${k}`, (e) => e.value).catch(() => null)
const anahtarlar = (o) => Object.keys(o || {}).sort().join()
const PEDIATRI_ALANLARI = 'birth_history,feeding,sleep,development,vaccination_said,weight_height,head_circumference,temperature'
const KARDIYOLOJI_ALANLARI = 'chest_pain,effort_tolerance,risk_factors,regular_medicines,blood_pressure_pulse,cardiac_exam,ecg,echo'
const DIYETISYEN_ALANLARI = 'referral_diagnosis,diet_history,food_intolerances,weight_change,weight_height,body_composition,nutrition_plan,nutrition_goals'
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
  kontrol('the note template is the account\'s role, shown by name — it is not a choice — and the assistant that will prepare the note is named', (await metin(p, '[data-alan=sablon]')) === 'Pediatriya' && !(await p.$('input[name=sablon]')) && (await metin(p, '[data-alan=asistan-ad]')) === 'Dr. Malika Nazarova')
  const yabanciSablon = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: 'uz/aaaaaaaa-0000-4000-8000-000000000001/yoq.webm', hastaId: hastaA, sablon: 'odyoloji', riza: true } })
  kontrol('the server refuses another role\'s template for this account', yabanciSablon.s === 400 && yabanciSablon.t === '{"code":"GECERSIZ","alan":"sablon"}', `${yabanciSablon.s} ${yabanciSablon.t}`)
  // CONSENT blocks recording.
  const once = await p.evaluate(() => ({ kapali: document.querySelector('.uza-form button.uza-dugme').disabled, isaretli: document.querySelector('input[name=riza]').checked, ipucu: document.querySelector('#uza-riza-ipucu')?.innerText }))
  kontrol('consent: the box starts unticked and the record button is disabled, with the reason under it', once.kapali && !once.isaretli && once.ipucu === 'Yozishni boshlash uchun rozilikni belgilang.', JSON.stringify(once))
  await p.evaluate(() => document.querySelector('.uza-form button.uza-dugme').click())
  await bekle(500)
  kontrol('consent: pressing the disabled button records nothing', !(await p.$('.uza-sure')) && cagrilar().length === 0)
  const rizasiz = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: 'uz/aaaaaaaa-0000-4000-8000-000000000001/yoq.webm', hastaId: hastaA, sablon: 'genel' } })
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
  kontrol('the recording was uploaded to the country\'s folder and, inside it, the doctor\'s own folder of the recordings bucket', yuklemeler.length === 1 && yuklemeler[0].startsWith('POST /storage/v1/object/muayene-sesleri/uz/aaaaaaaa-0000-4000-8000-000000000001/'), yuklemeler.join(' '))
  kontrol('the recording is gone from storage once transcribed', (await (await fetch(`${SUPA}/__depo`)).json()).length === 0)
  let kayitlar = await tabloOku('muayene_dil_kaydi')
  seansYuksek = kayitlar[0]?.session_id || ''
  kontrol('stored with the visit: predicted language and its probability, consent stamp, one pass', kayitlar.length === 1 && kayitlar[0].taninan_dil === 'uzb' && kayitlar[0].dil_olasiligi === 0.97 && kayitlar[0].gecis_sayisi === 1 && kayitlar[0].ikinci_gecis === false && kayitlar[0].dusuk_guven === false && kayitlar[0].riza_surumu === 'uz-taslak-2026-10-08' && !!kayitlar[0].riza_at && kayitlar[0].not_dili === 'uz-Latn', JSON.stringify(kayitlar[0]))
  kontrol('NOTE in Uzbek: a draft with four sections to edit, written from the visit', (await alan(p, 's')).includes('uch kundan beri isitma') && (await alan(p, 'p')).includes('Uch kundan keyin qayta koʻrik.') && g.includes('Qoralama') && g.includes('Shikoyatlar va anamnez') && g.includes('Obyektiv koʻrik') && g.includes('Tashxis va baholash') && g.includes('Reja'))
  // NOTYA-UZ-BRANSLAR-01 — the note is in the ROLE's template. The stand-in model answers with fields of several
  // roles and one made-up key; only paediatrics' own fields (and, the patient being five, the guardian field) survive.
  {
    const et = await alanEtiketleri(p)
    kontrol('PAEDIATRIC TEMPLATE: the draft has paediatrics\' own fields under the four sections, and for a child "who gave the history"', et.length === 9 && ['Anamnezni kim bergani (ota-onasi yoki qonuniy vakili)', 'Ovqatlanishi', 'Bosh aylanasi (aytilgan raqam)', 'Tana harorati', 'Emlash haqida aytilganlar'].every((x) => et.includes(x)), et.join(' | '))
    kontrol('fields hold only what the visit contained: filled where something was said, empty where nothing was', (await alanDegeri(p, 'history_giver')) === 'Onasi.' && (await alanDegeri(p, 'feeding')) === 'Kuniga toʻrt mahal ovqatlanadi.' && (await alanDegeri(p, 'temperature')) === '38,5 gacha koʻtarilgan.' && (await alanDegeri(p, 'head_circumference')) === '' && (await alanDegeri(p, 'vaccination_said')) === '')
    kontrol('LEAK: no field of another role is drawn or filled — cardiology, dietetics, audiology, a made-up key', !et.some((x) => /Koʻkrakdagi|Elektrokardiogramma|Ovqatlanish tartibi|Audiometriya/.test(x)) && (await alanDegeri(p, 'chest_pain')) === null && (await alanDegeri(p, 'diet_history')) === null && !/XATO-MAYDON|Koʻkrakda ogʻriq yoʻq|Shirinlikni koʻp yeydi/.test(g))
    kontrol('in the database the note carries only its own role\'s fields', anahtarlar((await tabloOku('not_dil_kaydi'))[0].alanlar) === 'feeding,history_giver,temperature', JSON.stringify((await tabloOku('not_dil_kaydi'))[0].alanlar))
    kontrol('the model was instructed with paediatrics\' fields and no other role\'s', mdl[0].alanAnahtarlari === PEDIATRI_ALANLARI && mdl[0].muttefik === false, JSON.stringify(mdl[0]))
    kontrol('the draft names the assistant of the template it was written with', (await metin(p, '[data-alan=asistan-ad]')) === 'Dr. Malika Nazarova')
  }
  kontrol('the doctor is told the model wrote it; the visit language is named; no low-confidence notice', g.includes('Qaydni sunʼiy intellekt tayyorladi.') && g.includes('oʻzbekcha') && !g.includes('diqqat bilan tekshiring') && !g.includes('ikkinchi marta'))
  kontrol('the transcript is kept with the note', (await p.$eval('[data-alan=transkript]', (e) => e.textContent)).includes('Qizimning uch kundan beri isitmasi bor'))
  await onEkAltinda(p, 'note (draft)')
  await cek(p, 'note-draft-uz.png')
  let notSatiri = (await tabloOku('ulke_notlar'))[0]
  kontrol('in the database: a note of this doctor, NOT approved', notSatiri.id === notYuksek && notSatiri.doctor_id === 'aaaaaaaa-0000-4000-8000-000000000001' && !notSatiri.approved_at && notSatiri.content_plan.includes('Uch kundan keyin'))

  // The doctor edits and saves the draft.
  await p.click('#uza-not-p'); await p.keyboard.down('Control'); await p.keyboard.press('End'); await p.keyboard.up('Control')
  await p.type('#uza-not-p', ' Paratsetamol 250 mg.')
  await p.click('[data-eylem=kaydet]')
  await p.waitForSelector('.uza-bilgi-kutu')
  notSatiri = (await tabloOku('ulke_notlar'))[0]
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
  notSatiri = (await tabloOku('ulke_notlar'))[0]
  let dilSatiri = (await tabloOku('not_dil_kaydi'))[0]
  kontrol('in the database the Uzbek note is untouched; the Russian draft is stored beside it', notSatiri.content_subjektif.includes('uch kundan beri isitma') && !notSatiri.approved_at && dilSatiri.not_dili === 'uz-Latn' && dilSatiri.ikinci_dil === 'ru' && dilSatiri.ikinci_s.includes('температура'))
  kontrol('the second draft carries the same fields, rewritten in Russian — none added, none of another role', anahtarlar(dilSatiri.ikinci_alanlar) === 'feeding,history_giver,temperature' && dilSatiri.ikinci_alanlar.history_giver === 'Мать.' && dilSatiri.alanlar.history_giver === 'Onasi.' && (await alanDegeri(p, 'feeding')) === 'Ест четыре раза в день.', JSON.stringify(dilSatiri.ikinci_alanlar))
  await sec(p, 'taslak-dili', 'uz-Latn'); await bekle(150)
  kontrol('switching back shows the Uzbek draft, with the doctor\'s edit', (await alan(p, 'p')).endsWith('Paratsetamol 250 mg.') && !(await govde(p)).includes('Bu ikkinchi qoralama.'))
  await sec(p, 'taslak-dili', 'ru'); await bekle(150)
  await cek(p, 'note-second-draft-ru.png')

  // APPROVE the Russian draft.
  await p.click('[data-eylem=onayla]')
  await p.waitForSelector('[data-bolum=s]', { timeout: 30000 })
  g = await govde(p)
  kontrol('APPROVE: the Russian draft becomes the note; it is shown as text with nothing left to change it', g.includes('Tasdiqlangan') && g.includes('Qayd tasdiqlandi va bemor varaqasiga saqlandi.') && (await metin(p, '[data-bolum=s]')).includes('третий день температура') && !(await p.$('textarea')) && !(await p.$('[data-eylem]')) && !(await p.$('input[name=taslak-dili]')))
  notSatiri = (await tabloOku('ulke_notlar'))[0]
  dilSatiri = (await tabloOku('not_dil_kaydi'))[0]
  kontrol('in the database: approved by this doctor, Russian text; the Uzbek draft is kept beside it', !!notSatiri.approved_at && notSatiri.approved_by === 'aaaaaaaa-0000-4000-8000-000000000001' && notSatiri.content_plan.includes('парацетамол 250 мг') && dilSatiri.not_dili === 'ru' && dilSatiri.ikinci_dil === 'uz-Latn' && dilSatiri.ikinci_p.endsWith('Paratsetamol 250 mg.'))
  kontrol('the approved note keeps its fields: the Russian ones are the note\'s, the Uzbek ones stay with the other draft; empty fields are not shown', dilSatiri.alanlar.feeding === 'Ест четыре раза в день.' && dilSatiri.ikinci_alanlar.feeding === 'Kuniga toʻrt mahal ovqatlanadi.' && (await metin(p, '[data-alan-anahtar=feeding] p')) === 'Ест четыре раза в день.' && (await metin(p, '[data-alan-anahtar=feeding] h3')) === 'Ovqatlanishi' && !(await p.$('[data-alan-anahtar=head_circumference]')))
  await cek(p, 'note-approved-ru.png')
  // AN APPROVED NOTE IS NEVER OVERWRITTEN.
  const onceki = JSON.stringify([await tabloOku('ulke_notlar'), await tabloOku('not_dil_kaydi')])
  const modelOnce = cagrilar().filter((x) => x.tur === 'model').length
  const gecKayit = await api(p, '/api/ulke/not', { method: 'PATCH', govde: { notId: notYuksek, dil: 'ru', s: 'OʻZGARTIRILDI', o: '', a: '', p: '', alanlar: { feeding: 'OʻZGARTIRILDI' } } })
  const ikinciOnay = await api(p, '/api/ulke/not/onayla', { method: 'POST', govde: { notId: notYuksek, dil: 'ru', s: 'OʻZGARTIRILDI', o: 'x', a: 'x', p: 'x' } })
  const gecYeniden = await api(p, '/api/ulke/not/yeniden-yaz', { method: 'POST', govde: { notId: notYuksek } })
  kontrol('approved note: a late save, a second approval and a rewrite are all refused (409 ONAYLI)', [gecKayit, ikinciOnay, gecYeniden].every((r) => r.s === 409 && r.t === '{"code":"ONAYLI"}'), [gecKayit, ikinciOnay, gecYeniden].map((r) => `${r.s} ${r.t}`).join(' | '))
  kontrol('approved note: nothing changed in the database and no model was called', JSON.stringify([await tabloOku('ulke_notlar'), await tabloOku('not_dil_kaydi')]) === onceki && cagrilar().filter((x) => x.tur === 'model').length === modelOnce)
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
  kontrol('no note was stored for the failed attempt', (await tabloOku('ulke_notlar')).length === 1)
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

  // ───── NOTYA-UZ-BRANSLAR-01 — ANOTHER DOCTOR SPECIALTY, END TO END: the account changes its role to cardiology ─────
  await git(p, '/settings')
  await p.waitForSelector('[data-alan=rol-ayari] select[name=rol]')
  kontrol('settings: the role is shown by name with its assistant, and can be changed', (await p.$eval('[data-alan=rol-ayari] select[name=rol]', (e) => e.value)) === 'pediatri' && (await metin(p, '[data-alan=rol-ayari] [data-alan=asistan-ad]')) === 'Dr. Malika Nazarova' && (await metin(p, '[data-alan=rol-ayari] h2')) === 'Mutaxassislik')
  await p.select('[data-alan=rol-ayari] select[name=rol]', 'kardiyoloji')
  await p.click('[data-alan=rol-ayari] [data-eylem=rol-kaydet]')
  await p.waitForSelector('[data-alan=rol-ayari] .uza-bilgi-kutu')
  kontrol('settings: the new role is saved for this account only, and the card names the new assistant', (await metin(p, '[data-alan=rol-ayari] .uza-bilgi-kutu')) === 'Saqlandi.' && (await metin(p, '[data-alan=rol-ayari] [data-alan=asistan-ad]')) === 'Dr. Kamola Yusupova' && JSON.stringify((await tabloOku('hekim_rolu')).map((r) => `${r.doctor_id.slice(-1)}:${r.rol}`).sort()) === '["1:kardiyoloji","2:diyetisyen"]', JSON.stringify(await tabloOku('hekim_rolu')))
  await cek(p, 'settings-role-uz.png', false)
  await git(p, '/today')
  await p.waitForSelector('[data-alan=asistan-ad]')
  kontrol('home: the assistant is now cardiology\'s, by the owner\'s name', (await metin(p, '[data-alan=asistan-ad]')) === 'Dr. Kamola Yusupova' && (await metin(p, '[data-alan=asistan-satir]')) === 'Katta hamkasbingiz · Kardiologiya')
  await cek(p, 'today-cardiology-uz.png', false)
  senaryoYaz({ stt: 'yuksek', model: 'tamam' })
  await git(p, `/visit?hasta=${hastaA}`)
  await p.waitForSelector('input[name=riza]')
  kontrol('visit screen: the cardiology template and its assistant', (await metin(p, '[data-alan=sablon]')) === 'Kardiologiya' && (await metin(p, '[data-alan=asistan-ad]')) === 'Dr. Kamola Yusupova')
  const eskiSablon = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: 'uz/aaaaaaaa-0000-4000-8000-000000000001/yoq.webm', hastaId: hastaA, sablon: 'pediatri', riza: true } })
  kontrol('the role the account had before is now another role\'s template: refused', eskiSablon.s === 400 && eskiSablon.j?.alan === 'sablon', `${eskiSablon.s} ${eskiSablon.t}`)
  await kayitYap(p)
  const notKardio = new URL(p.url()).searchParams.get('not') || ''
  {
    const et = await alanEtiketleri(p)
    const gk = await govde(p)
    const m = cagrilar().filter((x) => x.tur === 'model').pop()
    const kayit = (await tabloOku('muayene_dil_kaydi')).find((k) => k.sablon === 'kardiyoloji')
    const satir = (await tabloOku('not_dil_kaydi')).find((k) => k.note_id === notKardio)
    kontrol('CARDIOLOGY TEMPLATE: the visit is stored under the role and the draft has cardiology\'s own fields', /^[0-9a-f-]{36}$/.test(notKardio) && !!kayit && et.length === 9 && ['Koʻkrakdagi ogʻriq tavsifi', 'Jismoniy zoʻriqishga chidamlilik', 'Qon bosimi va puls (aytilgan raqamlar)', 'Elektrokardiogramma xulosasi (aytilgani boʻyicha)', 'Exokardiografiya xulosasi (aytilgani boʻyicha)'].every((x) => et.includes(x)), et.join(' | '))
    kontrol('guardian wording follows the patient\'s AGE, not the role: a cardiologist\'s five-year-old has "who gave the history"', et.includes('Anamnezni kim bergani (ota-onasi yoki qonuniy vakili)') && (await alanDegeri(p, 'history_giver')) === 'Onasi.')
    kontrol('LEAK: nothing of paediatrics or of any other role on a cardiology note — no head circumference, no feeding, no diet history', !et.some((x) => /Bosh aylanasi|Ovqatlanishi|Emlash|Ovqatlanish tartibi|Audiometriya/.test(x)) && (await alanDegeri(p, 'head_circumference')) === null && (await alanDegeri(p, 'feeding')) === null && !/XATO-MAYDON|Kuniga toʻrt mahal|Shirinlikni koʻp yeydi/.test(gk) && (await alanDegeri(p, 'chest_pain')) === 'Koʻkrakda ogʻriq yoʻq.' && (await alanDegeri(p, 'ecg')) === 'Oʻzgarishsiz.')
    kontrol('in the database the cardiology note carries cardiology\'s fields only', anahtarlar(satir?.alanlar) === 'chest_pain,ecg,history_giver', JSON.stringify(satir?.alanlar))
    kontrol('the model was instructed with cardiology\'s fields and no other role\'s, and with nothing that says who the patient is', m.alanAnahtarlari === KARDIYOLOJI_ALANLARI && m.kimlikVar === false && m.dil === 'uz-Latn', JSON.stringify(m))
    kontrol('the draft names cardiology\'s assistant', (await metin(p, '[data-alan=asistan-ad]')) === 'Dr. Kamola Yusupova')
    await cek(p, 'note-cardiology-draft-uz.png')
    await p.click('#uza-alan-ecg'); await p.keyboard.down('Control'); await p.keyboard.press('End'); await p.keyboard.up('Control')
    await p.type('#uza-alan-ecg', ' Sinus ritmi.')
    await p.click('[data-eylem=onayla]')
    await p.waitForSelector('[data-bolum=s]', { timeout: 30000 })
    const onayli = (await tabloOku('ulke_notlar')).find((n) => n.id === notKardio)
    const onayliAlan = (await tabloOku('not_dil_kaydi')).find((k) => k.note_id === notKardio)
    kontrol('the doctor edits a field and approves: the note is in the file with the field as edited, and nothing is left to change it', !!onayli.approved_at && onayliAlan.alanlar.ecg === 'Oʻzgarishsiz. Sinus ritmi.' && (await metin(p, '[data-alan-anahtar=ecg] p')) === 'Oʻzgarishsiz. Sinus ritmi.' && !(await p.$('textarea')) && !(await p.$('[data-eylem]')))
    const gec = await api(p, '/api/ulke/not', { method: 'PATCH', govde: { notId: notKardio, dil: 'uz-Latn', s: 'x', o: '', a: '', p: '', alanlar: { ecg: 'OʻZGARTIRILDI' } } })
    kontrol('approved: a late save of a field is refused and the field is unchanged', gec.s === 409 && (await tabloOku('not_dil_kaydi')).find((k) => k.note_id === notKardio).alanlar.ecg === 'Oʻzgarishsiz. Sinus ritmi.')
    await cek(p, 'note-cardiology-approved-uz.png')
  }
  // A note keeps the template it was written with: the earlier paediatric draft is still paediatric.
  await git(p, `/visit?not=${notDusuk}`)
  await p.waitForSelector('#uza-not-s', { timeout: 60000 })
  {
    const et = await alanEtiketleri(p)
    kontrol('an earlier note keeps its own template and its own assistant after the role changed', et.includes('Bosh aylanasi (aytilgan raqam)') && !et.some((x) => /Koʻkrakdagi|Elektrokardiogramma/.test(x)) && (await metin(p, '[data-alan=asistan-ad]')) === 'Dr. Malika Nazarova', et.join(' | '))
  }
}
{
  // ISOLATION on visits and notes: doctor B and doctor A's visit, note, patient and folder.
  const p = B
  const r = await api(p, `/api/ulke/muayene?id=${seansYuksek}`)
  const yok = await api(p, '/api/ulke/muayene?id=30000000-0000-4000-8000-00000000dead')
  kontrol('doctor B asks the API for doctor A\'s visit: the same answer as for a visit that does not exist', r.s === 404 && r.t === '{"code":"NOT_FOUND"}' && yok.t === r.t, `${r.s} ${r.t}`)
  const onceki = JSON.stringify([await tabloOku('ulke_notlar'), await tabloOku('not_dil_kaydi')])
  const once = cagrilar().length
  const denemeler = [
    ['read', await api(p, `/api/ulke/not?id=${notDusuk}`)],
    ['write a note for the visit', await api(p, '/api/ulke/not', { method: 'POST', govde: { seansId: seansYuksek } })],
    ['save', await api(p, '/api/ulke/not', { method: 'PATCH', govde: { notId: notDusuk, dil: 'uz-Latn', s: 'YABANCI', o: '', a: '', p: '' } })],
    ['rewrite', await api(p, '/api/ulke/not/yeniden-yaz', { method: 'POST', govde: { notId: notDusuk } })],
    ['approve', await api(p, '/api/ulke/not/onayla', { method: 'POST', govde: { notId: notDusuk, dil: 'uz-Latn', s: 'YABANCI', o: 'x', a: 'x', p: 'x' } })],
  ]
  for (const [ad, d] of denemeler) kontrol(`doctor B cannot ${ad} doctor A's note: not found`, d.s === 404 && d.t === '{"code":"NOT_FOUND"}', `${d.s} ${d.t}`)
  kontrol('doctor A\'s notes are unchanged and no model was called for doctor B\'s attempts', JSON.stringify([await tabloOku('ulke_notlar'), await tabloOku('not_dil_kaydi')]) === onceki && cagrilar().length === once)
  for (const [ad, rota, beklenen] of [['visit', `/visit?seans=${seansYuksek}`, 'Приём не найден.'], ['note', `/visit?not=${notYuksek}`, 'Запись не найдена.']]) {
    await git(p, rota)
    await p.waitForSelector('[role=alert]')
    const g = await govde(p)
    kontrol(`doctor B opens the address of doctor A's ${ad}: "not found", no text of it, no patient`, g.includes(beklenen) && !/isitma|температура|Karimova|Qizim/.test(g), g.replace(/\s+/g, ' ').slice(0, 100))
  }
  const yabanciHasta = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: 'uz/aaaaaaaa-0000-4000-8000-000000000002/x.webm', hastaId: hastaA, sablon: 'genel', riza: true } })
  kontrol('doctor B cannot record a visit for doctor A\'s patient', yabanciHasta.s === 404 && yabanciHasta.t === '{"code":"NOT_FOUND"}', `${yabanciHasta.s} ${yabanciHasta.t}`)
  const yabanciYol = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: 'uz/aaaaaaaa-0000-4000-8000-000000000001/x.webm', hastaId: hastaB, sablon: 'genel', riza: true } })
  kontrol('doctor B cannot name a recording in doctor A\'s folder', yabanciYol.s === 400 && yabanciYol.j?.alan === 'yol', `${yabanciYol.s} ${yabanciYol.t}`)
  // SHARED DATABASE: recordings are kept apart per country. Doctor B's own account id under another country's folder,
  // and under no country folder at all (the path shape before countries shared a bucket), is refused the same way.
  for (const [ad, yol] of [['another country\'s folder', 'tr/aaaaaaaa-0000-4000-8000-000000000002/x.webm'], ['no country folder', 'aaaaaaaa-0000-4000-8000-000000000002/x.webm']]) {
    const r = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol, hastaId: hastaB, sablon: 'genel', riza: true } })
    kontrol(`doctor B cannot name a recording under ${ad}`, r.s === 400 && r.j?.alan === 'yol', `${r.s} ${r.t}`)
  }
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
  // ───── NOTYA-UZ-BRANSLAR-01 — AN ALLIED ROLE, END TO END: B is a dietitian; the note is a specialist's, not a doctor's ─────
  {
    const et = await alanEtiketleri(p)
    const gb = await govde(p)
    const notB = new URL(p.url()).searchParams.get('not') || ''
    const satir = (await tabloOku('not_dil_kaydi')).find((k) => k.note_id === notB)
    kontrol('DIETITIAN TEMPLATE: the draft has the dietitian\'s own fields, in Russian', et.length === 8 && ['Направивший врач и диагноз направления', 'Режим и привычки питания', 'Непереносимые продукты и ограничения', 'План питания (со слов специалиста)', 'Цели по питанию'].every((x) => et.includes(x)) && (await alanDegeri(p, 'diet_history')) === 'Любит сладкое.' && (await alanDegeri(p, 'nutrition_plan')) === 'Обильное питьё.', et.join(' | '))
    kontrol('an allied role\'s note has "the specialist\'s assessment" where a doctor\'s has "diagnosis and assessment"', gb.includes('Оценка специалиста') && !gb.includes('Диагноз и оценка'))
    kontrol('an unknown age is not a child: no guardian field for this patient; and no field of any other role', !et.some((x) => /Кто сообщил анамнез|Окружность головы|Питание$|боли в груди|электрокардиограммы|аудиометрии/.test(x)) && (await alanDegeri(p, 'history_giver')) === null && (await alanDegeri(p, 'chest_pain')) === null && !/XATO-MAYDON|Боли в груди нет|Ест четыре раза/.test(gb) && anahtarlar(satir?.alanlar) === 'diet_history,nutrition_plan', JSON.stringify(satir?.alanlar))
    kontrol('the model was instructed with the dietitian\'s fields only, and told the colleague is not a doctor', mdl.alanAnahtarlari === DIYETISYEN_ALANLARI && mdl.muttefik === true && mdl.kimlikVar === false, JSON.stringify(mdl))
    kontrol('the draft names the dietitian\'s assistant, with the profession\'s title', (await metin(p, '[data-alan=asistan-ad]')) === 'Диетолог Махлиё Турсунова')
    await cek(p, 'note-dietitian-draft-ru.png')
    await p.click('[data-eylem=onayla]')
    await p.waitForSelector('[data-bolum=s]', { timeout: 30000 })
    const onayli = (await tabloOku('ulke_notlar')).find((n) => n.id === notB)
    kontrol('the dietitian approves: the note is in the file with its fields, read-only', !!onayli.approved_at && onayli.approved_by === 'aaaaaaaa-0000-4000-8000-000000000002' && (await metin(p, '[data-alan-anahtar=diet_history] p')) === 'Любит сладкое.' && (await p.$$eval('h2', (l) => l.map((e) => e.innerText))).includes('Оценка специалиста') && !(await p.$('textarea')))
    await cek(p, 'note-dietitian-approved-ru.png')
  }
  const notlar = await tabloOku('ulke_notlar')
  kontrol('four notes in the database, each under its own doctor', notlar.length === 4 && notlar.filter((n) => n.doctor_id === 'aaaaaaaa-0000-4000-8000-000000000001').length === 3 && notlar.filter((n) => n.doctor_id === 'aaaaaaaa-0000-4000-8000-000000000002').length === 1)
  const kullanim = await tabloOku('ai_token_kullanim')
  kontrol('every model call left a usage row with the doctor and the task — and no patient', kullanim.length >= 4 && kullanim.every((k) => /^aaaaaaaa-0000-4000-8000-00000000000[12]$/.test(k.doctor_id) && ['soap', 'not-uretimi'].includes(k.gorev) && !('patient_id' in k)), JSON.stringify(kullanim[0]))
}

// ───────────────────────── 8b. appointments (NOTYA-UZ-RANDEVU-01): working pattern → book → move → visit → approved note → done; a reminder in Russian ─────────────────────────
{
  const p = A
  const A_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
  const hesap = (await api(p, '/api/ulke/hesap')).j
  const gunEkle = (gun, n) => { const [y, a, g] = gun.split('-').map(Number); return new Date(Date.UTC(y, a - 1, g + n)).toISOString().slice(0, 10) }
  const haftaGunu = (gun) => { const [y, a, g] = gun.split('-').map(Number); return new Date(Date.UTC(y, a - 1, g)).getUTCDay() || 7 }
  const yazGun = (gun) => gun.split('-').reverse().join('.')
  const randevular = async () => (await tabloOku('ulke_randevulari')).filter((r) => r.doctor_id === A_ID)
  const randevuAc = async (id) => { await git(p, `/calendar?randevu=${id}`); await p.waitForSelector('[data-alan=gun]', { timeout: 60000 }) }
  // A Russian-speaking patient of doctor A: the reminder must be in the PATIENT's language.
  const ru = await api(p, '/api/ulke/hastalar', { method: 'POST', govde: { ad: 'QA Иванова Мария', otaIsmi: 'Петровна', dogumTarihi: '1990-05-02', cinsiyet: 'female', telefon: '+998 90 000 00 09', dil: 'ru', ulusalKimlik: '' } })
  const hastaRu = ru.j?.hasta?.id
  kontrol('a Russian-speaking patient exists for the appointment steps', ru.s === 200 && /^[0-9a-f-]{36}$/.test(hastaRu || ''), `${ru.s} ${ru.t}`)

  // 1. SET WORKING HOURS.
  const bugun = (await api(p, '/api/ulke/calisma-duzeni')).j.bugun
  let PZT = gunEkle(bugun, 2); while (haftaGunu(PZT) !== 1) PZT = gunEkle(PZT, 1)
  await git(p, '/calendar?duzen=1')
  await p.waitForSelector('[data-eylem=duzen-kaydet]', { timeout: 60000 })
  const ilk = await p.evaluate(() => ({ gunler: [...document.querySelectorAll('input[name=gunler]')].map((e) => [e.value, e.checked]), bas: document.querySelector('#uza-d-bas').value, bit: document.querySelector('#uza-d-bit').value, tatil: document.querySelector('[data-alan=tatil-notu]')?.innerText || '' }))
  kontrol('working pattern: the country\'s standard first — Monday to Friday, Monday first, 09:00–18:00', JSON.stringify(ilk.gunler) === JSON.stringify([['1', true], ['2', true], ['3', true], ['4', true], ['5', true], ['6', false], ['7', false]]) && ilk.bas === '09:00' && ilk.bit === '18:00', JSON.stringify(ilk))
  kontrol('working pattern: the screen says public holidays are not taken into account', ilk.tatil.length > 30 && !TURKCE_HARF.test(ilk.tatil), ilk.tatil)
  await onEkAltinda(p, 'working pattern')
  await p.click('input[name=gunler][value="6"]')
  await yazDeger(p, '#uza-d-bas', '08:00')
  // (A notice is already on the screen before saving — "the standard pattern applies" — so the answer itself is awaited.)
  await Promise.all([p.waitForResponse((r) => r.url().endsWith('/api/ulke/calisma-duzeni') && r.request().method() === 'POST', { timeout: 30000 }), p.click('[data-eylem=duzen-kaydet]')])
  await p.waitForFunction(() => !document.querySelector('[data-eylem=duzen-kaydet]').disabled, { timeout: 30000 })
  const duzen = (await tabloOku('hekim_calisma_duzeni')).filter((d) => d.doctor_id === A_ID)
  kontrol('working pattern saved for this doctor: Saturday added, the day begins at 08:00', duzen.length === 1 && JSON.stringify(duzen[0].gunler) === '[1,2,3,4,5,6]' && duzen[0].baslangic_dk === 480 && duzen[0].bitis_dk === 1080 && duzen[0].sure_dk === 30, JSON.stringify(duzen))
  await cek(p, 'calendar-working-pattern.png')

  // 2. THE CALENDAR: the day, with the free times of the new pattern.
  await git(p, `/calendar?gun=${PZT}`)
  await p.waitForSelector('[data-bos]', { timeout: 60000 })
  const boslar = await p.$$eval('[data-bos]', (l) => l.map((e) => e.getAttribute('data-bos')))
  kontrol('calendar, day view: free times follow the saved pattern (from 08:00, none in the break)', boslar[0] === '08:00' && boslar.includes('10:00') && !boslar.includes('13:00') && !boslar.includes('13:30') && boslar.at(-1) === '17:30', boslar.join(' '))
  kontrol('calendar, day view: the day is written in the country\'s pattern', (await metin(p, '[data-gorunum=gun] h2')).endsWith(yazGun(PZT)))
  await onEkAltinda(p, 'calendar (day)')
  await cek(p, 'calendar-day.png')

  // 3. BOOK from the calendar: a free time → choose the patient → the form, with day and time already there.
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('a[data-bos="10:00"]')])
  await p.waitForSelector(`a[href*="hasta=${hastaRu}"]`, { timeout: 60000 })
  await onEkAltinda(p, 'booking: choose the patient')
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click(`a[href*="hasta=${hastaRu}"]`)])
  await p.waitForSelector('#uza-rf-gun', { timeout: 60000 })
  const form = await p.evaluate(() => ({ gun: document.querySelector('#uza-rf-gun').value, saat: document.querySelector('#uza-rf-saat').value, sure: document.querySelector('#uza-rf-sure').value, ad: document.querySelector('h1').innerText }))
  kontrol('booking form: the patient, the day in DD.MM.YYYY, the time and the default length are filled in', form.gun === yazGun(PZT) && form.saat === '10:00' && form.sure === '30' && form.ad === 'QA Иванова Мария Петровна', JSON.stringify(form))
  await p.type('#uza-rf-neden', 'QA nazorat')
  await onEkAltinda(p, 'booking form')
  await cek(p, 'calendar-booking.png')
  await p.click('[data-eylem=kaydet]')
  await p.waitForFunction(() => new URLSearchParams(location.search).has('randevu'), { timeout: 60000 })
  await p.waitForSelector('[data-alan=gun]', { timeout: 60000 })
  const randevuId = new URL(p.url()).searchParams.get('randevu')
  let satirlar = await randevular()
  kontrol('BOOKED: one appointment of this doctor, for that patient, at 10:00 Tashkent time (05:00 UTC), planned, reason not readable in the table', satirlar.length === 1 && satirlar[0].id === randevuId && satirlar[0].patient_id === hastaRu && satirlar[0].baslangic === `${PZT}T05:00:00.000Z` && satirlar[0].bitis === `${PZT}T05:30:00.000Z` && satirlar[0].durum === 'planlandi' && satirlar[0].mesai_disi === false && !JSON.stringify(satirlar[0]).includes('nazorat'), JSON.stringify(satirlar))

  // NO DOUBLE BOOKING, and "outside working hours" with its explicit "book anyway".
  await git(p, `/calendar?yeni=1&hasta=${hastaA}&gun=${PZT}&saat=10:15`)
  await p.waitForSelector('[data-eylem=kaydet]', { timeout: 60000 })
  await p.click('[data-eylem=kaydet]')
  await p.waitForSelector('[role=alert]', { timeout: 30000 })
  const doluMetni = await metin(p, '[role=alert]')
  kontrol('a taken time: a clear message in the doctor\'s language, NO "book anyway", nothing written', doluMetni.length > 20 && !TURKCE_HARF.test(doluMetni) && !(await p.$('[data-eylem=yine-de]')) && (await randevular()).length === 1, doluMetni)
  await yazDeger(p, '#uza-rf-saat', '19:30')
  await p.click('[data-eylem=kaydet]')
  await p.waitForSelector('[data-eylem=yine-de]', { timeout: 30000 })
  const disMetni = await metin(p, '[role=alert]')
  kontrol('outside working hours: a different message, an explicit "book anyway", and nothing written yet', disMetni !== doluMetni && disMetni.length > 20 && !TURKCE_HARF.test(disMetni) && (await randevular()).length === 1, disMetni)
  await cek(p, 'calendar-outside-hours.png')
  await p.click('[data-eylem=yine-de]')
  await p.waitForFunction(() => new URLSearchParams(location.search).has('randevu'), { timeout: 60000 })
  satirlar = await randevular()
  kontrol('"book anyway": booked at 19:30 and marked as outside working hours', satirlar.length === 2 && satirlar[1].baslangic === `${PZT}T14:30:00.000Z` && satirlar[1].mesai_disi === true && satirlar[1].patient_id === hastaA, JSON.stringify(satirlar[1]))
  const ikiKez = await Promise.all([1, 2].map(() => api(p, '/api/ulke/randevu', { method: 'POST', govde: { hastaId: hastaA, gun: yazGun(PZT), saat: '15:00', sureDk: 30 } })))
  kontrol('two bookings of the same time sent at the same moment: one is booked, one is refused', ikiKez.map((r) => r.s).sort().join() === '200,409' && ikiKez.find((r) => r.s === 409).t === '{"code":"DOLU"}' && (await randevular()).length === 3, ikiKez.map((r) => `${r.s} ${r.t.slice(0, 40)}`).join(' | '))

  // 4. COPY A REMINDER IN RUSSIAN: the patient's language, whatever the doctor reads; nothing is sent anywhere.
  await randevuAc(randevuId)
  await p.waitForSelector('[data-alan=hatirlatma]', { timeout: 30000 })
  const beklenen = `Здравствуйте! Напоминаем: вы записаны на приём к врачу ${hesap.ad} ${yazGun(PZT)} в 10:00.`
  const hatirlatma = await p.$eval('[data-alan=hatirlatma]', (e) => ({ metin: e.value, dil: e.getAttribute('data-dil'), lang: e.lang }))
  kontrol('reminder: Russian for a Russian-speaking patient, with the date in DD.MM.YYYY, the time and the doctor\'s name', hatirlatma.metin === beklenen && hatirlatma.dil === 'ru' && hatirlatma.lang === 'ru', JSON.stringify(hatirlatma))
  kontrol('reminder: no Turkish letter, and the doctor reads the application in another form than the reminder', !TURKCE_HARF.test(hatirlatma.metin) && hesap.dil !== 'ru', `${hesap.dil}`)
  // What the button puts on the clipboard is caught here; the real clipboard of a headless browser is not relied on.
  await p.evaluate(() => { window.__kopya = []; const pano = { writeText: async (t) => { window.__kopya.push(t) } }; Object.defineProperty(navigator, 'clipboard', { value: pano, configurable: true }) })
  const istekOnce = p.istekler.length, supaOnce = (await (await fetch(`${SUPA}/__gunluk`)).json()).length
  await p.click('[data-eylem=hatirlatma-kopyala]')
  await p.waitForSelector('[data-alan=hatirlatma-karti] .uza-bilgi-kutu', { timeout: 15000 })
  const kopya = await p.evaluate(() => window.__kopya)
  kontrol('ONE BUTTON copies exactly that text, and says so', kopya.length === 1 && kopya[0] === beklenen && (await metin(p, '[data-alan=hatirlatma-karti] .uza-bilgi-kutu')).length > 10, JSON.stringify(kopya))
  await bekle(600)
  kontrol('copying sends NOTHING: no request to the application, to the database or to any outside address', p.istekler.length === istekOnce && (await (await fetch(`${SUPA}/__gunluk`)).json()).length === supaOnce && p.disari.length === 0, `${p.istekler.slice(istekOnce).join(' ')} ${p.disari.join(' ')}`)
  await onEkAltinda(p, 'one appointment')
  await cek(p, 'calendar-appointment-reminder-ru.png')

  // 5. MOVE it: to 11:30 the same day.
  await yazDeger(p, '#uza-rt-saat', '11:30')
  await p.click('[data-eylem=tasi]')
  await p.waitForSelector('[data-alan=tasi] .uza-bilgi-kutu', { timeout: 30000 })
  satirlar = await randevular()
  const tasinan = satirlar.find((r) => r.id === randevuId)
  kontrol('MOVED: the same appointment now starts at 11:30 Tashkent time; no second row was made', tasinan.baslangic === `${PZT}T06:30:00.000Z` && tasinan.bitis === `${PZT}T07:00:00.000Z` && satirlar.length === 3 && (await metin(p, '[data-alan=saat]')).startsWith('11:30–12:00'), JSON.stringify(tasinan))
  kontrol('the reminder follows the new time', (await p.$eval('[data-alan=hatirlatma]', (e) => e.value)) === beklenen.replace('в 10:00', 'в 11:30'))
  await yazDeger(p, '#uza-rt-saat', '15:10')
  await p.click('[data-eylem=tasi]')
  await p.waitForSelector('[data-alan=tasi] [role=alert]', { timeout: 30000 })
  kontrol('moving onto another appointment: refused, no "move anyway", the appointment stays where it was', !(await p.$('[data-eylem=tasi-yine-de]')) && (await randevular()).find((r) => r.id === randevuId).baslangic === `${PZT}T06:30:00.000Z`)

  // 6. START THE VISIT FROM THE APPOINTMENT → record → note → approve → the appointment is done.
  await randevuAc(randevuId)
  writeFileSync(GUNLUK, '')
  senaryoYaz({ stt: 'yuksek', model: 'tamam' })
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('[data-eylem=muayene-baslat]')])
  await p.waitForSelector('input[name=riza]', { timeout: 60000 })
  const u = new URL(p.url())
  kontrol('"start the visit" opens the visit screen for THAT patient, carrying the appointment, and shows which appointment it is', u.pathname === adres('/visit') && u.searchParams.get('hasta') === hastaRu && u.searchParams.get('randevu') === randevuId && (await metin(p, 'h1')) === 'QA Иванова Мария Петровна' && (await metin(p, '[data-alan=randevu]')).includes(`${yazGun(PZT)} · 11:30`), p.url())
  await onEkAltinda(p, 'visit from an appointment')
  await kayitYap(p)
  const notId = new URL(p.url()).searchParams.get('not') || ''
  let bagli = (await randevular()).find((r) => r.id === randevuId)
  const seanslar = (await tabloOku('ulke_muayeneler')).filter((x) => x.id === bagli.session_id)
  kontrol('the recorded visit is LINKED to the appointment, and the patient has arrived', /^[0-9a-f-]{36}$/.test(notId) && seanslar.length === 1 && seanslar[0].patient_id === hastaRu && seanslar[0].doctor_id === A_ID && bagli.durum === 'geldi', JSON.stringify(bagli))
  kontrol('the note is still a draft: the appointment is not done yet', !(await tabloOku('ulke_notlar')).find((n) => n.id === notId).approved_at && bagli.durum === 'geldi')
  await p.click('[data-eylem=onayla]')
  await p.waitForSelector('[data-bolum=s]', { timeout: 30000 })
  bagli = (await randevular()).find((r) => r.id === randevuId)
  const onayliNot = (await tabloOku('ulke_notlar')).find((n) => n.id === notId)
  kontrol('APPROVING THE NOTE marks the appointment DONE', !!onayliNot.approved_at && onayliNot.session_id === bagli.session_id && bagli.durum === 'tamamlandi', JSON.stringify(bagli))
  await randevuAc(randevuId)
  const bitmis = await p.evaluate(() => ({ rozet: document.querySelector('.uza-baslik-satiri [data-randevu-durum]')?.getAttribute('data-randevu-durum'), eylemler: [...document.querySelectorAll('[data-eylem]')].map((e) => e.getAttribute('data-eylem')), muayene: document.querySelector('[data-eylem=muayene-ac]')?.getAttribute('href') }))
  kontrol('the appointment screen shows it as done, links to its visit, and offers no way to reopen, move or remind', bitmis.rozet === 'tamamlandi' && JSON.stringify(bitmis.eylemler) === '["muayene-ac"]' && bitmis.muayene === `${adres('/visit')}?seans=${bagli.session_id}`, JSON.stringify(bitmis))
  await cek(p, 'calendar-appointment-done.png')

  // 7. THE WEEK and THE HOME.
  await git(p, `/calendar?gun=${PZT}&gorunum=hafta`)
  await p.waitForSelector('.uza-hafta-gun', { timeout: 60000 })
  const hafta = await p.evaluate(() => [...document.querySelectorAll('.uza-hafta-gun')].map((g) => [g.getAttribute('data-gun'), [...g.querySelectorAll('[data-randevu]')].map((r) => `${r.querySelector('.uza-saat').innerText} ${r.getAttribute('data-randevu-durum')}`)]))
  kontrol('calendar, week view: seven days from Monday; the three appointments under their own day, in time order, with status', hafta.length === 7 && hafta[0][0] === PZT && hafta[6][0] === gunEkle(PZT, 6) && JSON.stringify(hafta[0][1]) === JSON.stringify(['11:30 tamamlandi', '15:00 planlandi', '19:30 planlandi']) && hafta.slice(1).every((g) => g[1].length === 0), JSON.stringify(hafta))
  await onEkAltinda(p, 'calendar (week)')
  await cek(p, 'calendar-week.png')
  const bugunku = await api(p, '/api/ulke/randevu', { method: 'POST', govde: { hastaId: hastaA, gun: yazGun(bugun), saat: '23:40', sureDk: 15, yineDe: true } })
  await git(p, '/today')
  await p.waitForSelector('[data-alan=bugun-randevular] .uza-randevu-satiri', { timeout: 60000 })
  const ev = await p.evaluate(() => [...document.querySelectorAll('[data-alan=bugun-randevular] .uza-randevu-satiri')].map((li) => ({ id: li.getAttribute('data-randevu'), saat: li.querySelector('.uza-saat').innerText, durum: li.querySelector('[data-randevu-durum]').getAttribute('data-randevu-durum'), baslat: li.querySelector('[data-eylem=muayene-baslat]')?.getAttribute('href') || null })))
  kontrol('the home lists TODAY\'s appointments (not next week\'s), with time and status, and offers "start the visit"', bugunku.s === 200 && ev.length === 1 && ev[0].id === bugunku.j.randevu.id && ev[0].saat === '23:40–23:55' && ev[0].durum === 'planlandi' && ev[0].baslat === `${adres('/visit')}?hasta=${hastaA}&randevu=${ev[0].id}`, JSON.stringify(ev))
  await onEkAltinda(p, 'home with appointments')
  await cek(p, 'today-appointments.png')
  await git(p, `/patient?id=${hastaA}`)
  await p.waitForSelector('[data-eylem=randevu-al]', { timeout: 60000 })
  kontrol('the patient\'s file offers "book an appointment" for that patient and lists the coming ones', (await p.$eval('[data-eylem=randevu-al]', (e) => e.getAttribute('href'))) === `${adres('/calendar')}?yeni=1&hasta=${hastaA}` && (await p.$$('[data-alan=hasta-randevular] [data-randevu]')).length === 3)
  await onEkAltinda(p, 'patient file with appointments')

  // 8. ISOLATION and A PHONE: doctor B (on a phone) sees none of doctor A's appointments and cannot reach one.
  const yabanci = await api(B, `/api/ulke/randevu?id=${randevuId}`)
  const olmayan = await api(B, '/api/ulke/randevu?id=30000000-0000-4000-8000-00000000dead')
  const yabanciDegistir = await api(B, '/api/ulke/randevu', { method: 'PATCH', govde: { id: satirlar[1].id, durum: 'iptal' } })
  const yabanciHasta = await api(B, '/api/ulke/randevu', { method: 'POST', govde: { hastaId: hastaA, gun: yazGun(PZT), saat: '09:00', sureDk: 30 } })
  kontrol('doctor B and doctor A\'s appointment: read, cancel, and booking A\'s patient all answer exactly like "does not exist"', yabanci.s === 404 && yabanci.t === '{"code":"NOT_FOUND"}' && olmayan.t === yabanci.t && yabanciDegistir.t === yabanci.t && yabanciHasta.t === yabanci.t && (await randevular()).find((r) => r.id === satirlar[1].id).durum === 'planlandi' && (await tabloOku('ulke_randevulari')).every((r) => r.doctor_id === A_ID), `${yabanci.s} ${yabanciDegistir.s} ${yabanciHasta.s}`)
  for (const gorunum of ['gun', 'hafta']) {
    await git(B, `/calendar?gun=${PZT}${gorunum === 'hafta' ? '&gorunum=hafta' : ''}`)
    await B.waitForSelector(gorunum === 'hafta' ? '.uza-hafta-gun' : '[data-gorunum=gun]', { timeout: 60000 })
    const tel = await B.evaluate(() => ({ tasma: document.documentElement.scrollWidth - window.innerWidth, randevu: document.querySelectorAll('[data-randevu]').length, govde: document.body.innerText, kucuk: [...document.querySelectorAll('.uza-govde a, .uza-govde button')].filter((e) => e.getBoundingClientRect().height < 30 && e.getBoundingClientRect().height > 0).length }))
    kontrol(`ON A PHONE (390 px), ${gorunum === 'hafta' ? 'week' : 'day'} view: nothing runs off the side; doctor B sees none of doctor A's appointments; no Turkish letter`, tel.tasma <= 0 && tel.randevu === 0 && !TURKCE_HARF.test(tel.govde) && !tel.govde.includes('Иванова'), JSON.stringify({ tasma: tel.tasma, randevu: tel.randevu }))
    await onEkAltinda(B, `calendar on a phone (${gorunum})`)
    await cek(B, `calendar-${gorunum === 'hafta' ? 'week' : 'day'}-phone-ru.png`)
  }
  kontrol('appointments: no request left for any outside address during these steps', p.disari.length === 0 && B.disari.length === 0, [...p.disari, ...B.disari].join(' '))
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
