/**
 * NOTYA-UZ-BRANSLAR-01 · NOTYA-ULKE-UYGULA-UZ — the 42 ROLES of an Uzbekistan build (NOTYA_COUNTRY=uz): 37 doctor
 * specialties, 3 clinic doctors, 2 clinic allied professions — UZBEKISTAN'S OWN LIST since the audit of 2026-10-10
 * was applied (./rolListesi.ts). Table-driven: every check below runs for every one of the 42.
 *
 *   0. THE DECISIONS: what was renamed, split, added, moved and removed, held to the audit and to the order's own
 *      names; the Russian names marked unofficial; a stored key that is no role any more.
 *   1. NAMES: a catalogue of 42 names in three forms, each in its own script, machine-written and saying so.
 *   2. ASSISTANT: the owner's name for the role — Latin exactly as stored, Cyrillic and Russian derived by rule and
 *      marked as such; the title by the Turkish product's convention (./asistanAdlari.test.ts), from the catalogue
 *      of titles; no entry → no name, the neutral assistant; never another role's name. THE SEVEN ROLES THE AUDIT
 *      ADDED HAVE NO NAME YET: the neutral assistant, in every form, on every screen.
 *   3. ACCOUNT: the role is chosen at first login after the language, stored for the caller only, changeable.
 *   4. SCREENS: the question, the settings card and the home in three forms; a role's key is never shown.
 *   5. LEAK TEST over every new string in all three forms. No Turkish letter anywhere.
 *
 * Real handlers and components; the database and auth are a stand-in (lib/ulke/testing/sahteVeritabani.ts).
 * No network at all. Synthetic accounts only.
 */
process.env.NOTYA_COUNTRY = 'uz'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0004'

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
import { UZ_ASISTAN_ADLARI, uzAsistanAdi } from './asistanAdlari'
import { uzAsistanKimligi } from './asistanKimligi'
import { UZ_ESKI_ROLLER, uzBugunkuRol } from './eskiRoller'
import { UZ_HEKIM_ROLLERI, UZ_KAPSAM_DISI, UZ_NOMENKLATURA, UZ_ROL_ANAHTARLARI, UZ_ROL_SATIRLARI, UZ_RUSCHA_ADLAR_RESMIY } from './rolListesi'

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
  vt.tablo('ulke_hesaplari').push({ id: A, full_name: 'QA Shifokor A', ulke: 'uz', ui_language: 'uz-Latn' }, { id: B, full_name: 'QA Врач Б', ulke: 'uz', ui_language: 'ru' })
}

const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
type Form = (typeof FORMLAR)[number]
/** The 42, from the pack's own role list: key and kind. */
const ROLLER = UZ_ROL_SATIRLARI.map((x) => ({ rol: x.anahtar, taraf: x.taraf }))
/** The roles the owner has named an assistant for (35): with the full name in Uzbek Latin (title by the Turkish convention + the owner's names) and the given name. */
const ADLI = ROLLER.flatMap((r) => { const a = uzAsistanAdi(r.rol); return a ? [{ ...r, unvan: a.unvan, tamAd: uzAsistanKimligi(r.rol, 'uz-Latn')!.tamAd, kisaAd: a.kisaAd, soyad: a.soyad }] : [] })
/** The roles the audit of 2026-10-10 added: no assistant has been named for them (7). */
const ADSIZ = ROLLER.filter((r) => !uzAsistanAdi(r.rol))
/** The keys that were roles until the audit was applied (5). */
const CIKARILAN = ['sac-ekimi', 'longevity', 'diyetisyen', 'ergoterapi', 'odyoloji']
const TURKCE = /[çğıİşĞŞöüÖÜÇ]/
const KIRILL = /[Ѐ-ӿ]/
const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak }), [])
const ekranTemiz = (html: string, kaynak: string) => {
  temiz(html, kaynak)
  temiz(gorunurMetin(html), `${kaynak} (visible text)`)
  assert.doesNotMatch(html, TURKCE, `${kaynak}: a Turkish letter`)
}
/** A role key must never be read by a person: not as text, not as a label. (As an option's value it is not text.) */
const anahtarGorunmez = (html: string, kaynak: string) => {
  const gorunur = gorunurMetin(html)
  for (const { rol } of ROLLER) assert.ok(!new RegExp(`(^|[^a-z-])${rol}([^a-z-]|$)`).test(gorunur), `${kaynak}: the internal key "${rol}" is visible`)
}

