import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { UZ_RESMI_GUNLER } from './resmiGunler'

const gunler = (yil: number) => UZ_RESMI_GUNLER.gunler('milliy', `${yil}-01-01`, `${yil}-12-31`)

describe('Uzbekistan public days', () => {
  it('locks the fixed dates, and the movable days stay a marked draft', () => {
    const y2026 = gunler(2026).map((g) => g.tarih)
    for (const t of ['2026-01-01', '2026-03-08', '2026-03-21', '2026-05-09', '2026-09-01', '2026-10-01', '2026-12-08']) assert.ok(y2026.includes(t), t)
    const taslak = gunler(2026).filter((g) => g.inceleme)
    assert.deepEqual(taslak.map((g) => g.tarih), ['2026-03-20', '2026-03-21', '2026-05-27', '2026-05-28'])
    assert.deepEqual(gunler(2027).filter((g) => g.inceleme).map((g) => g.tarih), ['2027-03-10', '2027-03-11', '2027-05-17', '2027-05-18'])
    assert.deepEqual(gunler(2028).filter((g) => g.inceleme).map((g) => g.tarih), ['2028-02-27', '2028-02-28', '2028-05-05', '2028-05-06'])
    assert.match(UZ_RESMI_GUNLER.kaynak, /lex\.uz/)
    assert.match(UZ_RESMI_GUNLER.inceleme, /draft/i)
  })
})
