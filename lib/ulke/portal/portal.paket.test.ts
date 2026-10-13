/**
 * NOTYA-ULKE-PORTAL-01 — THE PATIENT PORTAL, for whatever pack is active. Runs ONCE PER PACK (scripts/ulke-test.mjs
 * sets NOTYA_COUNTRY to each folder under countries/ in turn): a pack that does not switch the portal on must answer
 * "not found" on every portal route; a pack that does is held to everything below, without naming the country.
 *
 * Real handlers and real library code. The database, sign-in and the model provider are stand-ins inside this
 * process; nothing leaves it, and any network address but the model stand-in fails the test. Synthetic data only.
 *
 *   A. ACCESS WITHOUT AN ACCOUNT: a link and a PIN, shown once; only hashes are stored; a new link withdraws the
 *      old one; withdrawal and expiry end the link and its sessions.
 *   B. THE PIN: the token alone shows nothing; wrong PINs are counted, slowed and lock the link for good.
 *   C. ISOLATION, every direction: patient ↔ patient, doctor ↔ doctor, country ↔ country, portal session ↔ doctor session.
 *   D. SHARING IS THE DOCTOR'S ACT: nothing is shared automatically; an unapproved note is never shared; unsharing
 *      removes at once; the clinical note is never shown; the model gets the approved note only.
 *   E. APPOINTMENT REQUEST: one waiting request; accept by choosing the slot, no double booking; decline; outcome.
 *   F. PRIVACY DEFAULTS: never cached, never indexed; the cookie; the record the doctor reads.
 *   G. USAGE: the summary is counted for the account, with the tokens the provider reported.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0007'
process.env.OPENROUTER_API_KEY = 'sahte-model-anahtari'
delete process.env.OPENROUTER_BASE_URL
// The server clock is NOT the country's: every day and hour must come from the pack's time zone.
process.env.TZ = 'America/Los_Angeles'

import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani, type Satir } from '@/lib/ulke/testing/sahteVeritabani'

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

// ───────────────────────── the model stand-in ─────────────────────────
const OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions'
const OZET_ISARETI = 'QA-SUMMARY-FOR-THE-PATIENT'
const modelIstekleri: { system: string; user: string }[] = []
let modelCevabi: string = JSON.stringify({ summary: `${OZET_ISARETI} one two three.` })
globalThis.fetch = (async (g: unknown, o?: { body?: unknown }) => {
  const adres = String(g)
  if (adres !== OPENROUTER) throw new Error(`this test may not use the network: ${adres}`)
  const b = JSON.parse(String(o?.body)) as { model: string; messages: { role: string; content: unknown }[] }
  const metin = (c: unknown) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map((x) => (x as { text?: string }).text ?? '').join('') : '')
  modelIstekleri.push({ system: b.messages.filter((m) => m.role === 'system').map((m) => metin(m.content)).join('\n'), user: b.messages.filter((m) => m.role === 'user').map((m) => metin(m.content)).join('\n') })
  return new Response(JSON.stringify({ id: 'sahte-1', model: b.model, choices: [{ message: { role: 'assistant', content: modelCevabi }, finish_reason: 'stop' }], usage: { prompt_tokens: 640, completion_tokens: 130 } }), { status: 200, headers: { 'content-type': 'application/json' } })
}) as typeof fetch

type Mod = Record<string, (req: unknown) => Promise<Response>>
type Paket = import('../tipler').UlkePaketi
let paket: Paket
let BU = ''
let ACIK = false
let RANDEVU = false
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let S: typeof import('./sabitler')
let pinMod: typeof import('./pin')
let giris: typeof import('./giris')
let rota: { hekim: Mod; ozet: Mod; istekler: Mod; pGiris: Mod; portal: Mod; cikis: Mod; istek: Mod }

const A = '10000000-0000-4000-8000-00000000000a'
const B = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001' // patient 1 of doctor A
const H2 = '30000000-0000-4000-8000-000000000002' // patient 2 of doctor A
const H3 = '30000000-0000-4000-8000-000000000003' // patient of doctor B
const YOK = '77777777-7777-4777-8777-777777777777'
const NOT_METNI = 'QA-CLINICAL-NOTE-TEXT-NEVER-FOR-A-PATIENT'
const DOKUM = 'QA-TRANSCRIPT-NEVER-FOR-A-PATIENT'
const TEL = '+000 00 555 01 01'
const KIMLIK = '90909090909090'
const AD = { [H1]: 'QA Patient One', [H2]: 'QA Patient Two', [H3]: 'QA Patient Three' } as Record<string, string>
let hastaDili = ''
let rol: string | null = null

const tablo = (ad: string) => vt.tablo(ad)
const simdiIso = () => new Date().toISOString()

function hastaEkle(id: string, doktor: string, ulke = BU) {
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: AD[id] ?? 'QA Foreign' })), dob_encrypted: sifrele('1990-05-05'), gender_encrypted: null, phone_encrypted: sifrele(TEL), is_active: true, created_at: simdiIso() })
  tablo('hasta_ulke_bilgisi').push({ patient_id: id, ulke, doctor_id: doktor, dil: hastaDili, ota_ismi_encrypted: null, ulusal_kimlik_encrypted: sifrele(KIMLIK) })
}
/** A visit with a note of `doktor` about `hasta`. `onayli` false = an unapproved draft. Returns the note's id. */
let notSayaci = 0
function notEkle(doktor: string, hasta: string, onayli: boolean, ulke = BU): string {
  const n = ++notSayaci
  const s = `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`, id = `50000000-0000-4000-8000-${String(n).padStart(12, '0')}`
  const dil = paket.uygulama!.diller[0]
  tablo('ulke_muayeneler').push({ id: s, ulke, doctor_id: doktor, patient_id: hasta, started_at: '2026-10-05T06:00:00.000Z', created_at: '2026-10-05T06:00:00.000Z', specialty: 'x', transcript_cleaned: DOKUM })
  tablo('muayene_dil_kaydi').push({ session_id: s, ulke, doctor_id: doktor, patient_id: hasta, not_dili: dil, sablon: 'x' })
  tablo('ulke_notlar').push({ id, ulke, doctor_id: doktor, session_id: s, approved_at: onayli ? '2026-10-05T07:00:00.000Z' : null, approved_by: onayli ? doktor : null, content_subjektif: `${NOT_METNI} S`, content_objektif: `${NOT_METNI} O`, content_degerlendirme: `${NOT_METNI} A`, content_plan: `${NOT_METNI} P`, created_at: '2026-10-05T06:30:00.000Z' })
  tablo('not_dil_kaydi').push({ note_id: id, ulke, doctor_id: doktor, patient_id: hasta, not_dili: dil, ikinci_dil: null, alanlar: null, ikinci_alanlar: null })
  return id
}

function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  modelIstekleri.length = 0; modelCevabi = JSON.stringify({ summary: `${OZET_ISARETI} one two three.` })
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: A, email: 'qa-a@notya.test', app_metadata: { country: BU } },
    'jeton-b': { id: B, email: 'qa-b@notya.test', app_metadata: { country: BU } },
  })
  const d = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  tablo('ulke_hesaplari').push({ id: A, full_name: 'QA Doctor A', ulke: BU, ui_language: d }, { id: B, full_name: 'QA Doctor B', ulke: BU, ui_language: d })
  tablo('hekim_dil_tercihleri').push({ ulke: BU, doctor_id: A, not_dili: d, soruldu_at: 'x' }, { ulke: BU, doctor_id: B, not_dili: d, soruldu_at: 'x' })
  if (rol) tablo('hekim_rolu').push({ ulke: BU, doctor_id: A, rol }, { ulke: BU, doctor_id: B, rol })
  hastaEkle(H1, A); hastaEkle(H2, A); hastaEkle(H3, B)
}

type Secenek = { jeton?: string; cerez?: string; govde?: unknown; portal?: boolean; host?: string; /** the link the page says it is open for: a token, or false to send none */ baglanti?: string | false }
/** Session key → the token of the link it was opened with: the portal page always says which link it is open for. */
const oturumunBaglantisi = new Map<string, string>()
/** One request to a real handler. `portal` true = the portal's own header and JSON, as the portal page sends them. */
async function iste(mod: Mod, yontem: string, yol: string, s: Secenek = {}): Promise<{ status: number; govde: any; res: Response }> {
  const basliklar: Record<string, string> = { host: s.host ?? 'notya.test' }
  if (s.jeton) basliklar.authorization = `Bearer ${s.jeton}`
  if (s.cerez) basliklar.cookie = `${S.PORTAL_CEREZI}=${s.cerez}`
  const baglanti = s.baglanti === false ? null : s.baglanti ?? (s.cerez ? oturumunBaglantisi.get(s.cerez) : null)
  if (baglanti) basliklar[S.PORTAL_BAGLANTI_BASLIGI] = pinMod.anahtarHash(baglanti)
  if (s.govde !== undefined) basliklar['content-type'] = 'application/json'
  if (s.portal) { basliklar[S.PORTAL_ISTEK_BASLIGI] = '1'; basliklar['content-type'] = 'application/json' }
  const req = new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(s.govde !== undefined ? { body: JSON.stringify(s.govde) } : s.portal && yontem !== 'GET' ? { body: '{}' } : {}) })
  const res = await mod[yontem](req)
  const metin = await res.clone().text()
  let govde: unknown = null
  try { govde = JSON.parse(metin) } catch { govde = metin }
  return { status: res.status, govde, res }
}
const cerezOku = (res: Response): string => new RegExp(`${S.PORTAL_CEREZI}=([^;]*)`).exec(res.headers.get('set-cookie') ?? '')?.[1] ?? ''
const tokenOku = (yol: string): string => yol.split('#')[1] ?? ''

