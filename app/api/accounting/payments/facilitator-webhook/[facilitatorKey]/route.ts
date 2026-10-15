export const dynamic = 'force-dynamic'

/**
 * NOTYA-ACCOUNTING-01 — facilitator callback receiver (hybrid model). Parallel to
 * app/api/accounting/payments/webhook/[bankKey]/route.ts but intentionally separate per Kaan's
 * instruction #3. No doctor session — the facilitator (or the customer's browser, for iyzico's
 * callbackUrl redirect-POST) calls this. Trust is established by re-querying the facilitator's
 * own retrieve-status endpoint with OUR signed server-to-server request, never by trusting fields
 * in this inbound body directly — the same "never trust the callback payload alone" posture as
 * the bank webhook route, just implemented via a mandatory re-query instead of a response-
 * signature check (see lib/accounting/facilitators/iyzico.ts header comment on what was NOT
 * verified: the response-signature algorithm).
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { getFacilitatorAdapter } from '@/lib/accounting/facilitators'
import { decryptSecrets } from '@/lib/accounting/vault'
import { applyFacilitatorPaymentEvent } from '@/lib/accounting/payments/facilitatorSession'
import type { FacilitatorKey } from '@/lib/accounting/types'

async function extractToken(req: NextRequest): Promise<string> {
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    return String((body as Record<string, unknown>).token || '')
  }
  // iyzico's Checkout Form callback is a standard form POST (token=...).
  const form = await req.formData().catch(() => null)
  if (form) return String(form.get('token') || '')
  return ''
}

export async function POST(req: NextRequest, { params }: { params: { facilitatorKey: string } }) {
  const facilitatorKey = params.facilitatorKey as FacilitatorKey
  const token = await extractToken(req)
  if (!token) return NextResponse.json({ success: false, error: 'token eksik.' }, { status: 400 })

  const supabase = servisSupabase()
  const { data: payment } = await supabase
    .from('accounting_payments')
    .select('doctor_id')
    .eq('session_id', token)
    .eq('facilitator_key', facilitatorKey)
    .maybeSingle()
  if (!payment) return NextResponse.json({ success: false, error: 'Bilinmeyen ödeme oturumu.' }, { status: 404 })

  const { data: merchant } = await supabase
    .from('accounting_facilitator_merchants')
    .select('*')
    .eq('doctor_id', payment.doctor_id)
    .eq('facilitator_key', facilitatorKey)
    .maybeSingle()
  if (!merchant) return NextResponse.json({ success: false, error: 'Ödeme kuruluşu hesabı bulunamadı.' }, { status: 404 })

  const adapter = getFacilitatorAdapter(facilitatorKey)
  try {
    const event = await adapter.parseCallback(
      { facilitatorKey, environment: merchant.environment, fields: decryptSecrets(merchant.secrets_enc) },
      { token }
    )
    await applyFacilitatorPaymentEvent(supabase, facilitatorKey, event)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Doğrulanamadı.' }, { status: 400 })
  }
}
