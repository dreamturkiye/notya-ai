/**
 * NOTYA-ULKE-ASISTAN-01 — THE ASSISTANT'S CONVERSATIONS (migration 143), for whatever pack is active. Runs ONCE PER PACK.
 *
 * TWO LAYERS.
 *   1. THE KIT'S RULES, with an assistant of NO COUNTRY (instruction parts, limits and the patient message are built
 *      here, in plain test words): the answer is streamed and kept with its question; the instruction is the
 *      assembled one and holds no doctor and no patient; the daily ceiling through the country's usage counter, on
 *      the ACCOUNT's day; a provider that fails before the first word and one that breaks off after it; the patient
 *      mode (own patient only, approved notes only, no name, no number); isolation in every direction; deleting.
 *      Runs for every pack that brings the signed-in application, two roles and an assistant's name for them.
 *   2. THE ROUTE, with THE PACK'S OWN assistant: a pack without it answers "not found" on every method; a pack with
 *      it is held to the same behaviour through the real handlers, the stream included.
 *
 * Real handlers, real library code and the REAL model gateway (lib/ai/cagir.ts) with the network replaced: the only
 * address that answers is the gateway's, by a stand-in inside this process that streams what a test tells it to.
 * NO PROVIDER IS CALLED AND NO KEY IS REAL. Synthetic data only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0143'
process.env.OPENROUTER_API_KEY = 'sahte-model-anahtari'
delete process.env.OPENROUTER_BASE_URL
// The server clock is NOT the country's: every day must come from the account's time zone.
process.env.TZ = 'America/Los_Angeles'

import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani, type Satir } from '@/lib/ulke/testing/sahteVeritabani'
import type { AsistanHastaVerisi, AsistanIcerigi, AsistanTalimatParcalari } from './tipler'

;(require as unknown as { extensions: Record<string, (m: { exports: unknown }) => void> }).extensions['.css'] = (m) => { m.exports = {} }

const vt = sahteVeritabani()
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: vt.createClient } })
  }
}

// ───────────────────────── the model's stand-in: a stream a test scripts ─────────────────────────

/** What the stand-in answers one call with: pieces of text (then an ordinary end, a cut, or a broken stream), or an HTTP error. */
type Plan = { parcalar: string[]; bitis?: 'stop' | 'length'; kop?: boolean } | number
type ModelCagrisi = { model: string; akis: boolean; sistem: { metin: string; onbellekli: boolean }[]; mesajlar: { role: string; metin: string }[]; veriToplama: unknown; ham: string }
const model = { cagrilar: [] as ModelCagrisi[], cevaplar: [] as Plan[] }
const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions'
globalThis.fetch = (async (g: unknown, o?: { body?: unknown }) => {
  const adres = String(g)
  if (adres !== OPENROUTER) throw new Error(`this test may not use the network: ${adres}`)
  const ham = String(o?.body)
  const b = JSON.parse(ham) as { model: string; stream?: boolean; messages: { role: string; content: unknown }[]; provider?: { data_collection?: unknown } }
  const metni = (c: unknown) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map((p: { text?: string }) => p.text ?? '').join('\n') : JSON.stringify(c))
  const sistem = b.messages.filter((m) => m.role === 'system').flatMap((m) => (Array.isArray(m.content) ? (m.content as { text?: string; cache_control?: unknown }[]).map((p) => ({ metin: p.text ?? '', onbellekli: Boolean(p.cache_control) })) : [{ metin: String(m.content), onbellekli: false }]))
  model.cagrilar.push({ model: b.model, akis: b.stream === true, sistem, mesajlar: b.messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, metin: metni(m.content) })), veriToplama: b.provider?.data_collection, ham })
  const c = model.cevaplar.shift()
  if (c === undefined) throw new Error('the model was called more often than the test allows')
  // A provider error that quotes a patient: it must not travel past the server.
  if (typeof c === 'number') return new Response(JSON.stringify({ error: { code: c, message: 'QA-PROVIDER-ERROR about QA-SECRET-PATIENT' } }), { status: c })
  const kodla = new TextEncoder()
  const olay = (x: unknown) => kodla.encode(`data: ${JSON.stringify(x)}\n\n`)
  let i = 0
  const govde = new ReadableStream<Uint8Array>({
    pull(d) {
      if (i < c.parcalar.length) { d.enqueue(olay({ id: 'sahte-1', model: b.model, choices: [{ delta: { content: c.parcalar[i++] } }] })); return }
      if (c.kop) { d.error(new Error('QA-STREAM-BROKE')); return }
      d.enqueue(olay({ choices: [{ delta: {}, finish_reason: c.bitis ?? 'stop' }], usage: { prompt_tokens: 700, completion_tokens: 90 } }))
      d.enqueue(kodla.encode('data: [DONE]\n\n'))
      d.close()
    },
  })
  return new Response(govde, { status: 200, headers: { 'content-type': 'text/event-stream' } })
}) as typeof fetch

// ───────────────────────── fixtures ─────────────────────────

type Mod = Record<string, (req: unknown) => Promise<Response>>
type Paket = import('../tipler').UlkePaketi
type Sb = import('@supabase/supabase-js').SupabaseClient
let paket: Paket
let BU = ''
let DIL = ''
/** The kit's rules can run: the pack brings the signed-in application, two roles and an assistant's name for both. */
let KIT = false
/** The pack switches the assistant on: its route exists. */
let ROTA = false
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let sifreCoz: (s: string) => string
let K: typeof import('./konusma')
let T: typeof import('./talimat')
let A: typeof import('../arayuz')
let devreSifirla: () => void
let rota: Mod
let ROLLER: readonly string[] = []
let SENTETIK: AsistanIcerigi
let GUN = ''

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001' // patient of doctor A
const H2 = '30000000-0000-4000-8000-000000000002' // second patient of doctor A
const H3 = '30000000-0000-4000-8000-000000000003' // patient of doctor B
const YOK = '77777777-7777-4777-8777-777777777777'
const AD: Record<string, string> = { [H1]: 'QA-NAME-ONE', [H2]: 'QA-NAME-TWO', [H3]: 'QA-NAME-THREE' }
const TELEFON = '+00 000 QA-PHONE'
const KIMLIK = 'QA-IDENTITY-0001'
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()
const GUN_MS = 86_400_000

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const konusmalar = () => tablo('ulke_asistan_konusmalari')
const mesajlar = () => tablo('ulke_asistan_mesajlari')
const simdiIso = () => new Date().toISOString()

