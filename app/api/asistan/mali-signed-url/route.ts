export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const AGENT_ID = process.env.MALI_MUSAVIR_AGENT_ID || "agent_3601ktc884ntf3dbdkjtyx6vdfwa"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const sb = getSupabase()
    const { data: { user }, error: ae } = await sb.auth.getUser(authHeader.split(" ")[1])
    if (ae || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const elKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_KEY
    if (!elKey) return NextResponse.json({ error: "ElevenLabs key missing" }, { status: 500 })

    // Fetch musteri context if provided
    const musteriId = req.nextUrl.searchParams.get("musteriId")
    let musteriContext = null
    if (musteriId) {
      const { data: m } = await sb.from("mali_musteriler").select("*").eq("id", musteriId).eq("musavir_id", user.id).single()
      if (m) {
        musteriContext = {
          sirketAdi: m.sirket_adi,
          vergiNo: m.vergi_no,
          yetkiliKisi: m.yetkili_kisi,
          faaliyetAlani: m.faaliyet_alani,
          sirketTuru: m.sirket_turu,
          notlar: m.notlar
        }
      }
    }

    const resp = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`, { headers: { "xi-api-key": elKey } })
    if (!resp.ok) { const err = await resp.text(); return NextResponse.json({ error: `ElevenLabs ${resp.status}: ${err}` }, { status: 502 }) }
    const body = await resp.json()
    let wssUrl: string
    if (body.signed_url) wssUrl = body.signed_url
    else if (body.token) wssUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}&conversation_signature=${body.token}`
    else return NextResponse.json({ error: "Unexpected ElevenLabs response" }, { status: 502 })

    return NextResponse.json({ signed_url: wssUrl, agent_id: AGENT_ID, musteriContext })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
