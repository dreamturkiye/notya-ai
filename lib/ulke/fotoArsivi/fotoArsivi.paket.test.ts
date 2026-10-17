/**
 * FOTO-ARSIV-01 — the patient photo archive, for whatever pack is active. Runs ONCE PER PACK (a pack without
 * `fotoArsivi` skips every assertion but still proves the route answers "not found").
 *
 * STORAGE AND VIEWING ONLY: nothing here calls a model (FOTO-ARSIV-02 stays untouched and is not exercised).
 * Real handlers and real library code. The database, storage and clock are stand-ins inside this process; any
 * network address fails the test. Synthetic data only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'
// The server clock is NOT the account's: the clinical date must be judged against the ACCOUNT's own time zone.
process.env.TZ = 'America/Los_Angeles'

import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani, type Satir } from '@/lib/ulke/testing/sahteVeritabani'

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
let AKTIF = false
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let K: typeof import('./fotoArsivi')
let Z: typeof import('../uygulama/zaman')
let rota: Mod
let BUGUN = ''
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()
const GUN_MS = 86_400_000

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001' // patient of doctor A
const H3 = '30000000-0000-4000-8000-000000000003' // patient of doctor B
const V1 = '40000000-0000-4000-8000-000000000001' // visit of doctor A, patient H1
const V3 = '40000000-0000-4000-8000-000000000003' // visit of doctor B, patient H3
const YOK = '77777777-7777-4777-8777-777777777777'
const KOVA = 'hasta-fotograflari'
const AD: Record<string, string> = { [H1]: 'QA Patient One', [H3]: 'QA Patient Three' }

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const fotolar = () => tablo('ulke_hasta_fotograflari')

function hastaEkle(id: string, doktor: string, ulke = BU) {
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: AD[id] ?? 'QA Foreign' })), dob_encrypted: null, gender_encrypted: null, phone_encrypted: null, is_active: true, created_at: new Date().toISOString() })
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
  tablo('ulke_hesaplari').push({ id: DA, full_name: 'QA Doctor A', ulke: BU }, { id: DB, full_name: 'QA Doctor B', ulke: BU })
  tablo('ulke_muayeneler').push({ id: V1, ulke: BU, doctor_id: DA, patient_id: H1 }, { id: V3, ulke: BU, doctor_id: DB, patient_id: H3 })
  hastaEkle(H1, DA); hastaEkle(H3, DB)
}

function yolVeNesne(doktor: string, dosya = 'f.jpg', bayt = 'sentetik goruntu — gercek bir foto degil') {
  const yol = `${BU}/${doktor}/${dosya}`
  vt.depo.set(`${KOVA}/${yol}`, new Blob([bayt]))
  return { yol, boyut: new Blob([bayt]).size }
}
const GECERLI = { mimeTuru: 'image/jpeg' }

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  AKTIF = paket.ozellikler.fotoArsivi === true
  NextRequest = (await import('next/server')).NextRequest
  const sifre = await import('@/lib/security/encryption')
  sifrele = sifre.encrypt
  K = await import('./fotoArsivi')
  Z = await import('../uygulama/zaman')
  rota = (await import('../../../app/api/ulke/hasta-foto/route.ulke')) as unknown as Mod
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
  BUGUN = Z.yerelAn(BASLANGIC_ANI, paket.saatDilimi).gun
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); if (AKTIF) sifirla() })

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
const YOL = '/api/ulke/hasta-foto'

describe('patient photo archive — keeping a photo', () => {
  it('registered on the doctor\'s own patient; the label is one encrypted value, bound to the row; a visit of that same patient is linked', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const r = await K.fotoKaydet(sb(), DA, { hastaId: H1, yol, ...GECERLI, boyut, cekimTarihi: BUGUN, etiket: 'sol kol', seansId: V1 })
    assert.equal(r.tamam, true, JSON.stringify(r))
    const s = fotolar().find((x) => x.id === (r as { id: string }).id) as Satir
    assert.deepEqual([s.ulke, s.doctor_id, s.patient_id, s.session_id, s.cekim_tarihi, s.mime_turu, s.boyut, s.depolama_yolu], [BU, DA, H1, V1, BUGUN, 'image/jpeg', boyut, yol])
    assert.ok(!String(s.etiket_encrypted).includes('sol kol'), 'the label is readable in clear text on the row')
  })

  it('a visit of ANOTHER patient is dropped, not refused: the photo is still filed, with no visit link', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const r = await K.fotoKaydet(sb(), DA, { hastaId: H1, yol, ...GECERLI, boyut, cekimTarihi: BUGUN, seansId: V3 })
    assert.equal(r.tamam, true)
    assert.equal(fotolar().find((x) => x.id === (r as { id: string }).id)!.session_id, null)
  })

  it('a patient that is not this doctor\'s own: 404, before storage is ever touched', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    assert.deepEqual(await K.fotoKaydet(sb(), DA, { hastaId: H3, yol, ...GECERLI, boyut, cekimTarihi: BUGUN }), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.fotoKaydet(sb(), DA, { hastaId: YOK, yol, ...GECERLI, boyut, cekimTarihi: BUGUN }), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(fotolar().length, 0)
    assert.equal(vt.depo.size, 1, 'the object was left exactly as it was')
  })

  it('a path outside the caller\'s own folder, an unaccepted type, a mismatched size, and a bad clinical date are all refused', async () => {
    if (!AKTIF) return
    const foreign = yolVeNesne(DA)
    assert.deepEqual(await K.fotoKaydet(sb(), DA, { hastaId: H1, yol: `${BU}/${DB}/f.jpg`, ...GECERLI, boyut: foreign.boyut, cekimTarihi: BUGUN }), { tamam: false, kod: 'NOT_FOUND' })
    const tur = yolVeNesne(DA, 'tur.jpg')
    assert.deepEqual(await K.fotoKaydet(sb(), DA, { hastaId: H1, yol: tur.yol, mimeTuru: 'application/pdf', boyut: tur.boyut, cekimTarihi: BUGUN }), { tamam: false, kod: 'DOSYA_TURU' })
    const buyuk = yolVeNesne(DA, 'buyuk.jpg')
    assert.deepEqual(await K.fotoKaydet(sb(), DA, { hastaId: H1, yol: buyuk.yol, ...GECERLI, boyut: buyuk.boyut + 1, cekimTarihi: BUGUN }), { tamam: false, kod: 'BUYUK' })
    const yarin = Z.gunEkle(BUGUN, 1)
    for (const tarih of ['2026-02-30', '12.10.2026', 'yarin', yarin, '']) {
      const d = yolVeNesne(DA, `tarih-${tarih || 'bos'}.jpg`)
      assert.deepEqual(await K.fotoKaydet(sb(), DA, { hastaId: H1, yol: d.yol, ...GECERLI, boyut: d.boyut, cekimTarihi: tarih }), { tamam: false, kod: 'TARIH_GECERSIZ' }, tarih)
    }
    assert.equal(fotolar().length, 0)
  })
})

describe('patient photo archive — editing and deleting', () => {
  it('the doctor corrects the label and the date of their OWN photo; nothing else about the row can change', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const r = await K.fotoKaydet(sb(), DA, { hastaId: H1, yol, ...GECERLI, boyut, cekimTarihi: BUGUN })
    const id = (r as { id: string }).id
    assert.deepEqual(await K.fotoDuzenle(sb(), DA, id, { etiket: 'yeni etiket', cekimTarihi: Z.gunEkle(BUGUN, -1) }), { tamam: true })
    const s = fotolar().find((x) => x.id === id) as Satir
    assert.deepEqual([s.depolama_yolu, s.doctor_id, s.patient_id], [yol, DA, H1])
    assert.equal(s.cekim_tarihi, Z.gunEkle(BUGUN, -1))
    assert.deepEqual(await K.fotoDuzenle(sb(), DA, id, { cekimTarihi: Z.gunEkle(BUGUN, 1) }), { tamam: false, kod: 'TARIH_GECERSIZ' })
    assert.deepEqual(await K.fotoDuzenle(sb(), DB, id, { etiket: 'x' }), { tamam: false, kod: 'NOT_FOUND' })
  })

  it('delete removes the row and the object; a foreign id is 404 and changes nothing', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const r = await K.fotoKaydet(sb(), DA, { hastaId: H1, yol, ...GECERLI, boyut, cekimTarihi: BUGUN })
    const id = (r as { id: string }).id
    assert.deepEqual(await K.fotoSil(sb(), DB, id), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(fotolar().length, 1); assert.equal(vt.depo.size, 1)
    assert.deepEqual(await K.fotoSil(sb(), DA, id), { tamam: true })
    assert.equal(fotolar().length, 0); assert.equal(vt.depo.size, 0)
  })
})

describe('patient photo archive — isolation', () => {
  it('doctor A → B and B → A: a foreign patient and a foreign photo answer exactly like one that does not exist', async () => {
    if (!AKTIF) return
    const a = yolVeNesne(DA, 'a.jpg')
    const ra = await K.fotoKaydet(sb(), DA, { hastaId: H1, yol: a.yol, ...GECERLI, boyut: a.boyut, cekimTarihi: BUGUN })
    const idA = (ra as { id: string }).id
    assert.deepEqual(await K.hastaninFotolari(sb(), DB, H1), null)
    assert.deepEqual(await K.fotoGoruntuBaglantisi(sb(), DB, idA), null)
    assert.deepEqual(await K.fotoDuzenle(sb(), DB, idA, { etiket: 'x' }), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.fotoSil(sb(), DB, idA), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(fotolar().length, 1)
  })

  it('every statement on the table carries the doctor\'s id and the country', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const r = await K.fotoKaydet(sb(), DA, { hastaId: H1, yol, ...GECERLI, boyut, cekimTarihi: BUGUN })
    const id = (r as { id: string }).id
    await K.hastaninFotolari(sb(), DA, H1); await K.fotoGoruntuBaglantisi(sb(), DA, id); await K.fotoDuzenle(sb(), DA, id, { etiket: 'x' }); await K.fotoSil(sb(), DA, id)
    const s = vt.sorgular.filter((x) => x.tablo === 'ulke_hasta_fotograflari')
    assert.ok(s.length >= 4)
    for (const x of s) {
      assert.equal(x.ulke, BU)
      if (x.islem !== 'insert') assert.ok(x.filtreler.includes(`doctor_id=eq.${DA}`), `${x.islem} without the doctor: ${x.filtreler.join(' & ')}`)
    }
  })
})

describe('patient photo archive — the route', () => {
  it('a pack without the feature: "not found" on every method, signed in or not', async () => {
    if (AKTIF) return
    for (const [y, yol, s] of [['GET', `${YOL}?hastaId=${H1}`, {}], ['GET', `${YOL}?hastaId=${H1}`, { jeton: 'jeton-a' }], ['POST', YOL, { jeton: 'jeton-a', govde: {} }], ['PATCH', YOL, { jeton: 'jeton-a', govde: { id: YOK } }], ['DELETE', YOL, { jeton: 'jeton-a', govde: { id: YOK } }]] as const) {
      const r = await cagir(y, yol, s)
      assert.deepEqual([r.status, r.govde.code], [404, 'NOT_FOUND'], `${y} ${yol}`)
    }
  })

  it('without a session: 401 on every method; nothing is read', async () => {
    if (!AKTIF) return
    for (const [y, yol, govde] of [['GET', `${YOL}?hastaId=${H1}`, undefined], ['POST', YOL, { hastaId: H1 }], ['PATCH', YOL, { id: YOK }], ['DELETE', YOL, { id: YOK }]] as const) {
      const r = await cagir(y, yol, { govde })
      assert.deepEqual([r.status, r.govde.code], [401, 'OTURUM_YOK'], `${y} ${yol}`)
    }
    assert.equal(vt.sorgular.filter((x) => x.tablo === 'ulke_hasta_fotograflari').length, 0)
  })

  it('register, list and a signed view link through the handlers; another doctor\'s patient is refused', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const k = await cagir('POST', YOL, { jeton: 'jeton-a', govde: { hastaId: H1, yol, ...GECERLI, boyut, cekimTarihi: BUGUN, etiket: 'sol kol' } })
    assert.equal(k.status, 200, JSON.stringify(k.govde))
    const liste = await cagir('GET', `${YOL}?hastaId=${H1}`, { jeton: 'jeton-a' })
    assert.deepEqual([liste.status, liste.govde.fotolar.length, liste.govde.fotolar[0].etiket], [200, 1, 'sol kol'])
    const indir = await cagir('GET', `${YOL}?indir=${k.govde.id}`, { jeton: 'jeton-a' })
    assert.equal(indir.status, 200); assert.match(indir.govde.url, /^https:\/\//)
    for (const r of [await cagir('GET', `${YOL}?hastaId=${H3}`, { jeton: 'jeton-a' }), await cagir('GET', `${YOL}?indir=${k.govde.id}`, { jeton: 'jeton-b' }), await cagir('PATCH', YOL, { jeton: 'jeton-b', govde: { id: k.govde.id, etiket: 'x' } }), await cagir('DELETE', YOL, { jeton: 'jeton-b', govde: { id: k.govde.id } })]) {
      assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }])
    }
    assert.deepEqual((await cagir('PATCH', YOL, { jeton: 'jeton-a', govde: { id: k.govde.id, etiket: 'sag kol' } })).govde, { ok: true })
    assert.deepEqual((await cagir('DELETE', YOL, { jeton: 'jeton-a', govde: { id: k.govde.id } })).govde, { ok: true })
    assert.equal(fotolar().length, 0)
  })
})
