/**
 * NOTYA-UZ-MUAYENE-01 — the NOTE of a visit in an Uzbekistan build (NOTYA_COUNTRY=uz): written by the model from the
 * pack's own instructions, rewritten in the other language as a second draft, edited, approved, never overwritten.
 *
 * Real handlers, real components and the REAL model gateway (lib/ai/cagir.ts) — with the network replaced: the
 * speech provider and the model provider are stand-ins inside this process. No audio, no transcript and no note
 * leaves it; any other address fails the test. Synthetic accounts, patients, transcripts and notes only.
 *
 *   1. INSTRUCTIONS: the pack's, written in Uzbek (both scripts) and Russian; no Turkish source, no protocol claimed.
 *   2. MODEL POLICY: the call goes through the one gateway, by task; no model name on this side.
 *   3. NOTE: in the doctor's note language; one click → a second draft in the other language; approve one of them.
 *   4. AN APPROVED NOTE IS NEVER OVERWRITTEN.
 *   5. BOUNDARY: the gateway's Turkish errors become codes; the screen has the pack's wording.
 *   6. ISOLATION between two doctors on every note route, both directions.
 *   7. LEAK TEST over the instructions and the note screens in the three forms.
 */
process.env.NOTYA_COUNTRY = 'uz'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0003'
process.env.ELEVENLABS_API_KEY = 'sahte-konusma-anahtari'
process.env.OPENROUTER_API_KEY = 'sahte-model-anahtari'
delete process.env.OPENROUTER_BASE_URL

// NOTYA-UZ-ACILIS-02: the pack's page entry now imports photographs and shared landing components.
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

// ───────────────────────── stand-in providers (speech + model) ─────────────────────────
type ModelCagrisi = { model: string; sistem: string; kullanici: string; onbellekli: boolean; veriToplama: unknown; anahtar: string | null }
const model = { cagrilar: [] as ModelCagrisi[], cevaplar: [] as (Record<string, string> | string | number)[] }
const UZ_METIN = 'Shifokor: Nima bezovta qilyapti? Ona: Qizimning uch kundan beri isitmasi bor, yoʻtal va burun bitishi kuzatilmoqda. Shifokor: Tomogʻi qizargan, oʻpkasi toza. Paratsetamol bering, uch kundan keyin keling.'
const SCRIBE = 'https://api.elevenlabs.io/v1/speech-to-text'
const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions'
let sttCevabi = { language_code: 'uzb', language_probability: 0.97, text: UZ_METIN, words: UZ_METIN.split(' ').map((k, i) => ({ text: k, type: 'word', start: i, end: i + 0.5, logprob: -0.08 })) }
globalThis.fetch = (async (g: unknown, o?: { body?: unknown; headers?: Record<string, string> }) => {
  const adres = String(g)
  if (adres === SCRIBE) return new Response(JSON.stringify(sttCevabi), { status: 200 })
  if (adres !== OPENROUTER) throw new Error(`this test may not use the network: ${adres}`)
  const b = JSON.parse(String(o?.body)) as { model: string; messages: { role: string; content: unknown }[]; provider?: { data_collection?: unknown } }
  const sistemParcalari = (b.messages.find((m) => m.role === 'system')?.content ?? []) as { text?: string; cache_control?: unknown }[] | string
  model.cagrilar.push({
    model: b.model,
    sistem: typeof sistemParcalari === 'string' ? sistemParcalari : sistemParcalari.map((p) => p.text ?? '').join('\n'),
    onbellekli: typeof sistemParcalari !== 'string' && sistemParcalari.some((p) => p.cache_control),
    kullanici: b.messages.filter((m) => m.role === 'user').map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content))).join('\n'),
    veriToplama: b.provider?.data_collection,
    anahtar: o?.headers?.Authorization ?? o?.headers?.authorization ?? null,
  })
  const c = model.cevaplar.shift()
  if (c === undefined) throw new Error('the model was called more often than the test allows')
  // A provider error in Turkish that quotes a patient: it must not travel past the server.
  if (typeof c === 'number') return new Response(JSON.stringify({ error: { code: c, message: 'Sağlayıcı hatası — hasta Karimova Dilnoza' } }), { status: c })
  const icerik = typeof c === 'string' ? c : JSON.stringify(c)
  return new Response(JSON.stringify({ id: 'sahte-1', model: b.model, choices: [{ message: { role: 'assistant', content: icerik }, finish_reason: 'stop' }], usage: { prompt_tokens: 900, completion_tokens: 220 } }), { status: 200 })
}) as typeof fetch

const UZ_NOT = { s: 'Onasi aytishicha, uch kundan beri isitma, yoʻtal va burun bitishi.', o: 'Tomogʻi qizargan, oʻpkasi toza.', a: 'Shifokor tashxisni aytmadi.', p: 'Paratsetamol, uch kundan keyin qayta koʻrik.' }
const RU_NOT = { s: 'Со слов матери, третий день температура, кашель и заложенность носа.', o: 'Зев гиперемирован, в лёгких чисто.', a: 'Врач диагноз не назвал.', p: 'Парацетамол, повторный приём через три дня.' }

const A = '10000000-0000-4000-8000-00000000000a'
const B = '10000000-0000-4000-8000-00000000000b'
const C = '10000000-0000-4000-8000-00000000000c'
function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  model.cagrilar = []; model.cevaplar = []
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: A, email: 'qa-a@notya.test', app_metadata: { country: 'uz' } },
    'jeton-b': { id: B, email: 'qa-b@notya.test', app_metadata: { country: 'uz' } },
    'jeton-c': { id: C, email: 'qa-c@notya.test', app_metadata: { country: 'uz' } },
    'jeton-tr': { id: '10000000-0000-4000-8000-00000000000d', email: 'qa-tr@notya.test', app_metadata: { country: 'tr' } },
  })
  vt.tablo('users').push({ id: A, full_name: 'QA Shifokor A', country: 'uz', ui_language: 'uz-Latn' }, { id: B, full_name: 'QA Врач Б', country: 'uz', ui_language: 'ru' }, { id: C, full_name: 'QA Шифокор В', country: 'uz', ui_language: 'uz-Cyrl' })
  // A: Uzbek Latin everywhere. B: Russian everywhere. C: reads the application in Uzbek Cyrillic, writes notes in Russian.
  vt.tablo('hekim_dil_tercihleri').push({ doctor_id: A, not_dili: 'uz-Latn', soruldu_at: 'x' }, { doctor_id: B, not_dili: 'ru', soruldu_at: 'x' }, { doctor_id: C, not_dili: 'ru', soruldu_at: 'x' })
}

const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
const ON_EK = '/uzbek'
const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak }), [])
const TURKCE = /[çğıİşĞŞ]/

