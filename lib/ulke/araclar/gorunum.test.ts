import test from 'node:test'
import assert from 'node:assert/strict'
import { ESLENIK, TR_ROZETLERI, aracRozeti, duzHarf } from './gorunum'
import { ORTAK_DOKTOR_ARACLARI, BRANS_DOKTOR_ARACLARI } from '@/lib/doktor/doktorAraclari'
import { KIT_ARACLARI } from './katalog'

const tr = new Map([...ORTAK_DOKTOR_ARACLARI, ...BRANS_DOKTOR_ARACLARI].map((a) => [a.route.replace('/doktor-tools/', ''), a]))

test('every badge in the table equals the Türkiye tile it copies', () => {
  for (const [route, r] of Object.entries(TR_ROZETLERI)) {
    const a = tr.get(route)
    assert.ok(a, `no Türkiye tile ${route}`)
    assert.equal(a.circleColor, r.renk, route)
    assert.equal(a.icon, r.simge, route)
  }
})

test('every counterpart exists, and every kit tool has a badge', () => {
  for (const t of Object.values(ESLENIK)) assert.ok(TR_ROZETLERI[t], t)
  for (const k of KIT_ARACLARI) {
    const r = aracRozeti(k.anahtar)
    assert.match(r.renk, /^#[0-9A-F]{6}$/i)
    assert.ok(r.simge.length >= 1)
    assert.doesNotMatch(r.simge, /[İıĞğÜüŞşÖöÇç]/)
  }
})

test('a shared tool shows the Türkiye colour and the Türkiye code in plain letters', () => {
  assert.deepEqual(aracRozeti('inme-bayraklari'), { renk: '#DC2626', simge: 'IN' })
  assert.equal(duzHarf('Kür'), 'Kur')
})
