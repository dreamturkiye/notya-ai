import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bugunTz, gunKaydirTz, goreliTarihCoz, gunSinirlariUtc, isoSaatTz, cevaptakiTarih, saatDilimiSec } from './tarihCozumle'

// Tue 2026-09-29 19:35 US Eastern == 23:35Z == Wed 2026-09-30 02:35 TRT (the live defect instant)
const AN = new Date('2026-09-29T23:35:00Z')

describe('tarihCozumle — relative dates in the doctor\'s timezone (NOTYA-TAKVIM-TZ-01)', () => {
  it('today depends on the timezone, not on the server clock', () => {
    assert.equal(bugunTz('America/New_York', AN), '2026-09-29')
    assert.equal(bugunTz('Europe/Istanbul', AN), '2026-09-30')
    assert.equal(bugunTz('UTC', AN), '2026-09-29')
    assert.equal(gunKaydirTz(1, 'America/New_York', AN), '2026-09-30')
    assert.equal(gunKaydirTz(-1, 'Europe/Istanbul', AN), '2026-09-29')
  })

  it('invalid or missing tz falls back to Europe/Istanbul', () => {
    assert.equal(saatDilimiSec(null, undefined, 'Mars/Olympus'), 'Europe/Istanbul')
    assert.equal(saatDilimiSec('', 'America/New_York'), 'America/New_York')
    assert.equal(bugunTz('not-a-zone', AN), '2026-09-30')
  })

  it('bugün / yarın / dün / öbür gün / haftaya resolve in tz', () => {
    const ny = 'America/New_York'
    assert.equal(goreliTarihCoz('bugun randevu var mi', ny, AN), '2026-09-29')
    assert.equal(goreliTarihCoz('peki yarin var mi hocam', ny, AN), '2026-09-30')
    assert.equal(goreliTarihCoz('dun kimler geldi', ny, AN), '2026-09-28')
    assert.equal(goreliTarihCoz('obur gun doluyum mu', ny, AN), '2026-10-01')
    assert.equal(goreliTarihCoz('haftaya program ne', ny, AN), '2026-10-06')
    assert.equal(goreliTarihCoz('yarin var mi', 'Europe/Istanbul', AN), '2026-10-01')
    assert.equal(goreliTarihCoz('nasilsin', ny, AN), null)
  })

  it('weekday names: next occurrence; "haftaya cuma" is next week\'s Friday', () => {
    const ny = 'America/New_York' // today Tue 29 Sep
    assert.equal(goreliTarihCoz('cuma kimler geliyor', ny, AN), '2026-10-02')
    assert.equal(goreliTarihCoz('sali randevu var mi', ny, AN), '2026-09-29')
    assert.equal(goreliTarihCoz('pazartesi ne var', ny, AN), '2026-10-05')
    assert.equal(goreliTarihCoz('haftaya cuma bos muyum', ny, AN), '2026-10-09')
    assert.equal(goreliTarihCoz('gelecek hafta sali', ny, AN), '2026-10-06')
    assert.equal(goreliTarihCoz('cumartesi', ny, AN), '2026-10-03')
    assert.equal(goreliTarihCoz('pazar', ny, AN), '2026-10-04')
  })

  it('explicit dates win', () => {
    assert.equal(goreliTarihCoz('2026-10-15 randevu var mi', 'America/New_York', AN), '2026-10-15')
    assert.equal(goreliTarihCoz('3 ekim randevu var mi', 'America/New_York', AN), '2026-10-03')
    assert.equal(goreliTarihCoz('3 ekim 2027', 'America/New_York', AN), '2027-10-03')
    assert.equal(cevaptakiTarih('30 eylul 2026 carsamba takviminde randevu yok'), '2026-09-30')
  })

  it('day boundaries and slot times follow the tz', () => {
    const ny = gunSinirlariUtc('2026-09-29', 'America/New_York')
    assert.equal(ny.bas, '2026-09-29T04:00:00.000Z')
    assert.equal(ny.bit, '2026-09-30T03:59:59.000Z')
    const trt = gunSinirlariUtc('2026-09-30', 'Europe/Istanbul')
    assert.equal(trt.bas, '2026-09-29T21:00:00.000Z')
    assert.equal(trt.bit, '2026-09-30T20:59:59.000Z')
    assert.equal(isoSaatTz('2026-09-29T14:00:00Z', 'America/New_York'), '10:00')
    assert.equal(isoSaatTz('2026-09-29T14:00:00Z', 'Europe/Istanbul'), '17:00')
  })
})
