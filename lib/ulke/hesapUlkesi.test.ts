/**
 * NOTYA-ULKE-01 — country on the account, in a Türkiye deployment (no country configured).
 *
 *   - Every account that exists today (no stamp) keeps working: the real auth helpers and /api/users/me answer as before.
 *   - An account stamped with another country gets no session from the server helpers and the neutral refusal at login.
 *   - Migration 128: additive only, default 'tr' for every existing row.
 *
 * Real handlers, fake Supabase. Synthetic accounts only.
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { hesapBuUlkedeMi, hesapUlkesi, satirBuUlkedeMi, HESAP_REDDI_KODU } from './hesapUlkesi'

const KOK = resolve(__dirname, '../..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

type Hesap = { id: string; email: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
const HESAPLAR: Record<string, Hesap> = {
  'jeton-damgasiz': { id: '11111111-1111-4111-8111-111111111111', email: 'qa-damgasiz@notya.test', user_metadata: { specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true } },
  'jeton-tr': { id: '22222222-2222-4222-8222-222222222222', email: 'qa-tr@notya.test', app_metadata: { provider: 'email', country: 'tr' } },
  'jeton-uz': { id: '33333333-3333-4333-8333-333333333333', email: 'qa-uz@notya.test', app_metadata: { provider: 'email', country: 'uz' } },
  'jeton-satir-uz': { id: '44444444-4444-4444-8444-444444444444', email: 'qa-satir-uz@notya.test' },
}
const SATIRLAR: Record<string, Record<string, unknown>> = {
  [HESAPLAR['jeton-damgasiz'].id]: { id: HESAPLAR['jeton-damgasiz'].id, email: 'qa-damgasiz@notya.test', full_name: 'QA Hekim Damgasiz', specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true },
  [HESAPLAR['jeton-tr'].id]: { id: HESAPLAR['jeton-tr'].id, email: 'qa-tr@notya.test', full_name: 'QA Hekim TR', specialty: 'dahiliye', profession_type: 'doktor', onboarding_completed: true, country: 'tr', ui_language: 'tr' },
  [HESAPLAR['jeton-satir-uz'].id]: { id: HESAPLAR['jeton-satir-uz'].id, email: 'qa-satir-uz@notya.test', full_name: 'QA Hekim Satir UZ', profession_type: 'doktor', onboarding_completed: true, country: 'uz', ui_language: 'uz-Latn' },
}
const yazilanlar: { tablo: string; yuk: Record<string, unknown>; id: string }[] = []
const metaYazilari: { id: string; govde: Record<string, unknown> }[] = []

function sahteCreateClient() {
  return {
    auth: {
      getUser: async (jwt?: string) => {
        const u = jwt ? HESAPLAR[jwt] : undefined
        return u ? { data: { user: { user_metadata: {}, app_metadata: {}, ...u } }, error: null } : { data: { user: null }, error: { message: 'invalid JWT' } }
      },
      admin: { updateUserById: async (id: string, govde: Record<string, unknown>) => { metaYazilari.push({ id, govde }); return { data: null, error: null } } },
    },
    from: (tablo: string) => {
      let id = ''
      let yuk: Record<string, unknown> | null = null
      const z: Record<string, unknown> = {
        select: () => z,
        update: (g: Record<string, unknown>) => { yuk = g; return z },
        insert: (g: Record<string, unknown>) => { yuk = g; id = String(g.id); return z },
        eq: (_k: string, v: string) => { id = v; if (yuk) yazilanlar.push({ tablo, yuk, id }); return z },
        maybeSingle: async () => ({ data: tablo === 'users' ? (SATIRLAR[id] ?? null) : null, error: null }),
        single: async () => ({ data: tablo === 'users' ? { ...(SATIRLAR[id] ?? { id }), ...(yuk ?? {}) } : null, error: null }),
        then: (coz: (v: unknown) => void) => coz({ data: null, error: null }),
      }
      return z
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

describe('pure rules (Türkiye deployment)', () => {
  it('no stamp = a pre-country account = Türkiye', () => {
    for (const u of [null, undefined, {}, { app_metadata: null }, { app_metadata: {} }, { app_metadata: { country: '' } }, { app_metadata: { country: 7 } }]) {
      assert.equal(hesapUlkesi(u as never), 'tr')
      assert.equal(hesapBuUlkedeMi(u as never), true)
    }
    assert.equal(hesapBuUlkedeMi({ app_metadata: { country: 'tr' } }), true)
    assert.equal(hesapBuUlkedeMi({ app_metadata: { country: 'uz' } }), false)
    assert.equal(hesapBuUlkedeMi({ app_metadata: { country: 'az' } }), false)
  })

  it('a users row read before migration 128 (no column) is a Türkiye row', () => {
    for (const s of [null, undefined, {}, { country: null }, { country: '' }]) assert.equal(satirBuUlkedeMi(s as never), true)
    assert.equal(satirBuUlkedeMi({ country: 'tr' }), true)
    assert.equal(satirBuUlkedeMi({ country: 'uz' }), false)
  })
})

describe('real handlers', () => {
  let NextRequest: typeof import('next/server').NextRequest
  let doktorOturum: typeof import('../doktor/serverAuth').doktorOturum
  let pratikOturum: typeof import('../doktor/pratikOturum').pratikOturum
  let me: { GET: (r: import('next/server').NextRequest) => Promise<Response> }
  let profil: { POST: (r: import('next/server').NextRequest) => Promise<Response> }
  const iste = (jeton: string, yol = '/api/x', init: { method?: string; body?: string } = {}) =>
    new NextRequest(`http://localhost${yol}`, { ...init, headers: { authorization: `Bearer ${jeton}`, 'content-type': 'application/json' } })

  before(async () => {
    NextRequest = (await import('next/server')).NextRequest
    ;({ doktorOturum } = await import('../doktor/serverAuth'))
    ;({ pratikOturum } = await import('../doktor/pratikOturum'))
    me = await import('../../app/api/users/me/route')
    profil = await import('../../app/api/users/profile/route')
  })

  it('doktorOturum / pratikOturum: today\'s accounts pass exactly as before; another country gets "no session"', async () => {
    for (const jeton of ['jeton-damgasiz', 'jeton-tr']) {
      const d = await doktorOturum(iste(jeton))
      assert.ok('user' in d && d.user.id === HESAPLAR[jeton].id, jeton)
      const p = await pratikOturum(iste(jeton))
      assert.ok('doktorId' in p && p.doktorId === HESAPLAR[jeton].id && p.rol === 'doktor', jeton)
    }
    for (const fn of [doktorOturum, pratikOturum]) {
      const r = await fn(iste('jeton-uz'))
      assert.ok('hata' in r)
      assert.equal(r.hata.status, 401)
      // Byte for byte the answer an invalid token gets — no hint that the account exists elsewhere.
      const gecersiz = await fn(iste('jeton-olmayan'))
      assert.ok('hata' in gecersiz)
      assert.deepEqual(await r.hata.json(), await gecersiz.hata.json())
    }
  })

  it('/api/users/me: unchanged for today\'s accounts; neutral refusal for another country (stamp or row)', async () => {
    const tamam = await me.GET(iste('jeton-damgasiz', '/api/users/me'))
    assert.equal(tamam.status, 200)
    const j = await tamam.json()
    assert.equal(j.success, true)
    assert.equal(j.data.specialty, 'pediatri')
    assert.equal(j.data.onboarding_completed, true)

    const tr = await me.GET(iste('jeton-tr', '/api/users/me'))
    assert.equal(tr.status, 200)

    for (const jeton of ['jeton-uz', 'jeton-satir-uz']) {
      const r = await me.GET(iste(jeton, '/api/users/me'))
      assert.equal(r.status, 403, jeton)
      const g = await r.json()
      assert.equal(g.code, HESAP_REDDI_KODU)
      assert.equal(g.error, 'E-posta veya şifre hatalı.')
      assert.equal(g.data, undefined)
      assert.doesNotMatch(JSON.stringify(g), /uz|ülke|country|Özbek/i)
    }
  })

  it('/api/users/profile: first onboarding stamps the deployment country; another country\'s account is "no session"', async () => {
    const r = await profil.POST(iste('jeton-uz', '/api/users/profile', { method: 'POST', body: JSON.stringify({ profession_type: 'doktor', specialty: 'pediatri' }) }))
    assert.equal(r.status, 401)
    assert.equal(yazilanlar.length, 0, 'nothing may be written for a refused account')

    const yeni = 'jeton-yeni'
    HESAPLAR[yeni] = { id: '55555555-5555-4555-8555-555555555555', email: 'qa-yeni@notya.test', app_metadata: { provider: 'email' } }
    const ok = await profil.POST(iste(yeni, '/api/users/profile', { method: 'POST', body: JSON.stringify({ profession_type: 'doktor', specialty: 'pediatri', full_name: 'QA Yeni Hekim' }) }))
    assert.equal(ok.status, 200)
    const damga = metaYazilari.find((m) => m.id === HESAPLAR[yeni].id && 'app_metadata' in m.govde)
    assert.deepEqual(damga?.govde, { app_metadata: { provider: 'email', country: 'tr' } }, 'existing app_metadata kept, country added')
    assert.ok(yazilanlar.some((y) => y.tablo === 'users' && y.id === HESAPLAR[yeni].id && y.yuk.country === 'tr'))
    // The main profile write itself never names the column (it must work before migration 128 is applied).
    const ana = yazilanlar.find((y) => y.tablo === 'users' && 'onboarding_completed' in y.yuk)
    assert.ok(ana === undefined || !('country' in ana.yuk))
  })
})

describe('login pages and migration', () => {
  it('each of the five login pages refuses a foreign account before a session is kept', () => {
    for (const sayfa of ['app/giris/page.tsx', 'app/giris/doktor/page.tsx', 'app/giris/klinik/page.tsx', 'app/giris/mali/page.tsx', 'app/giris/avukat/page.tsx']) {
      const k = oku(sayfa)
      const kontrol = k.indexOf('if (!hesapBuUlkedeMi(data.user))')
      assert.ok(kontrol > 0, `${sayfa}: no country check`)
      const sonra = [k.indexOf('localStorage.setItem', kontrol), k.indexOf('router.replace', kontrol), k.indexOf('router.push', kontrol)].filter((i) => i > 0)
      assert.ok(sonra.length > 0 && Math.min(...sonra) > kontrol, `${sayfa}: the check must come before the session is stored or the user is routed`)
      const once = k.slice(0, kontrol)
      assert.ok(!/localStorage\.setItem\([^)]*auth-token/.test(once), `${sayfa}: session stored before the check`)
    }
  })

  it('migration 128: additive, default tr for every existing row, format checks, guard trigger, ledger row', () => {
    const sql = oku('lib/db/migrations/128_hesap_ulke_dil.sql')
    assert.match(sql, /alter table public\.users add column if not exists country text not null default 'tr';/)
    assert.match(sql, /alter table public\.users add column if not exists ui_language text not null default 'tr';/)
    assert.match(sql, /check \(country ~ '\^\[a-z\]\{2\}\$'\)/)
    assert.match(sql, /before update of country on public\.users/)
    assert.match(sql, /values \('128', '128_hesap_ulke_dil\.sql'/)
    const yorumsuz = sql.replace(/--[^\n]*/g, '')
    assert.doesNotMatch(yorumsuz, /\bdrop\s+(table|column|policy)\b|\bdelete\s+from\b|\btruncate\b|\balter\s+column\b|disable row level security/i)
    // The ui_language check accepts every language any pack declares.
    const desen = /check \(ui_language ~ '([^']+)'\)/.exec(sql)![1]
    for (const dil of ['tr', 'uz-Latn', 'uz-Cyrl', 'ru', 'az', 'en-GB', 'ar-AE']) assert.match(dil, new RegExp(desen), dil)
    for (const kotu of ['', 'TR', 'türkçe', 'uz_Latn', "tr'; drop"]) assert.doesNotMatch(kotu, new RegExp(desen), kotu)
  })
})
