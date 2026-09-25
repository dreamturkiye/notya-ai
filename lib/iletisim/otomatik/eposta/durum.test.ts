import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

process.env.ENCRYPTION_MASTER_KEY = 'test-anahtari-yalniz-birim-testi'

import { ayniNonceMi, DURUM_OMRU_MS, durumDogrula, durumImzala, nonceUret, pkceUret } from './durum'

test('pkceUret: S256 meydan okuma doğrulayıcının SHA-256 base64url özetidir', () => {
  const { dogrulayici, meydanOkuma } = pkceUret()
  assert.ok(dogrulayici.length >= 43 && dogrulayici.length <= 128)
  assert.match(dogrulayici, /^[A-Za-z0-9_-]+$/)
  assert.equal(meydanOkuma, createHash('sha256').update(dogrulayici).digest('base64url'))
})

test('durum: imzala → doğrula aynı yükü verir', () => {
  const s = durumImzala({ doktorId: 'doktor-a', saglayici: 'google', nonce: 'n1' }, 1_000)
  const y = durumDogrula(s, 2_000)
  assert.deepEqual(y && { d: y.d, s: y.s, n: y.n }, { d: 'doktor-a', s: 'google', n: 'n1' })
})

test('durum: süresi geçmiş reddedilir', () => {
  const s = durumImzala({ doktorId: 'doktor-a', saglayici: 'google', nonce: 'n1' }, 1_000)
  assert.equal(durumDogrula(s, 1_000 + DURUM_OMRU_MS + 1), null)
})

test('durum: yükü değiştirilen (başka doktor) reddedilir', () => {
  const s = durumImzala({ doktorId: 'doktor-a', saglayici: 'google', nonce: 'n1' })
  const [, imza] = s.split('.')
  const sahte = Buffer.from(JSON.stringify({ d: 'doktor-b', s: 'google', n: 'n1', e: Date.now() + 60_000 })).toString('base64url')
  assert.equal(durumDogrula(`${sahte}.${imza}`), null)
  assert.equal(durumDogrula(`${s}x`), null)
  assert.equal(durumDogrula(''), null)
  assert.equal(durumDogrula(null), null)
  assert.equal(durumDogrula('a.b.c'), null)
})

test('durum: başka anahtarla imzalanan reddedilir', () => {
  const s = durumImzala({ doktorId: 'doktor-a', saglayici: 'google', nonce: 'n1' })
  process.env.ENCRYPTION_MASTER_KEY = 'baska-anahtar'
  try {
    assert.equal(durumDogrula(s), null)
  } finally {
    process.env.ENCRYPTION_MASTER_KEY = 'test-anahtari-yalniz-birim-testi'
  }
})

test('nonce: rastgele ve karşılaştırma sabit zamanlı', () => {
  const a = nonceUret()
  assert.notEqual(a, nonceUret())
  assert.equal(ayniNonceMi(a, a), true)
  assert.equal(ayniNonceMi(a, a.slice(1)), false)
})
