/**
 * NOTYA-ULKE-ARACLAR-01 — KEEPING A TOOL'S RESULT ON A PATIENT and THE FOLLOW-UP LIST (migration 139), for whatever
 * pack is active. Runs ONCE PER PACK.
 *
 * TWO LAYERS.
 *   1. THE KIT'S RULES, with a tool list of NO COUNTRY (kit tools, gated to roles of the active pack, built here):
 *      the server works the result out again; an incomplete form is not kept; the role gate; the follow-up day is
 *      the doctor's, from today on in the ACCOUNT's time zone; the content is one encrypted value bound to its row;
 *      the follow-up list; closing once; isolation in every direction. Runs for every pack that brings the
 *      signed-in application.
 *   2. THE ROUTE, with THE PACK'S OWN tools: a pack without the tools area answers "not found" on every method; a
 *      pack with it is held to the same behaviour through the real handlers.
 *
 * Real handlers and real library code. The database and sign-in are stand-ins inside this process; any network
 * address fails the test. Synthetic data only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'
// The server clock is NOT the country's: every day must come from the account's time zone.
process.env.TZ = 'America/Los_Angeles'

import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani, type Satir } from '@/lib/ulke/testing/sahteVeritabani'
import { ornekGirdiler } from '@/lib/ulke/testing/aracOrnekleri'
import { KIT_ARACLARI } from './katalog'
import type { AracGirdisi, AracTanimi, UlkeAraclari } from './tipler'

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
/** The kit's rules can run: the pack brings the signed-in application and at least two roles. */
let KIT = false
/** The pack switches the tools area on: its route exists. */
let ROTA = false
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let sifreCoz: (s: string) => string
let K: typeof import('./kayit')
let Z: typeof import('../uygulama/zaman')
let rota: Mod
let ROLLER: readonly string[] = []
let SENTETIK: UlkeAraclari
let BUGUN = ''

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001' // patient of doctor A
const H2 = '30000000-0000-4000-8000-000000000002' // second patient of doctor A
const H3 = '30000000-0000-4000-8000-000000000003' // patient of doctor B
const YOK = '77777777-7777-4777-8777-777777777777'
const AD: Record<string, string> = { [H1]: 'QA Patient One', [H2]: 'QA Patient Two', [H3]: 'QA Patient Three' }
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()
const GUN_MS = 86_400_000

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const kayitlar = () => tablo('ulke_arac_kayitlari')
const simdiIso = () => new Date().toISOString()

/** A tool whose arithmetic needs nothing of a country and no date: its result is the same on any day, in any pack. */
const yansiz = (t: AracTanimi) => t.tur !== 'ekran' && !(t.parametreler ?? []).length && !t.alanlar.some((a) => a.lab || a.olcu || a.tur === 'tarih')
const ortam = () => ({ bugun: BUGUN, p: {} })
const doluGirdi = (t: AracTanimi): AracGirdisi | null => ornekGirdiler(t).find((g) => t.hesapla(g, ortam()).tamam) ?? null
/** An input as the screen holds it (what was typed). */
const hamGirdi = (g: AracGirdisi) => Object.fromEntries(Object.entries(g).filter(([, v]) => v !== null && v !== false).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v])) as Record<string, string | boolean>
/** Two kit tools for the role gate: T1 for the first role of the pack, T2 for the second. */
let T1: AracTanimi, T2: AracTanimi
let HAM1: Record<string, string | boolean>

function hastaEkle(id: string, doktor: string, ulke = BU) {
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: AD[id] ?? 'QA Foreign' })), dob_encrypted: sifrele('1990-05-05'), gender_encrypted: null, phone_encrypted: null, is_active: true, created_at: simdiIso() })
  tablo('hasta_ulke_bilgisi').push({ patient_id: id, ulke, doctor_id: doktor, dil: paket.uygulama?.hastaDilleri[0] ?? '', ota_ismi_encrypted: null, ulusal_kimlik_encrypted: null })
}
const rolYaz = (doktor: string, rol: string | null) => {
  vt.tablolar.hekim_rolu = tablo('hekim_rolu').filter((x) => x.doctor_id !== doktor)
  if (rol) tablo('hekim_rolu').push({ ulke: BU, doctor_id: doktor, rol })
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
  if (ROLLER[0]) { rolYaz(DA, ROLLER[0]); rolYaz(DB, ROLLER[0]) }
  hastaEkle(H1, DA); hastaEkle(H2, DA); hastaEkle(H3, DB)
}

