/**
 * NOTYA-ACCOUNTING-01 — the monthly mali müşavir report (docs/ARCH-NOTYA-ACCOUNTING.md §2.9 / the
 * 2026-10-15 "Raporlar" rebuild). Strictly monthly, by Kaan's own instruction ("Bu raporlar sadece
 * aylık olabilir") — there is deliberately no custom date range, quarter or year option anywhere
 * in this file or the API route that calls it.
 *
 * Shape follows lib/accounting/ar/aging.ts's convention on purpose: a pure aggregation function
 * (`aggregateMonthlyMusavirReport`) that takes already-fetched rows and does the bucketing/math,
 * so it is unit-testable without Supabase, plus a thin DB-querying wrapper
 * (`buildMonthlyMusavirReport`) that fetches those rows scoped to one doctor + one ay/yıl and
 * calls the pure function. Never touches lib/accounting/ar/* (that module's reminder/AR-ledger
 * code is owned by a different, concurrent job this session — see the coordination note in this
 * PR's brief) — this file reads accounting_invoices / accounting_invoice_lines /
 * accounting_payments directly, the same tables lib/accounting/reports/index.ts already reads.
 *
 * Notya is not the official GİB declaration tool (see reports/index.ts's own note) — this report
 * exists so a doctor's practice has its own monthly numbers and can hand them to their mali
 * müşavir; it does not file anything itself.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EbelgeDocType, Money, PaymentMethod } from '../types'
import { addKurus } from '../ledger/money'

export interface MonthlyPeriod {
  year: number
  month: number // 1-12
}

/** [since, until) in UTC ISO — until is the exclusive first instant of the next month. */
export function monthBoundsIso({ year, month }: MonthlyPeriod): { since: string; until: string } {
  if (!Number.isInteger(year) || year < 2000 || year > 3000) throw new RangeError(`invalid year: ${year}`)
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError(`invalid month (1-12): ${month}`)
  const since = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)).toISOString()
  const until = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1, 0, 0, 0, 0)).toISOString()
  return { since, until }
}

// ---------------------------------------------------------------------------
// Raw row shapes (exactly what the DB wrapper selects — kept narrow on purpose)
// ---------------------------------------------------------------------------

export interface RawMonthlyInvoiceRow {
  id: string
  status: string
  docType: EbelgeDocType
  docNumber: string | null
  issuedAt: string | null
  subtotalKurus: Money // matrah
  kdvKurus: Money
  totalKurus: Money
}

export interface RawMonthlyPaymentRow {
  status: string // only 'captured' counts as a real tahsilat
  method: PaymentMethod
  bankKey: string | null
  facilitatorKey: string | null
  amountKurus: Money
  createdAt: string
}

// ---------------------------------------------------------------------------
// Report shape
// ---------------------------------------------------------------------------

export interface MonthlyDocumentRow {
  invoiceId: string
  issuedAt: string
  docType: EbelgeDocType
  docNumber: string | null
  matrahKurus: Money
  kdvKurus: Money
  totalKurus: Money
}

export interface MonthlyCollectionRow {
  /** 'iyzico' / a bank key / 'diger' (nakit, havale — no bank/facilitator key recorded) */
  channelKey: string
  method: PaymentMethod
  capturedKurus: Money
  paymentCount: number
}

export interface MonthlyMusavirReport {
  period: MonthlyPeriod & { since: string; until: string }
  /** Serbest meslek kazanç defteri icmali: kesilen belgelerin toplamı (gelir) vs. gerçekten tahsil edilen. */
  gelirGiderIcmali: {
    toplamGelirKurus: Money // sum of issued/paid invoices' totalKurus in the period (kesilen)
    toplamTahsilatKurus: Money // sum of captured payments in the period (gerçekten alınan)
    acikBakiyeKurus: Money // toplamGelir - toplamTahsilat, floored at 0 for display purposes
    faturaSayisi: number
  }
  kesilenBelgeler: MonthlyDocumentRow[]
  kdvOzeti: { matrahKurus: Money; kdvKurus: Money; totalKurus: Money; invoiceCount: number }
  tahsilatOzeti: MonthlyCollectionRow[]
  /**
   * Stopaj/tevkifat (GVK md. 94): the payer withholds, not the doctor, and only when the payer is
   * a kurumsal/tüzel ödeyici — not a gerçek kişi hasta. Every invoice this module issues today is
   * hekim -> hasta (gerçek kişi), so stopaj never applies in this flow; stated explicitly rather
   * than silently omitted, per docs/ARCH-NOTYA-ACCOUNTING.md's monthly-report research note.
   */
  stopajNotu: string
}

