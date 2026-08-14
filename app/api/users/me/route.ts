import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data: { user }, error } = await getSupabase().auth.getUser(authHeader.split(' ')[1])
  if (error || !user) return null
  return user
}

function deriveOnboardingCompleted(
  profile: Record<string, unknown> | null,
  meta: Record<string, unknown>
): boolean {
  if (meta.onboarding_completed === true) return true
  if (profile?.onboarding_completed === true) return true
  if (profile?.profession_type || meta.profession_type) return true
  if (profile?.specialty || meta.specialty) return true
  return false
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>

  const { data: profile, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  if (!profile) {
    const onboarding_completed = deriveOnboardingCompleted(null, meta)
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: meta.full_name || user.email?.split('@')[0] || '',
        profession_type: meta.profession_type || null,
        specialty: meta.specialty || null,
        onboarding_completed,
      },
    })
  }

  const onboarding_completed = deriveOnboardingCompleted(profile as Record<string, unknown>, meta)

  // Self-heal: profile has profession but flag never stuck — stamp it for next login.
  if (onboarding_completed && profile.onboarding_completed !== true) {
    void getSupabase()
      .from('users')
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (!meta.onboarding_completed) {
      void getSupabase().auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, onboarding_completed: true, profession_type: profile.profession_type || meta.profession_type },
      })
    }
  }

  const merged = {
    ...profile,
    full_name: profile.full_name || meta.full_name || (user.email || '').split('@')[0] || '',
    email: profile.email || user.email,
    profession_type: profile.profession_type || meta.profession_type || null,
    specialty: profile.specialty || meta.specialty || null,
    onboarding_completed,
  }
  return NextResponse.json({ success: true, data: merged })
}
