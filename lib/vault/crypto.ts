import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 12 // GCM standard nonce
const TAG_LENGTH = 16

function getVaultKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY ortam değişkeni tanımlı değil')
  }
  const salt = process.env.ENCRYPTION_SALT || 'notya-ai-vault-blob-salt-2026'
  return scryptSync(masterKey, salt, KEY_LENGTH)
}

/**
 * Encrypt file bytes at rest (AES-256-GCM).
 * Wire format: iv(12) || ciphertext || authTag(16)
 */
export function encryptBytes(plaintext: Buffer): Buffer {
  const key = getVaultKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, encrypted, tag])
}

export function decryptBytes(envelope: Buffer): Buffer {
  if (envelope.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Geçersiz şifreli dosya')
  }
  const key = getVaultKey()
  const iv = envelope.subarray(0, IV_LENGTH)
  const tag = envelope.subarray(envelope.length - TAG_LENGTH)
  const ciphertext = envelope.subarray(IV_LENGTH, envelope.length - TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}