const kaydet = (doktor: string, hasta: string, ek: { arac?: unknown; ham?: unknown; takipTarihi?: unknown } = {}, icerik = SENTETIK) => K.aracKaydet(sb(), doktor, { hastaId: hasta, arac: 'arac' in ek ? ek.arac : T1.anahtar, ham: 'ham' in ek ? ek.ham : HAM1, takipTarihi: ek.takipTarihi }, icerik)
const tamam = async (doktor: string, hasta: string, ek: Parameters<typeof kaydet>[2] = {}) => { const r = await kaydet(doktor, hasta, ek); assert.equal(r.tamam, true, JSON.stringify(r)); return (r as { id: string }).id }
const satir = (id: string) => kayitlar().find((x) => x.id === id) as Satir

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  ROLLER = paket.uygulama?.roller ?? []
  KIT = paket.ozellikler.cekirdekMuayene === true && ROLLER.length >= 2
  NextRequest = (await import('next/server')).NextRequest
  const sifre = await import('@/lib/security/encryption')
  sifrele = sifre.encrypt; sifreCoz = sifre.decrypt
  K = await import('./kayit')
  Z = await import('../uygulama/zaman')
  ROTA = Boolean(K.aktifAracIcerigi())
  rota = (await import('../../../app/api/ulke/arac-kaydi/route.ulke')) as unknown as Mod
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
  BUGUN = Z.yerelAn(BASLANGIC_ANI, paket.saatDilimi).gun
  const adaylar = KIT_ARACLARI.filter((t) => yansiz(t) && doluGirdi(t))
  assert.ok(adaylar.length >= 2, 'the kit must have two tools whose result needs nothing of a country')
  ;[T1, T2] = adaylar
  HAM1 = hamGirdi(doluGirdi(T1)!)
  const metin = { ad: {}, aciklama: {}, alanlar: {}, not: {} }
  SENTETIK = {
    metinler: {} as UlkeAraclari['metinler'], birimler: {}, labBirimleri: {}, yuvalar: [], inceleme: { makineYazimi: true, klinisyen: null },
    araclar: [
      { anahtar: 'hasta-portali', roller: null, metin },
      { anahtar: T1.anahtar, roller: [ROLLER[0]], metin },
      { anahtar: T2.anahtar, roller: [ROLLER[1]], metin },
    ],
  }
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); if (paket.ozellikler.cekirdekMuayene) sifirla() })

type Secenek = { jeton?: string; govde?: unknown }
async function cagir(yontem: string, yol: string, s: Secenek = {}): Promise<{ status: number; govde: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const basliklar: Record<string, string> = { host: 'notya.test' }
  if (s.jeton) basliklar.authorization = `Bearer ${s.jeton}`
  if (s.govde !== undefined) basliklar['content-type'] = 'application/json'
  const req = new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(s.govde !== undefined ? { body: JSON.stringify(s.govde) } : {}) })
  const res = await rota[yontem](req)
  const metin = await res.clone().text()
  let govde: unknown = null
  try { govde = JSON.parse(metin) } catch { govde = metin }
  return { status: res.status, govde }
}
const YOL = '/api/ulke/arac-kaydi'

// ═════════════════════════ 1. the kit's rules, with a tool list of no country ═════════════════════════

