import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildGibPortalFields, gibPortalFieldsToClipboardText } from './gibPortal'
import { computeStopaj } from '../stopaj'
import type { EbelgeInvoiceDto } from './types'

function sampleDto(docType: EbelgeInvoiceDto['docType']): EbelgeInvoiceDto {
  return {
    invoiceId: 'inv-1',
    docType,
    seller: { idType: 'tckn', idValue: '11111111111', unvan: 'Dr. Test Doktor', address: 'Adres' },
    buyer: { idType: 'unknown', name: 'Ayşe Hasta' },
    lines: [
      { description: 'Muayene', quantity: 1, unitPriceKurus: 100000, kdvRateBp: 1000, kdvKurus: 10000, lineTotalKurus: 110000 },
    ],
    subtotalKurus: 100000,
    kdvKurus: 10000,
    totalKurus: 110000,
    currency: 'TRY',
    issueDate: '2026-10-16',
  }
}

describe('accounting/ebelge/gibPortal', () => {
  it('builds e-SMM fields with "Uygulanmadı" stopaj for a gerçek kişi buyer (default case)', () => {
    const dto = sampleDto('esmm')
    const stopaj = computeStopaj({ docType: 'esmm', matrahKurus: dto.subtotalKurus, kdvKurus: dto.kdvKurus, totalKurus: dto.totalKurus, buyerIsKurumsal: false })
    const fields = buildGibPortalFields(dto, stopaj)
    const byLabel = new Map(fields.map((f) => [f.label, f.value]))
    assert.equal(byLabel.get('Belge türü'), 'e-Serbest Meslek Makbuzu (e-SMM)')
    assert.equal(byLabel.get('Gelir vergisi stopaj oranı'), 'Uygulanmadı')
    assert.ok(byLabel.has('Net tahsil edilecek tutar'))
    assert.ok(byLabel.has('Alıcı TCKN / VKN')) // buyer idType unknown -> flagged, not fabricated
  })

  it('builds e-SMM fields with a real stopaj line when the buyer is marked kurumsal', () => {
    const dto = sampleDto('esmm')
    const stopaj = computeStopaj({ docType: 'esmm', matrahKurus: dto.subtotalKurus, kdvKurus: dto.kdvKurus, totalKurus: dto.totalKurus, buyerIsKurumsal: true })
    const fields = buildGibPortalFields(dto, stopaj)
    const byLabel = new Map(fields.map((f) => [f.label, f.value]))
    assert.equal(byLabel.get('Gelir vergisi stopaj oranı'), '%20')
  })

  it('builds e-Fatura/e-Arşiv fields with no stopaj line at all, just "Genel toplam"', () => {
    const dto = sampleDto('earsiv')
    const stopaj = computeStopaj({ docType: 'earsiv', matrahKurus: dto.subtotalKurus, kdvKurus: dto.kdvKurus, totalKurus: dto.totalKurus, buyerIsKurumsal: false })
    const fields = buildGibPortalFields(dto, stopaj)
    const labels = fields.map((f) => f.label)
    assert.ok(!labels.includes('Gelir vergisi stopaj oranı'))
    assert.ok(labels.includes('Genel toplam'))
  })

  it('renders fields to clipboard-ready "Label: Value" lines, one per field, in order', () => {
    const dto = sampleDto('esmm')
    const stopaj = computeStopaj({ docType: 'esmm', matrahKurus: dto.subtotalKurus, kdvKurus: dto.kdvKurus, totalKurus: dto.totalKurus, buyerIsKurumsal: false })
    const fields = buildGibPortalFields(dto, stopaj)
    const text = gibPortalFieldsToClipboardText(fields)
    const lines = text.split('\n')
    assert.equal(lines.length, fields.length)
    assert.equal(lines[0], `${fields[0].label}: ${fields[0].value}`)
  })
})
