import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getUser(req: NextRequest) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!auth) return null
  const sb = getSupabase()
  const { data: { user }, error } = await sb.auth.getUser(auth)
  if (error || !user) return null
  return user
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const id = req.nextUrl.searchParams.get('id')
    let q = sb.from('mali_musteriler').select('*').eq('musavir_id', user.id).eq('is_active', true).order('sirket_adi')
    if (id) q = (q as any).eq('id', id)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { sirket_adi, vergi_no, yetkili_kisi, telefon, email, faaliyet_alani, sirket_turu, notlar } = body
    if (!sirket_adi?.trim()) return NextResponse.json({ error: 'Sirket adi gerekli' }, { status: 400 })
    const sb = getSupabase()
    const { data, error } = await sb.from('mali_musteriler').insert({
      musavir_id: user.id,
      sirket_adi: sirket_adi.trim(),
      vergi_no: vergi_no?.trim() || null,
      yetkili_kisi: yetkili_kisi?.trim() || null,
      telefon: telefon?.trim() || null,
      email: email?.trim() || null,
      faaliyet_alani: faaliyet_alani?.trim() || null,
      sirket_turu: sirket_turu || 'sahis',
      notlar: notlar?.trim() || null,
      is_active: true
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    const sb = getSupabase()
    const { data, error } = await sb.from('mali_musteriler')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).eq('musavir_id', user.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    const sb = getSupabase()
    const { error } = await sb.from('mali_musteriler')
      .update({ is_active: false }).eq('id', id).eq('musavir_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
