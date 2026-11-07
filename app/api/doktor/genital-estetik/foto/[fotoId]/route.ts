/**
 * GENITAL-ESTETIK-01 — ONE VIEW of one intimate photo (KD, plastik cerrahi, estetik & plastik cerrahi; doctor only).
 *   GET ?patientId=<id>   → the image bytes, `private, no-store`, never cached, never a thumbnail
 * The photo is read with doctor_id AND patient_id (a foreign id = 404). Every view writes an audit_logs row FIRST; if it
 * cannot be written the photo is not served (500, fail closed).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { doktorBransi, fotoGoruntule, genitalEstetikBransi } from '@/lib/doktor/genitalEstetikSunucu'
import { GE_HATA } from '@/specialties/kadin-dogum/engines/genitalEstetikMetinleri'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
type Ctx = { params: { fotoId: string } | Promise<{ fotoId: string }> }
const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest, ctx: Ctx) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  if (!genitalEstetikBransi(await doktorBransi(supabase, doktorId))) return NextResponse.json({ error: GE_HATA.kd_degil }, { status: 403, headers: NO_STORE })
  const { fotoId } = await ctx.params
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!UUID.test(fotoId) || !patientId) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404, headers: NO_STORE })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const r = await fotoGoruntule(supabase, doktorId, patientId, fotoId, oturum.user.id, ip)
  if (r === 'denetim_yazilamadi') return NextResponse.json({ error: 'Görüntüleme kaydı yazılamadı; fotoğraf gösterilmedi.' }, { status: 500, headers: NO_STORE })
  if (!r) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404, headers: NO_STORE })
  return new NextResponse(new Uint8Array(r.bytes), { status: 200, headers: { ...NO_STORE, 'Content-Type': r.mime, 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff' } })
}
