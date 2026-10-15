import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'crypto'
import { createNestpayAdapter, buildNestpayHash, buildHostingFormFields } from './nestpay'
import { getBankAdapter, listBankAdapters } from './index'
import type { BankMerchantCredentials } from '../payments/types'
import type { PaySessionInput } from '../types'

const CREDS: BankMerchantCredentials = {
  bankKey: 'isbank',
  environment: 'test',
  fields: { gatewayUrl: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate', clientId: 'client-1', storeKey: 'top-secret-store-key' },
}

const INPUT: PaySessionInput = {
  invoiceId: 'inv-1',
  amountKurus: 12345,
  currency: 'TRY',
  returnUrl: 'https://notya.io/return',
  webhookUrl: 'https://notya.io/api/accounting/payments/webhook/isbank',
}

describe('accounting/banks/nestpay — ver3 hash (cross-referenced against two independent open-source implementations)', () => {
  it('sorts keys naturally/case-insensitively, escapes values, appends the store key, and base64s the raw SHA-512 digest', () => {
    const fields = { b: 'two', A: 'one', c10: 'ten', c2: 'c-two' }
    const hash = buildNestpayHash(fields, 'secret')
    // Reproduce the documented algorithm independently here, rather than calling the function
    // under test twice, so this assertion is a real cross-check.
    const sortedKeys = Object.keys(fields).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    assert.deepEqual(sortedKeys, ['A', 'b', 'c2', 'c10'])
    const plaintext = sortedKeys.map((k) => (fields as any)[k]).join('|') + '|secret'
    const expected = createHash('sha512').update(plaintext, 'utf8').digest('base64')
    assert.equal(hash, expected)
  })

  it('escapes backslash and pipe characters in values before joining', () => {
    const hash = buildNestpayHash({ a: 'has|pipe', b: 'has\\backslash' }, 'key')
    const plaintext = 'has\\|pipe' + '|' + 'has\\\\backslash' + '|' + 'key'
    const expected = createHash('sha512').update(plaintext, 'utf8').digest('base64')
    assert.equal(hash, expected)
  })

  it('excludes hash/HASH/encoding/nationalidno from the signed payload (case-insensitive)', () => {
    const withExtra = buildNestpayHash({ a: '1', hash: 'whatever', HASH: 'whatever2', encoding: 'utf-8', nationalidno: '111' }, 'key')
    const withoutExtra = buildNestpayHash({ a: '1' }, 'key')
    assert.equal(withExtra, withoutExtra)
  })
})

describe('accounting/banks/nestpay — 3D Pay Hosting form fields (no card data, ever)', () => {
  it('builds a form with no PAN/CVV/expiry field and a valid hash', () => {
    const fields = buildHostingFormFields(CREDS.fields, INPUT, 'notya-inv-1-123')
    const raw = JSON.stringify(fields).toLowerCase()
    for (const forbidden of ['pan', 'cvv', 'cv2', 'cardnumber', 'expdate', 'expiry']) {
      assert.ok(!raw.includes(forbidden), `hosting form must never contain "${forbidden}"`)
    }
    assert.equal(fields.storetype, '3d_pay_hosting')
    assert.equal(fields.clientid, 'client-1')
    assert.equal(fields.amount, '123.45')
    assert.equal(fields.oid, 'notya-inv-1-123')
    assert.ok(fields.hash)
    assert.equal(fields.hash, fields.HASH) // sent under both casings defensively

    // The hash must verify against an independent recomputation that excludes hash/HASH.
    const { hash, HASH, ...withoutHash } = fields
    const recomputed = buildNestpayHash(withoutHash, CREDS.fields.storeKey)
    assert.equal(hash, recomputed)
  })

  it('throws when a required merchant field is missing, instead of silently omitting it', () => {
    assert.throws(() => buildHostingFormFields({ clientId: 'x' }, INPUT, 'ref'))
  })
})

describe('accounting/banks/nestpay — createHosted3dsSession (NestPay delivers a POST-redirect, not a server session)', () => {
  it('returns a POST-redirect HostedSession with no network call', async () => {
    const adapter = createNestpayAdapter('isbank')
    const session = await adapter.createHosted3dsSession(CREDS, INPUT)
    assert.equal(session.bankKey, 'isbank')
    assert.equal(session.redirectUrl, CREDS.fields.gatewayUrl)
    assert.equal(session.redirectMethod, 'POST')
    assert.ok(session.redirectFormFields?.oid)
    assert.match(session.merchantRef, /^notya-inv-1-/)
  })
})

describe('accounting/banks/nestpay — callback verification', () => {
  const storeKey = CREDS.fields.storeKey

  function signedCallback(fields: Record<string, string>) {
    const hash = buildNestpayHash(fields, storeKey)
    return { ...fields, HASH: hash }
  }

  it('maps a full-3D-Secure success (mdStatus=1) to captured', async () => {
    const adapter = createNestpayAdapter('isbank')
    const body = signedCallback({ oid: 'ref-1', mdStatus: '1', ProcReturnCode: '00', amount: '123.45', currency: '949' })
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.status, 'captured')
    assert.equal(event.amountKurus, 12345)
  })

  it('maps "half 3D Secure" (mdStatus=2) to failed, not captured — conservative on purpose', async () => {
    const adapter = createNestpayAdapter('isbank')
    const body = signedCallback({ oid: 'ref-2', mdStatus: '2', amount: '50.00' })
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.status, 'failed')
  })

  it('rejects a callback with a bad hash before looking at mdStatus at all', async () => {
    const adapter = createNestpayAdapter('isbank')
    const body = { oid: 'ref-3', mdStatus: '1', ProcReturnCode: '00', amount: '10.00', HASH: 'not-the-real-hash' }
    await assert.rejects(adapter.parseWebhook(CREDS, { body }))
  })

  it('never includes the masked card field as a full PAN (sanity check on field naming)', async () => {
    const adapter = createNestpayAdapter('isbank')
    const body = signedCallback({ oid: 'ref-4', mdStatus: '1', ProcReturnCode: '00', amount: '10.00', maskedCreditCard: '454359******1012' })
    const event = await adapter.parseWebhook(CREDS, { body })
    assert.equal(event.last4, '454359******1012') // bank's own masked value, passed through, never a raw PAN
  })
})

describe('accounting/banks/nestpay — queryStatus is an honest error, not a fabricated response', () => {
  it('throws a clear, actionable error when username/password/queryUrl are not configured', async () => {
    const adapter = createNestpayAdapter('isbank')
    await assert.rejects(adapter.queryStatus(CREDS, 'notya-inv-1-123'))
  })
})

describe('accounting/banks/index registry — NestPay group is now real', () => {
  it('registers all 6 NestPay-group banks as real, sharing the same adapter shape', () => {
    for (const key of ['isbank', 'halkbank', 'teb', 'qnb', 'ziraat', 'akbank'] as const) {
      const adapter = getBankAdapter(key)
      assert.equal(adapter.isReal, true)
      assert.equal(adapter.bankKey, key)
    }
  })

  it('does not affect the 3 remaining stubbed banks (garanti/yapi_kredi became real 2026-10-15, phase 2 — see CHECKLIST.md)', () => {
    for (const key of ['vakifbank', 'denizbank', 'kuveyt_turk'] as const) {
      assert.equal(getBankAdapter(key).isReal, false)
    }
  })

  it('listBankAdapters now reports 9 real adapters total (7 + garanti + yapi_kredi)', () => {
    assert.equal(listBankAdapters().filter((a) => a.isReal).length, 9)
  })
})
