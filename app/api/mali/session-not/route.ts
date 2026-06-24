import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { musteriId, notlar, sessionDate, sessionType } = await req.json()
    if (!notlar?.trim()) return NextResponse.json({ error: 'Not gerekli' }, { status: 400 })
    const { data, error } = await sb.from('mali_session_notes').insert({
      musavir_id: user.id,
      musteri_id: musteriId || null,
      notlar: notlar.trim(),
      session_date: sessionDate || new Date().toISOString(),
      session_type: sessionType || 'genel'
    }).select().single()
    if (error) return NextResponse.json({ success: true, data: { id: crypto.randomUUID(), notlar } })
    return NextResponse.json({ success: true, data })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}
