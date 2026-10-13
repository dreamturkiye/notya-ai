/**
 * NOTYA-ULKE-MESAJ-01 — "MY TEMPLATES" (migration 141), for whatever pack is active. Runs ONCE PER PACK.
 *
 * TWO LAYERS.
 *   1. THE KIT'S RULES (lib/ulke/sablon/sablon.ts), for every pack that brings the signed-in application: create,
 *      edit, delete (soft); what a picker in a note or in a message is offered; the title and the text are one
 *      encrypted value bound to its row; limits; NO PATIENT anywhere; isolation — a second doctor, another country's
 *      rows, a deleted template.
 *   2. THE ROUTE, with the pack's own switch: a pack without templates answers "not found" on every method; a pack
 *      with them is held to the same behaviour through the real handlers.
 *
 * Real handlers and real library code. The database and sign-in are stand-ins inside this process; any network
 * address fails the test. Synthetic data only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'
process.env.TZ = 'America/Los_Angeles'

import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani, type Satir } from '@/lib/ulke/testing/sahteVeritabani'

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
globalThis.fetch = (async (g: unknown) => { throw new Error(`this test may not use the network: ${String(g)}`) }) as typeof fetch

type Mod = Record<string, (req: unknown) => Promise<Response>>
type Paket = import('../tipler').UlkePaketi
type Sb = import('@supabase/supabase-js').SupabaseClient
let paket: Paket
let BU = ''
let KIT = false
let ROTA = false
let NextRequest: typeof import('next/server').NextRequest
let sifreCoz: (s: string) => string
let S: typeof import('./sablon')
let C: typeof import('./sabitler')
let T: typeof import('../uygulama/tablolar')
let rota: Mod

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const YOK = '77777777-7777-4777-8777-777777777777'
const YABANCI = 'zz'
const GIZLI = 'QA-TEMPLATE-NEVER-IN-CLEAR-TEXT'
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const satirlar = () => tablo('ulke_hekim_sablonlari')
const simdiIso = () => new Date().toISOString()
const ilerle = (ms: number) => mock.timers.tick(ms)
const anlik = () => JSON.stringify(satirlar())

function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: DA, email: 'qa-a@notya.test', app_metadata: { country: BU } },
    'jeton-b': { id: DB, email: 'qa-b@notya.test', app_metadata: { country: BU } },
  })
  const d = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  tablo('ulke_hesaplari').push({ id: DA, full_name: 'QA Doctor A', ulke: BU, ui_language: d }, { id: DB, full_name: 'QA Doctor B', ulke: BU, ui_language: d })
}
const olustur = async (doktor: string, ad: string, metin: string, kapsam: string = 'hepsi') => { const r = await S.sablonOlustur(sb(), doktor, { ad, metin, kapsam }); assert.equal(r.tamam, true, JSON.stringify(r)); return (r as { sablon: import('./sabitler').Sablon }).sablon }
const satir = (id: string) => satirlar().find((x) => x.id === id) as Satir

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  KIT = paket.ozellikler.cekirdekMuayene === true
  NextRequest = (await import('next/server')).NextRequest
  sifreCoz = (await import('@/lib/security/encryption')).decrypt
  S = await import('./sablon'); C = await import('./sabitler'); T = await import('../uygulama/tablolar')
  ROTA = S.sablonAcik()
  rota = (await import('../../../app/api/ulke/sablonlar/route.ulke')) as unknown as Mod
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); if (paket.ozellikler.cekirdekMuayene) sifirla() })

async function cagir(yontem: string, yol: string, s: { jeton?: string; govde?: unknown } = {}): Promise<{ status: number; govde: any; ham: string }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const basliklar: Record<string, string> = { host: 'notya.test' }
  if (s.jeton) basliklar.authorization = `Bearer ${s.jeton}`
  if (s.govde !== undefined) basliklar['content-type'] = 'application/json'
  const req = new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(s.govde !== undefined ? { body: JSON.stringify(s.govde) } : {}) })
  const res = await rota[yontem](req)
  const ham = await res.clone().text()
  let govde: unknown = null
  try { govde = JSON.parse(ham) } catch { /* not JSON */ }
  return { status: res.status, govde, ham }
}
const API = '/api/ulke/sablonlar'

