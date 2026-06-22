
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const AGENT_ID = process.env.MALI_MUSAVIR_AGENT_ID || process.env.MEDICAL_AGENT_ID || "agent_3601ktc884ntf3dbdkjtyx6vdfwa"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.split(" ")[1])
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const elKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_KEY
    if (!elKey) return NextResponse.json({ error: "ElevenLabs key missing" }, { status: 500 })

    // Get signed token from ElevenLabs
    const resp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`,
      { headers: { "xi-api-key": elKey } }
    )

    if (!resp.ok) {
      const err = await resp.text()
      console.error("[signed-url] ElevenLabs error:", resp.status, err)
      return NextResponse.json({ error: `ElevenLabs ${resp.status}: ${err}` }, { status: 502 })
    }

    const body = await resp.json()
    // ElevenLabs returns either { signed_url } or { token }
    // Build the correct WSS URL
    let wssUrl: string
    if (body.signed_url) {
      wssUrl = body.signed_url
    } else if (body.token) {
      wssUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}&conversation_signature=${body.token}`
    } else {
      console.error("[signed-url] Unexpected ElevenLabs response:", body)
      return NextResponse.json({ error: "Unexpected ElevenLabs response" }, { status: 502 })
    }

    return NextResponse.json({ signed_url: wssUrl, agent_id: AGENT_ID })

  } catch (e: unknown) {
    console.error("[signed-url] Exception:", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
