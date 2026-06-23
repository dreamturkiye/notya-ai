import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildEDevletRehber, buildDeryaVoiceResponse, EDevletSorgu } from '@/lib/mali/eDevletEngine'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { sorguTipi, vergiNo, tcNo, musteriAdi, useAI } = body as EDevletSorgu & { useAI?: boolean }

    if (!sorguTipi) {
      return NextResponse.json({ success: false, error: 'sorguTipi required' }, { status: 400 })
    }

    const sorgu: EDevletSorgu = { sorguTipi, vergiNo, tcNo, musteriAdi }
    const sonuc = buildEDevletRehber(sorgu)

    if (useAI) {
      const aiResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: 'Sen Derya Yilmaz, Turk mali musavirisin. Kisa, net, pratik Turkce cevaplar ver.',
        messages: [{
          role: 'user',
          content: `Musteri icin ${sorguTipi} sorgusu yapilacak. Sonuclari ve adim adim ne yapmasi gerektigini anlat. Vergi no: ${vergiNo || 'belirtilmedi'}`
        }]
      })
      const aiText = aiResponse.content[0]?.type === 'text' ? aiResponse.content[0].text : ''
      if (aiText) sonuc.yapilmasiGerekenler.push(aiText)
    }

    await supabase.from('mali_actions').insert({
      user_id: user.id,
      action_type: 'EDEVLET_SORGU',
      input_text: JSON.stringify(sorgu),
      action_data: sonuc
    })

    return NextResponse.json({
      success: true,
      data: sonuc,
      deryaYaniti: buildDeryaVoiceResponse(sorgu, sonuc)
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}