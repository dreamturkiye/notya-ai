/**
 * NOTYA-UZ-BRANSLAR-01 — NOTE TEMPLATES AND MODEL INSTRUCTIONS of an Uzbekistan build (NOTYA_COUNTRY=uz), for all
 * 40 roles. Table-driven: every check below runs for every role.
 *
 *   1. TEMPLATES: each role has its own fields, labelled in three forms, each form in its own script.
 *   2. NO CLINICAL REFERENCE CONTENT: no number, dose, schedule, scale or source in a label or an instruction;
 *      what a template would need is a slot — empty and switched off.
 *   3. INSTRUCTIONS: one per role and form, composed from the role's own template; no source, no protocol.
 *   4. VISIT → DRAFT for every role, through the real handlers and the real model gateway with the network replaced.
 *      THE MODEL IS HOSTILE HERE: it answers with every field of every role and a made-up key. Only the note's own
 *      role's fields may be stored, returned or drawn.
 *   5. GUARDIAN WORDING FOLLOWS THE PATIENT'S AGE, in every role.
 *   6. LEAK TEST over every new string in the three forms and over all instructions. No Turkish letter anywhere.
 *
 * Speech and model providers are stand-ins inside this process: no audio, transcript or note leaves it, and any
 * other address fails the test. Synthetic accounts, patients and transcripts only.
 */
process.env.NOTYA_COUNTRY = 'uz'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0005'
process.env.ELEVENLABS_API_KEY = 'sahte-konusma-anahtari'
process.env.OPENROUTER_API_KEY = 'sahte-model-anahtari'
delete process.env.OPENROUTER_BASE_URL

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
import { UZ_ALANLAR, UZ_ORTAK_YEREL_ICERIK, UZ_ROL_ALANLARI, UZ_VASIY_ALANI, UZ_YEREL_ICERIK, uzAlanAdi, uzAlanTanimi, uzBolumAdi, uzResitDegilMi, uzSablonAlanlari, uzSablonMu } from './notSablonlari'
import { UZ_ROL_ADLARI } from './rolAdlari'

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

const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
type Form = (typeof FORMLAR)[number]
const ROLLER = UZ_ASISTAN_ADLARI.map((a) => ({ rol: a.bransAnahtari, taraf: a.taraf, tamAd: a.tamAd }))
const TUM_ALANLAR = Object.keys(UZ_ALANLAR)
const TURKCE = /[çğıİşĞŞöüÖÜÇ]/
const KIRILL = /[Ѐ-ӿ]/
const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak }), [])
/** Things that exist only in Türkiye and names of sources: none may appear in a label, an instruction or a slot. */
const YALNIZ_TURKIYE = /\b(SGK|SUT|MEDULA|e-?Nab[ıi]z|MHRS|T[İI]TCK|Neyzi|Sa[ğg]l[ıi]k Bakanl|T\.C\.|TTB|TUS|KVKK|re[çc]ete)\b/i
const KAYNAK = /vazirlig|вазирлиг|Минздрав|министерств|Nelson|Harrison|UpToDate|Bakanl|T[uü]rk|(?<![\p{L}])(SSV|ССВ|JSST|ЖССТ|ВОЗ|WHO|AAP|NICE|ESC|ADA|KDIGO|GINA|GOLD)(?![\p{L}])/iu
/** A dose, a unit, a range or a schedule would be reference content: labels and role blocks carry no number at all. */
const SAYI_VEYA_BIRIM = /\d|(?<![\p{L}])(mg|мг|ml|мл|kg|кг|mmol|ммоль|mm Hg|мм рт)(?![\p{L}])/u

// ───────────────────────── stand-in providers: speech + a HOSTILE model ─────────────────────────
type ModelCagrisi = { sistem: string; kullanici: string }
const model = { cagrilar: [] as ModelCagrisi[] }
const METIN = 'Shifokor: Nima bezovta qilyapti? Bemor: Uch kundan beri ahvolim yomon, holsizlik bor. Shifokor: Koʻrikdan oʻtkazdim, umumiy ahvoli qoniqarli. Ertaga tahlil topshiring va bir haftadan keyin qayta keling.'
const SCRIBE = 'https://api.elevenlabs.io/v1/speech-to-text'
const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions'
const isaret = (k: string) => `QIYMAT-${k}`
/** Every field of every role, the guardian field and a key nobody owns — whatever the instruction asked for. */
const DUSMAN_ALANLAR = Object.fromEntries([...TUM_ALANLAR, UZ_VASIY_ALANI, 'made_up_key', 'constructor', 'Chest_Pain'].map((k) => [k, isaret(k)]))
const NOT_GOVDESI = { s: 'Uch kundan beri holsizlik.', o: 'Umumiy ahvoli qoniqarli.', a: 'Shifokor tashxisni aytmadi.', p: 'Tahlil, bir haftadan keyin qayta koʻrik.' }
globalThis.fetch = (async (g: unknown, o?: { body?: unknown }) => {
  const adres = String(g)
  if (adres === SCRIBE) return new Response(JSON.stringify({ language_code: 'uzb', language_probability: 0.97, text: METIN, words: METIN.split(' ').map((k, i) => ({ text: k, type: 'word', start: i, end: i + 0.5, logprob: -0.08 })) }), { status: 200 })
  if (adres !== OPENROUTER) throw new Error(`this test may not use the network: ${adres}`)
  const b = JSON.parse(String(o?.body)) as { model: string; messages: { role: string; content: unknown }[] }
  const duz = (c: unknown) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map((p: { text?: string }) => p?.text ?? '').join('\n') : '')
  model.cagrilar.push({ sistem: duz(b.messages.find((m) => m.role === 'system')?.content), kullanici: b.messages.filter((m) => m.role === 'user').map((m) => duz(m.content)).join('\n') })
  return new Response(JSON.stringify({ id: 'sahte', model: b.model, choices: [{ message: { role: 'assistant', content: JSON.stringify({ ...NOT_GOVDESI, fields: DUSMAN_ALANLAR }) }, finish_reason: 'stop' }], usage: { prompt_tokens: 900, completion_tokens: 400 } }), { status: 200 })
}) as typeof fetch

