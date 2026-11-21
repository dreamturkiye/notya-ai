/**
 * BUYUME-GRAFIK-V2 (2026-11-20, Elif's live chart) — the birth weight / length / head circumference recorded for the
 * child (bebek kartı or the hasta bilgi formu) never reached the growth curves: no point at "Doğum". The REAL route
 * handler runs here against the fake database (lib/security/testing/sahteSupabase.ts); only the DB and session are fake.
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

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-buyume-dogum-anahtari'
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

type Kur = { kart?: Record<string, unknown>; intake?: Record<string, unknown>; intakeYabanci?: Record<string, unknown>; notlar?: { tarih: string; vitaller: Record<string, unknown> }[] }
function sahne(k: Kur = {}) {
  db = new SahteVeritabani()
  const hekim = randomUUID()
  const token = `qa-buyume-${randomUUID()}`
  db.kullanicilar.set(token, { id: hekim })
  db.ekle('users', { id: hekim, full_name: 'Dr. QA Pediatri', specialty: 'pediatri' })
  const hasta = db.ekle('patients', {
    doctor_id: hekim, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Elif' })),
    dob_encrypted: encrypt('2026-09-20'), gender_encrypted: encrypt('female'),
  }).id
  if (k.kart) db.ekle('bebek_kartlari', { doctor_id: hekim, bebek_patient_id: hasta, created_at: '2026-09-20T10:00:00.000Z', ...k.kart })
  if (k.intake) db.ekle('hasta_intake_formlari', { doktor_id: hekim, patient_id: hasta, created_at: '2026-09-25T10:00:00.000Z', form_data_encrypted: encrypt(JSON.stringify(k.intake)) })
  if (k.intakeYabanci) db.ekle('hasta_intake_formlari', { doktor_id: randomUUID(), patient_id: hasta, created_at: '2026-09-26T10:00:00.000Z', form_data_encrypted: encrypt(JSON.stringify(k.intakeYabanci)) })
  for (const n of k.notlar || []) {
    const s = db.ekle('sessions', { doctor_id: hekim, patient_id: hasta, created_at: n.tarih, archived_at: null }).id
    db.ekle('notes', { doctor_id: hekim, session_id: s, created_at: n.tarih, approved_at: n.tarih, vitaller: n.vitaller })
  }
  return { token, hasta }
}
async function cagir(token: string, hasta: string) {
  const req = new NextRequestSinifi(`http://localhost/api/doktor/hastalar/${hasta}/buyume-egrileri`, { headers: { authorization: `Bearer ${token}` } })
  const r = await GET(req, { params: Promise.resolve({ id: hasta }) })
  return { status: r.status, j: await r.json() as Record<string, any> }
}
const ELIF_FORM = { gebelikHaftasiPed: '39 hafta ve üstü', dogumKilosuPed: '3.200', dogumBoyuPed: '50', basCevresiPed: '34,5' }

describe('Büyüme eğrileri — birth measurements are the first point', () => {
  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    ;({ GET } = await import('../../app/api/doktor/hastalar/[id]/buyume-egrileri/route'))
  })

  it('Elif: intake 3.200 g / 50 cm / 34,5 cm → a point at age 0 on all three curves, with a Neyzi percentile', async () => {
    const s = sahne({ intake: ELIF_FORM })
    const { status, j } = await cagir(s.token, s.hasta)
    assert.equal(status, 200)
    const k = j.parametreler.kilo.noktalar, b = j.parametreler.boy.noktalar, h = j.parametreler.basCevresi.noktalar
    assert.deepEqual([k.length, b.length, h.length], [1, 1, 1])
    assert.equal(k[0].ay, 0); assert.equal(k[0].deger, 3.2); assert.equal(k[0].tarih, '2026-09-20'); assert.equal(k[0].kaynak, 'intake')
    assert.equal(b[0].deger, 50); assert.equal(h[0].deger, 34.5)
    for (const p of [k[0], b[0], h[0]]) assert.ok(p.persentil > 10 && p.persentil < 90, `term girl at birth sits mid-chart (${p.persentil})`)
  })

  it('the doctor\'s bebek kartı wins over the form; grams in the card become kg', async () => {
    const s = sahne({ kart: { gebelik_haftasi: 39, kilo_gram: 3350, boy_cm: 51, bas_cevresi_cm: 35 }, intake: ELIF_FORM })
    const { j } = await cagir(s.token, s.hasta)
    assert.equal(j.parametreler.kilo.noktalar[0].deger, 3.35)
    assert.equal(j.parametreler.kilo.noktalar[0].kaynak, 'bebek_karti')
    assert.equal(j.parametreler.boy.noktalar[0].deger, 51)
  })

  it('visit points keep their percentile and follow the birth point in age order', async () => {
    const s = sahne({ intake: ELIF_FORM, notlar: [{ tarih: '2026-11-18T09:00:00.000Z', vitaller: { kilo: '5,1', boy: '57', basCevresi: '38' } }] })
    const { j } = await cagir(s.token, s.hasta)
    const k = j.parametreler.kilo.noktalar
    assert.equal(k.length, 2)
    assert.equal(k[0].ay, 0)
    assert.ok(k[1].ay > 1.8 && k[1].ay < 2.1)
    assert.equal(k[1].kaynak, 'muayene')
    assert.ok(typeof k[1].persentil === 'number')
  })

  it('a note measured in the first week is the birth value already — no second point at 0', async () => {
    const s = sahne({ intake: ELIF_FORM, notlar: [{ tarih: '2026-09-22T09:00:00.000Z', vitaller: { kilo: '3,1' } }] })
    const { j } = await cagir(s.token, s.hasta)
    assert.equal(j.parametreler.kilo.noktalar.length, 1)
    assert.equal(j.parametreler.kilo.noktalar[0].deger, 3.1)
    assert.equal(j.parametreler.boy.noktalar.length, 1, 'length still comes from the form')
  })

  it('preterm known only from the form (no card week to correct with) → no point at age 0', async () => {
    const s = sahne({ intake: { ...ELIF_FORM, gebelikHaftasiPed: '37 haftadan önce', dogumKilosuPed: '2100' } })
    const { j } = await cagir(s.token, s.hasta)
    assert.equal(j.parametreler.kilo.noktalar.length, 0)
  })

  it('preterm card: birth before term has a negative corrected age → not plotted', async () => {
    const s = sahne({ kart: { gebelik_haftasi: 32, kilo_gram: 1700, boy_cm: 41, bas_cevresi_cm: 29 } })
    const { j } = await cagir(s.token, s.hasta)
    assert.equal(j.parametreler.kilo.noktalar.length, 0)
  })

  it('implausible form values (a current head circumference, a typo) are not birth points', async () => {
    const s = sahne({ intake: { dogumKilosuPed: '32', dogumBoyuPed: '50', basCevresiPed: '44' } })
    const { j } = await cagir(s.token, s.hasta)
    assert.equal(j.parametreler.kilo.noktalar.length, 0)
    assert.equal(j.parametreler.boy.noktalar.length, 1)
    assert.equal(j.parametreler.basCevresi.noktalar.length, 0)
  })

  it("HASTA-IZOLASYON: another doctor's intake for the same patient id is never read", async () => {
    const s = sahne({ intakeYabanci: ELIF_FORM })
    const { j } = await cagir(s.token, s.hasta)
    assert.equal(j.parametreler.kilo.noktalar.length, 0)
  })
})
