import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analizMasakRisk, kontrolEtAylikIslemler, MasakIslem } from '@/lib/mali/masakEngine'
import { telegramGonder } from '@/lib/uyari/telegram'

function getSupabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }) }

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 })
    }
    const body = await req.json()
    const { islem, islemler, sendAlert } = body

    let results: any[] = []
    if (islem) {
      results = [analizMasakRisk(islem as MasakIslem)]
    } else if (islemler) {
      results = kontrolEtAylikIslemler(islemler as MasakIslem[])
    } else {
      return NextResponse.json({ success: false, error: 'İşlem veya işlemler zorunludur.' }, { status: 400 })
    }

    const anyBildirim = results.some(r => r.bildirimGerekiyor)

    let alertGonderildi = false
    if (sendAlert && anyBildirim) {
      const mesajlar = results.filter((r) => r.bildirimGerekiyor && r.telegramMesaji).map((r) => String(r.telegramMesaji))
      const sonuclar = mesajlar.length ? await Promise.all(mesajlar.map((m) => telegramGonder(m))) : []
      alertGonderildi = sonuclar.length > 0 && sonuclar.every(Boolean)
    }

    await getSupabase().from('mali_actions').insert({
      mali_session_id: null,
      action_type: 'MASAK_ANALIZ',
      input_text: JSON.stringify(body),
      ai_response: JSON.stringify(results),
      action_data: results,
    })

    return NextResponse.json({ success: true, data: results, alertGönderildi: alertGonderildi })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Sunucu hatası.' }, { status: 500 })
  }
}
