import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { okulAraclariGorunurMu } from './okulAraclariKapisi'

const NOW = Date.UTC(2026, 9, 15) // 2026-10-15

describe('okulAraclariGorunurMu', () => {
  it('reşit olmayan hasta (yaş < 18) → görünür', () => {
    assert.equal(okulAraclariGorunurMu({ hastaDogumIso: '2015-01-01', nowMs: NOW }), true) // 11 yaş
  })

  it('erişkin hasta, öğrenci bayrağı yok → görünmez', () => {
    assert.equal(okulAraclariGorunurMu({ hastaDogumIso: '1990-01-01', nowMs: NOW }), false)
  })

  it('erişkin ama öğrenci işaretli hasta → görünür (lise/üniversite öğrencisi)', () => {
    assert.equal(okulAraclariGorunurMu({ hastaDogumIso: '2005-01-01', ogrenciMi: true, nowMs: NOW }), true)
  })

  it('yaşı bilinmeyen hasta, öğrenci de işaretli değil → görünmez (varsayılan erişkin/hasta)', () => {
    assert.equal(okulAraclariGorunurMu({ hastaDogumIso: null, nowMs: NOW }), false)
  })

  it('tam 18 yaşını dolduran hasta, öğrenci işaretli değil → görünmez', () => {
    assert.equal(okulAraclariGorunurMu({ hastaDogumIso: '2008-10-15', nowMs: NOW }), false)
  })

  it('18 yaşına 1 gün kala → hâlâ görünür', () => {
    assert.equal(okulAraclariGorunurMu({ hastaDogumIso: '2008-10-16', nowMs: NOW }), true)
  })
})
