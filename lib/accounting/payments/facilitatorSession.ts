/**
 * NOTYA-ACCOUNTING-01 — facilitator payment orchestrator (hybrid model). Deliberately a separate
 * module from payments/session.ts (the direct-bank orchestrator), not a shared function with a
 * branch inside it — per Kaan's instruction #3, the two paths must be touchable independently.
 * The only things genuinely shared are the pure ledger/state-machine helpers, which is fine:
 * those are the single source of truth for money math and legal invoice transitions regardless of
 * which payment provider family collected the money.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActingUser, FacilitatorKey, Money, PaySessionInput } from '../types'
import { assertCan } from '../rbac'
import { getFacilitatorAdapter } from '../facilitators'
import type { FacilitatorMerchantCredentials } from './facilitatorTypes'
import { decryptSecrets } from '../vault'
import { writeAuditLog } from '../audit'
import { nextInvoiceStatus } from '../invoices/stateMachine'
import { postArPayment } from '../ar/ledger'
import { addKurus } from '../ledger/money'

async function loadFacilitatorMerchant(supabase: SupabaseClient, doctorId: string, facilitatorKey: FacilitatorKey) {
  const { data, error } = await supabase
    .from('accounting_facilitator_merchants')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('facilitator_key', facilitatorKey)
    .eq('is_active', true)
    .maybeSingle()
  if (error || !data) {
    throw new Error(`"${facilitatorKey}" için etkin bir ödeme kuruluşu hesabı tanımlı değil.`)
  }
  return data
}

export async function createFacilitatorPaymentSession(
  supabase: SupabaseClient,
  actor: ActingUser,
  args: {
    invoiceId: string
    facilitatorKey: FacilitatorKey
    returnUrl: string
    webhookBaseUrl: string
    buyer: NonNullable<PaySessionInput['buyer']>
    buyerName?: string
    buyerEmail?: string
  }
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

  const merchantRow = await loadFacilitatorMerchant(supabase, actor.doktorId, args.facilitatorKey)
  const credentials: FacilitatorMerchantCredentials = {
    facilitatorKey: args.facilitatorKey,
    environment: merchantRow.environment,
    fields: decryptSecrets(merchantRow.secrets_enc),
  }
  const adapter = getFacilitatorAdapter(args.facilitatorKey)
  const session = await adapter.createHostedCheckoutSession(credentials, {
    invoiceId: invoice.id,
    amountKurus: openKurus,
    currency: 'TRY',
    returnUrl: args.returnUrl,
    webhookUrl: `${args.webhookBaseUrl}/${args.facilitatorKey}`,
    buyerName: args.buyerName,
    buyerEmail: args.buyerEmail,
    buyer: args.buyer,
  })

  await supabase.from('accounting_payments').insert({
    doctor_id: actor.doktorId,
    invoice_id: invoice.id,
    method: 'card_3ds',
    facilitator_key: args.facilitatorKey,
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
    after: { facilitatorKey: args.facilitatorKey, merchantRef: session.merchantRef, amountKurus: openKurus },
  })

  return session
}

/** Mirrors payments/session.ts applyPaymentEvent, scoped to facilitator_key instead of bank_key. */
export async function applyFacilitatorPaymentEvent(
  supabase: SupabaseClient,
  facilitatorKey: FacilitatorKey,
  event: { merchantRef: string; status: 'pending' | 'captured' | 'failed' | 'refunded' | 'cancelled'; amountKurus: Money }
) {
  const { data: payment, error } = await supabase
    .from('accounting_payments')
    .select('*')
    .eq('merchant_ref', event.merchantRef)
    .eq('facilitator_key', facilitatorKey)
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
