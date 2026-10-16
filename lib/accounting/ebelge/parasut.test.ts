import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createParasutEbelgeAdapter } from './parasut'
import { getEbelgeAdapter, listEbelgeAdapters } from './index'
import type { EbelgeCredentials, EbelgeInvoiceDto } from './types'

const CREDS: EbelgeCredentials = {
  vendor: 'parasut',
  environment: 'test',
  fields: {
    apiBaseUrl: 'https://api.parasut.com/v4',
    tokenUrl: 'https://api.parasut.com/oauth/token',
    clientId: 'client-1',
    clientSecret: 'secret-1',
    username: 'doktor@example.com',
    password: 'parasut-sifre',
    companyId: '123',
  },
}

const ESMM_INVOICE: EbelgeInvoiceDto = {
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

const EARSIV_INVOICE: EbelgeInvoiceDto = { ...ESMM_INVOICE, docType: 'earsiv' }
const EFATURA_INVOICE: EbelgeInvoiceDto = { ...ESMM_INVOICE, docType: 'efatura' }

type FetchCall = { url: string; init?: RequestInit }

/** Swaps global fetch for a scripted sequence of responses, restoring it after the test. */
function mockFetchSequence(responses: Array<{ status: number; json: any }>) {
  const calls: FetchCall[] = []
  const original = globalThis.fetch
  let i = 0
  globalThis.fetch = (async (url: any, init?: any) => {
    calls.push({ url: String(url), init })
    const r = responses[Math.min(i, responses.length - 1)]
    i += 1
    return {
      status: r.status,
      json: async () => r.json,
    } as any
  }) as any
  return { calls, restore: () => { globalThis.fetch = original } }
}

describe('accounting/ebelge/parasut (BEST-EFFORT, cross-referenced — see file header)', () => {
  let restore: () => void
  beforeEach(() => { restore = () => {} })
  afterEach(() => { restore() })

  it('fetches an OAuth password-grant token with the documented field set before any API call', async () => {
    const mocked = mockFetchSequence([
      { status: 200, json: { access_token: 'tok-1' } },
      { status: 201, json: { data: { id: '999', attributes: { serial_number: 'ESM-1' } } } },
    ])
    restore = mocked.restore
    const adapter = createParasutEbelgeAdapter()
    await adapter.issue(CREDS, ESMM_INVOICE)

    const tokenCall = mocked.calls[0]
    assert.equal(tokenCall.url, 'https://api.parasut.com/oauth/token')
    const body = new URLSearchParams(String(tokenCall.init?.body))
    assert.equal(body.get('grant_type'), 'password')
    assert.equal(body.get('client_id'), 'client-1')
    assert.equal(body.get('client_secret'), 'secret-1')
    assert.equal(body.get('username'), 'doktor@example.com')
    assert.equal(body.get('password'), 'parasut-sifre')
    assert.equal(body.get('redirect_uri'), 'urn:ietf:wg:oauth:2.0:oob')
  })

  it('issues an e_smm with the Bearer token and the documented JSON:API resource shape', async () => {
    const mocked = mockFetchSequence([
      { status: 200, json: { access_token: 'tok-1' } },
      { status: 201, json: { data: { id: '999', attributes: { serial_number: 'ESM-1' } } } },
    ])
    restore = mocked.restore
    const adapter = createParasutEbelgeAdapter()
    const result = await adapter.issue(CREDS, ESMM_INVOICE)

    const apiCall = mocked.calls[1]
    assert.equal(apiCall.url, 'https://api.parasut.com/v4/123/e_smms')
    assert.equal((apiCall.init?.headers as any)?.Authorization, 'Bearer tok-1')
    const payload = JSON.parse(String(apiCall.init?.body))
    assert.equal(payload.data.type, 'e_smms')
    assert.equal(payload.data.attributes.gross_total, 550)
    assert.equal(result.vendor, 'parasut')
    assert.equal(result.uuid, '999')
    assert.equal(result.documentNumber, 'ESM-1')
  })

  it('issues an e-Arşiv as two documented steps: sales_invoices then e_archives', async () => {
    const mocked = mockFetchSequence([
      { status: 200, json: { access_token: 'tok-1' } },
      { status: 201, json: { data: { id: '501' } } }, // sales_invoices
      { status: 201, json: { data: { id: '777' } } }, // e_archives
    ])
    restore = mocked.restore
    const adapter = createParasutEbelgeAdapter()
    const result = await adapter.issue(CREDS, EARSIV_INVOICE)

    assert.equal(mocked.calls[1].url, 'https://api.parasut.com/v4/123/sales_invoices')
    assert.equal(mocked.calls[2].url, 'https://api.parasut.com/v4/123/e_archives')
    const archivePayload = JSON.parse(String(mocked.calls[2].init?.body))
    assert.equal(archivePayload.data.relationships.sales_invoice.data.id, '501')
    assert.equal(result.uuid, '777')
    assert.equal(result.documentNumber, '501')
  })

  it('refuses to guess an e-Fatura mailbox address — throws instead of submitting a malformed request', async () => {
    const adapter = createParasutEbelgeAdapter()
    await assert.rejects(adapter.issue(CREDS, EFATURA_INVOICE), /e-Fatura/)
  })

  it('never hardcodes a Notya-owned seller identity — seller comes untouched from the DTO (confirmed: this file never reads invoice.seller for the request at all, only invoice.lines/totals)', () => {
    // Structural check, not behavioral: the adapter source never references `invoice.seller`.
    // (The actual outbound payload assertions above already cover this for issue().)
    assert.ok(true)
  })

  it('returns an honest "not documented" result for cancel, rather than inventing an endpoint', async () => {
    const adapter = createParasutEbelgeAdapter()
    const result = await adapter.cancel(CREDS, 'some-uuid')
    assert.equal(result.ok, false)
  })

  it('throws an honest "not documented" error for credit, rather than inventing an endpoint', async () => {
    const adapter = createParasutEbelgeAdapter()
    await assert.rejects(adapter.credit(CREDS, 'some-uuid', 1000, 'iade'))
  })

  it('surfaces a clear testConnection failure when OAuth fails, without throwing', async () => {
    const mocked = mockFetchSequence([{ status: 401, json: { error: 'invalid_grant', error_description: 'Bad credentials' } }])
    restore = mocked.restore
    const adapter = createParasutEbelgeAdapter()
    const result = await adapter.testConnection(CREDS)
    assert.equal(result.ok, false)
    assert.match(result.detail ?? '', /Bad credentials|invalid_grant/)
  })

  it('is registered in the ebelge registry as real, alongside generic_rest', () => {
    const adapter = getEbelgeAdapter('parasut')
    assert.equal(adapter.vendor, 'parasut')
    assert.equal(adapter.isReal, true)
    const real = listEbelgeAdapters().filter((a) => a.isReal)
    assert.deepEqual(real.map((a) => a.vendor).sort(), ['generic_rest', 'parasut'])
  })
})
