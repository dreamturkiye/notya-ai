import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string, secret: string): string {
  const key = Buffer.from(secret.padEnd(32).slice(0, 32))
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decrypt(encryptedData: string, secret: string): string {
  const key = Buffer.from(secret.padEnd(32).slice(0, 32))
  const buf = Buffer.from(encryptedData, 'base64')
  const iv = buf.slice(0, 16)
  const authTag = buf.slice(16, 32)
  const encrypted = buf.slice(32)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}