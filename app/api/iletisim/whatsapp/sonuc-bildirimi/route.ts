/**
 * WHATSAPP-CANCEL-01 — POST /api/iletisim/whatsapp/sonuc-bildirimi { acik: boolean }
 *
 * The doctor's switch for the generic "bildiriminiz hazır" WhatsApp notice (`sonuc_hazir`). Default OFF. Nothing sends that
 * notice automatically yet; the switch only records the doctor's choice for when a trigger exists (the UI says so).
 * doktorOturum only (a secretary does not change the practice's messaging settings). The row is the doctor's OWN connection
 * (.eq doctor_id = session doctor); the request carries no patient or appointment id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const b = (await req.json().catch(() => null)) as { acik?: unknown } | null
  if (typeof b?.acik !== 'boolean') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  const { data, error } = await oturum.supabase.from('doktor_whatsapp_baglantilari')
    .update({ sonuc_bildirimi_acik: b.acik, updated_at: new Date().toISOString() })
    .eq('doctor_id', oturum.user.id).eq('durum', 'bagli').select('doctor_id')
  if (error) return NextResponse.json({ error: 'Ayar şu an kaydedilemedi.' }, { status: 503 })
  if (!data?.length) return NextResponse.json({ error: 'WhatsApp bağlı değil.' }, { status: 409 })
  return NextResponse.json({ ok: true, acik: b.acik })
}
