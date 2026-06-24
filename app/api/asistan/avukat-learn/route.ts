import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth.split(' ')[1])
    if (ae || !user) return NextResponse.json({ success: false }, { status: 401 })

    const { correctionType, original, corrected, persona, branch } = await req.json()

    const { data: prefs } = await sb
      .from('avukat_preferences')
      .select('*')
      .eq('avukat_id', user.id)
      .single()

    const corrections = (prefs?.correction_history as Array<Record<string, unknown>>) || []
    const preferredKanunlar = (prefs?.preferred_kanunlar as Record<string, string>) || {}
    const branchStyle = (prefs?.branch_style as Record<string, string>) || {}

    const existing = corrections.findIndex(
      (c: Record<string, unknown>) => c.original === original && c.type === correctionType
    )
    if (existing >= 0) {
      corrections[existing].count = ((corrections[existing].count as number) || 1) + 1
      corrections[existing].corrected = corrected
    } else {
      corrections.push({ type: correctionType, original, corrected, persona, branch, count: 1 })
    }

    if (correctionType === 'kanun') preferredKanunlar[String(original)] = String(corrected)
    if (correctionType === 'style' && branch) branchStyle[String(branch)] = String(corrected)

    if (!prefs) {
      await sb.from('avukat_preferences').insert({
        avukat_id: user.id,
        correction_history: corrections,
        preferred_kanunlar: preferredKanunlar,
        branch_style: branchStyle,
        sessions_completed: 1,
        last_session_at: new Date().toISOString()
      })
    } else {
      await sb.from('avukat_preferences').update({
        correction_history: corrections.slice(-50),
        preferred_kanunlar: preferredKanunlar,
        branch_style: branchStyle,
        sessions_completed: (prefs.sessions_completed as number || 0) + 1,
        last_session_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('avukat_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[avukat-learn]', e)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
