import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { verifyPortalToken, generatePortalToken, registerPortalToken, buildMuvekkilSystemPrompt } from '@/lib/avukat/avukatPortalEngine'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const SECRET = process.env.PORTAL_TOKEN_SECRET
if (!SECRET) console.error('PORTAL_TOKEN_SECRET env var not set — avukat portal tokens are NOT being issued')

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
    if (!SECRET) return NextResponse.json({ error: 'Portal not configured' }, { status: 500 })
    const sb = getSupabase()
    const payload = await verifyPortalToken(token, SECRET, sb)
    if (!payload) return NextResponse.json({ error: 'Gecersiz veya suresi dolmus token' }, { status: 401 })
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
    const { token, message, history, admin, action, muvekkilId, avukatId, tokenId } = await req.json()

    if (admin) {
      const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
      if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const sb = getSupabase()
      const { data: { user }, error: ae } = await sb.auth.getUser(authHeader)
      if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      if (action === 'list') {
        const [{ data: tokens, error: te }, { data: muvekkiller, error: me }] = await Promise.all([
          sb.from('avukat_portal_tokens').select('*').eq('avukat_id', user.id).is('revoked_at', null).order('created_at', { ascending: false }),
          sb.from('musevvekiller').select('*').eq('avukat_id', user.id).order('ad')
        ])
        if (te || me) return NextResponse.json({ error: (te || me)?.message }, { status: 500 })
        return NextResponse.json({ success: true, data: { tokens: tokens || [], muvekkiller: muvekkiller || [] } })
      }

      if (action === 'revoke') {
        if (!tokenId) return NextResponse.json({ error: 'tokenId required' }, { status: 400 })
        const { data: row } = await sb.from('avukat_portal_tokens').select('avukat_id').eq('id', tokenId).single()
        if (!row || row.avukat_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { error } = await sb.from('avukat_portal_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', tokenId)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
      }

      // default: generate — always bind to authenticated lawyer; verify müvekkil ownership
      if (!SECRET) return NextResponse.json({ error: 'Portal not configured' }, { status: 500 })
      if (!muvekkilId) return NextResponse.json({ error: 'muvekkilId required' }, { status: 400 })
      const { data: muvOwn } = await sb
        .from('musevvekiller')
        .select('id')
        .eq('id', muvekkilId)
        .eq('avukat_id', user.id)
        .maybeSingle()
      if (!muvOwn) return NextResponse.json({ error: 'Muvekkil bulunamadi' }, { status: 404 })
      const ownerId = user.id
      void avukatId
      const portalToken = generatePortalToken(ownerId, muvekkilId, SECRET)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const registered = await registerPortalToken(sb, ownerId, muvekkilId, portalToken, expiresAt)
      if (!registered) return NextResponse.json({ error: 'Token kaydedilemedi' }, { status: 500 })
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app'}/portal/avukat/${portalToken}`
      return NextResponse.json({ success: true, data: { portalUrl, token: portalToken } })
    }

    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
    if (!SECRET) return NextResponse.json({ error: 'Portal not configured' }, { status: 500 })
    const sb = getSupabase()
    const payload = await verifyPortalToken(token, SECRET, sb)
    if (!payload) return NextResponse.json({ error: 'Gecersiz token' }, { status: 401 })
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
    const resp = await ai.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 800, system, messages: msgs })
    const reply = resp.content[0].type === 'text' ? resp.content[0].text : 'Yanit alinamadi.'
    return NextResponse.json({ success: true, data: { speech: reply } })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Hata' }, { status: 500 })
  }
}
