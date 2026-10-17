/**
 * MUAYENE-EKLERI-07 — "Yüklenen dosyalar": a file attached to one visit, for whatever pack is active. Runs ONCE
 * PER PACK (a pack without `muayeneEkleri` skips every assertion but still proves the route answers "not found").
 *
 * Real handlers and real library code. The database and storage are stand-ins inside this process; any network
 * address fails the test. Synthetic data only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'

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
/** The pack turns MUAYENE-EKLERI-07 on. */
let AKTIF = false
let NextRequest: typeof import('next/server').NextRequest
let K: typeof import('./muayeneEki')
let rota: Mod

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001' // patient of doctor A
const H3 = '30000000-0000-4000-8000-000000000003' // patient of doctor B
const V1 = '40000000-0000-4000-8000-000000000001' // visit of doctor A, patient H1
const V3 = '40000000-0000-4000-8000-000000000003' // visit of doctor B, patient H3
const YOK = '77777777-7777-4777-8777-777777777777'
const KOVA = 'muayene-ekleri'

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const ekler = () => tablo('ulke_muayene_ekleri')
const simdiIso = () => new Date().toISOString()

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
}

/** The path the browser would have uploaded into, and the object already sitting there. */
function yolVeNesne(doktor: string, dosya = 'k.pdf', bayt = 'sentetik pdf — hiçbir gerçek dosya değil') {
  const yol = `${BU}/${doktor}/${dosya}`
  vt.depo.set(`${KOVA}/${yol}`, new Blob([bayt]))
  return { yol, boyut: new Blob([bayt]).size }
}
const GECERLI = { ad: 'Lab sonucu', mimeTuru: 'application/pdf' }

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  AKTIF = paket.ozellikler.muayeneEkleri === true
  NextRequest = (await import('next/server')).NextRequest
  K = await import('./muayeneEki')
  rota = (await import('../../../app/api/ulke/muayene-ek/route.ulke')) as unknown as Mod
})
beforeEach(() => { if (AKTIF) sifirla() })

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
const YOL = '/api/ulke/muayene-ek'

describe('exam-visit attachments — keeping a file', () => {
  it('registered on the visit\'s own patient and doctor; the name is one encrypted value, bound to the row', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const r = await K.muayeneEkiKaydet(sb(), DA, { seansId: V1, yol, ...GECERLI, boyut })
    assert.equal(r.tamam, true, JSON.stringify(r))
    const s = ekler().find((x) => x.id === (r as { id: string }).id) as Satir
    assert.deepEqual([s.ulke, s.doctor_id, s.patient_id, s.session_id, s.mime_turu, s.boyut, s.depolama_yolu], [BU, DA, H1, V1, 'application/pdf', boyut, yol])
    assert.ok(!String(s.ad_encrypted).includes('Lab sonucu'), 'the file name is readable in clear text on the row')
  })

  it('a visit that is not this doctor\'s own: 404, before storage is ever touched', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    assert.deepEqual(await K.muayeneEkiKaydet(sb(), DA, { seansId: V3, yol, ...GECERLI, boyut }), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await K.muayeneEkiKaydet(sb(), DA, { seansId: YOK, yol, ...GECERLI, boyut }), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(ekler().length, 0)
    assert.equal(vt.depo.size, 1, 'the object was left exactly as it was: nothing was removed for a visit that was never reached')
  })

  it('a path outside the caller\'s own folder is refused, and the object underneath it is left alone', async () => {
    if (!AKTIF) return
    const { boyut } = yolVeNesne(DA)
    for (const yol of [`${BU}/${DB}/k.pdf`, `${BU}/${DA}/../${DA}/k.pdf`, `${BU}/${DA}`, 'k.pdf', '']) {
      assert.deepEqual(await K.muayeneEkiKaydet(sb(), DA, { seansId: V1, yol, ...GECERLI, boyut }), { tamam: false, kod: 'NOT_FOUND' }, yol)
    }
    assert.equal(ekler().length, 0)
  })

  it('an empty name, an unaccepted type, and a size that does not match the real object are refused — nothing is kept, and the object is removed', async () => {
    if (!AKTIF) return
    for (const [g, kod] of [[{ ad: '' }, 'AD_GEREKLI'], [{ mimeTuru: 'application/zip' }, 'DOSYA_TURU'], [{ boyut: 999_999_999 }, 'BUYUK']] as const) {
      const { yol, boyut } = yolVeNesne(DA, `${kod}.pdf`)
      assert.deepEqual(await K.muayeneEkiKaydet(sb(), DA, { seansId: V1, yol, ...GECERLI, ...g, boyut: 'boyut' in g ? g.boyut : boyut }), { tamam: false, kod })
    }
    assert.equal(ekler().length, 0)
  })

  it('a failed write answers BASARISIZ and removes the object; the list of one doctor\'s visit is isolated from another\'s', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    vt.boz.yaz.add('ulke_muayene_ekleri')
    assert.deepEqual(await K.muayeneEkiKaydet(sb(), DA, { seansId: V1, yol, ...GECERLI, boyut }), { tamam: false, kod: 'BASARISIZ' })
    assert.equal(vt.depo.size, 0)
    vt.boz.yaz.clear()
  })
})

