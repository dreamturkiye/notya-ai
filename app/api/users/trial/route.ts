import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tok = auth.slice(7)
  const { data: { user }, error } = await sb().auth.getUser(tok)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trialStart = new Date()
  const trialEnd = new Date(trialStart)
  trialEnd.setDate(trialEnd.getDate() + 15)

  // Store trial in auth metadata
  await sb().auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      plan: 'professional',
      trial_start: trialStart.toISOString(),
      trial_ends: trialEnd.toISOString(),
      onboarding_completed: true,
    }
  })

  // Also store in users table if it has the columns
  try {
    await sb().from('users').upsert({
      id: user.id,
      email: user.email,
      plan: 'professional',
      trial_ends: trialEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: false })
  } catch { /* column may not exist yet - metadata is source of truth */ }

  return NextResponse.json({
    ok: true,
    plan: 'professional',
    trial_start: trialStart.toISOString(),
    trial_ends: trialEnd.toISOString(),
    days_remaining: 15,
  })
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ active: false })
  const tok = auth.slice(7)
  const { data: { user } } = await sb().auth.getUser(tok)
  if (!user) return NextResponse.json({ active: false })

  const meta = user.user_metadata || {}
  if (!meta.trial_ends) return NextResponse.json({ active: false, plan: meta.plan || 'none' })

  const now = new Date()
  const end = new Date(meta.trial_ends)
  const active = end > now
  const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000))

  return NextResponse.json({ active, plan: meta.plan, trial_ends: meta.trial_ends, days_remaining: days })
}
