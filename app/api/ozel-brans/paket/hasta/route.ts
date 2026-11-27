/**
 * BRANS-PAKETI — one patient's package as the professional sees it, and the professional's per-patient controls.
 *   GET  ?patientId= → modules (on / off / why / accepted), settings, the patient's entries (only after the patient's
 *        sharing consent), photos list, weekly plan, lab series (longevity), drug–food notes (diyetisyen).
 *   POST { patientId, islem: 'ayar', modul, acik, baslangic, ayar } → switch / start date / settings for one module.
 *   POST { patientId, islem: 'yorum', id, yorum } → the one comment on a patient photo (Tabağım: no calorie count).
 * HASTA-IZOLASYON: doktorOturum; patientId from the query or body is 404 unless hastaSahibiMi(session user, patientId);
 * every read / write then carries doctor_id = session user AND that patient_id; a photo id is matched inside that scope;
 * module codes must belong to the session doctor's own Özel Branş.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { fotoYorumYaz, hastaAyarYaz, hekimHastaPaketi } from '@/lib/portal/bransPaketiSunucu'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const o = await doktorOturum(req)
  if ('hata' in o) return o.hata
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!patientId || !(await hastaSahibiMi(o.supabase, o.user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  try {
    return NextResponse.json(await hekimHastaPaketi(o.supabase, { doktorId: o.user.id, patientId }))
  } catch {
    return NextResponse.json({ error: 'Hasta alanı okunamadı.' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const o = await doktorOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const patientId = String(b?.patientId || '')
  if (!b || !patientId || !(await hastaSahibiMi(o.supabase, o.user.id, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const k = { doktorId: o.user.id, patientId }
  const r = b.islem === 'yorum' ? await fotoYorumYaz(o.supabase, k, b) : b.islem === 'ayar' ? await hastaAyarYaz(o.supabase, k, b) : { ok: false as const, status: 400, hata: 'Geçersiz işlem.' }
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.hata }, { status: r.status })
}
