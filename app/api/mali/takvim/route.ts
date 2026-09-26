import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBeyanlarimForMusteri, getKritikBeyanlar, formatTelegramAlert } from '@/lib/mali/beyanTakvimiEngine'
import { telegramGonder } from '@/lib/uyari/telegram'

function getSupabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }) }

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const musteriId = searchParams.get('musteriId')
    const sendAlert = searchParams.get('sendAlert') === 'true'

    let müşteriler: any[] = []

    if (musteriId) {
      const { data } = await getSupabase().from('mali_musteriler').select('*').eq('id', musteriId).eq('musavir_id', user.id).maybeSingle()
      if (data) müşteriler = [data]
    } else {
      const { data } = await getSupabase().from('mali_musteriler').select('*').eq('musavir_id', user.id)
      müşteriler = data || []
    }

    const allItems: any[] = []
    for (const m of müşteriler) {
      const items = getBeyanlarimForMusteri(m.id, m.sirket_adi, new Date())
      allItems.push(...items)
    }

    allItems.sort((a, b) => a.daysLeft - b.daysLeft)
    const kritikItems = getKritikBeyanlar(allItems)

    let uyariGonderildi = false
    if (sendAlert && kritikItems.length) {
      const sonuclar = await Promise.all(kritikItems.map((item) => telegramGonder(formatTelegramAlert(item))))
      uyariGonderildi = sonuclar.every(Boolean)
    }

    return NextResponse.json({
      success: true,
      data: {
        items: allItems,
        kritikCount: kritikItems.length,
        müşteriler: müşteriler.length,
        uyariGonderildi,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}