/**
 * NOTYA-OKUL-RAPOR-01 — "e-Okul'a iletildi" işaretleme kutusu üzerinde PATCH.
 * Gerçek bir e-Okul API entegrasyonu DEĞİL: hekimin kendi okul/veli iletişimini kaydettiği bir işarettir.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })
  const authH = request.headers.get('authorization')
  const token = authH?.startsWith('Bearer ') ? authH.slice(7) : undefined
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const eOkulaIletildi = body?.eOkulaIletildi === true

  const { data, error } = await supabase
    .from('istirahat_raporlari')
    .update({
      e_okula_iletildi: eOkulaIletildi,
      e_okula_iletildi_at: eOkulaIletildi ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 })

  return NextResponse.json({ ok: true, id: data.id })
}