describe('tool records — keeping a result', () => {
  it('a result is kept on the doctor\'s own patient: country, doctor, patient and tool on the row, the content as ONE encrypted value', async () => {
    if (!KIT) return
    const id = await tamam(DA, H1)
    const s = satir(id)
    assert.deepEqual([s.ulke, s.doctor_id, s.patient_id, s.arac, s.takip_tarihi, s.kapandi_at], [BU, DA, H1, T1.anahtar, null, null])
    assert.deepEqual(Object.keys(s).sort(), ['arac', 'created_at', 'doctor_id', 'id', 'kapandi_at', 'kayit_encrypted', 'patient_id', 'takip_tarihi', 'ulke', 'updated_at'])
    // Nothing of the content is readable in the row: not a field key, not a result key.
    const acik = String(s.kayit_encrypted)
    for (const iz of ['sayilar', 'tamam', ...T1.alanlar.map((a) => `"${a.anahtar}"`)]) assert.ok(!acik.includes(iz), `the stored value shows "${iz}" in clear text`)
    const z = JSON.parse(sifreCoz(acik)) as Record<string, unknown>
    assert.deepEqual([z.v, z.u, z.d, z.h, z.a, z.gun], [1, BU, DA, H1, T1.anahtar, BUGUN])
  })

  it('THE SERVER WORKS THE RESULT OUT AGAIN: what is kept is the kit\'s own arithmetic on the typed form; a result sent by the browser is not read', async () => {
    if (!KIT) return
    const sahte = { tamam: true, sayilar: [{ anahtar: 'x', deger: 999999, ondalik: 0 }], bant: 'uydurma', uyarilar: ['uydurma'], tarihler: [] }
    const r = await K.aracKaydet(sb(), DA, { hastaId: H1, arac: T1.anahtar, ham: HAM1, sonuc: sahte, s: sahte } as never, SENTETIK)
    assert.equal(r.tamam, true)
    const z = JSON.parse(sifreCoz(String(satir((r as { id: string }).id).kayit_encrypted))) as { s: unknown }
    assert.deepEqual(z.s, JSON.parse(JSON.stringify(T1.hesapla(doluGirdi(T1)!, ortam()))))
    assert.ok(!JSON.stringify(z).includes('uydurma') && !JSON.stringify(z).includes('999999'))
  })

  it('a key the tool does not have, a value that is not text or a tick, and an over-long text are not kept', async () => {
    if (!KIT) return
    const id = await tamam(DA, H1, { ham: { ...HAM1, baska_alan: 'QA-NOT-A-FIELD', __proto__x: { a: 1 } } })
    const z = JSON.stringify(JSON.parse(sifreCoz(String(satir(id).kayit_encrypted))))
    assert.ok(!z.includes('QA-NOT-A-FIELD') && !z.includes('baska_alan'))
  })

  it('an incomplete form is not kept: nothing is written', async () => {
    if (!KIT) return
    for (const ham of [{}, null, 'x', [], undefined]) assert.deepEqual(await kaydet(DA, H1, { ham }), { tamam: false, kod: 'EKSIK' })
    assert.equal(kayitlar().length, 0)
  })

  it('THE ROLE GATE: only a tool the account may open — another role\'s, a screen-only tile, a tool the pack does not list, no tool at all, and an account without a role are refused', async () => {
    if (!KIT) return
    const disarida = KIT_ARACLARI.find((t) => t.tur !== 'ekran' && t !== T1 && t !== T2)!
    for (const arac of [T2.anahtar, 'hasta-portali', disarida.anahtar, 'no-such-tool', '', null, 7, { anahtar: T1.anahtar }]) assert.deepEqual(await kaydet(DA, H1, { arac }), { tamam: false, kod: 'ARAC_YOK' }, String(arac))
    rolYaz(DA, ROLLER[1])
    assert.deepEqual(await kaydet(DA, H1), { tamam: false, kod: 'ARAC_YOK' }, 'the tool of the role the account had before')
    rolYaz(DA, null)
    assert.deepEqual(await kaydet(DA, H1), { tamam: false, kod: 'ARAC_YOK' }, 'an account without a role')
    assert.equal(kayitlar().length, 0)
  })

  it('THE FOLLOW-UP DAY IS THE DOCTOR\'S: none is written unless one is entered; a day from today on in the ACCOUNT\'s time zone; anything else is refused and nothing is written', async () => {
    if (!KIT) return
    assert.equal(satir(await tamam(DA, H1)).takip_tarihi, null)
    assert.equal(satir(await tamam(DA, H1, { takipTarihi: '' })).takip_tarihi, null)
    assert.equal(satir(await tamam(DA, H1, { takipTarihi: BUGUN })).takip_tarihi, BUGUN)
    const ileri = Z.gunEkle(BUGUN, 90)
    assert.equal(satir(await tamam(DA, H1, { takipTarihi: ileri })).takip_tarihi, ileri)
    const once = kayitlar().length
    for (const t of [Z.gunEkle(BUGUN, -1), '2026-02-30', '12.10.2026', 'yarin', 20261012, Z.gunEkle(BUGUN, 3661), `${ileri}T00:00:00Z`]) assert.deepEqual(await kaydet(DA, H1, { takipTarihi: t }), { tamam: false, kod: 'TAKIP' }, String(t))
    assert.equal(kayitlar().length, once)
  })

  it('a failed write answers BASARISIZ and leaves nothing', async () => {
    if (!KIT) return
    vt.boz.yaz.add('ulke_arac_kayitlari')
    assert.deepEqual(await kaydet(DA, H1), { tamam: false, kod: 'BASARISIZ' })
    assert.equal(kayitlar().length, 0)
  })
})