const A = '10000000-0000-4000-8000-00000000000a'
const B = '10000000-0000-4000-8000-00000000000b'
function sifirla(dil: Form = 'uz-Latn') {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear(); model.cagrilar = []
  Object.assign(vt.hesaplar, { 'jeton-a': { id: A, email: 'qa-a@notya.test', app_metadata: { country: 'uz' } }, 'jeton-b': { id: B, email: 'qa-b@notya.test', app_metadata: { country: 'uz' } } })
  vt.tablo('ulke_hesaplari').push({ id: A, full_name: 'QA Shifokor A', ulke: 'uz', ui_language: dil }, { id: B, full_name: 'QA Shifokor B', ulke: 'uz', ui_language: 'ru' })
  vt.tablo('hekim_dil_tercihleri').push({ ulke: 'uz', doctor_id: A, not_dili: dil, soruldu_at: 'x' }, { ulke: 'uz', doctor_id: B, not_dili: 'ru', soruldu_at: 'x' })
}

type Rotalar = {
  rol: typeof import('../../../app/api/ulke/rol/route.ulke'); muayene: typeof import('../../../app/api/ulke/muayene/route.ulke'); hastalar: typeof import('../../../app/api/ulke/hastalar/route.ulke')
  not: typeof import('../../../app/api/ulke/not/route.ulke'); yeniden: typeof import('../../../app/api/ulke/not/yeniden-yaz/route.ulke'); onayla: typeof import('../../../app/api/ulke/not/onayla/route.ulke')
  NextRequest: typeof import('next/server').NextRequest
}
const R = {} as Rotalar
const istek = (yol: string, jeton: string, govde?: unknown, method?: string) => new R.NextRequest(`https://notya.test${yol}`, { method: method ?? (govde === undefined ? 'GET' : 'POST'), headers: { authorization: `Bearer ${jeton}`, 'content-type': 'application/json' }, ...(govde === undefined ? {} : { body: JSON.stringify(govde) }) })
const oku = async (r: Response) => { const t = await r.text(); temiz(t, 'API answer'); assert.doesNotMatch(t, TURKCE, `API answer carries a Turkish letter: ${t.slice(0, 200)}`); return { s: r.status, j: JSON.parse(t) as Record<string, any> } }
const hastaEkle = async (jeton: string, dogumTarihi: string) => (await oku(await R.hastalar.POST(istek('/api/ulke/hastalar', jeton, { ad: 'QA Bemor Sinov', dil: 'uz', dogumTarihi, cinsiyet: 'male' })))).j.hasta.id as string
let sesNo = 0
async function muayeneVeNot(jeton: string, doktor: string, sablon: string, dogumTarihi: string) {
  const hasta = await hastaEkle(jeton, dogumTarihi)
  const yol = `uz/${doktor}/k${++sesNo}.webm`
  vt.depo.set(`muayene-sesleri/${yol}`, new Blob(['sentetik ses']))
  const m = await oku(await R.muayene.POST(istek('/api/ulke/muayene', jeton, { yol, hastaId: hasta, sablon, riza: true })))
  assert.equal(m.s, 200, JSON.stringify(m.j))
  const n = await oku(await R.not.POST(istek('/api/ulke/not', jeton, { seansId: m.j.seansId })))
  assert.equal(n.s, 200, JSON.stringify(n.j))
  const not = (await oku(await R.not.GET(istek(`/api/ulke/not?id=${n.j.notId}`, jeton)))).j.not
  return { hasta, seans: m.j.seansId as string, notId: n.j.notId as string, not }
}
const YETISKIN = '1980-12-31', COCUK = '2016-05-20'

before(async () => {
  R.NextRequest = (await import('next/server')).NextRequest
  R.rol = await import('../../../app/api/ulke/rol/route.ulke'); R.muayene = await import('../../../app/api/ulke/muayene/route.ulke'); R.hastalar = await import('../../../app/api/ulke/hastalar/route.ulke')
  R.not = await import('../../../app/api/ulke/not/route.ulke'); R.yeniden = await import('../../../app/api/ulke/not/yeniden-yaz/route.ulke'); R.onayla = await import('../../../app/api/ulke/not/onayla/route.ulke')
})

