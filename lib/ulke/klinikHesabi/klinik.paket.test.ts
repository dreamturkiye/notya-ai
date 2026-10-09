/**
 * NOTYA-ULKE-KLINIK-01 — CLINIC ACCOUNTS AND STAFF ROLES, for whatever pack is active. Runs ONCE PER PACK.
 *
 * THE QUESTION THIS FILE ANSWERS, FOR EVERY ROUTE: who may, and who may not.
 *   positions      owner · administrator · doctor · allied professional · front desk · an account in no clinic
 *   situations     with the grant · without one · only another capability (or another patient) · withdrawn · cover
 *                  that has ended or not begun · the member removed · the member gone by themselves · the doctor gone
 *                  · the position changed · a grant row that exists while the member is in ANOTHER CLINIC (forged
 *                  past the database's keys, to prove the server's own check) · ANOTHER COUNTRY · another doctor's
 *                  patient · a capability the pack has not switched on · a role that may not hold it · the record
 *                  that cannot be written · no session
 * and, for every answer a front-desk member can get, WHICH KEYS it carries — asserted on the answer itself, never on
 * a screen.
 *
 * The kit's rules run with SETTINGS OF NO COUNTRY (written here, put on the active pack for the length of this file)
 * for every pack that brings the signed-in application with appointments and a doctor's role. A pack without them
 * is held to the one rule that needs nothing: with the feature off, every route answers "not found".
 *
 * Real handlers and real library code. The database and sign-in are stand-ins inside this process (the stand-in
 * holds migration 145's keys, triggers and functions statement by statement); any network address fails the test.
 * Synthetic data only. The mutation checks that go with this file: scripts/ulke-klinik-mutasyon.mjs.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'
// The server clock is NOT the country's: every day must come from the account's time zone.
process.env.TZ = 'America/Los_Angeles'

import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani, type Satir } from '@/lib/ulke/testing/sahteVeritabani'
import type { KlinikHesabiAyarlari, KlinikYetkiTuru } from '../tipler'

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
type Cevap = { status: number; govde: any } // eslint-disable-line @typescript-eslint/no-explicit-any
let paket: Paket
let BU = ''
let YABANCI = ''
/** The kit's rules can run: the signed-in application, appointments, a doctor's role. */
let KIT = false
let PORTAL = false
let FORM = false
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let Z: typeof import('../uygulama/zaman')
let D: typeof import('../davet')
const R: Record<string, Mod> = {}
let HEKIM_ROLU = ''
/** Allied roles of the pack: the first is on the synthetic list of roles that may receive a share, the second is not. */
let MUTTEFIK_ROLU = ''
let MUTTEFIK_ROLU_LISTEDE_YOK = ''
let BUGUN = ''
let SURE = 30
let asilOzellik: true | undefined
let asilAyar: KlinikHesabiAyarlari | undefined

const hid = (x: string) => `10000000-0000-4000-8000-0000000000${x}`
const SA = hid('a1'), YO = hid('a2'), HE = hid('a3'), H2 = hid('a4'), MU = hid('a5'), OB = hid('a6'), MU2 = hid('a7'), YO2 = hid('a8')
const S2 = hid('b1'), OB2 = hid('b2'), H3 = hid('b3'), BO = hid('c1')
const AD: Record<string, string> = { [SA]: 'QA Owner', [YO]: 'QA Admin', [HE]: 'QA Doctor One', [H2]: 'QA Doctor Two', [MU]: 'QA Allied', [OB]: 'QA Front Desk', [MU2]: 'QA Allied Unlisted', [YO2]: 'QA Admin Two', [S2]: 'QA Other Owner', [OB2]: 'QA Other Front Desk', [H3]: 'QA Other Doctor', [BO]: 'QA No Clinic' }
const JETON: Record<string, string> = { [SA]: 'j-sa', [YO]: 'j-yo', [HE]: 'j-he', [H2]: 'j-h2', [MU]: 'j-mu', [OB]: 'j-ob', [MU2]: 'j-mu2', [YO2]: 'j-yo2', [S2]: 'j-s2', [OB2]: 'j-ob2', [H3]: 'j-h3', [BO]: 'j-bo' }
const KL1 = '20000000-0000-4000-8000-000000000001', KL2 = '20000000-0000-4000-8000-000000000002'
const pid = (n: number) => `30000000-0000-4000-8000-00000000000${n}`
const P1 = pid(1), P2 = pid(2), P3 = pid(3), P4 = pid(4), P5 = pid(5)
const HASTA_ADI: Record<string, string> = { [P1]: 'QA Patient Alfa', [P2]: 'QA Patient Beta', [P3]: 'QA Patient Gamma', [P4]: 'QA Patient Delta', [P5]: 'QA Patient Epsilon' }
const HASTA_SAHIBI: Record<string, string> = { [P1]: HE, [P2]: HE, [P3]: H2, [P4]: H3, [P5]: SA }
const R1 = '60000000-0000-4000-8000-000000000001', R3 = '60000000-0000-4000-8000-000000000003'
const S1 = '40000000-0000-4000-8000-000000000001', S1T = '40000000-0000-4000-8000-000000000002'
const N1 = '50000000-0000-4000-8000-000000000001', N1T = '50000000-0000-4000-8000-000000000002'
const YOK = '77777777-7777-4777-8777-777777777777'
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()
const GUN_MS = 86_400_000

// What must NEVER reach a front-desk member, an owner or an administrator — each planted in the doctor's data.
const GIZLI = { not: 'QA-GIZLI-ONAYLI-NOT', taslak: 'QA-GIZLI-TASLAK-NOT', dokum: 'QA-GIZLI-DOKUM', neden: 'QA-GIZLI-RANDEVU-NEDENI', kimlik: '99887766554433', telefon: '+000 55 555 01 01' }
const KLINIK_ISARETI = /QA-GIZLI|99887766554433/

const tablo = (ad: string) => vt.tablo(ad)
const simdiIso = () => new Date().toISOString()
const klinigi = (hesap: string) => ([S2, OB2, H3].includes(hesap) ? KL2 : KL1)

function hastaEkle(id: string, ulke = BU) {
  const doktor = HASTA_SAHIBI[id]
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: HASTA_ADI[id] })), dob_encrypted: sifrele('1990-05-05'), gender_encrypted: sifrele('female'), phone_encrypted: sifrele(GIZLI.telefon), is_active: true, created_at: simdiIso() })
  tablo('hasta_ulke_bilgisi').push({ patient_id: id, ulke, doctor_id: doktor, dil: paket.uygulama?.hastaDilleri[0] ?? '', ota_ismi_encrypted: sifrele('QA Second'), ulusal_kimlik_encrypted: sifrele(GIZLI.kimlik) })
}
const uye = (hesap: string, konum: string, klinik = klinigi(hesap), ulke = BU) => tablo('ulke_klinik_uyeleri').push({ id: `u-${hesap}-${ulke}`, ulke, klinik_id: klinik, doctor_id: hesap, konum, created_at: simdiIso(), updated_at: simdiIso() })
const rolYaz = (hesap: string, rol: string | null) => {
  vt.tablolar.hekim_rolu = tablo('hekim_rolu').filter((x) => x.doctor_id !== hesap)
  if (rol) tablo('hekim_rolu').push({ ulke: BU, doctor_id: hesap, rol })
}
let ySayac = 0
/** A grant written straight into the table, as the database function would have written it. */
function yetki(veren: string, alan: string, tur: KlinikYetkiTuru, ek: Satir = {}): string {
  const id = `70000000-0000-4000-8000-${String(++ySayac).padStart(12, '0')}`
  const donem = tur === 'vekalet' ? { baslangic: new Date(Date.now() - GUN_MS).toISOString(), bitis: new Date(Date.now() + 3 * GUN_MS).toISOString() } : { baslangic: null, bitis: null }
  tablo('ulke_klinik_yetkileri').push({ id, ulke: BU, klinik_id: KL1, doctor_id: veren, alan_id: alan, tur, patient_id: null, ...donem, kaydeden_id: veren, iptal_at: null, iptal_eden_id: null, created_at: simdiIso(), ...ek })
  return id
}
const yetkiler = () => tablo('ulke_klinik_yetkileri')
const kayitlar = () => tablo('ulke_klinik_erisim_kayitlari')
const kullanim = () => kayitlar().filter((k) => k.olay === 'okuma' || k.olay === 'yazma')

const SENTETIK = (): KlinikHesabiAyarlari => ({
  yetkiTurleri: ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet'], sahipHekimAdinaVerebilir: false,
  paylasimRolleri: MUTTEFIK_ROLU ? [MUTTEFIK_ROLU] : [], davetGecerlilikGun: 7, vekaletAzamiGun: 14, kayitSaklama: null, inceleme: { makineYazimi: true, hukukcu: null },
})
function ayarla(ek: Partial<KlinikHesabiAyarlari> = {}) {
  paket.ozellikler.klinikHesaplari = true
  if (paket.uygulama) paket.uygulama.klinikHesaplari = { ...SENTETIK(), ...ek }
}
function ozelligiKapat() { delete paket.ozellikler.klinikHesaplari }

function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  const d = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  for (const [id, jeton] of Object.entries(JETON)) {
    vt.hesaplar[jeton] = { id, email: `${jeton}@notya.test`, app_metadata: { country: BU } }
    tablo('ulke_hesaplari').push({ id, full_name: AD[id], ulke: BU, ui_language: d })
    tablo('hekim_dil_tercihleri').push({ ulke: BU, doctor_id: id, not_dili: d, soruldu_at: 'x' })
  }
  // A session stamped with ANOTHER country, for the same account id as the front-desk member.
  vt.hesaplar['j-yabanci'] = { id: OB, email: 'j-yabanci@notya.test', app_metadata: { country: YABANCI } }
  for (const h of [SA, YO, YO2, HE, H2, S2, H3, BO]) rolYaz(h, HEKIM_ROLU)
  rolYaz(MU, MUTTEFIK_ROLU || null); rolYaz(MU2, MUTTEFIK_ROLU_LISTEDE_YOK || null)
  tablo('ulke_klinikler').push({ id: KL1, ulke: BU, doctor_id: SA, ad: 'QA Clinic One', created_at: simdiIso(), updated_at: simdiIso() }, { id: KL2, ulke: BU, doctor_id: S2, ad: 'QA Clinic Two', created_at: simdiIso(), updated_at: simdiIso() })
  uye(SA, 'sahip'); uye(YO, 'yonetici'); uye(YO2, 'yonetici'); uye(HE, 'hekim'); uye(H2, 'hekim'); uye(MU, 'muttefik'); uye(MU2, 'muttefik'); uye(OB, 'on-buro')
  uye(S2, 'sahip'); uye(OB2, 'on-buro'); uye(H3, 'hekim')
  for (const p of [P1, P2, P3, P4, P5]) hastaEkle(p)
  // The doctor's own data, each piece carrying a marker: an appointment with a reason, an approved note and a draft
  // (each with its transcript).
  const gun2 = Z.gunEkle(BUGUN, 1)
  const an = (saat: number) => new Date(Z.yerelUtc(gun2, saat * 60, paket.saatDilimi)).toISOString()
  tablo('ulke_randevulari').push({ id: R1, ulke: BU, doctor_id: HE, patient_id: P1, baslangic: an(10), bitis: an(10.5), neden_encrypted: sifrele(GIZLI.neden), durum: 'planlandi', mesai_disi: false, session_id: null, created_at: simdiIso() })
  tablo('ulke_randevulari').push({ id: R3, ulke: BU, doctor_id: H2, patient_id: P3, baslangic: an(10), bitis: an(10.5), neden_encrypted: sifrele(GIZLI.neden), durum: 'planlandi', mesai_disi: false, session_id: null, created_at: simdiIso() })
  const notEkle = (s: string, n: string, onayli: boolean, metin: string) => {
    tablo('ulke_muayeneler').push({ id: s, ulke: BU, doctor_id: HE, patient_id: P1, started_at: '2026-10-05T06:00:00.000Z', created_at: '2026-10-05T06:00:00.000Z', specialty: HEKIM_ROLU, transcript_cleaned: GIZLI.dokum })
    tablo('muayene_dil_kaydi').push({ session_id: s, ulke: BU, doctor_id: HE, patient_id: P1, not_dili: d, sablon: HEKIM_ROLU })
    tablo('ulke_notlar').push({ id: n, ulke: BU, doctor_id: HE, session_id: s, approved_at: onayli ? '2026-10-05T07:00:00.000Z' : null, approved_by: onayli ? HE : null, content_subjektif: `${metin} S`, content_objektif: `${metin} O`, content_degerlendirme: `${metin} A`, content_plan: `${metin} P`, created_at: '2026-10-05T06:30:00.000Z' })
    tablo('not_dil_kaydi').push({ note_id: n, ulke: BU, doctor_id: HE, patient_id: P1, not_dili: d, ikinci_dil: null, alanlar: null, ikinci_alanlar: null })
  }
  notEkle(S1, N1, true, GIZLI.not); notEkle(S1T, N1T, false, GIZLI.taslak)
}

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  YABANCI = ['tr', 'uz', 'zz'].filter((k) => k !== BU)[0]
  asilOzellik = paket.ozellikler.klinikHesaplari
  asilAyar = paket.uygulama?.klinikHesaplari
  NextRequest = (await import('next/server')).NextRequest
  sifrele = (await import('@/lib/security/encryption')).encrypt
  Z = await import('../uygulama/zaman')
  D = await import('../davet')
  for (const ad of ['', '/davet', '/katil', '/uye', '/yetki', '/kayit', '/takvim', '/on-buro', '/paylasilan']) R[`/api/ulke/klinik${ad}`] = (await import(`../../../app/api/ulke/klinik${ad}/route.ulke`)) as unknown as Mod
  for (const ad of ['hasta', 'hastalar', 'not', 'muayene', 'randevu', 'randevular', 'hasta-formu', 'hasta-portali', 'arac-kaydi', 'bugun']) R[`/api/ulke/${ad}`] = (await import(`../../../app/api/ulke/${ad}/route.ulke`)) as unknown as Mod
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
  BUGUN = Z.yerelAn(BASLANGIC_ANI, paket.saatDilimi).gun
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  const roller = arayuz?.roller ?? []
  HEKIM_ROLU = roller.find((r) => r.taraf === 'doktor' || r.taraf === 'klinik-hekim')?.anahtar ?? ''
  const muttefik = roller.filter((r) => r.taraf === 'klinik-muttefik').map((r) => r.anahtar)
  MUTTEFIK_ROLU = muttefik[0] ?? ''
  MUTTEFIK_ROLU_LISTEDE_YOK = muttefik[1] ?? ''
  SURE = paket.uygulama?.randevu?.sureSecenekleri.find((s) => s === 30) ?? paket.uygulama?.randevu?.sureSecenekleri[0] ?? 30
  KIT = paket.ozellikler.cekirdekMuayene === true && paket.ozellikler.randevu === true && Boolean(HEKIM_ROLU) && Boolean(paket.uygulama)
  PORTAL = KIT && paket.ozellikler.hastaPortali === true
  FORM = PORTAL && Boolean((await import('../intake/icerik')).aktifFormIcerigi())
})
after(() => {
  if (asilOzellik) paket.ozellikler.klinikHesaplari = true; else delete paket.ozellikler.klinikHesaplari
  if (paket.uygulama) { if (asilAyar) paket.uygulama.klinikHesaplari = asilAyar; else delete paket.uygulama.klinikHesaplari }
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); if (KIT) { ayarla(); sifirla() } })

