import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'crypto'
import {
  createGarantiAdapter,
  buildGarantiHashedPassword,
  buildGarantiSecure3dHash,
  buildGarantiOosFormFields,
} from './garanti'
import { getBankAdapter, listBankAdapters } from './index'
import type { BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'garanti',
  environment: 'test',
  fields: {
    merchantId: '7000679',
    terminalId: '30691297',
    provAutUserId: 'PROVAUT',
    provAutPassword: '123qweASD/',
    storeKey: '12345678',
  },
}

const INPUT: PaySessionInput = {
  invoiceId: 'inv-1',
  amountKurus: 12345,
  currency: 'TRY',
  returnUrl: 'https://notya.io/return',
  webhookUrl: 'https://notya.io/api/accounting/payments/webhook/garanti',
}

describe('accounting/banks/garanti — hash construction (per dev.garantibbva.com.tr General Concepts page)', () => {
  it('hashedpassword = UPPER(SHA1(ProvisionPassword + "0" + TerminalID))', () => {
    const hashed = buildGarantiHashedPassword('123qweASD/', '30691297')
    const expected = createHash('sha1')
      .update(Buffer.from('123qweASD/' + '0' + '30691297', 'latin1'))
      .digest('hex')
      .toUpperCase()
    assert.equal(hashed, expected)
  })

  it('secure3dhash = UPPER(SHA512(terminalId+orderId+amount+currency+successUrl+errorUrl+type+installment+storeKey+hashedPassword))', () => {
    const hashedPassword = buildGarantiHashedPassword('123qweASD/', '30691297')
    const hash = buildGarantiSecure3dHash({
      terminalId: '30691297',
      orderId: 'order-1',
      amount: '12345',
      currencyCode: '949',
      successUrl: 'https://notya.io/webhook',
      errorUrl: 'https://notya.io/webhook',
      txnType: 'sales',
      installmentCount: '',
      storeKey: '12345678',
      hashedPassword,
    })
    const plaintext = '30691297' + 'order-1' + '12345' + '949' + 'https://notya.io/webhook' + 'https://notya.io/webhook' + 'sales' + '' + '12345678' + hashedPassword
    const expected = createHash('sha512').update(Buffer.from(plaintext, 'latin1')).digest('hex').toUpperCase()
    assert.equal(hash, expected)
  })
})

describe('accounting/banks/garanti — OOS form fields (no card data, ever)', () => {
  it('builds a form with 3D_OOS_PAY, integer-kuruş amount, and no PAN/CVV field', () => {
    const fields = buildGarantiOosFormFields(CREDS.fields, INPUT, 'order-123', 'test')
    const raw = JSON.stringify(fields).toLowerCase()
    for (const forbidden of ['cardnumber', 'cardcvv2', 'cardexpiredate', 'cardholdername']) {
      assert.ok(!raw.includes(forbidden), `OOS form must never contain "${forbidden}"`)
    }
    assert.equal(fields.secure3dsecuritylevel, '3D_OOS_PAY')
    assert.equal(fields.mode, 'TEST')
    assert.equal(fields.terminalmerchantid, '7000679')
    assert.equal(fields.terminalid, '30691297')
    assert.equal(fields.txnamount, '12345') // kuruş, no decimal conversion
    assert.equal(fields.orderid, 'order-123')
    assert.ok(fields.secure3dhash)
    // storeKey/provisionPassword must never be posted as plain form fields.
    assert.ok(!raw.includes('12345678'))
    assert.ok(!raw.includes('123qweasd'))
  })

  it('uses PROD mode when environment is live', () => {
    const fields = buildGarantiOosFormFields(CREDS.fields, INPUT, 'order-1', 'live')
    assert.equal(fields.mode, 'PROD')
  })

  it('throws when a required merchant field is missing, instead of silently omitting it', () => {
    assert.throws(() => buildGarantiOosFormFields({ merchantId: 'x' }, INPUT, 'order-1', 'test'))
  })
})

describe('accounting/banks/garanti — createHosted3dsSession (POST-redirect, no network call)', () => {
  it('returns a POST-redirect HostedSession pointed at the VPServlet gateway', async () => {
    const adapter = createGarantiAdapter()
    const session = await adapter.createHosted3dsSession(CREDS, INPUT)
    assert.equal(session.bankKey, 'garanti')
    assert.equal(session.redirectUrl, 'https://sanalposprovtest.garantibbva.com.tr/VPServlet')
    assert.equal(session.redirectMethod, 'POST')
    assert.ok(session.redirectFormFields?.orderid)
  })

  it('uses the live VPServlet host when environment is live', async () => {
    const adapter = createGarantiAdapter()
    const session = await adapter.createHosted3dsSession({ ...CREDS, environment: 'live' }, INPUT)
    assert.equal(session.redirectUrl, 'https://sanalposprov.garanti.com.tr/VPServlet')
  })
})

describe('accounting/banks/garanti — callback verification', () => {
  function signedCallback(fields: Record<string, string>) {
    const hashedPassword = buildGarantiHashedPassword(CREDS.fields.provAutPassword, fields.terminalid)
    const secure3dhash = buildGarantiSecure3dHash({
      terminalId: fields.terminalid,
      orderId: fields.oid || fields.orderid || '',
      amount: fields.txnamount || '',
      currencyCode: fields.txncurrencycode || '949',
      successUrl: fields.successurl || '',
      errorUrl: fields.errorurl || '',
      txnType: fields.txntype || 'sales',
      installmentCount: fields.txninstallmentcount || '',
      storeKey: CREDS.fields.storeKey,
      hashedPassword,
    })
    return { ...fields, secure3dhash }
  }

  it('maps mdstatus=1 + procreturncode=00 to captured', async () => {
    const adapter = createGarantiAdapter()
    const body = signedCallback({ oid: 'ref-1', terminalid: '30691297', mdstatus: '1', procreturncode: '00', txnamount: '12345' })
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.status, 'captured')
    assert.equal(event.amountKurus, 12345)
  })

  it('maps mdstatus=2 ("half 3D Secure") to failed, not captured', async () => {
    const adapter = createGarantiAdapter()
    const body = signedCallback({ oid: 'ref-2', terminalid: '30691297', mdstatus: '2', txnamount: '5000' })
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.status, 'failed')
  })

  it('rejects a callback with a bad hash before looking at mdstatus at all', async () => {
    const adapter = createGarantiAdapter()
    const body = { oid: 'ref-3', terminalid: '30691297', mdstatus: '1', procreturncode: '00', txnamount: '1000', secure3dhash: 'not-the-real-hash' }
    await assert.rejects(adapter.parseWebhook(CREDS, { body }))
  })
})

describe('accounting/banks/garanti — queryStatus is an honest error, not a fabricated response', () => {
  it('throws a clear, actionable error (no confirmed out-of-band query shape)', async () => {
    const adapter = createGarantiAdapter()
    await assert.rejects(adapter.queryStatus(CREDS, 'order-1'))
  })
})

describe('accounting/banks/index registry — garanti is now real', () => {
  it('registers garanti as real', () => {
    const adapter = getBankAdapter('garanti')
    assert.equal(adapter.isReal, true)
    assert.equal(adapter.bankKey, 'garanti')
  })

  it('listBankAdapters reports 8 real adapters total (7 NestPay-group/generic + garanti)', () => {
    assert.ok(listBankAdapters().filter((a) => a.isReal).length >= 8)
  })
})
