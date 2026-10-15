import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'crypto'
import {
  createYapiKrediPosnetAdapter,
  buildPosnetFirstHash,
  buildPosnetMac,
  buildPosnetOosRequestXml,
  TEST_XML_URL,
  TEST_3DS_URL,
  LIVE_3DS_URL,
} from './yapikredi_posnet'
import { getBankAdapter, listBankAdapters } from './index'
import type { BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'yapi_kredi',
  environment: 'test',
  fields: {
    merchantId: '6700000000',
    terminalId: '67000001',
    posnetId: '1000000000000000',
    encKey: 'test-enc-key-123',
  },
}

const INPUT: PaySessionInput = {
  invoiceId: 'inv-1',
  amountKurus: 12345,
  currency: 'TRY',
  returnUrl: 'https://notya.io/return',
  webhookUrl: 'https://notya.io/api/accounting/payments/webhook/yapi_kredi',
}

describe('accounting/banks/yapikredi_posnet — MAC construction (single-source OSS cross-reference, disclosed)', () => {
  it('firstHash = base64(SHA256(encKey + ";" + terminalId))', () => {
    const firstHash = buildPosnetFirstHash('test-enc-key-123', '67000001')
    const expected = createHash('sha256').update('test-enc-key-123;67000001', 'utf8').digest('base64')
    assert.equal(firstHash, expected)
  })

  it('mac = base64(SHA256(xid+";"+amount+";"+currency+";"+mid+";"+firstHash))', () => {
    const firstHash = buildPosnetFirstHash('test-enc-key-123', '67000001')
    const mac = buildPosnetMac({ xid: 'XID1', amountKurus: 12345, currency: 'TL', merchantId: '6700000000', firstHash })
    const expected = createHash('sha256').update(`XID1;12345;TL;6700000000;${firstHash}`, 'utf8').digest('base64')
    assert.equal(mac, expected)
  })
})

describe('accounting/banks/yapikredi_posnet — OOS request XML (no card data, ever)', () => {
  it('builds xmldata with mid/tid/posnetID/amount/mac and no PAN/CVV field', () => {
    const xml = buildPosnetOosRequestXml(CREDS.fields, INPUT, 'XID-1')
    const lower = xml.toLowerCase()
    for (const forbidden of ['cardnumber', 'cvv', 'ccno', 'expdate']) {
      assert.ok(!lower.includes(forbidden), `OOS request must never contain "${forbidden}"`)
    }
    assert.ok(xml.includes('<mid>6700000000</mid>'))
    assert.ok(xml.includes('<tid>67000001</tid>'))
    assert.ok(xml.includes('<posnetID>1000000000000000</posnetID>'))
    assert.ok(xml.includes('<amount>12345</amount>'))
    assert.ok(xml.includes('<currencyCode>TL</currencyCode>'))
    assert.ok(xml.includes('<mac>'))
    // encKey itself must never appear in the outbound XML, only inside the MAC digest.
    assert.ok(!xml.includes('test-enc-key-123'))
  })

  it('throws when a required merchant field is missing, instead of silently omitting it', () => {
    assert.throws(() => buildPosnetOosRequestXml({ merchantId: 'x' }, INPUT, 'XID-1'))
  })
})

describe('accounting/banks/yapikredi_posnet — createHosted3dsSession (POST-redirect, no network call)', () => {
  it('returns a POST-redirect HostedSession with a single xmldata field, pointed at the test 3DS endpoint', async () => {
    const adapter = createYapiKrediPosnetAdapter()
    const session = await adapter.createHosted3dsSession(CREDS, INPUT)
    assert.equal(session.bankKey, 'yapi_kredi')
    assert.equal(session.redirectUrl, TEST_3DS_URL)
    assert.equal(session.redirectMethod, 'POST')
    assert.ok(session.redirectFormFields?.xmldata)
    assert.equal(Object.keys(session.redirectFormFields || {}).length, 1)
  })

  it('uses the live 3DS endpoint when environment is live', async () => {
    const adapter = createYapiKrediPosnetAdapter()
    const session = await adapter.createHosted3dsSession({ ...CREDS, environment: 'live' }, INPUT)
    assert.equal(session.redirectUrl, LIVE_3DS_URL)
  })
})

describe('accounting/banks/yapikredi_posnet — callback verification (Sign over BankPacket/MerchantPacket)', () => {
  function signedCallback(xid: string, amountKurus: number, merchantPacket: string, bankPacket: string) {
    const firstHash = buildPosnetFirstHash(CREDS.fields.encKey, CREDS.fields.terminalId)
    const sign = createHash('sha256')
      .update(`${bankPacket};${merchantPacket};${xid};${amountKurus};TL;${CREDS.fields.merchantId};${firstHash}`, 'utf8')
      .digest('base64')
    return { xid, amount: String(amountKurus), BankPacket: bankPacket, MerchantPacket: merchantPacket, Sign: sign }
  }

  it('maps a decodable approved=1 MerchantPacket to captured, once Sign verifies', async () => {
    const adapter = createYapiKrediPosnetAdapter()
    const merchantPacket = Buffer.from('approved=1;something', 'utf8').toString('base64')
    const body = signedCallback('XID-1', 12345, merchantPacket, 'bank-packet-opaque')
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.status, 'captured')
    assert.equal(event.amountKurus, 12345)
  })

  it('maps an undecodable/unrecognized packet to pending, never a guessed captured', async () => {
    const adapter = createYapiKrediPosnetAdapter()
    const merchantPacket = Buffer.from('nothing-recognizable-here', 'utf8').toString('base64')
    const body = signedCallback('XID-2', 5000, merchantPacket, 'bank-packet-opaque')
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.status, 'pending')
  })

  it('rejects a callback with a bad Sign before looking at the packets at all', async () => {
    const adapter = createYapiKrediPosnetAdapter()
    const body = { xid: 'XID-3', amount: '1000', BankPacket: 'bp', MerchantPacket: 'mp', Sign: 'not-the-real-sign' }
    await assert.rejects(adapter.parseWebhook(CREDS, { body }))
  })
})

describe('accounting/banks/yapikredi_posnet — queryStatus is an honest error, not a fabricated response', () => {
  it('throws a clear, actionable error (no confirmed out-of-band query shape)', async () => {
    const adapter = createYapiKrediPosnetAdapter()
    await assert.rejects(adapter.queryStatus(CREDS, 'XID-1'))
  })
})

describe('accounting/banks/index registry — yapi_kredi is now real', () => {
  it('registers yapi_kredi as real', () => {
    const adapter = getBankAdapter('yapi_kredi')
    assert.equal(adapter.isReal, true)
    assert.equal(adapter.bankKey, 'yapi_kredi')
  })

  it('does not affect the remaining stubbed banks (vakifbank, denizbank, kuveyt_turk)', () => {
    for (const key of ['vakifbank', 'denizbank', 'kuveyt_turk'] as const) {
      assert.equal(getBankAdapter(key).isReal, false)
    }
  })

  it('listBankAdapters reports 9 real adapters total', () => {
    assert.equal(listBankAdapters().filter((a) => a.isReal).length, 9)
  })
})
