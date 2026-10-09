/**
 * NOTYA-UZ-MUAYENE-01 — the VISIT of an Uzbekistan build (NOTYA_COUNTRY=uz): consent, recording, transcription.
 * Real handlers and components; the database, auth and storage are a stand-in (lib/ulke/testing/sahteVeritabani.ts)
 * and THE SPEECH PROVIDER IS A STAND-IN TOO: no audio and no text leaves this process. Any other network address
 * fails the test. Synthetic accounts, patients and transcripts only.
 *
 *   1. BOUNDARY: a Turkish error thrown by shared infrastructure (the patient-data cipher) never reaches the caller.
 *   2. SPEECH RULE: first pass without a language; the prediction and its probability are stored; on low confidence
 *      ONE second pass forced to the doctor's note language, the better transcript kept; never a third pass; the
 *      second pass and "still low" are recorded with the visit.
 *   3. CONSENT blocks recording, on the screen and on the server; its wording is marked as not reviewed by a lawyer.
 *   4. ISOLATION between two doctors, both directions: patient, recording path, visit.
 *   5. The recording is removed from storage whatever happens.
 *   6. LEAK TEST over the visit screens in the three forms; every link stays under /uzbek.
 */
process.env.NOTYA_COUNTRY = 'uz'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ELEVENLABS_API_KEY = 'sahte-konusma-anahtari'
delete process.env.ENCRYPTION_MASTER_KEY // set by the first suite, after it has shown what happens without it

// NOTYA-UZ-ACILIS-02: the pack's page entry now imports photographs and shared landing components.
import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
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

// ───────────────────────── stand-in speech provider ─────────────────────────
type SttCagrisi = { adres: string; model: string | null; dil: string | null; bayt: number; anahtar: string | null }
const stt = { cagrilar: [] as SttCagrisi[], cevaplar: [] as (Record<string, unknown> | number)[] }
const SCRIBE = 'https://api.elevenlabs.io/v1/speech-to-text'
globalThis.fetch = (async (g: unknown, o?: { body?: unknown; headers?: Record<string, string> }) => {
  const adres = String(g)
  if (adres !== SCRIBE) throw new Error(`this test may not use the network: ${adres}`)
  const form = o?.body as FormData
  const dosya = form.get('file') as Blob
  stt.cagrilar.push({ adres, model: form.get('model_id') as string | null, dil: form.get('language_code') as string | null, bayt: dosya?.size ?? 0, anahtar: o?.headers?.['xi-api-key'] ?? null })
  const c = stt.cevaplar.shift()
  if (c === undefined) throw new Error('the speech provider was called more often than the test allows')
  // A provider error body in Turkish, quoting a patient: it must never travel further than the server's own log line.
  if (typeof c === 'number') return new Response(JSON.stringify({ detail: 'Ses çözümlenemedi — hasta Karimova' }), { status: c })
  return new Response(JSON.stringify(c), { status: 200, headers: { 'content-type': 'application/json' } })
}) as typeof fetch

const UZ_METIN = 'Bolaning uch kundan beri isitmasi bor, yoʻtal va burun bitishi kuzatilmoqda. Ishtahasi pasaygan, suyuqlikni yaxshi ichyapti.'
const RU_METIN = 'У ребёнка третий день температура, кашель и заложенность носа. Аппетит снижен, пьёт хорошо.'
/** A provider answer: `logprob` is given to every word. */
const cevap = (metin: string, dil: string, olasilik: number, logprob: number) => ({
  language_code: dil, language_probability: olasilik, text: metin,
  words: metin.split(' ').flatMap((k, i) => [{ text: k, type: 'word', start: i * 0.5, end: i * 0.5 + 0.4, logprob }, { text: ' ', type: 'spacing', start: i * 0.5 + 0.4, end: i * 0.5 + 0.5, logprob: 0 }]),
})

const A = '10000000-0000-4000-8000-00000000000a'
const B = '10000000-0000-4000-8000-00000000000b'
const KOVA = 'muayene-sesleri'
function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  stt.cagrilar = []; stt.cevaplar = []
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: A, email: 'qa-a@notya.test', app_metadata: { country: 'uz' } },
    'jeton-b': { id: B, email: 'qa-b@notya.test', app_metadata: { country: 'uz' } },
    'jeton-tr': { id: '10000000-0000-4000-8000-00000000000c', email: 'qa-tr@notya.test', app_metadata: { country: 'tr' } },
  })
  vt.tablo('ulke_hesaplari').push({ id: A, full_name: 'QA Shifokor A', ulke: 'uz', ui_language: 'uz-Latn' }, { id: B, full_name: 'QA Врач Б', ulke: 'uz', ui_language: 'ru' })
  // Doctor A writes notes in Uzbek (Latin), doctor B in Russian.
  // NOTYA-UZ-BRANSLAR-01: the template is the account's role. A is a paediatrician; B has chosen no role (general template).
  vt.tablo('hekim_rolu').push({ ulke: 'uz', doctor_id: A, rol: 'pediatri' })
  vt.tablo('hekim_dil_tercihleri').push({ ulke: 'uz', doctor_id: A, not_dili: 'uz-Latn', soruldu_at: '2026-10-08T05:00:00Z' }, { ulke: 'uz', doctor_id: B, not_dili: 'ru', soruldu_at: '2026-10-08T05:00:00Z' })
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
  NextRequest: typeof import('next/server').NextRequest
}
const R = {} as Rotalar
const istek = (yol: string, jeton?: string, govde?: unknown) => new R.NextRequest(`https://notya.test${yol}`, {
  method: govde === undefined ? 'GET' : 'POST',
  headers: { ...(jeton ? { authorization: `Bearer ${jeton}` } : {}), 'content-type': 'application/json' },
  ...(govde === undefined ? {} : { body: JSON.stringify(govde) }),
})
/** Every API answer is scanned: nothing of Türkiye, no Turkish letter, never a sentence where a code belongs. */
const oku = async (r: Response) => {
  const t = await r.text()
  temiz(t, 'API answer'); assert.doesNotMatch(t, TURKCE, `API answer carries a Turkish letter: ${t}`)
  return { s: r.status, j: JSON.parse(t) as Record<string, any> }
}
const hastaEkle = async (jeton: string, ad: string, dil = 'uz', dogumTarihi = '2021-03-07') => (await oku(await R.hastalar.POST(istek('/api/ulke/hastalar', jeton, { ad, dil, dogumTarihi })))).j.hasta.id as string
const sesKoy = (doktor: string, ad = 'kayit-1.webm') => { const yol = `uz/${doktor}/${ad}`; vt.depo.set(`${KOVA}/${yol}`, new Blob(['sentetik ses — hech qanday haqiqiy yozuv emas'])); return yol }
const muayeneYap = async (jeton: string, g: Record<string, unknown>) => oku(await R.muayene.POST(istek('/api/ulke/muayene', jeton, g)))

