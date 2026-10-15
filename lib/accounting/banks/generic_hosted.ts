/**
 * NOTYA-ACCOUNTING-01 — the ONE real, working BankPosAdapter.
 *
 * Honesty note (see docs/ARCH-NOTYA-ACCOUNTING.md §4.1 and lib/accounting/banks/CHECKLIST.md):
 * this is a **generic hosted-redirect 3DS adapter**, not a specific bank's real production API.
 * No Turkish bank's live sanal POS field names/endpoints were available with verified
 * documentation at build time, so writing an adapter that *claimed* to be e.g. Garanti BBVA or
 * Akbank with invented field names would have been actively dangerous (wrong auth, wrong
 * signature scheme, silently-wrong amounts) in a feature that moves real patient money.
 *
 * What IS real here: the full request/response flow against a **documented generic protocol**
 * that matches the shape every Turkish bank sanal POS hosted-3DS integration shares (see
 * CHECKLIST.md "Generic protocol" section) —
 *
 *   1. POST {baseUrl}/sessions  { merchantId, amountKurus, currency, merchantRef, returnUrl }
 *      -> { sessionId, redirectUrl, expiresAt }
 *   2. Bank-hosted page handles 3DS; bank calls back to `webhookUrl` with a signed POST.
 *   3. parseWebhook verifies an HMAC-SHA256 signature (header `X-Pos-Signature`) over the raw
 *      body using the merchant's `storeKey`, before trusting any field in it.
 *   4. GET {baseUrl}/sessions/{merchantRef} for out-of-band status queries (missed webhook).
 *
 * A practice points this adapter at any endpoint implementing that protocol — e.g. a sandbox the
 * CEO stands up, or a payment gateway that already speaks this shape. It is registered under the
 * `generic_hosted` bank key (not one of the 11 named banks) specifically so nobody mistakes it
 * for a certified bank integration; each real bank adapter is a thin wrapper around the same
 * ideas once its actual field names/auth are confirmed (see CHECKLIST.md).
 */
import { createHmac, timingSafeEqual } from 'crypto'
import type { BankPosAdapter, BankMerchantCredentials, HttpTransport } from '../payments/types'
import { fetchTransport } from '../payments/types'
import type { HostedSession, PaySessionInput, PaymentEvent, PaymentStatus } from '../types'

function requireField(fields: Record<string, string>, key: string): string {
  const v = fields[key]
  if (!v) throw new Error(`generic_hosted adapter: missing required merchant field "${key}"`)
  return v
}

export function createGenericHostedAdapter(transport: HttpTransport = fetchTransport): BankPosAdapter {
  return {
    bankKey: 'generic_hosted',
    isReal: true,

    async createHosted3dsSession(
      credentials: BankMerchantCredentials,
      input: PaySessionInput
    ): Promise<HostedSession> {
      const baseUrl = requireField(credentials.fields, 'baseUrl')
      const merchantId = requireField(credentials.fields, 'merchantId')
      const merchantRef = `notya-${input.invoiceId}-${Date.now()}`

      const { status, json } = await transport.postJson(`${baseUrl}/sessions`, {
        merchantId,
        amountKurus: input.amountKurus,
        currency: input.currency,
        merchantRef,
        returnUrl: input.returnUrl,
        webhookUrl: input.webhookUrl,
      })

      if (status < 200 || status >= 300) {
        throw new Error(`generic_hosted: session creation failed (HTTP ${status}): ${JSON.stringify(json)}`)
      }
      const body = json as { sessionId?: string; redirectUrl?: string; expiresAt?: string }
      if (!body.sessionId || !body.redirectUrl) {
        throw new Error('generic_hosted: malformed session response (missing sessionId/redirectUrl)')
      }

      return {
        bankKey: 'generic_hosted',
        sessionId: body.sessionId,
        redirectUrl: body.redirectUrl,
        merchantRef,
        environment: credentials.environment,
        expiresAt: body.expiresAt || new Date(Date.now() + 15 * 60_000).toISOString(),
      }
    },

    async parseWebhook(credentials: BankMerchantCredentials, raw: unknown): Promise<PaymentEvent> {
      const storeKey = requireField(credentials.fields, 'storeKey')
      const envelope = raw as {
        body?: Record<string, unknown>
        rawBody?: string
        signature?: string
      }
      if (!envelope.rawBody || !envelope.signature) {
        throw new Error('generic_hosted: webhook envelope missing rawBody/signature')
      }

      const expected = createHmac('sha256', storeKey).update(envelope.rawBody).digest('hex')
      const expectedBuf = Buffer.from(expected, 'hex')
      const gotBuf = Buffer.from(envelope.signature, 'hex')
      const signatureValid =
        expectedBuf.length === gotBuf.length && timingSafeEqual(expectedBuf, gotBuf)
      if (!signatureValid) {
        throw new Error('generic_hosted: webhook signature verification failed')
      }

      const body = envelope.body || (JSON.parse(envelope.rawBody) as Record<string, unknown>)
      return mapStatusPayload(body)
    },

    async queryStatus(credentials: BankMerchantCredentials, merchantRef: string): Promise<PaymentEvent> {
      const baseUrl = requireField(credentials.fields, 'baseUrl')
      const merchantId = requireField(credentials.fields, 'merchantId')
      // GET via postJson's transport is awkward since the shared transport is POST-only in tests;
      // real usage goes through fetch directly here, kept honest and simple.
      const res = await fetch(`${baseUrl}/sessions/${encodeURIComponent(merchantRef)}?merchantId=${encodeURIComponent(merchantId)}`)
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`generic_hosted: status query failed (HTTP ${res.status})`)
      }
      return mapStatusPayload(body)
    },
  }
}

function mapStatusPayload(body: Record<string, unknown>): PaymentEvent {
  const rawStatus = String(body.status || '').toLowerCase()
  const statusMap: Record<string, PaymentStatus> = {
    captured: 'captured',
    success: 'captured',
    approved: 'captured',
    failed: 'failed',
    declined: 'failed',
    refunded: 'refunded',
    cancelled: 'cancelled',
    voided: 'cancelled',
    pending: 'pending',
  }
  const status = statusMap[rawStatus] || 'pending'
  const amountKurus = Number(body.amountKurus)
  if (!Number.isInteger(amountKurus)) {
    throw new Error('generic_hosted: webhook/status payload missing integer amountKurus')
  }
  return {
    bankKey: 'generic_hosted',
    merchantRef: String(body.merchantRef || ''),
    status,
    amountKurus,
    authCode: typeof body.authCode === 'string' ? body.authCode : undefined,
    last4: typeof body.last4 === 'string' ? body.last4 : undefined,
    brand: typeof body.brand === 'string' ? body.brand : undefined,
    raw: body,
  }
}
