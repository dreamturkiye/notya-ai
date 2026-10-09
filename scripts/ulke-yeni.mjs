#!/usr/bin/env node
/**
 * NOTYA-ULKE-SABLON-01 — START A NEW COUNTRY. `npm run ulke:yeni -- <code> --dil <language> --yol </path>`
 *
 *   node scripts/ulke-yeni.mjs gb --dil en --yol /uk
 *
 *   <code>   ISO 3166-1 alpha-2, lower case: the folder countries/<code>/ and the value of NOTYA_COUNTRY
 *   --dil    the country's language as a BCP-47 code (en, en-GB, kk): one language in one script. A second language
 *            or script is added by hand afterwards (docs/COUNTRY-PACK-HOWTO.md, "More than one language")
 *   --yol    the path of the main site the country is served under (/uk). "/" = an address of its own (the domain root)
 *   --kok    another repository root (tests, and the scaffold proof in a temporary copy)
 *
 * WHAT IT DOES
 *   1. Writes countries/<code>/ — a COMPLETE pack in shape, with every piece of content as eksik('…') and every
 *      setting that needs a decision as eksikAyar('…') (lib/ulke/eksik.ts). The shape of the catalogues comes from
 *      scripts/ulke-sablon/sekil.json; no text of any other country is copied.
 *   2. Registers the code where a country must be named: lib/ulke/tipler.ts (ULKE_KODLARI, and DilKodu if the
 *      language is new), the three doors countries/active/{index,klinik,arayuz}.ts, and countries/tumu.ts.
 *   3. Writes docs/COUNTRY-PACK-<CODE>.md from docs/COUNTRY-PACK-CHECKLIST.md, every gate unticked.
 *
 * WHAT THE NEW COUNTRY IS, THE MOMENT IT EXISTS
 *   - It CANNOT BE BUILT: `NOTYA_COUNTRY=<code> npm run build:ulke` stops at once and prints every item still to supply
 *     (file, line, hint). Nothing falls back to another country.
 *   - Sign-up is CLOSED (invitation only) and the site is HIDDEN from search. Both are settings of the pack that
 *     only the owner opens (docs/COUNTRY-PACK-HOWTO.md).
 *   - Every other country is untouched: a build holds one pack.
 *
 * It changes files in the repository and nothing else: no database, no deployment, no setting anywhere.
 *
 * THE COUNTRY'S OWN DATABASE is not made here. One database per country (Kaan, 2026-10-09): the owner creates a new,
 * empty one, and the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql) is run on it once — never on the Turkish
 * database, never on another country's. The record this command writes carries those steps as section M, unticked,
 * and the command prints them (docs/COUNTRY-PACK-DB-ROLLOUT.md).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BURASI = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const al = (ad) => (argv.includes(ad) ? argv[argv.indexOf(ad) + 1] : null)
const dur = (mesaj) => { console.error(`[ulke-yeni] ${mesaj}`); process.exit(1) }

const KOD = argv[0]
const DIL = al('--dil')
const YOL_HAM = al('--yol')
const KOK = resolve(al('--kok') || join(BURASI, '..'))
if (!KOD || KOD.startsWith('-') || !DIL || YOL_HAM === null) dur('usage: node scripts/ulke-yeni.mjs <code> --dil <language> --yol </path>     e.g.  gb --dil en --yol /uk')
if (!/^[a-z]{2}$/.test(KOD)) dur(`"${KOD}" is not a country code: two lower-case letters (ISO 3166-1 alpha-2)`)
if (['active', 'tumu'].includes(KOD)) dur(`"${KOD}" is a reserved name`)
if (!/^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/.test(DIL)) dur(`"${DIL}" is not a language code like en, en-GB or uz-Latn`)
if (!/^\/([a-z0-9][a-z0-9-]*)?$/.test(YOL_HAM)) dur(`"${YOL_HAM}" is not a path: "/" for the domain root, or one segment like "/uk"`)
const YOL = YOL_HAM === '/' ? '' : YOL_HAM
const B = KOD.toUpperCase()
const TEMEL = DIL.split('-')[0]
const DIL_SABITI = DIL.replace(/-/g, '_').toUpperCase()
const dizin = join(KOK, 'countries', KOD)
if (existsSync(dizin)) dur(`countries/${KOD}/ already exists. Nothing was changed.`)

const oku = (g) => readFileSync(join(KOK, g), 'utf8')
const sekil = JSON.parse(readFileSync(join(BURASI, 'ulke-sablon', 'sekil.json'), 'utf8'))
const ipucuDosyasi = join(BURASI, 'ulke-sablon', 'ipuclari.json')
const IPUCLARI = existsSync(ipucuDosyasi) ? JSON.parse(readFileSync(ipucuDosyasi, 'utf8')) : {}

// ───────────────────────── registration: check every anchor BEFORE anything is written ─────────────────────────
const kayitlar = []
function degistir(goreli, desen, yeni, ne) {
  const eski = oku(goreli)
  if (!desen.test(eski)) dur(`${goreli}: could not find ${ne}. The file changed shape; register "${KOD}" there by hand, or update scripts/ulke-yeni.mjs. Nothing was changed.`)
  kayitlar.push([goreli, desen, yeni])
}
const tipler = oku('lib/ulke/tipler.ts')
if (new RegExp(`ULKE_KODLARI = \\[[^\\]]*'${KOD}'`).test(tipler)) dur(`"${KOD}" is already in ULKE_KODLARI (lib/ulke/tipler.ts). Nothing was changed.`)
degistir('lib/ulke/tipler.ts', /(export const ULKE_KODLARI = \[[^\]]*)(\] as const)/, `$1, '${KOD}'$2`, 'ULKE_KODLARI')
const dilVar = new RegExp(`export type DilKodu = [^\\n]*'${DIL}'`).test(tipler)
if (!dilVar) degistir('lib/ulke/tipler.ts', /(export type DilKodu = [^\n]+)/, `$1 | '${DIL}'`, 'the DilKodu type')
const TR_DALI = /\} else if \(process\.env\.NOTYA_COUNTRY === 'tr' \|\| !process\.env\.NOTYA_COUNTRY\) \{/
for (const [dosya, degisken, modul, ad] of [['index.ts', 'paket', 'index', `${B}_PAKETI`], ['klinik.ts', 'klinik', 'klinik/index', `${B}_KLINIK`], ['arayuz.ts', 'arayuz', 'arayuz', `${B}_ARAYUZ`]]) {
  degistir(`countries/active/${dosya}`, TR_DALI, `} else if (process.env.NOTYA_COUNTRY === '${KOD}') {\n  ${degisken} = require('../${KOD}/${modul}').${ad}\n$&`, 'the branch of the pre-split application')
}
degistir('countries/tumu.ts', /(\nexport type UlkeKaydi)/, `import { ${B}_PAKETI } from './${KOD}/index'\nimport { ${B}_SIZINTI_HARFLERI, ${B}_SIZINTI_TERIMLERI } from './${KOD}/sizintiTerimleri'\n$1`, 'the UlkeKaydi type')
degistir('countries/tumu.ts', /(export const TUM_ULKELER: Record<UlkeKodu, UlkeKaydi> = \{[\s\S]*?)(\n\})/, `$1\n  ${KOD}: { paket: ${B}_PAKETI, sizintiTerimleri: ${B}_SIZINTI_TERIMLERI, sizintiHarfleri: ${B}_SIZINTI_HARFLERI },$2`, 'TUM_ULKELER')
const kontrolListesi = oku('docs/COUNTRY-PACK-CHECKLIST.md')

// ───────────────────────── catalogues, written from the shape ─────────────────────────
const t = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
const anahtar = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : t(k))
let metinSayisi = 0
function ipucu(bolum, ad, yol, sekilDegeri) {
  const ek = typeof sekilDegeri === 'string' && sekilDegeri.includes(':') ? ` (keep the placeholders ${sekilDegeri.split(':')[1].split(',').join(' ')})` : ''
  const ref = IPUCLARI[bolum]?.[yol.replace(/\[\d+\]/g, '[]')] ?? IPUCLARI[bolum]?.[yol]
  return `${ad}: ${yol}${ref ? ` — ${ref}` : ''}${ek}`
}
function yaz(deger, bolum, ad, yol, girinti) {
  const ic = girinti + '  '
  if (typeof deger === 'string') { metinSayisi++; return `eksik(${t(ipucu(bolum, ad, yol, deger))})` }
  if (Array.isArray(deger)) return `[\n${deger.map((x, i) => `${ic}${yaz(x, bolum, ad, `${yol}[${i}]`, ic)},`).join('\n')}\n${girinti}]`
  if ('$sabit' in deger) return typeof deger.$sabit === 'string' ? t(deger.$sabit) : JSON.stringify(deger.$sabit)
  if ('$capa' in deger) return `CAPA.${deger.$capa}`
  if ('$dil' in deger) {
    // One language in one script: its own name, and nothing to say about scripts or about rewriting into another language.
    if (deger.$dil === 'temel') { metinSayisi++; return `{ ${anahtar(TEMEL)}: eksik(${t(`${ad}: ${yol}.${TEMEL} — what this language is called on the screens`)}) }` }
    return '{}'
  }
  const satirlar = []
  for (const [k, v] of Object.entries(deger)) {
    if (v && typeof v === 'object' && '$istege' in v) satirlar.push(`${ic}// ${anahtar(k)}: '…',   ← ${v.$istege}`)
    else satirlar.push(`${ic}${anahtar(k)}: ${yaz(v, bolum, ad, yol ? `${yol}.${k}` : k, ic)},`)
  }
  return `{\n${satirlar.join('\n')}\n${girinti}}`
}

const YUZEY_ACIKLAMASI = { hesap: 'account messages returned by the server', giris: 'login form', davetliKayit: 'sign-up form', bekletme: 'holding page (not shown while the application is on)', sistem: 'not-found and error pages' }
const cekirdek = Object.entries(sekil.cekirdek).map(([yuzey, anahtarlar]) => {
  const satirlar = anahtarlar.map((k) => { metinSayisi++; return `  ${k}: eksik(${t(ipucu('cekirdek', YUZEY_ACIKLAMASI[yuzey] ?? yuzey, `${yuzey}.${k}`, '$m'))}),` })
  return `export const ${B}_${DIL_SABITI}_${yuzey.replace(/[A-Z]/g, (h) => `_${h}`).toUpperCase()}: YuzeyMetinleri<'${yuzey}'> = {\n${satirlar.join('\n')}\n}`
})
const yuzeySabiti = (y) => `${B}_${DIL_SABITI}_${y.replace(/[A-Z]/g, (h) => `_${h}`).toUpperCase()}`
const YUZEYLER = Object.keys(sekil.cekirdek)

const dosyalar = {}
const BAS = (baslik, govde) => `/**\n * NOTYA-ULKE-SABLON-01 — ${baslik}\n${govde.split('\n').map((s) => ` * ${s}`.trimEnd()).join('\n')}\n */\n`
const SUPPLY = '⟦SUPPLY⟧'

dosyalar['derleme.mjs'] = `${BAS(`${B}: build-level facts. Read by next.config.mjs for a build of this country and by nothing else.`, `Plain data, so the config can load it before anything is compiled. Its one import is the gate every country build
passes (scripts/ulke-derleme-kapisi.mjs): while anything in this folder is still marked "to be supplied", the build of
THIS country stops here with the whole list. Build with:  NOTYA_COUNTRY=${KOD} npm run build:ulke`)}import { ulkeDerlemeKapisi } from '../../scripts/ulke-derleme-kapisi.mjs'