before(async () => {
  R.NextRequest = (await import('next/server')).NextRequest
  R.hastalar = await import('../../../app/api/ulke/hastalar/route.ulke')
})

describe('BOUNDARY: Turkish error text of shared infrastructure never reaches the caller', () => {
  beforeEach(sifirla)

  it('the cipher has no key (it throws a Turkish sentence): the answer is a code, and the screen has its own wording for it', async () => {
    // The shared file really does throw Turkish — this is the text that must not travel.
    const { encrypt } = await import('@/lib/security/encryption')
    assert.throws(() => encrypt('x'), /ortam değişkeni tanımlı değil/)
    const gunluk: string[] = []
    const eski = console.error
    console.error = (...a: unknown[]) => { gunluk.push(a.map(String).join(' ')) }
    let r: Response
    try { r = await R.hastalar.POST(istek('/api/ulke/hastalar', 'jeton-a', { ad: 'QA Karimova Dilnoza', dil: 'uz' })) } finally { console.error = eski }
    assert.equal(r.status, 500)
    assert.equal(await r.text(), '{"code":"BASARISIZ"}')
    // The log names the route and the kind of error — not its message.
    assert.deepEqual(gunluk, ['[ulke/sinir] hastalar POST: Error'])
    assert.deepEqual(vt.tablo('ulke_hastalar'), [])
    // What the doctor reads for that code is the pack's own sentence.
    const M = await import('./metinler')
    assert.equal(M.uygulamaMetni('uz-Latn').yeniHasta.kaydedilemedi, 'Bemorni saqlab boʻlmadi. Qaytadan urinib koʻring.')
    assert.match(readFileSync(join(KOK, 'components/ulke/uygulama/Hastalar.tsx'), 'utf8'), /setHata\(r\.j\.code === 'GECERSIZ'[^\n]+: 'kayit'\)/)
  })

  it('every handler of the country API runs inside the boundary', () => {
    const fs = require('node:fs') as typeof import('node:fs')
    const rotalar: string[] = []
    const gez = (d: string) => { for (const ad of fs.readdirSync(d)) { const y = join(d, ad); if (fs.statSync(y).isDirectory()) gez(y); else if (ad === 'route.ulke.ts') rotalar.push(y) } }
    gez(join(KOK, 'app/api/ulke'))
    assert.ok(rotalar.length >= 7)
    for (const y of rotalar) {
      const k = readFileSync(y, 'utf8')
      const isleyiciler = [...k.matchAll(/^export (?:async function|const) (GET|POST|PATCH|PUT|DELETE)\b([^\n]*)/gm)]
      assert.ok(isleyiciler.length >= 1, y)
      for (const [, yontem, kalan] of isleyiciler) assert.match(kalan, /^ = sinirda\('/, `${y}: ${yontem} is not wrapped in sinirda(…)`)
    }
    const sinir = readFileSync(join(KOK, 'lib/ulke/uygulama/sinir.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(sinir, /\.message|String\(e\)|\$\{e\}/, 'the boundary must not log or forward an error\'s own text')
  })
})

describe('Uzbekistan visit: pack settings', () => {
  it('speech: Scribe v2, thresholds as named settings of the pack, at most two passes', async () => {
    process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0002'
    const { UZ_KLINIK } = await import('../klinik/index')
    const k = UZ_KLINIK.konusma
    assert.deepEqual([k.saglayici, k.model], ['elevenlabs-scribe', 'scribe_v2'])
    assert.deepEqual(k.zorlamaDilKodlari, { 'uz-Latn': 'uzb', 'uz-Cyrl': 'uzb', ru: 'rus' })
    assert.ok(k.dilOlasiligiEsigi > 0.5 && k.dilOlasiligiEsigi < 1)
    assert.ok(k.ortalamaLogOlasilikEsigi < 0 && k.ortalamaLogOlasilikEsigi > -2)
    const kaynak = readFileSync(join(KOK, 'countries/uz/klinik/index.ts'), 'utf8')
    assert.match(kaynak, /dilOlasiligiEsigi: 0\.8,/); assert.match(kaynak, /ortalamaLogOlasilikEsigi: -0\.36,/)
    const motor = await import('@/lib/ulke/uygulama/konusmaTanima')
    assert.equal(motor.AZAMI_GECIS, 2)
    // The engine holds no threshold and no model name of its own.
    const motorKaynak = readFileSync(join(KOK, 'lib/ulke/uygulama/konusmaTanima.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    assert.doesNotMatch(motorKaynak, /scribe_v|0\.8\b|-0\.3|'uzb'|'rus'/)
    // Türkiye brings nothing through this door: its visit is the pre-split pipeline.
    // (Read as text: a pack's test may not import another country's pack — the wall check refuses it.)
    assert.match(readFileSync(join(KOK, 'countries/tr/klinik.ts'), 'utf8'), /export const TR_KLINIK: UlkeKlinigi \| null = null\n/)
  })

  it('templates: the general one first, then one per role — all 30 specialties write with their own; none is signed off', async () => {
    const b = await import('../klinik/branslar')
    const { UZ_ROLLER } = await import('../klinik/rolAdlari')
    assert.deepEqual([...b.UZ_ACIK_SABLONLAR], ['genel', ...UZ_ROLLER])
    assert.equal(b.UZ_ACIK_SABLONLAR.length, 41)
    const liste = Object.entries(b.UZ_BRANSLAR)
    assert.equal(liste.length, 30)
    for (const [k, x] of liste) assert.deepEqual(x, { kendiSablonuAcik: true, sablon: k, yerelInceleyen: null }, k)
    const { UZ_KLINIK } = await import('../klinik/index')
    assert.deepEqual([...UZ_KLINIK.sablonlar], ['genel', ...UZ_ROLLER])
    for (const ham of ['kadin-dogum', 'Pediatri', '', 'cardiology', null]) assert.equal(b.uzSablonMu(ham), false, String(ham))
  })

  it('consent wording is marked "NOT REVIEWED BY A LAWYER" in every form, and the visit is stamped with a draft version', async () => {
    const { UZ_KLINIK } = await import('../klinik/index')
    assert.equal(UZ_KLINIK.riza.hukukcuInceledi, false)
    assert.match(UZ_KLINIK.riza.surum, /^uz-taslak-\d{4}-\d{2}-\d{2}$/)
    const katalog = readFileSync(join(KOK, 'countries/uz/uygulama/metinler.ts'), 'utf8')
    const satirlar = katalog.split('\n')
    const rizalar = satirlar.map((s, i) => [s, i] as const).filter(([s]) => /^\s+riza: '/.test(s))
    assert.equal(rizalar.length, 3, 'one consent sentence per form')
    for (const [, i] of rizalar) assert.match(satirlar.slice(i - 3, i).join('\n'), /NOT REVIEWED BY A LAWYER/, `consent sentence on line ${i + 1} lost its mark`)
  })

  it('speech rule, pure: when a second pass is called for, and which pass is kept', async () => {
    const m = await import('@/lib/ulke/uygulama/konusmaTanima')
    const { UZ_KLINIK } = await import('../klinik/index')
    const a = UZ_KLINIK.konusma
    const g = (dilOlasiligi: number | null, ort: number | null, metin = UZ_METIN) => ({ metin, dilKodu: 'uzb', dilOlasiligi, ortalamaLogOlasilik: ort, sureSn: 10 })
    assert.equal(m.ikinciGecisGerekliMi(g(0.97, -0.1), a), false)
    assert.equal(m.ikinciGecisGerekliMi(g(0.79, -0.1), a), true, 'language below the threshold')
    assert.equal(m.ikinciGecisGerekliMi(g(0.97, -0.5), a), true, 'words below the threshold')
    assert.equal(m.ikinciGecisGerekliMi(g(0.8, -0.36), a), false, 'exactly on the thresholds is not below them')
    assert.equal(m.ikinciGecisGerekliMi(g(null, null), a), false, 'an answer that says nothing about confidence cannot be judged low')
    assert.equal(m.gecisSec(g(0.6, -0.5), g(null, -0.2)), 2)
    assert.equal(m.gecisSec(g(0.6, -0.2), g(null, -0.5)), 1)
    assert.equal(m.gecisSec(g(0.6, -0.3), g(null, -0.3)), 1, 'a tie keeps the first pass')
    assert.equal(m.gecisSec(g(0.6, -0.3), null), 1)
    assert.equal(m.gecisSec(g(0.6, -0.3), g(null, -0.1, '')), 1, 'an empty second transcript is never kept')
    const okunan = m.gecisOku(cevap('bir ikki uch', 'uzb', 0.91, -0.2))
    assert.deepEqual([okunan.metin, okunan.dilKodu, okunan.dilOlasiligi], ['bir ikki uch', 'uzb', 0.91])
    assert.ok(Math.abs(okunan.ortalamaLogOlasilik! + 0.2) < 1e-9, 'spacing entries are not words')
    assert.equal(okunan.sureSn, 1.5)
  })
})

describe('Uzbekistan visit: recording → transcript (speech provider is a stand-in)', () => {
  before(async () => {
    R.muayene = await import('../../../app/api/ulke/muayene/route.ulke')
    R.hasta = await import('../../../app/api/ulke/hasta/route.ulke')
    R.bugun = await import('../../../app/api/ulke/bugun/route.ulke')
  })
  beforeEach(sifirla)

  it('HIGH confidence: one pass, no language sent; the prediction, its probability and the consent are stored; the audio is removed', async () => {
    const hasta = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    const yol = sesKoy(A)
    stt.cevaplar = [cevap(UZ_METIN, 'uzb', 0.97, -0.08)]
    const r = await muayeneYap('jeton-a', { yol, hastaId: hasta, sablon: 'pediatri', riza: true })
    assert.equal(r.s, 200)
    // randevuBagli (NOTYA-UZ-RANDEVU-01): this visit was not started from an appointment.
    assert.deepEqual({ ...r.j, seansId: undefined }, { seansId: undefined, ikinciGecis: false, dusukGuven: false, randevuBagli: false })
    assert.deepEqual(stt.cagrilar, [{ adres: SCRIBE, model: 'scribe_v2', dil: null, bayt: vt.depo.size === 0 ? stt.cagrilar[0].bayt : -1, anahtar: 'sahte-konusma-anahtari' }])
    assert.ok(stt.cagrilar[0].bayt > 10, 'the recording itself was sent')
    assert.equal(vt.depo.size, 0, 'the recording is removed once transcribed')
    const [seans] = vt.tablo('ulke_muayeneler')
    assert.deepEqual([seans.id, seans.doctor_id, seans.patient_id, seans.specialty, seans.status, seans.transcript_cleaned], [r.j.seansId, A, hasta, 'pediatri', 'completed', UZ_METIN])
    const [k] = vt.tablo('muayene_dil_kaydi')
    assert.deepEqual(
      [k.session_id, k.doctor_id, k.patient_id, k.stt_model, k.taninan_dil, k.dil_olasiligi, k.ikinci_gecis, k.ikinci_gecis_dili, k.secilen_gecis, k.gecis_sayisi, k.dusuk_guven, k.not_dili, k.sablon, k.riza_surumu],
      [r.j.seansId, A, hasta, 'scribe_v2', 'uzb', 0.97, false, null, 1, 1, false, 'uz-Latn', 'pediatri', 'uz-taslak-2026-10-08'])
    assert.ok(Math.abs((k.ortalama_log_olasilik as number) + 0.08) < 1e-9)
    assert.ok(typeof k.riza_at === 'string' && typeof k.ses_suresi_sn === 'number')
    assert.deepEqual([seans.patient_consent_given, seans.patient_consent_at, seans.session_type], [true, k.riza_at, 'muayene'])
    // The recorded visit, as the screen gets it: the transcript, the language by name, no raw code, no number.
    const d = await oku(await R.muayene.GET(istek(`/api/ulke/muayene?id=${r.j.seansId}`, 'jeton-a')))
    assert.equal(d.s, 200)
    assert.deepEqual(d.j.muayene.konusma, { dil: 'uz', dilKesin: true, ikinciGecis: false, dusukGuven: false })
    assert.deepEqual([d.j.muayene.metin, d.j.muayene.sablon, d.j.muayene.hasta.ad, d.j.muayene.notId, d.j.muayene.notDurumu], [UZ_METIN, 'pediatri', 'QA Karimova Dilnoza', null, 'notsuz'])
    assert.doesNotMatch(JSON.stringify(d.j), /uzb|0\.97|scribe/)
    // And the home lists it as a visit of today without a note.
    const b = await oku(await R.bugun.GET(istek('/api/ulke/bugun', 'jeton-a')))
    assert.deepEqual(b.j.muayeneler.map((m: Record<string, unknown>) => [m.seansId, m.hastaAdi, m.durum]), [[r.j.seansId, 'QA Karimova Dilnoza', 'notsuz']])
  })

  it('LOW language probability: ONE second pass forced to the doctor\'s note language; the better transcript is kept; the second pass is recorded', async () => {
    const hasta = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    const iyi = `${UZ_METIN} Ikkinchi oʻtishda aniqroq.`
    stt.cevaplar = [cevap(UZ_METIN, 'uzb', 0.55, -0.62), cevap(iyi, 'uzb', 1, -0.15)]
    const r = await muayeneYap('jeton-a', { yol: sesKoy(A), hastaId: hasta, sablon: 'genel', riza: true })
    assert.deepEqual({ s: r.s, ikinciGecis: r.j.ikinciGecis, dusukGuven: r.j.dusukGuven }, { s: 200, ikinciGecis: true, dusukGuven: false })
    assert.deepEqual(stt.cagrilar.map((c) => [c.model, c.dil]), [['scribe_v2', null], ['scribe_v2', 'uzb']], 'first pass without a language, second forced to Uzbek')
    assert.equal(stt.cagrilar[0].bayt, stt.cagrilar[1].bayt, 'the same recording both times')
    const [k] = vt.tablo('muayene_dil_kaydi')
    // The language of the visit is what the FIRST pass predicted, with its probability — whichever pass was kept.
    assert.deepEqual([k.taninan_dil, k.dil_olasiligi, k.ikinci_gecis, k.ikinci_gecis_dili, k.secilen_gecis, k.gecis_sayisi, k.dusuk_guven], ['uzb', 0.55, true, 'uzb', 2, 2, false])
    assert.equal(vt.tablo('ulke_muayeneler')[0].transcript_cleaned, iyi)
    assert.equal(vt.depo.size, 0)
    const d = await oku(await R.muayene.GET(istek(`/api/ulke/muayene?id=${r.j.seansId}`, 'jeton-a')))
    assert.deepEqual(d.j.muayene.konusma, { dil: 'uz', dilKesin: false, ikinciGecis: true, dusukGuven: false })
  })

  it('the second pass is forced to THAT doctor\'s note language (Russian for doctor B), and a worse second transcript is not kept', async () => {
    const hasta = await hastaEkle('jeton-b', 'QA Иванов Пётр', 'ru', '1980-12-31')
    stt.cevaplar = [cevap(RU_METIN, 'rus', 0.99, -0.5), cevap('хуже распознанный текст второй попытки, который не должен быть сохранён', 'rus', 1, -0.9)]
    const r = await muayeneYap('jeton-b', { yol: sesKoy(B), hastaId: hasta, sablon: 'genel', riza: true })
    assert.equal(r.s, 200)
    assert.deepEqual(stt.cagrilar.map((c) => c.dil), [null, 'rus'], 'low word confidence alone triggers the second pass')
    const [k] = vt.tablo('muayene_dil_kaydi')
    assert.deepEqual([k.ikinci_gecis, k.ikinci_gecis_dili, k.secilen_gecis, k.gecis_sayisi, k.dusuk_guven, k.not_dili], [true, 'rus', 1, 2, true, 'ru'])
    assert.equal(vt.tablo('ulke_muayeneler')[0].transcript_cleaned, RU_METIN)
    // Confidence stayed low: the visit says so (the note screen will ask the doctor to check carefully).
    assert.deepEqual([r.j.ikinciGecis, r.j.dusukGuven], [true, true])
  })

  it('NEVER more than two passes: both low, and the provider is not asked a third time', async () => {
    const hasta = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    // Exactly two answers are available: a third call would throw inside the stand-in and fail the visit.
    stt.cevaplar = [cevap(UZ_METIN, 'rus', 0.41, -0.9), cevap(UZ_METIN, 'uzb', 1, -0.8)]
    const r = await muayeneYap('jeton-a', { yol: sesKoy(A), hastaId: hasta, sablon: 'genel', riza: true })
    assert.equal(r.s, 200)
    assert.equal(stt.cagrilar.length, 2)
    assert.deepEqual([r.j.ikinciGecis, r.j.dusukGuven], [true, true])
    const [k] = vt.tablo('muayene_dil_kaydi')
    assert.deepEqual([k.secilen_gecis, k.gecis_sayisi, k.dusuk_guven, k.taninan_dil], [2, 2, true, 'rus'])
    // A language the country does not expect is named as such, never passed through.
    vt.tablo('muayene_dil_kaydi')[0].taninan_dil = 'tur'; vt.tablo('muayene_dil_kaydi')[0].dil_olasiligi = 0.95
    const d = await oku(await R.muayene.GET(istek(`/api/ulke/muayene?id=${r.j.seansId}`, 'jeton-a')))
    assert.equal(d.j.muayene.konusma.dil, 'baska')
  })

  it('a second pass that fails keeps the first transcript; the visit is saved and marked low confidence', async () => {
    const hasta = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    stt.cevaplar = [cevap(UZ_METIN, 'uzb', 0.5, -0.2), 503]
    const r = await muayeneYap('jeton-a', { yol: sesKoy(A), hastaId: hasta, sablon: 'genel', riza: true })
    assert.deepEqual([r.s, r.j.ikinciGecis, r.j.dusukGuven], [200, true, true])
    assert.equal(vt.tablo('ulke_muayeneler')[0].transcript_cleaned, UZ_METIN)
  })

  it('CONSENT: without the tick the server refuses, the provider is never called, nothing is stored, the audio is removed', async () => {
    const hasta = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    for (const riza of [undefined, false, 'true', 1, null]) {
      const yol = sesKoy(A)
      stt.cevaplar = [cevap(UZ_METIN, 'uzb', 0.97, -0.08)]
      assert.deepEqual(await muayeneYap('jeton-a', { yol, hastaId: hasta, sablon: 'genel', riza }), { s: 400, j: { code: 'RIZA_GEREKLI' } }, String(riza))
      assert.equal(vt.depo.size, 0, 'a recording made without consent is not kept')
    }
    assert.equal(stt.cagrilar.length, 0)
    assert.deepEqual([vt.tablo('ulke_muayeneler'), vt.tablo('muayene_dil_kaydi')], [[], []])
  })

  it('ISOLATION: another doctor\'s patient, and a recording in another doctor\'s folder, are refused before anything is read — both directions', async () => {
    const hastaA = await hastaEkle('jeton-a', 'QA GIZLI-A Karimova')
    const hastaB = await hastaEkle('jeton-b', 'QA GIZLI-B Иванов', 'ru')
    for (const [jeton, ben, kendiHasta, yabanciHasta, oteki] of [['jeton-a', A, hastaA, hastaB, B], ['jeton-b', B, hastaB, hastaA, A]] as const) {
      stt.cagrilar = []; stt.cevaplar = [cevap(UZ_METIN, 'uzb', 0.97, -0.08), cevap(UZ_METIN, 'uzb', 0.97, -0.08), cevap(UZ_METIN, 'uzb', 0.97, -0.08)]
      // 1. My recording, the other doctor's patient: the same answer as a patient that does not exist.
      const benimYol = sesKoy(ben, 'benim.webm')
      const r1 = await R.muayene.POST(istek('/api/ulke/muayene', jeton, { yol: benimYol, hastaId: yabanciHasta, sablon: 'genel', riza: true }))
      const yok = await R.muayene.POST(istek('/api/ulke/muayene', jeton, { yol: sesKoy(ben, 'benim2.webm'), hastaId: '30000000-0000-4000-8000-00000000dead', sablon: 'genel', riza: true }))
      assert.equal(r1.status, 404); assert.equal(await r1.text(), '{"code":"NOT_FOUND"}'); assert.equal(await yok.text(), '{"code":"NOT_FOUND"}')
      // 2. The other doctor's recording, my own patient: refused as text — their file is neither read nor removed.
      const otekiYol = sesKoy(oteki, 'oteki.webm')
      for (const yol of [otekiYol, `uz/${ben}/../${oteki}/oteki.webm`, `uz/${ben}/alt/oteki.webm`, `/${otekiYol}`, '', `uz/${ben}/`,
        // COUNTRY (shared database): the caller's own account id under another country's folder, under no country
        // folder at all (the path shape before countries shared a bucket), and a climb out of the country folder.
        `tr/${ben}/benim.webm`, `kz/${ben}/benim.webm`, `${ben}/benim.webm`, `uz/../tr/${ben}/benim.webm`, `UZ/${ben}/benim.webm`]) {
        assert.deepEqual(await muayeneYap(jeton, { yol, hastaId: kendiHasta, sablon: 'genel', riza: true }), { s: 400, j: { code: 'GECERSIZ', alan: 'yol' } }, yol)
      }
      assert.ok(vt.depo.has(`${KOVA}/${otekiYol}`), 'another doctor\'s recording was touched')
      assert.equal(stt.cagrilar.length, 0, 'nothing was sent to the provider for a refused request')
      assert.equal(vt.tablo('ulke_muayeneler').filter((s) => s.doctor_id === ben).length, 0)
      vt.depo.clear()
    }
    // Positive control, then: each doctor reads only their own visit.
    stt.cevaplar = [cevap(UZ_METIN, 'uzb', 0.97, -0.08), cevap(RU_METIN, 'rus', 0.98, -0.07)]
    const sA = (await muayeneYap('jeton-a', { yol: sesKoy(A), hastaId: hastaA, sablon: 'genel', riza: true })).j.seansId
    const sB = (await muayeneYap('jeton-b', { yol: sesKoy(B), hastaId: hastaB, sablon: 'genel', riza: true })).j.seansId
    for (const [jeton, kendi, yabanci] of [['jeton-a', sA, sB], ['jeton-b', sB, sA]] as const) {
      assert.equal((await oku(await R.muayene.GET(istek(`/api/ulke/muayene?id=${kendi}`, jeton)))).s, 200)
      const r = await R.muayene.GET(istek(`/api/ulke/muayene?id=${yabanci}`, jeton))
      const govde = await r.text()
      assert.equal(r.status, 404); assert.equal(govde, '{"code":"NOT_FOUND"}')
      assert.equal(await (await R.muayene.GET(istek('/api/ulke/muayene?id=30000000-0000-4000-8000-00000000dead', jeton))).text(), govde)
      const bugun = await oku(await R.bugun.GET(istek('/api/ulke/bugun', jeton)))
      assert.deepEqual(bugun.j.muayeneler.map((m: Record<string, unknown>) => m.seansId), [kendi])
    }
    // Every read or change of a visit table carried the caller's id.
    const tablolar = new Set(['ulke_muayeneler', 'muayene_dil_kaydi', 'ulke_notlar', 'ulke_hastalar', 'hasta_ulke_bilgisi'])
    for (const q of vt.sorgular.filter((x) => tablolar.has(x.tablo) && x.islem !== 'insert')) assert.ok(q.filtreler.some((f) => f === `doctor_id=eq.${A}` || f === `doctor_id=eq.${B}`), `a query on ${q.tablo} without the doctor: ${JSON.stringify(q)}`)
  })

  it('a body cannot name another doctor: the visit and its record belong to the caller', async () => {
    const hasta = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    stt.cevaplar = [cevap(UZ_METIN, 'uzb', 0.97, -0.08)]
    const r = await muayeneYap('jeton-a', { yol: sesKoy(A), hastaId: hasta, sablon: 'genel', riza: true, doctor_id: B, doktorId: B, patient_id: 'x', notDili: 'tr' })
    assert.equal(r.s, 200)
    assert.deepEqual([vt.tablo('ulke_muayeneler')[0].doctor_id, vt.tablo('muayene_dil_kaydi')[0].doctor_id, vt.tablo('muayene_dil_kaydi')[0].not_dili], [A, A, 'uz-Latn'])
  })

  it('failures answer with codes and remove the audio: provider error, too little speech, unknown template, not configured, daily ceiling', async () => {
    const hasta = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    const dene = async (g: Record<string, unknown> = {}) => { const yol = sesKoy(A); const r = await muayeneYap('jeton-a', { yol, hastaId: hasta, sablon: 'genel', riza: true, ...g }); assert.equal(vt.depo.size, 0, 'audio left in storage'); return r }
    const eski = console.error; const gunluk: string[] = []
    console.error = (...a: unknown[]) => { gunluk.push(a.map(String).join(' ')) }
    try {
      stt.cevaplar = [500]
      assert.deepEqual(await dene(), { s: 502, j: { code: 'SES_OKUNAMADI' } })
    } finally { console.error = eski }
    // The provider's error body (Turkish, quoting a patient) is in neither the answer nor the log.
    assert.deepEqual(gunluk, ['[ulke/konusma] provider answered 500 (pass 1)'])
    stt.cevaplar = [cevap('juda qisqa', 'uzb', 0.99, -0.05)]
    assert.deepEqual(await dene(), { s: 422, j: { code: 'KISA_KAYIT' } })
    // Another role's template (A is a paediatrician), and something that is no template at all.
    for (const sablon of ['kardiyoloji', 'dahiliye', 'odyoloji', '', 'Pediatri', 'kadin-dogum']) assert.deepEqual(await dene({ sablon }), { s: 400, j: { code: 'GECERSIZ', alan: 'sablon' } }, sablon)
    const anahtar = process.env.ELEVENLABS_API_KEY
    delete process.env.ELEVENLABS_API_KEY
    try { assert.deepEqual(await dene(), { s: 503, j: { code: 'HAZIR_DEGIL' } }) } finally { process.env.ELEVENLABS_API_KEY = anahtar }
    // The day's ceiling, counted on the country's own day.
    const { ulkeGunu } = await import('@/lib/ulke/uygulama/gun')
    vt.tablo('ulke_kullanim').length = 0
    vt.tablo('ulke_kullanim').push({ ulke: 'uz', doctor_id: A, gun: ulkeGunu(), kova: 'soap', sayac: 200 })
    assert.deepEqual(await dene(), { s: 429, j: { code: 'LIMIT' } })
    assert.deepEqual([vt.tablo('ulke_muayeneler'), vt.tablo('muayene_dil_kaydi')], [[], []])
    assert.equal(stt.cagrilar.length, 2, 'only the first two attempts reached the provider')
  })

  it('a visit whose language record cannot be written is not kept', async () => {
    const hasta = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    stt.cevaplar = [cevap(UZ_METIN, 'uzb', 0.97, -0.08)]
    vt.boz.yaz.add('muayene_dil_kaydi')
    assert.deepEqual(await muayeneYap('jeton-a', { yol: sesKoy(A), hastaId: hasta, sablon: 'genel', riza: true }), { s: 500, j: { code: 'BASARISIZ' } })
    assert.deepEqual(vt.tablo('ulke_muayeneler'), []); assert.equal(vt.depo.size, 0)
  })

  it('no session, another country\'s account: "no session", nothing read', async () => {
    for (const jeton of [undefined, 'jeton-olmayan', 'jeton-tr']) {
      const yol = sesKoy(A)
      assert.deepEqual(await muayeneYap(jeton as string, { yol, hastaId: '30000000-0000-4000-8000-000000000001', sablon: 'genel', riza: true }), { s: 401, j: { code: 'OTURUM_YOK' } })
      assert.deepEqual(await oku(await R.muayene.GET(istek('/api/ulke/muayene?id=30000000-0000-4000-8000-000000000001', jeton))), { s: 401, j: { code: 'OTURUM_YOK' } })
      assert.ok(vt.depo.has(`${KOVA}/${yol}`))
    }
    assert.equal(stt.cagrilar.length, 0)
  })
})

describe('Uzbekistan visit: screens in the three forms', () => {
  let Kabuk: typeof import('@/components/ulke/uygulama/Kabuk')
  let Muayene: typeof import('@/components/ulke/uygulama/Muayene')
  let M: typeof import('./metinler')
  let Layout: typeof import('../../../app/layout.ulke')
  let ACIK: readonly string[] = []
  before(async () => {
    Kabuk = await import('@/components/ulke/uygulama/Kabuk'); Muayene = await import('@/components/ulke/uygulama/Muayene'); M = await import('./metinler'); Layout = await import('../../../app/layout.ulke')
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
  const HASTA = { id: '30000000-0000-4000-8000-000000000001', ad: 'QA Karimova Dilnoza', otaIsmi: 'Rustam qizi', dogumTarihi: '2021-03-07', cinsiyet: 'female' as const, telefon: '+998 90 000 00 01', dil: 'uz', ulusalKimlik: '' }
  const bos = () => {}

  it('the visit screen exists: route file, pack list, screen — and the links to it are switched on', async () => {
    const { UYGULAMA_EKRAN_BILESENLERI: UZ_UYGULAMA } = await import('@/components/ulke/uygulama')
    assert.ok('muayene' in UZ_UYGULAMA)
    assert.ok(ACIK.includes('/visit'))
    assert.ok(existsSync(join(KOK, 'app/visit/page.ulke.tsx')))
    assert.equal(Kabuk.HAZIR.muayene, true)
    assert.match(readFileSync(join(KOK, 'app/visit/page.ulke.tsx'), 'utf8'), /<UlkeUygulamaSayfasi ekran="muayene" \/>/)
    const Sayfa = (await import('../../../app/visit/page.ulke')) as { default: () => React.ReactElement }
    const html = renderToStaticMarkup(React.createElement(Layout.default, null, Sayfa.default()))
    assert.ok(html.includes('Yuklanmoqda…'))
    ekranTemiz(html, '/visit (loading)')
  })

  for (const f of FORMLAR) {
    it(`${f}: choose the patient — every patient leads to a visit for THAT patient`, () => {
      const m = M.uygulamaMetni(f)
      const html = cerceve(f, React.createElement(Muayene.HastaSecGorunumu, { m, q: '', hastalar: [HASTA], hata: false }))
      const g = gorunurMetin(html)
      for (const x of [m.muayene.baslik, m.muayene.hastaSec, m.muayene.yeniHasta, 'QA Karimova Dilnoza Rustam qizi', m.bugun.muayeneBaslat]) assert.ok(g.includes(x), x)
      assert.ok(html.includes(`href="/uzbek/visit?hasta=${HASTA.id}"`))
      assert.match(html, /<form class="uza-arama" action="\/uzbek\/visit" method="get"/)
      ekranTemiz(html, `/visit (${f}, choose patient)`)
    })

    it(`${f}: consent blocks recording — the button is disabled until the box is ticked`, () => {
      const m = M.uygulamaMetni(f)
      const ciz = (riza: boolean, hataKodu: string | null = null) => cerceve(f, React.createElement(Muayene.KayitGorunumu, { m, hasta: HASTA, sablon: 'pediatri', riza, setRiza: bos, durum: 'hazir', sure: 0, hataKodu, baslat: bos, durdur: bos, vazgec: bos }))
      const kapali = ciz(false)
      const g = gorunurMetin(kapali)
      for (const x of [m.muayene.baslik, 'QA Karimova Dilnoza Rustam qizi', m.muayene.sablon, m.muayene.sablonPediatri, m.muayene.riza, m.muayene.kayitBaslat, m.muayene.rizaGerekli]) assert.ok(g.includes(x), x)
      assert.match(kapali, /<input type="checkbox" name="riza"\/>/, 'the consent box starts unticked')
      assert.match(kapali, new RegExp(`<button type="button" class="uza-dugme" disabled="">${m.muayene.kayitBaslat}</button>`))
      const acik = ciz(true)
      assert.match(acik, /<input type="checkbox" name="riza" checked=""\/>/)
      assert.match(acik, new RegExp(`<button type="button" class="uza-dugme">${m.muayene.kayitBaslat}</button>`))
      assert.ok(!gorunurMetin(acik).includes(m.muayene.rizaGerekli))
      // The template is not a choice: it is the account's role, shown by name. No template control exists.
      assert.equal([...kapali.matchAll(/<input\b[^>]*name="sablon"[^>]*>/g)].length, 0)
      assert.match(kapali, new RegExp(`<dd data-alan="sablon">${m.muayene.sablonPediatri}</dd>`))
      ekranTemiz(kapali, `/visit?hasta= (${f})`)
      // Every code of the visit API has its own sentence in this form — and none of them is the code itself.
      for (const kod of ['RIZA_GEREKLI', 'KISA_KAYIT', 'SES_OKUNAMADI', 'LIMIT', 'HAZIR_DEGIL', 'NOT_FOUND', 'MIKROFON', 'BAGLANTI', 'BASARISIZ', 'GECERSIZ', 'bilinmeyen']) {
        const html = ciz(true, kod)
        const uyari = /<div role="alert" class="uza-uyari-kutu">([^<]+)<\/div>/.exec(html)
        assert.ok(uyari && uyari[1].length > 12 && !uyari[1].includes(kod), `${f}/${kod}: ${uyari?.[1]}`)
        ekranTemiz(html, `/visit error ${kod} (${f})`)
      }
      const kayitta = cerceve(f, React.createElement(Muayene.KayitGorunumu, { m, hasta: HASTA, sablon: 'genel', riza: true, setRiza: bos, durum: 'kayit', sure: 75, hataKodu: null, baslat: bos, durdur: bos, vazgec: bos }))
      for (const x of [m.muayene.kaydediliyor, '01:15', m.muayene.kayitDurdur, m.muayene.vazgec]) assert.ok(gorunurMetin(kayitta).includes(x), x)
      ekranTemiz(kayitta, `/visit recording (${f})`)
      for (const durum of ['yukleniyor', 'isleniyor'] as const) {
        const html = cerceve(f, React.createElement(Muayene.KayitGorunumu, { m, hasta: HASTA, sablon: 'genel', riza: true, setRiza: bos, durum, sure: 0, hataKodu: null, baslat: bos, durdur: bos, vazgec: bos }))
        assert.ok(gorunurMetin(html).includes(durum === 'yukleniyor' ? m.muayene.yukleniyor : m.muayene.isleniyor))
      }
    })

    it(`${f}: a recorded visit — transcript, language by name, plain notices for a second pass and for low confidence`, () => {
      const m = M.uygulamaMetni(f)
      const muayene = (konusma: import('@/components/ulke/uygulama/Muayene').KonusmaOzeti | null) => ({ seansId: 's1', baslangic: '2026-10-08T04:30:00Z', sablon: 'pediatri', metin: UZ_METIN, hasta: HASTA, notId: null, notDurumu: 'notsuz' as const, konusma })
      const temizHal = cerceve(f, React.createElement(Muayene.MuayeneOzetiGorunumu, { m, muayene: muayene({ dil: 'uz', dilKesin: true, ikinciGecis: false, dusukGuven: false }) }))
      const g = gorunurMetin(temizHal)
      for (const x of [m.muayene.baslik, 'QA Karimova Dilnoza Rustam qizi', '08.10.2026', '09:30', m.muayene.sablonPediatri, m.muayene.taninanDil, m.muayene.konusmaDili.uz, m.not.transkript, m.muayene.metinKaydedildi, UZ_METIN, m.not.dosyayaDon]) assert.ok(g.includes(x), x)
      assert.ok(!g.includes(m.muayene.dusukGuven) && !g.includes(m.muayene.ikinciGecis))
      assert.ok(temizHal.includes(`href="/uzbek/patient?id=${HASTA.id}"`))
      ekranTemiz(temizHal, `/visit?seans= (${f})`)
      const dusuk = cerceve(f, React.createElement(Muayene.MuayeneOzetiGorunumu, { m, muayene: muayene({ dil: 'ru', dilKesin: false, ikinciGecis: true, dusukGuven: true }) }))
      const g2 = gorunurMetin(dusuk)
      for (const x of [m.muayene.dusukGuven, m.muayene.ikinciGecis, m.muayene.dilKarma]) assert.ok(g2.includes(x), x)
      assert.match(dusuk, /<div role="alert" class="uza-uyari-kutu" data-bildirim="dusuk-guven">/)
      ekranTemiz(dusuk, `/visit?seans= low confidence (${f})`)
      assert.equal(Muayene.konusmaDiliAdi(m, { dil: 'ru', dilKesin: true, ikinciGecis: false, dusukGuven: false }), m.muayene.konusmaDili.ru)
      assert.equal(Muayene.konusmaDiliAdi(m, { dil: 'baska', dilKesin: true, ikinciGecis: false, dusukGuven: false }), m.muayene.dilBaska)
      assert.equal(Muayene.konusmaDiliAdi(m, null), '')
    })
  }

  it('the template is the account\'s role — never the patient\'s age; no role (or a value that is not one) is the general template', () => {
    assert.equal(Muayene.hesapSablonu('kardiyoloji'), 'kardiyoloji')
    assert.equal(Muayene.hesapSablonu('odyoloji'), 'odyoloji')
    for (const ham of [null, undefined, '', 'kadin-dogum', 'Pediatri']) assert.equal(Muayene.hesapSablonu(ham), 'genel', String(ham))
    // A template is named for a person in the screen's form; a key is never the name.
    assert.deepEqual(FORMLAR.map((f) => Muayene.sablonAdi(M.uygulamaMetni(f), 'kardiyoloji')), ['Kardiologiya', 'Кардиология', 'Кардиология'])
    assert.deepEqual(FORMLAR.map((f) => Muayene.sablonAdi(M.uygulamaMetni(f), 'genel')), FORMLAR.map((f) => M.uygulamaMetni(f).muayene.sablonGenel))
    assert.equal(Muayene.sablonAdi(M.uygulamaMetni('uz-Latn'), 'yok-boyle'), M.uygulamaMetni('uz-Latn').muayene.sablonGenel)
  })

  it('the home and the patient file lead to the visit; a visit without a note opens the recorded visit', async () => {
    const Bugun = await import('@/components/ulke/uygulama/Bugun'); const Hastalar = await import('@/components/ulke/uygulama/Hastalar')
    const m = M.uygulamaMetni('uz-Latn')
    const ev = cerceve('uz-Latn', React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA', hata: false, muayeneler: [{ seansId: 's3', notId: null, hastaId: HASTA.id, hastaAdi: 'QA Karimova Dilnoza', baslangic: '2026-10-08T07:00:00Z', durum: 'notsuz' }] }))
    assert.ok(ev.includes('href="/uzbek/visit"') && ev.includes('href="/uzbek/visit?seans=s3"'))
    ekranTemiz(ev, '/today with a visit')
    const dosya = cerceve('uz-Latn', React.createElement(Hastalar.HastaDosyasiGorunumu, { m, hasta: HASTA, muayeneler: [{ seansId: 's3', notId: null, baslangic: '2026-10-08T07:00:00Z', durum: 'notsuz' }] }))
    assert.ok(dosya.includes(`href="/uzbek/visit?hasta=${HASTA.id}"`) && dosya.includes('href="/uzbek/visit?seans=s3"'))
    assert.ok(gorunurMetin(dosya).includes(m.hasta.notsuzlar))
    ekranTemiz(dosya, '/patient with a visit')
  })
})
