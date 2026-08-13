// ============================================================
// NOTYA AI - API Route: Tek Not
// GET/PUT /api/notes/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAccess, logNoteApproval } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  if (!token) return null
  try {
    const {
      data: { user },
    } = await getSupabase().auth.getUser(token)
    return user
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const supabase = getSupabase()
  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!note) return NextResponse.json({ success: false, error: 'Not bulunamadı' }, { status: 404 })

  try {
    await logAccess(user.id, 'note', params.id, req)
  } catch {
    // audit log hatası isteği bozmamalı
  }

  return NextResponse.json({ success: true, data: note })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const { action, ...updates } = body as { action?: string } & Record<string, unknown>

  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('notes')
    .select('id, doctor_id, approved_at')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ success: false, error: 'Not bulunamadı' }, { status: 404 })

  if (action === 'approve') {
    const { send_whatsapp, ...noteUpdates } = updates

    const { data: note, error } = await supabase
      .from('notes')
      .update({
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        ...noteUpdates,
      })
      .eq('id', params.id)
      .eq('doctor_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    try {
      await logNoteApproval(user.id, params.id, req)
    } catch {
      // audit log hatası onayı bozmamalı
    }

    if (send_whatsapp) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notes/whatsapp`, {
          method: 'POST',
          headers: {
            Authorization: req.headers.get('authorization') || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ noteId: params.id }),
        })
      } catch {
        // WhatsApp gönderimi başarısız olsa da onay geçerli
      }
    }

    return NextResponse.json({ success: true, data: note })
  }

  const { data: note, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: note })
}
