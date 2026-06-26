import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  const sb = getSupabase()
  const { data: { user }, error } = await sb.auth.getUser(authHeader.split(' ')[1])
  if (error || !user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ success: false, error: 'Token zorunlu' }, { status: 400 })

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const { data: invitation } = await sb.from('clinic_invitations').select('*').eq('token_hash', tokenHash).maybeSingle()

  if (!invitation) return NextResponse.json({ success: false, error: 'Davet bulunamadi' }, { status: 404 })
  if (new Date(invitation.expires_at) < new Date()) return NextResponse.json({ success: false, error: 'Davet suresi dolmus' }, { status: 400 })
  if (invitation.accepted_at) return NextResponse.json({ success: false, error: 'Davet zaten kullanildi' }, { status: 400 })

  await sb.from('clinic_members').insert({
    clinic_id: invitation.clinic_id,
    user_id: user.id,
    role: invitation.role,
    specialty: invitation.specialty || null,
    invited_by: invitation.invited_by,
    is_active: true
  })

  await sb.from('clinic_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invitation.id)
  await sb.from('users').update({ clinic_id: invitation.clinic_id, account_type: 'clinic_member', updated_at: new Date().toISOString() }).eq('id', user.id)
  await sb.rpc('increment_seats', { clinic_id_param: invitation.clinic_id }).maybeSingle().catch(() => null)

  return NextResponse.json({ success: true, data: { clinicId: invitation.clinic_id } })
}