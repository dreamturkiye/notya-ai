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

/**
 * NestPay "3D Pay Hosting" has no async webhook distinct from the browser's own return trip: the
 * bank's hosted page POSTs its result straight to this route as `okUrl`/`failUrl`
 * (`application/x-www-form-urlencoded`), i.e. the BROWSER lands here, not just the bank's server.
 * So this one bank family needs an HTML redirect response back to the doctor-facing return page
 * instead of bare JSON — every other adapter's webhook is bank-server-to-our-server only and the
 * browser never touches this route, so their JSON response is unaffected.
 */
function isFormPost(req: NextRequest): boolean {
  const ct = req.headers.get('content-type') || ''
  return ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')
}

function redirectHtml(returnUrl: string): string {
  const safeUrl = returnUrl.replace(/"/g, '&quot;')
  return `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${safeUrl}"></head><body>Yönlendiriliyor… <a href="${safeUrl}">devam et</a></body></html>`
}

/**
 * GET-based bank redirect callback (VakıfBank PayFlex Common Payment — see
 * lib/accounting/banks/vakifbank.ts header "third disclosed gap"; the library's own reference
 * example confirms this gateway replies with a browser GET, not a POST, unlike every other
 * adapter in this module). The browser lands here directly with query params — our own
 * `merchantRef` (embedded on SuccessUrl/FailUrl by the adapter) plus whatever the bank appends
 * (`TransactionId`/`PaymentToken` for VakıfBank). Written generically by query-string shape, not
 * hardcoded to one bank key, since the same shape could fit another GET-replying gateway later.
 */
export async function GET(req: NextRequest, { params }: { params: { bankKey: string } }) {
  const bankKey = params.bankKey as BankKey
  const searchParams = req.nextUrl.searchParams
  const merchantRef = searchParams.get('merchantRef') || searchParams.get('oid') || ''
  const supabase = servisSupabase()
  const { data: payment } = await supabase
    .from('accounting_payments')
    .select('doctor_id, return_url')
    .eq('merchant_ref', merchantRef)
    .eq('bank_key', bankKey)
    .maybeSingle()
  const fallbackReturnUrl = payment?.return_url || '/'
  if (!payment) {
    return new Response(redirectHtml(fallbackReturnUrl), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const { data: merchant } = await supabase
    .from('accounting_bank_merchants')
    .select('*')
    .eq('doctor_id', payment.doctor_id)
    .eq('bank_key', bankKey)
    .maybeSingle()
  if (merchant) {
    const adapter = getBankAdapter(bankKey)
    const body: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) body[key] = value
    try {
      const event = await adapter.parseWebhook(
        { bankKey, environment: merchant.environment, fields: decryptSecrets(merchant.secrets_enc) },
        { body }
      )
      await applyPaymentEvent(supabase, bankKey, event)
    } catch {
      // Same posture as the POST/form-redirect branch below: fall through regardless — the
      // doctor's own return page re-reads the invoice/payment status itself.
    }
  }
  return new Response(redirectHtml(payment.return_url || fallbackReturnUrl), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function POST(req: NextRequest, { params }: { params: { bankKey: string } }) {
  const bankKey = params.bankKey as BankKey

  if (isFormPost(req)) {
    const form = await req.formData()
    const body: Record<string, string> = {}
    for (const [key, value] of form.entries()) body[key] = String(value)
    const merchantRef = body.oid || ''
    const supabase = servisSupabase()
    const { data: payment } = await supabase
      .from('accounting_payments')
      .select('doctor_id, return_url')
      .eq('merchant_ref', merchantRef)
      .eq('bank_key', bankKey)
      .maybeSingle()
    const fallbackReturnUrl = payment?.return_url || '/'
    if (!payment) return new Response(redirectHtml(fallbackReturnUrl), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

    const { data: merchant } = await supabase
      .from('accounting_bank_merchants')
      .select('*')
      .eq('doctor_id', payment.doctor_id)
      .eq('bank_key', bankKey)
      .maybeSingle()
    if (merchant) {
      const adapter = getBankAdapter(bankKey)
      try {
        const event = await adapter.parseWebhook(
          { bankKey, environment: merchant.environment, fields: decryptSecrets(merchant.secrets_enc) },
          { body }
        )
        await applyPaymentEvent(supabase, bankKey, event)
      } catch {
        // Fall through to redirecting the browser regardless — the doctor's return page re-reads
        // the invoice/payment status itself rather than trusting this redirect's happy path.
      }
    }
    return new Response(redirectHtml(payment.return_url || fallbackReturnUrl), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

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
