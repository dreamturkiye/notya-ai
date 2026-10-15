/**
 * NOTYA-ACCOUNTING-01 — basic reporting (docs/ARCH-NOTYA-ACCOUNTING.md §2.9).
 * Notya is not the official tax-filing tool; this exists for the practice's own dashboard and a
 * CSV handoff to their mali müşavir, not for GİB declaration.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { addKurus } from '../ledger/money'
import type { Money } from '../types'

export interface CollectionsByBank {
  bankKey: string | null
  capturedKurus: Money
  paymentCount: number
}

export async function collectionsByBank(
  supabase: SupabaseClient,
  doctorId: string,
  since: string
): Promise<CollectionsByBank[]> {
  const { data, error } = await supabase
    .from('accounting_payments')
    .select('bank_key, amount_kurus')
    .eq('doctor_id', doctorId)
    .eq('status', 'captured')
    .gte('created_at', since)
  if (error) throw new Error(`collectionsByBank failed: ${error.message}`)
  const byBank = new Map<string | null, { capturedKurus: Money; paymentCount: number }>()
  for (const row of data || []) {
    const key = row.bank_key
    const entry = byBank.get(key) || { capturedKurus: 0, paymentCount: 0 }
    entry.capturedKurus = addKurus(entry.capturedKurus, row.amount_kurus)
    entry.paymentCount += 1
    byBank.set(key, entry)
  }
  return Array.from(byBank.entries()).map(([bankKey, v]) => ({ bankKey, ...v }))
}

export interface SalesByService {
  serviceId: string | null
  description: string
  quantitySold: number
  revenueKurus: Money
}

export async function salesByService(supabase: SupabaseClient, doctorId: string, since: string): Promise<SalesByService[]> {
  const { data: invoices, error } = await supabase
    .from('accounting_invoices')
    .select('id')
    .eq('doctor_id', doctorId)
    .in('status', ['issued', 'partially_paid', 'paid'])
    .gte('issued_at', since)
  if (error) throw new Error(`salesByService failed: ${error.message}`)
  const invoiceIds = (invoices || []).map((i) => i.id)
  if (!invoiceIds.length) return []

  const { data: lines, error: lineErr } = await supabase
    .from('accounting_invoice_lines')
    .select('service_id, description, quantity, line_total_kurus')
    .in('invoice_id', invoiceIds)
  if (lineErr) throw new Error(`salesByService line fetch failed: ${lineErr.message}`)

  const byService = new Map<string, SalesByService>()
  for (const line of lines || []) {
    const key = line.service_id || line.description
    const entry = byService.get(key) || { serviceId: line.service_id, description: line.description, quantitySold: 0, revenueKurus: 0 }
    entry.quantitySold += Number(line.quantity)
    entry.revenueKurus = addKurus(entry.revenueKurus, line.line_total_kurus)
    byService.set(key, entry)
  }
  return Array.from(byService.values())
}

export interface KdvSummary {
  matrahKurus: Money
  kdvKurus: Money
  totalKurus: Money
  invoiceCount: number
}

/** KDV summary for a mali müşavir export — Notya is not the declaration tool itself. */
export async function kdvSummary(supabase: SupabaseClient, doctorId: string, since: string, until: string): Promise<KdvSummary> {
  const { data, error } = await supabase
    .from('accounting_invoices')
    .select('subtotal_kurus, kdv_kurus, total_kurus')
    .eq('doctor_id', doctorId)
    .in('status', ['issued', 'partially_paid', 'paid', 'credited'])
    .gte('issued_at', since)
    .lte('issued_at', until)
  if (error) throw new Error(`kdvSummary failed: ${error.message}`)
  const rows = data || []
  return {
    matrahKurus: addKurus(...rows.map((r) => r.subtotal_kurus)),
    kdvKurus: addKurus(...rows.map((r) => r.kdv_kurus)),
    totalKurus: addKurus(...rows.map((r) => r.total_kurus)),
    invoiceCount: rows.length,
  }
}
