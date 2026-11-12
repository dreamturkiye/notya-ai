/**
 * WHATSAPP-ONBURO-01 — "Ayşe ön büro (WhatsApp)": the doctor's front-desk switches and the "Muayenehane bilgileri" sheet.
 *
 * GET  → { hazir, ayar, turetilmisSaatler, duzenleyebilir }  doctor AND the doctor's own secretary (pratikOturum): the desk
 *        answers the phone with the same sheet. Scope is always pratikOturum().doktorId — never a secretary's user id.
 * PUT  { randevuModu, yanitAcik, bilgi } → doctor only (a secretary does not change how the practice answers patients).
 *
 * The row is the doctor's OWN settings row (.eq doctor_id = the practice doctor). It holds practice information the doctor
 * wrote and no patient data; the request carries no patient, appointment or message id. Before migration 195 the table is
 * missing: GET answers the OFF default with hazir=false and PUT answers 503.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { onBuroNormalize } from '@/lib/iletisim/onburo/ayar'
import { AKTIF_ON_BURO } from '@/lib/iletisim/onburo/dil/aktif'
import { onBuroAyarGetir, onBuroAyarKaydet, turetilmisSaatler } from '@/lib/iletisim/onburo/sunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const [{ ayar, hazir }, saatler] = await Promise.all([onBuroAyarGetir(o.supabase, o.doktorId), turetilmisSaatler(o.supabase, o.doktorId, AKTIF_ON_BURO)])
  return NextResponse.json({ hazir, ayar, turetilmisSaatler: saatler, duzenleyebilir: o.rol === 'doktor', acilNumara: AKTIF_ON_BURO.acilNumara })
}

export async function PUT(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  if (o.rol !== 'doktor') return NextResponse.json({ error: 'Bu ayarı yalnızca hekim değiştirebilir.' }, { status: 403 })
  const govde = await req.json().catch(() => null)
  if (!govde || typeof govde !== 'object') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  const ayar = onBuroNormalize(govde)
  const s = await onBuroAyarKaydet(o.supabase, o.doktorId, ayar)
  if (!s.ok) return NextResponse.json({ error: s.hazirDegil ? 'Bu özellik henüz kullanıma açılmadı.' : 'Ayar şu an kaydedilemedi.' }, { status: 503 })
  return NextResponse.json({ ok: true, ayar })
}
