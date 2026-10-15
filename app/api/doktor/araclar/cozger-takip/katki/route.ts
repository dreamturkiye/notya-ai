/**
 * NOTYA-OKUL-RAPOR-01 — ÇÖZGER kurul katkısı: her kurul üyesi doktor KENDİ muayene bulgusunu, KENDİ
 * hasta kaydı için yapılandırılmış şekilde ekler; ortak başvuruya basvuruId (paylaşılan, opak bir kimlik)
 * ile bağlanır. HASTA-IZOLASYON-01: bu doktorun hasta sahipliği (hastaId kendi patients satırı) HER
 * koşulda doğrulanır — basvuruId başka bir doktorun başvurusu olsa da bu katkı satırı YİNE yazarının
 * kendi doctor_id + patient_id'siyle korunur; başka doktorun hasta verisine yeni bir erişim yolu AÇILMAZ.
 *
 * Kurul üyeleri arasında basvuruId'nin nasıl paylaşılacağı (davet/bildirim akışı — Konsültasyonlar aracına
 * benzer bir uzantı olabilir) bu PR'ın kapsamı DIŞINDADIR: docs/OPEN-COMMITMENTS.md § NOTYA-OKUL-RAPOR-01.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })
  const authH = request.headers.get('authorization')
  const token = authH?.startsWith('Bearer ') ? authH.slice(7) : undefined
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const basvuruId = String(body?.basvuruId || '')
  const hastaId = String(body?.hastaId || '')
  const brans = String(body?.brans || '').trim().slice(0, 80)
  const bulgu = String(body?.bulgu || '').trim().slice(0, 2000)
  if (!basvuruId || !hastaId || !brans || !bulgu) {
    return NextResponse.json({ error: 'Eksik parametreler.' }, { status: 400 })
  }
  if (!(await hastaSahibiMi(supabase, user.id, hastaId))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('cozger_kurul_katkilari')
    .insert({ basvuru_id: basvuruId, doctor_id: user.id, patient_id: hastaId, brans, bulgu })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ katki: data })
}
