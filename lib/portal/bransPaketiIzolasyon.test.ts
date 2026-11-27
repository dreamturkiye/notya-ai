/**
 * BRANS-PAKETI × HASTA-İZOLASYON — the REAL route handlers of the branş package against the stand-in database
 * (lib/security/testing/sahteSupabase.ts): two synthetic diyetisyen professionals A and B, each with a synthetic patient,
 * a PIN-unlocked portal token, accepted templates, a diary entry and a private photo.
 * Every case: positive control (own data reachable — proves the route really ran) + A→B + B→A, victim rows unchanged.
 * Also: PIN required on every portal route; a module of another branş is refused (brans-alan-sizmasi); the screening
 * score never reaches the patient; the patient deletes only his own photo; storage reads never open a foreign path.
 * Synthetic QA data only.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-brans-paketi-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NOTYA_VAPID_PUBLIC_KEY = ''

let db = new SahteVeritabani()
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return { from: (t: string) => c().from(t), auth: { getUser: (j?: string) => c().auth.getUser(j) }, storage: { from: (k: string) => c().storage.from(k) }, rpc: (a: string, b: Record<string, string>) => c().rpc(a, b) }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}

type Hekim = { harf: 'A' | 'B'; id: string; jwt: string; hasta: string; token: string; kayit: string; foto: string; yol: string }
let NextRequestSinifi: typeof import('next/server').NextRequest
let R: Record<string, any>
let encrypt: (s: string) => string
const isaret = (h: string) => `GIZLI-${h}-7Q`
// 1×1 JPEG (synthetic) — magic bytes FF D8 FF
const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64')

function hekimKur(harf: 'A' | 'B'): Hekim {
  const id = `00000000-0000-4000-8000-00000000001${harf === 'A' ? 1 : 2}`
  const jwt = `jwt-paket-${harf}`
  db.kullanicilar.set(jwt, { id })
  db.ekle('users', { id, specialty: 'diyetisyen' })
  const hasta = db.ekle('patients', { doctor_id: id, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta', soyad: isaret(harf) })), dob_encrypted: encrypt('1988-01-01') }).id
  const token = `qa-brans-paketi-${harf}`
  db.ekle('hasta_portal_tokens', { token_hash: token, doctor_id: id, patient_id: hasta, expires_at: new Date(Date.now() + 86400e3).toISOString(), pin_hash: 'sentetik' })
  for (const modul of ['diyet-tabak', 'diyet-vucut', 'diyet-tarama', 'diyet-plan']) db.ekle('brans_paket_sablon', { doctor_id: id, brans: 'diyetisyen', modul, icerik: {}, kabul_at: new Date().toISOString(), duzenlendi: false, kabul_gecmisi: [] })
  db.ekle('brans_paket_hasta', { doctor_id: id, patient_id: hasta, modul: 'diyet-plan', acik: null, baslangic: null, ayar: { plan: `Her gün | Kahvaltı | yumurta ${isaret(harf)}` } })
  const kayit = db.ekle('brans_paket_kayit', { doctor_id: id, patient_id: hasta, modul: 'diyet-vucut', gun: new Date().toISOString().slice(0, 10), veri: { kalca: harf === 'A' ? 101 : 117 }, seviye: null, created_at: new Date().toISOString() }).id
  const yol = `${id}/${hasta}/0000000${harf === 'A' ? 1 : 2}-0000-4000-8000-000000000000.jpg`
  db.dosyaKoy('brans-paket-foto', yol, JPEG)
  const foto = db.ekle('brans_paket_foto', { doctor_id: id, patient_id: hasta, modul: 'diyet-tabak', etiket: null, yol, mime: 'image/jpeg', uzman_yorum: `Yorum ${isaret(harf)}`, yorum_at: new Date().toISOString(), created_at: new Date().toISOString() }).id
  db.ekle('ev_tercihler', { doctor_id: id, patient_id: hasta, paylasim_onayi: true, onay_at: new Date().toISOString(), sessiz_bas: '23:00', sessiz_bit: '07:00', hatirlatma_acik: true })
  return { harf, id, jwt, hasta, token, kayit, foto, yol }
}

async function cerez(token: string) {
  const { setUnlockCookie, UNLOCK_COOKIE } = await import('@/lib/portal/pinAuth')
  const { NextResponse } = await import('next/server')
  const res = NextResponse.json({})
  setUnlockCookie(res, token)
  return `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
}
function iste(yontem: string, yol: string, o: { cerez?: string; jwt?: string; govde?: unknown } = {}) {
  const h: Record<string, string> = {}
  if (o.cerez) h.cookie = o.cerez
  if (o.jwt) h.authorization = `Bearer ${o.jwt}`
  if (o.govde !== undefined) h['content-type'] = 'application/json'
  return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: h, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
const prm = <T extends object>(p: T) => ({ params: p })
async function coz(r: Response | Promise<Response>) { const y = await r; return { status: y.status, metin: await y.text() } }
const satir = (t: string, id: string) => JSON.stringify(db.tablo(t).find((x) => x.id === id))

describe('BRANS-PAKETI: branş paketi rotaları hasta / hekim sınırını aşmaz', () => {
  before(async () => {
    ;({ encrypt } = await import('@/lib/security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    const ice = (y: string) => import(`../../${y}`)
    R = {
      paket: await ice('app/api/portal/hasta/[token]/brans-paketi/route'),
      foto: await ice('app/api/portal/hasta/[token]/brans-paketi/foto/route'),
      sablon: await ice('app/api/ozel-brans/paket/route'),
      hasta: await ice('app/api/ozel-brans/paket/hasta/route'),
      hekimFoto: await ice('app/api/ozel-brans/paket/foto/route'),
      lab: await ice('app/api/ozel-brans/diyet-lab/route'),
    }
  })
  let A: Hekim, B: Hekim
  beforeEach(() => { db = new SahteVeritabani(); A = hekimKur('A'); B = hekimKur('B') })

  it('PIN unlock is required on every portal route (no cookie → 401)', async () => {
    const yol = `/api/portal/hasta/${A.token}/brans-paketi`
    assert.equal((await coz(R.paket.GET(iste('GET', yol), prm({ token: A.token })))).status, 401)
    assert.equal((await coz(R.paket.POST(iste('POST', yol, { govde: { modul: 'diyet-vucut', veri: { kalca: 99 } } }), prm({ token: A.token })))).status, 401)
    assert.equal((await coz(R.foto.GET(iste('GET', `${yol}/foto?id=${A.foto}`), prm({ token: A.token })))).status, 401)
    assert.equal((await coz(R.foto.DELETE(iste('DELETE', `${yol}/foto?id=${A.foto}`), prm({ token: A.token })))).status, 401)
    assert.equal(db.tablo('brans_paket_foto').length, 2)
  })

  for (const [hh, dd] of [['A', 'B'], ['B', 'A']] as const) {
    it(`${hh} hastasının paketi: kendi planı ve yorumu var, ${dd}'nin hiçbir şeyi yok`, async () => {
      const h = hh === 'A' ? A : B
      const r = await coz(R.paket.GET(iste('GET', `/api/portal/hasta/${h.token}/brans-paketi`, { cerez: await cerez(h.token) }), prm({ token: h.token })))
      assert.equal(r.status, 200, r.metin.slice(0, 300))
      assert.ok(r.metin.includes(`yumurta ${isaret(hh)}`) && r.metin.includes(`Yorum ${isaret(hh)}`), 'positive control')
      assert.ok(!r.metin.includes(isaret(dd)), 'foreign marker leaked')
    })

    it(`${hh} token'ı ${dd}'nin fotoğrafını açamaz, silemez; kendi fotoğrafını açar ve siler`, async () => {
      const h = hh === 'A' ? A : B, v = hh === 'A' ? B : A
      const c = await cerez(h.token)
      const yol = `/api/portal/hasta/${h.token}/brans-paketi/foto`
      const once = satir('brans_paket_foto', v.foto)
      db.depolamaOkumalari.length = 0
      assert.equal((await coz(R.foto.GET(iste('GET', `${yol}?id=${v.foto}`, { cerez: c }), prm({ token: h.token })))).status, 404)
      assert.ok(!db.depolamaOkumalari.some((x) => x.includes(v.hasta)), 'a foreign object was opened')
      assert.equal((await coz(R.foto.DELETE(iste('DELETE', `${yol}?id=${v.foto}`, { cerez: c }), prm({ token: h.token })))).status, 404)
      assert.equal(satir('brans_paket_foto', v.foto), once)
      assert.ok(db.depolama.get('brans-paket-foto')?.has(v.yol), 'foreign object deleted')
      // positive control
      assert.equal((await coz(R.foto.GET(iste('GET', `${yol}?id=${h.foto}`, { cerez: c }), prm({ token: h.token })))).status, 200)
      assert.equal((await coz(R.foto.DELETE(iste('DELETE', `${yol}?id=${h.foto}`, { cerez: c }), prm({ token: h.token })))).status, 200)
      assert.ok(!db.tablo('brans_paket_foto').some((x) => x.id === h.foto) && !db.depolama.get('brans-paket-foto')?.has(h.yol))
      assert.ok(db.tablo('brans_paket_foto').some((x) => x.id === v.foto))
    })

    it(`${hh} hekimi ${dd}'nin hastasının paketini okuyamaz, ayarını / foto yorumunu değiştiremez`, async () => {
      const h = hh === 'A' ? A : B, v = hh === 'A' ? B : A
      const kendi = await coz(R.hasta.GET(iste('GET', `/api/ozel-brans/paket/hasta?patientId=${h.hasta}`, { jwt: h.jwt })))
      assert.equal(kendi.status, 200, kendi.metin.slice(0, 200))
      assert.ok(kendi.metin.includes(`yumurta ${isaret(hh)}`) && !kendi.metin.includes(isaret(dd)), 'positive control')
      assert.equal((await coz(R.hasta.GET(iste('GET', `/api/ozel-brans/paket/hasta?patientId=${v.hasta}`, { jwt: h.jwt })))).status, 404)
      const ayarOnce = JSON.stringify(db.tablo('brans_paket_hasta').filter((x) => x.patient_id === v.hasta))
      assert.equal((await coz(R.hasta.POST(iste('POST', '/api/ozel-brans/paket/hasta', { jwt: h.jwt, govde: { patientId: v.hasta, islem: 'ayar', modul: 'diyet-glp1', acik: true, ayar: { proteinHedefG: 1 } } })))).status, 404)
      assert.equal(JSON.stringify(db.tablo('brans_paket_hasta').filter((x) => x.patient_id === v.hasta)), ayarOnce)
      const fotoOnce = satir('brans_paket_foto', v.foto)
      // foreign photo id under the caller's OWN patient → matches no row
      assert.equal((await coz(R.hasta.POST(iste('POST', '/api/ozel-brans/paket/hasta', { jwt: h.jwt, govde: { patientId: h.hasta, islem: 'yorum', id: v.foto, yorum: 'x' } })))).status, 404)
      assert.equal((await coz(R.hasta.POST(iste('POST', '/api/ozel-brans/paket/hasta', { jwt: h.jwt, govde: { patientId: v.hasta, islem: 'yorum', id: v.foto, yorum: 'x' } })))).status, 404)
      assert.equal(satir('brans_paket_foto', v.foto), fotoOnce)
      assert.equal((await coz(R.hekimFoto.GET(iste('GET', `/api/ozel-brans/paket/foto?patientId=${h.hasta}&id=${v.foto}`, { jwt: h.jwt })))).status, 404)
      assert.equal((await coz(R.hekimFoto.GET(iste('GET', `/api/ozel-brans/paket/foto?patientId=${v.hasta}&id=${v.foto}`, { jwt: h.jwt })))).status, 404)
      assert.equal((await coz(R.hekimFoto.GET(iste('GET', `/api/ozel-brans/paket/foto?patientId=${h.hasta}&id=${h.foto}`, { jwt: h.jwt })))).status, 200)
      assert.equal((await coz(R.lab.GET(iste('GET', `/api/ozel-brans/diyet-lab?patientId=${v.hasta}`, { jwt: h.jwt })))).status, 404)
      assert.equal((await coz(R.lab.GET(iste('GET', `/api/ozel-brans/diyet-lab?patientId=${h.hasta}`, { jwt: h.jwt })))).status, 200)
    })
  }

  it('a patient entry is written with the token scope only; a module of another branş is refused', async () => {
    const c = await cerez(A.token)
    const yol = `/api/portal/hasta/${A.token}/brans-paketi`
    const r = await coz(R.paket.POST(iste('POST', yol, { cerez: c, govde: { modul: 'diyet-vucut', veri: { kalca: 98 } } }), prm({ token: A.token })))
    assert.equal(r.status, 200, r.metin)
    const yeni = db.tablo('brans_paket_kayit').filter((x) => x.veri?.kalca === 98)
    assert.equal(yeni.length, 1); assert.equal(yeni[0].doctor_id, A.id); assert.equal(yeni[0].patient_id, A.hasta)
    assert.equal((await coz(R.paket.POST(iste('POST', yol, { cerez: c, govde: { modul: 'sac-gunluk', veri: { kasinti: 3 } } }), prm({ token: A.token })))).status, 404)
    assert.equal((await coz(R.paket.POST(iste('POST', yol, { cerez: c, govde: { modul: 'diyet-glp1', veri: { bulanti: 3 } } }), prm({ token: A.token })))).status, 404, 'condition module not on for this patient')
    assert.equal((await coz(R.sablon.POST(iste('POST', '/api/ozel-brans/paket', { jwt: A.jwt, govde: { modul: 'sac-zaman', icerik: {} } })))).status, 404, 'a dietitian cannot accept a hair-transplant template')
  })

  it('screening: positive answers alert the professional; the patient gets the same thank-you, never a score', async () => {
    const c = await cerez(A.token)
    const yol = `/api/portal/hasta/${A.token}/brans-paketi`
    const r = await coz(R.paket.POST(iste('POST', yol, { cerez: c, govde: { modul: 'diyet-tarama', cevaplar: [true, true, true, false, false] } }), prm({ token: A.token })))
    assert.equal(r.status, 200, r.metin)
    assert.ok(!/puan|SCOFF|pozitif|\d\/5/.test(r.metin), r.metin)
    const u = db.tablo('ev_uyarilar').filter((x) => String(x.kural).startsWith('paket-tarama:'))
    assert.equal(u.length, 1); assert.equal(u[0].doctor_id, A.id); assert.equal(u[0].duzey, 'hekime_bildir')
    assert.doesNotMatch(String(u[0].hasta_metni), /\d/)
    const g = await coz(R.paket.GET(iste('GET', yol, { cerez: c }), prm({ token: A.token })))
    assert.ok(!/"puan"|pozitif|cevaplar/.test(g.metin))
    const hekim = await coz(R.hasta.GET(iste('GET', `/api/ozel-brans/paket/hasta?patientId=${A.hasta}`, { jwt: A.jwt })))
    assert.ok(hekim.metin.includes('"puan":3'), 'the professional sees the score')
  })

  it('templates: GET lists only the caller’s branş; acceptance stamps a timestamp and history', async () => {
    const r = await coz(R.sablon.GET(iste('GET', '/api/ozel-brans/paket', { jwt: A.jwt })))
    assert.equal(r.status, 200)
    const j = JSON.parse(r.metin)
    assert.equal(j.brans, 'diyetisyen'); assert.ok(j.moduller.every((m: { kod: string }) => m.kod.startsWith('diyet-')))
    const k = await coz(R.sablon.POST(iste('POST', '/api/ozel-brans/paket', { jwt: A.jwt, govde: { modul: 'diyet-ir', icerik: {} } })))
    assert.equal(k.status, 200, k.metin)
    const row = db.tablo('brans_paket_sablon').find((x) => x.doctor_id === A.id && x.modul === 'diyet-ir')!
    assert.ok(row.kabul_at && Array.isArray(row.kabul_gecmisi) && row.kabul_gecmisi.length === 1)
    assert.ok(!db.tablo('brans_paket_sablon').some((x) => x.doctor_id === B.id && x.modul === 'diyet-ir'))
  })
})