type Rotalar = {
  muayene: typeof import('../../../app/api/ulke/muayene/route.ulke')
  hastalar: typeof import('../../../app/api/ulke/hastalar/route.ulke')
  hasta: typeof import('../../../app/api/ulke/hasta/route.ulke')
  bugun: typeof import('../../../app/api/ulke/bugun/route.ulke')
  not: typeof import('../../../app/api/ulke/not/route.ulke')
  yeniden: typeof import('../../../app/api/ulke/not/yeniden-yaz/route.ulke')
  onayla: typeof import('../../../app/api/ulke/not/onayla/route.ulke')
  NextRequest: typeof import('next/server').NextRequest
  modelSec: typeof import('@/lib/ai/modeller').modelSec
  devreSifirla: typeof import('@/lib/ai/devre').devreSifirla
}
const R = {} as Rotalar
const istek = (yol: string, jeton?: string, govde?: unknown, method?: string) => new R.NextRequest(`https://notya.test${yol}`, {
  method: method ?? (govde === undefined ? 'GET' : 'POST'),
  headers: { ...(jeton ? { authorization: `Bearer ${jeton}` } : {}), 'content-type': 'application/json' },
  ...(govde === undefined ? {} : { body: JSON.stringify(govde) }),
})
const oku = async (r: Response) => {
  const t = await r.text()
  temiz(t, 'API answer'); assert.doesNotMatch(t, TURKCE, `API answer carries a Turkish letter: ${t}`)
  return { s: r.status, j: JSON.parse(t) as Record<string, any> }
}
const hastaEkle = async (jeton: string, ad: string, dil = 'uz') => (await oku(await R.hastalar.POST(istek('/api/ulke/hastalar', jeton, { ad, dil, dogumTarihi: '2021-03-07', cinsiyet: 'female', telefon: '+998 90 000 00 01', ulusalKimlik: '00000000000001' })))).j.hasta.id as string
/** A recorded visit of `doktor` for a new patient. */
async function muayeneYap(jeton: string, doktor: string, ad = 'QA Karimova Dilnoza') {
  const hasta = await hastaEkle(jeton, ad)
  vt.depo.set(`muayene-sesleri/${doktor}/k.webm`, new Blob(['sentetik ses']))
  const r = await oku(await R.muayene.POST(istek('/api/ulke/muayene', jeton, { yol: `${doktor}/k.webm`, hastaId: hasta, sablon: 'pediatri', riza: true })))
  assert.equal(r.s, 200)
  return { hasta, seans: r.j.seansId as string }
}
const notYaz = async (jeton: string, seansId: string) => oku(await R.not.POST(istek('/api/ulke/not', jeton, { seansId })))
const notOku = async (jeton: string, id: string) => oku(await R.not.GET(istek(`/api/ulke/not?id=${id}`, jeton)))
const kaydet = async (jeton: string, g: Record<string, unknown>) => oku(await R.not.PATCH(istek('/api/ulke/not', jeton, g, 'PATCH')))
const yenidenYaz = async (jeton: string, notId: string) => oku(await R.yeniden.POST(istek('/api/ulke/not/yeniden-yaz', jeton, { notId })))
const onayla = async (jeton: string, g: Record<string, unknown>) => oku(await R.onayla.POST(istek('/api/ulke/not/onayla', jeton, g)))
/** A visit of doctor A with its note written (Uzbek, Latin). */
async function notluMuayene(jeton = 'jeton-a', doktor = A, icerik: Record<string, string> = UZ_NOT) {
  const m = await muayeneYap(jeton, doktor)
  model.cevaplar.push(icerik)
  const r = await notYaz(jeton, m.seans)
  assert.equal(r.s, 200, JSON.stringify(r.j))
  model.cagrilar = []
  return { ...m, notId: r.j.notId as string }
}
const sessiz = async <T>(is: () => Promise<T>): Promise<{ sonuc: T; gunluk: string[] }> => {
  const gunluk: string[] = []
  const e = console.error, w = console.warn, l = console.log
  console.error = console.warn = console.log = (...a: unknown[]) => { gunluk.push(a.map(String).join(' ')) }
  try { return { sonuc: await is(), gunluk } } finally { console.error = e; console.warn = w; console.log = l }
}

before(async () => {
  R.NextRequest = (await import('next/server')).NextRequest
  R.hastalar = await import('../../../app/api/ulke/hastalar/route.ulke')
  R.hasta = await import('../../../app/api/ulke/hasta/route.ulke')
  R.bugun = await import('../../../app/api/ulke/bugun/route.ulke')
  R.muayene = await import('../../../app/api/ulke/muayene/route.ulke')
  R.not = await import('../../../app/api/ulke/not/route.ulke')
  R.yeniden = await import('../../../app/api/ulke/not/yeniden-yaz/route.ulke')
  R.onayla = await import('../../../app/api/ulke/not/onayla/route.ulke')
  R.modelSec = (await import('@/lib/ai/modeller')).modelSec
  R.devreSifirla = (await import('@/lib/ai/devre')).devreSifirla
  const cagir = await import('@/lib/ai/cagir')
  cagir.TASIMA_BEKLEME.ms = 1 // the gateway's pause between two attempts; shortened as its own tests do
})

