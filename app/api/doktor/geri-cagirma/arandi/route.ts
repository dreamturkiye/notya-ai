/**
 * GERI-CAGIRMA-01 — "Arandı": the practice phoned a patient from the recall list. Nothing is sent; the mark counts
 * as a recall for the cool-down and for attribution. CORE; doktor + personel.
 *
 * POST { patientId } → { ok, yeni }
 * HASTA-IZOLASYON: the id is resolved through the doctor's own due list (doctor id in every query); another
 * doctor's patient answers 404 exactly like an unknown one, and nothing is written.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { arandiIsaretle } from '@/lib/geriCagirma/gonder'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user, rol, personelId } = oturum
  const b = (await req.json().catch(() => null)) as { patientId?: unknown } | null
  const s = await arandiIsaretle(supabase, doktorId, { userId: user.id, personelId: personelId || null, rol }, b?.patientId)
  if (!s.ok) return NextResponse.json({ error: s.durum === 404 ? 'Hasta bulunamadı.' : s.durum === 400 ? 'Geçersiz istek.' : 'Kaydedilemedi.' }, { status: s.durum })
  return NextResponse.json({ ok: true, yeni: s.yeni })
}