export const STOPAJ_NOTU =
  'Bu dönemde stopaj/tevkifat uygulanmadı: faturalar gerçek kişi hastalara kesildi (GVK md. 94 stopajı, ödeyici kurumsal/tüzel kişi olduğunda devreye girer). Doktor bir kuruma/kliniğe hizmet verip kurumsal ödeme alırsa, o faturalar için stopaj durumu ayrıca değerlendirilmelidir.'

/** Pure aggregation — no Supabase, unit-testable with canned rows. */
export function aggregateMonthlyMusavirReport(
  period: MonthlyPeriod,
  bounds: { since: string; until: string },
  invoices: RawMonthlyInvoiceRow[],
  payments: RawMonthlyPaymentRow[]
): MonthlyMusavirReport {
  // "Kesilen" = actually issued in the period (draft/issue_failed never counted as income).
  const issued = invoices.filter((i) => i.issuedAt !== null && !['draft', 'issue_failed', 'pending_issue'].includes(i.status))

  const kesilenBelgeler: MonthlyDocumentRow[] = issued
    .map((i) => ({
      invoiceId: i.id,
      issuedAt: i.issuedAt as string,
      docType: i.docType,
      docNumber: i.docNumber,
      matrahKurus: i.subtotalKurus,
      kdvKurus: i.kdvKurus,
      totalKurus: i.totalKurus,
    }))
    .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))

  const toplamGelirKurus = addKurus(...issued.map((i) => i.totalKurus))
  const matrahKurus = addKurus(...issued.map((i) => i.subtotalKurus))
  const kdvKurus = addKurus(...issued.map((i) => i.kdvKurus))

  const captured = payments.filter((p) => p.status === 'captured')
  const toplamTahsilatKurus = addKurus(...captured.map((p) => p.amountKurus))

  const byChannel = new Map<string, MonthlyCollectionRow>()
  for (const p of captured) {
    const channelKey = p.bankKey || p.facilitatorKey || 'diger'
    const key = `${channelKey}:${p.method}`
    const entry = byChannel.get(key) || { channelKey, method: p.method, capturedKurus: 0, paymentCount: 0 }
    entry.capturedKurus = addKurus(entry.capturedKurus, p.amountKurus)
    entry.paymentCount += 1
    byChannel.set(key, entry)
  }
  const tahsilatOzeti = Array.from(byChannel.values()).sort((a, b) => b.capturedKurus - a.capturedKurus)

  return {
    period: { ...period, ...bounds },
    gelirGiderIcmali: {
      toplamGelirKurus,
      toplamTahsilatKurus,
      acikBakiyeKurus: Math.max(0, toplamGelirKurus - toplamTahsilatKurus),
      faturaSayisi: issued.length,
    },
    kesilenBelgeler,
    kdvOzeti: { matrahKurus, kdvKurus, totalKurus: addKurus(matrahKurus, kdvKurus), invoiceCount: issued.length },
    tahsilatOzeti,
    stopajNotu: STOPAJ_NOTU,
  }
}

/** DB wrapper: fetch one doctor's one calendar month and aggregate it. */
export async function buildMonthlyMusavirReport(
  supabase: SupabaseClient,
  doctorId: string,
  period: MonthlyPeriod
): Promise<MonthlyMusavirReport> {
  const bounds = monthBoundsIso(period)

  const { data: invoiceRows, error: invErr } = await supabase
    .from('accounting_invoices')
    .select('id, status, doc_type, ebelge_doc_number, issued_at, subtotal_kurus, kdv_kurus, total_kurus')
    .eq('doctor_id', doctorId)
    .gte('issued_at', bounds.since)
    .lt('issued_at', bounds.until)
  if (invErr) throw new Error(`buildMonthlyMusavirReport invoice fetch failed: ${invErr.message}`)

  const { data: paymentRows, error: payErr } = await supabase
    .from('accounting_payments')
    .select('status, method, bank_key, facilitator_key, amount_kurus, created_at')
    .eq('doctor_id', doctorId)
    .gte('created_at', bounds.since)
    .lt('created_at', bounds.until)
  if (payErr) throw new Error(`buildMonthlyMusavirReport payment fetch failed: ${payErr.message}`)

  const invoices: RawMonthlyInvoiceRow[] = (invoiceRows || []).map((r: any) => ({
    id: r.id,
    status: r.status,
    docType: r.doc_type,
    docNumber: r.ebelge_doc_number,
    issuedAt: r.issued_at,
    subtotalKurus: r.subtotal_kurus,
    kdvKurus: r.kdv_kurus,
    totalKurus: r.total_kurus,
  }))
  const payments: RawMonthlyPaymentRow[] = (paymentRows || []).map((r: any) => ({
    status: r.status,
    method: r.method,
    bankKey: r.bank_key,
    facilitatorKey: r.facilitator_key,
    amountKurus: r.amount_kurus,
    createdAt: r.created_at,
  }))

  return aggregateMonthlyMusavirReport(period, bounds, invoices, payments)
}
