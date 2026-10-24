/**
 * NOTYA-ULKE-EKLER-01 — the "add documents" step of a country's visit flow, for whatever pack is active. Runs ONCE PER
 * PACK (scripts/ulke-test.mjs). Real handlers and real library code; the database and the model provider are
 * stand-ins inside this process, any other address fails the test. Synthetic data only.
 *
 *   1. PURE RULES: file kinds, languages, the request's documents → note blocks (labels, "1/4" numbering, dates),
 *      the reader's answer, the instruction, image bytes, age.
 *   2. THE ENGINE FILES are reachable through the country gate, under the build's path prefix.
 *   3. THE READER'S ROUTE: sign-in, isolation by doctor, input checks, what leaves for the model (masked image, age, sex —
 *      nothing else), nothing stored.
 *   4. THE FIRST NOTE: all documents in one write, numbered, model banner/heading removed, idempotent.
 *   5. A DRAFT NOTE: later documents merge in; text of the doctor is untouched; approved and foreign notes are refused.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0012'
process.env.OPENROUTER_API_KEY = 'sahte-model-anahtari'
delete process.env.OPENROUTER_BASE_URL

import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani } from '@/lib/ulke/testing/sahteVeritabani'
import { bloklariAktar, llmBelgeBlokTemizle, notaBloklariUygula } from '@/core/belgeler/notaBlok'
import { ocrAyarla, tesseractVarliklari } from '@/core/belgeler/ocrKimlik'

const vt = sahteVeritabani()
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: vt.createClient } })
  }
}

// ───────────────────────── stand-in model provider ─────────────────────────
const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions'
type Cagri = { sistem: string; govde: string; gorselVar: boolean }
const model = { cagrilar: [] as Cagri[], cevaplar: [] as (Record<string, unknown> | string)[] }
globalThis.fetch = (async (g: unknown, o?: { body?: unknown }) => {
  const adres = String(g)
  if (adres !== OPENROUTER) throw new Error(`this test may not use the network: ${adres}`)
  const b = JSON.parse(String(o?.body)) as { model: string; messages: { role: string; content: unknown }[] }
  const sis = b.messages.find((m) => m.role === 'system')?.content ?? ''
  model.cagrilar.push({
    sistem: typeof sis === 'string' ? sis : (sis as { text?: string }[]).map((p) => p.text ?? '').join('\n'),
    govde: JSON.stringify(b.messages.filter((m) => m.role !== 'system')),
    gorselVar: JSON.stringify(b.messages).includes('image'),
  })
  const c = model.cevaplar.shift()
  if (c === undefined) throw new Error('the model was called more often than the test allows')
  return new Response(JSON.stringify({ id: 'sahte-1', model: b.model, choices: [{ message: { role: 'assistant', content: typeof c === 'string' ? c : JSON.stringify(c) }, finish_reason: 'stop' }], usage: { prompt_tokens: 900, completion_tokens: 120 } }), { status: 200 })
}) as typeof fetch

type Paket = import('../tipler').UlkePaketi
let paket: Paket
let BU = ''
let AKTIF = false
/** AU-LAUNCH-01: the pack switches on reading images with the model (`goruntuDegerlendirme`). Without it the three routes answer "not found". */
let GORUNTU = false
let NextRequest: typeof import('next/server').NextRequest
let E: typeof import('./ekler')
let TL: typeof import('./belgeTalimati')
let D: typeof import('./belgeDegerlendir')
let N: typeof import('../uygulama/notlar')
let rota: { belge: Record<string, (r: unknown) => Promise<Response>>; not: Record<string, (r: unknown) => Promise<Response>>; notBelge: Record<string, (r: unknown) => Promise<Response>> }
let SABLON = ''
let DIL = ''

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001'
const H2 = '30000000-0000-4000-8000-000000000002'
const V1 = '40000000-0000-4000-8000-000000000001' // doctor A, patient H1
const V2 = '40000000-0000-4000-8000-000000000002' // doctor B, patient H2
const N1 = '50000000-0000-4000-8000-000000000001' // note of V1
const B = (n: number) => `60000000-0000-4000-8000-00000000000${n}`
const sb = () => vt.createClient() as unknown as import('@supabase/supabase-js').SupabaseClient
const tablo = (ad: string) => vt.tablo(ad)

/** A JPEG-looking payload: the first bytes are what the server checks. */
const JPEG_B64 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('sentetik gorsel — gercek bir fotograf degil')]).toString('base64')

