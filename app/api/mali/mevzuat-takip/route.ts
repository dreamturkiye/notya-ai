import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Mevzuat takip - coming soon
    return NextResponse.json({ success: true, data: { changes: [], lastChecked: new Date().toISOString() } })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}
