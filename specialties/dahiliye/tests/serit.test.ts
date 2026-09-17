import { test } from 'node:test'
import assert from 'node:assert/strict'
import { vizitSeridi } from '../engines/serit'

test('şerit: chip durumları, gecikmiş sıralaması, plan taslağı', () => {
  const s = vizitSeridi({ bugun: '2026-09-16', kb: { sbp: 150, dbp: 95, tarih: '2026-09-16', hedefteMi: false }, hba1c: { deger: 8.2, delta: 0.4, tarih: '2026-01-10', hedef: 7 }, ldl: { deger: 140, tarih: '2026-08-01', hedef: 70 }, egfr: { deger: 52, tarih: '2026-08-01', evre: 'G3a', renk: 'sari' },
    gorevler: [{ kod: 'a', ad: 'UACR', due: '2026-06-01' }, { kod: 'b', ad: 'Göz dibi', due: '2026-09-01' }, { kod: 'c', ad: 'Lipid', due: '2026-12-01' }], planlar: [{ kaynak: 'HT', madde: 'Basamak artışı' }], kirmizi: ['K 6.2'] })
  assert.equal(s.chips[0].durum, 'kotu'); assert.equal(s.chips[1].durum, 'kotu'); assert.equal(s.chips[1].alt, '>6 ay eski'); assert.equal(s.chips[3].durum, 'dikkat')
  assert.equal(s.overdue.length, 2); assert.equal(s.overdue[0].ad, 'UACR')
  assert.equal(s.planTaslagi[0], '⚑ K 6.2'); assert.match(s.planTaslagi[1], /HT: Basamak/); assert.match(s.planTaslagi[2], /Gecikmiş: UACR/)
  assert.equal(vizitSeridi({ bugun: '2026-09-16', kb: null, hba1c: null, ldl: null, egfr: null, gorevler: [], planlar: [], kirmizi: [] }).chips[0].alt, 'bugün ölç')
})
