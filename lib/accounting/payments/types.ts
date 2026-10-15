/**
 * NOTYA-ACCOUNTING-01 — payment adapter contract (docs/ARCH-NOTYA-ACCOUNTING.md §2.6/§2.7).
 *
 * Every bank sanal POS integration implements this same interface. Hosted/redirect 3D Secure is
 * mandatory — Notya never receives PAN/CVV, only a redirect URL to the bank's own hosted page and
 * a server-to-server webhook/status callback afterwards (PCI SAQ-A posture).
 *
 * `BankMerchantCredentials` is intentionally a loose bag: real bank fields vary (merchant id,
 * terminal id, store key, API user/password, public/secret keys...). The adapter for each bank
 * knows its own shape; the core never inspects these fields directly.
 */
import type { BankKey, HostedSession, PaySessionInput, PaymentEvent } from '../types'

export interface BankMerchantCredentials {
  bankKey: BankKey
  environment: 'test' | 'live'
  /** Vendor-shaped fields, decrypted from accounting_bank_merchants.secrets_enc just before use. */
  fields: Record<string, string>
}

export interface BankPosAdapter {
  readonly bankKey: BankKey
  /** True only for the one adapter that is genuinely implemented against a real/sandbox transport. */
  readonly isReal: boolean
  createHosted3dsSession(
    credentials: BankMerchantCredentials,
    input: PaySessionInput
  ): Promise<HostedSession>
  parseWebhook(credentials: BankMerchantCredentials, raw: unknown): Promise<PaymentEvent>
  queryStatus(credentials: BankMerchantCredentials, merchantRef: string): Promise<PaymentEvent>
}

/** Injectable transport so the real adapter's HTTP calls can be mocked in tests without a network. */
export interface HttpTransport {
  postJson(url: string, body: unknown, headers?: Record<string, string>): Promise<{ status: number; json: unknown }>
}

export const fetchTransport: HttpTransport = {
  async postJson(url, body, headers) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    return { status: res.status, json }
  },
}
