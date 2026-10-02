import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { vizitGunu, vizitGununeGoreSirala } from './vizitTarihi'

// NOTYA-VIZIT-TARIHI-01
describe('vizitGunu', () => {
  it('the note day wins over the session row creation time', () => {
    assert.equal(vizitGunu('2026-09-24T10:00:00Z', '2026-07-08T09:00:00Z'), '2026-07-08T09:00:00Z')
  })
  it('falls back to the session row when there is no note', () => {
    assert.equal(vizitGunu('2026-09-24T10:00:00Z', null), '2026-09-24T10:00:00Z')
    assert.equal(vizitGunu('2026-09-24T10:00:00Z', ''), '2026-09-24T10:00:00Z')
  })
  it('is empty when nothing is known', () => {
    assert.equal(vizitGunu(null, undefined), '')
  })
})
describe('vizitGununeGoreSirala', () => {
  const seanslar = [
    { id: 'a', created_at: '2026-09-24T10:00:00Z' },
    { id: 'b', created_at: '2026-09-23T10:00:00Z' },
    { id: 'c', created_at: '2026-09-25T10:00:00Z' },
    { id: 'd', created_at: '2026-09-25T11:00:00Z' },
  ]
  it('orders backdated visits by their note day, not by when they were entered', () => {
    const notGunu = new Map([['a', '2026-07-08T09:00:00Z'], ['b', '2025-05-15T09:00:00Z'], ['c', '2026-09-25T08:00:00Z']])
    assert.deepEqual(vizitGununeGoreSirala(seanslar, notGunu).map((s) => s.id), ['b', 'a', 'c', 'd'])
  })
  it('keeps the creation order when no note has its own day', () => {
    assert.deepEqual(vizitGununeGoreSirala(seanslar, new Map()).map((s) => s.id), ['b', 'a', 'c', 'd'])
  })
  it('does not change the input array', () => {
    const kopya = seanslar.map((s) => s.id)
    vizitGununeGoreSirala(seanslar, new Map([['a', '2020-01-01T00:00:00Z']]))
    assert.deepEqual(seanslar.map((s) => s.id), kopya)
  })
})