describe('42 roles: the decisions of the audit of 2026-10-10, as applied (./rolListesi.ts)', () => {
  let R: typeof import('./rolAdlari')
  before(async () => { R = await import('./rolAdlari') })
  const satir = (k: string) => UZ_ROL_SATIRLARI.find((x) => x.anahtar === k)!

  it('BEFORE AND AFTER: 40 roles (30 + 5 + 5) became 42 (37 + 3 + 2): five keys left, seven came, thirty-five stayed', () => {
    assert.equal(ROLLER.length, 42)
    assert.deepEqual((['doktor', 'klinik-hekim', 'klinik-muttefik'] as const).map((t) => ROLLER.filter((r) => r.taraf === t).length), [37, 3, 2])
    assert.equal(new Set(UZ_ROL_ANAHTARLARI).size, 42)
    // the forty of before are the owner's list of names (it is no longer the role list, and was not changed)
    const once = UZ_ASISTAN_ADLARI.map((a) => a.bransAnahtari)
    assert.equal(once.length, 40)
    assert.deepEqual(once.filter((k) => !UZ_ROL_ANAHTARLARI.includes(k)).sort(), [...CIKARILAN].sort())
    assert.deepEqual(UZ_ROL_ANAHTARLARI.filter((k) => !once.includes(k)), ['damar-cerrahisi', 'alerji-immunoloji', 'reproduktoloji', 'cocuk-norolojisi', 'narkoloji', 'diyetoloji', 'surdoloji'])
    assert.equal(UZ_ROL_ANAHTARLARI.filter((k) => once.includes(k)).length, 35)
    // a role that stayed kept its kind
    for (const a of UZ_ASISTAN_ADLARI) if (UZ_ROL_ANAHTARLARI.includes(a.bransAnahtari)) assert.equal(satir(a.bransAnahtari).taraf, a.taraf, a.bransAnahtari)
    // a key the database can keep: lower-case words joined by hyphens, at most 60 characters
    for (const k of UZ_ROL_ANAHTARLARI) assert.match(k, /^[a-z]+(-[a-z]+)*$/, k)
  })

  it('RENAMED: the Uzbek Latin name is the order\'s own, letter for letter — eight roles; the key did not change', () => {
    const beklenen: Record<string, string> = {
      'aile-hekimligi': 'Oilaviy shifokorlik', dahiliye: 'Terapiya', 'genel-cerrahi': 'Xirurgiya', radyoloji: 'Tibbiy radiologiya',
      'fizik-tedavi': 'Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya)',
      'estetik-cerrahi': 'Plastik xirurgiya', 'medikal-estetik': 'Tibbiy kosmetologiya', 'klinik-dermatoloji': 'Dermatovenerologiya',
    }
    assert.deepEqual(UZ_ROL_SATIRLARI.filter((x) => x.karar === 'rename').map((x) => x.anahtar).sort(), Object.keys(beklenen).sort())
    for (const [k, ad] of Object.entries(beklenen)) { assert.equal(satir(k).resmiAd, ad, k); assert.equal(R.UZ_ROL_ADLARI[k]['uz-Latn'], ad, k); assert.equal(satir(k).gibi, undefined, k) }
    // the names of before are gone from the catalogue
    const hepsi = Object.values(R.UZ_ROL_ADLARI).flatMap((a) => Object.values(a)).join(' | ')
    for (const eski of ['Oilaviy tibbiyot', 'ichki kasalliklar', 'Umumiy xirurgiya', 'nur tashxisi', 'Tibbiy reabilitatsiya', 'Estetik xirurgiya', 'estetik tibbiyot', 'Dermatologiya (klinika)', 'Yurak-qon tomir', 'Общая хирургия', 'внутренние болезни', 'Эстетическая', 'Сердечно-сосудистая']) assert.ok(!hepsi.includes(eski), `"${eski}" is still a name`)
  })

  it('SPLIT: cardiovascular surgery is two specialties in the order — the old key carries the first, a new role behaves like it', () => {
    assert.deepEqual(UZ_ROL_SATIRLARI.filter((x) => x.karar === 'split').map((x) => [x.anahtar, x.resmiAd, x.gibi ?? null]), [['kalp-damar-cerrahisi', 'Kardioxirurgiya', null], ['damar-cerrahisi', 'Qon tomirlar xirurgiyasi', 'kalp-damar-cerrahisi']])
    assert.equal(R.UZ_ROL_ADLARI['kalp-damar-cerrahisi']['uz-Latn'], 'Kardioxirurgiya')
    assert.equal(R.UZ_ROL_ADLARI['damar-cerrahisi']['uz-Latn'], 'Qon tomirlar xirurgiyasi')
    // they stand side by side in the list
    assert.equal(UZ_ROL_ANAHTARLARI.indexOf('damar-cerrahisi'), UZ_ROL_ANAHTARLARI.indexOf('kalp-damar-cerrahisi') + 1)
  })

  it('ADDED: four specialties the order recognises; MOVED: dietology and surdology are doctors\' specialties — each new role says which shared role it behaves like', () => {
    assert.deepEqual(UZ_ROL_SATIRLARI.filter((x) => x.karar === 'add').map((x) => [x.anahtar, x.taraf, x.resmiAd, x.gibi]), [
      ['alerji-immunoloji', 'doktor', 'Allergologiya va klinik immunologiya', 'dahiliye'],
      ['reproduktoloji', 'doktor', 'Reproduktologiya', 'kadin-hastaliklari-dogum'],
      ['cocuk-norolojisi', 'doktor', 'Bolalar nevrologiyasi', 'noroloji'],
      ['narkoloji', 'doktor', 'Narkologiya', 'psikiyatri'],
    ])
    assert.deepEqual(UZ_ROL_SATIRLARI.filter((x) => x.karar === 'moved').map((x) => [x.anahtar, x.taraf, x.resmiAd, x.gibi]), [['diyetoloji', 'doktor', 'Diyetologiya', 'diyetisyen'], ['surdoloji', 'doktor', 'Surdologiya', 'odyoloji']])
    for (const x of UZ_ROL_SATIRLARI.filter((y) => y.gibi)) {
      assert.equal(R.UZ_ROL_ADLARI[x.anahtar]['uz-Latn'], x.resmiAd, x.anahtar)
      // never a chain: the role it behaves like has no `gibi` of its own, and is one of the forty shared keys
      assert.ok(UZ_ASISTAN_ADLARI.some((a) => a.bransAnahtari === x.gibi), `${x.anahtar} → ${x.gibi}`)
      assert.ok(!UZ_ROL_SATIRLARI.some((y) => y.anahtar === x.gibi && y.gibi), `${x.anahtar} → ${x.gibi}: a chain`)
      // the screens are handed the same
      assert.equal(R.UZ_ROL_TANIMLARI.find((t) => t.anahtar === x.anahtar)!.gibi, x.gibi)
    }
    // only the seven behave like another role
    assert.equal(UZ_ROL_SATIRLARI.filter((x) => x.gibi).length, 7)
    assert.deepEqual(R.UZ_ROL_TANIMLARI.filter((t) => t.gibi !== undefined).map((t) => t.anahtar), UZ_ROL_SATIRLARI.filter((x) => x.gibi).map((x) => x.anahtar))
  })

  it('KEPT, with the name the pack had: 25 roles; one could not be decided and was left as it was; dentistry and traditional medicine are not here', () => {
    assert.equal(UZ_ROL_SATIRLARI.filter((x) => x.karar === 'keep').length, 25)
    assert.deepEqual(UZ_ROL_SATIRLARI.filter((x) => x.karar === 'unverified').map((x) => [x.anahtar, x.resmiAd, x.yer]), [['fizyoterapi', null, null]])
    // every decided role names where it stands in the order
    for (const x of UZ_ROL_SATIRLARI) if (x.karar !== 'unverified') assert.ok(x.resmiAd && x.yer && /^(row|section) /.test(x.yer), x.anahtar)
    // three kept names are the pack's shorter or longer form of the order's, and the file says so beside each
    const kaynak = readFileSync(join(KOK, 'countries/uz/klinik/rolListesi.ts'), 'utf8')
    for (const [k, ad] of [['kulak-burun-bogaz', 'Otorinolaringologiya (LOR)'], ['nefroloji', 'Nefrologiya'], ['onkoloji', 'Onkologiya']] as const) { assert.equal(R.UZ_ROL_ADLARI[k]['uz-Latn'], ad); assert.notEqual(satir(k).resmiAd, ad) }
    assert.match(kaynak, /keeps "\(LOR\)", which the order does not have/)
    assert.deepEqual(UZ_KAPSAM_DISI.map((x) => x.resmiAd), ['Stomatologiya', 'Xalq tabobati'])
    const adlar = Object.values(R.UZ_ROL_ADLARI).map((a) => a['uz-Latn']).join(' | ')
    assert.doesNotMatch(adlar, /[Ss]tomatolog|tabobat/)
  })

  it('THE SOURCE is named with its number, its date and the day it was read; and NO RUSSIAN NAME IS OFFICIAL', () => {
    assert.match(UZ_NOMENKLATURA.buyruq, /No\. 6 of 12\.05\.2021/); assert.match(UZ_NOMENKLATURA.buyruq, /No\. 3303/)
    assert.equal(UZ_NOMENKLATURA.adres, 'https://lex.uz/uz/docs/-5422572'); assert.equal(UZ_NOMENKLATURA.okundu, '2026-10-10')
    assert.equal(UZ_RUSCHA_ADLAR_RESMIY, false)
    const bas = readFileSync(join(KOK, 'countries/uz/klinik/rolAdlari.ts'), 'utf8').slice(0, 3200)
    assert.match(bas, /THE RUSSIAN NAMES ARE UNOFFICIAL, EVERY ONE/)
    assert.match(readFileSync(join(KOK, 'countries/uz/klinik/rolListesi.ts'), 'utf8'), /THERE IS NO OFFICIAL RUSSIAN\s+\* NAME/)
  })

  it('EVERY DOCTOR ROLE: 40 of the 42, the list the tools area uses for "every doctor role" — the kit computes the same', async () => {
    const { hekimRolleri } = await import('@/lib/ulke/araclar/paket')
    assert.deepEqual([...UZ_HEKIM_ROLLERI], hekimRolleri(R.UZ_ROL_TANIMLARI))
    assert.equal(UZ_HEKIM_ROLLERI.length, 40)
    assert.deepEqual(UZ_ROL_ANAHTARLARI.filter((k) => !UZ_HEKIM_ROLLERI.includes(k)), ['fizyoterapi', 'klinik-psikolog'])
  })

  it('A KEY THAT IS NO ROLE ANY MORE has a nearest role of today: all five, each to a role of the pack; the split needs none; nothing else is ever turned into a role', () => {
    assert.deepEqual(Object.keys(UZ_ESKI_ROLLER).sort(), [...CIKARILAN].sort())
    assert.deepEqual(UZ_ESKI_ROLLER, { diyetisyen: 'diyetoloji', odyoloji: 'surdoloji', ergoterapi: 'fizyoterapi', 'sac-ekimi': 'estetik-cerrahi', longevity: 'aile-hekimligi' })
    for (const [eski, yeni] of Object.entries(UZ_ESKI_ROLLER)) {
      assert.ok(!UZ_ROL_ANAHTARLARI.includes(eski), eski); assert.ok(UZ_ROL_ANAHTARLARI.includes(yeni), `${eski} → ${yeni}`)
      assert.equal(uzBugunkuRol(eski), yeni); assert.equal(R.uzRolMu(yeni), true)
    }
    // the two the audit itself decided land on the role that behaves like them
    assert.equal(satir('diyetoloji').gibi, 'diyetisyen'); assert.equal(satir('surdoloji').gibi, 'odyoloji')
    // the split: the stored key is still a role, under the new name
    assert.equal(uzBugunkuRol('kalp-damar-cerrahisi'), 'kalp-damar-cerrahisi'); assert.equal(R.uzRolAdi('kalp-damar-cerrahisi', 'uz-Latn'), 'Kardioxirurgiya')
    for (const k of UZ_ROL_ANAHTARLARI) assert.equal(uzBugunkuRol(k), k)
    for (const ham of ['genel', 'kadin-dogum', 'cardiology', 'constructor', '__proto__', 'toString', '', null, undefined, 7, {}]) assert.equal(uzBugunkuRol(ham), null, String(ham))
  })
})

