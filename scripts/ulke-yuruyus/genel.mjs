#!/usr/bin/env node
/**
 * NOTYA-ULKE-SABLON-01 — THE PACK-NEUTRAL WALK-THROUGH. One script for every country: it names no country and holds
 * no text. What it must know about the country it walks comes from that country's pack, as JSON written by
 * ./paket-bilgisi.mts; every sentence it expects on a screen is read from the pack's own catalogue.
 *
 * It walks the country kit's core path in a real browser against a production build and the stand-ins: landing page,
 * login (wrong password, another country's account), first-login questions as far as the pack has any, home,
 * settings, new patient, visit recording → note → approval, appointment + double booking, a second account that sees
 * none of it — and on every screen: nothing still marked "to be supplied", nothing of another country, every link
 * under the country's path, no request to any outside service.
 *
 * NOTYA-ULKE-PORTAL-01 — where the pack has the patient portal, step 4b walks it with the patient in a browser of
 * their own: access given once, the token alone shows nothing, a wrong PIN, sign-in, the patient's page, a summary
 * shared and taken back, an appointment request refused on a taken time and then accepted, and isolation (the second
 * account, a doctor's session on the patient's routes and the other way round).
 *
 * NOTYA-ULKE-INTAKE-01 — where the pack has the intake form, step 4c walks it: asked from the patient's file (the
 * invitation in the patient's form, the warning before a new link), consent, every part of the form with whatever
 * questions the pack's set holds (the core set and the account's role, never another role's), saved as a draft,
 * submitted, read-only, the answers on the doctor's file and visit screen under "not verified", a visit recorded
 * with none of them given to the model, reopened; and in step 5 the second account and both kinds of session.
 *
 * NOTYA-ULKE-ARACLAR-01 — where the pack has the tools area, step 4d walks it: the grid of the account's role, a tool
 * of another role that does not open from its address, the tools opened from a patient's file, one tool filled in
 * with values the pack's information brings (the script holds no tool and no field), kept on the patient with and
 * without a follow-up day (the field starts empty), what the server refuses, the patient's file, the follow-up list
 * and "done"; and in step 5 the second account.
 *
 * A country's OWN deeper walk-through (its wording, its roles, its language switches) stays with that country:
 * Uzbekistan's is ./yuruyus.mjs.
 *
 * RUN, for the country <code> (replace it three times; nothing is contacted outside this machine):
 *
 *   mkdir /tmp/yuruyus && cd /tmp/yuruyus && npm i puppeteer-core @sparticuz/chromium
 *   cd <repo> && export NOTYA_COUNTRY=<code> NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_ANON_KEY=sahte-anon \
 *     SUPABASE_SERVICE_ROLE_KEY=sahte-servis NOTYA_ILETISIM_EPOSTA=pilot@example.com ENCRYPTION_MASTER_KEY=yalniz-yuruyus-icin-sentetik-anahtar \
 *     ELEVENLABS_API_KEY=sahte-anahtar OPENROUTER_API_KEY=sahte-anahtar YURUYUS_GENEL=1 YURUYUS_ULKE=<code>
 *   npx --yes tsx scripts/ulke-yuruyus/paket-bilgisi.mts > /tmp/yuruyus/paket.json
 *   export YURUYUS_DILLER=$(node -p "const p=require('/tmp/yuruyus/paket.json'); [p.dil, p.uygulamaDilleri.at(-1)].join()") \
 *          YURUYUS_STT_KODU=$(node -p "require('/tmp/yuruyus/paket.json').sttKodu")
 *   node scripts/ulke-yuruyus/sahte-supabase.mjs 54399 &
 *   npm run build:ulke && NODE_OPTIONS="--require $PWD/scripts/ulke-yuruyus/sahte-saglayicilar.cjs" npx next start -p 3111 &
 *   cd /tmp/yuruyus && PAKET=/tmp/yuruyus/paket.json node <repo>/scripts/ulke-yuruyus/genel.mjs
 *
 * Settings: PAKET (the JSON above, required), TABAN (http://localhost:3111), SUPA (http://127.0.0.1:54399), CIKTI (./cikti).
 * Exit code 0 only when every check passed.
 */
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

if (!process.env.PAKET || !existsSync(process.env.PAKET)) { console.error('PAKET=<the JSON written by scripts/ulke-yuruyus/paket-bilgisi.mts> is required'); process.exit(2) }
const P = JSON.parse(readFileSync(process.env.PAKET, 'utf8'))
const gerek = createRequire(join(process.env.YURUYUS_MODULLER || process.cwd(), 'x.js'))
const puppeteer = gerek('puppeteer-core')
const chromiumHam = gerek('@sparticuz/chromium')
const chromium = chromiumHam.default ?? chromiumHam

const TABAN = process.env.TABAN || 'http://localhost:3111'
const SUPA = process.env.SUPA || 'http://127.0.0.1:54399'
const ON_EK = P.yolOnEki
const CIKTI = process.env.CIKTI || './cikti'
mkdirSync(CIKTI, { recursive: true })
const YURUYUS_DIZIN = process.env.YURUYUS_DIZIN || join(tmpdir(), 'notya-yuruyus')
mkdirSync(YURUYUS_DIZIN, { recursive: true })
const SENARYO = join(YURUYUS_DIZIN, 'senaryo.json')
const GUNLUK = join(YURUYUS_DIZIN, 'cagrilar.jsonl')
const adres = (rota) => ((rota === '/' || /^\/[?#]/.test(rota) ? `${ON_EK}${rota.slice(1)}` : `${ON_EK}${rota}`) || '/')
const OTURUM_ANAHTARI = `sb-notya-${P.kod}-auth-token`
const HESAP_A = 'aaaaaaaa-0000-4000-8000-000000000001', HESAP_B = 'aaaaaaaa-0000-4000-8000-000000000002'
const HASTA_ADI = 'QA-PATIENT Walkthrough'

const sonuc = []
const kontrol = (ad, kosul, ayrinti = '') => { sonuc.push({ ad, tamam: !!kosul, ayrinti }); console.log(`${kosul ? 'ok  ' : 'FAIL'} ${ad}${ayrinti ? ' — ' + String(ayrinti).slice(0, 300) : ''}`) }
const bekle = (ms) => new Promise((r) => setTimeout(r, ms))
const tabloOku = async (ad) => (await fetch(`${SUPA}/__tablo/${ad}`)).json()
const cagrilar = () => (existsSync(GUNLUK) ? readFileSync(GUNLUK, 'utf8').split('\n').filter(Boolean).map((x) => JSON.parse(x)) : [])

const tarayici = await puppeteer.launch({
  args: [...chromium.args.filter((a) => a !== '--single-process'), '--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  executablePath: await chromium.executablePath(), headless: 'shell',
})
async function sayfaAc({ genislik, yukseklik, telefon }) {
  const ctx = await tarayici.createBrowserContext()
  const p = await ctx.newPage()
  await p.setViewport({ width: genislik, height: yukseklik, deviceScaleFactor: 1, isMobile: !!telefon, hasTouch: !!telefon })
  await p.setBypassCSP(true) // the stand-in Supabase is on localhost, outside the security policy
  await p.setRequestInterception(true)
  p.istekler = []; p.disari = []
  p.on('request', (r) => {
    const u = r.url()
    // Fonts are the one outside address a page asks for; this machine answers them empty (some machines block the font host).
    if (u.startsWith('https://fonts.googleapis.com/') || u.startsWith('https://fonts.gstatic.com/')) return r.respond({ status: 200, contentType: 'text/css', body: '' })
    if (u.startsWith(TABAN)) p.istekler.push(u.slice(TABAN.length))
    else if (!u.startsWith(SUPA) && !u.startsWith('data:') && !u.startsWith('blob:')) p.disari.push(u)
    r.continue()
  })
  p.konsol = []
  p.on('pageerror', (e) => p.konsol.push(String(e)))
  return p
}
const git = (p, rota) => p.goto(TABAN + adres(rota), { waitUntil: 'networkidle0', timeout: 180000 })
const yolda = (p, rota) => p.waitForFunction((a) => location.pathname === a, { timeout: 60000 }, adres(rota).split('?')[0])
const metin = (p, sel) => p.$eval(sel, (e) => e.innerText)
const govde = (p) => p.evaluate(() => `${document.title}\n${document.body.innerText}`)
const yazDeger = (p, sel, v) => p.evaluate((s, d) => {
  const e = document.querySelector(s)
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), 'value').set.call(e, d)
  e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }))
}, sel, v)
const api = (p, rota, secenek = {}) => p.evaluate(async (u, s, anahtar) => {
  const oturum = JSON.parse(localStorage.getItem(anahtar) || 'null')
  const r = await fetch(u, { method: s.method || 'GET', headers: { Authorization: `Bearer ${s.jeton ?? oturum?.access_token ?? ''}`, ...(s.govde ? { 'Content-Type': 'application/json' } : {}) }, body: s.govde ? JSON.stringify(s.govde) : undefined })
  const t = await r.text()
  let j = null; try { j = JSON.parse(t) } catch { /* not json */ }
  return { s: r.status, t: t.slice(0, 300), j }
}, adres(rota), secenek, OTURUM_ANAHTARI)

