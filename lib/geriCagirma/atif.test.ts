/**
 * GERI-CAGIRMA-01 — the attribution rule and the monthly counters. Pure; THE SAME FILE in every build (Türkiye and
 * the six country builds), next to the code it tests (./atif.ts, ./tipler.ts). Synthetic ids only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { atifHesapla, aylikHesapla, kartGosterilsinMi, pencereIcinde, type AtifKaydi, type AtifRandevusu } from './atif'
import { ATIF_PENCERESI_GUN, TAHSILAT_PENCERESI_GUN, ayAnahtari, beklemeGunTemizle, bosSayac, gunAnahtari, sonAylar, VARSAYILAN_BEKLEME_GUN } from './tipler'

const TZ = 'Europe/Istanbul'
const T0 = '2026-11-03T09:00:00.000Z'
const gunSonra = (n: number, saat = 9) => new Date(Date.parse('2026-11-03T00:00:00.000Z') + n * 86_400_000 + saat * 3_600_000).toISOString()
const kayit = (o: Partial<AtifKaydi> = {}): AtifKaydi => ({ id: 'k1', patientId: 'h1', durum: 'gonderildi', gonderildiAt: T0, randevuId: null, randevuAt: null, randevuYolu: null, geldiAt: null, tahsilatKurus: null, ...o })
const randevu = (o: Partial<AtifRandevusu> = {}): AtifRandevusu => ({ id: 'r1', patientId: 'h1', olusturuldu: gunSonra(2), baslangic: gunSonra(9), iptal: false, tamamlandi: false, ...o })

describe('GERI-CAGIRMA-01 · attribution rule', () => {
  it('the windows are documented constants', () => {
    assert.equal(ATIF_PENCERESI_GUN, 30)
    assert.equal(TAHSILAT_PENCERESI_GUN, 30)
    assert.equal(pencereIcinde(T0, gunSonra(30, 8)), true)
    assert.equal(pencereIcinde(T0, gunSonra(31)), false)
    assert.equal(pencereIcinde(T0, T0), false)
  })

  it('an appointment made after the recall, inside the window, is credited (route "diger")', () => {
    const d = atifHesapla([kayit()], [randevu()], [], [], TZ)
    assert.deepEqual(d, [{ id: 'k1', randevuId: 'r1', randevuAt: gunSonra(2), randevuYolu: 'diger', geldiAt: null, tahsilatKurus: null }])
  })

  it('booked BEFORE the recall does not count', () => {
    assert.deepEqual(atifHesapla([kayit()], [randevu({ olusturuldu: gunSonra(-1) })], [], [], TZ), [])
  })

  it('booked AFTER the window does not count', () => {
    assert.deepEqual(atifHesapla([kayit()], [randevu({ olusturuldu: gunSonra(31), baslangic: gunSonra(40) })], [], [], TZ), [])
  })

  it('a cancelled appointment does not count, and a credited one that is later cancelled is released', () => {
    assert.deepEqual(atifHesapla([kayit()], [randevu({ iptal: true })], [], [], TZ), [])
    const d = atifHesapla([kayit({ randevuId: 'r1', randevuAt: gunSonra(2), randevuYolu: 'diger' })], [randevu({ iptal: true })], [], [], TZ)
    assert.deepEqual(d, [{ id: 'k1', randevuId: null, randevuAt: null, randevuYolu: null, geldiAt: null, tahsilatKurus: null }])
  })

  it('a recall that did not leave (failed / skipped / in flight) is never credited', () => {
    for (const durum of ['basarisiz', 'atlandi', 'bekliyor']) assert.deepEqual(atifHesapla([kayit({ durum })], [randevu()], [], [], TZ), [])
  })

  it('the appointment of another patient is never credited', () => {
    assert.deepEqual(atifHesapla([kayit()], [randevu({ patientId: 'h2' })], [], [], TZ), [])
  })

  it('a tagged-link booking keeps its stamp', () => {
    const k = kayit({ randevuId: 'r1', randevuAt: gunSonra(1), randevuYolu: 'baglanti' })
    assert.deepEqual(atifHesapla([k], [randevu({ olusturuldu: gunSonra(1) })], [], [], TZ), [])
  })

  it('one appointment is credited to one recall only — the latest before it', () => {
    const a = kayit({ id: 'ka', gonderildiAt: gunSonra(0) })
    const b = kayit({ id: 'kb', gonderildiAt: gunSonra(1) })
    const d = atifHesapla([a, b], [randevu()], [], [], TZ)
    assert.equal(d.length, 1)
    assert.equal(d[0].id, 'kb')
  })

  it('attended needs a real visit: a completed appointment, or a visit record on the appointment day', () => {
    const booked = kayit({ randevuId: 'r1', randevuAt: gunSonra(2), randevuYolu: 'diger' })
    assert.deepEqual(atifHesapla([booked], [randevu()], [], [], TZ), [], 'booked only: not attended')
    assert.equal(atifHesapla([booked], [randevu({ tamamlandi: true })], [], [], TZ)[0].geldiAt, gunSonra(9))
    assert.equal(atifHesapla([booked], [randevu()], [{ patientId: 'h1', an: gunSonra(9, 11) }], [], TZ)[0].geldiAt, gunSonra(9))
    assert.deepEqual(atifHesapla([booked], [randevu()], [{ patientId: 'h1', an: gunSonra(12) }], [], TZ), [], 'a visit on another day is not this appointment')
    assert.deepEqual(atifHesapla([booked], [randevu()], [{ patientId: 'h2', an: gunSonra(9, 11) }], [], TZ), [], 'a visit of another patient')
    // A walk-in with no appointment is not counted at all.
    assert.deepEqual(atifHesapla([kayit()], [], [{ patientId: 'h1', an: gunSonra(3) }], [], TZ), [])
  })

  it('money comes only from RECORDED payments of that patient after the visit — none recorded, none shown', () => {
    const booked = kayit({ randevuId: 'r1', randevuAt: gunSonra(2), randevuYolu: 'diger' })
    const r = randevu({ tamamlandi: true })
    assert.equal(atifHesapla([booked], [r], [], [], TZ)[0].tahsilatKurus, null)
    const d = atifHesapla([booked], [r], [], [
      { patientId: 'h1', an: gunSonra(9, 12), kurus: 150_000 },
      { patientId: 'h1', an: gunSonra(20), kurus: 50_000 },
      { patientId: 'h1', an: gunSonra(1), kurus: 999_999 }, // before the visit
      { patientId: 'h1', an: gunSonra(60), kurus: 999_999 }, // long after
      { patientId: 'h2', an: gunSonra(9, 12), kurus: 999_999 }, // another patient
    ], TZ)
    assert.equal(d[0].tahsilatKurus, 200_000)
    // Not attended → no amount, even when a payment exists.
    assert.deepEqual(atifHesapla([booked], [randevu()], [], [{ patientId: 'h1', an: gunSonra(9, 12), kurus: 150_000 }], TZ), [])
  })

  it('"the same calendar day" follows the time zone that is passed in', () => {
    const booked = kayit({ randevuId: 'r1', randevuAt: gunSonra(2), randevuYolu: 'diger' })
    const r = randevu({ baslangic: '2026-11-12T22:30:00.000Z' }) // 13 Nov in Sydney, 12 Nov in Los Angeles
    const vizit = [{ patientId: 'h1', an: '2026-11-13T03:00:00.000Z' }]
    assert.equal(atifHesapla([booked], [r], vizit, [], 'Australia/Sydney').length, 1)
    assert.equal(atifHesapla([booked], [r], vizit, [], 'America/Los_Angeles').length, 1)
    assert.equal(atifHesapla([booked], [r], [{ patientId: 'h1', an: '2026-11-14T03:00:00.000Z' }], [], 'America/Los_Angeles').length, 0)
    assert.equal(gunAnahtari('2026-11-12T22:30:00.000Z', 'Australia/Sydney'), '2026-11-13')
  })
})

describe('GERI-CAGIRMA-01 · monthly counters', () => {
  const aylar = sonAylar('2026-11', 6)
  it('six months, oldest first; zero-data is all zeros', () => {
    assert.deepEqual(aylar, ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'])
    assert.deepEqual(aylikHesapla([], aylar, TZ), aylar.map(bosSayac))
  })

  it('one patient counts once per month, however many reasons, messages or appointments', () => {
    const satirlar: AtifKaydi[] = [
      kayit({ id: 'a', patientId: 'h1', gonderildiAt: gunSonra(0), randevuId: 'r1', randevuAt: gunSonra(2), randevuYolu: 'diger', geldiAt: gunSonra(9), tahsilatKurus: 100_000 }),
      kayit({ id: 'b', patientId: 'h1', gonderildiAt: gunSonra(10), randevuId: 'r2', randevuAt: gunSonra(12), randevuYolu: 'baglanti', geldiAt: gunSonra(15), tahsilatKurus: 70_000 }),
      kayit({ id: 'c', patientId: 'h2', gonderildiAt: gunSonra(1), randevuId: 'r3', randevuAt: gunSonra(3), randevuYolu: 'diger' }),
      kayit({ id: 'd', patientId: 'h3', gonderildiAt: gunSonra(1) }),
      kayit({ id: 'e', patientId: 'h4', durum: 'basarisiz', gonderildiAt: null }),
    ]
    assert.deepEqual(aylikHesapla(satirlar, aylar, TZ).at(-1), { ay: '2026-11', gonderilen: 3, randevuAlan: 2, gelen: 1, tahsilatKurus: 100_000 })
  })

  it('a booking is counted in the month the appointment was MADE; attended never exceeds booked', () => {
    const k = kayit({ gonderildiAt: '2026-10-28T09:00:00.000Z', randevuId: 'r1', randevuAt: '2026-11-02T09:00:00.000Z', randevuYolu: 'diger', geldiAt: '2026-11-05T09:00:00.000Z', tahsilatKurus: null })
    const s = aylikHesapla([k], aylar, TZ)
    assert.deepEqual(s.at(-2), { ay: '2026-10', gonderilen: 1, randevuAlan: 0, gelen: 0, tahsilatKurus: 0 })
    assert.deepEqual(s.at(-1), { ay: '2026-11', gonderilen: 0, randevuAlan: 1, gelen: 1, tahsilatKurus: 0 })
    for (const a of s) assert.ok(a.gelen <= a.randevuAlan)
  })

  it('month keys follow the practice time zone', () => {
    assert.equal(ayAnahtari('2026-10-31T21:30:00.000Z', TZ), '2026-11')
    assert.equal(ayAnahtari('2026-10-31T20:30:00.000Z', TZ), '2026-10')
    assert.equal(ayAnahtari('2026-10-31T20:30:00.000Z', 'Pacific/Auckland'), '2026-11')
  })

  it('the home card is hidden when there is nothing to show', () => {
    const bos = aylar.map(bosSayac)
    assert.equal(kartGosterilsinMi(0, bos), false)
    assert.equal(kartGosterilsinMi(3, bos), true)
    assert.equal(kartGosterilsinMi(0, [...bos.slice(0, 5), { ...bos[5], gonderilen: 1 }]), true)
  })

  it('the cool-down is clamped', () => {
    assert.equal(beklemeGunTemizle(undefined), VARSAYILAN_BEKLEME_GUN)
    assert.equal(beklemeGunTemizle(1), 7)
    assert.equal(beklemeGunTemizle(9999), 365)
    assert.equal(beklemeGunTemizle(45), 45)
  })
})
