/**
 * WHATSAPP-API-01 — the webhook URL to register in the Meta app: https://www.notya.io/api/whatsapp/webhook
 * (Callback URL + WHATSAPP_VERIFY_TOKEN, subscribe the `messages` field; the template-status and account-update
 * fields are delivered to the same URL). Same implementation as /api/iletisim/whatsapp/webhook — see
 * lib/iletisim/whatsapp/webhookIsle.ts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { webhookDogrula, webhookIsle, type WebhookYaniti } from '@/lib/iletisim/whatsapp/webhookIsle'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function yanit(y: WebhookYaniti) {
  return y.text !== undefined
    ? new NextResponse(y.text, { status: y.status, headers: { 'Content-Type': 'text/plain' } })
    : NextResponse.json(y.json ?? {}, { status: y.status })
}

export async function GET(req: NextRequest) {
  return yanit(webhookDogrula(req.nextUrl.searchParams))
}

export async function POST(req: NextRequest) {
  const ham = await req.text()
  return yanit(await webhookIsle(ham, req.headers.get('x-hub-signature-256')))
}
