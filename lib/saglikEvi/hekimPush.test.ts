/**
 * HEKIM-PUSH (Kaan, 2026-11-25) — active doctor notification for Sağlığım home-data alerts.
 *  - routing by level and the doctor's own time window (acil any hour; hekime bildir in working hours, else held for the
 *    morning summary; quiet hours; mute switches; time zone; per-doctor rate limit)
 *  - lock-screen privacy: no patient name, value, diagnosis or drug in any payload
 *  - the server half against the stand-in database: consent gate, idempotency, summary once per local day, the right
 *    doctor's devices only
 *  - the REAL /api/doktor/bildirimler route: doctor-own rows only (cross-doctor isolation), secretary refused
 *  - the REAL portal reading route: a very high glucose pushes to that patient's doctor only, after the response
 * Synthetic QA data only.
 */
import { describe, it, before, beforeEach, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import type { PushIcerigi } from './push/webPush'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-hekim-push-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

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

type K = typeof import('./hekimBildirimKurallari')
type Srv = typeof import('./hekimBildirim')
let K: K, Srv: Srv

const A = '00000000-0000-4000-8000-0000000000a1', Bd = '00000000-0000-4000-8000-0000000000b2'
const ayar = (o: Partial<import('./hekimBildirimKurallari').HekimBildirimAyari> = {}) => ({ ...K.VARSAYILAN_HEKIM_AYARI, ...o })
/** Türkiye wall clock → epoch ms (UTC+3). */
const tr = (gun: string, saat: string) => Date.parse(`${gun}T${saat}:00+03:00`)
const GUN = '2026-11-25'

before(async () => {
  K = await import('./hekimBildirimKurallari')
  Srv = await import('./hekimBildirim')
})

describe('HEKIM-PUSH — routing by level and time window (pure)', () => {
  it('acil → immediately at any hour, quiet hours ignored; only an explicit mute stops it', () => {
    assert.equal(K.pushKarari('acil', ayar(), tr(GUN, '03:10')), 'hemen')
    assert.equal(K.pushKarari('acil', ayar({ sessizBas: '00:00', sessizBit: '23:59' }), tr(GUN, '03:10')), 'hemen')
    assert.equal(K.pushKarari('acil', ayar({ acilAcik: false }), tr(GUN, '10:00')), 'yok')
  })
  it('hekime_bildir → immediately inside working hours, held for the morning outside', () => {
    assert.equal(K.pushKarari('hekime_bildir', ayar(), tr(GUN, '08:00')), 'hemen')
    assert.equal(K.pushKarari('hekime_bildir', ayar(), tr(GUN, '19:59')), 'hemen')
    assert.equal(K.pushKarari('hekime_bildir', ayar(), tr(GUN, '20:00')), 'sabah')
    assert.equal(K.pushKarari('hekime_bildir', ayar(), tr(GUN, '06:30')), 'sabah')
    assert.equal(K.pushKarari('hekime_bildir', ayar({ ozetAcik: false }), tr(GUN, '22:00')), 'yok', 'summary off → Fısıltı only')
    assert.equal(K.pushKarari('hekime_bildir', ayar({ bildirAcik: false }), tr(GUN, '10:00')), 'yok')
    assert.equal(K.pushKarari('hekime_bildir', ayar({ sessizBas: '12:00', sessizBit: '13:30' }), tr(GUN, '12:45')), 'sabah')
    assert.equal(K.pushKarari('hekime_bildir', ayar({ calismaBas: '18:00', calismaBit: '02:00' }), tr(GUN, '01:00')), 'hemen', 'a window across midnight')
    assert.equal(K.pushKarari('dikkat', ayar(), tr(GUN, '10:00')), 'yok')
    assert.equal(K.pushKarari('bilgi', ayar(), tr(GUN, '10:00')), 'yok')
  })
  it("the doctor's own time zone decides (a US doctor at 09:00 New York)", () => {
    const ny = ayar({ saatDilimi: 'America/New_York' })
    assert.equal(K.pushKarari('hekime_bildir', ny, Date.parse('2026-11-25T14:00:00Z')), 'hemen')
    assert.equal(K.pushKarari('hekime_bildir', ny, Date.parse('2026-11-26T02:00:00Z')), 'sabah')
    assert.equal(K.hekimYerelZaman(Date.parse('2026-11-26T02:00:00Z'), 'America/New_York').gun, '2026-11-25')
  })
  it('rate limit per doctor per hour: over it the alert is held, never lost', () => {
    assert.equal(K.pushKarari('hekime_bildir', ayar(), tr(GUN, '10:00'), K.HEKIM_SAATLIK_SINIR.hekime_bildir), 'sabah')
    assert.equal(K.pushKarari('acil', ayar(), tr(GUN, '10:00'), K.HEKIM_SAATLIK_SINIR.acil), 'sabah')
    assert.equal(K.pushKarari('acil', ayar(), tr(GUN, '10:00'), K.HEKIM_SAATLIK_SINIR.acil - 1), 'hemen')
  })
  it('morning summary time = inside working hours (once a day is the server key)', () => {
    assert.equal(K.ozetZamaniMi(ayar(), tr(GUN, '07:55')), false)
    assert.equal(K.ozetZamaniMi(ayar(), tr(GUN, '08:05')), true)
    assert.equal(K.ozetZamaniMi(ayar({ ozetAcik: false }), tr(GUN, '08:05')), false)
  })
  it('settings payload is validated (times, time zone, equal start / end refused)', () => {
    assert.equal(K.hekimAyarGuncellemesi({ calismaBas: '25:00' }).ok, false)
    assert.equal(K.hekimAyarGuncellemesi({ saatDilimi: 'Mars/Olympus' }).ok, false)
    assert.equal(K.hekimAyarGuncellemesi({ calismaBas: '09:00', calismaBit: '09:00' }).ok, false)
    assert.deepEqual(K.hekimAyarGuncellemesi({ acilAcik: false, sessizBas: '', calismaBas: '07:30', saatDilimi: 'Europe/London' }), { ok: true, g: { acil_acik: false, sessiz_bas: null, calisma_bas: '07:30', saat_dilimi: 'Europe/London' } })
  })
})

describe('HEKIM-PUSH — lock-screen privacy (KVKK)', () => {
  const YASAK = ['QA Hasta', 'GIZLI', '452', 'mg/dL', 'Diyabet', 'Metformin', 'İnsülin', 'Lantus', 'şeker', 'tansiyon', 'Ayşe']
  it('no patient name, value, diagnosis or drug in any payload; the tap opens the Ev verisi alerts tab', () => {
    const pid = '00000000-0000-4000-8000-00000000ff01'
    const hepsi: PushIcerigi[] = [
      K.hekimPushIcerigi({ tur: 'acil', patientId: pid, anahtar: 'u1' }),
      K.hekimPushIcerigi({ tur: 'acil', patientId: pid, anahtar: 'u1', sayi: 2 }),
      K.hekimPushIcerigi({ tur: 'bildir', patientId: pid, anahtar: 'u2' }),
      K.hekimPushIcerigi({ tur: 'ozet', hastaSayisi: 3, uyariSayisi: 5, gun: GUN }),
      K.hekimPushIcerigi({ tur: 'deneme' }),
    ]
    for (const i of hepsi) {
      const metin = `${i.baslik} ${i.govde} ${i.etiket}`
      for (const y of YASAK) assert.ok(!metin.toLocaleLowerCase('tr-TR').includes(y.toLocaleLowerCase('tr-TR')), `${y} in "${metin}"`)
    }
    assert.equal(hepsi[0].govde, 'Acil ev ölçümü · dokunarak açın')
    assert.equal(hepsi[0].yol, `/dashboard/doktor/hastalar/${pid}?ev=1&evAyrinti=uyarilar`)
    assert.equal(hepsi[3].govde, '3 hastadan 5 yeni ev uyarısı · dokunarak açın')
    assert.equal(hepsi[3].yol, '/dashboard/doktor')
  })
})

describe('HEKIM-PUSH — server half (stand-in database)', () => {
  let giden: Array<{ endpoint: string; icerik: PushIcerigi; acil: boolean }>
  const gonder = async (a: { endpoint: string }, icerik: PushIcerigi, o: { acil: boolean }) => { giden.push({ endpoint: a.endpoint, icerik, acil: o.acil }); return { ok: true as const } }
  const sb = () => db.istemci() as never
  let uid = 0
  const uyari = (doktor: string, hasta: string, duzey: string, kural = 'cok_yuksek') => {
    const r = db.ekle('ev_uyarilar', { doctor_id: doktor, patient_id: hasta, kural, anahtar: `${kural}:${++uid}`, duzey, metrik: 'glukoz:tokluk2', hasta_metni: 'x', hekim_metni: 'Kan şekeri 452 mg/dL — QA Hasta GIZLI', veri: {}, olusturma_at: new Date(tr(GUN, '07:00')).toISOString(), hekim_gordu_at: null })
    return { id: String(r.id), doctor_id: doktor, patient_id: hasta, duzey, kural }
  }
  beforeEach(() => {
    db = new SahteVeritabani(); giden = []
    for (const [d, h] of [[A, 'hA1'], [A, 'hA2'], [Bd, 'hB1']]) db.ekle('ev_tercihler', { doctor_id: d, patient_id: h, paylasim_onayi: true })
    db.ekle('ev_tercihler', { doctor_id: A, patient_id: 'hA-onaysiz', paylasim_onayi: false })
    db.ekle('hekim_push_abonelikleri', { doctor_id: A, endpoint: 'https://fcm.googleapis.com/fcm/send/A-telefon', p256dh: 'x', auth: 'y' })
    db.ekle('hekim_push_abonelikleri', { doctor_id: Bd, endpoint: 'https://fcm.googleapis.com/fcm/send/B-telefon', p256dh: 'x', auth: 'y' })
  })

  it('acil at 03:00 → one push to that doctor only, logged once; a re-run sends nothing twice', async () => {
    const u = uyari(A, 'hA1', 'acil')
    const r = await Srv.hekimeBildir(sb(), gonder, [u], tr(GUN, '03:00'))
    assert.equal(r.gonderilen, 1); assert.equal(giden.length, 1)
    assert.equal(giden[0].endpoint, 'https://fcm.googleapis.com/fcm/send/A-telefon'); assert.equal(giden[0].acil, true)
    assert.equal(db.tablo('ev_bildirim_gunlugu').filter((l) => l.tur === 'hekim_acil').length, 1)
    await Srv.hekimeBildir(sb(), gonder, [u], tr(GUN, '03:05'))
    assert.equal(giden.length, 1, 'idempotent')
  })
  it('no KVKK consent → no push (the doctor sees nothing of that patient either)', async () => {
    await Srv.hekimeBildir(sb(), gonder, [uyari(A, 'hA-onaysiz', 'acil')], tr(GUN, '10:00'))
    assert.equal(giden.length, 0)
  })
  it('hekime_bildir at 22:00 is held; the morning summary sends ONE push with counts, once per local day', async () => {
    const u1 = uyari(A, 'hA1', 'hekime_bildir', 'yuksek_bildir'), u2 = uyari(A, 'hA2', 'hekime_bildir', 'kritik_ilac'), u3 = uyari(A, 'hA2', 'acil')
    await Srv.hekimeBildir(sb(), gonder, [u1, u2], tr('2026-11-24', '22:00'))
    assert.equal(giden.length, 0)
    void u3 // an acil the doctor could not receive (rate-limited / no device then) is summarised too
    assert.equal((await Srv.hekimSabahOzeti(sb(), gonder, tr(GUN, '07:50'))).ozet, 0, 'before working hours')
    const r = await Srv.hekimSabahOzeti(sb(), gonder, tr(GUN, '08:05'))
    assert.equal(r.ozet, 1); assert.equal(giden.length, 1)
    assert.equal(giden[0].icerik.govde, '2 hastadan 3 yeni ev uyarısı · dokunarak açın')
    assert.equal(giden[0].endpoint, 'https://fcm.googleapis.com/fcm/send/A-telefon')
    await Srv.hekimSabahOzeti(sb(), gonder, tr(GUN, '08:20'))
    await Srv.hekimSabahOzeti(sb(), gonder, tr(GUN, '13:00'))
    assert.equal(giden.length, 1, 'once a day')
    // a summarised alert is never pushed again by itself
    await Srv.hekimeBildir(sb(), gonder, [u1], tr(GUN, '10:00'))
    assert.equal(giden.length, 1)
  })
  it("B's alerts never reach A's devices and vice versa", async () => {
    await Srv.hekimeBildir(sb(), gonder, [uyari(Bd, 'hB1', 'acil'), uyari(A, 'hA1', 'acil')], tr(GUN, '10:00'))
    assert.deepEqual(giden.map((g) => g.endpoint).sort(), ['https://fcm.googleapis.com/fcm/send/A-telefon', 'https://fcm.googleapis.com/fcm/send/B-telefon'])
    assert.ok(!giden.some((g) => g.endpoint.includes('A-') && g.icerik.yol.includes('hB1')))
    assert.ok(!giden.some((g) => g.endpoint.includes('B-') && g.icerik.yol.includes('hA1')))
  })
  it('rate limit: the 9th hekime_bildir push in an hour is held for the summary', async () => {
    for (let i = 0; i < 9; i++) db.ekle('ev_tercihler', { doctor_id: A, patient_id: `hx${i}`, paylasim_onayi: true })
    const r = await Srv.hekimeBildir(sb(), gonder, Array.from({ length: 9 }, (_, i) => uyari(A, `hx${i}`, 'hekime_bildir', 'yuksek_bildir')), tr(GUN, '10:00'))
    assert.equal(r.gonderilen, K.HEKIM_SAATLIK_SINIR.hekime_bildir); assert.equal(r.bekletilen, 1)
  })
  it('a gone subscription (410) is removed', async () => {
    await Srv.hekimeBildir(sb(), async () => ({ ok: false as const, sil: true, durum: 410, hata: 'http_410' }), [uyari(A, 'hA1', 'acil')], tr(GUN, '10:00'))
    assert.ok(!db.tablo('hekim_push_abonelikleri').some((a) => a.doctor_id === A))
  })
})

describe('HEKIM-PUSH — the real routes (cross-doctor isolation, off the request path)', () => {
  let NextRequestSinifi: typeof import('next/server').NextRequest
  let R: Record<string, any>
  let encrypt: (s: string) => string
  const fetchEski = globalThis.fetch
  let pushIstekleri: string[] = []
  before(async () => {
    const { vapidUret } = await import('./push/webPush')
    const v = vapidUret()
    process.env.NOTYA_VAPID_PUBLIC_KEY = v.acik; process.env.NOTYA_VAPID_PRIVATE_KEY = v.gizli
    ;({ encrypt } = await import('@/lib/security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    R = { bildirim: await import('../../app/api/doktor/bildirimler/route'), gunluk: await import('../../app/api/portal/hasta/[token]/gunluk/route') }
  })
  const iste = (yontem: string, yol: string, o: { jwt?: string; cerez?: string; govde?: unknown } = {}) => {
    const h: Record<string, string> = {}
    if (o.jwt) h.authorization = `Bearer ${o.jwt}`
    if (o.cerez) h.cookie = o.cerez
    if (o.govde !== undefined) h['content-type'] = 'application/json'
    return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: h, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof NextRequestSinifi>[1])
  }
  const coz = async (r: Response | Promise<Response>) => { const y = await r; return { status: y.status, j: await y.json().catch(() => ({})) as Record<string, any> } }
  const tarayici = () => {
    const { createECDH, randomBytes } = require('node:crypto') as typeof import('node:crypto')
    const ua = createECDH('prime256v1'); ua.generateKeys()
    const b = (x: Buffer) => x.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return { p256dh: b(ua.getPublicKey()), auth: b(randomBytes(16)) }
  }
  beforeEach(() => {
    db = new SahteVeritabani(); pushIstekleri = []
    db.kullanicilar.set('jwt-A', { id: A }); db.kullanicilar.set('jwt-B', { id: Bd }); db.kullanicilar.set('jwt-S', { id: 'sekreter-1' })
    db.ekle('personel', { user_id: 'sekreter-1', doktor_id: A, aktif: true, rol: 'sekreter' })
    globalThis.fetch = (async (url: string | URL) => { pushIstekleri.push(String(url)); return new Response(null, { status: 201 }) }) as typeof fetch
  })
  after(() => { globalThis.fetch = fetchEski })

  it('each doctor subscribes and lists only his own devices; B cannot delete or take over A’s subscription', async () => {
    const kA = tarayici()
    const EA = 'https://fcm.googleapis.com/fcm/send/A-cihaz'
    assert.equal((await coz(R.bildirim.POST(iste('POST', '/api/doktor/bildirimler', { jwt: 'jwt-A', govde: { islem: 'abone', abonelik: { endpoint: EA, ...kA }, saatDilimi: 'Europe/Istanbul' } })))).status, 200)
    const gA = await coz(R.bildirim.GET(iste('GET', `/api/doktor/bildirimler?endpoint=${encodeURIComponent(EA)}`, { jwt: 'jwt-A' })))
    assert.equal(gA.j.abonelikSayisi, 1); assert.equal(gA.j.buCihaz, true)
    const gB = await coz(R.bildirim.GET(iste('GET', `/api/doktor/bildirimler?endpoint=${encodeURIComponent(EA)}`, { jwt: 'jwt-B' })))
    assert.equal(gB.j.abonelikSayisi, 0); assert.equal(gB.j.buCihaz, false)
    await coz(R.bildirim.DELETE(iste('DELETE', '/api/doktor/bildirimler', { jwt: 'jwt-B', govde: { endpoint: EA } })))
    assert.ok(db.tablo('hekim_push_abonelikleri').some((r) => r.endpoint === EA && r.doctor_id === A), 'B deleted A’s row')
    const ele = await coz(R.bildirim.POST(iste('POST', '/api/doktor/bildirimler', { jwt: 'jwt-B', govde: { islem: 'abone', abonelik: { endpoint: EA, ...tarayici() } } })))
    assert.equal(ele.status, 409)
    assert.ok(db.tablo('hekim_push_abonelikleri').every((r) => r.endpoint !== EA || r.doctor_id === A), 'B re-pointed A’s subscription')
    // same browser (same keys) re-used by B after A signed out → moves, never shared
    assert.equal((await coz(R.bildirim.POST(iste('POST', '/api/doktor/bildirimler', { jwt: 'jwt-B', govde: { islem: 'abone', abonelik: { endpoint: EA, ...kA } } })))).status, 200)
    assert.deepEqual(db.tablo('hekim_push_abonelikleri').filter((r) => r.endpoint === EA).map((r) => r.doctor_id), [Bd])
  })
  it('settings are per doctor; a secretary session is refused', async () => {
    assert.equal((await coz(R.bildirim.PUT(iste('PUT', '/api/doktor/bildirimler', { jwt: 'jwt-A', govde: { ayar: { calismaBas: '09:00', acilAcik: true } } })))).status, 200)
    assert.equal((await coz(R.bildirim.PUT(iste('PUT', '/api/doktor/bildirimler', { jwt: 'jwt-A', govde: { ayar: { calismaBas: '9' } } })))).status, 422)
    assert.equal((await coz(R.bildirim.GET(iste('GET', '/api/doktor/bildirimler', { jwt: 'jwt-B' })))).j.ayar.calismaBas, '08:00')
    assert.equal((await coz(R.bildirim.GET(iste('GET', '/api/doktor/bildirimler', { jwt: 'jwt-A' })))).j.ayar.calismaBas, '09:00')
    assert.equal((await coz(R.bildirim.GET(iste('GET', '/api/doktor/bildirimler', { jwt: 'jwt-S' })))).status, 403)
    assert.equal((await coz(R.bildirim.POST(iste('POST', '/api/doktor/bildirimler', { jwt: 'jwt-S', govde: { islem: 'abone', abonelik: { endpoint: 'https://fcm.googleapis.com/fcm/send/S', ...tarayici() } } })))).status, 403)
    assert.equal(db.tablo('hekim_push_abonelikleri').length, 0)
    assert.equal((await coz(R.bildirim.GET(iste('GET', '/api/doktor/bildirimler')))).status, 401)
  })
  it('a patient saves 452 mg/dL → the response comes back with the symptom check, and only HER doctor’s phone is pushed', async () => {
    const hasta = db.ekle('patients', { doctor_id: A, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta', soyad: 'GIZLI-A' })), dob_encrypted: encrypt('1960-01-01') }).id
    db.ekle('users', { id: A, specialty: 'dahiliye' })
    const token = 'qa-hekim-push-A'
    db.ekle('hasta_portal_tokens', { token_hash: token, doctor_id: A, patient_id: hasta, expires_at: new Date(Date.now() + 86400e3).toISOString(), pin_hash: 'sentetik' })
    db.ekle('ev_tercihler', { doctor_id: A, patient_id: hasta, paylasim_onayi: true, sessiz_bas: '23:00', sessiz_bit: '07:00', hatirlatma_acik: true })
    const k = tarayici()
    db.ekle('hekim_push_abonelikleri', { doctor_id: A, endpoint: 'https://fcm.googleapis.com/fcm/send/A-hekim', ...k })
    db.ekle('hekim_push_abonelikleri', { doctor_id: Bd, endpoint: 'https://fcm.googleapis.com/fcm/send/B-hekim', ...tarayici() })
    const { setUnlockCookie, UNLOCK_COOKIE } = await import('@/lib/portal/pinAuth')
    const { NextResponse } = await import('next/server')
    const res = NextResponse.json({}); setUnlockCookie(res, token)
    const cerez = `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
    const r = await coz(R.gunluk.POST(iste('POST', `/api/portal/hasta/${token}/gunluk`, { cerez, govde: { islem: 'olcum', tip: 'glukoz', deger: 452, baglam: 'tokluk2' } }), { params: { token } }))
    assert.equal(r.status, 200, JSON.stringify(r.j))
    assert.equal(r.j.uyarilar[0].duzey, 'acil'); assert.equal(r.j.uyarilar[0].sekerAcil, 'yuksek')
    for (let i = 0; i < 20 && !pushIstekleri.length; i++) await new Promise((c) => setTimeout(c, 10))
    assert.deepEqual(pushIstekleri, ['https://fcm.googleapis.com/fcm/send/A-hekim'])
    assert.equal(db.tablo('ev_bildirim_gunlugu').filter((l) => l.tur === 'hekim_acil' && l.doctor_id === A).length, 1)
  })
})