describe('40 roles: note templates', () => {
  it('every one of the 40 roles has a template of its own; the general template and anything unknown have no role field', () => {
    assert.deepEqual(Object.keys(UZ_ROL_ALANLARI).sort(), ROLLER.map((r) => r.rol).sort())
    for (const { rol } of ROLLER) {
      const alanlar = UZ_ROL_ALANLARI[rol]
      assert.ok(alanlar.length >= 5 && alanlar.length <= 8 && new Set(alanlar).size === alanlar.length, `${rol}: ${alanlar.length} fields`)
      for (const k of alanlar) assert.ok(uzAlanTanimi(k), `${rol}: unknown field ${k}`)
      assert.equal(uzSablonMu(rol), true); assert.deepEqual([...uzSablonAlanlari(rol)], [...alanlar])
    }
    assert.equal(new Set(ROLLER.map((r) => [...UZ_ROL_ALANLARI[r.rol]].sort().join())).size, 40, 'two roles with the same set of fields')
    assert.deepEqual([...uzSablonAlanlari('genel')], [])
    for (const ham of ['kadin-dogum', 'Pediatri', '', 'cardiology', 'constructor', '__proto__']) { assert.equal(uzSablonMu(ham), false, ham); assert.deepEqual([...uzSablonAlanlari(ham, { dogumTarihi: COCUK, muayeneTarihi: '2026-10-08' })], [], ham) }
    // Every field in the library is somebody's; none is left over to leak by accident.
    assert.deepEqual([...new Set(Object.values(UZ_ROL_ALANLARI).flat())].sort(), [...TUM_ALANLAR].sort())
    assert.equal(uzAlanTanimi('constructor'), null); assert.equal(uzAlanAdi('toString', 'ru'), null)
  })

  it('the file says the templates are machine-built, have no local reviewer, hold no reference content and are not taken from Türkiye', () => {
    const bas = readFileSync(join(KOK, 'countries/uz/klinik/notSablonlari.ts'), 'utf8').slice(0, 4200)
    for (const d of [/MACHINE-BUILT\. NO LOCAL REVIEWER YET\./, /NO CLINICAL REFERENCE CONTENT\./, /NOT TAKEN FROM TÜRKİYE\./, /LEAK RULE/]) assert.match(bas, d)
  })

  it('fields that are one specialty\'s alone stay that specialty\'s: no other role lists them', () => {
    const sahipler = (k: string) => ROLLER.filter((r) => UZ_ROL_ALANLARI[r.rol].includes(k)).map((r) => r.rol)
    assert.deepEqual(sahipler('head_circumference'), ['pediatri'])
    for (const k of ['visual_acuity', 'eye_pressure', 'fundus']) assert.deepEqual(sahipler(k), ['goz-hastaliklari'], k)
    for (const k of ['menstrual_history', 'obstetric_history', 'current_pregnancy', 'gyn_exam']) assert.deepEqual(sahipler(k), ['kadin-hastaliklari-dogum'], k)
    for (const k of ['chest_pain', 'ecg', 'echo']) assert.deepEqual(sahipler(k), ['kardiyoloji'], k)
    for (const k of ['mental_status', 'psychiatric_history']) assert.deepEqual(sahipler(k), ['psikiyatri'], k)
    for (const k of ['audiometry', 'tympanometry', 'hearing_aid']) assert.deepEqual(sahipler(k), ['odyoloji'], k)
    assert.deepEqual(sahipler('birth_history'), ['cocuk-cerrahisi', 'pediatri'])
    // The guardian field is nobody's: no role lists it. It comes from the patient's age alone.
    assert.deepEqual(sahipler(UZ_VASIY_ALANI), []); assert.ok(!TUM_ALANLAR.includes(UZ_VASIY_ALANI))
  })

  for (const { rol } of ROLLER) {
    it(`${rol}: every field label in three forms, each in its own script; no number, unit or source; nothing of Türkiye`, () => {
      for (const k of UZ_ROL_ALANLARI[rol]) {
        assert.match(k, /^[a-z][a-z0-9_]*$/, 'a field key is a plain identifier')
        const t = uzAlanTanimi(k)!
        assert.ok(['s', 'o', 'a', 'p'].includes(t.bolum))
        const [lat, kir, ru] = FORMLAR.map((f) => t.ad[f])
        assert.ok(lat.length >= 3 && kir.length >= 3 && ru.length >= 3, k)
        assert.doesNotMatch(lat, KIRILL, `${k}: uz-Latn has a Cyrillic letter`); assert.doesNotMatch(lat, /['`‘’]/, `${k}: uz-Latn uses a plain apostrophe`)
        assert.doesNotMatch(kir, /[A-Za-z]/, `${k}: uz-Cyrl has a Latin letter`); assert.doesNotMatch(ru, /[A-Za-zўқғҳЎҚҒҲ]/, `${k}: ru has a Latin or Uzbek-only letter`)
        for (const x of [lat, kir, ru]) { assert.doesNotMatch(x, TURKCE, k); assert.doesNotMatch(x, SAYI_VEYA_BIRIM, `${k}: a number or a unit in "${x}"`); assert.doesNotMatch(x, YALNIZ_TURKIYE, k); assert.doesNotMatch(x, KAYNAK, k); temiz(x, `field ${k}`); assert.ok(!x.includes(k), 'the key inside its label') }
      }
    })
  }

  it('a label names one field only: no two fields share a label in any form (a shared label would hide a leak)', () => {
    for (const f of FORMLAR) {
      const adlar = [...TUM_ALANLAR, UZ_VASIY_ALANI].map((k) => uzAlanAdi(k, f)!)
      assert.equal(new Set(adlar).size, adlar.length, `${f}: ${adlar.filter((a, i) => adlar.indexOf(a) !== i).join(' | ')}`)
      // …and no label is contained in another one: "is this label on the screen?" then has one answer.
      for (const a of adlar) for (const b of adlar) assert.ok(a === b || !b.includes(a), `${f}: "${a}" is inside "${b}"`)
    }
    assert.match(TUM_ALANLAR.map((k) => uzAlanAdi(k, 'uz-Cyrl')).join(' '), /ў/); assert.match(TUM_ALANLAR.map((k) => uzAlanAdi(k, 'uz-Cyrl')).join(' '), /ғ/)
    assert.equal(uzAlanAdi('chest_pain', 'tr'), uzAlanAdi('chest_pain', 'uz-Latn'), 'an unknown form is Uzbek Latin, never another country\'s language')
  })

  it('GUARDIAN WORDING FOLLOWS AGE in every role: under 18 → the one guardian field, first; adult → never, paediatrics included; unknown age → only the children\'s roles', () => {
    const gun = '2026-10-08'
    for (const sablon of ['genel', ...ROLLER.map((r) => r.rol)]) {
      const rolun = sablon === 'genel' ? [] : [...UZ_ROL_ALANLARI[sablon]]
      assert.deepEqual([...uzSablonAlanlari(sablon, { dogumTarihi: COCUK, muayeneTarihi: gun })], [UZ_VASIY_ALANI, ...rolun], `${sablon}: child`)
      assert.deepEqual([...uzSablonAlanlari(sablon, { dogumTarihi: YETISKIN, muayeneTarihi: gun })], rolun, `${sablon}: adult`)
      assert.deepEqual([...uzSablonAlanlari(sablon, { dogumTarihi: '', muayeneTarihi: gun })], ['pediatri', 'cocuk-cerrahisi'].includes(sablon) ? [UZ_VASIY_ALANI, ...rolun] : rolun, `${sablon}: unknown age`)
    }
    assert.equal(uzResitDegilMi('kardiyoloji', '2008-10-09', gun), true, 'the day before the eighteenth birthday'); assert.equal(uzResitDegilMi('kardiyoloji', '2008-10-08', gun), false, 'the eighteenth birthday')
    assert.equal(uzResitDegilMi('pediatri', '1990-01-01', gun), false, 'an adult in paediatrics is an adult')
    for (const f of FORMLAR) { const ad = uzAlanAdi(UZ_VASIY_ALANI, f)!; assert.ok(ad.length > 20); temiz(ad, 'guardian field'); assert.doesNotMatch(ad, TURKCE) }
  })

  it('an allied profession\'s note has "the specialist\'s assessment"; a doctor\'s note keeps the shared heading', () => {
    for (const { rol, taraf } of ROLLER) for (const f of FORMLAR) {
      const baslik = uzBolumAdi(rol, 'a', f)
      if (taraf === 'klinik-muttefik') { assert.ok(baslik && baslik.length > 8, `${rol}/${f}`); temiz(baslik!, 'heading'); if (f !== 'uz-Latn') assert.doesNotMatch(baslik!, /[A-Za-z]/) } else assert.equal(baslik, null, `${rol}/${f}`)
      for (const b of ['s', 'o', 'p'] as const) assert.equal(uzBolumAdi(rol, b, f), null)
    }
    assert.equal(uzBolumAdi('genel', 'a', 'ru'), null)
  })

  it('NO CLINICAL REFERENCE CONTENT: what a template would need is a slot — every one empty and switched off, every role has at least one', () => {
    assert.deepEqual(Object.keys(UZ_YEREL_ICERIK).sort(), ROLLER.map((r) => r.rol).sort())
    const hepsi = [...Object.values(UZ_YEREL_ICERIK).flat(), ...UZ_ORTAK_YEREL_ICERIK]
    assert.equal(hepsi.length, 75)
    for (const { rol } of ROLLER) assert.ok(UZ_YEREL_ICERIK[rol].length >= 1, rol)
    for (const y of hepsi) {
      assert.equal(y.acik, false, y.anahtar); assert.equal(y.icerik, null, y.anahtar); assert.equal(y.kimden, 'a local clinician')
      assert.ok(y.eksik.length > 20 && !TURKCE.test(y.eksik), y.anahtar); assert.doesNotMatch(y.eksik, YALNIZ_TURKIYE)
    }
    // The four the brief names: a vaccination schedule, a growth standard, dosing, a national protocol — slots, not content.
    const pediatri = UZ_YEREL_ICERIK.pediatri.map((y) => y.anahtar)
    for (const a of ['vaccination_calendar', 'growth_standard', 'pediatric_dosing']) assert.ok(pediatri.includes(a), a)
    assert.ok(UZ_ORTAK_YEREL_ICERIK.some((y) => y.anahtar === 'medicines_register'))
    // No screen and no instruction reads a slot.
    const { readdirSync } = require('node:fs') as typeof import('node:fs')
    for (const d of [...readdirSync(join(KOK, 'countries/uz/uygulama')).map((a) => `countries/uz/uygulama/${a}`), ...readdirSync(join(KOK, 'components/ulke/uygulama')).map((a) => `components/ulke/uygulama/${a}`), 'countries/uz/arayuz.ts', 'countries/uz/klinik/talimatlar.ts', 'countries/uz/klinik/index.ts', 'lib/ulke/uygulama/notlar.ts'].filter((x) => /\.tsx?$/.test(x) && !x.endsWith('.test.ts'))) {
      assert.doesNotMatch(readFileSync(join(KOK, d), 'utf8'), /UZ_YEREL_ICERIK|UZ_ORTAK_YEREL_ICERIK/, `${d} reads a slot`)
    }
  })
})

describe('40 roles: the Uzbekistan document', () => {
  it('has a status row for every role (machine-built, no reviewer) and a "needs local content" row for every slot', () => {
    const belge = readFileSync(join(KOK, 'docs/COUNTRY-PACK-UZBEKISTAN.md'), 'utf8')
    for (const { rol, tamAd } of ROLLER) {
      const satir = belge.split('\n').find((x) => x.startsWith('| ') && x.includes(`| \`${rol}\` |`) && x.includes('| yes |'))
      assert.ok(satir, `${rol}: no status row`)
      for (const x of [tamAd, UZ_ROL_ADLARI[rol]['uz-Latn'], UZ_ROL_ADLARI[rol].ru, `| ${UZ_ROL_ALANLARI[rol].length} |`, '| none yet |', ...UZ_YEREL_ICERIK[rol].map((y) => `\`${y.anahtar}\``)]) assert.ok(satir!.includes(x), `${rol}: status row lacks "${x}"`)
      for (const y of UZ_YEREL_ICERIK[rol]) assert.ok(belge.includes(`| \`${rol}\` (${UZ_ROL_ADLARI[rol].ru}) | \`${y.anahtar}\` | ${y.eksik} | a local clinician |`), `${rol}/${y.anahtar}: no "needs local content" row`)
    }
    for (const y of UZ_ORTAK_YEREL_ICERIK) assert.ok(belge.includes(`| all 40 roles | \`${y.anahtar}\` | ${y.eksik} | a local clinician |`), y.anahtar)
    assert.equal(belge.split('\n').filter((x) => x.endsWith('| a local clinician |')).length, 75)
    assert.match(belge, /Machine-derived\*\* from the Latin form by rule/)
  })
})

describe('40 roles: instructions to the model', () => {
  let T: typeof import('./talimatlar')
  before(async () => { T = await import('./talimatlar') })
  /** Text a person reads: keys and the JSON shape are the contract with the code, not prose. */
  const duzyazi = (t: string) => t.replace(/\{"s": "…", "o": "…", "a": "…", "p": "…"(, "fields": \{[^}]*\})?\}/g, '').replace(/\bJSON\b/g, '').replace(/(^|\n)[soap] (—|бўлимида|boʻlimida)/g, '$1').replace(/(^|\n)a (бўлимига|boʻlimiga)/g, '$1').replace(/раздел[еа]? [soa]\b/g, '').replace(/(^|\n)- [a-z][a-z0-9_]* — /g, '$1').replace(/"fields"/g, '')

  for (const { rol, taraf } of ROLLER) {
    it(`${rol}: one instruction per form, built from this role's template — its fields and no other role's; no source, no protocol, no number`, () => {
      const alanlar = [...UZ_ROL_ALANLARI[rol]]
      for (const f of FORMLAR) {
        const t = T.uzNotTalimati(f, rol)
        assert.ok(t && t.length > 1500, `${rol}/${f}`)
        assert.equal(t, T.uzNotTalimati(f, rol), 'fixed text: the same every time (it is the cached block)')
        const blok = T.uzRolBlogu(f, rol)!
        assert.ok(t!.includes(blok) && blok.includes(`«${UZ_ROL_ADLARI[rol][f]}»`), 'the role is named, by its name in this form')
        // The fields asked for are exactly this role's, in order, each with its label in this form.
        assert.deepEqual([...t!.matchAll(/^- ([a-z][a-z0-9_]*) — (.+)$/gm)].map((x) => [x[1], x[2]]), alanlar.map((k) => [k, uzAlanAdi(k, f)]))
        assert.ok(t!.includes(`"fields": {${alanlar.map((k) => `"${k}": "…"`).join(', ')}}}`), 'the answer format lists this role\'s keys')
        for (const k of TUM_ALANLAR) if (!alanlar.includes(k)) { assert.ok(!new RegExp(`(^|[^a-z_])${k}([^a-z_]|$)`).test(t!), `${rol}/${f}: names the field ${k} of another role`); assert.ok(!t!.includes(uzAlanAdi(k, f)!), `${rol}/${f}: carries the label of ${k}`) }
        // The guardian field is not in a role's fixed instruction: it depends on the patient, so it goes in the message.
        assert.ok(!t!.includes(UZ_VASIY_ALANI))
        // The same nine rules as every note, and "cite no source".
        assert.deepEqual([...t!.matchAll(/^(\d)\. /gm)].map((x) => x[1]), ['1', '2', '3', '4', '5', '6', '7', '8', '9'])
        assert.match(t!, { 'uz-Latn': /Hech qanday manbaga havola qilmang/, 'uz-Cyrl': /Ҳеч қандай манбага ҳавола қилманг/, ru: /Не ссылайтесь ни на какие источники/ }[f])
        assert.match(t!, { 'uz-Latn': /maydonni boʻsh qoldiring/, 'uz-Cyrl': /майдонни бўш қолдиринг/, ru: /оставьте поле пустым/ }[f], 'a field stays empty when the visit did not contain it')
        // An allied profession is told the colleague is not a doctor and that no medical diagnosis is to be made; a doctor role is not.
        assert.equal(/shifokor emas|шифокор эмас|не врач/.test(blok), taraf === 'klinik-muttefik', `${rol}/${f}`)
        assert.equal(/Tibbiy tashxis qoʻymang|Тиббий ташхис қўйманг|Медицинский диагноз не ставьте/.test(blok), taraf === 'klinik-muttefik', `${rol}/${f}`)
        // Script, leak, sources, reference content.
        const d = duzyazi(t!)
        if (f === 'uz-Latn') { assert.doesNotMatch(d, KIRILL); assert.doesNotMatch(d, /['`‘’]/) }
        if (f === 'uz-Cyrl') assert.doesNotMatch(d, /[A-Za-z]/, `${rol}: Latin letter "${d.match(/[A-Za-z_]+/)?.[0]}" in the Cyrillic instruction`)
        if (f === 'ru') assert.doesNotMatch(d, /[A-Za-zўқғҳЎҚҒҲ]/, `${rol}: "${d.match(/[A-Za-zўқғҳ_]+/)?.[0]}" in the Russian instruction`)
        temiz(t!, `instruction ${rol}/${f}`); assert.doesNotMatch(t!, TURKCE); assert.doesNotMatch(t!, YALNIZ_TURKIYE); assert.doesNotMatch(t!, KAYNAK)
        assert.doesNotMatch(blok, SAYI_VEYA_BIRIM, `${rol}/${f}: a number or a unit in the role's block`)
        assert.doesNotMatch(t!, /protokol(i|lari)?ga (muvofiq|asosan)|протокол(и|лари)?га (мувофиқ|асосан)|(в соответствии с|согласно) (клиническ|национальн|протокол)/i)
        // Nothing about the assistant's persona, a doctor or a patient is in the instruction.
        for (const a of UZ_ASISTAN_ADLARI) assert.ok(!t!.includes(a.kisaAd), `${rol}/${f}: an assistant's name in the instruction`)
      }
    })
  }

  it('40 roles × 3 forms: 120 different instructions; the general one is not any of them; another country\'s language has none', () => {
    const hepsi = ROLLER.flatMap((r) => FORMLAR.map((f) => T.uzNotTalimati(f, r.rol)!))
    assert.equal(new Set(hepsi).size, 120)
    for (const f of FORMLAR) { assert.ok(!hepsi.includes(T.uzNotTalimati(f, 'genel')!)); assert.ok(!T.uzNotTalimati(f, 'genel')!.includes('fields')) }
    for (const { rol } of ROLLER) assert.equal(T.uzNotTalimati('tr', rol), null)
    assert.equal(T.uzRolBlogu('ru', 'genel'), null); assert.equal(T.uzRolBlogu('ru', 'kadin-dogum'), null)
  })

  it('the visit message: age and sex; for a patient under 18 one line asking who gave the information — in every role, in the note\'s language; nothing for an adult', () => {
    for (const { rol } of ROLLER) for (const f of FORMLAR) {
      const cocuk = T.uzNotGirdisi(f, { dogumTarihi: COCUK, cinsiyet: 'male', muayeneTarihi: '2026-10-08', metin: 'MATN', sablon: rol })
      const yetiskin = T.uzNotGirdisi(f, { dogumTarihi: YETISKIN, cinsiyet: 'male', muayeneTarihi: '2026-10-08', metin: 'MATN', sablon: rol })
      assert.ok(cocuk.includes(UZ_VASIY_ALANI) && cocuk.split('\n').length === yetiskin.split('\n').length + 1, `${rol}/${f}`)
      assert.ok(!yetiskin.includes(UZ_VASIY_ALANI) && !/ota-ona|ота-она|родител|vakil|вакил|представител/.test(yetiskin), `${rol}/${f}: guardian wording for an adult`)
      for (const x of [cocuk, yetiskin]) { temiz(x, 'visit message'); assert.doesNotMatch(x, TURKCE) }
    }
  })

  it('the rewrite carries the note\'s fields under the same keys and is told to add none', () => {
    for (const f of FORMLAR) {
      const y = T.uzYenidenYazimTalimati(f)!
      assert.match(y, /"fields"/); temiz(y, 'rewrite instruction'); assert.doesNotMatch(y, KAYNAK)
      assert.equal(T.uzYenidenYazimGirdisi(f, { ...NOT_GOVDESI, alanlar: { ecg: 'x' } }).split('\n')[1], JSON.stringify({ ...NOT_GOVDESI, fields: { ecg: 'x' } }))
      assert.equal(T.uzYenidenYazimGirdisi(f, NOT_GOVDESI).split('\n')[1], JSON.stringify(NOT_GOVDESI), 'a note without fields is sent as before')
    }
  })
})

describe('40 roles: visit → draft in the role\'s template, with a model that returns every role\'s fields', () => {
  let Not: typeof import('@/components/ulke/uygulama/Not')
  let Muayene: typeof import('@/components/ulke/uygulama/Muayene')
  let Kabuk: typeof import('@/components/ulke/uygulama/Kabuk')
  let M: typeof import('../uygulama/metinler')
  let T: typeof import('./talimatlar')
  let K: typeof import('./asistanKimligi')
  let Layout: typeof import('../../../app/layout.ulke')
  before(async () => {
    Not = await import('@/components/ulke/uygulama/Not'); Muayene = await import('@/components/ulke/uygulama/Muayene'); Kabuk = await import('@/components/ulke/uygulama/Kabuk'); M = await import('../uygulama/metinler')
    T = await import('./talimatlar'); K = await import('./asistanKimligi'); Layout = await import('../../../app/layout.ulke')
  })
  const bos = () => {}
  const ciz = (f: Form, not: import('@/components/ulke/uygulama/Not').NotDetayi) => renderToStaticMarkup(React.createElement(Layout.default, null, React.createElement(Kabuk.Cerceve, { dil: f, m: M.uygulamaMetni(f), ad: 'QA Shifokor', aktif: 'bugun', cikis: bos, children:
    React.createElement(Not.NotGorunumu, { m: M.uygulamaMetni(f), not, aktifDil: not.dil, setAktifDil: bos, icerik: not.icerik, setIcerik: bos, islem: null, bildirim: null, kaydet: bos, yenidenYaz: bos, onayla: bos }) })))

  ROLLER.forEach(({ rol, taraf }, i) => {
    // The three forms take turns across the 40 roles, so every form writes notes for doctors and for allied roles.
    const f = FORMLAR[i % 3]
    it(`${rol} (${f}): role on the account → visit → draft with this role's fields only; nothing of the other 39 roles is stored, returned or drawn`, async () => {
      sifirla(f)
      assert.deepEqual(await oku(await R.rol.POST(istek('/api/ulke/rol', 'jeton-a', { rol }))), { s: 200, j: { ok: true, rol } })
      const alanlar = [...UZ_ROL_ALANLARI[rol]]
      const baskaRol = ROLLER[(i + 7) % 40].rol
      // Another role's template is refused for this account; nothing reaches the speech engine.
      vt.depo.set(`muayene-sesleri/uz/${A}/yabanci.webm`, new Blob(['sentetik ses']))
      assert.deepEqual(await oku(await R.muayene.POST(istek('/api/ulke/muayene', 'jeton-a', { yol: `uz/${A}/yabanci.webm`, hastaId: await hastaEkle('jeton-a', YETISKIN), sablon: baskaRol, riza: true }))), { s: 400, j: { code: 'GECERSIZ', alan: 'sablon' } })
      assert.equal(vt.tablo('ulke_muayeneler').length, 0)

      // ── an ADULT patient
      const y = await muayeneVeNot('jeton-a', A, rol, YETISKIN)
      assert.equal(model.cagrilar.length, 1)
      assert.equal(model.cagrilar[0].sistem, T.uzNotTalimati(f, rol), 'the model got THIS role\'s instruction, in the doctor\'s note language')
      assert.ok(!/QA Bemor|Sinov/.test(model.cagrilar[0].sistem + model.cagrilar[0].kullanici), 'the patient\'s name went to the model')
      assert.ok(!model.cagrilar[0].kullanici.includes(UZ_VASIY_ALANI), 'guardian wording for an adult')
      assert.deepEqual([vt.tablo('ulke_muayeneler')[0].specialty, vt.tablo('muayene_dil_kaydi')[0].sablon], [rol, rol])
      // Stored: this role's fields, each with what the model said for it — and not one key more.
      const satir = vt.tablo('not_dil_kaydi').find((s) => s.note_id === y.notId)!
      assert.deepEqual(satir.alanlar, Object.fromEntries(alanlar.map((k) => [k, isaret(k)])), `${rol}: stored fields`)
      assert.equal(satir.doctor_id, A)
      // Returned: the same, and the list of keys the screen may draw.
      assert.deepEqual(y.not.alanAnahtarlari, alanlar); assert.deepEqual(y.not.icerik, { ...NOT_GOVDESI, alanlar: satir.alanlar }); assert.equal(y.not.muayene.sablon, rol)
      const yanit = JSON.stringify(y.not)
      for (const k of [...TUM_ALANLAR, UZ_VASIY_ALANI, 'made_up_key', 'constructor', 'Chest_Pain']) if (!alanlar.includes(k)) assert.ok(!yanit.includes(isaret(k)), `${rol}: the answer carries ${k}, a field of another role`)

      // Drawn, in each of the three forms: this role's labels, this role's assistant — and no label or text of another role.
      for (const ekran of FORMLAR) {
        const m = M.uygulamaMetni(ekran)
        const html = ciz(ekran, y.not)
        const g = gorunurMetin(html)
        assert.deepEqual([...html.matchAll(/data-alan-anahtar="([a-z0-9_]+)"/g)].map((x) => x[1]).sort(), [...alanlar].sort(), `${rol}/${ekran}: fields drawn`)
        for (const k of alanlar) { assert.ok(g.includes(uzAlanAdi(k, ekran)!), `${rol}/${ekran}: label of ${k}`); assert.ok(html.includes(`>${isaret(k)}</textarea>`), `${rol}/${ekran}: text of ${k}`) }
        for (const k of [...TUM_ALANLAR, UZ_VASIY_ALANI]) if (!alanlar.includes(k)) { assert.ok(!g.includes(uzAlanAdi(k, ekran)!), `${rol}/${ekran}: LEAK — the label of ${k} ("${uzAlanAdi(k, ekran)}")`); assert.ok(!html.includes(isaret(k)), `${rol}/${ekran}: LEAK — the text of ${k}`) }
        assert.ok(!html.includes('made_up_key') && !g.includes('QIYMAT-made'))
        // Keys are never read by a person (they are attributes and ids, not text).
        for (const k of alanlar) assert.ok(!new RegExp(`(^|[^a-zA-Z_-])${k}([^a-zA-Z_-]|$)`).test(g), `${rol}/${ekran}: the key ${k} is visible`)
        assert.match(html, new RegExp(`data-alan="asistan-ad">${K.uzAsistanKimligi(rol, ekran)!.tamAd.replace('.', '\\.')}<`), `${rol}/${ekran}: the assistant on the draft`)
        assert.ok(g.includes(UZ_ROL_ADLARI[rol][ekran]), 'the template is named by the role\'s name')
        assert.ok(g.includes(taraf === 'klinik-muttefik' ? uzBolumAdi(rol, 'a', ekran)! : m.not.a)); if (taraf === 'klinik-muttefik') assert.ok(!g.includes(m.not.a), `${rol}/${ekran}: a doctor's heading on an allied note`)
        temiz(html, `note draft ${rol}/${ekran}`); temiz(g, `note draft ${rol}/${ekran} (visible)`); assert.doesNotMatch(html, /[çğıİşĞŞ]/)
      }
      // The visit screen names the template and the assistant; the screen's own gate refuses a key the template does not own.
      const kayit = renderToStaticMarkup(React.createElement(Muayene.KayitGorunumu, { m: M.uygulamaMetni(f), hasta: { id: y.hasta, ad: 'QA Bemor Sinov', otaIsmi: '' }, sablon: Muayene.hesapSablonu(rol), riza: false, setRiza: bos, durum: 'hazir', sure: 0, hataKodu: null, baslat: bos, durdur: bos, vazgec: bos, rol }))
      assert.ok(kayit.includes(`data-alan="sablon">${UZ_ROL_ADLARI[rol][f]}<`) && kayit.includes(`data-alan="asistan-ad">${K.uzAsistanKimligi(rol, f)!.tamAd}<`))
      const sizdirilmis = { ...y.not, alanAnahtarlari: [...alanlar, ...UZ_ROL_ALANLARI[baskaRol], UZ_VASIY_ALANI, 'made_up_key'], icerik: { ...y.not.icerik, alanlar: DUSMAN_ALANLAR } }
      assert.deepEqual(Object.values(Not.notAlanlari(sizdirilmis)).flat().sort(), [...alanlar].sort(), 'the screen draws a key only when the template owns it, whatever the server lists')

      // ── a CHILD, same role: the guardian field appears — and only that is added.
      const c = await muayeneVeNot('jeton-a', A, rol, COCUK)
      assert.ok(model.cagrilar[1].kullanici.includes(UZ_VASIY_ALANI), `${rol}: a child's visit asks who gave the information`)
      assert.equal(model.cagrilar[1].sistem, model.cagrilar[0].sistem, 'the instruction itself does not change with the patient')
      assert.deepEqual(c.not.alanAnahtarlari, [UZ_VASIY_ALANI, ...alanlar])
      assert.deepEqual(vt.tablo('not_dil_kaydi').find((s) => s.note_id === c.notId)!.alanlar, Object.fromEntries([UZ_VASIY_ALANI, ...alanlar].map((k) => [k, isaret(k)])))
      assert.ok(gorunurMetin(ciz(f, c.not)).includes(uzAlanAdi(UZ_VASIY_ALANI, f)!))

      // ── a request cannot add another role's field either: saving drops it.
      const kayitli = await oku(await R.not.PATCH(istek('/api/ulke/not', 'jeton-a', { notId: y.notId, dil: f, ...NOT_GOVDESI, alanlar: { ...DUSMAN_ALANLAR, [alanlar[0]]: 'tahrir' } }, 'PATCH')))
      assert.equal(kayitli.s, 200)
      assert.deepEqual(vt.tablo('not_dil_kaydi').find((s) => s.note_id === y.notId)!.alanlar, { ...Object.fromEntries(alanlar.map((k) => [k, isaret(k)])), [alanlar[0]]: 'tahrir' })
    })
  })

  it('no role on the account → the general template: four sections, no role field, the neutral assistant — whatever the model returns', async () => {
    sifirla('ru')
    const y = await muayeneVeNot('jeton-b', B, 'genel', YETISKIN)
    assert.equal(model.cagrilar[0].sistem, T.uzNotTalimati('ru', 'genel'))
    assert.deepEqual(y.not.alanAnahtarlari, []); assert.deepEqual(y.not.icerik, NOT_GOVDESI)
    assert.ok(!('alanlar' in vt.tablo('not_dil_kaydi')[0]))
    const html = ciz('ru', y.not)
    assert.ok(!html.includes('data-alan-anahtar') && !html.includes('QIYMAT-'))
    assert.ok(html.includes(`data-alan="asistan-ad">${M.uygulamaMetni('ru').asistan.notr.replace('%', 'Notya')}<`))
    for (const a of UZ_ASISTAN_ADLARI) assert.ok(!html.includes(K.uzAsistanKimligi(a.bransAnahtari, 'ru')!.kisaAd), `the neutral draft shows ${a.bransAnahtari}'s assistant`)
    // A child with the general template: the guardian field, and still no role field.
    const c = await muayeneVeNot('jeton-b', B, 'genel', COCUK)
    assert.deepEqual(c.not.alanAnahtarlari, [UZ_VASIY_ALANI]); assert.deepEqual(c.not.icerik.alanlar, { [UZ_VASIY_ALANI]: isaret(UZ_VASIY_ALANI) })
    // An account without a role cannot borrow a role's template.
    vt.depo.set(`muayene-sesleri/uz/${B}/x.webm`, new Blob(['sentetik ses']))
    assert.deepEqual(await oku(await R.muayene.POST(istek('/api/ulke/muayene', 'jeton-b', { yol: `uz/${B}/x.webm`, hastaId: y.hasta, sablon: 'kardiyoloji', riza: true }))), { s: 400, j: { code: 'GECERSIZ', alan: 'sablon' } })
  })

  it('second draft and approval keep the fields in their role: a rewrite adds none; approving the other draft swaps them; an approved note\'s fields cannot change; a note keeps its template when the role changes', async () => {
    sifirla('uz-Latn')
    await R.rol.POST(istek('/api/ulke/rol', 'jeton-a', { rol: 'goz-hastaliklari' }))
    const alanlar = [...UZ_ROL_ALANLARI['goz-hastaliklari']]
    const y = await muayeneVeNot('jeton-a', A, 'goz-hastaliklari', YETISKIN)
    // The doctor clears two fields; the rewrite is made from what is left.
    const kalan = Object.fromEntries(alanlar.slice(0, 4).map((k) => [k, `uz ${k}`]))
    assert.equal((await oku(await R.not.PATCH(istek('/api/ulke/not', 'jeton-a', { notId: y.notId, dil: 'uz-Latn', ...NOT_GOVDESI, alanlar: kalan }, 'PATCH')))).s, 200)
    assert.deepEqual(await oku(await R.yeniden.POST(istek('/api/ulke/not/yeniden-yaz', 'jeton-a', { notId: y.notId }))), { s: 200, j: { dil: 'ru' } })
    assert.ok(model.cagrilar[1].kullanici.includes(JSON.stringify({ ...NOT_GOVDESI, fields: kalan })), 'the rewrite was given the note\'s own fields')
    let satir = vt.tablo('not_dil_kaydi')[0]
    assert.deepEqual(satir.alanlar, kalan)
    assert.deepEqual(satir.ikinci_alanlar, Object.fromEntries(alanlar.slice(0, 4).map((k) => [k, isaret(k)])), 'the rewrite returned every role\'s fields; only the four the note had were kept')
    const okunan = (await oku(await R.not.GET(istek(`/api/ulke/not?id=${y.notId}`, 'jeton-a')))).j.not
    assert.deepEqual(okunan.ikinci.icerik.alanlar, satir.ikinci_alanlar); assert.deepEqual(okunan.alanAnahtarlari, alanlar)
    // Approve the Russian draft with one field edited on the screen (and a foreign key smuggled in).
    const ekrandaki = { ...(satir.ikinci_alanlar as Record<string, string>), [alanlar[0]]: 'ru tahrir', chest_pain: 'YABANCI', made_up_key: 'YABANCI' }
    assert.equal((await oku(await R.onayla.POST(istek('/api/ulke/not/onayla', 'jeton-a', { notId: y.notId, dil: 'ru', s: 'ru s', o: 'ru o', a: 'ru a', p: 'ru p', alanlar: ekrandaki })))).s, 200)
    satir = vt.tablo('not_dil_kaydi')[0]
    assert.deepEqual([satir.not_dili, satir.ikinci_dil], ['ru', 'uz-Latn'])
    assert.deepEqual(satir.alanlar, { ...Object.fromEntries(alanlar.slice(0, 4).map((k) => [k, isaret(k)])), [alanlar[0]]: 'ru tahrir' }); assert.deepEqual(satir.ikinci_alanlar, kalan)
    // Approved: neither a save nor a second approval changes a field.
    const once = JSON.stringify(vt.tablo('not_dil_kaydi'))
    for (const r of [await R.not.PATCH(istek('/api/ulke/not', 'jeton-a', { notId: y.notId, dil: 'ru', s: 'x', o: '', a: '', p: '', alanlar: { [alanlar[0]]: 'GEC' } }, 'PATCH')), await R.onayla.POST(istek('/api/ulke/not/onayla', 'jeton-a', { notId: y.notId, dil: 'ru', s: 'x', o: 'x', a: 'x', p: 'x', alanlar: { [alanlar[0]]: 'GEC' } }))]) assert.deepEqual(await oku(r), { s: 409, j: { code: 'ONAYLI' } })
    assert.equal(JSON.stringify(vt.tablo('not_dil_kaydi')), once)
    // The account becomes a cardiologist: the eye note is still an eye note, and the other doctor still cannot see it.
    await R.rol.POST(istek('/api/ulke/rol', 'jeton-a', { rol: 'kardiyoloji' }))
    const sonra = (await oku(await R.not.GET(istek(`/api/ulke/not?id=${y.notId}`, 'jeton-a')))).j.not
    assert.deepEqual(sonra.alanAnahtarlari, alanlar); assert.equal(sonra.muayene.sablon, 'goz-hastaliklari'); assert.equal(sonra.icerik.alanlar[alanlar[0]], 'ru tahrir')
    assert.deepEqual(await oku(await R.not.GET(istek(`/api/ulke/not?id=${y.notId}`, 'jeton-b'))), { s: 404, j: { code: 'NOT_FOUND' } })
    // Same-language approval: the fields as on the screen are written only by the request that approved.
    const k = await muayeneVeNot('jeton-a', A, 'kardiyoloji', YETISKIN)
    assert.equal((await oku(await R.onayla.POST(istek('/api/ulke/not/onayla', 'jeton-a', { notId: k.notId, dil: 'uz-Latn', ...NOT_GOVDESI, alanlar: { ecg: 'tasdiqlangan', visual_acuity: 'YABANCI' } })))).s, 200)
    assert.deepEqual(vt.tablo('not_dil_kaydi').find((s) => s.note_id === k.notId)!.alanlar, { ecg: 'tasdiqlangan' })
  })

  it('every query on a note\'s fields carries the doctor\'s id; stored keys of another role are not shown even if they sit in the row', async () => {
    sifirla('uz-Latn')
    await R.rol.POST(istek('/api/ulke/rol', 'jeton-a', { rol: 'uroloji' }))
    const y = await muayeneVeNot('jeton-a', A, 'uroloji', YETISKIN)
    for (const q of vt.sorgular.filter((x) => x.tablo === 'not_dil_kaydi' && x.islem !== 'insert')) assert.ok(q.filtreler.includes(`doctor_id=eq.${A}`), JSON.stringify(q))
    // A row tampered with outside the application: foreign keys are filtered on the way out.
    Object.assign(vt.tablo('not_dil_kaydi')[0], { alanlar: { ...(vt.tablo('not_dil_kaydi')[0].alanlar as object), head_circumference: 'YABANCI', made_up_key: 'YABANCI' } })
    const n = (await oku(await R.not.GET(istek(`/api/ulke/not?id=${y.notId}`, 'jeton-a')))).j.not
    assert.deepEqual(Object.keys(n.icerik.alanlar).sort(), [...UZ_ROL_ALANLARI.uroloji].sort()); assert.ok(!JSON.stringify(n).includes('YABANCI'))
  })
})
