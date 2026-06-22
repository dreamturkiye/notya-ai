// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Columns that actually exist in the users table
const VALID_USER_COLUMNS = new Set([
  'email', 'full_name', 'specialty', 'clinic_name', 'subscription_tier',
  'subscription_status', 'whatsapp_number', 'whatsapp_enabled',
  'profession_type', 'unvan', 'buro_adi', 'sehir', 'updated_at'
])

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    let userEmail: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1])
      userId = user?.id || null
      userEmail = user?.email || null
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      profession_type, unvan, buro_adi, uzmanlik_alani, sehir,
      full_name, gender, addressing_preference,
      title, specialty, hospital,
      baro, uzmanlik, yil,
      // Qwen onboarding form fields (camelCase) - strip these
      firstName, lastName, addressingPreference,
    } = body

    // Build DB payload - ONLY valid columns
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (profession_type) updatePayload.profession_type = profession_type
    if (full_name) updatePayload.full_name = full_name
    if (firstName || lastName) updatePayload.full_name = [firstName, lastName].filter(Boolean).join(' ') || full_name
    if (unvan) updatePayload.unvan = unvan
    if (buro_adi) updatePayload.buro_adi = buro_adi
    if (sehir) updatePayload.sehir = sehir
    if (uzmanlik_alani) updatePayload.specialty = uzmanlik_alani
    if (specialty && profession_type === 'doktor') updatePayload.specialty = specialty
    if (uzmanlik && profession_type === 'avukat') updatePayload.specialty = uzmanlik

    // Store extra metadata in auth user_metadata (no DB column needed)
    if (gender || addressing_preference || addressingPreference || title || baro || yil) {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          gender: gender || null,
          addressing_preference: addressing_preference || addressingPreference || null,
          title: title || null,
          baro: baro || null,
          yil_deneyim: yil || null,
          profession_type,
          onboarding_completed: true,
        }
      })
    }

    // Check if user row exists
    const { data: existing } = await supabase.from('users').select('id').eq('id', userId).single()

    let result
    if (existing) {
      const { data, error } = await supabase.from('users').update(updatePayload).eq('id', userId).select().single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase.from('users').insert({
        id: userId,
        email: userEmail || '',
        ...updatePayload
      }).select().single()
      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, data: { ...result, onboarding_completed: true } })
  } catch (error) {
    console.error('[profile]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}