describe('tool records — the patient\'s file', () => {
  it('the kept results of a patient, newest first, with what was typed and what came out', async () => {
    if (!KIT) return
    const a = await tamam(DA, H1)
    mock.timers.tick(60_000)
    const b = await tamam(DA, H1, { takipTarihi: Z.gunEkle(BUGUN, 7) })
    await tamam(DA, H2)
    const liste = await K.hastaninAracKayitlari(sb(), DA, H1)
    assert.deepEqual(liste!.map((x) => x.id), [b, a])
    assert.deepEqual(liste![0].sonuc, JSON.parse(JSON.stringify(T1.hesapla(doluGirdi(T1)!, ortam()))))
    assert.deepEqual([liste![0].arac, liste![0].gun, liste![0].takipTarihi, liste![0].kapandi], [T1.anahtar, BUGUN, Z.gunEkle(BUGUN, 7), null])
    assert.ok(liste![0].girdiler && Object.keys(liste![0].girdiler!).every((k) => T1.alanlar.some((al) => al.anahtar === k)))
  })

  it('a stored value that is not THIS row\'s own (another patient\'s, another tool\'s, another doctor\'s, damaged) is not shown', async () => {
    if (!KIT) return
    const a = await tamam(DA, H1), b = await tamam(DA, H2)
    rolYaz(DB, ROLLER[0])
    const c = await tamam(DB, H3)
    const deger = (id: string) => String(satir(id).kayit_encrypted)
    // The stand-in holds the trigger of the migration, so the rows are swapped underneath it, as a damaged table would be.
    const yaz = (id: string, d: Partial<Satir>) => Object.assign(satir(id), d)
    yaz(a, { kayit_encrypted: deger(b) })
    assert.deepEqual((await K.hastaninAracKayitlari(sb(), DA, H1))!.map((x) => [x.girdiler, x.sonuc]), [[null, null]], 'another patient\'s value')
    yaz(a, { kayit_encrypted: deger(c) })
    assert.deepEqual((await K.hastaninAracKayitlari(sb(), DA, H1))!.map((x) => x.sonuc), [null], 'another doctor\'s value')
    yaz(a, { kayit_encrypted: 'not-a-value' })
    assert.deepEqual((await K.hastaninAracKayitlari(sb(), DA, H1))!.map((x) => x.sonuc), [null], 'a damaged value')
    yaz(b, { arac: T2.anahtar })
    assert.deepEqual((await K.hastaninAracKayitlari(sb(), DA, H2))!.map((x) => x.sonuc), [null], 'a value kept for another tool')
  })
})

