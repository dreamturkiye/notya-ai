/**
 * NOTYA-RANDEVU-01 — çalışma saatleri: haftalık şablon + slot süresi.
 * GET creates the default row on first read (a doctor who never touched settings still gets
 * sane 09:00–18:00 weekday hours from the migration default). PATCH replaces the whole week —
 * a doctor edits the schedule as one shape, not day by day.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const { data } = await supabase
    .from('doktor_calisma_saatleri')
    .select('*')
    .eq('doktor_id', doktorId)
    .maybeSingle()

  if (data) return NextResponse.json({ calismaSaatleri: data })

  const { data: yeni, error } = await supabase
    .from('doktor_calisma_saatleri')
    .insert({ doktor_id: doktorId })
    .select()
    .single()
  if (error) return NextResponse.json({ error: 'Çalışma saatleri alınamadı.' }, { status: 500 })
  return NextResponse.json({ calismaSaatleri: yeni })
}

export async function PATCH(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { gunler, slotDakika } = body as { gunler?: unknown; slotDakika?: number }
  if (!gunler || typeof gunler !== 'object') {
    return NextResponse.json({ error: 'gunler alanı zorunludur.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('doktor_calisma_saatleri')
    .upsert({ doktor_id: doktorId, gunler, slot_dakika: slotDakika || 20, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Çalışma saatleri kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ calismaSaatleri: data })
}
