import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'crypto'
import { createGenericHostedAdapter } from './generic_hosted'
import { getBankAdapter, listBankAdapters } from './index'
import { AdapterNotImplementedError } from '../types'
import type { HttpTransport, BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'generic_hosted',
  environment: 'test',
  fields: { baseUrl: 'https://sandbox.example', merchantId: 'MERCH-1', storeKey: 'top-secret' },
}

describe('accounting/banks/generic_hosted (mocked transport)', () => {
  it('creates a hosted 3DS session via the mocked transport', async () => {
    const mock: HttpTransport = {
      async postJson(url, body) {
        assert.equal(url, 'https://sandbox.example/sessions')
        assert.equal((body as any).merchantId, 'MERCH-1')
        return {
          status: 200,
          json: { sessionId: 'sess-1', redirectUrl: 'https://bank.example/3ds/sess-1', expiresAt: '2026-10-15T12:00:00Z' },
        }
      },
    }
    const adapter = createGenericHostedAdapter(mock)
    const input: PaySessionInput = {
      invoiceId: 'inv-1',
      amountKurus: 10000,
      currency: 'TRY',
      returnUrl: 'https://notya.io/return',
      webhookUrl: 'https://notya.io/api/accounting/payments/webhook/generic_hosted',
    }
    const session = await adapter.createHosted3dsSession(CREDS, input)
    assert.equal(session.sessionId, 'sess-1')
    assert.equal(session.redirectUrl, 'https://bank.example/3ds/sess-1')
    assert.match(session.merchantRef, /^notya-inv-1-/)
  })

  it('rejects session creation when the HTTP call fails', async () => {
    const mock: HttpTransport = { async postJson() { return { status: 500, json: { error: 'boom' } } } }
    const adapter = createGenericHostedAdapter(mock)
    await assert.rejects(
      adapter.createHosted3dsSession(CREDS, {
        invoiceId: 'inv-2',
        amountKurus: 1000,
        currency: 'TRY',
        returnUrl: 'x',
        webhookUrl: 'y',
      })
    )
  })

  it('verifies the webhook HMAC signature before trusting the payload', async () => {
    const adapter = createGenericHostedAdapter()
    const payload = { status: 'captured', merchantRef: 'ref-1', amountKurus: 5000 }
    const rawBody = JSON.stringify(payload)
    const signature = createHmac('sha256', CREDS.fields.storeKey).update(rawBody).digest('hex')

    const event = await adapter.parseWebhook(CREDS, { rawBody, signature, body: payload })
    assert.equal(event.status, 'captured')
    assert.equal(event.amountKurus, 5000)
  })

  it('rejects a webhook with a bad signature', async () => {
    const adapter = createGenericHostedAdapter()
    const payload = { status: 'captured', merchantRef: 'ref-1', amountKurus: 5000 }
    const rawBody = JSON.stringify(payload)
    await assert.rejects(
      adapter.parseWebhook(CREDS, { rawBody, signature: 'deadbeef'.repeat(8), body: payload })
    )
  })

  it('maps unknown bank statuses to pending rather than throwing', async () => {
    const adapter = createGenericHostedAdapter()
    const payload = { status: 'something_new', merchantRef: 'ref-2', amountKurus: 100 }
    const rawBody = JSON.stringify(payload)
    const signature = createHmac('sha256', CREDS.fields.storeKey).update(rawBody).digest('hex')
    const event = await adapter.parseWebhook(CREDS, { rawBody, signature, body: payload })
    assert.equal(event.status, 'pending')
  })
})

describe('accounting/banks/index registry', () => {
  it('registers generic_hosted as the only real adapter', () => {
    const adapters = listBankAdapters()
    const real = adapters.filter((a) => a.isReal)
    assert.equal(real.length, 1)
    assert.equal(real[0].bankKey, 'generic_hosted')
  })

  it('every named bank stub throws AdapterNotImplementedError, not a fake response', async () => {
    for (const key of ['yapi_kredi', 'isbank', 'garanti', 'akbank', 'qnb', 'ziraat', 'vakifbank', 'halkbank', 'denizbank', 'teb', 'kuveyt_turk'] as const) {
      const adapter = getBankAdapter(key)
      assert.equal(adapter.isReal, false)
      await assert.rejects(
        adapter.createHosted3dsSession({ bankKey: key, environment: 'test', fields: {} }, {
          invoiceId: 'x',
          amountKurus: 100,
          currency: 'TRY',
          returnUrl: 'x',
          webhookUrl: 'y',
        }),
        AdapterNotImplementedError
      )
    }
  })
})
