// ============================================================
// POST/PUT /api/users/profile — Create or update doctor profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1])
  return user
}

const VALID_TITLES = ['Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.']
const VALID_GENDERS = ['male', 'female']
const VALID_PREFS = ['hocam', 'named_hocam', 'first_name_only']

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

  const payload: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    updated_at: new Date().toISOString(),
  }

  if (first_name != null) payload.first_name = String(first_name).trim()
  if (last_name != null) payload.last_name = String(last_name).trim()
  if (title != null) {
    if (!VALID_TITLES.includes(title)) {
      return NextResponse.json({ success: false, error: 'Geçersiz unvan' }, { status: 400 })
    }
    payload.title = title
  }
  if (specialty != null) payload.specialty = String(specialty)
  if (hospital != null) {
    payload.hospital = String(hospital).trim()
    payload.clinic_name = String(hospital).trim()
  }
  if (gender != null) {
    if (!VALID_GENDERS.includes(gender)) {
      return NextResponse.json({ success: false, error: 'Geçersiz cinsiyet' }, { status: 400 })
    }
    payload.gender = gender
  }
  if (addressing_preference != null) {
    if (!VALID_PREFS.includes(addressing_preference)) {
      return NextResponse.json({ success: false, error: 'Geçersiz hitap tercihi' }, { status: 400 })
    }
    payload.addressing_preference = addressing_preference
  }
  if (onboarding_completed != null) payload.onboarding_completed = Boolean(onboarding_completed)

  if (payload.first_name && payload.last_name) {
    payload.full_name = `${payload.first_name} ${payload.last_name}`
  } else if (payload.first_name) {
    payload.full_name = payload.first_name
  } else if (!body.full_name) {
    payload.full_name = user.email?.split('@')[0] || 'Doktor'
  }

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
