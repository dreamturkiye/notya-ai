#!/usr/bin/env node
/**
 * NOTYA-UZ-ACILIS-02 — screenshots of the Uzbekistan landing page for docs/uz-landing/, taken from a running
 * production build under its path prefix (/uzbek). Same set-up as ./yuruyus.mjs (see its header for the folder with
 * the browser and the fonts, and for how the build is started); no stand-in service is needed for the landing page.
 *
 *   cd /tmp/yuruyus && CIKTI=<repo>/docs/uz-landing node <repo>/scripts/ulke-yuruyus/acilis-goruntuleri.mjs
 *
 * Writes: landing-desktop-{uz,ru}[-N].png, landing-phone-{uz,ru}-N.png, landing-hero-desktop-uz.png.
 * No image is longer than 8,000 pixels on any side: a page taller than that is cut into numbered parts at section
 * boundaries. Animations are switched off (the browser says "reduce motion"), so the typed visit is shown complete.
 * Google Fonts is answered from local files, exactly the faces and axes the page asks for.
 *
 * With TR_TABAN set (a locally running Türkiye build or dev server), it also saves the first screen of the Turkish
 * landing page as tr-reference-hero.png, for comparison. That page loads its fonts through the framework at build
 * time; when the font host is unreachable they are missing, so the same two faces are put in from local files here.
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const gerek = createRequire(join(process.env.YURUYUS_MODULLER || process.cwd(), 'x.js'))
const puppeteer = gerek('puppeteer-core')
const chromiumHam = gerek('@sparticuz/chromium')
const chromium = chromiumHam.default ?? chromiumHam

const TABAN = process.env.TABAN || 'http://localhost:3111'
const ON_EK = process.env.ON_EK ?? '/uzbek'
const CIKTI = process.env.CIKTI || './cikti'
const TR_TABAN = process.env.TR_TABAN || ''
const AZAMI = 8000
mkdirSync(CIKTI, { recursive: true })

const FONT = join(process.env.YURUYUS_MODULLER || process.cwd(), 'node_modules')
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
const KIRIL = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'
const KIRIL_EXT = 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'
const PAKET = { fraunces: '@fontsource-variable/fraunces', outfit: '@fontsource-variable/outfit', 'source-serif-4': '@fontsource-variable/source-serif-4', onest: '@fontsource-variable/onest' }
for (const p of Object.values(PAKET)) if (!existsSync(join(FONT, p))) throw new Error(`missing ${p} in ${FONT} — see the header of scripts/ulke-yuruyus/yuruyus.mjs`)
const yuz = (aile, agirlik, dosya, aralik) => `@font-face{font-family:'${aile}';font-style:normal;font-weight:${agirlik};font-display:block;src:url(https://fonts.gstatic.com/yerel/${dosya}) format('woff2');unicode-range:${aralik}}`
const LATIN_YUZLER = [['latin', LATIN], ['latin-ext', LATIN_EXT]].flatMap(([alt, aralik]) => [
  yuz('Fraunces', '100 900', `fraunces/fraunces-${alt}-wght-normal.woff2`, aralik),
  yuz('Outfit', '100 900', `outfit/outfit-${alt}-wght-normal.woff2`, aralik),
])
const KIRIL_YUZLER = [['cyrillic', KIRIL], ['cyrillic-ext', KIRIL_EXT]].flatMap(([alt, aralik]) => [
  yuz('Source Serif 4', '200 900', `source-serif-4/source-serif-4-${alt}-wght-normal.woff2`, aralik),
  yuz('Onest', '100 900', `onest/onest-${alt}-wght-normal.woff2`, aralik),
])
const FONT_CSS = [...LATIN_YUZLER, ...KIRIL_YUZLER].join('\n')

const tarayici = await puppeteer.launch({
  args: [...chromium.args.filter((a) => a !== '--single-process'), '--no-sandbox', '--font-render-hinting=none'],
  executablePath: await chromium.executablePath(), headless: 'shell',
})
const bekle = (ms) => new Promise((r) => setTimeout(r, ms))

async function sayfaAc({ genislik, yukseklik, olcek }) {
  const p = await (await tarayici.createBrowserContext()).newPage()
  await p.setViewport({ width: genislik, height: yukseklik, deviceScaleFactor: olcek, isMobile: genislik < 600, hasTouch: genislik < 600 })
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await p.setRequestInterception(true)
  p.disari = []
  p.on('request', (r) => {
    const u = r.url()
    if (u.startsWith('https://fonts.googleapis.com/')) return r.respond({ status: 200, contentType: 'text/css', body: FONT_CSS })
    if (u.startsWith('https://fonts.gstatic.com/yerel/')) {
      const [paket, dosya] = u.slice('https://fonts.gstatic.com/yerel/'.length).split('/')
      try { return r.respond({ status: 200, contentType: 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' }, body: readFileSync(join(FONT, PAKET[paket], 'files', dosya)) }) } catch { return r.respond({ status: 404, body: '' }) }
    }
    if (!u.startsWith(TABAN) && !(TR_TABAN && u.startsWith(TR_TABAN)) && !u.startsWith('data:')) { p.disari.push(u); return r.abort() }
    r.continue()
  })
  return p
}

/** Full page, cut at section boundaries into parts no longer than AZAMI device pixels. */
async function tamSayfa(p, ad, olcek) {
  const { yukseklik, sinirlar } = await p.evaluate(() => ({
    yukseklik: Math.ceil(document.documentElement.scrollHeight),
    sinirlar: [...document.querySelectorAll('main > section, footer')].map((e) => Math.round(e.getBoundingClientRect().top + scrollY)),
  }))
  const azamiCss = Math.floor(AZAMI / olcek)
  const kesimler = [0]
  while (yukseklik - kesimler.at(-1) > azamiCss) {
    const bas = kesimler.at(-1)
    const aday = sinirlar.filter((s) => s > bas && s - bas <= azamiCss)
    kesimler.push(aday.length ? aday.at(-1) : bas + azamiCss)
  }
  kesimler.push(yukseklik)
  const genislik = p.viewport().width
  const dosyalar = []
  for (let i = 0; i < kesimler.length - 1; i++) {
    const dosya = kesimler.length === 2 ? `${ad}.png` : `${ad}-${i + 1}.png`
    await p.screenshot({ path: join(CIKTI, dosya), clip: { x: 0, y: kesimler[i], width: genislik, height: kesimler[i + 1] - kesimler[i] }, captureBeyondViewport: true })
    dosyalar.push(`${dosya} ${genislik * olcek}x${(kesimler[i + 1] - kesimler[i]) * olcek}`)
  }
  console.log(`shot ${dosyalar.join(', ')}`)
}

