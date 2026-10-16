/**
 * NOTYA-ACCOUNTING-DAILY-01 (Kaan, 2026-10-15) — daily equivalent of monthly.ts's
 * `aggregateMonthlyMusavirReport`/`buildMonthlyMusavirReport`, scoped to a single calendar day.
 *
 * Scope reversal, stated plainly: the 2026-10-15 "Raporlar" rebuild shipped monthly-only by
 * Kaan's own explicit instruction that day ("Bu raporlar sadece aylık olabilir") — see
 * docs/OPEN-COMMITMENTS.md and docs/ARCH-NOTYA-ACCOUNTING.md §4.9 for that decision. Later the SAME
 * day, beta doctors asked for a daily view too, and Kaan reversed the scope call. This file is that
 * reversal, not a new design — same metrics (gelir-gider icmali, kesilen belgeler, tahsilat özeti,
 * KDV özeti, stopaj notu), same "pure aggregation function + thin DB wrapper" shape, same tables
 * (accounting_invoices / accounting_invoice_lines / accounting_payments), just bounded to
 * [00:00:00, 24:00:00) of one day instead of one calendar month.
 *
 * Deliberately NOT a generalization of monthly.ts's functions (no shared "aggregate(bounds, ...)"
 * extracted) — monthly.ts's tests/call sites are untouched by this file on purpose, so the already
 * audited monthly path carries zero risk from this addition. The duplication is the raw row
 * mapping + the bucket math (~60 lines), which is small and intentionally mirrors monthly.ts
 * line-for-line so the two never drift in what they count as income/collection.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EbelgeDocType, Money, PaymentMethod } from '../types'
import { addKurus } from '../ledger/money'
import { STOPAJ_NOTU } from './monthly'
import type { MonthlyCollectionRow, MonthlyDocumentRow, RawMonthlyInvoiceRow, RawMonthlyPaymentRow } from './monthly'

export interface DailyPeriod {
  year: number
  month: number // 1-12
  day: number // 1-31
}

/** [since, until) in UTC ISO — until is the exclusive first instant of the next day. */
export function dayBoundsIso({ year, month, day }: DailyPeriod): { since: string; until: string } {
  if (!Number.isInteger(year) || year < 2000 || year > 3000) throw new RangeError(`invalid year: ${year}`)
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError(`invalid month (1-12): ${month}`)
  const since = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  if (since.getUTCMonth() !== month - 1 || since.getUTCDate() !== day) throw new RangeError(`invalid day for ${year}-${month}: ${day}`)
  const until = new Date(since.getTime() + 24 * 60 * 60 * 1000)
  return { since: since.toISOString(), until: until.toISOString() }
}

export interface DailyMusavirReport {
  period: DailyPeriod & { since: string; until: string }
  gelirGiderIcmali: {
    toplamGelirKurus: Money
    toplamTahsilatKurus: Money
    acikBakiyeKurus: Money
    faturaSayisi: number
  }
  kesilenBelgeler: MonthlyDocumentRow[]
  kdvOzeti: { matrahKurus: Money; kdvKurus: Money; totalKurus: Money; invoiceCount: number }
  tahsilatOzeti: MonthlyCollectionRow[]
  stopajNotu: string
}

/** Pure aggregation — no Supabase, unit-testable with canned rows. Mirrors
 *  monthly.ts's aggregateMonthlyMusavirReport exactly, just for a day-shaped period. */
export function aggregateDailyMusavirReport(
  period: DailyPeriod,
  bounds: { since: string; until: string },
  invoices: RawMonthlyInvoiceRow[],
  payments: RawMonthlyPaymentRow[]
): DailyMusavirReport {
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

/** DB wrapper: fetch one doctor's one calendar day and aggregate it. */
export async function buildDailyMusavirReport(
  supabase: SupabaseClient,
  doctorId: string,
  period: DailyPeriod
): Promise<DailyMusavirReport> {
  const bounds = dayBoundsIso(period)

  const { data: invoiceRows, error: invErr } = await supabase
    .from('accounting_invoices')
    .select('id, status, doc_type, ebelge_doc_number, issued_at, subtotal_kurus, kdv_kurus, total_kurus')
    .eq('doctor_id', doctorId)
    .gte('issued_at', bounds.since)
    .lt('issued_at', bounds.until)
  if (invErr) throw new Error(`buildDailyMusavirReport invoice fetch failed: ${invErr.message}`)

  const { data: paymentRows, error: payErr } = await supabase
    .from('accounting_payments')
    .select('status, method, bank_key, facilitator_key, amount_kurus, created_at')
    .eq('doctor_id', doctorId)
    .gte('created_at', bounds.since)
    .lt('created_at', bounds.until)
  if (payErr) throw new Error(`buildDailyMusavirReport payment fetch failed: ${payErr.message}`)

  const invoices: RawMonthlyInvoiceRow[] = (invoiceRows || []).map((r: any) => ({
    id: r.id,
    status: r.status,
    docType: r.doc_type as EbelgeDocType,
    docNumber: r.ebelge_doc_number,
    issuedAt: r.issued_at,
    subtotalKurus: r.subtotal_kurus,
    kdvKurus: r.kdv_kurus,
    totalKurus: r.total_kurus,
  }))
  const payments: RawMonthlyPaymentRow[] = (paymentRows || []).map((r: any) => ({
    status: r.status,
    method: r.method as PaymentMethod,
    bankKey: r.bank_key,
    facilitatorKey: r.facilitator_key,
    amountKurus: r.amount_kurus,
    createdAt: r.created_at,
  }))

  return aggregateDailyMusavirReport(period, bounds, invoices, payments)
}