describe('tool records — the follow-up list', () => {
  it('lists the doctor\'s open follow-ups, earliest first, with the patient\'s name; a record without a day is not on it', async () => {
    if (!KIT) return
    const gec = await tamam(DA, H1, { takipTarihi: Z.gunEkle(BUGUN, 30) })
    const erken = await tamam(DA, H2, { takipTarihi: Z.gunEkle(BUGUN, 2) })
    await tamam(DA, H1)
    const r = await K.takipListesi(sb(), DA)
    assert.equal(r.bugun, BUGUN)
    assert.deepEqual(r.takipler, [
      { id: erken, hastaId: H2, hastaAdi: AD[H2], arac: T1.anahtar, takipTarihi: Z.gunEkle(BUGUN, 2), gecikti: false },
      { id: gec, hastaId: H1, hastaAdi: AD[H1], arac: T1.anahtar, takipTarihi: Z.gunEkle(BUGUN, 30), gecikti: false },
    ])
  })

  it('a follow-up is overdue from the day AFTER its day, in the account\'s own time zone', async () => {
    if (!KIT) return
    await tamam(DA, H1, { takipTarihi: Z.gunEkle(BUGUN, 1) })
    assert.deepEqual((await K.takipListesi(sb(), DA)).takipler.map((x) => x.gecikti), [false])
    mock.timers.tick(GUN_MS)
    assert.deepEqual((await K.takipListesi(sb(), DA)).takipler.map((x) => x.gecikti), [false], 'on its own day it is due, not overdue')
    mock.timers.tick(GUN_MS)
    assert.deepEqual((await K.takipListesi(sb(), DA)).takipler.map((x) => x.gecikti), [true])
  })

  it('the doctor closes a follow-up ONCE: it leaves the list and stays on the patient\'s file; a record without a follow-up cannot be closed', async () => {
    if (!KIT) return
    const a = await tamam(DA, H1, { takipTarihi: BUGUN }), b = await tamam(DA, H1)
    assert.deepEqual(await K.takipKapat(sb(), DA, a), { tamam: true })
    assert.deepEqual((await K.takipListesi(sb(), DA)).takipler, [])
    assert.equal(typeof satir(a).kapandi_at, 'string')
    assert.deepEqual(await K.takipKapat(sb(), DA, a), { tamam: false, kod: 'DURUM' })
    assert.deepEqual(await K.takipKapat(sb(), DA, b), { tamam: false, kod: 'DURUM' })
    assert.deepEqual((await K.hastaninAracKayitlari(sb(), DA, H1))!.map((x) => [x.id, x.kapandi !== null]).sort(), [[a, true], [b, false]].sort())
  })
})