describe('"my templates" — create, edit, delete, and what a picker is offered', () => {
  it('a pack without the signed-in application has no templates, and says so', () => {
    if (KIT) return
    assert.equal(S.sablonAcik(), false)
  })

  it('CREATE: the row is the doctor\'s own, in this country, in use; the title is one line and the text keeps its lines', async () => {
    if (!KIT) return
    const s = await olustur(DA, '  Control \n visit  ', `  ${GIZLI} line one\r\nline two  `, 'not')
    assert.deepEqual({ ad: s.ad, metin: s.metin, kapsam: s.kapsam, guncellendi: s.guncellendi }, { ad: 'Control visit', metin: `${GIZLI} line one\nline two`, kapsam: 'not', guncellendi: simdiIso() })
    assert.deepEqual({ ulke: satir(s.id).ulke, d: satir(s.id).doctor_id, k: satir(s.id).kapsam, sil: satir(s.id).silindi_at }, { ulke: BU, d: DA, k: 'not', sil: null })
    assert.deepEqual(await S.sablonlariListele(sb(), DA), [s])
  })

  it('NO PATIENT: the row has no column that could name one, no function takes a patient id, and no statement reads a patient\'s table', async () => {
    if (!KIT) return
    const s = await olustur(DA, 'A', 'text')
    await S.sablonGuncelle(sb(), DA, s.id, { ad: 'B', metin: 'text two', kapsam: 'mesaj' }); await S.sablonlariListele(sb(), DA, 'mesaj'); await S.sablonSil(sb(), DA, s.id)
    assert.deepEqual(Object.keys(satir(s.id)).sort(), ['created_at', 'doctor_id', 'icerik_encrypted', 'id', 'kapsam', 'silindi_at', 'ulke', 'updated_at'])
    assert.deepEqual([...new Set(vt.sorgular.map((q) => q.tablo))], ['ulke_hekim_sablonlari'], 'a table other than the templates\' own was touched')
    for (const q of vt.sorgular) assert.ok(!q.filtreler.some((f) => /patient|hasta/.test(f)), `${q.islem}: a patient in a statement about templates`)
    const kaynak = readFileSync(join(__dirname, 'sablon.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    assert.doesNotMatch(kaynak, /hastaId|patient_id|hastaGetir|ulke_hastalar/, 'the templates\' library knows a patient')
    assert.doesNotMatch(readFileSync(join(__dirname, '../../../app/api/ulke/sablonlar/route.ulke.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), /hastaId|patient|searchParams\.get\('hasta'\)/)
  })

  it('THE TITLE AND THE TEXT ARE ONE ENCRYPTED VALUE that names its own country, doctor and row; a value copied from another row reads as nothing', async () => {
    if (!KIT) return
    const a = await olustur(DA, `${GIZLI} title`, `${GIZLI} text`), b = await olustur(DB, 'of doctor B', `${GIZLI} of B`)
    assert.ok(!anlik().includes(GIZLI), 'a template is in the database in the clear')
    assert.deepEqual(JSON.parse(sifreCoz(String(satir(a.id).icerik_encrypted))), { v: 1, u: BU, d: DA, i: a.id, ad: `${GIZLI} title`, m: `${GIZLI} text` })
    // somebody with access to the database copies doctor B's value into a row of doctor A, and A's own into another row of A
    satirlar().push({ id: 'kopya-1', ulke: BU, doctor_id: DA, kapsam: 'hepsi', icerik_encrypted: satir(b.id).icerik_encrypted, silindi_at: null, created_at: simdiIso(), updated_at: simdiIso() })
    satirlar().push({ id: 'kopya-2', ulke: BU, doctor_id: DA, kapsam: 'hepsi', icerik_encrypted: satir(a.id).icerik_encrypted, silindi_at: null, created_at: simdiIso(), updated_at: simdiIso() })
    assert.deepEqual((await S.sablonlariListele(sb(), DA)).map((x) => x.id), [a.id])
  })

  it('EDIT: the same row, new content, and the list puts the last saved first; an empty title or text, a place that is none, or a text too long is refused and changes nothing', async () => {
    if (!KIT) return
    const a = await olustur(DA, 'First', 'one'); ilerle(1000); const b = await olustur(DA, 'Second', 'two')
    assert.deepEqual((await S.sablonlariListele(sb(), DA)).map((x) => x.ad), ['Second', 'First'])
    ilerle(1000)
    const r = await S.sablonGuncelle(sb(), DA, a.id, { ad: 'First, edited', metin: 'one, edited', kapsam: 'mesaj' })
    assert.deepEqual(r, { tamam: true, sablon: { id: a.id, ad: 'First, edited', metin: 'one, edited', kapsam: 'mesaj', guncellendi: simdiIso() } })
    assert.deepEqual((await S.sablonlariListele(sb(), DA)).map((x) => [x.ad, x.kapsam]), [['First, edited', 'mesaj'], ['Second', 'hepsi']])
    assert.equal(satirlar().length, 2)
    const once = anlik()
    for (const [g, kod] of [[{ ad: '', metin: 'x', kapsam: 'not' }, 'AD_GEREKLI'], [{ ad: '  \n ', metin: 'x', kapsam: 'not' }, 'AD_GEREKLI'], [{ ad: 'x', metin: ' \n ', kapsam: 'not' }, 'METIN_GEREKLI'], [{ ad: 'x', metin: 12, kapsam: 'not' }, 'METIN_GEREKLI'], [{ ad: 'x'.repeat(C.SABLON_AD_AZAMI + 1), metin: 'x', kapsam: 'not' }, 'UZUN'], [{ ad: 'x', metin: 'x'.repeat(C.SABLON_METIN_AZAMI + 1), kapsam: 'not' }, 'UZUN'], [{ ad: 'x', metin: 'x', kapsam: 'everywhere' }, 'KAPSAM'], [{ ad: 'x', metin: 'x' }, 'KAPSAM']] as const) {
      assert.deepEqual(await S.sablonGuncelle(sb(), DA, b.id, g), { tamam: false, kod }, JSON.stringify(g).slice(0, 50))
      assert.deepEqual(await S.sablonOlustur(sb(), DA, g), { tamam: false, kod }, JSON.stringify(g).slice(0, 50))
    }
    assert.equal(anlik(), once)
    assert.equal((await olustur(DA, 'x'.repeat(C.SABLON_AD_AZAMI), 'y'.repeat(C.SABLON_METIN_AZAMI))).metin.length, C.SABLON_METIN_AZAMI)
  })

  it('WHAT A PICKER IS OFFERED: in a note the templates for a note and for both; in a message those for a message and for both; never the other place\'s', async () => {
    if (!KIT) return
    await olustur(DA, 'note only', 'n', 'not'); ilerle(1000); await olustur(DA, 'message only', 'm', 'mesaj'); ilerle(1000); await olustur(DA, 'both', 'b', 'hepsi')
    assert.deepEqual((await S.sablonlariListele(sb(), DA, 'not')).map((x) => x.ad), ['both', 'note only'])
    assert.deepEqual((await S.sablonlariListele(sb(), DA, 'mesaj')).map((x) => x.ad), ['both', 'message only'])
    assert.deepEqual((await S.sablonlariListele(sb(), DA)).map((x) => x.ad), ['both', 'message only', 'note only'])
    // inserting: at the end, on a line of its own, nothing replaced, never past the place's own limit
    assert.equal(C.sonaEkle('', 'template'), 'template')
    assert.equal(C.sonaEkle('written already  \n\n', 'template'), 'written already\ntemplate')
    assert.equal(C.sonaEkle('abc', 'defgh', 6), 'abc\nde')
  })

  it('DELETE IS SOFT: the row stays, marked; it is listed nowhere, cannot be edited, deleted again or brought back — also by the database\'s own rule', async () => {
    if (!KIT) return
    const a = await olustur(DA, 'To delete', `${GIZLI} text`), b = await olustur(DA, 'To keep', 'text')
    ilerle(60_000)
    assert.deepEqual(await S.sablonSil(sb(), DA, a.id), { tamam: true })
    assert.equal(satirlar().length, 2, 'deleting removed the row')
    assert.equal(satir(a.id).silindi_at, simdiIso())
    for (const yer of [undefined, 'not', 'mesaj'] as const) assert.deepEqual((await S.sablonlariListele(sb(), DA, yer)).map((x) => x.id), [b.id])
    const once = anlik()
    assert.deepEqual(await S.sablonGuncelle(sb(), DA, a.id, { ad: 'back', metin: 'again', kapsam: 'hepsi' }), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await S.sablonSil(sb(), DA, a.id), { tamam: false, kod: 'NOT_FOUND' })
    const { error: e1 } = await T.ulkeTablosu(sb(), 'ulke_hekim_sablonlari').update({ silindi_at: null }).eq('id', a.id).eq('doctor_id', DA)
    assert.equal((e1 as { code?: string } | null)?.code, '23514')
    const { error: e2 } = await T.ulkeTablosu(sb(), 'ulke_hekim_sablonlari').update({ doctor_id: DB }).eq('id', b.id).eq('doctor_id', DA)
    assert.equal((e2 as { code?: string } | null)?.code, '23514', 'a template moved to another doctor')
    assert.equal(anlik(), once)
  })

  it('THE LIMIT: an account keeps at most the kit\'s number of templates in use; deleting one makes room', async () => {
    if (!KIT) return
    for (let n = 0; n < C.SABLON_ADET_AZAMI; n++) satirlar().push({ id: `dolgu-${n}`, ulke: BU, doctor_id: DA, kapsam: 'hepsi', icerik_encrypted: 'x', silindi_at: null, created_at: simdiIso(), updated_at: simdiIso() })
    assert.deepEqual(await S.sablonOlustur(sb(), DA, { ad: 'one too many', metin: 'x', kapsam: 'hepsi' }), { tamam: false, kod: 'COK_FAZLA' })
    await olustur(DB, 'another doctor is not limited by the first', 'x')
    satirlar()[0].silindi_at = simdiIso()
    await olustur(DA, 'room again', 'x')
  })

  it('A FAILED WRITE is said, and leaves nothing behind', async () => {
    if (!KIT) return
    vt.boz.yaz.add('ulke_hekim_sablonlari')
    assert.deepEqual(await S.sablonOlustur(sb(), DA, { ad: 'x', metin: 'x', kapsam: 'hepsi' }), { tamam: false, kod: 'BASARISIZ' })
    vt.boz.yaz.clear()
    assert.equal(satirlar().length, 0)
  })
})

describe('"my templates" — isolation', () => {
  it('SECOND DOCTOR: a doctor lists, edits and deletes only their own; another doctor\'s template is exactly "not found" and does not change', async () => {
    if (!KIT) return
    const a = await olustur(DA, 'A\'s template', `${GIZLI}-A`), b = await olustur(DB, 'B\'s template', `${GIZLI}-B`)
    assert.deepEqual((await S.sablonlariListele(sb(), DA)).map((x) => x.id), [a.id])
    assert.deepEqual((await S.sablonlariListele(sb(), DB)).map((x) => x.id), [b.id])
    const once = anlik()
    for (const [doktor, id] of [[DB, a.id], [DA, b.id], [DA, YOK]] as const) {
      assert.deepEqual(await S.sablonGuncelle(sb(), doktor, id, { ad: 'taken', metin: 'over', kapsam: 'hepsi' }), { tamam: false, kod: 'NOT_FOUND' })
      assert.deepEqual(await S.sablonSil(sb(), doktor, id), { tamam: false, kod: 'NOT_FOUND' })
    }
    assert.equal(anlik(), once, 'a doctor changed another doctor\'s template')
  })

  it('ANOTHER COUNTRY\'S ROWS — same doctor id, in the same table — are not listed, edited or deleted', async () => {
    if (!KIT) return
    const a = await olustur(DA, 'this country', 'text')
    satirlar().push({ id: 'yabanci-1', ulke: YABANCI, doctor_id: DA, kapsam: 'hepsi', icerik_encrypted: satir(a.id).icerik_encrypted, silindi_at: null, created_at: simdiIso(), updated_at: simdiIso() })
    const yabanci = () => JSON.stringify(satirlar().filter((x) => x.ulke !== BU))
    const once = yabanci()
    assert.deepEqual((await S.sablonlariListele(sb(), DA)).map((x) => x.id), [a.id])
    assert.deepEqual(await S.sablonGuncelle(sb(), DA, 'yabanci-1', { ad: 'x', metin: 'x', kapsam: 'hepsi' }), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await S.sablonSil(sb(), DA, 'yabanci-1'), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(yabanci(), once)
  })

  it('EVERY STATEMENT is bound to the country and the doctor', async () => {
    if (!KIT) return
    const a = await olustur(DA, 'x', 'x')
    vt.sorgular.length = 0
    await S.sablonlariListele(sb(), DA); await S.sablonGuncelle(sb(), DA, a.id, { ad: 'y', metin: 'y', kapsam: 'not' }); await olustur(DA, 'z', 'z'); await S.sablonSil(sb(), DA, a.id)
    assert.ok(vt.sorgular.length >= 5)
    for (const q of vt.sorgular) {
      assert.equal(q.ulke, BU)
      if (q.islem !== 'insert') assert.ok(q.filtreler.includes(`doctor_id=eq.${DA}`), `${q.islem} [${q.filtreler.join(' ')}]: no doctor in the statement`)
    }
  })
})

describe('"my templates" — the route', () => {
  it('A PACK WITHOUT TEMPLATES: every method answers "not found", with a valid session too, and nothing is read', async () => {
    if (ROTA) return
    const once = vt.sorgular.length
    for (const y of ['GET', 'POST', 'PATCH', 'DELETE']) {
      const r = await cagir(y, API, { jeton: 'jeton-a', ...(y === 'GET' ? {} : { govde: { id: YOK, ad: 'x', metin: 'x', kapsam: 'hepsi' } }) })
      assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }], y)
    }
    assert.equal(vt.sorgular.length, once)
    assert.deepEqual(Object.keys(rota).filter((k) => /^[A-Z]+$/.test(k)).sort(), ['DELETE', 'GET', 'PATCH', 'POST'])
  })

  it('create, list, narrow to a place, edit, delete — and every refusal with its code', async () => {
    if (!ROTA) return
    const y = await cagir('POST', API, { jeton: 'jeton-a', govde: { ad: 'Control', metin: `${GIZLI} text`, kapsam: 'not' } })
    assert.equal(y.status, 200, y.ham)
    assert.deepEqual(Object.keys(y.govde.sablon).sort(), ['ad', 'guncellendi', 'id', 'kapsam', 'metin'])
    assert.deepEqual((await cagir('GET', API, { jeton: 'jeton-a' })).govde, { sablonlar: [y.govde.sablon] })
    assert.deepEqual((await cagir('GET', `${API}?yer=not`, { jeton: 'jeton-a' })).govde.sablonlar.length, 1)
    assert.deepEqual((await cagir('GET', `${API}?yer=mesaj`, { jeton: 'jeton-a' })).govde, { sablonlar: [] })
    assert.deepEqual([(await cagir('GET', `${API}?yer=everywhere`, { jeton: 'jeton-a' })).status], [400])
    const d = await cagir('PATCH', API, { jeton: 'jeton-a', govde: { id: y.govde.sablon.id, ad: 'Control, edited', metin: 'new', kapsam: 'hepsi' } })
    assert.deepEqual([d.status, d.govde.sablon.ad, d.govde.sablon.kapsam], [200, 'Control, edited', 'hepsi'])
    for (const [yontem, govde, durum, kod] of [['POST', { ad: '', metin: 'x', kapsam: 'not' }, 400, 'AD_GEREKLI'], ['POST', { ad: 'x', metin: '', kapsam: 'not' }, 400, 'METIN_GEREKLI'], ['POST', { ad: 'x', metin: 'x', kapsam: 'x' }, 400, 'KAPSAM'], ['POST', { ad: 'x', metin: 'x'.repeat(C.SABLON_METIN_AZAMI + 1), kapsam: 'not' }, 400, 'UZUN'], ['PATCH', { id: 'not-an-id', ad: 'x', metin: 'x', kapsam: 'not' }, 404, 'NOT_FOUND'], ['PATCH', { id: YOK, ad: 'x', metin: 'x', kapsam: 'not' }, 404, 'NOT_FOUND'], ['PATCH', { id: y.govde.sablon.id, ad: '', metin: 'x', kapsam: 'not' }, 400, 'AD_GEREKLI'], ['DELETE', { id: 'x' }, 404, 'NOT_FOUND'], ['DELETE', {}, 404, 'NOT_FOUND'], ['DELETE', { id: YOK }, 404, 'NOT_FOUND']] as const) {
      const r = await cagir(yontem, API, { jeton: 'jeton-a', govde })
      assert.deepEqual([r.status, r.govde.code], [durum, kod], `${yontem} ${JSON.stringify(govde).slice(0, 50)}`)
    }
    assert.deepEqual((await cagir('DELETE', API, { jeton: 'jeton-a', govde: { id: y.govde.sablon.id } })).govde, { ok: true })
    assert.deepEqual((await cagir('GET', API, { jeton: 'jeton-a' })).govde, { sablonlar: [] })
    assert.equal((await cagir('DELETE', API, { jeton: 'jeton-a', govde: { id: y.govde.sablon.id } })).status, 404, 'a deleted template answers like one that does not exist')
    assert.equal(satirlar().length, 1, 'the row of a deleted template stays')
  })

  it('ISOLATION through the route: A→B and B→A on every method answer exactly like an id that does not exist, and change nothing; a body cannot name another doctor', async () => {
    if (!ROTA) return
    const a = await olustur(DA, 'A', `${GIZLI}-A`), b = await olustur(DB, 'B', `${GIZLI}-B`)
    const once = anlik()
    for (const [jeton, id, kendi] of [['jeton-b', a.id, b.id], ['jeton-a', b.id, a.id]] as const) {
      const yokPatch = await cagir('PATCH', API, { jeton, govde: { id: YOK, ad: 'x', metin: 'x', kapsam: 'hepsi' } }), yokSil = await cagir('DELETE', API, { jeton, govde: { id: YOK } })
      const p = await cagir('PATCH', API, { jeton, govde: { id, ad: 'taken', metin: 'over', kapsam: 'hepsi' } }), s = await cagir('DELETE', API, { jeton, govde: { id } })
      assert.deepEqual([p.status, p.ham, s.status, s.ham], [yokPatch.status, yokPatch.ham, yokSil.status, yokSil.ham], `${jeton}: a foreign id must answer exactly like a missing one`)
      const liste = await cagir('GET', API, { jeton })
      assert.deepEqual(liste.govde.sablonlar.map((x: { id: string }) => x.id), [kendi])
      assert.ok(!liste.ham.includes(jeton === 'jeton-a' ? `${GIZLI}-B` : `${GIZLI}-A`))
    }
    assert.equal(anlik(), once)
    // a body that names another doctor is not read: the row is the session's own
    const y = await cagir('POST', API, { jeton: 'jeton-a', govde: { ad: 'mine', metin: 'x', kapsam: 'hepsi', doctor_id: DB, doktorId: DB, ulke: YABANCI } })
    assert.deepEqual([satir(y.govde.sablon.id).doctor_id, satir(y.govde.sablon.id).ulke], [DA, BU])
  })

  it('a doctor\'s session and nothing else: none, a token that is none, or another country\'s → 401, and nothing is read or written', async () => {
    if (!ROTA) return
    await olustur(DA, 'A', 'text')
    vt.hesaplar['jeton-yabanci'] = { id: DA, email: 'qa-x@notya.test', app_metadata: { country: YABANCI } }
    const once = anlik()
    for (const jeton of [undefined, 'yok-boyle-jeton', 'jeton-yabanci']) {
      for (const y of ['GET', 'POST', 'PATCH', 'DELETE']) {
        const r = await cagir(y, API, { jeton, ...(y === 'GET' ? {} : { govde: { id: YOK, ad: 'x', metin: 'x', kapsam: 'hepsi' } }) })
        assert.deepEqual([r.status, r.govde], [401, { code: 'OTURUM_YOK' }], `${y} ${jeton}`)
      }
    }
    assert.equal(anlik(), once)
  })
})