/** The instruction parts of no country: one plain marker per part, with the kit's placeholders. */
const PARCALAR: AsistanTalimatParcalari = {
  kimlik: 'QA-PERSONA name=%1 role=%2 years=%3', kapsam: 'QA-SCOPE role=%', dil: 'QA-LANGUAGE', kaynakGiris: 'QA-SOURCES-BEGIN', kaynakSatiri: 'QA-SOURCE %', kaynakSon: 'QA-SOURCES-END', kaynakYok: 'QA-NO-REFERENCE-WORK',
  durustluk: 'QA-HONESTY', guvenlik: 'QA-SAFETY', bicim: 'QA-FORM', hasta: 'QA-PATIENT-FOLLOWS', hastaYok: 'QA-NO-PATIENT-GIVEN',
}
const hastaGirdisi = (_dil: string, v: AsistanHastaVerisi) => `QA-PATIENT-DATA ${JSON.stringify(v)}`
function sentetik(ek: Partial<AsistanIcerigi> = {}): AsistanIcerigi {
  return {
    inceleme: { makineYazimi: true, klinisyen: null }, kidemYili: 7, gunlukSoruLimiti: 50, soruAzamiKarakter: 500,
    parcalar: (rol) => (ROLLER.includes(rol) ? PARCALAR : null),
    kaynaklar: { ortak: [], roller: Object.fromEntries(ROLLER.map((r) => [r, []])) },
    hastaModu: { acik: true, notSayisi: 2, notAzamiKarakter: 400 },
    hastaGirdisi,
    ses: { giris: { acik: false, azamiBayt: 1, gunlukLimit: 1 }, cikis: { acik: false, saglayici: 'elevenlabs-diyalog-ws', model: 'qa', modelDogrulama: null, cikisBicimi: 'qa', dilKodlari: {}, sesler: { varsayilan: null, roller: {} }, azamiKarakter: 1, gunlukLimit: 1 } },
    ...ek,
  }
}

function hastaEkle(id: string, doktor: string, ulke = BU) {
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: AD[id] ?? 'QA-NAME-FOREIGN' })), dob_encrypted: sifrele('1990-05-05'), gender_encrypted: sifrele('female'), phone_encrypted: sifrele(TELEFON), is_active: true, created_at: simdiIso() })
  tablo('hasta_ulke_bilgisi').push({ patient_id: id, ulke, doctor_id: doktor, dil: paket.uygulama?.hastaDilleri[0] ?? '', ota_ismi_encrypted: sifrele('QA-SECOND-NAME'), ulusal_kimlik_encrypted: sifrele(KIMLIK) })
}
const rolYaz = (doktor: string, rol: string | null) => {
  vt.tablolar.hekim_rolu = tablo('hekim_rolu').filter((x) => x.doctor_id !== doktor)
  if (rol) tablo('hekim_rolu').push({ ulke: BU, doctor_id: doktor, rol })
}
let notSayaci = 0
/** A visit of `hasta` with `doktor` and its note: approved (`onayAni`) or still a draft (null). */
function notEkle(doktor: string, hasta: string, isaret: string, onayAni: string | null, ulke = BU, bolum: Partial<Record<'s' | 'o' | 'a' | 'p', string>> = {}) {
  const n = String(++notSayaci).padStart(12, '0')
  const seans = `40000000-0000-4000-8000-${n}`, not = `50000000-0000-4000-8000-${n}`
  tablo('ulke_muayeneler').push({ id: seans, ulke, doctor_id: doktor, patient_id: hasta, started_at: '2026-10-01T05:00:00.000Z', created_at: '2026-10-01T05:00:00.000Z', specialty: paket.uygulama?.roller?.[0] ?? 'genel', transcript_cleaned: `QA-TRANSCRIPT-${isaret}` })
  tablo('ulke_notlar').push({ id: not, ulke, session_id: seans, doctor_id: doktor, approved_at: onayAni, content_subjektif: bolum.s ?? `QA-NOTE-S-${isaret}`, content_objektif: bolum.o ?? `QA-NOTE-O-${isaret}`, content_degerlendirme: bolum.a ?? `QA-NOTE-A-${isaret}`, content_plan: bolum.p ?? `QA-NOTE-P-${isaret}`, created_at: '2026-10-01T05:10:00.000Z' })
  tablo('not_dil_kaydi').push({ note_id: not, ulke, doctor_id: doktor, patient_id: hasta, not_dili: DIL, ikinci_dil: null, ikinci_s: `QA-SECOND-DRAFT-${isaret}`, ikinci_o: null, ikinci_a: null, ikinci_p: null, alanlar: null, ikinci_alanlar: null })
  return not
}
function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  model.cagrilar = []; model.cevaplar = []
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: DA, email: 'qa-a@notya.test', app_metadata: { country: BU } },
    'jeton-b': { id: DB, email: 'qa-b@notya.test', app_metadata: { country: BU } },
  })
  tablo('ulke_hesaplari').push({ id: DA, full_name: 'QA-DOCTOR-A', ulke: BU, ui_language: DIL }, { id: DB, full_name: 'QA-DOCTOR-B', ulke: BU, ui_language: DIL })
  tablo('hekim_dil_tercihleri').push({ ulke: BU, doctor_id: DA, not_dili: DIL, soruldu_at: 'x' }, { ulke: BU, doctor_id: DB, not_dili: DIL, soruldu_at: 'x' })
  if (ROLLER[0]) { rolYaz(DA, ROLLER[0]); rolYaz(DB, ROLLER[0]) }
  hastaEkle(H1, DA); hastaEkle(H2, DA); hastaEkle(H3, DB)
}

type Sonuc = import('./konusma').SoruSonucu
/** One question through the library. `parcalar` is what the caller was handed while the answer was written. */
async function sor(doktor: string, g: { soru?: unknown; konusmaId?: string | null; hastaId?: string | null }, icerik: AsistanIcerigi = SENTETIK): Promise<{ r: Sonuc; parcalar: string[] }> {
  const parcalar: string[] = []
  const r = await K.soruSor(sb(), doktor, { soru: 'soru' in g ? g.soru : 'QA-QUESTION', konusmaId: g.konusmaId, hastaId: g.hastaId }, (p) => parcalar.push(p), icerik)
  return { r, parcalar }
}
const cevapla = (...parcalar: string[]) => { model.cevaplar.push({ parcalar: parcalar.length ? parcalar : ['QA-ANSWER'] }) }
async function tamam(doktor: string, g: Parameters<typeof sor>[1] = {}, icerik?: AsistanIcerigi): Promise<string> {
  cevapla()
  const { r } = await sor(doktor, g, icerik)
  assert.equal(r.tamam, true, JSON.stringify(r))
  const id = (r as { konusmaId: string | null }).konusmaId
  assert.ok(id, 'the conversation was not kept')
  return id as string
}
const sessiz = async <X>(is: () => Promise<X>): Promise<{ sonuc: X; gunluk: string }> => {
  const satirlar: string[] = []
  const e = console.error, w = console.warn, l = console.log
  console.error = console.warn = console.log = (...a: unknown[]) => { satirlar.push(a.map(String).join(' ')) }
  try { return { sonuc: await is(), gunluk: satirlar.join('\n') } } finally { console.error = e; console.warn = w; console.log = l }
}
const zarf = (s: Satir, kolon: string) => JSON.parse(sifreCoz(String(s[kolon]))) as Record<string, unknown>

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  ROLLER = paket.uygulama?.roller ?? []
  DIL = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  NextRequest = (await import('next/server')).NextRequest
  const sifre = await import('@/lib/security/encryption')
  sifrele = sifre.encrypt; sifreCoz = sifre.decrypt
  K = await import('./konusma')
  T = await import('./talimat')
  devreSifirla = (await import('@/lib/ai/devre')).devreSifirla
  ;(await import('@/lib/ai/cagir')).TASIMA_BEKLEME.ms = 1 // the gateway's pause between two attempts; shortened as its own tests do
  ROTA = Boolean(K.aktifAsistan())
  rota = (await import('../../../app/api/ulke/asistan/route.ulke')) as unknown as Mod
  const arayuzVar = Boolean((await import('@/countries/active/arayuz')).AKTIF_ARAYUZ)
  if (arayuzVar) A = await import('../arayuz')
  KIT = paket.ozellikler.cekirdekMuayene === true && ROLLER.length >= 2 && arayuzVar && Boolean(A.asistanKimligi(ROLLER[0], DIL) && A.asistanKimligi(ROLLER[1], DIL))
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
  GUN = new Intl.DateTimeFormat('en-CA', { timeZone: paket.saatDilimi, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(BASLANGIC_ANI))
  SENTETIK = sentetik()
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); devreSifirla(); if (paket.ozellikler.cekirdekMuayene) sifirla() })