/** Doctor `jeton` gives `hasta` a link. */
async function erisimVer(jeton: string, hasta: string): Promise<{ token: string; pin: string; yol: string }> {
  const r = await iste(rota.hekim, 'POST', '/api/ulke/hasta-portali', { jeton, govde: { hastaId: hasta } })
  assert.equal(r.status, 200, JSON.stringify(r.govde))
  return { token: tokenOku(r.govde.yol), pin: r.govde.pin, yol: r.govde.yol }
}
/** The patient signs in with the link's token and the PIN; the answer's cookie is the session key. */
async function girisYap(token: string, pin: string) {
  const r = await iste(rota.pGiris, 'POST', '/api/ulke/portal/giris', { portal: true, govde: { token, pin } })
  const cerez = cerezOku(r.res)
  if (cerez) oturumunBaglantisi.set(cerez, token)
  return { ...r, cerez }
}
const yanlisPin = (pin: string) => (pin === '000000' ? '000001' : '000000')
/** Time moves for the handlers too (the stand-in clock of node:test). */
const ilerle = (ms: number) => mock.timers.tick(ms)

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  ACIK = paket.ozellikler.cekirdekMuayene === true && paket.ozellikler.hastaPortali === true
  RANDEVU = ACIK && paket.ozellikler.randevu === true
  hastaDili = paket.uygulama?.hastaDilleri[0] ?? ''
  rol = paket.uygulama?.roller?.[0] ?? null
  NextRequest = (await import('next/server')).NextRequest
  sifrele = (await import('@/lib/security/encryption')).encrypt
  S = await import('./sabitler')
  pinMod = await import('./pin')
  giris = await import('./giris')
  rota = {
    hekim: (await import('../../../app/api/ulke/hasta-portali/route.ulke')) as unknown as Mod,
    ozet: (await import('../../../app/api/ulke/hasta-portali/ozet/route.ulke')) as unknown as Mod,
    istekler: (await import('../../../app/api/ulke/hasta-portali/istekler/route.ulke')) as unknown as Mod,
    pGiris: (await import('../../../app/api/ulke/portal/giris/route.ulke')) as unknown as Mod,
    portal: (await import('../../../app/api/ulke/portal/route.ulke')) as unknown as Mod,
    cikis: (await import('../../../app/api/ulke/portal/cikis/route.ulke')) as unknown as Mod,
    istek: (await import('../../../app/api/ulke/portal/randevu-istegi/route.ulke')) as unknown as Mod,
  }
  // A fixed Monday morning (UTC), so that "tomorrow", working days and expiry are the same on every run.
  mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-12T04:00:00.000Z') })
})
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()
// Every test starts at the same instant: a test that lets a month pass does not move the next one.
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); sifirla() })

describe('patient portal — a pack that does not switch it on has none', () => {
  it('every portal route answers "not found", for a doctor, a patient and nobody alike', async () => {
    if (ACIK) return
    for (const [mod, yontemler, yol] of [[rota.hekim, ['GET', 'POST', 'DELETE'], '/api/ulke/hasta-portali'], [rota.ozet, ['GET', 'POST', 'PATCH', 'PUT'], '/api/ulke/hasta-portali/ozet'], [rota.istekler, ['GET', 'PATCH'], '/api/ulke/hasta-portali/istekler'], [rota.pGiris, ['POST'], '/api/ulke/portal/giris'], [rota.portal, ['GET'], '/api/ulke/portal'], [rota.cikis, ['POST'], '/api/ulke/portal/cikis'], [rota.istek, ['POST'], '/api/ulke/portal/randevu-istegi']] as const) {
      for (const y of yontemler) {
        const r = await iste(mod, y, yol, { jeton: 'jeton-a', portal: true, ...(y === 'GET' ? {} : { govde: { hastaId: H1 } }) })
        assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }], `${y} ${yol}`)
      }
    }
    assert.deepEqual(vt.sorgular, [], 'a switched-off portal must not reach the database at all')
  })
})

describe('patient portal — A. access without an account', () => {
  it('the doctor gets a link and a PIN once; the database holds only their hashes', async () => {
    if (!ACIK) return
    const r = await iste(rota.hekim, 'POST', '/api/ulke/hasta-portali', { jeton: 'jeton-a', govde: { hastaId: H1 } })
    assert.equal(r.status, 200)
    const { yol, pin, sonGecerlilik } = r.govde as { yol: string; pin: string; sonGecerlilik: string }
    assert.match(yol, new RegExp(`^${S.PORTAL_SAYFASI.replace('/', '\\/')}\\?dil=[A-Za-z-]+#[A-Za-z0-9_-]{43}$`), 'the token rides in the fragment, never in the path or the query')
    assert.match(pin, /^\d{6}$/)
    const token = tokenOku(yol)
    const satirlar = tablo('ulke_portal_erisimleri')
    assert.equal(satirlar.length, 1)
    const e = satirlar[0]
    assert.deepEqual([e.ulke, e.doctor_id, e.patient_id, e.iptal_at, e.kilitlendi_at, e.hatali_deneme], [BU, A, H1, null, null, 0])
    assert.equal(e.token_hash, pinMod.anahtarHash(token))
    assert.match(String(e.pin_hash), /^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/, 'the PIN is stored as a slow, salted hash')
    assert.equal(await pinMod.pinDogrula(pin, e.pin_hash), true)
    // Neither secret is anywhere in the database: not in this row, not in the record, not in any other table.
    const hepsi = JSON.stringify(vt.tablolar)
    assert.ok(!hepsi.includes(token), 'the token is stored somewhere')
    assert.ok(!Object.values(vt.tablolar).flat().some((s) => Object.values(s).some((v) => v === pin)), 'the PIN is stored somewhere')
    // It ends after the pack's number of days.
    assert.equal(new Date(sonGecerlilik).getTime() - Date.now(), paket.uygulama!.portal!.baglantiGecerlilikGun * 86_400_000)
    assert.equal(e.son_gecerlilik, sonGecerlilik)
    // The doctor can see that there is a link — never the secrets, nor their hashes.
    const d = await iste(rota.hekim, 'GET', `/api/ulke/hasta-portali?hasta=${H1}`, { jeton: 'jeton-a' })
    assert.equal(d.status, 200)
    assert.equal(d.govde.erisim.durum, 'acik')
    assert.deepEqual(d.govde.kayitlar.map((k: { olay: string }) => k.olay), ['erisim'])
    const cevap = JSON.stringify(d.govde)
    for (const gizli of [token, pin, String(e.token_hash), String(e.pin_hash)]) assert.ok(!cevap.includes(gizli), 'the status answer carries a secret or its hash')
  })

  it('two PINs for the same PIN text never hash alike, and a malformed value is never a PIN', async () => {
    if (!ACIK) return
    const [h1, h2] = [await pinMod.pinHashle('123456'), await pinMod.pinHashle('123456')]
    assert.notEqual(h1, h2, 'the hash must be salted')
    assert.equal(await pinMod.pinDogrula('123456', h1), true)
    for (const kotu of ['123457', '12345', '1234567', 'abcdef', '', null, 123456, ' 123456']) assert.equal(await pinMod.pinDogrula(kotu, h1), false, String(kotu))
    for (const kotuHash of ['', '123456', 'scrypt$1$8$1$AAAA$AAAA', 'scrypt$1048576$8$1$AAAA$AAAA', null]) assert.equal(await pinMod.pinDogrula('123456', kotuHash), false, String(kotuHash))
    await assert.rejects(() => pinMod.pinHashle('12345'))
    const pinler = new Set(Array.from({ length: 50 }, () => pinMod.pinUret()))
    assert.ok(pinler.size > 40 && [...pinler].every((p) => /^\d{6}$/.test(p)))
    assert.notEqual(pinMod.anahtarUret(), pinMod.anahtarUret())
  })

  it('a NEW link withdraws the old one at once: the old token is "no such link" and its session is over', async () => {
    if (!ACIK) return
    const eski = await erisimVer('jeton-a', H1)
    const g = await girisYap(eski.token, eski.pin)
    assert.equal(g.status, 200)
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).status, 200)
    ilerle(3000)
    const yeni = await erisimVer('jeton-a', H1)
    assert.notEqual(yeni.token, eski.token)
    assert.equal(tablo('ulke_portal_erisimleri').filter((e) => !e.iptal_at).length, 1, 'a patient has one link that is not withdrawn')
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).status, 401, 'the old session must be over')
    assert.deepEqual([(await girisYap(eski.token, eski.pin)).status, (await girisYap(eski.token, eski.pin)).govde], [404, { code: 'NOT_FOUND' }])
    assert.equal((await girisYap(yeni.token, yeni.pin)).status, 200)
  })

  it('the doctor withdraws access: the link and its session stop at once; withdrawing twice changes nothing', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const sil = await iste(rota.hekim, 'DELETE', '/api/ulke/hasta-portali', { jeton: 'jeton-a', govde: { hastaId: H1 } })
    assert.deepEqual([sil.status, sil.govde], [200, { ok: true, vardi: true }])
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).status, 401)
    ilerle(3000)
    assert.equal((await girisYap(l.token, l.pin)).status, 404)
    const once = JSON.stringify(vt.tablolar)
    assert.deepEqual((await iste(rota.hekim, 'DELETE', '/api/ulke/hasta-portali', { jeton: 'jeton-a', govde: { hastaId: H1 } })).govde, { ok: true, vardi: false })
    assert.equal(JSON.stringify(vt.tablolar), once)
    const d = await iste(rota.hekim, 'GET', `/api/ulke/hasta-portali?hasta=${H1}`, { jeton: 'jeton-a' })
    assert.equal(d.govde.erisim.durum, 'yok')
    assert.deepEqual(d.govde.kayitlar.map((k: { olay: string }) => k.olay).sort(), ['erisim', 'giris', 'iptal'])
  })

  it('a link ends after the pack\'s period, and a session never outlives its link or its own minutes', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    assert.equal(g.status, 200)
    // the session's own minutes
    ilerle(S.PORTAL_OTURUM_DK * 60_000 - 1000)
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).status, 200)
    ilerle(2000)
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).status, 401, 'a session ends after its minutes')
    // one second before the link ends a sign-in still works, and its session ends WITH the link
    ilerle(paket.uygulama!.portal!.baglantiGecerlilikGun * 86_400_000 - S.PORTAL_OTURUM_DK * 60_000 - 2000)
    const son = await girisYap(l.token, l.pin)
    assert.equal(son.status, 200)
    const bitis = tablo('ulke_portal_oturumlari').slice(-1)[0].son_gecerlilik
    assert.equal(bitis, tablo('ulke_portal_erisimleri')[0].son_gecerlilik, 'a session may not outlive its link')
    ilerle(1500)
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: son.cerez })).status, 401)
    assert.deepEqual([(await girisYap(l.token, l.pin)).status, (await girisYap(l.token, l.pin)).govde], [404, { code: 'NOT_FOUND' }], 'an ended link answers like one that never existed')
    assert.equal((await iste(rota.hekim, 'GET', `/api/ulke/hasta-portali?hasta=${H1}`, { jeton: 'jeton-a' })).govde.erisim.durum, 'suresi-doldu')
  })
})