type Secenek = { jeton?: string; govde?: unknown }
async function cagir(yontem: string, yol: string, s: Secenek = {}): Promise<Cevap> {
  const basliklar: Record<string, string> = { host: 'notya.test' }
  if (s.jeton) basliklar.authorization = `Bearer ${s.jeton}`
  if (s.govde !== undefined) basliklar['content-type'] = 'application/json'
  const req = new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(s.govde !== undefined ? { body: JSON.stringify(s.govde) } : {}) })
  const mod = R[yol.split('?')[0]]
  assert.ok(mod?.[yontem], `no handler ${yontem} ${yol}`)
  const res = await mod[yontem](req)
  const metin = await res.clone().text()
  let govde: unknown = null
  try { govde = JSON.parse(metin) } catch { govde = metin }
  return { status: res.status, govde }
}
const K = '/api/ulke/klinik'
const al = (kim: string, yol: string) => cagir('GET', yol, { jeton: JETON[kim] })
const gonder = (kim: string, yontem: string, yol: string, govde: unknown) => cagir(yontem, yol, { jeton: JETON[kim], govde })
const YOK_CEVABI = { status: 404, govde: { code: 'NOT_FOUND' } }
const anahtarlar = (o: unknown) => Object.keys(o as object).sort()
/** Every key of every object anywhere inside an answer. */
function tumAnahtarlar(o: unknown, cikti = new Set<string>()): Set<string> {
  if (Array.isArray(o)) for (const x of o) tumAnahtarlar(x, cikti)
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { cikti.add(k); tumAnahtarlar(v, cikti) }
  return cikti
}
/** The doctors' own data: what no refused request may change. */
const hastaVerisi = () => JSON.stringify(['ulke_hastalar', 'hasta_ulke_bilgisi', 'ulke_randevulari', 'ulke_muayeneler', 'ulke_notlar', 'not_dil_kaydi', 'ulke_portal_erisimleri', 'ulke_hasta_formlari', 'ulke_arac_kayitlari'].map((t) => tablo(t)))
const GUN = () => Z.gunEkle(BUGUN, 1)

// ═════════════════════════ 0. with the feature off, nothing exists ═════════════════════════

const ROTALAR: [string, string[]][] = [[K, ['GET', 'POST']], [`${K}/davet`, ['POST', 'DELETE']], [`${K}/katil`, ['POST']], [`${K}/uye`, ['PATCH', 'DELETE']], [`${K}/yetki`, ['GET', 'POST', 'DELETE']], [`${K}/kayit`, ['GET']], [`${K}/takvim`, ['GET']], [`${K}/on-buro`, ['GET', 'POST', 'PATCH']], [`${K}/paylasilan`, ['GET']]]

describe('clinic accounts — the routes', () => {
  it('a pack that does not switch clinic accounts on: every route, every method, answers "not found" — with a valid session too', async () => {
    ozelligiKapat()
    if (KIT) sifirla(); else vt.hesaplar['j-sa'] = { id: SA, email: 'j-sa@notya.test', app_metadata: { country: BU } }
    for (const [yol, yontemler] of ROTALAR) for (const y of yontemler) {
      assert.deepEqual(await cagir(y, yol, { jeton: 'j-sa', ...(y === 'GET' ? {} : { govde: { ad: 'QA Clinic', hekimId: HE, hesapId: OB, kod: 'x' } }) }), YOK_CEVABI, `${y} ${yol}`)
    }
    assert.equal(vt.sorgular.length, 0, 'a route of a feature that is off read the database')
  })

  it('no session, a session that is not valid, and a session stamped with another country: 401 on every route, every method', async () => {
    if (!KIT) return
    for (const jeton of [undefined, 'j-yok', 'j-yabanci']) for (const [yol, yontemler] of ROTALAR) for (const y of yontemler) {
      const r = await cagir(y, yol, { jeton, ...(y === 'GET' ? {} : { govde: {} }) })
      assert.deepEqual(r, { status: 401, govde: { code: 'OTURUM_YOK' } }, `${y} ${yol} with ${String(jeton)}`)
    }
  })

  it('the routes of the feature are exactly the nine this file knows, and none has a method beyond those listed', async () => {
    const { readdirSync, statSync } = await import('node:fs')
    const kok = join(__dirname, '../../../app/api/ulke/klinik')
    const bulunan: string[] = []
    const gez = (d: string) => { for (const ad of readdirSync(d)) { const y = join(d, ad); if (statSync(y).isDirectory()) gez(y); else bulunan.push(y.slice(kok.length).replace(/\\/g, '/')) } }
    gez(kok)
    assert.deepEqual(bulunan.sort(), ROTALAR.map(([y]) => `${y.slice(K.length)}/route.ulke.ts`).sort())
    for (const [yol, yontemler] of ROTALAR) assert.deepEqual(Object.keys(R[yol]).filter((k) => /^[A-Z]+$/.test(k)).sort(), [...yontemler].sort(), yol)
    // Reading another doctor's patient is GET only: no method of that route writes.
    assert.deepEqual(ROTALAR.find(([y]) => y.endsWith('/paylasilan'))?.[1], ['GET'])
  })
})

// ═════════════════════════ 1. the clinic, its members, its invitations ═════════════════════════

