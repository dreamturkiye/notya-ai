import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { US_RESMI_GUNLER } from './resmiGunler'

const tarihler = (yil: number) => US_RESMI_GUNLER.gunler('federal', `${yil}-01-01`, `${yil}-12-31`).map((g) => g.tarih)

describe('United States federal holidays', () => {
  it('matches the OPM observed dates for 2026, 2027 and 2028', () => {
    assert.deepEqual(tarihler(2026), ['2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25'])
    assert.deepEqual(tarihler(2027), ['2027-01-01', '2027-01-18', '2027-02-15', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-10-11', '2027-11-11', '2027-11-25', '2027-12-24', '2027-12-31'])
    assert.deepEqual(tarihler(2028), ['2028-01-17', '2028-02-21', '2028-05-29', '2028-06-19', '2028-07-04', '2028-09-04', '2028-10-09', '2028-11-10', '2028-11-23', '2028-12-25'])
  })

  it('names Independence Day on the observed Friday in 2026, and cites the statute', () => {
    const gun = US_RESMI_GUNLER.gunler('federal', '2026-07-03', '2026-07-03')
    assert.equal(gun[0]?.ad, 'Independence Day')
    assert.match(US_RESMI_GUNLER.kaynak, /5 U\.S\.C\. § 6103/)
    assert.match(US_RESMI_GUNLER.inceleme, /lawyer/i)
  })
})
