import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, randomBytes } from 'crypto'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await getSupabase().auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    timestamp: Date.now(),
    nonce: randomBytes(16).toString('hex')
  })).toString('base64')

  const hmac = createHmac('sha256', process.env.PABAU_STATE_SECRET || 'dev-secret')
    .update(state)
    .digest('hex')

  const signedState = `${state}.${hmac}`

  const params = new URLSearchParams({
    client_id: process.env.PABAU_CLIENT_ID || 'dev-client-id',
    redirect_uri: process.env.PABAU_REDIRECT_URI || 'http://localhost:3000/api/pabau/callback',
    response_type: 'code',
    scope: 'read:patients read:appointments read:medical_conditions read:allergies read:drugs',
    state: signedState
  })

  const authUrl = `https://app.pabau.com/oauth/authorize?${params.toString()}`
  return NextResponse.json({ success: true, authUrl })
}