// ═════════════════════════ 1. the kit's rules, with an assistant of no country ═════════════════════════

describe('assistant — a question and its answer', () => {
  it('the kit\'s rules run for every pack that brings the application, two roles and their assistants — they are not skipped by accident', () => {
    const beklenen = paket.ozellikler.cekirdekMuayene === true && ROLLER.length >= 2
    assert.equal(KIT, beklenen, 'a pack with the application and roles must name an assistant for its first two roles, or these tests prove nothing')
    // Where the pack switches the assistant on, its route is live and the route tests below run.
    assert.equal(ROTA, paket.ozellikler.ulkeAsistani === true && paket.ozellikler.cekirdekMuayene === true && Boolean(paket.ozellikler.ulkeAsistani))
  })

  it('the answer arrives piece by piece, in order, and is kept with its question: one conversation, two messages, every text ONE encrypted value', async () => {
    if (!KIT) return
    cevapla('QA-ANSWER-PART-1 ', 'QA-ANSWER-PART-2')
    const { r, parcalar } = await sor(DA, { soru: '  QA-QUESTION-ONE about something  ' })
    assert.deepEqual(parcalar, ['QA-ANSWER-PART-1 ', 'QA-ANSWER-PART-2'])
    assert.deepEqual({ ...r, konusmaId: 'x' }, { tamam: true, konusmaId: 'x', yeniKonusma: true, kesildi: false, kaydedildi: true })
    const [k] = konusmalar()
    assert.equal(konusmalar().length, 1)
    assert.deepEqual([k.ulke, k.doctor_id, k.patient_id, k.rol], [BU, DA, null, ROLLER[0]])
    assert.deepEqual(Object.keys(k).sort(), ['baslik_encrypted', 'created_at', 'doctor_id', 'id', 'patient_id', 'rol', 'ulke', 'updated_at'])
    const m = mesajlar()
    assert.deepEqual(m.map((x) => [x.ulke, x.doctor_id, x.konusma_id, x.yazan]), [[BU, DA, k.id, 'hekim'], [BU, DA, k.id, 'asistan']])
    // NO AUDIO and nothing else beside the text: the columns of migration 143, exactly.
    for (const x of m) assert.deepEqual(Object.keys(x).sort(), ['created_at', 'doctor_id', 'id', 'konusma_id', 'metin_encrypted', 'ulke', 'yazan'])
    assert.ok(String(m[0].created_at) < String(m[1].created_at), 'the answer must read back after its question')
    for (const acik of [String(k.baslik_encrypted), ...m.map((x) => String(x.metin_encrypted))]) for (const iz of ['QA-QUESTION', 'QA-ANSWER']) assert.ok(!acik.includes(iz), `a stored value shows "${iz}" in clear text`)
    assert.deepEqual(zarf(k, 'baslik_encrypted'), { v: 1, u: BU, d: DA, t: 'QA-QUESTION-ONE about something' })
    assert.deepEqual(zarf(m[0], 'metin_encrypted'), { v: 1, u: BU, d: DA, k: k.id, y: 'hekim', m: 'QA-QUESTION-ONE about something' })
    assert.deepEqual(zarf(m[1], 'metin_encrypted'), { v: 1, u: BU, d: DA, k: k.id, y: 'asistan', m: 'QA-ANSWER-PART-1 QA-ANSWER-PART-2' })
  })

  it('THE INSTRUCTION is the assembled one for the account\'s role and form — cached, with no doctor and no patient in it — and the second block says that no patient was given', async () => {
    if (!KIT) return
    await tamam(DA, { soru: 'QA-QUESTION-GENERAL' })
    assert.equal(model.cagrilar.length, 1)
    const c = model.cagrilar[0]
    const kimlik = A.asistanKimligi(ROLLER[0], DIL)!
    const beklenen = T.asistanTalimati(SENTETIK, ROLLER[0], DIL as never, { tamAd: kimlik.tamAd, rolAdi: A.rolAdi(ROLLER[0], DIL)! })
    assert.ok(beklenen && beklenen.includes(`name=${kimlik.tamAd}`) && beklenen.includes('years=7') && beklenen.includes('QA-NO-REFERENCE-WORK'))
    assert.deepEqual(c.sistem, [{ metin: beklenen, onbellekli: true }, { metin: 'QA-NO-PATIENT-GIVEN', onbellekli: false }])
    assert.deepEqual(c.mesajlar, [{ role: 'user', metin: 'QA-QUESTION-GENERAL' }])
    assert.equal(c.akis, true, 'the answer must be asked for as a stream')
    assert.equal(c.veriToplama, 'deny')
    for (const iz of ['QA-DOCTOR-A', DA, 'QA-NAME', 'QA-PATIENT-DATA', TELEFON, KIMLIK]) assert.ok(!c.ham.includes(iz), `the request to the model carries "${iz}"`)
  })

  it('a conversation is continued with its latest pairs, oldest first — and never with more than the kit\'s number of messages', async () => {
    if (!KIT) return
    const id = await tamam(DA, { soru: 'QA-Q-1' })
    for (let i = 2; i <= 8; i++) { mock.timers.tick(60_000); model.cevaplar.push({ parcalar: [`QA-A-${i}`] }); const { r } = await sor(DA, { soru: `QA-Q-${i}`, konusmaId: id }); assert.equal(r.tamam && r.yeniKonusma, false) }
    assert.equal(konusmalar().length, 1)
    assert.equal(mesajlar().length, 16)
    const son = model.cagrilar[model.cagrilar.length - 1].mesajlar
    assert.equal(son.length, K.GECMIS_MESAJ + 1)
    assert.deepEqual(son.map((m) => m.role), [...Array.from({ length: K.GECMIS_MESAJ }, (_, i) => (i % 2 ? 'assistant' : 'user')), 'user'])
    assert.deepEqual([son[0].metin, son[1].metin, son[K.GECMIS_MESAJ].metin], ['QA-Q-2', 'QA-A-2', 'QA-Q-8'])
    assert.ok(String(konusmalar()[0].updated_at) > String(konusmalar()[0].created_at), 'a continued conversation moves up in the history')
    const d = await K.konusmaGetir(sb(), DA, id)
    assert.deepEqual(d!.mesajlar.map((m) => m.metin).slice(0, 4), ['QA-Q-1', 'QA-ANSWER', 'QA-Q-2', 'QA-A-2'])
    assert.equal(d!.surdurulebilir, true)
  })

  it('what refuses a question refuses it BEFORE the model is called: no question, one that is too long, no role, a role without an assistant, a full conversation', async () => {
    if (!KIT) return
    for (const soru of ['', '   ', null, 7, undefined]) assert.deepEqual((await sor(DA, { soru })).r, { tamam: false, kod: 'BOS' })
    assert.deepEqual((await sor(DA, { soru: 'x'.repeat(501) })).r, { tamam: false, kod: 'UZUN' })
    rolYaz(DA, null)
    assert.deepEqual((await sor(DA, {})).r, { tamam: false, kod: 'ASISTAN_YOK' })
    rolYaz(DA, ROLLER[0])
    // A pack that has no parts for the role, and one that does not list the role among its sources: no assistant.
    assert.deepEqual((await sor(DA, {}, sentetik({ parcalar: () => null }))).r, { tamam: false, kod: 'ASISTAN_YOK' })
    assert.deepEqual((await sor(DA, {}, sentetik({ kaynaklar: { ortak: [], roller: {} } }))).r, { tamam: false, kod: 'ASISTAN_YOK' })
    assert.deepEqual((await sor(DA, {}, sentetik({ parcalar: () => ({ ...PARCALAR, guvenlik: ' ' }) }))).r, { tamam: false, kod: 'ASISTAN_YOK' })
    const id = await tamam(DA)
    const k = konusmalar()[0]
    for (let i = 0; i < K.KONUSMA_AZAMI_MESAJ - 2; i++) mesajlar().push({ id: `60000000-0000-4000-8000-${String(i).padStart(12, '0')}`, ulke: BU, doctor_id: DA, konusma_id: k.id, yazan: i % 2 ? 'asistan' : 'hekim', metin_encrypted: 'x', created_at: simdiIso() })
    model.cagrilar = []
    assert.deepEqual((await sor(DA, { konusmaId: id })).r, { tamam: false, kod: 'KONUSMA_DOLU' })
    assert.equal(model.cagrilar.length, 0, 'a refused question must not reach the model')
    assert.equal(tablo('ulke_kullanim').reduce((t, x) => t + Number(x.sayac), 0), 1, 'a refused question must not be counted')
  })

  it('a conversation is continued only with the role it began with; with another role it is read, not continued', async () => {
    if (!KIT) return
    const id = await tamam(DA)
    rolYaz(DA, ROLLER[1])
    model.cagrilar = []
    assert.deepEqual((await sor(DA, { konusmaId: id })).r, { tamam: false, kod: 'ROL_DEGISTI' })
    assert.equal(model.cagrilar.length, 0)
    const d = await K.konusmaGetir(sb(), DA, id)
    assert.deepEqual([d!.rol, d!.surdurulebilir, d!.mesajlar.length], [ROLLER[0], false, 2])
    // A new conversation is held with the new role's assistant, under that role's own name.
    await tamam(DA)
    assert.equal(konusmalar().find((x) => x.id !== id)!.rol, ROLLER[1])
    assert.ok(model.cagrilar[0].sistem[0].metin.includes(`name=${A.asistanKimligi(ROLLER[1], DIL)!.tamAd}`))
    assert.ok(!model.cagrilar[0].sistem[0].metin.includes(`name=${A.asistanKimligi(ROLLER[0], DIL)!.tamAd} `))
  })
})

