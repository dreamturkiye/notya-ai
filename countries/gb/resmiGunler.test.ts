import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { GB_RESMI_GUNLER } from './resmiGunler'

const tarihler = (bolge: string, yil: number) => GB_RESMI_GUNLER.gunler(bolge, `${yil}-01-01`, `${yil}-12-31`).map((g) => g.tarih)

describe('United Kingdom bank holidays', () => {
  it('England and Wales matches gov.uk for 2026, 2027 and 2028', () => {
    assert.deepEqual(tarihler('england-wales', 2026), ['2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04', '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28'])
    assert.deepEqual(tarihler('england-wales', 2027), ['2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31', '2027-08-30', '2027-12-27', '2027-12-28'])
    assert.deepEqual(tarihler('england-wales', 2028), ['2028-01-03', '2028-04-14', '2028-04-17', '2028-05-01', '2028-05-29', '2028-08-28', '2028-12-25', '2028-12-26'])
  })

  it('Scotland adds 2 January, St Andrew and the 2026 World Cup day, and has no Easter Monday', () => {
    assert.deepEqual(tarihler('scotland', 2026), ['2026-01-01', '2026-01-02', '2026-04-03', '2026-05-04', '2026-05-25', '2026-06-15', '2026-08-03', '2026-11-30', '2026-12-25', '2026-12-28'])
    assert.ok(!tarihler('scotland', 2027).includes('2027-03-29'))
    assert.deepEqual(tarihler('scotland', 2027).slice(0, 2), ['2027-01-01', '2027-01-04'])
    assert.deepEqual(tarihler('scotland', 2028).slice(0, 2), ['2028-01-03', '2028-01-04'])
    assert.equal(GB_RESMI_GUNLER.varsayilan, 'england-wales')
  })

  it('Northern Ireland observes the Boyne on Monday 13 July 2026', () => {
    assert.ok(tarihler('northern-ireland', 2026).includes('2026-07-13'))
    assert.ok(tarihler('northern-ireland', 2026).includes('2026-03-17'))
    assert.ok(!tarihler('northern-ireland', 2026).includes('2026-06-15'))
    assert.match(GB_RESMI_GUNLER.kaynak, /gov\.uk\/bank-holidays/)
  })
})