ulkeDerlemeKapisi('${KOD}')

const derleme = {
  kod: '${KOD}',
  saatDilimi: '${SUPPLY} the default IANA time zone of the country, e.g. Europe/London — the SAME value as saatDilimi in ./index.ts',
  bolunmemisUygulama: false,
  // The path of the main site this country is served under ('' = an address of its own). The same value as yolOnEki in ./index.ts.
  yolOnEki: '${YOL}',
  yonlendirmeler: [],
}

export default derleme
`

dosyalar['metinler.ts'] = `${BAS(`${B}: text of the core surfaces (login, sign-up, system pages) in "${DIL}".`, `Typed against the keys every country fills (lib/ulke/tipler.ts → YuzeyAnahtarlari): a missing key does not compile.
Written for this country — never copied from another country's catalogue.`)}import { eksik } from '@/lib/ulke/eksik'
import type { YuzeyMetinleri } from '@/lib/ulke/tipler'

${cekirdek.join('\n\n')}
`

dosyalar['sizintiTerimleri.ts'] = `${BAS(`terms that mark content as ${B}'s. Hunted in every OTHER country's screens by the leak harness`, `(lib/ulke/testing/sizintiTarayici.ts). Tests and scripts only (through countries/tumu.ts), never the running application.
Start with what could not belong to any other country and grow the list with the pack.`)}import { eksik } from '@/lib/ulke/eksik'
import type { SizintiTerimi } from '@/lib/ulke/tipler'

