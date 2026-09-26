import { NextRequest, NextResponse } from 'next/server'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { telegramGonder } from '@/lib/uyari/telegram'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!cronYetkiliMi(req)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  let body: { message?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const message = String(body?.message || '').trim()
  if (!message) {
    return NextResponse.json({ error: 'Mesaj alanı zorunludur.' }, { status: 400 })
  }

  const gitti = await telegramGonder(message.slice(0, 2000))
  if (!gitti) {
    return NextResponse.json({ error: 'Uyarı gönderilemedi' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
