/**
 * NOTYA-ULKE-MESAJ-01 — MESSAGES BETWEEN A DOCTOR AND A PATIENT (migration 140), for whatever pack is active.
 * Runs ONCE PER PACK.
 *
 * TWO LAYERS.
 *   1. THE KIT'S RULES (lib/ulke/mesaj/mesaj.ts), for every pack that brings the signed-in application and the
 *      patient portal: the doctor opens and closes, the patient answers and opens nothing; unread marks on both
 *      sides, set only up to what was shown; the text is one encrypted value bound to its row; limits; isolation in
 *      every direction — second doctor, second patient of the same doctor, a patient of another doctor, another
 *      country's rows, a closed conversation.
 *   2. THE ROUTES, with the pack's own switch: a pack without messages answers "not found" on every method of both
 *      routes; a pack with them is held to the same behaviour through the real handlers, with a doctor's session on
 *      the patient's route and a patient's on the doctor's.
 *
 * Real handlers and real library code. The database and sign-in are stand-ins inside this process; any network
 * address fails the test — so no message can have been sent anywhere, and no model called. Synthetic data only.
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
type Kim = import('../portal/giris').PortalKimligi
let paket: Paket
let BU = ''
/** The kit's rules can run: the pack brings the signed-in application and the patient portal. */
let KIT = false
/** The pack switches messages on: its routes exist. */
let ROTA = false
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let sifreCoz: (s: string) => string
let M: typeof import('./mesaj')
let C: typeof import('./sabitler')
let S: typeof import('../portal/sabitler')
let E: typeof import('../portal/erisim')
let pinMod: typeof import('../portal/pin')
let giris: typeof import('../portal/giris')
let T: typeof import('../uygulama/tablolar')
let rota: { hekim: Mod; hasta: Mod; portal: Mod }

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001' // patient of doctor A
const H2 = '30000000-0000-4000-8000-000000000002' // SECOND patient of doctor A
const H3 = '30000000-0000-4000-8000-000000000003' // patient of doctor B
const YOK = '77777777-7777-4777-8777-777777777777'
const YABANCI = 'zz' // a country that is not this build's
const GIZLI = 'QA-MESSAGE-NEVER-IN-CLEAR-TEXT'
const AD: Record<string, string> = { [H1]: 'QA Patient One', [H2]: 'QA Patient Two', [H3]: 'QA Patient Three' }
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()
const DAKIKA = 60_000

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const yazismalar = () => tablo('ulke_mesaj_yazismalari')
const mesajlar = () => tablo('ulke_hasta_mesajlari')
const simdiIso = () => new Date().toISOString()
const ilerle = (ms: number) => mock.timers.tick(ms)
const anlik = () => JSON.stringify([yazismalar(), mesajlar()])

function hastaEkle(id: string, doktor: string, ulke = BU) {
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: AD[id] ?? 'QA Foreign' })), dob_encrypted: sifrele('1990-05-05'), gender_encrypted: null, phone_encrypted: null, is_active: true, created_at: simdiIso() })
  tablo('hasta_ulke_bilgisi').push({ patient_id: id, ulke, doctor_id: doktor, dil: paket.uygulama?.hastaDilleri[0] ?? '', ota_ismi_encrypted: null, ulusal_kimlik_encrypted: null })
}
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
  tablo('hekim_dil_tercihleri').push({ ulke: BU, doctor_id: DA, not_dili: d, soruldu_at: 'x' }, { ulke: BU, doctor_id: DB, not_dili: d, soruldu_at: 'x' })
  hastaEkle(H1, DA); hastaEkle(H2, DA); hastaEkle(H3, DB)
}

/** The doctor gives the patient access, and the patient signs in: who the server says the session is, and its key. */
async function hastaOturumu(doktor: string, hasta: string) {
  const e = await E.portalErisimVer(sb(), doktor, hasta)
  assert.equal(e.tamam, true, JSON.stringify(e))
  const { yol, pin } = e as { yol: string; pin: string }
  const token = yol.split('#')[1]
  const r = await giris.portalGiris(sb(), token, pin)
  assert.equal(r.tamam, true, JSON.stringify(r))
  const anahtar = (r as { oturumAnahtari: string }).oturumAnahtari
  const kim = await giris.portalOturumuCoz(sb(), anahtar)
  assert.ok(kim, 'the session must resolve')
  return { kim: kim as Kim, anahtar, token }
}
const yaz = async (doktor: string, hasta: string, metin: string) => { const r = await M.hekimMesajYaz(sb(), doktor, hasta, metin); assert.equal(r.tamam, true, JSON.stringify(r)); return r as { id: string; yazismaId: string } }
const cevapla = async (kim: Kim, metin: string) => { const r = await M.hastaMesajYaz(sb(), kim, metin); assert.equal(r.tamam, true, JSON.stringify(r)); return (r as { id: string }).id }
const satir = (id: string) => mesajlar().find((x) => x.id === id) as Satir
const metinler = (g: { yazismalar: { mesajlar: { metin: string }[] }[] } | null) => (g?.yazismalar ?? []).flatMap((y) => y.mesajlar.map((m) => m.metin))

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  KIT = paket.ozellikler.cekirdekMuayene === true && paket.ozellikler.hastaPortali === true
  NextRequest = (await import('next/server')).NextRequest
  const sifre = await import('@/lib/security/encryption')
  sifrele = sifre.encrypt; sifreCoz = sifre.decrypt
  M = await import('./mesaj'); C = await import('./sabitler')
  S = await import('../portal/sabitler'); E = await import('../portal/erisim'); pinMod = await import('../portal/pin'); giris = await import('../portal/giris')
  T = await import('../uygulama/tablolar')
  ROTA = M.mesajAcik()
  rota = {
    hekim: (await import('../../../app/api/ulke/hasta-mesajlari/route.ulke')) as unknown as Mod,
    hasta: (await import('../../../app/api/ulke/portal/mesaj/route.ulke')) as unknown as Mod,
    portal: (await import('../../../app/api/ulke/portal/route.ulke')) as unknown as Mod,
  }
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); if (paket.ozellikler.cekirdekMuayene) sifirla() })

