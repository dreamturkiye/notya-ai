/**
 * KURUCU-KONSOL-01 + DENEME-BILDIRIM-01 (Kaan, 2026-11-07) — this country build's half, with the REAL route handler
 * (only the database and auth are stand-ins, below). Synthetic QA data only; no network.
 *
 *   1. GET /api/internal/founder-stats: no secret, no/garbage/wrong/expired/replayed/other-country signature → 404; a
 *      valid one → 200 with doctor-account metadata and counts only (no patient field, no note content); a burst → 429.
 *   2. Every statement carried this build's country (ulke = …).
 *   3. The trial-signup alert is claimed once per account and never for Kaan's test account or an unknown role.
 *   4. DENEME-BILDIRIM-02: this build sends no mail itself; it POSTs a body-signed doctor-account payload (no patient
 *      field) to Türkiye's /api/internal/signup-notify, fire-and-forget; no secret → a logged no-op.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ULKE = 'uz'
process.env.NOTYA_COUNTRY = ULKE
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
delete process.env.RESEND_API_KEY
delete process.env.SMTP_PASS
delete process.env.FOUNDER_EMAILS
const GIZLI = 'k'.repeat(48)

type Satir = Record<string, unknown>
let tablolar: Record<string, Satir[]> = {}
let authHesaplari: Satir[] = []
let ulkesizSorgu: string[] = []
// ZIYARET-SAYACI-01: the visit counter's stats function (migration 194), answered by the stand-in.
let rpcCagrilari: Array<{ ad: string; args: Record<string, unknown> }> = []
const ORNEK_ZIYARET = { ilkGun: '2026-11-10', bugun: '2026-11-10', gunluk: [{ d: '2026-11-10', v: 4, p: 6 }], haftalik: [], sayfalar: [{ ad: '/', v: 4, p: 6 }], kaynaklar: [], cihazlar: [] }

/** A small stand-in: select/update with eq / is / not-is / gte / limit, count+head, and a check that ulke = <country> is on every statement. */
function sorgu(ad: string) {
  const f: Array<(r: Satir) => boolean> = []
  let islem: 'select' | 'update' = 'select'
  let degerler: Satir = {}
  let sayim = false
  let basliksiz = false
  let ulkeli = false
  let donsun = false
  const q: Record<string, unknown> = {
    select(_k?: string, o?: { count?: string; head?: boolean }) { if (islem === 'update') donsun = true; if (o?.count) { sayim = true; basliksiz = !!o.head } return q },
    update(d: Satir) { islem = 'update'; degerler = d; return q },
    eq(k: string, v: unknown) { if (k === 'ulke' && v === ULKE) ulkeli = true; f.push((r) => r[k] === v); return q },
    is(k: string, v: null) { f.push((r) => (v === null ? r[k] == null : r[k] === v)); return q },
    not(k: string, op: string, v: null) { assert.equal(op, 'is'); f.push((r) => (v === null ? r[k] != null : r[k] !== v)); return q },
    gte(k: string, v: string) { f.push((r) => String(r[k]) >= v); return q },
    limit() { return q },
    then(coz: (x: unknown) => unknown, red?: (e: unknown) => unknown) {
      try {
        if (!ulkeli) ulkesizSorgu.push(`${islem} ${ad}`)
        const satirlar = (tablolar[ad] ||= []).filter((r) => f.every((g) => g(r)))
        if (islem === 'update') { for (const r of satirlar) Object.assign(r, degerler); return Promise.resolve({ data: donsun ? satirlar.map((r) => ({ ...r })) : null, error: null }).then(coz, red) }
        if (sayim) return Promise.resolve({ data: basliksiz ? null : satirlar, count: satirlar.length, error: null }).then(coz, red)
        return Promise.resolve({ data: satirlar.map((r) => ({ ...r })), error: null }).then(coz, red)
      } catch (e) { return Promise.reject(e).then(coz, red) }
    },
  }
  return q
}
function sahteCreateClient() {
  return { from: (t: string) => sorgu(t), rpc: async (ad: string, args: Record<string, unknown>) => { rpcCagrilari.push({ ad, args }); return ad === 'site_visit_stats' ? { data: ORNEK_ZIYARET, error: null } : { data: null, error: null } }, auth: { admin: { listUsers: async () => ({ data: { users: authHesaplari }, error: null }) }, getUser: async () => ({ data: { user: null }, error: { message: 'no' } }) } }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`the founder tests must not reach the network: ${String(g)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let ROTA: Record<string, any>
let imza: typeof import('../../kurucu/imza')
let tipler: typeof import('../../kurucu/tipler')
let kurucu: typeof import('./kurucuUlke')
let rolListesi: readonly string[]
before(async () => {
  NextRequestSinifi = (await import('next/server')).NextRequest
  ROTA = await import('../../../app/api/internal/founder-stats/route.ulke')
  imza = await import('../../kurucu/imza')
  tipler = await import('../../kurucu/tipler')
  kurucu = await import('./kurucuUlke')
  rolListesi = (await import('../uygulama/rol')).uygulamaRolleri()
})

let ipSayaci = 0
beforeEach(() => { tablolar = {}; authHesaplari = []; ulkesizSorgu = []; rpcCagrilari = []; imza.imzaBellegiTemizle(); process.env.FOUNDER_STATS_SECRET = GIZLI })

function tohum() {
  const simdi = new Date().toISOString()
  const d1 = randomUUID()
  const kaan = randomUUID()
  const rol = rolListesi[0] ?? null
  authHesaplari = [
    { id: d1, email: 'qa-1@example.test', created_at: simdi, last_sign_in_at: simdi },
    { id: kaan, email: 'kaanari@mac.com', created_at: simdi },
  ]
  tablolar.ulke_hesaplari = [{ id: d1, ulke: ULKE, full_name: 'QA Doctor', created_at: simdi }, { id: kaan, ulke: ULKE, full_name: 'Kaan', created_at: simdi }]
  tablolar.hekim_rolu = rol ? [{ doctor_id: d1, ulke: ULKE, rol }] : []
  tablolar.hekim_dil_tercihleri = [{ doctor_id: d1, ulke: ULKE, soruldu_at: simdi }]
  tablolar.ulke_notlar = [{ id: randomUUID(), doctor_id: d1, ulke: ULKE, content_plan: 'GIZLI-NOT', created_at: simdi }]
  tablolar.ulke_muayeneler = [{ id: randomUUID(), doctor_id: d1, ulke: ULKE, patient_id: randomUUID(), transcript_cleaned: 'GIZLI-TRANSKRIPT', created_at: simdi }]
  return { d1, rol }
}
async function iste(baslik?: string, ip = `10.0.0.${++ipSayaci % 250}`) {
  const h: Record<string, string> = { 'x-forwarded-for': ip }
  if (baslik !== undefined) h[imza.IMZA_BASLIGI] = baslik
  const y = await ROTA.GET(new NextRequestSinifi('http://localhost/api/internal/founder-stats', { headers: h }))
  return { durum: y.status as number, veri: await y.json() }
}

describe(`founder-stats (${ULKE})`, () => {
  it('ZIYARET-SAYACI-01: the visit summary goes only to a valid signature — refused requests get 404, no visitor data, no stats query', async () => {
    tohum()
    for (const b of [undefined, 'garbage', imza.imzaUret('z'.repeat(48), ULKE)]) {
      const r = await iste(b)
      assert.equal(r.durum, 404)
      assert.equal(JSON.stringify(r.veri).includes('gunluk'), false)
    }
    assert.equal(rpcCagrilari.length, 0)
    const { durum, veri } = await iste(imza.imzaUret(GIZLI, ULKE))
    assert.equal(durum, 200)
    assert.deepEqual(rpcCagrilari.map((c) => [c.ad, c.args.p_ulke]), [['site_visit_stats', ULKE]])
    assert.equal(veri.ziyaret.ilkGun, '2026-11-10')
    assert.equal(tipler.ulkeYanitiTemizle(ULKE, veri)!.ziyaret!.gunluk[0].v, 4)
    assert.equal(typeof veri.denemeVar, 'boolean')
  })
  it('refuses a missing, garbage, wrong-secret, expired, replayed or other-country signature with 404', async () => {
    tohum()
    assert.equal((await iste()).durum, 404)
    assert.equal((await iste('garbage')).durum, 404)
    assert.equal((await iste(imza.imzaUret('z'.repeat(48), ULKE))).durum, 404)
    assert.equal((await iste(imza.imzaUret(GIZLI, ULKE, Date.now() - 6 * 60 * 1000))).durum, 404)
    assert.equal((await iste(imza.imzaUret(GIZLI, (ULKE as string) === 'gb' ? 'us' : 'gb'))).durum, 404)
    const b = imza.imzaUret(GIZLI, ULKE)
    assert.equal((await iste(b)).durum, 200)
    assert.equal((await iste(b)).durum, 404, 'replay')
    delete process.env.FOUNDER_STATS_SECRET
    assert.equal((await iste(imza.imzaUret(GIZLI, ULKE))).durum, 404, 'no secret configured')
  })
  it('a valid request gets doctor-account metadata and counts only; Kaan\'s test account is named, not counted', async () => {
    const { rol } = tohum()
    const { durum, veri } = await iste(imza.imzaUret(GIZLI, ULKE))
    assert.equal(durum, 200)
    assert.equal(veri.ulke, ULKE)
    assert.equal(veri.hesaplar.length, 1)
    const h = veri.hesaplar[0]
    assert.deepEqual(Object.keys(h).sort(), [...tipler.HESAP_ALANLARI].sort())
    assert.equal(h.eposta, 'qa-1@example.test')
    assert.equal(h.not7, 1)
    assert.equal(h.muayene30, 1)
    assert.equal(h.bransSecildi, !!rol)
    assert.deepEqual(veri.testHesaplari, ['kaanari@mac.com'])
    assert.equal(tipler.hastaAlaniVarMi(veri), false)
    assert.doesNotMatch(JSON.stringify(veri), /GIZLI/)
    assert.deepEqual(ulkesizSorgu, [], 'every statement carries ulke = <this country>')
  })
  it('a burst from one address is rate-limited (429)', async () => {
    tohum()
    let son = 0
    for (let i = 0; i < 21; i += 1) son = (await iste('garbage', '10.9.9.9')).durum
    assert.equal(son, 429)
  })
})

describe(`trial-signup alert (${ULKE})`, () => {
  it('claimed once per account; Kaan\'s test account and an unknown role are left out', async () => {
    const { d1, rol } = tohum()
    tablolar.ulke_hesaplari[0].deneme_bildirim_at = null
    const sb = sahteCreateClient() as never
    if (!rol) { assert.equal(await kurucu.ulkeDenemeKaydiBildir(sb, { id: d1, email: 'qa-1@example.test' }, 'x'), 'disarida'); return }
    assert.equal(await kurucu.ulkeDenemeKaydiBildir(sb, { id: d1, email: 'qa-1@example.test' }, rol, { gizli: '' }), 'gizli-yok')
    assert.equal(await kurucu.ulkeDenemeKaydiBildir(sb, { id: d1, email: 'qa-1@example.test' }, rol), 'zaten')
    assert.equal(await kurucu.ulkeDenemeKaydiBildir(sb, { id: d1, email: 'kaanari@mac.com' }, rol), 'disarida')
    assert.equal(await kurucu.ulkeDenemeKaydiBildir(sb, { id: d1, email: 'qa-1@example.test' }, 'not-a-role'), 'disarida')
    assert.deepEqual(ulkesizSorgu, [])
  })
  it('posts the alert to Türkiye, body-signed; the payload is doctor-account keys only; Türkiye accepts it, and only it', async () => {
    const { d1, rol } = tohum()
    if (!rol) return
    tablolar.ulke_hesaplari[0].deneme_bildirim_at = null
    const sb = sahteCreateClient() as never
    const cagrilar: Array<{ url: string; init: RequestInit }> = []
    const f = (async (url: string, init: RequestInit) => { cagrilar.push({ url, init }); return new Response('{"ok":true}', { status: 202 }) }) as unknown as typeof fetch
    assert.equal(await kurucu.ulkeDenemeKaydiBildir(sb, { id: d1, email: 'qa-1@example.test', ad: 'QA Doctor' }, rol, { gizli: GIZLI, fetchFn: f }), 'iletildi')
    assert.equal(cagrilar.length, 1)
    assert.equal(cagrilar[0].url, 'https://www.notya.io/api/internal/signup-notify')
    assert.equal(cagrilar[0].init.method, 'POST')
    const govde = String(cagrilar[0].init.body)
    const yuk = JSON.parse(govde) as Record<string, unknown>
    const { BILDIRIM_YUKU_ANAHTARLARI, bildirimYukuCoz, SIGNUP_NOTIFY_AMAC } = await import('../../kurucu/denemeBildirimi')
    assert.deepEqual(Object.keys(yuk).sort(), [...BILDIRIM_YUKU_ANAHTARLARI].sort())
    for (const k of Object.keys(yuk)) assert.doesNotMatch(k, /hasta|patient|nhs|medicare|note|visit|diagnos|soap|transcript/i)
    assert.equal(yuk.ulke, ULKE)
    assert.equal(yuk.eposta, 'qa-1@example.test')
    assert.ok(bildirimYukuCoz(yuk), 'Türkiye parses exactly this payload')
    imza.imzaBellegiTemizle()
    const baslik = (cagrilar[0].init.headers as Record<string, string>)[imza.IMZA_BASLIGI]
    assert.deepEqual(imza.govdeImzaDogrula(GIZLI, baslik, SIGNUP_NOTIFY_AMAC, govde), { ok: true })
    assert.equal(imza.govdeImzaDogrula(GIZLI, baslik, SIGNUP_NOTIFY_AMAC, govde.replace('QA Doctor', 'Other')).ok, false)
    // A refused or failing post is logged, never thrown into the doctor's request.
    tablolar.ulke_hesaplari[0].deneme_bildirim_at = null
    const kotu = (async () => { throw new Error('down') }) as unknown as typeof fetch
    assert.equal(await kurucu.ulkeDenemeKaydiBildir(sb, { id: d1, email: 'qa-1@example.test' }, rol, { gizli: GIZLI, fetchFn: kotu }), 'hata')
  })
  it('this build never sends mail itself and never reads a mailbox password', () => {
    const kok = join(__dirname, '../../..')
    for (const yol of ['lib/ulke/kurucu/kurucuUlke.ts', 'lib/kurucu/denemeBildirimi.ts', 'app/api/ulke/kayit/route.ulke.ts', 'app/api/ulke/rol/route.ulke.ts']) {
      const k = readFileSync(join(kok, yol), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      assert.doesNotMatch(k, /nodemailer|SMTP_|RESEND_API_KEY|api\.resend\.com|from .resend.|smtpGonder/, yol)
    }
  })
  it('the sign-up and role routes call it after their own write, through arkaPlanda', () => {
    const kok = join(__dirname, '../../..')
    assert.match(readFileSync(join(kok, 'app/api/ulke/kayit/route.ulke.ts'), 'utf8'), /arkaPlanda\(\(\) => ulkeDenemeKaydiBildir\(/)
    assert.match(readFileSync(join(kok, 'app/api/ulke/rol/route.ulke.ts'), 'utf8'), /arkaPlanda\(\(\) => ulkeDenemeKaydiBildir\(/)
  })
  it('the English e-mail for this country', async () => {
    const { bildirimEpostasi } = await import('../../kurucu/denemeBildirimi')
    const e = bildirimEpostasi({ ulke: ULKE as never, ad: 'QA', eposta: 'qa@example.test', bransEtiketi: 'General practice', plan: 'trial', zaman: new Date('2026-11-07T12:00:00Z'), toplam: 2 })
    assert.equal(e.konu, `New trial signup — ${ULKE.toUpperCase()} — General practice`)
    assert.match(e.metin, /\(US Eastern\)/)
    assert.doesNotMatch(e.metin + e.html, /[çğıöşüİÇĞÖŞÜ]/)
  })
})
