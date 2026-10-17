/**
 * NOTYA-ILETISIM-03 / WHATSAPP-API-01 — Meta WhatsApp webhook, original URL: https://www.notya.io/api/iletisim/whatsapp/webhook
 * The same implementation also answers /api/whatsapp/webhook (the URL registered in the Meta app). All logic lives in
 * lib/iletisim/whatsapp/webhookIsle.ts: GET verify, POST signature check (WHATSAPP_APP_SECRET, constant time),
 * delivery receipts, inbound replies, automatic actions, e-posta fallback.
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