type Secenek = { jeton?: string; cerez?: string; baglanti?: string; govde?: unknown; portal?: boolean }
async function cagir(mod: Mod, yontem: string, yol: string, s: Secenek = {}): Promise<{ status: number; govde: any; res: Response; ham: string }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const basliklar: Record<string, string> = { host: 'notya.test' }
  if (s.jeton) basliklar.authorization = `Bearer ${s.jeton}`
  if (s.cerez) basliklar.cookie = `${S.PORTAL_CEREZI}=${s.cerez}`
  if (s.baglanti) basliklar[S.PORTAL_BAGLANTI_BASLIGI] = pinMod.anahtarHash(s.baglanti)
  if (s.govde !== undefined) basliklar['content-type'] = 'application/json'
  if (s.portal) { basliklar[S.PORTAL_ISTEK_BASLIGI] = '1'; basliklar['content-type'] = 'application/json' }
  const req = new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(s.govde !== undefined ? { body: JSON.stringify(s.govde) } : s.portal && yontem !== 'GET' ? { body: '{}' } : {}) })
  const res = await mod[yontem](req)
  const ham = await res.clone().text()
  let govde: unknown = null
  try { govde = JSON.parse(ham) } catch { /* not JSON */ }
  return { status: res.status, govde, res, ham }
}
const HEKIM = '/api/ulke/hasta-mesajlari'
const HASTA = '/api/ulke/portal/mesaj'

// ───────────────────────── 1. the kit's rules ─────────────────────────

