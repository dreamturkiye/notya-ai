/**
 * NOTYA-ULKE-MESAJ-01 — CONSULTATION BETWEEN DOCTORS (migration 142), for whatever pack is active. Runs ONCE PER PACK.
 *
 * A pack without consultation answers "not found" on every method of the route. A pack with it is held to:
 *
 *   the code        an account is found by its consultation code, exactly, and in no other way: no directory
 *   asking          the patient is the asking doctor's; the consent sentence is ticked and its stamp stored; what is
 *                   shared is a COPY of one APPROVED note of THAT patient, or of its summary — never the transcript,
 *                   never another patient's or another doctor's note
 *   the consulted   sees the question and the copy in the consultation's own row AND NOTHING ELSE of the patient;
 *                   answers once, while it is open
 *   the periods     readable while open and not past the pack's open period; after closing, for the pack's period
 *                   more; then exactly like a consultation that does not exist. Closing never gives back what ended.
 *   isolation       the asking doctor, the consulted doctor, A THIRD DOCTOR; a second patient; another country's
 *                   rows; a closed consultation; an expired one — through the library and through the real handlers
 *
 * Real handlers and real library code. The database and sign-in are stand-ins inside this process; any network
 * address fails the test — so nothing can have been sent, and no model called. Synthetic data only.
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
/** The pack switches consultation on (the feature, both periods, the consent's stamp). */
let ACIK = false
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let sifreCoz: (s: string) => string
let K: typeof import('./konsultasyon')
let C: typeof import('./sabitler')
let H: typeof import('../uygulama/hastalar')
let T: typeof import('../uygulama/tablolar')
let rota: Mod
let ACIK_GUN = 0, SONRA_GUN = 0, RIZA = ''

const DA = '10000000-0000-4000-8000-00000000000a' // the asking doctor
const DB = '10000000-0000-4000-8000-00000000000b' // the consulted doctor
const DC = '10000000-0000-4000-8000-00000000000c' // A THIRD DOCTOR: part of nothing
const H1 = '30000000-0000-4000-8000-000000000001' // patient of doctor A
const H2 = '30000000-0000-4000-8000-000000000002' // SECOND patient of doctor A
const H3 = '30000000-0000-4000-8000-000000000003' // patient of doctor B
const YOK = '77777777-7777-4777-8777-777777777777'
const YABANCI = 'zz'
const GIZLI = 'QA-CONSULT-NEVER-IN-CLEAR-TEXT'
const NOT_METNI = 'QA-NOTE-TEXT'
const DOKUM = 'QA-TRANSCRIPT-NEVER-SHARED'
const OZET = 'QA-SUMMARY-FOR-THE-PATIENT'
const AD: Record<string, string> = { [H1]: 'QA Patient One', [H2]: 'QA Patient Two', [H3]: 'QA Patient Three' }
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()
const GUN = 86_400_000

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const satirlar = () => tablo('ulke_konsultasyonlar')
const simdiIso = () => new Date().toISOString()
const ilerle = (ms: number) => mock.timers.tick(ms)
const anlik = () => JSON.stringify([satirlar(), tablo('ulke_konsultasyon_kodlari')])
const satir = (id: string) => satirlar().find((x) => x.id === id) as Satir

function hastaEkle(id: string, doktor: string, ulke = BU) {
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: AD[id] ?? 'QA Foreign' })), dob_encrypted: sifrele('1990-05-05'), gender_encrypted: null, phone_encrypted: null, is_active: true, created_at: simdiIso() })
  tablo('hasta_ulke_bilgisi').push({ patient_id: id, ulke, doctor_id: doktor, dil: paket.uygulama?.hastaDilleri[0] ?? '', ota_ismi_encrypted: null, ulusal_kimlik_encrypted: null })
}
let notSayaci = 0
/** A visit with its transcript and a note; `ozet` adds a summary for the patient. */
function notEkle(doktor: string, hasta: string, onayli: boolean, s: { ozet?: boolean; gun?: string; isaret?: string } = {}): string {
  const n = ++notSayaci
  const seans = `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`, id = `50000000-0000-4000-8000-${String(n).padStart(12, '0')}`
  const dil = paket.uygulama!.diller[0], gun = s.gun ?? '2026-10-05', isaret = s.isaret ?? NOT_METNI
  tablo('ulke_muayeneler').push({ id: seans, ulke: BU, doctor_id: doktor, patient_id: hasta, started_at: `${gun}T06:00:00.000Z`, created_at: `${gun}T06:00:00.000Z`, specialty: 'x', transcript_cleaned: DOKUM })
  tablo('muayene_dil_kaydi').push({ session_id: seans, ulke: BU, doctor_id: doktor, patient_id: hasta, not_dili: dil, sablon: 'x' })
  tablo('ulke_notlar').push({ id, ulke: BU, doctor_id: doktor, session_id: seans, approved_at: onayli ? `${gun}T07:00:00.000Z` : null, approved_by: onayli ? doktor : null, content_subjektif: `${isaret} S`, content_objektif: `${isaret} O`, content_degerlendirme: `${isaret} A`, content_plan: `${isaret} P`, created_at: `${gun}T06:30:00.000Z` })
  tablo('not_dil_kaydi').push({ note_id: id, ulke: BU, doctor_id: doktor, patient_id: hasta, not_dili: dil, ikinci_dil: null, alanlar: null, ikinci_alanlar: null })
  if (s.ozet) tablo('ulke_hasta_ozetleri').push({ id: `60000000-0000-4000-8000-${String(n).padStart(12, '0')}`, ulke: BU, doctor_id: doktor, patient_id: hasta, note_id: id, dil, ozet_encrypted: sifrele(`${OZET} of ${isaret}`), paylasildi_at: null, created_at: simdiIso(), updated_at: simdiIso() })
  return id
}
function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  const d = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  for (const [jeton, id, ad] of [['jeton-a', DA, 'QA Doctor A'], ['jeton-b', DB, 'QA Doctor B'], ['jeton-c', DC, 'QA Doctor C']] as const) {
    vt.hesaplar[jeton] = { id, email: `qa-${jeton}@notya.test`, app_metadata: { country: BU } }
    tablo('ulke_hesaplari').push({ id, full_name: ad, ulke: BU, ui_language: d })
    tablo('hekim_dil_tercihleri').push({ ulke: BU, doctor_id: id, not_dili: d, soruldu_at: 'x' })
    if (paket.uygulama?.roller?.[0]) tablo('hekim_rolu').push({ ulke: BU, doctor_id: id, rol: paket.uygulama.roller[0] })
  }
  hastaEkle(H1, DA); hastaEkle(H2, DA); hastaEkle(H3, DB)
}
const kodAl = async (doktor: string) => { const r = await K.kodUret(sb(), doktor); assert.equal(r.tamam, true, JSON.stringify(r)); return (r as { kod: string }).kod }
type Ek = Partial<import('./konsultasyon').IstekGirdisi>
/** Doctor A asks doctor B about H1 — unless told otherwise. */
async function iste(ek: Ek & { doktor?: string; kime?: string } = {}) {
  const { doktor = DA, kime = DB, ...g } = ek
  const kod = 'kod' in g ? g.kod : await kodAl(kime)
  return K.konsultasyonIste(sb(), doktor, { hastaId: H1, soru: `${GIZLI} what do you think?`, paylasimTuru: 'yok', notId: null, riza: true, ...g, kod })
}
const tamam = async (ek: Parameters<typeof iste>[0] = {}) => { const r = await iste(ek); assert.equal(r.tamam, true, JSON.stringify(r)); return (r as { id: string }).id }

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  NextRequest = (await import('next/server')).NextRequest
  const sifre = await import('@/lib/security/encryption')
  sifrele = sifre.encrypt; sifreCoz = sifre.decrypt
  K = await import('./konsultasyon'); C = await import('./sabitler'); H = await import('../uygulama/hastalar'); T = await import('../uygulama/tablolar')
  ACIK = K.konsultasyonAcik()
  if (ACIK) { ACIK_GUN = paket.uygulama!.konsultasyon!.acikGun; SONRA_GUN = paket.uygulama!.konsultasyon!.kapanisSonrasiGun; RIZA = (await import('@/countries/active/klinik')).AKTIF_KLINIK!.konsultasyonRizasi!.surum }
  rota = (await import('../../../app/api/ulke/konsultasyon/route.ulke')) as unknown as Mod
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); notSayaci = 0; if (paket.ozellikler.cekirdekMuayene) sifirla() })

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
const API = '/api/ulke/konsultasyon'

