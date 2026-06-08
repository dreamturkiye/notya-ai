import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildFullName } from '@/lib/userProfile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TITLES = ['Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.']
const GENDERS = ['male', 'female']
const PREFS = ['hocam', 'named_hocam', 'first_name_only']

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.split(' ')[1])
  if (error || !user) return null
  return user
}

export async function POST(req: NextRequest) {
  return upsertProfile(req)
}

export async function PUT(req: NextRequest) {
  return upsertProfile(req)
}

async function upsertProfile(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  const body = await req.json()
  const {
    first_name,
    last_name,
    title,
    specialty,
    hospital,
    gender,
    addressing_preference,
    onboarding_completed,
  } = body

  if (title && !TITLES.includes(title)) {
    return NextResponse.json({ success: false, error: 'Geçersiz unvan' }, { status: 400 })
  }
  if (gender && !GENDERS.includes(gender)) {
    return NextResponse.json({ success: false, error: 'Geçersiz cinsiyet' }, { status: 400 })
  }
  if (addressing_preference && !PREFS.includes(addressing_preference)) {
    return NextResponse.json({ success: false, error: 'Geçersiz hitap tercihi' }, { status: 400 })
  }

  const full_name = buildFullName({
    first_name,
    last_name,
    full_name: user.user_metadata?.full_name,
  }) || user.email?.split('@')[0] || 'Doktor'

  const payload: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    full_name,
    updated_at: new Date().toISOString(),
  }

  if (first_name !== undefined) payload.first_name = first_name
  if (last_name !== undefined) payload.last_name = last_name
  if (title !== undefined) payload.title = title
  if (specialty !== undefined) payload.specialty = specialty
  if (hospital !== undefined) payload.hospital = hospital
  if (gender !== undefined) payload.gender = gender
  if (addressing_preference !== undefined) payload.addressing_preference = addressing_preference
  if (onboarding_completed !== undefined) payload.onboarding_completed = Boolean(onboarding_completed)

  const { data, error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
