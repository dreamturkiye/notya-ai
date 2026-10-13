import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AU_RESMI_GUNLER } from './resmiGunler'

const tarihler = (bolge: string, bas: string, bit: string) => AU_RESMI_GUNLER.gunler(bolge, bas, bit).map((g) => g.tarih)

describe('Australia public holidays', () => {
  it('2026 Anzac extra Monday is on the national, ACT, NSW and WA lists, not Queensland', () => {
    for (const bolge of ['national', 'act', 'nsw', 'wa']) assert.ok(tarihler(bolge, '2026-04-25', '2026-04-27').includes('2026-04-27'), bolge)
    assert.deepEqual(tarihler('qld', '2026-04-25', '2026-04-27'), ['2026-04-25'])
    assert.ok(tarihler('nsw', '2026-06-08', '2026-06-08').includes('2026-06-08'))
    assert.ok(!tarihler('national', '2026-06-01', '2026-06-30').length)
    assert.ok(tarihler('wa', '2026-09-28', '2026-09-28').includes('2026-09-28'))
    assert.ok(tarihler('qld', '2026-10-05', '2026-10-05').includes('2026-10-05'))
    assert.match(AU_RESMI_GUNLER.kaynak, /fairwork\.gov\.au/)
  })

  it('Boxing Day 2026 keeps the Saturday and adds Monday 28 December', () => {
    const gunler = tarihler('national', '2026-12-25', '2026-12-28')
    assert.ok(gunler.includes('2026-12-25') && gunler.includes('2026-12-26') && gunler.includes('2026-12-28'))
  })
})
