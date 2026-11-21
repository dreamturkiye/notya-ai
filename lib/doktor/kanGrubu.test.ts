/**
 * KAN-GRUBU-SECIM-01 — blood group is chosen, not typed; old stored values stay readable and are never dropped.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ABO_GRUPLARI, KAN_GRUPLARI, aboNormal, kanGrubuNormal, kanGrubuSecenekleri } from './kanGrubu'
import { CORE_BOLUMLER } from '@/lib/intake/coreAlanlar'

describe('kan grubu', () => {
  it('the 8 options are exactly the intake form\'s options (same stored text)', () => {
    const alan = CORE_BOLUMLER.flatMap((b) => b.alanlar).find((a) => a.id === 'kanGrubu')
    assert.ok(alan && 'secenekler' in alan)
    assert.deepEqual([...(alan as { secenekler: string[] }).secenekler].filter((x) => x !== 'Bilmiyorum'), [...KAN_GRUPLARI])
  })
  it('reads the free-text forms doctors typed before', () => {
    const vakalar: [string, string | null][] = [
      ['B Rh+', 'B Rh+'], ['b+', 'B Rh+'], ['brh+', 'B Rh+'], ['B Rh(+)', 'B Rh+'], ['B pozitif', 'B Rh+'],
      ['0 Rh negatif', '0 Rh-'], ['O−', '0 Rh-'], ['ORh-', '0 Rh-'], ['AB Rh -', 'AB Rh-'], ['ab+', 'AB Rh+'], ['A Rh+', 'A Rh+'],
      ['Bilmiyorum', 'Bilinmiyor'], ['bilinmiyor', 'Bilinmiyor'],
      ['A', null], ['B Rh', null], ['kan grubu bakılacak', null], ['', null], ['Bilmem', null],
    ]
    for (const [g, b] of vakalar) assert.equal(kanGrubuNormal(g), b, g)
  })
  it('a recognised old value is shown as its option; an unrecognised one is kept as its own option', () => {
    assert.deepEqual(kanGrubuSecenekleri('b+').secili, 'B Rh+')
    assert.equal(kanGrubuSecenekleri('b+').secenekler.length, 9)
    const eski = kanGrubuSecenekleri('kan grubu bakılacak')
    assert.equal(eski.secili, 'kan grubu bakılacak')
    assert.equal(eski.secenekler[0], 'kan grubu bakılacak')
    assert.equal(eski.secenekler.length, 10)
    assert.deepEqual(kanGrubuSecenekleri(''), { secili: '', secenekler: [...KAN_GRUPLARI, 'Bilinmiyor'] })
  })
  it('the pregnancy card picks ABO only (Rh has its own field)', () => {
    assert.equal(aboNormal('AB'), 'AB'); assert.equal(aboNormal('o'), '0'); assert.equal(aboNormal('B Rh+'), 'B'); assert.equal(aboNormal('xyz'), null)
    assert.deepEqual(kanGrubuSecenekleri('o', ABO_GRUPLARI).secili, '0')
  })
})
