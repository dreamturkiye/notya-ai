import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { MALI_PERSONAS, getMaliPersona, buildMaliSystemPrompt, type MaliPersonaId } from "@/lib/mali/maliPersonaEngine"
import { quickClassifyMali } from "@/lib/mali/maliIntentParser"
import { toAddressableUser } from "@/lib/userProfile"

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    
    const token = authHeader.split(" ")[1]
    const { data: { user } } = await getSupabase().auth.getUser(token)
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const { message, maliSessionId, musteriId, sessionId, personaId } = await req.json()

    const { data: userRow } = await getSupabase().from("users").select("*").eq("id", user.id).maybeSingle()
    if (!userRow) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

    const { data: prefs } = await getSupabase().from("mali_preferences").select("*").eq("musavir_id", user.id).maybeSingle()

    let session
    if (maliSessionId) {
      const { data: sessionData } = await getSupabase().from("mali_sessions").select("*").eq("id", maliSessionId).eq("musavir_id", user.id).single()
      session = sessionData
    } else {
      const { data: newSession } = await getSupabase().from("mali_sessions").insert({
        musavir_id: user.id,
        musteri_id: musteriId || null,
        persona_id: personaId || null,
        messages: [],
        active_context: {}
      }).select().single()
      session = newSession
    }

    let musteri = null
    if (musteriId) {
      const { data: musteriData } = await getSupabase().from("mali_musteriler").select("*").eq("id", musteriId).maybeSingle()
      musteri = musteriData
    }

    const persona = MALI_PERSONAS[getMaliPersona()]
    const systemPrompt = buildMaliSystemPrompt(persona, prefs, musteri || null, toAddressableUser(userRow))

    const aiResponse = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: (session.messages as { role: string, content: string }[]).slice(-20).concat([{ role: "user", content: message }])
    })

    const rawText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "{}"
    const { speech, action, proactiveWarning } = JSON.parse(rawText)

    if (action) {
      await getSupabase().from("mali_actions").insert({
        mali_session_id: session.id,
        action_type: action.type,
        input_text: message,
        ai_response: speech,
        action_data: action
      })
    }

    await getSupabase().from("mali_sessions").update({ messages: [...session.messages, { role: "user", content: message }, { role: "assistant", content: speech }] }).eq("id", session.id)

    return NextResponse.json({ success: true, data: { speech, proactiveWarning, action, maliSessionId: session.id } })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}