import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'
import { listDocuments } from '@/lib/vault/service'
import { nushaNotCoz } from '@/lib/klinik/ikiNusha'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!(await hastaSahibiMi(supabase, user.id, patientId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  const { data } = await supabase.from('users').select('specialty').eq('id', user.id).maybeSingle()
  const specialty = data && typeof data === 'object' && 'specialty' in data ? String(data.specialty || '') : ''
  if (!klinikSlugCoz(specialty)) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }
  try {
    const belgeler = await listDocuments({ supabase }, user.id, { patientId })
    const nushalar = belgeler.flatMap((b) => {
      const coz = nushaNotCoz(b.notes)
      return coz ? [{ id: b.id, rol: coz.rol, iso: coz.iso, seansId: coz.seansId }] : []
    })
    return NextResponse.json({ nushalar })
  } catch {
    return NextResponse.json({ error: 'Nüshalar okunamadı.' }, { status: 503 })
  }
}