describe('messages — the doctor opens, the patient answers, the doctor closes', () => {
  it('a pack without the signed-in application or the portal has no messages, and says so', () => {
    if (KIT) return
    assert.equal(M.mesajAcik(), false)
  })

  it('THE DOCTOR WRITES FIRST: a conversation is opened for that patient, the message is the doctor\'s and unread; the patient reads it on their page', async () => {
    if (!KIT) return
    const r = await yaz(DA, H1, `  ${GIZLI} how are you today?\r\n\r\n\r\n\r\nPlease answer.  `)
    assert.equal(yazismalar().length, 1)
    assert.deepEqual({ ulke: yazismalar()[0].ulke, d: yazismalar()[0].doctor_id, h: yazismalar()[0].patient_id, k: yazismalar()[0].kapandi_at }, { ulke: BU, d: DA, h: H1, k: null })
    const s = satir(r.id)
    assert.deepEqual({ ulke: s.ulke, d: s.doctor_id, h: s.patient_id, y: s.yazisma_id, g: s.gonderen, o: s.okundu_at }, { ulke: BU, d: DA, h: H1, y: r.yazismaId, g: 'hekim', o: null })
    const { kim } = await hastaOturumu(DA, H1)
    const g = await M.hastaMesajlari(sb(), kim)
    // trimmed, one kind of line end, no more than one empty line
    assert.deepEqual(metinler(g), [`${GIZLI} how are you today?\n\nPlease answer.`])
    assert.equal(g!.yazabilir, true)
    assert.equal(g!.yazismalar[0].mesajlar[0].gonderen, 'hekim')
    assert.equal(g!.yazismalar[0].mesajlar[0].okundu, null, 'unread until the patient\'s page says it showed it')
  })

  it('THE TEXT IS ONE ENCRYPTED VALUE: nothing of it is in the tables in the clear, and the value names its own country, doctor, patient, conversation and writer', async () => {
    if (!KIT) return
    const r = await yaz(DA, H1, `${GIZLI} one`)
    assert.ok(!anlik().includes(GIZLI), 'the text of a message is in the database in the clear')
    assert.deepEqual(Object.keys(satir(r.id)).sort(), ['created_at', 'doctor_id', 'gonderen', 'id', 'metin_encrypted', 'okundu_at', 'patient_id', 'ulke', 'yazisma_id'], 'a message row holds exactly these columns: one for the text, none for an attachment')
    assert.deepEqual(JSON.parse(sifreCoz(String(satir(r.id).metin_encrypted))), { v: 1, u: BU, d: DA, h: H1, y: r.yazismaId, g: 'hekim', m: `${GIZLI} one` })
  })

  it('A VALUE THAT IS NOT THE ROW\'S OWN IS NOT SHOWN: a text copied from another patient\'s message, or re-labelled as the other writer, reads as nothing', async () => {
    if (!KIT) return
    const a = await yaz(DA, H1, 'for patient one'), b = await yaz(DA, H2, `${GIZLI} for patient two`)
    // somebody with access to the database copies patient two's value into patient one's conversation
    mesajlar().push({ id: 'kopya-1', ulke: BU, doctor_id: DA, patient_id: H1, yazisma_id: a.yazismaId, gonderen: 'hekim', metin_encrypted: satir(b.id).metin_encrypted, okundu_at: null, created_at: simdiIso() })
    // … and re-labels the doctor's own message as the patient's
    mesajlar().push({ id: 'kopya-2', ulke: BU, doctor_id: DA, patient_id: H1, yazisma_id: a.yazismaId, gonderen: 'hasta', metin_encrypted: satir(a.id).metin_encrypted, okundu_at: null, created_at: simdiIso() })
    assert.deepEqual(metinler(await M.hekimMesajlari(sb(), DA, H1)), ['for patient one'])
    const { kim } = await hastaOturumu(DA, H1)
    assert.deepEqual(metinler(await M.hastaMesajlari(sb(), kim)), ['for patient one'])
  })

  it('THE PATIENT ANSWERS in the open conversation; the doctor sees it as new, and the home list names that patient and nobody else', async () => {
    if (!KIT) return
    const r = await yaz(DA, H1, 'first')
    const { kim } = await hastaOturumu(DA, H1)
    ilerle(DAKIKA)
    const id = await cevapla(kim, `${GIZLI} thank you`)
    assert.deepEqual({ y: satir(id).yazisma_id, g: satir(id).gonderen, d: satir(id).doctor_id, h: satir(id).patient_id, o: satir(id).okundu_at }, { y: r.yazismaId, g: 'hasta', d: DA, h: H1, o: null })
    assert.equal(yazismalar().length, 1, 'a patient\'s answer opens no conversation')
    const g = await M.hekimMesajlari(sb(), DA, H1)
    assert.deepEqual(g!.yazismalar[0].mesajlar.map((m) => [m.gonderen, m.metin, m.okundu]), [['hekim', 'first', null], ['hasta', `${GIZLI} thank you`, null]])
    assert.deepEqual(await M.hekimOkunmamislari(sb(), DA), [{ hastaId: H1, hastaAdi: AD[H1], adet: 1, son: satir(id).created_at }])
    assert.deepEqual(await M.hekimOkunmamislari(sb(), DB), [], 'another doctor\'s home screen shows nothing of it')
    assert.ok(!JSON.stringify(await M.hekimOkunmamislari(sb(), DA)).includes(GIZLI), 'the list holds no text of a message')
  })

  it('A PATIENT CANNOT START A CONVERSATION: with none open nothing is written — not before the doctor wrote, and not into an empty one', async () => {
    if (!KIT) return
    const { kim } = await hastaOturumu(DA, H1)
    assert.deepEqual(await M.hastaMesajlari(sb(), kim), { yazismalar: [], yazabilir: false })
    assert.deepEqual(await M.hastaMesajYaz(sb(), kim, 'may I ask something?'), { tamam: false, kod: 'KAPALI' })
    assert.equal(yazismalar().length + mesajlar().length, 0, 'a patient\'s message opened a conversation')
    // a conversation that was opened and never got the doctor's message (a failed write) is not an invitation either
    yazismalar().push({ id: 'bos-yazisma', ulke: BU, doctor_id: DA, patient_id: H1, kapandi_at: null, created_at: simdiIso(), updated_at: simdiIso() })
    assert.deepEqual(await M.hastaMesajlari(sb(), kim), { yazismalar: [], yazabilir: false })
    assert.deepEqual(await M.hastaMesajYaz(sb(), kim, 'hello?'), { tamam: false, kod: 'KAPALI' })
    assert.equal(mesajlar().length, 0)
  })

  it('UNREAD MARKS, BOTH SIDES: each side marks only what the OTHER wrote, only up to what its screen showed, and once', async () => {
    if (!KIT) return
    const a = await yaz(DA, H1, 'one')
    const { kim } = await hastaOturumu(DA, H1)
    ilerle(DAKIKA); const gorulen = simdiIso(); const b = await cevapla(kim, 'two')
    ilerle(DAKIKA); const c = await cevapla(kim, 'three — arrived after the doctor\'s screen was drawn')
    // the doctor's screen showed up to "two"
    ilerle(DAKIKA)
    assert.deepEqual(await M.hekimOkudu(sb(), DA, H1, gorulen), { tamam: true })
    assert.ok(satir(b).okundu_at, 'the message that was shown is read')
    assert.equal(satir(c).okundu_at, null, 'A MESSAGE THAT WAS NOT SHOWN WAS MARKED AS READ')
    assert.equal(satir(a.id).okundu_at, null, 'the doctor\'s own message is not marked by the doctor')
    assert.deepEqual((await M.hekimOkunmamislari(sb(), DA)).map((x) => x.adet), [1])
    const ilkOkuma = satir(b).okundu_at
    ilerle(DAKIKA)
    await M.hekimOkudu(sb(), DA, H1, simdiIso())
    assert.equal(satir(b).okundu_at, ilkOkuma, 'the moment of reading is set once')
    assert.ok(satir(c).okundu_at)
    assert.deepEqual(await M.hekimOkunmamislari(sb(), DA), [])
    // the patient's page
    assert.deepEqual(await M.hastaOkudu(sb(), kim, simdiIso()), { tamam: true })
    assert.ok(satir(a.id).okundu_at)
    const g = await M.hekimMesajlari(sb(), DA, H1)
    assert.ok(g!.yazismalar[0].mesajlar[0].okundu, 'the doctor sees that the patient has read the message')
    // a moment that is not one, and a moment in the future
    assert.deepEqual(await M.hekimOkudu(sb(), DA, H1, 'yesterday'), { tamam: false, kod: 'GECERSIZ' })
    assert.deepEqual(await M.hastaOkudu(sb(), kim, undefined), { tamam: false, kod: 'GECERSIZ' })
    const d = await yaz(DA, H1, 'four')
    assert.deepEqual(await M.hastaOkudu(sb(), kim, '2999-01-01T00:00:00.000Z'), { tamam: true })
    assert.equal(satir(d.id).okundu_at, simdiIso(), '"up to the future" is "up to now", and is recorded as now')
  })

  it('THE DOCTOR CLOSES: neither side writes into it, both still read it; the doctor\'s next message opens a NEW conversation; closing is once', async () => {
    if (!KIT) return
    const a = await yaz(DA, H1, 'first conversation')
    const { kim } = await hastaOturumu(DA, H1)
    await cevapla(kim, 'my answer')
    ilerle(DAKIKA)
    assert.deepEqual(await M.yazismaKapat(sb(), DA, a.yazismaId), { tamam: true })
    const kapanis = yazismalar()[0].kapandi_at
    assert.equal(kapanis, simdiIso())
    ilerle(DAKIKA)
    // THE PATIENT: reads it, cannot write, and is told so
    const g = await M.hastaMesajlari(sb(), kim)
    assert.equal(g!.yazabilir, false)
    assert.deepEqual([g!.yazismalar[0].kapandi, metinler(g)], [kapanis, ['first conversation', 'my answer']])
    const once = anlik()
    assert.deepEqual(await M.hastaMesajYaz(sb(), kim, 'one more thing'), { tamam: false, kod: 'KAPALI' })
    assert.equal(anlik(), once, 'a patient wrote into a closed conversation')
    // closing again changes nothing
    assert.deepEqual(await M.yazismaKapat(sb(), DA, a.yazismaId), { tamam: false, kod: 'DURUM' })
    assert.equal(yazismalar()[0].kapandi_at, kapanis)
    // THE DOCTOR writes again: a new conversation, the closed one untouched
    const b = await yaz(DA, H1, 'second conversation')
    assert.notEqual(b.yazismaId, a.yazismaId)
    assert.equal(mesajlar().filter((m) => m.yazisma_id === a.yazismaId).length, 2)
    const h = await M.hekimMesajlari(sb(), DA, H1)
    assert.deepEqual(h!.yazismalar.map((y) => [y.id, Boolean(y.kapandi)]), [[b.yazismaId, false], [a.yazismaId, true]], 'newest conversation first')
    assert.equal((await M.hastaMesajlari(sb(), kim))!.yazabilir, true)
    await cevapla(kim, 'answer to the second')
    assert.equal(mesajlar().filter((m) => m.yazisma_id === b.yazismaId).length, 2)
  })

  it('THE DATABASE\'S OWN RULE: a message written straight into a closed conversation is refused, a message never changes, a closed conversation does not reopen', async () => {
    if (!KIT) return
    const a = await yaz(DA, H1, 'text')
    await M.yazismaKapat(sb(), DA, a.yazismaId)
    const t = T.ulkeTablosu(sb(), 'ulke_hasta_mesajlari')
    const { error: e1 } = await t.insert({ doctor_id: DA, patient_id: H1, yazisma_id: a.yazismaId, gonderen: 'hasta', metin_encrypted: 'x', okundu_at: null })
    assert.equal((e1 as { code?: string } | null)?.code, '23514')
    const { error: e2 } = await t.update({ metin_encrypted: 'changed' }).eq('id', a.id).eq('doctor_id', DA)
    assert.equal((e2 as { code?: string } | null)?.code, '23514')
    const { error: e3 } = await T.ulkeTablosu(sb(), 'ulke_mesaj_yazismalari').update({ kapandi_at: null }).eq('id', a.yazismaId).eq('doctor_id', DA)
    assert.equal((e3 as { code?: string } | null)?.code, '23514')
    const { error: e4 } = await t.insert({ doctor_id: DA, patient_id: H2, yazisma_id: a.yazismaId, gonderen: 'hekim', metin_encrypted: 'x', okundu_at: null })
    assert.equal((e4 as { code?: string } | null)?.code, '23503', 'a message cannot name another patient\'s conversation')
  })

  it('the patient can no longer read the doctor\'s access state: without a link that works the doctor\'s card says so', async () => {
    if (!KIT) return
    await yaz(DA, H1, 'text')
    assert.equal((await M.hekimMesajlari(sb(), DA, H1))!.erisim, 'yok')
    await E.portalErisimVer(sb(), DA, H1)
    assert.equal((await M.hekimMesajlari(sb(), DA, H1))!.erisim, 'acik')
    tablo('ulke_portal_erisimleri')[0].kilitlendi_at = simdiIso()
    assert.equal((await M.hekimMesajlari(sb(), DA, H1))!.erisim, 'kilitli')
    tablo('ulke_portal_erisimleri')[0].kilitlendi_at = null
    ilerle(400 * 86_400_000)
    assert.equal((await M.hekimMesajlari(sb(), DA, H1))!.erisim, 'suresi-doldu')
  })

  it('LIMITS: an empty text and a text that is too long are refused; one side writes at most the kit\'s number of messages in 24 hours', async () => {
    if (!KIT) return
    for (const bos of ['', '   \n\t ', null, 12, { metin: 'x' }]) assert.deepEqual(await M.hekimMesajYaz(sb(), DA, H1, bos), { tamam: false, kod: 'BOS' })
    assert.deepEqual(await M.hekimMesajYaz(sb(), DA, H1, 'x'.repeat(C.MESAJ_AZAMI + 1)), { tamam: false, kod: 'UZUN' })
    assert.equal(yazismalar().length + mesajlar().length, 0, 'a refused message left something behind')
    await yaz(DA, H1, 'x'.repeat(C.MESAJ_AZAMI))
    for (let n = 1; n < C.MESAJ_GUNLUK_AZAMI; n++) { ilerle(1000); await yaz(DA, H1, `message ${n}`) }
    assert.deepEqual(await M.hekimMesajYaz(sb(), DA, H1, 'one too many'), { tamam: false, kod: 'LIMIT' })
    // the limit is per patient and per side
    await yaz(DA, H2, 'another patient is not limited by the first')
    const { kim } = await hastaOturumu(DA, H1)
    for (let n = 0; n < C.MESAJ_GUNLUK_AZAMI; n++) { ilerle(1000); await cevapla(kim, `answer ${n}`) }
    assert.deepEqual(await M.hastaMesajYaz(sb(), kim, 'one too many'), { tamam: false, kod: 'LIMIT' })
    for (const bos of ['', '  ', null]) assert.deepEqual(await M.hastaMesajYaz(sb(), kim, bos), { tamam: false, kod: 'BOS' })
    assert.deepEqual(await M.hastaMesajYaz(sb(), kim, 'y'.repeat(C.MESAJ_AZAMI + 1)), { tamam: false, kod: 'UZUN' })
    ilerle(24 * 60 * DAKIKA)
    await yaz(DA, H1, 'the next day')
  })

  it('A FAILED WRITE leaves nothing a reader could see: the conversation without its first message is shown to nobody', async () => {
    if (!KIT) return
    vt.boz.yaz.add('ulke_hasta_mesajlari')
    assert.deepEqual(await M.hekimMesajYaz(sb(), DA, H1, 'text'), { tamam: false, kod: 'BASARISIZ' })
    vt.boz.yaz.clear()
    assert.equal(mesajlar().length, 0)
    assert.deepEqual((await M.hekimMesajlari(sb(), DA, H1))!.yazismalar, [])
    // … and the doctor's next message uses that conversation: no second one is opened
    await yaz(DA, H1, 'again')
    assert.equal(yazismalar().length, 1)
  })
})

