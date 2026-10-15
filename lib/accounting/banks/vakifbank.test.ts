import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createVakifBankAdapter } from './vakifbank'
import { getBankAdapter, listBankAdapters } from './index'
import { AdapterNotImplementedError } from '../types'
import type { BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'vakifbank',
  environment: 'test',
  fields: { merchantId: 'x', terminalId: 'y', password: 'z' },
}

const INPUT: PaySessionInput = {
  invoiceId: 'inv-1',
  amountKurus: 12345,
  currency: 'TRY',
  returnUrl: 'https://notya.io/return',
  webhookUrl: 'https://notya.io/api/accounting/payments/webhook/vakifbank',
}

describe('accounting/banks/vakifbank — honest stub (no genuinely hosted/SAQ-A-safe path confirmed)', () => {
  it('reports isReal: false and the correct bankKey', () => {
    const adapter = createVakifBankAdapter()
    assert.equal(adapter.isReal, false)
    assert.equal(adapter.bankKey, 'vakifbank')
  })

  it('createHosted3dsSession throws AdapterNotImplementedError, never a fabricated session', async () => {
    const adapter = createVakifBankAdapter()
    await assert.rejects(adapter.createHosted3dsSession(CREDS, INPUT), AdapterNotImplementedError)
  })

  it('parseWebhook throws AdapterNotImplementedError, never a fabricated event', async () => {
    const adapter = createVakifBankAdapter()
    await assert.rejects(adapter.parseWebhook(CREDS, { body: {} }), AdapterNotImplementedError)
  })

  it('queryStatus throws AdapterNotImplementedError, never a fabricated event', async () => {
    const adapter = createVakifBankAdapter()
    await assert.rejects(adapter.queryStatus(CREDS, 'ref-1'), AdapterNotImplementedError)
  })

  it('the error names this adapter and points at the checklist', async () => {
    const adapter = createVakifBankAdapter()
    try {
      await adapter.createHosted3dsSession(CREDS, INPUT)
      assert.fail('expected a rejection')
    } catch (err) {
      assert.ok(err instanceof AdapterNotImplementedError)
      assert.equal(err.adapterKey, 'banks/vakifbank')
      assert.equal(err.checklistPath, 'lib/accounting/banks/CHECKLIST.md')
    }
  })
})

describe('accounting/banks/index registry — vakifbank is registered via its own dedicated stub file', () => {
  it('getBankAdapter("vakifbank") returns a stub, not a real adapter', () => {
    const adapter = getBankAdapter('vakifbank')
    assert.equal(adapter.isReal, false)
    assert.equal(adapter.bankKey, 'vakifbank')
  })

  it('vakifbank is not counted among the real adapters', () => {
    const real = listBankAdapters().filter((a) => a.isReal).map((a) => a.bankKey)
    assert.ok(!real.includes('vakifbank'))
  })
})
