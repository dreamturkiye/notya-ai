import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryStorageProvider } from './dbBlobStorage'
import { encryptBytes, decryptBytes } from './crypto'
import { assertAllowedUpload, contentDispositionAd, sanitizeFileName, VaultValidationError } from './validation'
import { VAULT_MAX_BYTES } from './types'

describe('vault validation', () => {
  it('accepts allowed mime and size', () => {
    assert.doesNotThrow(() => assertAllowedUpload('image/jpeg', 1024, 'ekg.jpg'))
    assert.doesNotThrow(() => assertAllowedUpload('application/pdf', 2048, 'lab.pdf'))
    assert.doesNotThrow(() => assertAllowedUpload('video/mp4', 1024, 'us-klip.mp4'))
    assert.doesNotThrow(() => assertAllowedUpload('video/webm', 2048, 'us-klip.webm'))
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

// KASA-BELGE-01 — Dr. Gökhan canlı bildirdi: kasaya yüklediği lab PDF'i açılmıyordu ve adı
// "Hasta I_ki laboratuvar sonuc_ları.pdf" olarak bozulmuştu. İki ayrı kök neden, tek kaynak:
// Türkçe harfler.
describe('KASA-BELGE-01 — Türkçe dosya adları', () => {
  const AD = 'Hasta İki laboratuvar sonuçları.pdf'

  it('macOS NFD adını bozmadan NFC olarak saklar', () => {
    // macOS dosya adlarını ayrışmış verir: "İ" = "I" + U+0307, "ç" = "c" + U+0327.
    assert.equal(sanitizeFileName(AD.normalize('NFD')), AD)
    assert.equal(sanitizeFileName(AD), AD)
    assert.equal(sanitizeFileName('EKG ölçüm ğşıİĞŞ çöüÇÖÜ.pdf'.normalize('NFD')), 'EKG ölçüm ğşıİĞŞ çöüÇÖÜ.pdf')
  })

  it('yol ayıracı ve denetim karakterlerini hâlâ temizler', () => {
    assert.doesNotMatch(sanitizeFileName('../../etc/passwd'), /[/\\]/)
    assert.doesNotMatch(sanitizeFileName('C:\\Windows\\x.pdf'), /[/\\]/)
    assert.equal(sanitizeFileName('a\u0000b.pdf'), 'ab.pdf')
    assert.equal(sanitizeFileName('.gizli'), 'gizli')
    assert.equal(sanitizeFileName('   '), 'belge')
    assert.equal(sanitizeFileName('x'.repeat(300)).length, 180)
  })

  it('Content-Disposition başlığı Latin-1 dışı harflerle de kurulabilir', () => {
    // Asıl hata buydu: ham ad başlığa yazılınca Node başlığı reddediyor, rota 404 dönüyordu.
    // "ğ ş ı İ" Latin-1'de yok; "ç ö ü" olduğu için o adlar tesadüfen çalışıyordu.
    for (const ad of [AD, 'ağustos raporu.pdf', 'kasım-şubat.pdf', 'sonuç.pdf', 'ascii.pdf']) {
      const deger = `inline; ${contentDispositionAd(ad)}`
      assert.doesNotThrow(() => new Headers({ 'Content-Disposition': deger }), ad)
      assert.match(deger, /filename="[\x20-\x7E]*"/)
    }
  })

  it('gerçek adı RFC 5987 alanında taşır ve tırnak kaçışı sızdırmaz', () => {
    const d = contentDispositionAd(AD)
    assert.ok(d.includes(`filename*=UTF-8''${encodeURIComponent(AD)}`))
    assert.ok(!contentDispositionAd('kö"tü\\ad.pdf').includes('"tü'))
    assert.equal(contentDispositionAd(''), `filename="belge"; filename*=UTF-8''belge`)
  })
})
