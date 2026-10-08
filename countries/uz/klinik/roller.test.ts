/**
 * NOTYA-UZ-BRANSLAR-01 — the 40 ROLES of an Uzbekistan build (NOTYA_COUNTRY=uz): 30 doctor specialties, 5 clinic
 * doctors, 5 clinic allied professions. Table-driven: every check below runs for every one of the 40.
 *
 *   1. NAMES: a catalogue of 40 names in three forms, each in its own script, machine-written and saying so.
 *   2. ASSISTANT: the owner's name for the role — Latin exactly as stored, Cyrillic and Russian derived by rule and
 *      marked as such; no entry → no name, the neutral assistant; never another role's name.
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
import { UZ_ASISTAN_ADLARI } from './asistanAdlari'

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
  vt.tablo('users').push({ id: A, full_name: 'QA Shifokor A', country: 'uz', ui_language: 'uz-Latn' }, { id: B, full_name: 'QA Врач Б', country: 'uz', ui_language: 'ru' })
}

const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
type Form = (typeof FORMLAR)[number]
/** The 40, from the owner's list: [key, kind, full name as stored]. */
const ROLLER = UZ_ASISTAN_ADLARI.map((a) => ({ rol: a.bransAnahtari, taraf: a.taraf, tamAd: a.tamAd, kisaAd: a.kisaAd }))
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