describe('patient portal — B. the PIN', () => {
  it('the token alone shows nothing: no session, and a malformed PIN answers the same for a real link and for none', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal')).status, 401)
    // the token offered as if it were a session
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: l.token })).status, 401)
    const once = JSON.stringify(vt.tablolar)
    for (const pin of ['', '12345', 'abcdef', null, 1234567]) {
      const gercek = await iste(rota.pGiris, 'POST', '/api/ulke/portal/giris', { portal: true, govde: { token: l.token, pin } })
      const uydurma = await iste(rota.pGiris, 'POST', '/api/ulke/portal/giris', { portal: true, govde: { token: pinMod.anahtarUret(), pin } })
      assert.deepEqual([gercek.status, gercek.govde], [uydurma.status, uydurma.govde])
      assert.equal(gercek.status, 400)
    }
    assert.equal(JSON.stringify(vt.tablolar), once, 'a malformed PIN must not cost a try or change anything')
    // Whatever a request with the token and a wrong PIN is told, it is nothing about the patient or the doctor.
    const y = await girisYap(l.token, yanlisPin(l.pin))
    assert.deepEqual([y.status, y.govde], [401, { code: 'PIN_YANLIS', kalan: S.PIN_DENEME_AZAMI - 1 }])
    assert.equal(y.cerez, '', 'a wrong PIN sets no cookie')
    assert.equal(tablo('ulke_portal_oturumlari').length, 0)
  })

  it('wrong PINs are counted and slowed; the fifth locks the link for good, also for the right PIN', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const kotu = yanlisPin(l.pin)
    assert.deepEqual((await girisYap(l.token, kotu)).govde, { code: 'PIN_YANLIS', kalan: 4 })
    // RATE LIMIT: a second try right away is not looked at and not counted — not even with the right PIN.
    const hizli = await girisYap(l.token, l.pin)
    assert.deepEqual([hizli.status, hizli.govde], [429, { code: 'YAVAS' }])
    assert.equal(tablo('ulke_portal_erisimleri')[0].hatali_deneme, 1)
    for (const kalan of [3, 2, 1]) { ilerle(S.PIN_DENEME_ARALIGI_SN * 1000); assert.deepEqual((await girisYap(l.token, kotu)).govde, { code: 'PIN_YANLIS', kalan }) }
    ilerle(S.PIN_DENEME_ARALIGI_SN * 1000)
    const besinci = await girisYap(l.token, kotu)
    assert.deepEqual([besinci.status, besinci.govde], [423, { code: 'KILITLI' }])
    assert.ok(tablo('ulke_portal_erisimleri')[0].kilitlendi_at)
    // LOCKED FOR GOOD: the right PIN, now and a day later.
    ilerle(5000)
    assert.deepEqual((await girisYap(l.token, l.pin)).govde, { code: 'KILITLI' })
    ilerle(86_400_000)
    assert.deepEqual((await girisYap(l.token, l.pin)).govde, { code: 'KILITLI' })
    assert.equal(tablo('ulke_portal_oturumlari').length, 0)
    // The doctor sees the lock, once, and gives a new link.
    const d = await iste(rota.hekim, 'GET', `/api/ulke/hasta-portali?hasta=${H1}`, { jeton: 'jeton-a' })
    assert.equal(d.govde.erisim.durum, 'kilitli')
    assert.equal(d.govde.kayitlar.filter((k: { olay: string }) => k.olay === 'kilit').length, 1)
    const yeni = await erisimVer('jeton-a', H1)
    assert.equal((await girisYap(yeni.token, yeni.pin)).status, 200)
  })

  it('a right PIN gives the tries back; a lock also ends a session that was open', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const kotu = yanlisPin(l.pin)
    for (let i = 0; i < 3; i++) { await girisYap(l.token, kotu); ilerle(S.PIN_DENEME_ARALIGI_SN * 1000) }
    const g = await girisYap(l.token, l.pin)
    assert.equal(g.status, 200)
    assert.equal(tablo('ulke_portal_erisimleri')[0].hatali_deneme, 0)
    for (let i = 0; i < S.PIN_DENEME_AZAMI; i++) { ilerle(S.PIN_DENEME_ARALIGI_SN * 1000); await girisYap(l.token, kotu) }
    assert.ok(tablo('ulke_portal_erisimleri')[0].kilitlendi_at)
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).status, 401, 'a locked link has no session')
  })

  it('a try is taken BEFORE the PIN is looked at, so a cut-off request still cost one', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const { ulkeIslevi } = await import('../uygulama/tablolar')
    const sb = vt.createClient() as unknown as Parameters<typeof ulkeIslevi>[0]
    // Five tries taken and never reported back (five requests cut off after the first step) …
    for (let i = 0; i < S.PIN_DENEME_AZAMI; i++) {
      const { data } = await ulkeIslevi(sb, 'ulke_portal_deneme_al', { p_token_hash: pinMod.anahtarHash(l.token), p_azami: S.PIN_DENEME_AZAMI, p_aralik_sn: S.PIN_DENEME_ARALIGI_SN, p_simdi: new Date().toISOString() })
      assert.equal((data as { durum: string }).durum, 'DENE')
      ilerle(S.PIN_DENEME_ARALIGI_SN * 1000)
    }
    // … and the sixth request finds no try left, whatever PIN it brings.
    assert.deepEqual((await girisYap(l.token, l.pin)).govde, { code: 'KILITLI' })
  })
})

