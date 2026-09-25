/**
 * NOTYA-ILETISIM-03 — "Bağlantıyı kaldır": Notya'nın WABA aboneliği iptal edilir, anahtar satırla silinir.
 * Doktorun WhatsApp Business uygulaması ve sohbetleri etkilenmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { whatsappAyar, YAKINDA_MESAJI } from '@/lib/iletisim/otomatik/whatsapp/ayar'
import { baglantiKaldir } from '@/lib/iletisim/otomatik/whatsapp/kurulum'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!whatsappAyar()) return NextResponse.json({ error: YAKINDA_MESAJI, yakinda: true }, { status: 503 })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  await baglantiKaldir(oturum.supabase, oturum.user.id)
  return NextResponse.json({ ok: true })
}
