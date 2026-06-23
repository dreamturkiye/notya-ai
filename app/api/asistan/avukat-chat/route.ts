import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { AVUKAT_PERSONAS, getPersonaForBranch, buildAvukatSystemPrompt } from "@/lib/avukat/avukatPersonaEngine"
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

    const { message, avukatSessionId, muvekkilId, branch = "ceza", personaId: requestedPersona } = await req.json()

    const { data: avukatRow } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
    const avukatUser = toAddressableUser(avukatRow)
    const { data: prefs } = await supabase.from("avukat_preferences").select("*").eq("avukat_id", user.id).maybeSingle()

    let avukatSession: Record<string, unknown> | null = null
    if (avukatSessionId) {
      const { data } = await supabase.from("avukat_sessions").select("*").eq("id", avukatSessionId).eq("avukat_id", user.id).single()
      avukatSession = data
    }
    if (!avukatSession) {
      const pid = requestedPersona || getPersonaForBranch(branch)
      const { data } = await supabase.from("avukat_sessions").insert({ avukat_id: user.id, muvekkel_id: muvekkilId || null, persona_id: pid, messages: [], active_context: { branch } }).select().single()
      avukatSession = data
    }

    let muvekkel: Record<string, unknown> | null = null
    if (muvekkilId) {
      const { data } = await supabase.from("musevvekiller").select("*").eq("id", muvekkilId).maybeSingle()
      muvekkel = data
    }

    const personaId = (avukatSession!.persona_id as string) || getPersonaForBranch(branch)
    const persona = AVUKAT_PERSONAS[personaId]
    const systemPrompt = buildAvukatSystemPrompt(persona, prefs, muvekkel, avukatUser)
    const messages = (avukatSession!.messages as Array<{ role: string; content: string }>) || []
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
      const actionType = (parsed.action as Record<string, unknown>).type
      const payload = ((parsed.action as Record<string, unknown>).payload || {}) as Record<string, unknown>
      switch (actionType) {
        case "CREATE_MUVEKKEL":
          await supabase.from("musevvekiller").insert({ avukat_id: user.id, ...payload })
          break
        case "ADD_DELIL":
          await supabase.from("deliller").insert({ muvekkel_id: muvekkilId, ...payload })
          break
        case "ADD_SURE":
          await supabase.from("sure_takibi").insert({ avukat_id: user.id, muvekkel_id: muvekkilId, ...payload })
          break
      }
    }

    await supabase.from("avukat_sessions").update({
      messages: [...messages, { role: "user", content: message }, { role: "assistant", content: parsed.speech }]
    }).eq("id", avukatSession!.id)

    return NextResponse.json({ success: true, data: { speech: parsed.speech, proactiveWarning: parsed.proactiveWarning, action: parsed.action, avukatSessionId: avukatSession!.id } })
  } catch (error) {
    console.error("[avukat-chat]", error)
    return NextResponse.json({ success: false, error: "Asistan yanit veremedi" }, { status: 500 })
  }
}
