import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBeyanlarımForMüşteri, getKritikBeyanlar, formatTelegramAlert } from '@/lib/mali/beyanTakvimiEngine'

function getSupabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) }
const TELEGRAM_BOT = '8920614347'
const TELEGRAM_CHAT = '5545242725'

async function sendTelegram(text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text }),
  })
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const müşteriId = searchParams.get('müşteriId')
    const sendAlert = searchParams.get('sendAlert') === 'true'

    let müşteriler: any[] = []

    if (müşteriId) {
      const { data } = await getSupabase().from('mali_müşteriler').select('*').eq('id', müşteriId).single()
      if (data) müşteriler = [data]
    } else {
      const { data } = await getSupabase().from('mali_müşteriler').select('*').eq('müşavir_id', user.id)
      müşteriler = data || []
    }

    const allItems: any[] = []
    for (const m of müşteriler) {
      const items = getBeyanlarımForMüşteri(m.id, m.şirket_adi, new Date(new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })))
      allItems.push(...items)
    }

    allItems.sort((a, b) => a.daysLeft - b.daysLeft)
    const kritikItems = getKritikBeyanlar(allItems)

    if (sendAlert) {
      for (const item of kritikItems) {
        await sendTelegram(formatTelegramAlert(item))
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        items: allItems,
        kritikCount: kritikItems.length,
        müşteriler: müşteriler.length,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}