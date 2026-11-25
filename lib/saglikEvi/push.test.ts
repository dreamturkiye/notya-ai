/**
 * HASTA-PORTALI-GUNLUK — web push: VAPID JWT signature, RFC 8291 aes128gcm encryption (decrypted here with an
 * independent user-agent side), subscription validation, send results (410 → delete, timeout signal always set), and the
 * reminder cron against the stand-in database: due slots only, quiet hours, reminder switch, one notification per patient
 * per slot time, idempotent re-runs, generic payload (no medicine name), gone subscriptions removed.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createDecipheriv, createECDH, createHmac, createPublicKey, randomBytes, verify } from 'node:crypto'
import { abonelikGecerliMi, b64u, pushGonder, sifrele, vapidBasligi, vapidUret, type PushIcerigi } from './push/webPush'
import { dozHatirlatmalari, gunlukIsler } from './hatirlatmaCron'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { trSaatAni } from './zaman'

const hmac = (k: Buffer, v: Buffer) => createHmac('sha256', k).update(v).digest()

/** User-agent side of RFC 8291 (what a browser does), written independently of the sender. */
function tarayiciCoz(govde: Buffer, uaOzel: ReturnType<typeof createECDH>, auth: Buffer): Buffer {
  const tuz = govde.subarray(0, 16)
  const idLen = govde[20]
  const asAcik = govde.subarray(21, 21 + idLen)
  const sifreli = govde.subarray(21 + idLen)
  const ortak = uaOzel.computeSecret(asAcik)
  const prkKey = hmac(auth, ortak)
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from('WebPush: info\0'), uaOzel.getPublicKey(), asAcik, Buffer.from([1])]))
  const prk = hmac(tuz, ikm)
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16)
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12)
  const d = createDecipheriv('aes-128-gcm', cek, nonce)
  d.setAuthTag(sifreli.subarray(sifreli.length - 16))
  const acik = Buffer.concat([d.update(sifreli.subarray(0, sifreli.length - 16)), d.final()])
  assert.equal(acik[acik.length - 1], 2, 'last-record delimiter')
  return acik.subarray(0, acik.length - 1)
}

function tarayiciAboneligi() {
  const ua = createECDH('prime256v1'); ua.generateKeys()
  const auth = randomBytes(16)
  return { ua, auth, abone: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: b64u.kodla(ua.getPublicKey()), auth: b64u.kodla(auth) } }
}

