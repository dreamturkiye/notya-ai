import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth)
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { musteri_id, beyan_turu, son_gun, mesaj } = await req.json()
    await sb.from('mali_beyan_takvimi').insert({ musavir_id: user.id, musteri_id, beyan_turu, son_gun, hatirlatma_gonderildi: false })
    return NextResponse.json({ success: true, data: { mesaj: mesaj || 'Hatirlatma kaydedildi' } })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}