describe('patient portal — C. isolation', () => {
  it('a signed-in patient sees their own name, their doctor and the doctor\'s role as the pack names it — and nothing of anybody else', async () => {
    if (!ACIK) return
    const { rolAdi } = await import('../arayuz')
    const { hastaIcinBicim } = await import('../arayuz/dilSecimi')
    const l1 = await erisimVer('jeton-a', H1), l3 = await erisimVer('jeton-b', H3)
    const g1 = await girisYap(l1.token, l1.pin), g3 = await girisYap(l3.token, l3.pin)
    const b1 = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g1.cerez })
    const b3 = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g3.cerez })
    assert.deepEqual([b1.status, b3.status], [200, 200])
    const d = paket.uygulama!.diller[0]
    const bicim = hastaIcinBicim(paket.uygulama!.dilGruplari, hastaDili, { dil: d, notDili: d })
    assert.equal(b1.govde.dil, bicim, 'the page is in the patient\'s own language form')
    assert.deepEqual(b1.govde.hasta, { ad: AD[H1] })
    assert.deepEqual(b1.govde.hekim, { ad: 'QA Doctor A', rol: rol ? rolAdi(rol, bicim) : '' })
    assert.deepEqual([b3.govde.hasta.ad, b3.govde.hekim.ad], [AD[H3], 'QA Doctor B'])
    // The link opens in the same form.
    assert.ok(l1.yol.startsWith(`${S.PORTAL_SAYFASI}?dil=${encodeURIComponent(bicim)}#`))
    const m1 = JSON.stringify(b1.govde)
    for (const yabanci of [AD[H2], AD[H3], 'QA Doctor B', TEL, KIMLIK, H2, H3, B, A, H1]) assert.ok(!m1.includes(yabanci), `the patient's page carries "${yabanci}"`)
  })

  it('a session answers only the page of ITS OWN link: a second patient\'s link on the same phone never shows the first patient\'s page', async () => {
    if (!ACIK) return
    const l1 = await erisimVer('jeton-a', H1)
    const l2 = await erisimVer('jeton-a', H2)
    const g1 = await girisYap(l1.token, l1.pin)
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g1.cerez })).status, 200)
    // The browser still holds patient 1's session; the page was opened with patient 2's link (or with none, or with nonsense).
    // The request route is asked FIRST each time: it refuses and leaves the session alone; the page route refuses and ends it.
    for (const baglanti of [l2.token, false, pinMod.anahtarUret()] as const) {
      if (RANDEVU) assert.equal((await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g1.cerez, portal: true, baglanti, govde: { gunler: [] } })).status, 401)
      const r = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g1.cerez, baglanti })
      assert.deepEqual([r.status, r.govde], [401, { code: 'OTURUM_YOK' }], `link ${String(baglanti).slice(0, 6)}`)
      assert.ok(!JSON.stringify(r.govde).includes(AD[H1]))
    }
    // A raw token in the header is not a link's mark either: only its hash is ever compared.
    const ham = new NextRequest('https://notya.test/api/ulke/portal', { headers: { host: 'notya.test', cookie: `${S.PORTAL_CEREZI}=${g1.cerez}`, [S.PORTAL_BAGLANTI_BASLIGI]: l1.token } })
    assert.equal((await rota.portal.GET(ham)).status, 401)
    // … and the first patient's session was not left open behind the other page: it is closed in the database and its
    // cookie is taken away, so its own page asks for the PIN again. The second patient's link is untouched.
    const kendi = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g1.cerez })
    assert.equal(kendi.status, 401, 'the first session must be over')
    assert.ok(tablo('ulke_portal_oturumlari').every((o) => o.kapandi_at), 'the session is closed in the database')
    assert.match(kendi.res.headers.get('set-cookie') ?? '', new RegExp(`${S.PORTAL_CEREZI}=;.*Max-Age=0`, 'i'))
    const g2 = await girisYap(l2.token, l2.pin)
    assert.deepEqual((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g2.cerez })).govde.hasta, { ad: AD[H2] })
    // A request to another portal route with the wrong link's mark changes nothing and closes nothing.
    await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g2.cerez, portal: true, baglanti: l1.token, govde: { gunler: [] } })
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g2.cerez })).status, 200)
  })

  it('the page takes NO id from the request: naming another patient or doctor in it changes nothing', async () => {
    if (!ACIK) return
    const l1 = await erisimVer('jeton-a', H1)
    const g1 = await girisYap(l1.token, l1.pin)
    const duz = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g1.cerez })
    for (const ek of [`?hasta=${H2}`, `?hastaId=${H3}&doktor=${B}`, `?patient_id=${H3}&doctor_id=${B}&ulke=zz`]) {
      const r = await iste(rota.portal, 'GET', `/api/ulke/portal${ek}`, { cerez: g1.cerez })
      assert.deepEqual(r.govde, duz.govde, ek)
    }
    // Every statement the page made named this country; every read of a patient table named doctor A; none named H2, H3 or B.
    vt.sorgular.length = 0
    await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g1.cerez })
    assert.ok(vt.sorgular.length > 3)
    assert.deepEqual([...new Set(vt.sorgular.map((q) => q.ulke))], [BU])
    for (const q of vt.sorgular) {
      const f = q.filtreler.join(' ')
      assert.ok(![H2, H3, B].some((x) => f.includes(x)), `${q.tablo}: a statement of patient 1's page names somebody else — ${f}`)
      if (['ulke_hastalar', 'hasta_ulke_bilgisi', 'ulke_randevulari', 'ulke_hasta_ozetleri', 'ulke_randevu_istekleri', 'ulke_notlar', 'ulke_muayeneler'].includes(q.tablo)) assert.ok(f.includes(`doctor_id=eq.${A}`), `${q.tablo}: read without the doctor — ${f}`)
      if (['ulke_randevulari', 'ulke_hasta_ozetleri', 'ulke_randevu_istekleri', 'ulke_muayeneler', 'hasta_ulke_bilgisi'].includes(q.tablo)) assert.ok(f.includes(H1), `${q.tablo}: read without the patient — ${f}`)
    }
  })

  it('two patients of one doctor and a patient of another: each sees their own appointments, shared summaries and request, never another\'s', async () => {
    if (!ACIK) return
    const isaret: Record<string, string> = { [H1]: 'QA-SUMMARY-ONE', [H2]: 'QA-SUMMARY-TWO', [H3]: 'QA-SUMMARY-THREE' }
    const saat: Record<string, string> = { [H1]: '2026-10-14T05:00:00.000Z', [H2]: '2026-10-14T06:00:00.000Z', [H3]: '2026-10-14T07:00:00.000Z' }
    const cerez: Record<string, string> = {}
    for (const [hasta, doktor, jeton] of [[H1, A, 'jeton-a'], [H2, A, 'jeton-a'], [H3, B, 'jeton-b']] as const) {
      const n = notEkle(doktor, hasta, true)
      tablo('ulke_hasta_ozetleri').push({ id: `60000000-0000-4000-8000-00000000000${hasta.slice(-1)}`, ulke: BU, doctor_id: doktor, patient_id: hasta, note_id: n, dil: paket.uygulama!.diller[0], ozet_encrypted: sifrele(isaret[hasta]), paylasildi_at: simdiIso(), created_at: simdiIso(), updated_at: simdiIso() })
      if (RANDEVU) {
        tablo('ulke_randevulari').push({ id: `70000000-0000-4000-8000-00000000000${hasta.slice(-1)}`, ulke: BU, doctor_id: doktor, patient_id: hasta, baslangic: saat[hasta], bitis: new Date(new Date(saat[hasta]).getTime() + 1_800_000).toISOString(), neden_encrypted: sifrele('QA-DOCTORS-OWN-REASON'), durum: 'planlandi', mesai_disi: false, session_id: null })
        tablo('ulke_randevu_istekleri').push({ id: `80000000-0000-4000-8000-00000000000${hasta.slice(-1)}`, ulke: BU, doctor_id: doktor, patient_id: hasta, gunler: [`2026-10-1${hasta.slice(-1)}`], neden_encrypted: sifrele(`QA-REASON-${hasta.slice(-1)}`), durum: 'bekliyor', randevu_id: null, created_at: simdiIso() })
      }
      const l = await erisimVer(jeton, hasta)
      cerez[hasta] = (await girisYap(l.token, l.pin)).cerez
    }
    const { yerelAn, saatYazDk } = await import('../uygulama/zaman')
    for (const hasta of [H1, H2, H3]) {
      const r = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: cerez[hasta] })
      assert.equal(r.status, 200)
      assert.deepEqual(r.govde.ozetler.map((o: { metin: string }) => o.metin), [isaret[hasta]])
      const metin = JSON.stringify(r.govde)
      for (const baska of [H1, H2, H3].filter((x) => x !== hasta)) {
        assert.ok(!metin.includes(isaret[baska]) && !metin.includes(AD[baska]), `patient ${hasta.slice(-1)} sees something of patient ${baska.slice(-1)}`)
      }
      // never the clinical note, the transcript, the doctor's own reason for an appointment, the phone or the identity number
      for (const yasak of [NOT_METNI, DOKUM, 'QA-DOCTORS-OWN-REASON', TEL, KIMLIK]) assert.ok(!metin.includes(yasak), `the patient's page carries "${yasak}"`)
      if (RANDEVU) {
        const y = yerelAn(saat[hasta], paket.saatDilimi)
        assert.deepEqual(r.govde.randevular, [{ gun: y.gun, saat: saatYazDk(y.dakika), sureDk: 30 }], 'the appointment, in the country\'s own day and hour whatever the server\'s zone is')
        assert.deepEqual(r.govde.istek.son.gunler, [`2026-10-1${hasta.slice(-1)}`])
      } else {
        assert.deepEqual([r.govde.randevular, r.govde.istek], [null, null])
      }
    }
  })

  it('another COUNTRY\'s link, with the very same token, answers exactly like a link that does not exist', async () => {
    if (!ACIK) return
    const YABANCI = ['zz', 'tr', 'uz'].find((k) => k !== BU) as string
    const token = pinMod.anahtarUret(), pin = '424242'
    tablo('ulke_hastalar').push({ id: YOK, ulke: YABANCI, doctor_id: A, name_encrypted: sifrele(JSON.stringify({ ad: 'QA Foreign Patient' })), created_at: simdiIso() })
    tablo('ulke_portal_erisimleri').push({ id: '61000000-0000-4000-8000-000000000001', ulke: YABANCI, doctor_id: A, patient_id: YOK, token_hash: pinMod.anahtarHash(token), pin_hash: await pinMod.pinHashle(pin), hatali_deneme: 0, son_deneme_at: null, kilitlendi_at: null, son_gecerlilik: '2027-01-01T00:00:00.000Z', iptal_at: null, son_giris_at: null, created_at: simdiIso() })
    const oturum = pinMod.anahtarUret()
    tablo('ulke_portal_oturumlari').push({ id: '62000000-0000-4000-8000-000000000001', ulke: YABANCI, doctor_id: A, patient_id: YOK, erisim_id: '61000000-0000-4000-8000-000000000001', oturum_hash: pinMod.anahtarHash(oturum), son_gecerlilik: '2027-01-01T00:00:00.000Z', kapandi_at: null, created_at: simdiIso() })
    const once = JSON.stringify(vt.tablolar)
    const yabanci = await girisYap(token, pin)
    const olmayan = await girisYap(pinMod.anahtarUret(), pin)
    assert.deepEqual([yabanci.status, yabanci.govde, yabanci.cerez], [olmayan.status, olmayan.govde, olmayan.cerez])
    assert.deepEqual([yabanci.status, yabanci.govde], [404, { code: 'NOT_FOUND' }])
    // … and its session key is no session here.
    const s = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: oturum })
    const s2 = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: pinMod.anahtarUret() })
    assert.deepEqual([s.status, s.govde], [s2.status, s2.govde])
    assert.equal(s.status, 401)
    assert.equal(JSON.stringify(vt.tablolar), once, 'a row of another country changed')
    // The doctor's own routes do not find that patient either.
    assert.equal((await iste(rota.hekim, 'POST', '/api/ulke/hasta-portali', { jeton: 'jeton-a', govde: { hastaId: YOK } })).status, 404)
    assert.equal(JSON.stringify(vt.tablolar), once)
  })

  it('a session row that points at another patient\'s link is no session (a session cannot borrow a link)', async () => {
    if (!ACIK) return
    const l2 = await erisimVer('jeton-a', H2)
    const erisim2 = tablo('ulke_portal_erisimleri')[0].id
    const anahtar = pinMod.anahtarUret()
    // Cannot be written through the database (the key carries the patient); seeded here past the constraint on purpose.
    tablo('ulke_portal_oturumlari').push({ id: '62000000-0000-4000-8000-000000000002', ulke: BU, doctor_id: A, patient_id: H1, erisim_id: erisim2, oturum_hash: pinMod.anahtarHash(anahtar), son_gecerlilik: '2027-01-01T00:00:00.000Z', kapandi_at: null, created_at: simdiIso() })
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: anahtar })).status, 401)
    assert.ok(l2.token)
  })

  it('A DOCTOR\'S SESSION IS NOT A PORTAL SESSION: the portal routes do not look at it', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    vt.sorgular.length = 0
    // a signed-in doctor, as bearer token and as cookie value, with and without the portal header
    for (const s of [{ jeton: 'jeton-a' }, { cerez: 'jeton-a' }, { jeton: 'jeton-a', cerez: 'jeton-a' }] as Secenek[]) {
      assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', s)).status, 401)
      const ist = await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { ...s, portal: true, govde: { gunler: ['2026-10-13'], hastaId: H1, doktorId: A } })
      assert.equal(ist.status, RANDEVU ? 401 : 404)
    }
    assert.deepEqual(vt.sorgular, [], 'with only a doctor\'s session a portal route must not even reach the database')
    // … and a doctor's session does not replace the PIN.
    const g = await iste(rota.pGiris, 'POST', '/api/ulke/portal/giris', { jeton: 'jeton-a', portal: true, govde: { token: l.token, pin: yanlisPin(l.pin) } })
    assert.equal(g.status, 401)
    assert.equal(tablo('ulke_portal_oturumlari').length, 0)
    assert.equal(tablo('ulke_randevu_istekleri').length, 0)
  })

  it('A PORTAL TOKEN OR SESSION IS NOT A DOCTOR\'S SESSION: every doctor route of the country refuses it', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    assert.equal(g.status, 200)
    const notId = notEkle(A, H1, true)
    // Every route file of a country build that is NOT one of the patient's own.
    const dosyalar: string[] = []
    const gez = (d: string) => { for (const ad of readdirSync(d)) { const yol = join(d, ad); if (statSync(yol).isDirectory()) gez(yol); else if (/^route\.ulke\.ts$/.test(ad)) dosyalar.push(yol) } }
    gez(join(KOK, 'app/api/ulke'))
    const goreli = (p: string) => relative(KOK, p).split(sep).join('/')
    const hekimRotalari = dosyalar.filter((f) => !goreli(f).startsWith('app/api/ulke/portal/'))
    assert.ok(hekimRotalari.length >= 15 && hekimRotalari.some((f) => goreli(f) === 'app/api/ulke/hasta-portali/route.ulke.ts'), `found ${hekimRotalari.length} doctor routes`)
    const once = JSON.stringify(vt.tablolar)
    const kimlikler: Secenek[] = [
      { jeton: g.cerez }, { jeton: l.token }, { cerez: g.cerez }, { cerez: g.cerez, jeton: g.cerez }, { cerez: g.cerez, portal: true },
    ]
    const govde = { hastaId: H1, notId, id: H1, seansId: YOK, paylas: true, metin: 'x', red: true, dil: paket.varsayilanDil, ad: 'QA', davetKodu: 'x' }
    let denenen = 0
    for (const f of hekimRotalari) {
      const mod = (await import(pathToFileURL(f).href)) as unknown as Mod
      const yol = `/${goreli(f).replace(/^app\//, '').replace(/\/route\.ulke\.ts$/, '')}`
      for (const y of ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].filter((x) => typeof mod[x] === 'function')) {
        // the sign-up route takes no session at all (it creates an account from an invitation code): not a doctor route
        if (yol === '/api/ulke/kayit') continue
        for (const k of kimlikler) {
          const r = await iste(mod, y, `${yol}?hasta=${H1}&id=${H1}&not=${notId}`, { ...k, ...(y === 'GET' ? {} : { govde }) })
          assert.ok(r.status === 401 || r.status === 404, `${y} ${yol} answered ${r.status} to a portal ${k.jeton ? 'key as bearer token' : 'cookie'}: ${JSON.stringify(r.govde)}`)
          assert.ok(!JSON.stringify(r.govde).includes(AD[H1]), `${y} ${yol} named the patient`)
          denenen++
        }
      }
    }
    assert.ok(denenen >= 100, `only ${denenen} requests were tried`)
    assert.equal(JSON.stringify(vt.tablolar), once, 'a doctor route changed something for a portal session')
  })

  it('DOCTOR ↔ DOCTOR on every portal-management route, both directions: another doctor\'s patient, note or request is "not found" and nothing changes', async () => {
    if (!ACIK) return
    const notlar: Record<string, string> = { [A]: notEkle(A, H1, true), [B]: notEkle(B, H3, true) }
    const hastalar: Record<string, string> = { [A]: H1, [B]: H3 }
    for (const d of [A, B]) {
      tablo('ulke_hasta_ozetleri').push({ id: `60000000-0000-4000-8000-0000000000${d.slice(-2)}`, ulke: BU, doctor_id: d, patient_id: hastalar[d], note_id: notlar[d], dil: paket.uygulama!.diller[0], ozet_encrypted: sifrele(`QA-OWN-SUMMARY-${d.slice(-1)}`), paylasildi_at: null, created_at: simdiIso(), updated_at: simdiIso() })
      if (RANDEVU) tablo('ulke_randevu_istekleri').push({ id: `80000000-0000-4000-8000-0000000000${d.slice(-2)}`, ulke: BU, doctor_id: d, patient_id: hastalar[d], gunler: ['2026-10-14'], neden_encrypted: sifrele(`QA-OWN-REASON-${d.slice(-1)}`), durum: 'bekliyor', randevu_id: null, created_at: simdiIso() })
    }
    await erisimVer('jeton-a', H1); await erisimVer('jeton-b', H3)
    for (const [saldiran, jeton, kurban] of [[A, 'jeton-a', B], [B, 'jeton-b', A]] as const) {
      const kh = hastalar[kurban], kn = notlar[kurban], ki = `80000000-0000-4000-8000-0000000000${kurban.slice(-2)}`
      const once = JSON.stringify(vt.tablolar)
      const modelOnce = modelIstekleri.length
      const cevaplar = [
        await iste(rota.hekim, 'GET', `/api/ulke/hasta-portali?hasta=${kh}`, { jeton }),
        await iste(rota.hekim, 'POST', '/api/ulke/hasta-portali', { jeton, govde: { hastaId: kh } }),
        await iste(rota.hekim, 'DELETE', '/api/ulke/hasta-portali', { jeton, govde: { hastaId: kh } }),
        await iste(rota.ozet, 'GET', `/api/ulke/hasta-portali/ozet?not=${kn}`, { jeton }),
        await iste(rota.ozet, 'POST', '/api/ulke/hasta-portali/ozet', { jeton, govde: { notId: kn } }),
        await iste(rota.ozet, 'PATCH', '/api/ulke/hasta-portali/ozet', { jeton, govde: { notId: kn, metin: 'EZILDI' } }),
        await iste(rota.ozet, 'PUT', '/api/ulke/hasta-portali/ozet', { jeton, govde: { notId: kn, paylas: true } }),
        ...(RANDEVU ? [
          await iste(rota.istekler, 'PATCH', '/api/ulke/hasta-portali/istekler', { jeton, govde: { id: ki, red: true } }),
          await iste(rota.istekler, 'PATCH', '/api/ulke/hasta-portali/istekler', { jeton, govde: { id: ki, gun: '2026-10-14', saat: '10:00', sureDk: paket.uygulama!.randevu!.varsayilan.sureDk, yineDe: true } }),
        ] : []),
      ]
      for (const [i, r] of cevaplar.entries()) {
        assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }], `request ${i} of doctor ${saldiran.slice(-1)} on doctor ${kurban.slice(-1)}'s data`)
      }
      // exactly what a made-up id gets
      assert.deepEqual((await iste(rota.hekim, 'GET', `/api/ulke/hasta-portali?hasta=${YOK}`, { jeton })).govde, { code: 'NOT_FOUND' })
      assert.equal(JSON.stringify(vt.tablolar), once, `doctor ${saldiran.slice(-1)} changed a row`)
      assert.equal(modelIstekleri.length, modelOnce, 'the model was called for another doctor\'s note')
      if (RANDEVU) {
        const liste = await iste(rota.istekler, 'GET', '/api/ulke/hasta-portali/istekler', { jeton })
        assert.deepEqual(liste.govde.istekler.map((x: { hastaId: string; neden: string }) => [x.hastaId, x.neden]), [[hastalar[saldiran], `QA-OWN-REASON-${saldiran.slice(-1)}`]])
      }
      // positive control: the same requests on the doctor's OWN data work
      assert.equal((await iste(rota.hekim, 'GET', `/api/ulke/hasta-portali?hasta=${hastalar[saldiran]}`, { jeton })).status, 200)
      assert.equal((await iste(rota.ozet, 'GET', `/api/ulke/hasta-portali/ozet?not=${notlar[saldiran]}`, { jeton })).govde.ozet.metin, `QA-OWN-SUMMARY-${saldiran.slice(-1)}`)
    }
  })
})

