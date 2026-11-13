/**
 * PREMATUR-ULKE-01 — THE PREMATURITY MODULE (the preterm baby's follow-up plan and the early-birth record), for whatever pack is
 * active. Runs ONCE PER PACK.
 *
 *   1. THE PACK'S TABLE: held to the module's rule (nothing is invented: a dated rule cites a source that was read, anything else is
 *      "follow your local protocol"); every word of the screens is there in every form of the pack, and none is Turkish.
 *   2. WHO SEES WHAT: a tile is shown to exactly the roles the pack names for it (the baby's plan and list: paediatrics; the
 *      early-birth record: obstetrics and gynaecology) — a specialty's tile never reaches another role.
 *   3. THE ROUTES, with real handlers: the doctor's own patient only (another doctor's answers exactly like a patient who does not
 *      exist, in both directions), another country's rows are never read, the other role is refused, a mark is only for an item of
 *      the table, what is kept is cleaned, no dose field exists, and a database without the tables answers an empty record instead
 *      of breaking.
 *
 * A pack without the module answers "not found" on every method. The database and sign-in are stand-ins inside this process; any
 * network address fails the test. Synthetic data only.
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
type Prem = import('./paket').PrematurPaketi
type Sb = import('@supabase/supabase-js').SupabaseClient
let paket: Paket
let BU = ''
let PREM: Prem | null = null
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let Z: typeof import('../uygulama/zaman')
let rotaBebek: Mod
let rotaGebelik: Mod
let ROLLER: readonly string[] = []
let BUGUN = ''
let PEDI = ''
let OG = ''

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001' // baby of doctor A
const H2 = '30000000-0000-4000-8000-000000000002' // second patient of doctor A, not a preterm baby
const H3 = '30000000-0000-4000-8000-000000000003' // baby of doctor B
const YOK = '77777777-7777-4777-8777-777777777777'
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()
const BEBEK = 'prematur-takip'
const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)

function hastaEkle(id: string, doktor: string, dob: string, ulke = BU) {
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: `QA Baby ${id.slice(-1)}` })), dob_encrypted: sifrele(dob), gender_encrypted: null, phone_encrypted: null, insurance_encrypted: null, notes_encrypted: null })
  tablo('hasta_ulke_bilgisi').push({ patient_id: id, ulke, doctor_id: doktor, dil: paket.uygulama?.hastaDilleri[0] ?? '', ota_ismi_encrypted: null, ulusal_kimlik_encrypted: null })
}
const rolYaz = (doktor: string, rol: string | null) => {
  vt.tablolar.hekim_rolu = tablo('hekim_rolu').filter((x) => x.doctor_id !== doktor)
  if (rol) tablo('hekim_rolu').push({ ulke: BU, doctor_id: doktor, rol })
}
function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear(); vt.boz.eksik.clear()
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: DA, email: 'qa-a@notya.test', app_metadata: { country: BU } },
    'jeton-b': { id: DB, email: 'qa-b@notya.test', app_metadata: { country: BU } },
  })
  const d = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  tablo('ulke_hesaplari').push({ id: DA, full_name: 'QA Doctor A', ulke: BU, ui_language: d }, { id: DB, full_name: 'QA Doctor B', ulke: BU, ui_language: d })
  tablo('hekim_dil_tercihleri').push({ ulke: BU, doctor_id: DA, not_dili: d, soruldu_at: 'x' }, { ulke: BU, doctor_id: DB, not_dili: d, soruldu_at: 'x' })
  rolYaz(DA, PEDI); rolYaz(DB, PEDI)
  const dogum = Z.gunEkle(BUGUN, -75)
  hastaEkle(H1, DA, dogum); hastaEkle(H2, DA, '1990-05-05'); hastaEkle(H3, DB, dogum)
}

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  ROLLER = paket.uygulama?.roller ?? []
  NextRequest = (await import('next/server')).NextRequest
  sifrele = (await import('@/lib/security/encryption')).encrypt
  Z = await import('../uygulama/zaman')
  PREM = (await import('./kayit')).aktifPrematurPaketi()
  rotaBebek = (await import('../../../app/api/ulke/prematur/route.ulke')) as unknown as Mod
  rotaGebelik = (await import('../../../app/api/ulke/erken-dogum/route.ulke')) as unknown as Mod
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
  BUGUN = Z.yerelAn(BASLANGIC_ANI, paket.saatDilimi).gun
  PEDI = PREM?.roller.bebek[0] ?? ROLLER[0] ?? ''
  OG = PREM?.roller.gebelik[0] ?? ROLLER[1] ?? ''
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); if (paket.ozellikler.cekirdekMuayene) sifirla() })

type Secenek = { jeton?: string; govde?: unknown }
async function cagir(rota: Mod, yontem: string, yol: string, s: Secenek = {}): Promise<{ status: number; govde: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
const B = '/api/ulke/prematur'
const G = '/api/ulke/erken-dogum'
const bebek = (yontem: string, yol = B, s: Secenek = {}) => cagir(rotaBebek, yontem, yol, { jeton: 'jeton-a', ...s })
const gebelik = (yontem: string, yol = G, s: Secenek = {}) => cagir(rotaGebelik, yontem, yol, { jeton: 'jeton-a', ...s })
const SIGNED = () => !!PREM && paket.ozellikler.cekirdekMuayene === true
const BEBEK_PROFIL = { gestasyonHafta: 28, gestasyonGunKalan: 3, dogumKiloGr: 1100, nicuGun: 12, ototoksik5Gun: true }
const GEBELIK = (ek: Record<string, unknown> = {}) => ({ sat: Z.gunEkle(BUGUN, -140), tdt: null, cogulTipi: 'tekil', durum: 'aktif', kayit: { serviks: [{ id: 'a', tarih: Z.gunEkle(BUGUN, -7), gestasyonGun: 19 * 7, mm: 21, yontem: 'transvajinal' }], oncekiSpontanPreterm: false, pprom: { var: false, tarih: null }, steroid: { yapildi: false, kurlar: [] }, magnezyum: { verildi: null, tarih: null }, progesteron: { kullaniyor: null, baslangic: null, yol: null }, ...ek } })

// ═════════════════════════ 1. the pack's table and words ═════════════════════════

describe('prematurity — the pack\'s table and words', () => {
  it('a pack without the module answers "not found" on every method', async () => {
    if (PREM) return
    for (const [rota, yol] of [[rotaBebek, B], [rotaGebelik, G]] as const) {
      for (const y of ['GET', 'PUT', 'POST']) if (rota[y]) assert.equal((await cagir(rota, y, `${yol}?hasta=${H1}`, { jeton: 'jeton-a', govde: { hastaId: H1 } })).status, 404, `${yol} ${y}`)
    }
  })

  it('the follow-up table and the early-birth thresholds invent nothing: a dated rule cites a source that was read, anything else is "follow your local protocol"', async () => {
    if (!PREM) return
    const { protokolSorunlari, erkenDogumSorunlari } = await import('./dogrulama')
    const formlar = Object.keys(PREM.metinler)
    assert.ok(formlar.length >= 1)
    assert.deepEqual(protokolSorunlari(PREM.protokol, formlar), [])
    assert.deepEqual(erkenDogumSorunlari(PREM.erkenDogum, formlar), [])
    // the table names every item of the module, once
    assert.deepEqual(PREM.protokol.kurallar.map((k) => k.kod), ['rop', 'cranial-us', 'hearing-9m', 'hearing-ecmo', 'bpd', 'rsv', 'iron', 'bone'])
    // a "local protocol" rule may cite what was read about it but states no number
    for (const k of PREM.protokol.kurallar.filter((x) => x.yerel)) assert.ok(!k.kriter && !k.zamanlamalar.length, k.kod)
  })

  it('every word of both screens is written in every form of the pack, and none of it is Turkish or Russian', async () => {
    if (!PREM) return
    const bak = (x: unknown, yol: string, form: string): void => {
      if (typeof x === 'string') {
        assert.ok(x.trim().length > 0, `${form} ${yol} is empty`)
        assert.doesNotMatch(x, /[\u0130\u0131\u011e\u011f\u015e\u015f]/, `${form} ${yol} holds a Turkish letter`)
        if (!/^(uz|uz-|uz_)/i.test(form)) assert.doesNotMatch(x, /[\u0400-\u04FF]/, `${form} ${yol} holds Cyrillic`)
        return
      }
      if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) bak(v, `${yol}.${k}`, form)
    }
    const ref = Object.values(PREM.metinler)[0]
    const anahtarlar = (x: unknown, on = ''): string[] => (x && typeof x === 'object' ? Object.entries(x).flatMap(([k, v]) => anahtarlar(v, `${on}${k}.`)) : [on])
    for (const [form, m] of Object.entries(PREM.metinler)) {
      bak(m, 'metin', form)
      assert.deepEqual(anahtarlar(m).sort(), anahtarlar(ref).sort(), `${form} has the same words as the other forms`)
    }
    // the protocol's own words, in every form
    for (const form of Object.keys(PREM.metinler)) {
      for (const k of PREM.protokol.kurallar) { assert.ok(k.baslik[form]?.trim(), `${k.kod} title ${form}`); assert.ok(k.aciklama[form]?.trim(), `${k.kod} text ${form}`) }
    }
  })
})

// ═════════════════════════ 2. who sees which tile ═════════════════════════

describe('prematurity — a specialty\'s tile reaches only its own roles', () => {
  it('each tile is shown to exactly the roles the pack names for it, and to no other role', async () => {
    if (!PREM) return
    const { hesabinAraclari } = await import('../araclar/paket')
    const icerik = (await import('../arayuz')).arayuz().araclar
    assert.ok(icerik)
    const bakan = (anahtar: string) => ROLLER.filter((r) => hesabinAraclari(icerik, r).rol.some((x) => x.paket.anahtar === anahtar))
    assert.deepEqual(bakan('prematur-takip').sort(), [...PREM.roller.bebek].sort())
    assert.deepEqual(bakan('prematur-kohort').sort(), [...PREM.roller.bebek].sort())
    assert.deepEqual(bakan('erken-dogum').sort(), [...PREM.roller.gebelik].sort())
    // never the same role for both specialties' tiles
    for (const r of PREM.roller.bebek) assert.ok(!PREM.roller.gebelik.includes(r), `${r} is in both lists`)
    assert.ok(PREM.roller.bebek.length >= 1 && PREM.roller.gebelik.length >= 1)
    // no other tile of the pack carries these keys
    for (const r of ROLLER.filter((x) => !PREM!.roller.bebek.includes(x) && !PREM!.roller.gebelik.includes(x))) {
      const ids = hesabinAraclari(icerik, r).rol.map((x) => x.paket.anahtar)
      for (const k of ['prematur-takip', 'prematur-kohort', 'erken-dogum']) assert.ok(!ids.includes(k), `${r} sees ${k}`)
    }
  })
})

// ═════════════════════════ 3. the routes ═════════════════════════

describe('prematurity — the baby\'s record', () => {
  it('no session: 401; a role of another specialty, a malformed id and an unknown patient: the same 404', async () => {
    if (!SIGNED()) return
    assert.equal((await cagir(rotaBebek, 'GET', `${B}?hasta=${H1}`)).status, 401)
    assert.equal((await bebek('GET', `${B}?hasta=not-an-id`)).status, 404)
    assert.equal((await bebek('GET', `${B}?hasta=${YOK}`)).status, 404)
    rolYaz(DA, OG)
    const r = await bebek('GET', `${B}?hasta=${H1}`)
    assert.equal(r.status, 404)
    assert.deepEqual(r.govde, (await bebek('GET', `${B}?hasta=${YOK}`)).govde)
    assert.equal((await bebek('GET', B)).status, 404) // the list too
    assert.equal((await bebek('PUT', B, { govde: { hastaId: H1, profil: BEBEK_PROFIL } })).status, 404)
    assert.equal((await bebek('POST', B, { govde: { hastaId: H1, ogeId: 'rop:ilk-pma', durum: 'yapildi' } })).status, 404)
    assert.equal(tablo('ulke_prematur_kayitlari').length, 0)
  })

  it('the doctor enters the history: it is kept encrypted with country, doctor and patient in the value, and read back cleaned', async () => {
    if (!SIGNED()) return
    const w = await bebek('PUT', B, { govde: { hastaId: H1, profil: { ...BEBEK_PROFIL, gestasyonHafta: '28', dogumKiloGr: '1100', bilinmeyen: 'x', doz: '5 mg' } } })
    assert.equal(w.status, 200, JSON.stringify(w.govde))
    assert.equal(w.govde.depo, true)
    assert.equal(w.govde.profil.gestasyonHafta, 28)
    assert.equal(w.govde.profil.dogumKiloGr, 1100)
    assert.equal('doz' in w.govde.profil || 'bilinmeyen' in w.govde.profil, false, 'no key of the form is kept that the table does not name')
    const satirlar = tablo('ulke_prematur_kayitlari')
    assert.equal(satirlar.length, 1)
    assert.deepEqual([satirlar[0].ulke, satirlar[0].doctor_id, satirlar[0].patient_id], [BU, DA, H1])
    const ham = String(satirlar[0].kayit_encrypted)
    assert.ok(!ham.includes('1100') && !ham.includes('gestasyon') && !ham.includes('QA Baby'), 'nothing of the content is readable in the row')
    const r = await bebek('GET', `${B}?hasta=${H1}`)
    assert.equal(r.status, 200)
    assert.equal(r.govde.profil.nicuGun, 12)
    assert.equal(r.govde.bugun, BUGUN)
    assert.equal(r.govde.hasta.dogumTarihi, Z.gunEkle(BUGUN, -75))
    // a value that cannot be a gestation, a weight or a day is not kept
    const kotu = await bebek('PUT', B, { govde: { hastaId: H1, profil: { gestasyonHafta: 99, dogumKiloGr: -5, nicuGun: 'x' } } })
    assert.equal(kotu.status, 200)
    assert.equal(kotu.govde.profil.gestasyonHafta ?? null, null)
    assert.equal(kotu.govde.profil.dogumKiloGr ?? null, null)
  })

  it('ISOLATION: doctor B can neither read nor write doctor A\'s patient, and the answer is the one for a patient that does not exist', async () => {
    if (!SIGNED()) return
    await bebek('PUT', B, { govde: { hastaId: H1, profil: BEBEK_PROFIL } })
    const once = JSON.stringify(tablo('ulke_prematur_kayitlari'))
    const b = (yontem: string, yol: string, govde?: unknown) => cagir(rotaBebek, yontem, yol, { jeton: 'jeton-b', govde })
    const yokSonucu = await b('GET', `${B}?hasta=${YOK}`)
    const okuma = await b('GET', `${B}?hasta=${H1}`)
    assert.equal(okuma.status, 404)
    assert.deepEqual(okuma.govde, yokSonucu.govde)
    assert.equal((await b('PUT', B, { hastaId: H1, profil: { gestasyonHafta: 30 } })).status, 404)
    assert.equal((await b('POST', B, { hastaId: H1, ogeId: 'rop:ilk-pma', durum: 'yapildi' })).status, 404)
    assert.equal(JSON.stringify(tablo('ulke_prematur_kayitlari')), once, 'nothing changed')
    // and the other way round: A cannot reach B's patient
    assert.equal((await bebek('GET', `${B}?hasta=${H3}`)).status, 404)
    assert.equal((await bebek('PUT', B, { govde: { hastaId: H3, profil: BEBEK_PROFIL } })).status, 404)
    // B's own record is B's alone, and the lists never mix
    assert.equal((await b('PUT', B, { hastaId: H3, profil: { gestasyonHafta: 30, dogumKiloGr: 1300 } })).status, 200)
    const la = await bebek('GET', B)
    const lb = await b('GET', B)
    assert.deepEqual(la.govde.satirlar.map((x: { hastaId: string }) => x.hastaId), [H1])
    assert.deepEqual(lb.govde.satirlar.map((x: { hastaId: string }) => x.hastaId), [H3])
  })

  it('ANOTHER COUNTRY: a row of the same doctor and patient stamped with another country is never read', async () => {
    if (!SIGNED()) return
    tablo('ulke_prematur_kayitlari').push({ ulke: 'zz', doctor_id: DA, patient_id: H1, kayit_encrypted: sifrele(JSON.stringify({ v: 1, u: 'zz', d: DA, h: H1, profil: { gestasyonHafta: 24 }, ogeler: {} })), updated_at: new Date().toISOString() })
    const r = await bebek('GET', `${B}?hasta=${H1}`)
    assert.equal(r.status, 200)
    assert.equal(r.govde.profil.gestasyonHafta ?? null, null)
    assert.deepEqual((await bebek('GET', B)).govde.satirlar, [])
    // a row of this country whose value is another patient's (copied across) is read as empty
    tablo('ulke_prematur_kayitlari').push({ ulke: BU, doctor_id: DA, patient_id: H2, kayit_encrypted: sifrele(JSON.stringify({ v: 1, u: BU, d: DA, h: H1, profil: { gestasyonHafta: 25 }, ogeler: {} })), updated_at: new Date().toISOString() })
    assert.equal((await bebek('GET', `${B}?hasta=${H2}`)).govde.profil.gestasyonHafta ?? null, null)
  })

  it('a mark is only for an item of this country\'s table; a state or a day that cannot be kept is refused; null takes it off', async () => {
    if (!SIGNED()) return
    await bebek('PUT', B, { govde: { hastaId: H1, profil: BEBEK_PROFIL } })
    const { izinliOgeKimlikleri } = await import('./plan')
    const kimlik = [...izinliOgeKimlikleri(PREM!.protokol)][0]
    assert.ok(kimlik)
    const isaret = (govde: Record<string, unknown>) => bebek('POST', B, { govde: { hastaId: H1, ...govde } })
    const ok = await isaret({ ogeId: kimlik, durum: 'yapildi', tarih: BUGUN, not: 'checked' })
    assert.equal(ok.status, 200, JSON.stringify(ok.govde))
    assert.deepEqual(ok.govde.durumlar[kimlik], { durum: 'yapildi', tarih: BUGUN, not: 'checked' })
    for (const kotu of [{ ogeId: 'x:y', durum: 'yapildi' }, { ogeId: 'rop:nope-' + 'a'.repeat(50), durum: 'yapildi' }, { ogeId: kimlik, durum: 'maybe' }, { ogeId: 5, durum: 'yapildi' }, { ogeId: kimlik, durum: 'yapildi', tarih: Z.gunEkle(BUGUN, 3) }]) {
      const r = await isaret(kotu)
      assert.ok(r.status === 400 || (r.status === 200 && !(r.govde.durumlar[kimlik]?.tarih === Z.gunEkle(BUGUN, 3))), JSON.stringify(kotu))
      if (r.status === 400) assert.equal(r.govde.code, 'GECERSIZ')
    }
    const kaldir = await isaret({ ogeId: kimlik, durum: null })
    assert.equal(kaldir.status, 200)
    assert.equal(kaldir.govde.durumlar[kimlik], undefined)
  })

  it('THE TABLES ARE NOT ON THE DATABASE YET: a read answers an empty record, a write answers DEPO_YOK; nothing breaks', async () => {
    if (!SIGNED()) return
    vt.boz.eksik.add('ulke_prematur_kayitlari')
    const r = await bebek('GET', `${B}?hasta=${H1}`)
    assert.equal(r.status, 200)
    assert.equal(r.govde.depo, false)
    assert.deepEqual(r.govde.profil, {})
    const l = await bebek('GET', B)
    assert.equal(l.status, 200)
    assert.deepEqual([l.govde.depo, l.govde.satirlar], [false, []])
    const w = await bebek('PUT', B, { govde: { hastaId: H1, profil: BEBEK_PROFIL } })
    assert.deepEqual([w.status, w.govde.code], [503, 'DEPO_YOK'])
  })

  it('every statement on the table carries this country and this doctor', async () => {
    if (!SIGNED()) return
    await bebek('PUT', B, { govde: { hastaId: H1, profil: BEBEK_PROFIL } })
    await bebek('GET', `${B}?hasta=${H1}`)
    await bebek('GET', B)
    const s = vt.sorgular.filter((x) => x.tablo === 'ulke_prematur_kayitlari')
    assert.ok(s.length >= 3)
    for (const x of s) { assert.equal(x.ulke, BU); assert.ok(x.islem === 'upsert' || x.filtreler.includes(`doctor_id=eq.${DA}`), `${x.islem} without the doctor: ${x.filtreler.join(' & ')}`) }
  })
})

describe('prematurity — the early-birth record', () => {
  it('only obstetrics and gynaecology: another role, an unknown patient and a malformed id answer the same 404', async () => {
    if (!SIGNED()) return
    assert.equal((await gebelik('GET', `${G}?hasta=${H1}`)).status, 404) // doctor A holds the paediatric role
    rolYaz(DA, OG)
    assert.equal((await gebelik('GET', `${G}?hasta=${H1}`)).status, 200)
    const yok = await gebelik('GET', `${G}?hasta=${YOK}`)
    assert.equal(yok.status, 404)
    assert.equal((await gebelik('GET', `${G}?hasta=zz`)).status, 404)
    assert.equal((await cagir(rotaGebelik, 'GET', `${G}?hasta=${H1}`)).status, 401)
  })

  it('the record is kept as entered and cleaned; there is no dose field; a future date or an impossible length is refused', async () => {
    if (!SIGNED()) return
    rolYaz(DA, OG)
    const w = await gebelik('PUT', G, { govde: { hastaId: H1, e: GEBELIK({ progesteron: { kullaniyor: true, baslangic: Z.gunEkle(BUGUN, -10), yol: 'vajinal', doz: '200 mg' }, doz: 5 }) } })
    assert.equal(w.status, 200, JSON.stringify(w.govde))
    assert.equal(w.govde.e.kayit.serviks.length, 1)
    assert.equal(JSON.stringify(w.govde).includes('200 mg'), false, 'no dose is kept')
    const satir = tablo('ulke_erken_dogum_kayitlari')
    assert.deepEqual([satir.length, satir[0].ulke, satir[0].doctor_id, satir[0].patient_id], [1, BU, DA, H1])
    assert.ok(!String(satir[0].kayit_encrypted).includes('transvajinal') && !String(satir[0].kayit_encrypted).includes('"mm"'))
    const ileri = await gebelik('PUT', G, { govde: { hastaId: H1, e: GEBELIK({ serviks: [{ id: 'b', tarih: Z.gunEkle(BUGUN, 5), gestasyonGun: 140, mm: 20, yontem: 'transvajinal' }] }) } })
    assert.deepEqual([ileri.status, ileri.govde.code], [400, 'GECERSIZ'])
    assert.equal(ileri.govde.alan, 'serviks-ileri')
    const mm = await gebelik('PUT', G, { govde: { hastaId: H1, e: GEBELIK({ serviks: [{ id: 'c', tarih: Z.gunEkle(BUGUN, -1), gestasyonGun: 140, mm: 900, yontem: 'transvajinal' }] }) } })
    assert.deepEqual([mm.status, mm.govde.alan], [400, 'serviks-mm'])
    assert.equal(tablo('ulke_erken_dogum_kayitlari').length, 1)
  })

  it('ISOLATION and ANOTHER COUNTRY, as for the baby\'s record', async () => {
    if (!SIGNED()) return
    rolYaz(DA, OG); rolYaz(DB, OG)
    await gebelik('PUT', G, { govde: { hastaId: H1, e: GEBELIK() } })
    const b = (yontem: string, yol: string, govde?: unknown) => cagir(rotaGebelik, yontem, yol, { jeton: 'jeton-b', govde })
    const once = JSON.stringify(tablo('ulke_erken_dogum_kayitlari'))
    const yok = await b('GET', `${G}?hasta=${YOK}`)
    const okuma = await b('GET', `${G}?hasta=${H1}`)
    assert.deepEqual([okuma.status, okuma.govde], [404, yok.govde])
    assert.equal((await b('PUT', G, { hastaId: H1, e: GEBELIK() })).status, 404)
    assert.equal(JSON.stringify(tablo('ulke_erken_dogum_kayitlari')), once)
    assert.equal((await gebelik('GET', `${G}?hasta=${H3}`)).status, 404)
    await b('PUT', G, { hastaId: H3, e: GEBELIK() })
    assert.deepEqual((await gebelik('GET', G)).govde.satirlar.map((x: { hastaId: string }) => x.hastaId), [H1])
    assert.deepEqual((await b('GET', G)).govde.satirlar.map((x: { hastaId: string }) => x.hastaId), [H3])
    tablo('ulke_erken_dogum_kayitlari').push({ ulke: 'zz', doctor_id: DA, patient_id: H2, kayit_encrypted: sifrele(JSON.stringify({ v: 1, u: 'zz', d: DA, h: H2, e: GEBELIK() })), updated_at: new Date().toISOString() })
    assert.equal((await gebelik('GET', `${G}?hasta=${H2}`)).govde.e.kayit.serviks.length, 0)
    assert.deepEqual((await gebelik('GET', G)).govde.satirlar.map((x: { hastaId: string }) => x.hastaId), [H1])
  })

  it('THE TABLES ARE NOT ON THE DATABASE YET: an empty record, DEPO_YOK on a write', async () => {
    if (!SIGNED()) return
    rolYaz(DA, OG)
    vt.boz.eksik.add('ulke_erken_dogum_kayitlari')
    const r = await gebelik('GET', `${G}?hasta=${H1}`)
    assert.deepEqual([r.status, r.govde.depo], [200, false])
    const l = await gebelik('GET', G)
    assert.deepEqual([l.status, l.govde.depo, l.govde.satirlar], [200, false, []])
    const w = await gebelik('PUT', G, { govde: { hastaId: H1, e: GEBELIK() } })
    assert.deepEqual([w.status, w.govde.code], [503, 'DEPO_YOK'])
  })
})
