import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { verifyPortalToken, generatePortalToken, buildMuvekkilSystemPrompt } from '@/lib/avukat/avukatPortalEngine'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const SECRET = process.env.PORTAL_SECRET || 'notya-portal-secret-2025'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
    const payload = verifyPortalToken(token, SECRET)
    if (!payload) return NextResponse.json({ error: 'Gecersiz veya suresi dolmus token' }, { status: 401 })
    const sb = getSupabase()
    const [{ data: muv }, { data: avukat }, { data: sureler }] = await Promise.all([
      sb.from('musevvekiller').select('*').eq('id', payload.muvekkilId).single(),
      sb.from('users').select('full_name').eq('id', payload.avukatId).single(),
      sb.from('sure_takibi').select('*').eq('avukat_id', payload.avukatId).eq('tamamlandi', false).order('son_gun', { ascending: true }).limit(5)
    ])
    return NextResponse.json({ success: true, data: {
      muvekkilAdi: muv ? `${muv.ad} ${muv.soyad}` : 'Muvekkil',
      avukatAdi: avukat?.full_name || 'Avukat',
      sureler: sureler || [],
      davaTuru: muv?.dava_turu || 'Genel'
    }})
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, message, history, admin, muvekkilId, avukatId } = await req.json()

    if (admin) {
      const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
      if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const sb = getSupabase()
      const { data: { user }, error: ae } = await sb.auth.getUser(authHeader)
      if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const portalToken = generatePortalToken(avukatId || user.id, muvekkilId, SECRET)
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app'}/portal/avukat/${portalToken}`
      return NextResponse.json({ success: true, data: { portalUrl, token: portalToken } })
    }

    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
    const payload = verifyPortalToken(token, SECRET)
    if (!payload) return NextResponse.json({ error: 'Gecersiz token' }, { status: 401 })
    const sb = getSupabase()
    const [{ data: muv }, { data: avukat }, { data: sureler }] = await Promise.all([
      sb.from('musevvekiller').select('*').eq('id', payload.muvekkilId).single(),
      sb.from('users').select('full_name').eq('id', payload.avukatId).single(),
      sb.from('sure_takibi').select('*').eq('avukat_id', payload.avukatId).eq('tamamlandi', false).limit(5)
    ])
    const system = buildMuvekkilSystemPrompt(
      { name: avukat?.full_name || 'Avukat' },
      muv || {},
      sureler || []
    )
    const ai = getAnthropic()
    const msgs = [...(history || []), { role: 'user' as const, content: message }]
    const resp = await ai.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 800, system, messages: msgs })
    const reply = resp.content[0].type === 'text' ? resp.content[0].text : 'Yanit alinamadi.'
    return NextResponse.json({ success: true, data: { speech: reply } })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}
