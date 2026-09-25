/**
 * NOTYA-ILETISIM-03 — "WhatsApp'ı bağla" tamamlandı: tarayıcı Embedded Signup'tan dönen tek kullanımlık
 * kodu ve oturum bilgisini yollar; sunucu kodu anahtara çevirir, numarayı doğrular, aboneliği ve
 * şablonları kurar. Ayrıntı: lib/iletisim/otomatik/whatsapp/kurulum.ts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { whatsappAyar, YAKINDA_MESAJI } from '@/lib/iletisim/otomatik/whatsapp/ayar'
import { kurulumGirdisiDogrula, kurulumuTamamla } from '@/lib/iletisim/otomatik/whatsapp/kurulum'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const ayar = whatsappAyar()
  if (!ayar) return NextResponse.json({ error: YAKINDA_MESAJI, yakinda: true }, { status: 503 })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const girdi = kurulumGirdisiDogrula(await req.json().catch(() => null))
  if (!girdi) return NextResponse.json({ error: 'WhatsApp bağlantısı tamamlanamadı. Lütfen yeniden deneyin.' }, { status: 400 })
  const s = await kurulumuTamamla(oturum.supabase, oturum.user.id, girdi, ayar)
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
  return NextResponse.json({ ok: true, numara: s.numara })
}