describe('patient portal — D. sharing is the doctor\'s act, item by item', () => {
  it('an UNAPPROVED note has no summary and can never be shared — by any route, and not by a row written past the routes', async () => {
    if (!ACIK) return
    const n = notEkle(A, H1, false)
    const g = await iste(rota.ozet, 'GET', `/api/ulke/hasta-portali/ozet?not=${n}`, { jeton: 'jeton-a' })
    assert.deepEqual([g.status, g.govde.ozet, g.govde.onayli, g.govde.yazilabilir], [200, null, false, false])
    for (const [y, govde] of [['POST', { notId: n }], ['PATCH', { notId: n, metin: 'QA text' }], ['PUT', { notId: n, paylas: true }]] as const) {
      const r = await iste(rota.ozet, y, '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde })
      assert.deepEqual([r.status, r.govde], [409, { code: 'ONAYSIZ' }], y)
    }
    assert.equal(modelIstekleri.length, 0, 'the model must not be called for an unapproved note')
    assert.equal(tablo('ulke_hasta_ozetleri').length, 0)
    // The database's own rule (the trigger of migration 137), reached past every route:
    const { ulkeTablosu } = await import('../uygulama/tablolar')
    const sb = vt.createClient() as unknown as Parameters<typeof ulkeTablosu>[0]
    const { error } = await ulkeTablosu(sb, 'ulke_hasta_ozetleri').insert({ doctor_id: A, patient_id: H1, note_id: n, dil: paket.uygulama!.diller[0], ozet_encrypted: sifrele('x'), paylasildi_at: simdiIso() })
    assert.equal((error as { code?: string } | null)?.code, '23514')
    // … and a summary of ANOTHER patient's note is refused the same way.
    const n2 = notEkle(A, H2, true)
    const { error: e2 } = await ulkeTablosu(sb, 'ulke_hasta_ozetleri').insert({ doctor_id: A, patient_id: H1, note_id: n2, dil: paket.uygulama!.diller[0], ozet_encrypted: sifrele('x'), paylasildi_at: null })
    assert.equal((e2 as { code?: string } | null)?.code, '23514')
    assert.equal(tablo('ulke_hasta_ozetleri').length, 0)
  })

  it('the model writes a DRAFT from the approved note only, in the patient\'s language; nothing is shared until the doctor shares it', async () => {
    if (!ACIK) return
    const klinik = (await import('@/countries/active/klinik')).AKTIF_KLINIK!
    const { hastaIcinBicim } = await import('../arayuz/dilSecimi')
    const n = notEkle(A, H1, true)
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const uret = await iste(rota.ozet, 'POST', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n } })
    assert.equal(uret.status, 200, JSON.stringify(uret.govde))
    const d = paket.uygulama!.diller[0]
    const bicim = hastaIcinBicim(paket.uygulama!.dilGruplari, hastaDili, { dil: d, notDili: d })
    assert.deepEqual([uret.govde.ozet.paylasildi, uret.govde.ozet.dil, uret.govde.ozet.metin], [false, bicim, `${OZET_ISARETI} one two three.`])
    // WHAT WENT TO THE MODEL: the pack's own instruction for that form, and the approved note. Nothing else about the patient.
    assert.equal(modelIstekleri.length, 1)
    assert.equal(modelIstekleri[0].system, klinik.hastaOzetiTalimati!(bicim))
    assert.ok(modelIstekleri[0].user.includes(`${NOT_METNI} S`) && modelIstekleri[0].user.includes(`${NOT_METNI} P`))
    for (const yasak of [AD[H1], TEL, KIMLIK, H1, A, n, DOKUM, '1990-05-05']) assert.ok(!`${modelIstekleri[0].system}\n${modelIstekleri[0].user}`.includes(yasak), `the model was sent "${yasak}"`)
    // stored encrypted, as a draft
    const satir = tablo('ulke_hasta_ozetleri')[0]
    assert.deepEqual([satir.paylasildi_at, satir.patient_id, satir.note_id, satir.doctor_id, satir.ulke], [null, H1, n, A, BU])
    assert.ok(!String(satir.ozet_encrypted).includes(OZET_ISARETI), 'the summary is stored in the clear')
    // NOT SHARED: the patient sees nothing.
    assert.deepEqual((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).govde.ozetler, [])
    assert.deepEqual(tablo('ulke_portal_kayitlari').filter((k) => k.olay === 'paylasim'), [])
  })

  it('edit → share → the patient sees it; a shared summary is not changed; take it back → gone at once; all of it on the doctor\'s record', async () => {
    if (!ACIK) return
    const n = notEkle(A, H1, true)
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const portal = async () => (await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).govde.ozetler as { gun: string; metin: string }[]
    await iste(rota.ozet, 'POST', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n } })
    // the doctor edits the draft
    const duzen = await iste(rota.ozet, 'PATCH', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, metin: '  QA-EDITED-BY-THE-DOCTOR  ' } })
    assert.deepEqual([duzen.status, duzen.govde.ozet.metin, duzen.govde.ozet.paylasildi], [200, 'QA-EDITED-BY-THE-DOCTOR', false])
    assert.deepEqual(await portal(), [])
    // an empty text is refused; so is anything that is not a literal true or false
    assert.equal((await iste(rota.ozet, 'PATCH', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, metin: '   ' } })).status, 400)
    for (const kotu of ['true', 1, null, undefined, 'yes']) assert.equal((await iste(rota.ozet, 'PUT', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, paylas: kotu } })).status, 400, String(kotu))
    assert.deepEqual(await portal(), [])
    // SHARE
    const paylas = await iste(rota.ozet, 'PUT', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, paylas: true } })
    assert.deepEqual([paylas.status, paylas.govde.ozet.paylasildi], [200, true])
    const { yerelAn } = await import('../uygulama/zaman')
    assert.deepEqual(await portal(), [{ id: tablo('ulke_hasta_ozetleri')[0].id, gun: yerelAn('2026-10-05T06:00:00.000Z', paket.saatDilimi).gun, metin: 'QA-EDITED-BY-THE-DOCTOR' }])
    // sharing twice is recorded once
    await iste(rota.ozet, 'PUT', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, paylas: true } })
    // A SHARED summary is not changed under the patient's eyes: no edit, no rewrite, no model call.
    const modelOnce = modelIstekleri.length
    for (const [y, govde] of [['PATCH', { notId: n, metin: 'QA-CHANGED-WHILE-SHARED' }], ['POST', { notId: n }]] as const) {
      const r = await iste(rota.ozet, y, '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde })
      assert.deepEqual([r.status, r.govde], [409, { code: 'PAYLASILDI' }], y)
    }
    assert.equal(modelIstekleri.length, modelOnce)
    assert.equal((await portal())[0].metin, 'QA-EDITED-BY-THE-DOCTOR')
    // TAKE IT BACK: the very next read of the portal does not have it.
    const geri = await iste(rota.ozet, 'PUT', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, paylas: false } })
    assert.deepEqual([geri.status, geri.govde.ozet.paylasildi], [200, false])
    assert.deepEqual(await portal(), [])
    // now it can be edited again, and shared again
    assert.equal((await iste(rota.ozet, 'PATCH', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, metin: 'QA-SECOND-VERSION' } })).status, 200)
    await iste(rota.ozet, 'PUT', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, paylas: true } })
    assert.equal((await portal())[0].metin, 'QA-SECOND-VERSION')
    // THE RECORD the doctor reads: link, sign-in, share, unshare, share — each once, in order, with the summary named.
    const d = await iste(rota.hekim, 'GET', `/api/ulke/hasta-portali?hasta=${H1}`, { jeton: 'jeton-a' })
    const olaylar = [...(d.govde.kayitlar as { olay: string; ozetId: string | null }[])]
    assert.deepEqual(olaylar.map((k) => k.olay).sort(), ['erisim', 'geri-alma', 'giris', 'paylasim', 'paylasim'])
    assert.ok(olaylar.filter((k) => k.olay !== 'erisim' && k.olay !== 'giris').every((k) => k.ozetId === tablo('ulke_hasta_ozetleri')[0].id))
  })

  it('sharing is all or nothing with its record; a model answer that is not a summary shares and stores nothing', async () => {
    if (!ACIK) return
    const n = notEkle(A, H1, true)
    await iste(rota.ozet, 'PATCH', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, metin: 'QA text' } })
    // the record cannot be written → the summary is NOT shared
    vt.boz.yaz.add('ulke_portal_kayitlari')
    assert.equal((await iste(rota.ozet, 'PUT', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n, paylas: true } })).status, 500)
    vt.boz.yaz.clear()
    assert.equal(tablo('ulke_hasta_ozetleri')[0].paylasildi_at, null)
    // a model answer without a summary, and one that is not JSON at all
    const n2 = notEkle(A, H2, true)
    for (const kotu of [JSON.stringify({ note: 'x' }), 'not json at all', JSON.stringify({ summary: '   ' })]) {
      modelCevabi = kotu
      const r = await iste(rota.ozet, 'POST', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n2 } })
      assert.deepEqual([r.status, r.govde], [502, { code: 'OZET_YAZILAMADI' }], kotu)
    }
    assert.equal(tablo('ulke_hasta_ozetleri').filter((z) => z.note_id === n2).length, 0)
  })
})