describe('clinic accounts — the clinic and its members', () => {
  it('GET: every member sees their own clinic and its members; invitations only the owner and an administrator; an account in no clinic sees none', async () => {
    if (!KIT) return
    for (const kim of [SA, YO, HE, MU, OB]) {
      const r = await al(kim, K)
      assert.equal(r.status, 200)
      assert.deepEqual([r.govde.klinik.id, r.govde.klinik.ad], [KL1, 'QA Clinic One'])
      assert.deepEqual(anahtarlar(r.govde.klinik), ['ad', 'id', 'konum', 'uyeler'])
      assert.deepEqual(r.govde.klinik.uyeler.map((u: Satir) => u.hesapId).sort(), [SA, YO, YO2, HE, H2, MU, MU2, OB].sort())
      for (const u of r.govde.klinik.uyeler) assert.deepEqual(anahtarlar(u), ['ad', 'hesapId', 'konum', 'rol'])
      assert.equal('davetler' in r.govde, kim === SA || kim === YO, `invitations for ${AD[kim]}`)
      // Nothing of another clinic, and nothing of any patient.
      const metin = JSON.stringify(r.govde)
      for (const yabanci of [S2, OB2, H3, KL2, 'QA Clinic Two', ...Object.keys(HASTA_ADI), ...Object.values(HASTA_ADI)]) assert.ok(!metin.includes(yabanci), `${AD[kim]} saw ${yabanci}`)
    }
    assert.deepEqual((await al(BO, K)).govde.klinik, null)
    assert.equal((await al(S2, K)).govde.klinik.id, KL2)
  })

  it('POST: an account in no clinic creates one and is its owner; a member of a clinic cannot; the name is required', async () => {
    if (!KIT) return
    assert.deepEqual(await gonder(BO, 'POST', K, { ad: ' ' }), { status: 400, govde: { code: 'GECERSIZ', alan: 'ad' } })
    for (const kim of [SA, YO, HE, MU, OB]) assert.deepEqual(await gonder(kim, 'POST', K, { ad: 'QA Second Clinic' }), { status: 409, govde: { code: 'UYE' } }, AD[kim])
    assert.equal(tablo('ulke_klinikler').length, 2)
    const r = await gonder(BO, 'POST', K, { ad: '  QA Clinic Three  ' })
    assert.equal(r.status, 200)
    const k = tablo('ulke_klinikler').find((x) => x.id === r.govde.klinikId) as Satir
    assert.deepEqual([k.ulke, k.doctor_id, k.ad], [BU, BO, 'QA Clinic Three'])
    assert.deepEqual(tablo('ulke_klinik_uyeleri').filter((u) => u.doctor_id === BO).map((u) => [u.klinik_id, u.konum, u.ulke]), [[k.id, 'sahip', BU]])
    // A body cannot name the owner or the country.
    sifirla()
    await gonder(BO, 'POST', K, { ad: 'QA Clinic Four', doctor_id: HE, sahip: HE, ulke: YABANCI })
    assert.deepEqual(tablo('ulke_klinikler').filter((x) => x.ad === 'QA Clinic Four').map((x) => [x.doctor_id, x.ulke]), [[BO, BU]])
  })

  it('invitations — WHO MAY ISSUE WHICH POSITION: the owner any but the owner\'s; an administrator a doctor, an allied professional, the front desk; nobody else any', async () => {
    if (!KIT) return
    const KONUMLAR = ['sahip', 'yonetici', 'hekim', 'muttefik', 'on-buro', 'direktor']
    const BEKLENEN: Record<string, number[]> = {
      //        sahip yonetici hekim muttefik on-buro direktor
      [SA]: [400, 200, 200, 200, 200, 400],
      [YO]: [400, 403, 200, 200, 200, 400],
      [HE]: [400, 403, 403, 403, 403, 400],
      [MU]: [400, 403, 403, 403, 403, 400],
      [OB]: [400, 403, 403, 403, 403, 400],
      [BO]: [400, 404, 404, 404, 404, 400],
    }
    for (const [kim, beklenen] of Object.entries(BEKLENEN)) for (const [i, konum] of KONUMLAR.entries()) {
      sifirla()
      const r = await gonder(kim, 'POST', `${K}/davet`, { konum, klinikId: KL2, klinik_id: KL2 })
      assert.equal(r.status, beklenen[i], `${AD[kim]} → ${konum}: ${JSON.stringify(r.govde)}`)
      const satirlar = tablo('ulke_klinik_davetleri')
      assert.equal(satirlar.length, beklenen[i] === 200 ? 1 : 0, `${AD[kim]} → ${konum}`)
      if (beklenen[i] !== 200) continue
      // The code is answered once; only its hash is stored; the clinic is the caller's own, whatever the body says.
      assert.deepEqual(anahtarlar(r.govde), ['davetId', 'kod', 'konum', 'sonGecerlilik'])
      const s = satirlar[0]
      assert.deepEqual([s.ulke, s.klinik_id, s.doctor_id, s.konum, s.kod_hash], [BU, KL1, kim, konum, D.davetKoduHash(r.govde.kod)])
      assert.ok(!JSON.stringify(s).includes(D.davetKoduNormalle(r.govde.kod)), 'the code itself was stored')
      assert.equal(new Date(String(s.son_gecerlilik)).getTime(), BASLANGIC_ANI + 7 * GUN_MS)
      // … and the list never shows it.
      const liste = (await al(SA, K)).govde.davetler
      assert.deepEqual(liste.map((d: Satir) => anahtarlar(d)), [['durum', 'id', 'konum', 'olusturuldu', 'sonGecerlilik']])
      assert.ok(!JSON.stringify(liste).includes(String(s.kod_hash)))
    }
  })

  it('joining: one use; an ended, withdrawn, unknown, malformed or other-country code is one answer; a member of a clinic keeps the code unused', async () => {
    if (!KIT) return
    const davet = async (konum = 'on-buro') => (await gonder(SA, 'POST', `${K}/davet`, { konum })).govde as { kod: string; davetId: string }
    // one use
    let d = await davet('hekim')
    assert.deepEqual(await gonder(BO, 'POST', `${K}/katil`, { kod: d.kod.toLowerCase() }), { status: 200, govde: { klinikId: KL1, konum: 'hekim' } })
    assert.deepEqual(tablo('ulke_klinik_uyeleri').filter((u) => u.doctor_id === BO).map((u) => [u.klinik_id, u.konum]), [[KL1, 'hekim']])
    tablo('ulke_klinik_uyeleri').pop()
    assert.deepEqual(await gonder(BO, 'POST', `${K}/katil`, { kod: d.kod }), { status: 400, govde: { code: 'KOD' } }, 'a used code')
    // joining gives a position and NOTHING ELSE: no grant exists for the new member
    assert.equal(yetkiler().length, 0)
    // ended
    d = await davet()
    mock.timers.setTime(BASLANGIC_ANI + 7 * GUN_MS)
    assert.deepEqual(await gonder(BO, 'POST', `${K}/katil`, { kod: d.kod }), { status: 400, govde: { code: 'KOD' } }, 'an ended code')
    mock.timers.setTime(BASLANGIC_ANI)
    // a member of a clinic: refused, and the code is NOT used up
    for (const kim of [HE, S2, OB2]) assert.deepEqual(await gonder(kim, 'POST', `${K}/katil`, { kod: d.kod }), { status: 409, govde: { code: 'UYE' } }, AD[kim])
    assert.equal(tablo('ulke_klinik_davetleri').find((x) => x.id === d.davetId)?.kullanildi_at ?? null, null)
    // withdrawn — by an administrator of THAT clinic; not by anybody else
    for (const kim of [HE, OB, S2, BO]) assert.deepEqual(await gonder(kim, 'DELETE', `${K}/davet`, { davetId: d.davetId }), YOK_CEVABI, `withdrawn by ${AD[kim]}`)
    assert.deepEqual(await gonder(YO, 'DELETE', `${K}/davet`, { davetId: d.davetId }), { status: 200, govde: { ok: true } })
    assert.deepEqual(await gonder(YO, 'DELETE', `${K}/davet`, { davetId: d.davetId }), YOK_CEVABI, 'withdrawn twice')
    assert.deepEqual(await gonder(BO, 'POST', `${K}/katil`, { kod: d.kod }), { status: 400, govde: { code: 'KOD' } }, 'a withdrawn code')
    // unknown, malformed, and another country's
    for (const kod of ['ABCD-EFGH-JKMN-PQRS', 'x', '', null, 12]) assert.deepEqual(await gonder(BO, 'POST', `${K}/katil`, { kod }), { status: 400, govde: { code: 'KOD' } }, String(kod))
    const yabanciKod = D.davetKoduUret()
    tablo('ulke_klinik_davetleri').push({ id: 'd-yabanci', ulke: YABANCI, klinik_id: KL1, doctor_id: SA, konum: 'hekim', kod_hash: D.davetKoduHash(yabanciKod), son_gecerlilik: new Date(BASLANGIC_ANI + GUN_MS).toISOString(), kullanildi_at: null, kullanan_id: null, iptal_at: null, created_at: simdiIso() })
    assert.deepEqual(await gonder(BO, 'POST', `${K}/katil`, { kod: yabanciKod }), { status: 400, govde: { code: 'KOD' } }, 'a code of another country')
    assert.equal(tablo('ulke_klinik_uyeleri').some((u) => u.doctor_id === BO), false)
    // There is no list of clinics and no way to ask for one: an account in no clinic sees nothing of any.
    assert.deepEqual(anahtarlar((await al(BO, K)).govde), ['ayarlar', 'klinik'])
  })

  it('REMOVING A MEMBER — who may remove whom (every pair), and what it answers', async () => {
    if (!KIT) return
    const HEDEFLER = [SA, YO, YO2, HE, MU, OB]
    const BEKLENEN: Record<string, (number | string)[]> = {
      //     owner    admin  admin2 doctor allied front desk
      [SA]: ['SAHIP', 200, 200, 200, 200, 200],
      [YO]: ['SAHIP', 200, 403, 200, 200, 200], // an administrator: themselves (leaving), never another administrator
      [HE]: ['SAHIP', 403, 403, 200, 403, 403], // a doctor: themselves only
      [MU]: ['SAHIP', 403, 403, 403, 200, 403],
      [OB]: ['SAHIP', 403, 403, 403, 403, 200],
      [S2]: [404, 404, 404, 404, 404, 404],     // the owner of ANOTHER clinic
      [OB2]: [404, 404, 404, 404, 404, 404],
      [BO]: [404, 404, 404, 404, 404, 404],     // an account in no clinic
    }
    for (const [yapan, beklenen] of Object.entries(BEKLENEN)) for (const [i, hedef] of HEDEFLER.entries()) {
      sifirla()
      const r = await gonder(yapan, 'DELETE', `${K}/uye`, { hesapId: hedef })
      const b = beklenen[i]
      const ad = `${AD[yapan]} removes ${AD[hedef]}`
      if (b === 200) assert.deepEqual(r, { status: 200, govde: { ok: true } }, ad)
      else if (b === 'SAHIP') assert.deepEqual(r, yapan === S2 || yapan === OB2 || yapan === BO ? YOK_CEVABI : { status: 409, govde: { code: 'SAHIP' } }, ad)
      else if (b === 403) assert.deepEqual(r, { status: 403, govde: { code: 'YETKI_YOK' } }, ad)
      else assert.deepEqual(r, YOK_CEVABI, ad)
      assert.equal(tablo('ulke_klinik_uyeleri').some((u) => u.doctor_id === hedef), b !== 200, ad)
      assert.equal(tablo('ulke_klinik_uyeleri').length, b === 200 ? 10 : 11, ad)
    }
    // An id that is no member, a member of another clinic, a malformed id: "not found", nobody removed.
    sifirla()
    for (const hesapId of [YOK, S2, H3, BO, 'x', null]) assert.deepEqual(await gonder(SA, 'DELETE', `${K}/uye`, { hesapId, klinikId: KL2 }), YOK_CEVABI, String(hesapId))
    assert.equal(tablo('ulke_klinik_uyeleri').length, 11)
  })

  it('CHANGING A POSITION — who may change whom to what (every pair, every position)', async () => {
    if (!KIT) return
    const HEDEFLER = [SA, YO2, HE, MU, OB]
    const YENI = ['yonetici', 'hekim', 'muttefik', 'on-buro']
    const mevcut: Record<string, string> = { [SA]: 'sahip', [YO2]: 'yonetici', [HE]: 'hekim', [MU]: 'muttefik', [OB]: 'on-buro' }
    /** The rule, written out independently of the code: who may move a member from one position to another. */
    const beklenen = (yapan: string, hedef: string, yeni: string): number | string => {
      if ([S2, BO].includes(yapan)) return 404
      if (hedef === SA) return 'SAHIP'
      const y = yapan === SA ? 'sahip' : yapan === YO ? 'yonetici' : 'diger'
      if (y === 'diger' || yapan === hedef) return 403
      if (y === 'yonetici' && (mevcut[hedef] === 'yonetici' || yeni === 'yonetici')) return 403
      return mevcut[hedef] === yeni ? 'AYNI' : 200
    }
    for (const yapan of [SA, YO, HE, MU, OB, S2, BO]) for (const hedef of HEDEFLER) for (const yeni of YENI) {
      sifirla()
      const r = await gonder(yapan, 'PATCH', `${K}/uye`, { hesapId: hedef, konum: yeni })
      const b = beklenen(yapan, hedef, yeni)
      const ad = `${AD[yapan]} makes ${AD[hedef]} ${yeni}: ${JSON.stringify(r)}`
      if (b === 200) assert.deepEqual(r, { status: 200, govde: { ok: true } }, ad)
      else if (b === 404) assert.deepEqual(r, YOK_CEVABI, ad)
      else if (b === 403) assert.deepEqual(r, { status: 403, govde: { code: 'YETKI_YOK' } }, ad)
      else assert.deepEqual(r, { status: 409, govde: { code: b } }, ad)
      assert.equal(tablo('ulke_klinik_uyeleri').find((u) => u.doctor_id === hedef)?.konum, b === 200 ? yeni : mevcut[hedef], ad)
    }
    // Nobody is made owner, and a word that is no position is refused.
    sifirla()
    assert.deepEqual(await gonder(SA, 'PATCH', `${K}/uye`, { hesapId: HE, konum: 'sahip' }), { status: 409, govde: { code: 'SAHIP' } })
    assert.deepEqual(await gonder(SA, 'PATCH', `${K}/uye`, { hesapId: HE, konum: 'direktor' }), { status: 400, govde: { code: 'GECERSIZ', alan: 'konum' } })
    assert.deepEqual(tablo('ulke_klinik_uyeleri').filter((u) => u.konum === 'sahip').map((u) => u.doctor_id).sort(), [SA, S2].sort())
  })
})

// ═════════════════════════ 2. giving and withdrawing a grant ═════════════════════════

