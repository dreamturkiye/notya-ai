/**
 * NOTYA-ILETISIM-03 — Meta WhatsApp webhook. URL: https://www.notya.io/api/iletisim/whatsapp/webhook
 *
 * GET  → abonelik doğrulaması (hub.verify_token = WHATSAPP_WEBHOOK_VERIFY_TOKEN).
 * POST → X-Hub-Signature-256 doğrulanır. Teslim ve şablon onayı eski yoldan kaydedilir.
 * NOTYA-KALKAN-01: gelen satır ve hekim yankısı ayrıca deftere yazılır. Gövde şifrelidir.
 * Tablo yoksa bu adım susar; eski gidiş aynen kalır. Meta 200 almazsa yeniden dener.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { whatsappAyar, YAKINDA_MESAJI } from '@/lib/iletisim/otomatik/whatsapp/ayar'
import { dogrulamaYaniti, imzaGecerliMi, olaylariAyikla } from '@/lib/iletisim/otomatik/whatsapp/webhook'
import { webhookOlaylariniIsle } from '@/lib/iletisim/otomatik/whatsapp/depo'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ayar = whatsappAyar()
  if (!ayar) return NextResponse.json({ error: YAKINDA_MESAJI }, { status: 503 })
  const challenge = dogrulamaYaniti(req.nextUrl.searchParams, ayar.verifyToken)
  if (challenge === null) return NextResponse.json({ error: 'Doğrulama başarısız.' }, { status: 403 })
  return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
}

export async function POST(req: NextRequest) {
  const ayar = whatsappAyar()
  if (!ayar) return NextResponse.json({ error: YAKINDA_MESAJI }, { status: 503 })
  const ham = await req.text()
  if (!imzaGecerliMi(ham, req.headers.get('x-hub-signature-256'), ayar.appSecret)) {
    return NextResponse.json({ error: 'İmza geçersiz.' }, { status: 401 })
  }
  let govde: unknown
  try { govde = JSON.parse(ham) } catch { return NextResponse.json({ ok: true }) }
  try {
    await webhookOlaylariniIsle(servisSupabase(), olaylariAyikla(govde))
    const { kalkanIsle } = await import('@/lib/iletisim/kalkan/isle')
    const { kalkanAyikla } = await import('@/lib/iletisim/otomatik/whatsapp/webhook')
    await kalkanIsle(servisSupabase(), kalkanAyikla(govde))
  } catch (e) {
    console.error('[whatsapp-webhook] işlenemedi:', e instanceof Error ? e.message : 'bilinmeyen')
  }
  return NextResponse.json({ ok: true })
}
