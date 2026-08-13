export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { voiceIdForAvukatPersona } from '@/lib/asistan/elevenVoices'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** TR-voice agents (defaults). Env vars override when set. */
const PERSONA_AGENTS: Record<string, string> = {
  kemalbey:    process.env.AVUKAT_AGENT_KEMALBEY    || 'agent_2301kwjc9vktfvy9kz0dz4j85tt0',
  selinhanim:  process.env.AVUKAT_AGENT_SELINHANIM  || 'agent_8901kwjde92kf0gtcpfqena3x0qd',
  muratbey:    process.env.AVUKAT_AGENT_MURATBEY    || 'agent_5501kwjc9y4zffa8pd0ac1s24e1j',
  dilekhanim:  process.env.AVUKAT_AGENT_DILEKHANIM  || 'agent_7901kwjdecyxffb9rjbmz5b9rp7h',
  halukbey:    process.env.AVUKAT_AGENT_HALUKBEY    || 'agent_3201kwjea551fpebwe99apj0d9ac',
  aysehanim:   process.env.AVUKAT_AGENT_AYSEHANIM   || 'agent_9801kwjdeagee2kte1m3ma2wv5hq',
  canbey:      process.env.AVUKAT_AGENT_CANBEY      || 'agent_0501kwjca1qaeymv4c34444feshb',
  zeynephanim: process.env.AVUKAT_AGENT_ZEYNEPHANIM || 'agent_4901kwjdebrsf7xaqgwq4eegx54j',
  borabey:     process.env.AVUKAT_AGENT_BORABEY     || 'agent_5701kwjca3z2engvx274gyx8qsfc',
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
      try {
        const p = JSON.parse(Buffer.from(body.token.split('.')[1], 'base64').toString('utf-8'))
        const m = JSON.parse(p.metadata || '{}')
        wssUrl = m.signed_url || `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}&token=${body.token}`
      } catch { wssUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}&token=${body.token}` }
    } else {
      return NextResponse.json({ error: 'Unexpected ElevenLabs response' }, { status: 502 })
    }

    await sb.from('avukat_sessions').insert({
      avukat_id: user.id,
      persona_id: persona,
      messages: [],
      active_context: { persona, startedAt: new Date().toISOString() }
    }).select().single()

    return NextResponse.json({
      signed_url: wssUrl,
      agent_id: agentId,
      voice_id: voiceIdForAvukatPersona(persona),
      persona,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
