import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evKbOzeti, evGlukozOzeti } from '../engines/evKayit'

const mk = (n: number, sbp: number, dbp: number) => Array.from({ length: n }, (_, i) => ({ sbp, dbp, olcumAt: `2026-09-${String(3 + Math.floor(i / 2)).padStart(2, '0')}T0${i % 2 ? '8' : '7'}:00:00Z` }))

test('yetersiz veri / beyaz önlük / maskeli / kontrolde', () => {
  assert.equal(evKbOzeti(mk(3, 150, 95), { sbp: 150, dbp: 95 }, '2026-09-16').fenotip, 'yetersiz_veri')
  assert.equal(evKbOzeti(mk(12, 125, 78), { sbp: 152, dbp: 94 }, '2026-09-16').fenotip, 'beyaz_onluk')
  assert.equal(evKbOzeti(mk(12, 142, 88), { sbp: 128, dbp: 80 }, '2026-09-16').fenotip, 'maskeli')
  assert.equal(evKbOzeti(mk(8, 122, 76), { sbp: 128, dbp: 80 }, '2026-09-16').fenotip, 'kontrolde')
  assert.equal(evKbOzeti(mk(8, 145, 92), null, '2026-09-16').fenotip, 'surdurulen_ht')
})

test('glukoz: hipoglisemi öncelikli', () => {
  const r = evGlukozOzeti([{ deger: 65, olcumAt: '2026-09-10T07:00:00Z' }, { deger: 140, olcumAt: '2026-09-11T07:00:00Z' }], '2026-09-16')
  assert.equal(r.hipo, 1); assert.match(r.not, /hipoglisemi/)
})
