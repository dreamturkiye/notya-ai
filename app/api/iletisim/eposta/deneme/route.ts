/**
 * NOTYA-ILETISIM-02 — "Kendime deneme gönder": one short message from the connected mailbox to
 * that same address. The recipient is never taken from the request, so this cannot be used to
 * mail anyone else.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hazirSaglayicilar, KAPALI_MESAJI } from '@/lib/iletisim/otomatik/eposta/ayar'
import { baglantiGetir } from '@/lib/iletisim/otomatik/eposta/depo'
import { epostaGonder, HATA } from '@/lib/iletisim/otomatik/eposta/gonderim'

export const dynamic = 'force-dynamic'

const DENEME_KONU = 'Notya deneme e-postası'
const DENEME_METIN =
  'Merhaba,\n\nBu bir deneme e-postasıdır. Notya, hastalarınıza randevu hatırlatmalarını artık bu adresten gönderebilir.\n\nNotya'

export async function POST(req: NextRequest) {
  if (hazirSaglayicilar().length === 0) return NextResponse.json({ error: KAPALI_MESAJI }, { status: 503 })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const b = await baglantiGetir(oturum.supabase, oturum.user.id).catch(() => null)
  if (!b) return NextResponse.json({ error: HATA.bagliDegil }, { status: 409 })
  const sonuc = await epostaGonder(oturum.supabase, { doktorId: oturum.user.id, alici: b.adres, konu: DENEME_KONU, metin: DENEME_METIN })
  if (!sonuc.ok) return NextResponse.json({ error: sonuc.hata, yenilenmeli: sonuc.hata === HATA.yenilenmeli }, { status: 502 })
  return NextResponse.json({ ok: true })
}
