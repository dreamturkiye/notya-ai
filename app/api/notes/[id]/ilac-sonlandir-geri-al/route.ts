// ============================================================
// NOTYA AI - API Route: Muayene notunun sonlandırdığı ilaçları geri al
// POST /api/notes/[id]/ilac-sonlandir-geri-al   { ilacIds: string[] }
// NOTYA-ILAC-SONLANDIR-01 (Kaan / Dr. Gökhan, 2026-09-25): onay sonrası "… ilaç listesinden
// sonlandırıldı. Geri al" satırının düğmesi. Yalnız bu notun sonlandırdığı satırlar yeniden aktif olur.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { ilacSonlandirmaGeriAl } from '@/lib/doktor/ilacSonlandir'

export const dynamic = 'force-dynamic'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const supabase = getSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ success: false, error: 'Geçersiz token' }, { status: 401 })

  const noteId = params?.id
  if (!noteId) return NextResponse.json({ success: false, error: 'Not id gerekli' }, { status: 400 })

  // HASTA-IZOLASYON-01: not bu hekimin; notun hastası da bu hekimin (seans patient_id tarayıcıdan da yazılabilir).
  const { data: not } = await supabase
    .from('notes')
    .select('id, sessions(patient_id)')
    .eq('id', noteId)
    .eq('doctor_id', user.id)
    .maybeSingle()
  const seans = (not ? (Array.isArray(not.sessions) ? not.sessions[0] : not.sessions) : null) as { patient_id?: string | null } | null
  const patientId = seans?.patient_id ? String(seans.patient_id) : ''
  if (!not || !patientId || !(await hastaSahibiMi(supabase, user.id, patientId))) {
    return NextResponse.json({ success: false, error: 'Not bulunamadı' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const ilacIds = Array.isArray(body?.ilacIds) ? (body.ilacIds as unknown[]).map(String) : []
  const sonuc = await ilacSonlandirmaGeriAl(supabase, { noteId, doctorId: user.id, patientId, ilacIds })
  if (sonuc.hata) return NextResponse.json({ success: false, error: sonuc.hata }, { status: 500 })
  return NextResponse.json({ success: true, geriAlinan: sonuc.geriAlinan })
}