async function sifirla() {
  const { encrypt } = await import('@/lib/security/encryption')
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  model.cagrilar = []; model.cevaplar = []
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: DA, email: 'qa-a@notya.test', app_metadata: { country: BU } },
    'jeton-b': { id: DB, email: 'qa-b@notya.test', app_metadata: { country: BU } },
  })
  tablo('ulke_hesaplari').push({ id: DA, full_name: 'QA Doctor A', ulke: BU }, { id: DB, full_name: 'QA Doctor B', ulke: BU })
  const hasta = (id: string, doktor: string, ad: string) => ({ id, ulke: BU, doctor_id: doktor, name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt('2021-03-07'), gender_encrypted: encrypt('female'), phone_encrypted: null, created_at: new Date().toISOString() })
  tablo('ulke_hastalar').push(hasta(H1, DA, 'QA Patient One'), hasta(H2, DB, 'QA Patient Two'))
  tablo('ulke_muayeneler').push(
    { id: V1, ulke: BU, doctor_id: DA, patient_id: H1, started_at: new Date().toISOString(), specialty: SABLON, transcript_cleaned: 'Synthetic transcript of the visit, long enough to be a visit.' },
    { id: V2, ulke: BU, doctor_id: DB, patient_id: H2, started_at: new Date().toISOString(), specialty: SABLON, transcript_cleaned: 'Synthetic transcript.' },
  )
  tablo('muayene_dil_kaydi').push({ ulke: BU, session_id: V1, doctor_id: DA, not_dili: DIL, sablon: SABLON }, { ulke: BU, session_id: V2, doctor_id: DB, not_dili: DIL, sablon: SABLON })
}

async function cagir(modul: Record<string, (r: unknown) => Promise<Response>>, yontem: string, yol: string, jeton?: string, govde?: unknown): Promise<{ status: number; govde: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const basliklar: Record<string, string> = { host: 'notya.test' }
  if (jeton) basliklar.authorization = `Bearer ${jeton}`
  if (govde !== undefined) basliklar['content-type'] = 'application/json'
  const res = await modul[yontem](new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(govde !== undefined ? { body: JSON.stringify(govde) } : {}) }))
  const metin = await res.text()
  return { status: res.status, govde: (() => { try { return JSON.parse(metin) } catch { return metin } })() }
}

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  AKTIF = paket.ozellikler.cekirdekMuayene === true
  GORUNTU = paket.ozellikler.goruntuDegerlendirme === true
  DIL = paket.varsayilanDil
  NextRequest = (await import('next/server')).NextRequest
  E = await import('./ekler')
  TL = await import('./belgeTalimati')
  D = await import('./belgeDegerlendir')
  N = await import('../uygulama/notlar')
  rota = {
    belge: (await import('../../../app/api/ulke/belge-degerlendir/route.ulke')) as never,
    not: (await import('../../../app/api/ulke/not/route.ulke')) as never,
    notBelge: (await import('../../../app/api/ulke/not/belge/route.ulke')) as never,
  }
  SABLON = (await import('@/countries/active/klinik')).AKTIF_KLINIK?.sablonlar[0] ?? ''
  const cagirModulu = await import('@/lib/ai/cagir')
  cagirModulu.TASIMA_BEKLEME.ms = 1
})
beforeEach(async () => { if (AKTIF) await sifirla() })

