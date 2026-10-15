/**
 * NOTYA-ACCOUNTING-01 — iyzico Checkout Form adapter. Status: **VERIFIED** (hosted-checkout
 * flow + request/response shapes confirmed against iyzico's own current public docs — see
 * citations below, fetched 2026-10-15). This is the default/recommended payment path in the
 * hybrid model (Kaan, 2026-10-15): it is the only payment-provider integration in this module that
 * has genuinely public documentation of a true hosted-card-entry flow, which is why it ships as
 * the facilitator path instead of a 12th direct-bank stub.
 *
 * PCI posture (why this is SAQ-A safe): CFInitializeRequest has NO card number/CVV/expiry field
 * at all (confirmed from the live docs page, not assumed). The response instead returns
 * `checkoutFormContent` (embeddable hosted form HTML) and `paymentPageUrl` (a redirect to iyzico's
 * own hosted Common Payment Page) — the customer enters their card on iyzico's page/iframe, never
 * Notya's. Notya's backend only ever sees the `token` and, after redirect, the retrieve-status
 * response (masked `binNumber`/`lastFourDigits`, never the full PAN). This matches
 * docs/ARCH-NOTYA-ACCOUNTING.md §1/§2.7 exactly — the opposite of the Garanti/VakıfBank/NestPay
 * findings (see ../banks/CHECKLIST.md), where the only public docs required the merchant to
 * submit the raw PAN before the 3DS step.
 *
 * Sources (fetched 2026-10-15, cited inline where they matter):
 * - CF Initialize request/response fields: https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize
 * - CF Retrieve (status) request/response fields: https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-retrieve
 * - IYZWSv2 HMAC-SHA256 signing algorithm: https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth
 * - Sandbox vs. live base URLs: https://docs.iyzico.com/en/getting-started/preliminaries/live-vs-sandbox
 *   (sandbox: https://sandbox-api.iyzipay.com, live: https://api.iyzipay.com)
 *
 * NOT verified here (left honestly out of scope, do not infer from this file):
 * - The exact `signature` *response*-verification algorithm (iyzico's outbound integrity field) —
 *   this adapter trusts the retrieve-status call (server-to-server, over TLS, authenticated with
 *   our own signed request) rather than trusting the callback body's fields directly, which is
 *   the same "never trust the webhook payload alone" posture as generic_hosted.ts, just achieved
 *   by always re-querying instead of verifying a response signature whose algorithm wasn't
 *   confirmed in this research pass.
 * - Refund/cancel endpoints (not needed for the MVP charge flow; same CHECKLIST.md tracks this).
 */
import { createHmac, randomBytes } from 'crypto'
import type { PaymentFacilitatorAdapter, FacilitatorMerchantCredentials } from '../payments/facilitatorTypes'
import type { HttpTransport } from '../payments/types'
import { fetchTransport } from '../payments/types'
import type { HostedSession, PaySessionInput, PaymentEvent, PaymentStatus } from '../types'

const SANDBOX_BASE = 'https://sandbox-api.iyzipay.com'
const LIVE_BASE = 'https://api.iyzipay.com'
const CF_INITIALIZE_PATH = '/payment/iyzipos/checkoutform/initialize/auth/ecom'
const CF_RETRIEVE_PATH = '/payment/iyzipos/checkoutform/auth/ecom/detail'

function requireField(fields: Record<string, string>, key: string): string {
  const v = fields[key]
  if (!v) throw new Error(`iyzico adapter: missing required merchant field "${key}"`)
  return v
}

function baseUrl(environment: 'test' | 'live'): string {
  return environment === 'live' ? LIVE_BASE : SANDBOX_BASE
}

/**
 * IYZWSv2 Authorization header, exactly per
 * https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth :
 *   payload   = randomKey + uriPath + rawJsonBody
 *   signature = hex(HMAC_SHA256(payload, secretKey))
 *   authStr   = "apiKey:" + apiKey + "&randomKey:" + randomKey + "&signature:" + signature
 *   header    = "IYZWSv2 " + base64(utf8(authStr))
 */
