import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'crypto'
import {
  createDenizbankAdapter,
  buildInterPosHash,
  buildInterPosHostFormFields,
} from './denizbank'
import { getBankAdapter, listBankAdapters } from './index'
import type { BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'denizbank',
  environment: 'test',
  fields: { shopCode: '700000000', secretKey: 'TEST12345' },
}

const INPUT: PaySessionInput = {
  invoiceId: 'inv-1',
  amountKurus: 12345,
  currency: 'TRY',
  returnUrl: 'https://notya.io/return',
  webhookUrl: 'https://notya.io/api/accounting/payments/webhook/denizbank',
}

describe('accounting/banks/denizbank — InterPOS hash (per InterPosCrypt::create3DHash)', () => {
  it('matches a hand-built SHA1(ShopCode+OrderId+PurchAmount+OkUrl+FailUrl+TxnType+InstallmentCount+Rnd+secretKey), base64', () => {
    const hash = buildInterPosHash(
      {
        shopCode: '700000000',
        orderId: 'order-1',
        purchAmount: '123.45',
        okUrl: 'https://notya.io/webhook',
        failUrl: 'https://notya.io/webhook',
        txnType: 'Auth',
        installmentCount: '',
        rnd: 'ABCDEF',
      },
      'TEST12345'
    )
    const plaintext = '700000000' + 'order-1' + '123.45' + 'https://notya.io/webhook' + 'https://notya.io/webhook' + 'Auth' + '' + 'ABCDEF' + 'TEST12345'
    const expected = createHash('sha1').update(plaintext, 'utf8').digest('base64')
    assert.equal(hash, expected)
  })
})

describe('accounting/banks/denizbank — 3DHost form fields (no card data, ever)', () => {
  it('builds a form with SecureType=3DHost, decimal-TRY amount, and no PAN/CVV/Expiry field', () => {
    const fields = buildInterPosHostFormFields(CREDS.fields, INPUT, 'order-123')
    const raw = JSON.stringify(fields).toLowerCase()
    for (const forbidden of ['pan', 'cvv2', 'expiry', 'cardtype']) {
      assert.ok(!raw.includes(forbidden), `3DHost form must never contain "${forbidden}"`)
    }
    assert.equal(fields.SecureType, '3DHost')
    assert.equal(fields.TxnType, 'Auth')
    assert.equal(fields.ShopCode, '700000000')
    assert.equal(fields.PurchAmount, '123.45')
    assert.equal(fields.OrderId, 'order-123')
    assert.ok(fields.Hash)
    // secretKey must never be posted as a plain form field.
    assert.ok(!raw.includes('test12345'))
  })

  it('throws when a required merchant field is missing, instead of silently omitting it', () => {
    assert.throws(() => buildInterPosHostFormFields({ shopCode: 'x' }, INPUT, 'order-1'))
  })
})

describe('accounting/banks/denizbank — createHosted3dsSession (POST-redirect, no network call)', () => {
  it('returns a POST-redirect HostedSession pointed at the test 3DHost gateway', async () => {
    const adapter = createDenizbankAdapter()
    const session = await adapter.createHosted3dsSession(CREDS, INPUT)
    assert.equal(session.bankKey, 'denizbank')
    assert.equal(session.redirectUrl, 'https://test.inter-vpos.com.tr/mpi/3DHost.aspx')
    assert.equal(session.redirectMethod, 'POST')
    assert.ok(session.redirectFormFields?.OrderId)
  })

  it('uses the live 3DHost host when environment is live', async () => {
    const adapter = createDenizbankAdapter()
    const session = await adapter.createHosted3dsSession({ ...CREDS, environment: 'live' }, INPUT)
    assert.equal(session.redirectUrl, 'https://inter-vpos.com.tr/mpi/3DHost.aspx')
  })
})

describe('accounting/banks/denizbank — callback verification (bank-echoed HASHPARAMS, per InterPosCrypt::check3DHash)', () => {
  function signedCallback(fields: Record<string, string>) {
    const hashParams = Object.keys(fields)
    const joined = hashParams.map((k) => fields[k]).join('')
    const HASH = createHash('sha1').update(joined + CREDS.fields.secretKey, 'utf8').digest('base64')
    return { ...fields, HASHPARAMS: hashParams.join(':'), HASH }
  }

  it('maps TxnStat=Y + ProcReturnCode=00 to captured', async () => {
    const adapter = createDenizbankAdapter()
    const body = signedCallback({ OrderId: 'ref-1', TxnStat: 'Y', ProcReturnCode: '00', PurchAmount: '123.45' })
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.status, 'captured')
    assert.equal(event.amountKurus, 12345)
  })

  it('maps TxnStat=A ("half secure") to failed, not captured', async () => {
    const adapter = createDenizbankAdapter()
    const body = signedCallback({ OrderId: 'ref-2', TxnStat: 'A', PurchAmount: '50.00' })
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.status, 'failed')
  })

  it('rejects a callback with a bad hash before looking at TxnStat at all', async () => {
    const adapter = createDenizbankAdapter()
    const body = { OrderId: 'ref-3', TxnStat: 'Y', ProcReturnCode: '00', PurchAmount: '10.00', HASHPARAMS: 'OrderId:TxnStat', HASH: 'not-the-real-hash' }
    await assert.rejects(adapter.parseWebhook(CREDS, { body }))
  })

  it('rejects a callback missing HASHPARAMS/HASH entirely', async () => {
    const adapter = createDenizbankAdapter()
    await assert.rejects(adapter.parseWebhook(CREDS, { body: { OrderId: 'ref-4', TxnStat: 'Y' } }))
  })
})

describe('accounting/banks/denizbank — queryStatus is an honest error, not a fabricated response', () => {
  it('throws a clear, actionable error (no confirmed out-of-band query response shape)', async () => {
    const adapter = createDenizbankAdapter()
    await assert.rejects(adapter.queryStatus(CREDS, 'order-1'))
  })
})

describe('accounting/banks/index registry — denizbank is now real', () => {
  it('registers denizbank as real', () => {
    const adapter = getBankAdapter('denizbank')
    assert.equal(adapter.isReal, true)
    assert.equal(adapter.bankKey, 'denizbank')
  })

  it('denizbank is counted among the real adapters', () => {
    const real = listBankAdapters().filter((a) => a.isReal).map((a) => a.bankKey)
    assert.ok(real.includes('denizbank'))
  })
})
