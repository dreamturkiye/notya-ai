import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildMusteriSystemPrompt, decodeMusteriToken } from '@/lib/mali/musteriPortalEngine'
import { getBeyanlarimForMusteri } from '@/lib/mali/beyanTakvimiEngine'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { token, message, history = [] } = await req.json()
    const decoded = decodeMusteriToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: musteri } = await supabase.from('mali_musteriler').select('*').eq('id', decoded.musteriId).single()
    if (!musteri) return NextResponse.json({ error: 'Musteri not found' }, { status: 404 })

    const { data: musavir } = await supabase.from('users').select('name').eq('id', decoded.musavirId).single()

    const aktifBeyanlar = await getBeyanlarimForMusteri(decoded.musteriId, musteri.sirket_adi, new Date())
    const { data: sessions } = await supabase.from('mali_sessions').select('id').eq('musteri_id', decoded.musteriId)
    const sessionIds = sessions?.map(s => s.id) || []
    const { data: sonOdemeler } = await supabase
      .from('mali_actions')
      .select('action_type, metadata, created_at')
      .in('mali_session_id', sessionIds)
      .eq('action_type', 'BEYAN_ODEME')
      .order('created_at', { ascending: false })
      .limit(5)

    const session = {
      musteriId: decoded.musteriId,
      musteriAdi: musteri.sirket_adi,
      musavirAdi: musavir?.name || 'Mali Müşavir',
      vergiNo: musteri.vergi_no,
      faaliyetAlani: musteri.faaliyet_alani,
      aktifBeyanlar: aktifBeyanlar.slice(0, 5),
      sonOdemeler: (sonOdemeler || []).map(o => ({
        tur: o.action_type,
        tutar: o.metadata?.tutar || 0,
        tarih: o.created_at
      }))
    }

    const systemPrompt = buildMusteriSystemPrompt(session)

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [...history.slice(-6), { role: 'user', content: message }]
    })

    return NextResponse.json({
      success: true,
      reply: response.content[0].text,
      musteriAdi: musteri.sirket_adi
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const decoded = decodeMusteriToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: musteri } = await supabase.from('mali_musteriler').select('*').eq('id', decoded.musteriId).single()
    if (!musteri) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: musavir } = await supabase.from('users').select('name').eq('id', decoded.musavirId).single()
    const aktifBeyanlar = await getBeyanlarimForMusteri(decoded.musteriId, musteri.sirket_adi, new Date())

    return NextResponse.json({
      success: true,
      data: {
        musteriAdi: musteri.sirket_adi,
        aktifBeyanlar: aktifBeyanlar.slice(0, 5),
        musavirAdi: musavir?.name || 'Mali Müşavir'
      }
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// FILE 3