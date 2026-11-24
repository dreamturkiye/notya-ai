/**
 * ESNEK-A-EVAL (2026-11-24) — the short-lived evaluation pass of the founder El Notu evaluation route. The REAL route
 * handler runs against the fake database (lib/security/testing/sahteSupabase.ts); no model call is ever reached (every
 * case here stops at authorization, body validation or the masking proof).
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import jpeg from 'jpeg-js'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { anahtarKarari, anahtarOzeti, DEGERLENDIRME_BASLIGI } from './degerlendirmeAnahtari'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
delete process.env.CRON_SECRET

let db = new SahteVeritabani()
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return { from: (t: string) => c().from(t), auth: { getUser: (j?: string) => c().auth.getUser(j) }, storage: { from: (k: string) => c().storage.from(k) }, rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a) }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`the evaluation-pass tests must not reach the network: ${String(g)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let POST: (req: any) => Promise<Response>

const yeniAnahtar = () => randomBytes(32).toString('base64url')
const SAAT = 3600_000
function satirKoy(anahtar: string, o: { amac?: string; sonKullanma?: number; iptal?: boolean } = {}) {
  db.ekle('degerlendirme_anahtarlari', { anahtar_ozeti: anahtarOzeti(anahtar), amac: o.amac ?? 'el-notu-degerlendir', son_kullanma: new Date(o.sonKullanma ?? Date.now() + SAAT).toISOString(), iptal: o.iptal ?? false })
}
/** 64×64 JPEG of one grey level (255 = an UNMASKED white box, 0 = black). */
function resim(gri: number) {
  const d = Buffer.alloc(64 * 64 * 4, gri); for (let i = 3; i < d.length; i += 4) d[i] = 255
  return { mime: 'image/jpeg', base64: Buffer.from(jpeg.encode({ width: 64, height: 64, data: d }, 90).data).toString('base64') }
}
const KUTU = { x0: 0.1, y0: 0.1, x1: 0.6, y1: 0.3 }
const paket = (kutular?: unknown[]) => ({ sayfa: 1, sablonId: null, satirlar: [], bolgeler: [], ...(kutular ? { gizlilikKutulari: kutular } : {}) })
async function cagir(baslik: Record<string, string>, govde: unknown) {
  const req = new NextRequestSinifi('http://localhost/api/kurucu/el-notu-degerlendir', { method: 'POST', headers: { 'content-type': 'application/json', ...baslik }, body: JSON.stringify(govde) })
  const r = await POST(req)
  return { status: r.status, j: (await r.json()) as Record<string, unknown> }
}
const GECERSIZ_GOVDE = { ad: 'x' }