describe('messages — isolation', () => {
  it('SECOND DOCTOR: another doctor reads, writes, marks and closes NOTHING of a doctor\'s patient — every answer is "not found" and nothing changes', async () => {
    if (!KIT) return
    const a = await yaz(DA, H1, `${GIZLI} for A's patient`)
    const { kim } = await hastaOturumu(DA, H1)
    await cevapla(kim, `${GIZLI} from A's patient`)
    const once = anlik()
    assert.equal(await M.hekimMesajlari(sb(), DB, H1), null)
    assert.deepEqual(await M.hekimMesajYaz(sb(), DB, H1, 'from the wrong doctor'), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await M.hekimOkudu(sb(), DB, H1, simdiIso()), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await M.yazismaKapat(sb(), DB, a.yazismaId), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await M.hekimOkunmamislari(sb(), DB), [])
    assert.equal(anlik(), once, 'another doctor changed a conversation')
    // and the other way round
    const b = await yaz(DB, H3, 'for B\'s patient')
    const once2 = anlik()
    assert.equal(await M.hekimMesajlari(sb(), DA, H3), null)
    assert.deepEqual(await M.hekimMesajYaz(sb(), DA, H3, 'x'), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await M.yazismaKapat(sb(), DA, b.yazismaId), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await M.hekimOkudu(sb(), DA, H3, simdiIso()), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(anlik(), once2)
    // an id that does not exist answers exactly like another doctor's
    assert.equal(await M.hekimMesajlari(sb(), DA, YOK), null)
    assert.deepEqual(await M.yazismaKapat(sb(), DA, YOK), { tamam: false, kod: 'NOT_FOUND' })
  })

  it('SECOND PATIENT: a patient reads, answers and marks only their own conversation — not another patient\'s of the SAME doctor, not another doctor\'s', async () => {
    if (!KIT) return
    const a1 = await yaz(DA, H1, `${GIZLI}-ONE for patient one`), a2 = await yaz(DA, H2, `${GIZLI}-TWO for patient two`), b3 = await yaz(DB, H3, `${GIZLI}-THREE for patient three`)
    const o1 = await hastaOturumu(DA, H1), o2 = await hastaOturumu(DA, H2), o3 = await hastaOturumu(DB, H3)
    const g1 = JSON.stringify(await M.hastaMesajlari(sb(), o1.kim)), g2 = JSON.stringify(await M.hastaMesajlari(sb(), o2.kim)), g3 = JSON.stringify(await M.hastaMesajlari(sb(), o3.kim))
    assert.ok(g1.includes(`${GIZLI}-ONE`) && !g1.includes(`${GIZLI}-TWO`) && !g1.includes(`${GIZLI}-THREE`), 'patient one read another patient\'s message')
    assert.ok(g2.includes(`${GIZLI}-TWO`) && !g2.includes(`${GIZLI}-ONE`) && !g2.includes(`${GIZLI}-THREE`), 'patient two read another patient\'s message')
    assert.ok(g3.includes(`${GIZLI}-THREE`) && !g3.includes(`${GIZLI}-ONE`) && !g3.includes(`${GIZLI}-TWO`), 'patient three read another patient\'s message')
    // an answer lands in the writer's own conversation
    const id = await cevapla(o2.kim, 'from patient two')
    assert.deepEqual([satir(id).patient_id, satir(id).yazisma_id, satir(id).doctor_id], [H2, a2.yazismaId, DA])
    // reading marks only one's own
    ilerle(DAKIKA)
    await M.hastaOkudu(sb(), o1.kim, simdiIso())
    assert.ok(satir(a1.id).okundu_at)
    assert.equal(satir(a2.id).okundu_at, null, 'patient one marked patient two\'s message as read')
    assert.equal(satir(b3.id).okundu_at, null)
    // the doctor's side keeps them apart too
    assert.deepEqual(metinler(await M.hekimMesajlari(sb(), DA, H1)), [`${GIZLI}-ONE for patient one`])
    await M.hekimOkudu(sb(), DA, H1, simdiIso())
    assert.equal(satir(id).okundu_at, null, 'reading patient one\'s file marked patient two\'s answer as read')
    // closing one patient's conversation does not close the other's
    await M.yazismaKapat(sb(), DA, a1.yazismaId)
    assert.equal((await M.hastaMesajlari(sb(), o1.kim))!.yazabilir, false)
    assert.equal((await M.hastaMesajlari(sb(), o2.kim))!.yazabilir, true)
  })

  it('A SESSION THAT POINTS AT SOMEBODY ELSE gets nothing: a patient id of another doctor, or a doctor who is not the patient\'s', async () => {
    if (!KIT) return
    await yaz(DA, H1, `${GIZLI} one`); await yaz(DB, H3, `${GIZLI} three`)
    const { kim } = await hastaOturumu(DA, H1)
    const once = anlik()
    for (const sahte of [{ ...kim, hastaId: H3 }, { ...kim, doktorId: DB }, { ...kim, hastaId: YOK }] as Kim[]) {
      assert.equal(await M.hastaMesajlari(sb(), sahte), null)
      assert.deepEqual(await M.hastaMesajYaz(sb(), sahte, 'x'), { tamam: false, kod: 'NOT_FOUND' })
      assert.deepEqual(await M.hastaOkudu(sb(), sahte, simdiIso()), { tamam: false, kod: 'NOT_FOUND' })
    }
    assert.equal(anlik(), once)
  })

  it('ANOTHER COUNTRY\'S ROWS — same doctor id, same patient id, in the same tables — are not read, marked, answered or closed', async () => {
    if (!KIT) return
    const a = await yaz(DA, H1, 'this country')
    const { kim } = await hastaOturumu(DA, H1)
    // another country's conversation and messages for the very same ids, one of them from "the patient" and unread
    yazismalar().push({ id: 'yabanci-y', ulke: YABANCI, doctor_id: DA, patient_id: H1, kapandi_at: null, created_at: simdiIso(), updated_at: simdiIso() })
    mesajlar().push({ id: 'yabanci-1', ulke: YABANCI, doctor_id: DA, patient_id: H1, yazisma_id: 'yabanci-y', gonderen: 'hasta', metin_encrypted: satir(a.id).metin_encrypted, okundu_at: null, created_at: simdiIso() })
    mesajlar().push({ id: 'yabanci-2', ulke: YABANCI, doctor_id: DA, patient_id: H1, yazisma_id: a.yazismaId, gonderen: 'hekim', metin_encrypted: satir(a.id).metin_encrypted, okundu_at: null, created_at: simdiIso() })
    const yabancilar = () => JSON.stringify([yazismalar().filter((x) => x.ulke !== BU), mesajlar().filter((x) => x.ulke !== BU)])
    const once = yabancilar()
    assert.deepEqual((await M.hekimMesajlari(sb(), DA, H1))!.yazismalar.map((y) => [y.id, y.mesajlar.length]), [[a.yazismaId, 1]])
    assert.deepEqual((await M.hastaMesajlari(sb(), kim))!.yazismalar.map((y) => [y.id, y.mesajlar.length]), [[a.yazismaId, 1]])
    assert.deepEqual(await M.hekimOkunmamislari(sb(), DA), [], 'another country\'s unread message is on this country\'s home screen')
    ilerle(DAKIKA)
    await M.hekimOkudu(sb(), DA, H1, simdiIso()); await M.hastaOkudu(sb(), kim, simdiIso())
    assert.deepEqual(await M.yazismaKapat(sb(), DA, 'yabanci-y'), { tamam: false, kod: 'NOT_FOUND' })
    await cevapla(kim, 'answer')
    assert.equal(yabancilar(), once, 'a row of another country was changed')
    assert.equal(mesajlar().filter((x) => x.ulke !== BU && x.okundu_at).length, 0)
  })

  it('EVERY STATEMENT on the two tables is bound to the country and the doctor — and, for a patient\'s conversation, to the patient', async () => {
    if (!KIT) return
    const a = await yaz(DA, H1, 'one')
    const { kim } = await hastaOturumu(DA, H1)
    vt.sorgular.length = 0
    await M.hekimMesajlari(sb(), DA, H1); await M.hastaMesajlari(sb(), kim); await cevapla(kim, 'two'); await yaz(DA, H1, 'three')
    await M.hekimOkudu(sb(), DA, H1, simdiIso()); await M.hastaOkudu(sb(), kim, simdiIso()); await M.hekimOkunmamislari(sb(), DA); await M.yazismaKapat(sb(), DA, a.yazismaId)
    const bizim = vt.sorgular.filter((q) => q.tablo === 'ulke_mesaj_yazismalari' || q.tablo === 'ulke_hasta_mesajlari')
    assert.ok(bizim.length >= 12, `only ${bizim.length} statements were recorded`)
    for (const q of bizim) {
      assert.equal(q.ulke, BU, `${q.tablo} ${q.islem}: not bound to this country`)
      if (q.islem === 'insert') continue
      assert.ok(q.filtreler.includes(`doctor_id=eq.${DA}`), `${q.tablo} ${q.islem} [${q.filtreler.join(' ')}]: no doctor in the statement`)
      // the only statements without a patient: the doctor's own unread list, and closing a conversation by its id
      const hastasiz = (q.tablo === 'ulke_hasta_mesajlari' && q.filtreler.includes('gonderen=eq.hasta') && q.filtreler.includes('okundu_at=is.null') && q.islem === 'select') || (q.tablo === 'ulke_mesaj_yazismalari' && q.filtreler.includes(`id=eq.${a.yazismaId}`))
      if (!hastasiz) assert.ok(q.filtreler.includes(`patient_id=eq.${H1}`), `${q.tablo} ${q.islem} [${q.filtreler.join(' ')}]: no patient in the statement`)
    }
    // nothing else was touched: no table outside the country's own, so no usage log of a model either
    for (const q of vt.sorgular) assert.ok(q.tablo.startsWith('rpc:') || (T.ULKE_TABLOLARI as readonly string[]).includes(q.tablo), `${q.tablo} is not a country table`)
  })
})

// ───────────────────────── 2. the routes ─────────────────────────

describe('messages — the routes', () => {
  it('A PACK WITHOUT MESSAGES: every method of both routes answers "not found", with a valid session too, and nothing is read', async () => {
    if (ROTA) return
    const once = vt.sorgular.length
    for (const [mod, yontemler, yol] of [[rota.hekim, ['GET', 'POST', 'PATCH'], HEKIM], [rota.hasta, ['GET', 'POST', 'PUT'], HASTA]] as const) {
      for (const y of yontemler) {
        const r = await cagir(mod, y, `${yol}?hasta=${H1}`, { jeton: 'jeton-a', ...(y === 'GET' ? {} : { govde: { hastaId: H1, metin: 'x', islem: 'okundu' }, portal: true }) })
        assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }], `${yol} ${y}`)
      }
    }
    assert.equal(vt.sorgular.length, once, 'a route of a feature that is off touched the database')
    assert.deepEqual(Object.keys(rota.hekim).filter((k) => /^[A-Z]+$/.test(k)).sort(), ['GET', 'PATCH', 'POST'])
    assert.deepEqual(Object.keys(rota.hasta).filter((k) => /^[A-Z]+$/.test(k)).sort(), ['GET', 'POST', 'PUT'])
  })

  it('THE DOCTOR\'S ROUTE: write, read, mark as read, close — and the unread list without an id', async () => {
    if (!ROTA) return
    const y = await cagir(rota.hekim, 'POST', HEKIM, { jeton: 'jeton-a', govde: { hastaId: H1, metin: `${GIZLI} hello` } })
    assert.equal(y.status, 200, y.ham)
    assert.deepEqual(Object.keys(y.govde).sort(), ['id', 'yazismaId'])
    const { kim } = await hastaOturumu(DA, H1)
    ilerle(DAKIKA); const cevapId = await cevapla(kim, 'an answer')
    const g = await cagir(rota.hekim, 'GET', `${HEKIM}?hasta=${H1}`, { jeton: 'jeton-a' })
    assert.equal(g.status, 200)
    assert.deepEqual(Object.keys(g.govde).sort(), ['erisim', 'yazismalar'])
    assert.equal(g.govde.erisim, 'acik')
    assert.deepEqual(g.govde.yazismalar[0].mesajlar.map((m: { gonderen: string; metin: string }) => [m.gonderen, m.metin]), [['hekim', `${GIZLI} hello`], ['hasta', 'an answer']])
    assert.equal(g.res.headers.get('cache-control'), 'no-store')
    const l = await cagir(rota.hekim, 'GET', HEKIM, { jeton: 'jeton-a' })
    assert.deepEqual(l.govde, { okunmamis: [{ hastaId: H1, hastaAdi: AD[H1], adet: 1, son: satir(cevapId).created_at }] })
    ilerle(DAKIKA)
    assert.deepEqual((await cagir(rota.hekim, 'PATCH', HEKIM, { jeton: 'jeton-a', govde: { hastaId: H1, islem: 'okundu', kadar: simdiIso() } })).govde, { ok: true })
    assert.deepEqual((await cagir(rota.hekim, 'GET', HEKIM, { jeton: 'jeton-a' })).govde, { okunmamis: [] })
    assert.deepEqual((await cagir(rota.hekim, 'PATCH', HEKIM, { jeton: 'jeton-a', govde: { yazismaId: y.govde.yazismaId, islem: 'kapat' } })).govde, { ok: true })
    const tekrar = await cagir(rota.hekim, 'PATCH', HEKIM, { jeton: 'jeton-a', govde: { yazismaId: y.govde.yazismaId, islem: 'kapat' } })
    assert.deepEqual([tekrar.status, tekrar.govde], [409, { code: 'DURUM' }])
    // what is refused, and with which code
    for (const [govde, durum, kod] of [[{ hastaId: H1, metin: '' }, 400, 'BOS'], [{ hastaId: H1, metin: 'x'.repeat(C.MESAJ_AZAMI + 1) }, 400, 'UZUN'], [{ hastaId: 'not-an-id', metin: 'x' }, 404, 'NOT_FOUND'], [{ metin: 'x' }, 404, 'NOT_FOUND'], [{ hastaId: YOK, metin: 'x' }, 404, 'NOT_FOUND']] as const) {
      const r = await cagir(rota.hekim, 'POST', HEKIM, { jeton: 'jeton-a', govde })
      assert.deepEqual([r.status, r.govde.code], [durum, kod], JSON.stringify(govde).slice(0, 60))
    }
    for (const [govde, durum, kod] of [[{ hastaId: H1, islem: 'sil' }, 400, 'GECERSIZ'], [{ hastaId: H1 }, 400, 'GECERSIZ'], [{ hastaId: H1, islem: 'okundu' }, 400, 'GECERSIZ'], [{ islem: 'kapat', yazismaId: 'x' }, 404, 'NOT_FOUND'], [{ islem: 'okundu', hastaId: 'x', kadar: simdiIso() }, 404, 'NOT_FOUND'], [{ islem: 'kapat', hastaId: H1 }, 404, 'NOT_FOUND']] as const) {
      const r = await cagir(rota.hekim, 'PATCH', HEKIM, { jeton: 'jeton-a', govde })
      assert.deepEqual([r.status, r.govde.code], [durum, kod], JSON.stringify(govde).slice(0, 60))
    }
    assert.equal((await cagir(rota.hekim, 'GET', `${HEKIM}?hasta=not-an-id`, { jeton: 'jeton-a' })).status, 404)
  })

  it('THE DOCTOR\'S ROUTE, ISOLATION: A→B and B→A on every method answer exactly like an id that does not exist, and change nothing', async () => {
    if (!ROTA) return
    const a = await yaz(DA, H1, `${GIZLI} A`), b = await yaz(DB, H3, `${GIZLI} B`)
    const oa = await hastaOturumu(DA, H1), ob = await hastaOturumu(DB, H3)
    await cevapla(oa.kim, `${GIZLI} from A's patient`); await cevapla(ob.kim, `${GIZLI} from B's patient`)
    const once = anlik()
    for (const [jeton, hasta, yazisma, kendiHastasi] of [['jeton-b', H1, a.yazismaId, H3], ['jeton-a', H3, b.yazismaId, H1]] as const) {
      const yokCevabi = await cagir(rota.hekim, 'GET', `${HEKIM}?hasta=${YOK}`, { jeton })
      const istekler: [string, string, Secenek][] = [
        ['GET', `${HEKIM}?hasta=${hasta}`, { jeton }],
        ['POST', HEKIM, { jeton, govde: { hastaId: hasta, metin: 'from the wrong doctor' } }],
        ['PATCH', HEKIM, { jeton, govde: { hastaId: hasta, islem: 'okundu', kadar: simdiIso() } }],
        ['PATCH', HEKIM, { jeton, govde: { yazismaId: yazisma, islem: 'kapat' } }],
      ]
      for (const [y, yol, s] of istekler) {
        const r = await cagir(rota.hekim, y, yol, s)
        assert.deepEqual([r.status, r.ham], [yokCevabi.status, yokCevabi.ham], `${jeton} ${y}: a foreign id must answer exactly like a missing one`)
        assert.ok(!r.ham.includes(GIZLI))
      }
      // positive control: the same doctor reaches their own, and the list names only their own patient
      const kendi = await cagir(rota.hekim, 'GET', HEKIM, { jeton })
      assert.deepEqual(kendi.govde.okunmamis.map((x: { hastaId: string }) => x.hastaId), [kendiHastasi])
    }
    assert.equal(anlik(), once, 'a request of another doctor changed a conversation')
  })

  it('THE DOCTOR\'S ROUTE takes a doctor\'s session and nothing else: none, another country\'s, or a patient\'s portal cookie → 401', async () => {
    if (!ROTA) return
    await yaz(DA, H1, 'text')
    const o = await hastaOturumu(DA, H1)
    vt.hesaplar['jeton-yabanci'] = { id: DA, email: 'qa-x@notya.test', app_metadata: { country: YABANCI } }
    const once = anlik()
    for (const s of [{}, { jeton: 'yok-boyle-jeton' }, { jeton: 'jeton-yabanci' }, { cerez: o.anahtar, baglanti: o.token, portal: true }] as Secenek[]) {
      for (const [y, yol, govde] of [['GET', `${HEKIM}?hasta=${H1}`, undefined], ['GET', HEKIM, undefined], ['POST', HEKIM, { hastaId: H1, metin: 'x' }], ['PATCH', HEKIM, { hastaId: H1, islem: 'okundu', kadar: simdiIso() }]] as const) {
        const r = await cagir(rota.hekim, y, yol, { ...s, ...(govde ? { govde } : {}) })
        assert.deepEqual([r.status, r.govde], [401, { code: 'OTURUM_YOK' }], `${y} with ${JSON.stringify(Object.keys(s))}`)
      }
    }
    assert.equal(anlik(), once)
  })

  it('THE PATIENT\'S ROUTE: read, answer, mark as read — private, never stored, never indexed', async () => {
    if (!ROTA) return
    const a = await yaz(DA, H1, `${GIZLI} from the doctor`)
    const o = await hastaOturumu(DA, H1)
    const s = { cerez: o.anahtar, baglanti: o.token }
    const g = await cagir(rota.hasta, 'GET', HASTA, s)
    assert.equal(g.status, 200, g.ham)
    assert.deepEqual(Object.keys(g.govde).sort(), ['yazabilir', 'yazismalar'])
    assert.deepEqual([g.govde.yazabilir, g.govde.yazismalar[0].mesajlar.map((m: { metin: string }) => m.metin)], [true, [`${GIZLI} from the doctor`]])
    assert.ok(!g.ham.includes(DA) && !g.ham.includes(H1), 'the answer names the doctor\'s or the patient\'s id')
    for (const [ad, deger] of [['cache-control', 'private, no-store, max-age=0'], ['x-robots-tag', null], ['referrer-policy', 'no-referrer']] as const) {
      if (deger) assert.equal(g.res.headers.get(ad), deger); else assert.match(String(g.res.headers.get(ad)), /noindex/)
    }
    ilerle(DAKIKA)
    const y = await cagir(rota.hasta, 'POST', HASTA, { ...s, portal: true, govde: { metin: 'my answer' } })
    assert.deepEqual([y.status, Object.keys(y.govde)], [200, ['id']])
    assert.deepEqual({ g: satir(y.govde.id).gonderen, h: satir(y.govde.id).patient_id, d: satir(y.govde.id).doctor_id, y: satir(y.govde.id).yazisma_id }, { g: 'hasta', h: H1, d: DA, y: a.yazismaId })
    assert.deepEqual((await cagir(rota.hasta, 'PUT', HASTA, { ...s, portal: true, govde: { kadar: simdiIso() } })).govde, { ok: true })
    assert.ok(satir(a.id).okundu_at)
    // refused, with a code
    for (const [govde, durum, kod] of [[{ metin: '' }, 400, 'BOS'], [{}, 400, 'BOS'], [{ metin: 'x'.repeat(C.MESAJ_AZAMI + 1) }, 400, 'UZUN']] as const) {
      const r = await cagir(rota.hasta, 'POST', HASTA, { ...s, portal: true, govde })
      assert.deepEqual([r.status, r.govde.code], [durum, kod])
    }
    assert.deepEqual((await cagir(rota.hasta, 'PUT', HASTA, { ...s, portal: true, govde: {} })).govde, { code: 'GECERSIZ' })
    // a change that is not the portal's own request (no header: a page of another site could not send it)
    const once = anlik()
    for (const yontem of ['POST', 'PUT']) {
      const r = await cagir(rota.hasta, yontem, HASTA, { ...s, govde: { metin: 'x', kadar: simdiIso() } })
      assert.deepEqual([r.status, r.govde], [400, { code: 'GECERSIZ' }], yontem)
    }
    assert.equal(anlik(), once)
  })

  it('THE PATIENT\'S ROUTE TAKES NO ID FROM THE REQUEST: another patient\'s, another doctor\'s or another conversation\'s id in the body or the address changes nothing', async () => {
    if (!ROTA) return
    const a1 = await yaz(DA, H1, `${GIZLI}-ONE`), a2 = await yaz(DA, H2, `${GIZLI}-TWO`), b3 = await yaz(DB, H3, `${GIZLI}-THREE`)
    const o1 = await hastaOturumu(DA, H1)
    const s = { cerez: o1.anahtar, baglanti: o1.token }
    for (const ek of [`?hasta=${H2}`, `?hasta=${H3}&doktor=${DB}`, `?yazisma=${a2.yazismaId}`]) {
      const g = await cagir(rota.hasta, 'GET', `${HASTA}${ek}`, s)
      assert.ok(g.ham.includes(`${GIZLI}-ONE`) && !g.ham.includes(`${GIZLI}-TWO`) && !g.ham.includes(`${GIZLI}-THREE`), `GET ${ek}: the patient read somebody else's message`)
    }
    for (const govde of [{ metin: 'x', hastaId: H2 }, { metin: 'x', patient_id: H3, doctor_id: DB, doktorId: DB }, { metin: 'x', yazismaId: a2.yazismaId, yazisma_id: b3.yazismaId }]) {
      const y = await cagir(rota.hasta, 'POST', HASTA, { ...s, portal: true, govde })
      assert.equal(y.status, 200)
      assert.deepEqual([satir(y.govde.id).patient_id, satir(y.govde.id).doctor_id, satir(y.govde.id).yazisma_id], [H1, DA, a1.yazismaId], 'the answer was written somewhere else than the session\'s own conversation')
    }
    ilerle(DAKIKA)
    await cagir(rota.hasta, 'PUT', HASTA, { ...s, portal: true, govde: { kadar: simdiIso(), hastaId: H2, yazismaId: a2.yazismaId } })
    assert.ok(satir(a1.id).okundu_at)
    assert.equal(satir(a2.id).okundu_at, null)
    assert.equal(satir(b3.id).okundu_at, null)
    assert.equal(mesajlar().filter((m) => m.patient_id !== H1 && m.gonderen === 'hasta').length, 0)
  })

  it('THE PATIENT\'S ROUTE takes a portal session and nothing else: no cookie, a doctor\'s token, another link\'s page, a withdrawn link → 401; nothing is read or written', async () => {
    if (!ROTA) return
    await yaz(DA, H1, `${GIZLI} one`); await yaz(DA, H2, `${GIZLI} two`)
    const o1 = await hastaOturumu(DA, H1), o2 = await hastaOturumu(DA, H2)
    const once = anlik()
    const dene = async (s: Secenek, ne: string) => {
      for (const [y, govde] of [['GET', undefined], ['POST', { metin: 'x' }], ['PUT', { kadar: simdiIso() }]] as const) {
        const r = await cagir(rota.hasta, y, HASTA, { ...s, ...(govde ? { govde, portal: true } : {}) })
        assert.deepEqual([r.status, r.govde], [401, { code: 'OTURUM_YOK' }], `${ne}: ${y}`)
        assert.ok(!r.ham.includes(GIZLI))
      }
    }
    await dene({}, 'no session')
    await dene({ jeton: 'jeton-a' }, 'A DOCTOR\'S SESSION IS NOT A PATIENT\'S')
    await dene({ jeton: 'jeton-a', baglanti: o1.token }, 'a doctor\'s token with the link\'s mark')
    await dene({ cerez: 'x'.repeat(43), baglanti: o1.token }, 'a key that is no session')
    await dene({ cerez: o1.anahtar }, 'the session without the link\'s mark')
    await dene({ cerez: o1.anahtar, baglanti: o2.token }, 'patient one\'s session on patient two\'s page')
    assert.equal(anlik(), once)
    // the doctor withdraws access: the open session is over at once
    assert.equal(await E.portalErisimIptal(sb(), DA, H1), 'TAMAM')
    await dene({ cerez: o1.anahtar, baglanti: o1.token }, 'a withdrawn link')
    // the session ends by itself
    ilerle((S.PORTAL_OTURUM_DK + 1) * DAKIKA)
    await dene({ cerez: o2.anahtar, baglanti: o2.token }, 'a session that is over')
    assert.equal(anlik(), once)
  })

  it('CLOSED CONVERSATION through the routes: the patient is answered 409 and nothing is written; the patient still reads it, and cannot start one', async () => {
    if (!ROTA) return
    const o = await hastaOturumu(DA, H1)
    const s = { cerez: o.anahtar, baglanti: o.token }
    // before the doctor wrote: nothing to read, nothing to answer
    assert.deepEqual((await cagir(rota.hasta, 'GET', HASTA, s)).govde, { yazismalar: [], yazabilir: false })
    const erken = await cagir(rota.hasta, 'POST', HASTA, { ...s, portal: true, govde: { metin: 'may I write first?' } })
    assert.deepEqual([erken.status, erken.govde], [409, { code: 'KAPALI' }])
    assert.equal(yazismalar().length + mesajlar().length, 0)
    const a = await yaz(DA, H1, 'text')
    await cagir(rota.hekim, 'PATCH', HEKIM, { jeton: 'jeton-a', govde: { yazismaId: a.yazismaId, islem: 'kapat' } })
    const once = anlik()
    const r = await cagir(rota.hasta, 'POST', HASTA, { ...s, portal: true, govde: { metin: 'too late' } })
    assert.deepEqual([r.status, r.govde], [409, { code: 'KAPALI' }])
    assert.equal(anlik(), once)
    const g = await cagir(rota.hasta, 'GET', HASTA, s)
    assert.equal(g.govde.yazabilir, false)
    assert.deepEqual(g.govde.yazismalar.map((y: { kapandi: string | null; mesajlar: unknown[] }) => [Boolean(y.kapandi), y.mesajlar.length]), [[true, 1]])
  })

  it('NOTHING IS SENT AND NO MODEL IS CALLED: the library and both routes import no model gateway, no mail and no messenger, and the page\'s own answer still holds no message', async () => {
    const kod = (d: string) => readFileSync(join(__dirname, '../../..', d), 'utf8')
    for (const d of ['lib/ulke/mesaj/mesaj.ts', 'lib/ulke/mesaj/sabitler.ts', 'app/api/ulke/hasta-mesajlari/route.ulke.ts', 'app/api/ulke/portal/mesaj/route.ulke.ts']) {
      const importlar = [...kod(d).matchAll(/from '([^']+)'/g)].map((x) => x[1])
      for (const i of importlar) assert.doesNotMatch(i, /lib\/ai|\/ai\/|iletisim|eposta|whatsapp|sms|telegram|resend|twilio|nodemailer|modelGecidi|kullanimOlcumu/i, `${d} imports ${i}`)
      assert.doesNotMatch(kod(d).replace(/\/\*[\s\S]*?\*\//g, ''), /\bfetch\(/, `${d} makes a request of its own`)
    }
    if (!ROTA) return
    // the portal's own page answer (GET /api/ulke/portal) is unchanged by this feature: a message is read by its own route only
    await yaz(DA, H1, `${GIZLI} text`)
    const o = await hastaOturumu(DA, H1)
    const sayfa = await cagir(rota.portal, 'GET', '/api/ulke/portal', { cerez: o.anahtar, baglanti: o.token })
    assert.equal(sayfa.status, 200)
    assert.ok(!sayfa.ham.includes(GIZLI))
  })
})
