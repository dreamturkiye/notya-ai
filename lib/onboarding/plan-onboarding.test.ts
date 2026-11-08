/**
 * PLAN-ONBOARDING-01 (Kaan, 2026-11-07) — a doctor who signs up through a paid plan (/kayit?plan=… → Stripe) goes through
 * the same onboarding as the free trial. Synthetic QA data; real route handler for PUT /api/users/trial (database and
 * auth are stand-ins: lib/security/testing/sahteSupabase.ts).
 *
 *   1. onboardingEksigi: names the first missing required answer; null only when everything is on record.
 *   2. PUT /api/users/trial: starts the trial (15 days, unchanged) but marks the account onboarded ONLY when the required
 *      answers are on record.
 *   3. Back from Stripe the doctor lands in /onboarding (not the doctor app); the doctor app sends a never-onboarded
 *      account to /onboarding; /kayit records the chosen plan; trial rules (no card, no code) unchanged.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { onboardingEksigi, onboardingAlanlariTamamMi } from './onboardingTamam'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

let db = new SahteVeritabani()
let metalar = new Map<string, Record<string, unknown>>()
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      getUser: async (jwt?: string) => {
        const s = await c().auth.getUser(jwt)
        const u = s.data.user
        return u ? { data: { user: { ...u, user_metadata: { ...(metalar.get(u.id) || {}) } } }, error: null } : s
      },
      admin: {
        updateUserById: async (id: string, g: { user_metadata: Record<string, unknown> }) => { metalar.set(id, { ...g.user_metadata }); return { data: null, error: null } },
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
globalThis.fetch = (async (g: unknown) => { throw new Error(`the onboarding test must not reach the network: ${String(g)}`) }) as typeof fetch

const TAM = { profession_type: 'doktor', specialty: 'kardiyoloji', title: 'Uzm.Dr.', first_name: 'QA', last_name: 'Hekim', cep_telefonu: '+905550000000', gender: 'female', addressing_preference: 'hocam', kvkk_consent_at: '2026-11-07T10:00:00Z' }

let NextRequestSinifi: typeof import('next/server').NextRequest
let TRIAL: Record<string, any>
before(async () => {
  NextRequestSinifi = (await import('next/server')).NextRequest
  TRIAL = await import('../../app/api/users/trial/route')
})
beforeEach(() => { db = new SahteVeritabani(); metalar = new Map() })

const kok = (yol: string) => readFileSync(join(__dirname, '../..', yol), 'utf8')

describe('onboardingEksigi', () => {
  it('null only when every required answer is on record (any of the 40 branches)', () => {
    assert.equal(onboardingEksigi(TAM, {}), null)
    assert.equal(onboardingEksigi({ ...TAM, profession_type: 'klinik-uzman', specialty: 'sac-ekimi', title: null }, {}), null)
    assert.equal(onboardingEksigi({ ...TAM, kvkk_consent_at: null }, { kvkk_onay: true }), null)
  })
  it('names the first missing answer', () => {
    assert.equal(onboardingEksigi(null, {}), 'profession_type')
    assert.equal(onboardingEksigi({ ...TAM, specialty: 'genel' }, {}), 'specialty')
    assert.equal(onboardingEksigi({ ...TAM, title: '' }, {}), 'title')
    assert.equal(onboardingEksigi({ ...TAM, first_name: ' ' }, {}), 'first_name')
    assert.equal(onboardingEksigi({ ...TAM, cep_telefonu: null }, {}), 'cep_telefonu')
    assert.equal(onboardingEksigi({ ...TAM, gender: null }, {}), 'gender')
    assert.equal(onboardingEksigi({ ...TAM, addressing_preference: undefined }, {}), 'addressing_preference')
    assert.equal(onboardingEksigi({ ...TAM, kvkk_consent_at: null }, {}), 'kvkk')
    assert.equal(onboardingAlanlariTamamMi({ specialty: 'pediatri' }, {}), false)
  })
})

describe('PUT /api/users/trial', () => {
  async function basla(satir: Record<string, unknown> | null, meta: Record<string, unknown> = {}) {
    const id = randomUUID()
    const token = `qa-${id}`
    db.kullanicilar.set(token, { id, email: `qa-${id.slice(0, 8)}@ornek.test` })
    metalar.set(id, { ...meta })
    if (satir) db.ekle('users', { id, email: 'x', ...satir })
    const y = await TRIAL.PUT(new NextRequestSinifi('http://localhost/api/users/trial', { method: 'PUT', headers: { authorization: `Bearer ${token}` } }))
    return { id, durum: y.status, veri: await y.json(), meta: metalar.get(id)!, satir: db.tablo('users').find((r) => r.id === id) }
  }
  it('an account with only a branch (paid path, nothing else answered) gets its trial but is NOT marked onboarded', async () => {
    const r = await basla(null, { kayit_bransi: 'pediatri', kayit_plani: 'sesli_pro' })
    assert.equal(r.durum, 200)
    assert.equal(r.veri.days_remaining, 15)
    assert.ok(r.meta.trial_ends)
    assert.notEqual(r.meta.onboarding_completed, true)
    const r2 = await basla({ specialty: 'pediatri', profession_type: 'doktor' })
    assert.notEqual(r2.meta.onboarding_completed, true)
    assert.notEqual(r2.satir?.onboarding_completed, true)
  })
  it('an account whose required answers are on record is marked onboarded (row + metadata)', async () => {
    const r = await basla({ ...TAM })
    assert.equal(r.meta.onboarding_completed, true)
    assert.equal(r.satir?.onboarding_completed, true)
  })
})

describe('the paid path goes through onboarding', () => {
  it('Stripe returns the doctor to /onboarding, not to the doctor app; checkout itself is unchanged', () => {
    const s = kok('app/api/billing/checkout/route.ts')
    assert.match(s, /success_url: `\$\{appUrl\(\)\}\/onboarding\?p=doktor&billing=success&plan=\$\{plan\.key\}`/)
    assert.doesNotMatch(s, /success_url: `\$\{appUrl\(\)\}\/dashboard\/doktor/)
    assert.match(s, /trial_period_days: NOTYA_TRIAL_DAYS/)
    assert.equal((s.match(/checkout\.sessions\.create\(/g) || []).length, 1)
  })
  it('the doctor app sends a never-onboarded account to /onboarding before the branch gate', () => {
    const s = kok('components/doktor/DoktorChrome.tsx')
    const i = s.indexOf("if (u && u.onboarding_completed === false) { router.replace('/onboarding?p=doktor'); return; }")
    assert.ok(i > 0)
    assert.ok(i < s.indexOf('setBransGerekli(u?.brans_gerekli === true)'))
  })
  it('/kayit records the chosen plan; the trial stays card-free and code-free', () => {
    const s = kok('app/kayit/page.tsx')
    assert.match(s, /SELF_SERVE_PLAN_KEYS\.has\(planKey\) \? \{ kayit_plani: planKey \} : \{\}/)
    assert.match(s, /kredi kartı gerekmez/)
    assert.doesNotMatch(s, /davet_kodu|davetKodu/)
  })
})
