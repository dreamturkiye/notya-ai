import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ilacIzlemGorevleri } from '../engines/ilacIzlem'

test('metformin yıllık B12/eGFR: lab eskiyse görev, tazeyse yok', () => {
  const g1 = ilacIzlemGorevleri([{ ad: 'Glifor 1000', etken: 'Metformin', aktif: true }], { B12: '2025-06-01', eGFR: '2026-08-01' }, '2026-09-16')
  assert.equal(g1.length, 1); assert.equal(g1[0].kod, 'izlem_metformin'); assert.equal(g1[0].due, '2026-06-01')
  const g2 = ilacIzlemGorevleri([{ ad: 'Glifor 1000', etken: 'Metformin', aktif: true }], { B12: '2026-05-01', eGFR: '2026-08-01' }, '2026-09-16')
  assert.equal(g2.length, 0)
})

test('yeni başlanan ACEi → 14 günde K/Kre; pasif ilaç yok sayılır; aynı kural iki ilaçta tek görev', () => {
  const g = ilacIzlemGorevleri([{ ad: 'Delix', etken: 'Ramipril', baslangic: '2026-09-10', aktif: true }, { ad: 'Diovan', etken: 'Valsartan', aktif: true }, { ad: 'Coumadin', etken: 'Warfarin', aktif: false }], {}, '2026-09-16')
  assert.equal(g.length, 1); assert.equal(g[0].kod, 'izlem_ras'); assert.equal(g[0].due, '2026-09-24')
})

test('levotiroksin doz değişimi 7 hafta TSH; warfarin INR aylık; sıralama due', () => {
  const g = ilacIzlemGorevleri([{ ad: 'Coumadin 5', etken: 'Warfarin', aktif: true }, { ad: 'Levotiron', etken: 'Levotiroksin', baslangic: '2026-09-01', aktif: true }], { INR: '2026-07-01' }, '2026-09-16')
  assert.deepEqual(g.map((x) => x.kod), ['izlem_warfarin', 'izlem_levo'])
  assert.equal(g[1].due, '2026-10-20')
})

test('her izlem görevinde ref_code dipnotu', () => {
  const g = ilacIzlemGorevleri([{ ad: 'Glifor', etken: 'Metformin', aktif: true }, { ad: 'Lipitor', etken: 'Atorvastatin', aktif: true }], {}, '2026-09-16')
  assert.deepEqual(g.map((x) => x.dipnot.ref).sort(), ['TEMD_DM2026', 'TEMD_LIPID'])
})
