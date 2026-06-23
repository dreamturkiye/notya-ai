import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analizMasakRisk, kontrolEtAylikIslemler, MasakIslem } from '@/lib/mali/masakEngine'

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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const { islem, islemler, sendAlert } = body

    let results: any[] = []
    if (islem) {
      results = [analizMasakRisk(islem as MasakIslem)]
    } else if (islemler) {
      results = kontrolEtAylikIslemler(islemler as MasakIslem[])
    } else {
      return NextResponse.json({ success: false, error: 'islem veya islemler gerekli' }, { status: 400 })
    }

    const anyBildirim = results.some(r => r.bildirimGerekiyor)

    if (sendAlert && anyBildirim) {
      for (const r of results) {
        if (r.bildirimGerekiyor && r.telegramMesaji) {
          await sendTelegram(r.telegramMesaji)
        }
      }
    }

    await getSupabase().from('mali_actions').insert({
      mali_session_id: null,
      action_type: 'MASAK_ANALIZ',
      input_text: JSON.stringify(body),
      ai_response: JSON.stringify(results),
      action_data: results,
    })

    return NextResponse.json({ success: true, data: results, alertGonderildi: sendAlert && anyBildirim })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Sunucu hatasi' }, { status: 500 })
  }
}
