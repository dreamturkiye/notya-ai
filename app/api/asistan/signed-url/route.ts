
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const AGENT_IDS: Record<string, string> = {"pediatri": "agent_3201ktc87ck8ejgb9ac70wz7v70w", "kardiyoloji": "agent_6501ktc87nmyeca88wskfvr8dfxh", "genel": "agent_3601ktc884ntf3dbdkjtyx6vdfwa"}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.split(" ")[1])
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const specialty = req.nextUrl.searchParams.get("specialty") || "genel"
    const agentId = AGENT_IDS[specialty] || AGENT_IDS.genel

    // Get signed URL from ElevenLabs
    const resp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      { headers: { "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_KEY! } }
    )
    if (!resp.ok) {
      const err = await resp.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }
    const { signed_url } = await resp.json()
    return NextResponse.json({ signed_url, agent_id: agentId })
  } catch (e) {
    console.error("[signed-url]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
