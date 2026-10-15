import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createGenericRestEbelgeAdapter } from './generic_rest'
import { getEbelgeAdapter, listEbelgeAdapters } from './index'
import { AdapterNotImplementedError } from '../types'
import type { HttpTransport } from '../payments/types'
import type { EbelgeCredentials, EbelgeInvoiceDto } from './types'

const CREDS: EbelgeCredentials = {
  vendor: 'generic_rest',
  environment: 'test',
  fields: { baseUrl: 'https://ebelge.sandbox.example', apiKey: 'sk_test_123' },
}

const SAMPLE_INVOICE: EbelgeInvoiceDto = {
  invoiceId: 'inv-1',
  docType: 'esmm',
  seller: { idType: 'tckn', idValue: '11111111110', unvan: 'Dr. Test Hekim', address: 'İstanbul' },
  buyer: { idType: 'tckn', idValue: '22222222220', name: 'Test Hasta' },
  lines: [
    { description: 'Muayene', quantity: 1, unitPriceKurus: 50000, kdvRateBp: 1000, kdvKurus: 5000, lineTotalKurus: 55000 },
  ],
  subtotalKurus: 50000,
  kdvKurus: 5000,
  totalKurus: 55000,
  currency: 'TRY',
  issueDate: '2026-10-15',
}

describe('accounting/ebelge/generic_rest (mocked transport)', () => {
  it('issues a document and never injects a Notya-owned seller identity', async () => {
    const mock: HttpTransport = {
      async postJson(url, body, headers) {
        assert.equal(url, 'https://ebelge.sandbox.example/documents')
        assert.equal(headers?.Authorization, 'Bearer sk_test_123')
        // Seller must be exactly the doctor's own identity from the DTO, untouched.
        assert.deepEqual((body as any).seller, SAMPLE_INVOICE.seller)
        assert.equal((body as any).idempotencyKey, 'inv-1')
        return { status: 201, json: { uuid: 'ebelge-uuid-1', documentNumber: 'ESM2026000001', pdfUrl: 'https://x/pdf' } }
      },
    }
    const adapter = createGenericRestEbelgeAdapter(mock)
    const result = await adapter.issue(CREDS, SAMPLE_INVOICE)
    assert.equal(result.uuid, 'ebelge-uuid-1')
    assert.equal(result.documentNumber, 'ESM2026000001')
  })

  it('throws on a rejected submission instead of pretending it succeeded', async () => {
    const mock: HttpTransport = { async postJson() { return { status: 422, json: { error: 'invalid buyer' } } } }
    const adapter = createGenericRestEbelgeAdapter(mock)
    await assert.rejects(adapter.issue(CREDS, SAMPLE_INVOICE))
  })

  it('supports cancel and credit-note via the same integrator', async () => {
    let calls: string[] = []
    const mock: HttpTransport = {
      async postJson(url) {
        calls.push(url)
        if (url.endsWith('/cancel')) return { status: 200, json: { ok: true } }
        return { status: 200, json: { creditUuid: 'credit-1' } }
      },
    }
    const adapter = createGenericRestEbelgeAdapter(mock)
    const cancelResult = await adapter.cancel(CREDS, 'ebelge-uuid-1')
    assert.equal(cancelResult.ok, true)
    const creditResult = await adapter.credit(CREDS, 'ebelge-uuid-1', 55000, 'iade')
    assert.equal(creditResult.creditUuid, 'credit-1')
    assert.equal(calls.length, 2)
  })
})

describe('accounting/ebelge/index registry', () => {
  it('registers generic_rest as the only real adapter', () => {
    const real = listEbelgeAdapters().filter((a) => a.isReal)
    assert.equal(real.length, 1)
    assert.equal(real[0].vendor, 'generic_rest')
  })

  it('named vendor stubs throw AdapterNotImplementedError on issue', async () => {
    for (const vendor of ['nes', 'qnb_esolutions', 'logo', 'other'] as const) {
      const adapter = getEbelgeAdapter(vendor)
      assert.equal(adapter.isReal, false)
      await assert.rejects(adapter.issue({ vendor, environment: 'test', fields: {} }, SAMPLE_INVOICE), AdapterNotImplementedError)
    }
  })
})
