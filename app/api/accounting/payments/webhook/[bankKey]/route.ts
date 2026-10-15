export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — bank webhook receiver. No doctor session here (the bank calls this, not
 * the browser) — trust is established by the adapter's own signature verification
 * (lib/accounting/banks/generic_hosted.ts parseWebhook), never by the URL alone. The merchant_ref
 * in the payload resolves which doctor's merchant this belongs to, and THAT doctor's stored
 * secret is what verifies the signature — a forged merchant_ref for another doctor fails
 * verification against the wrong key rather than silently crediting the wrong practice.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { getBankAdapter } from '@/lib/accounting/banks'
import { decryptSecrets } from '@/lib/accounting/vault'
import { applyPaymentEvent } from '@/lib/accounting/payments/session'
import type { BankKey } from '@/lib/accounting/types'

export async function POST(req: NextRequest, { params }: { params: { bankKey: string } }) {
  const bankKey = params.bankKey as BankKey
  const rawBody = await req.text()
  let parsedBody: Record<string, unknown> = {}
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ success: false, error: 'Geçersiz webhook gövdesi.' }, { status: 400 })
  }
  const merchantRef = String(parsedBody.merchantRef || '')
  if (!merchantRef) return NextResponse.json({ success: false, error: 'merchantRef eksik.' }, { status: 400 })

  const supabase = servisSupabase()
  const { data: payment } = await supabase
    .from('accounting_payments')
    .select('doctor_id')
    .eq('merchant_ref', merchantRef)
    .eq('bank_key', bankKey)
    .maybeSingle()
  if (!payment) return NextResponse.json({ success: false, error: 'Bilinmeyen ödeme referansı.' }, { status: 404 })

  const { data: merchant } = await supabase
    .from('accounting_bank_merchants')
    .select('*')
    .eq('doctor_id', payment.doctor_id)
    .eq('bank_key', bankKey)
    .maybeSingle()
  if (!merchant) return NextResponse.json({ success: false, error: 'Banka hesabı bulunamadı.' }, { status: 404 })

  const adapter = getBankAdapter(bankKey)
  try {
    const event = await adapter.parseWebhook(
      { bankKey, environment: merchant.environment, fields: decryptSecrets(merchant.secrets_enc) },
      { rawBody, signature: req.headers.get('x-pos-signature') || '', body: parsedBody }
    )
    await applyPaymentEvent(supabase, bankKey, event)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Webhook doğrulanamadı.' }, { status: 400 })
  }
}
