import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAdminClinic(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const sb = getSupabase()
  const { data: { user }, error } = await sb.auth.getUser(authHeader.split(' ')[1])
  if (error || !user) return null

  const { data: membership } = await sb
    .from('clinic_members')
    .select('clinic_id, role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) return null
  return { user, clinicId: membership.clinic_id, sb }
}

export async function GET(req: NextRequest) {
  const admin = await getAdminClinic(req)
  if (!admin) return NextResponse.json({ success: false, error: 'Klinik admin yetkisi gerekli' }, { status: 403 })

  const { user, clinicId, sb } = admin

  const { data: clinic } = await sb.from('clinics').select('*').eq('id', clinicId).maybeSingle()
  const { data: members } = await sb
    .from('clinic_members')
    .select('id, role, specialty, is_active, joined_at, users(id, full_name, email, account_type)')
    .eq('clinic_id', clinicId)

  const { data: adminProfile } = await sb.from('users').select('full_name').eq('id', user.id).maybeSingle()

  return NextResponse.json({
    success: true,
    data: { clinic, members: members || [], adminName: adminProfile?.full_name || user.email }
  })
}