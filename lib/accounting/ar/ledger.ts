/**
 * NOTYA-ACCOUNTING-01 — AR ledger posting. Every movement recomputes the patient's running
 * balance from the previous row rather than trusting a cached total, so a missed webhook or a
 * manual correction never desyncs silently.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ArMovementType, Money } from '../types'
import { addKurus, subtractKurus } from '../ledger/money'
import { computeAgingReport, type AgingReport, type OpenReceivable } from './aging'

async function lastBalance(supabase: SupabaseClient, doctorId: string, patientId: string | null): Promise<Money> {
  let q = supabase
    .from('accounting_ar_ledger')
    .select('balance_kurus')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(1)
  q = patientId ? q.eq('patient_id', patientId) : q.is('patient_id', null)
  const { data } = await q.maybeSingle()
  return data?.balance_kurus ?? 0
}

async function postMovement(
  supabase: SupabaseClient,
  args: { doctorId: string; patientId: string | null; invoiceId: string | null; movementType: ArMovementType; amountKurus: Money }
) {
  const prev = await lastBalance(supabase, args.doctorId, args.patientId)
  const balance = args.movementType === 'charge' ? addKurus(prev, args.amountKurus) : subtractKurus(prev, args.amountKurus)
  await supabase.from('accounting_ar_ledger').insert({
    doctor_id: args.doctorId,
    patient_id: args.patientId,
    invoice_id: args.invoiceId,
    movement_type: args.movementType,
    amount_kurus: args.amountKurus,
    balance_kurus: balance,
  })
  return balance
}

export function postArCharge(
  supabase: SupabaseClient,
  args: { doctorId: string; patientId: string | null; invoiceId: string; amountKurus: Money }
) {
  return postMovement(supabase, { ...args, movementType: 'charge' })
}

export function postArPayment(
  supabase: SupabaseClient,
  args: { doctorId: string; patientId: string | null; invoiceId: string; amountKurus: Money }
) {
  return postMovement(supabase, { ...args, movementType: 'payment' })
}

export function postArCredit(
  supabase: SupabaseClient,
  args: { doctorId: string; patientId: string | null; invoiceId: string | null; amountKurus: Money }
) {
  return postMovement(supabase, { ...args, movementType: 'credit' })
}

/** Open receivables for the aging report: issued/partially_paid invoices with balance > 0. */
export async function listOpenReceivables(supabase: SupabaseClient, doctorId: string): Promise<OpenReceivable[]> {
  const { data, error } = await supabase
    .from('accounting_invoices')
    .select('id, issued_at, total_kurus, paid_kurus')
    .eq('doctor_id', doctorId)
    .in('status', ['issued', 'partially_paid'])
    .not('issued_at', 'is', null)
  if (error) throw new Error(`listOpenReceivables failed: ${error.message}`)
  return (data || [])
    .map((r) => ({ invoiceId: r.id, issuedAt: r.issued_at as string, openBalanceKurus: subtractKurus(r.total_kurus, r.paid_kurus) }))
    .filter((r) => r.openBalanceKurus > 0)
}

export async function getAgingReport(supabase: SupabaseClient, doctorId: string): Promise<AgingReport> {
  const receivables = await listOpenReceivables(supabase, doctorId)
  return computeAgingReport(receivables)
}