describe('tool records — isolation', () => {
  it('doctor A → B and B → A: another doctor\'s patient or record answers exactly like one that does not exist', async () => {
    if (!KIT) return
    const a = await tamam(DA, H1, { takipTarihi: BUGUN })
    const b = await tamam(DB, H3, { takipTarihi: BUGUN })
    for (const [kim, hasta, kayit] of [[DA, H3, b], [DB, H1, a]] as const) {
      assert.deepEqual(await kaydet(kim, hasta), await kaydet(kim, YOK))
      assert.deepEqual(await kaydet(kim, hasta), { tamam: false, kod: 'NOT_FOUND' })
      assert.equal(await K.hastaninAracKayitlari(sb(), kim, hasta), null)
      assert.deepEqual(await K.takipKapat(sb(), kim, kayit), await K.takipKapat(sb(), kim, YOK))
      assert.deepEqual(await K.takipKapat(sb(), kim, kayit), { tamam: false, kod: 'NOT_FOUND' })
    }
    assert.deepEqual((await K.takipListesi(sb(), DA)).takipler.map((x) => x.id), [a])
    assert.deepEqual((await K.takipListesi(sb(), DB)).takipler.map((x) => x.id), [b])
    assert.deepEqual([satir(a).kapandi_at, satir(b).kapandi_at], [null, null])
    assert.equal(kayitlar().length, 2)
  })

  it('a foreign patient is refused BEFORE the tool is looked at: a wrong tool does not change the answer', async () => {
    if (!KIT) return
    assert.deepEqual(await kaydet(DA, H3, { arac: 'no-such-tool' }), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await kaydet(DA, H3, { ham: {} }), { tamam: false, kod: 'NOT_FOUND' })
  })

  it('rows of ANOTHER country in the same tables are as if they were not there', async () => {
    if (!KIT) return
    const baska = BU === 'zz' ? 'yy' : 'zz'
    const HX = '30000000-0000-4000-8000-0000000000ff'
    hastaEkle(HX, DA, baska)
    kayitlar().push({ id: '90000000-0000-4000-8000-0000000000ee', ulke: baska, doctor_id: DA, patient_id: H1, arac: T1.anahtar, kayit_encrypted: 'x', takip_tarihi: BUGUN, kapandi_at: null, created_at: simdiIso() })
    assert.deepEqual(await kaydet(DA, HX), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.hastaninAracKayitlari(sb(), DA, H1), [])
    assert.deepEqual((await K.takipListesi(sb(), DA)).takipler, [])
    assert.deepEqual(await K.takipKapat(sb(), DA, '90000000-0000-4000-8000-0000000000ee'), { tamam: false, kod: 'NOT_FOUND' })
  })

  it('every statement on the table carries the doctor\'s id (and the country: the stand-in throws without it)', async () => {
    if (!KIT) return
    const a = await tamam(DA, H1, { takipTarihi: BUGUN })
    await K.hastaninAracKayitlari(sb(), DA, H1); await K.takipListesi(sb(), DA); await K.takipKapat(sb(), DA, a)
    const s = vt.sorgular.filter((x) => x.tablo === 'ulke_arac_kayitlari')
    assert.ok(s.length >= 5)
    for (const x of s) {
      assert.equal(x.ulke, BU)
      if (x.islem !== 'insert') assert.ok(x.filtreler.includes(`doctor_id=eq.${DA}`), `${x.islem} without the doctor: ${x.filtreler.join(' & ')}`)
    }
  })
})

// ═════════════════════════ 2. the route, with the pack's own tools ═════════════════════════

