/**
 * AU-GAP-CLOSE-01 — pure helpers for letter / MBS / export (no network).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mektubuOku, mbsOnerisiniOku, MEKTUP_ANAHTARI, MBS_ONERI_ANAHTARI } from '@/lib/ulke/uygulama/notModeli'
import { mbsOnerileriniSuz } from './mektup'
import { MEKTUP_TURLERI, mektupTuruMu, PMS_EXPORT_SURUM } from './sabitler'

describe('mektup sabitler', () => {
  it('accepts the three letter kinds and refuses others', () => {
    for (const t of MEKTUP_TURLERI) assert.equal(mektupTuruMu(t), true)
    assert.equal(mektupTuruMu('invoice'), false)
    assert.equal(mektupTuruMu(''), false)
    assert.equal(mektupTuruMu(null), false)
  })
  it('pins the export pack version stamp', () => {
    assert.equal(PMS_EXPORT_SURUM, 'au-pms-export-v2')
  })
})

describe('mektubuOku / mbsOnerisiniOku', () => {
  it('reads a JSON letter body', () => {
    const t = mektubuOku(JSON.stringify({ [MEKTUP_ANAHTARI]: 'Dear colleague,\n\nPlan follows.' }), 1000)
    assert.equal(t, 'Dear colleague,\n\nPlan follows.')
  })
  it('accepts plain text that is not JSON', () => {
    assert.equal(mektubuOku('Plain letter body.', 100), 'Plain letter body.')
  })
  it('reads MBS suggestions and tolerates English keys', () => {
    const o = mbsOnerisiniOku(JSON.stringify({
      [MBS_ONERI_ANAHTARI]: [
        { item: '23', description: 'GP attendance', reason: 'Standard consult' },
        { mbs: '36', aciklama: 'Longer', gerekce: 'Complex' },
        { item: '', aciklama: 'drop me' },
      ],
    }))
    assert.ok(o)
    assert.equal(o!.length, 2)
    assert.equal(o![0].item, '23')
    assert.equal(o![0].aciklama, 'GP attendance')
    assert.equal(o![1].item, '36')
  })
})

describe('mbsOnerileriniSuz', () => {
  it('keeps item-shaped rows, uppercases, caps count, always marks never-lodge', () => {
    const out = mbsOnerileriniSuz([
      { item: '23', aciklama: 'A', gerekce: 'g' },
      { item: '23', aciklama: 'dup', gerekce: 'g' },
      { item: 'not-an-item', aciklama: 'x', gerekce: 'g' },
      { item: '36', aciklama: 'B', gerekce: 'g2' },
    ])
    assert.equal(out.length, 2)
    assert.equal(out[0].item, '23')
    assert.equal(out[0].lodgeEdilmez, true)
    assert.equal(out[1].item, '36')
  })
})
