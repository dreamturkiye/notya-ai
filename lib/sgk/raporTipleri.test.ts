import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  RAPOR_TIPLERI,
  addDaysTr,
  resolveRaporTipi,
  systemPromptFor,
} from './raporTipleri'

describe('sgk raporTipleri', () => {
  it('lists unique report types without duplicate kurul', () => {
    const labels = RAPOR_TIPLERI.map((t) => t.label)
    assert.equal(new Set(labels).size, labels.length)
    assert.ok(RAPOR_TIPLERI.some((t) => t.id === 'is_goremezlik'))
    assert.ok(RAPOR_TIPLERI.some((t) => t.id === 'ilac_kullanim'))
    assert.ok(RAPOR_TIPLERI.some((t) => t.id === 'tibbi_malzeme'))
    assert.ok(RAPOR_TIPLERI.some((t) => t.id === 'muayenehane_istirahat'))
  })

  it('istirahat uses days and excludes çalışma kapasitesi from prompt', () => {
    const tip = resolveRaporTipi('is_goremezlik')
    assert.equal(tip.sureBirimi, 'gun')
    const prompt = systemPromptFor(tip)
    assert.match(prompt, /çalışma kapasitesi/i)
    assert.match(prompt, /YOKTUR/)
    assert.doesNotMatch(prompt, /calismaKapasitesi/)
  })

  it('resolves legacy labels', () => {
    assert.equal(resolveRaporTipi('İş Göremezlik (İstirahat) Raporu').id, 'is_goremezlik')
    assert.equal(resolveRaporTipi('İlaç Kullanım Raporu').id, 'ilac_kullanim')
  })

  it('computes inclusive end date in TR locale', () => {
    const start = new Date(2026, 8, 5) // 5 Sep 2026 local
    const end = addDaysTr(start, 3)
    // tr-TR may render 7.09.2026 or 07.09.2026
    assert.match(end, /^0?7\.0?9\.2026$/)
  })
})
