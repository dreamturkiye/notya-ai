/**
 * NOTYA-ACCOUNTING-01 — payment FACILITATOR adapter contract (hybrid model, Kaan 2026-10-15).
 *
 * Deliberately NOT the same interface object as `BankPosAdapter` (payments/types.ts), even though
 * the shapes are similar — per Kaan's instruction #3, the facilitator path and the direct-bank
 * path must stay structurally independent: "Adding more direct-bank adapters later should never
 * require touching the facilitator code path or vice versa." Sharing one interface would tempt a
 * future change to one family to leak into the other through a shared type. They are intentionally
 * duplicated instead.
 *
 * Same PCI rule as banks: hosted/redirect card entry only. Notya never receives PAN/CVV.
 */
import type { FacilitatorKey, HostedSession, PaySessionInput, PaymentEvent } from '../types'

export interface FacilitatorMerchantCredentials {
  facilitatorKey: FacilitatorKey
  environment: 'test' | 'live'
  /** Vendor-shaped fields (e.g. iyzico apiKey/secretKey), decrypted just before use. */
  fields: Record<string, string>
}

export interface PaymentFacilitatorAdapter {
  readonly facilitatorKey: FacilitatorKey
  readonly isReal: boolean
  /** One-line, user-facing confidence label — see docs/ARCH-NOTYA-ACCOUNTING.md §2.6a. */
  readonly verificationStatus: 'VERIFIED' | 'BEST_EFFORT_UNVERIFIED' | 'STUB'
  /** What was actually checked, for the UI/checklist to show next to verificationStatus. */
  readonly verificationNote: string
  createHostedCheckoutSession(
    credentials: FacilitatorMerchantCredentials,
    input: PaySessionInput
  ): Promise<HostedSession>
  /** Handles both the browser-redirect callback POST and an async webhook — iyzico sends both
   *  carrying the same `token`; either resolves to the same retrieve-status call. */
  parseCallback(credentials: FacilitatorMerchantCredentials, raw: unknown): Promise<PaymentEvent>
  queryStatus(credentials: FacilitatorMerchantCredentials, token: string): Promise<PaymentEvent>
}
