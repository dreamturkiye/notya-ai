import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { MALI_PERSONAS, getMaliPersona, buildMaliSystemPrompt } from "@/lib/mali/maliPersonaEngine"
import { toAddressableUser } from "@/lib/userProfile"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Yetkisiz" }, { status: 401 })
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.split(" ")[1])
    if (!user) return NextResponse.json({ success: false, error: "Gecersiz token" }, { status: 401 })

    const { message, maliSessionId, musteriId, personaId: requestedPersona } = await req.json()

    const { data: musavirRow } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
    const musavirUser = toAddressableUser(musavirRow)
    const { data: prefs } = await supabase.from("mali_preferences").select("*").eq("musavir_id", user.id).maybeSingle()

    let maliSession: Record<string, unknown> | null = null
    if (maliSessionId) {
      const { data } = await supabase.from("mali_sessions").select("*").eq("id", maliSessionId).eq("musavir_id", user.id).single()
      maliSession = data
    }
    if (!maliSession) {
      const pid = requestedPersona || getMaliPersona()
      const { data } = await supabase.from("mali_sessions").insert({ musavir_id: user.id, musteri_id: musteriId || null, persona_id: pid, messages: [], active_context: {} }).select().single()
      maliSession = data
    }

    let musteri: Record<string, unknown> | null = null
    if (musteriId) {
      const { data } = await supabase.from("mali_musteriler").select("*").eq("id", musteriId).maybeSingle()
      musteri = data
    }

    const persona = MALI_PERSONAS[(maliSession!.persona_id as string) || getMaliPersona()]
    const systemPrompt = buildMaliSystemPrompt(persona, prefs, musteri, musavirUser)
    const messages = (maliSession!.messages as Array<{ role: string; content: string }>) || []
    const last20 = [...messages, { role: "user", content: message }].slice(-20)

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: last20 as Array<{ role: "user" | "assistant"; content: string }>
    })

    const rawText = response.content[0].type === "text" ? response.content[0].text : ""
    let parsed: { speech: string; action: Record<string, unknown> | null; proactiveWarning: string | null }
    try { parsed = JSON.parse(rawText) } catch { parsed = { speech: rawText, action: null, proactiveWarning: null } }

    if (parsed.action) {
      await supabase.from("mali_actions").insert({
        mali_session_id: maliSession!.id,
        action_type: (parsed.action as Record<string, unknown>).type,
        input_text: message,
        ai_response: parsed.speech,
        action_data: parsed.action
      })
    }

    await supabase.from("mali_sessions").update({
      messages: [...messages, { role: "user", content: message }, { role: "assistant", content: parsed.speech }]
    }).eq("id", maliSession!.id)

    return NextResponse.json({ success: true, data: { speech: parsed.speech, proactiveWarning: parsed.proactiveWarning, action: parsed.action, maliSessionId: maliSession!.id } })
  } catch (error) {
    console.error("[mali-chat]", error)
    return NextResponse.json({ success: false, error: "Asistan yanit veremedi" }, { status: 500 })
  }
}
