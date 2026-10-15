import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'crypto'
import {
  createVakifBankAdapter,
  buildVakifCpHash,
  extractXmlTags,
  type PayFlexTransport,
} from './vakifbank'
import { getBankAdapter, listBankAdapters } from './index'
import type { BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'vakifbank',
  environment: 'test',
  fields: { merchantId: '000000000000090', merchantPassword: 'Vakif123', terminalId: 'VP000000' },
}

const INPUT: PaySessionInput = {
  invoiceId: 'inv-1',
  amountKurus: 12345,
  currency: 'TRY',
  returnUrl: 'https://notya.io/return',
  webhookUrl: 'https://notya.io/api/accounting/payments/webhook/vakifbank',
}

function fakeTransport(responses: { registerXml?: string; statusXml?: string; calls?: { url: string; fields: Record<string, string> }[] }): PayFlexTransport {
  return {
    async postForm(url, fields) {
      responses.calls?.push({ url, fields })
      if (url.includes('RegisterTransaction')) {
        return { status: 200, xml: responses.registerXml || '' }
      }
      return { status: 200, xml: responses.statusXml || '' }
    },
  }
}

describe('accounting/banks/vakifbank — PayFlex CP hash (per PayFlexCPV4PosCrypt::createHash, carried over including its own disclosed "todo")', () => {
  it('matches SHA1(HostMerchantId+AmountCode+Amount+MerchantPassword+""+"VBank3DPay2014"), base64', () => {
    const hash = buildVakifCpHash('000000000000090', '949', '123.45', 'Vakif123')
    const plaintext = '000000000000090' + '949' + '123.45' + 'Vakif123' + '' + 'VBank3DPay2014'
    const expected = createHash('sha1').update(plaintext, 'utf8').digest('base64')
    assert.equal(hash, expected)
  })
})

describe('accounting/banks/vakifbank — extractXmlTags (minimal flat-XML leaf extractor)', () => {
  it('pulls flat leaf-tag values and leaves missing ones undefined', () => {
    const xml = '<Response><CommonPaymentUrl>https://cptest.vakifbank.com.tr/Hosting</CommonPaymentUrl><PaymentToken>abc123</PaymentToken></Response>'
    const parsed = extractXmlTags(xml, ['CommonPaymentUrl', 'PaymentToken', 'ErrorCode'])
    assert.equal(parsed.CommonPaymentUrl, 'https://cptest.vakifbank.com.tr/Hosting')
    assert.equal(parsed.PaymentToken, 'abc123')
    assert.equal(parsed.ErrorCode, undefined)
  })
})

describe('accounting/banks/vakifbank — createHosted3dsSession (server-to-server register, then GET redirect — no card data, ever)', () => {
  it('registers with no PAN/CVV field and returns a GET redirect with the PaymentToken', async () => {
    const calls: { url: string; fields: Record<string, string> }[] = []
    const transport = fakeTransport({
      registerXml: '<Response><CommonPaymentUrl>https://cptest.vakifbank.com.tr/CommonPayment/Hosting</CommonPaymentUrl><PaymentToken>tok-123</PaymentToken></Response>',
      calls,
    })
    const adapter = createVakifBankAdapter(transport)
    const session = await adapter.createHosted3dsSession(CREDS, INPUT)

    assert.equal(calls.length, 1)
    assert.ok(calls[0].url.endsWith('/RegisterTransaction'))
    const raw = JSON.stringify(calls[0].fields).toLowerCase()
    for (const forbidden of ['pan', 'cvv', 'expiremonth', 'expireyear', 'cardholdersname', 'brandnumber']) {
      assert.ok(!raw.includes(forbidden), `RegisterTransaction must never contain "${forbidden}"`)
    }
    assert.equal(calls[0].fields.TransactionType, 'Sale')
    assert.equal(calls[0].fields.Amount, '123.45')
    assert.ok(calls[0].fields.SuccessUrl.includes('merchantRef='))

    assert.equal(session.bankKey, 'vakifbank')
    assert.ok(session.redirectUrl.startsWith('https://cptest.vakifbank.com.tr/CommonPayment/Hosting?Ptkn=tok-123'))
    assert.equal(session.redirectMethod, undefined) // classic GET navigation, not a POSTed form
  })

  it('throws a clear error (not a fabricated session) when RegisterTransaction returns ErrorCode 5029', async () => {
    const transport = fakeTransport({
      registerXml: '<Response><ErrorCode>5029</ErrorCode><ResponseMessage>Geçersiz İstek</ResponseMessage></Response>',
    })
    const adapter = createVakifBankAdapter(transport)
    await assert.rejects(adapter.createHosted3dsSession(CREDS, INPUT), /5029/)
  })
})

describe('accounting/banks/vakifbank — parseWebhook (GET-callback TransactionId/PaymentToken, confirmed server-to-server via VposTransaction)', () => {
  it('maps Rc=0000 to captured and uses our own merchantRef, not the bank-echoed OrderID', async () => {
    const calls: { url: string; fields: Record<string, string> }[] = []
    const transport = fakeTransport({
      statusXml: '<Response><Rc>0000</Rc><AuthCode>AUTH1</AuthCode><TransactionId>txn-1</TransactionId><MaskedPan>4111********1111</MaskedPan><Amount>123.45</Amount><AmountCode>949</AmountCode></Response>',
      calls,
    })
    const adapter = createVakifBankAdapter(transport)
    const event = await adapter.parseWebhook(CREDS, { body: { TransactionId: 'txn-1', PaymentToken: 'tok-123', merchantRef: 'order-abc' } })

    assert.ok(calls[0].url.endsWith('/VposTransaction'))
    assert.equal(calls[0].fields.Password, 'Vakif123') // "Password", not "MerchantPassword" — see file header
    assert.equal(event.status, 'captured')
    assert.equal(event.merchantRef, 'order-abc')
    assert.equal(event.amountKurus, 12345)
    assert.equal(event.last4, '4111********1111')
  })

  it('maps Rc=5029 (or any non-0000 code) to failed, never captured', async () => {
    const transport = fakeTransport({
      statusXml: '<Response><Rc>5029</Rc><Message>Geçersiz İstek</Message><TransactionId>txn-2</TransactionId></Response>',
    })
    const adapter = createVakifBankAdapter(transport)
    const event = await adapter.parseWebhook(CREDS, { body: { TransactionId: 'txn-2', PaymentToken: 'tok-456', merchantRef: 'order-def' } })
    assert.equal(event.status, 'failed')
  })

  it('throws when the callback envelope is missing TransactionId/PaymentToken, instead of guessing', async () => {
    const adapter = createVakifBankAdapter(fakeTransport({}))
    await assert.rejects(adapter.parseWebhook(CREDS, { body: { merchantRef: 'order-ghi' } }))
  })
})

describe('accounting/banks/vakifbank — queryStatus is an honest error, not a fabricated response', () => {
  it('throws a clear, actionable error (no confirmed OrderID-keyed query shape)', async () => {
    const adapter = createVakifBankAdapter(fakeTransport({}))
    await assert.rejects(adapter.queryStatus(CREDS, 'order-1'))
  })
})

describe('accounting/banks/index registry — vakifbank is now real', () => {
  it('registers vakifbank as real', () => {
    const adapter = getBankAdapter('vakifbank')
    assert.equal(adapter.isReal, true)
    assert.equal(adapter.bankKey, 'vakifbank')
  })

  it('vakifbank is counted among the real adapters', () => {
    const real = listBankAdapters().filter((a) => a.isReal).map((a) => a.bankKey)
    assert.ok(real.includes('vakifbank'))
  })
})
