/**
 * NOTYA-ACCOUNTING-01 — payment orchestrator: create a hosted 3DS session against the doctor's
 * own bank merchant, and apply bank webhooks/status queries back onto the invoice + AR ledger.
 * Notya never touches PAN/CVV — only session metadata and the bank's own hosted redirect URL.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActingUser, BankKey, Money } from '../types'
import { assertCan } from '../rbac'
import { getBankAdapter } from '../banks'
import type { BankMerchantCredentials } from '../payments/types'
import { decryptSecrets } from '../vault'
import { writeAuditLog } from '../audit'
import { nextInvoiceStatus } from '../invoices/stateMachine'
import { postArPayment } from '../ar/ledger'
import { addKurus } from '../ledger/money'

async function loadMerchant(supabase: SupabaseClient, doctorId: string, bankKey: BankKey) {
  const { data, error } = await supabase
    .from('accounting_bank_merchants')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('bank_key', bankKey)
    .eq('is_active', true)
    .maybeSingle()
  if (error || !data) throw new Error(`"${bankKey}" için etkin bir banka sanal POS hesabı tanımlı değil.`)
  return data
}

export async function createPaymentSession(
  supabase: SupabaseClient,
  actor: ActingUser,
  args: { invoiceId: string; bankKey: BankKey; returnUrl: string; webhookBaseUrl: string }
) {
  assertCan(actor.role, 'payment.charge')
  const { data: invoice, error } = await supabase
    .from('accounting_invoices')
    .select('*')
    .eq('id', args.invoiceId)
    .eq('doctor_id', actor.doktorId)
    .maybeSingle()
  if (error || !invoice) throw new Error('Fatura bulunamadı.')
  if (!['issued', 'partially_paid'].includes(invoice.status)) {
    throw new Error('Yalnızca kesilmiş (issued) faturalar için ödeme oturumu açılabilir.')
  }
  const openKurus: Money = invoice.total_kurus - invoice.paid_kurus
  if (openKurus <= 0) throw new Error('Bu faturada ödenecek bakiye yok.')

  const merchantRow = await loadMerchant(supabase, actor.doktorId, args.bankKey)
  const credentials: BankMerchantCredentials = {
    bankKey: args.bankKey,
    environment: merchantRow.environment,
    fields: decryptSecrets(merchantRow.secrets_enc),
  }
  const adapter = getBankAdapter(args.bankKey)
  const session = await adapter.createHosted3dsSession(credentials, {
    invoiceId: invoice.id,
    amountKurus: openKurus,
    currency: 'TRY',
    returnUrl: args.returnUrl,
    webhookUrl: `${args.webhookBaseUrl}/${args.bankKey}`,
  })

  await supabase.from('accounting_payments').insert({
    doctor_id: actor.doktorId,
    invoice_id: invoice.id,
    method: 'card_3ds',
    bank_key: args.bankKey,
    session_id: session.sessionId,
    merchant_ref: session.merchantRef,
    status: 'pending',
    amount_kurus: openKurus,
  })

  await writeAuditLog(supabase, {
    doctorId: actor.doktorId,
    actorId: actor.userId,
    actorRole: actor.role,
    entityType: 'accounting_payment',
    entityId: session.merchantRef,
    action: 'session_created',
    after: { bankKey: args.bankKey, merchantRef: session.merchantRef, amountKurus: openKurus },
  })

  return session
}

/** Apply a verified payment event (from a webhook or a status-query poll) to the ledger. Idempotent
 *  on merchant_ref + status: re-applying a 'captured' event for an already-captured payment is a no-op. */
export async function applyPaymentEvent(
  supabase: SupabaseClient,
  bankKey: BankKey,
  event: { merchantRef: string; status: 'pending' | 'captured' | 'failed' | 'refunded' | 'cancelled'; amountKurus: Money }
) {
  const { data: payment, error } = await supabase
    .from('accounting_payments')
    .select('*')
    .eq('merchant_ref', event.merchantRef)
    .eq('bank_key', bankKey)
    .maybeSingle()
  if (error || !payment) throw new Error(`Bilinmeyen ödeme referansı: ${event.merchantRef}`)
  if (payment.status === event.status) return payment // idempotent

  await supabase
    .from('accounting_payments')
    .update({ status: event.status, raw_event: event, updated_at: new Date().toISOString() })
    .eq('id', payment.id)

  if (event.status === 'captured') {
    const { data: invoice } = await supabase.from('accounting_invoices').select('*').eq('id', payment.invoice_id).maybeSingle()
    if (invoice) {
      const paidKurus = addKurus(invoice.paid_kurus, event.amountKurus)
      const fullyPaid = paidKurus >= invoice.total_kurus
      const nextStatus = nextInvoiceStatus(invoice.status, fullyPaid ? 'record_full_payment' : 'record_partial_payment')
      await supabase
        .from('accounting_invoices')
        .update({ paid_kurus: paidKurus, status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', invoice.id)
      await postArPayment(supabase, { doctorId: invoice.doctor_id, patientId: invoice.patient_id, invoiceId: invoice.id, amountKurus: event.amountKurus })
    }
  }
  return payment
}