describe('40 roles: the catalogue of names', () => {
  let R: typeof import('./rolAdlari')
  before(async () => { R = await import('./rolAdlari') })

  it('the owner\'s list is the list of roles: 30 + 5 + 5, and every role has a name in each of the three forms', () => {
    assert.equal(ROLLER.length, 40)
    assert.deepEqual([...R.UZ_ROLLER], ROLLER.map((r) => r.rol))
    assert.deepEqual(Object.keys(R.UZ_ROL_ADLARI).sort(), ROLLER.map((r) => r.rol).sort(), 'a name without a role, or a role without a name')
    assert.deepEqual(R.UZ_ROL_GRUPLARI.map((g) => [g.taraf, g.roller.length]), [['doktor', 30], ['klinik-hekim', 5], ['klinik-muttefik', 5]])
    for (const { rol, taraf } of ROLLER) {
      assert.equal(R.uzRolMu(rol), true, rol)
      assert.equal(R.uzRolTarafi(rol), taraf, rol)
      for (const f of FORMLAR) assert.ok((R.uzRolAdi(rol, f) ?? '').trim().length >= 5, `${rol}/${f}`)
    }
  })

  it('the catalogue says, at its top, that it is machine-written and awaits native review — and that it is not a translation of the Turkish labels', () => {
    const bas = readFileSync(join(KOK, 'countries/uz/klinik/rolAdlari.ts'), 'utf8').slice(0, 1800)
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

  it('40 different names in every form: no two roles share one (a shared name would hide which template is used)', () => {
    for (const f of FORMLAR) assert.equal(new Set(ROLLER.map((r) => R.UZ_ROL_ADLARI[r.rol][f])).size, 40, f)
    // Uzbek Cyrillic is Uzbek, not the Russian list copied: across the catalogue it uses letters Russian does not have.
    assert.match(ROLLER.map((r) => R.UZ_ROL_ADLARI[r.rol]['uz-Cyrl']).join(' '), /[ўқғҳ]/)
  })

  it('anything that is not one of the 40 is not a role — a Turkish label, the general template, another spelling', () => {
    for (const ham of ['genel', 'kadin-dogum', 'Kardiyoloji', 'KARDIYOLOJI', 'cardiology', 'Kardiologiya', '', ' pediatri', null, undefined, 7, {}]) {
      assert.equal(R.uzRolMu(ham), false, String(ham)); assert.equal(R.uzRolAdi(ham, 'ru'), null, String(ham)); assert.equal(R.uzRolTarafi(ham), null, String(ham))
    }
    // An unknown form is Uzbek in Latin script, never another country's language.
    assert.equal(R.uzRolAdi('kardiyoloji', 'tr'), 'Kardiologiya')
  })
})

describe('40 roles: the assistant\'s identity', () => {
  let K: typeof import('./asistanKimligi')
  let Y: typeof import('../yozuv')
  before(async () => { K = await import('./asistanKimligi'); Y = await import('../yozuv') })

  it('script conversion, by rule: Uzbek Latin → Uzbek Cyrillic → the letters Russian has', () => {
    const cift = (lat: string) => { const k = Y.uzKirillga(lat); return [k, Y.uzRuschaYozuvga(k)] }
    assert.deepEqual(cift('Dr. Jasur Tursunov'), ['Др. Жасур Турсунов', 'Др. Жасур Турсунов'])
    assert.deepEqual(cift('Dr. Otabek Qodirov'), ['Др. Отабек Қодиров', 'Др. Отабек Кодиров'])
    assert.deepEqual(cift('Dr. Shahnoza Rasulova'), ['Др. Шаҳноза Расулова', 'Др. Шахноза Расулова'])
    assert.deepEqual(cift('Dr. Alisher Ergashev'), ['Др. Алишер Эргашев', 'Др. Алишер Эргашев'])
    assert.deepEqual(cift('Dr. Sardor Abdullayev'), ['Др. Сардор Абдуллаев', 'Др. Сардор Абдуллаев'])
    assert.deepEqual(cift('Psixolog Doniyor Saidov'), ['Психолог Дониёр Саидов', 'Психолог Дониёр Саидов'])
    assert.deepEqual(cift('Dr. Zulfiya Saidova'), ['Др. Зулфия Саидова', 'Др. Зулфия Саидова'])
    assert.deepEqual(cift('Oʻgʻil Gʻulom maʼno CHOY'), ['Ўғил Ғулом маъно ЧОЙ', 'Угил Гулом маъно ЧОЙ'])
    // Not a letter of the Latin alphabet → kept as it is.
    assert.equal(Y.uzKirillga('12 — «…»'), '12 — «…»')
  })

  for (const { rol, taraf, tamAd, kisaAd } of ROLLER) {
    it(`${rol}: ${tamAd} — Latin as stored; Cyrillic and Russian derived and marked; title kept`, () => {
      assert.deepEqual(K.uzAsistanKimligi(rol, 'uz-Latn'), { tamAd, kisaAd, makineTuretimi: false })
      const kir = K.uzAsistanKimligi(rol, 'uz-Cyrl')!, ru = K.uzAsistanKimligi(rol, 'ru')!
      for (const [f, k] of [['uz-Cyrl', kir], ['ru', ru]] as const) {
        assert.equal(k.makineTuretimi, true, f)
        assert.doesNotMatch(k.tamAd, /[A-Za-z]/, `${f}: a Latin letter is left in "${k.tamAd}"`)
        assert.equal(k.tamAd.split(' ').length, 3, k.tamAd)
        assert.equal(k.tamAd.split(' ')[1], k.kisaAd, 'the short name is the middle word of the full name')
        assert.doesNotMatch(k.tamAd, TURKCE); temiz(k.tamAd, `assistant ${rol}/${f}`)
      }
      assert.doesNotMatch(ru.tamAd, /[ўқғҳЎҚҒҲ]/, 'the Russian form has an Uzbek-only letter')
      // Derived by the rule and by nothing else: no hand-corrected spelling hides in the code.
      assert.equal(kir.tamAd, Y.uzKirillga(tamAd)); assert.equal(ru.tamAd, Y.uzRuschaYozuvga(Y.uzKirillga(tamAd)))
      // The title: "Dr." for a doctor, the profession's own title for an allied role — converted, never dropped or swapped.
      assert.equal(kir.tamAd.split(' ')[0], Y.uzKirillga(tamAd.split(' ')[0]))
      assert.equal(kir.tamAd.startsWith('Др. '), taraf !== 'klinik-muttefik')
    })
  }

  it('no entry → no name. Never another role\'s name, never a persona of another country', () => {
    for (const ham of ['genel', 'kadin-dogum', 'yok-boyle-rol', '', null, undefined, 'Kardiyoloji']) for (const f of FORMLAR) assert.equal(K.uzAsistanKimligi(ham, f), null, `${String(ham)}/${f}`)
    assert.equal(new Set(ROLLER.map((r) => K.uzAsistanKimligi(r.rol, 'uz-Cyrl')!.tamAd)).size, 40)
  })

  it('ONE SOURCE: the names are written in asistanAdlari.ts and nowhere else in the pack or the core', () => {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs')
    const gez = (d: string, c: string[] = []): string[] => { for (const a of readdirSync(d)) { const y = join(d, a); if (statSync(y).isDirectory()) gez(y, c); else if (/\.(ts|tsx|mjs|cjs)$/.test(a) && !/\.test\.ts$/.test(a)) c.push(y) } return c }
    const dosyalar = [...gez(join(KOK, 'countries/uz')), ...gez(join(KOK, 'lib/ulke')), ...gez(join(KOK, 'app/api/ulke'))].filter((d) => !d.endsWith('klinik/asistanAdlari.ts'))
    assert.ok(dosyalar.length > 40)
    for (const d of dosyalar) {
      const kaynak = readFileSync(d, 'utf8')
      // With the title, and without it (given name + family name).
      for (const { tamAd } of ROLLER) for (const ad of [tamAd, tamAd.split(' ').slice(1).join(' ')]) assert.ok(!kaynak.includes(ad), `${d} repeats "${ad}"`)
    }
  })

  it('no biography anywhere: no years of practice, no professor, no affiliation in the identity or in the catalogue', async () => {
    const M = await import('../uygulama/metinler')
    const metin = [readFileSync(join(KOK, 'countries/uz/uygulama/Asistan.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), ...FORMLAR.flatMap((f) => Object.values(M.uygulamaMetni(f).asistan))].join('\n')
    assert.doesNotMatch(metin, /\d+\s*(yil|йил|лет|года?)|professor|профессор|dotsent|доцент|akademi|академи|universitet|университет|institut|институт|tajriba|тажриба|стаж|опыт/i)
  })
})

describe('40 roles: the account (API)', () => {
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
    await yaz('jeton-a', { rol: 'kardiyoloji' }); await yaz('jeton-b', { rol: 'odyoloji' })
    assert.deepEqual(await yaz('jeton-a', { rol: 'diyetisyen' }), { s: 200, j: { ok: true, rol: 'diyetisyen' } })
    assert.deepEqual([(await al('jeton-a')).j.rol, (await al('jeton-b')).j.rol], ['diyetisyen', 'odyoloji'])
    assert.equal(vt.tablo('hekim_rolu').length, 2)
  })

  it('anything that is not one of the 40 is refused and nothing is written — a Turkish label above all', async () => {
    for (const rol of ['genel', 'kadin-dogum', 'Kardiyoloji', 'Kadın Hastalıkları ve Doğum', 'cardiology', '', null, 7, ['pediatri'], { rol: 'pediatri' }]) {
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
    vt.tablo('hekim_rolu').push({ doctor_id: A, rol: 'kadin-dogum' }, { doctor_id: B, rol: 'genel' })
    assert.deepEqual([(await al('jeton-a')).j, (await al('jeton-b')).j], [{ rol: null }, { rol: null }])
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

describe('40 roles: screens (the question, settings, home)', () => {
  let Kabuk: typeof import('../uygulama/Kabuk')
  let RolFormu: typeof import('../uygulama/RolFormu')
  let Ayarlar: typeof import('../uygulama/Ayarlar')
  let Bugun: typeof import('../uygulama/Bugun')
  let Asistan: typeof import('../uygulama/Asistan')
  let M: typeof import('../uygulama/metinler')
  let R: typeof import('./rolAdlari')
  let K: typeof import('./asistanKimligi')
  let Layout: typeof import('../../../app/layout.ulke')
  before(async () => {
    Kabuk = await import('../uygulama/Kabuk'); RolFormu = await import('../uygulama/RolFormu'); Ayarlar = await import('../uygulama/Ayarlar')
    Bugun = await import('../uygulama/Bugun'); Asistan = await import('../uygulama/Asistan'); M = await import('../uygulama/metinler')
    R = await import('./rolAdlari'); K = await import('./asistanKimligi'); Layout = await import('../../../app/layout.ulke')
  })
  const bos = () => {}
  const belge = (sayfa: React.ReactElement) => renderToStaticMarkup(React.createElement(Layout.default, null, sayfa))
  const cerceve = (f: Form, ic: React.ReactElement) => belge(React.createElement(Kabuk.Cerceve, { dil: f, m: M.uygulamaMetni(f), ad: 'QA Shifokor', aktif: 'bugun', cikis: bos, children: ic }))
  const secenekler = (html: string) => [...html.matchAll(/<option\b[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((x) => [x[1], x[2]])

  for (const f of FORMLAR) {
    it(`${f}: the question lists the 40 roles by name, in three groups, in the account's form`, () => {
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
      assert.equal(secenekler(html).length, 41)
      assert.match(html, /<option value="kardiyoloji" selected=""/)
      ekranTemiz(html, `/settings role ${f}`); anahtarGorunmez(html.replace(/<option\b[^>]*>/g, '<option>'), `/settings role ${f}`)
    })

    it(`${f}: no role, or a key without an entry → the neutral assistant, no personal name, no "senior colleague" line`, () => {
      const m = M.uygulamaMetni(f)
      const notr = m.asistan.notr.replace('%', 'Notya')
      assert.ok(notr.includes('Notya') && notr.length > 8)
      for (const rol of [null, undefined, 'genel', 'kadin-dogum', 'yok-boyle-rol']) {
        assert.equal(Asistan.asistanAdi(m, rol), notr, String(rol)); assert.equal(Asistan.asistanSatiri(m, rol), '', String(rol))
        const html = cerceve(f, React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA Shifokor', muayeneler: [], hata: false, rol }))
        assert.ok(gorunurMetin(html).includes(notr), String(rol))
        assert.ok(!html.includes('data-alan="asistan-satir"'), String(rol))
        for (const r of ROLLER) assert.ok(!html.includes(K.uzAsistanKimligi(r.rol, f)!.kisaAd), `${String(rol)}: shows ${r.rol}'s assistant`)
        ekranTemiz(html, `/today neutral ${f}`)
      }
    })
  }

  for (const { rol } of ROLLER) {
    it(`${rol}: the home shows this role's assistant, by the owner's name, in all three forms — and no other role's`, () => {
      for (const f of FORMLAR) {
        const m = M.uygulamaMetni(f)
        const kim = K.uzAsistanKimligi(rol, f)!
        const html = cerceve(f, React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA Shifokor', muayeneler: [], hata: false, rol }))
        const gorunur = gorunurMetin(html)
        assert.match(html, new RegExp(`data-alan="asistan-ad">${kim.tamAd.replace('.', '\\.')}<`), `${rol}/${f}`)
        assert.ok(gorunur.includes(`${m.asistan.satir} · ${R.UZ_ROL_ADLARI[rol][f]}`), `${rol}/${f}: the neutral line with the role's name`)
        assert.ok(gorunur.includes(m.asistan.etiket))
        for (const baska of ROLLER) if (baska.rol !== rol) assert.ok(!gorunur.includes(K.uzAsistanKimligi(baska.rol, f)!.tamAd), `${rol}/${f}: also shows ${baska.rol}'s assistant`)
        ekranTemiz(html, `/today ${rol} ${f}`); anahtarGorunmez(html, `/today ${rol} ${f}`)
      }
    })
  }

  it('the frame asks the server for the role and sends an account without one to the question', () => {
    const kaynak = readFileSync(join(KOK, 'countries/uz/uygulama/Kabuk.tsx'), 'utf8')
    assert.match(kaynak, /api\('\/api\/ulke\/rol'\)/)
    assert.match(kaynak, /\(!dilSoruldu \|\| !rol\) && ekran !== 'baslangic'\) \{ window\.location\.replace\(YOL\.baslangic\)/)
    assert.match(kaynak, /dilSoruldu && rol && ekran === 'baslangic'\) \{ window\.location\.replace\(YOL\.bugun\)/)
  })
})
