
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const AGENT_ID = "agent_3601ktc884ntf3dbdkjtyx6vdfwa"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.split(" ")[1])
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Use server-side key — never the NEXT_PUBLIC_ var in API routes
    const elKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_KEY
    if (!elKey) {
      return NextResponse.json({ error: "ElevenLabs key not configured" }, { status: 500 })
    }

    const specialty = req.nextUrl.searchParams.get("specialty") || "dahiliye"

    const resp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`,
      { headers: { "xi-api-key": elKey } }
    )

    if (!resp.ok) {
      const err = await resp.text()
      console.error("[signed-url] ElevenLabs error:", resp.status, err)
      return NextResponse.json({ error: `ElevenLabs: ${resp.status} ${err}` }, { status: 500 })
    }

    const { token } = await resp.json()
    const signedUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}&conversation_signature=${token}`

    return NextResponse.json({ signed_url: signedUrl, specialty })

  } catch (e) {
    console.error("[signed-url]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