describe('INSTRUCTIONS to the model: the Uzbek pack\'s own, in three forms', () => {
  let T: typeof import('../klinik/talimatlar')
  before(async () => { T = await import('../klinik/talimatlar') })
  /** Text a person reads: the JSON keys and the bracket marker are the contract with the code, not prose. */
  const duzyazi = (t: string) => t.replace(/\{"s": "…", "o": "…", "a": "…", "p": "…"\}/g, '').replace(/\bJSON\b/g, '').replace(/(^|\n)[soap] (—|бўлимида|boʻlimida)/g, '$1').replace(/раздел[еа] [so]\b/g, '')

  it('the file says it is machine-written, awaits a clinician, was written fresh, and claims no protocol', () => {
    const bas = readFileSync(join(KOK, 'countries/uz/klinik/talimatlar.ts'), 'utf8').slice(0, 2600)
    assert.match(bas, /MACHINE-WRITTEN\. AWAITS REVIEW BY A NATIVE-SPEAKING CLINICIAN\./)
    assert.match(bas, /WRITTEN FRESH for Uzbekistan/)
    assert.match(bas, /NO NATIONAL PROTOCOL IS CLAIMED/)
  })

  it('each form is written in its own language and script; both templates exist in each; nothing else is offered', () => {
    for (const f of FORMLAR) {
      for (const sablon of ['pediatri', 'genel'] as const) {
        const t = T.uzNotTalimati(f, sablon)
        assert.ok(t && t.length > 1200, `${f}/${sablon}`)
        const d = duzyazi(t!)
        if (f === 'uz-Latn') { assert.doesNotMatch(d, /[Ѐ-ӿ]/, `${f}: Cyrillic`); assert.doesNotMatch(d, /['`‘’]/, `${f}: plain apostrophe`); assert.match(d, /oʻzbek tilida, lotin yozuvida/) }
        if (f === 'uz-Cyrl') { assert.doesNotMatch(d, /[A-Za-z]/, `${f}: Latin letter in ${d.match(/[A-Za-z]+/)?.[0]}`); assert.match(d, /ўзбек тилида, кирилл ёзувида/); assert.match(d, /[ўқғҳ]/) }
        if (f === 'ru') { assert.doesNotMatch(d, /[A-Za-zўқғҳЎҚҒҲ]/, `${f}: Latin or Uzbek-only letter in ${d.match(/[A-Za-zўқғҳ]+/)?.[0]}`); assert.match(d, /только на русском языке/) }
        assert.ok(t!.includes('{"s": "…", "o": "…", "a": "…", "p": "…"}'), 'the answer format')
      }
      assert.notEqual(T.uzNotTalimati(f, 'pediatri'), T.uzNotTalimati(f, 'genel'))
      const y = T.uzYenidenYazimTalimati(f)
      assert.ok(y && y.length > 500 && y !== T.uzNotTalimati(f, 'genel'))
    }
    // A specialty without a template of its own, and a language that is not this country's, get no instruction at all.
    for (const sablon of ['kardiyoloji', 'dahiliye', '', 'Pediatri']) assert.equal(T.uzNotTalimati('uz-Latn', sablon), null, sablon)
    assert.equal(T.uzNotTalimati('tr', 'genel'), null); assert.equal(T.uzYenidenYazimTalimati('tr'), null)
  })

  it('LEAK TEST: nothing of Türkiye; no source, authority, guideline or protocol is named — the model is told to cite none', () => {
    const hepsi: string[] = []
    for (const f of FORMLAR) {
      for (const t of [T.uzNotTalimati(f, 'pediatri')!, T.uzNotTalimati(f, 'genel')!, T.uzYenidenYazimTalimati(f)!, T.uzNotGirdisi(f, { dogumTarihi: '2021-03-07', cinsiyet: 'female', muayeneTarihi: '2026-10-08', metin: 'x' }), T.uzYenidenYazimGirdisi(f, UZ_NOT)]) hepsi.push(t)
    }
    const metin = hepsi.join('\n\n')
    temiz(metin, 'model instructions')
    assert.doesNotMatch(metin, TURKCE, 'a Turkish letter in the instructions')
    // No issuer, no named reference, no Turkish reference work, no claim of compliance.
    assert.doesNotMatch(metin, /vazirlig|вазирлиг|Минздрав|министерств|Nelson|Harrison|UpToDate|Bakanl|T[uü]rk/i)
    // Abbreviations of issuers, exactly as written and as whole words ("возраст" is not the WHO).
    assert.doesNotMatch(metin, /(?<![\p{L}])(SSV|ССВ|JSST|ЖССТ|ВОЗ|WHO|AAP|NICE|TPK|T\.C\.)(?![\p{L}])/u)
    assert.doesNotMatch(metin, /protokol(i|lari)?ga (muvofiq|asosan)|протокол(и|лари)?га (мувофиқ|асосан)|(в соответствии с|согласно) (клиническ|национальн|протокол)/i, 'a claim that the note follows a protocol')
    for (const f of FORMLAR) {
      const t = T.uzNotTalimati(f, 'genel')!
      const yasak = { 'uz-Latn': /Hech qanday manbaga havola qilmang[^\n]+milliy yoki xalqaro protokolga mosligi haqida hech narsa yozmang\./, 'uz-Cyrl': /Ҳеч қандай манбага ҳавола қилманг[^\n]+миллий ёки халқаро протоколга мослиги ҳақида ҳеч нарса ёзманг\./, ru: /Не ссылайтесь ни на какие источники[^\n]+национальному или международному протоколу\./ }[f]
      assert.match(t, yasak, `${f}: the "cite no source, claim no protocol" rule`)
      // Nine numbered rules in every form, the same nine.
      assert.deepEqual([...t.matchAll(/^(\d)\. /gm)].map((x) => x[1]), ['1', '2', '3', '4', '5', '6', '7', '8', '9'], f)
    }
  })

  it('the instruction is fixed text: nothing about a doctor or a patient is in it; the patient goes in the message as age and sex only', () => {
    assert.equal(T.uzNotTalimati('uz-Latn', 'pediatri'), T.uzNotTalimati('uz-Latn', 'pediatri'))
    const g = (dil: (typeof FORMLAR)[number]) => T.uzNotGirdisi(dil, { dogumTarihi: '2021-03-07', cinsiyet: 'female', muayeneTarihi: '2026-10-08', metin: 'MATN' })
    assert.equal(g('uz-Latn'), 'BEMOR: yoshi — 5 yosh; jinsi — ayol.\n\nSUHBAT MATNI:\nMATN')
    assert.equal(g('uz-Cyrl'), 'БЕМОР: ёши — 5 ёш; жинси — аёл.\n\nСУҲБАТ МАТНИ:\nMATN')
    assert.equal(g('ru'), 'ПАЦИЕНТ: возраст — 5 лет; пол — женский.\n\nТЕКСТ БЕСЕДЫ:\nMATN')
    assert.equal(T.uzYasMetni('uz-Latn', '2026-03-09', '2026-10-08'), '6 oylik')
    assert.equal(T.uzNotGirdisi('ru', { dogumTarihi: '', cinsiyet: '', muayeneTarihi: '2026-10-08', metin: 'x' }).split('\n')[0], 'ПАЦИЕНТ: возраст — не указан; пол — не указан.')
  })

  it('the other language: Russian for an Uzbek note; Uzbek for a Russian one, in the script the account already uses', () => {
    assert.equal(T.uzDigerDil('uz-Latn', ['uz-Latn', 'uz-Latn']), 'ru')
    assert.equal(T.uzDigerDil('uz-Cyrl', ['uz-Cyrl', 'ru']), 'ru')
    assert.equal(T.uzDigerDil('ru', ['ru', 'uz-Cyrl']), 'uz-Cyrl')
    assert.equal(T.uzDigerDil('ru', ['ru', 'ru']), 'uz-Latn')
    assert.equal(T.uzDigerDil('tr', ['tr']), null)
  })
})

describe('MODEL POLICY: one gateway, by task, no model name on this side', () => {
  it('the country\'s code calls the model in exactly one file, through aiCagir, and names no model anywhere', () => {
    const fs = require('node:fs') as typeof import('node:fs')
    const dosyalar: string[] = []
    const gez = (d: string, kosul: (y: string) => boolean) => { for (const ad of fs.readdirSync(d)) { const y = join(d, ad); if (fs.statSync(y).isDirectory()) gez(y, kosul); else if (/\.(ts|tsx)$/.test(ad) && !/\.test\.tsx?$/.test(ad) && kosul(y)) dosyalar.push(y) } }
    gez(join(KOK, 'countries'), () => true); gez(join(KOK, 'lib/ulke'), () => true); gez(join(KOK, 'components/ulke'), () => true); gez(join(KOK, 'app'), (y) => /\.ulke\.(ts|tsx)$/.test(y))
    assert.ok(dosyalar.length > 40)
    const cagiranlar: string[] = []
    for (const d of dosyalar) {
      const k = fs.readFileSync(d, 'utf8')
      const ad = d.slice(KOK.length + 1)
      assert.doesNotMatch(k, /claude-(sonnet|haiku|opus)|gpt-\d|openai\/|anthropic\/|luna-pro|openrouter\.ai|api\.anthropic\.com|messages\.create|@anthropic-ai\/sdk/, `${ad} names a model or a model provider`)
      if (/\baiCagir\s*\(|\baiAkis\s*\(/.test(k)) cagiranlar.push(ad)
    }
    assert.deepEqual(cagiranlar, ['lib/ulke/uygulama/notModeli.ts'])
    const k = fs.readFileSync(join(KOK, 'lib/ulke/uygulama/notModeli.ts'), 'utf8')
    assert.match(k, /gorev: g\.gorev,\n\s+system: \[\{ metin: g\.talimat, onbellek: true \}\],\n\s+messages: \[\{ role: 'user', content: g\.girdi \}\],\n\s+doctorId: g\.doktorId,/)
    assert.match(k, /export type NotGorevi = 'soap' \| 'not-uretimi'/)
  })
})

describe('Uzbekistan note: write, rewrite in the other language, edit, approve (speech and model are stand-ins)', () => {
  beforeEach(() => { sifirla(); R.devreSifirla() })

  it('the note is written in the doctor\'s note language from the pack\'s instruction; the model gets age, sex and the transcript — never who the patient is', async () => {
    const T = await import('../klinik/talimatlar')
    const m = await muayeneYap('jeton-a', A)
    model.cevaplar = [UZ_NOT]
    const { sonuc: r } = await sessiz(() => notYaz('jeton-a', m.seans))
    assert.equal(r.s, 200)
    assert.equal(model.cagrilar.length, 1)
    const c = model.cagrilar[0]
    // Policy: the model is whatever the policy gives the note task today — compared, never written.
    assert.equal(c.model, R.modelSec('soap').model)
    assert.equal(c.sistem, T.uzNotTalimati('uz-Latn', 'pediatri'))
    assert.equal(c.onbellekli, true, 'the fixed instruction is the cached block')
    assert.equal(c.veriToplama, 'deny')
    assert.equal(c.kullanici, `BEMOR: yoshi — 5 yosh; jinsi — ayol.\n\nSUHBAT MATNI:\n${UZ_METIN}`)
    for (const gizli of ['Karimova', 'Dilnoza', '+998', '00000000000001', m.hasta, A, m.seans]) assert.ok(!`${c.sistem}\n${c.kullanici}`.includes(gizli), `sent to the model: ${gizli}`)
    // Stored: a DRAFT in the core notes table, its language beside it.
    const [n] = vt.tablo('notes')
    assert.deepEqual([n.id, n.session_id, n.doctor_id, n.note_type, n.content_subjektif, n.content_objektif, n.content_degerlendirme, n.content_plan, n.approved_at ?? null, n.ai_model], [r.j.notId, m.seans, A, 'soap', UZ_NOT.s, UZ_NOT.o, UZ_NOT.a, UZ_NOT.p, null, R.modelSec('soap').model])
    const [d] = vt.tablo('not_dil_kaydi')
    assert.deepEqual([d.note_id, d.doctor_id, d.patient_id, d.not_dili, d.ikinci_dil ?? null], [r.j.notId, A, m.hasta, 'uz-Latn', null])
    // The usage row: who called, which task — and nothing of the content or the patient.
    const [k] = vt.tablo('ai_token_kullanim')
    assert.deepEqual([k.doctor_id, k.gorev, k.input_tokens, k.output_tokens], [A, 'soap', 900, 220])
    assert.doesNotMatch(JSON.stringify(vt.tablo('ai_token_kullanim')), new RegExp(`${m.hasta}|isitma|Karimova`))
    // Once per visit: asked again, the same note, and nobody is called.
    assert.deepEqual((await notYaz('jeton-a', m.seans)).j, { notId: r.j.notId })
    assert.equal(model.cagrilar.length, 1); assert.equal(vt.tablo('notes').length, 1)
    // The home and the patient file now show a draft.
    const bugun = await oku(await R.bugun.GET(istek('/api/ulke/bugun', 'jeton-a')))
    assert.deepEqual(bugun.j.muayeneler.map((x: Record<string, unknown>) => [x.notId, x.durum]), [[r.j.notId, 'taslak']])
  })

  it('a Russian-writing doctor gets a Russian note from the Russian instruction; the template follows the visit', async () => {
    const T = await import('../klinik/talimatlar')
    const m = await muayeneYap('jeton-b', B, 'QA Иванова Мария')
    model.cevaplar = [RU_NOT]
    const { sonuc: r } = await sessiz(() => notYaz('jeton-b', m.seans))
    assert.equal(r.s, 200)
    assert.equal(model.cagrilar[0].sistem, T.uzNotTalimati('ru', 'pediatri'))
    assert.ok(model.cagrilar[0].kullanici.startsWith('ПАЦИЕНТ: возраст — 5 лет; пол — женский.'))
    assert.equal(vt.tablo('not_dil_kaydi')[0].not_dili, 'ru')
    const n = await notOku('jeton-b', r.j.notId)
    assert.deepEqual([n.j.not.dil, n.j.not.icerik, n.j.not.yenidenYazilabilir], ['ru', RU_NOT, 'uz-Latn'])
  })

  it('reading the note: draft, its language, what one click would rewrite it in, the visit — and the low-confidence flag of the recording', async () => {
    sttCevabi = { ...sttCevabi, language_probability: 0.99, words: sttCevabi.words.map((w) => ({ ...w, logprob: -0.9 })) }
    let v: Awaited<ReturnType<typeof notluMuayene>>
    try {
      // Low word confidence → a second pass (the stand-in gives the same answer) → still low.
      const son = await sessiz(() => notluMuayene()); v = son.sonuc
    } finally { sttCevabi = { ...sttCevabi, language_probability: 0.97, words: sttCevabi.words.map((w) => ({ ...w, logprob: -0.08 })) } }
    const n = await notOku('jeton-a', v.notId)
    assert.equal(n.s, 200)
    const { muayene, ...not } = n.j.not
    assert.deepEqual(not, { notId: v.notId, seansId: v.seans, onayli: false, onayTarihi: null, dil: 'uz-Latn', icerik: UZ_NOT, ikinci: null, yenidenYazilabilir: 'ru' })
    assert.deepEqual([muayene.seansId, muayene.metin, muayene.hasta.ad, muayene.notId, muayene.notDurumu], [v.seans, UZ_METIN, 'QA Karimova Dilnoza', v.notId, 'taslak'])
    // The note is still written; the screen is told to ask the doctor to check it carefully.
    assert.deepEqual(muayene.konusma, { dil: 'uz', dilKesin: true, ikinciGecis: true, dusukGuven: true })
  })

  it('ONE CLICK rewrites the note in Russian as a SECOND draft; the first draft is not touched; a second click calls nobody', async () => {
    const T = await import('../klinik/talimatlar')
    const v = await notluMuayene()
    // The doctor has edited the Uzbek draft first: the rewrite is made from the saved text.
    const duzeltilmis = { ...UZ_NOT, p: 'Paratsetamol 250 mg, uch kundan keyin qayta koʻrik.' }
    assert.deepEqual(await kaydet('jeton-a', { notId: v.notId, dil: 'uz-Latn', ...duzeltilmis }), { s: 200, j: { ok: true } })
    model.cevaplar = [RU_NOT]
    const { sonuc: r } = await sessiz(() => yenidenYaz('jeton-a', v.notId))
    assert.deepEqual(r, { s: 200, j: { dil: 'ru' } })
    assert.equal(model.cagrilar.length, 1)
    const c = model.cagrilar[0]
    assert.equal(c.model, R.modelSec('not-uretimi').model)
    assert.equal(c.sistem, T.uzYenidenYazimTalimati('ru'))
    assert.equal(c.kullanici, `ЗАПИСЬ:\n${JSON.stringify(duzeltilmis)}`)
    assert.equal(c.veriToplama, 'deny')
    // Beside the note, not over it.
    const [n] = vt.tablo('notes')
    assert.deepEqual([n.content_subjektif, n.content_plan, n.approved_at ?? null], [UZ_NOT.s, duzeltilmis.p, null])
    const [d] = vt.tablo('not_dil_kaydi')
    assert.deepEqual([d.not_dili, d.ikinci_dil, d.ikinci_s, d.ikinci_o, d.ikinci_a, d.ikinci_p], ['uz-Latn', 'ru', RU_NOT.s, RU_NOT.o, RU_NOT.a, RU_NOT.p])
    const okunan = (await notOku('jeton-a', v.notId)).j.not
    assert.deepEqual([okunan.dil, okunan.icerik, okunan.ikinci, okunan.yenidenYazilabilir], ['uz-Latn', duzeltilmis, { dil: 'ru', icerik: RU_NOT }, null])
    // The doctor edits the Russian draft; a second click must neither overwrite that nor cost a call.
    const ruDuzeltilmis = { ...RU_NOT, a: 'ОРВИ.' }
    assert.equal((await kaydet('jeton-a', { notId: v.notId, dil: 'ru', ...ruDuzeltilmis })).s, 200)
    assert.deepEqual(await yenidenYaz('jeton-a', v.notId), { s: 200, j: { dil: 'ru' } })
    assert.equal(model.cagrilar.length, 1)
    assert.equal(vt.tablo('not_dil_kaydi')[0].ikinci_a, 'ОРВИ.')
    // A draft in a language the note does not have cannot be saved.
    for (const dil of ['uz-Cyrl', 'tr', '', undefined]) assert.deepEqual(await kaydet('jeton-a', { notId: v.notId, dil, ...UZ_NOT }), { s: 400, j: { code: 'GECERSIZ', alan: 'dil' } }, String(dil))
  })

  it('a Russian note is rewritten in Uzbek in the script the account uses (Cyrillic for doctor C)', async () => {
    const T = await import('../klinik/talimatlar')
    const v = await notluMuayene('jeton-c', C, RU_NOT)
    assert.equal((await notOku('jeton-c', v.notId)).j.not.yenidenYazilabilir, 'uz-Cyrl')
    model.cevaplar = [{ s: 'Онасининг айтишича, уч кундан бери иситма.', o: 'Томоғи қизарган.', a: 'Шифокор ташхисни айтмади.', p: 'Парацетамол.' }]
    const { sonuc: r } = await sessiz(() => yenidenYaz('jeton-c', v.notId))
    assert.deepEqual(r.j, { dil: 'uz-Cyrl' })
    assert.equal(model.cagrilar[0].sistem, T.uzYenidenYazimTalimati('uz-Cyrl'))
    assert.ok(model.cagrilar[0].kullanici.startsWith('ҚАЙД:\n'))
  })

  it('APPROVE the Russian draft: it becomes the note in the patient\'s file; the Uzbek draft is kept beside it; nothing else changes', async () => {
    const v = await notluMuayene()
    model.cevaplar = [RU_NOT]
    await sessiz(() => yenidenYaz('jeton-a', v.notId))
    const ekrandaki = { ...RU_NOT, p: 'Парацетамол 250 мг, повторный приём через три дня.' }
    const r = await onayla('jeton-a', { notId: v.notId, dil: 'ru', ...ekrandaki })
    assert.equal(r.s, 200); assert.equal(r.j.ok, true); assert.match(r.j.onayTarihi, /^\d{4}-\d{2}-\d{2}T/)
    const [n] = vt.tablo('notes')
    assert.deepEqual([n.content_subjektif, n.content_objektif, n.content_degerlendirme, n.content_plan, n.approved_at, n.approved_by], [ekrandaki.s, ekrandaki.o, ekrandaki.a, ekrandaki.p, r.j.onayTarihi, A])
    const [d] = vt.tablo('not_dil_kaydi')
    assert.deepEqual([d.not_dili, d.ikinci_dil, d.ikinci_s, d.ikinci_p], ['ru', 'uz-Latn', UZ_NOT.s, UZ_NOT.p], 'the draft that was not chosen is kept')
    const okunan = (await notOku('jeton-a', v.notId)).j.not
    assert.deepEqual([okunan.onayli, okunan.onayTarihi, okunan.dil, okunan.icerik, okunan.ikinci, okunan.yenidenYazilabilir], [true, r.j.onayTarihi, 'ru', ekrandaki, null, null])
    // In the patient's file and on the home it is now an approved note.
    const dosya = await oku(await R.hasta.GET(istek(`/api/ulke/hasta?id=${v.hasta}`, 'jeton-a')))
    assert.deepEqual(dosya.j.muayeneler.map((x: Record<string, unknown>) => [x.notId, x.durum]), [[v.notId, 'onayli']])
    assert.equal(model.cagrilar.length, 1, 'approving calls no model')
  })

  it('AN APPROVED NOTE IS NEVER OVERWRITTEN: a late save, a second approval and a rewrite all answer ONAYLI and change nothing', async () => {
    const v = await notluMuayene()
    const onaylanan = { ...UZ_NOT, a: 'Oʻtkir respirator infeksiya.' }
    assert.equal((await onayla('jeton-a', { notId: v.notId, dil: 'uz-Latn', ...onaylanan })).s, 200)
    const once = JSON.stringify([vt.tablo('notes'), vt.tablo('not_dil_kaydi')])
    model.cevaplar = [RU_NOT, RU_NOT]
    for (const [ad, r] of [
      ['save', await kaydet('jeton-a', { notId: v.notId, dil: 'uz-Latn', s: 'OʻZGARTIRILDI', o: '', a: '', p: '' })],
      ['approve again', await onayla('jeton-a', { notId: v.notId, dil: 'uz-Latn', s: 'OʻZGARTIRILDI', o: 'x', a: 'x', p: 'x' })],
      ['approve another language', await onayla('jeton-a', { notId: v.notId, dil: 'ru', ...RU_NOT })],
      ['rewrite', await yenidenYaz('jeton-a', v.notId)],
    ] as const) assert.deepEqual(r, { s: 409, j: { code: 'ONAYLI' } }, ad)
    assert.equal(JSON.stringify([vt.tablo('notes'), vt.tablo('not_dil_kaydi')]), once)
    assert.equal(model.cagrilar.length, 0, 'no model call for an approved note')
    // The guard is in the WRITE itself, not only in a check before it: every statement that can change a note's text
    // carries "approved_at IS NULL".
    const yazmalar = vt.sorgular.filter((q) => q.tablo === 'notes' && (q.islem === 'update' || q.islem === 'delete'))
    assert.ok(yazmalar.length >= 1)
    for (const q of yazmalar) assert.ok(q.filtreler.includes('approved_at=is.null') && q.filtreler.includes(`doctor_id=eq.${A}`), JSON.stringify(q))
    // And if the note is approved between the check and the write, the write still changes nothing.
    const v2 = await notluMuayene()
    const { notKaydet, notOnayla } = await import('@/lib/ulke/uygulama/notlar')
    const sb = vt.createClient() as unknown as Parameters<typeof notKaydet>[0]
    const gercekFrom = sb.from.bind(sb)
    let ilkOkuma = true
    ;(sb as { from: unknown }).from = (ad: string) => {
      const q = gercekFrom(ad)
      // Right after the first read of the note, "another request" approves it.
      if (ad === 'notes' && ilkOkuma) { ilkOkuma = false; const satir = vt.tablo('notes').find((x) => x.id === v2.notId)!; queueMicrotask(() => { satir.approved_at = '2026-10-08T10:00:00Z'; satir.content_plan = 'TASDIQLANGAN REJA' }) }
      return q
    }
    assert.deepEqual(await notKaydet(sb, A, v2.notId, 'uz-Latn', { s: 'KECH', o: '', a: '', p: 'KECH' }), { tamam: false, kod: 'ONAYLI' })
    assert.equal(vt.tablo('notes').find((x) => x.id === v2.notId)!.content_plan, 'TASDIQLANGAN REJA')
    assert.deepEqual(await notOnayla(sb, A, v2.notId, 'uz-Latn', { s: 'KECH', o: 'x', a: 'x', p: 'KECH' }), { tamam: false, kod: 'ONAYLI' })
    assert.equal(vt.tablo('notes').find((x) => x.id === v2.notId)!.content_plan, 'TASDIQLANGAN REJA')
  })

  it('an empty note cannot be approved; approving saves the text as it stands on the screen', async () => {
    const v = await notluMuayene()
    assert.deepEqual(await onayla('jeton-a', { notId: v.notId, dil: 'uz-Latn', s: '  ', o: '', a: '\n', p: '' }), { s: 400, j: { code: 'BOS' } })
    assert.deepEqual(await onayla('jeton-a', { notId: v.notId, dil: 'uz-Latn' }), { s: 400, j: { code: 'BOS' } })
    assert.equal(vt.tablo('notes')[0].approved_at ?? null, null)
    assert.deepEqual(await onayla('jeton-a', { notId: v.notId, dil: 'ru', ...RU_NOT }), { s: 400, j: { code: 'GECERSIZ', alan: 'dil' } }, 'there is no Russian draft to approve')
    assert.equal((await onayla('jeton-a', { notId: v.notId, dil: 'uz-Latn', ...UZ_NOT, s: 'Shifokor tuzatgan matn.' })).s, 200)
    assert.equal(vt.tablo('notes')[0].content_subjektif, 'Shifokor tuzatgan matn.')
    assert.equal(vt.tablo('not_dil_kaydi')[0].not_dili, 'uz-Latn')
  })

  it('BOUNDARY: the gateway fails in Turkish — the answer is a code, the transcript is kept, the log has no message; asking again works', async () => {
    const m = await muayeneYap('jeton-a', A)
    // Primary twice, then the guard: every attempt fails with a Turkish provider error that quotes the patient.
    model.cevaplar = [500, 500, 500]
    const { sonuc: r, gunluk } = await sessiz(() => notYaz('jeton-a', m.seans))
    assert.deepEqual(r, { s: 502, j: { code: 'NOT_YAZILAMADI' } })
    assert.equal(model.cagrilar.length, 3, 'the gateway\'s own gates ran: primary, primary, guard')
    assert.deepEqual(gunluk.filter((g) => g.startsWith('[ulke/')), ['[ulke/not] soap: gateway 500'])
    for (const g of gunluk) { assert.doesNotMatch(g, /Karimova|Dilnoza|isitma/, `patient text in a log line: ${g}`); assert.doesNotMatch(g, /Sağlayıcı/, `the provider's message in a log line: ${g}`) }
    assert.deepEqual([vt.tablo('notes'), vt.tablo('not_dil_kaydi')], [[], []])
    assert.equal(vt.tablo('sessions')[0].transcript_cleaned, UZ_METIN, 'the visit and its transcript are kept')
    // An answer that is not a note (twice: primary, then the guard) is not stored as one.
    R.devreSifirla(); model.cagrilar = []
    model.cevaplar = ['Kechirasiz, yordam bera olmayman.', 'Bu JSON emas.']
    assert.deepEqual((await sessiz(() => notYaz('jeton-a', m.seans))).sonuc, { s: 502, j: { code: 'NOT_YAZILAMADI' } })
    assert.deepEqual(vt.tablo('notes'), [])
    // What the doctor reads for that code, and the way to ask again.
    const M = await import('./metinler'); const Muayene = await import('./Muayene')
    for (const f of FORMLAR) assert.equal(Muayene.muayeneHataMetni(M.uygulamaMetni(f), 'NOT_YAZILAMADI'), M.uygulamaMetni(f).muayene.notYazilamadi)
    R.devreSifirla(); model.cagrilar = []
    model.cevaplar = [UZ_NOT]
    assert.equal((await sessiz(() => notYaz('jeton-a', m.seans))).sonuc.s, 200)
    assert.equal(vt.tablo('notes').length, 1)
    // The same for a rewrite: a code, and the note is unchanged.
    R.devreSifirla(); model.cagrilar = []
    const notId = vt.tablo('notes')[0].id as string
    model.cevaplar = [503, 503, 503]
    const once = JSON.stringify([vt.tablo('notes'), vt.tablo('not_dil_kaydi')])
    assert.deepEqual((await sessiz(() => yenidenYaz('jeton-a', notId))).sonuc, { s: 502, j: { code: 'YENIDEN_YAZILAMADI' } })
    assert.equal(JSON.stringify([vt.tablo('notes'), vt.tablo('not_dil_kaydi')]), once)
  })

  it('a note whose language record cannot be written is not kept', async () => {
    const m = await muayeneYap('jeton-a', A)
    model.cevaplar = [UZ_NOT]
    vt.boz.yaz.add('not_dil_kaydi')
    assert.deepEqual((await sessiz(() => notYaz('jeton-a', m.seans))).sonuc, { s: 500, j: { code: 'BASARISIZ' } })
    assert.deepEqual(vt.tablo('notes'), [])
  })

  it('ISOLATION: a doctor cannot read, write for, save, rewrite or approve another doctor\'s visit or note — both directions', async () => {
    const a = await notluMuayene('jeton-a', A, { ...UZ_NOT, s: 'GIZLI-A shikoyat' })
    const b = await notluMuayene('jeton-b', B, { ...RU_NOT, s: 'GIZLI-B жалобы' })
    const yokId = '30000000-0000-4000-8000-00000000dead'
    for (const [jeton, kendi, yabanci, dil] of [['jeton-a', a, b, 'uz-Latn'], ['jeton-b', b, a, 'ru']] as const) {
      const once = JSON.stringify([vt.tablo('notes'), vt.tablo('not_dil_kaydi')])
      model.cagrilar = []; model.cevaplar = []
      // Positive control: the routes do work — on the caller's own note.
      assert.equal((await notOku(jeton, kendi.notId)).s, 200)
      const denemeler: [string, () => Promise<Response>, () => Promise<Response>][] = [
        ['read', () => R.not.GET(istek(`/api/ulke/not?id=${yabanci.notId}`, jeton)), () => R.not.GET(istek(`/api/ulke/not?id=${yokId}`, jeton))],
        ['write a note for the visit', () => R.not.POST(istek('/api/ulke/not', jeton, { seansId: yabanci.seans })), () => R.not.POST(istek('/api/ulke/not', jeton, { seansId: yokId }))],
        ['save', () => R.not.PATCH(istek('/api/ulke/not', jeton, { notId: yabanci.notId, dil, s: 'YABANCI', o: '', a: '', p: '' }, 'PATCH')), () => R.not.PATCH(istek('/api/ulke/not', jeton, { notId: yokId, dil, s: 'x', o: '', a: '', p: '' }, 'PATCH'))],
        ['rewrite', () => R.yeniden.POST(istek('/api/ulke/not/yeniden-yaz', jeton, { notId: yabanci.notId })), () => R.yeniden.POST(istek('/api/ulke/not/yeniden-yaz', jeton, { notId: yokId }))],
        ['approve', () => R.onayla.POST(istek('/api/ulke/not/onayla', jeton, { notId: yabanci.notId, dil, s: 'YABANCI', o: 'x', a: 'x', p: 'x' })), () => R.onayla.POST(istek('/api/ulke/not/onayla', jeton, { notId: yokId, dil, s: 'x', o: 'x', a: 'x', p: 'x' }))],
      ]
      for (const [ad, yabanciya, olmayana] of denemeler) {
        const r = await yabanciya(); const govde = await r.text()
        assert.equal(r.status, 404, `${jeton} ${ad}`); assert.equal(govde, '{"code":"NOT_FOUND"}', `${jeton} ${ad}`)
        assert.equal(await (await olmayana()).text(), govde, `${jeton} ${ad}: a foreign id and a missing id must answer alike`)
      }
      assert.equal(JSON.stringify([vt.tablo('notes'), vt.tablo('not_dil_kaydi')]), once, `${jeton} changed something`)
      assert.equal(model.cagrilar.length, 0, `${jeton}: the model was called with another doctor's visit`)
    }
    // Every read or change of a note table carried the caller's id.
    const tablolar = new Set(['notes', 'not_dil_kaydi', 'sessions', 'muayene_dil_kaydi', 'patients', 'hasta_ulke_bilgisi'])
    for (const q of vt.sorgular.filter((x) => tablolar.has(x.tablo) && x.islem !== 'insert')) assert.ok(q.filtreler.some((f) => f === `doctor_id=eq.${A}` || f === `doctor_id=eq.${B}`), `a query on ${q.tablo} without the doctor: ${JSON.stringify(q)}`)
    for (const jeton of [undefined, 'jeton-olmayan', 'jeton-tr']) {
      for (const r of [await R.not.GET(istek(`/api/ulke/not?id=${a.notId}`, jeton)), await R.not.POST(istek('/api/ulke/not', jeton, { seansId: a.seans })), await R.yeniden.POST(istek('/api/ulke/not/yeniden-yaz', jeton, { notId: a.notId })), await R.onayla.POST(istek('/api/ulke/not/onayla', jeton, { notId: a.notId, dil: 'uz-Latn', ...UZ_NOT }))]) {
        assert.deepEqual(await oku(r), { s: 401, j: { code: 'OTURUM_YOK' } }, String(jeton))
      }
    }
  })
})

describe('Uzbekistan note: screens in the three forms', () => {
  let Kabuk: typeof import('./Kabuk')
  let Not: typeof import('./Not')
  let Muayene: typeof import('./Muayene')
  let M: typeof import('./metinler')
  let Layout: typeof import('../../../app/layout.ulke')
  let ACIK: readonly string[] = []
  before(async () => {
    Kabuk = await import('./Kabuk'); Not = await import('./Not'); Muayene = await import('./Muayene'); M = await import('./metinler'); Layout = await import('../../../app/layout.ulke')
    const izin = (await import('@/lib/ulke/ulke')).ulkePaketi().rotalar
    if (izin !== 'hepsi') ACIK = izin.sayfalar
  })
  const cerceve = (f: (typeof FORMLAR)[number], ic: React.ReactElement) =>
    renderToStaticMarkup(React.createElement(Layout.default, null, React.createElement(Kabuk.Cerceve, { dil: f, m: M.uygulamaMetni(f), ad: 'QA Shifokor', aktif: 'bugun', cikis: () => {}, children: ic })))
  const ekranTemiz = (html: string, kaynak: string) => {
    temiz(html, kaynak); temiz(gorunurMetin(html), `${kaynak} (visible text)`)
    assert.doesNotMatch(html, TURKCE, `${kaynak}: a Turkish letter`)
    for (const m of html.matchAll(/(?:href|action)="([^"]+)"/g)) {
      if (m[1].startsWith('https://fonts.googleapis.com/')) continue
      const adres = m[1].split('?')[0]
      assert.ok(adres === ON_EK || adres.startsWith(`${ON_EK}/`), `${kaynak}: "${m[1]}" is outside ${ON_EK}`)
      assert.ok(ACIK.includes(adres.slice(ON_EK.length) || '/'), `${kaynak}: links to ${m[1]}, which is not a page of this build`)
    }
  }
  const HASTA = { id: '30000000-0000-4000-8000-000000000001', ad: 'QA Karimova Dilnoza', otaIsmi: 'Rustam qizi', dogumTarihi: '2021-03-07' }
  const muayene = (dusukGuven: boolean, notId: string | null = 'n1') => ({ seansId: 's1', baslangic: '2026-10-08T04:30:00Z', sablon: 'pediatri', metin: UZ_METIN, hasta: HASTA, notId, notDurumu: (notId ? 'taslak' : 'notsuz') as 'taslak' | 'notsuz', konusma: { dil: 'uz', dilKesin: true, ikinciGecis: dusukGuven, dusukGuven } })
  const bos = () => {}
  const ciz = (f: (typeof FORMLAR)[number], not: import('./Not').NotDetayi, ek: Partial<Parameters<typeof import('./Not').NotGorunumu>[0]> = {}) =>
    cerceve(f, React.createElement(Not.NotGorunumu, { m: M.uygulamaMetni(f), not, aktifDil: not.dil, setAktifDil: bos, icerik: not.icerik, setIcerik: bos, islem: null, bildirim: null, kaydet: bos, yenidenYaz: bos, onayla: bos, ...ek }))
  const TASLAK: import('./Not').NotDetayi = { notId: 'n1', seansId: 's1', onayli: false, onayTarihi: null, dil: 'uz-Latn', icerik: UZ_NOT, ikinci: null, yenidenYazilabilir: 'ru', muayene: muayene(false) }

  for (const f of FORMLAR) {
    it(`${f}: the draft — four sections to edit, save, rewrite in the other language, approve; the model wrote it and the doctor must read it`, () => {
      const m = M.uygulamaMetni(f)
      const html = ciz(f, TASLAK)
      const g = gorunurMetin(html)
      for (const x of [m.not.baslik, 'QA Karimova Dilnoza Rustam qizi', '08.10.2026', m.durum.taslak, m.not.uyari, m.not.s, m.not.o, m.not.a, m.not.p, m.not.notDili, m.diller.uz, m.not.kaydet, m.not.cevirRu, m.not.onayla, m.not.transkript, m.not.dosyayaDon, UZ_NOT.s, UZ_METIN]) assert.ok(g.includes(x), x)
      assert.deepEqual([...html.matchAll(/<textarea id="uza-not-([soap])" name="[soap]" class="uza-girdi" lang="uz-Latn">/g)].map((x) => x[1]), ['s', 'o', 'a', 'p'])
      assert.deepEqual([...html.matchAll(/data-eylem="([a-z-]+)"/g)].map((x) => x[1]), ['onayla', 'kaydet', 'yeniden-yaz'])
      assert.ok(!g.includes(m.muayene.dusukGuven), 'no low-confidence notice for a confident recording')
      ekranTemiz(html, `/visit?not= draft (${f})`)
      // A Russian note offers the rewrite in Uzbek.
      assert.ok(gorunurMetin(ciz(f, { ...TASLAK, dil: 'ru', icerik: RU_NOT, yenidenYazilabilir: 'uz-Latn' })).includes(m.not.cevirUz))
    })

    it(`${f}: LOW CONFIDENCE — a plain notice asks the doctor to check the note carefully; the note is still there`, () => {
      const m = M.uygulamaMetni(f)
      const html = ciz(f, { ...TASLAK, muayene: muayene(true) })
      const g = gorunurMetin(html)
      assert.ok(g.includes(m.muayene.dusukGuven) && g.includes(m.muayene.ikinciGecis) && g.includes(UZ_NOT.p))
      assert.match(html, /<div role="alert" class="uza-uyari-kutu" data-bildirim="dusuk-guven">/)
      assert.ok(m.muayene.dusukGuven.length > 40 && !/[0-9%]/.test(m.muayene.dusukGuven), 'a plain sentence: no number, no percentage')
      ekranTemiz(html, `/visit?not= low confidence (${f})`)
    })

    it(`${f}: two drafts — a choice between them, the second one marked as the second; every outcome has its own sentence`, () => {
      const m = M.uygulamaMetni(f)
      const iki = { ...TASLAK, ikinci: { dil: 'ru' as const, icerik: RU_NOT }, yenidenYazilabilir: null }
      const ilk = ciz(f, iki)
      assert.deepEqual([...ilk.matchAll(/<input\b[^>]*>/g)].map((x) => x[0]).filter((x) => x.includes('name="taslak-dili"')).map((x) => /value="([^"]+)"/.exec(x)![1]), ['uz-Latn', 'ru'])
      assert.ok(!gorunurMetin(ilk).includes(m.not.ikinciTaslak) && !ilk.includes('data-eylem="yeniden-yaz"'))
      const ikinci = ciz(f, iki, { aktifDil: 'ru', icerik: RU_NOT })
      const g = gorunurMetin(ikinci)
      assert.ok(g.includes(m.not.ikinciTaslak) && g.includes(RU_NOT.s) && !g.includes(UZ_NOT.s))
      assert.match(ikinci, /<textarea id="uza-not-s" name="s" class="uza-girdi" lang="ru">/)
      ekranTemiz(ikinci, `/visit?not= second draft (${f})`)
      for (const b of ['KAYDEDILDI', 'KAYDEDILEMEDI', 'ONAYLANAMADI', 'YENIDEN_YAZILAMADI', 'ONAYLI', 'BOS', 'BAGLANTI'] as const) {
        const html = ciz(f, iki, { bildirim: b })
        const kutu = /<div role="(alert|status)" class="uza-(uyari|bilgi)-kutu">([^<]+)<\/div>/.exec(html)
        assert.ok(kutu && kutu[3].length > 8 && !kutu[3].includes(b), `${f}/${b}`)
        assert.equal(kutu![1], b === 'KAYDEDILDI' ? 'status' : 'alert', b)
        ekranTemiz(html, `/visit?not= ${b} (${f})`)
      }
      for (const [islem, metin] of [['cevriliyor', m.not.cevriliyor], ['onaylaniyor', m.not.onaylaniyor]] as const) {
        const html = ciz(f, TASLAK, { islem })
        assert.ok(gorunurMetin(html).includes(metin)); assert.equal((html.match(/<textarea[^>]* disabled=""/g) || []).length, 4, 'nothing can be typed while an action runs')
      }
    })

    it(`${f}: APPROVED — shown as text; nothing on the screen can change it`, () => {
      const m = M.uygulamaMetni(f)
      const html = ciz(f, { ...TASLAK, onayli: true, onayTarihi: '2026-10-08T05:10:00Z', yenidenYazilabilir: null }, { bildirim: 'ONAYLANDI' })
      const g = gorunurMetin(html)
      for (const x of [m.durum.onayli, '10:10', m.not.onaylandi, UZ_NOT.s, UZ_NOT.o, UZ_NOT.a, UZ_NOT.p, m.not.dosyayaDon]) assert.ok(g.includes(x), x)
      assert.doesNotMatch(html, /<textarea|<button type="(submit|button)" class="uza-dugme[^"]*"[^>]*data-eylem|name="taslak-dili"/)
      assert.ok(!g.includes(m.not.uyari) && !g.includes(m.not.kaydet) && !g.includes(m.not.onayla) && !g.includes(m.not.cevirRu))
      ekranTemiz(html, `/visit?not= approved (${f})`)
    })

    it(`${f}: a recorded visit leads to its note, or offers to write it (again)`, () => {
      const m = M.uygulamaMetni(f)
      const ile = (notId: string | null, yazilamadi: boolean, yaziliyor = false) => cerceve(f, React.createElement(Muayene.MuayeneOzetiGorunumu, { m, muayene: muayene(false, notId), children: React.createElement(Muayene.NotEylemi, { m, muayene: muayene(false, notId), yaziliyor, yazilamadi, yaz: bos }) }))
      const notlu = ile('n1', false)
      assert.ok(notlu.includes('href="/uzbek/visit?not=n1"') && gorunurMetin(notlu).includes(m.muayene.notuAc))
      ekranTemiz(notlu, `/visit?seans= with a note (${f})`)
      assert.ok(gorunurMetin(ile(null, false)).includes(m.muayene.notHazirla))
      const hatali = ile(null, true)
      assert.ok(gorunurMetin(hatali).includes(m.muayene.notYazilamadi) && gorunurMetin(hatali).includes(m.muayene.yenidenDene))
      ekranTemiz(hatali, `/visit?seans= note failed (${f})`)
      assert.ok(gorunurMetin(ile(null, false, true)).includes(m.muayene.notYaziliyor))
    })
  }

  it('the home and the patient file open the note of a visit that has one', async () => {
    const Bugun = await import('./Bugun'); const Hastalar = await import('./Hastalar')
    const m = M.uygulamaMetni('uz-Latn')
    const ev = cerceve('uz-Latn', React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA', hata: false, muayeneler: [{ seansId: 's1', notId: 'n1', hastaId: HASTA.id, hastaAdi: 'QA Karimova Dilnoza', baslangic: '2026-10-08T07:00:00Z', durum: 'taslak' }] }))
    assert.ok(ev.includes('href="/uzbek/visit?not=n1"'))
    const dosya = cerceve('uz-Latn', React.createElement(Hastalar.HastaDosyasiGorunumu, { m, hasta: { ...HASTA, cinsiyet: 'female', telefon: '', dil: 'uz', ulusalKimlik: '' }, muayeneler: [{ seansId: 's1', notId: 'n1', baslangic: '2026-10-08T07:00:00Z', durum: 'onayli' }, { seansId: 's2', notId: 'n2', baslangic: '2026-10-08T08:00:00Z', durum: 'taslak' }] }))
    assert.ok(dosya.includes('href="/uzbek/visit?not=n1"') && dosya.includes('href="/uzbek/visit?not=n2"'))
    ekranTemiz(dosya, '/patient with notes')
  })
})
