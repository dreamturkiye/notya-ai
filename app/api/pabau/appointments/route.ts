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

  const today = new Date().toISOString().split('T')[0]
  const baseUrl = `https://api.oauth.pabau.com/${conn.pabau_account_id}`

  const apptRes = await fetch(
    `${baseUrl}/appointments?date_from=${today}&date_to=${today}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!apptRes.ok) return NextResponse.json({ success: false, error: 'Pabau randevu verisi alinamadi' }, { status: 502 })

  const apptData = await apptRes.json()
  const appointments = apptData.data || apptData || []

  // Enrich each appointment with patient allergies + medical conditions
  const enriched = await Promise.all(
    appointments.slice(0, 20).map(async (appt: Record<string, unknown>) => {
      try {
        const clientId = appt.client_id || appt.patient_id
        if (!clientId) return appt
        const [allergyRes, conditionRes] = await Promise.all([
          fetch(`${baseUrl}/clients/${clientId}/allergies`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${baseUrl}/clients/${clientId}/medical-conditions`, { headers: { Authorization: `Bearer ${accessToken}` } })
        ])
        const allergies = allergyRes.ok ? (await allergyRes.json()).data || [] : []
        const conditions = conditionRes.ok ? (await conditionRes.json()).data || [] : []
        return { ...appt, allergies, medical_conditions: conditions }
      } catch { return appt }
    })
  )

  // Update last_synced_at
  await sb.from('pabau_connections').update({ last_synced_at: new Date().toISOString() }).eq('user_id', user.id)

  return NextResponse.json({ success: true, data: enriched })
}