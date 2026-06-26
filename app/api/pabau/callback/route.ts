import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { encrypt } from '@/lib/pabau/crypto'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const signedState = searchParams.get('state')

  if (!code || !signedState) {
    return NextResponse.redirect(new URL('/dashboard/doktor?pabau=error', req.url))
  }

  try {
    // Validate state
    const [state, hmac] = signedState.split('.')
    const expectedHmac = createHmac('sha256', process.env.PABAU_STATE_SECRET || 'dev-secret')
      .update(state)
      .digest('hex')
    if (hmac !== expectedHmac) throw new Error('Invalid state signature')

    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) throw new Error('State expired')
    const userId = stateData.userId

    // Exchange code for tokens
    const tokenRes = await fetch('https://app.pabau.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.PABAU_CLIENT_ID,
        client_secret: process.env.PABAU_CLIENT_SECRET,
        redirect_uri: process.env.PABAU_REDIRECT_URI
      })
    })

    if (!tokenRes.ok) throw new Error('Token exchange failed')
    const tokenData = await tokenRes.json()

    const secret = process.env.PABAU_TOKEN_SECRET || 'dev-token-secret'
    const accessEncrypted = encrypt(tokenData.access_token, secret)
    const refreshEncrypted = encrypt(tokenData.refresh_token || '', secret)
    const pabauAccountId = tokenData.api_key || tokenData.account_id || userId

    const sb = getSupabase()

    // Upsert pabau_connections
    await sb.from('pabau_connections').upsert({
      user_id: userId,
      access_token_encrypted: accessEncrypted,
      refresh_token_encrypted: refreshEncrypted,
      pabau_account_id: pabauAccountId,
      pabau_user_email: tokenData.email || null,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      last_synced_at: new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    // Update users table
    await sb.from('users').update({
      pabau_connected: true,
      updated_at: new Date().toISOString()
    }).eq('id', userId)

    return NextResponse.redirect(new URL('/dashboard/doktor?pabau=connected', req.url))
  } catch (err) {
    console.error('Pabau OAuth callback error:', err)
    return NextResponse.redirect(new URL('/dashboard/doktor?pabau=error', req.url))
  }
}