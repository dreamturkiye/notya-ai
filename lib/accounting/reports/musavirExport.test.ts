import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { buildMusavirExportWorkbook, musavirExportFilename } from './musavirExport'
import { monthBoundsIso, aggregateMonthlyMusavirReport, type RawMonthlyInvoiceRow, type RawMonthlyPaymentRow } from './monthly'

function sampleReport() {
  const period = { year: 2026, month: 10 }
  const bounds = monthBoundsIso(period)
  const invoices: RawMonthlyInvoiceRow[] = [
    {
      id: 'inv-1',
      status: 'issued',
      docType: 'esmm',
      docNumber: 'ESM-2026-000123',
      issuedAt: '2026-10-05T10:00:00.000Z',
      subtotalKurus: 100000,
      kdvKurus: 10000,
      totalKurus: 110000,
    },
  ]
  const payments: RawMonthlyPaymentRow[] = [
    { status: 'captured', method: 'card_3ds', bankKey: 'garanti', facilitatorKey: null, amountKurus: 110000, createdAt: '2026-10-05T10:05:00.000Z' },
  ]
  return aggregateMonthlyMusavirReport(period, bounds, invoices, payments)
}

describe('accounting/reports/musavirExport', () => {
  it('builds a readable .xlsx buffer with the expected sheets', () => {
    const buf = buildMusavirExportWorkbook(sampleReport(), 'Dr. Test')
    assert.ok(Buffer.isBuffer(buf))
    assert.ok(buf.length > 0)

    const wb = XLSX.read(buf, { type: 'buffer' })
    assert.deepEqual(wb.SheetNames, ['Gelir-Gider Özeti', 'Kesilen Belgeler', 'Tahsilat Özeti', 'KDV Özeti'])
  })

  it('writes numeric (not string-with-₺) amount cells, so the file is re-importable/summable', () => {
    const buf = buildMusavirExportWorkbook(sampleReport())
    const wb = XLSX.read(buf, { type: 'buffer' })
    const belgeler = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['Kesilen Belgeler'], { header: 1 })
    const [header, row] = belgeler
    assert.deepEqual(header, ['Tarih', 'Belge No', 'Belge Türü', 'Matrah (TRY)', 'KDV (TRY)', 'Toplam (TRY)'])
    assert.equal(row[0], '2026-10-05')
    assert.equal(row[1], 'ESM-2026-000123')
    assert.equal(row[2], 'e-SMM')
    assert.equal(typeof row[3], 'number')
    assert.equal(row[3], 1000) // 100000 kuruş -> 1000.00 TRY
    assert.equal(row[4], 100) // KDV
    assert.equal(row[5], 1100) // total
  })

  it('tahsilat özeti sheet reconciles to the same total as the summary sheet', () => {
    const report = sampleReport()
    const buf = buildMusavirExportWorkbook(report)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const tahsilat = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['Tahsilat Özeti'], { header: 1 })
    const dataRows = tahsilat.slice(1)
    const sum = dataRows.reduce((s: number, r: any[]) => s + Number(r[2]), 0)
    assert.equal(Math.round(sum * 100), report.gelirGiderIcmali.toplamTahsilatKurus)
  })

  it('names the export file with the ay/yıl, zero-padded month', () => {
    assert.equal(musavirExportFilename({ year: 2026, month: 3 }), 'musavir-raporu-2026-03.xlsx')
    assert.equal(musavirExportFilename({ year: 2026, month: 11 }), 'musavir-raporu-2026-11.xlsx')
  })
})