describe('clinic accounts — grants: who may give what to whom', () => {
  const ver = (kim: string, govde: Satir) => gonder(kim, 'POST', `${K}/yetki`, govde)
  const govdeleri = (alan: string): Record<KlinikYetkiTuru, Satir> => ({
    'on-buro-randevu': { alanId: alan, tur: 'on-buro-randevu' }, 'on-buro-hasta': { alanId: alan, tur: 'on-buro-hasta' }, 'on-buro-portal': { alanId: alan, tur: 'on-buro-portal' },
    paylasim: { alanId: alan, tur: 'paylasim', hastaId: P1 }, vekalet: { alanId: alan, tur: 'vekalet', bitisGun: Z.gunEkle(BUGUN, 5) },
  })
  const TURLER: KlinikYetkiTuru[] = ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet']

  it('EVERY CAPABILITY × EVERY POSITION it could be given to: front-desk capabilities only to the front desk, a share only to an allied professional, cover only to a doctor (owner and administrator included, as doctors)', async () => {
    if (!KIT) return
    const BEKLENEN: Record<string, number[]> = {
      //     randevu hasta portal paylasim vekalet
      [SA]: [409, 409, 409, 409, 200],
      [YO]: [409, 409, 409, 409, 200],
      [H2]: [409, 409, 409, 409, 200],
      [MU]: [409, 409, 409, MUTTEFIK_ROLU ? 200 : 409, 409],
      [OB]: [200, 200, 200, 409, 409],
      [S2]: [404, 404, 404, 404, 404], // a member of ANOTHER clinic
      [BO]: [404, 404, 404, 404, 404], // an account in no clinic
      [HE]: [404, 404, 404, 404, 404], // oneself
    }
    for (const [alan, beklenen] of Object.entries(BEKLENEN)) for (const [i, tur] of TURLER.entries()) {
      sifirla()
      const r = await ver(HE, govdeleri(alan)[tur])
      assert.equal(r.status, beklenen[i], `${tur} → ${AD[alan]}: ${JSON.stringify(r.govde)}`)
      assert.equal(yetkiler().length, beklenen[i] === 200 ? 1 : 0, `${tur} → ${AD[alan]}`)
      if (beklenen[i] === 409) assert.equal(r.govde.code, 'KONUM')
      if (beklenen[i] !== 200) { assert.equal(kayitlar().length, 0); continue }
      // The grant names the country, the caller's own clinic, the doctor, the member and ONE capability — and is recorded.
      const y = yetkiler()[0]
      assert.deepEqual([y.ulke, y.klinik_id, y.doctor_id, y.alan_id, y.tur, y.kaydeden_id, y.iptal_at], [BU, KL1, HE, alan, tur, HE, null])
      assert.deepEqual(y.patient_id, tur === 'paylasim' ? P1 : null)
      assert.deepEqual(kayitlar().map((k) => [k.doctor_id, k.kisi_id, k.alan_id, k.tur, k.olay, k.patient_id, k.yetki_id]), [[HE, HE, alan, tur, 'verildi', tur === 'paylasim' ? P1 : null, y.id]])
      assert.deepEqual(anahtarlar(r.govde), ['yeni', 'yetkiId'])
    }
  })

  it('WHO MAY GIVE: any member with patients for their own; a front-desk member for nobody; nobody for another doctor\'s patients', async () => {
    if (!KIT) return
    // every position gives a front-desk capability for THEIR OWN patients — except the front desk
    for (const [veren, durum] of [[SA, 200], [YO, 200], [HE, 200], [MU, 200], [OB, 404], [S2, 404], [BO, 404]] as const) {
      sifirla()
      const r = await ver(veren, { alanId: OB, tur: 'on-buro-randevu' })
      assert.equal(r.status, durum, `${AD[veren]}: ${JSON.stringify(r.govde)}`)
      assert.deepEqual(yetkiler().map((y) => y.doctor_id), durum === 200 ? [veren] : [])
    }
    // a front-desk member giving to a doctor: the database's rule
    sifirla()
    assert.deepEqual(await ver(OB, { alanId: H2, tur: 'vekalet', bitisGun: Z.gunEkle(BUGUN, 3) }), { status: 409, govde: { code: 'KONUM' } })
    // a share of a patient who is NOT the giver's: another doctor's of the clinic, another clinic's, one that does not exist
    if (MUTTEFIK_ROLU) for (const hastaId of [P3, P4, P5, YOK]) {
      sifirla()
      assert.deepEqual(await ver(HE, { alanId: MU, tur: 'paylasim', hastaId }), YOK_CEVABI, `share of ${HASTA_ADI[hastaId] ?? 'nobody'}`)
      assert.equal(yetkiler().length, 0)
    }
  })

  it('ON A DOCTOR\'S BEHALF: refused for everybody while the pack says no (the default); with the pack\'s yes, the OWNER only — and the record names who entered it', async () => {
    if (!KIT) return
    for (const kim of [SA, YO, H2, MU, OB, S2]) {
      sifirla()
      const r = await ver(kim, { hekimId: HE, alanId: OB, tur: 'on-buro-randevu' })
      assert.ok(r.status === 403 || r.status === 404, `${AD[kim]}: ${JSON.stringify(r)}`)
      assert.equal(yetkiler().length, 0, AD[kim])
    }
    for (const [kim, durum] of [[SA, 200], [YO, 403], [H2, 403], [MU, 403], [OB, 403], [S2, 404]] as const) {
      sifirla(); ayarla({ sahipHekimAdinaVerebilir: true })
      const r = await ver(kim, { hekimId: HE, alanId: OB, tur: 'on-buro-randevu' })
      assert.equal(r.status, durum, `${AD[kim]} with the pack's yes: ${JSON.stringify(r)}`)
      assert.deepEqual(yetkiler().map((y) => [y.doctor_id, y.kaydeden_id]), durum === 200 ? [[HE, SA]] : [])
      if (durum === 200) assert.deepEqual(kayitlar().map((k) => [k.doctor_id, k.kisi_id, k.olay]), [[HE, SA, 'verildi']])
    }
  })

  it('the pack decides which capabilities exist, and which allied roles may receive a share; a doctor\'s role is needed for cover', async () => {
    if (!KIT) return
    for (const tur of TURLER) {
      sifirla(); ayarla({ yetkiTurleri: TURLER.filter((t) => t !== tur) })
      const alan = tur === 'paylasim' ? MU : tur === 'vekalet' ? H2 : OB
      assert.deepEqual(await ver(HE, govdeleri(alan)[tur]), { status: 409, govde: { code: 'TUR_KAPALI' } }, tur)
      assert.equal(yetkiler().length, 0)
    }
    // a share: an allied role the pack does not list; no role at all; a doctor's role in an allied position
    if (MUTTEFIK_ROLU) {
      for (const hazirla of [() => ayarla({ paylasimRolleri: [] }), () => rolYaz(MU, null), () => rolYaz(MU, HEKIM_ROLU)]) {
        sifirla(); ayarla(); hazirla()
        assert.deepEqual(await ver(HE, govdeleri(MU).paylasim), { status: 409, govde: { code: 'ROL' } })
      }
      if (MUTTEFIK_ROLU_LISTEDE_YOK) { sifirla(); assert.deepEqual(await ver(HE, govdeleri(MU2).paylasim), { status: 409, govde: { code: 'ROL' } }, 'an allied role that is not on the pack\'s list') }
    }
    // cover: a member in a doctor's position who works in no role, or in an allied role
    for (const rol of [null, MUTTEFIK_ROLU || null]) { sifirla(); rolYaz(H2, rol); assert.deepEqual(await ver(HE, govdeleri(H2).vekalet), { status: 409, govde: { code: 'ROL' } }) }
  })

  it('cover has a stated period: whole days of the doctor\'s own time zone, from today on, no longer than the pack allows; given again it replaces the one before', async () => {
    if (!KIT) return
    const son = (n: number) => Z.gunEkle(BUGUN, n)
    for (const [govde, alan] of [[{ bitisGun: undefined }, 'bitisGun'], [{ bitisGun: son(-1) }, 'bitisGun'], [{ bitisGun: 'yarin' }, 'bitisGun'], [{ bitisGun: son(14) }, 'bitisGun'], [{ baslangicGun: son(-1), bitisGun: son(2) }, 'baslangicGun'], [{ baslangicGun: son(3), bitisGun: son(2) }, 'bitisGun']] as const) {
      sifirla()
      assert.deepEqual(await ver(HE, { alanId: H2, tur: 'vekalet', ...govde }), { status: 400, govde: { code: 'GECERSIZ', alan } }, JSON.stringify(govde))
      assert.equal(yetkiler().length, 0)
    }
    sifirla()
    const r = await ver(HE, { alanId: H2, tur: 'vekalet', bitisGun: son(13) })
    assert.equal(r.status, 200)
    const y = yetkiler()[0]
    assert.equal(y.baslangic, new Date(Z.yerelUtc(BUGUN, 0, paket.saatDilimi)).toISOString())
    assert.equal(y.bitis, new Date(Z.yerelUtc(son(14), 0, paket.saatDilimi)).toISOString())
    const r2 = await ver(HE, { alanId: H2, tur: 'vekalet', baslangicGun: son(1), bitisGun: son(2) })
    assert.equal(r2.status, 200)
    assert.deepEqual(yetkiler().map((x) => [x.id === y.id, x.iptal_at !== null]), [[true, true], [false, false]])
    assert.deepEqual(kayitlar().map((k) => k.olay), ['verildi', 'geri-alindi', 'verildi'])
    // a period on a capability that has none, a patient on one that names none, a word that is no capability
    assert.equal((await ver(HE, { alanId: OB, tur: 'on-buro-hasta', bitisGun: son(2) })).status, 400)
    assert.equal((await ver(HE, { alanId: OB, tur: 'on-buro-hasta', hastaId: P1 })).status, 400)
    assert.deepEqual(await ver(HE, { alanId: OB, tur: 'hamma-narsa' }), { status: 400, govde: { code: 'GECERSIZ', alan: 'tur' } })
    // the same grant again: the one that stands, nothing new
    const a = await ver(HE, { alanId: OB, tur: 'on-buro-randevu' }), b = await ver(HE, { alanId: OB, tur: 'on-buro-randevu' })
    assert.deepEqual([a.govde.yeni, b.govde.yeni, a.govde.yetkiId === b.govde.yetkiId], [true, false, true])
  })

  it('WITHDRAWING: the doctor, the member who holds it, or whoever entered it — for anybody else the grant does not exist', async () => {
    if (!KIT) return
    for (const [kim, durum] of [[HE, 200], [OB, 200], [SA, 404], [YO, 404], [H2, 404], [MU, 404], [S2, 404], [OB2, 404], [BO, 404]] as const) {
      sifirla()
      const id = yetki(HE, OB, 'on-buro-randevu')
      const r = await gonder(kim, 'DELETE', `${K}/yetki`, { yetkiId: id })
      assert.equal(r.status, durum, `${AD[kim]}: ${JSON.stringify(r)}`)
      assert.equal(yetkiler()[0].iptal_at !== null, durum === 200, AD[kim])
      assert.deepEqual(kayitlar().map((k) => [k.olay, k.kisi_id, k.doctor_id, k.alan_id]), durum === 200 ? [['geri-alindi', kim, HE, OB]] : [])
    }
    sifirla()
    const id = yetki(HE, OB, 'on-buro-randevu')
    await gonder(HE, 'DELETE', `${K}/yetki`, { yetkiId: id })
    assert.deepEqual(await gonder(HE, 'DELETE', `${K}/yetki`, { yetkiId: id }), { status: 409, govde: { code: 'AYNI' } })
    for (const yetkiId of [YOK, 'x', null]) assert.deepEqual(await gonder(HE, 'DELETE', `${K}/yetki`, { yetkiId }), YOK_CEVABI)
    // a grant of another country with the same id
    sifirla()
    yetki(HE, OB, 'on-buro-randevu', { id: YOK, ulke: YABANCI })
    assert.deepEqual(await gonder(HE, 'DELETE', `${K}/yetki`, { yetkiId: YOK }), YOK_CEVABI)
    assert.equal(yetkiler()[0].iptal_at, null)
  })

  it('the lists: a doctor sees every grant about their own patients; a member sees what they hold with NOTHING of a patient; nobody sees another doctor\'s grants', async () => {
    if (!KIT) return
    yetki(HE, OB, 'on-buro-randevu'); yetki(HE, H2, 'vekalet'); yetki(H2, OB, 'on-buro-hasta')
    if (MUTTEFIK_ROLU) yetki(HE, MU, 'paylasim', { patient_id: P1 })
    const he = (await al(HE, `${K}/yetki`)).govde
    assert.deepEqual(he.verilen.map((y: Satir) => y.hekimId), he.verilen.map(() => HE))
    assert.equal(he.verilen.length, MUTTEFIK_ROLU ? 3 : 2)
    assert.deepEqual(he.alinan, [])
    if (MUTTEFIK_ROLU) assert.equal(he.verilen.find((y: Satir) => y.tur === 'paylasim').hastaAdi, HASTA_ADI[P1])
    // the owner and an administrator see NO grant of any doctor by position
    for (const kim of [SA, YO, BO, S2]) assert.deepEqual((await al(kim, `${K}/yetki`)).govde, { verilen: [], alinan: [] }, AD[kim])
    const ob = (await al(OB, `${K}/yetki`)).govde
    assert.deepEqual(ob.alinan.map((y: Satir) => [y.hekimId, y.tur]).sort(), [[HE, 'on-buro-randevu'], [H2, 'on-buro-hasta']].sort())
    if (MUTTEFIK_ROLU) {
      const mu = (await al(MU, `${K}/yetki`)).govde
      assert.deepEqual(mu.alinan.map((y: Satir) => [y.hekimId, y.tur, y.hastaId]), [[HE, 'paylasim', P1]])
      for (const ad of Object.values(HASTA_ADI)) assert.ok(!JSON.stringify(mu).includes(ad), 'the list of grants held named a patient')
      assert.ok(!tumAnahtarlar(mu).has('hastaAdi'))
    }
    assert.equal(kullanim().length, 0, 'listing grants is not a read of a patient')
  })
})

// ═════════════════════════ 3. THE TABLE: every gated request, in every situation ═════════════════════════

