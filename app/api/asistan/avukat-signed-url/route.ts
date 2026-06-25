export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PERSONA_AGENTS: Record<string, string> = {
  kemalbey:    process.env.AVUKAT_AGENT_KEMALBEY    || process.env.AVUKAT_AGENT_ID || '',
  selinhanim:  process.env.AVUKAT_AGENT_SELINHANIM  || process.env.AVUKAT_AGENT_ID || '',
  muratbey:    process.env.AVUKAT_AGENT_MURATBEY    || process.env.AVUKAT_AGENT_ID || '',
  dilekhanim:  process.env.AVUKAT_AGENT_DILEKHANIM  || process.env.AVUKAT_AGENT_ID || '',
  halukbey:    process.env.AVUKAT_AGENT_HALUKBEY    || process.env.AVUKAT_AGENT_ID || '',
  aysehanim:   process.env.AVUKAT_AGENT_AYSEHANIM   || process.env.AVUKAT_AGENT_ID || '',
  canbey:      process.env.AVUKAT_AGENT_CANBEY      || process.env.AVUKAT_AGENT_ID || '',
  zeynephanim: process.env.AVUKAT_AGENT_ZEYNEPHANIM || process.env.AVUKAT_AGENT_ID || '',
  borabey:     process.env.AVUKAT_AGENT_BORABEY     || process.env.AVUKAT_AGENT_ID || '',
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(auth.split(' ')[1])
    if (ae || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const persona = req.nextUrl.searchParams.get('persona') || 'kemalbey'
    const agentId = PERSONA_AGENTS[persona] || PERSONA_AGENTS.kemalbey
    if (!agentId) return NextResponse.json({ error: 'AVUKAT_AGENT_ID env var not set' }, { status: 500 })

    const elKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_KEY
    if (!elKey) return NextResponse.json({ error: 'ElevenLabs key missing' }, { status: 500 })

    const resp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      { headers: { 'xi-api-key': elKey } }
    )
    if (!resp.ok) {
      const err = await resp.text()
      return NextResponse.json({ error: `ElevenLabs ${resp.status}: ${err}` }, { status: 502 })
    }
    const body = await resp.json()
    let wssUrl: string
    if (body.signed_url) {
      wssUrl = body.signed_url
    } else if (body.token) {
            // Decode JWT to extract real signed_url from ElevenLabs token metadata
      try {
        const p = JSON.parse(Buffer.from(body.token.split('.')[1], 'base64').toString('utf-8'))
        const m = JSON.parse(p.metadata || '{}')
        wssUrl = m.signed_url || `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}&token=${body.token}`
      } catch { wssUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}&token=${body.token}` }
    } else {
      return NextResponse.json({ error: 'Unexpected ElevenLabs response' }, { status: 502 })
    }

    // Log session start
    await sb.from('avukat_sessions').insert({
      avukat_id: user.id,
      persona_id: persona,
      messages: [],
      active_context: { persona, startedAt: new Date().toISOString() }
    }).select().single()

    return NextResponse.json({ signed_url: wssUrl, agent_id: agentId, persona })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
// v2
