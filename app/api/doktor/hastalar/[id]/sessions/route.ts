import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ sessions: [] })
  const tok = auth.slice(7)
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
  const { data: { user }, error } = await sb.auth.getUser(tok)
  if (error || !user) return NextResponse.json({ sessions: [] })
  try {
    // QA-2026-09-06 bulgu #4: 'notes' parantezsiz yazıldığı için kolon sanılıyordu → sorgu
    // patlıyor, catch boş liste döndürüyordu — Muayene Geçmişi HER hastada boş görünüyordu.
    // Doğrusu ilişki gömme: notes(...). Sessiz catch de artık loglar.
    const { data, error: qErr } = await sb.from('sessions')
      .select('id, created_at, notes(id, approved_at, basvuru_yakinmasi, content_tani, content_degerlendirme)')
      .eq('patient_id', params.id)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (qErr) console.error('hasta sessions sorgu hatasi:', qErr.message)
    return NextResponse.json({ sessions: data || [] })
  } catch {
    return NextResponse.json({ sessions: [] })
  }
}