describe('patient portal — E. the patient asks for an appointment', () => {
  const sure = () => paket.uygulama!.randevu!.varsayilan.sureDk
  /** A working day among the days a patient may choose, and a time inside the pack's own working hours. */
  async function uygunGun(): Promise<{ gun: string; saat: string; gunler: string[] }> {
    const { haftaGunu } = await import('../uygulama/zaman')
    const { istekGunleri } = await import('./istek')
    const gunler = istekGunleri(Date.now(), paket.saatDilimi)
    const v = paket.uygulama!.randevu!.varsayilan
    return { gun: gunler.find((g) => v.gunler.includes(haftaGunu(g))) as string, saat: v.baslangic, gunler }
  }

  it('a request names days the patient may choose, holds no time, and there is one waiting request per patient', async () => {
    if (!RANDEVU) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const { gunler } = await uygunGun()
    const sayfa = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })
    assert.deepEqual([sayfa.govde.istek.gunler, sayfa.govde.istek.son], [gunler, null])
    assert.equal(gunler.length, S.ISTEK_GUN_UFKU)
    const { yerelAn, gunEkle } = await import('../uygulama/zaman')
    assert.equal(gunler[0], gunEkle(yerelAn(Date.now(), paket.saatDilimi).gun, 1), 'the first day is the country\'s tomorrow, whatever the server\'s zone is')
    // what cannot be asked
    for (const kotu of [[], [yerelAn(Date.now(), paket.saatDilimi).gun], ['2026-01-01'], [gunEkle(gunler[gunler.length - 1], 1)], gunler.slice(0, S.ISTEK_GUN_AZAMI + 1), ['not-a-day'], 'x', null]) {
      const r = await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g.cerez, portal: true, govde: { gunler: kotu } })
      assert.deepEqual([r.status, r.govde], [400, { code: 'GECERSIZ', alan: 'gunler' }], JSON.stringify(kotu))
    }
    assert.equal(tablo('ulke_randevu_istekleri').length, 0)
    // a request — for the session's own doctor and patient, whatever the body says
    const iki = [gunler[3], gunler[1]]
    const r = await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g.cerez, portal: true, govde: { gunler: iki, neden: '  QA-PATIENTS-REASON  ', hastaId: H3, doktorId: B, doctor_id: B, patient_id: H3, ulke: 'zz', durum: 'kabul' } })
    assert.deepEqual([r.status, r.govde.istek.durum, r.govde.istek.gunler], [200, 'bekliyor', [...iki].sort()])
    const s = tablo('ulke_randevu_istekleri')[0]
    assert.deepEqual([s.ulke, s.doctor_id, s.patient_id, s.durum, s.randevu_id ?? null], [BU, A, H1, 'bekliyor', null])
    assert.ok(!String(s.neden_encrypted).includes('QA-PATIENTS-REASON'), 'the reason is stored in the clear')
    assert.equal(tablo('ulke_randevulari').length, 0, 'a request books nothing')
    // one waiting request
    const ikinci = await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g.cerez, portal: true, govde: { gunler: [gunler[0]] } })
    assert.deepEqual([ikinci.status, ikinci.govde], [409, { code: 'BEKLEYEN_VAR' }])
    // the doctor sees it, with the patient's name and reason
    const liste = await iste(rota.istekler, 'GET', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-a' })
    assert.deepEqual(liste.govde.istekler.map((x: Satir) => [x.hastaId, x.hastaAdi, x.gunler, x.neden]), [[H1, AD[H1], [...iki].sort(), 'QA-PATIENTS-REASON']])
    assert.deepEqual((await iste(rota.istekler, 'GET', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-b' })).govde.istekler, [])
  })

  it('the doctor accepts by choosing the slot: no double booking, working hours respected, the patient sees the outcome', async () => {
    if (!RANDEVU) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const { gun, saat, gunler } = await uygunGun()
    await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g.cerez, portal: true, govde: { gunler: [gun], neden: 'QA-PATIENTS-REASON' } })
    const id = tablo('ulke_randevu_istekleri')[0].id as string
    // another patient already holds that time
    const { yerelUtc, saatCoz } = await import('../uygulama/zaman')
    const bas = yerelUtc(gun, saatCoz(saat) as number, paket.saatDilimi)
    tablo('ulke_randevulari').push({ id: '70000000-0000-4000-8000-000000000009', ulke: BU, doctor_id: A, patient_id: H2, baslangic: new Date(bas).toISOString(), bitis: new Date(bas + sure() * 60_000).toISOString(), neden_encrypted: null, durum: 'planlandi', mesai_disi: false, session_id: null })
    const dolu = await iste(rota.istekler, 'PATCH', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-a', govde: { id, gun, saat, sureDk: sure(), yineDe: true } })
    assert.deepEqual([dolu.status, dolu.govde], [409, { code: 'DOLU' }], 'a taken time is never bookable, "book anyway" or not')
    // THE DATABASE'S OWN REFUSAL, when the application's check is beaten by a request at the same moment:
    const { ulkeIslevi } = await import('../uygulama/tablolar')
    const sb = vt.createClient() as unknown as Parameters<typeof ulkeIslevi>[0]
    const { error } = await ulkeIslevi(sb, 'ulke_randevu_istegi_kabul', { p_doctor_id: A, p_istek_id: id, p_baslangic: new Date(bas).toISOString(), p_bitis: new Date(bas + sure() * 60_000).toISOString(), p_neden_encrypted: null, p_mesai_disi: false, p_simdi: simdiIso() })
    assert.equal((error as { code?: string } | null)?.code, '23P01')
    assert.deepEqual([tablo('ulke_randevu_istekleri')[0].durum, tablo('ulke_randevulari').length], ['bekliyor', 1], 'after a refused acceptance the request is still waiting and no appointment was written')
    // outside the working hours: nothing is written unless the doctor says "book anyway"
    const gece = await iste(rota.istekler, 'PATCH', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-a', govde: { id, gun, saat: '03:00', sureDk: sure() } })
    assert.deepEqual([gece.status, gece.govde], [422, { code: 'MESAI_DISI' }])
    assert.equal(tablo('ulke_randevulari').length, 1)
    // a free time right after the taken one
    const { saatYazDk } = await import('../uygulama/zaman')
    const bosSaat = saatYazDk((saatCoz(saat) as number) + sure())
    const kabul = await iste(rota.istekler, 'PATCH', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-a', govde: { id, gun, saat: bosSaat, sureDk: sure() } })
    assert.equal(kabul.status, 200, JSON.stringify(kabul.govde))
    const r = tablo('ulke_randevulari').find((x) => x.id === kabul.govde.randevuId) as Satir
    assert.deepEqual([r.ulke, r.doctor_id, r.patient_id, r.durum], [BU, A, H1, 'planlandi'], 'the appointment is the request\'s own patient\'s')
    assert.deepEqual([tablo('ulke_randevu_istekleri')[0].durum, tablo('ulke_randevu_istekleri')[0].randevu_id], ['kabul', r.id])
    // answered once: a second acceptance and a late refusal change nothing
    const once = JSON.stringify(vt.tablolar)
    for (const govde of [{ id, gun, saat: saatYazDk((saatCoz(saat) as number) + 2 * sure()), sureDk: sure() }, { id, red: true }]) {
      const tekrar = await iste(rota.istekler, 'PATCH', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-a', govde })
      assert.deepEqual([tekrar.status, tekrar.govde], [409, { code: 'CEVAPLANDI' }])
    }
    assert.equal(JSON.stringify(vt.tablolar), once)
    // THE PATIENT SEES THE OUTCOME: accepted, with the day and time, and the appointment among the upcoming ones.
    const sayfa = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })
    assert.deepEqual(sayfa.govde.istek.son, { durum: 'kabul', gunler: [gun], olusturuldu: tablo('ulke_randevu_istekleri')[0].created_at, randevu: { gun, saat: bosSaat } })
    assert.deepEqual(sayfa.govde.randevular, [{ gun, saat: bosSaat, sureDk: sure() }])
    assert.ok(!JSON.stringify(sayfa.govde).includes(AD[H2]), 'the other patient\'s appointment leaked')
    // no longer on the doctor's list of waiting requests; the patient may ask again
    assert.deepEqual((await iste(rota.istekler, 'GET', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-a' })).govde.istekler, [])
    assert.equal((await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g.cerez, portal: true, govde: { gunler: [gunler[5]] } })).status, 200)
  })

  it('accepting is all or nothing; declining shows the patient "declined" and books nothing', async () => {
    if (!RANDEVU) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const { gun, saat } = await uygunGun()
    await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g.cerez, portal: true, govde: { gunler: [gun] } })
    const id = tablo('ulke_randevu_istekleri')[0].id as string
    // the request cannot be marked → the appointment is NOT booked
    vt.boz.yaz.add('ulke_randevu_istekleri')
    assert.equal((await iste(rota.istekler, 'PATCH', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-a', govde: { id, gun, saat, sureDk: sure() } })).status, 500)
    vt.boz.yaz.clear()
    assert.deepEqual([tablo('ulke_randevulari').length, tablo('ulke_randevu_istekleri')[0].durum], [0, 'bekliyor'])
    const red = await iste(rota.istekler, 'PATCH', '/api/ulke/hasta-portali/istekler', { jeton: 'jeton-a', govde: { id, red: true } })
    assert.deepEqual([red.status, red.govde], [200, { ok: true }])
    const sayfa = await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })
    assert.deepEqual([sayfa.govde.istek.son.durum, sayfa.govde.istek.son.randevu, sayfa.govde.randevular], ['red', null, []])
    assert.equal(tablo('ulke_randevulari').length, 0)
  })
})