const parca = (terim: string): SizintiTerimi => ({ terim, eslesme: 'parca' })
// const KELIME = (terim: string): SizintiTerimi => ({ terim, eslesme: 'kelime', buyukKucukDuyarli: true })   ← for short all-caps abbreviations

export const ${B}_SIZINTI_TERIMLERI: readonly SizintiTerimi[] = [
  parca(eksik('leak list: the country\\'s name in each of its languages — one parca(…) per spelling')),
  parca(eksik('leak list: the name of its identity number, its currency code and currency word, its health ministry and state health systems, its capital — one entry each')),
]

/**
 * Letters that ONLY this country's languages use, as one string — hunted in every other country's screens.
 * '' = none (a language written in plain Latin letters has none). Not marked "to be supplied" on purpose: other
 * countries' tests read this value, and an unfinished pack must not disturb them. Decide it with the leak list above.
 */
export const ${B}_SIZINTI_HARFLERI = ''
`

dosyalar['index.ts'] = `${BAS(`${B}: the country pack. Record of decisions: docs/COUNTRY-PACK-${B}.md.`, `Everything is OFF unless listed here. Nothing in this folder may come from another country's folder
(scripts/ulke-duvarlari.mjs), and nothing here falls back to another country's content.

Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
eksik(…) = a text still to supply; eksikAyar(…) = a setting still to decide. The country cannot be built while
one is left (docs/COUNTRY-PACK-HOWTO.md lists them in the order to work through).`)}import { eksik, eksikAyar } from '@/lib/ulke/eksik'
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import { ${YUZEYLER.map(yuzeySabiti).join(', ')} } from './metinler'
import { ${B}_ROLLER } from './klinik/roller'
import { ${B}_VELI_YASI } from './ayarlar'

const metin = paketMetinleri({
  acikDiller: ['${DIL}'],
  yuzeyler: [${YUZEYLER.map((y) => `'${y}'`).join(', ')}],
  metinler: {
    ${anahtar(DIL)}: { ${YUZEYLER.map((y) => `${y}: ${yuzeySabiti(y)}`).join(', ')} },
  },
})

export const ${B}_PAKETI: UlkePaketi = {
  kod: '${KOD}',
  // Unique marker: the build proof looks for it to show that a build holds this pack and no other. Never reuse it.
  iz: 'notya-ulke-paketi:${KOD}:${randomBytes(5).toString('hex')}',
  diller: ['${DIL}'],
  acikDiller: metin.acikDiller,
  varsayilanDil: '${DIL}',
  paraBirimi: { kod: eksik('currency: ISO 4217 code, e.g. GBP'), simge: eksik('currency: the symbol or word people write, e.g. £'), ondalikHane: eksikAyar('currency: decimal places shown to people (2 for most, 0 for some)') },
  saatDilimi: eksik('time: the default IANA time zone, e.g. Europe/London — the SAME value as in ./derleme.mjs'),
  bicim: {
    yerel: eksik('format: the Intl locale for dates and numbers, e.g. en-GB'),
    tarihDeseni: eksik('format: how a date is written — DD, MM and YYYY once each with one separator: DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY, YYYY-MM-DD'),
    ondalikAyraci: eksikAyar('format: decimal separator — \\'.\\' or \\',\\''),
    binlikAyraci: eksikAyar('format: thousands separator — \\',\\' or \\'.\\' or \\' \\''),
    haftaBasi: eksikAyar('format: first day of the week on the calendar — 1 (Monday) or 7 (Sunday)'),
  },
  telefon: {
    ulkeOnEki: eksik('phone: the country prefix with the plus sign, e.g. +44'),
    ulusalHane: eksikAyar('phone: digits of a mobile number without the country prefix and without a trunk zero'),
    ornek: eksik('phone: an example mobile number as people write it, with the prefix'),
    cepGecerliMi: eksikAyar('phone: a function (text) => boolean — true for an acceptable mobile number of this country in any common spelling'),
  },
  ulusalKimlik: eksikAyar('identity number: null if the country records none on a patient; otherwise { ad: what people call it, hane: digits, gecerliMi: (text) => boolean }'),
  // Fail closed: what the country kit has built is on; everything else (tools, the assistant, the voice profile,
  // image evaluation) is off for every new country until it is built and reviewed for it.
  ozellikler: {
    acilisSayfasi: true,
    cekirdekGiris: true,
    davetliKayit: true,
    bekletmeSayfasi: true,
    cekirdekMuayene: true,
    randevu: true,
    // The patient's own page: a link and a PIN from the doctor, no account. Nothing is shared or sent by itself.
    hastaPortali: true,
  },
  araclar: [],
  // The ONLY paths that exist in this country's deployment; every other path answers 404 in the middleware.
  rotalar: {
    sayfalar: ['/', '/login', '/signup', '/welcome', '/start', '/today', '/settings', '/patients', '/patients/new', '/patient', '/visit', '/calendar', '/portal'],
    apiOnEkleri: ['/api/ulke/'],
  },
${YOL ? `  yolOnEki: '${YOL}',\n` : ''}  // HIDDEN FROM SEARCH: every new country starts hidden. Only the owner changes this, after the pilot approves the site.
  aramaMotorlarinaGizli: true,
  kabuk: {
    baslik: eksik('shell: the site title in the browser tab'),
    aciklama: eksik('shell: one sentence describing the site, in the country\\'s language'),
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { ${anahtar(DIL)}: eksik('language: what "${DIL}" calls itself, e.g. English') },
  uygulama: {
    diller: ['${DIL}'],
    hastaDilleri: eksikAyar('patients: ISO 639 codes of the languages a patient can be recorded with — each must be a language of dilGruplari below, e.g. [\\'${TEMEL}\\']'),
    // aramaKatla: (text) => text,   ← optional language tool: folding for finding a name across spellings or scripts. Omitted = plain lower case.
    roller: ${B}_ROLLER,
    randevu: {
      varsayilan: eksikAyar('appointments: the working pattern an account starts with — { gunler: [1,2,3,4,5], baslangic: \\'09:00\\', bitis: \\'17:00\\', sureDk: 30, molalar: [{ baslangic: \\'13:00\\', bitis: \\'14:00\\' }] } (1 = Monday); confirm with the local clinical lead'),
      sureSecenekleri: eksikAyar('appointments: the appointment lengths in minutes an account may choose from, e.g. [10, 15, 20, 30, 45, 60]'),
    },
    // The patient portal. The security limits (PIN length, tries, session length) are the kit's and the same everywhere;
    // how long a link stays valid is this country's decision.
    portal: {
      baglantiGecerlilikGun: eksikAyar('patient portal: days a patient\\'s link stays valid before the doctor must give a new one — a whole number from 1 to 365 (a starting value elsewhere: 30). The owner confirms it; how long a patient\\'s access may stand is a question for a lawyer'),
      // LOCAL CONTENT with no default. Confirmed by a local source before any patient sees the portal.
      acilNumara: eksikAyar('patient portal: the number a patient dials for an ambulance, as it is written in this country (a string of digits) — confirmed by a local source; or null, and the patient\\'s page names no number'),
    },
    // One language in one script: no account is asked a language question. A second language or script is added here.
    dilGruplari: [{ temel: '${TEMEL}', bicimler: [{ yazi: null, dil: '${DIL}' }] }],
    saatDilimleri: eksikAyar('time: EVERY IANA time zone an account of this country may work in, the default first — one entry if the country has one zone, e.g. [\\'Europe/London\\']'),
    saatBicimi: eksikAyar('time: how a time of day is written — 24 (14:30) or 12 (2:30 PM)'),
    birimler: {
      agirlik: eksikAyar('units: weight — \\'kg\\' or \\'lb\\''),
      boy: eksikAyar('units: height — \\'cm\\' or \\'in\\''),
      sicaklik: eksikAyar('units: temperature — \\'C\\' or \\'F\\''),
    },
    adAlanlari: { ikinciAd: eksikAyar('names: true if a middle name / patronymic is its own field on the patient form, false if not') },
    kimlikNumarasi: { dogrula: eksikAyar('identity number: true to refuse a value that fails the rule above, false to store it as typed (false if there is no number)') },
    veliYasi: ${B}_VELI_YASI,
    // SIGN-UP IS CLOSED: invitation code only. Only the owner opens it, after section A of the checklist passes.
    kayitAcik: false,
  },
}
`

dosyalar['ayarlar.ts'] = `${BAS(`${B}: the few settings that both the pack's data file (./index.ts) and its clinical half read.`, `One source each, so the setting and the content that follows it cannot drift apart. Plain values.`)}import { eksikAyar } from '@/lib/ulke/eksik'

/**
 * Guardian wording ("who gave the history") for a patient younger than this on the day of the visit, in every role.
 * null = the country has no such rule. A LEGAL FACT of the country (checklist B12): confirm with a lawyer.
 */
export const ${B}_VELI_YASI: number | null = eksikAyar('law: the age below which a patient gets guardian wording ("who gave the history"), e.g. 18 or 16 — or null if the country has no such rule. A legal fact: confirm with a lawyer')
`

dosyalar['arayuz.ts'] = `${BAS(`${B}: what the pack brings for the country kit's shared screens. CONTENT ONLY.`, `Reached only through countries/active/arayuz, read through lib/ulke/arayuz. Each entry points at the file that holds it.`)}import { eksik } from '@/lib/ulke/eksik'
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'
import { ${B}_ACILIS } from './acilis/icerik'
import { ${KOD}AsistanKimligi } from './klinik/asistanlar'
import { ${B}_NOT_SABLONLARI } from './klinik/notSablonlari'
import { ${B}_ROL_TANIMLARI } from './klinik/roller'
import { ${B}_UYGULAMA_METINLERI } from './uygulama/metinler'
import { ${B}_RANDEVU_METINLERI } from './uygulama/randevuMetinleri'
import { ${B}_PORTAL_METINLERI } from './uygulama/portalMetinleri'

export const ${B}_ARAYUZ: UlkeArayuzu = {
  marka: eksik('brand: the word mark the screens show, e.g. Notya'),
  metinler: ${B}_UYGULAMA_METINLERI,
  randevuMetinleri: ${B}_RANDEVU_METINLERI,
  portalMetinleri: ${B}_PORTAL_METINLERI,
  roller: ${B}_ROL_TANIMLARI,
  asistan: ${KOD}AsistanKimligi,
  notSablonlari: ${B}_NOT_SABLONLARI,
  acilis: ${B}_ACILIS,
}
`

dosyalar['uygulama/metinler.ts'] = `${BAS(`${B}: the signed-in application's text in "${DIL}" (first login, settings, home, patients, visit, note).`, `Typed against the kit's keys (lib/ulke/arayuz/metinTipleri.ts): a missing or misspelled key does not compile.
Placeholders inside a sentence are written %, %1, %2, %3 and must stay in the text.`)}import { eksik } from '@/lib/ulke/eksik'
import type { UygulamaMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { DilKodu } from '@/lib/ulke/tipler'

const ${DIL_SABITI}: UygulamaMetni = ${yaz(sekil.uygulama, 'uygulama', 'application', '', '')}

export const ${B}_UYGULAMA_METINLERI: Readonly<Partial<Record<DilKodu, UygulamaMetni>>> = { ${anahtar(DIL)}: ${DIL_SABITI} }
`

dosyalar['uygulama/randevuMetinleri.ts'] = `${BAS(`${B}: the appointment screens' text in "${DIL}" (working pattern, calendar, booking, reminder).`, `Typed against the kit's keys (lib/ulke/arayuz/metinTipleri.ts). Placeholders %, %1, %2, %3 must stay in the text.
The reminder is a text the doctor copies: nothing is sent to anybody automatically.`)}import { eksik } from '@/lib/ulke/eksik'
import type { RandevuMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { DilKodu } from '@/lib/ulke/tipler'

const ${DIL_SABITI}: RandevuMetni = ${yaz(sekil.randevu, 'randevu', 'appointments', '', '')}

export const ${B}_RANDEVU_METINLERI: Readonly<Partial<Record<DilKodu, RandevuMetni>>> = { ${anahtar(DIL)}: ${DIL_SABITI} }
`

dosyalar['uygulama/portalMetinleri.ts'] = `${BAS(`${B}: the PATIENT PORTAL's text in "${DIL}".`, `Typed against the kit's keys (lib/ulke/arayuz/metinTipleri.ts → PortalMetni, where each key says what it is for).
  erisim, ozet, istek   the doctor's controls: access on the patient's file, the summary on an approved note, requests on the calendar
  giris, sayfa          PATIENT-FACING: the PIN page and the patient's own page. A patient reads these alone, on their
                        own phone: a native reader reads them first (checklist E8, E11).
sayfa.acil tells the patient that the page is not for emergencies; sayfa.acilNumara is the sentence that carries the
ambulance number. The NUMBER is never written here: it is the pack's setting (../index.ts, uygulama.portal.acilNumara),
confirmed by a local source, and a sentence with a digit in it fails the pack check. Placeholders %, %1, %2 must stay.`)}import { eksik } from '@/lib/ulke/eksik'
import type { PortalMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { DilKodu } from '@/lib/ulke/tipler'

const ${DIL_SABITI}: PortalMetni = ${yaz(sekil.portal, 'portal', 'patient portal', '', '')}

export const ${B}_PORTAL_METINLERI: Readonly<Partial<Record<DilKodu, PortalMetni>>> = { ${anahtar(DIL)}: ${DIL_SABITI} }
`

dosyalar['acilis/icerik.ts'] = `${BAS(`${B}: the landing page's copy in "${DIL}", and the few facts the shared layout needs.`, `The LAYOUT is the kit's (components/ulke/acilis/): same sections, same order, same look for every country. What the
sections SAY is this country's own marketing copy — written for it, reviewed by a native reader, with no claim the
product cannot keep in this country (no integration claims, no named sources, no public demo).
Lists (bullets, cards, scenes, plans) may be longer or shorter than the template's; every entry must be complete.
Section 10 names the plans; what each costs is DATA (\`fiyatlar\` at the foot of this file), never a number in the copy:
the layout writes each amount with this pack's own number rules. A plan's id ties its copy to its price.`)}import { eksik, eksikAyar } from '@/lib/ulke/eksik'
import type { AcilisIcerigi, UlkeAcilisi } from '@/lib/ulke/arayuz/acilisTipleri'

/** Anchors of the page's sections: one lower-case word each, in the country's language, all different. */
export const CAPA = {
${['ust', 'suhbat', 'qabul', 'portal', 'maslahat', 'jadval', 'yonalish', 'kuzatuv', 'organish', 'xavfsizlik', 'narx', 'sorov'].map((k) => { metinSayisi++; return `  ${k}: eksik(${t(`landing: anchor of the section "${k}" — one lower-case word (letters, digits, hyphens)`)}),` }).join('\n')}
} as const

const ${DIL_SABITI}: AcilisIcerigi = ${yaz(sekil.acilis, 'acilis', 'landing', '', '')}

export const ${B}_ACILIS: UlkeAcilisi = {
  diller: ['${DIL}'],
  icerik: { ${anahtar(DIL)}: ${DIL_SABITI} },
  dilAdlari: { ${anahtar(DIL)}: { ad: eksik('landing: what "${DIL}" calls itself, e.g. English'), kisa: eksik('landing: the same in two or three letters, for the phone-sized language switch, e.g. En') } },
  capalar: CAPA,
  fontHref: eksik('landing: the stylesheet address of the fonts. For a Latin-script language, the layout\\'s two faces: https://fonts.googleapis.com/css2?family=Fraunces:wght@100..900&family=Outfit:wght@100..900&display=swap'),
  markaYazisi: eksik('landing: the word mark as the page writes it, e.g. notya'),
  fiyatlar: eksikAyar('landing: the price list — one entry per plan id of narx.gruplar above and no other: { starter: { aylik: 49, oneCikan: false }, … }. aylik = whole units of the currency for one month, or null where the price is given on request; oneCikan = true for the plan that carries the badge. Amounts are the owner\\'s decision for this country'),
}
`

dosyalar['klinik/roller.ts'] = `${BAS(`${B}: the ROLES an account may work as (doctor specialties, clinic doctors, clinic allied professions).`, `Asked once at first login and stored with the account. A role's key is internal (lower-case words joined by hyphens);
its name is this country's text. \`taraf\` is one of the product's three kinds: 'doktor' | 'klinik-hekim' | 'klinik-muttefik'.
Which roles exist, and what the country officially calls them, is decided with the local clinical lead (checklist C1, J2, J3).`)}import { eksikAyar } from '@/lib/ulke/eksik'
import type { RolTanimi } from '@/lib/ulke/arayuz/tipler'

export const ${B}_ROL_TANIMLARI: readonly RolTanimi[] = eksikAyar('roles: the list — [] to ask for no role, or one { anahtar: \\'cardiology\\', taraf: \\'doktor\\', ad: { ${anahtar(DIL)}: \\'Cardiology\\' } } per role, in the order they are offered')

/** The keys, for the pack's settings (./index.ts → uygulama.roller). Empty until the list above is supplied. */
export const ${B}_ROLLER: readonly string[] = Array.isArray(${B}_ROL_TANIMLARI) ? ${B}_ROL_TANIMLARI.map((r) => r.anahtar) : []
`

dosyalar['klinik/asistanlar.ts'] = `${BAS(`${B}: the ASSISTANT a role works with, as the screens name it.`, `Names are the owner's decision for this country (checklist D1): locally natural, one per role, never another
country's persona. A role without an entry has no assistant and the screens show the neutral line.`)}import { eksikAyar } from '@/lib/ulke/eksik'
import type { UlkeArayuzu } from '@/lib/ulke/arayuz/tipler'

export const ${KOD}AsistanKimligi: UlkeArayuzu['asistan'] = eksikAyar('assistant names: a function (role, form) => { tamAd, kisaAd, makineTuretimi: false } | null — the owner\\'s name for each role\\'s assistant; () => null to show the neutral assistant line for every role')
`

dosyalar['klinik/notSablonlari.ts'] = `${BAS(`${B}: NOTE TEMPLATES, as data. The rules that read them are the kit's (lib/ulke/arayuz/notSablonu.ts).`, `A note always has the four sections (s, o, a, p). A role may add fields of its own; a field is a place for what WAS
SAID at the visit — no normal value, no schedule, no scale, no dose, no protocol. A field of one role is never stored,
returned or drawn for another. Fields per role are decided with that role's local reviewer (checklist C12).`)}import { eksikAyar } from '@/lib/ulke/eksik'
import * as S from '@/lib/ulke/arayuz/notSablonu'
import type { NotSablonVerisi } from '@/lib/ulke/arayuz/tipler'
import { ${B}_ROL_TANIMLARI } from './roller'

/** The neutral template: the four sections and no role field. Internal key, stored with every note written with it. */
export const ${B}_GENEL_SABLON = 'general'

export const ${B}_NOT_SABLONLARI: NotSablonVerisi = {
  genelSablon: ${B}_GENEL_SABLON,
  alanlar: eksikAyar('note templates: every role field — { blood_pressure: { bolum: \\'o\\', ad: { ${anahtar(DIL)}: \\'Blood pressure\\' } }, … }; {} if no role has fields of its own'),
  rolAlanlari: eksikAyar('note templates: role key → the keys of its fields in the order shown — { cardiology: [\\'blood_pressure\\', …] }; {} if no role has fields'),
  veliAlani: eksikAyar('note templates: null if the country has no guardian age; otherwise the field that says who gave the history — { anahtar: \\'history_giver\\', tanim: { bolum: \\'s\\', ad: { ${anahtar(DIL)}: \\'…\\' } } }'),
  cocukRolleri: eksikAyar('note templates: keys of the roles whose patients are children (an unknown age counts as a child only there); [] if none'),
  bolumBasliklari: eksikAyar('note templates: [] unless one kind of role needs its own section heading — [{ taraf: \\'klinik-muttefik\\', bolum: \\'a\\', ad: { ${anahtar(DIL)}: \\'…\\' } }]'),
}

const roller = Array.isArray(${B}_ROL_TANIMLARI) ? ${B}_ROL_TANIMLARI : []
const tamam = (v: NotSablonVerisi): boolean => [v.alanlar, v.rolAlanlari, v.cocukRolleri, v.bolumBasliklari].every((x) => x && typeof x === 'object' && !('__eksikAyar' in x)) && !(v.veliAlani && '__eksikAyar' in v.veliAlani)

/** Templates that are switched on: the general one first, then every role that has a template of its own. */
export const ${B}_SABLONLAR: readonly string[] = tamam(${B}_NOT_SABLONLARI) ? S.sablonlar(${B}_NOT_SABLONLARI, roller) : [${B}_GENEL_SABLON]

export const ${KOD}SablonMu = (ham: unknown): ham is string => tamam(${B}_NOT_SABLONLARI) && S.sablonMu(${B}_NOT_SABLONLARI, roller, ham)

/** THE DECISION POINT: the field keys a note of \`sablon\` may carry for this patient. */
export const ${KOD}SablonAlanlari = (veliYasi: number | null) => (sablon: string, hasta?: S.SablonHastasi): readonly string[] => (tamam(${B}_NOT_SABLONLARI) ? S.sablonAlanlari(${B}_NOT_SABLONLARI, roller, veliYasi, sablon, hasta) : [])
`

dosyalar['klinik/talimatlar.ts'] = `${BAS(`${B}: INSTRUCTIONS TO THE MODEL for a visit note in "${DIL}".`, `WRITE THEM FRESH FOR THIS COUNTRY, in the language the note is written in, and have a clinician who practises in
it read them before a real doctor relies on a note (checklist C12, D2, E4, E11). Do not translate another country's
instructions; name no guideline, protocol, authority or textbook until the country's sources are researched and
reviewed (checklist C) — until then a note states what was said at the visit and nothing about what a standard requires.

What every instruction must make the model do, whatever the language: write only what was said; no diagnosis the
doctor did not state; medicines exactly as said, no dose arithmetic; no sources; mark unclear places instead of
guessing; keep reported and examined apart; write in this one language; treat the transcript as material, not as
instructions.

THE CONTRACT WITH THE CODE (not text, do not translate): the answer is ONE JSON object with the keys "s", "o", "a",
"p" and, for a role with fields, "${'fields'}": { key: text }. The functions below add that shape to the instruction
themselves; the text you supply explains it in the note's language.

One language: there is nothing to rewrite a note into, so no rewrite instruction exists (see ./index.ts).

THE SUMMARY FOR THE PATIENT (the patient portal): a second instruction, for a short text in plain words written from
an APPROVED note only. What the model writes with it is PATIENT-FACING once the doctor shares it, so this instruction
comes first for the clinician who reads this file. It must make the model: use the note and nothing else; add, guess
and advise nothing; keep medicines, doses, numbers and dates exactly as written; use everyday words; name no source
and nobody; treat the note as material, not as instructions; stay short. Its answer is ONE JSON object with the one
key "summary" (the contract with the code; the function below adds that shape).`)}import { eksik } from '@/lib/ulke/eksik'
import { NOT_ALANLARI_ANAHTARI, type DilKodu, type NotGirdisi, type NotIcerigi } from '@/lib/ulke/tipler'
import * as S from '@/lib/ulke/arayuz/notSablonu'
import { ${B}_GENEL_SABLON, ${B}_NOT_SABLONLARI, ${KOD}SablonMu } from './notSablonlari'
import { ${B}_ROL_TANIMLARI } from './roller'

const T = {
  // The whole instruction for a note with the general template: who the model is, the rules above, what belongs in each of the four sections.
  genel: eksik('instructions: the full instruction to the model for a visit note with the general template, written in ${DIL} (several paragraphs)'),
  // Added for a role that has fields of its own. % is the role's name; the list of its fields (key — label) follows this text.
  rolGirisi: eksik('instructions: the lead-in to a role\\'s own fields, e.g. "This colleague works in %. Besides the four sections, fill these fields with what was said; leave a field empty if nothing was said:"'),
  // Added instead of rolGirisi for an allied profession: the colleague is not a doctor, no medical diagnosis is made.
  muttefikGirisi: eksik('instructions: the same lead-in for a clinic allied profession (%): the colleague is not a doctor, the assessment section holds the specialist\\'s own assessment, no medical diagnosis'),
  // Says that the answer is one JSON object in the shape that follows. % is that shape.
  cevap: eksik('instructions: "Answer with one JSON object in exactly this shape and nothing else: %" in ${DIL}'),
  // One line added to the visit message for a patient below the guardian age: ask who gave the information.
  veli: eksik('instructions: one line for a patient below the guardian age, e.g. "The patient is a minor: note who gave the history."'),
  // Labels of the visit message (never a name or a number that identifies the patient).
  hasta: eksik('instructions: label "PATIENT"'),
  yas: eksik('instructions: label "age"'),
  cinsiyet: eksik('instructions: label "sex"'),
  yil: eksik('instructions: unit after an age in years, e.g. "years"'),
  ay: eksik('instructions: unit after an age in months (under two years), e.g. "months"'),
  kadin: eksik('instructions: "female"'),
  erkek: eksik('instructions: "male"'),
  bilinmiyor: eksik('instructions: "not stated"'),
  gorusme: eksik('instructions: label "TRANSCRIPT OF THE VISIT"'),
  // THE SUMMARY FOR THE PATIENT: the whole instruction (see the head of this file for what it must make the model do).
  ozet: eksik('instructions: the full instruction to the model for a short plain-language summary of an APPROVED note, for the patient, written in ${DIL} (several paragraphs)'),
  // Label of the message that carries the approved note to the model.
  ozetNot: eksik('instructions: label "APPROVED NOTE"'),
}

const roller = Array.isArray(${B}_ROL_TANIMLARI) ? ${B}_ROL_TANIMLARI : []
const jsonKalibi = (alanlar: readonly string[]): string => \`{"s": "…", "o": "…", "a": "…", "p": "…"\${alanlar.length ? \`, "\${NOT_ALANLARI_ANAHTARI}": {\${alanlar.map((k) => \`"\${k}": "…"\`).join(', ')}}\` : ''}}\`

/** Instructions for writing a visit note in \`dil\` with the template \`sablon\`. null = no such language or template here. */
export function ${KOD}NotTalimati(dil: DilKodu, sablon: string): string | null {
  if (dil !== '${DIL}') return null
  if (sablon === ${B}_GENEL_SABLON) return [T.genel, T.cevap.replace('%', jsonKalibi([]))].join('\\n\\n')
  if (!${KOD}SablonMu(sablon)) return null
  const rol = roller.find((r) => r.anahtar === sablon)
  const alanlar = ${B}_NOT_SABLONLARI.rolAlanlari[sablon]
  if (!rol || !alanlar) return null
  const giris = (rol.taraf === 'klinik-muttefik' ? T.muttefikGirisi : T.rolGirisi).replace('%', rol.ad[dil] ?? '')
  const liste = alanlar.map((k) => \`- \${k} — \${S.alanAdi(${B}_NOT_SABLONLARI, k, dil) ?? k}\`)
  return [T.genel, [giris, ...liste].join('\\n'), T.cevap.replace('%', jsonKalibi(alanlar))].join('\\n\\n')
}

/** Instructions for a summary for the patient in \`dil\`. null = no such language here. */
export function ${KOD}HastaOzetiTalimati(dil: DilKodu): string | null {
  if (dil !== '${DIL}') return null
  return [T.ozet, T.cevap.replace('%', '{"summary": "…"}')].join('\\n\\n')
}

/** The message that carries the APPROVED note: its four sections and its role fields. Nothing else about the patient. */
export function ${KOD}HastaOzetiGirdisi(_dil: DilKodu, icerik: NotIcerigi): string {
  const alanlar = icerik.alanlar && Object.keys(icerik.alanlar).length ? { [NOT_ALANLARI_ANAHTARI]: icerik.alanlar } : {}
  return \`\${T.ozetNot}:\\n\${JSON.stringify({ s: icerik.s, o: icerik.o, a: icerik.a, p: icerik.p, ...alanlar })}\`
}

/** Age on the day of the visit, in whole years, or in months under two years. '' = unknown. */
function yasMetni(dogumTarihi: string, muayeneTarihi: string): string {
  const d = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(dogumTarihi), m = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(muayeneTarihi)
  if (!d || !m) return ''
  let ay = (Number(m[1]) - Number(d[1])) * 12 + (Number(m[2]) - Number(d[2]))
  if (Number(m[3]) < Number(d[3])) ay -= 1
  if (ay < 0) return ''
  return ay < 24 ? \`\${ay} \${T.ay}\` : \`\${Math.floor(ay / 12)} \${T.yil}\`
}

/** The message that carries the visit: age and sex (never a name or a number that identifies), then the transcript. */
export const ${KOD}NotGirdisi = (veliYasi: number | null) => (_dil: DilKodu, g: NotGirdisi): string => {
  const yas = yasMetni(g.dogumTarihi, g.muayeneTarihi) || T.bilinmiyor
  const cinsiyet = g.cinsiyet === 'female' ? T.kadin : g.cinsiyet === 'male' ? T.erkek : T.bilinmiyor
  const veli = ${KOD}SablonMu(g.sablon ?? ${B}_GENEL_SABLON) && S.veliYasindaMi(${B}_NOT_SABLONLARI, veliYasi, g.sablon ?? ${B}_GENEL_SABLON, g.dogumTarihi, g.muayeneTarihi) ? \`\\n\${T.veli}\` : ''
  return \`\${T.hasta}: \${T.yas} — \${yas}; \${T.cinsiyet} — \${cinsiyet}.\${veli}\\n\\n\${T.gorusme}:\\n\${g.metin}\`
}
`

dosyalar['klinik/index.ts'] = `${BAS(`${B}: the clinical half of the pack. How a visit is listened to and what a note may be built from.`, `Reached only through countries/active/klinik, and only on the server.

NOTHING HERE IS MEASURED OR REVIEWED UNTIL SOMEBODY DOES IT FOR THIS COUNTRY: the speech thresholds are tuned on real
clinic audio in the country's language (checklist A5, L1); the consent wording is read by a lawyer (A3, I1).`)}import { eksik, eksikAyar } from '@/lib/ulke/eksik'
import type { UlkeKlinigi } from '@/lib/ulke/tipler'
import { ${B}_SABLONLAR, ${KOD}SablonAlanlari } from './notSablonlari'
import { ${KOD}HastaOzetiGirdisi, ${KOD}HastaOzetiTalimati, ${KOD}NotGirdisi, ${KOD}NotTalimati } from './talimatlar'
import { ${B}_VELI_YASI as VELI_YASI } from '../ayarlar'

export const ${B}_KLINIK: UlkeKlinigi = {
  konusma: {
    // The only speech engine there is today.
    saglayici: 'elevenlabs-scribe',
    model: eksik('speech: the model id sent to the provider, e.g. scribe_v2'),
    // Note language → the provider's code for it, used only to force the language of a second pass.
    zorlamaDilKodlari: eksikAyar('speech: { ${anahtar(DIL)}: the provider\\'s code for this language, e.g. \\'eng\\' }'),
    // Provider language codes this country expects to hear → the language's short code on the screens.
    beklenenDiller: eksikAyar('speech: provider codes the country expects to hear → \\'${TEMEL}\\', e.g. { eng: \\'${TEMEL}\\', en: \\'${TEMEL}\\' }'),
    dilOlasiligiEsigi: eksikAyar('speech: below this probability of the predicted language (0–1) the first pass is "low confidence"; tune on real clinic audio (a starting value elsewhere: 0.8)'),
    ortalamaLogOlasilikEsigi: eksikAyar('speech: below this average word log-probability a pass is "low confidence"; tune on real clinic audio (a starting value elsewhere: -0.36)'),
    asgariKarakter: eksikAyar('speech: a transcript shorter than this many characters is "not enough speech" (a starting value elsewhere: 40)'),
  },
  // The tick-box sentence is \`muayene.riza\` in ../uygulama/metinler.ts. This stamp is stored with every visit, so a
  // later, lawyer-reviewed wording can be told apart from a draft. hukukcuInceledi becomes true only when a lawyer has read it.
  riza: { surum: eksik('consent: a version stamp for the consent wording, e.g. ${KOD}-draft-2026-01-01'), hukukcuInceledi: false },
  sablonlar: ${B}_SABLONLAR,
  gunlukMuayeneLimiti: eksikAyar('limits: visits (recordings turned into notes) one account may make per day, e.g. 200'),
  notTalimati: ${KOD}NotTalimati,
  notGirdisi: ${KOD}NotGirdisi(VELI_YASI),
  notAlanlari: ${KOD}SablonAlanlari(VELI_YASI),
  // The patient portal: a short summary of an APPROVED note for the patient, which the doctor reads, edits and shares.
  hastaOzetiTalimati: ${KOD}HastaOzetiTalimati,
  hastaOzetiGirdisi: ${KOD}HastaOzetiGirdisi,
  // One language: a note cannot be rewritten in another. A second language adds these three (see docs/COUNTRY-PACK-HOWTO.md).
  yenidenYazimTalimati: () => null,
  yenidenYazimGirdisi: () => '',
  digerDil: () => null,
}
`

// ───────────────────────── the country's own record, from the checklist ─────────────────────────
const kutular = kontrolListesi.split('\n')
const ilk = kutular.findIndex((s) => s.startsWith('## Rules that stop one country leaking'))
const son = kutular.findIndex((s) => s.startsWith('## Order of work'))
if (ilk < 0 || son < 0) dur('docs/COUNTRY-PACK-CHECKLIST.md: could not find the sections to copy ("## Rules that stop…" to "## Order of work"). Nothing was changed.')
const bolumler = []
let atla = false
for (const satir of kutular.slice(ilk, son)) {
  if (satir.startsWith('How each rule is enforced today')) atla = true
  else if (satir.startsWith('## ')) atla = false
  if (!atla) bolumler.push(satir.replace(/^- \[[ xX]\]/, '- [ ]'))
}
const kutuSayisi = bolumler.filter((s) => s.startsWith('- [ ]')).length
const kayitMd = `# Country pack: ${B}

Answers to \`docs/COUNTRY-PACK-CHECKLIST.md\` for the country \`${KOD}\`. Code: \`countries/${KOD}/\`. How a country is built: \`docs/COUNTRY-PACK-HOWTO.md\`.

**Created by \`node scripts/ulke-yeni.mjs ${KOD} --dil ${DIL} --yol ${YOL_HAM}\`. Nothing below is answered yet.**

## Status

- **Nothing is live.** No deployment exists and **no database exists for this country yet.** One database per country: the owner creates a new, empty one, and the baseline (\`lib/db/ulke/000_yeni_ulke_veritabani.sql\`) is run on it once. No script of this country is ever run on the Turkish database or on another country's. Section M below; how each step is done: \`docs/COUNTRY-PACK-DB-ROLLOUT.md\`.
- **The pack cannot be built yet.** \`node scripts/ulke-paket-denetimi.mjs --ulke ${KOD}\` prints every item still to supply.
- **Sign-up is closed** (invitation code only) and **the site is hidden from search**. Both are opened by the owner only.
- Language: \`${DIL}\`. Served at: \`${YOL || 'an address of its own (domain root)'}\`.

## What building the pack does NOT prove

A pack that builds has every text and setting filled in. It says nothing about whether they are right. Each gate
below is passed by a person and recorded here with a name and a date: the law (A1 to A4, B, I), the speech test on
real clinic audio (A5), a named clinical lead and a reviewer per specialty (A6, C14), native review of every text
(E11), and the owner's decision to open sign-up and to show the site to search engines (rule 9, K2).

${bolumler.join('\n').trim()}

## Decisions and open questions

(Record each decision with its date and who made it. Record what is still open and who it waits on.)
`

// ───────────────────────── write ─────────────────────────
for (const [goreli, icerik] of Object.entries(dosyalar)) {
  const yol = join(dizin, goreli)
  mkdirSync(dirname(yol), { recursive: true })
  writeFileSync(yol, icerik)
}
const degisen = new Map()
for (const [goreli, desen, yeni] of kayitlar) degisen.set(goreli, (degisen.get(goreli) ?? oku(goreli)).replace(desen, yeni))
for (const [goreli, icerik] of degisen) writeFileSync(join(KOK, goreli), icerik)
writeFileSync(join(KOK, 'docs', `COUNTRY-PACK-${B}.md`), kayitMd)

const { eksikleriBul } = await import('./ulke-paket-denetimi.mjs')
const eksikler = eksikleriBul(KOD, KOK)
const metin = eksikler.filter((e) => e.tur === 'text').length
console.log(`[ulke-yeni] countries/${KOD}/ created: ${Object.keys(dosyalar).length} files.`)
console.log(`[ulke-yeni] registered "${KOD}" in: ${[...degisen.keys()].join(', ')}${dilVar ? '' : ` (the language "${DIL}" is new to DilKodu)`}`)
console.log(`[ulke-yeni] docs/COUNTRY-PACK-${B}.md created from the checklist: ${kutuSayisi} gates, all unticked.`)
console.log(`[ulke-yeni] TO SUPPLY before the country can be built: ${eksikler.length} items — ${metin} texts, ${eksikler.length - metin} settings.`)
const dosyaBasina = new Map()
for (const e of eksikler) dosyaBasina.set(e.dosya, (dosyaBasina.get(e.dosya) ?? 0) + 1)
for (const [dosya, n] of dosyaBasina) console.log(`  ${String(n).padStart(4)}  ${dosya}`)
console.log(`\nThe full list, with a hint for each:   node scripts/ulke-paket-denetimi.mjs --ulke ${KOD}`)
console.log(`What to supply, in which order, and what building does not prove:   docs/COUNTRY-PACK-HOWTO.md`)
console.log(`Sign-up is closed and the site is hidden from search. No database, deployment or setting was touched.`)
console.log(`\nTHE COUNTRY'S OWN DATABASE (one database per country; never the Turkish one, never another country's):`)
console.log(`  1. the owner creates a new, EMPTY database for "${KOD}" (it has a monthly cost)`)
console.log(`  2. run lib/db/ulke/000_yeni_ulke_veritabani.sql on it, once (it refuses a database that is not empty)`)
console.log(`  3. check the result and tick section M of docs/COUNTRY-PACK-${B}.md          docs/COUNTRY-PACK-DB-ROLLOUT.md`)