describe('1. pure rules', () => {
  it('file kinds: pictures and PDF are accepted, nothing else; the type is read from the extension when the browser gave none', () => {
    assert.equal(E.ekDosyaTuru('a.jpg', 'image/jpeg'), 'gorsel')
    assert.equal(E.ekDosyaTuru('a.HEIC', 'image/heic'), 'gorsel')
    assert.equal(E.ekDosyaTuru('a.pdf', 'application/pdf'), 'pdf')
    assert.equal(E.ekDosyaTuru('a.pdf', ''), 'pdf')
    assert.equal(E.ekDosyaTuru('a.png', ''), 'gorsel')
    for (const [ad, m] of [['a.zip', 'application/zip'], ['a.txt', 'text/plain'], ['a.mp3', 'audio/mpeg'], ['a', ''], ['a.svg', 'image/svg+xml']] as const) assert.equal(E.ekDosyaTuru(ad, m), null, ad)
  })

  it('the block language is the note\'s language; every language of every pack has a label for every type', () => {
    assert.deepEqual(['ru', 'uz-Latn', 'uz-Cyrl', 'en-GB', 'en-US', 'en-CA', 'en-AU', 'en-NZ'].map(E.blokDili), ['ru', 'uz', 'uzk', 'en', 'en', 'en', 'en', 'en'])
    for (const d of paket.diller) {
      const bd = E.blokDili(d)
      for (const t of E.EK_TURLERI) assert.ok(E.ekTuruEtiketi(bd, t).trim().length > 1, `${d}/${t}`)
    }
    assert.equal(E.ekTuruEtiketi('en', 'ultrasound'), 'Ultrasound')
    assert.equal(E.ekTuruEtiketi('ru', 'ultrasound'), 'УЗИ')
    assert.ok(E.EK_TURLERI.includes('ultrasound'), 'Ultrasound is a document type')
  })

  it('an exam date is accepted only when it is plausible', () => {
    const simdi = Date.parse('2026-10-21T12:00:00Z')
    assert.equal(E.sinavZamaniniSuz('2026-10-20', simdi), '2026-10-20')
    assert.equal(E.sinavZamaniniSuz('2026-10-20T09:30', simdi), '2026-10-20T09:30')
    for (const k of ['1980-01-01', '2999-01-01', 'yesterday', '', 5, null, '2026-13-45']) assert.equal(E.sinavZamaniniSuz(k, simdi), null, String(k))
  })

  it('the request\'s documents become note blocks: label and date are made on the server; bad, repeated and empty entries are dropped; the order is kept; at most 12', () => {
    const simdi = new Date('2026-10-21T12:00:00Z')
    const girdi = [
      { belgeId: B(1), tur: 'ultrasound', sinavZamani: '2026-10-20T09:30', ozet: 'Single live fetus.', bulgular: ['FHR 150 bpm', ' CRL 45 mm. '], acil: false, etiket: 'INJECTED', tarih: 'INJECTED' },
      { belgeId: B(1), tur: 'ultrasound', ozet: 'duplicate id' },
      { belgeId: 'not-a-uuid', tur: 'ultrasound', ozet: 'bad id' },
      { belgeId: B(2), tur: 'ultrasound', ozet: '', bulgular: [] },
      { belgeId: B(3), tur: 'something-else', ozet: 'Unknown type is a document.', acil: true },
      'junk', null, 7,
    ]
    const k = E.ekGirdileriniOku(girdi, paket.varsayilanDil, simdi)
    assert.deepEqual(k.map((x) => x.belgeId), [B(1), B(3)])
    assert.equal(k[0].etiket, E.ekTuruEtiketi(E.blokDili(paket.varsayilanDil), 'ultrasound'))
    assert.equal(k[1].etiket, E.ekTuruEtiketi(E.blokDili(paket.varsayilanDil), 'other'))
    assert.deepEqual(k[0].bulgular, ['FHR 150 bpm', 'CRL 45 mm.'.replace(/\.$/, '.')].map((x) => x.trim()))
    assert.equal(k[0].sinavZamani, '2026-10-20T09:30')
    assert.notEqual(k[0].tarih, 'INJECTED'); assert.notEqual(k[0].etiket, 'INJECTED')
    assert.equal(k[1].acil, true); assert.equal(k[0].acil, false)
    assert.deepEqual(k.map((x) => x.yuklemeSirasi), [0, 1])
    assert.deepEqual(E.ekGirdileriniOku('x', 'en-GB'), []); assert.deepEqual(E.ekGirdileriniOku(undefined, 'en-GB'), [])
    const cok = Array.from({ length: 40 }, (_, i) => ({ belgeId: `70000000-0000-4000-8000-${String(i).padStart(12, '0')}`, tur: 'lab', ozet: `r${i}` }))
    assert.equal(E.ekGirdileriniOku(cok, 'en-GB').length, E.EK_AZAMI_ADET)
    // Long text is cut, never rejected.
    assert.ok(E.ekGirdileriniOku([{ belgeId: B(4), ozet: 'x'.repeat(50_000) }], 'en-GB')[0].ozet!.length <= E.EK_OZET_AZAMI)
  })

  it('the heading date is written in the note\'s own form', () => {
    const d = new Date(2026, 9, 21, 12) // local noon: "today" is the server's own day
    assert.equal(E.tarihGoster('en-GB', null, d), '21/10/2026')
    assert.equal(E.tarihGoster('en-US', null, d), '10/21/2026')
    assert.equal(E.tarihGoster('ru', '2026-03-09', d), '09.03.2026')
    assert.match(E.tarihGoster('uz-Latn', '2026-03-09', d), /09|9/)
  })

  it('FOUR ultrasounds make "1/4 … 4/4", in one pass, in a stable order; the model\'s own banner and heading are removed; a repeat changes nothing', () => {
    const bd = E.blokDili(paket.varsayilanDil)
    const eti = E.ekTuruEtiketi(bd, 'ultrasound')
    const girdi = [1, 2, 3, 4].map((i) => ({ belgeId: B(i), tur: 'ultrasound', ozet: `Finding ${i}.`, bulgular: [`FHR ${140 + i} bpm`] }))
    const g = E.ekGirdileriniOku(girdi, paket.varsayilanDil)
    const modelinNotu = 'Normal examination.\n\n— Belge değerlendirmesi () —\nYapay zekâ taslak rapor üretir. Tanı ve tedavi kararı hekime aittir.\n\nFHR 130 bpm noted by the doctor.'
    const temiz = llmBelgeBlokTemizle(modelinNotu)
    assert.doesNotMatch(temiz, /Belge değerlendirmesi|Yapay zek/)
    assert.match(temiz, /Normal examination/)
    const u = notaBloklariUygula(temiz, g, bd)
    for (let i = 1; i <= 4; i++) assert.ok(u.metin.includes(`${eti} ${i}/4`), `${eti} ${i}/4`)
    assert.ok(u.metin.indexOf(`${eti} 1/4`) < u.metin.indexOf(`${eti} 4/4`))
    assert.ok(u.metin.startsWith('Normal examination.'), 'the doctor\'s text stays first and untouched')
    assert.deepEqual(u.islemler.map((x) => x.islem), ['eklendi', 'eklendi', 'eklendi', 'eklendi'])
    const tekrar = notaBloklariUygula(u.metin, g, bd)
    assert.equal(tekrar.metin, u.metin); assert.equal(tekrar.degisti, false)
    // A different answer for the same document replaces its own block only.
    const g2 = E.ekGirdileriniOku([{ ...girdi[1], ozet: 'Revised.' }], paket.varsayilanDil)
    const r = notaBloklariUygula(u.metin, g2, bd)
    assert.equal(r.islemler[0].islem, 'degisti'); assert.ok(r.metin.includes('Revised.')); assert.ok(!r.metin.includes('Finding 2.')); assert.ok(r.metin.includes('Finding 3.'))
    // bloklariAktar: the screen's text (with the doctor's unsaved edits) gets the saved blocks it does not have yet.
    const ekranda = temiz + '\n\nMY EDIT'
    const aktar = bloklariAktar(u.metin, ekranda)
    assert.ok(aktar.startsWith(ekranda)); for (let i = 1; i <= 4; i++) assert.ok(aktar.includes(`${eti} ${i}/4`))
    assert.equal(bloklariAktar(u.metin, aktar), aktar, 'merging twice adds nothing')
  })

  it('the reader\'s answer: observations only; poor quality, a missing answer and garbage are told apart', () => {
    const iyi = TL.belgeSonucunuOku(JSON.stringify({ kind: 'ultrasound', quality: 'good', exam_datetime: '2026-10-20', summary: 'S.', findings: ['A', 'B'], urgent: false, diagnosis: 'MUST NOT PASS', patient_name: 'X' }), Date.parse('2026-10-21'))
    assert.deepEqual(iyi, { tur: 'ultrasound', kalite: 'iyi', sinavZamani: '2026-10-20', ozet: 'S.', bulgular: ['A', 'B'], acil: false })
    assert.equal(TL.belgeSonucunuOku('```json\n{"kind":"nonsense","quality":"fair","summary":"x","findings":"one"}\n```')?.tur, 'other')
    assert.equal(TL.belgeSonucunuOku('{"kind":"xray","quality":"poor","summary":"","findings":[]}')?.kalite, 'dusuk')
    for (const k of ['', 'not json', '[]', '{"kind":"xray"}', '{"kind":"xray","quality":"good","summary":"","findings":[]}', '{"quality":"excellent","summary":"x"}']) assert.equal(TL.belgeSonucunuOku(k), null, k)
  })

  it('the instruction: the note\'s language and spelling, the doctor\'s type, no identity, no diagnosis, no Turkish', () => {
    assert.match(TL.belgeTalimati('en-US', 'auto'), /American spelling/); assert.match(TL.belgeTalimati('en-GB', 'auto'), /British spelling/)
    assert.match(TL.belgeTalimati('en-CA', 'auto'), /Canadian/); assert.match(TL.belgeTalimati('en-AU', 'auto'), /Australian/); assert.match(TL.belgeTalimati('en-NZ', 'auto'), /New Zealand/)
    assert.match(TL.belgeTalimati('ru', 'auto'), /Russian/); assert.match(TL.belgeTalimati('uz-Latn', 'auto'), /Latin script/); assert.match(TL.belgeTalimati('uz-Cyrl', 'auto'), /Cyrillic script/)
    assert.match(TL.belgeTalimati('en-GB', 'ultrasound'), /clinician says this is an ultrasound/); assert.doesNotMatch(TL.belgeTalimati('en-GB', 'auto'), /clinician says/)
    for (const d of ['en-GB', 'ru', 'uz-Latn', 'uz-Cyrl']) {
      const t = TL.belgeTalimati(d, 'auto')
      assert.match(t, /Never write the patient's name/); assert.match(t, /Do NOT state a definitive diagnosis/)
      assert.doesNotMatch(t, /[çğıİşĞŞöüÖÜ]/, d)
      assert.doesNotMatch(t, /NHS|Medicare|Medicaid|OHIP|HIPAA|Türk|Turk/)
    }
    assert.equal(TL.belgeBaglami(5, 62, 'female'), 'Patient: age 5 years, female. Describe the attached document.')
    assert.equal(TL.belgeBaglami(0, 7, ''), 'Patient: age 7 months. Describe the attached document.')
    assert.equal(TL.belgeBaglami(null, null, ''), 'Describe the attached document.')
  })

  it('an image is recognised by its first bytes, not by what is claimed; age is computed', () => {
    assert.equal(D.gorselTuru(JPEG_B64), 'image/jpeg')
    assert.equal(D.gorselTuru(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]).toString('base64')), 'image/png')
    assert.equal(D.gorselTuru(Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBP')]).toString('base64')), 'image/webp')
    for (const x of [Buffer.from('%PDF-1.7 ...'), Buffer.from('<svg xmlns=...>'), Buffer.from('plain text')]) assert.equal(D.gorselTuru(x.toString('base64')), null)
    assert.deepEqual(D.yasHesapla('2021-03-07', new Date('2026-10-21T00:00:00Z')), { yil: 5, ay: 67 })
    assert.equal(D.yasHesapla('', new Date()), null); assert.equal(D.yasHesapla('2999-01-01', new Date()), null)
  })
})

describe('2. the engine files are reachable through the country gate, under the build\'s path prefix', () => {
  it('/tesseract/ and /pdfjs/ are open; the neighbours are not', async () => {
    const { rotaAcikMi } = await import('../rotaKapisi')
    if (paket.rotalar === 'hepsi') return
    for (const y of ['/tesseract/worker.min.js', '/tesseract/lang/eng.traineddata.gz', '/pdfjs/pdf.min.mjs', '/pdfjs/pdf.worker.min.mjs']) assert.equal(rotaAcikMi(paket.rotalar, y), true, y)
    for (const y of ['/tesseractx/a.js', '/pdfjsx/a.js', '/tesseract', '/pdfjs', '/api/ulkeler/x']) assert.equal(rotaAcikMi(paket.rotalar, y), false, y)
  })

  it('the OCR files are asked for under the path prefix of the build, and the prefix cannot be anything else', () => {
    ocrAyarla({ varlikOnEki: '/uzbek' })
    assert.deepEqual(tesseractVarliklari('https://notya.test'), { workerPath: 'https://notya.test/uzbek/tesseract/worker.min.js', corePath: 'https://notya.test/uzbek/tesseract', langPath: 'https://notya.test/uzbek/tesseract/lang', gzip: true })
    ocrAyarla({ varlikOnEki: '//evil.example' }); ocrAyarla({ varlikOnEki: 'https://evil.example' })
    assert.equal(tesseractVarliklari('https://notya.test').workerPath, 'https://notya.test/uzbek/tesseract/worker.min.js')
    ocrAyarla({ varlikOnEki: '' })
    assert.equal(tesseractVarliklari('https://notya.test').workerPath, 'https://notya.test/tesseract/worker.min.js')
  })
})

async function taslakNot() {
  tablo('ulke_notlar').push({ id: N1, ulke: BU, session_id: V1, doctor_id: DA, approved_at: null, content_subjektif: 's', content_objektif: 'Doctor wrote this.', content_degerlendirme: 'a', content_plan: 'p' })
  tablo('not_dil_kaydi').push({ ulke: BU, note_id: N1, doctor_id: DA, patient_id: H1, not_dili: DIL })
}

describe('3a. a pack that leaves image reading off: the routes answer not found and the model is never called', () => {
  it('belge-degerlendir, not (documents ignored) and not/belge', async () => {
    if (!AKTIF || GORUNTU) return
    const r = await cagir(rota.belge, 'POST', '/api/ulke/belge-degerlendir', 'jeton-a', { seansId: V1, tur: 'auto', base64: JPEG_B64 })
    assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }])
    await taslakNot()
    const b = await cagir(rota.notBelge, 'POST', '/api/ulke/not/belge', 'jeton-a', { notId: N1, ekler: [{ belgeId: B(1), tur: 'ultrasound', ozet: 'x', bulgular: ['y'] }] })
    assert.equal(b.status, 404)
    assert.equal(model.cagrilar.length, 0)
  })
})

