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
 * NOTYA-ULKE-MESAJ-01 — where the pack has them, step 4e walks "my templates" (created, edited, deleted softly; no
 * patient in a row; inserted into a message by the doctor's click) and messages between the doctor and the patient
 * (only the doctor opens a conversation; the notice that the page is not for emergencies, shown before anybody wrote;
 * unread marks on both sides; closing; a closed conversation takes no message); step 5 walks consultation between the
 * two accounts (a code and no directory, the consent tick, the read-only copy, what the consulted account can NOT
 * open, one answer, closing and the period after it) and the second account against the first one's messages and
 * templates. Nothing in these steps is asked of the model and nothing is sent to anybody: both are checked.
 *
 * NOTYA-ULKE-KLINIK-01 — where the pack has clinic accounts, step 6 walks them with FIVE MORE ACCOUNTS in TWO CLINICS,
 * each in a browser of its own: a clinic created, invitation codes (shown once, only a hash kept), a doctor, an allied
 * professional and a front-desk member joining — the last without choosing a role; that a position alone opens no
 * patient; permissions given one at a time on the doctor's own screen, with the pack's plain sentence about the link
 * and PIN before the portal capability; the front desk at work and the exact fields it is answered; a share and
 * cover, both read-only; the record the doctor reads and nobody else; the other clinic, which sees nothing; and a
 * permission ending at once when it is withdrawn, when a position changes and when a member is removed.
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
/**
 * NOTYA-ULKE-DENETIM-01b — the kit's own date and time fields (components/ulke/girdi/). `sel` selects the GROUP (its
 * id or its data-alan); each part is typed into its own small field, in whatever order the pack draws them.
 * A day is handed in as YYYY-MM-DD and a time of day as 24-hour HH:MM: on a 12-hour pack the half of the day is chosen.
 */
const yazGunAlani = async (p, sel, gun) => { const [y, a, g] = gun.split('-'); for (const [parca, v] of [['DD', g], ['MM', a], ['YYYY', y]]) await yazDeger(p, `${sel} [data-parca=${parca}] input`, v) }
const yazSaatAlani = async (p, sel, saat) => {
  const [s, d] = saat.split(':')
  const onIki = !!(await p.$(`${sel} [data-parca=yari] select`))
  await yazDeger(p, `${sel} [data-parca=saat] input`, onIki ? String(Number(s) % 12 || 12) : s)
  await yazDeger(p, `${sel} [data-parca=dakika] input`, d)
  if (onIki) await p.select(`${sel} [data-parca=yari] select`, Number(s) < 12 ? 'oo' : 'os')
}
/** What a date or time field of the kit holds now: the ISO day / the 24-hour time, or '' while it holds none. */
const alanDegeri = (p, sel) => p.$eval(sel, (e) => e.getAttribute('data-deger') ?? '')
/** How a date field is drawn: the order of its parts, and whether the page holds any browser date or time field. */
const tarihAlaniDuzeni = (p, sel) => p.evaluate((s) => ({
  sira: [...document.querySelectorAll(`${s} [data-parca]`)].map((e) => e.getAttribute('data-parca')).join(' '),
  etiketler: [...document.querySelectorAll(`${s} [data-parca] label`)].map((e) => e.innerText.trim()),
  tarayiciAlani: !!document.querySelector('input[type=date], input[type=time], input[type=datetime-local], input[type=month], input[type=week]'),
}), sel)
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
  // NOTYA-ULKE-DENETIM-01b — the date of birth is typed in the pack's own order, in the kit's own field: no browser date
  // field stands on the page, whatever language this browser is set to.
  const dogumAlani = await tarihAlaniDuzeni(p, '#uza-h-dogum')
  kontrol(`new patient: the date of birth is typed as ${P.tarihDeseni} — three labelled parts in the pack's order, and no browser date field on the page`, dogumAlani.sira === P.tarihDeseni.match(/DD|MM|YYYY/g).join(' ') && dogumAlani.etiketler.length === 3 && dogumAlani.etiketler.every(Boolean) && !dogumAlani.tarayiciAlani, JSON.stringify(dogumAlani))
  // a day that does not exist is said at once, in the pack's sentence, and is not a date of birth
  await yazGunAlani(p, '#uza-h-dogum', '2021-02-30')
  kontrol('new patient: 30 February is refused in the field itself', (await p.$eval('#uza-h-dogum', (e) => e.getAttribute('data-durum'))) === 'gecersiz' && !!(await p.$('#uza-h-dogum [role=alert]')) && (await alanDegeri(p, '#uza-h-dogum')) === '')
  await yazGunAlani(p, '#uza-h-dogum', '2021-03-07')
  kontrol('new patient: 7 March 2021 typed part by part is the day 2021-03-07, and reads on the screen as the pack writes it', (await alanDegeri(p, '#uza-h-dogum')) === '2021-03-07' && !(await p.$('#uza-h-dogum [role=alert]')) && (await p.$$eval('#uza-h-dogum [data-parca] input', (l) => l.map((e) => e.value))).join(P.tarihDeseni.replace(/DD|MM|YYYY/g, '')[0]) === P.tarihDeseni.replace('DD', '07').replace('MM', '03').replace('YYYY', '2021'))
  await p.type('#uza-h-tel', P.telefonOrnek)
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-new-patient.png`), fullPage: true })
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
  // a 12-hour time is written with the day period as the pack's locale writes it: "2:30 PM", "2:30 pm", "2:30 p.m."
  const saat = P.saatBicimi === 12 ? /2:30\s?p\.?m\.?/i.test(g) && !g.includes('14:30') : g.includes('14:30')
  kontrol(`calendar: the appointment is shown, and its time is written the pack's way (${P.saatBicimi}-hour)`, saat, g.match(/\d{1,2}:30[^\n]{0,6}/)?.[0] ?? '')
  await tara(p, 'calendar')
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-calendar.png`) })
  // NOTYA-ULKE-DENETIM-01b — THE BOOKING FORM (opened, typed into, never sent): the day in the pack's order and the time
  // on the pack's clock, in the kit's own fields. On a 12-hour clock the half of the day is an explicit choice.
  const obur = new Date(Date.parse(`${buGun}T12:00:00Z`) + 2 * 86400000).toISOString().slice(0, 10)
  await git(p, `/calendar?yeni=1&hasta=${hastaA}&gun=${obur}`)
  await p.waitForSelector('#uza-rf-gun', { timeout: 60000 })
  const gunAlani = await tarihAlaniDuzeni(p, '#uza-rf-gun')
  const yariVar = !!(await p.$('#uza-rf-saat [data-parca=yari] select'))
  kontrol(`booking form: the day stands in the pack's order (${P.tarihDeseni}) and is the day asked for; the time field is the pack's ${P.saatBicimi}-hour clock; no browser date or time field`, gunAlani.sira === P.tarihDeseni.match(/DD|MM|YYYY/g).join(' ') && (await alanDegeri(p, '#uza-rf-gun')) === obur && yariVar === (P.saatBicimi === 12) && !gunAlani.tarayiciAlani && (await alanDegeri(p, '#uza-rf-saat')) === '', JSON.stringify({ ...gunAlani, yariVar }))
  const saatHali = async () => ({ deger: await alanDegeri(p, '#uza-rf-saat'), saat: await p.$eval('#uza-rf-saat [data-parca=saat] input', (e) => e.value), yari: yariVar ? await p.$eval('#uza-rf-saat [data-parca=yari] select', (e) => e.value) : '' })
  if (yariVar) {
    // hour and minute alone are not a time on a 12-hour clock: the half of the day has to be said
    await yazDeger(p, '#uza-rf-saat [data-parca=saat] input', '2'); await yazDeger(p, '#uza-rf-saat [data-parca=dakika] input', '30')
    const yarim = await saatHali()
    await yazSaatAlani(p, '#uza-rf-saat', '14:30'); const ogledenSonra = await saatHali()
    await yazSaatAlani(p, '#uza-rf-saat', '00:00'); const geceYarisi = await saatHali()
    await yazSaatAlani(p, '#uza-rf-saat', '12:00'); const ogle = await saatHali()
    kontrol('booking form, 12-hour clock: no time until the half of the day is chosen; 2:30 PM is 14:30; 12:00 AM is midnight (00:00) and 12:00 PM is noon (12:00)', yarim.deger === '' && yarim.yari === '' && JSON.stringify(ogledenSonra) === JSON.stringify({ deger: '14:30', saat: '2', yari: 'os' }) && JSON.stringify(geceYarisi) === JSON.stringify({ deger: '00:00', saat: '12', yari: 'oo' }) && JSON.stringify(ogle) === JSON.stringify({ deger: '12:00', saat: '12', yari: 'os' }), JSON.stringify({ yarim, ogledenSonra, geceYarisi, ogle }))
  } else {
    await yazSaatAlani(p, '#uza-rf-saat', '14:30'); const ogledenSonra = await saatHali()
    await yazDeger(p, '#uza-rf-saat [data-parca=saat] input', '24'); const yirmiDort = await p.$eval('#uza-rf-saat', (e) => e.getAttribute('data-durum'))
    kontrol('booking form, 24-hour clock: 14:30 is typed as 14 and 30, no half of the day is asked, and there is no hour 24', JSON.stringify(ogledenSonra) === JSON.stringify({ deger: '14:30', saat: '14', yari: '' }) && yirmiDort === 'gecersiz', JSON.stringify({ ogledenSonra, yirmiDort }))
  }
  await yazSaatAlani(p, '#uza-rf-saat', '14:30')
  await tara(p, 'booking form')
  await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-booking-form.png`), fullPage: true })
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
  const saatYaz = (saat) => { if (P.saatBicimi === 24) return saat; const [s, d] = saat.split(':').map(Number); return new RegExp(`^${s % 12 || 12}:${String(d).padStart(2, '0')}\\s?${s < 12 ? 'a' : 'p'}\\.?m\\.?$`, 'i') }
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
      else if (q.tur === 'tarih') await yazGunAlani(H, `#uzf-${q.anahtar}`, '2020-01-01')
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
      else if (h.tur === 'tarih') { await p.waitForSelector(`#uza-arac-${h.anahtar}`); await yazGunAlani(p, `#uza-arac-${h.anahtar}`, h.deger) }
      else { await p.waitForSelector(`#uza-arac-${h.anahtar}`); await yazDeger(p, `#uza-arac-${h.anahtar}`, h.deger) }
    }
    await p.waitForSelector('[data-eylem=kopyala]', { timeout: 30000 })
    // NOTYA-ULKE-DENETIM-01a — a number typed the OTHER way (a decimal comma where the comma groups thousands; a point
    // that could be thousands where the comma is the decimal mark) is REFUSED in the pack's own sentence: the tool
    // shows no result and can keep nothing until the number is typed again.
    const sayiAlani = O.ham.find((h) => h.tur === 'sayi')
    if (sayiAlani) {
      const yanlis = P.ondalikAyraci === '.' ? '1,5' : P.binlikAyraci === '.' ? '1.5' : '1.500'
      await yazDeger(p, `#uza-arac-${sayiAlani.anahtar}`, yanlis)
      await p.waitForSelector(`[data-alan="${sayiAlani.anahtar}"] [data-hata=sayi-okunamadi]`, { timeout: 30000 })
      const mesaj = await metin(p, `[data-alan="${sayiAlani.anahtar}"] [data-hata=sayi-okunamadi]`)
      kontrol(`tools: a number typed "${yanlis}" is refused, not guessed — the pack's sentence under the field, no result, nothing to keep`, mesaj.length > 10 && !mesaj.includes('%') && !(await p.$('[data-eylem=kopyala]')) && !(await p.$('[data-sayi]')) && (await p.$eval('[data-eylem=arac-kaydet]', (e) => e.disabled)) === true, mesaj)
      await tara(p, 'tools (a number that could not be read)')
      await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-tool-number-refused.png`), fullPage: true })
      await yazDeger(p, `#uza-arac-${sayiAlani.anahtar}`, sayiAlani.deger)
      await p.waitForSelector('[data-eylem=kopyala]', { timeout: 30000 })
    }
    kontrol('tools: filled in, the tool shows a result; the follow-up day is EMPTY (the application proposes none); nothing has been stored yet', (await alanDegeri(p, '#uza-arac-takip')) === '' && (await p.$eval('#uza-arac-takip', (e) => e.getAttribute('data-durum'))) === 'bos' && (await p.$eval('[data-eylem=arac-kaydet]', (e) => e.disabled)) === false && (await metin(p, '[data-bolum=kayit]')).includes(HASTA_ADI) && (await kayitlar()).length === 0)
    await tara(p, 'tools (one tool, filled in, for a patient)')
    // kept without a follow-up day
    await p.click('[data-eylem=arac-kaydet]')
    let satirlar = await kayitBekle(1)
    await p.waitForSelector('[data-bolum=kayit] [role=status]', { timeout: 30000 })
    const ham1 = JSON.stringify(satirlar)
    kontrol('tools: KEPT — one row with this country, this account, this patient and the tool; the content is one encrypted value (no field, no result readable); no follow-up day', satirlar.length === 1 && satirlar[0].ulke === P.kod && satirlar[0].doctor_id === HESAP_A && satirlar[0].patient_id === hastaA && satirlar[0].arac === O.anahtar && satirlar[0].takip_tarihi === null && !ham1.includes('sayilar') && !ham1.includes('tamam') && (await metin(p, '[data-bolum=kayit] [role=status]')) === AM.kayit.kaydedildi, ham1.slice(0, 200))
    // kept again, with the follow-up day the doctor types: today, in the country's own clock
    await yazGunAlani(p, '#uza-arac-takip', T.bugun)
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