describe('VAPID + aes128gcm', () => {
  const v = { ...vapidUret(), konu: 'https://www.notya.io' }
  it('JWT is ES256-signed by the VAPID key, aud = push service origin, exp ≤ 24 h', () => {
    const h = vapidBasligi('https://fcm.googleapis.com/fcm/send/xyz', v, 1_800_000_000)
    const m = h.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/)
    assert.ok(m)
    const govde = JSON.parse(b64u.coz(m[2]).toString())
    assert.equal(govde.aud, 'https://fcm.googleapis.com'); assert.equal(govde.sub, 'https://www.notya.io'); assert.ok(govde.exp - 1_800_000_000 <= 86400)
    const nokta = b64u.coz(m[4])
    const acik = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u.kodla(nokta.subarray(1, 33)), y: b64u.kodla(nokta.subarray(33)) }, format: 'jwk' })
    assert.ok(verify('sha256', Buffer.from(`${m[1]}.${m[2]}`), { key: acik, dsaEncoding: 'ieee-p1363' }, b64u.coz(m[3])))
  })
  it('the browser side decrypts what the sender encrypted', () => {
    const t = tarayiciAboneligi()
    const mesaj = Buffer.from(JSON.stringify({ baslik: 'İlaç saati · 08:00', govde: 'Bir ilacınız işaretlenmeyi bekliyor.' }))
    assert.deepEqual(tarayiciCoz(sifrele(mesaj, t.abone.p256dh, t.abone.auth), t.ua, t.auth), mesaj)
  })
  it('header layout: 16-byte salt, rs = 4096, 65-byte sender key', () => {
    const t = tarayiciAboneligi()
    const g = sifrele(Buffer.from('x'), t.abone.p256dh, t.abone.auth, { tuz: Buffer.alloc(16, 7) })
    assert.deepEqual(g.subarray(0, 16), Buffer.alloc(16, 7)); assert.equal(g.readUInt32BE(16), 4096); assert.equal(g[20], 65); assert.equal(g[21], 4)
  })
  it('subscription validation refuses non-https, internal hosts and bad keys', () => {
    const t = tarayiciAboneligi()
    assert.equal(abonelikGecerliMi(t.abone), true)
    assert.equal(abonelikGecerliMi({ ...t.abone, endpoint: 'http://fcm.googleapis.com/x' }), false)
    assert.equal(abonelikGecerliMi({ ...t.abone, endpoint: 'https://localhost/x' }), false)
    assert.equal(abonelikGecerliMi({ ...t.abone, endpoint: 'https://10.0.0.5/x' }), false)
    assert.equal(abonelikGecerliMi({ ...t.abone, p256dh: 'abc' }), false)
  })
  it('send: 201 ok, 410 → delete, network error kept; every call carries a timeout signal and the push headers', async () => {
    const t = tarayiciAboneligi()
    const icerik: PushIcerigi = { baslik: 'Sağlığım', govde: 'x', yol: '', etiket: 'e' }
    const cagrilar: RequestInit[] = []
    const fetchSahte = (durum: number | 'hata') => (async (_u: unknown, o?: RequestInit) => { cagrilar.push(o!); if (durum === 'hata') throw new Error('ağ'); return new Response(null, { status: durum }) }) as typeof fetch
    assert.deepEqual(await pushGonder(t.abone, icerik, v, { fetch: fetchSahte(201) }), { ok: true })
    assert.deepEqual(await pushGonder(t.abone, icerik, v, { fetch: fetchSahte(410) }), { ok: false, sil: true, durum: 410, hata: 'http_410' })
    assert.equal((await pushGonder(t.abone, icerik, v, { fetch: fetchSahte('hata') })).ok, false)
    for (const c of cagrilar) {
      assert.ok(c.signal instanceof AbortSignal, 'timeout signal')
      const h = c.headers as Record<string, string>
      assert.equal(h['Content-Encoding'], 'aes128gcm'); assert.match(h.Authorization, /^vapid t=/); assert.ok(Number(h.TTL) > 0)
    }
  })
})