describe('patient portal — F. privacy defaults', () => {
  it('every answer of a patient route is private, never stored and never indexed — the refusals too', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const cevaplar = [
      g.res,
      (await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).res,
      (await iste(rota.portal, 'GET', '/api/ulke/portal')).res,
      (await iste(rota.pGiris, 'POST', '/api/ulke/portal/giris', { portal: true, govde: { token: 'x', pin: '1' } })).res,
      (await iste(rota.pGiris, 'POST', '/api/ulke/portal/giris', { portal: true, govde: { token: pinMod.anahtarUret(), pin: '123456' } })).res,
      (await iste(rota.istek, 'POST', '/api/ulke/portal/randevu-istegi', { cerez: g.cerez, portal: true, govde: { gunler: [] } })).res,
      (await iste(rota.cikis, 'POST', '/api/ulke/portal/cikis', { cerez: g.cerez, portal: true })).res,
    ]
    for (const [i, res] of cevaplar.entries()) {
      assert.equal(res.headers.get('cache-control'), 'private, no-store, max-age=0', `answer ${i}`)
      assert.match(res.headers.get('x-robots-tag') ?? '', /noindex/, `answer ${i}`)
      assert.equal(res.headers.get('referrer-policy'), 'no-referrer', `answer ${i}`)
    }
  })

  it('the session cookie: HttpOnly, never sent from another site, sent to the portal\'s own routes only, https only away from this machine', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const c = g.res.headers.get('set-cookie') ?? ''
    assert.match(c, new RegExp(`^${S.PORTAL_CEREZI}=[A-Za-z0-9_-]{43};`))
    assert.match(c, /;\s*HttpOnly/i); assert.match(c, /;\s*SameSite=strict/i); assert.match(c, /;\s*Secure/i)
    assert.match(c, new RegExp(`;\\s*Path=${(paket.yolOnEki ?? '').replace('/', '\\/')}\\/api\\/ulke\\/portal(;|$)`), 'the cookie must be scoped to the portal\'s own routes, under the country\'s path')
    assert.ok(!`${paket.yolOnEki ?? ''}/api/ulke/hasta-portali`.startsWith(`${giris.portalCerezYolu()}/`), 'the doctor\'s routes must lie outside the cookie\'s path')
    // the key in the cookie is not what the database holds
    assert.equal(tablo('ulke_portal_oturumlari')[0].oturum_hash, pinMod.anahtarHash(g.cerez))
    assert.ok(!JSON.stringify(vt.tablolar).includes(g.cerez))
    // a walk-through on this machine is plain http: no Secure there, and only there
    ilerle(3000)
    const yerel = await iste(rota.pGiris, 'POST', '/api/ulke/portal/giris', { portal: true, host: '127.0.0.1:3111', govde: { token: l.token, pin: l.pin } })
    assert.doesNotMatch(yerel.res.headers.get('set-cookie') ?? '', /;\s*Secure/i)
    // SIGN OUT closes the session in the database and removes the cookie.
    const cik = await iste(rota.cikis, 'POST', '/api/ulke/portal/cikis', { cerez: g.cerez, portal: true })
    assert.deepEqual([cik.status, cik.govde], [200, { ok: true }])
    assert.match(cik.res.headers.get('set-cookie') ?? '', new RegExp(`^${S.PORTAL_CEREZI}=;.*Max-Age=0`, 'i'))
    assert.equal((await iste(rota.portal, 'GET', '/api/ulke/portal', { cerez: g.cerez })).status, 401)
  })

  it('a request that changes something needs the portal\'s own header and JSON: a form posted from another page is refused', async () => {
    if (!ACIK) return
    const l = await erisimVer('jeton-a', H1)
    const g = await girisYap(l.token, l.pin)
    const once = JSON.stringify(vt.tablolar)
    for (const [mod, yol, govde] of [[rota.pGiris, '/api/ulke/portal/giris', { token: l.token, pin: l.pin }], [rota.cikis, '/api/ulke/portal/cikis', {}], ...(RANDEVU ? [[rota.istek, '/api/ulke/portal/randevu-istegi', { gunler: ['2026-10-13'] }] as const] : [])] as const) {
      const r = await iste(mod, 'POST', yol, { cerez: g.cerez, govde })
      assert.deepEqual([r.status, r.govde], [400, { code: 'GECERSIZ' }], yol)
    }
    assert.equal(JSON.stringify(vt.tablolar), once)
  })

  it('the portal page and the patient routes are not indexed and not cached: the route files say so', () => {
    if (!ACIK) return
    const sayfa = join(KOK, 'app/portal/page.ulke.tsx')
    if (existsSync(sayfa)) {
      const k = readFileSync(sayfa, 'utf8')
      assert.match(k, /export const dynamic = 'force-dynamic'/)
      assert.match(k, /robots: \{ index: false, follow: false/)
    }
    for (const f of ['giris', '', 'cikis', 'randevu-istegi']) {
      const k = readFileSync(join(KOK, 'app/api/ulke/portal', f, 'route.ulke.ts'), 'utf8')
      assert.match(k, /export const dynamic = 'force-dynamic'/, f)
      assert.match(k, /portalSinirinda\(/, `${f}: every patient route runs inside the portal's boundary`)
      assert.doesNotMatch(k.replace(/\/\*[\s\S]*?\*\//g, ''), /ulkeOturum|authorization/i, `${f}: a patient route must not read a doctor's session`)
    }
    // … and no doctor route reads the portal cookie.
    for (const f of ['route.ulke.ts', 'ozet/route.ulke.ts', 'istekler/route.ulke.ts']) {
      const k = readFileSync(join(KOK, 'app/api/ulke/hasta-portali', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      assert.doesNotMatch(k, /portalOturum|cookies|PORTAL_CEREZI/, `${f}: a doctor route must not read a portal session`)
      assert.match(k, /ulkeOturum\(req\)/)
    }
    assert.doesNotMatch(readFileSync(join(KOK, 'lib/ulke/sunucuOturum.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), /cookie/i, 'the doctor\'s session helper must not read a cookie')
  })
})

describe('patient portal — G. usage', () => {
  it('a summary the model wrote is counted for the account: once, with the tokens the provider reported, and no patient', async () => {
    if (!ACIK) return
    const n = notEkle(A, H1, true)
    await iste(rota.ozet, 'POST', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n } })
    const { ulkeGunu } = await import('../uygulama/gun')
    assert.deepEqual(tablo('ulke_kullanim_olcumu'), [{ ulke: BU, doctor_id: A, gun: ulkeGunu(new Date(), paket.saatDilimi), gorev: 'hasta-ozeti', adet: 1, saniye: 0, giris_token: 640, cikis_token: 130 }])
    // a failed count never fails the summary
    vt.boz.yaz.add('ulke_kullanim_olcumu')
    const n2 = notEkle(A, H2, true)
    assert.equal((await iste(rota.ozet, 'POST', '/api/ulke/hasta-portali/ozet', { jeton: 'jeton-a', govde: { notId: n2 } })).status, 200)
    vt.boz.yaz.clear()
    assert.equal(tablo('ulke_kullanim_olcumu')[0].adet, 1)
  })
})
