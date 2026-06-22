// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Get user from Bearer token
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1])
      userId = user?.id || null
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      profession_type, unvan, buro_adi, uzmanlik_alani, sehir,
      full_name, gender, addressing_preference,
      // doktor fields
      title, specialty, hospital,
      // avukat fields
      baro, uzmanlik, yil
    } = body

    // Build update payload -- only columns that exist in DB
    const updatePayload: Record<string, unknown> = {
      profession_type,
      full_name,
      updated_at: new Date().toISOString(),
    }
    if (unvan) updatePayload.unvan = unvan
    if (buro_adi) updatePayload.buro_adi = buro_adi
    if (sehir) updatePayload.sehir = sehir
    if (uzmanlik_alani) updatePayload.specialty = uzmanlik_alani
    if (specialty && profession_type === 'doktor') updatePayload.specialty = specialty
    if (uzmanlik && profession_type === 'avukat') updatePayload.specialty = uzmanlik

    // Check if user row exists
    const { data: existing } = await supabase.from('users').select('id').eq('id', userId).single()

    let result
    if (existing) {
      const { data, error } = await supabase.from('users').update(updatePayload).eq('id', userId).select().single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase.from('users').insert({ id: userId, email: '', ...updatePayload }).select().single()
      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[profile]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
