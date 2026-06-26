import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getAdminContext(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const sb = getSupabase()
  const { data: { user }, error } = await sb.auth.getUser(authHeader.split(' ')[1])
  if (error || !user) return null
  const { data: m } = await sb.from('clinic_members').select('clinic_id').eq('user_id', user.id).eq('role', 'admin').eq('is_active', true).maybeSingle()
  if (!m) return null
  return { user, clinicId: m.clinic_id, sb }
}

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext(req)
  if (!ctx) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })
  const { data: clinic } = await ctx.sb.from('clinics').select('*').eq('id', ctx.clinicId).maybeSingle()
  return NextResponse.json({ success: true, data: clinic })
}

export async function PUT(req: NextRequest) {
  const ctx = await getAdminContext(req)
  if (!ctx) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })
  const body = await req.json()
  const allowed = ['name', 'city', 'phone', 'website', 'logo_url', 'specialty_focus']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) { if (body[key] !== undefined) updates[key] = body[key] }
  const { data, error } = await ctx.sb.from('clinics').update(updates).eq('id', ctx.clinicId).select().maybeSingle()
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}