describe('assistant — the daily ceiling', () => {
  it('the pack\'s limit, per account, through the country\'s usage counter: the question after the last one is refused and never reaches the model', async () => {
    if (!KIT) return
    const iki = sentetik({ gunlukSoruLimiti: 2 })
    await tamam(DA, {}, iki); await tamam(DA, {}, iki)
    model.cagrilar = []
    assert.deepEqual((await sor(DA, {}, iki)).r, { tamam: false, kod: 'LIMIT' })
    assert.equal(model.cagrilar.length, 0)
    assert.deepEqual(tablo('ulke_kullanim'), [{ ulke: BU, doctor_id: DA, gun: GUN, kova: 'asistan', sayac: 2, created_at: tablo('ulke_kullanim')[0].created_at }])
    assert.deepEqual(await K.asistanDurumu(sb(), DA, iki), { asistanVar: true, limit: 2, kalan: 0, soruAzami: 500, hastaModu: true })
    // Another account has its own count.
    await tamam(DB, {}, iki)
    assert.equal((await K.asistanDurumu(sb(), DB, iki)).kalan, 1)
    assert.equal(konusmalar().length, 3)
  })

  it('the day is the ACCOUNT\'s own, not the server\'s: the count starts again when that day changes', async () => {
    if (!KIT) return
    const bir = sentetik({ gunlukSoruLimiti: 1 })
    await tamam(DA, {}, bir)
    assert.equal((await sor(DA, {}, bir)).r.tamam, false)
    mock.timers.setTime(BASLANGIC_ANI + GUN_MS)
    await tamam(DA, {}, bir)
    assert.deepEqual(tablo('ulke_kullanim').map((x) => [x.gun, x.kova, x.sayac]).sort(), [[GUN, 'asistan', 1], [new Intl.DateTimeFormat('en-CA', { timeZone: paket.saatDilimi, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(BASLANGIC_ANI + GUN_MS)), 'asistan', 1]].sort())
  })

  it('a visit\'s ceiling and the assistant\'s are two counts of the same counter; a pack that states no limit allows nothing; a counter that cannot be read stops nobody', async () => {
    if (!KIT) return
    tablo('ulke_kullanim').push({ ulke: BU, doctor_id: DA, gun: GUN, kova: 'soap', sayac: 999 })
    await tamam(DA)
    assert.deepEqual(tablo('ulke_kullanim').map((x) => [x.kova, x.sayac]).sort(), [['asistan', 1], ['soap', 999]])
    for (const limit of [0, -1, 1.5, Number.NaN]) assert.deepEqual((await sor(DA, {}, sentetik({ gunlukSoruLimiti: limit }))).r, { tamam: false, kod: 'LIMIT' })
    vt.boz.oku.add('ulke_kullanim'); vt.boz.yaz.add('ulke_kullanim')
    await tamam(DA)
    assert.equal((await K.asistanDurumu(sb(), DA, SENTETIK)).kalan, null)
  })

  it('an answer is measured as usage of the account, on its own day: how many, and the tokens the provider reported — never a word of it', async () => {
    if (!KIT) return
    await tamam(DA, { soru: 'QA-QUESTION-MEASURED' })
    assert.deepEqual(tablo('ulke_kullanim_olcumu'), [{ ulke: BU, doctor_id: DA, gun: GUN, gorev: 'asistan', adet: 1, saniye: 0, giris_token: 700, cikis_token: 90 }])
  })
})

describe('assistant — when the provider fails', () => {
  it('BEFORE the first word: the gateway tries again and falls to its guard; when that fails too there is no answer, nothing is kept and nothing of the provider\'s text is logged', async () => {
    if (!KIT) return
    model.cevaplar.push(503, 503, 503)
    const { sonuc, gunluk } = await sessiz(() => sor(DA, { soru: 'QA-QUESTION about QA-SECRET-PATIENT' }))
    assert.deepEqual(sonuc.r, { tamam: false, kod: 'CEVAP_YOK' })
    assert.deepEqual(sonuc.parcalar, [])
    assert.equal(model.cagrilar.length, 3, 'primary, primary once more, guard')
    assert.deepEqual([konusmalar().length, mesajlar().length], [0, 0])
    for (const iz of ['QA-PROVIDER-ERROR', 'QA-SECRET-PATIENT', 'QA-QUESTION']) assert.ok(!gunluk.includes(iz), `the log carries "${iz}"`)
    assert.match(gunluk, /\[ulke\/asistan\] sohbet-uzman: gateway 503/)
    // The question was sent, so it was counted.
    assert.equal(tablo('ulke_kullanim')[0].sayac, 1)
  })

  it('BEFORE the first word, once: the second attempt answers and the doctor sees one answer, not two', async () => {
    if (!KIT) return
    model.cevaplar.push(503, { parcalar: ['QA-ANSWER-AFTER-RETRY'] })
    const { sonuc } = await sessiz(() => sor(DA, {}))
    assert.deepEqual(sonuc.parcalar, ['QA-ANSWER-AFTER-RETRY'])
    assert.equal(sonuc.r.tamam, true)
    assert.equal(mesajlar().length, 2)
  })

  it('a request the provider refuses outright is not tried again: no answer, nothing kept', async () => {
    if (!KIT) return
    model.cevaplar.push(400)
    const { sonuc } = await sessiz(() => sor(DA, {}))
    assert.deepEqual(sonuc.r, { tamam: false, kod: 'CEVAP_YOK' })
    assert.equal(model.cagrilar.length, 1)
    assert.equal(mesajlar().length, 0)
  })

  it('AFTER the first word: what was shown is never taken back or said twice — the answer is kept as far as it got, marked as cut', async () => {
    if (!KIT) return
    model.cevaplar.push({ parcalar: ['QA-HALF-', 'ANSWER'], kop: true })
    const { sonuc } = await sessiz(() => sor(DA, {}))
    assert.deepEqual(sonuc.parcalar, ['QA-HALF-', 'ANSWER'])
    assert.deepEqual({ ...sonuc.r, konusmaId: 'x' }, { tamam: true, konusmaId: 'x', yeniKonusma: true, kesildi: true, kaydedildi: true })
    assert.equal(model.cagrilar.length, 1, 'a stream that broke after it began is not asked for again')
    assert.deepEqual(zarf(mesajlar()[1], 'metin_encrypted'), { v: 1, u: BU, d: DA, k: konusmalar()[0].id, y: 'asistan', m: 'QA-HALF-ANSWER', kesik: true })
    const d = await K.konusmaGetir(sb(), DA, String(konusmalar()[0].id))
    assert.deepEqual(d!.mesajlar.map((m) => [m.yazan, m.metin, m.kesik]), [['hekim', 'QA-QUESTION', false], ['asistan', 'QA-HALF-ANSWER', true]])
  })

  it('an answer that reaches its ceiling is marked as cut as well; an empty answer is no answer', async () => {
    if (!KIT) return
    model.cevaplar.push({ parcalar: ['QA-LONG-ANSWER'], bitis: 'length' })
    assert.equal(((await sor(DA, {})).r as { kesildi: boolean }).kesildi, true)
    // Nothing said by the primary model → the gateway asks its guard, which says nothing either.
    model.cevaplar.push({ parcalar: [] }, { parcalar: [] })
    const { sonuc } = await sessiz(() => sor(DA, {}))
    assert.deepEqual(sonuc.r, { tamam: false, kod: 'CEVAP_YOK' })
  })

  it('an answer that cannot be KEPT was still given: the doctor has it, is told it was not kept, and no half pair stays behind', async () => {
    if (!KIT) return
    vt.boz.yaz.add('ulke_asistan_mesajlari')
    cevapla('QA-ANSWER-NOT-KEPT')
    const { r, parcalar } = await sor(DA, {})
    assert.deepEqual(parcalar, ['QA-ANSWER-NOT-KEPT'])
    assert.deepEqual(r, { tamam: true, konusmaId: null, yeniKonusma: true, kesildi: false, kaydedildi: false })
    assert.deepEqual([konusmalar().length, mesajlar().length], [0, 0])
    vt.boz.yaz.clear(); vt.boz.yaz.add('ulke_asistan_konusmalari')
    cevapla()
    assert.deepEqual((await sor(DA, {})).r, { tamam: true, konusmaId: null, yeniKonusma: true, kesildi: false, kaydedildi: false })
    assert.deepEqual([konusmalar().length, mesajlar().length], [0, 0])
  })
})

describe('assistant — the patient mode', () => {
  it('ONE patient of the doctor: age and sex and the latest APPROVED notes travel in the second block — never a name, a phone number, an identity number or an id', async () => {
    if (!KIT) return
    notEkle(DA, H1, 'OLD', '2026-10-02T06:00:00.000Z')
    notEkle(DA, H1, 'MID', '2026-10-03T06:00:00.000Z')
    notEkle(DA, H1, 'NEW', '2026-10-04T06:00:00.000Z')
    const id = await tamam(DA, { soru: 'QA-QUESTION-ABOUT-PATIENT', hastaId: H1 })
    assert.deepEqual([konusmalar()[0].patient_id, konusmalar()[0].doctor_id], [H1, DA])
    const c = model.cagrilar[0]
    assert.equal(c.sistem.length, 2)
    assert.equal(c.sistem[0].onbellekli, true)
    assert.ok(!c.sistem[0].metin.includes('QA-PATIENT-DATA') && !c.sistem[0].metin.includes('QA-NOTE'), 'the cached block must hold nothing of a patient')
    const ikinci = c.sistem[1]
    assert.equal(ikinci.onbellekli, false)
    assert.ok(ikinci.metin.startsWith('QA-PATIENT-FOLLOWS\n\nQA-PATIENT-DATA '))
    const veri = JSON.parse(ikinci.metin.slice('QA-PATIENT-FOLLOWS\n\nQA-PATIENT-DATA '.length)) as AsistanHastaVerisi
    assert.deepEqual([veri.dogumTarihi, veri.cinsiyet, veri.bugun], ['1990-05-05', 'female', GUN])
    // The pack's number of notes (2), latest approval first; the third is not sent.
    assert.deepEqual(veri.notlar.map((n) => n.icerik.s), ['QA-NOTE-S-NEW', 'QA-NOTE-S-MID'])
    assert.deepEqual(Object.keys(veri).sort(), ['bugun', 'cinsiyet', 'dogumTarihi', 'notlar'])
    for (const n of veri.notlar) assert.deepEqual(Object.keys(n).sort(), ['icerik', 'tarih'])
    for (const iz of [AD[H1], 'QA-SECOND-NAME', TELEFON, KIMLIK, H1, DA, 'QA-TRANSCRIPT', 'QA-SECOND-DRAFT', 'QA-NOTE-S-OLD', 'QA-DOCTOR-A']) assert.ok(!c.ham.includes(iz), `the request to the model carries "${iz}"`)
    // The patient's data is not kept with the conversation: only the question and the answer are.
    assert.deepEqual(mesajlar().map((m) => zarf(m, 'metin_encrypted').m), ['QA-QUESTION-ABOUT-PATIENT', 'QA-ANSWER'])
    // Continued: the patient's data is read again, for the same patient, whatever the request says.
    notEkle(DA, H1, 'NEWEST', '2026-10-05T06:00:00.000Z')
    mock.timers.tick(1000)
    cevapla()
    assert.equal((await sor(DA, { konusmaId: id })).r.tamam, true)
    assert.ok(model.cagrilar[1].sistem[1].metin.includes('QA-NOTE-S-NEWEST'))
    assert.deepEqual((await sor(DA, { konusmaId: id, hastaId: H2 })).r, { tamam: false, kod: 'NOT_FOUND' })
  })

  it('APPROVED NOTES ONLY: a draft is never sent — not its text, not its second draft; a patient without an approved note is sent with none', async () => {
    if (!KIT) return
    notEkle(DA, H1, 'DRAFT', null)
    await tamam(DA, { hastaId: H1 })
    assert.ok(!model.cagrilar[0].ham.includes('QA-NOTE-S-DRAFT') && !model.cagrilar[0].ham.includes('DRAFT'))
    assert.deepEqual((JSON.parse(model.cagrilar[0].sistem[1].metin.split('QA-PATIENT-DATA ')[1]) as AsistanHastaVerisi).notlar, [])
    // The statement that reads the notes asks for approved ones, by this doctor, of this patient's visits.
    const okuma = vt.sorgular.filter((q) => q.tablo === 'ulke_notlar' && q.islem === 'select' && q.filtreler.some((f) => f.startsWith('session_id=in.')))
    assert.ok(okuma.length >= 1)
    for (const q of okuma) assert.ok(q.filtreler.includes(`doctor_id=eq.${DA}`) && q.filtreler.includes('approved_at=not.is.null') && q.ulke === BU, q.filtreler.join(' '))
    for (const q of vt.sorgular.filter((x) => x.tablo === 'ulke_muayeneler' && x.islem === 'select')) assert.ok(q.filtreler.includes(`doctor_id=eq.${DA}`), q.filtreler.join(' '))
  })

  it('ONLY THAT PATIENT: an approved note of the doctor\'s OTHER patient, of another doctor\'s patient and of another country is not sent', async () => {
    if (!KIT) return
    notEkle(DA, H1, 'MINE', '2026-10-04T06:00:00.000Z')
    notEkle(DA, H2, 'OTHER-PATIENT', '2026-10-05T06:00:00.000Z')
    notEkle(DB, H3, 'OTHER-DOCTOR', '2026-10-05T06:00:00.000Z')
    const yabanci = BU === 'zz' ? 'yy' : 'zz'
    hastaEkle('30000000-0000-4000-8000-0000000000f1', DA, yabanci)
    notEkle(DA, '30000000-0000-4000-8000-0000000000f1', 'OTHER-COUNTRY', '2026-10-05T06:00:00.000Z', yabanci)
    // A dirty row: a note of doctor A whose visit points at ANOTHER doctor's patient. It is not this patient's.
    notEkle(DA, H3, 'DIRTY', '2026-10-06T06:00:00.000Z')
    await tamam(DA, { hastaId: H1 })
    const ham = model.cagrilar[0].ham
    assert.ok(ham.includes('QA-NOTE-S-MINE'))
    for (const iz of ['OTHER-PATIENT', 'OTHER-DOCTOR', 'OTHER-COUNTRY', 'DIRTY']) assert.ok(!ham.includes(iz), `a note that is not this patient's was sent: ${iz}`)
  })

  it('ANOTHER DOCTOR\'S PATIENT, a patient of another country and a patient who does not exist answer the same — and the model is not called, nothing is counted', async () => {
    if (!KIT) return
    notEkle(DB, H3, 'VICTIM', '2026-10-04T06:00:00.000Z')
    const yabanci = BU === 'zz' ? 'yy' : 'zz'
    const HY = '30000000-0000-4000-8000-0000000000f2'
    hastaEkle(HY, DA, yabanci)
    for (const hastaId of [H3, HY, YOK]) assert.deepEqual((await sor(DA, { hastaId })).r, { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(model.cagrilar.length, 0)
    assert.deepEqual([konusmalar().length, tablo('ulke_kullanim').length], [0, 0])
    // And the other way round.
    assert.deepEqual((await sor(DB, { hastaId: H1 })).r, { tamam: false, kod: 'NOT_FOUND' })
    assert.equal((await K.konusmaListesi(sb(), DA, H3)), null)
  })

  it('a pack that switches the patient mode off has none: a question about a patient is "not found", a general question is answered', async () => {
    if (!KIT) return
    const kapali = sentetik({ hastaModu: { acik: false, notSayisi: 2, notAzamiKarakter: 400 } })
    assert.deepEqual((await sor(DA, { hastaId: H1 }, kapali)).r, { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(model.cagrilar.length, 0)
    await tamam(DA, {}, kapali)
    assert.equal((await K.asistanDurumu(sb(), DA, kapali)).hastaModu, false)
  })

  it('a note is cut to the pack\'s length before it is sent', async () => {
    if (!KIT) return
    notEkle(DA, H1, 'LONG', '2026-10-04T06:00:00.000Z', BU, { s: 'S'.repeat(300), o: 'O'.repeat(300), a: 'A'.repeat(300), p: 'P'.repeat(300) })
    await tamam(DA, { hastaId: H1 })
    const not = (JSON.parse(model.cagrilar[0].sistem[1].metin.split('QA-PATIENT-DATA ')[1]) as AsistanHastaVerisi).notlar[0].icerik
    assert.deepEqual([not.s.length, not.o.length, not.a.length, not.p.length], [300, 100, 0, 0])
  })
})

describe('assistant — history, deleting and isolation', () => {
  it('the history is the doctor\'s own, newest first; a conversation about a patient names the patient; the list about one patient holds only theirs', async () => {
    if (!KIT) return
    const genel = await tamam(DA, { soru: 'QA-TITLE-GENERAL' })
    mock.timers.tick(1000)
    const hastali = await tamam(DA, { soru: 'QA-TITLE-PATIENT', hastaId: H1 })
    mock.timers.tick(1000)
    await tamam(DB, { soru: 'QA-TITLE-OF-B' })
    const liste = await K.konusmaListesi(sb(), DA)
    assert.deepEqual(liste!.map((k) => [k.id, k.baslik, k.hastaId, k.hastaAdi, k.rol]), [[hastali, 'QA-TITLE-PATIENT', H1, AD[H1], ROLLER[0]], [genel, 'QA-TITLE-GENERAL', null, null, ROLLER[0]]])
    assert.deepEqual((await K.konusmaListesi(sb(), DA, H1))!.map((k) => k.id), [hastali])
    assert.deepEqual(await K.konusmaListesi(sb(), DA, H2), [])
    assert.deepEqual((await K.konusmaListesi(sb(), DB))!.map((k) => k.baslik), ['QA-TITLE-OF-B'])
    // Every statement on the two tables carried the country and the doctor.
    for (const q of vt.sorgular.filter((x) => x.tablo.startsWith('ulke_asistan_'))) {
      assert.equal(q.ulke, BU)
      if (q.islem !== 'insert') assert.ok(q.filtreler.some((f) => f === `doctor_id=eq.${DA}` || f === `doctor_id=eq.${DB}`), `${q.tablo} ${q.islem} without the doctor: ${q.filtreler.join(' ')}`)
    }
  })

  it('ANOTHER DOCTOR cannot read, continue or delete a conversation — in either direction — and another country\'s rows are not there', async () => {
    if (!KIT) return
    const a = await tamam(DA, { soru: 'QA-SECRET-OF-A', hastaId: H1 })
    const b = await tamam(DB, { soru: 'QA-SECRET-OF-B', hastaId: H3 })
    for (const [doktor, yabanci] of [[DA, b], [DB, a]] as const) {
      model.cagrilar = []
      assert.equal(await K.konusmaGetir(sb(), doktor, yabanci), null)
      assert.deepEqual((await sor(doktor, { konusmaId: yabanci, soru: 'QA-INTRUSION' })).r, { tamam: false, kod: 'NOT_FOUND' })
      assert.equal(await K.konusmaSil(sb(), doktor, yabanci), false)
      assert.equal(model.cagrilar.length, 0, 'a foreign conversation must not reach the model')
    }
    assert.deepEqual([konusmalar().length, mesajlar().length], [2, 4])
    // A row of ANOTHER COUNTRY with this doctor's id and a valid conversation id.
    const yabanciUlke = BU === 'zz' ? 'yy' : 'zz'
    const YK = '80000000-0000-4000-8000-0000000000f1'
    konusmalar().push({ id: YK, ulke: yabanciUlke, doctor_id: DA, patient_id: null, rol: ROLLER[0], baslik_encrypted: 'x', created_at: simdiIso(), updated_at: simdiIso() })
    assert.equal(await K.konusmaGetir(sb(), DA, YK), null)
    assert.equal(await K.konusmaSil(sb(), DA, YK), false)
    assert.deepEqual((await sor(DA, { konusmaId: YK })).r, { tamam: false, kod: 'NOT_FOUND' })
    assert.ok(!(await K.konusmaListesi(sb(), DA))!.some((k) => k.id === YK))
    assert.ok(konusmalar().some((k) => k.id === YK), 'another country\'s row was removed')
  })

  it('a stored value that is not its row\'s own — another doctor\'s, another conversation\'s, the other writer\'s — is read as "cannot be shown" and is not sent to the model', async () => {
    if (!KIT) return
    const a = await tamam(DA, { soru: 'QA-MINE' })
    const b = await tamam(DB, { soru: 'QA-SECRET-OF-B' })
    const benim = mesajlar().filter((m) => m.konusma_id === a)
    const onun = mesajlar().filter((m) => m.konusma_id === b)
    // Planted directly (the database's own trigger would refuse a change): B's encrypted texts on A's rows.
    benim[0].metin_encrypted = onun[0].metin_encrypted
    benim[1].metin_encrypted = benim[0].metin_encrypted
    konusmalar().find((k) => k.id === a)!.baslik_encrypted = konusmalar().find((k) => k.id === b)!.baslik_encrypted
    const d = await K.konusmaGetir(sb(), DA, a)
    assert.deepEqual([d!.baslik, ...d!.mesajlar.map((m) => m.metin)], [null, null, null])
    mock.timers.tick(1000); model.cagrilar = []; cevapla()
    assert.equal((await sor(DA, { konusmaId: a, soru: 'QA-NEXT' })).r.tamam, true)
    assert.deepEqual(model.cagrilar[0].mesajlar, [{ role: 'user', metin: 'QA-NEXT' }])
    assert.ok(!model.cagrilar[0].ham.includes('QA-SECRET-OF-B'))
  })

  it('the doctor deletes a conversation: it and its messages are gone, another conversation is untouched, and a second delete finds nothing', async () => {
    if (!KIT) return
    const a = await tamam(DA, { soru: 'QA-ONE' })
    mock.timers.tick(1000)
    const b = await tamam(DA, { soru: 'QA-TWO' })
    assert.equal(await K.konusmaSil(sb(), DA, a), true)
    assert.deepEqual(konusmalar().map((k) => k.id), [b])
    assert.deepEqual([...new Set(mesajlar().map((m) => m.konusma_id))], [b])
    assert.equal(await K.konusmaSil(sb(), DA, a), false)
    assert.equal(await K.konusmaGetir(sb(), DA, a), null)
  })

  it('the stand-in holds what migration 143 holds: a message never changes, a conversation never moves, a message hangs from a conversation of its own doctor', async () => {
    if (!KIT) return
    const { ulkeTablosu } = await import('../uygulama/tablolar')
    const a = await tamam(DA, { hastaId: H1 })
    const { error: e1 } = await ulkeTablosu(sb(), 'ulke_asistan_mesajlari').update({ metin_encrypted: 'x' }).eq('doctor_id', DA).eq('konusma_id', a)
    assert.equal(e1?.code, '23514')
    for (const deger of [{ patient_id: H2 }, { patient_id: null }, { doctor_id: DB }, { rol: ROLLER[1] }]) {
      const { error } = await ulkeTablosu(sb(), 'ulke_asistan_konusmalari').update(deger).eq('id', a).eq('doctor_id', DA)
      assert.equal(error?.code, '23514', JSON.stringify(deger))
    }
    const { error: e2 } = await ulkeTablosu(sb(), 'ulke_asistan_mesajlari').insert({ doctor_id: DB, konusma_id: a, yazan: 'hekim', metin_encrypted: 'x' })
    assert.equal(e2?.code, '23503')
    const { error: e3 } = await ulkeTablosu(sb(), 'ulke_asistan_konusmalari').insert({ doctor_id: DA, patient_id: H3, rol: ROLLER[0], baslik_encrypted: 'x' })
    assert.equal(e3?.code, '23503', 'a conversation about another doctor\'s patient must be refused by the key')
  })
})

// ═════════════════════════ 2. the route, with the pack's own assistant ═════════════════════════

type Secenek = { jeton?: string; govde?: unknown }
async function cagir(yontem: string, yol: string, s: Secenek = {}): Promise<{ status: number; tur: string; metin: string; govde: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const basliklar: Record<string, string> = { host: 'notya.test' }
  if (s.jeton) basliklar.authorization = `Bearer ${s.jeton}`
  if (s.govde !== undefined) basliklar['content-type'] = 'application/json'
  const req = new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(s.govde !== undefined ? { body: JSON.stringify(s.govde) } : {}) })
  const res = await rota[yontem](req)
  const metin = await res.text()
  let govde: unknown = null
  try { govde = JSON.parse(metin) } catch { govde = metin.split('\n').filter(Boolean).map((x) => JSON.parse(x) as unknown) }
  return { status: res.status, tur: res.headers.get('content-type') ?? '', metin, govde }
}
const YOL = '/api/ulke/asistan'

describe('assistant — the route', () => {
  it('a pack without the assistant answers "not found" on every method, signed in or not', async () => {
    if (ROTA) return
    for (const [yontem, yol, govde] of [['GET', YOL, undefined], ['GET', `${YOL}?id=${YOK}`, undefined], ['POST', YOL, { soru: 'QA' }], ['DELETE', `${YOL}?id=${YOK}`, undefined]] as const) {
      for (const jeton of [undefined, 'jeton-a']) assert.deepEqual([(await cagir(yontem, yol, { jeton, govde })).status, (await cagir(yontem, yol, { jeton, govde })).govde], [404, { code: 'NOT_FOUND' }], `${yontem} ${yol}`)
    }
    assert.equal(model.cagrilar.length, 0)
  })

  it('no session: 401 on every method, and nothing is read', async () => {
    if (!ROTA) return
    for (const [yontem, yol, govde] of [['GET', YOL, undefined], ['POST', YOL, { soru: 'QA' }], ['DELETE', `${YOL}?id=${YOK}`, undefined]] as const) {
      for (const jeton of [undefined, 'jeton-nobody']) assert.deepEqual([(await cagir(yontem, yol, { jeton, govde })).status, (await cagir(yontem, yol, { jeton, govde })).govde], [401, { code: 'OTURUM_YOK' }])
    }
    assert.equal(vt.sorgular.filter((q) => q.tablo.startsWith('ulke_asistan_')).length, 0)
  })

  it('a question is answered as a STREAM of lines — the pieces as they are written, then the last line — and the conversation can be read back and deleted', async () => {
    if (!ROTA) return
    model.cevaplar.push({ parcalar: ['QA-STREAM-1 ', 'QA-STREAM-2'] })
    const r = await cagir('POST', YOL, { jeton: 'jeton-a', govde: { soru: 'QA-ROUTE-QUESTION' } })
    assert.equal(r.status, 200)
    assert.match(r.tur, /^application\/x-ndjson/)
    const id = r.govde[2].konusmaId as string
    assert.deepEqual(r.govde, [{ t: 'parca', m: 'QA-STREAM-1 ' }, { t: 'parca', m: 'QA-STREAM-2' }, { t: 'son', konusmaId: id, yeniKonusma: true, kesildi: false, kaydedildi: true }])
    // The pack's own instruction went out: the assembled one for this account's role and form, and nothing Turkish.
    const kimlik = A.asistanKimligi(ROLLER[0], DIL)!
    assert.ok(model.cagrilar[0].sistem[0].metin.includes(kimlik.tamAd))
    assert.equal(model.cagrilar[0].sistem[0].metin, T.asistanTalimati(K.aktifAsistan()!, ROLLER[0], DIL as never, { tamAd: kimlik.tamAd, rolAdi: A.rolAdi(ROLLER[0], DIL)! }))
    const liste = await cagir('GET', YOL, { jeton: 'jeton-a' })
    assert.equal(liste.status, 200)
    assert.deepEqual(liste.govde.konusmalar.map((k: { id: string; baslik: string }) => [k.id, k.baslik]), [[id, 'QA-ROUTE-QUESTION']])
    assert.deepEqual([liste.govde.durum.asistanVar, liste.govde.durum.limit, liste.govde.durum.kalan], [true, K.aktifAsistan()!.gunlukSoruLimiti, K.aktifAsistan()!.gunlukSoruLimiti - 1])
    const tek = await cagir('GET', `${YOL}?id=${id}`, { jeton: 'jeton-a' })
    assert.deepEqual(tek.govde.konusma.mesajlar.map((m: { yazan: string; metin: string }) => [m.yazan, m.metin]), [['hekim', 'QA-ROUTE-QUESTION'], ['asistan', 'QA-STREAM-1 QA-STREAM-2']])
    // Doctor B: the same id is "not found" on every method, and the conversation is still there.
    assert.equal((await cagir('GET', `${YOL}?id=${id}`, { jeton: 'jeton-b' })).status, 404)
    assert.deepEqual((await cagir('POST', YOL, { jeton: 'jeton-b', govde: { soru: 'QA', konusmaId: id } })).govde, { code: 'NOT_FOUND' })
    assert.equal((await cagir('DELETE', `${YOL}?id=${id}`, { jeton: 'jeton-b' })).status, 404)
    assert.deepEqual((await cagir('GET', YOL, { jeton: 'jeton-b' })).govde.konusmalar, [])
    assert.deepEqual((await cagir('DELETE', `${YOL}?id=${id}`, { jeton: 'jeton-a' })).govde, { ok: true })
    assert.equal((await cagir('DELETE', `${YOL}?id=${id}`, { jeton: 'jeton-a' })).status, 404)
    assert.deepEqual([konusmalar().length, mesajlar().length], [0, 0])
  })

  it('a refusal is a code and a status, never a stream: no question, a malformed or foreign id, another doctor\'s patient, a provider that gives no answer', async () => {
    if (!ROTA) return
    const dene = async (govde: unknown, jeton = 'jeton-a') => { const r = await cagir('POST', YOL, { jeton, govde }); assert.match(r.tur, /^application\/json/); return [r.status, r.govde] }
    assert.deepEqual(await dene({}), [422, { code: 'BOS' }])
    assert.deepEqual(await dene({ soru: 'x'.repeat(K.aktifAsistan()!.soruAzamiKarakter + 1) }), [422, { code: 'UZUN' }])
    for (const govde of [{ soru: 'QA', konusmaId: 'not-an-id' }, { soru: 'QA', hastaId: 'not-an-id' }, { soru: 'QA', konusmaId: YOK }, { soru: 'QA', hastaId: H3 }, { soru: 'QA', hastaId: 7 }]) assert.deepEqual(await dene(govde), [404, { code: 'NOT_FOUND' }], JSON.stringify(govde))
    assert.equal(model.cagrilar.length, 0)
    model.cevaplar.push(503, 503, 503)
    const { sonuc } = await sessiz(() => dene({ soru: 'QA' }))
    assert.deepEqual(sonuc, [502, { code: 'CEVAP_YOK' }])
    for (const yol of [`${YOL}?id=x`, `${YOL}?hasta=x`, `${YOL}?hasta=${H3}`, `${YOL}?id=${YOK}`]) assert.equal((await cagir('GET', yol, { jeton: 'jeton-a' })).status, 404, yol)
    assert.equal((await cagir('DELETE', `${YOL}?id=x`, { jeton: 'jeton-a' })).status, 404)
  })

  it('a stream that breaks after it began ends with its last line all the same, marked as cut; nothing of the provider\'s error reaches the caller', async () => {
    if (!ROTA) return
    model.cevaplar.push({ parcalar: ['QA-CUT'], kop: true })
    const { sonuc: r } = await sessiz(() => cagir('POST', YOL, { jeton: 'jeton-a', govde: { soru: 'QA' } }))
    assert.equal(r.status, 200)
    assert.deepEqual(r.govde.map((x: { t: string }) => x.t), ['parca', 'son'])
    assert.equal(r.govde[1].kesildi, true)
    assert.ok(!r.metin.includes('QA-STREAM-BROKE'))
  })

  it('about a patient: the doctor\'s own patient is answered and the conversation is listed under that patient', async () => {
    if (!ROTA || !K.aktifAsistan()!.hastaModu.acik) return
    notEkle(DA, H1, 'ROUTE', '2026-10-04T06:00:00.000Z')
    cevapla()
    const r = await cagir('POST', YOL, { jeton: 'jeton-a', govde: { soru: 'QA-ABOUT', hastaId: H1 } })
    assert.equal(r.status, 200)
    const ham = model.cagrilar[0].ham
    assert.ok(ham.includes('QA-NOTE-S-ROUTE'), 'the approved note must reach the model through the pack\'s own message')
    for (const iz of [AD[H1], TELEFON, KIMLIK, H1, 'QA-SECOND-NAME']) assert.ok(!ham.includes(iz), `the request to the model carries "${iz}"`)
    const liste = await cagir('GET', `${YOL}?hasta=${H1}`, { jeton: 'jeton-a' })
    assert.deepEqual(liste.govde.konusmalar.map((k: { hastaId: string; hastaAdi: string }) => [k.hastaId, k.hastaAdi]), [[H1, AD[H1]]])
  })
})