describe('hatırlatma cron (stand-in database)', () => {
  let db: SahteVeritabani
  let giden: Array<{ endpoint: string; icerik: PushIcerigi }>
  const A = 'doktor-a', B = 'doktor-b', HA = 'hasta-a', HB = 'hasta-b'
  const gonder = async (a: { endpoint: string }, icerik: PushIcerigi) => { giden.push({ endpoint: a.endpoint, icerik }); return a.endpoint.includes('gitti') ? { ok: false as const, sil: true, durum: 410, hata: 'http_410' } : { ok: true as const } }
  const sb = () => db.istemci() as never
  // 08:05 Türkiye on 2026-11-24 → the 08:00 slot is inside the 15-minute window
  const SIMDI = Date.parse('2026-11-24T05:05:00Z')
  beforeEach(() => {
    db = new SahteVeritabani(); giden = []
    for (const [d, h, e] of [[A, HA, 'https://fcm.googleapis.com/a'], [B, HB, 'https://fcm.googleapis.com/b']]) {
      db.ekle('ev_push_abonelikleri', { doctor_id: d, patient_id: h, endpoint: e, p256dh: 'x', auth: 'y' })
      db.ekle('ev_ilac_planlari', { doctor_id: d, patient_id: h, ad: `Gizli ilaç ${h}`, saatler: ['08:00'], gerektikce: false, aktif: true, kaynak: 'hekim', kritik: false })
      db.ekle('ev_ilac_planlari', { doctor_id: d, patient_id: h, ad: 'İkinci', saatler: ['08:00', '20:00'], gerektikce: false, aktif: true, kaynak: 'hekim', kritik: false })
    }
  })
  it('one generic notification per patient per slot time; no medicine name in the payload', async () => {
    const r = await dozHatirlatmalari(sb(), gonder, SIMDI)
    assert.equal(r.gonderilen, 2); assert.equal(giden.length, 2)
    for (const g of giden) { assert.match(g.icerik.govde, /2 ilacınız/); assert.doesNotMatch(JSON.stringify(g.icerik), /Gizli ilaç|İkinci/) }
  })
  it('a second run in the same window sends nothing (idempotency log)', async () => {
    await dozHatirlatmalari(sb(), gonder, SIMDI)
    giden = []
    const r = await dozHatirlatmalari(sb(), gonder, SIMDI + 60_000)
    assert.equal(r.gonderilen, 0); assert.equal(giden.length, 0)
  })
  it('already marked slots are skipped; outside the window nothing is sent', async () => {
    const planlar = db.tablo('ev_ilac_planlari').filter((p) => p.patient_id === HA)
    for (const p of planlar) db.ekle('ev_doz_kayitlari', { doctor_id: A, patient_id: HA, plan_id: p.id, planlanan_at: trSaatAni('2026-11-24', '08:00'), durum: 'alindi', kayit_at: new Date(SIMDI).toISOString() })
    await dozHatirlatmalari(sb(), gonder, SIMDI)
    assert.deepEqual(giden.map((g) => g.endpoint), ['https://fcm.googleapis.com/b'])
    giden = []
    await dozHatirlatmalari(sb(), gonder, Date.parse('2026-11-24T06:30:00Z'))
    assert.equal(giden.length, 0)
  })
  it('quiet hours and the reminder switch are respected', async () => {
    db.ekle('ev_tercihler', { doctor_id: A, patient_id: HA, sessiz_bas: '07:30', sessiz_bit: '09:00', hatirlatma_acik: true })
    db.ekle('ev_tercihler', { doctor_id: B, patient_id: HB, sessiz_bas: '23:00', sessiz_bit: '07:00', hatirlatma_acik: false })
    await dozHatirlatmalari(sb(), gonder, SIMDI)
    assert.equal(giden.length, 0)
  })
  it('a gone subscription (410) is deleted', async () => {
    db.tablo('ev_push_abonelikleri')[0].endpoint = 'https://fcm.googleapis.com/gitti'
    await dozHatirlatmalari(sb(), gonder, SIMDI)
    assert.equal(db.tablo('ev_push_abonelikleri').length, 1)
  })
  it('daily job: two missed days → gentle nudge; a kritik medicine notifies the doctor only with consent', async () => {
    const krit = db.tablo('ev_ilac_planlari').find((p) => p.patient_id === HA)!
    krit.kritik = true
    db.ekle('ev_tercihler', { doctor_id: A, patient_id: HA, paylasim_onayi: true, hatirlatma_acik: true, sessiz_bas: '23:00', sessiz_bit: '07:00' })
    const ogle = Date.parse('2026-11-24T09:10:00Z') // 12:10 TR
    const r = await gunlukIsler(sb(), gonder, ogle)
    assert.equal(r.kritik, 1)
    const u = db.tablo('ev_uyarilar')
    assert.equal(u.length, 1); assert.equal(u[0].doctor_id, A); assert.equal(u[0].patient_id, HA); assert.equal(u[0].duzey, 'hekime_bildir')
    assert.ok(giden.length >= 1); assert.ok(giden.every((g) => !/Gizli ilaç/.test(JSON.stringify(g.icerik))))
    // re-run: no duplicate alert (cool-down), no second nudge (3-day log)
    giden = []
    const r2 = await gunlukIsler(sb(), gonder, ogle + 3600_000)
    assert.equal(r2.kritik, 0); assert.equal(db.tablo('ev_uyarilar').length, 1); assert.equal(giden.length, 0)
  })
})
