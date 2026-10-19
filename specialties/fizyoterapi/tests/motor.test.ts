import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hekimGirdi } from '../engines/girdi'
import { evIzlem, evKontrolGunu } from '../engines/izlem'
import { hekimPlanKaydi } from '../engines/kayit'

describe('fizyo motor', () => {
  it('hekim kapısı ve ev kontrol günü', () => {
    assert.equal('hata' in hekimGirdi(''), true)
    assert.equal('tani' in hekimGirdi('L4'), true)
    const e = evKontrolGunu('2026-10-01')
    assert.equal('gun' in e && e.gun, 7)
    const iz = evIzlem('2026-10-01')
    assert.ok(Array.isArray(iz) && iz.map((x) => x.gun).join(',') === '7,28')
    assert.equal('hata' in hekimPlanKaydi('', '2026-10-01'), true)
    assert.equal('ozet' in hekimPlanKaydi('L4', '2026-10-01'), true)
  })
})