describe('exam-visit attachments — isolation', () => {
  it('doctor A → B and B → A: a foreign visit and a foreign attachment answer exactly like one that does not exist', async () => {
    if (!AKTIF) return
    const a = yolVeNesne(DA, 'a.pdf')
    const ra = await K.muayeneEkiKaydet(sb(), DA, { seansId: V1, yol: a.yol, ...GECERLI, boyut: a.boyut })
    assert.equal(ra.tamam, true)
    const idA = (ra as { id: string }).id
    for (const [kim, seans, ek] of [[DB, V1, idA]] as const) {
      assert.deepEqual(await K.muayeneEkleriListesi(sb(), kim, seans), null)
      assert.deepEqual(await K.muayeneEkiIndirmeBaglantisi(sb(), kim, ek), null)
      assert.deepEqual(await K.muayeneEkiSil(sb(), kim, ek), { tamam: false, kod: 'NOT_FOUND' })
    }
    // the attachment, the visit and the object are all exactly as they were
    assert.equal(ekler().length, 1)
    assert.equal(vt.depo.size, 1)
  })

  it('every statement on the table carries the doctor\'s id and the country', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const r = await K.muayeneEkiKaydet(sb(), DA, { seansId: V1, yol, ...GECERLI, boyut })
    const id = (r as { id: string }).id
    await K.muayeneEkleriListesi(sb(), DA, V1); await K.muayeneEkiIndirmeBaglantisi(sb(), DA, id); await K.muayeneEkiSil(sb(), DA, id)
    const s = vt.sorgular.filter((x) => x.tablo === 'ulke_muayene_ekleri')
    assert.ok(s.length >= 3)
    for (const x of s) {
      assert.equal(x.ulke, BU)
      if (x.islem !== 'insert') assert.ok(x.filtreler.includes(`doctor_id=eq.${DA}`), `${x.islem} without the doctor: ${x.filtreler.join(' & ')}`)
    }
  })
})

describe('exam-visit attachments — the route', () => {
  it('a pack without the feature: "not found" on every method, signed in or not', async () => {
    if (AKTIF) return
    for (const [y, yol, s] of [['GET', `${YOL}?seansId=${V1}`, {}], ['GET', `${YOL}?seansId=${V1}`, { jeton: 'jeton-a' }], ['POST', YOL, { jeton: 'jeton-a', govde: {} }], ['DELETE', YOL, { jeton: 'jeton-a', govde: { id: YOK } }]] as const) {
      const r = await cagir(y, yol, s)
      assert.deepEqual([r.status, r.govde.code], [404, 'NOT_FOUND'], `${y} ${yol}`)
    }
  })

  it('without a session: 401 on every method; nothing is read', async () => {
    if (!AKTIF) return
    for (const [y, yol, govde] of [['GET', `${YOL}?seansId=${V1}`, undefined], ['POST', YOL, { seansId: V1 }], ['DELETE', YOL, { id: YOK }]] as const) {
      const r = await cagir(y, yol, { govde })
      assert.deepEqual([r.status, r.govde.code], [401, 'OTURUM_YOK'], `${y} ${yol}`)
    }
    assert.equal(vt.sorgular.filter((x) => x.tablo === 'ulke_muayene_ekleri').length, 0)
  })

  it('register, list and a signed download link through the handlers; another doctor\'s visit is refused', async () => {
    if (!AKTIF) return
    const { yol, boyut } = yolVeNesne(DA)
    const k = await cagir('POST', YOL, { jeton: 'jeton-a', govde: { seansId: V1, yol, ...GECERLI, boyut } })
    assert.equal(k.status, 200, JSON.stringify(k.govde))
    const liste = await cagir('GET', `${YOL}?seansId=${V1}`, { jeton: 'jeton-a' })
    assert.deepEqual([liste.status, liste.govde.ekler.length, liste.govde.ekler[0].ad], [200, 1, 'Lab sonucu'])
    const indir = await cagir('GET', `${YOL}?indir=${k.govde.id}`, { jeton: 'jeton-a' })
    assert.equal(indir.status, 200)
    assert.match(indir.govde.url, /^https:\/\//)
    for (const r of [await cagir('GET', `${YOL}?seansId=${V3}`, { jeton: 'jeton-a' }), await cagir('GET', `${YOL}?indir=${k.govde.id}`, { jeton: 'jeton-b' }), await cagir('DELETE', YOL, { jeton: 'jeton-b', govde: { id: k.govde.id } })]) {
      assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }])
    }
    assert.deepEqual((await cagir('DELETE', YOL, { jeton: 'jeton-a', govde: { id: k.govde.id } })).govde, { ok: true })
    assert.equal(ekler().length, 0)
  })
})
