import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NZ_RESMI_GUNLER } from './resmiGunler'

const tarihler = (bolge: string, yil: number) => NZ_RESMI_GUNLER.gunler(bolge, `${yil}-01-01`, `${yil}-12-31`).map((g) => g.tarih)

describe('New Zealand public holidays', () => {
  it('the national observed days for 2026 and Matariki for 2026-2028', () => {
    assert.deepEqual(tarihler('national', 2026), ['2026-01-01', '2026-01-02', '2026-02-06', '2026-04-03', '2026-04-06', '2026-04-27', '2026-06-01', '2026-07-10', '2026-10-26', '2026-12-25', '2026-12-28'])
    assert.equal(NZ_RESMI_GUNLER.gunler('national', '2027-06-25', '2027-06-25')[0]?.ad, 'Matariki')
    assert.equal(NZ_RESMI_GUNLER.gunler('national', '2028-07-14', '2028-07-14')[0]?.ad, 'Matariki')
    assert.ok(tarihler('national', 2027).includes('2027-01-04'))
    assert.ok(tarihler('national', 2027).includes('2027-02-08'))
    assert.ok(tarihler('national', 2027).includes('2027-12-27'))
    assert.ok(tarihler('national', 2027).includes('2027-12-28'))
  })

  it('anniversary days sit on the region, not on the national default', () => {
    assert.ok(!tarihler('national', 2026).includes('2026-01-26'))
    assert.ok(tarihler('auckland', 2026).includes('2026-01-26'))
    assert.ok(tarihler('wellington', 2026).includes('2026-01-19'))
    assert.ok(tarihler('taranaki', 2026).includes('2026-03-09'))
    assert.ok(tarihler('southland', 2026).includes('2026-04-07'))
    assert.ok(tarihler('hawkes-bay', 2026).includes('2026-10-23'))
    assert.equal(NZ_RESMI_GUNLER.varsayilan, 'national')
    assert.match(NZ_RESMI_GUNLER.kaynak, /employment\.govt\.nz/)
  })
})
