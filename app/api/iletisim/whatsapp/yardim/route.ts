/**
 * WHATSAPP-API-01 — guided helper on the WhatsApp card: answers a doctor's free question about connecting WhatsApp.
 * FAQ first (lib/iletisim/whatsapp/yardim.ts), the approved LLM gateway only for what the FAQ does not cover.
 * Session required; takes no patient identifier and reads no patient table.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { varsayilanYardimLlm, yardimCevabi } from '@/lib/iletisim/whatsapp/yardim'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const g = (await req.json().catch(() => null)) as { soru?: unknown } | null
  const soru = typeof g?.soru === 'string' ? g.soru.trim() : ''
  if (!soru) return NextResponse.json({ error: 'Sorunuzu yazın.' }, { status: 400 })
  return NextResponse.json(await yardimCevabi(soru, varsayilanYardimLlm))
}
