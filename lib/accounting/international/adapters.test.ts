import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSimpleInvoiceDocument } from './simpleInvoiceAdapter'
import { preparePortalDocument, linkPortalReference } from './portalAdapter'
import { US_BILLING_KIT } from './countries/us'
import { UZ_BILLING_KIT } from './countries/uz'

test('simpleInvoiceAdapter: flags missing required seller fields, never issues incomplete', () => {
  const doc = buildSimpleInvoiceDocument(
    US_BILLING_KIT,
    [{ description: 'Consultation', quantity: 1, unitPriceMinorUnits: 15000 }],
    {} // no EIN/SSN, no practice name/address supplied
  )
  assert.deepEqual(doc.missingSellerFields.sort(), ['EIN (or SSN for a sole proprietor)', 'Practice / legal name', 'Practice address'].sort())
  assert.equal(doc.readyToIssue, false)
})

test('simpleInvoiceAdapter: a fully-filled US consultation is exempt and ready to issue', () => {
  const doc = buildSimpleInvoiceDocument(
    US_BILLING_KIT,
    [{ description: 'Consultation', quantity: 1, unitPriceMinorUnits: 15000 }],
    { ein_or_ssn: '12-3456789', practice_name: 'Dr. Example PC', practice_address: '1 Main St' }
  )
  assert.equal(doc.readyToIssue, true)
  assert.equal(doc.exempt, true)
  assert.equal(doc.taxMinorUnits, 0)
  assert.equal(doc.totalMinorUnits, 15000)
})

test('portalAdapter: throws for a kit with no portal configured (every non-UZ kit)', () => {
  assert.throws(
    () => preparePortalDocument(US_BILLING_KIT, [{ description: 'x', quantity: 1, unitPriceMinorUnits: 100 }], {}),
    /no configured portal/
  )
})

test('portalAdapter (UZ): prepares the e-Faktura data and flags missing STIR before ready', () => {
  const incomplete = preparePortalDocument(UZ_BILLING_KIT, [{ description: 'Muayena', quantity: 1, unitPriceMinorUnits: 500000 }], {})
  assert.equal(incomplete.readyToPrepare, false)
  assert.ok(incomplete.missingSellerFields.includes('STIR (soliq toʼlovchining identifikatsion raqami / tax ID)'))

  const ready = preparePortalDocument(
    UZ_BILLING_KIT,
    [{ description: 'Muayena', quantity: 1, unitPriceMinorUnits: 500000 }],
    { stir: '123456789', practice_name: 'Dr. Example', practice_address: 'Tashkent' }
  )
  assert.equal(ready.readyToPrepare, true)
  assert.equal(ready.portalUrl, 'https://my.soliq.uz')
  assert.equal(ready.taxMinorUnits, 60000) // 12% of 500000
  assert.equal(ready.totalMinorUnits, 560000)
})

test('portalAdapter: linkPortalReference records the doctor-pasted reference, never invents one', () => {
  const linked = linkPortalReference('inv_1', '  UZ-EF-00123  ')
  assert.equal(linked.invoiceId, 'inv_1')
  assert.equal(linked.externalReference, 'UZ-EF-00123')
  assert.throws(() => linkPortalReference('inv_1', '   '), /externalReference is required/)
})
