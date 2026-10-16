import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeTaxLine, summarizeWithholdingForPatientInvoice } from './compliance'
import { listCountryBillingKits, getCountryBillingKit } from './registry'
import { US_BILLING_KIT } from './countries/us'
import { GB_BILLING_KIT } from './countries/gb'
import { CA_BILLING_KIT } from './countries/ca'
import { AU_BILLING_KIT } from './countries/au'
import { NZ_BILLING_KIT } from './countries/nz'
import { UZ_BILLING_KIT } from './countries/uz'

test('all 6 kits are registered and self-consistent', () => {
  const kits = listCountryBillingKits()
  assert.equal(kits.length, 6)
  for (const kit of kits) {
    assert.equal(kit, getCountryBillingKit(kit.countryCode))
    if (kit.docFlow === 'portal_prepare_pastback' || kit.resolveDocFlow(true) === 'portal_prepare_pastback') {
      assert.ok(kit.portal, `${kit.countryCode} resolves to a portal flow but has no portal config`)
    }
  }
})

test('US/GB/CA/AU: ordinary consultation is tax-exempt by default', () => {
  for (const kit of [US_BILLING_KIT, GB_BILLING_KIT, CA_BILLING_KIT, AU_BILLING_KIT]) {
    const result = computeTaxLine({ kit, subtotalMinorUnits: 10000 })
    assert.equal(result.exempt, true, kit.countryCode)
    assert.equal(result.taxMinorUnits, 0, kit.countryCode)
    assert.equal(result.totalMinorUnits, 10000, kit.countryCode)
  }
})

test('GB: a non-medical (cosmetic) line is standard-rated at 20%', () => {
  const result = computeTaxLine({ kit: GB_BILLING_KIT, subtotalMinorUnits: 10000, isMedicalService: false })
  assert.equal(result.exempt, false)
  assert.equal(result.rateBp, 2000)
  assert.equal(result.taxMinorUnits, 2000) // 20% of 10000
  assert.equal(result.totalMinorUnits, 12000)
})

test('AU: GST-free medical consultation, 10% on a non-exempt line', () => {
  const medical = computeTaxLine({ kit: AU_BILLING_KIT, subtotalMinorUnits: 20000 })
  assert.equal(medical.taxMinorUnits, 0)
  const cosmetic = computeTaxLine({ kit: AU_BILLING_KIT, subtotalMinorUnits: 20000, isMedicalService: false })
  assert.equal(cosmetic.taxMinorUnits, 2000)
})

test('NZ: unlike the other 4 English-speaking markets, GST applies to an ordinary consultation', () => {
  const result = computeTaxLine({ kit: NZ_BILLING_KIT, subtotalMinorUnits: 10000 })
  assert.equal(result.exempt, false)
  assert.equal(result.rateBp, 1500)
  assert.equal(result.taxMinorUnits, 1500) // 15% of 10000
  assert.equal(result.totalMinorUnits, 11500)
})

test('UZ: standard 12% VAT applies by default (no confirmed medical exemption)', () => {
  const result = computeTaxLine({ kit: UZ_BILLING_KIT, subtotalMinorUnits: 100000 })
  assert.equal(result.exempt, false)
  assert.equal(result.rateBp, 1200)
  assert.equal(result.taxMinorUnits, 12000)
})

test('UZ: resolveDocFlow is registration-tier-gated, every other kit is fixed', () => {
  assert.equal(UZ_BILLING_KIT.resolveDocFlow(false), 'simple_invoice')
  assert.equal(UZ_BILLING_KIT.resolveDocFlow(true), 'portal_prepare_pastback')
  for (const kit of [US_BILLING_KIT, GB_BILLING_KIT, CA_BILLING_KIT, AU_BILLING_KIT, NZ_BILLING_KIT]) {
    assert.equal(kit.resolveDocFlow(true), 'simple_invoice')
    assert.equal(kit.resolveDocFlow(false), 'simple_invoice')
  }
})

test('withholding: never applicable to a direct patient invoice, in any of the 6 countries', () => {
  for (const kit of listCountryBillingKits()) {
    const summary = summarizeWithholdingForPatientInvoice(kit)
    assert.equal(summary.applicable, false, kit.countryCode)
  }
})

test('withholding: an unconfirmed rate is never surfaced as a number (AU no-ABN, UZ domestic WHT)', () => {
  assert.equal(AU_BILLING_KIT.withholding.confirmed, false)
  assert.equal(summarizeWithholdingForPatientInvoice(AU_BILLING_KIT).rateBp, null)
  assert.equal(UZ_BILLING_KIT.withholding.confirmed, false)
  assert.equal(summarizeWithholdingForPatientInvoice(UZ_BILLING_KIT).rateBp, null)
})

test('computeTaxLine rejects a non-integer subtotal (no floats, same rule as ledger/money.ts)', () => {
  assert.throws(() => computeTaxLine({ kit: US_BILLING_KIT, subtotalMinorUnits: 100.5 }), TypeError)
})