describe('42 roles: the catalogue of names', () => {
  let R: typeof import('./rolAdlari')
  before(async () => { R = await import('./rolAdlari') })

  it('the pack\'s own list is the list of roles: 37 + 3 + 2, and every role has a name in each of the three forms', () => {
    assert.equal(ROLLER.length, 42)
    assert.deepEqual([...R.UZ_ROLLER], ROLLER.map((r) => r.rol))
    assert.deepEqual(Object.keys(R.UZ_ROL_ADLARI).sort(), ROLLER.map((r) => r.rol).sort(), 'a name without a role, or a role without a name')
    assert.deepEqual(R.UZ_ROL_GRUPLARI.map((g) => [g.taraf, g.roller.length]), [['doktor', 37], ['klinik-hekim', 3], ['klinik-muttefik', 2]])
    for (const { rol, taraf } of ROLLER) {
      assert.equal(R.uzRolMu(rol), true, rol)
      assert.equal(R.uzRolTarafi(rol), taraf, rol)
      for (const f of FORMLAR) assert.ok((R.uzRolAdi(rol, f) ?? '').trim().length >= 5, `${rol}/${f}`)
    }
  })

  it('the catalogue says, at its top, that it is machine-written and awaits native review — and that it is not a translation of the Turkish labels', () => {
    const bas = readFileSync(join(KOK, 'countries/uz/klinik/rolAdlari.ts'), 'utf8').slice(0, 3200)
    assert.match(bas, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./)
    assert.match(bas, /NOT A TRANSLATION of the Turkish product's labels/)
  })

  for (const { rol } of ROLLER) {
    it(`${rol}: each form in its own script; no Turkish letter; the key is not the name`, () => {
      const [lat, kir, ru] = FORMLAR.map((f) => R.UZ_ROL_ADLARI[rol][f])
      assert.doesNotMatch(lat, KIRILL, 'uz-Latn has a Cyrillic letter')
      assert.doesNotMatch(lat, /['`‘’]/, 'uz-Latn uses a plain apostrophe')
      assert.doesNotMatch(kir, /[A-Za-z]/, 'uz-Cyrl has a Latin letter')
      assert.doesNotMatch(ru, /[A-Za-zўқғҳЎҚҒҲ]/, 'ru has a Latin or Uzbek-only letter')
      for (const x of [lat, kir, ru]) { assert.doesNotMatch(x, TURKCE); temiz(x, `role name ${rol}`); assert.ok(!new RegExp(`(^|[^a-z])${rol}([^a-z]|$)`).test(x.toLowerCase()), 'the internal key stands as a word inside the name') }
    })
  }

  it('no two roles of one group share a name in any form; across the groups exactly two pairs do, and they are the pairs the order has one specialty for', () => {
    // INSIDE A GROUP of the role question a name is unique: a shared name there would hide which template is used.
    for (const g of R.UZ_ROL_GRUPLARI) for (const f of FORMLAR) assert.equal(new Set(g.roller.map((r) => R.UZ_ROL_ADLARI[r][f])).size, g.roller.length, `${g.taraf}/${f}`)
    // ACROSS THE GROUPS: the clinic-side roles the audit renamed carry the name of the doctor role of the same specialty.
    for (const f of FORMLAR) {
      const ayni = ROLLER.filter((a) => ROLLER.some((b) => b.rol !== a.rol && R.UZ_ROL_ADLARI[b.rol][f] === R.UZ_ROL_ADLARI[a.rol][f])).map((r) => r.rol).sort()
      assert.deepEqual(ayni, ['dermatoloji', 'estetik-cerrahi', 'klinik-dermatoloji', 'plastik-cerrahi'], f)
      assert.equal(new Set(ROLLER.map((r) => R.UZ_ROL_ADLARI[r.rol][f])).size, 40, f)
    }
    for (const [a, b] of [['plastik-cerrahi', 'estetik-cerrahi'], ['dermatoloji', 'klinik-dermatoloji']]) { assert.deepEqual(R.UZ_ROL_ADLARI[a], R.UZ_ROL_ADLARI[b]); assert.notEqual(R.uzRolTarafi(a), R.uzRolTarafi(b)) }
    assert.match(readFileSync(join(KOK, 'countries/uz/klinik/rolAdlari.ts'), 'utf8'), /TWO PAIRS OF ROLES NOW CARRY THE SAME NAME/)
    // Uzbek Cyrillic is Uzbek, not the Russian list copied: across the catalogue it uses letters Russian does not have.
    assert.match(ROLLER.map((r) => R.UZ_ROL_ADLARI[r.rol]['uz-Cyrl']).join(' '), /[ўқғҳ]/)
  })

  it('anything that is not one of the 42 is not a role — a Turkish label, the general template, another spelling, a key the audit took out', () => {
    for (const ham of ['genel', 'kadin-dogum', 'Kardiyoloji', 'KARDIYOLOJI', 'cardiology', 'Kardiologiya', '', ' pediatri', null, undefined, 7, {}, ...CIKARILAN]) {
      assert.equal(R.uzRolMu(ham), false, String(ham)); assert.equal(R.uzRolAdi(ham, 'ru'), null, String(ham)); assert.equal(R.uzRolTarafi(ham), null, String(ham))
    }
    // An unknown form is Uzbek in Latin script, never another country's language.
    assert.equal(R.uzRolAdi('kardiyoloji', 'tr'), 'Kardiologiya')
  })
})

describe('42 roles: the assistant\'s identity', () => {
  let K: typeof import('./asistanKimligi')
  let Y: typeof import('../yozuv')
  before(async () => { K = await import('./asistanKimligi'); Y = await import('../yozuv') })

  it('script conversion, by rule: Uzbek Latin → Uzbek Cyrillic → the letters Russian has', () => {
    const cift = (lat: string) => { const k = Y.uzKirillga(lat); return [k, Y.uzRuschaYozuvga(k)] }
    // Names and the professions' titles are converted; "Prof. Dr." and "Dr." are not (they are the catalogue of titles' own words).
    const ornek = (rol: string) => { const a = UZ_ASISTAN_ADLARI.find((x) => x.bransAnahtari === rol)!; return cift([a.meslekUnvani, a.kisaAd, a.soyad].filter(Boolean).join(' ')) }
    assert.deepEqual(ornek('acil-tip'), ['Жасур Турсунов', 'Жасур Турсунов'])
    assert.deepEqual(ornek('enfeksiyon-hastaliklari'), ['Отабек Қодиров', 'Отабек Кодиров'])
    assert.deepEqual(ornek('kadin-hastaliklari-dogum'), ['Шаҳноза Расулова', 'Шахноза Расулова'])
    assert.deepEqual(ornek('beyin-cerrahisi'), ['Алишер Эргашев', 'Алишер Эргашев'])
    assert.deepEqual(ornek('cocuk-cerrahisi'), ['Сардор Абдуллаев', 'Сардор Абдуллаев'])
    assert.deepEqual(ornek('klinik-psikolog'), ['Дониёр Саидов', 'Дониёр Саидов'])
    assert.deepEqual(ornek('psikiyatri'), ['Зулфия Саидова', 'Зулфия Саидова'])
    // The owner's "Fizioterapevt" (2026-10-09, "Use the common name") reads as the usual word in both forms.
    assert.deepEqual(ornek('fizyoterapi'), ['Физиотерапевт Жасмина Абдуллаева', 'Физиотерапевт Жасмина Абдуллаева'])
    // (the owner's list still holds these words for the roles the audit took out; no screen shows them)
    assert.deepEqual(cift('Diyetolog Ergoterapevt Audiolog'), ['Диетолог Эрготерапевт Аудиолог', 'Диетолог Эрготерапевт Аудиолог'])
    assert.deepEqual(cift('Oʻgʻil Gʻulom maʼno CHOY'), ['Ўғил Ғулом маъно ЧОЙ', 'Угил Гулом маъно ЧОЙ'])
    // Not a letter of the Latin alphabet → kept as it is.
    assert.equal(Y.uzKirillga('12 — «…»'), '12 — «…»')
  })

  for (const { rol, taraf, unvan, tamAd, kisaAd, soyad } of ADLI) {
    it(`${rol}: ${tamAd} — the name in Latin as stored; in Cyrillic and Russian derived and marked; the title from the catalogue`, () => {
      const lat = K.uzAsistanKimligi(rol, 'uz-Latn')!
      assert.deepEqual({ tamAd: lat.tamAd, kisaAd: lat.kisaAd, makineTuretimi: lat.makineTuretimi }, { tamAd, kisaAd, makineTuretimi: false })
      // The owner's given name and family name close the full form, untouched; the short form is the title and the given name.
      assert.ok(tamAd.endsWith(` ${kisaAd} ${soyad}`), tamAd)
      assert.ok(lat.unvanliKisaAd.endsWith(` ${kisaAd}`) && !lat.unvanliKisaAd.includes(soyad), lat.unvanliKisaAd)
      const kir = K.uzAsistanKimligi(rol, 'uz-Cyrl')!, ru = K.uzAsistanKimligi(rol, 'ru')!
      for (const [f, k] of [['uz-Cyrl', kir], ['ru', ru]] as const) {
        assert.equal(k.makineTuretimi, true, f)
        assert.doesNotMatch(k.tamAd + k.unvanliKisaAd, /[A-Za-z]/, `${f}: a Latin letter is left in "${k.tamAd}"`)
        const parcalar = k.tamAd.split(' ')
        assert.equal(parcalar.at(-2), k.kisaAd, 'the short name is the given name of the full name')
        assert.equal(k.unvanliKisaAd.split(' ').at(-1), k.kisaAd)
        assert.doesNotMatch(k.tamAd, TURKCE); temiz(k.tamAd, `assistant ${rol}/${f}`); temiz(k.unvanliKisaAd, `assistant ${rol}/${f} (short)`)
      }
      assert.doesNotMatch(ru.tamAd, /[ўқғҳЎҚҒҲ]/, 'the Russian form has an Uzbek-only letter')
      // The NAME is derived by the rule and by nothing else: no hand-corrected spelling hides in the code.
      assert.equal(kir.tamAd.split(' ').slice(-2).join(' '), Y.uzKirillga(`${kisaAd} ${soyad}`))
      assert.equal(ru.tamAd.split(' ').slice(-2).join(' '), Y.uzRuschaYozuvga(Y.uzKirillga(`${kisaAd} ${soyad}`)))
      // The TITLE: the Turkish convention's, in the catalogue's word for the form — a professor and a doctor are never
      // swapped, and an allied role without a doctor's title keeps the profession's own.
      const baslik = (k: { tamAd: string }) => k.tamAd.split(' ').slice(0, -2).join(' ')
      assert.deepEqual([baslik(lat), baslik(kir), baslik(ru)], unvan === 'prof-dr' ? ['Prof. Dr.', 'Проф. д-р', 'Проф. д-р'] : unvan === 'dr' ? ['Dr.', 'Д-р', 'Д-р'] : [baslik(lat), Y.uzKirillga(baslik(lat)), Y.uzRuschaYozuvga(Y.uzKirillga(baslik(lat)))])
      if (taraf === 'doktor') assert.equal(unvan, 'prof-dr', 'every doctor specialty carries the professor\'s title, as in the Turkish product')
      if (unvan === 'meslek') assert.equal(taraf, 'klinik-muttefik')
    })
  }

  it('no entry → no name. Never another role\'s name, never a persona of another country', () => {
    for (const ham of ['genel', 'kadin-dogum', 'yok-boyle-rol', '', null, undefined, 'Kardiyoloji']) for (const f of FORMLAR) assert.equal(K.uzAsistanKimligi(ham, f), null, `${String(ham)}/${f}`)
    assert.equal(ADLI.length, 35)
    assert.equal(new Set(ADLI.map((r) => K.uzAsistanKimligi(r.rol, 'uz-Cyrl')!.tamAd)).size, 35)
  })

  it('THE SEVEN ROLES THE AUDIT ADDED HAVE NO ASSISTANT YET: no name in any form — not the name of the role they behave like, not a made-up one', () => {
    assert.deepEqual(ADSIZ.map((r) => r.rol), ['damar-cerrahisi', 'alerji-immunoloji', 'reproduktoloji', 'cocuk-norolojisi', 'narkoloji', 'diyetoloji', 'surdoloji'])
    for (const { rol } of ADSIZ) for (const f of FORMLAR) assert.equal(K.uzAsistanKimligi(rol, f), null, `${rol}/${f}`)
    // the role each behaves like has (or had) a name in the owner's list — and it is NOT handed on
    for (const x of UZ_ROL_SATIRLARI.filter((y) => y.gibi)) assert.ok(uzAsistanAdi(x.gibi!), x.anahtar)
    assert.match(readFileSync(join(KOK, 'countries/uz/klinik/asistanKimligi.ts'), 'utf8'), /does NOT take that role's assistant/)
  })

  it('A KEY THE AUDIT TOOK OUT HAS NO ASSISTANT ANY MORE, though the owner\'s list still holds its name', () => {
    for (const k of CIKARILAN) { assert.ok(uzAsistanAdi(k), `${k}: the owner's name was deleted`); for (const f of FORMLAR) assert.equal(K.uzAsistanKimligi(k, f), null, `${k}/${f}`) }
  })

  it('ONE SOURCE: the names are written in asistanAdlari.ts and nowhere else in the pack or the core', () => {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs')
    const gez = (d: string, c: string[] = []): string[] => { for (const a of readdirSync(d)) { const y = join(d, a); if (statSync(y).isDirectory()) gez(y, c); else if (/\.(ts|tsx|mjs|cjs)$/.test(a) && !/\.test\.ts$/.test(a)) c.push(y) } return c }
    const dosyalar = [...gez(join(KOK, 'countries/uz')), ...gez(join(KOK, 'lib/ulke')), ...gez(join(KOK, 'app/api/ulke'))].filter((d) => !d.endsWith('klinik/asistanAdlari.ts'))
    assert.ok(dosyalar.length > 40)
    for (const d of dosyalar) {
      const kaynak = readFileSync(d, 'utf8')
      // With the title, and without it (given name + family name).
      for (const { tamAd, kisaAd, soyad } of ADLI) for (const ad of [tamAd, `${kisaAd} ${soyad}`]) assert.ok(!kaynak.includes(ad), `${d} repeats "${ad}"`)
    }
  })

  it('no biography anywhere: no years of practice, no rank written out, no affiliation in the identity, the titles or the catalogue', async () => {
    const M = await import('../uygulama/metinler')
    // A title is an abbreviation before a name ("Prof. Dr."); the word spelled out, and anything about a career, stays out.
    const kimlikler = FORMLAR.flatMap((f) => ADLI.flatMap((r) => { const k = K.uzAsistanKimligi(r.rol, f)!; return [k.tamAd, k.unvanliKisaAd] }))
    const metin = [readFileSync(join(KOK, 'components/ulke/uygulama/Asistan.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), ...FORMLAR.flatMap((f) => Object.values(M.uygulamaMetni(f).asistan)), ...kimlikler].join('\n')
    assert.doesNotMatch(metin, /\d+\s*(yil|йил|лет|года?)|professor|профессор|dotsent|доцент|akademi|академи|universitet|университет|institut|институт|tajriba|тажриба|стаж|опыт/i)
  })
})

describe('42 roles: the account (API)', () => {
  let rolRota: typeof import('../../../app/api/ulke/rol/route.ulke')
  let NextRequest: typeof import('next/server').NextRequest
  before(async () => { rolRota = await import('../../../app/api/ulke/rol/route.ulke'); NextRequest = (await import('next/server')).NextRequest })
  beforeEach(sifirla)

  const istek = (jeton?: string, govde?: unknown) => new NextRequest('https://uz.notya.test/api/ulke/rol', {
    method: govde === undefined ? 'GET' : 'POST',
    headers: { ...(jeton ? { authorization: `Bearer ${jeton}` } : {}), 'content-type': 'application/json' },
    ...(govde === undefined ? {} : { body: typeof govde === 'string' ? govde : JSON.stringify(govde) }),
  })
  const oku = async (r: Response) => { const j = await r.json(); temiz(JSON.stringify(j), 'API answer'); return { s: r.status, j } }
  const al = async (jeton: string) => oku(await rolRota.GET(istek(jeton)))
  const yaz = async (jeton: string, govde: unknown) => oku(await rolRota.POST(istek(jeton, govde)))

  it('first login: no role yet', async () => {
    assert.deepEqual(await al('jeton-a'), { s: 200, j: { rol: null } })
    assert.equal(vt.tablo('hekim_rolu').length, 0)
  })

  for (const { rol } of ROLLER) {
    it(`${rol}: an account can be created with this role — stored for the caller only, read back`, async () => {
      assert.deepEqual(await yaz('jeton-a', { rol }), { s: 200, j: { ok: true, rol } })
      assert.deepEqual(await al('jeton-a'), { s: 200, j: { rol } })
      assert.deepEqual(await al('jeton-b'), { s: 200, j: { rol: null } }, 'the other account is untouched')
      assert.deepEqual(vt.tablo('hekim_rolu').map((s) => [s.doctor_id, s.rol]), [[A, rol]])
      // Every query on the role table carried the caller's own id — and no other table was written.
      for (const q of vt.sorgular.filter((x) => x.tablo === 'hekim_rolu' && x.islem === 'select')) assert.ok(q.filtreler.some((f) => f === `doctor_id=eq.${A}` || f === `doctor_id=eq.${B}`), JSON.stringify(q))
      assert.deepEqual([...new Set(vt.sorgular.filter((x) => x.islem !== 'select').map((x) => x.tablo))], ['hekim_rolu'])
    })
  }

  it('changeable: a second answer replaces the first, one row per account', async () => {
    await yaz('jeton-a', { rol: 'kardiyoloji' }); await yaz('jeton-b', { rol: 'surdoloji' })
    assert.deepEqual(await yaz('jeton-a', { rol: 'diyetoloji' }), { s: 200, j: { ok: true, rol: 'diyetoloji' } })
    assert.deepEqual([(await al('jeton-a')).j.rol, (await al('jeton-b')).j.rol], ['diyetoloji', 'surdoloji'])
    assert.equal(vt.tablo('hekim_rolu').length, 2)
  })

  it('anything that is not one of the 42 is refused and nothing is written — a Turkish label above all, and a key the audit took out', async () => {
    for (const rol of ['genel', 'kadin-dogum', 'Kardiyoloji', 'Kadın Hastalıkları ve Doğum', 'cardiology', '', null, 7, ['pediatri'], { rol: 'pediatri' }, ...CIKARILAN]) {
      assert.deepEqual(await yaz('jeton-a', { rol }), { s: 400, j: { code: 'GECERSIZ', alan: 'rol' } }, JSON.stringify(rol))
    }
    assert.deepEqual(await yaz('jeton-a', 'bozuk'), { s: 400, j: { code: 'GECERSIZ', alan: 'rol' } })
    assert.equal(vt.tablo('hekim_rolu').length, 0)
  })

  it('a body cannot name another account: only the caller\'s row is written', async () => {
    assert.equal((await yaz('jeton-a', { rol: 'uroloji', doctor_id: B, doktorId: B, id: B })).s, 200)
    assert.deepEqual(vt.tablo('hekim_rolu').map((s) => [s.doctor_id, s.rol]), [[A, 'uroloji']])
  })

  it('a stored value that is not a role of this country reads as "no role" — never shown, never guessed', async () => {
    vt.tablo('hekim_rolu').push({ ulke: 'uz', doctor_id: A, rol: 'kadin-dogum' }, { ulke: 'uz', doctor_id: B, rol: 'genel' })
    assert.deepEqual([(await al('jeton-a')).j, (await al('jeton-b')).j], [{ rol: null }, { rol: null }])
  })

  it('A STORED ACCOUNT THAT HOLDS A KEY THE AUDIT TOOK OUT STILL LOADS: it reads as "no role", is asked once, and the nearest role of today can be saved — nothing else of the account is touched', async () => {
    for (const [eski, yeni] of Object.entries(UZ_ESKI_ROLLER)) {
      sifirla()
      vt.tablo('hekim_rolu').push({ ulke: 'uz', doctor_id: A, rol: eski, secildi_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z' })
      // the account is answered, not refused: 200, and "no role" — what sends it to the role question (the frame's rule, tested below)
      assert.deepEqual(await al('jeton-a'), { s: 200, j: { rol: null } }, eski)
      // nothing was rewritten behind the doctor's back
      assert.deepEqual(vt.tablo('hekim_rolu').map((s) => [s.doctor_id, s.rol]), [[A, eski]], eski)
      // the role the pack names as nearest is a role the account can take: one row, replaced
      assert.deepEqual(await yaz('jeton-a', { rol: yeni }), { s: 200, j: { ok: true, rol: yeni } }, `${eski} → ${yeni}`)
      assert.deepEqual(await al('jeton-a'), { s: 200, j: { rol: yeni } })
      assert.deepEqual(vt.tablo('hekim_rolu').map((s) => [s.doctor_id, s.rol]), [[A, yeni]])
      assert.deepEqual([...new Set(vt.sorgular.filter((x) => x.islem !== 'select').map((x) => x.tablo))], ['hekim_rolu'], 'no other table was written')
    }
  })

  it('THE SPLIT: an account stored as cardiovascular surgery loads as before under the same key — now "Kardioxirurgiya" — and can become "Qon tomirlar xirurgiyasi"', async () => {
    const R = await import('./rolAdlari')
    vt.tablo('hekim_rolu').push({ ulke: 'uz', doctor_id: A, rol: 'kalp-damar-cerrahisi', secildi_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z' })
    assert.deepEqual(await al('jeton-a'), { s: 200, j: { rol: 'kalp-damar-cerrahisi' } })
    assert.deepEqual(FORMLAR.map((f) => R.uzRolAdi('kalp-damar-cerrahisi', f)), ['Kardioxirurgiya', 'Кардиохирургия', 'Кардиохирургия'])
    assert.deepEqual(await yaz('jeton-a', { rol: 'damar-cerrahisi' }), { s: 200, j: { ok: true, rol: 'damar-cerrahisi' } })
    assert.deepEqual(FORMLAR.map((f) => R.uzRolAdi('damar-cerrahisi', f)), ['Qon tomirlar xirurgiyasi', 'Қон томирлар хирургияси', 'Сосудистая хирургия'])
  })

  it('no session, an account of another country and an unstamped account: the same "no session", nothing read or written', async () => {
    for (const jeton of [undefined, 'jeton-olmayan', 'jeton-tr', 'jeton-damgasiz']) {
      assert.deepEqual(await oku(await rolRota.GET(istek(jeton))), { s: 401, j: { code: 'OTURUM_YOK' } }, String(jeton))
      assert.deepEqual(await oku(await rolRota.POST(istek(jeton, { rol: 'pediatri' }))), { s: 401, j: { code: 'OTURUM_YOK' } }, String(jeton))
    }
    assert.equal(vt.sorgular.filter((x) => x.tablo === 'hekim_rolu').length, 0)
  })

  it('if the role cannot be saved the answer is a code; if it cannot be read (no migration 134) it is "no role"', async () => {
    vt.boz.yaz.add('hekim_rolu')
    assert.deepEqual(await yaz('jeton-a', { rol: 'pediatri' }), { s: 500, j: { code: 'BASARISIZ' } })
    vt.boz.yaz.clear(); vt.boz.oku.add('hekim_rolu')
    assert.deepEqual(await al('jeton-a'), { s: 200, j: { rol: null } })
  })
})

describe('42 roles: screens (the question, settings, home)', () => {
  let Kabuk: typeof import('@/components/ulke/uygulama/Kabuk')
  let RolFormu: typeof import('@/components/ulke/uygulama/RolFormu')
  let Ayarlar: typeof import('@/components/ulke/uygulama/Ayarlar')
  let Bugun: typeof import('@/components/ulke/uygulama/Bugun')
  let Asistan: typeof import('@/components/ulke/uygulama/Asistan')
  let M: typeof import('../uygulama/metinler')
  let R: typeof import('./rolAdlari')
  let K: typeof import('./asistanKimligi')
  let Layout: typeof import('../../../app/layout.ulke')
  before(async () => {
    Kabuk = await import('@/components/ulke/uygulama/Kabuk'); RolFormu = await import('@/components/ulke/uygulama/RolFormu'); Ayarlar = await import('@/components/ulke/uygulama/Ayarlar')
    Bugun = await import('@/components/ulke/uygulama/Bugun'); Asistan = await import('@/components/ulke/uygulama/Asistan'); M = await import('../uygulama/metinler')
    R = await import('./rolAdlari'); K = await import('./asistanKimligi'); Layout = await import('../../../app/layout.ulke')
  })
  const bos = () => {}
  const belge = (sayfa: React.ReactElement) => renderToStaticMarkup(React.createElement(Layout.default, null, sayfa))
  const cerceve = (f: Form, ic: React.ReactElement) => belge(React.createElement(Kabuk.Cerceve, { dil: f, m: M.uygulamaMetni(f), ad: 'QA Shifokor', aktif: 'bugun', cikis: bos, children: ic }))
  const secenekler = (html: string) => [...html.matchAll(/<option\b[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((x) => [x[1], x[2]])

  for (const f of FORMLAR) {
    it(`${f}: the question lists the 42 roles by name, in three groups, in the account's form`, () => {
      const m = M.uygulamaMetni(f)
      assert.equal(M.metninDili(m), f)
      const html = belge(React.createElement(RolFormu.RolGorunumu, { dil: f, m, rol: '', setRol: bos, gonder: bos, bekliyor: false, hata: null }))
      assert.match(html, new RegExp(`<div class="uza" lang="${f}"`))
      for (const s of [m.rol.baslik, m.rol.aciklama, m.rol.etiket, m.rol.sec, m.rol.devam]) assert.ok(gorunurMetin(html).includes(s), s)
      assert.deepEqual([...html.matchAll(/<optgroup label="([^"]+)"/g)].map((x) => x[1]), [m.rol.grupDoktor, m.rol.grupKlinikHekim, m.rol.grupKlinikMuttefik])
      assert.deepEqual(secenekler(html), [['', m.rol.sec], ...ROLLER.map((r) => [r.rol, R.UZ_ROL_ADLARI[r.rol][f]])])
      // The first step has no navigation: there is nowhere to go before the role is chosen.
      assert.ok(!html.includes('class="uza-nav"'))
      ekranTemiz(html, `/start role question ${f}`); anahtarGorunmez(html.replace(/<option\b[^>]*>/g, '<option>'), `/start role question ${f}`)
      const hatali = (h: 'gerekli' | 'kaydedilemedi') => belge(React.createElement(RolFormu.RolGorunumu, { dil: f, m, rol: 'pediatri', setRol: bos, gonder: bos, bekliyor: true, hata: h }))
      assert.ok(gorunurMetin(hatali('gerekli')).includes(m.rol.gerekli)); assert.ok(gorunurMetin(hatali('kaydedilemedi')).includes(m.rol.kaydedilemedi))
      assert.ok(hatali('gerekli').includes(m.rol.kaydediliyor))
    })

    it(`${f}: settings — the role can be changed; the card names the assistant of the role as saved`, () => {
      const m = M.uygulamaMetni(f)
      const html = cerceve(f, React.createElement(Ayarlar.RolAyariGorunumu, { m, rol: 'kardiyoloji', kayitliRol: 'kardiyoloji', setRol: bos, gonder: bos, bekliyor: false, sonuc: 'tamam' }))
      for (const s of [m.rol.ayarBaslik, m.rol.ayarIzoh, m.rol.kaydet, m.rol.kaydedildi, m.asistan.etiket, K.uzAsistanKimligi('kardiyoloji', f)!.tamAd]) assert.ok(gorunurMetin(html).includes(s), s)
      assert.equal(secenekler(html).length, 43)
      assert.match(html, /<option value="kardiyoloji" selected=""/)
      ekranTemiz(html, `/settings role ${f}`); anahtarGorunmez(html.replace(/<option\b[^>]*>/g, '<option>'), `/settings role ${f}`)
    })

    it(`${f}: no role, or a key without an entry → the neutral assistant, no personal name, no "senior colleague" line`, () => {
      const m = M.uygulamaMetni(f)
      const notr = m.asistan.notr.replace('%', 'Notya')
      assert.ok(notr.includes('Notya') && notr.length > 8)
      for (const rol of [null, undefined, 'genel', 'kadin-dogum', 'yok-boyle-rol', ...CIKARILAN]) {
        assert.equal(Asistan.asistanAdi(m, rol), notr, String(rol)); assert.equal(Asistan.asistanSatiri(m, rol), '', String(rol))
        const html = cerceve(f, React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA Shifokor', muayeneler: [], hata: false, rol }))
        assert.ok(gorunurMetin(html).includes(notr), String(rol))
        assert.ok(!html.includes('data-alan="asistan-satir"'), String(rol))
        for (const r of ADLI) assert.ok(!html.includes(K.uzAsistanKimligi(r.rol, f)!.kisaAd), `${String(rol)}: shows ${r.rol}'s assistant`)
        ekranTemiz(html, `/today neutral ${f}`)
      }
    })
  }

  for (const { rol } of ADSIZ) {
    it(`${rol}: no assistant has been named for this role — the home shows the neutral assistant with the role's own name, and no other role's assistant`, () => {
      for (const f of FORMLAR) {
        const m = M.uygulamaMetni(f)
        const notr = m.asistan.notr.replace('%', 'Notya')
        assert.equal(Asistan.asistanAdi(m, rol), notr, `${rol}/${f}`)
        const html = cerceve(f, React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA Shifokor', muayeneler: [], hata: false, rol }))
        const gorunur = gorunurMetin(html)
        assert.ok(gorunur.includes(notr), `${rol}/${f}`)
        for (const baska of ADLI) assert.ok(!gorunur.includes(K.uzAsistanKimligi(baska.rol, f)!.tamAd) && !gorunur.includes(K.uzAsistanKimligi(baska.rol, f)!.kisaAd), `${rol}/${f}: shows ${baska.rol}'s assistant`)
        ekranTemiz(html, `/today ${rol} ${f}`); anahtarGorunmez(html, `/today ${rol} ${f}`)
      }
    })
  }

  for (const { rol } of ADLI) {
    it(`${rol}: the home shows this role's assistant, by the owner's name, in all three forms — and no other role's`, () => {
      for (const f of FORMLAR) {
        const m = M.uygulamaMetni(f)
        const kim = K.uzAsistanKimligi(rol, f)!
        const html = cerceve(f, React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA Shifokor', muayeneler: [], hata: false, rol }))
        const gorunur = gorunurMetin(html)
        assert.match(html, new RegExp(`data-alan="asistan-ad">${kim.tamAd.replace('.', '\\.')}<`), `${rol}/${f}`)
        assert.ok(gorunur.includes(`${m.asistan.satir} · ${R.UZ_ROL_ADLARI[rol][f]}`), `${rol}/${f}: the neutral line with the role's name`)
        assert.ok(gorunur.includes(m.asistan.etiket))
        for (const baska of ADLI) if (baska.rol !== rol) assert.ok(!gorunur.includes(K.uzAsistanKimligi(baska.rol, f)!.tamAd), `${rol}/${f}: also shows ${baska.rol}'s assistant`)
        ekranTemiz(html, `/today ${rol} ${f}`); anahtarGorunmez(html, `/today ${rol} ${f}`)
      }
    })
  }

  it('the frame asks the server for the role and sends an account without one to the question', () => {
    const kaynak = readFileSync(join(KOK, 'components/ulke/uygulama/Kabuk.tsx'), 'utf8')
    assert.match(kaynak, /api\('\/api\/ulke\/rol'\)/)
    // A country WITH roles (this one) needs one chosen; a country without roles is not asked (NOTYA-ULKE-SABLON-01).
    assert.match(kaynak, /const rolTamam = Boolean\(rol\) \|\| roller\(\)\.length === 0/)
    assert.match(kaynak, /\(!dilSoruldu \|\| !rolTamam\) && ekran !== 'baslangic'\) \{ window\.location\.replace\(YOL\.baslangic\)/)
    assert.match(kaynak, /dilSoruldu && rolTamam && ekran === 'baslangic'\) \{ window\.location\.replace\(YOL\.bugun\)/)
  })
})
