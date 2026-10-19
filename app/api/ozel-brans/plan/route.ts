import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import { ozelAracBul, ozelAracCalistir, portalSatirlari } from '@/lib/klinik/ozelAracCalistir'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  let sorgu = supabase
    .from('ozel_brans_plan')
    .select('patient_id, arac, ozet, portal_satir, acil, riza, girdi, updated_at')
    .eq('doctor_id', user.id)
  if (patientId) {
    if (!(await hastaSahibiMi(supabase, user.id, patientId))) {
      return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
    }
    sorgu = sorgu.eq('patient_id', patientId)
  }
  const { data, error } = await sorgu.order('updated_at', { ascending: false }).limit(80)
  if (error) return NextResponse.json({ error: 'Plan okunamadı.' }, { status: 503 })
  return NextResponse.json({ planlar: data || [] })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = await req.json().catch(() => null) as { patientId?: string; route?: string; girdi?: Record<string, unknown> } | null
  const patientId = String(body?.patientId || '')
  const route = String(body?.route || '')
  const tanim = ozelAracBul(route)
  if (!tanim || !body?.girdi || typeof body.girdi !== 'object') {
    return NextResponse.json({ error: 'Araç yok.' }, { status: 400 })
  }
  if (!(await hastaSahibiMi(supabase, user.id, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const { data: profil } = await supabase.from('users').select('specialty').eq('id', user.id).maybeSingle()
  if (klinikSlugCoz(profil?.specialty) !== tanim.slug) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const girdi: Record<string, string> = {}
  for (const alan of tanim.alanlar) girdi[alan.id] = String(body.girdi[alan.id] ?? '').slice(0, 240)
  const bugun = new Date().toISOString().slice(0, 10)
  const sonuc = ozelAracCalistir(route, girdi, bugun)
  if ('hata' in sonuc) return NextResponse.json({ error: sonuc.hata }, { status: 400 })
  const portal = portalSatirlari(sonuc.vadeler, bugun)
  const { error } = await supabase.from('ozel_brans_plan').upsert({
    patient_id: patientId,
    doctor_id: user.id,
    slug: tanim.slug,
    arac: route,
    ozet: sonuc.ozet.slice(0, 800),
    portal_satir: portal,
    vadeler: sonuc.vadeler,
    acil: sonuc.acil,
    riza: sonuc.riza,
    girdi,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'doctor_id,patient_id,arac' })
  if (error) return NextResponse.json({ error: 'Plan yazılamadı.' }, { status: 503 })
  return NextResponse.json({ ok: true, portal, acil: sonuc.acil })
}