const MASA = { genislik: 1440, yukseklik: 900, olcek: 1 }
const TEL = { genislik: 390, yukseklik: 844, olcek: 2 }
for (const [dil, rota] of [['uz', ''], ['ru', '?dil=ru']]) {
  for (const [boyut, b] of [['desktop', MASA], ['phone', TEL]]) {
    const p = await sayfaAc(b)
    const r = await p.goto(`${TABAN}${ON_EK}${rota}`, { waitUntil: 'networkidle0', timeout: 180000 })
    if (r.status() !== 200) throw new Error(`${r.status()} at ${TABAN}${ON_EK}${rota}`)
    await p.evaluate(() => document.fonts.ready); await bekle(600)
    const durum = await p.evaluate(() => ({
      yazilar: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')).filter((v, i, a) => a.indexOf(v) === i).sort().join(', '),
      gorseller: [...document.querySelectorAll('img')].every((e) => e.complete && e.naturalWidth > 0),
      tasma: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))
    console.log(`landing ${dil} ${boyut}: fonts [${durum.yazilar}], photographs ${durum.gorseller ? 'loaded' : 'MISSING'}, overflow ${durum.tasma}px, outside requests ${p.disari.length}`)
    if (!durum.gorseller || durum.tasma > 0 || p.disari.length) process.exitCode = 1
    if (boyut === 'desktop' && dil === 'uz') { await p.screenshot({ path: join(CIKTI, 'landing-hero-desktop-uz.png') }); console.log('shot landing-hero-desktop-uz.png 1440x900') }
    await tamSayfa(p, `landing-${boyut}-${dil}`, b.olcek)
    await p.browserContext().close()
  }
}

if (TR_TABAN) {
  const p = await sayfaAc(MASA)
  const r = await p.goto(`${TR_TABAN}/doktor`, { waitUntil: 'networkidle0', timeout: 300000 })
  // The Turkish page names its faces through two variables the framework sets at build time. Give them the same two
  // faces from local files (upright, weight axis only — what that page loads in production).
  await p.addStyleTag({ content: `${LATIN_YUZLER.join('\n')}\n.doktor-lp{--font-fraunces:'Fraunces' !important;--font-outfit-face:'Outfit' !important}` })
  await p.evaluate(() => document.fonts.ready); await bekle(1500)
  await p.evaluate(() => document.fonts.ready)
  const yazi = await p.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily)
  console.log(`Turkish landing page: ${r.status()}, headline face ${yazi}`)
  await p.screenshot({ path: join(CIKTI, 'tr-reference-hero.png') })
  console.log('shot tr-reference-hero.png 1440x900')
  await p.browserContext().close()
}
await tarayici.close()