describe('consultation — the code: found by an exact code, and in no other way', () => {
  it('A PACK WITHOUT CONSULTATION: every method of the route answers "not found", with a valid session too, and nothing is read', async () => {
    if (ACIK) return
    assert.equal(K.konsultasyonAcik(), false)
    const once = vt.sorgular.length
    for (const [y, yol, govde] of [['GET', `${API}?gorunum=gelen`, undefined], ['GET', `${API}?gorunum=kod`, undefined], ['POST', API, { islem: 'kod' }], ['POST', API, { islem: 'iste', hastaId: H1, kod: 'x', soru: 'x', paylasimTuru: 'yok', riza: true }], ['PATCH', API, { id: YOK, islem: 'kapat' }]] as const) {
      const r = await cagir(y, yol, { jeton: 'jeton-a', ...(govde ? { govde } : {}) })
      assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }], `${y} ${yol}`)
    }
    assert.equal(vt.sorgular.length, once)
    assert.deepEqual(Object.keys(rota).filter((k) => /^[A-Z]+$/.test(k)).sort(), ['GET', 'PATCH', 'POST'])
  })

  it('an account has no code until it makes one; the code is kept as a hash and an encrypted value, never in the clear; a new code replaces the old', async () => {
    if (!ACIK) return
    assert.equal(await K.kodumuOku(sb(), DB), null)
    const kod = await kodAl(DB)
    assert.equal(kod.length, C.KOD_UZUNLUGU); assert.ok([...kod].every((h) => C.KOD_ALFABESI.includes(h)))
    assert.equal(await K.kodumuOku(sb(), DB), kod)
    const s = tablo('ulke_konsultasyon_kodlari')[0]
    assert.deepEqual([s.ulke, s.doctor_id], [BU, DB]); assert.match(String(s.kod_hash), /^[0-9a-f]{64}$/)
    assert.ok(!anlik().includes(kod), 'the code is in the database in the clear')
    assert.deepEqual(await K.meslektasBul(sb(), DA, kod), { ad: 'QA Doctor B', rol: (await import('../arayuz')).rolAdi(paket.uygulama?.roller?.[0], paket.uygulama!.diller[0]) ?? '' })
    // typed with spaces, a hyphen, in lower case
    assert.ok(await K.meslektasBul(sb(), DA, ` ${C.koduYaz(kod).toLowerCase()} `))
    const yeni = await kodAl(DB)
    assert.notEqual(yeni, kod); assert.equal(tablo('ulke_konsultasyon_kodlari').length, 1, 'an account has one code')
    assert.equal(await K.meslektasBul(sb(), DA, kod), null, 'the old code still finds the account')
    assert.ok(await K.meslektasBul(sb(), DA, yeni)); assert.equal(await K.kodumuOku(sb(), DB), yeni)
  })

  it('NOBODY IS FOUND WITHOUT THEIR EXACT CODE: a malformed code, an unknown one, part of one, the caller\'s own, another country\'s — all answer nothing', async () => {
    if (!ACIK) return
    const kodB = await kodAl(DB), kodA = await kodAl(DA)
    for (const x of ['', null, undefined, 12, kodB.slice(0, 9), `${kodB}A`, kodB.slice(0, 5), '%', '*', 'QA Doctor B', DB, kodB.replace(/.$/, (h) => (h === 'A' ? 'B' : 'A'))]) assert.equal(await K.meslektasBul(sb(), DA, x), null, String(x))
    assert.equal(await K.meslektasBul(sb(), DA, kodA), null, 'a doctor found themselves')
    // the very same hash in another country's row names nobody here
    tablo('ulke_konsultasyon_kodlari').push({ id: 'yabanci-kod', ulke: YABANCI, doctor_id: DC, kod_hash: tablo('ulke_konsultasyon_kodlari').find((x) => x.doctor_id === DB)!.kod_hash, kod_encrypted: 'x' })
    vt.tablolar.ulke_konsultasyon_kodlari = tablo('ulke_konsultasyon_kodlari').filter((x) => !(x.doctor_id === DB && x.ulke === BU))
    assert.equal(await K.meslektasBul(sb(), DA, kodB), null, 'a code of another country was found')
  })

  it('THERE IS NO DIRECTORY: no statement lists codes or accounts — a code is read by its exact hash or by its own account, an account by an id the caller already named', async () => {
    if (!ACIK) return
    const kod = await kodAl(DB)
    notEkle(DA, H1, true)
    vt.sorgular.length = 0
    await K.kodumuOku(sb(), DA); await K.meslektasBul(sb(), DA, kod); await K.meslektasBul(sb(), DA, 'ZZZZZZZZZZ'); const id = await tamam({ kod })
    await K.gidenKonsultasyonlar(sb(), DA); await K.gelenKonsultasyonlar(sb(), DB); await K.konsultasyonOkundu(sb(), DB, id); await K.konsultasyonCevapla(sb(), DB, id, 'answer'); await K.konsultasyonKapat(sb(), DA, id)
    for (const q of vt.sorgular.filter((x) => x.tablo === 'ulke_konsultasyon_kodlari' && x.islem === 'select')) assert.ok(q.filtreler.some((f) => /^kod_hash=eq\.[0-9a-f]{64}$/.test(f) || /^doctor_id=eq\./.test(f)), `codes were read without an exact code or an account: [${q.filtreler.join(' ')}]`)
    for (const q of vt.sorgular.filter((x) => x.tablo === 'ulke_hesaplari')) assert.ok(q.filtreler.some((f) => /^id=(eq\.|in\.\()/.test(f)), `accounts were read without naming them: [${q.filtreler.join(' ')}]`)
    // and the route has no way to ask for one
    const kaynak = readFileSync(join(__dirname, '../../../app/api/ulke/konsultasyon/route.ulke.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.deepEqual([...kaynak.matchAll(/gorunum === '([a-z]+)'/g)].map((m) => m[1]).sort(), ['gelen', 'giden', 'kod', 'notlar'])
    assert.deepEqual([...new Set([...kaynak.matchAll(/islem [!=]== '([a-z]+)'/g)].map((m) => m[1]))].sort(), ['bul', 'cevap', 'iste', 'kapat', 'kod', 'okundu'])
    assert.doesNotMatch(readFileSync(join(__dirname, 'konsultasyon.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''), /full_name'\)\s*\.(ilike|like|order)|\.ilike\(|\.like\(|auth\.admin|listUsers|email/, 'the library searches accounts')
  })
})

describe('consultation — asking: the patient, the consent, and what is shared', () => {
  it('THE RECORD: who asked whom about which patient, on which consent wording, when, and until when it may be read while open', async () => {
    if (!ACIK) return
    const id = await tamam()
    const s = satir(id)
    assert.deepEqual({ ulke: s.ulke, d: s.doctor_id, h: s.patient_id, x: s.danisilan_id, tur: s.paylasim_turu, n: s.note_id, kopya: s.paylasim_encrypted, riza: s.riza_surumu, rizaAni: s.riza_at, okundu: s.okundu_at, cevap: s.cevap_at, kapandi: s.kapandi_at, bitis: s.erisim_bitis, son: s.son_gecerlilik },
      { ulke: BU, d: DA, h: H1, x: DB, tur: 'yok', n: null, kopya: null, riza: RIZA, rizaAni: simdiIso(), okundu: null, cevap: null, kapandi: null, bitis: null, son: new Date(Date.now() + ACIK_GUN * GUN).toISOString() })
    assert.ok(!anlik().includes(GIZLI), 'the question is in the database in the clear')
    assert.deepEqual(JSON.parse(sifreCoz(String(s.soru_encrypted))), { v: 1, u: BU, k: id, t: 'soru', d: DA, x: DB, m: `${GIZLI} what do you think?` })
  })

  it('THE CONSENT TICK IS REQUIRED: without it nothing is written, whatever else is right', async () => {
    if (!ACIK) return
    const kod = await kodAl(DB)
    for (const riza of [false, undefined, null, 'true', 1, {}]) assert.deepEqual(await iste({ kod, riza }), { tamam: false, kod: 'RIZA_GEREKLI' }, String(riza))
    assert.equal(satirlar().length, 0)
  })

  it('SHARING A NOTE: a COPY of the four sections of one APPROVED note of THAT patient with the day of the visit — never the transcript, never the patient\'s name', async () => {
    if (!ACIK) return
    const n = notEkle(DA, H1, true, { gun: '2026-10-05' })
    const id = await tamam({ paylasimTuru: 'not', notId: n })
    assert.deepEqual([satir(id).paylasim_turu, satir(id).note_id], ['not', n])
    const kopya = JSON.parse(sifreCoz(String(satir(id).paylasim_encrypted))).m
    assert.deepEqual(kopya, { tur: 'not', muayeneGunu: '2026-10-05', dil: paket.uygulama!.diller[0], sablon: 'x', s: `${NOT_METNI} S`, o: `${NOT_METNI} O`, a: `${NOT_METNI} A`, p: `${NOT_METNI} P`, alanlar: {} })
    const gelen = JSON.stringify(await K.gelenKonsultasyonlar(sb(), DB))
    assert.ok(gelen.includes(`${NOT_METNI} A`))
    for (const yasak of [DOKUM, AD[H1], H1, n, '1990-05-05']) assert.ok(!gelen.includes(yasak), `the consulted doctor was given "${yasak}"`)
  })

  it('WHAT MAY NOT BE SHARED: a draft, a note of ANOTHER patient of the same doctor, another doctor\'s note, a note that does not exist — refused, nothing written', async () => {
    if (!ACIK) return
    const kod = await kodAl(DB)
    const taslak = notEkle(DA, H1, false), baskaHasta = notEkle(DA, H2, true, { isaret: 'QA-OTHER-PATIENT' }), baskaHekim = notEkle(DB, H3, true, { isaret: 'QA-OTHER-DOCTOR' })
    for (const [notId, ne] of [[taslak, 'a draft'], [baskaHasta, 'another patient\'s note'], [baskaHekim, 'another doctor\'s note'], [YOK, 'no note'], ['', 'an empty id']] as const) {
      for (const paylasimTuru of ['not', 'ozet'] as const) assert.deepEqual(await iste({ kod, paylasimTuru, notId }), { tamam: false, kod: notId === '' ? 'PAYLASIM' : 'NOT_UYGUN' }, `${ne} as ${paylasimTuru}`)
    }
    for (const paylasimTuru of ['everything', '', null, undefined, 'dosya']) assert.deepEqual(await iste({ kod, paylasimTuru }), { tamam: false, kod: 'PAYLASIM' })
    assert.equal(satirlar().length, 0)
    // the database's own rule, for a write that got past the application
    const { error } = await T.ulkeTablosu(sb(), 'ulke_konsultasyonlar').insert({ id: 'dogrudan', doctor_id: DA, patient_id: H1, danisilan_id: DB, paylasim_turu: 'not', note_id: taslak, soru_encrypted: 'x', paylasim_encrypted: 'x', riza_surumu: 'r', riza_at: simdiIso(), son_gecerlilik: simdiIso(), okundu_at: null, cevap_encrypted: null, cevap_at: null, kapandi_at: null, erisim_bitis: null })
    assert.equal((error as { code?: string } | null)?.code, '23514')
  })

  it('SHARING THE SUMMARY: a copy of the summary for the patient of that approved note, and nothing of the note itself; a note without a summary is refused', async () => {
    if (!ACIK) return
    const ozetli = notEkle(DA, H1, true, { ozet: true }), ozetsiz = notEkle(DA, H1, true, { gun: '2026-10-07', isaret: 'QA-SECOND' })
    assert.deepEqual(await iste({ paylasimTuru: 'ozet', notId: ozetsiz }), { tamam: false, kod: 'OZET_YOK' })
    const id = await tamam({ paylasimTuru: 'ozet', notId: ozetli })
    const [c] = (await K.gelenKonsultasyonlar(sb(), DB))
    assert.deepEqual(c.kopya, { tur: 'ozet', muayeneGunu: '2026-10-05', dil: paket.uygulama!.diller[0], metin: `${OZET} of ${NOT_METNI}` })
    assert.ok(!JSON.stringify(c).includes(`${NOT_METNI} S`) && !JSON.stringify(c).includes(DOKUM), 'the note or the transcript went with the summary')
    // THE COPY DOES NOT FOLLOW THE FILE: the doctor rewrites the summary afterwards
    tablo('ulke_hasta_ozetleri')[0].ozet_encrypted = sifrele('QA-REWRITTEN-LATER')
    assert.equal(((await K.gelenKonsultasyonlar(sb(), DB))[0].kopya as { metin: string }).metin, `${OZET} of ${NOT_METNI}`)
    assert.equal(satir(id).note_id, ozetli)
  })

  it('the notes that can be shared are the patient\'s APPROVED ones, by day, each saying whether it has a summary; another doctor\'s patient has none to offer', async () => {
    if (!ACIK) return
    const a = notEkle(DA, H1, true, { ozet: true, gun: '2026-10-05' }); notEkle(DA, H1, false, { gun: '2026-10-06' }); const b = notEkle(DA, H1, true, { gun: '2026-10-08' }); notEkle(DA, H2, true)
    assert.deepEqual(await K.paylasilabilirNotlar(sb(), DA, H1), [{ notId: b, gun: '2026-10-08', ozetVar: false }, { notId: a, gun: '2026-10-05', ozetVar: true }])
    assert.equal(await K.paylasilabilirNotlar(sb(), DB, H1), null); assert.equal(await K.paylasilabilirNotlar(sb(), DA, YOK), null)
  })

  it('refused before anything is written: a patient who is not the doctor\'s, no question, a question too long, a code that names nobody or the doctor themselves; and the daily limit', async () => {
    if (!ACIK) return
    const kod = await kodAl(DB), kendi = await kodAl(DA)
    assert.deepEqual(await iste({ kod, hastaId: H3 }), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await iste({ kod, hastaId: YOK }), { tamam: false, kod: 'NOT_FOUND' })
    for (const soru of ['', '  \n ', null, 7]) assert.deepEqual(await iste({ kod, soru }), { tamam: false, kod: 'SORU_GEREKLI' })
    assert.deepEqual(await iste({ kod, soru: 'x'.repeat(C.SORU_AZAMI + 1) }), { tamam: false, kod: 'UZUN' })
    for (const k of [kendi, 'ZZZZZZZZZZ', '', null, DB]) assert.deepEqual(await iste({ kod: k }), { tamam: false, kod: 'MESLEKTAS_YOK' }, String(k))
    assert.equal(satirlar().length, 0)
    for (let n = 0; n < C.KONSULTASYON_GUNLUK_AZAMI; n++) { ilerle(1000); await tamam({ kod }) }
    assert.deepEqual(await iste({ kod }), { tamam: false, kod: 'LIMIT' })
    ilerle(GUN)
    await tamam({ kod })
  })
})

describe('consultation — the consulted doctor: the copy in the row, and nothing else of the patient', () => {
  it('NOTHING ELSE OF THE PATIENT: the answer names no patient, and no statement made for the consulted doctor reads a table of the patient', async () => {
    if (!ACIK) return
    const n = notEkle(DA, H1, true, { ozet: true }); notEkle(DA, H1, true, { gun: '2026-10-09', isaret: 'QA-NOT-SHARED-NOTE' })
    const id = await tamam({ paylasimTuru: 'not', notId: n })
    vt.sorgular.length = 0
    const liste = await K.gelenKonsultasyonlar(sb(), DB)
    await K.konsultasyonOkundu(sb(), DB, id); await K.konsultasyonCevapla(sb(), DB, id, 'my opinion')
    assert.deepEqual(Object.keys(liste[0]).sort(), ['cevap', 'cevapAni', 'id', 'isteyen', 'kapandi', 'kopya', 'okunabilir', 'okundu', 'olusturuldu', 'paylasimTuru', 'soru'], 'the consulted doctor\'s view gained a field')
    assert.deepEqual(liste[0].isteyen.ad, 'QA Doctor A')
    const HASTA_TABLOLARI = ['ulke_hastalar', 'hasta_ulke_bilgisi', 'ulke_muayeneler', 'muayene_dil_kaydi', 'ulke_notlar', 'not_dil_kaydi', 'ulke_hasta_ozetleri', 'ulke_portal_erisimleri', 'ulke_hasta_formlari', 'ulke_arac_kayitlari', 'ulke_hasta_mesajlari', 'ulke_mesaj_yazismalari', 'ulke_randevulari']
    const okunan = [...new Set(vt.sorgular.map((q) => q.tablo))]
    for (const t of okunan) assert.ok(!HASTA_TABLOLARI.includes(t), `a statement for the consulted doctor read ${t}`)
    for (const q of vt.sorgular.filter((x) => x.tablo === 'ulke_konsultasyonlar')) assert.ok(q.filtreler.includes(`danisilan_id=eq.${DB}`), `[${q.filtreler.join(' ')}]: not bound to the consulted doctor`)
    assert.ok(!JSON.stringify(liste).includes('QA-NOT-SHARED-NOTE'))
    // and the patient's own file stays closed to them through every other door
    assert.equal(await H.hastaGetir(sb(), DB, H1), null)
    assert.equal(await K.paylasilabilirNotlar(sb(), DB, H1), null)
    assert.equal(await K.gidenKonsultasyonlar(sb(), DB, H1), null)
    assert.deepEqual(await K.gidenKonsultasyonlar(sb(), DB), [], 'what a doctor was asked is not what they asked')
  })

  it('FIRST READING is recorded once, by the consulted doctor only; THE ANSWER is given once, encrypted, and the asking doctor reads it', async () => {
    if (!ACIK) return
    const id = await tamam()
    assert.deepEqual(await K.konsultasyonOkundu(sb(), DA, id), { tamam: false, kod: 'NOT_FOUND' }, 'the asking doctor "read" their own request')
    ilerle(3_600_000)
    assert.deepEqual(await K.konsultasyonOkundu(sb(), DB, id), { tamam: true })
    const ilk = satir(id).okundu_at
    assert.equal(ilk, simdiIso())
    ilerle(3_600_000); await K.konsultasyonOkundu(sb(), DB, id)
    assert.equal(satir(id).okundu_at, ilk)
    for (const bos of ['', ' \n', null, 5]) assert.deepEqual(await K.konsultasyonCevapla(sb(), DB, id, bos), { tamam: false, kod: 'CEVAP_GEREKLI' })
    assert.deepEqual(await K.konsultasyonCevapla(sb(), DB, id, 'x'.repeat(C.CEVAP_AZAMI + 1)), { tamam: false, kod: 'UZUN' })
    assert.deepEqual(await K.konsultasyonCevapla(sb(), DA, id, 'answering my own question'), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.konsultasyonCevapla(sb(), DB, id, `${GIZLI} my opinion`), { tamam: true })
    assert.ok(!anlik().includes(GIZLI))
    assert.deepEqual(await K.konsultasyonCevapla(sb(), DB, id, 'a second answer'), { tamam: false, kod: 'DURUM' })
    const [g] = (await K.gidenKonsultasyonlar(sb(), DA))!
    assert.deepEqual([g.cevap, g.cevapAni, g.okundu, g.hastaId, g.hastaAdi, g.meslektas.ad, g.rizaSurumu], [`${GIZLI} my opinion`, simdiIso(), ilk, H1, AD[H1], 'QA Doctor B', RIZA])
    // the database's own rule
    const { error } = await T.ulkeTablosu(sb(), 'ulke_konsultasyonlar').update({ cevap_encrypted: 'changed' }).eq('id', id).eq('danisilan_id', DB)
    assert.equal((error as { code?: string } | null)?.code, '23514')
    const { error: e2 } = await T.ulkeTablosu(sb(), 'ulke_konsultasyonlar').update({ soru_encrypted: 'changed' }).eq('id', id).eq('doctor_id', DA)
    assert.equal((e2 as { code?: string } | null)?.code, '23514', 'the question changed after it was asked')
  })

  it('A VALUE THAT IS NOT THE ROW\'S OWN IS NOT SHOWN: a question or a copy moved from another consultation reads as nothing', async () => {
    if (!ACIK) return
    const n = notEkle(DA, H1, true)
    const kod = await kodAl(DB)
    const a = await tamam({ kod, paylasimTuru: 'not', notId: n, soru: `${GIZLI} first` }), b = await tamam({ kod, hastaId: H2, soru: 'second' })
    // somebody with access to the database copies the first consultation's question and copy into the second
    Object.assign(satir(b), { soru_encrypted: satir(a).soru_encrypted, paylasim_encrypted: satir(a).paylasim_encrypted, paylasim_turu: 'not', note_id: n })
    const ikinci = (await K.gelenKonsultasyonlar(sb(), DB)).find((x) => x.id === b)!
    assert.deepEqual([ikinci.soru, ikinci.kopya], ['', null])
  })
})

describe('consultation — the periods: while open, the pack\'s period after closing, then nothing', () => {
  it('CLOSING: by the asking doctor only, once; no answer afterwards; the consulted doctor reads it for the pack\'s period more, and then it is as if it did not exist', async () => {
    if (!ACIK) return
    const n = notEkle(DA, H1, true)
    const id = await tamam({ paylasimTuru: 'not', notId: n })
    assert.deepEqual(await K.konsultasyonKapat(sb(), DB, id), { tamam: false, kod: 'NOT_FOUND' }, 'the consulted doctor closed it')
    ilerle(2 * GUN)
    assert.deepEqual(await K.konsultasyonKapat(sb(), DA, id), { tamam: true })
    const kapanis = Date.now()
    assert.deepEqual([satir(id).kapandi_at, satir(id).erisim_bitis], [new Date(kapanis).toISOString(), new Date(kapanis + SONRA_GUN * GUN).toISOString()])
    assert.deepEqual(await K.konsultasyonKapat(sb(), DA, id), { tamam: false, kod: 'DURUM' })
    if (SONRA_GUN > 0) {
      // still readable, with its copy; not answerable
      ilerle(SONRA_GUN * GUN - 60_000)
      const [c] = await K.gelenKonsultasyonlar(sb(), DB)
      assert.deepEqual([c.id, Boolean(c.kopya), c.kapandi, c.okunabilir], [id, true, new Date(kapanis).toISOString(), new Date(kapanis + SONRA_GUN * GUN).toISOString()])
      assert.deepEqual(await K.konsultasyonCevapla(sb(), DB, id, 'too late'), { tamam: false, kod: 'DURUM' })
      assert.deepEqual(await K.konsultasyonOkundu(sb(), DB, id), { tamam: true }, 'a first reading after closing is still recorded')
      ilerle(120_000)
    } else ilerle(1000)
    // THE PERIOD IS OVER
    const once = anlik()
    assert.deepEqual(await K.gelenKonsultasyonlar(sb(), DB), [])
    assert.deepEqual(await K.konsultasyonOkundu(sb(), DB, id), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.konsultasyonCevapla(sb(), DB, id, 'x'), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(anlik(), once)
    // the asking doctor's own record stays
    assert.deepEqual((await K.gidenKonsultasyonlar(sb(), DA))!.map((x) => [x.id, Boolean(x.kapandi), Boolean(x.kopya)]), [[id, true, true]])
  })

  it('AN OPEN CONSULTATION PAST THE PACK\'S OPEN PERIOD is unreadable and unanswerable for the consulted doctor; the asking doctor is told, and CLOSING IT DOES NOT GIVE IT BACK', async () => {
    if (!ACIK) return
    const id = await tamam()
    ilerle(ACIK_GUN * GUN - 60_000)
    assert.equal((await K.gelenKonsultasyonlar(sb(), DB)).length, 1)
    assert.equal((await K.gidenKonsultasyonlar(sb(), DA))![0].suresiDoldu, false)
    ilerle(120_000)
    const once = anlik()
    assert.deepEqual(await K.gelenKonsultasyonlar(sb(), DB), [])
    assert.deepEqual(await K.konsultasyonCevapla(sb(), DB, id, 'x'), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.konsultasyonOkundu(sb(), DB, id), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(anlik(), once)
    assert.deepEqual((await K.gidenKonsultasyonlar(sb(), DA))!.map((x) => [x.suresiDoldu, x.kapandi]), [[true, null]])
    ilerle(GUN)
    assert.deepEqual(await K.konsultasyonKapat(sb(), DA, id), { tamam: true })
    assert.equal(satir(id).erisim_bitis, satir(id).kapandi_at, 'closing an expired consultation opened a new period')
    assert.deepEqual(await K.gelenKonsultasyonlar(sb(), DB), [], 'CLOSING GAVE BACK WHAT HAD ALREADY ENDED')
    assert.deepEqual(await K.konsultasyonOkundu(sb(), DB, id), { tamam: false, kod: 'NOT_FOUND' })
  })

  it('the period cannot be stretched afterwards: the database refuses a later end, a reopening and a moved closing', async () => {
    if (!ACIK) return
    const id = await tamam()
    const t = () => T.ulkeTablosu(sb(), 'ulke_konsultasyonlar')
    assert.equal(((await t().update({ son_gecerlilik: '2999-01-01T00:00:00.000Z' }).eq('id', id).eq('doctor_id', DA)).error as { code?: string } | null)?.code, '23514')
    await K.konsultasyonKapat(sb(), DA, id)
    assert.equal(((await t().update({ erisim_bitis: '2999-01-01T00:00:00.000Z' }).eq('id', id).eq('doctor_id', DA)).error as { code?: string } | null)?.code, '23514')
    assert.equal(((await t().update({ kapandi_at: null, erisim_bitis: null }).eq('id', id).eq('doctor_id', DA)).error as { code?: string } | null)?.code, '23514')
    assert.equal(((await t().update({ danisilan_id: DC }).eq('id', id).eq('doctor_id', DA)).error as { code?: string } | null)?.code, '23514', 'a consultation moved to another colleague')
  })
})

describe('consultation — isolation', () => {
  it('A THIRD DOCTOR is part of nothing: lists nothing, and reads, answers and closes nothing — exactly like an id that does not exist', async () => {
    if (!ACIK) return
    const n = notEkle(DA, H1, true)
    const id = await tamam({ paylasimTuru: 'not', notId: n })
    const once = anlik()
    assert.deepEqual(await K.gelenKonsultasyonlar(sb(), DC), []); assert.deepEqual(await K.gidenKonsultasyonlar(sb(), DC), [])
    assert.equal(await K.gidenKonsultasyonlar(sb(), DC, H1), null)
    for (const x of [id, YOK]) {
      assert.deepEqual(await K.konsultasyonOkundu(sb(), DC, x), { tamam: false, kod: 'NOT_FOUND' })
      assert.deepEqual(await K.konsultasyonCevapla(sb(), DC, x, 'x'), { tamam: false, kod: 'NOT_FOUND' })
      assert.deepEqual(await K.konsultasyonKapat(sb(), DC, x), { tamam: false, kod: 'NOT_FOUND' })
    }
    assert.equal(anlik(), once)
  })

  it('SECOND PATIENT: the list for one patient holds only that patient\'s consultations; each side sees its own direction only', async () => {
    if (!ACIK) return
    const kodB = await kodAl(DB), kodA = await kodAl(DA)
    const a1 = await tamam({ kod: kodB, soru: 'about patient one' }); ilerle(1000)
    const a2 = await tamam({ kod: kodB, hastaId: H2, soru: 'about patient two' }); ilerle(1000)
    const b3 = await tamam({ doktor: DB, kod: kodA, hastaId: H3, soru: 'B asks A about patient three' })
    assert.deepEqual((await K.gidenKonsultasyonlar(sb(), DA, H1))!.map((x) => x.id), [a1])
    assert.deepEqual((await K.gidenKonsultasyonlar(sb(), DA, H2))!.map((x) => x.id), [a2])
    assert.deepEqual((await K.gidenKonsultasyonlar(sb(), DA))!.map((x) => x.id), [a2, a1])
    assert.deepEqual((await K.gelenKonsultasyonlar(sb(), DA)).map((x) => x.id), [b3])
    assert.deepEqual((await K.gelenKonsultasyonlar(sb(), DB)).map((x) => x.id), [a2, a1])
    assert.deepEqual((await K.gidenKonsultasyonlar(sb(), DB))!.map((x) => [x.id, x.hastaAdi]), [[b3, AD[H3]]])
    assert.equal(await K.gidenKonsultasyonlar(sb(), DA, H3), null, 'the consulted doctor listed the asking doctor\'s patient')
  })

  it('ANOTHER COUNTRY\'S ROWS — same ids, in the same table — are not listed, read, answered or closed', async () => {
    if (!ACIK) return
    const id = await tamam()
    satirlar().push({ ...satir(id), id: 'yabanci-1', ulke: YABANCI })
    const yabanci = () => JSON.stringify(satirlar().filter((x) => x.ulke !== BU))
    const once = yabanci()
    assert.deepEqual((await K.gidenKonsultasyonlar(sb(), DA))!.map((x) => x.id), [id])
    assert.deepEqual((await K.gelenKonsultasyonlar(sb(), DB)).map((x) => x.id), [id])
    assert.deepEqual(await K.konsultasyonOkundu(sb(), DB, 'yabanci-1'), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.konsultasyonCevapla(sb(), DB, 'yabanci-1', 'x'), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.konsultasyonKapat(sb(), DA, 'yabanci-1'), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(yabanci(), once)
    // an account of another country cannot be consulted: the database's own key
    tablo('ulke_hesaplari').push({ id: 'yabanci-hekim', full_name: 'QA Foreign Doctor', ulke: YABANCI, ui_language: 'en' })
    const { error } = await T.ulkeTablosu(sb(), 'ulke_konsultasyonlar').insert({ id: 'dogrudan', doctor_id: DA, patient_id: H1, danisilan_id: 'yabanci-hekim', paylasim_turu: 'yok', note_id: null, soru_encrypted: 'x', paylasim_encrypted: null, riza_surumu: 'r', riza_at: simdiIso(), son_gecerlilik: '2999-01-01T00:00:00.000Z', okundu_at: null, cevap_encrypted: null, cevap_at: null, kapandi_at: null, erisim_bitis: null })
    assert.equal((error as { code?: string } | null)?.code, '23503')
  })

  it('EVERY STATEMENT on a consultation is bound to the country and to the signed-in account, as the asking doctor or as the consulted one', async () => {
    if (!ACIK) return
    const kod = await kodAl(DB)
    vt.sorgular.length = 0
    const id = await tamam({ kod })
    await K.gidenKonsultasyonlar(sb(), DA); await K.gidenKonsultasyonlar(sb(), DA, H1); await K.gelenKonsultasyonlar(sb(), DB); await K.konsultasyonOkundu(sb(), DB, id); await K.konsultasyonCevapla(sb(), DB, id, 'x'); await K.konsultasyonKapat(sb(), DA, id)
    const bizim = vt.sorgular.filter((q) => q.tablo === 'ulke_konsultasyonlar')
    assert.ok(bizim.length >= 9, `only ${bizim.length} statements were recorded`)
    for (const q of bizim) {
      assert.equal(q.ulke, BU)
      if (q.islem !== 'insert') assert.ok(q.filtreler.includes(`doctor_id=eq.${DA}`) !== q.filtreler.includes(`danisilan_id=eq.${DB}`), `${q.islem} [${q.filtreler.join(' ')}]: must name exactly one of the two accounts`)
    }
    for (const q of vt.sorgular) assert.ok(q.tablo.startsWith('rpc:') || (T.ULKE_TABLOLARI as readonly string[]).includes(q.tablo), `${q.tablo} is not a country table`)
  })
})

describe('consultation — the route', () => {
  it('the whole way: a code, finding the colleague, asking with the consent tick, the lists of both sides, reading, the answer, closing', async () => {
    if (!ACIK) return
    const n = notEkle(DA, H1, true, { ozet: true })
    assert.deepEqual((await cagir('GET', `${API}?gorunum=kod`, { jeton: 'jeton-b' })).govde, { kod: null })
    const kod = (await cagir('POST', API, { jeton: 'jeton-b', govde: { islem: 'kod' } })).govde.kod as string
    assert.deepEqual((await cagir('GET', `${API}?gorunum=kod`, { jeton: 'jeton-b' })).govde, { kod })
    const bul = await cagir('POST', API, { jeton: 'jeton-a', govde: { islem: 'bul', kod } })
    assert.deepEqual([bul.status, Object.keys(bul.govde), Object.keys(bul.govde.meslektas).sort(), bul.govde.meslektas.ad], [200, ['meslektas'], ['ad', 'rol'], 'QA Doctor B'])
    assert.ok(!bul.ham.includes(DB), 'finding a colleague answered with their account id')
    assert.deepEqual((await cagir('GET', `${API}?gorunum=notlar&hasta=${H1}`, { jeton: 'jeton-a' })).govde, { notlar: [{ notId: n, gun: '2026-10-05', ozetVar: true }] })
    const y = await cagir('POST', API, { jeton: 'jeton-a', govde: { islem: 'iste', hastaId: H1, kod, soru: `${GIZLI} question`, paylasimTuru: 'not', notId: n, riza: true } })
    assert.deepEqual([y.status, Object.keys(y.govde)], [200, ['id']])
    const id = y.govde.id as string
    const gelen = await cagir('GET', `${API}?gorunum=gelen`, { jeton: 'jeton-b' })
    assert.deepEqual([gelen.govde.konsultasyonlar.length, gelen.govde.konsultasyonlar[0].soru, gelen.govde.konsultasyonlar[0].kopya.tur], [1, `${GIZLI} question`, 'not'])
    for (const yasak of [H1, AD[H1], n, DOKUM, DA]) assert.ok(!gelen.ham.includes(yasak), `the consulted doctor's answer holds "${yasak}"`)
    assert.deepEqual((await cagir('PATCH', API, { jeton: 'jeton-b', govde: { id, islem: 'okundu' } })).govde, { ok: true })
    assert.deepEqual((await cagir('PATCH', API, { jeton: 'jeton-b', govde: { id, islem: 'cevap', cevap: 'my opinion' } })).govde, { ok: true })
    const giden = await cagir('GET', `${API}?gorunum=giden&hasta=${H1}`, { jeton: 'jeton-a' })
    assert.deepEqual([giden.govde.konsultasyonlar[0].cevap, giden.govde.konsultasyonlar[0].hastaAdi, Boolean(giden.govde.konsultasyonlar[0].okundu)], ['my opinion', AD[H1], true])
    assert.deepEqual((await cagir('PATCH', API, { jeton: 'jeton-a', govde: { id, islem: 'kapat' } })).govde, { ok: true })
    for (const [jeton, govde, durum, kod2] of [['jeton-a', { id, islem: 'kapat' }, 409, 'DURUM'], ['jeton-b', { id, islem: 'cevap', cevap: 'again' }, 409, 'DURUM']] as const) {
      const r = await cagir('PATCH', API, { jeton, govde })
      assert.deepEqual([r.status, r.govde], [durum, { code: kod2 }])
    }
  })

  it('every refusal with its code: no consent, no question, a code that names nobody, a note that may not be shared, a view or an action that is none', async () => {
    if (!ACIK) return
    const kod = await kodAl(DB)
    const taslak = notEkle(DA, H1, false), ozetsiz = notEkle(DA, H1, true)
    const temel = { islem: 'iste', hastaId: H1, kod, soru: 'q', paylasimTuru: 'yok', riza: true }
    for (const [govde, durum, k] of [
      [{ ...temel, riza: false }, 400, 'RIZA_GEREKLI'], [{ ...temel, riza: undefined }, 400, 'RIZA_GEREKLI'], [{ ...temel, soru: '' }, 400, 'SORU_GEREKLI'], [{ ...temel, soru: 'x'.repeat(C.SORU_AZAMI + 1) }, 400, 'UZUN'],
      [{ ...temel, kod: 'ZZZZZZZZZZ' }, 404, 'MESLEKTAS_YOK'], [{ ...temel, kod: '' }, 404, 'MESLEKTAS_YOK'], [{ ...temel, paylasimTuru: 'her-sey' }, 400, 'PAYLASIM'], [{ ...temel, paylasimTuru: 'not' }, 400, 'PAYLASIM'],
      [{ ...temel, paylasimTuru: 'not', notId: taslak }, 409, 'NOT_UYGUN'], [{ ...temel, paylasimTuru: 'not', notId: 'not-an-id' }, 409, 'NOT_UYGUN'], [{ ...temel, paylasimTuru: 'ozet', notId: ozetsiz }, 409, 'OZET_YOK'],
      [{ ...temel, hastaId: H3 }, 404, 'NOT_FOUND'], [{ ...temel, hastaId: 'x' }, 404, 'NOT_FOUND'], [{ islem: 'bul', kod: 'x' }, 404, 'MESLEKTAS_YOK'], [{ islem: 'bul' }, 404, 'MESLEKTAS_YOK'], [{ islem: 'listele' }, 400, 'GECERSIZ'], [{}, 400, 'GECERSIZ'],
    ] as const) {
      const r = await cagir('POST', API, { jeton: 'jeton-a', govde })
      assert.deepEqual([r.status, r.govde.code], [durum, k], JSON.stringify(govde).slice(0, 90))
    }
    assert.equal(satirlar().length, 0)
    for (const [yol, durum] of [[`${API}`, 400], [`${API}?gorunum=hepsi`, 400], [`${API}?gorunum=hekimler`, 400], [`${API}?gorunum=giden&hasta=x`, 404], [`${API}?gorunum=giden&hasta=${H3}`, 404], [`${API}?gorunum=notlar`, 404], [`${API}?gorunum=notlar&hasta=${H3}`, 404]] as const) assert.equal((await cagir('GET', yol, { jeton: 'jeton-a' })).status, durum, yol)
    for (const [govde, durum] of [[{ id: YOK, islem: 'sil' }, 400], [{ id: 'x', islem: 'kapat' }, 404], [{ islem: 'cevap', cevap: 'x' }, 404], [{ id: YOK, islem: 'okundu' }, 404]] as const) assert.equal((await cagir('PATCH', API, { jeton: 'jeton-a', govde })).status, durum, JSON.stringify(govde))
  })

  it('ISOLATION through the route: the third doctor on every action, the asking doctor on the consulted doctor\'s actions and the reverse — all exactly like an id that does not exist, and nothing changes', async () => {
    if (!ACIK) return
    const n = notEkle(DA, H1, true)
    const id = await tamam({ paylasimTuru: 'not', notId: n, soru: `${GIZLI} question` })
    const once = anlik()
    const dene = async (jeton: string, govde: Record<string, unknown>, ne: string) => {
      const yok = await cagir('PATCH', API, { jeton, govde: { ...govde, id: YOK } }), r = await cagir('PATCH', API, { jeton, govde: { ...govde, id } })
      assert.deepEqual([r.status, r.ham], [yok.status, yok.ham], `${ne}: must answer exactly like a missing id`)
      assert.equal(r.status, 404)
    }
    for (const islem of ['okundu', 'cevap', 'kapat']) await dene('jeton-c', { islem, cevap: 'x' }, `the third doctor: ${islem}`)
    await dene('jeton-a', { islem: 'okundu' }, 'the asking doctor marks as read'); await dene('jeton-a', { islem: 'cevap', cevap: 'x' }, 'the asking doctor answers')
    await dene('jeton-b', { islem: 'kapat' }, 'the consulted doctor closes')
    for (const [jeton, gorunum] of [['jeton-c', 'gelen'], ['jeton-c', 'giden'], ['jeton-a', 'gelen'], ['jeton-b', 'giden']] as const) {
      const r = await cagir('GET', `${API}?gorunum=${gorunum}`, { jeton })
      assert.deepEqual(r.govde, { konsultasyonlar: [] }, `${jeton} ${gorunum}`)
      assert.ok(!r.ham.includes(GIZLI))
    }
    for (const jeton of ['jeton-b', 'jeton-c']) for (const yol of [`${API}?gorunum=giden&hasta=${H1}`, `${API}?gorunum=notlar&hasta=${H1}`]) assert.equal((await cagir('GET', yol, { jeton })).status, 404, `${jeton} ${yol}`)
    assert.equal(anlik(), once)
    // a body cannot name another asking doctor or another country
    const kod = await kodAl(DB)
    const y = await cagir('POST', API, { jeton: 'jeton-a', govde: { islem: 'iste', hastaId: H1, kod, soru: 'q', paylasimTuru: 'yok', riza: true, doctor_id: DC, doktorId: DC, danisilan_id: DC, ulke: YABANCI } })
    assert.deepEqual([satir(y.govde.id).doctor_id, satir(y.govde.id).danisilan_id, satir(y.govde.id).ulke], [DA, DB, BU])
  })

  it('EXPIRED through the route: once the period is over the consulted doctor is answered "not found" on every action and an empty list', async () => {
    if (!ACIK) return
    const id = await tamam({ soru: `${GIZLI} question` })
    ilerle(ACIK_GUN * GUN + 60_000)
    assert.deepEqual((await cagir('GET', `${API}?gorunum=gelen`, { jeton: 'jeton-b' })).govde, { konsultasyonlar: [] })
    for (const govde of [{ id, islem: 'okundu' }, { id, islem: 'cevap', cevap: 'x' }]) assert.deepEqual((await cagir('PATCH', API, { jeton: 'jeton-b', govde })).govde, { code: 'NOT_FOUND' })
    const giden = (await cagir('GET', `${API}?gorunum=giden`, { jeton: 'jeton-a' })).govde.konsultasyonlar
    assert.deepEqual([giden[0].suresiDoldu, giden[0].cevap], [true, null])
  })

  it('a doctor\'s session and nothing else: none, a token that is none, or another country\'s → 401, and nothing is read or written', async () => {
    if (!ACIK) return
    const id = await tamam()
    vt.hesaplar['jeton-yabanci'] = { id: DB, email: 'qa-x@notya.test', app_metadata: { country: YABANCI } }
    const once = anlik()
    for (const jeton of [undefined, 'yok-boyle-jeton', 'jeton-yabanci']) {
      for (const [y, yol, govde] of [['GET', `${API}?gorunum=gelen`, undefined], ['GET', `${API}?gorunum=kod`, undefined], ['POST', API, { islem: 'kod' }], ['POST', API, { islem: 'bul', kod: 'x' }], ['PATCH', API, { id, islem: 'cevap', cevap: 'x' }]] as const) {
        const r = await cagir(y, yol, { jeton, ...(govde ? { govde } : {}) })
        assert.deepEqual([r.status, r.govde], [401, { code: 'OTURUM_YOK' }], `${y} ${yol} ${jeton}`)
      }
    }
    assert.equal(anlik(), once)
  })

  it('NOTHING IS SENT AND NO MODEL IS CALLED: the library and the route import no model gateway, no mail and no messenger', () => {
    const kod = (d: string) => readFileSync(join(__dirname, '../../..', d), 'utf8')
    for (const d of ['lib/ulke/konsultasyon/konsultasyon.ts', 'lib/ulke/konsultasyon/sabitler.ts', 'app/api/ulke/konsultasyon/route.ulke.ts']) {
      for (const i of [...kod(d).matchAll(/from '([^']+)'/g)].map((x) => x[1])) assert.doesNotMatch(i, /lib\/ai|\/ai\/|iletisim|eposta|whatsapp|sms|telegram|resend|twilio|nodemailer|modelGecidi/i, `${d} imports ${i}`)
      assert.doesNotMatch(kod(d).replace(/\/\*[\s\S]*?\*\//g, ''), /\bfetch\(/, `${d} makes a request of its own`)
    }
  })
})
