import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kilitDegeri, kilitDogrula } from '../engines/kart'

test('kilit: en yeni kazanır; alan doğrulama', () => {
  const k = [{ kart: 'kvr' as const, alan: 'kategori', deger: 'yuksek', created_at: '2026-09-01' }, { kart: 'kvr' as const, alan: 'kategori', deger: 'cok_yuksek', created_at: '2026-09-10' }]
  assert.equal(kilitDegeri(k, 'kvr', 'kategori'), 'cok_yuksek'); assert.equal(kilitDegeri(k, 'ckd', 'evre'), null)
  assert.equal(kilitDogrula('kvr', 'kategori'), null); assert.match(kilitDogrula('kvr', 'doz')!, /alan değil/); assert.match(kilitDogrula('xyz', 'a')!, /Bilinmeyen/)
})
