// ============================================================
// NOTYA AI - Güvenlik ve Şifreleme (KVKK Uyumlu)
// AES-256-GCM ile kişisel veri şifreleme
// ============================================================

import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bit
const IV_LENGTH = 16  // 128 bit
const TAG_LENGTH = 16 // 128 bit auth tag

// Ortam değişkeninden şifreleme anahtarı türet
function getDerivedKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY ortam değişkeni tanımlı değil')
  }
  const salt = process.env.ENCRYPTION_SALT || 'notya-ai-kvkk-salt-2026'
  return scryptSync(masterKey, salt, KEY_LENGTH)
}

// ============================================================
// KİŞİSEL VERİ ŞİFRELEME - AES-256-GCM
// ============================================================

/**
 * Kişisel veriyi şifrele (KVKK Madde 12 uyumu)
 * Format: base64(iv + encrypted + authTag)
 */
export function encryptPII(plaintext: string): string {
  if (!plaintext) return ''
  
  const key = getDerivedKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ])
  
  const authTag = cipher.getAuthTag()
  
  // IV + encrypted + authTag birleştir
  const combined = Buffer.concat([iv, encrypted, authTag])
  return combined.toString('base64')
}

/**
 * Şifreli veriyi çöz
 */
export function decryptPII(encryptedBase64: string): string {
  if (!encryptedBase64) return ''
  
  const key = getDerivedKey()
  const combined = Buffer.from(encryptedBase64, 'base64')
  
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH)
  
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8')
}

/**
 * TC Kimlik Numarasını hash'le (arama için - ham veri saklanmaz)
 * KVKK: TC Kimlik takma adlaştırma zorunluluğu
 */
export function hashTCKimlik(tcKimlik: string): string {
  if (!tcKimlik) return ''
  const pepper = process.env.TC_HASH_PEPPER || 'notya-tc-pepper-2026'
  return createHash('sha256')
    .update(tcKimlik + pepper)
    .digest('hex')
}

/**
 * Güvenli rastgele token oluştur (session, API key vb.)
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Webhook imzasını doğrula (iyzico, Resend vb.)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHash('sha256')
    .update(payload + secret)
    .digest('hex')
  
  // Zamanlamaya karşı güvenli karşılaştırma
  if (expected.length !== signature.length) return false
  
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

// ============================================================
// HASTA VERİSİ ŞIFRELEME YARDIMCILARI
// ============================================================

export interface PatientPIIRaw {
  name: string
  dob?: string
  gender?: string
  tc_kimlik?: string
  phone?: string
  notes?: string
}

export interface PatientPIIEncrypted {
  name_encrypted: string
  dob_encrypted?: string
  gender_encrypted?: string
  tc_kimlik_hash?: string
  phone_encrypted?: string
  notes_encrypted?: string
}

/**
 * Hasta kişisel verilerini şifrele
 */
export function encryptPatientPII(raw: PatientPIIRaw): PatientPIIEncrypted {
  return {
    name_encrypted: encryptPII(raw.name),
    dob_encrypted: raw.dob ? encryptPII(raw.dob) : undefined,
    gender_encrypted: raw.gender ? encryptPII(raw.gender) : undefined,
    tc_kimlik_hash: raw.tc_kimlik ? hashTCKimlik(raw.tc_kimlik) : undefined,
    phone_encrypted: raw.phone ? encryptPII(raw.phone) : undefined,
    notes_encrypted: raw.notes ? encryptPII(raw.notes) : undefined,
  }
}

/**
 * Şifreli hasta verisini çöz
 */
export function decryptPatientPII(encrypted: PatientPIIEncrypted): Partial<PatientPIIRaw> {
  return {
    name: decryptPII(encrypted.name_encrypted),
    dob: encrypted.dob_encrypted ? decryptPII(encrypted.dob_encrypted) : undefined,
    gender: encrypted.gender_encrypted ? decryptPII(encrypted.gender_encrypted) : undefined,
    phone: encrypted.phone_encrypted ? decryptPII(encrypted.phone_encrypted) : undefined,
    notes: encrypted.notes_encrypted ? decryptPII(encrypted.notes_encrypted) : undefined,
  }
}