// ── what must never be on a screen of this country ──
const kacis = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const YABANCI = P.yabanci.flatMap((u) => u.terimler.map((t) => ({ kod: u.kod, terim: t.terim, desen: t.eslesme === 'kelime' ? new RegExp(`(?<![\\p{L}\\p{N}])${kacis(t.terim)}(?![\\p{L}\\p{N}])`, t.buyukKucukDuyarli ? 'u' : 'iu') : new RegExp(kacis(t.terim), t.buyukKucukDuyarli ? 'u' : 'iu') })))
const YABANCI_HARF = P.yabanci.filter((u) => u.harfler).map((u) => ({ kod: u.kod, desen: new RegExp(`[${kacis(u.harfler)}]`, 'u') }))
/** Every screen: no marker, no other country's term or letter, links under the path, nothing asked of the outside. */
async function tara(p, ad) {
  const g = await govde(p)
  const kaynak = await p.content()
  kontrol(`${ad}: nothing on the screen is still marked "to be supplied"`, !g.includes(P.eksikIsareti) && !kaynak.includes(P.eksikIsareti))
  const terim = YABANCI.filter((y) => y.desen.test(g)).map((y) => `${y.kod}:${y.terim}`)
  const harf = YABANCI_HARF.filter((y) => y.desen.test(g)).map((y) => `${y.kod}:${g.match(y.desen)?.[0]}`)
  kontrol(`${ad}: no term or letter of another country (${P.yabanci.map((u) => u.kod).join(', ')})`, terim.length === 0 && harf.length === 0, [...terim, ...harf].join(' '))
  const iz = P.yabanci.filter((u) => kaynak.includes(u.iz)).map((u) => u.kod)
  kontrol(`${ad}: no other country's pack in the page`, iz.length === 0, iz.join(' '))
  const hepsi = await p.evaluate(() => [...document.querySelectorAll('a[href], form[action]')].map((e) => e.getAttribute('href') ?? e.getAttribute('action')))
  const altinda = (h) => h.startsWith('#') || h.startsWith('mailto:') || (ON_EK ? h === ON_EK || h.startsWith(`${ON_EK}/`) || h.startsWith(`${ON_EK}?`) || h.startsWith(`${ON_EK}#`) : h.startsWith('/') || h.startsWith('?'))
  const disari = hepsi.filter((h) => !altinda(h))
  kontrol(`${ad}: every link and form stays under "${ON_EK || '/'}"`, disari.length === 0, disari.join(' '))
  const kacak = ON_EK ? p.istekler.filter((i) => !(i === ON_EK || i.startsWith(`${ON_EK}/`) || i.startsWith(`${ON_EK}?`))) : []
  kontrol(`${ad}: every request to the application is under "${ON_EK || '/'}", and none goes to an outside service`, kacak.length === 0 && p.disari.length === 0, [...new Set([...kacak, ...p.disari])].slice(0, 4).join(' '))
  kontrol(`${ad}: no script error on the page`, p.konsol.length === 0, p.konsol.slice(0, 2).join(' | '))
}
async function giris(p, eposta, sifre) {
  for (const [id, v] of [['#ulke-giris-eposta', eposta], ['#ulke-giris-sifre', sifre]]) { await p.click(id, { clickCount: 3 }); await p.keyboard.press('Backspace'); await yazDeger(p, id, ''); await p.type(id, v) }
  await p.click('button[type=submit]')
}
/** After a first login: answer whatever questions THIS pack asks (language and script, role), and arrive at the home. */
async function sorulariGec(p, rol) {
  const sorulan = []
  for (let i = 0; i < 4; i++) {
    // Either the home (drawn — an account with a question left is sent on from there), or the questions' address with a question drawn on it (never the login form that was just sent).
    const durum = await p.waitForFunction((bugun, soru) => (location.pathname === bugun && document.querySelector('.uza-karsilama') ? 'ev' : location.pathname === soru && document.querySelector('select[name=rol], input[name=dil], input[name=yazi]') ? (document.querySelector('select[name=rol]') ? 'rol' : 'dil') : false), { timeout: 60000 }, adres('/today'), adres('/start')).then((h) => h.jsonValue())
    if (durum === 'ev') break
    if (durum === 'rol') { sorulan.push('role'); await p.select('select[name=rol]', rol) } else sorulan.push('language')
    await p.click('button[type=submit]')
    // the same address draws the next question, or the home opens: wait until this question is gone
    await p.waitForFunction((bugun, d) => (location.pathname === bugun && !!document.querySelector('.uza-karsilama')) || (d === 'dil' ? !document.querySelector('input[name=dil], input[name=yazi]') : !document.querySelector('select[name=rol]')), { timeout: 60000 }, adres('/today'), durum)
  }
  await yolda(p, '/today')
  await p.waitForSelector('h1', { timeout: 60000 })
  return sorulan
}

const MASA = { genislik: 1440, yukseklik: 900 }, TEL = { genislik: 390, yukseklik: 844, telefon: true }
console.log(`\nPack-neutral walk-through — country "${P.kod}", served under "${ON_EK || '/'}", form "${P.dil}"\n`)

// ───────────────────────── 1. public pages ─────────────────────────
{
  const p = await sayfaAc(MASA)
  if (P.acilis) {
    const r = await git(p, '/')
    const bilgi = await p.evaluate(() => ({ lang: document.documentElement.lang, baslik: document.title, h1: document.querySelector('h1')?.innerText ?? '', robots: document.querySelector('meta[name=robots]')?.getAttribute('content') || '' }))
    kontrol('landing page: answers at the country\'s path, in the pack\'s default form', r.status() === 200 && bilgi.lang === P.dil, `${r.status()} lang=${bilgi.lang}`)
    kontrol('landing page: the headline is the pack\'s own', bilgi.h1.replace(/\s+/g, ' ').includes(P.acilisIcerigi.baslik.replace(/\s+/g, ' ')), bilgi.h1)
    kontrol(`landing page: ${P.gizli ? 'hidden from search (noindex header and meta)' : 'open to search, as the pack says'}`, P.gizli ? /noindex/.test(r.headers()['x-robots-tag'] || '') && /noindex/.test(bilgi.robots) : !/noindex/.test(r.headers()['x-robots-tag'] || ''), `${r.headers()['x-robots-tag']} | ${bilgi.robots}`)
    const capalar = await p.evaluate((l) => l.filter((c) => !document.getElementById(c)), Object.values(P.acilisIcerigi.capalar))
    kontrol('landing page: every section anchor of the pack is on the page', capalar.length === 0, capalar.join(' '))
    await tara(p, 'landing page')
    await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-landing.png`) })
  }
  await git(p, '/signup')
  const kodAlani = await p.evaluate(() => [...document.querySelectorAll('input')].map((e) => e.id || e.name).join(' '))
  kontrol(`sign-up: ${P.kayitAcik ? 'open — no invitation code is asked' : 'closed — an invitation code is required'}`, /kod/i.test(kodAlani) === !P.kayitAcik, kodAlani)
  if (!P.kayitAcik) {
    const kodsuz = await p.evaluate(async (u) => { const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adSoyad: 'QA Uninvited', eposta: 'qa-uninvited@notya.test', sifre: 'sinov-parol-9', dil: null }) }); return r.status }, adres('/api/ulke/kayit'))
    kontrol('sign-up: the server refuses an account without a valid invitation code', kodsuz >= 400 && kodsuz < 500, String(kodsuz))
  }
  await tara(p, 'sign-up page')
  await git(p, '/login')
  kontrol('login page: the button is the pack\'s own text', (await metin(p, 'button[type=submit]')) === P.giris.gonder)
  await tara(p, 'login page')
  await giris(p, 'qa-uz@notya.test', 'wrong-password')
  await p.waitForSelector('[role=alert]', { timeout: 30000 })
  kontrol('login refused (wrong password): the pack\'s own sentence, no session kept', (await metin(p, '[role=alert]')) === P.hesap.girisReddi && !(await p.evaluate(() => Object.keys(localStorage).some((k) => k.includes('auth-token')))))
  await git(p, '/login')
  await giris(p, 'qa-tr@notya.test', 'sinov-parol-3')
  await p.waitForSelector('[role=alert]', { timeout: 30000 })
  kontrol('login refused (an account of ANOTHER country in the shared database): same sentence, no session kept', (await metin(p, '[role=alert]')) === P.hesap.girisReddi && !(await p.evaluate(() => Object.keys(localStorage).some((k) => k.includes('auth-token')))))
  for (const yol of ['/doktor', '/giris', '/dashboard/doktor', '/api/users/me']) {
    const s = await p.evaluate(async (u) => (await fetch(u)).status, adres(yol))
    kontrol(`a path of the pre-split application does not exist here: ${yol} → 404`, s === 404, String(s))
  }
  await p.close()
}

// ───────────────────────── 2. account A: questions, home, settings, patient ─────────────────────────
const A = await sayfaAc(MASA)
let hastaA = ''
/** The approved note of step 3 and the appointment of step 4, for the portal steps. */
let notA = '', randevuGunu = ''
{
  const p = A
  await git(p, '/login')
  await giris(p, 'qa-uz@notya.test', 'sinov-parol-1')
  const sorulan = await sorulariGec(p, P.ilkRol?.anahtar ?? '')
  const beklenen = [...(P.uygulamaDilleri.length > 1 ? ['language'] : []), ...(P.roller.length ? ['role'] : [])]
  kontrol(`first login asks exactly what the pack has to ask (${beklenen.join(' + ') || 'nothing'}) and arrives at the home`, JSON.stringify(sorulan) === JSON.stringify(beklenen), sorulan.join(' + ') || 'nothing')
  const anahtarlar = await p.evaluate(() => Object.keys(localStorage))
  kontrol('the session is stored under a key that names this country, and no cookie is set', JSON.stringify(anahtarlar) === JSON.stringify([OTURUM_ANAHTARI]) && (await p.cookies()).length === 0, anahtarlar.join(' '))
  const g = await govde(p)
  kontrol('home: the shell and the page speak the pack\'s catalogue', g.includes(P.m.kabuk.hastalar) && g.includes(P.m.kabuk.ayarlar) && g.includes(P.m.bugun.baslik))
  if (P.roller.length) {
    const rol = await tabloOku('hekim_rolu')
    kontrol('the role is stored for this account, with the country', rol.length === 1 && rol[0].doctor_id === HESAP_A && rol[0].rol === P.ilkRol.anahtar && rol[0].ulke === P.kod, JSON.stringify(rol))
    if (P.ilkRol.asistan) kontrol('home: the role\'s assistant is named as the pack names it', (await metin(p, '[data-alan=asistan-ad]')) === P.ilkRol.asistan.tamAd)
  }
  await tara(p, 'home')
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-home.png`) })

  await git(p, '/settings')
  await p.waitForFunction((b) => document.querySelector('h1')?.innerText === b, { timeout: 30000 }, P.m.ayarlar.baslik)
  const dilimSecimi = !!(await p.$('select[name=saat-dilimi], [data-alan=saat-dilimi]'))
  kontrol(`settings: ${P.saatDilimleri.length > 1 ? 'the account chooses its time zone (the country has several)' : 'no time zone is asked (the country has one)'}`, dilimSecimi === P.saatDilimleri.length > 1)
  kontrol(`settings: ${P.uygulamaDilleri.length > 1 ? 'the account chooses its languages' : 'no language is asked (the country has one form)'}`, !!(await p.$('input[name=arayuz]')) === P.uygulamaDilleri.length > 1)
  await tara(p, 'settings')

  await git(p, '/patients/new')
  await p.waitForSelector('#uza-h-ad')
  kontrol(`new patient: the second name field is ${P.ikinciAd ? 'shown' : 'absent'} and the identity number field is ${P.kimlik ? 'shown' : 'absent'}, as the pack says`, !!(await p.$('#uza-h-ota')) === P.ikinciAd && !!(await p.$('#uza-h-kimlik')) === P.kimlik)
  kontrol('new patient: the phone example is the pack\'s', (await p.$eval('#uza-h-tel', (e) => e.placeholder)) === P.telefonOrnek)
  await tara(p, 'new patient')
  await p.type('#uza-h-ad', HASTA_ADI)
  await yazDeger(p, '#uza-h-dogum', '2021-03-07')
  await p.type('#uza-h-tel', P.telefonOrnek)
  await p.click('input[name="cinsiyet"][value="female"]')
  if (await p.$('input[name="hasta-dili"]')) await p.click(`input[name="hasta-dili"][value="${P.hastaDilleri[0]}"]`)
  await p.click('button[type=submit]')
  await yolda(p, '/patient')
  await p.waitForFunction((ad) => document.querySelector('h1')?.innerText.includes(ad), { timeout: 60000 }, HASTA_ADI)
  hastaA = new URL(p.url()).searchParams.get('id')
  const dogum = P.tarihDeseni.replace('DD', '07').replace('MM', '03').replace('YYYY', '2021')
  kontrol(`patient saved → the patient file; the birth date is written the country's way (${dogum})`, /^[0-9a-f-]{36}$/.test(hastaA) && (await govde(p)).includes(dogum))
  const ham = JSON.stringify([await tabloOku('ulke_hastalar'), await tabloOku('hasta_ulke_bilgisi')])
  kontrol('in the database the name, birth date and phone are encrypted, and the row carries this country and this account', !ham.includes('QA-PATIENT') && !ham.includes('2021-03-07') && (await tabloOku('ulke_hastalar')).every((h) => h.ulke === P.kod && h.doctor_id === HESAP_A))
  await tara(p, 'patient file')
  await git(p, `/patients?q=${encodeURIComponent('walkthrough')}`)
  await p.waitForSelector('.uza-liste, .uza-bos')
  kontrol('find the patient by name', (await govde(p)).includes(HASTA_ADI))
}

