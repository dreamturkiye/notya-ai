/**
 * AKKS routes — authorization and data isolation. The REAL route handlers run against the fake database
 * (lib/security/testing/sahteSupabase.ts); no model call is ever reached (every case stops at authorization, body
 * validation or a read).
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.FOUNDER_EMAILS = 'kurucu@notya.test'
process.env.CRON_SECRET = 'cron-gizli'

let db = new SahteVeritabani()
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return { from: (t: string) => c().from(t), auth: { getUser: (j?: string) => c().auth.getUser(j), admin: c().auth.admin }, storage: { from: (k: string) => c().storage.from(k) } }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`AKKS route tests must not reach the network: ${String(g)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let degerlendir: (req: any) => Promise<Response>
let panoGET: (req: any) => Promise<Response>
let panoPOST: (req: any) => Promise<Response>
let panelGET: (req: Request) => Promise<Response>
let panelPOST: (req: Request) => Promise<Response>
let cronGET: (req: Request) => Promise<Response>

const ozet = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex')
const jeton = () => randomBytes(32).toString('base64url')
const SAAT = 3600_000
const istek = (url: string, baslik: Record<string, string> = {}, govde?: unknown) =>
  new NextRequestSinifi(`http://localhost${url}`, { method: govde === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json', ...baslik }, ...(govde === undefined ? {} : { body: JSON.stringify(govde) }) })
const json = async (r: Response) => ({ status: r.status, j: (await r.json().catch(() => ({}))) as Record<string, any> })

function gecis(amac: string, o: { sonKullanma?: number; iptal?: boolean } = {}) {
  const t = jeton()
  db.ekle('degerlendirme_anahtarlari', { anahtar_ozeti: ozet(t), amac, son_kullanma: new Date(o.sonKullanma ?? Date.now() + SAAT).toISOString(), iptal: o.iptal ?? false })
  return t
}
function davet(rol: string, soru: string[], o: { sonKullanma?: number; iptal?: boolean } = {}) {
  const t = jeton()
  db.ekle('akks_panel_davetleri', { anahtar_ozeti: ozet(t), rol, brans: 'pediatri', kod: 'P1', soru_idleri: soru, son_kullanma: new Date(o.sonKullanma ?? Date.now() + SAAT).toISOString(), iptal: o.iptal ?? false })
  return t
}

describe('AKKS routes — authorization', () => {
  before(async () => {
    NextRequestSinifi = (await import('next/server')).NextRequest
    ;({ POST: degerlendir } = await import('../../app/api/kurucu/ayse-kalite-degerlendir/route'))
    ;({ GET: panoGET, POST: panoPOST } = await import('../../app/api/kurucu/ayse-kalite/route'))
    ;({ GET: panelGET, POST: panelPOST } = await import('../../app/api/akks/panel/route'))
    ;({ GET: cronGET } = await import('../../app/api/cron/ayse-kalite/route'))
  })

  it('evaluation route: no credential → 404 (hidden); a doctor session that is not a founder → 404', async () => {
    db = new SahteVeritabani()
    assert.equal((await json(await degerlendir(istek('/api/kurucu/ayse-kalite-degerlendir', {}, { islem: 'ozet' })))).status, 404)
    db.kullanicilar.set('doktor-jwt', { id: 'd1', email: 'doktor@notya.test' })
    assert.equal((await json(await degerlendir(istek('/api/kurucu/ayse-kalite-degerlendir', { authorization: 'Bearer doktor-jwt' }, { islem: 'ozet' })))).status, 404)
  })

  it('evaluation route: an El Notu pass, an expired or a revoked pass → 403 (purposes never mix); the token is never echoed', async () => {
    db = new SahteVeritabani()
    for (const t of [gecis('el-notu-degerlendir'), gecis('ayse-kalite-degerlendir', { sonKullanma: Date.now() - 1 }), gecis('ayse-kalite-degerlendir', { iptal: true }), jeton()]) {
      const r = await json(await degerlendir(istek('/api/kurucu/ayse-kalite-degerlendir', { 'x-degerlendirme-anahtari': t }, { islem: 'ozet' })))
      assert.equal(r.status, 403)
      assert.ok(!JSON.stringify(r.j).includes(t))
    }
  })

  it('evaluation route: a valid AKKS pass is authorized (reaches body validation / reads)', async () => {
    db = new SahteVeritabani()
    const t = gecis('ayse-kalite-degerlendir')
    assert.equal((await json(await degerlendir(istek('/api/kurucu/ayse-kalite-degerlendir', { 'x-degerlendirme-anahtari': t }, { islem: 'yok' })))).status, 400)
    assert.equal((await json(await degerlendir(istek('/api/kurucu/ayse-kalite-degerlendir', { 'x-degerlendirme-anahtari': t }, { islem: 'soru', kosuId: 'x', soruId: 'PED-001' })))).status, 400)
    const oz = await json(await degerlendir(istek('/api/kurucu/ayse-kalite-degerlendir', { 'x-degerlendirme-anahtari': t }, { islem: 'ozet' })))
    assert.equal(oz.status, 200); assert.equal(oz.j.kosu, null)
  })

  it('evaluation route: an item outside an open run is refused before any model call', async () => {
    db = new SahteVeritabani()
    const t = gecis('ayse-kalite-degerlendir')
    const k = db.ekle('akks_kosular', { etiket: 'x', tur: 'elle', durum: 'tamam', soru_idleri: ['PED-001'], branslar: ['pediatri'] })
    const r = await json(await degerlendir(istek('/api/kurucu/ayse-kalite-degerlendir', { 'x-degerlendirme-anahtari': t }, { islem: 'soru', kosuId: k.id, soruId: 'PED-001' })))
    assert.equal(r.status, 502); assert.match(String(r.j.error), /not in an open run/)
  })

  it('dashboard: founder only (no token / doctor token → 404; founder → 200, labelled vs guideline gold answers)', async () => {
    db = new SahteVeritabani()
    assert.equal((await panoGET(istek('/api/kurucu/ayse-kalite'))).status, 404)
    db.kullanicilar.set('doktor-jwt', { id: 'd1', email: 'doktor@notya.test' })
    assert.equal((await panoGET(istek('/api/kurucu/ayse-kalite', { authorization: 'Bearer doktor-jwt' }))).status, 404)
    assert.equal((await panoPOST(istek('/api/kurucu/ayse-kalite', { authorization: 'Bearer doktor-jwt' }, { islem: 'taban-kabul', kosuId: 'x' }))).status, 404)
    db.kullanicilar.set('kurucu-jwt', { id: 'k1', email: 'kurucu@notya.test' })
    const r = await json(await panoGET(istek('/api/kurucu/ayse-kalite', { authorization: 'Bearer kurucu-jwt' })))
    assert.equal(r.status, 200)
    assert.match(r.j.etiket, /kılavuz-altın-cevaba göre/)
    assert.ok(r.j.branslar.length === 40 && r.j.toplamSoru >= 1550)
    assert.ok(!/sertifika|certified|certification/i.test(JSON.stringify(r.j.etiket)))
  })

  it('panel: missing, unknown, expired or revoked invite → 404', async () => {
    db = new SahteVeritabani()
    assert.equal((await panelGET(new Request('http://localhost/api/akks/panel'))).status, 404)
    for (const t of [jeton(), davet('cevaplayici', ['PED-001'], { sonKullanma: Date.now() - 1 }), davet('cevaplayici', ['PED-001'], { iptal: true })]) {
      assert.equal((await panelGET(new Request('http://localhost/api/akks/panel', { headers: { 'x-akks-panel': t } }))).status, 404)
    }
  })

  it('panel: a Prof. answerer never receives the key points, the must-not list, the source or Ayşe\'s answer; items outside the invite are refused', async () => {
    db = new SahteVeritabani()
    db.ekle('akks_cevaplar', { kosu_id: 'k', soru_id: 'PED-001', brans: 'pediatri', cevap: 'AYSE-CEVABI-METNI', notlama: { puanlar: {} }, created_at: new Date().toISOString() })
    const t = davet('cevaplayici', ['PED-001'])
    const r = await json(await panelGET(new Request('http://localhost/api/akks/panel', { headers: { 'x-akks-panel': t } })))
    assert.equal(r.status, 200)
    const metin = JSON.stringify(r.j)
    assert.ok(!metin.includes('anahtarlar') && !metin.includes('soylememeli') && !metin.includes('kaynak') && !metin.includes('AYSE-CEVABI-METNI'))
    const p = await json(await panelPOST(new Request('http://localhost/api/akks/panel', { method: 'POST', headers: { 'x-akks-panel': t, 'content-type': 'application/json' }, body: JSON.stringify({ soruId: 'PED-002', cevap: 'yanıt metni' }) })))
    assert.equal(p.status, 400)
  })

  it('cron: only with the cron secret', async () => {
    assert.equal((await cronGET(new Request('http://localhost/api/cron/ayse-kalite'))).status, 401)
  })
})
