import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'crypto'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  const { clinicId, sb } = ctx
  const { data: members } = await sb.from('clinic_members').select('id, role, specialty, is_active, joined_at, users(id, full_name, email)').eq('clinic_id', clinicId)
  const { data: invitations } = await sb.from('clinic_invitations').select('id, email, role, expires_at, created_at').eq('clinic_id', clinicId).is('accepted_at', null)
  return NextResponse.json({ success: true, data: { members: members || [], pendingInvitations: invitations || [] } })
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext(req)
  if (!ctx) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })
  const { user, clinicId, sb } = ctx
  const body = await req.json()
  const { email, specialty, role } = body
  if (!email || !role) return NextResponse.json({ success: false, error: 'Email ve rol zorunlu' }, { status: 400 })

  const { data: clinic } = await sb.from('clinics').select('seat_count, seats_used').eq('id', clinicId).maybeSingle()
  if (clinic && clinic.seats_used >= clinic.seat_count) {
    return NextResponse.json({ success: false, error: 'Koltuk limiti doldu' }, { status: 403 })
  }

  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await sb.from('clinic_invitations').insert({ clinic_id: clinicId, email, role, specialty, token_hash: tokenHash, invited_by: user.id, expires_at: expiresAt })
  return NextResponse.json({ success: true, data: { token, message: 'Davet olusturuldu' } })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAdminContext(req)
  if (!ctx) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })
  const { clinicId, sb } = ctx
  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ success: false, error: 'user_id zorunlu' }, { status: 400 })
  await sb.from('clinic_members').update({ is_active: false }).eq('clinic_id', clinicId).eq('user_id', user_id)
  await sb.rpc('decrement_seats', { clinic_id_param: clinicId }).maybeSingle().catch(() => {
    sb.from('clinics').update({ seats_used: 0 }).eq('id', clinicId)
  })
  return NextResponse.json({ success: true })
}