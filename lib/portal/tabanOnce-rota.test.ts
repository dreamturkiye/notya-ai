/**
 * PORTAL-TABAN-ONCE (Kaan, 2026-11-25) — the two base capabilities of the patient portal, end to end through the REAL
 * route handlers (in-memory Supabase stand-in, no network):
 *
 *   1. Booking from the doctor's calendar: Sağlığım › Randevu answers { acik: true } (the same answer HastaShell uses for
 *      the Randevu tab and Bugün's "Randevu al"), lists free slots from the doctor's calendar, the patient taps a time →
 *      a 'talep' row lands on THAT doctor's calendar → the doctor's / secretary's "Randevu talepleri" list shows it with the
 *      patient's name → the doctor approves → the patient's Randevularım shows it confirmed. Booking OFF → { acik: false }.
 *   2. Quick message: the patient writes from Sağlığım › Mesajlar → the doctor's unread badge (top-bar envelope) counts it
 *      and the doctor's Mesajlar inbox shows the thread and the text.
 *
 * Cross-doctor isolation stays: a second doctor sees neither the request nor the message.
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-taban-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'

let db = new SahteVeritabani()
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j), admin: { updateUserById: async () => ({ data: null, error: null }) } },
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
const KOK = join(__dirname, '../..')
mock.module(pathToFileURL(join(KOK, 'lib/doktor/twilioNotify.ts')).href, { namedExports: { sendTwilioMessage: async () => ({ ok: true, sid: 'sahte' }), normalizeTrPhoneE164: (x: string) => x } })
mock.module(pathToFileURL(join(KOK, 'lib/alarm.ts')).href, { namedExports: { kritikAlarm: async () => undefined } })
globalThis.fetch = (async (u: unknown) => { throw new Error(`no network in this test: ${String(u)}`) }) as typeof fetch

type Hekim = { id: string; jeton: string; hasta: string; portal: string }
let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
let R: Record<string, any>

function hekimKur(harf: string, randevuAcik = true): Hekim {
  const id = randomUUID()
  const jeton = `qa-taban-jeton-${harf}`
  db.kullanicilar.set(jeton, { id, email: `qa-taban-${harf}@ornek.test` })
  db.ekle('users', { id, full_name: `Dr. Taban ${harf}`, email: `qa-taban-${harf}@ornek.test`, specialty: 'dahiliye', subscription_tier: 'pro', role: 'doktor' })
  const hasta = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `Taban Hasta ${harf}` })), dob_encrypted: encrypt('1980-05-01'), gender_encrypted: encrypt('female') }).id as string
  const portal = `qa-taban-portal-${harf}`
  db.ekle('hasta_portal_tokens', { token_hash: portal, doctor_id: id, patient_id: hasta, expires_at: new Date(Date.now() + 30 * 86400e3).toISOString(), pin_hash: 'sentetik' })
  db.ekle('randevu_portal_ayarlari', { doktor_id: id, acik: randevuAcik })
  return { id, jeton, hasta, portal }
}
async function cerez(token: string) {
  const { setUnlockCookie, UNLOCK_COOKIE } = await import('./pinAuth')
  const { NextResponse } = await import('next/server')
  const res = NextResponse.json({})
  setUnlockCookie(res, token)
  return `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
}
function iste(yontem: string, yol: string, o: { jeton?: string; cerez?: string; govde?: unknown } = {}) {
  const h: Record<string, string> = {}
  if (o.jeton) h.authorization = `Bearer ${o.jeton}`
  if (o.cerez) h.cookie = o.cerez
  if (o.govde !== undefined) h['content-type'] = 'application/json'
  return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: h, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
const prm = <T extends object>(p: T) => ({ params: Object.assign(Promise.resolve(p), p) })
async function json(r: Response | Promise<Response>) { const y = await r; return { status: y.status, j: await y.json().catch(() => ({})) as any } }

before(async () => {
  encrypt = (await import('../security/encryption')).encrypt
  NextRequestSinifi = (await import('next/server')).NextRequest
  const ice = (y: string) => import(`../../${y}`)
  R = {
    portalRandevu: await ice('app/api/portal/hasta/[token]/randevu/route'),
    portalMesajlar: await ice('app/api/portal/hasta/[token]/mesajlar/route'),
    talepler: await ice('app/api/doktor/randevu-portal/talepler/route'),
    okunmamis: await ice('app/api/doktor/mesajlar/unread-count/route'),
    mesajlar: await ice('app/api/doktor/mesajlar/route'),
  }
})

describe('PORTAL-TABAN-ONCE — booking from the doctor\'s calendar, end to end', () => {
  it('free slots → request → on the doctor\'s request list (with the patient\'s name) → approved → confirmed for the patient', async () => {
    db = new SahteVeritabani()
    const A = hekimKur('A'), B = hekimKur('B')
    const c = await cerez(A.portal)
    const yol = `/api/portal/hasta/${A.portal}/randevu`

    const ac = await json(R.portalRandevu.GET(iste('GET', yol, { cerez: c }), prm({ token: A.portal })))
    assert.equal(ac.status, 200)
    assert.equal(ac.j.acik, true, 'booking ON → the Randevu tab and "Randevu al" appear')
    assert.ok(ac.j.turler.length >= 1)
    const tur = ac.j.turler[0].tur

    const s = await json(R.portalRandevu.GET(iste('GET', `${yol}?tur=${tur}`, { cerez: c }), prm({ token: A.portal })))
    assert.equal(s.status, 200)
    const slot = s.j.gunler?.[0]?.slotlar?.[0]
    assert.ok(slot?.bas, `free slots from the doctor's calendar: ${JSON.stringify(s.j).slice(0, 200)}`)

    const t = await json(R.portalRandevu.POST(iste('POST', yol, { cerez: c, govde: { islem: 'talep', tur, baslangic: slot.bas } }), prm({ token: A.portal })))
    assert.equal(t.status, 200, JSON.stringify(t.j))
    assert.equal(t.j.ok, true)
    const satir = db.tablo('randevular').find((r) => r.doktor_id === A.id && r.patient_id === A.hasta)
    assert.ok(satir, 'the request lands on THIS doctor\'s calendar')
    assert.equal(Date.parse(String(satir!.baslangic)), Date.parse(slot.bas))
    assert.equal(satir!.kaynak, 'portal')

    // Default policy (onayModu 'hepsi_onay'): every portal request waits for the practice.
    assert.equal(t.j.onayBekliyor, true)
    {
      const d = await json(R.talepler.GET(iste('GET', '/api/doktor/randevu-portal/talepler', { jeton: A.jeton })))
      assert.equal(d.status, 200)
      const talep = d.j.talepler.find((x: { id: string }) => x.id === satir!.id)
      assert.ok(talep, 'the doctor\'s "Randevu talepleri" shows the request')
      assert.match(talep.hastaAdi, /Taban Hasta A/)
      const b = await json(R.talepler.GET(iste('GET', '/api/doktor/randevu-portal/talepler', { jeton: B.jeton })))
      assert.ok(!JSON.stringify(b.j).includes(String(satir!.id)) && !JSON.stringify(b.j).includes('Taban Hasta A'), 'another doctor never sees it')

      const o = await json(R.talepler.POST(iste('POST', '/api/doktor/randevu-portal/talepler', { jeton: A.jeton, govde: { id: satir!.id, islem: 'onayla' } })))
      assert.equal(o.status, 200, JSON.stringify(o.j))
    }
    const son = await json(R.portalRandevu.GET(iste('GET', yol, { cerez: c }), prm({ token: A.portal })))
    const benim = son.j.randevular.find((r: { id: string }) => r.id === satir!.id)
    assert.ok(benim, 'Randevularım lists it')
    assert.notEqual(benim.durum, 'talep', 'approved by the doctor')
  })
  it('booking OFF → { acik: false } (no tab, no "Randevu al", nothing else sent)', async () => {
    db = new SahteVeritabani()
    const A = hekimKur('A', false)
    const r = await json(R.portalRandevu.GET(iste('GET', `/api/portal/hasta/${A.portal}/randevu`, { cerez: await cerez(A.portal) }), prm({ token: A.portal })))
    assert.deepEqual(r.j, { acik: false })
  })
})

describe('PORTAL-TABAN-ONCE — quick message to the doctor, end to end', () => {
  it('patient writes → the doctor\'s unread badge counts it and the inbox shows the text; another doctor sees nothing', async () => {
    db = new SahteVeritabani()
    const A = hekimKur('A'), B = hekimKur('B')
    const c = await cerez(A.portal)
    const metin = 'Merhaba hocam, tansiyon ilacımı sabah mı akşam mı almalıyım?'
    const g = await json(R.portalMesajlar.POST(iste('POST', `/api/portal/hasta/${A.portal}/mesajlar`, { cerez: c, govde: { konu: 'İlaç saati', metin } }), prm({ token: A.portal })))
    assert.equal(g.status, 200, JSON.stringify(g.j))
    assert.ok(g.j.konuId)

    const say = await json(R.okunmamis.GET(iste('GET', '/api/doktor/mesajlar/unread-count', { jeton: A.jeton })))
    assert.equal(say.j.unreadCount, 1, 'top-bar envelope: 1 unread')
    const kutu = await json(R.mesajlar.GET(iste('GET', '/api/doktor/mesajlar?unread=1', { jeton: A.jeton })))
    assert.equal(kutu.status, 200)
    const s = JSON.stringify(kutu.j)
    assert.ok(s.includes(g.j.konuId) && s.includes('İlaç saati'), `the doctor's inbox lists the thread: ${s.slice(0, 300)}`)
    assert.ok(db.tablo('hasta_mesajlar').some((m) => m.konu_id === g.j.konuId && m.taraf === 'hasta' && String(m.metin).includes('tansiyon')))

    const sB = await json(R.okunmamis.GET(iste('GET', '/api/doktor/mesajlar/unread-count', { jeton: B.jeton })))
    assert.equal(sB.j.unreadCount, 0)
    const kB = await json(R.mesajlar.GET(iste('GET', '/api/doktor/mesajlar', { jeton: B.jeton })))
    assert.ok(!JSON.stringify(kB.j).includes('İlaç saati'), 'another doctor never sees it')
  })
})
