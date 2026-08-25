// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    let userEmail: string | null = null
    let existingMeta: Record<string, unknown> = {}
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await getSupabase().auth.getUser(authHeader.split(' ')[1])
      userId = user?.id || null
      userEmail = user?.email || null
      existingMeta = (user?.user_metadata as Record<string, unknown>) || {}
    }
    if (!userId) return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })

    const body = await req.json()
    const { profession_type, unvan, büro_adi, uzmanlik_alani, sehir, full_name, plan, trial_start,
            gender, addressing_preference, title, specialty, hospital, baro, uzmanlik, yil,
            firstName, lastName, addressingPreference } = body

    // Only write columns that exist in the DB users table
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      onboarding_completed: true,
    }
    if (profession_type) updatePayload.profession_type = profession_type
    if (full_name) updatePayload.full_name = full_name
    if (firstName || lastName) updatePayload.full_name = [firstName, lastName].filter(Boolean).join(' ') || full_name
    if (unvan) updatePayload.unvan = unvan
    if (büro_adi) updatePayload.büro_adi = büro_adi
    if (sehir) updatePayload.sehir = sehir
    if (uzmanlik_alani) updatePayload.specialty = uzmanlik_alani
    if (specialty && profession_type === 'doktor') updatePayload.specialty = specialty
    if (specialty && (profession_type === 'klinik-uzman' || profession_type === 'saglik-uzmani' || profession_type === 'mali' || profession_type === 'psikolog')) {
      updatePayload.specialty = specialty
    }
    if (uzmanlik && profession_type === 'avukat') updatePayload.specialty = uzmanlik
    if (plan) updatePayload.plan = plan
    if (trial_start) updatePayload.trial_start = trial_start

    // Always stamp auth metadata so login redirects don't bounce to onboarding again.
    await getSupabase().auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        gender: gender || existingMeta.gender || null,
        addressing_preference:
          addressing_preference ||
          addressingPreference ||
          existingMeta.addressing_preference ||
          null,
        title: title || existingMeta.title || null,
        baro: baro || existingMeta.baro || null,
        yil: yil || existingMeta.yil || null,
        hospital: hospital || existingMeta.hospital || null,
        specialty: specialty || uzmanlik || existingMeta.specialty || null,
        profession_type: profession_type || existingMeta.profession_type || null,
        onboarding_completed: true,
      },
    })

    const { data: existing } = await getSupabase().from('users').select('id').eq('id', userId).single()
    let result
    if (existing) {
      const { data, error } = await getSupabase().from('users').update(updatePayload).eq('id', userId).select().single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await getSupabase().from('users').insert({ id: userId, email: userEmail || '', ...updatePayload }).select().single()
      if (error) throw error
      result = data
    }
    return NextResponse.json({ success: true, data: { ...result, onboarding_completed: true } })
  } catch (error) {
    console.error('[profile]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