describe('3. the reader\'s route (/api/ulke/belge-degerlendir)', () => {
  const YOL = '/api/ulke/belge-degerlendir'
  const CEVAP = { kind: 'ultrasound', quality: 'good', exam_datetime: '2026-10-20', summary: 'Single live intrauterine fetus.', findings: ['FHR 150 bpm', 'CRL 45 mm'], urgent: false }

  it('needs a signed-in doctor; a visit of another doctor is "not found" and the model is never called', async () => {
    if (!AKTIF || !GORUNTU) return
    assert.equal((await cagir(rota.belge, 'POST', YOL, undefined, { seansId: V1, tur: 'auto', base64: JPEG_B64 })).status, 401)
    const r = await cagir(rota.belge, 'POST', YOL, 'jeton-b', { seansId: V1, tur: 'auto', base64: JPEG_B64 })
    assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }])
    assert.equal(model.cagrilar.length, 0)
    assert.equal((await cagir(rota.belge, 'POST', YOL, 'jeton-a', { seansId: 'x', tur: 'auto', base64: JPEG_B64 })).status, 404)
  })

  it('refuses what is not a small masked picture, before anything is read: wrong type, not base64, a PDF in disguise, too large, unknown document type', async () => {
    if (!AKTIF || !GORUNTU) return
    const pdf = Buffer.from('%PDF-1.7 not a picture').toString('base64')
    for (const g of [{ base64: pdf }, { base64: '***' }, { base64: '' }, { base64: 'A'.repeat(E.EK_GORSEL_AZAMI_B64 + 4) }, { base64: JPEG_B64, tur: 'dicom' }, { base64: 5 }]) {
      const r = await cagir(rota.belge, 'POST', YOL, 'jeton-a', { seansId: V1, tur: 'auto', ...g })
      assert.deepEqual([r.status, r.govde], [400, { code: 'GECERSIZ' }], JSON.stringify(g).slice(0, 60))
    }
    assert.equal(model.cagrilar.length, 0)
  })

  it('what leaves for the model: the picture, age and sex, the note language\'s instruction — no name, no id, no transcript; nothing is stored', async () => {
    if (!AKTIF || !GORUNTU) return
    model.cevaplar = [CEVAP]
    const once = JSON.stringify(vt.tablolar)
    const r = await cagir(rota.belge, 'POST', YOL, 'jeton-a', { seansId: V1, tur: 'ultrasound', base64: JPEG_B64 })
    assert.equal(r.status, 200, JSON.stringify(r.govde))
    assert.deepEqual(r.govde.sonuc, { tur: 'ultrasound', kalite: 'iyi', sinavZamani: '2026-10-20', ozet: 'Single live intrauterine fetus.', bulgular: ['FHR 150 bpm', 'CRL 45 mm'], acil: false })
    assert.equal(model.cagrilar.length, 1)
    const c = model.cagrilar[0]
    assert.equal(c.gorselVar, true)
    assert.equal(c.sistem, TL.belgeTalimati(DIL, 'ultrasound'))
    assert.match(c.govde, /age 5 years, female/)
    for (const gizli of ['QA Patient One', 'QA Doctor', H1, DA, V1, 'Synthetic transcript']) assert.ok(!`${c.sistem}${c.govde}`.includes(gizli), `sent to the model: ${gizli}`)
    // Nothing was stored for the document (the usage count of the gateway aside).
    const sonra = vt.tablolar
    for (const ad of ['ulke_notlar', 'ulke_muayene_ekleri', 'not_dil_kaydi']) assert.equal((sonra[ad] ?? []).length, 0, ad)
    void once
  })

  it('the doctor\'s own type wins over the reader\'s; poor quality and an unusable answer are told apart by code', async () => {
    if (!AKTIF || !GORUNTU) return
    model.cevaplar = [{ ...CEVAP, kind: 'photo' }]
    assert.equal((await cagir(rota.belge, 'POST', YOL, 'jeton-a', { seansId: V1, tur: 'ultrasound', base64: JPEG_B64 })).govde.sonuc.tur, 'ultrasound')
    model.cevaplar = [{ ...CEVAP, kind: 'photo' }]
    assert.equal((await cagir(rota.belge, 'POST', YOL, 'jeton-a', { seansId: V1, tur: 'auto', base64: JPEG_B64 })).govde.sonuc.tur, 'photo')
    model.cevaplar = [{ kind: 'xray', quality: 'poor', summary: '', findings: [] }]
    assert.deepEqual((await cagir(rota.belge, 'POST', YOL, 'jeton-a', { seansId: V1, tur: 'auto', base64: JPEG_B64 })).govde, { code: 'DUSUK_KALITE' })
    model.cevaplar = ['I cannot help with that', 'I cannot help with that', 'I cannot help with that']
    const sessiz = console.error; console.error = () => undefined
    try { assert.deepEqual((await cagir(rota.belge, 'POST', YOL, 'jeton-a', { seansId: V1, tur: 'auto', base64: JPEG_B64 })).govde, { code: 'DEGERLENDIRILEMEDI' }) } finally { console.error = sessiz }
  })
})

