/**
 * NOTYA-ACCOUNTING-01 — encrypted credential vault for this module.
 *
 * Reuses the existing KVKK-grade AES-256-GCM primitive (`lib/security/encryption.ts`
 * encryptPII/decryptPII) instead of inventing a second encryption scheme, per the CEO's
 * instruction to reuse existing patterns. Credentials (e-belge integrator secrets, bank merchant
 * API material) are arbitrary vendor-shaped JSON, so this module only adds JSON (de)serialization
 * and a masking helper for display — the crypto itself is untouched.
 *
 * Rule: never log the plaintext secrets object. Only `maskSecrets` output (or a hint like last 4
 * chars of a key) may reach logs, audit rows or API responses.
 */
import { encryptPII, decryptPII } from '@/lib/security/encryption'

/** Encrypt an arbitrary vendor-credential object for storage in a `*_enc` text column. */
export function encryptSecrets(secrets: Record<string, unknown>): string {
  return encryptPII(JSON.stringify(secrets))
}

export function decryptSecrets<T = Record<string, unknown>>(encrypted: string): T {
  return JSON.parse(decryptPII(encrypted)) as T
}

/**
 * Produce a display-safe view of a secrets object: every value becomes a short hint
 * (`****1234` style for strings, `[set]` otherwise) so the UI can show "a key is configured"
 * without ever round-tripping the real value to the browser.
 */
export function maskSecrets(secrets: Record<string, unknown>): Record<string, string> {
  const masked: Record<string, string> = {}
  for (const [key, value] of Object.entries(secrets)) {
    if (typeof value === 'string' && value.length > 0) {
      masked[key] = value.length <= 4 ? '****' : `****${value.slice(-4)}`
    } else if (value === undefined || value === null || value === '') {
      masked[key] = ''
    } else {
      masked[key] = '[set]'
    }
  }
  return masked
}
