import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'crypto'
import { createIyzicoAdapter, buildIyzicoAuthHeader } from './iyzico'
import { getFacilitatorAdapter, listFacilitatorAdapters } from './index'
import type { HttpTransport } from '../payments/types'
import type { FacilitatorMerchantCredentials } from '../payments/facilitatorTypes'
import type { PaySessionInput } from '../types'

const CREDS: FacilitatorMerchantCredentials = {
  facilitatorKey: 'iyzico',
  environment: 'test',
  fields: { apiKey: 'sandbox-apiKey-1', secretKey: 'sandbox-secretKey-1' },
}

const BUYER: NonNullable<PaySessionInput['buyer']> = {
  id: 'patient-1',
  surname: 'Yılmaz',
  identityNumber: '11111111111',
  registrationAddress: 'Test Mah. Test Sk. No:1',
  city: 'İstanbul',
  country: 'Turkey',
}

describe('accounting/facilitators/iyzico — IYZWSv2 signing', () => {
  it('builds the Authorization header exactly per docs.iyzico.com/.../hmacsha256-auth', () => {
    // Worked example structure from iyzico's own docs page (field names/algorithm, not their
    // literal sample keys): payload = randomKey + uriPath + rawBody; signature = HMAC-SHA256 hex.
    const { authorization, randomKey } = buildIyzicoAuthHeader(
      'apiKeyX',
      'secretKeyY',
      '/payment/bin/check',
      '{"locale":"tr"}',
      '123456789'
    )
    const expectedSig = createHmac('sha256', 'secretKeyY').update('123456789/payment/bin/check{"locale":"tr"}').digest('hex')
    const expectedAuthString = `apiKey:apiKeyX&randomKey:123456789&signature:${expectedSig}`
    const expectedHeader = `IYZWSv2 ${Buffer.from(expectedAuthString, 'utf8').toString('base64')}`
    assert.equal(randomKey, '123456789')
    assert.equal(authorization, expectedHeader)
  })

  it('generates a fresh randomKey per call when none is supplied', () => {
    const a = buildIyzicoAuthHeader('k', 's', '/x', '{}')
    const b = buildIyzicoAuthHeader('k', 's', '/x', '{}')
    assert.notEqual(a.randomKey, b.randomKey)
  })
})