describe('4. the first note takes every document in one write', () => {
  const NOT = { s: 'History.', o: 'Normal examination.\n\n— Belge değerlendirmesi () —\nYapay zekâ taslak rapor üretir. Tanı ve tedavi kararı hekime aittir.', a: 'Assessment.', p: 'Plan.' }
  const belge = (i: number, ozet = `Finding ${i}.`) => ({ belgeId: B(i), tur: 'ultrasound', sinavZamani: null, ozet, bulgular: [`FHR ${140 + i} bpm`], acil: false })

  it('four ultrasounds → "1/4 … 4/4" in the findings section, the model\'s banner removed, the doctor\'s text kept; asked again → the same note, nobody is called', async () => {
    if (!AKTIF || !GORUNTU) return
    model.cevaplar = [NOT]
    const r = await cagir(rota.not, 'POST', '/api/ulke/not', 'jeton-a', { seansId: V1, ekler: [1, 2, 3, 4].map((i) => belge(i)) })
    assert.equal(r.status, 200, JSON.stringify(r.govde))
    assert.equal(model.cagrilar.length, 1, 'ONE model call for the note: the documents are not read again here')
    assert.equal(tablo('ulke_notlar').length, 1, 'ONE write')
    const o = String(tablo('ulke_notlar')[0].content_objektif)
    const eti = E.ekTuruEtiketi(E.blokDili(DIL), 'ultrasound')
    for (let i = 1; i <= 4; i++) assert.ok(o.includes(`${eti} ${i}/4`), `${eti} ${i}/4 in: ${o}`)
    assert.ok(o.startsWith('Normal examination.')); assert.doesNotMatch(o, /Belge değerlendirmesi|Yapay zek/)
    assert.equal(tablo('ulke_notlar')[0].content_subjektif, 'History.')
    // Idempotent: the same request again changes nothing and calls nobody.
    const tekrar = await cagir(rota.not, 'POST', '/api/ulke/not', 'jeton-a', { seansId: V1, ekler: [1, 2, 3, 4].map((i) => belge(i)) })
    assert.deepEqual(tekrar.govde, r.govde); assert.equal(model.cagrilar.length, 1); assert.equal(tablo('ulke_notlar').length, 1)
    assert.equal(String(tablo('ulke_notlar')[0].content_objektif), o)
  })

  it('no documents → the note is exactly the model\'s (nothing is added, nothing is stripped); a request with only unusable entries is the same', async () => {
    if (!AKTIF || !GORUNTU) return
    model.cevaplar = [{ s: 'a', o: 'b', a: 'c', p: 'd' }]
    assert.equal((await cagir(rota.not, 'POST', '/api/ulke/not', 'jeton-a', { seansId: V1 })).status, 200)
    assert.equal(tablo('ulke_notlar')[0].content_objektif, 'b')
    for (const k of tablo('ulke_notlar')) delete (k as Record<string, unknown>).id
    tablo('ulke_notlar').length = 0; tablo('muayene_dil_kaydi'); tablo('not_dil_kaydi').length = 0
    model.cevaplar = [{ s: 'a', o: 'b', a: 'c', p: 'd' }]
    assert.equal((await cagir(rota.not, 'POST', '/api/ulke/not', 'jeton-a', { seansId: V1, ekler: [{ belgeId: 'bad' }, null] })).status, 200)
    assert.equal(tablo('ulke_notlar')[0].content_objektif, 'b')
  })
})

