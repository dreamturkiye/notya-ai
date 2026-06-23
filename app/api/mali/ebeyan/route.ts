import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gibTokenDogrula, kdvBeyanGonder, beyanSorgula, kdvHesapla, EBeyanConfig, KdvBeyan } from '@/lib/mali/eBeyanEngine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, gibApiKey, vergiNo, donem, beyan, referansNo, hesaplanan, indirilecek } = body

    let result: any

    if (action === 'dogrula') {
      if (!gibApiKey) return NextResponse.json({ success: false, error: 'gibApiKey required' }, { status: 400 })
      result = await gibTokenDogrula(gibApiKey)
    } else if (action === 'gonder') {
      if (!gibApiKey || !vergiNo || !donem || !beyan) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
      }
      const config: EBeyanConfig = { gibApiKey, vergiNo, donem }
      result = await kdvBeyanGonder(config, beyan as KdvBeyan)
      if (result.basarili) {
        await supabase.from('mali_actions').insert({
          user_id: user.id,
          action_type: 'EBEYAN_GONDER',
          input_text: JSON.stringify({ vergiNo, donem }),
          ai_response: JSON.stringify(result),
          action_data: result
        })
      }
    } else if (action === 'sorgula') {
      if (!gibApiKey || !referansNo) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
      }
      const config: EBeyanConfig = { gibApiKey, vergiNo: vergiNo || '', donem: donem || '' }
      result = await beyanSorgula(config, referansNo)
    } else if (action === 'hesapla') {
      if (hesaplanan === undefined || indirilecek === undefined) {
        return NextResponse.json({ success: false, error: 'hesaplanan and indirilecek required' }, { status: 400 })
      }
      result = kdvHesapla(hesaplanan, indirilecek)
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}