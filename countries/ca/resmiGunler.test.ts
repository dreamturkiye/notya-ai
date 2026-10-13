import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CA_RESMI_GUNLER } from './resmiGunler'

const tarihler = (bolge: string, yil: number) => CA_RESMI_GUNLER.gunler(bolge, `${yil}-01-01`, `${yil}-12-31`).map((g) => g.tarih)

describe('Canada general holidays', () => {
  it('the federal list for 2026, and Canada Day 2028 taken on the Friday', () => {
    assert.deepEqual(tarihler('federal', 2026), ['2026-01-01', '2026-04-03', '2026-05-18', '2026-07-01', '2026-09-07', '2026-09-30', '2026-10-12', '2026-11-11', '2026-12-25', '2026-12-28'])
    assert.ok(tarihler('federal', 2027).includes('2027-12-31'))
    assert.ok(tarihler('federal', 2028).includes('2028-06-30'))
    assert.ok(!tarihler('federal', 2028).includes('2028-01-01'))
    assert.match(CA_RESMI_GUNLER.kaynak, /Canada Labour Code/)
  })

  it('Ontario adds Family Day; the federal default does not', () => {
    assert.ok(tarihler('on', 2026).includes('2026-02-16'))
    assert.ok(!tarihler('federal', 2026).includes('2026-02-16'))
    const aile = CA_RESMI_GUNLER.gunler('on', '2026-02-16', '2026-02-16')
    assert.equal(aile[0]?.inceleme, true)
    assert.equal(CA_RESMI_GUNLER.varsayilan, 'federal')
  })
})
