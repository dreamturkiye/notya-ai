// app/api/asistan/mali-learn/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer '))
      return NextResponse.json({ success: false }, { status: 401 })

    const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1])
    if (!user) return NextResponse.json({ success: false }, { status: 401 })

    const { correctionType, original, corrected, actionId } = await req.json()

    // Mark action as corrected
    if (actionId) {
      await supabase.from('mali_actions').update({
        was_corrected: true,
        correction_data: { original, corrected, type: correctionType }
      }).eq('id', actionId)
    }

    // Load mali preferences
    const { data: prefs } = await supabase
      .from('mali_preferences')
      .select('*').eq('musavir_id', user.id).single()

    const corrections = (prefs?.correction_history as Array<Record<string, unknown>>) || []

    // Find existing or add new correction
    const existing = corrections.findIndex(
      (c: Record<string, unknown>) => c.original === original && c.type === correctionType
    )
    if (existing >= 0) {
      corrections[existing].count = ((corrections[existing].count as number) || 1) + 1
      corrections[existing].corrected = corrected
    } else {
      corrections.push({ type: correctionType, original, corrected, count: 1 })
    }

    // Update preferred mevzuat if mevzuat type correction
    const preferredMevzuat = (prefs?.preferred_mevzuat as Record<string, string>) || {}
    if (correctionType === 'mevzuat' || correctionType === 'kanun') {
      preferredMevzuat[String(original)] = String(corrected)
    }

    if (!prefs) {
      await supabase.from('mali_preferences').insert({
        musavir_id: user.id,
        correction_history: corrections,
        preferred_mevzuat: preferredMevzuat,
        sessions_completed: 0
      })
    } else {
      await supabase.from('mali_preferences').update({
        correction_history: corrections.slice(-50),
        preferred_mevzuat: preferredMevzuat,
        updated_at: new Date().toISOString()
      }).eq('musavir_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mali-learn]', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}