describe('El Notu evaluation route — short-lived evaluation pass', () => {
  before(async () => {
    NextRequestSinifi = (await import('next/server')).NextRequest
    ;({ POST } = await import('../../app/api/kurucu/el-notu-degerlendir/route'))
  })

  it('pure decision: unexpired + unrevoked + right purpose only', () => {
    const t = Date.now()
    assert.equal(anahtarKarari({ amac: 'el-notu-degerlendir', son_kullanma: new Date(t + 1000).toISOString(), iptal: false }, 'el-notu-degerlendir', t), 'tamam')
    assert.equal(anahtarKarari(null, 'el-notu-degerlendir', t), 'gecersiz')
    assert.equal(anahtarKarari({ amac: 'el-notu-degerlendir', son_kullanma: new Date(t - 1).toISOString(), iptal: false }, 'el-notu-degerlendir', t), 'gecersiz')
    assert.equal(anahtarKarari({ amac: 'el-notu-degerlendir', son_kullanma: new Date(t + 1000).toISOString(), iptal: true }, 'el-notu-degerlendir', t), 'gecersiz')
    assert.equal(anahtarKarari({ amac: 'baska', son_kullanma: new Date(t + 1000).toISOString(), iptal: false }, 'el-notu-degerlendir', t), 'gecersiz')
    assert.equal(anahtarKarari({ amac: 'el-notu-degerlendir', son_kullanma: 'yok', iptal: false }, 'el-notu-degerlendir', t), 'gecersiz')
  })

  it('no credential at all → the unchanged 404 (route stays hidden)', async () => {
    db = new SahteVeritabani()
    assert.equal((await cagir({}, GECERSIZ_GOVDE)).status, 404)
  })

  it('valid pass → authorized (reaches body validation: 400 on a malformed body)', async () => {
    db = new SahteVeritabani(); const a = yeniAnahtar(); satirKoy(a)
    assert.equal((await cagir({ [DEGERLENDIRME_BASLIGI]: a }, GECERSIZ_GOVDE)).status, 400)
  })

  it('expired, revoked, wrong purpose, unknown (missing row) and malformed passes → 403', async () => {
    db = new SahteVeritabani()
    const suresi = yeniAnahtar(); satirKoy(suresi, { sonKullanma: Date.now() - 1000 })
    const iptal = yeniAnahtar(); satirKoy(iptal, { iptal: true })
    const amac = yeniAnahtar(); satirKoy(amac, { amac: 'baska-amac' })
    for (const a of [suresi, iptal, amac, yeniAnahtar(), 'kisa', '']) {
      const r = await cagir({ [DEGERLENDIRME_BASLIGI]: a }, GECERSIZ_GOVDE)
      assert.equal(r.status, 403, `pass refused (${a.length} chars)`)
      assert.ok(!JSON.stringify(r.j).includes(a) || a === '', 'the token is never echoed')
    }
  })

  it('an invalid pass is not rescued by another credential in the same request', async () => {
    db = new SahteVeritabani(); const a = yeniAnahtar(); satirKoy(a, { iptal: true })
    assert.equal((await cagir({ [DEGERLENDIRME_BASLIGI]: a, authorization: 'Bearer x' }, GECERSIZ_GOVDE)).status, 403)
  })

  it('valid pass + unmasked page is still refused before any model call (422)', async () => {
    db = new SahteVeritabani(); const a = yeniAnahtar(); satirKoy(a)
    const kutusuz = await cagir({ [DEGERLENDIRME_BASLIGI]: a }, { ad: 'p', paket: paket(), maskeliSayfa: resim(255), gercekler: [] })
    assert.equal(kutusuz.status, 422); assert.equal(kutusuz.j.neden, 'kutu_yok')
    const acik = await cagir({ [DEGERLENDIRME_BASLIGI]: a }, { ad: 'p', paket: paket([KUTU]), maskeliSayfa: resim(255), gercekler: [] })
    assert.equal(acik.status, 422); assert.equal(acik.j.neden, 'kutu_acik')
    // the single-call mode is behind the same proof
    const cagriAcik = await cagir({ [DEGERLENDIRME_BASLIGI]: a }, { paket: paket([KUTU]), maskeliSayfa: resim(255), cagri: { tur: 'metin', etiket: 'x', sistem: 's', mesaj: 'm', azamiToken: 1000 } })
    assert.equal(cagriAcik.status, 422)
  })

  it('single-call mode: pictures only by reference into the proven package (inline picture / unknown ref → 400)', async () => {
    db = new SahteVeritabani(); const a = yeniAnahtar(); satirKoy(a)
    const govde = (parcalar: unknown[]) => ({ paket: paket([KUTU]), maskeliSayfa: resim(0), cagri: { tur: 'gorsel', etiket: 'x', sistem: 's', parcalar, azamiToken: 1000 } })
    assert.equal((await cagir({ [DEGERLENDIRME_BASLIGI]: a }, govde([{ tur: 'gorsel', gorsel: resim(255) }]))).status, 400)
    assert.equal((await cagir({ [DEGERLENDIRME_BASLIGI]: a }, govde([{ tur: 'ref', ref: 'parca:0' }]))).status, 400)
    assert.equal((await cagir({ [DEGERLENDIRME_BASLIGI]: a }, govde([{ tur: 'ref', ref: 'bolge:yok' }]))).status, 400)
    assert.equal((await cagir({ [DEGERLENDIRME_BASLIGI]: a }, { ...govde([]), cagri: { tur: 'metin', etiket: 'x', sistem: 's', mesaj: 'm', azamiToken: 999_999 } })).status, 400)
  })
})
