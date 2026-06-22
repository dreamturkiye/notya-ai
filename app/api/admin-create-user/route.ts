import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== 'notya-admin-2026') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const body = await req.json()
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.email, password: body.password, email_confirm: true,
    user_metadata: { full_name: body.full_name }
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
  const userId = authData.user.id
  const { error: profileError } = await supabase.from('users').upsert({
    id: userId, email: body.email, full_name: body.full_name,
    first_name: body.first_name || '', last_name: body.last_name || '',
    specialty: body.specialty || 'mali_musavirlik',
    subscription_tier: 'pro', subscription_status: 'active', onboarding_completed: true,
    kvkk_consent_at: new Date().toISOString(), kvkk_consent_version: '1.0'
  })
  if (profileError) return NextResponse.json({ error: profileError.message, userId }, { status: 500 })
  return NextResponse.json({ success: true, userId, email: body.email })
}