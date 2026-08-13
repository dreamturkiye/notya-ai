import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken, hashPortalToken } from '@/lib/mali/musteriPortalEngine'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş link' }, { status: 401 })

    const sb = getSupabase()
    // portal-admin only persists the hash, never the plain token.
    const { data: pt, error: te } = await sb
      .from('mali_portal_tokens')
      .select('*')
      .eq('token_hash', hashPortalToken(token))
      .eq('is_active', true)
      .single()
    if (te || !pt) return NextResponse.json({ error: 'Geçersiz veya iptal edilmiş link' }, { status: 404 })

    if (pt.expires_at && new Date(pt.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Bu linkin süresi dolmuş. Mali müşavirinizden yeni link isteyin.' }, { status: 410 })
    }

    const { data: musteri } = await sb
      .from('mali_musteriler')
      .select('sirket_adi,yetkili_kisi,faaliyet_alani,sirket_turu,email,telefon')
      .eq('id', pt.musteri_id)
      .single()
    if (!musteri) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })

    const { data: beyanlar } = await sb
      .from('mali_beyan_takvimi')
      .select('id,beyan_turu,son_gun,tamamlandi,aciklama,kanun_dayanagi')
      .eq('musteri_id', pt.musteri_id)
      .order('son_gun', { ascending: true })

    await sb
      .from('mali_portal_tokens')
      .update({ last_accessed: new Date().toISOString(), access_count: (pt.access_count || 0) + 1 })
      .eq('id', pt.id)

    return NextResponse.json({ success: true, data: { musteri, beyanlar: beyanlar || [] } })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}
