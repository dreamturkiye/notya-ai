import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/pabau/crypto'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data: { user }, error } = await getSupabase().auth.getUser(authHeader.split(' ')[1])
  if (error || !user) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const sb = getSupabase()
  const { data: conn } = await sb
    .from('pabau_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!conn) return NextResponse.json({ success: false, error: 'Pabau baglantisi bulunamadi' }, { status: 404 })

  const secret = process.env.PABAU_TOKEN_SECRET || 'dev-token-secret'
  const accessToken = decrypt(conn.access_token_encrypted, secret)

  const url = `https://api.oauth.pabau.com/${conn.pabau_account_id}/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })

  if (!res.ok) return NextResponse.json({ success: false, error: 'Pabau hasta verisi alinamadi' }, { status: 502 })

  const data = await res.json()
  return NextResponse.json({ success: true, data: data.data || data })
}