// ───────────────────────── 3. a visit: consent → recording → note → approval (speech and model are stand-ins) ─────────────────────────
{
  const p = A
  writeFileSync(GUNLUK, ''); writeFileSync(SENARYO, JSON.stringify({ stt: 'yuksek', model: 'tamam' }))
  await git(p, `/visit?hasta=${hastaA}`)
  await p.waitForSelector('input[name=riza]')
  const once = await p.evaluate(() => ({ kapali: document.querySelector('.uza-form button.uza-dugme').disabled, isaretli: document.querySelector('input[name=riza]').checked }))
  kontrol('consent: the box starts unticked and recording cannot start', once.kapali && !once.isaretli && (await govde(p)).includes(P.m.muayene.riza))
  const rizasiz = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: `${P.kod}/${HESAP_A}/none.webm`, hastaId: hastaA, sablon: P.genelSablon } })
  kontrol('consent: the server refuses a visit without it', rizasiz.s === 400 && rizasiz.t === '{"code":"RIZA_GEREKLI"}', `${rizasiz.s} ${rizasiz.t}`)
  await tara(p, 'visit: consent')
  await p.click('input[name=riza]')
  await p.waitForFunction(() => !document.querySelector('.uza-form button.uza-dugme').disabled)
  await p.click('.uza-form button.uza-dugme')
  await p.waitForSelector('.uza-sure', { timeout: 20000 })
  await bekle(2600)
  await p.click('.uza-kayit .uza-dugme')
  await p.waitForFunction(() => new URLSearchParams(location.search).has('not'), { timeout: 120000 })
  await p.waitForSelector('#uza-not-s', { timeout: 60000 })
  const notId = new URL(p.url()).searchParams.get('not')
  const c = cagrilar(), stt = c.filter((x) => x.tur === 'stt'), mdl = c.filter((x) => x.tur === 'model')
  kontrol('speech: asked once, with the pack\'s model and no language', stt.length === 1 && stt[0].model === P.konusmaModeli && stt[0].dil === null && stt[0].bayt > 200, JSON.stringify(stt))
  kontrol('note: the model was asked once, through the gateway, with "do not keep this data", and with nothing that says who the patient is', mdl.length === 1 && mdl[0].veriToplama === 'deny' && mdl[0].genelKimlikVar === false && mdl[0].sistemUzunluk > 0, JSON.stringify(mdl))
  kontrol('no outside address was asked for anything', c.every((x) => x.tur !== 'REFUSED'), JSON.stringify(c.filter((x) => x.tur === 'REFUSED')))
  const yuklemeler = (await (await fetch(`${SUPA}/__gunluk`)).json()).filter((x) => x.startsWith('POST /storage/v1/object/'))
  kontrol('the recording went to this country\'s folder and, inside it, this account\'s own', yuklemeler.length === 1 && yuklemeler[0].startsWith(`POST /storage/v1/object/muayene-sesleri/${P.kod}/${HESAP_A}/`), yuklemeler.join(' '))
  kontrol('the recording is gone from storage once transcribed', (await (await fetch(`${SUPA}/__depo`)).json()).length === 0)
  const kayit = await tabloOku('muayene_dil_kaydi')
  kontrol('stored with the visit: the pack\'s consent stamp, the predicted language, one pass', kayit.length === 1 && kayit[0].riza_surumu === P.rizaSurumu && kayit[0].taninan_dil === P.sttKodu && kayit[0].gecis_sayisi === 1 && kayit[0].ulke === P.kod, JSON.stringify(kayit))
  const dort = await p.evaluate(() => ['s', 'o', 'a', 'p'].map((b) => document.querySelector(`#uza-not-${b}`).value))
  kontrol('NOTE: a draft with the four sections, written from the visit', dort.every((x, i) => x.startsWith(`SYNTHETIC-${'SOAP'[i]}`)), dort.join(' | '))
  const cizilen = await p.$$eval('[data-alan-anahtar]', (l) => l.map((e) => e.getAttribute('data-alan-anahtar')))
  const bekAlan = P.ilkRol?.alanlar ?? []
  kontrol(`NOTE: the role's own fields and no other (${bekAlan.length} of the role; a made-up key the model returned is dropped)`, bekAlan.every((k) => cizilen.includes(k)) && !cizilen.includes('not_a_field_of_anybody') && !(await govde(p)).includes('SYNTHETIC-LEAK') && !JSON.stringify(await tabloOku('not_dil_kaydi')).includes('SYNTHETIC-LEAK'), cizilen.join(' '))
  await tara(p, 'note draft')
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-note.png`), fullPage: true })
  await p.click('[data-eylem=onayla]')
  await p.waitForSelector('[data-bolum=s]', { timeout: 30000 })
  const not = (await tabloOku('ulke_notlar'))[0]
  kontrol('APPROVE: the note is approved by this doctor, in this country', !!not.approved_at && not.approved_by === HESAP_A && not.ulke === P.kod && not.id === notId)
  const gec = await api(p, '/api/ulke/not', { method: 'PATCH', govde: { notId, dil: P.dil, s: 'CHANGED-AFTER-APPROVAL', o: '', a: '', p: '' } })
  kontrol('an approved note is never overwritten', gec.s >= 400 && !JSON.stringify(await tabloOku('ulke_notlar')).includes('CHANGED-AFTER-APPROVAL'), `${gec.s} ${gec.t}`)
  await tara(p, 'approved note')
  notA = notId
}

// ───────────────────────── 4. appointments ─────────────────────────
if (P.randevu) {
  const p = A
  const duzen = await api(p, '/api/ulke/calisma-duzeni')
  const buGun = new Intl.DateTimeFormat('en-CA', { timeZone: P.saatDilimleri[0], year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  kontrol(`"today" is today in the country's time zone (${P.saatDilimleri[0]}), and the date pattern is the pack's`, duzen.s === 200 && duzen.j.bugun === buGun && duzen.j.tarihDeseni === P.tarihDeseni, `${duzen.j?.bugun} vs ${buGun}`)
  const yarin = new Date(Date.parse(`${buGun}T12:00:00Z`) + 86400000).toISOString().slice(0, 10)
  const ilk = await api(p, '/api/ulke/randevu', { method: 'POST', govde: { hastaId: hastaA, gun: yarin, saat: '14:30', sureDk: duzen.j.sureSecenekleri[0], yineDe: true } })
  kontrol('an appointment is booked', ilk.s === 200 && !!ilk.j?.randevu?.id, `${ilk.s} ${ilk.t}`)
  const cift = await api(p, '/api/ulke/randevu', { method: 'POST', govde: { hastaId: hastaA, gun: yarin, saat: '14:30', sureDk: duzen.j.sureSecenekleri[0], yineDe: true } })
  kontrol('double booking is refused, with a code and no sentence', cift.s >= 400 && /^\{"code":"[A-Z_]+"/.test(cift.t), `${cift.s} ${cift.t}`)
  const satirlar = await tabloOku('ulke_randevulari')
  kontrol('in the database: one appointment, with this country and this account', satirlar.length === 1 && satirlar[0].ulke === P.kod && satirlar[0].doctor_id === HESAP_A)
  await git(p, `/calendar?gun=${yarin}&gorunum=gun`)
  await p.waitForFunction((ad) => document.body.innerText.includes(ad), { timeout: 60000 }, HASTA_ADI)
  const g = await govde(p)
  const saat = P.saatBicimi === 12 ? /2:30\s?PM/i.test(g) && !g.includes('14:30') : g.includes('14:30')
  kontrol(`calendar: the appointment is shown, and its time is written the pack's way (${P.saatBicimi}-hour)`, saat, g.match(/\d{1,2}:30[^\n]{0,6}/)?.[0] ?? '')
  await tara(p, 'calendar')
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-calendar.png`) })
  randevuGunu = yarin
}

// ───────────────────────── 4b. the patient portal (where the pack has one) ─────────────────────────
/** Which link a portal request says it is for (the SHA-256 of the token), and tokens that must appear in no request. */
const ozetle = (t) => createHash('sha256').update(t).digest('hex')
let portalIstegi = ''
/** The patient's open browser, handed to step 5 (which withdraws the access and looks at that page again). */
let portalOturumu = null
if (P.portal) {
  const p = A
  const K = P.portal, HM = K.hekim, PM = K.hasta
  const doldur = (m, ...d) => (d.length === 1 ? m.replace('%', () => String(d[0])) : m.replace(/%(\d)/g, (h, n) => String(d[Number(n) - 1] ?? h)))
  const gunYaz = (gun) => { const [y, a, g] = gun.split('-'); return P.tarihDeseni.replace('DD', g).replace('MM', a).replace('YYYY', y) }
  const haftaGunu = (gun) => { const [y, a, g] = gun.split('-').map(Number); return new Date(Date.UTC(y, a - 1, g)).getUTCDay() || 7 }
  const gunAdi = (gun) => (K.hastaRandevu ? `${K.hastaRandevu.gunUzun[haftaGunu(gun)]}, ${gunYaz(gun)}` : gunYaz(gun))
  const saatYaz = (saat) => { if (P.saatBicimi === 24) return saat; const [s, d] = saat.split(':').map(Number); return new RegExp(`^${s % 12 || 12}:${String(d).padStart(2, '0')}\\s?${s < 12 ? 'AM' : 'PM'}$`, 'i') }
  const hApi = (pg, rota, s = {}) => pg.evaluate(async (u, s) => {
    const r = await fetch(u, { method: s.method || 'GET', credentials: 'same-origin', headers: { ...(s.ozet ? { 'x-notya-portal-baglanti': s.ozet } : {}), ...(s.jeton ? { Authorization: `Bearer ${s.jeton}` } : {}), ...(s.govde ? { 'Content-Type': 'application/json', 'x-notya-portal': '1' } : {}) }, body: s.govde ? JSON.stringify(s.govde) : undefined })
    const t = await r.text(); let j = null; try { j = JSON.parse(t) } catch { /* not json */ }
    return { s: r.status, t: t.slice(0, 300), j }
  }, adres(rota), { ...s, ozet: s.token ? ozetle(s.token) : '' })
  const pinGonder = async (pg, pin) => { await pg.waitForSelector('#uzp-pin', { timeout: 60000 }); await yazDeger(pg, '#uzp-pin', pin); await pg.click('[data-eylem=portal-giris]') }

  // access: given by the doctor on the patient's file, shown once
  await git(p, `/patient?id=${hastaA}`)
  await p.waitForSelector('[data-alan=portal-erisim] [data-eylem=erisim-ver]', { timeout: 60000 })
  kontrol('portal: the patient\'s file has the access card, in the pack\'s words, and the patient has no access yet', (await metin(p, '[data-alan=portal-erisim] h2')) === HM.erisim.baslik && (await metin(p, '[data-alan=erisim-durumu]')) === HM.erisim.durumYok)
  await p.click('[data-eylem=erisim-ver]')
  await p.waitForSelector('[data-alan=portal-baglanti]', { timeout: 30000 })
  const erisim = { adres: await p.$eval('[data-alan=portal-baglanti]', (e) => e.value), pin: await p.$eval('[data-alan=portal-pin]', (e) => e.value) }
  const token = erisim.adres.split('#')[1] || ''
  kontrol('portal: "give access" shows a link under the country\'s path, in the patient\'s form, with the token in its fragment, and a PIN of the kit\'s length', erisim.adres.startsWith(`${TABAN}${adres('/portal')}?dil=${K.hastaBicimi}#`) && /^[A-Za-z0-9_-]{43}$/.test(token) && new RegExp(`^\\d{${K.pinHane}}$`).test(erisim.pin), erisim.adres.replace(token, '<token>'))
  const satir = (await tabloOku('ulke_portal_erisimleri'))[0]
  const gun = (Date.parse(satir.son_gecerlilik) - Date.now()) / 86400000
  kontrol(`portal: the database holds only hashes of the token and the PIN, with this country and this account; the link is valid for the pack's ${K.gecerlilikGun} days`, satir.ulke === P.kod && satir.doctor_id === HESAP_A && satir.token_hash === ozetle(token) && satir.pin_hash.startsWith('scrypt$') && !JSON.stringify(await tabloOku('ulke_portal_erisimleri')).includes(token) && Math.abs(gun - K.gecerlilikGun) < 0.01, `${gun.toFixed(3)} days`)
  await tara(p, 'patient file with the access card')
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-portal-access.png`), fullPage: true })

  // the patient: a browser of their own, a phone
  const H = await sayfaAc(TEL)
  const acilis = await H.goto(erisim.adres, { waitUntil: 'networkidle0', timeout: 180000 })
  await H.waitForSelector('#uzp-pin', { timeout: 60000 })
  const bas = acilis.headers()
  kontrol('portal: the patient\'s page is never indexed, never cached, and names no referrer', acilis.status() === 200 && /noindex/.test(bas['x-robots-tag'] || '') && /no-store/.test(bas['cache-control'] || '') && bas['referrer-policy'] === 'no-referrer', `${bas['x-robots-tag']} | ${bas['cache-control']} | ${bas['referrer-policy']}`)
  let g = await govde(H)
  kontrol('portal: THE TOKEN ALONE SHOWS NOTHING — the PIN form in the patient\'s form, no name on it, and the page\'s own request for data was refused', (await metin(H, 'h1')) === PM.giris.baslik && g.includes(PM.giris.aciklama) && !g.includes('QA-PATIENT') && !g.includes('QA Shifokor') && (await hApi(H, '/api/ulke/portal', { token })).s === 401 && (await H.evaluate(() => document.querySelector('.uza').lang)) === K.hastaBicimi)
  await tara(H, 'portal: PIN page')
  const yanlis = erisim.pin === '0'.repeat(K.pinHane) ? '1'.repeat(K.pinHane) : '0'.repeat(K.pinHane)
  await pinGonder(H, yanlis)
  await H.waitForSelector('[role=alert]', { timeout: 30000 })
  kontrol('portal: a wrong PIN is answered with the pack\'s sentence and the tries left; no session is opened', (await metin(H, '[role=alert]')) === doldur(PM.giris.pinYanlis, K.pinDeneme - 1) && (await tabloOku('ulke_portal_oturumlari')).length === 0)
  await bekle(2200)
  await pinGonder(H, erisim.pin)
  await H.waitForSelector('[data-alan=hasta-ad]', { timeout: 30000 })
  const cerez = await H.cookies(`${TABAN}${adres('/api/ulke/portal')}`)
  kontrol('portal: signed in — one HttpOnly, SameSite=Strict cookie for the portal\'s own routes; a script on the page can read no cookie and no storage', cerez.length === 1 && cerez[0].httpOnly && cerez[0].sameSite === 'Strict' && cerez[0].path === adres('/api/ulke/portal') && (await H.evaluate(() => document.cookie + Object.keys(localStorage).join('') + Object.keys(sessionStorage).join(''))) === '')
  g = await govde(H)
  kontrol('portal: the page greets the patient by name, names the doctor and the role as the pack names it, and names the ambulance number only if the pack states one', (await metin(H, '[data-alan=hasta-ad]')) === doldur(PM.sayfa.selam, HASTA_ADI) && (await metin(H, '[data-alan=hekim]')) === ['QA Shifokor Bir', K.ilkRolAdi].filter(Boolean).join(' · ') && g.includes(PM.sayfa.yalniz) && g.includes(PM.sayfa.acil) && (K.acilNumara ? g.includes(doldur(PM.sayfa.acilNumara, K.acilNumara)) : !g.includes(PM.sayfa.acilNumara.split('%')[0].trim())))
  if (P.randevu) {
    const satirlar = await H.$$eval('[data-alan=portal-randevular] .uza-satir', (l) => l.map((e) => e.innerText.replace(/\s+/g, ' ').trim()))
    const s = saatYaz('14:30')
    kontrol(`portal: the appointment of step 4 is listed with its weekday, its day in the pack's pattern (${P.tarihDeseni}) and its time the pack's way (${P.saatBicimi}-hour)`, satirlar.length === 1 && satirlar[0].includes(gunAdi(randevuGunu)) && (typeof s === 'string' ? satirlar[0].startsWith(s) : s.test(satirlar[0].split(gunAdi(randevuGunu))[0].trim())), satirlar.join(' | '))
  }
  kontrol('portal: nothing is shared yet and the page says so; nothing of the note, the transcript or the phone is on it', g.includes(PM.sayfa.ozetYok) && !/SYNTHETIC|synthetic visit/.test(g) && !g.includes(P.telefonOrnek))
  await tara(H, 'portal: the patient\'s page')
  // (The browser driver writes a document request's address with its fragment; a browser never sends one. Checked: up to the '#'.)
  kontrol('portal: the patient\'s page links nowhere and the token is in no request', (await H.evaluate(() => document.querySelectorAll('a[href]').length)) === 0 && H.istekler.every((i) => !i.split('#')[0].includes(token)) && p.istekler.every((i) => !i.split('#')[0].includes(token)))
  await H.screenshot({ path: join(CIKTI, `genel-${P.kod}-portal-page.png`), fullPage: true })

  // a summary: written on request from the approved note, shared by the doctor's own act, taken back
  writeFileSync(GUNLUK, '')
  await git(p, `/visit?not=${notA}`)
  await p.waitForSelector('[data-alan=hasta-ozeti] [data-eylem=ozet-yaz]', { timeout: 60000 })
  await p.click('[data-eylem=ozet-yaz]')
  await p.waitForSelector('#uza-ozet-metni', { timeout: 60000 })
  const mdl = cagrilar().filter((x) => x.tur === 'model')
  kontrol('portal: the summary was asked of the model once, through the gateway, with "do not keep this data" and nothing that says who the patient is', mdl.length === 1 && mdl[0].is === 'ozet' && mdl[0].veriToplama === 'deny' && mdl[0].genelKimlikVar === false, JSON.stringify(mdl))
  const ozet = await p.$eval('#uza-ozet-metni', (e) => e.value)
  await H.reload({ waitUntil: 'networkidle0' }); await H.waitForSelector('[data-alan=hasta-ad]', { timeout: 30000 })
  kontrol('portal: a DRAFT is on the doctor\'s screen and NOT on the patient\'s page — nothing is shared by itself', ozet.startsWith('SYNTHETIC-SUMMARY') && (await metin(p, '[data-alan=ozet-durumu]')) === HM.ozet.paylasilmadi && !(await H.$('[data-ozet]')))
  await tara(p, 'approved note with the summary card')
  await p.click('[data-eylem=ozet-paylas]')
  await p.waitForSelector('[data-alan=hasta-ozeti][data-paylasildi=evet]', { timeout: 30000 })
  await H.reload({ waitUntil: 'networkidle0' }); await H.waitForSelector('[data-ozet]', { timeout: 30000 })
  kontrol('portal: SHARED — the patient reads exactly that text; the row is encrypted; the clinical note is still not on the page', (await metin(H, '[data-ozet] .uza-not-metin')) === ozet && !JSON.stringify(await tabloOku('ulke_hasta_ozetleri')).includes('SYNTHETIC') && !/SYNTHETIC-[SOAP] /.test(await govde(H)) && (await govde(H)).includes(doldur(PM.sayfa.muayene, '').trim()))
  await tara(H, 'portal: the patient\'s page with a summary')
  await p.click('[data-eylem=ozet-geri-al]')
  await p.waitForSelector('[data-alan=hasta-ozeti][data-paylasildi=hayir]', { timeout: 30000 })
  await H.reload({ waitUntil: 'networkidle0' }); await H.waitForSelector('[data-alan=hasta-ad]', { timeout: 30000 })
  kontrol('portal: TAKEN BACK — gone from the patient\'s page at once; both acts are in the record for the doctor', !(await H.$('[data-ozet]')) && !(await govde(H)).includes('SYNTHETIC-SUMMARY') && JSON.stringify((await tabloOku('ulke_portal_kayitlari')).map((k) => k.olay)) === '["erisim","giris","paylasim","geri-alma"]', JSON.stringify((await tabloOku('ulke_portal_kayitlari')).map((k) => k.olay)))
  kontrol('portal: the usage record counted one patient summary for this account', (await tabloOku('ulke_kullanim_olcumu')).filter((k) => k.gorev === 'hasta-ozeti' && k.doctor_id === HESAP_A && k.ulke === P.kod && k.adet === 1).length === 1)

  // an appointment request: it books nothing; a taken time is refused; the doctor's choice books it
  if (P.randevu) {
    const gunler = await H.$$eval('[data-alan=portal-istek] input[name=gunler]', (l) => l.map((e) => e.value))
    const secilen = gunler.filter((x) => x !== randevuGunu).slice(0, 2)
    for (const x of secilen) await H.click(`input[name=gunler][value="${x}"]`)
    await H.type('#uzp-neden', 'QA-REASON of the patient')
    await H.click('[data-eylem=portal-istek]')
    await H.waitForSelector('[data-istek-durumu=bekliyor]', { timeout: 30000 })
    const istek = (await tabloOku('ulke_randevu_istekleri'))[0]
    portalIstegi = istek.id
    kontrol('portal: a REQUEST is stored for this patient and this account, with the days chosen and an unreadable reason — and NO appointment was made', istek.durum === 'bekliyor' && istek.patient_id === hastaA && istek.doctor_id === HESAP_A && istek.ulke === P.kod && JSON.stringify(istek.gunler) === JSON.stringify(secilen) && !JSON.stringify(istek).includes('QA-REASON') && (await tabloOku('ulke_randevulari')).length === 1 && (await govde(H)).includes(PM.sayfa.istekBekliyor))
    await git(p, '/calendar')
    await p.waitForSelector('[data-alan=randevu-istekleri] [data-istek]', { timeout: 60000 })
    const kart = await metin(p, '[data-alan=randevu-istekleri]')
    kontrol('portal: the request is on the doctor\'s calendar, with the patient and the reason', kart.includes(HM.istek.baslik) && kart.includes(HASTA_ADI) && kart.includes('QA-REASON of the patient'))
    await tara(p, 'calendar with a request')
    await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('[data-eylem=istek-sec]')])
    await p.waitForSelector('#uza-ri-gun', { timeout: 60000 })
    await tara(p, 'answer to a request')
    const dolu = await api(p, '/api/ulke/hasta-portali/istekler', { method: 'PATCH', govde: { id: istek.id, gun: gunYaz(randevuGunu), saat: '14:30', sureDk: (await api(p, '/api/ulke/calisma-duzeni')).j.sureSecenekleri[0], yineDe: true } })
    kontrol('portal: NO DOUBLE BOOKING through a request — a taken time is refused even with "book anyway", and the request still waits', dolu.s === 409 && dolu.t === '{"code":"DOLU"}' && (await tabloOku('ulke_randevu_istekleri'))[0].durum === 'bekliyor' && (await tabloOku('ulke_randevulari')).length === 1, `${dolu.s} ${dolu.t}`)
    const kabul = await api(p, '/api/ulke/hasta-portali/istekler', { method: 'PATCH', govde: { id: istek.id, gun: gunYaz(secilen[0]), saat: '09:30', sureDk: (await api(p, '/api/ulke/calisma-duzeni')).j.sureSecenekleri[0], yineDe: true } })
    const sonra = (await tabloOku('ulke_randevu_istekleri'))[0]
    kontrol('portal: ACCEPTED by the doctor\'s choice of time — one more appointment, for that patient, and the request points at it', kabul.s === 200 && sonra.durum === 'kabul' && sonra.randevu_id === kabul.j.randevuId && (await tabloOku('ulke_randevulari')).length === 2 && (await tabloOku('ulke_randevulari')).find((r) => r.id === kabul.j.randevuId).patient_id === hastaA, `${kabul.s} ${kabul.t}`)
    await H.reload({ waitUntil: 'networkidle0' }); await H.waitForSelector('[data-istek-durumu=kabul]', { timeout: 30000 })
    const s = saatYaz('09:30')
    const cumle = await metin(H, '[data-alan=portal-istek] .uza-bilgi-kutu')
    kontrol('portal: THE PATIENT SEES THE OUTCOME — the pack\'s sentence with the day and the time as the country writes them', typeof s === 'string' ? cumle === doldur(PM.sayfa.istekKabul, gunAdi(secilen[0]), s) : cumle.startsWith(doldur(PM.sayfa.istekKabul, gunAdi(secilen[0]), '\u0000').split('\u0000')[0]), cumle)
    await tara(H, 'portal: the patient\'s page after the answer')
  }

  // a doctor's session is no patient, and a patient's session is no doctor
  const jeton = await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null')?.access_token ?? '', OTURUM_ANAHTARI)
  const hekimle = await p.evaluate(async (u, j, o) => { const r = await fetch(u, { headers: { Authorization: `Bearer ${j}`, 'x-notya-portal-baglanti': o } }); return { s: r.status, t: await r.text() } }, adres('/api/ulke/portal'), jeton, ozetle(token))
  kontrol('portal: the patient\'s routes never accept a doctor\'s session', jeton.length > 10 && hekimle.s === 401 && hekimle.t === '{"code":"OTURUM_YOK"}', `${hekimle.s} ${hekimle.t}`)
  const hastayla = []
  for (const rota of [`/api/ulke/hasta?id=${hastaA}`, `/api/ulke/hasta-portali?hasta=${hastaA}`, '/api/ulke/hasta-portali/istekler', '/api/ulke/hesap']) hastayla.push(await hApi(H, rota, { token }), await hApi(H, rota, { token, jeton: cerez[0].value }), await hApi(H, rota, { token, jeton: token }))
  kontrol('portal: the doctor\'s routes never accept a patient\'s session — not the cookie, not the session key, not the link\'s token', hastayla.every((r) => r.s === 401 && r.t === '{"code":"OTURUM_YOK"}'), [...new Set(hastayla.map((r) => `${r.s} ${r.t}`))].join(' | '))
  // (That a page opened for ANOTHER link also ends the session is walked in the country's own walk-through and proved in
  // lib/ulke/portal/portal.paket.test.ts; here the session must stay open for step 5.)
  if (P.randevu) kontrol('portal: a session answers only its own link — a request sent with another link\'s mark, or with none, is "no session", and with its own mark the page still answers', (await hApi(H, '/api/ulke/portal/randevu-istegi', { method: 'POST', token: 'B'.repeat(43), govde: { gunler: [] } })).s === 401 && (await hApi(H, '/api/ulke/portal/randevu-istegi', { method: 'POST', govde: { gunler: [] } })).s === 401 && (await hApi(H, '/api/ulke/portal', { token })).s === 200)
  kontrol('portal: the patient\'s browser made no request to any outside service and had no script error', H.disari.length === 0 && H.konsol.length === 0, [...H.disari, ...H.konsol].slice(0, 3).join(' | '))
  // (the patient stays signed in: step 5 withdraws the access and looks at this page again)
  portalOturumu = { H, pin: erisim.pin, PM, token }
}

// ───────────────────────── 4c. the intake form (where the pack has one) ─────────────────────────
// NOTYA-ULKE-INTAKE-01. The patient of step 2 is signed in on their own phone (step 4b) and holds a link the doctor
// cannot be shown again. Every sentence expected here is the pack's; every question is whatever the pack's set holds.
if (P.form && portalOturumu) {
  const p = A
  const F = P.form, HF = F.hekim, PF = F.hasta
  const { H, token, pin } = portalOturumu
  const KART = '[data-alan=hasta-formu-karti]'
  // Every answer typed here carries this mark: the stand-in model reports whether it was ever given one.
  const ISARETLI = 'QA-FORM-ANSWER'
  const doldur = (m, ...d) => (d.length === 1 ? m.replace('%', () => String(d[0])) : m.replace(/%(\d)/g, (h, n) => String(d[Number(n) - 1] ?? h)))
  const hApi = (pg, rota, s = {}) => pg.evaluate(async (u, s) => {
    const r = await fetch(u, { method: s.method || 'GET', credentials: 'same-origin', headers: { ...(s.ozet ? { 'x-notya-portal-baglanti': s.ozet } : {}), ...(s.govde ? { 'Content-Type': 'application/json', 'x-notya-portal': '1' } : {}) }, body: s.govde ? JSON.stringify(s.govde) : undefined })
    const t = await r.text(); let j = null; try { j = JSON.parse(t) } catch { /* not json */ }
    return { s: r.status, t: t.slice(0, 300), j }
  }, adres(rota), { ...s, ozet: s.token ? ozetle(s.token) : '' })
  const formlar = () => tabloOku('ulke_hasta_formlari')
  /** The patient's page after a reload: the session stands, or the PIN is asked again — either way the page with its form card. */
  const sayfayaDon = async () => {
    await H.reload({ waitUntil: 'networkidle0' })
    await H.waitForSelector('[data-alan=portal-form-karti], #uzp-pin', { timeout: 30000 })
    if (await H.$('#uzp-pin')) { await bekle(2200); await yazDeger(H, '#uzp-pin', pin); await H.click('[data-eylem=portal-giris]'); await H.waitForSelector('[data-alan=portal-form-karti]', { timeout: 30000 }) }
  }
  // The walk-through's patient was born on 2021-03-07: the form is the guardian's wherever the pack's guardian age is above theirs.
  const yas = Math.floor((Date.now() - Date.parse('2021-03-07T00:00:00Z')) / 31557600000)
  const veli = F.veliYasi != null && yas < F.veliYasi

  // asked from the patient's file
  await git(p, `/patient?id=${hastaA}`)
  await p.waitForSelector(`${KART} [data-eylem=form-iste]`, { timeout: 60000 })
  kontrol('intake: the patient\'s file has the card, in the pack\'s words, and no form was asked for yet', (await metin(p, `${KART} h2`)) === HF.baslik && (await metin(p, `${KART} [data-alan=form-durumu]`)) === HF.durumYok && (await formlar()).length === 0)
  const erisimOnce = JSON.stringify(await tabloOku('ulke_portal_erisimleri'))
  await p.click(`${KART} [data-eylem=form-iste]`)
  await p.waitForSelector(`${KART} [data-alan=form-davet-metni]`, { timeout: 30000 })
  const davet = await p.$eval(`${KART} [data-alan=form-davet-metni]`, (e) => ({ metin: e.value, dil: e.getAttribute('data-dil') }))
  const hekimAd = (await api(p, '/api/ulke/hesap')).j?.ad ?? ''
  const satir = (await formlar())[0]
  kontrol(`intake: ASKED — one form with this country, this account and this patient, for the account's role, stamped with the pack's question set, addressed ${veli ? 'to a guardian (the pack\'s guardian age)' : 'to the patient'}; no answers yet; the patient's link was not touched`, (await formlar()).length === 1 && satir.ulke === P.kod && satir.doctor_id === HESAP_A && satir.patient_id === hastaA && satir.rol === (P.ilkRol?.anahtar ?? null) && satir.soru_surumu === F.surum && satir.veli === veli && satir.durum === 'bekliyor' && satir.cevaplar_encrypted === null && JSON.stringify(await tabloOku('ulke_portal_erisimleri')) === erisimOnce, JSON.stringify(satir))
  kontrol('intake: THE INVITATION is the pack\'s sentence in the patient\'s form — without a link, because the patient holds one that cannot be shown again, and the card says so; no PIN anywhere', davet.dil === P.portal.hastaBicimi && davet.metin === (hekimAd ? doldur(F.davet.baglantisiz, hekimAd) : F.davet.baglantisizAdsiz) && (await metin(p, `${KART} [data-alan=form-baglanti-var]`)) === HF.baglantiVar && !(await p.$(`${KART} [data-alan=portal-pin]`)) && !(await p.$(`${KART} [data-alan=portal-baglanti]`)), davet.metin)
  await p.click(`${KART} [data-eylem=yeni-baglanti]`)
  await p.waitForSelector('[data-alan=yeni-baglanti-onayi]', { timeout: 15000 })
  kontrol('intake: "a new link" first says, in the pack\'s words, what it does to the link the patient holds — and does nothing until confirmed', (await metin(p, '[data-alan=yeni-baglanti-onayi] [role=alert]')) === HF.yeniBaglantiUyari && JSON.stringify(await tabloOku('ulke_portal_erisimleri')) === erisimOnce)
  await p.click('[data-eylem=yeni-baglanti-vazgec]')
  await p.waitForFunction(() => !document.querySelector('[data-alan=yeni-baglanti-onayi]'), { timeout: 15000 })
  await tara(p, 'patient file with the intake card')
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-intake-asked.png`), fullPage: true })

  // the patient's own page
  await sayfayaDon()
  kontrol('intake: the patient\'s page shows the card in the pack\'s words for this reader', (await metin(H, '[data-alan=portal-form-karti] h2')) === PF.bekliyorBaslik && (await metin(H, '[data-alan=portal-form-karti]')).includes(veli ? PF.veliAciklama : PF.bekliyorAciklama) && (await metin(H, '[data-eylem=form-ac]')) === PF.baslat)
  const gelen = await hApi(H, '/api/ulke/portal/form', { token })
  const bolumler = gelen.j?.form?.bolumler ?? []
  const anahtarlar = bolumler.flatMap((b) => b.sorular.map((q) => q.anahtar))
  const rolBolumu = bolumler.find((b) => b.anahtar === 'rol')?.sorular.map((q) => q.anahtar) ?? []
  kontrol(`intake: what the browser is sent is the core questions and the questions of the account's own role (${rolBolumu.length}) — not one key of any other role's set (${F.digerRoller.length} keys looked for)`, gelen.s === 200 && anahtarlar.length > 0 && anahtarlar.every((k) => F.cekirdek.includes(k) || F.ilkRol.includes(k)) && rolBolumu.every((k) => F.ilkRol.includes(k)) && (F.ilkRol.length === 0 || (rolBolumu.length > 0 && bolumler.at(-1).anahtar === 'rol')) && F.digerRoller.every((k) => !JSON.stringify(gelen.j).includes(`"${k}"`)), anahtarlar.join())
  await H.click('[data-eylem=form-ac]')
  await H.waitForSelector('[data-alan=hasta-formu][data-bolum=riza]', { timeout: 30000 })
  kontrol('intake: consent comes first, in the pack\'s sentence for this reader', (await metin(H, '[data-alan=form-riza]')) === (veli ? F.riza.veliMetni : F.riza.metin), await metin(H, '[data-alan=form-riza]'))
  await H.click('[data-eylem=form-baslat]')
  await H.waitForSelector('[data-alan=hasta-formu] [role=alert]', { timeout: 15000 })
  kontrol('intake: without consent nothing starts and nothing is stored', (await metin(H, '[data-alan=hasta-formu] [role=alert]')) === PF.rizaGerekli && (await formlar())[0].riza_at == null && (await formlar())[0].durum === 'bekliyor')
  await tara(H, 'intake: consent')
  await H.click('input[name=form-riza]')
  await H.click('[data-eylem=form-baslat]')
  // every part in turn: the questions the server sent are the questions drawn; required ones are answered, one line of text is typed, every number is given
  const gorulen = []
  const birimler = []
  let yazildi = false
  for (let i = 0; i < bolumler.length; i++) {
    const b = bolumler[i]
    await H.waitForSelector(`[data-alan=hasta-formu][data-bolum=${b.anahtar}]`, { timeout: 30000 })
    gorulen.push(...(await H.$$eval('[data-alan=hasta-formu] [data-soru]', (l) => l.map((x) => x.getAttribute('data-soru')))))
    for (const q of b.sorular) {
      const metinMi = q.tur === 'kisa-metin' || q.tur === 'uzun-metin'
      if (q.tur === 'sayi') {
        birimler.push([q.birim.kod, q.birim.ad, await metin(H, `[data-soru="${q.anahtar}"] [data-alan=birim]`)])
        await yazDeger(H, `#uzf-${q.anahtar}`, String(Math.min(Math.ceil(q.birim.enAz) + 1, q.birim.enCok)))
      } else if (metinMi && (q.zorunlu || !yazildi)) { await H.type(`#uzf-${q.anahtar}`, `${ISARETLI} ${q.anahtar}`); yazildi = true }
      else if (!q.zorunlu) continue
      else if (q.tur === 'tek-secim' || q.tur === 'cok-secim') await H.click(`input[name="uzf-${q.anahtar}-${q.secenekler[0].anahtar}"]`)
      else if (q.tur === 'evet-hayir') await H.click(`input[name="uzf-${q.anahtar}-hayir"]`)
      else if (q.tur === 'tarih') await yazDeger(H, `#uzf-${q.anahtar}`, '2020-01-01')
    }
    await tara(H, `intake: part ${i + 1} of ${bolumler.length} of the form`)
    if (i === 0) {
      await H.waitForSelector('[data-alan=hasta-formu][data-kayit=kaydedildi]', { timeout: 30000 }).catch(() => null)
      const ara = (await formlar())[0]
      kontrol('intake: consent is stored with the pack\'s stamp and the form it was read in before any question; answers are SAVED AS THEY GO, as a draft', ara.durum === 'taslak' && !!ara.riza_at && ara.riza_surumu === F.rizaSurumu && ara.dil === P.portal.hastaBicimi && (await metin(H, '[data-alan=hasta-formu] .uza-ust-yazi')) === `${PF.bekliyorBaslik} · ${doldur(PF.bolum, 1, bolumler.length)}`, JSON.stringify({ d: ara.durum, r: ara.riza_surumu, dil: ara.dil }))
    }
    if (i < bolumler.length - 1) await H.click('[data-eylem=form-ileri]')
  }
  kontrol('intake: every question the server sent was drawn, in order, and no other', JSON.stringify(gorulen) === JSON.stringify(anahtarlar), `${gorulen.length} drawn, ${anahtarlar.length} sent`)
  kontrol(`intake: a measure is asked in the PACK's unit, named as the pack names it beside the field (${birimler.filter((x) => x[0]).map((x) => x[1]).join(', ') || 'no measure in this form'})`, birimler.every(([kod, ad, cizilen]) => cizilen === ad && ad.length > 0 && (!kod || F.birim[kod] === ad)), JSON.stringify(birimler))
  await H.waitForSelector('[data-eylem=form-gonder]', { timeout: 15000 })
  const uyari = await metin(H, '[data-alan=hasta-formu]')
  await H.click('[data-eylem=form-gonder]')
  await H.waitForSelector('[data-alan=hasta-formu][data-form-durumu=gonderildi]', { timeout: 30000 })
  const sonra = (await formlar())[0]
  kontrol('intake: SUBMITTED — the patient was told beforehand that answers cannot be changed afterwards; stored as submitted, with its moment; the answers are encrypted (no answer and no question key can be read in the database)', uyari.includes(PF.gonderUyari) && (await formlar()).length === 1 && sonra.durum === 'gonderildi' && !!sonra.gonderildi_at && typeof sonra.cevaplar_encrypted === 'string' && !JSON.stringify(await formlar()).includes(ISARETLI) && anahtarlar.every((k) => !sonra.cevaplar_encrypted.includes(`"${k}"`)))
  const sonradan = await hApi(H, '/api/ulke/portal/form', { token, method: 'PUT', govde: { cevaplar: {}, riza: true } })
  kontrol('intake: READ-ONLY AFTERWARDS — the pack\'s heading and sentence, nothing to type into; a change sent later is refused by the server and the stored answers are the same bytes', (await metin(H, '[data-alan=hasta-formu] h1')) === PF.cevaplarim && (await metin(H, '[data-alan=hasta-formu]')).includes(PF.degistirilemez) && (!yazildi || (await metin(H, '[data-alan=hasta-formu]')).includes(ISARETLI)) && (await H.$$('[data-alan=hasta-formu] input, [data-alan=hasta-formu] textarea')).length === 0 && sonradan.s >= 400 && sonradan.s < 500 && (await formlar())[0].cevaplar_encrypted === sonra.cevaplar_encrypted, `${sonradan.s} ${sonradan.t}`)
  await tara(H, 'intake: the submitted form')
  await H.screenshot({ path: join(CIKTI, `genel-${P.kod}-intake-submitted.png`), fullPage: true })
  await H.click('[data-eylem=form-kapat]')
  await H.waitForSelector('[data-alan=portal-form-karti][data-form-durumu=gonderildi]', { timeout: 30000 })
  kontrol('intake: back on the patient\'s page the card says the form was sent, in the pack\'s words', (await metin(H, '[data-alan=portal-form-karti] h2')) === PF.gonderildiBaslik && (await metin(H, '[data-eylem=form-ac]')) === PF.cevaplarim)

  // the doctor: the patient's file, the visit screen — and the model
  await git(p, `/patient?id=${hastaA}`)
  await p.waitForSelector(`${KART} [data-alan=form-son] [data-alan=form-cevaplari]`, { timeout: 60000 })
  kontrol('intake: THE DOCTOR reads the answers on the patient\'s file under the pack\'s line that says whose words they are and that nobody verified them — first, before any answer — and that they are not used to write the note', (await metin(p, `${KART} [data-alan=form-beyan]`)) === (veli ? HF.veliBeyani : HF.beyan) && (await p.$eval(`${KART} [data-alan=form-cevaplari]`, (x) => !!x.firstElementChild?.querySelector('[data-alan=form-beyan]'))) && (!yazildi || (await metin(p, `${KART} [data-alan=form-son]`)).includes(ISARETLI)) && (await metin(p, `${KART} [data-alan=form-nota-girmez]`)) === HF.notaGirmez)
  await tara(p, 'patient file with the answers')
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-intake-answers.png`), fullPage: true })
  writeFileSync(GUNLUK, ''); writeFileSync(SENARYO, JSON.stringify({ stt: 'yuksek', model: 'tamam' }))
  await git(p, `/visit?hasta=${hastaA}`)
  await p.waitForSelector('[data-alan=muayene-formu] [data-alan=form-cevaplari]', { timeout: 60000 })
  kontrol('intake: THE VISIT SCREEN shows the same answers under the same line, read-only: nothing to ask for, reopen or withdraw there', (await metin(p, '[data-alan=muayene-formu] h2')) === HF.cevaplar && (await metin(p, '[data-alan=muayene-formu] [data-alan=form-beyan]')) === (veli ? HF.veliBeyani : HF.beyan) && (await metin(p, '[data-alan=muayene-formu] [data-alan=form-nota-girmez]')) === HF.notaGirmez && (await p.$$('[data-alan=muayene-formu] button, [data-alan=muayene-formu] input')).length === 0)
  await tara(p, 'visit screen with the answers')
  await p.click('input[name=riza]')
  await p.waitForFunction(() => !document.querySelector('.uza-form button.uza-dugme').disabled)
  await p.click('.uza-form button.uza-dugme')
  await p.waitForSelector('.uza-sure', { timeout: 20000 })
  await bekle(2600)
  await p.click('.uza-kayit .uza-dugme')
  await p.waitForFunction(() => new URLSearchParams(location.search).has('not'), { timeout: 120000 })
  await p.waitForSelector('#uza-not-s', { timeout: 60000 })
  const mdl = cagrilar().filter((x) => x.tur === 'model')
  kontrol('intake: NOT FED TO THE MODEL — a visit of this patient was recorded and its note written, and nothing typed into the form was in what the model was given', yazildi && mdl.length === 1 && mdl[0].formCevabiVar === false, JSON.stringify(mdl.map((x) => [x.is, x.formCevabiVar])))

  // reopened by the doctor
  const ac = await api(p, '/api/ulke/hasta-formu', { method: 'PATCH', govde: { formId: sonra.id, islem: 'yeniden-ac' } })
  await sayfayaDon()
  const acik = (await formlar())[0]
  kontrol('intake: REOPENED by the doctor — the same form is open again with its answers kept and the moment recorded; the patient\'s page says so in the pack\'s words and offers to continue', ac.s === 200 && (await formlar()).length === 1 && acik.durum === 'taslak' && !!acik.yeniden_acildi_at && acik.cevaplar_encrypted === sonra.cevaplar_encrypted && (await metin(H, '[data-alan=portal-form-karti]')).includes(PF.yenidenAcildi) && (await metin(H, '[data-eylem=form-ac]')) === PF.devam, `${ac.s} ${ac.t}`)
  await tara(H, 'intake: the patient\'s page with the reopened form')
  portalOturumu.formId = sonra.id
}

// ───────────────────────── 4d. the tools area (NOTYA-ULKE-ARACLAR-01) ─────────────────────────
let aracKaydiA = ''
if (P.araclar) {
  const T = P.araclar, AM = T.m, p = A
  const kutular = () => p.$$eval('[data-arac]', (l) => l.map((x) => x.getAttribute('data-arac')))
  const kayitlar = () => tabloOku('ulke_arac_kayitlari')
  const kayitBekle = async (n) => { for (let i = 0; i < 100 && (await kayitlar()).length < n; i++) await bekle(150); return kayitlar() }
  await git(p, '/tools')
  await p.waitForSelector('.uza-kart h1')
  kontrol(`tools: the grid of the account's role shows exactly the pack's tools for it (${T.ilkRolKutulari.length})`, JSON.stringify(await kutular()) === JSON.stringify(T.ilkRolKutulari) && (await metin(p, '.uza-kart h1')) === AM.izgara.baslik, JSON.stringify(await kutular()))
  await tara(p, 'tools (the grid)')
  if (T.ornek) {
    const O = T.ornek
    const govdeK = { hastaId: hastaA, arac: O.anahtar, ham: Object.fromEntries(O.ham.map((h) => [h.anahtar, h.deger])) }
    if (!T.ilkRolKutulari.includes(O.anahtar)) {
      // THE ROLE GATE, in the browser and on the server: a tool of another role does not open from its address, and its result is not kept.
      await git(p, `/tools?arac=${O.anahtar}`)
      await p.waitForSelector('[role=alert]', { timeout: 30000 })
      const ret = await api(p, '/api/ulke/arac-kaydi', { method: 'POST', govde: govdeK })
      kontrol('tools: a tool of ANOTHER role does not open from its address (the pack\'s sentence, and the account\'s own grid), and the server keeps no result of it', (await metin(p, '[role=alert]')) === AM.arac.yok && JSON.stringify(await kutular()) === JSON.stringify(T.ilkRolKutulari) && ret.s === 404 && ret.j?.code === 'ARAC_YOK' && (await kayitlar()).length === 0, `${ret.s} ${ret.t}`)
      const rol = await api(p, '/api/ulke/rol', { method: 'POST', govde: { rol: O.rol } })
      kontrol('tools: the account changes to the role that has the tool', rol.s === 200, `${rol.s} ${rol.t}`)
    }
    // from the patient's file: the card, and the tools FOR this patient
    await git(p, `/patient?id=${hastaA}`)
    await p.waitForSelector('[data-alan=hasta-arac-kayitlari] [data-eylem=hasta-icin-araclar]', { timeout: 60000 })
    kontrol('tools: the patient\'s file has the card of kept results, empty, with the pack\'s words', (await metin(p, '[data-alan=hasta-arac-kayitlari]')).includes(AM.kayit.dosyaBaslik) && !(await p.$('[data-kayit]')))
    await p.click('[data-eylem=hasta-icin-araclar]')
    await p.waitForSelector('[data-alan=arac-hastasi]', { timeout: 60000 })
    const baglantilar = await p.$$eval('[data-arac]', (l) => l.map((x) => x.getAttribute('href')))
    kontrol('tools: opened from the file, the grid says for whom and every tile carries the patient', JSON.stringify(await kutular()) === JSON.stringify(T.ornekRolKutulari) && (await metin(p, '[data-alan=arac-hastasi]')).includes(HASTA_ADI) && baglantilar.every((h) => h.includes(`hasta=${hastaA}`)), baglantilar.join(' '))
    await p.click(`[data-arac="${O.anahtar}"]`)
    await p.waitForSelector('[data-bolum=girdiler]', { timeout: 60000 })
    kontrol('tools: the tool opens under its own name; without a result nothing can be kept', (await metin(p, 'h1')) === O.ad && (await p.$eval('[data-eylem=arac-kaydet]', (e) => e.disabled)) === true && !(await p.$('[data-eylem=kopyala]')))
    for (const h of O.ham) {
      if (h.tur === 'isaret') { await p.waitForSelector(`[data-alan="${h.anahtar}"] input`); await p.click(`[data-alan="${h.anahtar}"] input`) }
      else if (h.tur === 'secim' || h.tur === 'puan') { await p.waitForSelector(`input[name="uza-arac-${h.anahtar}"][value="${h.deger}"]`); await p.click(`input[name="uza-arac-${h.anahtar}"][value="${h.deger}"]`) }
      else { await p.waitForSelector(`#uza-arac-${h.anahtar}`); await yazDeger(p, `#uza-arac-${h.anahtar}`, h.deger) }
    }
    await p.waitForSelector('[data-eylem=kopyala]', { timeout: 30000 })
    kontrol('tools: filled in, the tool shows a result; the follow-up day is EMPTY (the application proposes none); nothing has been stored yet', (await p.$eval('#uza-arac-takip', (e) => e.value)) === '' && (await p.$eval('[data-eylem=arac-kaydet]', (e) => e.disabled)) === false && (await metin(p, '[data-bolum=kayit]')).includes(HASTA_ADI) && (await kayitlar()).length === 0)
    await tara(p, 'tools (one tool, filled in, for a patient)')
    // kept without a follow-up day
    await p.click('[data-eylem=arac-kaydet]')
    let satirlar = await kayitBekle(1)
    await p.waitForSelector('[data-bolum=kayit] [role=status]', { timeout: 30000 })
    const ham1 = JSON.stringify(satirlar)
    kontrol('tools: KEPT — one row with this country, this account, this patient and the tool; the content is one encrypted value (no field, no result readable); no follow-up day', satirlar.length === 1 && satirlar[0].ulke === P.kod && satirlar[0].doctor_id === HESAP_A && satirlar[0].patient_id === hastaA && satirlar[0].arac === O.anahtar && satirlar[0].takip_tarihi === null && !ham1.includes('sayilar') && !ham1.includes('tamam') && (await metin(p, '[data-bolum=kayit] [role=status]')) === AM.kayit.kaydedildi, ham1.slice(0, 200))
    // kept again, with the follow-up day the doctor types: today, in the country's own clock
    await yazDeger(p, '#uza-arac-takip', T.bugun)
    await p.waitForFunction(() => !document.querySelector('[data-eylem=arac-kaydet]').disabled, { timeout: 30000 })
    await p.click('[data-eylem=arac-kaydet]')
    satirlar = await kayitBekle(2)
    const takipli = satirlar.find((x) => x.takip_tarihi)
    aracKaydiA = takipli?.id ?? ''
    kontrol('tools: kept with the follow-up day the doctor typed, exactly as typed', satirlar.length === 2 && takipli?.takip_tarihi === T.bugun && takipli?.kapandi_at == null, JSON.stringify(satirlar.map((x) => x.takip_tarihi)))
    const gecmis = await api(p, '/api/ulke/arac-kaydi', { method: 'POST', govde: { ...govdeK, takipTarihi: '2000-01-01' } })
    const bos = await api(p, '/api/ulke/arac-kaydi', { method: 'POST', govde: { ...govdeK, ham: {}, sonuc: { tamam: true, sayilar: [], bant: null, uyarilar: [], tarihler: [] } } })
    kontrol('tools: the server refuses a follow-up day in the past, and an empty form even when a "result" is sent with it; nothing was written', gecmis.s === 422 && gecmis.j?.code === 'TAKIP' && bos.s === 422 && bos.j?.code === 'EKSIK' && (await kayitlar()).length === 2, `${gecmis.s} ${gecmis.t} | ${bos.s} ${bos.t}`)
    // the patient's file lists both, each with its summary
    await git(p, `/patient?id=${hastaA}`)
    await p.waitForSelector('[data-kayit]', { timeout: 60000 })
    const dosya = await p.$$eval('[data-kayit]', (l) => l.map((x) => ({ arac: x.getAttribute('data-arac'), ozet: x.querySelector('pre')?.textContent ?? '', takip: !!x.querySelector('[data-takip-durum=acik]') })))
    kontrol('tools: the patient\'s file lists both kept results under the tool\'s name, each with its summary; one shows its follow-up', dosya.length === 2 && dosya.every((x) => x.arac === O.anahtar && x.ozet.startsWith(O.ad)) && dosya.filter((x) => x.takip).length === 1, JSON.stringify(dosya).slice(0, 300))
    await tara(p, 'patient file (with kept tool results)')
    if (T.panel) {
      await git(p, `/tools?arac=${T.panel}`)
      await p.waitForSelector('[data-takip]', { timeout: 60000 })
      const satir = await p.$$eval('li[data-takip]', (l) => l.map((x) => ({ id: x.getAttribute('data-takip'), metin: x.innerText, bugun: !!x.querySelector('[data-takip-durum=bugun]'), gecikti: !!x.querySelector('[data-takip-durum=gecikti]') })))
      kontrol('tools: THE FOLLOW-UP LIST shows the one open follow-up — the patient, the tool, due today, not overdue', satir.length === 1 && satir[0].id === aracKaydiA && satir[0].metin.includes(HASTA_ADI) && satir[0].metin.includes(O.ad) && satir[0].bugun && !satir[0].gecikti, JSON.stringify(satir).slice(0, 300))
      await tara(p, 'tools (the follow-up list)')
      await p.click('[data-eylem=takip-kapat]')
      await p.waitForSelector('[data-takip=bos]', { timeout: 30000 })
      const kapali = (await kayitlar()).find((x) => x.id === aracKaydiA)
      const yine = await api(p, '/api/ulke/arac-kaydi', { method: 'PATCH', govde: { kayitId: aracKaydiA, islem: 'kapat' } })
      kontrol('tools: marked as done ONCE — it leaves the list, the row keeps its day and its content, and a second "done" is refused', !!kapali?.kapandi_at && kapali.takip_tarihi === T.bugun && (await metin(p, '[data-takip=bos]')) === AM.takip.bos && yine.s === 409 && (await kayitlar()).length === 2, `${yine.s} ${yine.t}`)
    }
    if (!T.ilkRolKutulari.includes(O.anahtar)) {
      const geri = await api(p, '/api/ulke/rol', { method: 'POST', govde: { rol: P.ilkRol.anahtar } })
      await git(p, `/patient?id=${hastaA}`)
      await p.waitForSelector('[data-kayit]', { timeout: 60000 })
      kontrol('tools: back in the first role, the kept results stay in the patient\'s file under the tool\'s name (a file does not lose its history when the role changes)', geri.s === 200 && (await p.$$eval('[data-kayit] pre', (l) => l.length)) === 2)
    }
  }
}

