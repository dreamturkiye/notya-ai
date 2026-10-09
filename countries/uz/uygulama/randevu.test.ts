/**
 * NOTYA-UZ-RANDEVU-01 — APPOINTMENTS in an Uzbekistan build (NOTYA_COUNTRY=uz): working pattern, booking, moving,
 * status, the link from an appointment to its visit, the home's list.
 *
 * Real handlers and real library code, with the database, sign-in, storage, the speech provider and the model
 * provider replaced by stand-ins inside this process. Nothing leaves it; any network address other than the two
 * stand-in providers fails the test. Synthetic accounts, patients and appointments only.
 *
 *   1. TIME: the country's wall clock ↔ instants, around midnight; a day typed in the pack's own pattern.
 *   2. WORKING PATTERN: the pack's until the account saves its own; no public holiday anywhere.
 *   3. NO DOUBLE BOOKING — also for two requests at the same moment; never overridable.
 *   4. WORKING HOURS: outside them nothing is written unless the request says "book anyway".
 *   5. STATUS: planned, arrived, done, did not come, cancelled.
 *   6. FROM APPOINTMENT TO VISIT: the visit is linked; approving its note marks the appointment done.
 *   7. ISOLATION between two doctors on every appointment route, both directions.
 */
process.env.NOTYA_COUNTRY = 'uz'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0004'
process.env.ELEVENLABS_API_KEY = 'sahte-konusma-anahtari'
process.env.OPENROUTER_API_KEY = 'sahte-model-anahtari'
delete process.env.OPENROUTER_BASE_URL
// The server clock is NOT the country's: every conversion must come from the pack's time zone.
process.env.TZ = 'America/Los_Angeles'

import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import { sahteVeritabani } from '@/lib/ulke/testing/sahteVeritabani'
import { gunCoz, gunEkle, gunYazDesenle, haftaGunu, haftaninIlkGunu, saatCoz, yerelAn, yerelUtc } from '@/lib/ulke/uygulama/zaman'

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

// ───────────────────────── stand-in providers (speech + model), for the visit that is started from an appointment ─────────────────────────
const UZ_METIN = 'Shifokor: Nima bezovta qilyapti? Ona: Qizimning uch kundan beri isitmasi bor, yoʻtal va burun bitishi kuzatilmoqda. Shifokor: Tomogʻi qizargan, oʻpkasi toza. Paratsetamol bering, uch kundan keyin keling.'
const UZ_NOT = { s: 'Onasi aytishicha, uch kundan beri isitma, yoʻtal va burun bitishi.', o: 'Tomogʻi qizargan, oʻpkasi toza.', a: 'Shifokor tashxisni aytmadi.', p: 'Paratsetamol, uch kundan keyin qayta koʻrik.' }
const SCRIBE = 'https://api.elevenlabs.io/v1/speech-to-text'
const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions'
globalThis.fetch = (async (g: unknown, o?: { body?: unknown }) => {
  const adres = String(g)
  if (adres === SCRIBE) return new Response(JSON.stringify({ language_code: 'uzb', language_probability: 0.97, text: UZ_METIN, words: UZ_METIN.split(' ').map((k, i) => ({ text: k, type: 'word', start: i, end: i + 0.5, logprob: -0.08 })) }), { status: 200 })
  if (adres !== OPENROUTER) throw new Error(`this test may not use the network: ${adres}`)
  const b = JSON.parse(String(o?.body)) as { model: string }
  return new Response(JSON.stringify({ id: 'sahte-1', model: b.model, choices: [{ message: { role: 'assistant', content: JSON.stringify(UZ_NOT) }, finish_reason: 'stop' }], usage: { prompt_tokens: 900, completion_tokens: 220 } }), { status: 200 })
}) as typeof fetch

const A = '10000000-0000-4000-8000-00000000000a'
const B = '10000000-0000-4000-8000-00000000000b'
const YOK = '77777777-7777-4777-8777-777777777777'
const DILIM = 'Asia/Tashkent'
function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: A, email: 'qa-a@notya.test', app_metadata: { country: 'uz' } },
    'jeton-b': { id: B, email: 'qa-b@notya.test', app_metadata: { country: 'uz' } },
    'jeton-tr': { id: '10000000-0000-4000-8000-00000000000d', email: 'qa-tr@notya.test', app_metadata: { country: 'tr' } },
  })
  vt.tablo('ulke_hesaplari').push({ id: A, full_name: 'QA Shifokor A', ulke: 'uz', ui_language: 'uz-Latn' }, { id: B, full_name: 'QA Врач Б', ulke: 'uz', ui_language: 'ru' })
  vt.tablo('hekim_dil_tercihleri').push({ ulke: 'uz', doctor_id: A, not_dili: 'uz-Latn', soruldu_at: 'x' }, { ulke: 'uz', doctor_id: B, not_dili: 'ru', soruldu_at: 'x' })
  vt.tablo('hekim_rolu').push({ ulke: 'uz', doctor_id: A, rol: 'pediatri' }, { ulke: 'uz', doctor_id: B, rol: 'pediatri' })
}

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: 'uz', kaynak }), [])
const TURKCE = /[çğıİşĞŞ]/

