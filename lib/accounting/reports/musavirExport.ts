/**
 * NOTYA-ACCOUNTING-01 — "Mali Müşavire Gönder" Excel export (docs/ARCH-NOTYA-ACCOUNTING.md §2.9).
 *
 * Format basis (researched, not guessed — cited in full in ARCH doc's dated section): Excel
 * (.xlsx), not PDF, is the realistic monthly handoff format for a serbest meslek hekim's mali
 * müşavir — a PDF can't be re-imported or re-totalled by the müşavir's own software (Logo/Luca/
 * Mikro/Paraşüt/kendi Excel şablonu), an .xlsx can. Column content follows what a serbest meslek
 * erbabının (hekim) mali müşaviri needs monthly per the TÜRMOB "Serbest Meslek Kazancı Rehberi"
 * and the serbest meslek erbabı KDV guidance both cite: a gelir-gider icmali, the kesilen e-SMM/
 * e-Fatura/e-Arşiv döküm (tarih, belge no, matrah/KDV ayrımı), a tahsilat özeti by channel/method
 * (for reconciling against banka ekstresi), and the KDV matrahı + hesaplanan KDV toplamı a serbest
 * meslek erbabı needs for the **monthly** KDV1 beyannamesi.
 *
 * Uses the `xlsx` (SheetJS) package already a dependency of this repo (see lib/ingestion/
 * pipeline.ts, lib/gelenBelgeler/donustur.ts) — no new dependency added.
 *
 * Numeric cells are left as plain numbers (TRY, two-decimal), NOT strings with "₺" glued on —
 * gluing a currency symbol into the cell would break SUM()/import into Logo/Luca/Mikro/Excel
 * pivot tables, which is the opposite of what a müşavir handoff is for. Turkish-formatted "₺"
 * display strings (formatTRY) are for the on-screen Raporlar tab only, never for this export.
 */
import * as XLSX from 'xlsx'
import type { MonthlyMusavirReport } from './monthly'

export const AY_ADLARI = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

const DOC_TYPE_LABELS: Record<string, string> = {
  esmm: 'e-SMM',
  efatura: 'e-Fatura',
  earsiv: 'e-Arşiv',
}

function toTRY(kurus: number): number {
  return Math.round(kurus) / 100
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Builds the workbook buffer. Pure (no I/O) — the API route is the only place that writes it out.
 *
 * `periodLabelOverride` (NOTYA-ACCOUNTING-DAILY-01, 2026-10-15): lets the daily-export route reuse
 * this exact function/layout for a single-day report — the only thing that differs between a
 * monthly and a daily export is the human-readable period string ("Ekim 2026" vs "15 Ekim 2026"),
 * everything else (sheet layout, column order, TRY-not-string numeric cells) is identical and
 * shared, per Kaan's own "low-effort to reuse" instruction. Any report shaped like
 * `MonthlyMusavirReport` (daily's report has the same fields, just a different `period` shape)
 * works here unchanged when a label is supplied.
 */
export function buildMusavirExportWorkbook(
  report: MonthlyMusavirReport,
  doctorLabel?: string,
  periodLabelOverride?: string,
  reportKindLabel: 'Aylık' | 'Günlük' = 'Aylık'
): Buffer {
  const { period, gelirGiderIcmali, kesilenBelgeler, kdvOzeti, tahsilatOzeti, stopajNotu } = report
  const donemEtiketi = periodLabelOverride || `${AY_ADLARI[period.month - 1]} ${period.year}`

  const wb = XLSX.utils.book_new()

  // 1) Gelir-Gider Özeti
  const ozetRows: (string | number)[][] = [
    [`Mali Müşavire ${reportKindLabel} Rapor`],
    ['Dönem', donemEtiketi],
    ...(doctorLabel ? [['Hekim/Klinik', doctorLabel]] : []),
    [],
    ['Kalem', 'Tutar (TRY)'],
    ['Toplam Gelir (kesilen belgeler, KDV dahil)', toTRY(gelirGiderIcmali.toplamGelirKurus)],
    ['Toplam Tahsilat (gerçekten alınan)', toTRY(gelirGiderIcmali.toplamTahsilatKurus)],
    ['Açık Bakiye (kesilen - tahsil edilen)', toTRY(gelirGiderIcmali.acikBakiyeKurus)],
    ['Kesilen Belge Sayısı', gelirGiderIcmali.faturaSayisi],
    [],
    ['KDV Matrahı', toTRY(kdvOzeti.matrahKurus)],
    ['Hesaplanan KDV', toTRY(kdvOzeti.kdvKurus)],
    ['KDV Dahil Toplam', toTRY(kdvOzeti.totalKurus)],
    [],
    ['Stopaj/Tevkifat Notu', stopajNotu],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ozetRows), 'Gelir-Gider Özeti')

  // 2) Kesilen Belgeler (e-SMM/e-Fatura/e-Arşiv dökümü)
  const belgeHeader = ['Tarih', 'Belge No', 'Belge Türü', 'Matrah (TRY)', 'KDV (TRY)', 'Toplam (TRY)']
  const belgeRows = kesilenBelgeler.map((b) => [
    dateOnly(b.issuedAt),
    b.docNumber || '',
    DOC_TYPE_LABELS[b.docType] || b.docType,
    toTRY(b.matrahKurus),
    toTRY(b.kdvKurus),
    toTRY(b.totalKurus),
  ])
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([belgeHeader, ...belgeRows]), 'Kesilen Belgeler')

  // 3) Tahsilat Özeti (banka/POS/iyzico bazında, yöntem)
  const METHOD_LABELS: Record<string, string> = { card_3ds: 'Kredi/Banka Kartı (3D)', nakit: 'Nakit', havale_eft: 'Havale/EFT' }
  const tahsilatHeader = ['Tahsilat Kanalı', 'Yöntem', 'Tahsil Edilen Tutar (TRY)', 'İşlem Sayısı']
  const tahsilatRows = tahsilatOzeti.map((t) => [
    t.channelKey === 'diger' ? 'Diğer' : t.channelKey,
    METHOD_LABELS[t.method] || t.method,
    toTRY(t.capturedKurus),
    t.paymentCount,
  ])
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([tahsilatHeader, ...tahsilatRows]), 'Tahsilat Özeti')

  // 4) KDV Özeti (ayrı sayfa — KDV1 beyannamesi hazırlığı için tek bakışta)
  const kdvRows: (string | number)[][] = [
    ['Dönem', donemEtiketi],
    [],
    ['KDV Matrahı (TRY)', toTRY(kdvOzeti.matrahKurus)],
    ['Hesaplanan KDV (TRY)', toTRY(kdvOzeti.kdvKurus)],
    ['KDV Dahil Toplam (TRY)', toTRY(kdvOzeti.totalKurus)],
    ['Fatura Sayısı', kdvOzeti.invoiceCount],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kdvRows), 'KDV Özeti')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export function musavirExportFilename(period: { year: number; month: number }): string {
  const mm = String(period.month).padStart(2, '0')
  return `musavir-raporu-${period.year}-${mm}.xlsx`
}

/** NOTYA-ACCOUNTING-DAILY-01 — daily-report filename counterpart. */
export function dailyMusavirExportFilename(period: { year: number; month: number; day: number }): string {
  const mm = String(period.month).padStart(2, '0')
  const dd = String(period.day).padStart(2, '0')
  return `musavir-raporu-${period.year}-${mm}-${dd}.xlsx`
}
