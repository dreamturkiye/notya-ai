import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createKuveytTurkAdapter } from './kuveyt_turk'
import { getBankAdapter, listBankAdapters } from './index'
import { AdapterNotImplementedError } from '../types'
import type { BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'kuveyt_turk',
  environment: 'test',
  fields: { merchantId: 'x', customerId: 'y', username: 'z', password: 'w' },
}

const INPUT: PaySessionInput = {
  invoiceId: 'inv-1',
  amountKurus: 12345,
  currency: 'TRY',
  returnUrl: 'https://notya.io/return',
  webhookUrl: 'https://notya.io/api/accounting/payments/webhook/kuveyt_turk',
}

describe('accounting/banks/kuveyt_turk — honest stub (ThreeDModelPayGate confirmed PAN-touching by two OSS sources)', () => {
  it('reports isReal: false and the correct bankKey', () => {
    const adapter = createKuveytTurkAdapter()
    assert.equal(adapter.isReal, false)
    assert.equal(adapter.bankKey, 'kuveyt_turk')
  })

  it('createHosted3dsSession throws AdapterNotImplementedError, never a fabricated session', async () => {
    const adapter = createKuveytTurkAdapter()
    await assert.rejects(adapter.createHosted3dsSession(CREDS, INPUT), AdapterNotImplementedError)
  })

  it('parseWebhook throws AdapterNotImplementedError, never a fabricated event', async () => {
    const adapter = createKuveytTurkAdapter()
    await assert.rejects(adapter.parseWebhook(CREDS, { body: {} }), AdapterNotImplementedError)
  })

  it('queryStatus throws AdapterNotImplementedError, never a fabricated event', async () => {
    const adapter = createKuveytTurkAdapter()
    await assert.rejects(adapter.queryStatus(CREDS, 'ref-1'), AdapterNotImplementedError)
  })

  it('the error names this adapter and points at the checklist', async () => {
    const adapter = createKuveytTurkAdapter()
    try {
      await adapter.queryStatus(CREDS, 'ref-1')
      assert.fail('expected a rejection')
    } catch (err) {
      assert.ok(err instanceof AdapterNotImplementedError)
      assert.equal(err.adapterKey, 'banks/kuveyt_turk')
      assert.equal(err.checklistPath, 'lib/accounting/banks/CHECKLIST.md')
    }
  })
})

describe('accounting/banks/index registry — kuveyt_turk is registered via its own dedicated stub file', () => {
  it('getBankAdapter("kuveyt_turk") returns a stub, not a real adapter', () => {
    const adapter = getBankAdapter('kuveyt_turk')
    assert.equal(adapter.isReal, false)
    assert.equal(adapter.bankKey, 'kuveyt_turk')
  })

  it('kuveyt_turk is not counted among the real adapters', () => {
    const real = listBankAdapters().filter((a) => a.isReal).map((a) => a.bankKey)
    assert.ok(!real.includes('kuveyt_turk'))
  })
})
