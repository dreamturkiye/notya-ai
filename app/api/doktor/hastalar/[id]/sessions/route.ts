import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ sessions: [] })
  const tok = auth.slice(7)
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user }, error } = await sb.auth.getUser(tok)
  if (error || !user) return NextResponse.json({ sessions: [] })
  try {
    const { data } = await sb.from('sessions')
      .select('id, created_at, notes')
      .eq('patient_id', params.id)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    return NextResponse.json({ sessions: data || [] })
  } catch {
    return NextResponse.json({ sessions: [] })
  }
}
