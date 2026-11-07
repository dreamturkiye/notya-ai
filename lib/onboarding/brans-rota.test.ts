/**
 * KAYIT-BRANS-01 (Kaan, 2026-11-07) — the branch gate on the server, with the REAL route handlers (only the database
 * and the session are stand-ins: lib/security/testing/sahteSupabase.ts). Synthetic QA data only.
 *
 *   1. GET /api/users/me answers `brans_gerekli`: true for an account with no branch the app can read (none, "genel",
 *      "Diğer"); false for a real branch (canonical key or an old label), for staff and for mali / avukat.
 *   2. POST /api/users/brans: refuses a missing or invalid branch (400, Turkish), refuses to overwrite a branch that is
 *      on record (409), writes exactly the chosen key to the caller's own row and metadata.
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { SUPERUSER_BRANS_IDS } from '../auth/superuserBranslar'
import { KAYIT_BRANS_MESAJ } from './kayitBransi'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

let db = new SahteVeritabani()
let metalar = new Map<string, Record<string, unknown>>()
let metaYazimlari: Array<{ id: string; user_metadata: Record<string, unknown> }> = []

function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: {
      getUser: async (jwt?: string) => {
        const s = await c().auth.getUser(jwt)
        const u = s.data.user
        return u ? { data: { user: { ...u, user_metadata: { ...(metalar.get(u.id) || {}) } } }, error: null } : s
      },
      admin: {
        updateUserById: async (id: string, g: { user_metadata: Record<string, unknown> }) => {
          metaYazimlari.push({ id, user_metadata: { ...g.user_metadata } })
          metalar.set(id, { ...g.user_metadata })
          return { data: null, error: null }
        },
      },
    },
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
globalThis.fetch = (async (g: unknown) => { throw new Error(`the branch test must not reach the network: ${String(g)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let BRANS: Record<string, any>
let ME: Record<string, any>

before(async () => {
  NextRequestSinifi = (await import('next/server')).NextRequest
  BRANS = await import('../../app/api/users/brans/route')
  ME = await import('../../app/api/users/me/route')
})

beforeEach(() => {
  db = new SahteVeritabani()
  metalar = new Map()
  metaYazimlari = []
})

function hesap(o: { id?: string; meta?: Record<string, unknown>; satir?: Record<string, unknown> | null } = {}) {
  const id = o.id || randomUUID()
  const token = `qa-${id}`
  const email = `qa-${id.slice(0, 8)}@ornek.test`
  db.kullanicilar.set(token, { id, email })
  metalar.set(id, { ...(o.meta || {}) })
  if (o.satir) db.ekle('users', { id, email, ...o.satir })
  return { id, token, email }
}
const satir = (id: string) => db.tablo('users').find((r) => r.id === id) || null

async function kaydet(token: string | null, govde?: unknown) {
  const y = await BRANS.POST(new NextRequestSinifi('http://localhost/api/users/brans', {
    method: 'POST',
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' },
    body: JSON.stringify(govde ?? {}),
  }))
  return { durum: y.status, veri: (await y.json()) as Record<string, any> }
}
async function ben(token: string) {
  const y = await ME.GET(new NextRequestSinifi('http://localhost/api/users/me', { method: 'GET', headers: { authorization: `Bearer ${token}`, 'x-profil-tazele': '1' } }))
  return (await y.json()) as { data: Record<string, any> }
}

describe('GET /api/users/me: brans_gerekli', () => {
  it('an account with no branch the app can read must choose one', async () => {
    for (const durum of [
      { satir: null, meta: {} },
      { satir: { full_name: 'qa', specialty: null, onboarding_completed: true }, meta: { onboarding_completed: true } },
      { satir: { full_name: 'qa', specialty: 'genel', profession_type: 'doktor' }, meta: {} },
      { satir: { full_name: 'qa', specialty: 'Diğer', profession_type: 'doktor', onboarding_completed: true }, meta: {} },
      { satir: { full_name: 'qa', specialty: '', profession_type: 'doktor' }, meta: { kayit_bransi: 'pediatri' } },
    ]) {
      const h = hesap(durum)
      assert.equal((await ben(h.token)).data.brans_gerekli, true, JSON.stringify(durum))
    }
  })
  it('a real branch (canonical key or an old label), staff and non-medical professions are not asked', async () => {
    for (const durum of [
      { satir: { full_name: 'qa', specialty: 'pediatri', profession_type: 'doktor' }, meta: {} },
      { satir: { full_name: 'qa', specialty: 'Pediatri', profession_type: 'doktor' }, meta: {} },
      { satir: { full_name: 'qa', specialty: 'kadin-dogum', profession_type: 'doktor' }, meta: {} },
      { satir: { full_name: 'qa', specialty: 'sac-ekimi', profession_type: 'klinik-uzman' }, meta: {} },
      { satir: { full_name: 'qa', specialty: 'genel', profession_type: 'doktor' }, meta: { specialty: 'kardiyoloji' } },
      { satir: null, meta: { personel: true } },
      { satir: { full_name: 'qa', specialty: 'Muhasebe', profession_type: 'mali' }, meta: {} },
      { satir: { full_name: 'qa', specialty: 'Ceza Hukuku', profession_type: 'avukat' }, meta: {} },
    ]) {
      const h = hesap(durum)
      assert.equal((await ben(h.token)).data.brans_gerekli, false, JSON.stringify(durum))
    }
  })
})

describe('POST /api/users/brans: server-side enforcement', () => {
  it('no session → 401', async () => {
    assert.equal((await kaydet(null, { specialty: 'pediatri' })).durum, 401)
  })
  it('missing or invalid branch → 400 with a Turkish message; nothing is written', async () => {
    for (const [govde, ileti] of [
      [{}, KAYIT_BRANS_MESAJ.gerekli],
      [{ specialty: '' }, KAYIT_BRANS_MESAJ.gerekli],
      [{ specialty: 'Diğer' }, KAYIT_BRANS_MESAJ.gecersiz],
      [{ specialty: 'genel' }, KAYIT_BRANS_MESAJ.gecersiz],
      [{ specialty: 'Pediatri' }, KAYIT_BRANS_MESAJ.gecersiz],
      [{ specialty: 'kadin-dogum' }, KAYIT_BRANS_MESAJ.gecersiz],
      [{ specialty: 42 }, KAYIT_BRANS_MESAJ.gerekli],
    ] as Array<[Record<string, unknown>, string]>) {
      const h = hesap({ satir: { full_name: 'qa', specialty: null } })
      const { durum, veri } = await kaydet(h.token, govde)
      assert.equal(durum, 400, JSON.stringify(govde))
      assert.equal(veri.error, ileti)
      assert.equal(veri.alan, 'specialty')
      assert.equal(satir(h.id)!.specialty, null)
    }
    assert.equal(metaYazimlari.length, 0)
  })
  it('an account with no branch: the chosen key is written to its own row and metadata', async () => {
    const h = hesap({ satir: { full_name: 'qa', specialty: 'genel', profession_type: 'doktor', onboarding_completed: true }, meta: { onboarding_completed: true, baska: 'korunur' } })
    const diger = hesap({ satir: { full_name: 'diger', specialty: null } })
    const { durum, veri } = await kaydet(h.token, { specialty: 'kulak-burun-bogaz' })
    assert.equal(durum, 200)
    assert.equal(veri.specialty, 'kulak-burun-bogaz')
    assert.equal(satir(h.id)!.specialty, 'kulak-burun-bogaz')
    assert.equal(satir(diger.id)!.specialty, null, 'no other account is touched')
    assert.deepEqual(metaYazimlari, [{ id: h.id, user_metadata: { onboarding_completed: true, baska: 'korunur', specialty: 'kulak-burun-bogaz' } }])
    assert.equal((await ben(h.token)).data.brans_gerekli, false, 'the gate opens')
  })
  it('an Özel Branş is accepted too; an account with no users row gets one', async () => {
    const h = hesap({ meta: {} })
    const { durum } = await kaydet(h.token, { specialty: 'fizyoterapi' })
    assert.equal(durum, 200)
    assert.equal(satir(h.id)!.specialty, 'fizyoterapi')
    assert.equal(satir(h.id)!.email, h.email)
  })
  it('a branch already on record is not overwritten (409) — this is not a branch switch', async () => {
    const h = hesap({ satir: { full_name: 'qa', specialty: 'pediatri', profession_type: 'doktor' } })
    const { durum, veri } = await kaydet(h.token, { specialty: 'kardiyoloji' })
    assert.equal(durum, 409)
    assert.equal(veri.error, KAYIT_BRANS_MESAJ.zatenKayitli)
    assert.equal(satir(h.id)!.specialty, 'pediatri')
    assert.equal(metaYazimlari.length, 0)
  })
  it('the verified superusers may still write through it (they switch branches by design)', async () => {
    const h = hesap({ id: SUPERUSER_BRANS_IDS[0], satir: { full_name: 'qa', specialty: 'pediatri', profession_type: 'doktor' } })
    assert.equal((await kaydet(h.token, { specialty: 'kadin-hastaliklari-dogum' })).durum, 200)
    assert.equal(satir(h.id)!.specialty, 'kadin-hastaliklari-dogum')
  })
})