describe('tool records — the route', () => {
  it('a pack with the tools area runs BOTH layers of this file (nothing above was skipped for it)', () => {
    if (!paket.ozellikler.araclar) return
    assert.deepEqual([KIT, ROTA], [true, true])
  })

  it('a pack without the tools area: "not found" on every method, signed in or not', async () => {
    if (ROTA || !paket.ozellikler.cekirdekMuayene) return
    for (const [y, s] of [['GET', {}], ['GET', { jeton: 'jeton-a' }], ['POST', { jeton: 'jeton-a', govde: { hastaId: H1 } }], ['PATCH', { jeton: 'jeton-a', govde: { kayitId: YOK, islem: 'kapat' } }]] as const) {
      const r = await cagir(y, y === 'GET' ? `${YOL}?hasta=${H1}` : YOL, s)
      assert.deepEqual([r.status, r.govde.code], [404, 'NOT_FOUND'], y)
    }
  })

  it('without a session: 401 on every method; nothing is read', async () => {
    if (!ROTA) return
    for (const [y, yol, govde] of [['GET', YOL, undefined], ['GET', `${YOL}?hasta=${H1}`, undefined], ['POST', YOL, { hastaId: H1 }], ['PATCH', YOL, { kayitId: YOK, islem: 'kapat' }]] as const) {
      const r = await cagir(y, yol, { govde })
      assert.deepEqual([r.status, r.govde.code], [401, 'OTURUM_YOK'], `${y} ${yol}`)
    }
    assert.equal(vt.sorgular.filter((x) => x.tablo === 'ulke_arac_kayitlari').length, 0)
  })

  it('keep, read, list and close through the handlers, with a tool of the pack\'s own; another role\'s tool and another doctor\'s patient are refused', async () => {
    if (!ROTA) return
    const icerik = K.aktifAracIcerigi()!
    // A role of the pack and one of its own tools whose form the samples can fill in today.
    let secim: { rol: string; t: AracTanimi; ham: Record<string, string | boolean> } | null = null
    for (const p of icerik.araclar) {
      const t = KIT_ARACLARI.find((x) => x.anahtar === p.anahtar)
      if (!t || !p.roller || !yansiz(t)) continue
      const g = doluGirdi(t)
      if (g) { secim = { rol: p.roller[0], t, ham: hamGirdi(g) }; break }
    }
    assert.ok(secim, 'the pack has no role tool the samples can fill in: the route was not exercised')
    rolYaz(DA, secim.rol)
    const baskaRol = ROLLER.find((r) => !(icerik.araclar.find((p) => p.anahtar === secim!.t.anahtar)!.roller ?? []).includes(r))
    const govde = { hastaId: H1, arac: secim.t.anahtar, ham: secim.ham, takipTarihi: BUGUN }
    const k = await cagir('POST', YOL, { jeton: 'jeton-a', govde })
    assert.equal(k.status, 200, JSON.stringify(k.govde))
    assert.match(k.govde.id, /^[0-9a-f-]{36}$/)
    const liste = await cagir('GET', `${YOL}?hasta=${H1}`, { jeton: 'jeton-a' })
    assert.deepEqual([liste.status, liste.govde.kayitlar.length, liste.govde.kayitlar[0].arac, liste.govde.kayitlar[0].sonuc.tamam], [200, 1, secim.t.anahtar, true])
    const takip = await cagir('GET', YOL, { jeton: 'jeton-a' })
    assert.deepEqual([takip.status, takip.govde.bugun, takip.govde.takipler.map((x: { id: string; hastaAdi: string }) => [x.id, x.hastaAdi])], [200, BUGUN, [[k.govde.id, AD[H1]]]])
    // refusals
    assert.deepEqual([(await cagir('POST', YOL, { jeton: 'jeton-a', govde: { ...govde, ham: {} } })).status, (await cagir('POST', YOL, { jeton: 'jeton-a', govde: { ...govde, takipTarihi: '2020-01-01' } })).status], [422, 422])
    for (const r of [await cagir('POST', YOL, { jeton: 'jeton-a', govde: { ...govde, hastaId: H3 } }), await cagir('POST', YOL, { jeton: 'jeton-a', govde: { ...govde, hastaId: 'x' } }), await cagir('GET', `${YOL}?hasta=${H3}`, { jeton: 'jeton-a' }), await cagir('GET', `${YOL}?hasta=`, { jeton: 'jeton-a' }), await cagir('GET', `${YOL}?hasta=${H1}`, { jeton: 'jeton-b' }), await cagir('PATCH', YOL, { jeton: 'jeton-b', govde: { kayitId: k.govde.id, islem: 'kapat' } })]) assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }])
    assert.deepEqual((await cagir('GET', YOL, { jeton: 'jeton-b' })).govde.takipler, [])
    if (baskaRol) {
      rolYaz(DA, baskaRol)
      const r = await cagir('POST', YOL, { jeton: 'jeton-a', govde })
      assert.deepEqual([r.status, r.govde.code], [404, 'ARAC_YOK'])
      rolYaz(DA, secim.rol)
    }
    assert.equal((await cagir('PATCH', YOL, { jeton: 'jeton-a', govde: { kayitId: k.govde.id, islem: 'sil' } })).status, 400)
    assert.deepEqual((await cagir('PATCH', YOL, { jeton: 'jeton-a', govde: { kayitId: k.govde.id, islem: 'kapat' } })).govde, { ok: true })
    assert.deepEqual([(await cagir('PATCH', YOL, { jeton: 'jeton-a', govde: { kayitId: k.govde.id, islem: 'kapat' } })).status, (await cagir('GET', YOL, { jeton: 'jeton-a' })).govde.takipler.length, kayitlar().length], [409, 0, 1])
  })
})