// ───────────────────────── 4e. "my templates" and messages between the doctor and the patient (NOTYA-ULKE-MESAJ-01) ─────────────────────────
const kosulBekle = async (kosul, deneme = 120) => { for (let i = 0; i < deneme; i++) { const x = await kosul(); if (x) return x; await bekle(150) } return null }
let sablonA = '', yazismaA = ''
if (P.sablon) {
  const p = A, SM = P.sablon.m
  const satirlar = () => tabloOku('ulke_hekim_sablonlari')
  await git(p, `/tools?arac=${P.sablon.kutu}`)
  await p.waitForSelector('[data-bolum=sablonlarim][data-sablon-adedi]', { timeout: 60000 })
  kontrol('templates: the tile opens the doctor\'s own list — empty (the pack brings no template), with the pack\'s notice that no patient\'s data belongs in one', (await metin(p, '[data-alan=sablon-bos]')) === SM.bos && (await metin(p, '[data-alan=sablon-uyari]')) === SM.uyari && (await satirlar()).length === 0)
  await tara(p, 'tools (my templates, empty)')
  const yaz = async (ad, govdeMetni) => {
    await yazDeger(p, '#uza-sablon-ad', ad); await yazDeger(p, '#uza-sablon-metin', govdeMetni)
    const once = (await satirlar()).length
    await p.click('[data-eylem=sablon-kaydet]')
    await kosulBekle(async () => (await satirlar()).length > once)
    await p.waitForFunction((n) => document.querySelectorAll('[data-sablon]').length === n, { timeout: 30000 }, once + 1)
  }
  await yaz('QA-TEMPLATE name', 'QA-TEMPLATE-TEXT first wording')
  let s = await satirlar()
  sablonA = s[0]?.id ?? ''
  kontrol('templates: CREATED — one row with this country and this account and NO patient in it; the name and the text are one encrypted value', s.length === 1 && s[0].ulke === P.kod && s[0].doctor_id === HESAP_A && !('patient_id' in s[0]) && !JSON.stringify(s).includes('QA-TEMPLATE') && (await metin(p, `[data-sablon="${sablonA}"] .uza-not-metin`)) === 'QA-TEMPLATE-TEXT first wording', JSON.stringify(s).slice(0, 200))
  await p.click(`[data-sablon="${sablonA}"] [data-eylem=sablon-duzenle]`)
  await p.waitForSelector(`[data-bolum=sablon-formu][data-duzenlenen="${sablonA}"]`, { timeout: 30000 })
  await yazDeger(p, '#uza-sablon-metin', 'QA-TEMPLATE-TEXT edited wording')
  await p.click('[data-eylem=sablon-kaydet]')
  await p.waitForFunction((id) => document.querySelector(`[data-sablon="${id}"] .uza-not-metin`)?.textContent === 'QA-TEMPLATE-TEXT edited wording', { timeout: 30000 }, sablonA)
  s = await satirlar()
  kontrol('templates: EDITED — the same row with a new encrypted value; still one template', s.length === 1 && s[0].id === sablonA && !s[0].silindi_at && !JSON.stringify(s).includes('QA-TEMPLATE'))
  // a second one, deleted: the row stays, marked, and is listed no more
  await yaz('QA-TEMPLATE two', 'QA-TEMPLATE-TEXT to delete')
  const ikinci = (await satirlar()).find((x) => x.id !== sablonA)?.id ?? ''
  await p.click(`[data-sablon="${ikinci}"] [data-eylem=sablon-sil]`)
  await p.waitForSelector('[data-eylem=sablon-sil-onayla]', { timeout: 30000 })
  kontrol('templates: deleting asks first, in the pack\'s words', (await metin(p, '[data-alan=sablon-sil-onay] [role=alert]')) === SM.silUyari)
  await p.click('[data-eylem=sablon-sil-onayla]')
  await p.waitForFunction(() => document.querySelectorAll('[data-sablon]').length === 1, { timeout: 30000 })
  s = await satirlar()
  const silinmis = await api(p, '/api/ulke/sablonlar', { method: 'PATCH', govde: { id: ikinci, ad: 'QA', metin: 'QA', kapsam: 'hepsi' } })
  kontrol('templates: DELETED SOFTLY — the row stays, marked; it is listed no more and answers "not found" like a template that never existed', s.length === 2 && !!s.find((x) => x.id === ikinci)?.silindi_at && !s.find((x) => x.id === sablonA)?.silindi_at && silinmis.s === 404 && ((await api(p, '/api/ulke/sablonlar')).j?.sablonlar ?? []).length === 1, `${silinmis.s} ${silinmis.t}`)
  await tara(p, 'tools (my templates, one template)')
}
if (P.mesaj && portalOturumu) {
  const p = A, { H, token } = portalOturumu, HM = P.mesaj.hekim, PM = P.mesaj.hasta
  const doldur = (m, d) => m.replace('%', () => String(d))
  const hastaApi = (rota, sec = {}) => H.evaluate(async (u, sec) => {
    const r = await fetch(u, { method: sec.method || 'GET', credentials: 'same-origin', headers: { 'x-notya-portal-baglanti': sec.ozet, ...(sec.govde ? { 'Content-Type': 'application/json', 'x-notya-portal': '1' } : {}) }, body: sec.govde ? JSON.stringify(sec.govde) : undefined })
    const t = await r.text(); let j = null; try { j = JSON.parse(t) } catch { /* not json */ }
    return { s: r.status, t: t.slice(0, 300), j }
  }, adres(rota), { ...sec, ozet: ozetle(token) })
  const mesajlar = () => tabloOku('ulke_hasta_mesajlari'), yazismalar = () => tabloOku('ulke_mesaj_yazismalari')
  const hastaSayfasi = async () => { await H.reload({ waitUntil: 'networkidle0' }); await H.waitForSelector('[data-alan=portal-mesajlar][data-yazabilir]', { timeout: 60000 }) }
  writeFileSync(GUNLUK, '')

  // the patient's page BEFORE anybody wrote
  await hastaSayfasi()
  const acil = await metin(H, '[data-alan=mesaj-acil]')
  const numara = P.portal.acilNumara
  kontrol('messages: the patient\'s page has the section and — with NO conversation open — the notice that it is not for emergencies (the ambulance number only if the pack states one)', (await metin(H, '[data-alan=portal-mesajlar] h2')) === PM.baslik && acil.startsWith(PM.acil) && (numara ? acil.endsWith(doldur(PM.acilNumara, numara)) : acil === PM.acil), acil)
  const sorulmadan = await hastaApi('/api/ulke/portal/mesaj', { method: 'POST', govde: { metin: 'QA-UNASKED' } })
  kontrol('messages: ONLY THE DOCTOR OPENS A CONVERSATION — the page says so in the pack\'s words and offers no text box, and the server refuses a message nobody asked for', (await metin(H, '[data-alan=mesaj-yok]')) === PM.yok && (await metin(H, '[data-alan=mesaj-baslatamaz]')).includes(PM.baslatamaz) && !(await H.$('#uzp-mesaj')) && sorulmadan.s === 409 && sorulmadan.j?.code === 'KAPALI' && (await mesajlar()).length === 0 && (await yazismalar()).length === 0, `${sorulmadan.s} ${sorulmadan.t}`)
  await tara(H, 'portal: messages, before the doctor wrote')

  // the doctor writes from the patient's file
  await git(p, `/patient?id=${hastaA}`)
  await p.waitForSelector('[data-alan=hasta-mesajlari] [data-alan=mesaj-yaz]', { timeout: 60000 })
  kontrol('messages: the patient\'s file has the card in the pack\'s words, empty, and says that NOTHING tells the patient outside their page that a message is waiting', (await metin(p, '[data-alan=hasta-mesajlari] h2')) === HM.baslik && (await metin(p, '[data-alan=mesaj-bos]')) === HM.bos && (await metin(p, '[data-alan=mesaj-bildirim-yok]')) === HM.bildirimYok && P.mesaj.disBildirim?.acik === false && P.mesaj.disBildirim?.saglayici === null)
  let ilkMetin = 'QA-MESSAGE from the doctor'
  if (sablonA) {
    // "my templates" in a message: the doctor's own click puts the template's text at the end of what is written
    await p.waitForSelector('[data-alan=sablon-secici][data-hedef=mesaj] summary', { timeout: 30000 })
    await yazDeger(p, '#uza-mesaj-metin', 'QA-MESSAGE from the doctor')
    await p.click('[data-alan=sablon-secici][data-hedef=mesaj] summary')
    await p.waitForSelector(`[data-alan=sablon-secici] [data-sablon="${sablonA}"]`, { timeout: 30000 })
    const dugmeler = await p.$$eval('[data-alan=sablon-secici] [data-sablon]', (l) => l.length)
    await p.click(`[data-alan=sablon-secici] [data-sablon="${sablonA}"]`)
    ilkMetin = 'QA-MESSAGE from the doctor\nQA-TEMPLATE-TEXT edited wording'
    kontrol('templates: under a message the doctor\'s templates are offered (the deleted one is not), and a click puts the text AT THE END of what was written — nothing is replaced', dugmeler === 1 && (await p.$eval('#uza-mesaj-metin', (e) => e.value)) === ilkMetin)
  } else await yazDeger(p, '#uza-mesaj-metin', ilkMetin)
  await p.click('[data-eylem=mesaj-gonder]')
  await p.waitForSelector('[data-alan=hasta-mesajlari] [data-mesaj]', { timeout: 30000 })
  let y = await yazismalar(), ms = await mesajlar()
  yazismaA = y[0]?.id ?? ''
  kontrol('messages: WRITTEN — one conversation and one message for this country, this account and this patient; the text is one encrypted value; the message is unread', y.length === 1 && y[0].ulke === P.kod && y[0].doctor_id === HESAP_A && y[0].patient_id === hastaA && !y[0].kapandi_at && ms.length === 1 && ms[0].ulke === P.kod && ms[0].doctor_id === HESAP_A && ms[0].patient_id === hastaA && ms[0].yazisma_id === yazismaA && ms[0].gonderen === 'hekim' && !ms[0].okundu_at && !JSON.stringify(ms).includes('QA-MESSAGE') && !JSON.stringify(ms).includes('QA-TEMPLATE') && !!(await p.$('[data-alan=hasta-mesajlari] [data-okundu=hayir]')), JSON.stringify(ms).slice(0, 200))
  await tara(p, 'patient file (a message written)')

  // the patient reads and answers
  await hastaSayfasi()
  await H.waitForSelector('[data-alan=portal-mesajlar] [data-mesaj]', { timeout: 30000 })
  const hastaGordu = await H.$eval('[data-alan=portal-mesajlar]', (e) => ({ yeni: e.getAttribute('data-okunmamis'), yazabilir: e.getAttribute('data-yazabilir'), metin: e.querySelector('[data-mesaj] .uza-not-metin')?.textContent ?? '', rozet: e.querySelector('[data-alan=mesaj-okunmamis]')?.textContent ?? '' }))
  kontrol('messages: THE PATIENT SEES IT — the doctor\'s text exactly, marked as new in the pack\'s words, with a text box to answer and the emergency notice still above it', hastaGordu.yeni === '1' && hastaGordu.yazabilir === 'evet' && hastaGordu.metin === ilkMetin && hastaGordu.rozet === doldur(PM.okunmamis, 1) && (await metin(H, '[data-alan=mesaj-acil]')) === acil, JSON.stringify(hastaGordu))
  const okundu = await kosulBekle(async () => (await mesajlar())[0].okundu_at)
  await H.type('#uzp-mesaj', 'QA-REPLY of the patient')
  await H.click('[data-eylem=portal-mesaj-gonder]')
  await H.waitForFunction(() => document.querySelectorAll('[data-alan=portal-mesajlar] [data-mesaj]').length === 2, { timeout: 30000 })
  ms = await mesajlar()
  const cevap = ms.find((m) => m.gonderen === 'hasta')
  kontrol('messages: READ AND ANSWERED — opening the page marked the doctor\'s message as read, once; the patient\'s answer is a second message of the same conversation, encrypted, unread', !!okundu && ms.length === 2 && cevap?.yazisma_id === yazismaA && cevap?.patient_id === hastaA && cevap?.doctor_id === HESAP_A && !cevap?.okundu_at && !JSON.stringify(ms).includes('QA-REPLY') && (await yazismalar()).length === 1)
  await tara(H, 'portal: messages, a conversation')
  await H.screenshot({ path: join(CIKTI, `genel-${P.kod}-portal-messages.png`), fullPage: true })

  // the doctor's home lists who wrote; opening the file marks it as read
  await git(p, '/today')
  await p.waitForSelector('[data-alan=bugun-mesajlar] [data-mesaj-hastasi]', { timeout: 60000 })
  const evde = await metin(p, '[data-alan=bugun-mesajlar]')
  kontrol('messages: THE DOCTOR\'S HOME lists the patient who wrote, with the count in the pack\'s words, and links to the card on the file', evde.includes(HM.okunmamisBaslik) && evde.includes(HASTA_ADI) && evde.includes(doldur(HM.okunmamisAdet, 1)) && (await p.$eval('[data-alan=bugun-mesajlar] [data-mesaj-hastasi]', (e) => e.getAttribute('href'))).startsWith(`${adres('/patient')}?id=${hastaA}#`))
  await tara(p, 'home (an unread message)')
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }), p.click('[data-alan=bugun-mesajlar] [data-mesaj-hastasi]')])
  await p.waitForFunction(() => document.querySelectorAll('[data-alan=hasta-mesajlari] [data-mesaj]').length === 2, { timeout: 60000 })
  const dosyada = await p.$eval('[data-alan=hasta-mesajlari]', (e) => ({ yeni: e.getAttribute('data-okunmamis'), okundu: !!e.querySelector('[data-mesaj][data-gonderen=hekim] [data-okundu=evet]'), cevap: e.querySelector('[data-mesaj][data-gonderen=hasta] .uza-not-metin')?.textContent ?? '' }))
  const hekimOkudu = await kosulBekle(async () => (await mesajlar()).find((m) => m.gonderen === 'hasta')?.okundu_at)
  await git(p, '/today')
  await p.waitForSelector('.uza-karsilama', { timeout: 60000 })
  await bekle(800)
  kontrol('messages: on the file the doctor sees the answer and that the patient READ the first message; opening it marked the answer as read, and the home lists nobody any more', dosyada.yeni === '1' && dosyada.okundu && dosyada.cevap === 'QA-REPLY of the patient' && !!hekimOkudu && !(await p.$('[data-alan=bugun-mesajlar]')), JSON.stringify(dosyada))

  // the doctor closes the conversation
  await git(p, `/patient?id=${hastaA}`)
  await p.waitForSelector('[data-alan=hasta-mesajlari] [data-eylem=mesaj-kapat]', { timeout: 60000 })
  await p.click('[data-eylem=mesaj-kapat]')
  await p.waitForSelector('[data-alan=mesaj-kapat-onay]', { timeout: 30000 })
  const uyari = await metin(p, '[data-alan=mesaj-kapat-onay] [role=alert]')
  await p.click('[data-eylem=mesaj-kapat-onayla]')
  await p.waitForSelector('[data-alan=hasta-mesajlari] [data-yazisma-durumu=kapali]', { timeout: 30000 })
  await hastaSayfasi()
  const kapaliyken = await hastaApi('/api/ulke/portal/mesaj', { method: 'POST', govde: { metin: 'QA-AFTER-CLOSING' } })
  const ikinciKapat = await api(p, '/api/ulke/hasta-mesajlari', { method: 'PATCH', govde: { yazismaId: yazismaA, islem: 'kapat' } })
  y = await yazismalar()
  kontrol('messages: CLOSED BY THE DOCTOR (asked first, in the pack\'s words) — the patient still reads both messages, is told it is closed, has no text box, and the server takes no message; closing twice is refused', uyari === HM.kapatUyari && !!y[0].kapandi_at && (await metin(H, '[data-alan=mesaj-kapali]')) === PM.kapali && !(await H.$('#uzp-mesaj')) && (await H.$$eval('[data-alan=portal-mesajlar] [data-mesaj]', (l) => l.length)) === 2 && kapaliyken.s === 409 && kapaliyken.j?.code === 'KAPALI' && ikinciKapat.s === 409 && ikinciKapat.j?.code === 'DURUM' && (await mesajlar()).length === 2, `${kapaliyken.s} ${kapaliyken.t} | ${ikinciKapat.s} ${ikinciKapat.t}`)
  await tara(H, 'portal: messages, a closed conversation')
  await tara(p, 'patient file (a closed conversation)')
  kontrol('messages and templates: nothing was asked of the model or of any provider, and no request left this machine from either browser', cagrilar().length === 0 && H.disari.length === 0 && p.disari.length === 0, JSON.stringify(cagrilar()).slice(0, 200))
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
  if (P.sablon && sablonA) {
    // NOTYA-ULKE-MESAJ-01 — the second account and the first account's template.
    const once = JSON.stringify(await tabloOku('ulke_hekim_sablonlari'))
    const olmayan = await api(p, '/api/ulke/sablonlar', { method: 'DELETE', govde: { id: '30000000-0000-4000-8000-00000000dead' } })
    const c = [await api(p, '/api/ulke/sablonlar', { method: 'PATCH', govde: { id: sablonA, ad: 'QA-B', metin: 'QA-B', kapsam: 'hepsi' } }), await api(p, '/api/ulke/sablonlar', { method: 'DELETE', govde: { id: sablonA } })]
    const liste = await api(p, '/api/ulke/sablonlar')
    kontrol('templates: account B and account A\'s template — editing and deleting each answer exactly like "does not exist"; B\'s own list is empty; nothing changed', c.every((r) => r.s === 404 && r.t === olmayan.t) && liste.s === 200 && JSON.stringify(liste.j) === '{"sablonlar":[]}' && JSON.stringify(await tabloOku('ulke_hekim_sablonlari')) === once, c.map((r) => `${r.s} ${r.t}`).join(' | '))
  }
  if (P.mesaj && yazismaA) {
    // NOTYA-ULKE-MESAJ-01 — the second account and the first account's patient and (closed) conversation.
    const once = JSON.stringify([await tabloOku('ulke_mesaj_yazismalari'), await tabloOku('ulke_hasta_mesajlari')])
    const olmayan = await api(p, '/api/ulke/hasta-mesajlari?hasta=30000000-0000-4000-8000-00000000dead')
    const c = [
      await api(p, `/api/ulke/hasta-mesajlari?hasta=${hastaA}`), await api(p, '/api/ulke/hasta-mesajlari', { method: 'POST', govde: { hastaId: hastaA, metin: 'QA-B writes' } }),
      await api(p, '/api/ulke/hasta-mesajlari', { method: 'PATCH', govde: { hastaId: hastaA, islem: 'okundu', kadar: new Date().toISOString() } }), await api(p, '/api/ulke/hasta-mesajlari', { method: 'PATCH', govde: { yazismaId: yazismaA, islem: 'kapat' } }),
    ]
    const liste = await api(p, '/api/ulke/hasta-mesajlari')
    kontrol('messages: account B and account A\'s patient — reading the conversation, writing, marking as read and closing each answer exactly like "does not exist"; B\'s own list of unread messages is empty; nothing changed', c.every((r) => r.s === 404 && r.t === olmayan.t) && JSON.stringify(liste.j) === '{"okunmamis":[]}' && JSON.stringify([await tabloOku('ulke_mesaj_yazismalari'), await tabloOku('ulke_hasta_mesajlari')]) === once, c.map((r) => `${r.s} ${r.t}`).join(' | '))
    const { H, token } = portalOturumu
    const hastayla = await H.evaluate(async (u, o) => { const r = await fetch(u, { credentials: 'same-origin', headers: { 'x-notya-portal-baglanti': o } }); return r.status }, adres(`/api/ulke/hasta-mesajlari?hasta=${hastaA}`), ozetle(token))
    const hekimle = await api(A, '/api/ulke/portal/mesaj')
    kontrol('messages: the doctor\'s message route never accepts a patient\'s session, and the patient\'s never accepts a doctor\'s', hastayla === 401 && hekimle.s === 401 && hekimle.t === '{"code":"OTURUM_YOK"}', `${hastayla} ${hekimle.s} ${hekimle.t}`)
  }
  if (P.konsultasyon) {
    // NOTYA-ULKE-MESAJ-01 — CONSULTATION between the two accounts of this country. A asks B about A's patient.
    const K = P.konsultasyon, KA = K.m, KB = K.ikinci
    const doldur = (m, ...d) => (d.length === 1 ? m.replace('%', () => String(d[0])) : m.replace(/%(\d)/g, (h, n) => String(d[Number(n) - 1] ?? h)))
    const satirlar = () => tabloOku('ulke_konsultasyonlar')
    const KAPI = '/api/ulke/konsultasyon'
    writeFileSync(GUNLUK, '')
    // B: its own code, made on its own click
    await git(p, `/tools?arac=${K.kutu}`)
    await p.waitForSelector('[data-bolum=konsultasyon-kodu][data-kod-durumu]', { timeout: 60000 })
    await p.waitForSelector('[data-bolum=konsultasyon-gelen][data-adet]', { timeout: 60000 })
    kontrol('consultation: account B has no code yet and was asked nothing; its screen says, in the pack\'s words, that a colleague sees only what was shared', (await p.$eval('[data-bolum=konsultasyon-kodu]', (e) => e.getAttribute('data-kod-durumu'))) === 'yok' && (await metin(p, '[data-alan=kod-yok]')) === KB.kod.yok && (await metin(p, '[data-alan=gelen-bos]')) === KB.gelen.bos && (await metin(p, '[data-alan=gelen-aciklama]')) === KB.gelen.aciklama)
    await p.click('[data-eylem=kod-uret]')
    await p.waitForSelector('[data-alan=konsultasyon-kodu]', { timeout: 30000 })
    const kodB = await p.$eval('[data-alan=konsultasyon-kodu]', (e) => e.value)
    const kodlar = await tabloOku('ulke_konsultasyon_kodlari')
    kontrol('consultation: B\'s code is made on B\'s own click — one row for this country and this account, and the code itself cannot be read in the database', kodB.replace(/[^A-Z0-9]/g, '').length >= 8 && kodlar.length === 1 && kodlar[0].ulke === P.kod && kodlar[0].doctor_id === HESAP_B && /^[0-9a-f]{64}$/.test(kodlar[0].kod_hash) && !JSON.stringify(kodlar).includes(kodB) && !JSON.stringify(kodlar).includes(kodB.replace(/[^A-Z0-9]/g, '')), kodB.replace(/[A-Z0-9]/g, 'x'))
    await tara(p, 'tools (consultations, account B)')

    // A: finds B by the code, and by nothing else
    const yanlis = await api(A, KAPI, { method: 'POST', govde: { islem: 'bul', kod: kodB.split('').reverse().join('') } })
    const dizin = await api(A, `${KAPI}?gorunum=meslektaslar`)
    await git(A, `/patient?id=${hastaA}`)
    await A.waitForSelector('[data-alan=hasta-konsultasyon] [data-alan=konsultasyon-iste] summary', { timeout: 60000 })
    await A.click('[data-alan=konsultasyon-iste] summary')
    await A.waitForSelector('#uza-ki-kod', { visible: true, timeout: 30000 })
    await A.type('#uza-ki-kod', kodB)
    await A.click('[data-eylem=meslektas-bul]')
    await A.waitForSelector('[data-alan=meslektas]', { timeout: 30000 })
    const bulunan = await metin(A, '[data-alan=meslektas]')
    kontrol('consultation: A finds B by B\'s code and by nothing else — another code names nobody, and there is no list of doctors to ask the server for', bulunan.includes((await tabloOku('ulke_hesaplari')).find((h) => h.id === HESAP_B).full_name) && yanlis.s === 404 && yanlis.j?.code === 'MESLEKTAS_YOK' && dizin.s >= 400 && dizin.s < 500 && !JSON.stringify(dizin.j ?? {}).includes(HESAP_B), `${bulunan} | ${yanlis.s} ${yanlis.t} | ${dizin.s}`)
    await A.type('#uza-ki-soru', 'QA-QUESTION for the colleague')
    await A.waitForSelector('input[name=konsultasyon-paylasim][value=not]', { timeout: 30000 })
    await A.click('input[name=konsultasyon-paylasim][value=not]')
    await A.waitForSelector('#uza-ki-not', { timeout: 30000 })
    await A.click('[data-eylem=konsultasyon-iste]')
    await A.waitForSelector('[data-alan=konsultasyon-iste] [role=alert]', { timeout: 30000 })
    kontrol('consultation: WITHOUT THE CONSENT TICK nothing is sent — the pack\'s sentence, the consent wording on the screen, and no row', (await metin(A, '[data-alan=konsultasyon-iste] [role=alert]')) === KA.iste.rizaGerekli && (await metin(A, '[data-alan=konsultasyon-riza]')).includes(KA.iste.riza) && (await metin(A, '[data-alan=konsultasyon-bildirim-yok]')) === KA.iste.bildirimYok && (await satirlar()).length === 0)
    await tara(A, 'patient file (asking a colleague)')
    await A.click('[data-alan=konsultasyon-riza] input[name=riza]')
    await A.click('[data-eylem=konsultasyon-iste]')
    await A.waitForSelector('[data-bolum=konsultasyon-giden] [data-konsultasyon]', { timeout: 30000 })
    let s = await satirlar()
    const id = s[0]?.id ?? ''
    const gun = s[0] ? (Date.parse(s[0].son_gecerlilik) - Date.now()) / 86400000 : -1
    kontrol(`consultation: ASKED — one row for this country: A asks B about A's patient; an approved note is named and its COPY is stored; the question and the copy are encrypted; the consent stamp is the pack's and its moment is recorded; open for the pack's ${K.acikGun} days`, s.length === 1 && s[0].ulke === P.kod && s[0].doctor_id === HESAP_A && s[0].danisilan_id === HESAP_B && s[0].patient_id === hastaA && s[0].paylasim_turu === 'not' && !!s[0].note_id && !!s[0].paylasim_encrypted && s[0].riza_surumu === K.rizaSurumu && !!s[0].riza_at && Math.abs(gun - K.acikGun) < 0.01 && !s[0].okundu_at && !s[0].cevap_at && !s[0].kapandi_at && !/QA-QUESTION|SYNTHETIC|QA-PATIENT/.test(JSON.stringify(s)), `${gun.toFixed(3)} days ${JSON.stringify(s).slice(0, 160)}`)

    // B: is told on the home screen, and sees ONLY what was shared
    await git(p, '/today')
    await p.waitForSelector('[data-alan=bugun-konsultasyon]', { timeout: 60000 })
    kontrol('consultation: B\'s home says that a colleague asked, in the pack\'s words, and names no patient', (await metin(p, '[data-alan=bugun-konsultasyon] h2')) === doldur(KB.gelen.bekleyen, 1) && !(await govde(p)).includes('QA-PATIENT'))
    await git(p, `/tools?arac=${K.kutu}`)
    await p.waitForSelector('[data-bolum=konsultasyon-gelen] [data-konsultasyon]', { timeout: 60000 })
    const gelenApi = await api(p, `${KAPI}?gorunum=gelen`)
    // the server's whole answer, as text (the helper above keeps only its beginning)
    const gelenJ = await p.evaluate(async (u, anahtar) => { const o = JSON.parse(localStorage.getItem(anahtar) || 'null'); return (await fetch(u, { headers: { Authorization: `Bearer ${o?.access_token ?? ''}` } })).text() }, adres(`${KAPI}?gorunum=gelen`), OTURUM_ANAHTARI)
    const ekran = await metin(p, '[data-bolum=konsultasyon-gelen]')
    const kopya = await metin(p, '[data-alan=konsultasyon-kopya][data-kopya=not]')
    kontrol('consultation: B SEES ONLY WHAT WAS SHARED — the question, who asked, and a read-only copy of the approved note; no name of the patient, no id of the patient or of the note, no link to anything, neither on the screen nor in the server\'s answer', gelenApi.s === 200 && ekran.includes('QA-QUESTION for the colleague') && ekran.includes('QA Shifokor Bir') && /SYNTHETIC/.test(kopya) && !ekran.includes('QA-PATIENT') && !gelenJ.includes(hastaA) && !gelenJ.includes('QA-PATIENT') && !gelenJ.includes(s[0].note_id) && !gelenJ.includes(P.telefonOrnek) && (await p.$$eval('[data-bolum=konsultasyon-gelen] a[href], [data-bolum=konsultasyon-gelen] [contenteditable], [data-alan=konsultasyon-kopya] textarea, [data-alan=konsultasyon-kopya] input', (l) => l.length)) === 0, kopya.slice(0, 80))
    const okundu = await kosulBekle(async () => (await satirlar())[0].okundu_at)
    const baska = [await api(p, `/api/ulke/hasta?id=${hastaA}`), await api(p, `${KAPI}?gorunum=giden&hasta=${hastaA}`), await api(p, `${KAPI}?gorunum=notlar&hasta=${hastaA}`), await api(p, KAPI, { method: 'PATCH', govde: { id, islem: 'kapat' } }), await api(p, KAPI, { method: 'POST', govde: { islem: 'iste', hastaId: hastaA, kod: kodB, soru: 'QA-B asks', paylasimTuru: 'yok', notId: null, riza: true } })]
    kontrol('consultation: opening it is recorded once, and it OPENS NOTHING ELSE — the patient\'s file, the patient\'s notes and A\'s own list still answer B "not found"; B cannot close what A asked, and cannot ask about A\'s patient', !!okundu && baska.every((r) => r.s === 404) && (await satirlar()).length === 1, baska.map((r) => `${r.s} ${r.t}`).join(' | '))
    await tara(p, 'tools (consultations, account B was asked)')
    await p.screenshot({ path: join(CIKTI, `genel-${P.kod}-consultation-asked.png`), fullPage: true })

    // B answers, once
    await p.type('[data-alan=konsultasyon-cevap-formu] textarea[name=cevap]', 'QA-ANSWER of the colleague')
    await p.click('[data-eylem=konsultasyon-cevapla]')
    await p.waitForSelector('[data-bolum=konsultasyon-gelen] [data-alan=konsultasyon-cevap]', { timeout: 30000 })
    s = await satirlar()
    const ikinciCevap = await api(p, KAPI, { method: 'PATCH', govde: { id, islem: 'cevap', cevap: 'QA-SECOND answer' } })
    const kendiCevabi = await api(A, KAPI, { method: 'PATCH', govde: { id, islem: 'cevap', cevap: 'QA-OWN answer' } })
    kontrol('consultation: ANSWERED ONCE — the answer is encrypted with its moment; a second answer is refused, and the asking account cannot answer its own question', !!s[0].cevap_at && !!s[0].cevap_encrypted && !JSON.stringify(s).includes('QA-ANSWER') && ikinciCevap.s === 409 && ikinciCevap.j?.code === 'DURUM' && kendiCevabi.s === 404 && !(await p.$('[data-alan=konsultasyon-cevap-formu]')), `${ikinciCevap.s} ${ikinciCevap.t} | ${kendiCevabi.s} ${kendiCevabi.t}`)

    // A reads the answer and closes
    await git(A, `/patient?id=${hastaA}`)
    await A.waitForSelector('[data-bolum=konsultasyon-giden] [data-alan=konsultasyon-cevap]', { timeout: 60000 })
    kontrol('consultation: A reads the answer on the patient\'s file and sees that B opened the question', (await metin(A, '[data-bolum=konsultasyon-giden] [data-alan=konsultasyon-cevap]')) === 'QA-ANSWER of the colleague' && !!(await A.$('[data-bolum=konsultasyon-giden] [data-okundu=evet]')) && (await metin(A, '[data-bolum=konsultasyon-giden] [data-alan=konsultasyon-soru]')) === 'QA-QUESTION for the colleague')
    await A.click('[data-bolum=konsultasyon-giden] [data-eylem=konsultasyon-kapat]')
    await A.waitForSelector('[data-alan=konsultasyon-kapat-onay]', { timeout: 30000 })
    const kapatUyari = await metin(A, '[data-alan=konsultasyon-kapat-onay] [role=alert]')
    await A.click('[data-eylem=konsultasyon-kapat-onayla]')
    await A.waitForSelector('[data-bolum=konsultasyon-giden] [data-konsultasyon][data-durum=kapali]', { timeout: 30000 })
    s = await satirlar()
    const sure = (Date.parse(s[0].erisim_bitis) - Date.parse(s[0].kapandi_at)) / 86400000
    const yineKapat = await api(A, KAPI, { method: 'PATCH', govde: { id, islem: 'kapat' } })
    kontrol(`consultation: CLOSED BY A (asked first, with the pack's ${K.kapanisSonrasiGun} day(s) in the sentence) — the row keeps the question, the copy and the answer; B may read it for exactly that long after the closing; closing twice is refused`, kapatUyari === doldur(KA.giden.kapatUyari, K.kapanisSonrasiGun) && s.length === 1 && !!s[0].kapandi_at && Math.abs(sure - K.kapanisSonrasiGun) < 0.01 && !!s[0].cevap_encrypted && !!s[0].paylasim_encrypted && yineKapat.s === 409 && yineKapat.j?.code === 'DURUM', `${sure} | ${yineKapat.s} ${yineKapat.t}`)
    await tara(A, 'patient file (a closed consultation)')

    // B after the closing
    await git(p, `/tools?arac=${K.kutu}`)
    await p.waitForSelector('[data-bolum=konsultasyon-gelen][data-adet]', { timeout: 60000 })
    const adet = await p.$eval('[data-bolum=konsultasyon-gelen]', (e) => e.getAttribute('data-adet'))
    kontrol(K.kapanisSonrasiGun > 0 ? 'consultation: AFTER THE CLOSING B still reads it, marked as closed, with no way to write' : 'consultation: AFTER THE CLOSING B is shown nothing (the pack allows no reading after it)', K.kapanisSonrasiGun > 0 ? adet === '1' && !!(await p.$('[data-bolum=konsultasyon-gelen] [data-konsultasyon][data-durum=kapali]')) && !(await p.$('[data-alan=konsultasyon-cevap-formu]')) && !(await p.$('[data-bolum=konsultasyon-gelen] textarea')) : adet === '0', `shown: ${adet}`)
    await tara(p, 'tools (consultations, after the closing)')
    await git(p, '/today')
    await p.waitForSelector('.uza-karsilama', { timeout: 60000 })
    await bekle(800)
    kontrol('consultation: nothing waits on B\'s home any more; and in all of it nothing was asked of the model and nothing was sent to anybody', !(await p.$('[data-alan=bugun-konsultasyon]')) && cagrilar().length === 0 && p.disari.length === 0 && A.disari.length === 0, JSON.stringify(cagrilar()).slice(0, 200))
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
  const tablolar = ['ulke_hastalar', 'hasta_ulke_bilgisi', 'ulke_muayeneler', 'muayene_dil_kaydi', 'ulke_notlar', 'not_dil_kaydi', 'ulke_randevulari', 'hekim_rolu', 'hekim_dil_tercihleri', 'hekim_calisma_duzeni', 'ulke_kullanim', 'ulke_kullanim_olcumu', ...(P.araclar ? ['ulke_arac_kayitlari'] : []), ...(P.portal ? ['ulke_portal_erisimleri', 'ulke_portal_oturumlari', 'ulke_portal_kayitlari', 'ulke_hasta_ozetleri', 'ulke_randevu_istekleri'] : []), ...(P.form ? ['ulke_hasta_formlari'] : []), ...(P.sablon ? ['ulke_hekim_sablonlari'] : []), ...(P.mesaj ? ['ulke_mesaj_yazismalari', 'ulke_hasta_mesajlari'] : []), ...(P.konsultasyon ? ['ulke_konsultasyon_kodlari', 'ulke_konsultasyonlar'] : [])]
  const yabanciSatir = []
  let toplam = 0
  for (const ad of tablolar) for (const s of await tabloOku(ad)) { toplam++; if (s.ulke !== P.kod) yabanciSatir.push(`${ad}:${s.ulke}`) }
  kontrol(`every row the walk-through wrote carries this country's code (${toplam} rows in ${tablolar.length} tables)`, toplam > 5 && yabanciSatir.length === 0, yabanciSatir.join(' '))
  const hesaplar = await tabloOku('ulke_hesaplari')
  kontrol('the other country\'s account row in the shared table was not touched', hesaplar.some((h) => h.ulke !== P.kod) && hesaplar.filter((h) => h.ulke === P.kod).length >= 2)
}

