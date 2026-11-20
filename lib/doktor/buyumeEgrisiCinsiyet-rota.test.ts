/**
 * CINSIYET-NORMAL-01 (2026-11-20, demo account) — a patient added through the manual "Yeni Hasta" form stored
 * gender as "Kadın" / "Erkek"; GET /api/doktor/hastalar/[id]/buyume-egrileri accepted only 'male' | 'female' and
 * answered "Doğum tarihi veya cinsiyet kayıtlı değil" — no Neyzi chart. The REAL route handler runs here against
 * the fake database (lib/security/testing/sahteSupabase.ts); only the DB and the session are fake.
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-buyume-cinsiyet-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'

let db = new SahteVeritabani()
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`büyüme testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let encrypt: (s: string) => string
let GET: (req: any, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

function sahne(cinsiyetHam: string | null) {
  db = new SahteVeritabani()
  const hekim = randomUUID()
  const token = `qa-buyume-${randomUUID()}`
  db.kullanicilar.set(token, { id: hekim })
  db.ekle('users', { id: hekim, full_name: 'Dr. QA Pediatri', specialty: 'pediatri' })
  const hasta = db.ekle('patients', {
    doctor_id: hekim, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Elif' })),
    dob_encrypted: encrypt('2026-10-21'), gender_encrypted: cinsiyetHam == null ? null : encrypt(cinsiyetHam),
  }).id
  return { token, hasta }
}
async function cagir(token: string, hasta: string) {
  const req = new NextRequestSinifi(`http://localhost/api/doktor/hastalar/${hasta}/buyume-egrileri`, { headers: { authorization: `Bearer ${token}` } })
  const r = await GET(req, { params: Promise.resolve({ id: hasta }) })
  return { status: r.status, j: await r.json() as Record<string, any> }
}

describe('Büyüme eğrileri — manually added patient (gender stored as Kadın / Erkek)', () => {
  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    ;({ GET } = await import('../../app/api/doktor/hastalar/[id]/buyume-egrileri/route'))
  })

  for (const [ham, beklenen] of [['Kadın', 'female'], ['Erkek', 'male'], ['Kız', 'female'], ['K', 'female'], ['E', 'male'], ['female', 'female'], ['male', 'male']] as const) {
    it(`"${ham}" → Neyzi chart drawn (${beklenen})`, async () => {
      const s = sahne(ham)
      const { status, j } = await cagir(s.token, s.hasta)
      assert.equal(status, 200)
      assert.equal(j.dogumBilinmiyor, false, 'must not say "Doğum tarihi veya cinsiyet kayıtlı değil"')
      assert.equal(j.cinsiyet, beklenen)
      assert.ok(Array.isArray(j.parametreler.kilo.egriler) && j.parametreler.kilo.egriler.length > 0, 'weight percentile lines present')
      assert.ok(j.parametreler.boy.egriler.length > 0 && j.parametreler.basCevresi.egriler.length > 0)
    })
  }

  it('genuinely missing gender still says so (no guess)', async () => {
    const s = sahne(null)
    const { status, j } = await cagir(s.token, s.hasta)
    assert.equal(status, 200)
    assert.equal(j.dogumBilinmiyor, true)
  })

  it("another doctor's token → 404 (HASTA-IZOLASYON-01 unchanged)", async () => {
    const s = sahne('Kadın')
    const yabanci = `qa-yabanci-${randomUUID()}`
    const yabanciId = randomUUID()
    db.kullanicilar.set(yabanci, { id: yabanciId })
    db.ekle('users', { id: yabanciId, full_name: 'Dr. QA Yabancı', specialty: 'pediatri' })
    const { status } = await cagir(yabanci, s.hasta)
    assert.equal(status, 404)
  })
})