export function buildIyzicoAuthHeader(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  rawBody: string,
  randomKey: string = `${Date.now()}${randomBytes(8).toString('hex')}`
): { authorization: string; randomKey: string } {
  const payload = randomKey + uriPath + rawBody
  const signature = createHmac('sha256', secretKey).update(payload, 'utf8').digest('hex')
  const authString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`
  const token = Buffer.from(authString, 'utf8').toString('base64')
  return { authorization: `IYZWSv2 ${token}`, randomKey }
}

export function createIyzicoAdapter(transport: HttpTransport = fetchTransport): PaymentFacilitatorAdapter {
  async function call(
    credentials: FacilitatorMerchantCredentials,
    path: string,
    body: Record<string, unknown>
  ): Promise<{ status: number; json: unknown }> {
    const apiKey = requireField(credentials.fields, 'apiKey')
    const secretKey = requireField(credentials.fields, 'secretKey')
    const rawBody = JSON.stringify(body)
    const { authorization, randomKey } = buildIyzicoAuthHeader(apiKey, secretKey, path, rawBody)
    return transport.postJson(`${baseUrl(credentials.environment)}${path}`, body, {
      Authorization: authorization,
      'x-iyzi-rnd': randomKey,
    })
  }

  return {
    facilitatorKey: 'iyzico',
    isReal: true,
    verificationStatus: 'VERIFIED',
    verificationNote:
      'Checkout Form initialize/retrieve request+response fields and IYZWSv2 signing confirmed ' +
      'against docs.iyzico.com on 2026-10-15; no live-account end-to-end test performed (no real ' +
      'iyzico merchant credentials available in this build) — see CHECKLIST.md "What a human still ' +
      'needs to do" before the first real charge.',

    async createHostedCheckoutSession(
      credentials: FacilitatorMerchantCredentials,
      input: PaySessionInput
    ): Promise<HostedSession> {
      const buyer = input.buyer
      if (!buyer) {
        throw new Error('iyzico adapter: input.buyer is required by Checkout Form (BuyerCF) — see ACCOUNTING-11')
      }
      const conversationId = `notya-${input.invoiceId}-${Date.now()}`
      const price = (input.amountKurus / 100).toFixed(2)

      const { status, json } = await call(credentials, CF_INITIALIZE_PATH, {
        locale: 'tr',
        conversationId,
        price,
        paidPrice: price,
        currency: input.currency,
        callbackUrl: input.webhookUrl,
        buyer: {
          id: buyer.id,
          name: input.buyerName || 'Hasta',
          surname: buyer.surname,
          identityNumber: buyer.identityNumber,
          email: input.buyerEmail || 'hasta@notya.ai',
          gsmNumber: buyer.gsmNumber,
          registrationAddress: buyer.registrationAddress,
          city: buyer.city,
          country: buyer.country,
          ip: buyer.ip || '0.0.0.0',
        },
        billingAddress: {
          address: buyer.registrationAddress,
          contactName: `${input.buyerName || 'Hasta'} ${buyer.surname}`,
          city: buyer.city,
          country: buyer.country,
        },
        basketItems: [
          {
            id: input.invoiceId,
            price,
            name: 'Notya Faturalama & Tahsilat',
            category1: 'Sağlık',
            itemType: 'VIRTUAL',
          },
        ],
      })

      if (status < 200 || status >= 300) {
        throw new Error(`iyzico: CF initialize failed (HTTP ${status}): ${JSON.stringify(json)}`)
      }
      const body = json as {
        status?: string
        token?: string
        paymentPageUrl?: string
        errorMessage?: string
      }
      if (body.status !== 'success' || !body.token || !body.paymentPageUrl) {
        throw new Error(`iyzico: CF initialize returned failure: ${body.errorMessage || JSON.stringify(body)}`)
      }

      return {
        bankKey: 'iyzico',
        sessionId: body.token,
        redirectUrl: body.paymentPageUrl,
        merchantRef: conversationId,
        environment: credentials.environment,
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      }
    },

    async parseCallback(credentials: FacilitatorMerchantCredentials, raw: unknown): Promise<PaymentEvent> {
      const envelope = raw as { token?: string }
      if (!envelope.token) throw new Error('iyzico: callback missing token')
      return this.queryStatus(credentials, envelope.token)
    },

    async queryStatus(credentials: FacilitatorMerchantCredentials, token: string): Promise<PaymentEvent> {
      const { status, json } = await call(credentials, CF_RETRIEVE_PATH, { locale: 'tr', token })
      if (status < 200 || status >= 300) {
        throw new Error(`iyzico: CF retrieve failed (HTTP ${status}): ${JSON.stringify(json)}`)
      }
      const body = json as {
        status?: string
        paymentStatus?: string
        fraudStatus?: number
        paidPrice?: string | number
        conversationId?: string
        authCode?: string
        lastFourDigits?: string
        cardAssociation?: string
        errorMessage?: string
      }
      if (body.status !== 'success') {
        return {
          bankKey: 'iyzico',
          merchantRef: body.conversationId || token,
          status: 'failed',
          amountKurus: 0,
          raw: body,
        }
      }
      const statusMap: Record<string, PaymentStatus> = {
        SUCCESS: 'captured',
      }
      const mapped: PaymentStatus = body.fraudStatus === 1 ? statusMap[body.paymentStatus || 'SUCCESS'] || 'pending' : 'pending'
      const amountKurus = Math.round(Number(body.paidPrice || 0) * 100)
      return {
        bankKey: 'iyzico',
        merchantRef: body.conversationId || token,
        status: mapped,
        amountKurus,
        authCode: body.authCode,
        last4: body.lastFourDigits,
        brand: body.cardAssociation,
        raw: body,
      }
    },
  }
}