type Rotalar = {
  duzen: typeof import('../../../app/api/ulke/calisma-duzeni/route.ulke')
  randevu: typeof import('../../../app/api/ulke/randevu/route.ulke')
  randevular: typeof import('../../../app/api/ulke/randevular/route.ulke')
  bugun: typeof import('../../../app/api/ulke/bugun/route.ulke')
  hastalar: typeof import('../../../app/api/ulke/hastalar/route.ulke')
  muayene: typeof import('../../../app/api/ulke/muayene/route.ulke')
  not: typeof import('../../../app/api/ulke/not/route.ulke')
  onayla: typeof import('../../../app/api/ulke/not/onayla/route.ulke')
  NextRequest: typeof import('next/server').NextRequest
  devreSifirla: typeof import('@/lib/ai/devre').devreSifirla
  lib: typeof import('@/lib/ulke/uygulama/randevular')
  duzenLib: typeof import('@/lib/ulke/uygulama/calismaDuzeni')
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
const hastaEkle = async (jeton: string, ad: string, dil = 'uz') => (await oku(await R.hastalar.POST(istek('/api/ulke/hastalar', jeton, { ad, dil, dogumTarihi: '2021-03-07', cinsiyet: 'female', telefon: '+998 90 000 00 01' })))).j.hasta.id as string
const al = async (jeton: string | undefined, g: Record<string, unknown>) => oku(await R.randevu.POST(istek('/api/ulke/randevu', jeton, g)))
const degistir = async (jeton: string | undefined, g: Record<string, unknown>) => oku(await R.randevu.PATCH(istek('/api/ulke/randevu', jeton, g, 'PATCH')))
const getir = async (jeton: string | undefined, id: string) => oku(await R.randevu.GET(istek(`/api/ulke/randevu?id=${id}`, jeton)))
const liste = async (jeton: string | undefined, sorgu: string) => oku(await R.randevular.GET(istek(`/api/ulke/randevular${sorgu}`, jeton)))
const satirlar = () => vt.tablo('ulke_randevulari')

/** The country's today, and the first Monday at least two days ahead (so "today" can never be in the way). */
const BUGUN = yerelAn(Date.now(), DILIM).gun
const PAZARTESI = (() => { let g = gunEkle(BUGUN, 2); while (haftaGunu(g) !== 1) g = gunEkle(g, 1); return g })()
const SALI = gunEkle(PAZARTESI, 1)
const CUMARTESI = gunEkle(PAZARTESI, 5)
/** A day as a doctor in Uzbekistan types it. */
const yaz = (gun: string) => gunYazDesenle(gun, 'DD.MM.YYYY')
/** The instant of a Tashkent wall-clock time, worked out here WITHOUT the code under test: Tashkent is UTC+5 all year. */
const an = (gun: string, saat: string) => new Date(`${gun}T${saat}:00+05:00`).toISOString()

before(async () => {
  R.NextRequest = (await import('next/server')).NextRequest
  R.duzen = await import('../../../app/api/ulke/calisma-duzeni/route.ulke')
  R.randevu = await import('../../../app/api/ulke/randevu/route.ulke')
  R.randevular = await import('../../../app/api/ulke/randevular/route.ulke')
  R.bugun = await import('../../../app/api/ulke/bugun/route.ulke')
  R.hastalar = await import('../../../app/api/ulke/hastalar/route.ulke')
  R.muayene = await import('../../../app/api/ulke/muayene/route.ulke')
  R.not = await import('../../../app/api/ulke/not/route.ulke')
  R.onayla = await import('../../../app/api/ulke/not/onayla/route.ulke')
  R.devreSifirla = (await import('@/lib/ai/devre')).devreSifirla
  R.lib = await import('@/lib/ulke/uygulama/randevular')
  R.duzenLib = await import('@/lib/ulke/uygulama/calismaDuzeni')
})

describe('Uzbekistan appointments: time', () => {
  it('the pack: Asia/Tashkent, weeks start on Monday, days are written DD.MM.YYYY — and the test process runs in another zone', async () => {
    const { ulkePaketi } = await import('@/lib/ulke/ulke')
    const p = ulkePaketi()
    assert.deepEqual([p.saatDilimi, p.bicim.haftaBasi, p.bicim.tarihDeseni], [DILIM, 1, 'DD.MM.YYYY'])
    assert.notEqual(new Date('2026-10-09T00:00:00').getTimezoneOffset(), -300, 'the test must not run on Tashkent time, or it proves nothing')
  })

  it('AROUND MIDNIGHT: 00:15 in Tashkent is the evening before in UTC, and still that Tashkent day', () => {
    assert.equal(new Date(yerelUtc('2026-10-09', 15, DILIM)).toISOString(), '2026-10-08T19:15:00.000Z')
    assert.equal(new Date(yerelUtc('2026-10-09', 23 * 60 + 59, DILIM)).toISOString(), '2026-10-09T18:59:00.000Z')
    assert.deepEqual(yerelAn('2026-10-08T19:15:00Z', DILIM), { gun: '2026-10-09', dakika: 15, haftaGunu: 5 })
    assert.deepEqual(yerelAn('2026-10-08T18:59:59Z', DILIM), { gun: '2026-10-08', dakika: 23 * 60 + 59, haftaGunu: 4 })
    assert.deepEqual(yerelAn('2026-10-08T19:00:00Z', DILIM), { gun: '2026-10-09', dakika: 0, haftaGunu: 5 })
    // New Year's night: the year changes in Tashkent five hours before it does in UTC.
    assert.deepEqual(yerelAn('2026-12-31T19:30:00Z', DILIM), { gun: '2027-01-01', dakika: 30, haftaGunu: 5 })
    // Every minute of a day goes there and back.
    for (let dk = 0; dk < 1440; dk += 7) assert.deepEqual([yerelAn(yerelUtc('2027-02-28', dk, DILIM), DILIM).gun, yerelAn(yerelUtc('2027-02-28', dk, DILIM), DILIM).dakika], ['2027-02-28', dk])
  })

  it('the offset comes from the time-zone database, not from a fixed number of hours', () => {
    assert.equal(new Date(yerelUtc('2026-07-01', 600, 'Europe/Berlin')).toISOString(), '2026-07-01T08:00:00.000Z')
    assert.equal(new Date(yerelUtc('2026-01-15', 600, 'Europe/Berlin')).toISOString(), '2026-01-15T09:00:00.000Z')
    assert.doesNotMatch(readFileSync(join(KOK, 'lib/ulke/uygulama/zaman.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), /Tashkent|\+05|300\b|5 \* 60/)
  })

  it('A DAY TYPED IN THE PACK\'S FORMAT: DD.MM.YYYY is read as day, month, year — never the other way round; nothing is guessed', () => {
    const D = 'DD.MM.YYYY'
    assert.equal(gunCoz('09.10.2026', D), '2026-10-09')
    assert.equal(gunCoz('9.1.2027', D), '2027-01-09')
    assert.equal(gunCoz(' 31.12.2026 ', D), '2026-12-31')
    assert.equal(gunCoz('2026-10-09', D), '2026-10-09', 'the form a date field sends')
    assert.equal(gunCoz('29.02.2028', D), '2028-02-29')
    for (const k of ['31.02.2027', '29.02.2027', '00.10.2026', '10.13.2026', '09.10.26', '10/09/2026', '09-10-2026', '2026.10.09', '', 'ertaga', '9.10', null, 20261009]) assert.equal(gunCoz(k, D), null, String(k))
    assert.equal(gunYazDesenle('2026-10-09', D), '09.10.2026')
    // The same function follows another pack's pattern; it has no pattern of its own.
    assert.equal(gunCoz('10/09/2026', 'MM/DD/YYYY'), '2026-10-09')
    assert.deepEqual([saatCoz('09:30'), saatCoz('9:05'), saatCoz('00:00'), saatCoz('24:00'), saatCoz('24:01'), saatCoz('12:60'), saatCoz('9'), saatCoz('09.30')], [570, 545, 0, 1440, null, null, null, null])
  })

  it('THE WEEK STARTS ON MONDAY: the week of any day begins on its Monday', () => {
    assert.equal(haftaGunu('2026-10-09'), 5)
    for (const g of ['2026-10-05', '2026-10-07', '2026-10-11']) assert.equal(haftaninIlkGunu(g, 1), '2026-10-05', g)
    assert.equal(haftaninIlkGunu('2026-10-12', 1), '2026-10-12')
    assert.equal(haftaninIlkGunu('2026-10-11', 7), '2026-10-11', 'a pack whose week starts on Sunday')
  })
})

describe('Uzbekistan appointments: working pattern', () => {
  beforeEach(sifirla)
  const duzenOku = async (jeton?: string) => oku(await R.duzen.GET(istek('/api/ulke/calisma-duzeni', jeton)))
  const duzenYaz = async (jeton: string | undefined, g: Record<string, unknown>) => oku(await R.duzen.POST(istek('/api/ulke/calisma-duzeni', jeton, g)))
  const GECERLI = { gunler: [1, 2, 3, 4, 6], baslangic: '08:30', bitis: '17:00', sureDk: 20, molalar: [{ baslangic: '12:00', bitis: '12:45' }] }

  it('until an account saves its own, the pack\'s pattern applies; the answer names the week start and the date pattern', async () => {
    const r = await duzenOku('jeton-a')
    assert.equal(r.s, 200)
    assert.deepEqual(r.j, {
      duzen: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '18:00', sureDk: 30, molalar: [{ baslangic: '13:00', bitis: '14:00' }] },
      kayitli: false, sureSecenekleri: [10, 15, 20, 30, 45, 60, 90], haftaBasi: 1, tarihDeseni: 'DD.MM.YYYY', bugun: BUGUN,
    })
  })

  it('NO PUBLIC HOLIDAY IS HARD-CODED: the pack and the appointment code carry none', async () => {
    const { ulkePaketi } = await import('@/lib/ulke/ulke')
    assert.deepEqual(Object.keys(ulkePaketi().uygulama!.randevu!).sort(), ['sureSecenekleri', 'varsayilan'])
    assert.deepEqual(Object.keys(ulkePaketi().uygulama!.randevu!.varsayilan).sort(), ['baslangic', 'bitis', 'gunler', 'molalar', 'sureDk'])
    for (const d of ['lib/ulke/uygulama/calismaDuzeni.ts', 'lib/ulke/uygulama/randevular.ts', 'lib/ulke/uygulama/zaman.ts', 'countries/uz/index.ts']) {
      const kod = readFileSync(join(KOK, d), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
      assert.doesNotMatch(kod, /tatil|bayram|holiday|navro|hayit|mustaqillik/i, `${d} names a holiday`)
      assert.doesNotMatch(kod, /['"`]\d{2}[-.]\d{2}['"`]|['"`]\d{4}-\d{2}-\d{2}['"`]/, `${d} carries a calendar date`)
    }
    // A holiday is an ordinary day to the rule: 1 January 2027 is a Friday, and a Friday is a working day.
    const d = R.duzenLib.varsayilanDuzen()!
    assert.equal(R.duzenLib.mesaiIcinde(d, haftaGunu('2027-01-01'), 600, 30), true)
  })

  it('an account saves its own pattern and reads it back; the next account still has the pack\'s', async () => {
    assert.deepEqual(await duzenYaz('jeton-a', GECERLI), { s: 200, j: { ok: true, duzen: GECERLI } })
    assert.deepEqual((await duzenOku('jeton-a')).j.duzen, GECERLI); assert.equal((await duzenOku('jeton-a')).j.kayitli, true)
    assert.deepEqual(vt.tablo('hekim_calisma_duzeni'), [{ ...vt.tablo('hekim_calisma_duzeni')[0], doctor_id: A, gunler: [1, 2, 3, 4, 6], baslangic_dk: 510, bitis_dk: 1020, sure_dk: 20, molalar: [{ bas: 720, bit: 765 }] }])
    assert.equal((await duzenOku('jeton-b')).j.kayitli, false)
    // Saved again: still one row, the caller's own. The body cannot name another account.
    assert.equal((await duzenYaz('jeton-a', { ...GECERLI, doctor_id: B, sureDk: 45 })).s, 200)
    assert.deepEqual(vt.tablo('hekim_calisma_duzeni').map((s) => [s.doctor_id, s.sure_dk]), [[A, 45]])
  })

  it('a pattern that makes no sense is refused with the field that is wrong, and nothing is saved', async () => {
    for (const [alan, g] of [
      ['gunler', { ...GECERLI, gunler: [] }], ['gunler', { ...GECERLI, gunler: [0, 1] }], ['gunler', { ...GECERLI, gunler: [1, 8] }], ['gunler', { ...GECERLI, gunler: 'hammasi' }],
      ['saatler', { ...GECERLI, baslangic: '17:00', bitis: '08:30' }], ['saatler', { ...GECERLI, baslangic: '9' }], ['saatler', { ...GECERLI, bitis: '25:00' }],
      ['sure', { ...GECERLI, sureDk: 25 }], ['sure', { ...GECERLI, sureDk: '30 daqiqa' }],
      ['molalar', { ...GECERLI, molalar: [{ baslangic: '07:00', bitis: '09:00' }] }], ['molalar', { ...GECERLI, molalar: [{ baslangic: '13:00', bitis: '12:00' }] }],
      ['molalar', { ...GECERLI, molalar: [{ baslangic: '12:00', bitis: '13:00' }, { baslangic: '12:30', bitis: '13:30' }] }],
      ['molalar', { ...GECERLI, molalar: Array.from({ length: 5 }, (_, i) => ({ baslangic: `${10 + i}:00`, bitis: `${10 + i}:10` })) }], ['molalar', { ...GECERLI, molalar: 'tushlik' }],
    ] as const) assert.deepEqual(await duzenYaz('jeton-a', g as Record<string, unknown>), { s: 400, j: { code: 'GECERSIZ', alan } }, JSON.stringify(g))
    assert.deepEqual(vt.tablo('hekim_calisma_duzeni'), [])
  })

  it('THE WORKING-HOURS RULE: a working day, wholly inside the hours, touching no break', () => {
    const d = R.duzenLib.varsayilanDuzen()!
    const icinde = (gun: number, saat: string, sure: number) => R.duzenLib.mesaiIcinde(d, gun, saatCoz(saat)!, sure)
    assert.deepEqual([icinde(1, '09:00', 30), icinde(5, '17:30', 30), icinde(3, '12:30', 30), icinde(3, '14:00', 60)], [true, true, true, true])
    assert.deepEqual([icinde(1, '08:59', 30), icinde(1, '17:31', 30), icinde(1, '17:45', 30), icinde(6, '10:00', 30), icinde(7, '10:00', 30)], [false, false, false, false, false])
    assert.deepEqual([icinde(2, '12:45', 30), icinde(2, '13:00', 15), icinde(2, '13:59', 10), icinde(2, '12:00', 90)], [false, false, false, false], 'the break')
    assert.equal(icinde(1, '23:45', 30), false, 'past midnight is never inside working hours')
  })

  it('no session, another country\'s account: the same refusal; the feature is the pack\'s to switch on', async () => {
    for (const j of [undefined, 'jeton-tr', 'yok']) { assert.deepEqual(await duzenOku(j), { s: 401, j: { code: 'OTURUM_YOK' } }); assert.deepEqual(await duzenYaz(j, GECERLI), { s: 401, j: { code: 'OTURUM_YOK' } }) }
    const { ozellikAcik } = await import('@/lib/ulke/ulke')
    assert.equal(ozellikAcik('randevu'), true)
    for (const d of ['calisma-duzeni', 'randevu', 'randevular']) assert.match(readFileSync(join(KOK, `app/api/ulke/${d}/route.ulke.ts`), 'utf8'), /ozellikAcik\('cekirdekMuayene'\) (&&|\|\|) !?ozellikAcik\('randevu'\)/, d)
  })
})

describe('Uzbekistan appointments: booking, moving, status', () => {
  let h1 = '', h2 = '', hb = ''
  beforeEach(async () => { sifirla(); h1 = await hastaEkle('jeton-a', 'QA Karimova Dilnoza'); h2 = await hastaEkle('jeton-a', 'QA Yusupov Sardor', 'ru'); hb = await hastaEkle('jeton-b', 'QA Тестовый Пациент', 'ru'); vt.sorgular.length = 0 })

  it('BOOKING: patient, day (typed DD.MM.YYYY), time, length, reason — stored as the right instant, the reason encrypted', async () => {
    const r = await al('jeton-a', { hastaId: h1, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30, neden: '  Nazorat koʻrigi, yoʻtal  ' })
    assert.equal(r.s, 200, JSON.stringify(r.j))
    const [s] = satirlar()
    assert.deepEqual(r.j.randevu, { id: s.id, hastaId: h1, hastaAdi: 'QA Karimova Dilnoza', baslangic: an(PAZARTESI, '10:00'), bitis: an(PAZARTESI, '10:30'), gun: PAZARTESI, saat: '10:00', sureDk: 30, neden: 'Nazorat koʻrigi, yoʻtal', durum: 'planlandi', mesaiDisi: false, seansId: null })
    assert.deepEqual([s.doctor_id, s.patient_id, s.baslangic, s.bitis, s.durum, s.mesai_disi], [A, h1, an(PAZARTESI, '10:00'), an(PAZARTESI, '10:30'), 'planlandi', false])
    assert.ok(typeof s.neden_encrypted === 'string' && !String(s.neden_encrypted).includes('Nazorat') && !JSON.stringify(s).includes('yoʻtal'), 'the reason is stored readable')
    // Read back: the patient's own language comes with it (for the reminder text).
    assert.deepEqual((await getir('jeton-a', String(s.id))).j.randevu, { ...r.j.randevu, hastaDili: 'uz' })
    // The ISO day works too, and no reason is needed.
    const r2 = await al('jeton-a', { hastaId: h2, gun: SALI, saat: '09:00', sureDk: 15 })
    assert.deepEqual([r2.s, r2.j.randevu.gun, r2.j.randevu.neden, satirlar()[1].neden_encrypted], [200, SALI, '', null])
  })

  it('what cannot be booked: an unreadable or past day, a day too far ahead, an impossible time, a length the pack does not offer', async () => {
    const temel = { hastaId: h1, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 }
    for (const [alan, g] of [
      ['gun', { ...temel, gun: '31.02.2027' }], ['gun', { ...temel, gun: '10/12/2026' }], ['gun', { ...temel, gun: '' }], ['gun', { ...temel, gun: yaz(gunEkle(BUGUN, -1)) }], ['gun', { ...temel, gun: yaz(gunEkle(BUGUN, 731)) }],
      ['saat', { ...temel, saat: '25:00' }], ['saat', { ...temel, saat: '24:00' }], ['saat', { ...temel, saat: 'ertalab' }], ['saat', { ...temel, saat: undefined }],
      ['sure', { ...temel, sureDk: 25 }], ['sure', { ...temel, sureDk: 0 }], ['sure', { ...temel, sureDk: 600 }], ['sure', { ...temel, sureDk: undefined }],
    ] as const) assert.deepEqual(await al('jeton-a', g as Record<string, unknown>), { s: 400, j: { code: 'GECERSIZ', alan } }, JSON.stringify(g))
    assert.deepEqual(satirlar(), [])
    // A reason is cut to its ceiling, not refused.
    const r = await al('jeton-a', { ...temel, neden: 'x'.repeat(500) })
    assert.equal(r.j.randevu.neden.length, 200)
  })

  it('NO DOUBLE BOOKING: the same time, an overlapping time, a longer one around it — all "taken"; "book anyway" does not help', async () => {
    assert.equal((await al('jeton-a', { hastaId: h1, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 })).s, 200)
    for (const g of [
      { saat: '10:00', sureDk: 30 }, { saat: '10:15', sureDk: 30 }, { saat: '09:45', sureDk: 30 }, { saat: '09:30', sureDk: 90 }, { saat: '10:10', sureDk: 10 },
      { saat: '10:00', sureDk: 30, yineDe: true }, { saat: '10:15', sureDk: 15, yineDe: true },
    ]) assert.deepEqual(await al('jeton-a', { hastaId: h2, gun: yaz(PAZARTESI), ...g }), { s: 409, j: { code: 'DOLU' } }, JSON.stringify(g))
    // The same patient cannot be booked twice into it either.
    assert.deepEqual(await al('jeton-a', { hastaId: h1, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 }), { s: 409, j: { code: 'DOLU' } })
    assert.equal(satirlar().length, 1)
    // Touching is not overlapping: right before and right after are free.
    assert.equal((await al('jeton-a', { hastaId: h2, gun: yaz(PAZARTESI), saat: '09:30', sureDk: 30 })).s, 200)
    assert.equal((await al('jeton-a', { hastaId: h2, gun: yaz(PAZARTESI), saat: '10:30', sureDk: 30 })).s, 200)
    // Another doctor's calendar is another calendar.
    assert.equal((await al('jeton-b', { hastaId: hb, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 })).s, 200)
    // If the check itself cannot be made, that is a failure — never "free".
    vt.boz.oku.add('ulke_randevulari')
    assert.deepEqual(await al('jeton-a', { hastaId: h2, gun: yaz(PAZARTESI), saat: '15:00', sureDk: 30 }), { s: 500, j: { code: 'BASARISIZ' } })
    vt.boz.oku.clear()
    assert.equal(satirlar().filter((s) => s.doctor_id === A).length, 3)
  })

  it('NO DOUBLE BOOKING, TWO REQUESTS AT THE SAME MOMENT: both pass the check, the database refuses one — exactly one appointment exists', async () => {
    for (const [g1, g2] of [
      [{ saat: '11:00', sureDk: 30 }, { saat: '11:00', sureDk: 30 }],
      [{ saat: '14:00', sureDk: 60 }, { saat: '14:30', sureDk: 30 }],
    ]) {
      const once = satirlar().length
      vt.sorgular.length = 0
      const [r1, r2] = await Promise.all([al('jeton-a', { hastaId: h1, gun: yaz(PAZARTESI), ...g1 }), al('jeton-a', { hastaId: h2, gun: yaz(PAZARTESI), ...g2 })])
      assert.deepEqual([r1.s, r2.s].sort(), [200, 409], JSON.stringify([r1.j, r2.j]))
      assert.deepEqual([r1, r2].find((r) => r.s === 409)!.j, { code: 'DOLU' })
      assert.equal(satirlar().length, once + 1)
      // Both requests really got as far as the insert: the earlier read told each of them "free". What decided was
      // the constraint inside the statement (migration 135), not the order of two reads.
      assert.equal(vt.sorgular.filter((q) => q.tablo === 'ulke_randevulari' && q.islem === 'insert').length, 2)
    }
    // Five at once for the same time: one wins.
    const once = satirlar().length
    const hepsi = await Promise.all(Array.from({ length: 5 }, (_, i) => al('jeton-a', { hastaId: i % 2 ? h1 : h2, gun: yaz(SALI), saat: '09:00', sureDk: 30 })))
    assert.deepEqual(hepsi.map((r) => r.s).sort(), [200, 409, 409, 409, 409])
    assert.equal(satirlar().length, once + 1)
    // Two MOVES onto the same free time at the same moment: one wins there too.
    const a = (await al('jeton-a', { hastaId: h1, gun: yaz(SALI), saat: '15:00', sureDk: 30 })).j.randevu.id
    const b = (await al('jeton-a', { hastaId: h2, gun: yaz(SALI), saat: '16:00', sureDk: 30 })).j.randevu.id
    const tasima = await Promise.all([degistir('jeton-a', { id: a, gun: yaz(SALI), saat: '11:00', sureDk: 30 }), degistir('jeton-a', { id: b, gun: yaz(SALI), saat: '11:15', sureDk: 30 })])
    assert.deepEqual(tasima.map((r) => r.s).sort(), [200, 409])
    assert.deepEqual(tasima.find((r) => r.s === 409)!.j, { code: 'DOLU' })
    // The loser is where it was.
    const kaybeden = tasima[0].s === 409 ? a : b
    assert.equal(satirlar().find((s) => s.id === kaybeden)!.baslangic, an(SALI, kaybeden === a ? '15:00' : '16:00'))
  })

  it('WORKING HOURS: outside them nothing is written and the answer says so; "book anyway" books it and marks it', async () => {
    for (const [ad, g] of [
      ['before the day begins', { gun: yaz(PAZARTESI), saat: '08:30', sureDk: 30 }],
      ['runs past the end', { gun: yaz(PAZARTESI), saat: '17:45', sureDk: 30 }],
      ['in the break', { gun: yaz(PAZARTESI), saat: '13:15', sureDk: 15 }],
      ['runs into the break', { gun: yaz(PAZARTESI), saat: '12:45', sureDk: 30 }],
      ['not a working day', { gun: yaz(CUMARTESI), saat: '10:00', sureDk: 30 }],
      ['night', { gun: yaz(PAZARTESI), saat: '23:45', sureDk: 30 }],
    ] as const) {
      assert.deepEqual(await al('jeton-a', { hastaId: h1, ...g }), { s: 422, j: { code: 'MESAI_DISI' } }, ad)
      assert.deepEqual(satirlar(), [], ad)
    }
    const r = await al('jeton-a', { hastaId: h1, gun: yaz(CUMARTESI), saat: '10:00', sureDk: 30, yineDe: true })
    assert.deepEqual([r.s, r.j.randevu.mesaiDisi, satirlar()[0].mesai_disi], [200, true, true])
    // "Book anyway" is for the hours only: the time it took is taken like any other.
    assert.deepEqual(await al('jeton-a', { hastaId: h2, gun: yaz(CUMARTESI), saat: '10:15', sureDk: 30, yineDe: true }), { s: 409, j: { code: 'DOLU' } })
    // Inside the hours the mark is not set, whatever the request says.
    assert.equal((await al('jeton-a', { hastaId: h2, gun: yaz(PAZARTESI), saat: '09:00', sureDk: 30, yineDe: true })).j.randevu.mesaiDisi, false)
    // The account's OWN pattern decides, once it has one: Saturday mornings on, Monday off.
    await R.duzen.POST(istek('/api/ulke/calisma-duzeni', 'jeton-a', { gunler: [2, 3, 4, 5, 6], baslangic: '08:00', bitis: '12:00', sureDk: 30, molalar: [] }))
    assert.equal((await al('jeton-a', { hastaId: h2, gun: yaz(CUMARTESI), saat: '08:00', sureDk: 30 })).j.randevu.mesaiDisi, false)
    assert.deepEqual(await al('jeton-a', { hastaId: h2, gun: yaz(gunEkle(PAZARTESI, 7)), saat: '10:00', sureDk: 30 }), { s: 422, j: { code: 'MESAI_DISI' } })
    // Doctor B still works by the pack's pattern.
    assert.equal((await al('jeton-b', { hastaId: hb, gun: yaz(gunEkle(PAZARTESI, 7)), saat: '10:00', sureDk: 30 })).s, 200)
  })

  it('AROUND MIDNIGHT: an appointment at 00:15 belongs to that Tashkent day although its instant is the day before in UTC', async () => {
    const r = await al('jeton-a', { hastaId: h1, gun: yaz(SALI), saat: '00:15', sureDk: 30, yineDe: true })
    assert.equal(r.s, 200)
    assert.deepEqual([r.j.randevu.baslangic, r.j.randevu.gun, r.j.randevu.saat], [`${PAZARTESI}T19:15:00.000Z`, SALI, '00:15'])
    const gec = await al('jeton-a', { hastaId: h2, gun: yaz(SALI), saat: '23:45', sureDk: 30, yineDe: true })
    assert.deepEqual([gec.j.randevu.baslangic, gec.j.randevu.bitis, gec.j.randevu.gun], [`${SALI}T18:45:00.000Z`, `${SALI}T19:15:00.000Z`, SALI])
    const gunun = async (gun: string) => (await liste('jeton-a', `?gun=${gun}`)).j.randevular.map((x: Record<string, unknown>) => x.saat)
    assert.deepEqual(await gunun(SALI), ['00:15', '23:45'])
    assert.deepEqual(await gunun(PAZARTESI), [], 'the 00:15 appointment showed up on the UTC day')
    assert.deepEqual(await gunun(gunEkle(SALI, 1)), [])
    // The day typed in the pack's own pattern asks for the same list.
    assert.deepEqual((await liste('jeton-a', `?gun=${yaz(SALI)}`)).j.gunler, [SALI])
    // The week: Monday to Sunday of the country, in time order.
    const hafta = await liste('jeton-a', `?gun=${gunEkle(PAZARTESI, 3)}&gorunum=hafta`)
    assert.deepEqual(hafta.j.gunler, Array.from({ length: 7 }, (_, i) => gunEkle(PAZARTESI, i)))
    assert.deepEqual(hafta.j.randevular.map((x: Record<string, unknown>) => [x.gun, x.saat]), [[SALI, '00:15'], [SALI, '23:45']])
    assert.deepEqual(await liste('jeton-a', '?gun=31.02.2027'), { s: 400, j: { code: 'GECERSIZ', alan: 'gun' } })
    // "Today" is the country's today, whatever the server's clock says: at 20:00 UTC it is already tomorrow in Tashkent.
    const gece = Date.parse(`${PAZARTESI}T20:00:00Z`)
    assert.equal((await R.lib.randevuOlustur(vt.createClient() as never, A, { hastaId: h1, gun: PAZARTESI, saatDk: 600, sureDk: 30, yineDe: true, neden: '' }, gece) as { kod?: string }).kod, 'GECERSIZ', 'Monday is yesterday in Tashkent')
    assert.equal((await R.lib.randevuOlustur(vt.createClient() as never, A, { hastaId: h1, gun: SALI, saatDk: 600, sureDk: 30, yineDe: false, neden: '' }, gece)).tamam, true)
  })

  it('STATUS: planned → arrived → done; did not come and cancelled give the time back; done and cancelled are final', async () => {
    const id = (await al('jeton-a', { hastaId: h1, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 })).j.randevu.id as string
    const durum = async (d: string, kim = id) => { const r = await degistir('jeton-a', { id: kim, durum: d }); return r.s === 200 ? r.j.randevu.durum : r.j.code }
    assert.deepEqual([await durum('geldi'), await durum('planlandi'), await durum('geldi'), await durum('tamamlandi')], ['geldi', 'planlandi', 'geldi', 'tamamlandi'])
    // Done by hand, with no visit: it can be taken back to "arrived", and nowhere else.
    assert.deepEqual([await durum('iptal'), await durum('gelmedi'), await durum('planlandi'), await durum('geldi')], ['GECIS_YOK', 'GECIS_YOK', 'GECIS_YOK', 'geldi'])
    // Did not come: the time is free again.
    assert.equal(await durum('gelmedi'), 'gelmedi')
    const yerine = await al('jeton-a', { hastaId: h2, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 })
    assert.equal(yerine.s, 200)
    // The patient turns up after all, but the time now belongs to somebody else: "taken", and nothing changes.
    assert.deepEqual([await durum('geldi'), await durum('planlandi')], ['DOLU', 'DOLU'])
    assert.equal(satirlar().find((s) => s.id === id)!.durum, 'gelmedi')
    // Cancelled is final and frees the time.
    assert.equal(await durum('iptal'), 'iptal')
    for (const d of ['planlandi', 'geldi', 'tamamlandi', 'gelmedi', 'iptal']) assert.equal(await durum(d), 'GECIS_YOK', d)
    assert.equal(await durum('iptal', yerine.j.randevu.id), 'iptal')
    assert.equal((await al('jeton-a', { hastaId: h1, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 })).s, 200)
    // A status that does not exist, and an id that does not.
    assert.deepEqual(await degistir('jeton-a', { id, durum: 'kechikdi' }), { s: 400, j: { code: 'GECERSIZ', alan: 'durum' } })
    assert.deepEqual(await degistir('jeton-a', { id: YOK, durum: 'geldi' }), { s: 404, j: { code: 'NOT_FOUND' } })
    // Every status change carries the doctor and the statuses it is allowed from in the statement itself.
    for (const q of vt.sorgular.filter((x) => x.tablo === 'ulke_randevulari' && x.islem === 'update')) assert.ok(q.filtreler.includes(`doctor_id=eq.${A}`) && q.filtreler.some((f) => f.startsWith('durum=in.(')), JSON.stringify(q))
  })

  it('MOVING: to a free time; not onto another appointment; outside the hours only with "book anyway"; not a cancelled one', async () => {
    const id = (await al('jeton-a', { hastaId: h1, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30, neden: 'Nazorat' })).j.randevu.id as string
    const baska = (await al('jeton-a', { hastaId: h2, gun: yaz(SALI), saat: '11:00', sureDk: 30 })).j.randevu.id as string
    const t = await degistir('jeton-a', { id, gun: yaz(SALI), saat: '09:30', sureDk: 45 })
    assert.deepEqual([t.s, t.j.randevu.id, t.j.randevu.gun, t.j.randevu.saat, t.j.randevu.sureDk, t.j.randevu.neden, t.j.randevu.hastaAdi, t.j.randevu.durum], [200, id, SALI, '09:30', 45, 'Nazorat', 'QA Karimova Dilnoza', 'planlandi'])
    assert.equal(satirlar().length, 2, 'moving made a second row')
    // Its old time is free; its own present time does not stand in its own way (a longer length, a small shift).
    assert.equal((await degistir('jeton-a', { id, gun: yaz(SALI), saat: '09:45', sureDk: 60 })).s, 200)
    assert.deepEqual(await degistir('jeton-a', { id, gun: yaz(SALI), saat: '10:45', sureDk: 30 }), { s: 409, j: { code: 'DOLU' } })
    assert.deepEqual(await degistir('jeton-a', { id, gun: yaz(SALI), saat: '10:45', sureDk: 30, yineDe: true }), { s: 409, j: { code: 'DOLU' } })
    assert.deepEqual(await degistir('jeton-a', { id, gun: yaz(SALI), saat: '19:00', sureDk: 30 }), { s: 422, j: { code: 'MESAI_DISI' } })
    assert.equal(satirlar().find((s) => s.id === id)!.baslangic, an(SALI, '09:45'), 'a refused move changed the appointment')
    const dis = await degistir('jeton-a', { id, gun: yaz(SALI), saat: '19:00', sureDk: 30, yineDe: true })
    assert.deepEqual([dis.s, dis.j.randevu.mesaiDisi], [200, true])
    assert.deepEqual(await degistir('jeton-a', { id, gun: '40.01.2027', saat: '10:00', sureDk: 30 }), { s: 400, j: { code: 'GECERSIZ', alan: 'gun' } })
    await degistir('jeton-a', { id: baska, durum: 'iptal' })
    assert.deepEqual(await degistir('jeton-a', { id: baska, gun: yaz(SALI), saat: '15:00', sureDk: 30 }), { s: 409, j: { code: 'GECIS_YOK' } })
  })
})

describe('Uzbekistan appointments: from appointment to visit, and the home', () => {
  let h1 = '', h2 = '', hb = ''
  beforeEach(async () => { sifirla(); R.devreSifirla(); h1 = await hastaEkle('jeton-a', 'QA Karimova Dilnoza'); h2 = await hastaEkle('jeton-a', 'QA Yusupov Sardor', 'ru'); hb = await hastaEkle('jeton-b', 'QA Тестовый Пациент', 'ru') })
  const muayene = async (jeton: string, doktor: string, hastaId: string, randevuId?: unknown) => {
    vt.depo.set(`muayene-sesleri/uz/${doktor}/k.webm`, new Blob(['sentetik ses']))
    return oku(await R.muayene.POST(istek('/api/ulke/muayene', jeton, { yol: `uz/${doktor}/k.webm`, hastaId, sablon: 'pediatri', riza: true, ...(randevuId === undefined ? {} : { randevuId }) })))
  }
  const sessiz = async <T>(is: () => Promise<T>): Promise<T> => {
    const e = console.error, w = console.warn, l = console.log
    console.error = console.warn = console.log = () => {}
    try { return await is() } finally { console.error = e; console.warn = w; console.log = l }
  }
  const bugunSaat = (dk: number) => { const d = yerelAn(Date.now(), DILIM).dakika; return Math.min(1425, Math.max(0, Math.floor(d / 5) * 5 + dk)) }
  /** An appointment today, written straight into the table (today's hours may be over; the rules are tested above). */
  const bugunRandevu = (doktor: string, hasta: string, basDk: number, durum = 'planlandi') => {
    const id = `50000000-0000-4000-8000-${String(satirlar().length + 1).padStart(12, '0')}`
    satirlar().push({ ulke: 'uz', id, doctor_id: doktor, patient_id: hasta, baslangic: new Date(yerelUtc(BUGUN, basDk, DILIM)).toISOString(), bitis: new Date(yerelUtc(BUGUN, basDk + 15, DILIM)).toISOString(), neden_encrypted: null, durum, mesai_disi: false, session_id: null })
    return id
  }

  it('"start the visit" from an appointment: the visit is linked to it and the patient has arrived; approving the note marks it done', async () => {
    const id = bugunRandevu(A, h1, 600)
    const m = await muayene('jeton-a', A, h1, id)
    assert.deepEqual([m.s, m.j.randevuBagli], [200, true])
    assert.deepEqual([satirlar()[0].session_id, satirlar()[0].durum], [m.j.seansId, 'geldi'])
    assert.equal((await getir('jeton-a', id)).j.randevu.seansId, m.j.seansId)
    // The link is one statement that carries doctor, patient, "no visit yet" and a status a visit can start from.
    const bag = vt.sorgular.filter((q) => q.tablo === 'ulke_randevulari' && q.islem === 'update')
    assert.deepEqual(bag.map((q) => q.filtreler), [['ulke=eq.uz', `id=eq.${id}`, `doctor_id=eq.${A}`, `patient_id=eq.${h1}`, 'session_id=is.null', 'durum=in.(planlandi,geldi)']])
    // The note is written and saved as a draft: the appointment has not changed.
    const notId = (await sessiz(async () => oku(await R.not.POST(istek('/api/ulke/not', 'jeton-a', { seansId: m.j.seansId }))))).j.notId as string
    assert.equal(satirlar()[0].durum, 'geldi')
    // Approved: done — in the same transaction as the approval.
    vt.sorgular.length = 0
    assert.equal((await oku(await R.onayla.POST(istek('/api/ulke/not/onayla', 'jeton-a', { notId, dil: 'uz-Latn', ...UZ_NOT })))).s, 200)
    assert.equal(satirlar()[0].durum, 'tamamlandi')
    assert.deepEqual(vt.sorgular.filter((q) => q.islem !== 'select').map((q) => q.tablo), ['rpc:ulke_not_onayla'])
    // A finished appointment with its visit cannot be reopened by hand.
    for (const d of ['geldi', 'planlandi', 'iptal', 'gelmedi']) assert.deepEqual(await degistir('jeton-a', { id, durum: d }), { s: 409, j: { code: 'GECIS_YOK' } }, d)
  })

  it('ALL OR NOTHING reaches the appointment: if "done" cannot be written, the note is not approved either', async () => {
    const id = bugunRandevu(A, h1, 600)
    const m = await muayene('jeton-a', A, h1, id)
    const notId = (await sessiz(async () => oku(await R.not.POST(istek('/api/ulke/not', 'jeton-a', { seansId: m.j.seansId }))))).j.notId as string
    const once = JSON.stringify([vt.tablo('ulke_notlar'), vt.tablo('not_dil_kaydi'), satirlar()])
    vt.boz.yaz.add('ulke_randevulari')
    assert.deepEqual(await oku(await R.onayla.POST(istek('/api/ulke/not/onayla', 'jeton-a', { notId, dil: 'uz-Latn', ...UZ_NOT, a: 'EKRANDAGI' }))), { s: 500, j: { code: 'BASARISIZ' } })
    vt.boz.yaz.clear()
    assert.equal(JSON.stringify([vt.tablo('ulke_notlar'), vt.tablo('not_dil_kaydi'), satirlar()]), once)
    assert.deepEqual([vt.tablo('ulke_notlar')[0].approved_at ?? null, satirlar()[0].durum], [null, 'geldi'])
  })

  it('a visit without an appointment is as before; an appointment that was cancelled meanwhile does not cost the recording', async () => {
    const duz = await muayene('jeton-a', A, h1)
    assert.deepEqual([duz.s, duz.j.randevuBagli], [200, false])
    const iptal = bugunRandevu(A, h1, 660, 'iptal')
    const m = await muayene('jeton-a', A, h1, iptal)
    assert.deepEqual([m.s, m.j.randevuBagli, satirlar()[0].session_id, satirlar()[0].durum], [200, false, null, 'iptal'])
    assert.equal(vt.tablo('ulke_muayeneler').length, 2, 'the visit itself is kept')
    // One appointment, one visit: a second recording "from" the same appointment is stored but not linked.
    const id = bugunRandevu(A, h2, 720)
    const ilk = await muayene('jeton-a', A, h2, id)
    const ikinci = await muayene('jeton-a', A, h2, id)
    assert.deepEqual([ilk.j.randevuBagli, ikinci.j.randevuBagli, satirlar()[1].session_id], [true, false, ilk.j.seansId])
  })

  it('ISOLATION of the link: another doctor\'s appointment, another patient\'s, a made-up or malformed id — all "not found", before the recording is read', async () => {
    const benim = bugunRandevu(A, h1, 600)
    const onun = bugunRandevu(B, hb, 600)
    for (const [ad, hasta, randevu] of [['another doctor\'s appointment', h1, onun], ['my appointment, for another patient of mine', h2, benim], ['an id that does not exist', h1, YOK], ['a malformed id', h1, 'abc'], ['not a string', h1, 42]] as const) {
      vt.sorgular.length = 0
      assert.deepEqual(await muayene('jeton-a', A, hasta, randevu), { s: 404, j: { code: 'NOT_FOUND' } }, ad)
      assert.deepEqual(vt.tablo('ulke_muayeneler'), [], ad)
      assert.equal(vt.depo.size, 0, `${ad}: the recording was left in storage`)
      assert.equal(vt.sorgular.some((q) => q.tablo === 'ulke_kullanim'), false, `${ad}: got as far as the day's counter`)
    }
    assert.deepEqual(satirlar().map((s) => [s.session_id, s.durum]), [[null, 'planlandi'], [null, 'planlandi']])
  })

  it('THE HOME: today\'s appointments in time order, with status; another doctor\'s are not there', async () => {
    const t0 = bugunSaat(0) >= 60 ? 30 : 600
    const ogle = bugunRandevu(A, h2, t0 + 300, 'geldi')
    const sabah = bugunRandevu(A, h1, t0)
    const iptal = bugunRandevu(A, h1, t0 + 120, 'iptal')
    bugunRandevu(B, hb, t0)
    // Yesterday's and tomorrow's are not today's.
    satirlar().push({ ulke: 'uz', id: '50000000-0000-4000-8000-0000000000f1', doctor_id: A, patient_id: h1, baslangic: new Date(yerelUtc(gunEkle(BUGUN, 1), 5, DILIM)).toISOString(), bitis: new Date(yerelUtc(gunEkle(BUGUN, 1), 20, DILIM)).toISOString(), durum: 'planlandi', neden_encrypted: null, mesai_disi: true, session_id: null })
    satirlar().push({ ulke: 'uz', id: '50000000-0000-4000-8000-0000000000f2', doctor_id: A, patient_id: h1, baslangic: new Date(yerelUtc(gunEkle(BUGUN, -1), 1430, DILIM)).toISOString(), bitis: new Date(yerelUtc(gunEkle(BUGUN, -1), 1439, DILIM)).toISOString(), durum: 'gelmedi', neden_encrypted: null, mesai_disi: true, session_id: null })
    const r = await oku(await R.bugun.GET(istek('/api/ulke/bugun', 'jeton-a')))
    assert.equal(r.s, 200)
    assert.deepEqual(r.j.randevular.map((x: Record<string, unknown>) => [x.id, x.hastaAdi, x.durum, x.gun]), [[sabah, 'QA Karimova Dilnoza', 'planlandi', BUGUN], [iptal, 'QA Karimova Dilnoza', 'iptal', BUGUN], [ogle, 'QA Yusupov Sardor', 'geldi', BUGUN]])
    assert.deepEqual(r.j.muayeneler, [])
    const rb = await oku(await R.bugun.GET(istek('/api/ulke/bugun', 'jeton-b')))
    assert.deepEqual(rb.j.randevular.map((x: Record<string, unknown>) => x.hastaAdi), ['QA Тестовый Пациент'])
  })
})

describe('Uzbekistan appointments: ISOLATION between two doctors, both directions', () => {
  beforeEach(sifirla)
  const TARAFLAR = [
    { ad: 'A → B', ben: 'jeton-a', benId: A, o: 'jeton-b', oId: B },
    { ad: 'B → A', ben: 'jeton-b', benId: B, o: 'jeton-a', oId: A },
  ] as const

  for (const t of TARAFLAR) {
    it(`${t.ad}: the other doctor's appointment answers exactly like one that does not exist — read, status, move, list, booking`, async () => {
      const benimHasta = await hastaEkle(t.ben, 'QA Oʻzimning Bemorim')
      const onunHasta = await hastaEkle(t.o, 'QA GIZLI-BEMOR-7Q')
      const onun = (await al(t.o, { hastaId: onunHasta, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30, neden: 'GIZLI-SABAB-7Q' })).j.randevu.id as string
      const once = JSON.stringify(satirlar())
      const yok = { s: 404, j: { code: 'NOT_FOUND' } }
      // Positive control: the owner reaches it — the harness really runs the routes.
      assert.equal((await getir(t.o, onun)).j.randevu.neden, 'GIZLI-SABAB-7Q')
      // Read, every status, a move: byte for byte the answer of an id that does not exist.
      assert.deepEqual(await getir(t.ben, onun), yok); assert.deepEqual(await getir(t.ben, YOK), yok)
      for (const d of ['geldi', 'tamamlandi', 'gelmedi', 'iptal', 'planlandi']) { assert.deepEqual(await degistir(t.ben, { id: onun, durum: d }), yok, d); assert.deepEqual(await degistir(t.ben, { id: YOK, durum: d }), yok, d) }
      for (const g of [{ gun: yaz(SALI), saat: '11:00', sureDk: 30 }, { gun: yaz(SALI), saat: '03:00', sureDk: 30 }, { gun: yaz(SALI), saat: '03:00', sureDk: 30, yineDe: true }, { gun: 'x', saat: 'x', sureDk: 1 }]) {
        assert.deepEqual(await degistir(t.ben, { id: onun, ...g }), yok, JSON.stringify(g)); assert.deepEqual(await degistir(t.ben, { id: YOK, ...g }), yok, JSON.stringify(g))
      }
      // Booking the other doctor's patient: "no such patient", whatever else the request says — and the same for a made-up patient.
      for (const g of [{ saat: '15:00' }, { saat: '10:00' }, { saat: '03:00' }, { saat: 'x' }]) {
        assert.deepEqual(await al(t.ben, { hastaId: onunHasta, gun: yaz(PAZARTESI), sureDk: 30, ...g }), yok, JSON.stringify(g)); assert.deepEqual(await al(t.ben, { hastaId: YOK, gun: yaz(PAZARTESI), sureDk: 30, ...g }), yok, JSON.stringify(g))
      }
      assert.deepEqual(await liste(t.ben, `?hasta=${onunHasta}`), yok); assert.deepEqual(await liste(t.ben, `?hasta=${YOK}`), yok); assert.deepEqual(await liste(t.ben, '?hasta=abc'), yok)
      assert.equal(JSON.stringify(satirlar()), once, 'a row of the other doctor changed')
      // Lists: mine are mine. The other doctor's time does not even block mine (no hint that it is taken).
      const benim = await al(t.ben, { hastaId: benimHasta, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 })
      assert.equal(benim.s, 200)
      for (const sorgu of [`?gun=${PAZARTESI}`, `?gun=${PAZARTESI}&gorunum=hafta`, `?hasta=${benimHasta}`]) {
        const l = await liste(t.ben, sorgu)
        assert.deepEqual(l.j.randevular.map((x: Record<string, unknown>) => x.id), [benim.j.randevu.id], sorgu)
        assert.ok(!JSON.stringify(l.j).includes('GIZLI'), sorgu)
      }
      // A row that points at the other doctor's patient (left by some fault) shows no name and no language.
      satirlar().push({ ulke: 'uz', id: '50000000-0000-4000-8000-0000000000aa', doctor_id: t.benId, patient_id: onunHasta, baslangic: an(SALI, '09:00'), bitis: an(SALI, '09:30'), durum: 'planlandi', neden_encrypted: null, mesai_disi: false, session_id: null })
      const kirli = await getir(t.ben, '50000000-0000-4000-8000-0000000000aa')
      assert.deepEqual([kirli.j.randevu.hastaAdi, kirli.j.randevu.hastaDili], ['', ''])
      assert.ok(!JSON.stringify((await liste(t.ben, `?gun=${SALI}`)).j).includes('GIZLI'))
      // Every statement on the appointment table carried the caller's own id; none carried the other doctor's.
      const sorgular = vt.sorgular.filter((q) => q.tablo === 'ulke_randevulari' && q.islem !== 'insert')
      assert.ok(sorgular.length > 20)
      for (const q of sorgular) assert.ok(q.filtreler.some((f) => f === `doctor_id=eq.${A}` || f === `doctor_id=eq.${B}`), `a statement without the doctor's id: ${JSON.stringify(q)}`)
    })
  }

  it('no session and another country\'s account get the same refusal on every appointment route; ids are checked before the database', async () => {
    const h = await hastaEkle('jeton-a', 'QA Karimova Dilnoza')
    const id = (await al('jeton-a', { hastaId: h, gun: yaz(PAZARTESI), saat: '10:00', sureDk: 30 })).j.randevu.id as string
    const red = { s: 401, j: { code: 'OTURUM_YOK' } }
    for (const j of [undefined, 'jeton-tr', 'yok']) {
      assert.deepEqual(await al(j, { hastaId: h, gun: yaz(PAZARTESI), saat: '11:00', sureDk: 30 }), red); assert.deepEqual(await getir(j, id), red)
      assert.deepEqual(await degistir(j, { id, durum: 'iptal' }), red); assert.deepEqual(await liste(j, ''), red); assert.deepEqual(await liste(j, `?hasta=${h}`), red)
    }
    vt.sorgular.length = 0
    for (const kotu of ['abc', '', '1 or 1=1', `${id}'`]) { assert.equal((await getir('jeton-a', kotu)).s, 404); assert.equal((await degistir('jeton-a', { id: kotu, durum: 'iptal' })).s, 404); assert.equal((await al('jeton-a', { hastaId: kotu, gun: yaz(PAZARTESI), saat: '11:00', sureDk: 30 })).s, 404) }
    assert.deepEqual(vt.sorgular.filter((q) => q.tablo === 'ulke_randevulari'), [], 'a malformed id reached the database')
    assert.equal(satirlar()[0].durum, 'planlandi')
  })

  it('the migration: both tables have row-level security in the file that creates them, and the double-booking constraint is the database\'s', () => {
    const sql = readFileSync(join(KOK, 'lib/db/migrations/135_ulke_randevu.sql'), 'utf8')
    for (const t of ['hekim_calisma_duzeni', 'ulke_randevulari']) {
      assert.ok(sql.includes(`create table if not exists public.${t}`) && sql.includes(`alter table public.${t} enable row level security`), t)
      assert.ok(sql.includes(`revoke all on table public.${t} from anon, authenticated`), t)
    }
    assert.match(sql, /exclude using gist \(doctor_id with =, tstzrange\(baslangic, bitis, '\[\)'\) with &&\)\s+where \(durum in \('planlandi', 'geldi', 'tamamlandi'\)\)/)
    assert.match(sql, /create policy "hasta_izolasyon_hasta_sahipligi" on public\.ulke_randevulari as restrictive/)
    // Same list in the application and in the stand-in that plays the constraint.
    assert.deepEqual([...R.lib.YER_TUTAN_DURUMLAR], ['planlandi', 'geldi', 'tamamlandi'])
    // New objects only: the migration alters no table of the pre-split application.
    assert.deepEqual([...sql.replace(/--[^\n]*/g, '').matchAll(/alter table public\.(\w+)/g)].map((m) => m[1]).filter((t) => !['hekim_calisma_duzeni', 'ulke_randevulari'].includes(t)), [])
    assert.doesNotMatch(sql.replace(/--[^\n]*/g, ''), /\b(randevular|doktor_calisma_saatleri)\b/)
  })
})

// ───────────────────────── text, reminder and screens in the three forms ─────────────────────────

import React from 'react'
import { existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin } from '@/lib/ulke/testing/sizintiTarayici'

const FORMLAR = ['uz-Latn', 'uz-Cyrl', 'ru'] as const
type Form = (typeof FORMLAR)[number]
const ON_EK = '/uzbek'
/** Addresses of the pre-split application that must never appear on a screen of this build. */
const TURKCE_ADRES = /\/(giris|kayit|dashboard|doktor|doktor-tools|onboarding|asistan|portal|klinik|kvkk|session|intake|randevu)(\/|"|\?|$)/
let ACIK_SAYFALAR: readonly string[] = []
/** Leak test, no Turkish letter, and EVERY LINK LEADS TO A REAL PAGE: under /uzbek, and a page the pack lists. */
const ekranTemiz = (html: string, kaynak: string) => {
  temiz(html, kaynak); temiz(gorunurMetin(html), `${kaynak} (visible text)`)
  assert.doesNotMatch(html, /[çğıİşĞŞ]/, `${kaynak}: a Turkish letter`)
  let baglanti = 0
  for (const m of html.matchAll(/(?:href|action)="([^"]+)"/g)) {
    if (m[1].startsWith('https://fonts.googleapis.com/')) continue
    baglanti++
    assert.doesNotMatch(m[1], TURKCE_ADRES, `${kaynak}: links to a page of the pre-split application: ${m[1]}`)
    const adres = m[1].split('?')[0]
    assert.ok(adres === ON_EK || adres.startsWith(`${ON_EK}/`), `${kaynak}: "${m[1]}" is outside ${ON_EK}`)
    const yol = adres.slice(ON_EK.length) || '/'
    assert.ok(ACIK_SAYFALAR.includes(yol), `${kaynak}: links to ${m[1]}, which is not a page of this build (${ACIK_SAYFALAR.join(' ')})`)
    assert.ok(existsSync(join(KOK, 'app', yol === '/' ? '' : yol.slice(1), 'page.ulke.tsx')), `${kaynak}: ${m[1]} has no route file`)
  }
  assert.ok(baglanti > 0, `${kaynak}: no link was checked`)
}
function yaprak(o: unknown, on = ''): [string, string][] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : yaprak(v, `${on}${k}.`)))
}
const href = (yol: string) => `href="${yol.replace(/&/g, '&amp;')}"`

describe('Uzbekistan appointments: text, reminder and screens in the three forms', () => {
  let M: typeof import('./metinler')
  let RM: typeof import('./randevuMetinleri')
  let H: typeof import('@/lib/ulke/arayuz/hatirlatma')
  let T: typeof import('@/components/ulke/uygulama/Takvim')
  let Kabuk: typeof import('@/components/ulke/uygulama/Kabuk')
  let Bugun: typeof import('@/components/ulke/uygulama/Bugun')
  let Hastalar: typeof import('@/components/ulke/uygulama/Hastalar')
  let Muayene: typeof import('@/components/ulke/uygulama/Muayene')
  before(async () => {
    M = await import('./metinler'); RM = await import('./randevuMetinleri'); H = await import('@/lib/ulke/arayuz/hatirlatma')
    T = await import('@/components/ulke/uygulama/Takvim'); Kabuk = await import('@/components/ulke/uygulama/Kabuk'); Bugun = await import('@/components/ulke/uygulama/Bugun'); Hastalar = await import('@/components/ulke/uygulama/Hastalar'); Muayene = await import('@/components/ulke/uygulama/Muayene')
    const izin = (await import('@/lib/ulke/ulke')).ulkePaketi().rotalar
    assert.notEqual(izin, 'hepsi')
    if (izin !== 'hepsi') ACIK_SAYFALAR = izin.sayfalar
  })
  const cerceve = (f: Form, aktif: 'bugun' | 'takvim' | 'hastalar', ic: React.ReactNode) => renderToStaticMarkup(React.createElement(Kabuk.Cerceve, { dil: f, m: M.uygulamaMetni(f), ad: 'QA Shifokor', aktif, cikis: () => {}, children: ic }))
  const bos = () => {}
  const HASTA = { id: 'aaaaaaaa-0000-4000-8000-000000000001', ad: 'QA Karimova Dilnoza', otaIsmi: 'Rustamovna', dogumTarihi: '2021-03-07', cinsiyet: 'female' as const, telefon: '+998 90 000 00 01', dil: 'uz', ulusalKimlik: '' }
  const DUZEN = { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '18:00', sureDk: 30, molalar: [{ baslangic: '13:00', bitis: '14:00' }] }
  // 2026-10-12 is a Monday.
  const PZT = '2026-10-12'
  const randevu = (id: string, gun: string, saat: string, durum: string, ek: Record<string, unknown> = {}) => ({ id, hastaId: HASTA.id, hastaAdi: 'QA Karimova Dilnoza', baslangic: `${gun}T00:00:00.000Z`, bitis: `${gun}T00:30:00.000Z`, gun, saat, sureDk: 30, neden: '', durum, mesaiDisi: false, seansId: null, ...ek }) as import('@/components/ulke/uygulama/Takvim').RandevuKaydi

  it('the catalogue says, at its top, that it is machine-written, that the reminder is patient-facing, and that it awaits native review', () => {
    const bas = readFileSync(join(KOK, 'countries/uz/uygulama/randevuMetinleri.ts'), 'utf8').slice(0, 1600)
    assert.match(bas, /MACHINE-WRITTEN\. AWAITS NATIVE REVIEW\./); assert.match(bas, /PATIENT-FACING/)
  })

  it('LEAK TEST over every new string, in all three forms: same keys, nothing empty, each form in its own script, no Turkish word or letter', () => {
    const [lat, kir, ru] = FORMLAR.map((f) => yaprak(RM.UZ_RANDEVU_METINLERI[f]))
    assert.ok(lat.length >= 110, `only ${lat.length} strings`)
    assert.deepEqual(kir.map((x) => x[0]), lat.map((x) => x[0])); assert.deepEqual(ru.map((x) => x[0]), lat.map((x) => x[0]))
    for (let i = 0; i < lat.length; i++) {
      const k = lat[i][0]
      for (const [f, v] of [['uz-Latn', lat[i][1]], ['uz-Cyrl', kir[i][1]], ['ru', ru[i][1]]] as const) {
        assert.ok(v.trim().length > 0, `${f}/${k} is empty`)
        temiz(v, `${f}/${k}`)
        assert.doesNotMatch(v, /[çğıİşĞŞöüÖÜâîû]/, `${f}/${k} has a Turkish letter`)
        assert.doesNotMatch(v, /'|`/, `${f}/${k}: a typewriter apostrophe (Uzbek Latin uses ʻ and ʼ)`)
      }
      assert.doesNotMatch(lat[i][1], /[Ѐ-ӿ]/, `uz-Latn/${k} has a Cyrillic letter`)
      assert.doesNotMatch(kir[i][1], /[A-Za-z]/, `uz-Cyrl/${k} has a Latin letter`)
      assert.doesNotMatch(ru[i][1], /[A-Za-zўқғҳЎҚҒҲ]/, `ru/${k} has a Latin or Uzbek-only letter`)
      // The three forms really are three texts: Cyrillic Uzbek is not the Russian line, nor the Latin one.
      if (kir[i][1].length > 12) assert.notEqual(kir[i][1], ru[i][1], `${k}: uz-Cyrl and ru are the same sentence`)
    }
    for (const f of FORMLAR) {
      const h = RM.UZ_RANDEVU_METINLERI[f].hatirlatma
      assert.deepEqual([...h.metin.matchAll(/%\d/g)].map((x) => x[0]).sort(), ['%1', '%2', '%3'], f)
      assert.deepEqual([...h.metinAdsiz.matchAll(/%\d/g)].map((x) => x[0]).sort(), ['%1', '%2'], f)
      assert.equal(RM.randevuMetninDili(RM.randevuMetni(f)), f)
      assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((g) => RM.gunAdi(RM.randevuMetni(f), g)).filter(Boolean).length, 7)
    }
    assert.equal(RM.randevuMetni('tr'), RM.UZ_RANDEVU_METINLERI['uz-Latn'], 'an unknown form must fall to Uzbek Latin, never to another country')
  })

  it('REMINDER TEXT in each language: the patient\'s language, the doctor\'s script, the pack\'s date and time, the doctor\'s name — and no Turkish word', async () => {
    const { ulkePaketi } = await import('@/lib/ulke/ulke')
    assert.equal(H.tarihDeseni(), ulkePaketi().bicim.tarihDeseni)
    const hekim = (dil: Form, notDili: Form, ad = 'Karimov Alisher') => ({ dil, notDili, ad })
    const yap = (hastaDili: string, h: ReturnType<typeof hekim>) => H.hatirlatmaMetni({ hastaDili, hekim: h, gun: '2026-10-09', saat: '14:30' })
    assert.deepEqual(yap('uz', hekim('uz-Latn', 'uz-Latn')), { dil: 'uz-Latn', metin: 'Assalomu alaykum! Eslatma: siz 09.10.2026 kuni soat 14:30 da shifokor Karimov Alisher qabuliga yozilgansiz.' })
    assert.deepEqual(yap('uz', hekim('uz-Cyrl', 'uz-Cyrl', 'Каримов Алишер')), { dil: 'uz-Cyrl', metin: 'Ассалому алайкум! Эслатма: сиз 09.10.2026 куни соат 14:30 да шифокор Каримов Алишер қабулига ёзилгансиз.' })
    assert.deepEqual(yap('ru', hekim('uz-Latn', 'uz-Latn', 'Каримов Алишер')), { dil: 'ru', metin: 'Здравствуйте! Напоминаем: вы записаны на приём к врачу Каримов Алишер 09.10.2026 в 14:30.' })
    // The PATIENT's language decides, not the doctor's: a Russian-speaking patient of an Uzbek-reading doctor, and the reverse.
    for (const d of FORMLAR) for (const n of FORMLAR) assert.equal(yap('ru', hekim(d, n)).dil, 'ru', `${d}/${n}`)
    // Uzbek for the patient → the DOCTOR's script: of the interface if that is Uzbek, else of the notes, else Latin.
    assert.deepEqual([yap('uz', hekim('uz-Cyrl', 'ru')).dil, yap('uz', hekim('uz-Latn', 'uz-Cyrl')).dil, yap('uz', hekim('ru', 'uz-Cyrl')).dil, yap('uz', hekim('ru', 'uz-Latn')).dil, yap('uz', hekim('ru', 'ru')).dil], ['uz-Cyrl', 'uz-Latn', 'uz-Cyrl', 'uz-Latn', 'uz-Latn'])
    // A patient whose language was not recorded gets the doctor's own form.
    assert.deepEqual([yap('', hekim('ru', 'uz-Latn')).dil, yap('', hekim('uz-Cyrl', 'ru')).dil, yap('kk', hekim('uz-Latn', 'ru')).dil], ['ru', 'uz-Cyrl', 'uz-Latn'])
    for (const hd of ['uz', 'ru', '']) for (const d of FORMLAR) for (const n of FORMLAR) {
      const { dil, metin } = yap(hd, hekim(d, n, 'QA Shifokor'))
      const ad = `${hd || '-'}/${d}/${n}`
      assert.ok(metin.includes('09.10.2026') && metin.includes('14:30') && metin.includes('QA Shifokor'), ad)
      assert.ok(metin.length < 160, `${ad}: not short (${metin.length})`)
      assert.doesNotMatch(metin, /%\d/, `${ad}: a placeholder is left`)
      temiz(metin, `reminder ${ad}`); assert.doesNotMatch(metin, /[çğıİşĞŞöüÖÜ]/, `${ad}: a Turkish letter`)
      assert.doesNotMatch(metin, /\b(randevu|hatırlatma|hatirlatma|sayın|sayin|merhaba|doktor|saat:|tarih)\b/i, `${ad}: a Turkish word`)
      // Apart from the doctor's name, the text is in the script of its form.
      const adsiz = metin.replace('QA Shifokor', '')
      if (dil === 'uz-Latn') assert.doesNotMatch(adsiz, /[Ѐ-ӿ]/, ad); else assert.doesNotMatch(adsiz, /[A-Za-z]/, ad)
      if (dil === 'ru') assert.doesNotMatch(adsiz, /[ўқғҳЎҚҒҲ]/, ad)
    }
    // 24-hour clock, digits only, never a month name, never the browser's or the server's pattern.
    assert.ok(yap('ru', hekim('ru', 'ru')).metin.includes('09.10.2026 в 14:30'))
    assert.ok(H.hatirlatmaMetni({ hastaDili: 'uz', hekim: hekim('uz-Latn', 'uz-Latn'), gun: '2027-01-02', saat: '00:15' }).metin.includes('02.01.2027 kuni soat 00:15'))
    // No name on the account: the sentence without one, not a hole. A name that looks like a placeholder stays a name.
    assert.equal(yap('ru', hekim('ru', 'ru', '  ')).metin, 'Здравствуйте! Напоминаем: вы записаны на приём к врачу 09.10.2026 в 14:30.')
    assert.ok(yap('uz', hekim('uz-Latn', 'uz-Latn', 'Dr %1 %2')).metin.includes('shifokor Dr %1 %2 qabuliga'))
    // A day or time that cannot be written gives no text at all.
    assert.equal(H.hatirlatmaMetni({ hastaDili: 'uz', hekim: hekim('uz-Latn', 'uz-Latn'), gun: '2026-13-40', saat: '14:30' }).metin, '')
    assert.equal(H.hatirlatmaMetni({ hastaDili: 'uz', hekim: hekim('uz-Latn', 'uz-Latn'), gun: '2026-10-09', saat: '2 pm' }).metin, '')
  })

  it('NOTHING IS SENT: the reminder is a string; no messaging route, provider or automatic sender exists in this build', async () => {
    const kod = (d: string) => readFileSync(join(KOK, d), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    assert.doesNotMatch(kod('lib/ulke/arayuz/hatirlatma.ts'), /fetch\(|api\(|supabase|iletisim|whatsapp|telegram|sms|eposta|mailto/i)
    // On the screen the only thing the button does with the text is put it on the clipboard.
    // (NOTYA-ULKE-PORTAL-01: the clipboard helper moved to ./pano.ts, shared with the card that shows a patient's link and PIN.)
    const takvim = kod('components/ulke/uygulama/Takvim.tsx')
    const pano = kod('components/ulke/uygulama/pano.ts')
    assert.match(takvim, /panoyaKopyala\(metin\)/)
    assert.match(pano, /navigator\.clipboard\.writeText\(metin\)/)
    assert.doesNotMatch(pano, /fetch\(|XMLHttpRequest|sendBeacon|api\(/, 'the clipboard helper sends nothing anywhere')
    assert.doesNotMatch(takvim + pano, /whatsapp|telegram|wa\.me|t\.me|sms:|mailto:|tel:/i)
    const { ulkePaketi } = await import('@/lib/ulke/ulke')
    const izin = ulkePaketi().rotalar
    if (izin !== 'hepsi') assert.deepEqual(izin.apiOnEkleri, ['/api/ulke/'])
    for (const d of ['hatirlatma', 'iletisim', 'mesaj', 'cron', 'randevu/hatirlatma']) assert.equal(existsSync(join(KOK, 'app/api/ulke', d)), false, `app/api/ulke/${d} exists`)
    // Not built, and not half-built either: no calendar sync.
    for (const d of ['google', 'takvim-esitleme']) assert.equal(existsSync(join(KOK, 'app/api/ulke', d)), false, `app/api/ulke/${d} exists`)
    // Since NOTYA-ULKE-KLINIK-01 a clinic has a schedule of its own (app/api/ulke/klinik/takvim: when each member has
    // an appointment, with nothing of any patient). It is read-only and sends nothing either, like everything here.
    assert.doesNotMatch(kod('lib/ulke/klinikHesabi/onBuro.ts') + kod('lib/ulke/klinikHesabi/klinik.ts') + kod('lib/ulke/klinikHesabi/yetki.ts') + kod('lib/ulke/klinikHesabi/paylasim.ts'), /fetch\(|sendBeacon|whatsapp|telegram|sms:|mailto:|googleapis/i, 'clinic accounts send nothing to anybody')
    assert.doesNotMatch(kod('lib/ulke/uygulama/randevular.ts') + takvim, /google|googleapis|ics\b/i)
    // NOTYA-ULKE-PORTAL-01: the patient portal exists since 2026-10-09. A patient still BOOKS NOTHING: the one thing a
    // portal session may write is a REQUEST, which holds no time; only the doctor's acceptance writes an appointment
    // (lib/ulke/portal/portal.paket.test.ts, section E). No patient route names the appointment table or a booking function.
    for (const f of ['route.ulke.ts', 'giris/route.ulke.ts', 'cikis/route.ulke.ts', 'randevu-istegi/route.ulke.ts']) assert.doesNotMatch(kod(`app/api/ulke/portal/${f}`), /randevuOlustur|randevuTasi|randevuDurumDegistir|istekKabul|ulke_randevulari/, `app/api/ulke/portal/${f} can book`)
  })

  it('the calendar screen exists: route file, pack list, screen — and the shell links to it in the account\'s form', async () => {
    const { UYGULAMA_EKRAN_BILESENLERI: UZ_UYGULAMA } = await import('@/components/ulke/uygulama')
    assert.ok(ACIK_SAYFALAR.includes('/calendar') && existsSync(join(KOK, 'app/calendar/page.ulke.tsx')) && UZ_UYGULAMA.takvim === T.default)
    assert.deepEqual([Kabuk.YOL.takvim, Kabuk.HAZIR.takvim], ['/uzbek/calendar', true])
    for (const f of FORMLAR) {
      const html = cerceve(f, 'takvim', React.createElement('p', null, 'x'))
      assert.match(html, new RegExp(`<a href="/uzbek/calendar" class="uza-sekme" aria-current="page">${RM.randevuMetni(f).kabuk.takvim}</a>`))
      ekranTemiz(html, `shell (${f})`)
    }
  })

  it('the rows of a day: appointments, breaks and the free times of the working pattern — a taken time is not offered, a cancelled one is', () => {
    const r = [randevu('r1', PZT, '10:00', 'planlandi'), randevu('r2', PZT, '11:00', 'iptal'), randevu('r3', PZT, '11:30', 'gelmedi'), randevu('r4', PZT, '15:10', 'geldi', { sureDk: 20 }), randevu('r5', '2026-10-13', '09:00', 'planlandi')]
    const s = T.gunSatirlari(DUZEN, PZT, r)
    const bosSaatler = s.filter((x) => x.tur === 'bos').map((x) => (x as { saat: string }).saat)
    assert.deepEqual(bosSaatler, ['09:00', '09:30', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:30', '16:00', '16:30', '17:00', '17:30'])
    assert.deepEqual(s.filter((x) => x.tur === 'randevu').map((x) => (x as { randevu: { id: string } }).randevu.id), ['r1', 'r2', 'r3', 'r4'])
    assert.deepEqual(s.filter((x) => x.tur === 'mola').map((x) => [(x as { saat: string }).saat, (x as { bitis: string }).bitis]), [['13:00', '14:00']])
    assert.deepEqual(s.map((x) => x.dk), [...s.map((x) => x.dk)].sort((a, b) => a - b), 'not in time order')
    // Not a working day (Saturday), and no pattern at all: the day's appointments, no free rows.
    assert.deepEqual(T.gunSatirlari(DUZEN, '2026-10-17', [randevu('r9', '2026-10-17', '10:00', 'planlandi')]).map((x) => x.tur), ['randevu'])
    assert.deepEqual(T.gunSatirlari(null, PZT, r).map((x) => x.tur), ['randevu', 'randevu', 'randevu', 'randevu'])
  })

  for (const f of FORMLAR) {
    it(`${f}: THE CALENDAR, day view — the day in the pack's pattern, free times lead to booking THAT time, every appointment to itself`, () => {
      const m = M.uygulamaMetni(f); const r = RM.randevuMetni(f)
      const randevular = [randevu('r1', PZT, '10:00', 'planlandi', { neden: 'QA sabab' }), randevu('r2', PZT, '11:00', 'iptal'), randevu('r3', PZT, '19:00', 'geldi', { mesaiDisi: true })]
      const html = cerceve(f, 'takvim', React.createElement(T.TakvimGorunumu, { m, r, gorunum: 'gun', gun: PZT, gunler: [PZT], bugun: '2026-10-09', duzen: DUZEN, randevular, hata: false }))
      const g = gorunurMetin(html)
      for (const s of [r.takvim.baslik, r.takvim.gun, r.takvim.hafta, r.takvim.bugun, r.takvim.onceki, r.takvim.sonraki, r.takvim.yeni, r.takvim.duzen, r.takvim.bosSaat, r.takvim.mola, r.takvim.mesaiDisi, r.duzen.saatDilimi, `${r.gunUzun[1]}, 12.10.2026`, 'QA Karimova Dilnoza', 'QA sabab', '10:00–10:30', '13:00–14:00', r.durum.planlandi, r.durum.iptal, r.durum.geldi]) assert.ok(g.includes(s), s)
      assert.ok(!g.includes('2026-10-12'), 'a day is shown in the machine pattern')
      for (const h of ['/uzbek/calendar?yeni=1&gun=2026-10-12', '/uzbek/calendar?yeni=1&gun=2026-10-12&saat=09%3A00', '/uzbek/calendar?yeni=1&gun=2026-10-12&saat=11%3A00', '/uzbek/calendar?randevu=r1', '/uzbek/calendar?randevu=r3', '/uzbek/calendar?gun=2026-10-11', '/uzbek/calendar?gun=2026-10-13', '/uzbek/calendar?gun=2026-10-09', '/uzbek/calendar?gun=2026-10-12&gorunum=hafta', '/uzbek/calendar?duzen=1']) assert.ok(html.includes(href(h)), h)
      assert.ok(!html.includes('saat=10%3A00'), 'a taken time is offered as free')
      assert.match(html, /<a class="uza-sekme" href="[^"]+" aria-current="page">/)
      ekranTemiz(html, `/calendar day (${f})`)
      // Not a working day: said plainly, nothing offered as free; an empty day; loading; a failure.
      const cmt = cerceve(f, 'takvim', React.createElement(T.TakvimGorunumu, { m, r, gorunum: 'gun', gun: '2026-10-17', gunler: ['2026-10-17'], bugun: '2026-10-09', duzen: DUZEN, randevular: [], hata: false }))
      assert.ok(gorunurMetin(cmt).includes(r.takvim.isGunuDegil) && gorunurMetin(cmt).includes(r.takvim.bos) && !cmt.includes('data-bos='))
      ekranTemiz(cmt, `/calendar day off (${f})`)
      assert.ok(gorunurMetin(cerceve(f, 'takvim', React.createElement(T.TakvimGorunumu, { m, r, gorunum: 'gun', gun: PZT, gunler: [PZT], bugun: PZT, duzen: null, randevular: null, hata: false }))).includes(m.kabuk.yukleniyor))
      assert.ok(gorunurMetin(cerceve(f, 'takvim', React.createElement(T.TakvimGorunumu, { m, r, gorunum: 'gun', gun: PZT, gunler: [PZT], bugun: PZT, duzen: null, randevular: null, hata: true }))).includes(m.kabuk.hata))
    })

    it(`${f}: THE CALENDAR, week view — seven days, MONDAY FIRST, each appointment under its own day; a list that stacks on a phone`, () => {
      const m = M.uygulamaMetni(f); const r = RM.randevuMetni(f)
      const gunler = Array.from({ length: 7 }, (_, i) => gunEkle(PZT, i))
      const randevular = [randevu('r1', PZT, '10:00', 'planlandi'), randevu('r2', gunEkle(PZT, 2), '09:00', 'tamamlandi'), randevu('r3', gunEkle(PZT, 6), '12:00', 'gelmedi')]
      const html = cerceve(f, 'takvim', React.createElement(T.TakvimGorunumu, { m, r, gorunum: 'hafta', gun: gunEkle(PZT, 3), gunler, bugun: gunEkle(PZT, 2), duzen: DUZEN, randevular, hata: false }))
      assert.deepEqual([...html.matchAll(/<section class="uza-hafta-gun" data-gun="([0-9-]+)"/g)].map((x) => x[1]), gunler)
      const basliklar = [...html.matchAll(/<a class="uza-baglanti" href="\/uzbek\/calendar\?gun=[0-9-]+" title="[^"]*">([^<]+)<\/a>/g)].map((x) => x[1])
      assert.deepEqual(basliklar, [1, 2, 3, 4, 5, 6, 7].map((g, i) => `${r.gunKisa[g as 1]} · ${String(12 + i).padStart(2, '0')}.10`))
      // Each appointment sits inside its own day's block.
      for (const [id, gun] of [['r1', gunler[0]], ['r2', gunler[2]], ['r3', gunler[6]]]) {
        const blok = html.slice(html.indexOf(`data-gun="${gun}"`), gun === gunler[6] ? undefined : html.indexOf(`data-gun="${gunEkle(gun, 1)}"`))
        assert.ok(blok.includes(`data-randevu="${id}"`), `${id} is not under ${gun}`)
      }
      assert.match(html, new RegExp(`data-gun="${gunler[2]}" data-bugun="evet"`))
      // A week back and a week on; "day" keeps the day; every day can be booked.
      for (const h of ['/uzbek/calendar?gun=2026-10-08&gorunum=hafta', '/uzbek/calendar?gun=2026-10-22&gorunum=hafta', '/uzbek/calendar?gun=2026-10-15', '/uzbek/calendar?yeni=1&gun=2026-10-18', '/uzbek/calendar?randevu=r2']) assert.ok(html.includes(href(h)), h)
      for (const s of [r.durum.planlandi, r.durum.tamamlandi, r.durum.gelmedi]) assert.ok(gorunurMetin(html).includes(s), s)
      // The phone layout is the default; the seven columns come only on a wide screen.
      const css = readFileSync(join(KOK, 'components/ulke/uygulama/uygulama.css'), 'utf8')
      assert.match(css, /\.uza-hafta \{ display: grid; gap: 10px; grid-template-columns: 1fr; \}\n@media \(min-width: 900px\) \{ \.uza-hafta \{ grid-template-columns: repeat\(7,/)
      ekranTemiz(html, `/calendar week (${f})`)
    })

    it(`${f}: BOOKING — the form; "taken" has no way round it; "outside working hours" offers an explicit "book anyway"`, () => {
      const m = M.uygulamaMetni(f); const r = RM.randevuMetni(f)
      const a = { gun: '12.10.2026', saat: '10:00', sureDk: 30, neden: '' }
      const form = (hata: import('@/components/ulke/uygulama/Takvim').FormHatasi, bekliyor = false) => cerceve(f, 'takvim', React.createElement(T.RandevuFormuGorunumu, { m, r, hasta: HASTA, a, set: bos, sureler: [10, 15, 20, 30, 45, 60, 90], gonder: bos, bekliyor, hata, geri: T.takvimYolu({ gun: PZT }) }))
      const html = form(null)
      const g = gorunurMetin(html)
      for (const s of [r.form.baslik, 'QA Karimova Dilnoza Rustamovna', r.form.tarih, r.form.saat, r.form.sure, r.form.neden, r.form.kaydet, r.form.vazgec, r.form.hastaDegistir, r.duzen.saatDilimi, `30 ${r.form.dakika}`]) assert.ok(g.includes(s), s)
      assert.match(html, new RegExp(`name="gun"[^>]*placeholder="${r.form.tarihOrnek}"[^>]*value="12\\.10\\.2026"`), 'the day is typed in the pack\'s pattern')
      assert.match(html, /name="saat" type="time"[^>]*value="10:00"/)
      assert.equal(html.includes('data-eylem="yine-de"'), false)
      ekranTemiz(html, `/calendar booking (${f})`)
      // TAKEN: the sentence, and no second button of any kind.
      const dolu = form({ kod: 'DOLU' })
      assert.ok(gorunurMetin(dolu).includes(r.form.dolu)); assert.equal(dolu.includes('data-eylem="yine-de"'), false); assert.ok(!gorunurMetin(dolu).includes(r.form.yineDe))
      // OUTSIDE WORKING HOURS: the sentence says nothing was booked, and the explicit button appears.
      const dis = form({ kod: 'MESAI_DISI' })
      assert.ok(gorunurMetin(dis).includes(r.form.mesaiDisi)); assert.match(dis, new RegExp(`data-eylem="yine-de">${r.form.yineDe}</button>`))
      for (const [hata, metin] of [[{ kod: 'GECERSIZ', alan: 'gun' }, r.form.tarihGecersiz], [{ kod: 'GECERSIZ', alan: 'saat' }, r.form.saatGecersiz], [{ kod: 'GECERSIZ', alan: 'sure' }, r.form.sureGecersiz], [{ kod: 'NOT_FOUND' }, m.hasta.bulunamadi], [{ kod: 'BAGLANTI' }, m.kabuk.baglanti], [{ kod: 'BASARISIZ' }, r.form.kaydedilemedi], [{ kod: 'YANGI_KOD' }, r.form.kaydedilemedi]] as const) {
        const h = form(hata as import('@/components/ulke/uygulama/Takvim').FormHatasi)
        assert.ok(gorunurMetin(h).includes(metin), JSON.stringify(hata)); assert.equal(h.includes('data-eylem="yine-de"'), false, JSON.stringify(hata)); ekranTemiz(h, `/calendar booking error (${f})`)
      }
      assert.ok(gorunurMetin(form(null, true)).includes(r.form.kaydediliyor))
      // Without a patient: choose one first; the day and time already chosen travel with every link.
      const sec = cerceve(f, 'takvim', React.createElement(T.RandevuHastaSecGorunumu, { m, r, q: '', hastalar: [HASTA], hata: false, gun: PZT, saat: '10:00' }))
      assert.ok(gorunurMetin(sec).includes(r.form.hastaSec) && gorunurMetin(sec).includes('QA Karimova Dilnoza Rustamovna'))
      assert.ok(sec.includes(href(`/uzbek/calendar?yeni=1&hasta=${HASTA.id}&gun=2026-10-12&saat=10%3A00`)))
      assert.match(sec, /<form class="uza-arama" action="\/uzbek\/calendar" method="get" role="search"><input type="hidden" name="yeni" value="1"\/><input type="hidden" name="gun" value="2026-10-12"\/><input type="hidden" name="saat" value="10:00"\/>/)
      ekranTemiz(sec, `/calendar choose patient (${f})`)
      assert.ok(gorunurMetin(cerceve(f, 'takvim', React.createElement(T.RandevuHastaSecGorunumu, { m, r, q: 'zzz', hastalar: [], hata: false }))).includes(m.arama.sonucYok))
    })

    it(`${f}: ONE APPOINTMENT — status, "start the visit", move, cancel, and the reminder in the PATIENT's language with one button to copy it`, () => {
      const m = M.uygulamaMetni(f); const r = RM.randevuMetni(f)
      const hekim = { dil: f, notDili: f, ad: 'QA Shifokor' }
      const detay = (x: import('@/components/ulke/uygulama/Takvim').RandevuKaydi, ek: Record<string, unknown> = {}) => cerceve(f, 'takvim', React.createElement(T.RandevuDetayGorunumu, { m, r, randevu: x, hekim, sureler: [15, 30, 45], tasi: { gun: '12.10.2026', saat: x.saat, sureDk: x.sureDk }, setTasi: bos, hata: null, bildirim: null, bekliyor: false, durumDegistir: bos, tasiGonder: bos, kopyala: bos, ...ek }))
      const eylemler = (html: string) => [...html.matchAll(/data-eylem="([a-z-]+)"/g)].map((x) => x[1])
      // PLANNED, a Russian-speaking patient: everything is offered, and the reminder is in Russian whatever the doctor reads.
      const planli = detay(randevu('r1', PZT, '10:00', 'planlandi', { neden: 'QA sabab', hastaDili: 'ru', mesaiDisi: true }))
      const g = gorunurMetin(planli)
      for (const s of [r.randevu.baslik, 'QA Karimova Dilnoza', `${r.gunUzun[1]}, 12.10.2026`, '10:00–10:30', `(30 ${r.form.dakika})`, 'QA sabab', r.durum.planlandi, r.randevu.mesaiDisiIsareti, m.bugun.muayeneBaslat, r.randevu.geldi, r.randevu.gelmedi, r.randevu.iptalEt, r.randevu.tasi, r.randevu.tasiKaydet, r.hatirlatma.baslik, r.hatirlatma.kopyala, r.hatirlatma.izoh, `${r.hatirlatma.dil}: ${r.hatirlatma.dilAdi.ru}`, r.randevu.takvimeDon, r.randevu.dosya]) assert.ok(g.includes(s), s)
      assert.deepEqual(eylemler(planli), ['muayene-baslat', 'durum-geldi', 'durum-gelmedi', 'durum-iptal', 'hatirlatma-kopyala', 'tasi'])
      assert.ok(planli.includes(href(`/uzbek/visit?hasta=${HASTA.id}&randevu=r1`)), '"start the visit" must carry the patient and the appointment')
      const beklenen = H.hatirlatmaMetni({ hastaDili: 'ru', hekim, gun: PZT, saat: '10:00' })
      assert.equal(beklenen.metin, 'Здравствуйте! Напоминаем: вы записаны на приём к врачу QA Shifokor 12.10.2026 в 10:00.')
      assert.match(planli, new RegExp(`<textarea class="uza-girdi uza-hatirlatma" readonly="" rows="3" lang="ru" data-alan="hatirlatma" data-dil="ru"[^>]*>${beklenen.metin}</textarea>`))
      for (const h of [`/uzbek/calendar?gun=2026-10-12`, `/uzbek/patient?id=${HASTA.id}`]) assert.ok(planli.includes(href(h)), h)
      ekranTemiz(planli, `/calendar appointment (${f})`)
      // An Uzbek-speaking patient: Uzbek in the doctor's script (Latin for a doctor who reads Russian and writes Russian).
      const uz = detay(randevu('r1', PZT, '10:00', 'planlandi', { hastaDili: 'uz' }))
      const uzForm = f === 'ru' ? 'uz-Latn' : f
      assert.match(uz, new RegExp(`data-alan="hatirlatma" data-dil="${uzForm}"`)); assert.ok(uz.includes(`>${H.hatirlatmaMetni({ hastaDili: 'uz', hekim, gun: PZT, saat: '10:00' }).metin}</textarea>`))
      assert.ok(gorunurMetin(uz).includes(`${r.hatirlatma.dil}: ${r.hatirlatma.dilAdi.uz}`)); ekranTemiz(uz, `/calendar appointment, uz patient (${f})`)
      // After the click: said so, in the account's form. Copying failed: said so too.
      assert.ok(gorunurMetin(detay(randevu('r1', PZT, '10:00', 'planlandi', { hastaDili: 'ru' }), { bildirim: 'kopyalandi' })).includes(r.hatirlatma.kopyalandi))
      assert.ok(gorunurMetin(detay(randevu('r1', PZT, '10:00', 'planlandi', { hastaDili: 'ru' }), { bildirim: 'kopyalanamadi' })).includes(r.hatirlatma.kopyalanamadi))
      // ARRIVED · DID NOT COME · DONE by hand · DONE with its visit · CANCELLED.
      const geldi = detay(randevu('r1', PZT, '10:00', 'geldi'))
      assert.deepEqual(eylemler(geldi), ['muayene-baslat', 'durum-tamamlandi', 'durum-planlandi', 'durum-gelmedi', 'durum-iptal', 'tasi'])
      for (const s of [r.randevu.tamamla, r.randevu.planaAl]) assert.ok(gorunurMetin(geldi).includes(s), s)
      const gelmedi = detay(randevu('r1', PZT, '10:00', 'gelmedi'))
      assert.deepEqual(eylemler(gelmedi), ['durum-geldi', 'durum-planlandi', 'durum-iptal']); assert.ok(gorunurMetin(gelmedi).includes(r.randevu.yenidenYaz) && gelmedi.includes(href(`/uzbek/calendar?yeni=1&hasta=${HASTA.id}`)))
      const elle = detay(randevu('r1', PZT, '10:00', 'tamamlandi'))
      assert.deepEqual(eylemler(elle), ['durum-geldi']); assert.ok(gorunurMetin(elle).includes(r.randevu.geldiyeAl))
      const muayeneli = detay(randevu('r1', PZT, '10:00', 'tamamlandi', { seansId: 's1' }))
      assert.deepEqual(eylemler(muayeneli), ['muayene-ac']); assert.ok(muayeneli.includes(href('/uzbek/visit?seans=s1')) && gorunurMetin(muayeneli).includes(r.randevu.muayeneyiAc))
      const surmekte = detay(randevu('r1', PZT, '10:00', 'geldi', { seansId: 's1' }))
      assert.ok(!eylemler(surmekte).includes('muayene-baslat') && eylemler(surmekte).includes('muayene-ac'), 'an appointment with a visit must not offer a second one')
      const iptal = detay(randevu('r1', PZT, '10:00', 'iptal'))
      assert.deepEqual(eylemler(iptal), []); assert.ok(!iptal.includes('data-alan="tasi"') && !iptal.includes('data-alan="hatirlatma"'))
      for (const h of [geldi, gelmedi, elle, muayeneli, iptal]) { ekranTemiz(h, `/calendar appointment states (${f})`); assert.ok(!h.includes('data-alan="hatirlatma"'), 'the reminder is for a planned appointment only') }
      // MOVING: taken → the sentence, no way round; outside hours → "nothing was moved" and the explicit button.
      const tDolu = detay(randevu('r1', PZT, '10:00', 'planlandi'), { hata: { nerede: 'tasi', kod: 'DOLU' } })
      assert.ok(gorunurMetin(tDolu).includes(r.form.dolu)); assert.ok(!eylemler(tDolu).includes('tasi-yine-de'))
      const tDis = detay(randevu('r1', PZT, '10:00', 'planlandi'), { hata: { nerede: 'tasi', kod: 'MESAI_DISI' } })
      assert.ok(gorunurMetin(tDis).includes(r.randevu.tasiMesaiDisi) && gorunurMetin(tDis).includes(r.randevu.tasiYineDe)); assert.ok(eylemler(tDis).includes('tasi-yine-de'))
      assert.ok(gorunurMetin(detay(randevu('r1', PZT, '10:00', 'planlandi'), { bildirim: 'tasindi' })).includes(r.randevu.tasindi))
      for (const [hata, metin] of [[{ nerede: 'durum', kod: 'GECIS_YOK' }, r.randevu.gecisYok], [{ nerede: 'durum', kod: 'DOLU' }, r.form.dolu], [{ nerede: 'durum', kod: 'RANDEVU_YOK' }, r.randevu.bulunamadi], [{ nerede: 'tasi', kod: 'GECERSIZ', alan: 'gun' }, r.form.tarihGecersiz], [{ nerede: 'tasi', kod: 'BASARISIZ' }, r.randevu.degistirilemedi], [{ nerede: 'durum', kod: 'BAGLANTI' }, m.kabuk.baglanti]] as const) {
        const h = detay(randevu('r1', PZT, '10:00', 'planlandi'), { hata })
        assert.ok(gorunurMetin(h).includes(metin), JSON.stringify(hata)); ekranTemiz(h, `/calendar appointment error (${f})`)
      }
    })

    it(`${f}: THE WORKING PATTERN — days Monday first, hours, default length, breaks; the screen says that public holidays are not known`, () => {
      const m = M.uygulamaMetni(f); const r = RM.randevuMetni(f)
      const duzen = (ek: Record<string, unknown> = {}) => cerceve(f, 'takvim', React.createElement(T.DuzenGorunumu, { m, r, a: DUZEN, set: bos, sureler: [10, 15, 20, 30, 45, 60, 90], gonder: bos, bekliyor: false, hata: null, kaydedildi: false, kayitli: true, ...ek }))
      const html = duzen()
      const g = gorunurMetin(html)
      for (const s of [r.duzen.baslik, r.duzen.aciklama, r.duzen.gunler, r.duzen.baslangic, r.duzen.bitis, r.duzen.sure, r.duzen.molalar, r.duzen.molaBas, r.duzen.molaBit, r.duzen.molaEkle, r.duzen.molaSil, r.duzen.kaydet, r.duzen.saatDilimi, r.duzen.tatilNotu, r.randevu.takvimeDon]) assert.ok(g.includes(s), s)
      assert.deepEqual([...html.matchAll(/<input type="checkbox" name="gunler"( checked="")? value="(\d)"\/><span>([^<]+)<\/span>/g)].map((x) => [x[2], Boolean(x[1]), x[3]]), [1, 2, 3, 4, 5, 6, 7].map((gn) => [String(gn), gn <= 5, r.gunKisa[gn as 1]]))
      assert.match(html, /name="baslangic" type="time"[^>]*value="09:00"/); assert.match(html, /name="bitis" type="time"[^>]*value="18:00"/); assert.match(html, /name="mola-bas-0"[^>]*value="13:00"/)
      assert.ok(!g.includes(r.duzen.varsayilan)); assert.ok(gorunurMetin(duzen({ kayitli: false })).includes(r.duzen.varsayilan))
      for (const [hata, metin] of [['gunler', r.duzen.gunGerekli], ['saatler', r.duzen.saatGecersiz], ['sure', r.duzen.sureGecersiz], ['molalar', r.duzen.molaGecersiz], ['kayit', r.duzen.kaydedilemedi], ['baglanti', m.kabuk.baglanti]] as const) assert.ok(gorunurMetin(duzen({ hata })).includes(metin), hata)
      assert.ok(gorunurMetin(duzen({ kaydedildi: true })).includes(r.duzen.kaydedildi)); assert.ok(gorunurMetin(duzen({ bekliyor: true })).includes(r.duzen.kaydediliyor))
      // Four breaks is the ceiling: no fifth is offered.
      assert.ok(!duzen({ a: { ...DUZEN, molalar: Array.from({ length: 4 }, () => ({ baslangic: '10:00', bitis: '10:10' })) } }).includes('data-eylem="mola-ekle"'))
      ekranTemiz(html, `/calendar working pattern (${f})`)
    })

    it(`${f}: THE HOME lists today's appointments in the order given, with status; the patient file books and lists; the visit screen shows its appointment`, () => {
      const m = M.uygulamaMetni(f); const r = RM.randevuMetni(f)
      const randevular = [randevu('r1', PZT, '09:00', 'tamamlandi', { seansId: 's1' }), randevu('r2', PZT, '10:00', 'geldi', { hastaAdi: 'QA Yusupov Sardor' }), randevu('r3', PZT, '11:00', 'planlandi', { neden: 'QA sabab' }), randevu('r4', PZT, '12:00', 'iptal'), randevu('r5', PZT, '14:00', 'gelmedi', { hastaAdi: '' })]
      const ev = cerceve(f, 'bugun', React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA Shifokor', muayeneler: [], hata: false, randevular }))
      const g = gorunurMetin(ev)
      for (const s of [r.bugun.randevular, r.bugun.takvimiAc, '09:00–09:30', 'QA Yusupov Sardor', 'QA sabab', m.bugun.hastasiz, ...Object.values(r.durum)]) assert.ok(g.includes(s), s)
      assert.deepEqual([...ev.matchAll(/<li class="uza-randevu-satiri" data-randevu="(r\d)"/g)].map((x) => x[1]), ['r1', 'r2', 'r3', 'r4', 'r5'])
      assert.deepEqual([...ev.matchAll(/data-randevu-durum="([a-z]+)"/g)].map((x) => x[1]), ['tamamlandi', 'geldi', 'planlandi', 'iptal', 'gelmedi'])
      // "Start the visit" right on the home, for the two it is possible for — and only those.
      assert.deepEqual([...ev.matchAll(/href="\/uzbek\/visit\?hasta=[^"]*&amp;randevu=(r\d)" data-eylem="muayene-baslat"/g)].map((x) => x[1]), ['r2', 'r3'])
      for (const h of ['/uzbek/calendar', '/uzbek/calendar?randevu=r1', '/uzbek/calendar?randevu=r5']) assert.ok(ev.includes(href(h)), h)
      ekranTemiz(ev, `/today with appointments (${f})`)
      const bosEv = cerceve(f, 'bugun', React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA Shifokor', muayeneler: [], hata: false, randevular: [] }))
      assert.ok(gorunurMetin(bosEv).includes(r.bugun.randevuYok)); ekranTemiz(bosEv, `/today, none (${f})`)
      // Not loaded (or a country without appointments): no list, no heading.
      for (const yok of [null, undefined]) assert.ok(!cerceve(f, 'bugun', React.createElement(Bugun.BugunGorunumu, { m, ad: 'QA', muayeneler: [], hata: false, randevular: yok })).includes('data-alan="bugun-randevular"'))
      // The patient's file: "book an appointment" opens the form with THIS patient; the coming appointments are listed.
      const dosya = cerceve(f, 'hastalar', React.createElement(Hastalar.HastaDosyasiGorunumu, { m, hasta: HASTA, muayeneler: [], randevular: [randevu('r3', PZT, '11:00', 'planlandi', { neden: 'QA sabab' })] }))
      assert.match(dosya, new RegExp(`href="/uzbek/calendar\\?yeni=1&amp;hasta=${HASTA.id}" data-eylem="randevu-al">${r.hasta.randevuAl}</a>`))
      for (const s of [r.hasta.randevular, '12.10.2026 11:00–11:30', 'QA sabab', r.durum.planlandi]) assert.ok(gorunurMetin(dosya).includes(s), s)
      assert.ok(dosya.includes(href('/uzbek/calendar?randevu=r3'))); ekranTemiz(dosya, `/patient with appointments (${f})`)
      assert.ok(!cerceve(f, 'hastalar', React.createElement(Hastalar.HastaDosyasiGorunumu, { m, hasta: HASTA, muayeneler: [], randevular: [] })).includes('data-alan="hasta-randevular"'))
      // The visit screen, started from an appointment: it says which one, and "back" leads to it.
      const kayit = cerceve(f, 'bugun', React.createElement(Muayene.KayitGorunumu, { m, hasta: HASTA, sablon: 'pediatri', riza: false, setRiza: bos, durum: 'hazir', sure: 0, hataKodu: null, baslat: bos, durdur: bos, vazgec: bos, rol: 'pediatri', randevu: { id: 'r3', gun: PZT, saat: '11:00' } }))
      assert.ok(gorunurMetin(kayit).includes(`${r.randevu.baslik}: ${r.gunUzun[1]}, 12.10.2026 · 11:00`)); assert.ok(kayit.includes(href('/uzbek/calendar?randevu=r3')))
      assert.match(kayit, /<button type="button" class="uza-dugme" disabled="">/, 'consent still blocks recording')
      ekranTemiz(kayit, `/visit from an appointment (${f})`)
      const duz = cerceve(f, 'bugun', React.createElement(Muayene.KayitGorunumu, { m, hasta: HASTA, sablon: 'pediatri', riza: false, setRiza: bos, durum: 'hazir', sure: 0, hataKodu: null, baslat: bos, durdur: bos, vazgec: bos, rol: 'pediatri' }))
      assert.ok(!duz.includes('data-alan="randevu"') && duz.includes(href(`/uzbek/patient?id=${HASTA.id}`)))
    })
  }

  it('the screens carry no sentence of their own: no Uzbek, Russian or Turkish text is written in the screen files, only in the catalogue', () => {
    for (const d of ['Takvim.tsx', 'randevuOrtak.tsx']) {
      const kod = readFileSync(join(KOK, 'components/ulke/uygulama', d), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
      assert.doesNotMatch(kod, /[Ѐ-ӿʻʼçğışöüÇĞİŞÖÜ]/, `${d} carries text outside the catalogue`)
      // No address is written by hand: every one comes from YOL (the country's path prefix).
      assert.doesNotMatch(kod, /['"`]\/(calendar|visit|patient|today|settings|uzbek)/, `${d} writes an address by hand`)
    }
  })
})