// ───────────────────────── 5. a second account sees none of it; the shared database holds only this country's rows ─────────────────────────
{
  const p = await sayfaAc(TEL)
  await git(p, '/login')
  await giris(p, 'qa-ru@notya.test', 'sinov-parol-2')
  await sorulariGec(p, P.roller.at(-1) ?? '')
  await git(p, '/patients')
  await p.waitForSelector('.uza-liste, .uza-bos')
  kontrol('account B (a phone-sized screen): sees no patient of account A', !(await govde(p)).includes('QA-PATIENT'))
  const r = await api(p, `/api/ulke/hasta?id=${hastaA}`)
  kontrol('account B asks the API for account A\'s patient: not found', r.s === 404 && r.t === '{"code":"NOT_FOUND"}', `${r.s} ${r.t}`)
  const v = await api(p, '/api/ulke/muayene', { method: 'POST', govde: { yol: `${P.kod}/${HESAP_B}/none.webm`, hastaId: hastaA, sablon: P.genelSablon, riza: true } })
  kontrol('account B cannot record a visit for account A\'s patient', v.s >= 400, `${v.s} ${v.t}`)
  const jetonsuz = await api(p, `/api/ulke/hasta?id=${hastaA}`, { jeton: 'none' })
  kontrol('without a valid session the API says "no session", with a code and no sentence', jetonsuz.s === 401 && jetonsuz.t === '{"code":"OTURUM_YOK"}', `${jetonsuz.s} ${jetonsuz.t}`)
  await tara(p, 'patients (account B)')
  if (P.araclar) {
    // NOTYA-ULKE-ARACLAR-01 — the second account and the first account's patient and kept results.
    const yok = '30000000-0000-4000-8000-00000000dead'
    const once = JSON.stringify(await tabloOku('ulke_arac_kayitlari'))
    const cevaplar = [
      await api(p, `/api/ulke/arac-kaydi?hasta=${hastaA}`),
      await api(p, '/api/ulke/arac-kaydi', { method: 'POST', govde: { hastaId: hastaA, arac: P.araclar.ornek?.anahtar ?? 'x', ham: Object.fromEntries((P.araclar.ornek?.ham ?? []).map((h) => [h.anahtar, h.deger])) } }),
      ...(aracKaydiA ? [await api(p, '/api/ulke/arac-kaydi', { method: 'PATCH', govde: { kayitId: aracKaydiA, islem: 'kapat' } })] : []),
    ]
    const olmayan = await api(p, `/api/ulke/arac-kaydi?hasta=${yok}`)
    const liste = await api(p, '/api/ulke/arac-kaydi')
    kontrol('tools: account B and account A\'s patient — reading the kept results, keeping one and closing a follow-up each answer exactly like "does not exist"; B\'s own follow-up list is empty; nothing changed', cevaplar.every((r) => r.s === 404 && r.t === olmayan.t) && liste.s === 200 && Array.isArray(liste.j?.takipler) && liste.j.takipler.length === 0 && JSON.stringify(await tabloOku('ulke_arac_kayitlari')) === once, cevaplar.map((r) => `${r.s} ${r.t}`).join(' | '))
  }
  if (P.portal) {
    // NOTYA-ULKE-PORTAL-01 — the second account and the first account's patient: everything answers like "does not exist".
    const yok = '30000000-0000-4000-8000-00000000dead'
    const cevaplar = [
      await api(p, `/api/ulke/hasta-portali?hasta=${hastaA}`), await api(p, '/api/ulke/hasta-portali', { method: 'POST', govde: { hastaId: hastaA } }), await api(p, '/api/ulke/hasta-portali', { method: 'DELETE', govde: { hastaId: hastaA } }),
      await api(p, `/api/ulke/hasta-portali/ozet?not=${notA}`), await api(p, '/api/ulke/hasta-portali/ozet', { method: 'PUT', govde: { notId: notA, paylas: true } }),
      ...(portalIstegi ? [await api(p, '/api/ulke/hasta-portali/istekler', { method: 'PATCH', govde: { id: portalIstegi, red: true } })] : []),
    ]
    const olmayan = await api(p, `/api/ulke/hasta-portali?hasta=${yok}`)
    kontrol('portal: account B and account A\'s patient — access, summary and request each answer exactly like "does not exist", and nothing changed', cevaplar.every((r) => r.s === 404 && r.t === olmayan.t) && (await tabloOku('ulke_portal_erisimleri')).filter((e) => !e.iptal_at).length === 1 && (await tabloOku('ulke_hasta_ozetleri')).every((o) => !o.paylasildi_at), cevaplar.map((r) => r.s).join(' '))
    if (P.form) {
      // NOTYA-ULKE-INTAKE-01 — the second account and the first account's patient and form.
      const once = JSON.stringify(await tabloOku('ulke_hasta_formlari'))
      const formId = portalOturumu.formId
      const f = [
        await api(p, `/api/ulke/hasta-formu?hasta=${hastaA}`), await api(p, '/api/ulke/hasta-formu', { method: 'POST', govde: { hastaId: hastaA } }), await api(p, '/api/ulke/hasta-formu', { method: 'POST', govde: { hastaId: hastaA, yeniBaglanti: true } }),
        await api(p, '/api/ulke/hasta-formu', { method: 'PATCH', govde: { formId, islem: 'yeniden-ac' } }), await api(p, '/api/ulke/hasta-formu', { method: 'PATCH', govde: { formId, islem: 'geri-cek' } }),
      ]
      kontrol('intake: account B and account A\'s patient — reading the forms, asking for one (with or without a new link), reopening and withdrawing each answer exactly like "does not exist", and nothing changed (forms and links)', !!formId && f.every((r) => r.s === 404 && r.t === olmayan.t) && JSON.stringify(await tabloOku('ulke_hasta_formlari')) === once && (await tabloOku('ulke_portal_erisimleri')).filter((e) => !e.iptal_at).length === 1, f.map((r) => r.s).join(' '))
      const { H, token } = portalOturumu
      const hastayla = await H.evaluate(async (u, o) => { const r = await fetch(u, { credentials: 'same-origin', headers: { 'x-notya-portal-baglanti': o } }); return r.status }, adres(`/api/ulke/hasta-formu?hasta=${hastaA}`), ozetle(token))
      const hekimle = await api(A, '/api/ulke/portal/form')
      kontrol('intake: the doctor\'s form routes never accept a patient\'s session, and the patient\'s form route never accepts a doctor\'s', hastayla === 401 && hekimle.s === 401, `${hastayla} ${hekimle.s}`)
    }
    if (P.randevu) kontrol('portal: account B\'s own list of requests is empty', JSON.stringify((await api(p, '/api/ulke/hasta-portali/istekler')).j) === '{"istekler":[]}')
    // Account A withdraws the access: the patient's open page asks for the PIN again, and the link opens nothing.
    const { H, pin, PM } = portalOturumu
    const iptal = await api(A, '/api/ulke/hasta-portali', { method: 'DELETE', govde: { hastaId: hastaA } })
    await H.reload({ waitUntil: 'networkidle0' }); await H.waitForSelector('#uzp-pin', { timeout: 30000 })
    await bekle(2200)
    await yazDeger(H, '#uzp-pin', pin); await H.click('[data-eylem=portal-giris]')
    await H.waitForSelector('[data-durum=gecersiz]', { timeout: 30000 })
    kontrol('portal: WITHDRAWN by the doctor — the patient\'s session ended at once and the link opens nothing, with the pack\'s sentence', iptal.s === 200 && (await metin(H, '[role=alert]')) === PM.giris.gecersiz && (await tabloOku('ulke_portal_oturumlari')).every((o) => !!o.kapandi_at))
    await tara(H, 'portal: a link that no longer works')
    await H.close()
  }
  await p.close()
  const tablolar = ['ulke_hastalar', 'hasta_ulke_bilgisi', 'ulke_muayeneler', 'muayene_dil_kaydi', 'ulke_notlar', 'not_dil_kaydi', 'ulke_randevulari', 'hekim_rolu', 'hekim_dil_tercihleri', 'hekim_calisma_duzeni', 'ulke_kullanim', 'ulke_kullanim_olcumu', ...(P.araclar ? ['ulke_arac_kayitlari'] : []), ...(P.portal ? ['ulke_portal_erisimleri', 'ulke_portal_oturumlari', 'ulke_portal_kayitlari', 'ulke_hasta_ozetleri', 'ulke_randevu_istekleri'] : []), ...(P.form ? ['ulke_hasta_formlari'] : [])]
  const yabanciSatir = []
  let toplam = 0
  for (const ad of tablolar) for (const s of await tabloOku(ad)) { toplam++; if (s.ulke !== P.kod) yabanciSatir.push(`${ad}:${s.ulke}`) }
  kontrol(`every row the walk-through wrote carries this country's code (${toplam} rows in ${tablolar.length} tables)`, toplam > 5 && yabanciSatir.length === 0, yabanciSatir.join(' '))
  const hesaplar = await tabloOku('ulke_hesaplari')
  kontrol('the other country\'s account row in the shared table was not touched', hesaplar.some((h) => h.ulke !== P.kod) && hesaplar.filter((h) => h.ulke === P.kod).length >= 2)
}

await tarayici.close()
const kalan = sonuc.filter((x) => !x.tamam)
console.log(`\n${sonuc.length - kalan.length}/${sonuc.length} checks passed — country "${P.kod}"`)
if (kalan.length) { console.log('FAILED:'); for (const x of kalan) console.log(`  - ${x.ad}${x.ayrinti ? ' — ' + String(x.ayrinti).slice(0, 300) : ''}`) }
process.exit(kalan.length ? 1 : 0)
