/**
 * AU-BETA-02 — POST /api/ulke/odeme-webhook/stripe?d=<doctor id>. Called by the PROVIDER, not a browser: no session. The doctor's own signing secret
 * (stored encrypted with the connection) is looked up from `d`, the signature on the RAW body is verified, and only then is anything read.
 * Answers carry a short reason code and never the body, a secret or a stack. See lib/ulke/fatura/webhook.ts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { uuidMi } from '@/lib/ulke/uygulama/cevap'
import { stripeWebhookIsle } from '@/lib/ulke/fatura/webhook'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!ulkePaketi().uzanti?.fatura) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  const d = new URL(req.url).searchParams.get('d')
  // No (or a malformed) doctor id names no endpoint: answered like an endpoint that does not exist, to whoever calls.
  if (!d || !uuidMi(d)) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  const govde = await req.text()
  if (govde.length > 200_000) return NextResponse.json({ code: 'TOO_LARGE' }, { status: 400 })
  try {
    const r = await stripeWebhookIsle(ulkeServisSupabase(), d, govde, req.headers.get('stripe-signature'))
    return NextResponse.json({ received: r.durum === 200, result: r.sonuc }, { status: r.durum })
  } catch {
    return NextResponse.json({ code: 'FAILED' }, { status: 500 })
  }
}