type Islem = {
  ad: string
  kim: string
  /** The capability the request needs, and how the grant for it is planted. */
  tur: KlinikYetkiTuru
  ver: () => string
  /** The same member holding ONLY something else: another capability, or a share of another patient. */
  baskaVer: () => void
  cagir: (hekim?: string) => Promise<Cevap>
  olay: 'okuma' | 'yazma'
  ne: string
  hasta: string | null
  gerek?: () => boolean
}
const OB_YOL = `${K}/on-buro`, PY_YOL = `${K}/paylasilan`
const obBaska = (tur: KlinikYetkiTuru) => () => { for (const t of ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'] as const) if (t !== tur) yetki(HE, OB, t) }
const ISLEMLER: Islem[] = [
  { ad: 'front desk: the doctor\'s appointments', kim: OB, tur: 'on-buro-randevu', ver: () => yetki(HE, OB, 'on-buro-randevu'), baskaVer: obBaska('on-buro-randevu'), cagir: (h = HE) => al(OB, `${OB_YOL}?hekim=${h}&gun=${GUN()}`), olay: 'okuma', ne: 'randevu-listesi', hasta: null },
  { ad: 'front desk: find a patient', kim: OB, tur: 'on-buro-randevu', ver: () => yetki(HE, OB, 'on-buro-randevu'), baskaVer: obBaska('on-buro-randevu'), cagir: (h = HE) => al(OB, `${OB_YOL}?hekim=${h}&q=QA+Patient`), olay: 'okuma', ne: 'hasta-arama', hasta: null },
  { ad: 'front desk: the patient card', kim: OB, tur: 'on-buro-randevu', ver: () => yetki(HE, OB, 'on-buro-randevu'), baskaVer: obBaska('on-buro-randevu'), cagir: (h = HE) => al(OB, `${OB_YOL}?hekim=${h}&hasta=${P1}`), olay: 'okuma', ne: 'hasta-karti', hasta: P1 },
  { ad: 'front desk: create a patient', kim: OB, tur: 'on-buro-hasta', ver: () => yetki(HE, OB, 'on-buro-hasta'), baskaVer: obBaska('on-buro-hasta'), cagir: (h = HE) => gonder(OB, 'POST', OB_YOL, { hekimId: h, islem: 'hasta', ad: 'QA New Patient', dil: paket.uygulama?.hastaDilleri[0] }), olay: 'yazma', ne: 'hasta-olusturma', hasta: null },
  { ad: 'front desk: book an appointment', kim: OB, tur: 'on-buro-randevu', ver: () => yetki(HE, OB, 'on-buro-randevu'), baskaVer: obBaska('on-buro-randevu'), cagir: (h = HE) => gonder(OB, 'POST', OB_YOL, { hekimId: h, islem: 'randevu', hastaId: P1, gun: GUN(), saat: '14:00', sureDk: SURE, yineDe: true }), olay: 'yazma', ne: 'randevu-olusturma', hasta: P1 },
  { ad: 'front desk: set an appointment\'s status', kim: OB, tur: 'on-buro-randevu', ver: () => yetki(HE, OB, 'on-buro-randevu'), baskaVer: obBaska('on-buro-randevu'), cagir: (h = HE) => gonder(OB, 'PATCH', OB_YOL, { hekimId: h, randevuId: R1, durum: 'geldi' }), olay: 'yazma', ne: 'randevu-degisiklik', hasta: P1 },
  { ad: 'front desk: move an appointment', kim: OB, tur: 'on-buro-randevu', ver: () => yetki(HE, OB, 'on-buro-randevu'), baskaVer: obBaska('on-buro-randevu'), cagir: (h = HE) => gonder(OB, 'PATCH', OB_YOL, { hekimId: h, randevuId: R1, gun: GUN(), saat: '15:00', sureDk: SURE, yineDe: true }), olay: 'yazma', ne: 'randevu-degisiklik', hasta: P1 },
  { ad: 'front desk: give the portal link', kim: OB, tur: 'on-buro-portal', ver: () => yetki(HE, OB, 'on-buro-portal'), baskaVer: obBaska('on-buro-portal'), cagir: (h = HE) => gonder(OB, 'POST', OB_YOL, { hekimId: h, islem: 'portal', hastaId: P1 }), olay: 'yazma', ne: 'portal-baglantisi', hasta: P1, gerek: () => PORTAL },
  { ad: 'front desk: ask for the intake form', kim: OB, tur: 'on-buro-portal', ver: () => yetki(HE, OB, 'on-buro-portal'), baskaVer: obBaska('on-buro-portal'), cagir: (h = HE) => gonder(OB, 'POST', OB_YOL, { hekimId: h, islem: 'form', hastaId: P1 }), olay: 'yazma', ne: 'form-istegi', hasta: P1, gerek: () => FORM },
  { ad: 'allied: who the shared patient is', kim: MU, tur: 'paylasim', ver: () => yetki(HE, MU, 'paylasim', { patient_id: P1 }), baskaVer: () => { yetki(HE, MU, 'paylasim', { patient_id: P2 }) }, cagir: (h = HE) => al(MU, `${PY_YOL}?hekim=${h}&hasta=${P1}&kart=1`), olay: 'okuma', ne: 'hasta-karti', hasta: P1, gerek: () => Boolean(MUTTEFIK_ROLU) },
  { ad: 'allied: the shared patient\'s approved notes', kim: MU, tur: 'paylasim', ver: () => yetki(HE, MU, 'paylasim', { patient_id: P1 }), baskaVer: () => { yetki(HE, MU, 'paylasim', { patient_id: P2 }) }, cagir: (h = HE) => al(MU, `${PY_YOL}?hekim=${h}&hasta=${P1}`), olay: 'okuma', ne: 'not-listesi', hasta: P1, gerek: () => Boolean(MUTTEFIK_ROLU) },
  { ad: 'cover: a patient\'s approved notes', kim: H2, tur: 'vekalet', ver: () => yetki(HE, H2, 'vekalet'), baskaVer: () => { yetki(H2, HE, 'vekalet') }, cagir: (h = HE) => al(H2, `${PY_YOL}?hekim=${h}&hasta=${P1}`), olay: 'okuma', ne: 'not-listesi', hasta: P1 },
  { ad: 'cover: find a patient', kim: H2, tur: 'vekalet', ver: () => yetki(HE, H2, 'vekalet'), baskaVer: () => { yetki(H2, HE, 'vekalet') }, cagir: (h = HE) => al(H2, `${PY_YOL}?hekim=${h}&q=QA+Patient`), olay: 'okuma', ne: 'hasta-arama', hasta: null },
  { ad: 'cover: the doctor\'s appointments', kim: H2, tur: 'vekalet', ver: () => yetki(HE, H2, 'vekalet'), baskaVer: () => { yetki(H2, HE, 'vekalet') }, cagir: (h = HE) => al(H2, `${PY_YOL}?hekim=${h}&gun=${GUN()}`), olay: 'okuma', ne: 'randevu-listesi', hasta: null },
]
const islemler = () => ISLEMLER.filter((i) => !i.gerek || i.gerek())
const digerKonum: Record<string, string> = { [OB]: 'muttefik', [MU]: 'on-buro', [H2]: 'muttefik' }

describe('clinic accounts — THE TABLE: every request that reaches another doctor\'s patient, in every situation', () => {
  /** A refused request: "not found", nothing of the doctor's data in the answer, nothing changed, nothing recorded as a read. */
  async function reddedilir(i: Islem, durum: string, hekim = HE) {
    const once = hastaVerisi(), kullanimOnce = kullanim().length
    const r = await i.cagir(hekim)
    assert.deepEqual(r, YOK_CEVABI, `${i.ad} — ${durum}: ${JSON.stringify(r)}`)
    assert.equal(hastaVerisi(), once, `${i.ad} — ${durum}: a refused request changed the doctor's data`)
    assert.equal(kullanim().length, kullanimOnce, `${i.ad} — ${durum}: a refused request was recorded as a read or a write`)
  }

  it('WITH THE GRANT: allowed, and written to the doctor\'s record — who, whose patient, what — exactly once', async () => {
    if (!KIT) return
    for (const i of islemler()) {
      sifirla()
      const id = i.ver()
      const r = await i.cagir()
      assert.equal(r.status, 200, `${i.ad}: ${JSON.stringify(r)}`)
      assert.deepEqual(kullanim().map((k) => [k.ulke, k.doctor_id, k.kisi_id, k.alan_id, k.tur, k.olay, k.ne, k.patient_id, k.yetki_id]), [[BU, HE, i.kim, i.kim, i.tur, i.olay, i.ne, i.hasta, id]], i.ad)
      // Every statement the request made named this build's country.
      assert.deepEqual([...new Set(vt.sorgular.map((q) => q.ulke))], [BU], i.ad)
    }
  })

  it('WITHOUT A GRANT · with ONLY ANOTHER capability (or a share of another patient) · from ANOTHER DOCTOR who gave nothing', async () => {
    if (!KIT) return
    for (const i of islemler()) {
      sifirla(); await reddedilir(i, 'no grant at all')
      sifirla(); i.baskaVer(); await reddedilir(i, 'only another capability / another patient')
      // The grant is from HE; the same member names H2 (or, for cover held by H2, the owner) as the doctor instead.
      sifirla(); i.ver(); await reddedilir(i, 'the grant is another doctor\'s', i.kim === H2 ? SA : H2)
      sifirla(); i.ver(); await reddedilir(i, 'a doctor of another clinic', H3)
      sifirla(); i.ver(); await reddedilir(i, 'a doctor who does not exist', YOK)
    }
  })

  it('A WITHDRAWN GRANT: the next request is refused — withdrawn by the doctor, and given up by the member', async () => {
    if (!KIT) return
    for (const i of islemler()) for (const kim of [HE, i.kim]) {
      sifirla()
      const id = i.ver()
      assert.deepEqual(await gonder(kim, 'DELETE', `${K}/yetki`, { yetkiId: id }), { status: 200, govde: { ok: true } })
      await reddedilir(i, `withdrawn by ${AD[kim]}`)
    }
  })

  it('COVER THAT HAS ENDED, and cover that has not begun: refused, to the second', async () => {
    if (!KIT) return
    for (const i of islemler().filter((x) => x.tur === 'vekalet')) {
      const bas = BASLANGIC_ANI + GUN_MS, bit = BASLANGIC_ANI + 2 * GUN_MS
      const kur = () => { sifirla(); yetki(HE, H2, 'vekalet', { baslangic: new Date(bas).toISOString(), bitis: new Date(bit).toISOString() }) }
      kur(); mock.timers.setTime(bas - 1000); await reddedilir(i, 'one second before the period')
      kur(); mock.timers.setTime(bit); await reddedilir(i, 'the moment the period ends')
      kur(); mock.timers.setTime(bit + 30 * GUN_MS); await reddedilir(i, 'long after')
      kur(); mock.timers.setTime(bas)
      // (the appointment list of that day needs the day; inside the period the request is allowed)
      assert.equal((await i.cagir()).status, 200, `${i.ad} — inside the period`)
      mock.timers.setTime(BASLANGIC_ANI)
    }
  })

  it('REMOVAL IS IMMEDIATE: the member removed by the owner, by an administrator, gone by themselves; the DOCTOR gone; the position changed — the very next request is refused', async () => {
    if (!KIT) return
    for (const i of islemler()) {
      const durumlar: [string, () => Promise<Cevap>][] = [
        ['the member was removed by the owner', () => gonder(SA, 'DELETE', `${K}/uye`, { hesapId: i.kim })],
        ['the member was removed by an administrator', () => gonder(YO, 'DELETE', `${K}/uye`, { hesapId: i.kim })],
        ['the member left', () => gonder(i.kim, 'DELETE', `${K}/uye`, { hesapId: i.kim })],
        ['the doctor left the clinic', () => gonder(HE, 'DELETE', `${K}/uye`, { hesapId: HE })],
        ['the doctor was removed', () => gonder(SA, 'DELETE', `${K}/uye`, { hesapId: HE })],
        ['the member\'s position was changed', () => gonder(SA, 'PATCH', `${K}/uye`, { hesapId: i.kim, konum: digerKonum[i.kim] })],
        ['the doctor\'s position was changed', () => gonder(SA, 'PATCH', `${K}/uye`, { hesapId: HE, konum: 'muttefik' })],
      ]
      for (const [ad, yap] of durumlar) {
        sifirla()
        const id = i.ver()
        // positive control: the request works a moment before
        assert.equal((await i.cagir()).status, 200, `${i.ad} — before: ${ad}`)
        sifirla(); i.ver()
        assert.deepEqual(await yap(), { status: 200, govde: { ok: true } }, ad)
        await reddedilir(i, ad)
        // … and the grant does not stand any more: its row is gone with the membership, or it is withdrawn.
        assert.ok(yetkiler().every((y) => y.iptal_at !== null), `${i.ad} — ${ad}: a grant still stands`)
        assert.ok(kayitlar().some((k) => k.olay === 'bitti'), `${i.ad} — ${ad}: the end of the grant is not in the record`)
        void id
      }
    }
  })

  it('A MEMBER WHO COMES BACK starts with nothing: removed, invited again, joined again — refused until the doctor gives the grant again', async () => {
    if (!KIT) return
    for (const i of islemler().filter((x) => x.kim === OB).slice(0, 1)) {
      i.ver()
      await gonder(SA, 'DELETE', `${K}/uye`, { hesapId: OB })
      const d = (await gonder(SA, 'POST', `${K}/davet`, { konum: 'on-buro' })).govde
      assert.equal((await gonder(OB, 'POST', `${K}/katil`, { kod: d.kod })).status, 200)
      await reddedilir(i, 'joined again')
      assert.equal((await gonder(HE, 'POST', `${K}/yetki`, { alanId: OB, tur: i.tur })).status, 200)
      assert.equal((await i.cagir()).status, 200)
    }
  })

  it('ANOTHER CLINIC: a grant row that exists while the member, or the doctor, is in another clinic opens nothing (the server\'s own check, with the database\'s keys bypassed)', async () => {
    if (!KIT) return
    const tasi = (hesap: string, klinik: string) => { (tablo('ulke_klinik_uyeleri').find((u) => u.doctor_id === hesap) as Satir).klinik_id = klinik }
    for (const i of islemler()) {
      sifirla(); i.ver(); tasi(i.kim, KL2); await reddedilir(i, 'the member is in another clinic, the grant row still says the first')
      sifirla(); i.ver(); tasi(i.kim, KL2); for (const y of yetkiler()) y.klinik_id = KL2; await reddedilir(i, 'the member and the grant row are in another clinic than the doctor')
      sifirla(); i.ver(); tasi(HE, KL2); await reddedilir(i, 'the doctor is in another clinic')
      sifirla(); i.ver(); tasi(HE, KL2); tasi(i.kim, KL2); await reddedilir(i, 'both moved, the grant row names the clinic they left')
      // a grant planted for a member of the OTHER clinic, naming the doctor of the first
      sifirla(); yetki(HE, OB2, i.tur, { klinik_id: KL2, ...(i.tur === 'paylasim' ? { patient_id: P1 } : {}) })
      assert.deepEqual(await cagir('GET', `${OB_YOL}?hekim=${HE}&hasta=${P1}`, { jeton: JETON[OB2] }), YOK_CEVABI)
      assert.deepEqual(await cagir('GET', `${PY_YOL}?hekim=${HE}&hasta=${P1}`, { jeton: JETON[OB2] }), YOK_CEVABI)
    }
  })

  it('A GRANT ROW THE DATABASE WOULD NEVER HOLD — a capability in the hands of a member whose position may not hold it, or given by a front-desk member — opens nothing (the server\'s own check of the position)', async () => {
    if (!KIT) return
    const once = () => { const h = hastaVerisi(); return () => assert.equal(hastaVerisi(), h) }
    // front-desk capabilities held by a doctor, an allied professional, the owner
    for (const kim of [H2, MU, SA, YO]) {
      sifirla(); for (const t of ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'] as const) yetki(HE, kim, t)
      const ayni = once()
      assert.deepEqual(await al(kim, `${OB_YOL}?hekim=${HE}&hasta=${P1}`), YOK_CEVABI, AD[kim])
      assert.deepEqual(await al(kim, `${OB_YOL}?hekim=${HE}&gun=${GUN()}`), YOK_CEVABI, AD[kim])
      assert.deepEqual(await gonder(kim, 'POST', OB_YOL, { hekimId: HE, islem: 'hasta', ad: 'QA New Patient', dil: paket.uygulama?.hastaDilleri[0] }), YOK_CEVABI, AD[kim])
      assert.deepEqual((await al(kim, OB_YOL)).govde, { hekimler: [] }, AD[kim])
      ayni()
    }
    // a share held by a front-desk member or a doctor; cover held by an allied professional or a front-desk member
    for (const [kim, tur] of [[OB, 'paylasim'], [H2, 'paylasim'], [MU, 'vekalet'], [OB, 'vekalet']] as const) {
      sifirla(); yetki(HE, kim, tur, tur === 'paylasim' ? { patient_id: P1 } : {})
      const ayni = once()
      assert.deepEqual(await al(kim, `${PY_YOL}?hekim=${HE}&hasta=${P1}`), YOK_CEVABI, `${tur} held by ${AD[kim]}`)
      assert.deepEqual((await al(kim, PY_YOL)).govde, { paylasilanlar: [] }, `${tur} held by ${AD[kim]}`)
      ayni()
    }
    // a grant "given" by a front-desk member (who has no patients by position, whatever rows exist under their id)
    sifirla(); HASTA_SAHIBI[pid(9)] = OB; HASTA_ADI[pid(9)] = 'QA Patient Stray'; hastaEkle(pid(9)); yetki(OB, H2, 'vekalet')
    assert.deepEqual(await al(H2, `${PY_YOL}?hekim=${OB}&hasta=${pid(9)}`), YOK_CEVABI)
    assert.equal(kullanim().length, 0)
  })

  it('ANOTHER COUNTRY: the same clinic, members and grant under another country\'s code open nothing here', async () => {
    if (!KIT) return
    for (const i of islemler()) {
      // the grant row is another country's
      sifirla(); i.ver(); for (const y of yetkiler()) y.ulke = YABANCI
      await reddedilir(i, 'the grant is another country\'s')
      // the membership rows are another country's
      sifirla(); i.ver(); for (const u of tablo('ulke_klinik_uyeleri')) if (u.doctor_id === i.kim) u.ulke = YABANCI
      await reddedilir(i, 'the member\'s membership is another country\'s')
      sifirla(); i.ver(); for (const u of tablo('ulke_klinik_uyeleri')) if (u.doctor_id === HE) u.ulke = YABANCI
      await reddedilir(i, 'the doctor\'s membership is another country\'s')
      // everything of the clinic is another country's, this country has none of it
      sifirla(); i.ver(); for (const t of ['ulke_klinikler', 'ulke_klinik_uyeleri', 'ulke_klinik_yetkileri']) for (const s of tablo(t)) s.ulke = YABANCI
      await reddedilir(i, 'the whole clinic is another country\'s')
      // the grant stands here, and the PATIENT is another country's
      if (i.hasta) {
        sifirla(); i.ver(); for (const t of ['ulke_hastalar', 'hasta_ulke_bilgisi', 'ulke_randevulari', 'ulke_muayeneler', 'ulke_notlar']) for (const s of tablo(t)) if (s.doctor_id === HE) s.ulke = YABANCI
        const r = await i.cagir()
        assert.ok(r.status === 404, `${i.ad} — the patient is another country's: ${JSON.stringify(r)}`)
        assert.ok(!KLINIK_ISARETI.test(JSON.stringify(r.govde)))
      }
      assert.ok(!vt.sorgular.some((q) => q.ulke === YABANCI), 'a statement named another country')
    }
  })

  it('ANOTHER DOCTOR\'S PATIENT: with a grant from one doctor, a patient or an appointment of another is "not found" — in the same clinic, in another, or nowhere', async () => {
    if (!KIT) return
    for (const h of [P3, P4, P5, YOK]) {
      sifirla()
      for (const t of ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'] as const) yetki(HE, OB, t)
      yetki(HE, H2, 'vekalet'); if (MUTTEFIK_ROLU) yetki(HE, MU, 'paylasim', { patient_id: P1 })
      const once = hastaVerisi(), kayitOnce = kayitlar().length
      const ad = HASTA_ADI[h] ?? 'a patient who does not exist'
      assert.deepEqual(await al(OB, `${OB_YOL}?hekim=${HE}&hasta=${h}`), YOK_CEVABI, ad)
      assert.deepEqual(await gonder(OB, 'POST', OB_YOL, { hekimId: HE, islem: 'randevu', hastaId: h, gun: GUN(), saat: '14:00', sureDk: SURE, yineDe: true }), YOK_CEVABI, ad)
      if (PORTAL) assert.deepEqual(await gonder(OB, 'POST', OB_YOL, { hekimId: HE, islem: 'portal', hastaId: h }), YOK_CEVABI, ad)
      if (FORM) assert.deepEqual(await gonder(OB, 'POST', OB_YOL, { hekimId: HE, islem: 'form', hastaId: h }), YOK_CEVABI, ad)
      if (h !== P3) assert.deepEqual(await al(H2, `${PY_YOL}?hekim=${HE}&hasta=${h}`), YOK_CEVABI, ad)
      if (MUTTEFIK_ROLU) { assert.deepEqual(await al(MU, `${PY_YOL}?hekim=${HE}&hasta=${h}`), YOK_CEVABI, ad); assert.deepEqual(await al(MU, `${PY_YOL}?hekim=${HE}&hasta=${h}&kart=1`), YOK_CEVABI, ad) }
      assert.equal(hastaVerisi(), once, ad)
      assert.equal(kayitlar().length, kayitOnce, `${ad}: a request for somebody else's patient was recorded as a read of HE's`)
    }
    // an appointment of another doctor, by its id
    sifirla(); yetki(HE, OB, 'on-buro-randevu')
    for (const randevuId of [R3, YOK]) {
      assert.deepEqual(await gonder(OB, 'PATCH', OB_YOL, { hekimId: HE, randevuId, durum: 'iptal' }), YOK_CEVABI)
      assert.deepEqual(await gonder(OB, 'PATCH', OB_YOL, { hekimId: HE, randevuId, gun: GUN(), saat: '16:00', sureDk: SURE, yineDe: true }), YOK_CEVABI)
    }
    assert.equal(tablo('ulke_randevulari').find((r) => r.id === R3)?.durum, 'planlandi')
    // a share is PER PATIENT: the second patient of the same doctor
    if (MUTTEFIK_ROLU) { sifirla(); yetki(HE, MU, 'paylasim', { patient_id: P1 }); assert.deepEqual(await al(MU, `${PY_YOL}?hekim=${HE}&hasta=${P2}`), YOK_CEVABI) }
    // a share gives no appointment list and no search
    if (MUTTEFIK_ROLU) { sifirla(); yetki(HE, MU, 'paylasim', { patient_id: P1 }); assert.deepEqual(await al(MU, `${PY_YOL}?hekim=${HE}&gun=${GUN()}`), YOK_CEVABI); assert.deepEqual(await al(MU, `${PY_YOL}?hekim=${HE}&q=QA+Patient`), YOK_CEVABI) }
  })

  it('BY POSITION ALONE, NOBODY: the owner, an administrator, a doctor, an allied professional, a front-desk member, the other clinic\'s people, an account in no clinic — each asks every request in the table and is refused', async () => {
    if (!KIT) return
    const hepsi = islemler()
    for (const kim of [SA, YO, HE, H2, MU, MU2, OB, S2, OB2, H3, BO]) {
      sifirla()
      // Everybody ELSE holds every grant there is from HE: the asker holds none.
      for (const i of hepsi) if (i.kim !== kim) { try { i.ver() } catch { /* the same grant twice */ } }
      const once = hastaVerisi(), kayitOnce = kullanim().length
      const j = JETON[kim]
      const istekler: [string, string, unknown?][] = [
        ['GET', `${OB_YOL}?hekim=${HE}&gun=${GUN()}`], ['GET', `${OB_YOL}?hekim=${HE}&q=QA+Patient`], ['GET', `${OB_YOL}?hekim=${HE}&hasta=${P1}`],
        ['POST', OB_YOL, { hekimId: HE, islem: 'hasta', ad: 'QA New Patient', dil: paket.uygulama?.hastaDilleri[0] }],
        ['POST', OB_YOL, { hekimId: HE, islem: 'randevu', hastaId: P1, gun: GUN(), saat: '14:00', sureDk: SURE, yineDe: true }],
        ['POST', OB_YOL, { hekimId: HE, islem: 'portal', hastaId: P1 }], ['POST', OB_YOL, { hekimId: HE, islem: 'form', hastaId: P1 }],
        ['PATCH', OB_YOL, { hekimId: HE, randevuId: R1, durum: 'iptal' }],
        ['GET', `${PY_YOL}?hekim=${HE}&hasta=${P1}`], ['GET', `${PY_YOL}?hekim=${HE}&hasta=${P1}&kart=1`], ['GET', `${PY_YOL}?hekim=${HE}&q=QA+Patient`], ['GET', `${PY_YOL}?hekim=${HE}&gun=${GUN()}`],
      ]
      for (const [y, yol, govde] of istekler) {
        // (the three members of the table are refused on every request that is not THEIR capability's)
        if ((kim === OB && yol.startsWith(OB_YOL)) || (kim === MU && yol.includes('hasta=')) || (kim === H2 && yol.startsWith(PY_YOL))) continue
        if (kim === HE) continue // the doctor asking for their own patients through a grant: covered below
        assert.deepEqual(await cagir(y, yol, { jeton: j, ...(govde ? { govde } : {}) }), YOK_CEVABI, `${AD[kim]}: ${y} ${yol}`)
      }
      assert.equal(hastaVerisi(), once, AD[kim])
      assert.equal(kullanim().length, kayitOnce, AD[kim])
      // … and what they hold is: nothing
      const liste = (await cagir('GET', `${K}/yetki`, { jeton: j })).govde
      if (![OB, MU, H2, HE].includes(kim)) assert.deepEqual(liste.alinan, [], AD[kim])
    }
    // A doctor does not reach their OWN patients through these routes either: there is no grant from oneself.
    sifirla()
    for (const yol of [`${OB_YOL}?hekim=${HE}&hasta=${P1}`, `${PY_YOL}?hekim=${HE}&hasta=${P1}`]) assert.deepEqual(await al(HE, yol), YOK_CEVABI)
  })

  it('A CAPABILITY THE PACK HAS NOT SWITCHED ON: a grant of it that stands opens nothing', async () => {
    if (!KIT) return
    for (const i of islemler()) {
      sifirla(); i.ver(); ayarla({ yetkiTurleri: SENTETIK().yetkiTurleri.filter((t) => t !== i.tur) })
      await reddedilir(i, 'the pack does not have this capability')
      // … and the member's list of grants does not show it
      assert.deepEqual((await al(i.kim, `${K}/yetki`)).govde.alinan, [])
      ayarla()
    }
  })

  it('A ROLE THAT MAY NOT HOLD IT: a share for a member who is no allied professional (or whose role the pack does not list); cover for a member who works in no doctor\'s role', async () => {
    if (!KIT) return
    for (const i of islemler().filter((x) => x.tur === 'paylasim')) {
      for (const [ad, hazirla] of [['no role', () => rolYaz(MU, null)], ['a doctor\'s role', () => rolYaz(MU, HEKIM_ROLU)], ['the pack lists no role', () => ayarla({ paylasimRolleri: [] })], ...(MUTTEFIK_ROLU_LISTEDE_YOK ? [['an allied role the pack does not list', () => rolYaz(MU, MUTTEFIK_ROLU_LISTEDE_YOK)] as const] : [])] as const) {
        sifirla(); ayarla(); i.ver(); hazirla()
        await reddedilir(i, ad)
      }
    }
    for (const i of islemler().filter((x) => x.tur === 'vekalet')) for (const rol of [null, MUTTEFIK_ROLU || null]) {
      sifirla(); i.ver(); rolYaz(H2, rol)
      await reddedilir(i, `cover held by a member whose role is ${String(rol)}`)
    }
  })

  it('NO RECORD, NO READ: when the record row cannot be written the request is refused and nothing is read or written for it', async () => {
    if (!KIT) return
    for (const i of islemler()) {
      sifirla(); i.ver()
      vt.boz.yaz.add('ulke_klinik_erisim_kayitlari')
      vt.sorgular.length = 0
      await reddedilir(i, 'the record cannot be written')
      // After the failed record row, no statement touched a patient table or a note.
      const sira = vt.sorgular.map((q) => `${q.islem} ${q.tablo}`)
      const kayitSirasi = sira.lastIndexOf('insert ulke_klinik_erisim_kayitlari')
      assert.ok(kayitSirasi >= 0, `${i.ad}: the record was not attempted`)
      assert.deepEqual(sira.slice(kayitSirasi + 1), [], `${i.ad}: something was read or written after the record failed: ${sira.slice(kayitSirasi + 1).join(', ')}`)
      vt.boz.yaz.clear()
    }
  })

  it('THE RECORD COMES FIRST: in an allowed request the record row is written before any note, appointment list or write', async () => {
    if (!KIT) return
    for (const i of islemler()) {
      sifirla(); i.ver(); vt.sorgular.length = 0
      assert.equal((await i.cagir()).status, 200, i.ad)
      const sira = vt.sorgular.map((q) => `${q.islem} ${q.tablo}`)
      const kayit = sira.indexOf('insert ulke_klinik_erisim_kayitlari')
      assert.ok(kayit >= 0, i.ad)
      const once = sira.slice(0, kayit)
      for (const t of ['ulke_notlar', 'ulke_muayeneler', 'not_dil_kaydi', 'muayene_dil_kaydi', 'ulke_hasta_formlari', 'ulke_arac_kayitlari', 'ulke_hasta_ozetleri', 'ulke_portal_erisimleri']) assert.ok(!once.some((s) => s.endsWith(` ${t}`)), `${i.ad}: ${t} was reached before the record row`)
      for (const s of once) assert.ok(s.startsWith('select '), `${i.ad}: "${s}" was written before the record row`)
    }
  })
})

// ═════════════════════════ 4. WHAT A FRONT-DESK MEMBER'S ANSWERS CARRY ═════════════════════════

describe('clinic accounts — the front desk never receives a clinical field (asserted on the keys of every answer)', () => {
  const KART = ['ad', 'dogumTarihi', 'id', 'otaIsmi', 'telefon']
  const RANDEVU = ['baslangic', 'bitis', 'durum', 'gun', 'hastaAdi', 'hastaId', 'id', 'mesaiDisi', 'saat', 'sureDk']
  /** Every key a front-desk answer may carry anywhere, on any route of the workspace. A new key fails here. */
  const IZINLI = new Set([...KART, ...RANDEVU, 'hekimler', 'hekimId', 'yetkiler', 'gunler', 'bugun', 'randevular', 'randevu', 'hastalar', 'hasta', 'yol', 'pin', 'sonGecerlilik', 'yeniForm', 'erisim', 'davetDili'])
  /** Keys that would mean a clinical or an identifying field got through. */
  const YASAK = ['neden', 'seansId', 'notId', 'cinsiyet', 'dil', 'ulusalKimlik', 'metin', 'icerik', 's', 'o', 'a', 'p', 'alanlar', 'cevaplar', 'ozet', 'sonuc', 'girdiler', 'formId', 'muayeneler', 'notlar', 'formlar', 'kayitlar', 'olusturuldu', 'name_encrypted', 'neden_encrypted', 'doctor_id', 'patient_id']
  const hepsiniVer = () => { for (const t of ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'] as const) yetki(HE, OB, t) }

  it('every answer of the workspace, with every front-desk grant held: exactly the keys of the card and of the appointment, and no marker of the doctor\'s clinical data', async () => {
    if (!KIT) return
    hepsiniVer()
    // more of the doctor's data, each with its marker: a tool record and an intake form of the patient
    tablo('ulke_arac_kayitlari').push({ id: 'a1', ulke: BU, doctor_id: HE, patient_id: P1, arac: 'qa-arac', kayit_encrypted: sifrele('QA-GIZLI-ARAC-KAYDI'), takip_tarihi: null, kapandi_at: null, created_at: simdiIso() })
    const cevaplar: [string, Cevap][] = [
      ['who gave what', await al(OB, OB_YOL)],
      ['appointments of a day', await al(OB, `${OB_YOL}?hekim=${HE}&gun=${GUN()}`)],
      ['appointments of a week', await al(OB, `${OB_YOL}?hekim=${HE}&gun=${GUN()}&gorunum=hafta`)],
      ['search by name', await al(OB, `${OB_YOL}?hekim=${HE}&q=QA+Patient`)],
      ['search by phone', await al(OB, `${OB_YOL}?hekim=${HE}&q=5550101`)],
      ['the card', await al(OB, `${OB_YOL}?hekim=${HE}&hasta=${P1}`)],
      ['a new patient', await gonder(OB, 'POST', OB_YOL, { hekimId: HE, islem: 'hasta', ad: 'QA New Patient', otaIsmi: 'QA Mid', dogumTarihi: '2001-02-03', cinsiyet: 'male', telefon: '+000 11', dil: paket.uygulama?.hastaDilleri[0], ulusalKimlik: '11223344556677' })],
      ['a booking', await gonder(OB, 'POST', OB_YOL, { hekimId: HE, islem: 'randevu', hastaId: P1, gun: GUN(), saat: '14:00', sureDk: SURE, yineDe: true, neden: 'QA-GIZLI-ON-BURO-NEDENI' })],
      ['a status', await gonder(OB, 'PATCH', OB_YOL, { hekimId: HE, randevuId: R1, durum: 'geldi' })],
      ['a move', await gonder(OB, 'PATCH', OB_YOL, { hekimId: HE, randevuId: R1, gun: GUN(), saat: '16:00', sureDk: SURE, yineDe: true })],
      ...(PORTAL ? [['the portal link', await gonder(OB, 'POST', OB_YOL, { hekimId: HE, islem: 'portal', hastaId: P2 })] as [string, Cevap]] : []),
      ...(FORM ? [['the intake form request', await gonder(OB, 'POST', OB_YOL, { hekimId: HE, islem: 'form', hastaId: P1 })] as [string, Cevap]] : []),
    ]
    for (const [ad, r] of cevaplar) {
      assert.equal(r.status, 200, `${ad}: ${JSON.stringify(r)}`)
      const anahtar = tumAnahtarlar(r.govde)
      for (const k of anahtar) assert.ok(IZINLI.has(k), `${ad}: the answer carries the key "${k}"`)
      for (const k of YASAK) assert.ok(!anahtar.has(k), `${ad}: the answer carries the forbidden key "${k}"`)
      const metin = JSON.stringify(r.govde)
      assert.ok(!KLINIK_ISARETI.test(metin), `${ad}: the answer carries a marker of the doctor's clinical data: ${metin.slice(0, 300)}`)
      assert.ok(!metin.includes('QA-GIZLI-ARAC-KAYDI') && !metin.includes('11223344556677'))
    }
    const c = Object.fromEntries(cevaplar)
    assert.deepEqual(c['who gave what'].govde, { hekimler: [{ hekimId: HE, ad: AD[HE], yetkiler: ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'] }] })
    assert.deepEqual(anahtarlar(c['the card'].govde.hasta), KART)
    assert.deepEqual(c['the card'].govde.hasta, { id: P1, ad: HASTA_ADI[P1], otaIsmi: 'QA Second', dogumTarihi: '1990-05-05', telefon: GIZLI.telefon })
    for (const ad of ['search by name', 'search by phone']) for (const h of c[ad].govde.hastalar) assert.deepEqual(anahtarlar(h), KART, ad)
    assert.deepEqual(c['search by name'].govde.hastalar.map((h: Satir) => h.id).sort(), [P1, P2].sort(), 'the search answers the granting doctor\'s patients and nobody else\'s')
    for (const ad of ['appointments of a day', 'appointments of a week']) { assert.ok(c[ad].govde.randevular.length >= 1); for (const r of c[ad].govde.randevular) assert.deepEqual(anahtarlar(r), RANDEVU, ad) }
    for (const ad of ['a booking', 'a status', 'a move']) assert.deepEqual(anahtarlar(c[ad].govde.randevu), RANDEVU, ad)
    assert.deepEqual(anahtarlar(c['a new patient'].govde.hasta), KART)
    if (PORTAL) assert.deepEqual(anahtarlar(c['the portal link'].govde), ['pin', 'sonGecerlilik', 'yol'])
    if (FORM) assert.deepEqual(anahtarlar(c['the intake form request'].govde).filter((k) => !['pin', 'yol'].includes(k)), ['davetDili', 'erisim', 'yeniForm'])

    // WHAT WAS WRITTEN: the new patient is the DOCTOR's, carries no identity number, and the booking no reason.
    const yeni = tablo('ulke_hastalar').find((h) => h.id === c['a new patient'].govde.hasta.id) as Satir
    assert.deepEqual([yeni.ulke, yeni.doctor_id], [BU, HE])
    assert.equal(tablo('hasta_ulke_bilgisi').find((e) => e.patient_id === yeni.id)?.ulusal_kimlik_encrypted ?? null, null, 'an identity number typed at the front desk was stored')
    const rezervasyon = tablo('ulke_randevulari').find((r) => r.id === c['a booking'].govde.randevu.id) as Satir
    assert.deepEqual([rezervasyon.doctor_id, rezervasyon.patient_id, rezervasyon.neden_encrypted], [HE, P1, null])
    // the reason the DOCTOR wrote on the appointment the front desk moved is still there, unread and unchanged
    assert.ok(tablo('ulke_randevulari').find((r) => r.id === R1)?.neden_encrypted)
  })

  it('a search cannot be used to test for something the card does not show: an identity number finds nobody; fewer than two characters is refused; there is no "all patients"', async () => {
    if (!KIT) return
    hepsiniVer()
    for (const q of [GIZLI.kimlik, GIZLI.kimlik.slice(0, 6), 'female', GIZLI.not]) assert.deepEqual((await al(OB, `${OB_YOL}?hekim=${HE}&q=${encodeURIComponent(q)}`)).govde, { hastalar: [] }, q)
    for (const q of ['', ' ', 'Q']) assert.deepEqual(await al(OB, `${OB_YOL}?hekim=${HE}&q=${encodeURIComponent(q)}`), { status: 400, govde: { code: 'ARAMA_KISA' } }, `"${q}"`)
    assert.equal(kullanim().filter((k) => k.ne === 'hasta-arama').length, 4, 'a refused search is not recorded as a read; an allowed one is')
    // at most twenty cards
    for (let n = 0; n < 30; n++) { const id = `30000000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`; HASTA_ADI[id] = `QA Crowd ${n}`; HASTA_SAHIBI[id] = HE; hastaEkle(id) }
    assert.equal((await al(OB, `${OB_YOL}?hekim=${HE}&q=QA+Crowd`)).govde.hastalar.length, 20)
  })

  it('"done" is the doctor\'s: the front desk sets arrived, did not come, cancelled, planned — never done', async () => {
    if (!KIT) return
    hepsiniVer()
    assert.deepEqual(await gonder(OB, 'PATCH', OB_YOL, { hekimId: HE, randevuId: R1, durum: 'tamamlandi' }), { status: 409, govde: { code: 'GECIS_YOK' } })
    assert.equal(tablo('ulke_randevulari').find((r) => r.id === R1)?.durum, 'planlandi')
    assert.deepEqual(await gonder(OB, 'PATCH', OB_YOL, { hekimId: HE, randevuId: R1, durum: 'bilinmeyen' }), { status: 400, govde: { code: 'GECERSIZ', alan: 'durum' } })
    for (const durum of ['geldi', 'gelmedi', 'planlandi', 'iptal']) assert.equal((await gonder(OB, 'PATCH', OB_YOL, { hekimId: HE, randevuId: R1, durum })).status, 200, durum)
    // No double booking through the front desk either.
    const dolu = { hekimId: HE, islem: 'randevu', hastaId: P2, gun: GUN(), saat: '12:00', sureDk: SURE, yineDe: true }
    assert.equal((await gonder(OB, 'POST', OB_YOL, dolu)).status, 200)
    assert.deepEqual(await gonder(OB, 'POST', OB_YOL, dolu), { status: 409, govde: { code: 'DOLU' } })
  })

  it('A GRANT DOES NOT OPEN THE DOCTOR\'S OWN ROUTES: with every front-desk grant, the patient file, the note, the visit, the form, the tool records, the portal controls and the appointment are "not found"', async () => {
    if (!KIT) return
    hepsiniVer()
    yetki(HE, H2, 'vekalet'); if (MUTTEFIK_ROLU) yetki(HE, MU, 'paylasim', { patient_id: P1 })
    const once = hastaVerisi()
    for (const kim of [OB, H2, MU, SA, YO]) {
      const j = JETON[kim]
      const istekler: [string, string, unknown?][] = [
        ['GET', `/api/ulke/hasta?id=${P1}`], ['GET', `/api/ulke/not?id=${N1}`], ['GET', `/api/ulke/not?id=${N1T}`], ['GET', `/api/ulke/muayene?seans=${S1}`], ['GET', `/api/ulke/muayene?id=${S1}`],
        ['GET', `/api/ulke/randevu?id=${R1}`], ['GET', `/api/ulke/randevular?hasta=${P1}`], ['PATCH', '/api/ulke/randevu', { id: R1, durum: 'iptal' }],
        ['POST', '/api/ulke/randevu', { hastaId: P1, gun: GUN(), saat: '17:00', sureDk: SURE, yineDe: true }],
        ['GET', `/api/ulke/hasta-formu?hasta=${P1}`], ['GET', `/api/ulke/hasta-portali?hasta=${P1}`], ['POST', '/api/ulke/hasta-portali', { hastaId: P1 }], ['GET', `/api/ulke/arac-kaydi?hasta=${P1}`],
      ]
      for (const [y, yol, govde] of istekler) {
        const r = await cagir(y, yol, { jeton: j, ...(govde ? { govde } : {}) })
        assert.equal(r.status, 404, `${AD[kim]}: ${y} ${yol} → ${JSON.stringify(r)}`)
        assert.ok(!KLINIK_ISARETI.test(JSON.stringify(r.govde)))
      }
      // their own lists are their own: nothing of HE's
      for (const yol of ['/api/ulke/hastalar', '/api/ulke/bugun', `/api/ulke/randevular?gun=${GUN()}`]) {
        const metin = JSON.stringify((await cagir('GET', yol, { jeton: j })).govde)
        for (const m of [HASTA_ADI[P1], HASTA_ADI[P2], P1, P2, R1, N1, GIZLI.not, GIZLI.taslak, GIZLI.dokum]) assert.ok(!metin.includes(m), `${AD[kim]}: ${yol} shows ${m}`)
      }
    }
    assert.equal(hastaVerisi(), once)
  })
})

// ═════════════════════════ 5. the clinic's schedule, the share, cover, the record ═════════════════════════

describe('clinic accounts — the clinic\'s schedule, by position and therefore without any patient', () => {
  it('the owner and an administrator see WHEN each member has an appointment — and nothing of the patient; nobody else sees it at all', async () => {
    if (!KIT) return
    for (const kim of [SA, YO]) {
      const r = await al(kim, `${K}/takvim?gun=${GUN()}`)
      assert.equal(r.status, 200, JSON.stringify(r))
      assert.deepEqual(anahtarlar(r.govde), ['bugun', 'dilimler', 'gunler', 'hekimler'])
      assert.deepEqual(r.govde.dilimler.map((d: Satir) => d.hekimId).sort(), [HE, H2].sort())
      for (const d of r.govde.dilimler) assert.deepEqual(anahtarlar(d), ['baslangic', 'bitis', 'durum', 'gun', 'hekimId', 'saat', 'sureDk'])
      for (const h of r.govde.hekimler) assert.deepEqual(anahtarlar(h), ['ad', 'hekimId'])
      // the members who see patients, of THIS clinic; never the front desk, never the other clinic
      assert.deepEqual(r.govde.hekimler.map((h: Satir) => h.hekimId).sort(), [SA, YO, YO2, HE, H2, MU, MU2].sort())
      const metin = JSON.stringify(r.govde)
      for (const m of [...Object.keys(HASTA_ADI), ...Object.values(HASTA_ADI), R1, R3, S2, H3]) assert.ok(!metin.includes(m), `${AD[kim]} saw ${m} on the clinic's schedule`)
      assert.ok(!KLINIK_ISARETI.test(metin))
      for (const k of ['hastaId', 'hastaAdi', 'neden', 'id', 'seansId', 'patient_id']) assert.ok(!tumAnahtarlar(r.govde.dilimler).has(k), k)
    }
    for (const kim of [HE, H2, MU, OB, BO]) assert.deepEqual(await al(kim, `${K}/takvim?gun=${GUN()}`), YOK_CEVABI, AD[kim])
    // the other clinic's owner sees the other clinic's, and none of this one's
    const s2 = (await al(S2, `${K}/takvim?gun=${GUN()}`)).govde
    assert.deepEqual(s2.dilimler, [])
    assert.deepEqual(s2.hekimler.map((h: Satir) => h.hekimId).sort(), [S2, H3].sort())
    assert.equal(kullanim().length, 0)
  })
})

describe('clinic accounts — a share and cover: approved notes only, read-only', () => {
  const NOT = ['alanAnahtarlari', 'dil', 'icerik', 'muayeneTarihi', 'notId', 'onayTarihi', 'sablon']

  it('the reader gets the APPROVED note field by field — never the draft, the transcript, a phone or an identity number', async () => {
    if (!KIT) return
    yetki(HE, H2, 'vekalet'); if (MUTTEFIK_ROLU) yetki(HE, MU, 'paylasim', { patient_id: P1 })
    for (const kim of [H2, ...(MUTTEFIK_ROLU ? [MU] : [])]) {
      const r = await al(kim, `${PY_YOL}?hekim=${HE}&hasta=${P1}`)
      assert.equal(r.status, 200, JSON.stringify(r))
      assert.deepEqual(anahtarlar(r.govde), ['hasta', 'notlar'])
      assert.deepEqual(r.govde.hasta, { id: P1, ad: HASTA_ADI[P1], otaIsmi: 'QA Second', dogumTarihi: '1990-05-05' })
      assert.deepEqual(r.govde.notlar.map((n: Satir) => n.notId), [N1], 'exactly the approved note; the draft is not there')
      for (const n of r.govde.notlar) { assert.deepEqual(anahtarlar(n), NOT); assert.deepEqual(anahtarlar(n.icerik), ['a', 'o', 'p', 's']) }
      assert.equal(r.govde.notlar[0].icerik.s, `${GIZLI.not} S`)
      const metin = JSON.stringify(r.govde)
      for (const m of [GIZLI.taslak, GIZLI.dokum, GIZLI.kimlik, GIZLI.telefon, GIZLI.neden, N1T]) assert.ok(!metin.includes(m), `${AD[kim]} received ${m}`)
      for (const k of ['metin', 'telefon', 'ulusalKimlik', 'ikinci', 'muayene', 'konusma', 'cinsiyet']) assert.ok(!tumAnahtarlar(r.govde).has(k), k)
    }
    // a note approved a moment ago is read; one that lost its approval is not (asked of the note itself)
    ;(tablo('ulke_notlar').find((n) => n.id === N1) as Satir).approved_at = null
    assert.deepEqual((await al(H2, `${PY_YOL}?hekim=${HE}&hasta=${P1}`)).govde.notlar, [])
  })

  it('what stands open to a member: each share with its doctor and patient id, each cover with its doctor and its end — and nothing of a patient', async () => {
    if (!KIT) return
    yetki(HE, H2, 'vekalet'); if (MUTTEFIK_ROLU) yetki(HE, MU, 'paylasim', { patient_id: P1 })
    const h2 = (await al(H2, PY_YOL)).govde
    assert.deepEqual(h2.paylasilanlar.map((p: Satir) => [p.tur, p.hekimId, p.hekimAdi, p.hastaId]), [['vekalet', HE, AD[HE], null]])
    assert.deepEqual(anahtarlar(h2.paylasilanlar[0]), ['bitis', 'hastaId', 'hekimAdi', 'hekimId', 'tur', 'yetkiId'])
    if (MUTTEFIK_ROLU) {
      const mu = (await al(MU, PY_YOL)).govde
      assert.deepEqual(mu.paylasilanlar.map((p: Satir) => [p.tur, p.hekimId, p.hastaId]), [['paylasim', HE, P1]])
      for (const ad of Object.values(HASTA_ADI)) assert.ok(!JSON.stringify(mu).includes(ad))
      rolYaz(MU, null)
      assert.deepEqual((await al(MU, PY_YOL)).govde, { paylasilanlar: [] }, 'a share held by a member who no longer works in an allied role is not listed')
    }
    for (const kim of [SA, YO, OB, BO, HE]) assert.deepEqual((await al(kim, PY_YOL)).govde, { paylasilanlar: [] }, AD[kim])
    assert.equal(kullanim().length, 0)
  })

  it('COVER IS READ-ONLY: its appointments carry the reason and cannot be changed; a visit on the covered doctor\'s patient cannot be recorded by the covering doctor', async () => {
    if (!KIT) return
    yetki(HE, H2, 'vekalet')
    const r = await al(H2, `${PY_YOL}?hekim=${HE}&gun=${GUN()}`)
    assert.deepEqual(r.govde.randevular.map((x: Satir) => [x.id, x.hastaAdi, x.neden]), [[R1, HASTA_ADI[P1], GIZLI.neden]])
    assert.deepEqual(anahtarlar(r.govde.randevular[0]), ['baslangic', 'bitis', 'durum', 'gun', 'hastaAdi', 'hastaId', 'id', 'neden', 'saat', 'sureDk'])
    assert.deepEqual((await al(H2, `${PY_YOL}?hekim=${HE}&q=QA+Patient`)).govde.hastalar.map((h: Satir) => anahtarlar(h)), [['ad', 'dogumTarihi', 'id', 'otaIsmi'], ['ad', 'dogumTarihi', 'id', 'otaIsmi']])
    const once = hastaVerisi()
    // the covering doctor's own routes, aimed at the covered doctor's patient, appointment and note
    for (const [y, yol, govde] of [
      ['PATCH', '/api/ulke/randevu', { id: R1, durum: 'iptal' }], ['POST', '/api/ulke/randevu', { hastaId: P1, gun: GUN(), saat: '17:00', sureDk: SURE, yineDe: true }],
      ['POST', '/api/ulke/muayene', { hastaId: P1, sesYolu: `${BU}/${H2}/qa.webm`, riza: true }], ['POST', '/api/ulke/not', { seansId: S1 }], ['PATCH', '/api/ulke/not', { notId: N1T, icerik: { s: 'x', o: '', a: '', p: '' } }],
    ] as const) {
      const c = await cagir(y, yol, { jeton: JETON[H2], govde })
      assert.ok(c.status >= 400, `${y} ${yol} → ${JSON.stringify(c)}`)
    }
    assert.equal(hastaVerisi(), once, 'something of the covered doctor was written')
    assert.equal(tablo('ulke_muayeneler').filter((m) => m.patient_id === P1).every((m) => m.doctor_id === HE), true)
  })
})

describe('clinic accounts — the record is the owning doctor\'s list', () => {
  it('the doctor reads everything done about their patients, with names; the owner, an administrator and the member who did it read none of it', async () => {
    if (!KIT) return
    const gun = GUN()
    assert.equal((await gonder(HE, 'POST', `${K}/yetki`, { alanId: OB, tur: 'on-buro-randevu' })).status, 200)
    mock.timers.setTime(BASLANGIC_ANI + 1000)
    await al(OB, `${OB_YOL}?hekim=${HE}&hasta=${P1}`)
    mock.timers.setTime(BASLANGIC_ANI + 2000)
    await al(OB, `${OB_YOL}?hekim=${HE}&gun=${gun}`)
    mock.timers.setTime(BASLANGIC_ANI + 3000)
    await gonder(SA, 'DELETE', `${K}/uye`, { hesapId: OB })
    const r = await al(HE, `${K}/kayit`)
    assert.equal(r.status, 200)
    assert.deepEqual(r.govde.kayitlar.map((k: Satir) => [k.olay, k.tur, k.ne, k.kisiAdi, k.alanAdi, k.hastaAdi]).reverse(), [
      ['verildi', 'on-buro-randevu', null, AD[HE], AD[OB], ''],
      ['okuma', 'on-buro-randevu', 'hasta-karti', AD[OB], AD[OB], HASTA_ADI[P1]],
      ['okuma', 'on-buro-randevu', 'randevu-listesi', AD[OB], AD[OB], ''],
      ['bitti', 'on-buro-randevu', null, AD[SA], AD[OB], ''],
    ])
    for (const k of r.govde.kayitlar) assert.deepEqual(anahtarlar(k), ['alanAdi', 'alanId', 'an', 'hastaAdi', 'hastaId', 'id', 'kisiAdi', 'kisiId', 'ne', 'olay', 'tur'])
    for (const kim of [SA, YO, OB, H2, S2, BO]) assert.deepEqual((await al(kim, `${K}/kayit`)).govde, { kayitlar: [] }, AD[kim])
    // no id in the address changes whose record is read
    assert.deepEqual((await al(SA, `${K}/kayit?hekim=${HE}&doctor_id=${HE}`)).govde, { kayitlar: [] })
    // the record cannot be changed or deleted through the application's door
    const T = await import('../uygulama/tablolar')
    const sb = vt.createClient() as never
    assert.equal((await T.ulkeTablosu(sb, 'ulke_klinik_erisim_kayitlari').update({ kisi_id: HE }).eq('doctor_id', HE)).error?.code, '23514')
    assert.equal((await T.ulkeTablosu(sb, 'ulke_klinik_erisim_kayitlari').delete().eq('doctor_id', HE)).error?.code, '23514')
    assert.equal(kayitlar().length, 4)
  })

  it('another country\'s record rows for the same doctor id are not this doctor\'s list', async () => {
    if (!KIT) return
    kayitlar().push({ id: 'k-yabanci', ulke: YABANCI, doctor_id: HE, kisi_id: OB, alan_id: OB, patient_id: null, yetki_id: null, tur: 'on-buro-randevu', olay: 'okuma', ne: 'randevu-listesi', created_at: simdiIso() })
    assert.deepEqual((await al(HE, `${K}/kayit`)).govde, { kayitlar: [] })
  })
})