describe('5. documents added to a draft note', () => {
  async function taslak(onayli = false) {
    const { encrypt } = await import('@/lib/security/encryption')
    void encrypt
    tablo('ulke_notlar').push({ id: N1, ulke: BU, session_id: V1, doctor_id: DA, approved_at: onayli ? new Date().toISOString() : null, content_subjektif: 's', content_objektif: 'Doctor wrote this.', content_degerlendirme: 'a', content_plan: 'p' })
    tablo('not_dil_kaydi').push({ ulke: BU, note_id: N1, doctor_id: DA, patient_id: H1, not_dili: DIL })
  }
  const g = (...n: number[]) => n.map((i) => ({ belgeId: B(i), tur: 'ultrasound', ozet: `Finding ${i}.`, bulgular: [`FHR ${140 + i} bpm`] }))

  it('merged into the findings section in one write; the doctor\'s text untouched; the route returns the section as saved', async () => {
    if (!AKTIF || !GORUNTU) return
    await taslak()
    const r = await cagir(rota.notBelge, 'POST', '/api/ulke/not/belge', 'jeton-a', { notId: N1, ekler: g(1, 2) })
    assert.equal(r.status, 200, JSON.stringify(r.govde))
    const eti = E.ekTuruEtiketi(E.blokDili(DIL), 'ultrasound')
    const o = String(tablo('ulke_notlar')[0].content_objektif)
    assert.ok(o.startsWith('Doctor wrote this.')); assert.ok(o.includes(`${eti} 1/2`) && o.includes(`${eti} 2/2`))
    assert.equal(r.govde.o, o); assert.equal(r.govde.eklendi, 2)
    // The same documents again: nothing changes. A further one is appended; the earlier blocks keep their text.
    const ayni = await cagir(rota.notBelge, 'POST', '/api/ulke/not/belge', 'jeton-a', { notId: N1, ekler: g(1, 2) })
    assert.equal(ayni.govde.eklendi, 0); assert.equal(tablo('ulke_notlar')[0].content_objektif, o)
    await cagir(rota.notBelge, 'POST', '/api/ulke/not/belge', 'jeton-a', { notId: N1, ekler: g(3) })
    const o3 = String(tablo('ulke_notlar')[0].content_objektif)
    assert.ok(o3.startsWith(o) || o3.includes('Finding 3.')); assert.ok(o3.includes('Finding 1.') && o3.includes('Finding 3.'))
    // What the screen does with it: merged into the text still being edited.
    const ekranda = 'Doctor wrote this. AND MORE'
    assert.ok(bloklariAktar(o3, ekranda).startsWith(ekranda)); assert.ok(bloklariAktar(o3, ekranda).includes('Finding 3.'))
  })

  it('an approved note is not changed (409), another doctor\'s note is "not found" (404), nothing usable is "empty" (400)', async () => {
    if (!AKTIF || !GORUNTU) return
    await taslak(true)
    const onceki = JSON.stringify(tablo('ulke_notlar'))
    assert.deepEqual((await cagir(rota.notBelge, 'POST', '/api/ulke/not/belge', 'jeton-a', { notId: N1, ekler: g(1) })).govde, { code: 'ONAYLI' })
    assert.equal(JSON.stringify(tablo('ulke_notlar')), onceki)
    assert.deepEqual((await cagir(rota.notBelge, 'POST', '/api/ulke/not/belge', 'jeton-b', { notId: N1, ekler: g(1) })).govde, { code: 'NOT_FOUND' })
    tablo('ulke_notlar')[0].approved_at = null
    assert.deepEqual((await cagir(rota.notBelge, 'POST', '/api/ulke/not/belge', 'jeton-a', { notId: N1, ekler: [{ belgeId: 'bad' }] })).govde, { code: 'BOS' })
    assert.equal((await cagir(rota.notBelge, 'POST', '/api/ulke/not/belge', undefined, { notId: N1, ekler: g(1) })).status, 401)
    assert.equal(tablo('ulke_notlar')[0].content_objektif, 'Doctor wrote this.')
    void N
  })
})