describe('accounting/facilitators/iyzico — Checkout Form (mocked transport)', () => {
  it('initializes a hosted checkout session with no PAN/CVV in the request body', async () => {
    let seenBody: any = null
    let seenHeaders: Record<string, string> | undefined
    const mock: HttpTransport = {
      async postJson(url, body, headers) {
        assert.equal(url, 'https://sandbox-api.iyzipay.com/payment/iyzipos/checkoutform/initialize/auth/ecom')
        seenBody = body
        seenHeaders = headers
        return {
          status: 200,
          json: { status: 'success', token: 'cf-token-1', paymentPageUrl: 'https://sandbox-cpp.iyzipay.com/cf-token-1' },
        }
      },
    }
    const adapter = createIyzicoAdapter(mock)
    const input: PaySessionInput = {
      invoiceId: 'inv-1',
      amountKurus: 15000,
      currency: 'TRY',
      returnUrl: 'https://notya.io/return',
      webhookUrl: 'https://notya.io/api/accounting/payments/facilitator-webhook/iyzico',
      buyerName: 'Ayşe',
      buyerEmail: 'ayse@example.com',
      buyer: BUYER,
    }
    const session = await adapter.createHostedCheckoutSession(CREDS, input)
    assert.equal(session.sessionId, 'cf-token-1')
    assert.equal(session.redirectUrl, 'https://sandbox-cpp.iyzipay.com/cf-token-1')

    // The core PCI assertion: no card field anywhere in the serialized request body.
    const raw = JSON.stringify(seenBody).toLowerCase()
    for (const forbidden of ['cardnumber', 'cvv', 'cvc', 'expirymonth', 'expiryyear', 'pan']) {
      assert.ok(!raw.includes(forbidden), `request body must never contain "${forbidden}"`)
    }
    assert.equal(seenBody.price, '150.00')
    assert.ok(seenHeaders?.Authorization?.startsWith('IYZWSv2 '))
    assert.ok(seenHeaders?.['x-iyzi-rnd'])
  })

  it('rejects initialize when no buyer identity is supplied', async () => {
    const adapter = createIyzicoAdapter({ async postJson() { throw new Error('should not be called') } })
    await assert.rejects(
      adapter.createHostedCheckoutSession(CREDS, {
        invoiceId: 'inv-2',
        amountKurus: 100,
        currency: 'TRY',
        returnUrl: 'x',
        webhookUrl: 'y',
      })
    )
  })

  it('rejects initialize on a non-success response', async () => {
    const mock: HttpTransport = {
      async postJson() {
        return { status: 400, json: { status: 'failure', errorMessage: 'invalid signature' } }
      },
    }
    const adapter = createIyzicoAdapter(mock)
    await assert.rejects(
      adapter.createHostedCheckoutSession(CREDS, {
        invoiceId: 'inv-3',
        amountKurus: 100,
        currency: 'TRY',
        returnUrl: 'x',
        webhookUrl: 'y',
        buyer: BUYER,
      })
    )
  })

  it('maps a successful retrieve-status response to a captured PaymentEvent', async () => {
    const mock: HttpTransport = {
      async postJson(url, body) {
        assert.equal(url, 'https://sandbox-api.iyzipay.com/payment/iyzipos/checkoutform/auth/ecom/detail')
        assert.equal((body as any).token, 'cf-token-1')
        return {
          status: 200,
          json: {
            status: 'success',
            paymentStatus: 'SUCCESS',
            fraudStatus: 1,
            paidPrice: '150.00',
            conversationId: 'notya-inv-1-123',
            authCode: '123456',
            lastFourDigits: '1234',
            cardAssociation: 'VISA',
          },
        }
      },
    }
    const adapter = createIyzicoAdapter(mock)
    const event = await adapter.queryStatus(CREDS, 'cf-token-1')
    assert.equal(event.status, 'captured')
    assert.equal(event.amountKurus, 15000)
    assert.equal(event.last4, '1234')
  })

  it('maps fraud-review (fraudStatus 0) to pending, not captured', async () => {
    const mock: HttpTransport = {
      async postJson() {
        return {
          status: 200,
          json: { status: 'success', paymentStatus: 'SUCCESS', fraudStatus: 0, paidPrice: '150.00', conversationId: 'x' },
        }
      },
    }
    const adapter = createIyzicoAdapter(mock)
    const event = await adapter.queryStatus(CREDS, 'cf-token-2')
    assert.equal(event.status, 'pending')
  })

  it('maps a failure-status retrieve response to a failed PaymentEvent', async () => {
    const mock: HttpTransport = {
      async postJson() {
        return { status: 200, json: { status: 'failure', conversationId: 'notya-inv-4' } }
      },
    }
    const adapter = createIyzicoAdapter(mock)
    const event = await adapter.queryStatus(CREDS, 'cf-token-3')
    assert.equal(event.status, 'failed')
  })

  it('parseCallback resolves the token via queryStatus', async () => {
    const mock: HttpTransport = {
      async postJson(url) {
        if (url.endsWith('/detail')) {
          return {
            status: 200,
            json: { status: 'success', paymentStatus: 'SUCCESS', fraudStatus: 1, paidPrice: '10.00', conversationId: 'c-1' },
          }
        }
        throw new Error('unexpected call')
      },
    }
    const adapter = createIyzicoAdapter(mock)
    const event = await adapter.parseCallback(CREDS, { token: 'cf-token-4' })
    assert.equal(event.status, 'captured')
  })
})

describe('accounting/facilitators/index registry', () => {
  it('registers iyzico as a real, VERIFIED adapter', () => {
    const adapters = listFacilitatorAdapters()
    assert.equal(adapters.length, 1)
    assert.equal(adapters[0].facilitatorKey, 'iyzico')
    assert.equal(adapters[0].isReal, true)
    assert.equal(adapters[0].verificationStatus, 'VERIFIED')
    assert.equal(getFacilitatorAdapter('iyzico').facilitatorKey, 'iyzico')
  })
})
