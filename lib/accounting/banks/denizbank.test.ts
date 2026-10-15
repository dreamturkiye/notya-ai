import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createDenizbankAdapter } from './denizbank'
import { getBankAdapter, listBankAdapters } from './index'
import { AdapterNotImplementedError } from '../types'
import type { BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'denizbank',
  environment: 'test',
  fields: { merchantId: 'x', apiUser: 'y', apiPassword: 'z', storeKey: 'w' },
}

const INPUT: PaySessionInput = {
  invoiceId: 'inv-1',
  amountKurus: 12345,
  currency: 'TRY',
  returnUrl: 'https://notya.io/return',
  webhookUrl: 'https://notya.io/api/accounting/payments/webhook/denizbank',
}

describe('accounting/banks/denizbank — honest stub (3DHost model name found, no structural card-free confirmation)', () => {
  it('reports isReal: false and the correct bankKey', () => {
    const adapter = createDenizbankAdapter()
    assert.equal(adapter.isReal, false)
    assert.equal(adapter.bankKey, 'denizbank')
  })

  it('createHosted3dsSession throws AdapterNotImplementedError, never a fabricated session', async () => {
    const adapter = createDenizbankAdapter()
    await assert.rejects(adapter.createHosted3dsSession(CREDS, INPUT), AdapterNotImplementedError)
  })

  it('parseWebhook throws AdapterNotImplementedError, never a fabricated event', async () => {
    const adapter = createDenizbankAdapter()
    await assert.rejects(adapter.parseWebhook(CREDS, { body: {} }), AdapterNotImplementedError)
  })

  it('queryStatus throws AdapterNotImplementedError, never a fabricated event', async () => {
    const adapter = createDenizbankAdapter()
    await assert.rejects(adapter.queryStatus(CREDS, 'ref-1'), AdapterNotImplementedError)
  })

  it('the error names this adapter and points at the checklist', async () => {
    const adapter = createDenizbankAdapter()
    try {
      await adapter.parseWebhook(CREDS, { body: {} })
      assert.fail('expected a rejection')
    } catch (err) {
      assert.ok(err instanceof AdapterNotImplementedError)
      assert.equal(err.adapterKey, 'banks/denizbank')
      assert.equal(err.checklistPath, 'lib/accounting/banks/CHECKLIST.md')
    }
  })
})

describe('accounting/banks/index registry — denizbank is registered via its own dedicated stub file', () => {
  it('getBankAdapter("denizbank") returns a stub, not a real adapter', () => {
    const adapter = getBankAdapter('denizbank')
    assert.equal(adapter.isReal, false)
    assert.equal(adapter.bankKey, 'denizbank')
  })

  it('denizbank is not counted among the real adapters', () => {
    const real = listBankAdapters().filter((a) => a.isReal).map((a) => a.bankKey)
    assert.ok(!real.includes('denizbank'))
  })
})
