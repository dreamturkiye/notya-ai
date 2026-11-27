/**
 * BRANS-PAKETI — a patient photo for the professional who owns the patient (Tabağım review, progress / lesion photos).
 *   GET ?patientId=&id= → bytes (private, no-store).
 * HASTA-IZOLASYON: doktorOturum; 404 unless hastaSahibiMi(session user, patientId); the photo row is matched by id AND
 * doctor_id = session user AND patient_id, and its storage path must start with "<doctor_id>/<patient_id>/".
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { fotoOku } from '@/lib/portal/bransPaketiSunucu'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const o = await doktorOturum(req)
  if ('hata' in o) return o.hata
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!patientId || !(await hastaSahibiMi(o.supabase, o.user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const f = await fotoOku(o.supabase, { doktorId: o.user.id, patientId }, req.nextUrl.searchParams.get('id') || '').catch(() => null)
  if (!f) return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 404 })
  return new NextResponse(Buffer.from(f.bayt), { headers: { 'Content-Type': f.mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
}