// ───────────────────────── 6. clinic accounts (NOTYA-ULKE-KLINIK-01): two clinics, five accounts ─────────────────────────
if (P.klinik) {
  const K = P.klinik, KM = K.m
  const KL = { sahip: 'cccccccc-0000-4000-8000-000000000001', hekim: 'cccccccc-0000-4000-8000-000000000002', muttefik: 'cccccccc-0000-4000-8000-000000000003', onBuro: 'cccccccc-0000-4000-8000-000000000004', diger: 'cccccccc-0000-4000-8000-000000000005' }
  const AD = { sahip: 'QA Clinic Owner One', hekim: 'QA Clinic Doctor Two', muttefik: 'QA Clinic Allied Three', onBuro: 'QA Clinic Desk Four', diger: 'QA Other Clinic Five' }
  const YOK = '{"code":"NOT_FOUND"}'
  const yokMu = (...r) => r.every((x) => x.s === 404 && x.t === YOK)
  const TUR = (t) => K.yetkiTurleri.includes(t)
  const BURO_TURLERI = ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'].filter((t) => TUR(t) && (t !== 'on-buro-randevu' || P.randevu) && (t !== 'on-buro-portal' || P.portal))
  const BURO_RANDEVU = BURO_TURLERI.includes('on-buro-randevu'), BURO_HASTA = BURO_TURLERI.includes('on-buro-hasta'), BURO_PORTAL = BURO_TURLERI.includes('on-buro-portal')
  const PAYLASIM = TUR('paylasim') && !!K.muttefikRolu, VEKALET = TUR('vekalet')
  const anahtarlar = (o) => Object.keys(o ?? {}).sort().join(',')
  const bilgiBekle = (p, m) => p.waitForFunction((t) => [...document.querySelectorAll('.uza-bilgi-kutu[role=status]')].some((e) => e.innerText.trim() === t), { timeout: 30000 }, m).then(() => true, () => false)
  const hataBekle = (p, m) => p.waitForFunction((t) => [...document.querySelectorAll('[role=alert]')].some((e) => e.innerText.trim() === t), { timeout: 30000 }, m).then(() => true, () => false)
  const buGun = new Intl.DateTimeFormat('en-CA', { timeZone: P.saatDilimleri[0], year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const gunSonra = (n) => new Date(Date.parse(`${buGun}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
  const yarin = gunSonra(1)
  /** Login, and the first-login questions as far as the LANGUAGE: stops at the role question (or at the home, where the pack asks for no role). */
  async function roleKadar(p) {
    for (let i = 0; i < 4; i++) {
      const durum = await p.waitForFunction((bugun, soru) => (location.pathname === bugun && document.querySelector('.uza-karsilama') ? 'ev' : location.pathname === soru && document.querySelector('select[name=rol], input[name=dil], input[name=yazi]') ? (document.querySelector('select[name=rol]') ? 'rol' : 'dil') : false), { timeout: 60000 }, adres('/today'), adres('/start')).then((h) => h.jsonValue())
      if (durum !== 'dil') return durum
      await p.click('button[type=submit]')
      await p.waitForFunction((bugun) => (location.pathname === bugun && !!document.querySelector('.uza-karsilama')) || !document.querySelector('input[name=dil], input[name=yazi]'), { timeout: 60000 }, adres('/today'))
    }
    return 'dil'
  }
  async function hesapAc(eposta, sifre, rol) {
    const p = await sayfaAc(MASA)
    await git(p, '/login'); await giris(p, eposta, sifre)
    if (rol !== null) await sorulariGec(p, rol)
    return p
  }
  const tikla = async (p, sel) => { await p.waitForSelector(sel, { timeout: 30000 }); await p.click(sel) }
  const klinikAc = async (p, gorunum) => { await git(p, `/clinic${gorunum ? `?gorunum=${gorunum}` : ''}`); await p.waitForSelector(gorunum === 'yetkiler' ? '[data-alan=yetkiler-basligi]' : gorunum === 'paylasilan' ? '[data-alan=paylasilanlar]' : '[data-alan=klinik-giris], [data-alan=klinik-basligi]', { timeout: 60000 }) }
  const katil = async (p, kod) => { await yazDeger(p, '[data-alan=davet-kodu]', kod); await p.click('[data-eylem=klinige-katil]') }

  // ── 6a. the owner of the first clinic ──
  const S = await hesapAc('qa-k1@notya.test', 'sinov-parol-k1', K.hekimRolu ?? '')
  kontrol('clinic: the shell offers the clinic to an account that is in none', (await S.$$eval('a[href]', (l, h) => l.filter((e) => e.getAttribute('href') === h).map((e) => e.innerText.trim()), adres('/clinic'))).includes(KM.kabuk.klinik))
  await klinikAc(S)
  kontrol('clinic: an account in no clinic is offered to join one with a code or to create one, in the pack\'s words', (await metin(S, '[data-alan=klinik-giris] h1')) === KM.giris.baslik && (await metin(S, '[data-alan=klinik-katil] h2')) === KM.giris.katilBaslik && (await metin(S, '[data-alan=klinik-kur] h2')) === KM.giris.kurBaslik)
  await tara(S, 'clinic: no clinic yet')
  await yazDeger(S, '[data-alan=klinik-adi]', 'X'); await S.click('[data-eylem=klinik-kur]')
  kontrol('clinic: a name of one letter is refused with the pack\'s sentence, and nothing is written', (await hataBekle(S, KM.giris.adGerekli)) && (await tabloOku('ulke_klinikler')).length === 0)
  await yazDeger(S, '[data-alan=klinik-adi]', 'QA Clinic One'); await S.click('[data-eylem=klinik-kur]')
  await S.waitForSelector('[data-alan=klinik-basligi]', { timeout: 30000 })
  let klinikler = await tabloOku('ulke_klinikler'), uyeler = await tabloOku('ulke_klinik_uyeleri')
  const K1 = klinikler[0]?.id
  kontrol('clinic: created — the account is its owner, and both rows carry this country', (await metin(S, '[data-alan=klinik-basligi] h1')) === 'QA Clinic One' && (await S.$eval('[data-alan=klinik-basligi]', (e) => e.getAttribute('data-konum'))) === 'sahip' && (await metin(S, '[data-alan=klinik-basligi]')).includes(KM.konum.sahip) && klinikler.length === 1 && klinikler[0].ulke === P.kod && klinikler[0].doctor_id === KL.sahip && uyeler.length === 1 && uyeler[0].konum === 'sahip' && uyeler[0].ulke === P.kod, JSON.stringify(uyeler))
  kontrol('clinic: the screen says that a position alone opens no patient', (await metin(S, '[data-alan=klinik-uyeler]')).includes(KM.klinik.konumAciklama))
  kontrol('clinic: the owner cannot leave or be removed (no control on the owner\'s own row)', !(await S.$('[data-eylem=klinikten-ayril], [data-eylem=uye-cikar]')) && (await api(S, '/api/ulke/klinik/uye', { method: 'DELETE', govde: { hesapId: KL.sahip } })).t === '{"code":"SAHIP"}')
  await tara(S, 'clinic: the owner\'s screen')

  // ── 6b. invitations: a code is shown once, only its hash is kept ──
  const kodlar = {}
  let iptalDavetId = ''
  for (const konum of ['hekim', 'muttefik', 'on-buro', 'iptal']) {
    const once = (await tabloOku('ulke_klinik_davetleri')).map((d) => d.id)
    const onceki = await S.$eval('[data-alan=yeni-davet-kodu]', (e) => e.value).catch(() => '')
    await S.select('[data-alan=davet-konumu]', konum === 'iptal' ? 'hekim' : konum)
    await S.click('[data-eylem=davet-olustur]')
    await S.waitForFunction((o) => { const e = document.querySelector('[data-alan=yeni-davet-kodu]'); return !!e && !!e.value && e.value !== o }, { timeout: 30000 }, onceki)
    kodlar[konum] = await S.$eval('[data-alan=yeni-davet-kodu]', (e) => e.value)
    if (konum === 'iptal') iptalDavetId = (await tabloOku('ulke_klinik_davetleri')).map((d) => d.id).find((id) => !once.includes(id)) ?? ''
  }
  let davetler = await tabloOku('ulke_klinik_davetleri')
  const hamDavet = JSON.stringify(davetler)
  kontrol('invitations: four codes made; the database holds a hash of each and none of the codes', davetler.length === 4 && new Set(Object.values(kodlar)).size === 4 && davetler.every((d) => /^[0-9a-f]{64}$/.test(d.kod_hash) && d.ulke === P.kod && d.klinik_id === K1 && d.doctor_id === KL.sahip) && Object.values(kodlar).every((k) => k.length >= 12 && !hamDavet.includes(k) && !hamDavet.includes(k.replace(/-/g, ''))))
  kontrol('invitations: the screen says the code is shown this once', (await metin(S, '[data-alan=yeni-davet]')).includes(KM.davet.birKez))
  await tikla(S, `li[data-davet="${iptalDavetId}"] [data-eylem=davet-geri-al]`)
  kontrol('invitations: one is withdrawn by the owner', (await bilgiBekle(S, KM.davet.geriAlindi)) && !!(await tabloOku('ulke_klinik_davetleri')).find((d) => d.id === iptalDavetId)?.iptal_at)
  await klinikAc(S)
  await S.waitForSelector('[data-alan=klinik-davetler] li[data-davet]', { timeout: 30000 })
  const kaynak = await S.content()
  kontrol('invitations: after a reload no code is on the screen or in the page — the list shows positions and states only', !(await S.$('[data-alan=yeni-davet-kodu]')) && Object.values(kodlar).every((k) => !kaynak.includes(k)) && (await S.$$eval('[data-alan=klinik-davetler] li[data-davet]', (l) => l.map((e) => e.getAttribute('data-davet-durumu')).sort().join())) === 'acik,acik,acik,iptal')

  // ── 6c. the second clinic: another owner, who cannot be a member of two ──
  const D = await hesapAc('qa-k5@notya.test', 'sinov-parol-k5', K.hekimRolu ?? '')
  await klinikAc(D)
  await yazDeger(D, '[data-alan=klinik-adi]', 'QA Clinic Two'); await D.click('[data-eylem=klinik-kur]')
  await D.waitForSelector('[data-alan=klinik-basligi]', { timeout: 30000 })
  klinikler = await tabloOku('ulke_klinikler')
  const K2 = klinikler.find((k) => k.doctor_id === KL.diger)?.id
  const ikinci = await api(D, '/api/ulke/klinik/katil', { method: 'POST', govde: { kod: kodlar.hekim } })
  kontrol('second clinic: created by another account; that account cannot also join the first (one clinic per account), and the code it tried is NOT used up', klinikler.length === 2 && !!K2 && K2 !== K1 && ikinci.s === 409 && ikinci.t === '{"code":"UYE"}' && (await tabloOku('ulke_klinik_davetleri')).every((d) => !d.kullanildi_at) && (await tabloOku('ulke_klinik_uyeleri')).length === 2, `${ikinci.s} ${ikinci.t}`)

  // ── 6d. a doctor and an allied professional join the first clinic with their codes ──
  const H = await hesapAc('qa-k2@notya.test', 'sinov-parol-k2', K.hekimRolu ?? '')
  await klinikAc(H)
  await katil(H, kodlar.iptal)
  kontrol('joining: a withdrawn code is refused with the pack\'s sentence, and nobody joined', (await hataBekle(H, KM.giris.kodGecersiz)) && (await tabloOku('ulke_klinik_uyeleri')).length === 2)
  await katil(H, kodlar.hekim)
  await H.waitForSelector('[data-alan=klinik-basligi][data-konum=hekim]', { timeout: 30000 })
  kontrol('joining: the doctor is a member in the position the code carried; a member who is not an administrator sees no invitations, no schedule and no control over anybody else', (await metin(H, '[data-alan=klinik-basligi] h1')) === 'QA Clinic One' && !(await H.$('[data-alan=klinik-davetler]')) && !(await H.$('[data-alan=klinik-takvimi]')) && !(await H.$('[data-eylem=konum-degistir], [data-eylem=uye-cikar]')) && !!(await H.$('[data-eylem=klinikten-ayril]')))
  const M = await hesapAc('qa-k3@notya.test', 'sinov-parol-k3', K.muttefikRolu ?? K.paylasimsizRol ?? K.hekimRolu ?? '')
  await klinikAc(M)
  await katil(M, kodlar.hekim)
  kontrol('joining: a code that was used once opens nothing a second time (the same sentence as a code that never existed)', (await hataBekle(M, KM.giris.kodGecersiz)) && (await tabloOku('ulke_klinik_uyeleri')).length === 3)
  await katil(M, kodlar.muttefik)
  await M.waitForSelector('[data-alan=klinik-basligi][data-konum=muttefik]', { timeout: 30000 })

  // ── 6e. the front desk: no role is chosen; the application is the workspace, the clinic and the settings ──
  const F = await sayfaAc(MASA)
  await git(F, '/login'); await giris(F, 'qa-k4@notya.test', 'sinov-parol-k4')
  const soru = await roleKadar(F)
  if (soru === 'rol') {
    kontrol('front desk: the role question offers the way to a clinic\'s code (nobody at the front desk has a role to choose)', (await F.$eval('[data-eylem=klinik-kodu]', (e) => `${e.getAttribute('href')}|${e.innerText.trim()}`)) === `${adres('/clinic')}|${KM.giris.katilBaslik}`)
    await F.click('[data-eylem=klinik-kodu]')
    await yolda(F, '/clinic')
  } else await git(F, '/clinic')
  await F.waitForSelector('[data-alan=klinik-katil]', { timeout: 60000 })
  await tara(F, 'clinic: joining with a code, before any role')
  await katil(F, kodlar['on-buro'])
  if (P.randevu) { await yolda(F, '/desk'); await F.waitForSelector('[data-alan=on-buro-hekim]', { timeout: 60000 }) } else await F.waitForSelector('[data-alan=klinik-basligi][data-konum=on-buro]', { timeout: 60000 })
  uyeler = await tabloOku('ulke_klinik_uyeleri')
  kontrol('front desk: joined without choosing a role; four members in the first clinic, one in the second, every code used once', uyeler.filter((u) => u.klinik_id === K1).map((u) => u.konum).sort().join() === 'hekim,muttefik,on-buro,sahip' && uyeler.filter((u) => u.klinik_id === K2).length === 1 && (await tabloOku('hekim_rolu')).every((r) => r.doctor_id !== KL.onBuro) && (await tabloOku('ulke_klinik_davetleri')).filter((d) => d.kullanildi_at).length === 3)
  if (P.randevu) {
    kontrol('front desk: the workspace opens, and says in the pack\'s words that no doctor has given anything yet', (await metin(F, '[data-alan=on-buro-hekim] h1')) === KM.onBuro.baslik && (await metin(F, '[data-alan=hekim-yok]')) === KM.onBuro.hekimYok)
    if (soru === 'rol') {
      const baglantilar = await F.$$eval('a[href]', (l) => l.map((e) => e.getAttribute('href')))
      kontrol('front desk: the navigation is the workspace, the clinic and the settings — no patients, no home, no calendar, no tools', ['/patients', '/today', '/calendar', '/tools', '/visit'].every((r) => !baglantilar.includes(adres(r))) && baglantilar.includes(adres('/desk')) && baglantilar.includes(adres('/clinic')) && baglantilar.includes(adres('/settings')), baglantilar.join(' '))
      await git(F, '/patients')
      kontrol('front desk: a doctor\'s screen typed into the address bar leads back to the workspace', await yolda(F, '/desk').then(() => true, () => false))
      await F.waitForSelector('[data-alan=on-buro-hekim]', { timeout: 60000 })
    }
    await tara(F, 'front desk: nothing given yet')
  }

  // ── 6f. the owner's patients: one that will be shared, one that will not; an approved note; an appointment with a reason ──
  const hastaYap = async (p, ad, dogum) => (await api(p, '/api/ulke/hastalar', { method: 'POST', govde: { ad, dogumTarihi: dogum, cinsiyet: 'male', telefon: P.telefonOrnek, dil: P.hastaDilleri[0] } })).j?.hasta?.id
  const paylasilan = await hastaYap(S, 'QA-CLINIC Shared Patient', '1980-05-02')
  const ozel = await hastaYap(S, 'QA-CLINIC Private Patient', '1975-11-20')
  const hekimHastasi = await hastaYap(H, 'QA-CLINIC Doctor Two Patient', '1990-01-15')
  writeFileSync(GUNLUK, ''); writeFileSync(SENARYO, JSON.stringify({ stt: 'yuksek', model: 'tamam' }))
  await git(S, `/visit?hasta=${paylasilan}`)
  await S.waitForSelector('input[name=riza]'); await S.click('input[name=riza]')
  await S.waitForFunction(() => !document.querySelector('.uza-form button.uza-dugme').disabled)
  await S.click('.uza-form button.uza-dugme'); await S.waitForSelector('.uza-sure', { timeout: 20000 }); await bekle(2600)
  await S.click('.uza-kayit .uza-dugme')
  await S.waitForFunction(() => new URLSearchParams(location.search).has('not'), { timeout: 120000 })
  await S.waitForSelector('#uza-not-s', { timeout: 60000 })
  const klinikNotu = new URL(S.url()).searchParams.get('not')
  await S.click('[data-eylem=onayla]'); await S.waitForSelector('[data-bolum=s]', { timeout: 30000 })
  // a second visit of the same patient whose note stays a DRAFT: no share and no cover may ever show it
  await git(S, `/visit?hasta=${paylasilan}`)
  await S.waitForSelector('input[name=riza]'); await S.click('input[name=riza]')
  await S.waitForFunction(() => !document.querySelector('.uza-form button.uza-dugme').disabled)
  await S.click('.uza-form button.uza-dugme'); await S.waitForSelector('.uza-sure', { timeout: 20000 }); await bekle(2600)
  await S.click('.uza-kayit .uza-dugme')
  await S.waitForFunction(() => new URLSearchParams(location.search).has('not'), { timeout: 120000 })
  await S.waitForSelector('#uza-not-s', { timeout: 60000 })
  const taslakNot = new URL(S.url()).searchParams.get('not')
  let sure = 30
  if (P.randevu) {
    sure = (await api(S, '/api/ulke/calisma-duzeni')).j.sureSecenekleri[0]
    const rnd = await api(S, '/api/ulke/randevu', { method: 'POST', govde: { hastaId: paylasilan, gun: yarin, saat: '10:00', sureDk: sure, neden: 'QA-REASON-PRIVATE', yineDe: true } })
    kontrol('the owner\'s own patients, an approved note, a draft and an appointment with a reason exist (the doctor\'s own routes, unchanged)', !!paylasilan && !!ozel && !!hekimHastasi && !!klinikNotu && !!taslakNot && taslakNot !== klinikNotu && rnd.s === 200, `${rnd.s} ${rnd.t}`)
  } else kontrol('the owner\'s own patients, an approved note and a draft exist (the doctor\'s own routes, unchanged)', !!paylasilan && !!ozel && !!hekimHastasi && !!klinikNotu && !!taslakNot && taslakNot !== klinikNotu)

  // ── 6g. A POSITION ALONE OPENS NO PATIENT: before any permission is given, every member is answered "does not exist" ──
  {
    const once = JSON.stringify(await tabloOku('ulke_klinik_erisim_kayitlari'))
    const c = []
    for (const p of [H, M, F, D]) {
      c.push(await api(p, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${paylasilan}`), await api(p, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${paylasilan}&kart=1`), await api(p, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&q=QA-CLINIC`))
      c.push(await api(p, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&q=QA-CLINIC`), await api(p, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&hasta=${paylasilan}`))
      c.push(await api(p, '/api/ulke/klinik/on-buro', { method: 'POST', govde: { hekimId: KL.sahip, islem: 'hasta', ad: 'QA-CLINIC Intruder', dil: P.hastaDilleri[0] } }))
      if (P.randevu) c.push(await api(p, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&gun=${yarin}`), await api(p, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&gun=${yarin}`), await api(p, '/api/ulke/klinik/on-buro', { method: 'POST', govde: { hekimId: KL.sahip, islem: 'randevu', hastaId: paylasilan, gun: yarin, saat: '15:00', sureDk: sure, yineDe: true } }))
      if (P.portal) c.push(await api(p, '/api/ulke/klinik/on-buro', { method: 'POST', govde: { hekimId: KL.sahip, islem: 'portal', hastaId: paylasilan } }))
      // … and the doctor's own routes, with the owner's patient id
      c.push(await api(p, `/api/ulke/hasta?id=${paylasilan}`), await api(p, `/api/ulke/not?id=${klinikNotu}`))
    }
    kontrol(`A POSITION ALONE OPENS NO PATIENT: a doctor, an allied professional and the front desk of the same clinic, and the owner of another, are each answered exactly "does not exist" on ${c.length} requests about the owner's patient — and nothing was written, not even to the record`, yokMu(...c) && JSON.stringify(await tabloOku('ulke_klinik_erisim_kayitlari')) === once && (await tabloOku('ulke_hastalar')).every((h) => h.doctor_id !== KL.sahip || [paylasilan, ozel].includes(h.id)), [...new Set(c.map((r) => `${r.s} ${r.t}`))].join(' | '))
    // the OWNER of the clinic and another doctor's patient: the owner's position opens nothing either
    const s = [await api(S, `/api/ulke/klinik/paylasilan?hekim=${KL.hekim}&hasta=${hekimHastasi}`), await api(S, `/api/ulke/klinik/paylasilan?hekim=${KL.hekim}&q=QA-CLINIC`), await api(S, `/api/ulke/klinik/on-buro?hekim=${KL.hekim}&q=QA-CLINIC`), await api(S, `/api/ulke/hasta?id=${hekimHastasi}`)]
    const adina = await api(S, '/api/ulke/klinik/yetki', { method: 'POST', govde: { hekimId: KL.hekim, alanId: KL.onBuro, tur: 'on-buro-hasta' } })
    kontrol(`the clinic's OWNER and a member doctor's patient: "does not exist" by position; and a permission entered on that doctor's behalf is ${K.sahipHekimAdinaVerebilir ? 'accepted (the pack allows it, a lawyer is named)' : 'refused (the pack does not allow it)'}`, yokMu(...s) && (K.sahipHekimAdinaVerebilir ? adina.s === 200 || adina.s === 409 : adina.s === 403 && adina.t === '{"code":"YETKI_YOK"}'), `${adina.s} ${adina.t}`)
    if (P.randevu) {
      const t = await api(S, `/api/ulke/klinik/takvim?gun=${yarin}`)
      const ham = JSON.stringify(t.j)
      kontrol('the clinic\'s schedule (owner): when a member is busy, and nothing of any patient — no name, no id, no reason', t.s === 200 && t.j.dilimler.length === 1 && anahtarlar(t.j.dilimler[0]) === 'baslangic,bitis,durum,gun,hekimId,saat,sureDk' && !ham.includes(paylasilan) && !ham.includes('QA-CLINIC') && !ham.includes('QA-REASON') && yokMu(await api(H, `/api/ulke/klinik/takvim?gun=${yarin}`), await api(F, `/api/ulke/klinik/takvim?gun=${yarin}`)), ham.slice(0, 200))
    }
  }

  // ── 6h. "who can help with my patients": the owner, as a doctor, gives permissions one at a time ──
  await klinikAc(S, 'yetkiler')
  kontrol('permissions: the screen opens in the pack\'s words, with nothing given and an empty record', (await metin(S, '[data-alan=yetkiler-basligi] h1')) === KM.yetki.baslik && (await metin(S, '[data-alan=verilen-yetkiler]')).includes(KM.yetki.verilenBos) && (await metin(S, '[data-alan=erisim-kaydi]')).includes(KM.kayit.bos))
  const turSecenekleri = async () => S.$$eval('[data-alan=yetki-turu] option', (l) => l.map((e) => e.value).filter(Boolean).join())
  const ver = async (alanId, tur, once) => {
    await S.select('[data-alan=yetki-uyesi]', alanId); await S.waitForSelector('[data-alan=yetki-turu]')
    await S.select('[data-alan=yetki-turu]', tur)
    if (once) await once()
    await S.click('[data-eylem=yetki-ver]')
  }
  const verildiMi = (alanId, tur) => S.waitForFunction((t) => !!document.querySelector(`[data-alan=verilen-yetkiler] li[data-tur="${t}"][data-gecerli=evet]`), { timeout: 30000 }, tur).then(() => true, () => false)
  if (BURO_TURLERI.length) {
    await S.select('[data-alan=yetki-uyesi]', KL.onBuro); await S.waitForSelector('[data-alan=yetki-turu]')
    kontrol(`permissions: for the front desk the screen offers exactly the capabilities this pack has for it (${BURO_TURLERI.join(', ')})`, (await turSecenekleri()) === BURO_TURLERI.join())
    if (BURO_PORTAL) {
      await S.select('[data-alan=yetki-turu]', 'on-buro-portal')
      const cumle = await metin(S, '[data-alan=yetki-aciklamasi]')
      const pinSozcugu = (/^[\p{L}\p{N}]+/u.exec(KM.onBuro.pin.trim())?.[0] ?? '').toLocaleLowerCase()
      kontrol('permissions: BEFORE the portal capability is given, the doctor reads the pack\'s plain sentence — the member will see the patient\'s link and PIN', cumle === KM.yetkiAciklama['on-buro-portal'] && pinSozcugu.length > 0 && cumle.toLocaleLowerCase().includes(pinSozcugu), cumle)
      await S.screenshot({ path: join(CIKTI, `genel-${P.kod}-clinic-portal-sentence.png`), fullPage: true })
    }
    let hepsi = true
    for (const t of BURO_TURLERI) { await ver(KL.onBuro, t); hepsi = (await verildiMi(KL.onBuro, t)) && hepsi }
    kontrol('permissions: given to the front desk one at a time; each is a row for THIS doctor, THIS member and this clinic, and each is in the record', hepsi && (await tabloOku('ulke_klinik_yetkileri')).filter((y) => y.alan_id === KL.onBuro).every((y) => y.doctor_id === KL.sahip && y.klinik_id === K1 && y.ulke === P.kod && y.kaydeden_id === KL.sahip && !y.iptal_at) && (await tabloOku('ulke_klinik_erisim_kayitlari')).filter((k) => k.olay === 'verildi' && k.alan_id === KL.onBuro).length === BURO_TURLERI.length)
    await ver(KL.onBuro, BURO_TURLERI[0])
    kontrol('permissions: giving the same one twice changes nothing and says so', (await bilgiBekle(S, KM.yetki.zatenVar)) && (await tabloOku('ulke_klinik_yetkileri')).filter((y) => y.alan_id === KL.onBuro).length === BURO_TURLERI.length)
  }
  if (PAYLASIM) {
    await S.select('[data-alan=yetki-uyesi]', KL.muttefik); await S.waitForSelector('[data-alan=yetki-turu]')
    kontrol('permissions: an allied professional can be given a share of ONE named patient, and nothing else', (await turSecenekleri()) === 'paylasim')
    await ver(KL.muttefik, 'paylasim', async () => {
      await yazDeger(S, '[data-alan=yetki-hasta-arama]', 'QA-CLINIC'); await S.click('[data-eylem=yetki-hasta-ara]')
      await S.waitForSelector('[data-alan=yetki-hastasi]', { timeout: 30000 })
      await S.select('[data-alan=yetki-hastasi]', paylasilan)
    })
    const y = (await verildiMi(KL.muttefik, 'paylasim')) ? (await tabloOku('ulke_klinik_yetkileri')).find((x) => x.tur === 'paylasim') : null
    kontrol('permissions: the share names the patient, and only that one', !!y && y.patient_id === paylasilan && y.alan_id === KL.muttefik && y.doctor_id === KL.sahip && (await metin(S, '[data-alan=verilen-yetkiler] li[data-tur=paylasim]')).includes('QA-CLINIC Shared Patient'))
    const baskasi = await api(S, '/api/ulke/klinik/yetki', { method: 'POST', govde: { alanId: KL.muttefik, tur: 'paylasim', hastaId: hekimHastasi } })
    kontrol('permissions: a doctor cannot share ANOTHER doctor\'s patient — "does not exist"', yokMu(baskasi), `${baskasi.s} ${baskasi.t}`)
  } else if (TUR('paylasim')) {
    const r = await api(S, '/api/ulke/klinik/yetki', { method: 'POST', govde: { alanId: KL.muttefik, tur: 'paylasim', hastaId: paylasilan } })
    kontrol('permissions: a share is refused for a member whose role the pack does not list for it', r.s === 409, `${r.s} ${r.t}`)
  }
  if (VEKALET) {
    await ver(KL.hekim, 'vekalet', async () => { await yazGunAlani(S, '[data-alan=vekalet-bitis]', gunSonra(K.vekaletAzamiGun + 5)) })
    kontrol(`permissions: cover longer than the pack allows (${K.vekaletAzamiGun} days) is refused with the pack's sentence, and nothing is written`, (await hataBekle(S, KM.yetki.hataGecersiz)) && (await tabloOku('ulke_klinik_yetkileri')).every((y) => y.tur !== 'vekalet'))
    await ver(KL.hekim, 'vekalet', async () => { await yazGunAlani(S, '[data-alan=vekalet-bitis]', gunSonra(3)) })
    const y = (await verildiMi(KL.hekim, 'vekalet')) ? (await tabloOku('ulke_klinik_yetkileri')).find((x) => x.tur === 'vekalet') : null
    kontrol('permissions: cover is given to another doctor for a stated period', !!y && y.alan_id === KL.hekim && !!y.baslangic && !!y.bitis && new Date(y.bitis) > new Date(y.baslangic) && !y.patient_id)
  }
  // what the server refuses whatever the screen offers
  {
    const once = JSON.stringify(await tabloOku('ulke_klinik_yetkileri'))
    const r = [
      await api(S, '/api/ulke/klinik/yetki', { method: 'POST', govde: { alanId: KL.diger, tur: 'vekalet', bitisGun: gunSonra(2) } }),      // a doctor of ANOTHER clinic
      await api(D, '/api/ulke/klinik/yetki', { method: 'POST', govde: { alanId: KL.onBuro, tur: 'on-buro-hasta' } }),                       // another clinic's owner, this clinic's front desk
      await api(S, '/api/ulke/klinik/yetki', { method: 'POST', govde: { alanId: KL.onBuro, tur: 'vekalet', bitisGun: gunSonra(2) } }),      // cover to the front desk
      await api(S, '/api/ulke/klinik/yetki', { method: 'POST', govde: { alanId: KL.hekim, tur: 'on-buro-hasta' } }),                        // a front-desk capability to a doctor
      await api(F, '/api/ulke/klinik/yetki', { method: 'POST', govde: { alanId: KL.hekim, tur: 'vekalet', bitisGun: gunSonra(2) } }),       // the front desk gives
      await api(S, '/api/ulke/klinik/yetki', { method: 'POST', govde: { alanId: KL.sahip, tur: 'vekalet', bitisGun: gunSonra(2) } }),       // to oneself
    ]
    kontrol('permissions: refused by the server — to a member of another clinic, by another clinic\'s owner, a capability that does not fit the member\'s position, by the front desk, to oneself — and nothing was written', yokMu(r[0], r[1]) && r.slice(2).every((x) => x.s >= 400 && x.s < 500) && JSON.stringify(await tabloOku('ulke_klinik_yetkileri')) === once, r.map((x) => `${x.s} ${x.t}`).join(' | '))
  }
  await klinikAc(S, 'yetkiler')
  await tara(S, 'clinic: who can help with my patients')
  await S.screenshot({ path: join(CIKTI, `genel-${P.kod}-clinic-permissions.png`), fullPage: true })

  // ── 6i. the front desk at work ──
  if (P.randevu && BURO_RANDEVU) {
    await git(F, '/desk'); await F.waitForSelector('[data-alan=on-buro-hekimi]', { timeout: 60000 })
    kontrol('front desk: the doctor who gave something is offered, with exactly what was given, and the screen says what the desk does not see', (await F.$$eval('[data-alan=on-buro-hekimi] option', (l) => l.map((e) => `${e.value}|${e.innerText.trim()}`).join())) === `${KL.sahip}|${AD.sahip}` && (await F.$$eval('[data-alan=on-buro-yetkileri] li', (l) => l.map((e) => e.getAttribute('data-tur')).join())) === BURO_TURLERI.join() && (await metin(F, '[data-alan=gordugunuz]')) === KM.onBuro.gordugunuz, `${await F.$$eval('[data-alan=on-buro-hekimi] option', (l) => l.map((e) => `${e.value}|${e.innerText.trim()}`).join())} / ${await F.$$eval('[data-alan=on-buro-yetkileri] li', (l) => l.map((e) => e.getAttribute('data-tur')).join())}`)
    await F.waitForSelector('[data-alan=on-buro-randevular] [data-eylem=gun-sonraki]', { timeout: 30000 })
    await F.click('[data-eylem=gun-sonraki]')
    await F.waitForSelector('[data-alan=on-buro-randevular] li[data-randevu]', { timeout: 30000 })
    let g = await govde(F)
    kontrol('front desk: the doctor\'s day — who is coming and when; the REASON of the appointment is not on the screen', g.includes('QA-CLINIC Shared Patient') && (P.saatBicimi === 12 ? /10:00\s?AM/i.test(g) : g.includes('10:00')) && !g.includes('QA-REASON') && !(await F.content()).includes('QA-REASON'))
    const gunCevabi = await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&gun=${yarin}`)
    const aramaCevabi = await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&q=QA-CLINIC`)
    const kartCevabi = await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&hasta=${paylasilan}`)
    kontrol('front desk: THE ANSWERS HOLD THESE FIELDS AND NO OTHER — an appointment: id, patient, name, time, status; a card: id, name, second name, birth date, phone', anahtarlar(gunCevabi.j?.randevular?.[0]) === 'baslangic,bitis,durum,gun,hastaAdi,hastaId,id,mesaiDisi,saat,sureDk' && aramaCevabi.j?.hastalar?.length === 2 && aramaCevabi.j.hastalar.every((h) => anahtarlar(h) === 'ad,dogumTarihi,id,otaIsmi,telefon') && anahtarlar(kartCevabi.j?.hasta) === 'ad,dogumTarihi,id,otaIsmi,telefon', `${anahtarlar(gunCevabi.j?.randevular?.[0])} | ${anahtarlar(aramaCevabi.j?.hastalar?.[0])}`)
    const kisa = await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&q=Q`)
    kontrol('front desk: there is no "all patients" — a search of one character is refused', kisa.s === 400 && kisa.t === '{"code":"ARAMA_KISA"}', `${kisa.s} ${kisa.t}`)
    await yazDeger(F, '[data-alan=on-buro-arama-girdisi]', 'QA-CLINIC'); await F.click('[data-eylem=on-buro-ara]')
    await F.waitForSelector(`[data-alan=on-buro-arama] li[data-hasta="${paylasilan}"]`, { timeout: 30000 })
    await F.click(`[data-alan=on-buro-arama] li[data-hasta="${paylasilan}"] [data-eylem=hasta-sec]`)
    await F.waitForSelector('[data-alan=on-buro-hasta-karti]', { timeout: 30000 })
    const dogum = P.tarihDeseni.replace('DD', '02').replace('MM', '05').replace('YYYY', '1980')
    kontrol(`front desk: the card — name, birth date written the country's way (${dogum}), phone`, (await metin(F, '[data-alan=on-buro-hasta-karti] h2')).includes('QA-CLINIC Shared Patient') && (await metin(F, '[data-alan=kart-bilgisi]')).includes(dogum))
    await F.click('[data-alan=on-buro-randevular] [data-eylem=durum-geldi]')
    kontrol('front desk: "arrived" is marked for the doctor\'s appointment; "done" is not offered and not accepted', (await bilgiBekle(F, KM.onBuro.degistirildi)) && (await tabloOku('ulke_randevulari')).some((r) => r.doctor_id === KL.sahip && r.durum === 'geldi') && !(await F.$('[data-eylem=durum-tamamlandi]')) && (await api(F, '/api/ulke/klinik/on-buro', { method: 'PATCH', govde: { hekimId: KL.sahip, randevuId: gunCevabi.j.randevular[0].id, durum: 'tamamlandi' } })).s >= 400 && (await tabloOku('ulke_randevulari')).every((r) => r.doctor_id !== KL.sahip || r.durum !== 'tamamlandi'))
    await yazGunAlani(F, '[data-alan=randevu-gunu]', yarin); await yazSaatAlani(F, '[data-alan=randevu-saati]', '11:30')
    if (!(await F.$eval('[data-alan=yine-de]', (e) => e.checked))) await F.click('[data-alan=yine-de]')
    await F.click('[data-eylem=on-buro-randevu-al]')
    const alindi = await bilgiBekle(F, KM.onBuro.alindi)
    const yeniRandevu = (await tabloOku('ulke_randevulari')).filter((r) => r.doctor_id === KL.sahip && r.patient_id === paylasilan)
    kontrol('front desk: an appointment is booked FOR THE DOCTOR — the row is the doctor\'s, with no reason', alindi && yeniRandevu.length === 2 && yeniRandevu.every((r) => r.ulke === P.kod) && (await tabloOku('ulke_randevulari')).every((r) => r.doctor_id !== KL.onBuro))
    await F.click('[data-eylem=on-buro-randevu-al]')
    kontrol('front desk: a taken time is refused with the pack\'s sentence (double booking is never overridable)', (await hataBekle(F, P.r.form.dolu)) && (await tabloOku('ulke_randevulari')).filter((r) => r.doctor_id === KL.sahip).length === 2)
    if (BURO_PORTAL) {
      await F.click('[data-eylem=on-buro-portal-ver]')
      await F.waitForSelector('[data-alan=portal-pin]', { timeout: 30000 })
      const pin = await F.$eval('[data-alan=portal-pin]', (e) => e.value), baglanti = await F.$eval('[data-alan=portal-baglanti]', (e) => e.value)
      const erisim = (await tabloOku('ulke_portal_erisimleri')).filter((e) => e.doctor_id === KL.sahip && e.patient_id === paylasilan && !e.iptal_at)
      kontrol('front desk: with the portal capability the link and PIN are made for the doctor\'s patient and shown this once — THE MEMBER SEES BOTH (the doctor was told so); the access is the doctor\'s row, and the making of it is in the doctor\'s record', new RegExp(`^\\d{${P.portal.pinHane}}$`).test(pin) && baglanti.startsWith(TABAN) && baglanti.includes('/portal') && erisim.length === 1 && !JSON.stringify(erisim).includes(pin) && (await metin(F, '[data-alan=yeni-erisim]')).includes(KM.onBuro.portalBirKez) && (await tabloOku('ulke_klinik_erisim_kayitlari')).some((k) => k.ne === 'portal-baglantisi' && k.kisi_id === KL.onBuro && k.doctor_id === KL.sahip && k.patient_id === paylasilan && k.olay === 'yazma'))
    }
    if (BURO_HASTA) {
      kontrol('front desk: the new-patient form has no identity number field', !(await F.$('[data-alan=on-buro-yeni-hasta] input[id*=kimlik], [data-alan=on-buro-yeni-hasta] input[name*=kimlik]')))
      await yazDeger(F, '[data-alan=hasta-adi]', 'QA-CLINIC Desk Created')
      await F.click('[data-eylem=on-buro-hasta-kaydet]')
      const kaydedildi = await bilgiBekle(F, KM.onBuro.hastaKaydedildi)
      const satirlar = await tabloOku('ulke_hastalar')
      kontrol('front desk: a patient is created FOR THE DOCTOR — the row is the doctor\'s, never the desk\'s own, and the name is encrypted', kaydedildi && satirlar.filter((h) => h.doctor_id === KL.sahip).length === 3 && satirlar.every((h) => h.doctor_id !== KL.onBuro) && !JSON.stringify(satirlar).includes('QA-CLINIC'))
    }
    // what the front desk is never answered, whatever it asks
    const c = [await api(F, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${paylasilan}`), await api(F, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&q=QA-CLINIC`), await api(F, `/api/ulke/hasta?id=${paylasilan}`), await api(F, `/api/ulke/not?id=${klinikNotu}`), await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.hekim}&q=QA-CLINIC`), await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&hasta=${hekimHastasi}`), await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.diger}&q=QA`)]
    const kendi = await api(F, '/api/ulke/klinik/kayit')
    kontrol('front desk: no note, no file, no patient of a doctor who gave nothing, no patient of another clinic — "does not exist"; and it reads no record', yokMu(...c) && kendi.s === 200 && JSON.stringify(kendi.j) === '{"kayitlar":[]}', c.map((r) => r.s).join(' '))
    await tara(F, 'front desk: at work')
    await F.screenshot({ path: join(CIKTI, `genel-${P.kod}-clinic-desk.png`), fullPage: true })
    await F.setViewport({ width: TEL.genislik, height: TEL.yukseklik, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
    await git(F, '/desk'); await F.waitForSelector('[data-alan=on-buro-hekimi]', { timeout: 60000 })
    kontrol('front desk: on a phone-sized screen the page does not scroll sideways', (await F.evaluate(() => document.documentElement.scrollWidth)) <= TEL.genislik + 1, String(await F.evaluate(() => document.documentElement.scrollWidth)))
    await F.screenshot({ path: join(CIKTI, `genel-${P.kod}-clinic-desk-phone.png`), fullPage: true })
    await F.setViewport({ width: MASA.genislik, height: MASA.yukseklik, deviceScaleFactor: 1 })
  }

  // ── 6j. the allied professional: one patient's approved notes, read-only ──
  if (PAYLASIM) {
    await klinikAc(M, 'paylasilan')
    await M.waitForSelector('[data-alan=paylasilanlar] li[data-paylasilan=paylasim]', { timeout: 30000 })
    await M.waitForFunction(() => document.querySelector('[data-alan=paylasilanlar] li')?.innerText.includes('QA-CLINIC Shared Patient'), { timeout: 30000 })
    kontrol('share: the allied professional sees the one shared patient, and whose patient it is', (await M.$$('[data-alan=paylasilanlar] li')).length === 1 && (await metin(M, '[data-alan=paylasilanlar] li')).includes(AD.sahip))
    await M.click('[data-alan=paylasilanlar] [data-eylem=paylasilani-ac]')
    await M.waitForSelector('[data-alan=paylasilan-notlar] article[data-not]', { timeout: 30000 })
    const notlar = await M.$$eval('[data-alan=paylasilan-notlar] article[data-not]', (l) => l.map((e) => e.getAttribute('data-not')))
    kontrol('share: the patient\'s APPROVED note is shown under "read only" — the draft is not, and the section holds nothing to type into or press', JSON.stringify(notlar) === JSON.stringify([klinikNotu]) && (await metin(M, '[data-alan=paylasilan-notlar] [data-alan=salt-okunur]')) === KM.paylasilan.saltOkunur && (await metin(M, '[data-alan=paylasilan-notlar] [data-bolum=s]')).startsWith('SYNTHETIC-S') && (await M.$$('[data-alan=paylasilan-notlar] input, [data-alan=paylasilan-notlar] textarea, [data-alan=paylasilan-notlar] select, [data-alan=paylasilan-notlar] button')).length === 0, notlar.join(' '))
    const nc = await api(M, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${paylasilan}`)
    kontrol('share: THE ANSWER HOLDS the patient as id, name, second name, birth date (no phone), and each note as its approved content', anahtarlar(nc.j?.hasta) === 'ad,dogumTarihi,id,otaIsmi' && nc.j.notlar.length === 1 && anahtarlar(nc.j.notlar[0]) === 'alanAnahtarlari,dil,icerik,muayeneTarihi,notId,onayTarihi,sablon' && !JSON.stringify(nc.j).includes(taslakNot), anahtarlar(nc.j?.notlar?.[0]))
    const c = [await api(M, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${ozel}`), await api(M, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${ozel}&kart=1`), await api(M, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&q=QA-CLINIC`), await api(M, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&q=QA-CLINIC`), await api(M, `/api/ulke/hasta?id=${paylasilan}`), await api(M, `/api/ulke/not?id=${klinikNotu}`), ...(P.randevu ? [await api(M, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&gun=${yarin}`)] : [])]
    const yaz = [await api(M, '/api/ulke/klinik/paylasilan', { method: 'POST', govde: { hekim: KL.sahip, hasta: paylasilan } }), await api(M, '/api/ulke/muayene', { method: 'POST', govde: { yol: `${P.kod}/${KL.muttefik}/none.webm`, hastaId: paylasilan, sablon: P.genelSablon, riza: true } }), await api(M, '/api/ulke/not', { method: 'PATCH', govde: { notId: klinikNotu, dil: P.dil, s: 'CHANGED-BY-ALLIED', o: '', a: '', p: '' } })]
    kontrol('share: the doctor\'s OTHER patient, a search, the appointments, the doctor\'s own routes — "does not exist"; there is no way to write (no such method; the doctor\'s routes do not open by a share)', yokMu(...c) && yaz.every((r) => r.s >= 400) && !JSON.stringify(await tabloOku('ulke_notlar')).includes('CHANGED-BY-ALLIED') && (await tabloOku('ulke_muayeneler')).every((m) => m.doctor_id !== KL.muttefik), [...c, ...yaz].map((r) => r.s).join(' '))
    await tara(M, 'clinic: a shared patient')
    await M.screenshot({ path: join(CIKTI, `genel-${P.kod}-clinic-share.png`), fullPage: true })
  }

  // ── 6k. cover: another doctor, for the stated period, read-only ──
  if (VEKALET) {
    await klinikAc(H, 'paylasilan')
    await H.waitForSelector('[data-alan=paylasilanlar] li[data-paylasilan=vekalet]', { timeout: 30000 })
    await H.click('[data-alan=paylasilanlar] [data-eylem=paylasilani-ac]')
    await H.waitForSelector('[data-alan=vekalet-hasta-arama]', { timeout: 30000 })
    await yazDeger(H, '[data-alan=vekalet-arama]', 'QA-CLINIC'); await H.click('[data-eylem=vekalet-ara]')
    await H.waitForSelector('[data-alan=vekalet-hasta-arama] [data-eylem=vekalet-hasta-ac]', { timeout: 30000 })
    const bulunan = (await metin(H, '[data-alan=vekalet-hasta-arama]'))
    kontrol('cover: the covering doctor finds the covered doctor\'s patients by name, under "read only"', bulunan.includes('QA-CLINIC Shared Patient') && bulunan.includes('QA-CLINIC Private Patient') && !bulunan.includes('Doctor Two Patient') && (await metin(H, '[data-alan=vekalet-hasta-arama] [data-alan=salt-okunur]')) === KM.paylasilan.saltOkunur)
    const sira = await H.$$eval('[data-alan=vekalet-hasta-arama] li', (l) => l.findIndex((e) => e.innerText.includes('Shared Patient')))
    await (await H.$$('[data-alan=vekalet-hasta-arama] [data-eylem=vekalet-hasta-ac]'))[sira].click()
    await H.waitForSelector('[data-alan=paylasilan-notlar] article[data-not]', { timeout: 30000 })
    kontrol('cover: a patient\'s approved note is read; the draft is not shown', JSON.stringify(await H.$$eval('[data-alan=paylasilan-notlar] article[data-not]', (l) => l.map((e) => e.getAttribute('data-not')))) === JSON.stringify([klinikNotu]))
    if (P.randevu) kontrol('cover: the covered doctor\'s appointments are listed', !!(await H.$('[data-alan=vekalet-randevular]')))
    const sayilar = async () => JSON.stringify([(await tabloOku('ulke_muayeneler')).length, (await tabloOku('ulke_randevulari')).length, (await tabloOku('ulke_hastalar')).length, JSON.stringify(await tabloOku('ulke_notlar')).length])
    const once = await sayilar()
    const yaz = [
      await api(H, '/api/ulke/muayene', { method: 'POST', govde: { yol: `${P.kod}/${KL.hekim}/none.webm`, hastaId: paylasilan, sablon: P.genelSablon, riza: true } }),
      await api(H, '/api/ulke/not', { method: 'PATCH', govde: { notId: taslakNot, dil: P.dil, s: 'CHANGED-UNDER-COVER', o: '', a: '', p: '' } }),
      await api(H, '/api/ulke/not/onayla', { method: 'POST', govde: { notId: taslakNot } }),
      await api(H, `/api/ulke/hasta?id=${paylasilan}`),
      ...(P.randevu ? [await api(H, '/api/ulke/randevu', { method: 'POST', govde: { hastaId: paylasilan, gun: yarin, saat: '16:00', sureDk: sure, yineDe: true } })] : []),
      ...(P.portal ? [await api(H, '/api/ulke/hasta-portali', { method: 'POST', govde: { hastaId: paylasilan } })] : []),
      await api(H, '/api/ulke/klinik/paylasilan', { method: 'POST', govde: { hekim: KL.sahip, hasta: paylasilan } }),
    ]
    kontrol('cover is READ-ONLY: a visit, a change to a note, an approval, the patient\'s file, an appointment, a portal link — the doctor\'s own routes do not open by cover, and nothing was written', yaz.every((r) => r.s >= 400) && (await sayilar()) === once && !JSON.stringify(await tabloOku('ulke_notlar')).includes('CHANGED-UNDER-COVER') && !(await tabloOku('ulke_notlar')).find((n) => n.id === taslakNot)?.approved_at, yaz.map((r) => r.s).join(' '))
    await tara(H, 'clinic: cover')
    await H.screenshot({ path: join(CIKTI, `genel-${P.kod}-clinic-cover.png`), fullPage: true })
  }

  // ── 6l. THE RECORD: the doctor reads who did what about their patients; nobody else reads it ──
  {
    await klinikAc(S, 'yetkiler')
    await S.waitForSelector('[data-alan=erisim-kaydi] li', { timeout: 30000 })
    const satirlar = await S.$$eval('[data-alan=erisim-kaydi] li', (l) => l.map((e) => e.innerText.replace(/\s+/g, ' ')))
    const kayitlar = await tabloOku('ulke_klinik_erisim_kayitlari')
    const bekle_ = [
      ...(P.randevu && BURO_RANDEVU ? [[AD.onBuro, KM.kayit.ne['hasta-arama']], [AD.onBuro, KM.kayit.ne['randevu-olusturma']], [AD.onBuro, KM.kayit.ne['randevu-degisiklik']]] : []),
      ...(P.randevu && BURO_RANDEVU && BURO_PORTAL ? [[AD.onBuro, KM.kayit.ne['portal-baglantisi']]] : []),
      ...(PAYLASIM ? [[AD.muttefik, KM.kayit.ne['not-listesi']]] : []),
      ...(VEKALET ? [[AD.hekim, KM.kayit.ne['hasta-arama']], [AD.hekim, KM.kayit.ne['not-listesi']]] : []),
    ]
    const eksik = bekle_.filter(([kim, ne]) => !satirlar.some((s) => s.includes(kim) && s.includes(ne)))
    kontrol(`the record: the doctor reads, in the pack's words, who was given what and who read or wrote what (${satirlar.length} lines on the screen for ${kayitlar.length} rows)`, eksik.length === 0 && satirlar.length === Math.min(kayitlar.filter((k) => k.doctor_id === KL.sahip).length, 200) && satirlar.some((s) => s.includes('QA-CLINIC Shared Patient')), eksik.map((x) => x.join(': ')).join(' | '))
    kontrol('the record: every row is the owning doctor\'s, names who acted and carries this country; a read or a write names what', kayitlar.length > 5 && kayitlar.every((k) => k.ulke === P.kod && k.doctor_id === KL.sahip && !!k.kisi_id && !!k.alan_id && (['okuma', 'yazma'].includes(k.olay) ? !!k.ne : k.ne == null)))
    const digerleri = [await api(H, '/api/ulke/klinik/kayit'), await api(M, '/api/ulke/klinik/kayit'), await api(F, '/api/ulke/klinik/kayit'), await api(D, '/api/ulke/klinik/kayit')]
    kontrol('the record: no other member, and no other clinic\'s owner, reads a line of it (each reads their own, which is empty)', digerleri.every((r) => r.s === 200 && JSON.stringify(r.j) === '{"kayitlar":[]}'))
    const sil = await fetch(`${SUPA}/rest/v1/ulke_klinik_erisim_kayitlari?ulke=eq.${P.kod}&doctor_id=eq.${KL.sahip}`, { method: 'DELETE', headers: { Authorization: 'Bearer sahte-servis' } })
    const degis = await fetch(`${SUPA}/rest/v1/ulke_klinik_erisim_kayitlari?ulke=eq.${P.kod}&doctor_id=eq.${KL.sahip}`, { method: 'PATCH', headers: { Authorization: 'Bearer sahte-servis', 'Content-Type': 'application/json' }, body: JSON.stringify({ ne: 'baska' }) })
    kontrol('the record: a row is neither deleted nor changed, even by a statement with the server\'s own key (the stand-in holds the trigger of migration 145)', sil.status === 409 && degis.status === 409 && (await tabloOku('ulke_klinik_erisim_kayitlari')).length === kayitlar.length, `${sil.status} ${degis.status}`)
    await S.screenshot({ path: join(CIKTI, `genel-${P.kod}-clinic-record.png`), fullPage: true })
  }

  // ── 6m. the other clinic sees nothing of this one ──
  {
    const kendi = await api(D, '/api/ulke/klinik')
    const ham = JSON.stringify(kendi.j)
    const c = [
      await api(D, '/api/ulke/klinik/uye', { method: 'DELETE', govde: { hesapId: KL.onBuro } }), await api(D, '/api/ulke/klinik/uye', { method: 'PATCH', govde: { hesapId: KL.hekim, konum: 'yonetici' } }),
      await api(D, '/api/ulke/klinik/davet', { method: 'DELETE', govde: { davetId: iptalDavetId } }),
      await api(D, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&q=QA-CLINIC`), await api(D, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${paylasilan}`),
      ...((await tabloOku('ulke_klinik_yetkileri')).slice(0, 2).map((y) => api(D, '/api/ulke/klinik/yetki', { method: 'DELETE', govde: { yetkiId: y.id } }))),
    ]
    const cc = await Promise.all(c)
    const dy = await api(D, '/api/ulke/klinik/yetki')
    kontrol('ANOTHER CLINIC: its owner sees its own clinic and nobody of the first; removing or promoting a member, withdrawing an invitation or a permission, and every patient route of the first clinic answer "does not exist"', kendi.s === 200 && kendi.j.klinik?.ad === 'QA Clinic Two' && kendi.j.klinik.uyeler.length === 1 && !ham.includes('QA Clinic One') && [KL.sahip, KL.hekim, KL.muttefik, KL.onBuro].every((id) => !ham.includes(id)) && yokMu(...cc) && JSON.stringify(dy.j) === '{"verilen":[],"alinan":[]}' && (await tabloOku('ulke_klinik_uyeleri')).filter((u) => u.klinik_id === K1).length === 4, cc.map((r) => r.s).join(' '))
  }

  // ── 6n. withdrawn, moved, removed: a permission ends AT ONCE ──
  if (P.randevu && BURO_RANDEVU) {
    await klinikAc(S, 'yetkiler')
    await S.waitForSelector('[data-alan=verilen-yetkiler] li[data-tur=on-buro-randevu] [data-eylem=yetki-geri-al]', { timeout: 30000 })
    const onceKayit = (await tabloOku('ulke_klinik_erisim_kayitlari')).length
    await S.click('[data-alan=verilen-yetkiler] li[data-tur=on-buro-randevu] [data-eylem=yetki-geri-al]')
    const geri = await bilgiBekle(S, KM.yetki.geriAlindi)
    const sonra = [await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&gun=${yarin}`), await api(F, `/api/ulke/klinik/on-buro?hekim=${KL.sahip}&q=QA-CLINIC`), await api(F, '/api/ulke/klinik/on-buro', { method: 'POST', govde: { hekimId: KL.sahip, islem: 'randevu', hastaId: paylasilan, gun: yarin, saat: '17:00', sureDk: sure, yineDe: true } })]
    kontrol('WITHDRAWN: the front desk\'s very next request for the doctor\'s day, a patient or a booking is "does not exist"; the withdrawal is in the record and the refused requests are not', geri && yokMu(...sonra) && (await tabloOku('ulke_klinik_erisim_kayitlari')).length === onceKayit + 1 && (await tabloOku('ulke_klinik_erisim_kayitlari')).at(-1).olay === 'geri-alindi', sonra.map((r) => r.s).join(' '))
    await git(F, '/desk'); await F.waitForSelector('[data-alan=on-buro-hekim]', { timeout: 60000 })
    await F.waitForFunction(() => !!document.querySelector('[data-alan=on-buro-yetkileri], [data-alan=hekim-yok]'), { timeout: 30000 })
    kontrol('WITHDRAWN: the workspace no longer draws the day or the search', !(await F.$('[data-alan=on-buro-randevular]')) && !(await F.$('[data-alan=on-buro-arama]')) && !(await F.$('[data-alan=on-buro-yetkileri] li[data-tur=on-buro-randevu]')))
  }
  if (PAYLASIM) {
    await klinikAc(S)
    await S.waitForSelector(`li[data-uye="${KL.muttefik}"] [data-eylem=konum-degistir]`, { timeout: 30000 })
    await S.select(`li[data-uye="${KL.muttefik}"] [data-eylem=konum-degistir]`, 'hekim')
    const degisti = await bilgiBekle(S, KM.klinik.degistirildi)
    const y = (await tabloOku('ulke_klinik_yetkileri')).find((x) => x.tur === 'paylasim')
    kontrol('A POSITION IS CHANGED: every permission of that member ends at once — the share is withdrawn, the record says "ended", and the next read is "does not exist"', degisti && !!y?.iptal_at && (await tabloOku('ulke_klinik_erisim_kayitlari')).some((k) => k.olay === 'bitti' && k.yetki_id === y.id && k.kisi_id === KL.sahip) && yokMu(await api(M, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${paylasilan}`), await api(M, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${paylasilan}&kart=1`)) && (await metin(S, '[data-alan=klinik-uyeler]')).includes(KM.klinik.konumUyari))
  }
  {
    await klinikAc(S)
    await S.waitForSelector(`li[data-uye="${KL.hekim}"] [data-eylem=uye-cikar]`, { timeout: 30000 })
    const kayitOnce = (await tabloOku('ulke_klinik_erisim_kayitlari')).filter((k) => k.kisi_id === KL.hekim).length
    await S.click(`li[data-uye="${KL.hekim}"] [data-eylem=uye-cikar]`)
    await S.waitForSelector(`li[data-uye="${KL.hekim}"] [role=alertdialog]`, { timeout: 30000 })
    const soruldu = (await metin(S, `li[data-uye="${KL.hekim}"] [role=alertdialog]`)).includes(KM.klinik.cikarOnay.replace('%', AD.hekim))
    await S.click(`li[data-uye="${KL.hekim}"] [data-eylem=cikar-onayla]`)
    const cikti = await bilgiBekle(S, KM.klinik.cikarildi)
    const hk = await api(H, '/api/ulke/klinik')
    kontrol('A MEMBER IS REMOVED (asked first, in the pack\'s words): the membership row is gone and every permission given by or to that member with it; cover opens nothing from the next request; the removed account is in no clinic; what it read STAYS in the doctor\'s record', soruldu && cikti && (await tabloOku('ulke_klinik_uyeleri')).every((u) => u.doctor_id !== KL.hekim) && (await tabloOku('ulke_klinik_yetkileri')).every((y) => y.alan_id !== KL.hekim && y.doctor_id !== KL.hekim) && yokMu(await api(H, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&q=QA-CLINIC`), await api(H, `/api/ulke/klinik/paylasilan?hekim=${KL.sahip}&hasta=${paylasilan}`)) && hk.j.klinik === null && (await tabloOku('ulke_klinik_erisim_kayitlari')).filter((k) => k.kisi_id === KL.hekim).length === kayitOnce && (!VEKALET || kayitOnce > 0))
    const hastasi = await api(H, `/api/ulke/hasta?id=${hekimHastasi}`)
    kontrol('the removed doctor keeps their own patients: leaving a clinic takes no patient from anybody', hastasi.s === 200 && hastasi.j?.hasta?.id === hekimHastasi)
  }

  // ── 6o. the shared database ──
  {
    const tablolar = ['ulke_klinikler', 'ulke_klinik_uyeleri', 'ulke_klinik_davetleri', 'ulke_klinik_yetkileri', 'ulke_klinik_erisim_kayitlari']
    const yabanci = []
    let toplam = 0
    for (const ad of tablolar) for (const s of await tabloOku(ad)) { toplam++; if (s.ulke !== P.kod) yabanci.push(`${ad}:${s.ulke}`) }
    kontrol(`clinic accounts: every row carries this country's code (${toplam} rows in ${tablolar.length} tables)`, toplam > 15 && yabanci.length === 0, yabanci.join(' '))
    const istekler = (await (await fetch(`${SUPA}/__gunluk`)).json()).filter((x) => /ulke_klinik/.test(x))
    kontrol(`clinic accounts: every statement the server sent about a clinic named the country (${istekler.length} statements)`, istekler.length > 50 && istekler.every((x) => /\/rpc\//.test(x) || x.startsWith('POST ') || /[?&]ulke=eq\.[a-z]{2}(&|$)/.test(x)))
  }
  for (const p of [S, D, H, M, F]) await p.close()
}

await tarayici.close()
const kalan = sonuc.filter((x) => !x.tamam)
console.log(`\n${sonuc.length - kalan.length}/${sonuc.length} checks passed — country "${P.kod}"`)
if (kalan.length) { console.log('FAILED:'); for (const x of kalan) console.log(`  - ${x.ad}${x.ayrinti ? ' — ' + String(x.ayrinti).slice(0, 300) : ''}`) }
process.exit(kalan.length ? 1 : 0)
