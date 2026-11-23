// ============================================================
// NOTYA AI - API Route: Not Onaylama
// POST /api/notes/[id]/approve
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notOnayla } from '@/lib/doktor/notOnayla'

export const dynamic = 'force-dynamic'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  if (!token) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  const supabase = getSupabase()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Geçersiz token' }, { status: 401 })
  }

  const noteId = params?.id
  if (!noteId) {
    return NextResponse.json({ success: false, error: 'Not id gerekli' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  return notOnayla(supabase, { noteId, doktorId: user.id, onaylayanId: user.id, govde: body, ogrenme: true })
}
