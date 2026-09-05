import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryStorageProvider } from './dbBlobStorage'
import { encryptBytes, decryptBytes } from './crypto'
import { assertAllowedUpload, VaultValidationError } from './validation'
import { VAULT_MAX_BYTES } from './types'

describe('vault validation', () => {
  it('accepts allowed mime and size', () => {
    assert.doesNotThrow(() => assertAllowedUpload('image/jpeg', 1024, 'ekg.jpg'))
    assert.doesNotThrow(() => assertAllowedUpload('application/pdf', 2048, 'lab.pdf'))
  })

  it('rejects disallowed mime', () => {
    assert.throws(
      () => assertAllowedUpload('application/zip', 100, 'x.zip'),
      (e: unknown) => e instanceof VaultValidationError
    )
  })

  it('rejects oversized files', () => {
    assert.throws(
      () => assertAllowedUpload('image/png', VAULT_MAX_BYTES + 1, 'big.png'),
      (e: unknown) => e instanceof VaultValidationError
    )
  })
})

describe('vault blob crypto', () => {
  before(() => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = 'test-master-key-notya-vault-unit'
    }
  })

  it('round-trips plaintext bytes', () => {
    const plain = Buffer.from('EKG-demo-bytes-åçş')
    const enc = encryptBytes(plain)
    assert.notEqual(enc.toString('base64'), plain.toString('base64'))
    assert.deepEqual(decryptBytes(enc), plain)
  })
})

describe('StorageProvider memory backend', () => {
  it('put/get/delete', async () => {
    const store = new MemoryStorageProvider()
    const key = 'db:doc-1'
    const data = Buffer.from([1, 2, 3, 9])
    await store.put({ key, data })
    assert.deepEqual(await store.get(key), data)
    await store.delete(key)
    await assert.rejects(() => store.get(key))
  })
})

describe('vault access control helpers', () => {
  it('StorageProvider interface is swappable (memory ≠ db key format enforced only by DbBlob)', async () => {
    const store = new MemoryStorageProvider()
    await store.put({ key: 's3://bucket/key', data: Buffer.from('x') })
    assert.equal((await store.get('s3://bucket/key')).toString(), 'x')
  })
})
