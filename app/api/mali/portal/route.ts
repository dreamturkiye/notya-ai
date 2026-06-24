import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })
    const sb = getSupabase()
    // Look up token in mali_portal_tokens
    const { data: pt, error: te } = await sb.from('mali_portal_tokens').select('*').eq('token', token).eq('active', true).single()
    if (te || !pt) return NextResponse.json({ error: 'Gecersiz veya suresi dolmus link' }, { status: 404 })
    // Check expiry
    if (pt.expires_at && new Date(pt.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Bu linkin suresi dolmus. Mali musavirinizden yeni link isteyin.' }, { status: 410 })
    }
    // Fetch musteri
    const { data: musteri } = await sb.from('mali_musteriler').select('sirket_adi,yetkili_kisi,faaliyet_alani,sirket_turu,email,telefon').eq('id', pt.musteri_id).single()
    if (!musteri) return NextResponse.json({ error: 'Musteri bulunamadi' }, { status: 404 })
    // Fetch beyan takvimi
    const { data: beyanlar } = await sb.from('mali_beyan_takvimi').select('id,beyan_turu,son_gun,tamamlandi,aciklama,kanun_dayanagi').eq('musteri_id', pt.musteri_id).order('son_gun', { ascending: true })
    // Log access
    await sb.from('mali_portal_tokens').update({ last_accessed: new Date().toISOString(), access_count: (pt.access_count || 0) + 1 }).eq('token', token)
    return NextResponse.json({ success: true, data: { musteri, beyanlar: beyanlar || [] } })
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
